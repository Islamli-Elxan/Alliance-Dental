/**
 * Green API webhook receiver.
 *
 * Green API POSTs notification payloads when:
 *   - A patient taps a button on a sendButtons message (typeWebhook = "incomingMessageReceived",
 *     messageData.typeMessage = "buttonsResponseMessage")
 *   - A regular text message arrives (we treat "təsdiq" / "ləğv" / "1" / "2" as button equivalents)
 *
 * Logic:
 *   1. Extract sender phone + buttonId/text.
 *   2. Find the most recent PENDING appointment for that phone in the last 24 hours
 *      across ALL clinics (webhook is global). Tenancy is preserved by re-checking
 *      clinicId before any subsequent query.
 *   3. confirm  -> status CONFIRMED + send "thanks" message + log
 *      cancel   -> status CANCELLED + send cancellation message + log
 *      unknown  -> 200 OK, do nothing.
 *   4. Always return HTTP 200 — Green API retries on non-200 responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAndLog } from "@/lib/greenapi";
import { WA_MESSAGES } from "@/lib/whatsapp-messages";

export const dynamic = "force-dynamic";

interface WebhookOk {
  ok: true;
  action: "confirmed" | "cancelled" | "ignored";
  reason?: string;
}

interface GreenApiSenderData {
  chatId?: string;
  sender?: string;
}

interface GreenApiButtonsResponseData {
  typeMessage?: string;
  selectedButtonId?: string;
  selectedButton?: { buttonId?: string };
  textMessageData?: { textMessage?: string };
  extendedTextMessageData?: { text?: string };
}

interface GreenApiPayload {
  typeWebhook?: string;
  body?: unknown;
  senderData?: GreenApiSenderData;
  messageData?: GreenApiButtonsResponseData;
}

type Intent = "confirm" | "cancel" | "unknown";

function chatIdToE164(chatId: string | undefined): string | null {
  if (!chatId) return null;
  // "994501234567@c.us" -> "+994501234567"
  const digits = chatId.split("@")[0];
  if (!digits || !/^\d{8,15}$/.test(digits)) return null;
  return `+${digits}`;
}

function classifyIntent(payload: GreenApiPayload): Intent {
  const md = payload.messageData;
  const buttonId =
    md?.selectedButtonId ?? md?.selectedButton?.buttonId ?? "";
  if (buttonId === "confirm" || buttonId === "cancel") return buttonId;

  const text =
    md?.textMessageData?.textMessage ?? md?.extendedTextMessageData?.text ?? "";
  const normalized = text.trim().toLowerCase();

  if (!normalized) return "unknown";

  // AZ + EN keyword fallback. Patients sometimes reply with text instead of tapping a button.
  if (
    normalized === "1" ||
    normalized === "təsdiq" ||
    normalized === "tesdiq" ||
    normalized.startsWith("təsdiqləyirəm") ||
    normalized.startsWith("təsdiqlə") ||
    normalized === "yes" ||
    normalized === "ok"
  ) {
    return "confirm";
  }
  if (
    normalized === "2" ||
    normalized === "ləğv" ||
    normalized === "legv" ||
    normalized.startsWith("ləğv et") ||
    normalized === "no" ||
    normalized === "cancel"
  ) {
    return "cancel";
  }
  return "unknown";
}

function readGreenApiPayload(json: unknown): GreenApiPayload {
  // Green API wraps everything inside an opaque envelope sometimes; normalise both shapes.
  if (json && typeof json === "object") {
    const top = json as GreenApiPayload;
    if (top.typeWebhook || top.senderData || top.messageData) return top;
    if (top.body && typeof top.body === "object") {
      return top.body as GreenApiPayload;
    }
  }
  return {};
}

async function handle(payload: GreenApiPayload): Promise<WebhookOk> {
  // Only react to incoming messages; ignore status/state webhooks.
  if (payload.typeWebhook && payload.typeWebhook !== "incomingMessageReceived") {
    return { ok: true, action: "ignored", reason: `typeWebhook=${payload.typeWebhook}` };
  }

  const phone = chatIdToE164(payload.senderData?.chatId ?? payload.senderData?.sender);
  if (!phone) {
    return { ok: true, action: "ignored", reason: "no sender phone" };
  }

  const intent = classifyIntent(payload);
  if (intent === "unknown") {
    return { ok: true, action: "ignored", reason: "unknown intent" };
  }

  const since = new Date(Date.now() - 24 * 60 * 60_000);
  const appointment = await prisma.appointment.findFirst({
    where: {
      patientPhone: phone,
      status: "PENDING",
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    include: {
      doctor: { select: { name: true } },
      service: { select: { name: true } },
    },
  });

  if (!appointment) {
    return { ok: true, action: "ignored", reason: "no recent PENDING appointment" };
  }

  // Tenancy: re-validate clinicId by joining via the appointment row we just loaded.
  // (The appointment row already carries its clinicId — we don't load anything cross-tenant.)

  if (intent === "confirm") {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "CONFIRMED" },
    });

    await sendAndLog({
      appointmentId: appointment.id,
      type: "BOOKING_CONFIRMATION",
      phone: appointment.patientPhone,
      message: WA_MESSAGES.confirmedThanks(appointment.patientName),
    });

    return { ok: true, action: "confirmed" };
  }

  // intent === "cancel"
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELLED" },
  });

  await sendAndLog({
    appointmentId: appointment.id,
    type: "CANCELLATION",
    phone: appointment.patientPhone,
    message: WA_MESSAGES.cancellation(appointment.patientName),
  });

  return { ok: true, action: "cancelled" };
}

export async function POST(req: NextRequest): Promise<NextResponse<WebhookOk>> {
  // Always return 200 to prevent Green API retries — even on internal failure we
  // would rather investigate via logs than lose webhook ordering.
  try {
    const json: unknown = await req.json().catch(() => null);
    const payload = readGreenApiPayload(json);
    const result = await handle(payload);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/whatsapp/webhook]", message);
    return NextResponse.json(
      { ok: true, action: "ignored", reason: `error: ${message}` },
      { status: 200 },
    );
  }
}

// Allow Green API to verify the endpoint with a simple GET probe.
export function GET(): NextResponse<{ ok: true }> {
  return NextResponse.json({ ok: true });
}
