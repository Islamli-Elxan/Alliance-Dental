/**
 * Green API WhatsApp wrapper.
 *
 * Two layers:
 *   - sendWhatsAppMessage(): low-level fetch wrapper. Returns success/error/skipped.
 *   - sendAndLog(): high-level helper that creates or updates a NotificationLog row
 *     for an appointment. This is what booking, cron, and webhook handlers call.
 *
 * If Green API credentials are missing, sendWhatsAppMessage returns
 * { success: true, skipped: true } so the rest of the pipeline still works
 * during development.
 */

import { prisma } from "@/lib/prisma";
import type { NotificationType, NotificationLog } from "@prisma/client";

export interface SendButton {
  buttonId: string;
  buttonText: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
  raw?: unknown;
}

interface GreenApiCredentials {
  instanceId: string;
  token: string;
  baseUrl: string;
}

function formatPhoneForGreenApi(phoneE164: string): string {
  // +994501234567 -> 994501234567@c.us
  return `${phoneE164.replace(/^\+/, "")}@c.us`;
}

function getCredentials(): GreenApiCredentials | null {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const token = process.env.GREEN_API_TOKEN;
  const baseUrl = process.env.GREEN_API_BASE_URL ?? "https://api.green-api.com";
  if (!instanceId || !token) return null;
  return { instanceId, token, baseUrl };
}

export function isGreenApiConfigured(): boolean {
  return getCredentials() !== null;
}

const REQUEST_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function sendWhatsAppMessage(
  phoneE164: string,
  message: string,
  buttons?: SendButton[],
): Promise<SendWhatsAppResult> {
  const creds = getCredentials();
  if (!creds) {
    return { success: true, skipped: true };
  }

  const chatId = formatPhoneForGreenApi(phoneE164);
  const useButtons = buttons && buttons.length > 0;
  const endpoint = useButtons
    ? `${creds.baseUrl}/waInstance${creds.instanceId}/sendButtons/${creds.token}`
    : `${creds.baseUrl}/waInstance${creds.instanceId}/sendMessage/${creds.token}`;

  const body = useButtons
    ? { chatId, message, footer: "Alliance Dental", buttons }
    : { chatId, message };

  try {
    const response = await fetchWithTimeout(
      endpoint,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      REQUEST_TIMEOUT_MS,
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      // Fall back to plain text if buttons aren't supported by the plan
      if (useButtons && (response.status === 400 || response.status === 466)) {
        return sendWhatsAppMessage(phoneE164, message);
      }
      return {
        success: false,
        error: `Green API HTTP ${response.status}: ${text.slice(0, 200)}`,
      };
    }

    const json: unknown = await response.json().catch(() => ({}));
    return { success: true, raw: json };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return { success: false, error: "Green API timeout" };
    }
    const message = err instanceof Error ? err.message : "Unknown Green API error";
    return { success: false, error: message };
  }
}

interface SendAndLogInput {
  appointmentId: string;
  type: NotificationType;
  phone: string;
  message: string;
  buttons?: SendButton[];
  existingLogId?: string; // when retrying
}

interface SendAndLogResult {
  log: NotificationLog;
  send: SendWhatsAppResult;
}

/**
 * Send a WhatsApp message and persist a NotificationLog entry.
 * - If existingLogId is provided, that row is updated (retry path).
 * - Otherwise a new row is created.
 *
 * On success: status=SENT, sentAt=now, errorMessage cleared (or "Skipped: ..." if no creds).
 * On failure: status=FAILED, errorMessage set, retryCount incremented when retrying.
 */
export async function sendAndLog(input: SendAndLogInput): Promise<SendAndLogResult> {
  const { appointmentId, type, phone, message, buttons, existingLogId } = input;

  const sendResult = await sendWhatsAppMessage(phone, message, buttons);

  const successData = {
    status: "SENT" as const,
    sentAt: new Date(),
    errorMessage: sendResult.skipped ? "Skipped: Green API not configured" : null,
    messageText: message,
  };

  const failureData = {
    status: "FAILED" as const,
    errorMessage: sendResult.error ?? "Naməlum xəta",
    messageText: message,
  };

  if (existingLogId) {
    const log = await prisma.notificationLog.update({
      where: { id: existingLogId },
      data: sendResult.success
        ? successData
        : {
            ...failureData,
            retryCount: { increment: 1 },
          },
    });
    return { log, send: sendResult };
  }

  const log = await prisma.notificationLog.create({
    data: {
      appointmentId,
      type,
      ...(sendResult.success ? successData : failureData),
    },
  });
  return { log, send: sendResult };
}

/**
 * Determine if a notification of a given type has already been SENT for an appointment.
 * Used by the cron job to avoid duplicate reminders.
 */
export async function hasSentNotification(
  appointmentId: string,
  type: NotificationType,
): Promise<boolean> {
  const found = await prisma.notificationLog.findFirst({
    where: { appointmentId, type, status: "SENT" },
    select: { id: true },
  });
  return found !== null;
}
