import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminContext, AdminUnauthorizedError } from "@/lib/admin-auth";
import { sendAndLog } from "@/lib/greenapi";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

interface RetryResultDto {
  id: string;
  status: string;
  sentAt: string | null;
  errorMessage: string | null;
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse<RetryResultDto>>> {
  try {
    const ctx = await requireAdminContext();

    const log = await prisma.notificationLog.findFirst({
      where: {
        id: params.id,
        appointment: { clinicId: ctx.clinicId },
      },
      include: {
        appointment: {
          select: { id: true, patientPhone: true },
        },
      },
    });

    if (!log) {
      return NextResponse.json({ error: "Bildiriş tapılmadı" }, { status: 404 });
    }

    const { log: updated } = await sendAndLog({
      appointmentId: log.appointment.id,
      type: log.type,
      phone: log.appointment.patientPhone,
      message: log.messageText,
      existingLogId: log.id,
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        status: updated.status,
        sentAt: updated.sentAt ? updated.sentAt.toISOString() : null,
        errorMessage: updated.errorMessage,
      },
    });
  } catch (err: unknown) {
    if (err instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Naməlum xəta";
    console.error("[POST /api/admin/notifications/:id/retry]", message);
    return NextResponse.json({ error: "Yenidən göndərilmədi" }, { status: 500 });
  }
}
