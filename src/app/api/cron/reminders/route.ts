/**
 * Vercel Cron — reminder dispatcher.
 *
 * Triggered every 30 minutes by vercel.json. Picks appointments whose start time
 * falls inside the 24h or 2h reminder window and dispatches a WhatsApp message
 * for each one that has not yet received that reminder.
 *
 * Auth: requires `Authorization: Bearer <CRON_SECRET>`.
 *
 * Time windows are deliberately wider than the cron cadence so a missed run
 * (or clock drift) still picks the appointment up on the next pass.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAndLog, hasSentNotification } from "@/lib/greenapi";
import { WA_MESSAGES } from "@/lib/whatsapp-messages";
import { formatDateTimeBaku, formatTimeBaku } from "@/lib/utils";
import type { NotificationType } from "@prisma/client";

export const dynamic = "force-dynamic";

interface DispatchResult {
  appointmentId: string;
  type: NotificationType;
  status: "sent" | "failed" | "skipped";
  error?: string;
}

interface CronReportDto {
  ranAt: string;
  reminder24h: { matched: number; dispatched: number };
  reminder2h: { matched: number; dispatched: number };
  results: DispatchResult[];
}

const WINDOW_24H_MIN_MS = 23 * 60 * 60_000;
const WINDOW_24H_MAX_MS = 25 * 60 * 60_000;
const WINDOW_2H_MIN_MS = (1 * 60 + 50) * 60_000;
const WINDOW_2H_MAX_MS = (2 * 60 + 10) * 60_000;

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${expected}`;
}

async function dispatchReminders(
  type: "REMINDER_24H" | "REMINDER_2H",
  windowStart: Date,
  windowEnd: Date,
): Promise<{ matched: number; dispatched: number; results: DispatchResult[] }> {
  const appointments = await prisma.appointment.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      startTime: { gte: windowStart, lte: windowEnd },
    },
    include: {
      doctor: { select: { name: true } },
      service: { select: { name: true } },
    },
  });

  const results: DispatchResult[] = [];
  let dispatched = 0;

  for (const appt of appointments) {
    const alreadySent = await hasSentNotification(appt.id, type);
    if (alreadySent) continue;

    const message =
      type === "REMINDER_24H"
        ? WA_MESSAGES.reminder24h({
            patientName: appt.patientName,
            doctorName: appt.doctor.name,
            dateTime: formatDateTimeBaku(appt.startTime),
          })
        : WA_MESSAGES.reminder2h({
            patientName: appt.patientName,
            time: formatTimeBaku(appt.startTime),
          });

    const { send } = await sendAndLog({
      appointmentId: appt.id,
      type,
      phone: appt.patientPhone,
      message,
    });

    dispatched++;
    results.push({
      appointmentId: appt.id,
      type,
      status: send.success ? "sent" : "failed",
      ...(send.error ? { error: send.error } : {}),
    });
  }

  return { matched: appointments.length, dispatched, results };
}

export async function GET(req: NextRequest): Promise<NextResponse<CronReportDto | { error: string }>> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = Date.now();

    const window24Start = new Date(now + WINDOW_24H_MIN_MS);
    const window24End = new Date(now + WINDOW_24H_MAX_MS);
    const window2Start = new Date(now + WINDOW_2H_MIN_MS);
    const window2End = new Date(now + WINDOW_2H_MAX_MS);

    const [r24, r2] = await Promise.all([
      dispatchReminders("REMINDER_24H", window24Start, window24End),
      dispatchReminders("REMINDER_2H", window2Start, window2End),
    ]);

    const report: CronReportDto = {
      ranAt: new Date().toISOString(),
      reminder24h: { matched: r24.matched, dispatched: r24.dispatched },
      reminder2h: { matched: r2.matched, dispatched: r2.dispatched },
      results: [...r24.results, ...r2.results],
    };

    return NextResponse.json(report);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Naməlum xəta";
    console.error("[GET /api/cron/reminders]", message);
    return NextResponse.json({ error: "Cron xətası" }, { status: 500 });
  }
}
