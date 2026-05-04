import { NextResponse } from "next/server";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { requireAdminContext, AdminUnauthorizedError } from "@/lib/admin-auth";
import { CLINIC_TIMEZONE } from "@/lib/utils";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

interface DailyPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  count: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
}

interface TimeseriesDto {
  daily: DailyPoint[];
  statusBreakdown: StatusBreakdown[];
}

function startOfMonthInClinicTz(year: number, monthIndex0: number): Date {
  const month = (monthIndex0 + 1).toString().padStart(2, "0");
  const iso = `${year}-${month}-01T00:00:00`;
  return fromZonedTime(iso, CLINIC_TIMEZONE);
}

export async function GET(): Promise<NextResponse<ApiResponse<TimeseriesDto>>> {
  try {
    const ctx = await requireAdminContext();

    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();

    const monthStart = startOfMonthInClinicTz(y, m);
    const nextMonthStart = startOfMonthInClinicTz(m === 11 ? y + 1 : y, (m + 1) % 12);

    // Get all appointments for this month
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId: ctx.clinicId,
        startTime: { gte: monthStart, lt: nextMonthStart },
      },
      select: {
        startTime: true,
        priceAtBooking: true,
        status: true,
      },
      orderBy: { startTime: "asc" },
    });

    // Build daily aggregation
    const dailyMap = new Map<string, { revenue: number; count: number }>();
    const statusMap = new Map<string, number>();

    for (const a of appointments) {
      // Daily revenue (only confirmed/completed)
      const dateKey = a.startTime.toISOString().slice(0, 10);
      const entry = dailyMap.get(dateKey) ?? { revenue: 0, count: 0 };
      entry.count += 1;
      if (a.status === "COMPLETED" || a.status === "CONFIRMED") {
        entry.revenue += Number(a.priceAtBooking);
      }
      dailyMap.set(dateKey, entry);

      // Status breakdown
      statusMap.set(a.status, (statusMap.get(a.status) ?? 0) + 1);
    }

    const daily: DailyPoint[] = Array.from(dailyMap.entries()).map(([date, v]) => ({
      date,
      revenue: Math.round(v.revenue * 100) / 100,
      count: v.count,
    }));

    const statusBreakdown: StatusBreakdown[] = Array.from(statusMap.entries()).map(
      ([status, count]) => ({ status, count }),
    );

    return NextResponse.json({ data: { daily, statusBreakdown } });
  } catch (err) {
    if (err instanceof AdminUnauthorizedError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[GET /api/admin/stats/timeseries]", err);
    return NextResponse.json({ error: "Timeseries yüklənmədi" }, { status: 500 });
  }
}
