/**
 * Internal-only WhatsApp send helper.
 *
 * This is intentionally minimal — admin retry actions go through
 * /api/admin/notifications/[id]/retry which has session protection.
 * This route is used for ad-hoc testing during development and is gated
 * behind CRON_SECRET so it cannot be called from the public internet.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendWhatsAppMessage, isGreenApiConfigured } from "@/lib/greenapi";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

const schema = z.object({
  phone: z.string().regex(/^\+994[0-9]{9}$/),
  message: z.string().min(1).max(4000),
});

interface SendDto {
  configured: boolean;
  success: boolean;
  skipped: boolean;
  error?: string;
}

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${expected}`;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<SendDto>>> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json: unknown = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Yanlış sorğu" }, { status: 400 });
    }

    const result = await sendWhatsAppMessage(parsed.data.phone, parsed.data.message);

    return NextResponse.json({
      data: {
        configured: isGreenApiConfigured(),
        success: result.success,
        skipped: result.skipped === true,
        ...(result.error ? { error: result.error } : {}),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Naməlum xəta";
    console.error("[POST /api/whatsapp/send]", message);
    return NextResponse.json({ error: "Göndərilmədi" }, { status: 500 });
  }
}
