import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminContext, AdminUnauthorizedError } from "@/lib/admin-auth";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  status: z.enum(["PENDING", "SENT", "FAILED", "DELIVERED"]).optional(),
  type: z
    .enum(["BOOKING_CONFIRMATION", "REMINDER_24H", "REMINDER_2H", "CANCELLATION"])
    .optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

export interface AdminNotificationDto {
  id: string;
  type: string;
  status: string;
  messageText: string;
  retryCount: number;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  appointment: {
    id: string;
    patientName: string;
    patientPhone: string;
    startTime: string;
  };
}

export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<AdminNotificationDto[]>>> {
  try {
    const ctx = await requireAdminContext();
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Yanlış sorğu parametrləri" }, { status: 400 });
    }
    const filters = parsed.data;

    const where: Prisma.NotificationLogWhereInput = {
      // Tenancy join: only logs whose appointment belongs to this clinic.
      appointment: { clinicId: ctx.clinicId },
    };
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;

    const logs = await prisma.notificationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters.limit ?? 200,
      include: {
        appointment: {
          select: { id: true, patientName: true, patientPhone: true, startTime: true },
        },
      },
    });

    const data: AdminNotificationDto[] = logs.map((l) => ({
      id: l.id,
      type: l.type,
      status: l.status,
      messageText: l.messageText,
      retryCount: l.retryCount,
      errorMessage: l.errorMessage,
      sentAt: l.sentAt ? l.sentAt.toISOString() : null,
      createdAt: l.createdAt.toISOString(),
      appointment: {
        id: l.appointment.id,
        patientName: l.appointment.patientName,
        patientPhone: l.appointment.patientPhone,
        startTime: l.appointment.startTime.toISOString(),
      },
    }));

    return NextResponse.json({ data });
  } catch (err: unknown) {
    if (err instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Naməlum xəta";
    console.error("[GET /api/admin/notifications]", message);
    return NextResponse.json({ error: "Bildirişlər yüklənmədi" }, { status: 500 });
  }
}
