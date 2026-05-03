import { NextResponse } from "next/server";
import { fromZonedTime } from "date-fns-tz";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminContext, AdminUnauthorizedError } from "@/lib/admin-auth";
import { CLINIC_TIMEZONE } from "@/lib/utils";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

interface AdminStatsDto {
  monthRevenue: number;
  monthRevenueDisplay: string;
  retentionPercent: number;
  totalAppointmentsThisMonth: number;
  totalAppointmentsLastMonth: number;
  noShowCountThisMonth: number;
  pendingCount: number;
  upcomingNext7Days: number;
}

function startOfMonthInClinicTz(year: number, monthIndex0: number): Date {
  // monthIndex0: 0=Jan, 11=Dec
  const month = (monthIndex0 + 1).toString().padStart(2, "0");
  const iso = `${year}-${month}-01T00:00:00`;
  return fromZonedTime(iso, CLINIC_TIMEZONE);
}

export async function GET(): Promise<NextResponse<ApiResponse<AdminStatsDto>>> {
  try {
    const ctx = await requireAdminContext();

    const now = new Date();
    // Use UTC year/month for partitioning — close enough for KPI windows; precise
    // boundaries are converted via clinic tz so the month aligns to local midnight.
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();

    const monthStart = startOfMonthInClinicTz(y, m);
    const nextMonthStart = startOfMonthInClinicTz(m === 11 ? y + 1 : y, (m + 1) % 12);
    const lastMonthStart = startOfMonthInClinicTz(m === 0 ? y - 1 : y, (m + 11) % 12);

    const next7End = new Date(now.getTime() + 7 * 24 * 60 * 60_000);

    const [
      revenueAgg,
      thisMonthCount,
      lastMonthCount,
      noShowCount,
      retentionAgg,
      pendingCount,
      upcomingCount,
    ] = await Promise.all([
      prisma.appointment.aggregate({
        where: {
          clinicId: ctx.clinicId,
          status: { in: ["COMPLETED", "CONFIRMED"] },
          startTime: { gte: monthStart, lt: nextMonthStart },
        },
        _sum: { priceAtBooking: true },
      }),
      prisma.appointment.count({
        where: {
          clinicId: ctx.clinicId,
          startTime: { gte: monthStart, lt: nextMonthStart },
        },
      }),
      prisma.appointment.count({
        where: {
          clinicId: ctx.clinicId,
          startTime: { gte: lastMonthStart, lt: monthStart },
        },
      }),
      prisma.appointment.count({
        where: {
          clinicId: ctx.clinicId,
          status: "NO_SHOW",
          startTime: { gte: monthStart, lt: nextMonthStart },
        },
      }),
      prisma.appointment.groupBy({
        by: ["status"],
        where: {
          clinicId: ctx.clinicId,
          startTime: { gte: monthStart, lt: nextMonthStart },
          status: { in: ["CONFIRMED", "COMPLETED", "NO_SHOW", "PENDING"] },
        },
        _count: { _all: true },
      }),
      prisma.appointment.count({
        where: { clinicId: ctx.clinicId, status: "PENDING" },
      }),
      prisma.appointment.count({
        where: {
          clinicId: ctx.clinicId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startTime: { gte: now, lt: next7End },
        },
      }),
    ]);

    const sumRaw = revenueAgg._sum.priceAtBooking;
    const monthRevenue = sumRaw ? Number(new Prisma.Decimal(sumRaw).toString()) : 0;

    const retentionTotals = retentionAgg.reduce(
      (acc, row) => {
        const n = row._count._all;
        if (row.status === "CONFIRMED" || row.status === "COMPLETED") acc.kept += n;
        if (
          row.status === "CONFIRMED" ||
          row.status === "COMPLETED" ||
          row.status === "NO_SHOW" ||
          row.status === "PENDING"
        ) {
          acc.total += n;
        }
        return acc;
      },
      { kept: 0, total: 0 },
    );

    const retentionPercent =
      retentionTotals.total > 0
        ? Math.round((retentionTotals.kept / retentionTotals.total) * 100)
        : 0;

    const data: AdminStatsDto = {
      monthRevenue,
      monthRevenueDisplay: `${monthRevenue.toFixed(0)} ₼`,
      retentionPercent,
      totalAppointmentsThisMonth: thisMonthCount,
      totalAppointmentsLastMonth: lastMonthCount,
      noShowCountThisMonth: noShowCount,
      pendingCount,
      upcomingNext7Days: upcomingCount,
    };

    return NextResponse.json({ data });
  } catch (err: unknown) {
    if (err instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Naməlum xəta";
    console.error("[GET /api/admin/stats]", message);
    return NextResponse.json({ error: "Statistika yüklənmədi" }, { status: 500 });
  }
}
