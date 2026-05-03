import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminContext, AdminUnauthorizedError } from "@/lib/admin-auth";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  status: z
    .enum(["PENDING", "CONFIRMED", "CANCELLED", "NO_SHOW", "COMPLETED"])
    .optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  q: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

export interface AdminAppointmentDto {
  id: string;
  patientName: string;
  patientPhone: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "NO_SHOW" | "COMPLETED";
  priceAtBooking: string;
  doctor: { id: string; name: string };
  service: { id: string; name: string };
  notes: string | null;
}

export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<AdminAppointmentDto[]>>> {
  try {
    const ctx = await requireAdminContext();
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Yanlış sorğu parametrləri" }, { status: 400 });
    }
    const filters = parsed.data;

    const where: Prisma.AppointmentWhereInput = { clinicId: ctx.clinicId };
    if (filters.status) where.status = filters.status;

    if (filters.from || filters.to) {
      const range: Prisma.DateTimeFilter = {};
      if (filters.from) range.gte = new Date(`${filters.from}T00:00:00.000Z`);
      if (filters.to) {
        const toDate = new Date(`${filters.to}T00:00:00.000Z`);
        toDate.setUTCDate(toDate.getUTCDate() + 1);
        range.lt = toDate;
      }
      where.startTime = range;
    }

    if (filters.q) {
      where.OR = [
        { patientName: { contains: filters.q, mode: "insensitive" } },
        { patientPhone: { contains: filters.q } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { startTime: "desc" },
      take: filters.limit ?? 200,
      include: {
        doctor: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    });

    const data: AdminAppointmentDto[] = appointments.map((a) => ({
      id: a.id,
      patientName: a.patientName,
      patientPhone: a.patientPhone,
      startTime: a.startTime.toISOString(),
      endTime: a.endTime.toISOString(),
      status: a.status,
      priceAtBooking: a.priceAtBooking.toString(),
      doctor: a.doctor,
      service: a.service,
      notes: a.notes,
    }));

    return NextResponse.json({ data });
  } catch (err: unknown) {
    if (err instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Naməlum xəta";
    console.error("[GET /api/admin/appointments]", message);
    return NextResponse.json({ error: "Görüşlər yüklənmədi" }, { status: 500 });
  }
}
