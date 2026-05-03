import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminContext, AdminUnauthorizedError } from "@/lib/admin-auth";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "NO_SHOW", "COMPLETED"]).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

interface AppointmentPatchedDto {
  id: string;
  status: string;
  notes: string | null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse<AppointmentPatchedDto>>> {
  try {
    const ctx = await requireAdminContext();
    const json: unknown = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success || (parsed.data.status === undefined && parsed.data.notes === undefined)) {
      return NextResponse.json({ error: "Yenilənəcək sahə yoxdur" }, { status: 400 });
    }

    // Tenancy: only allow updates on rows that belong to this clinic.
    const existing = await prisma.appointment.findFirst({
      where: { id: params.id, clinicId: ctx.clinicId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Görüş tapılmadı" }, { status: 404 });
    }

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
      },
      select: { id: true, status: true, notes: true },
    });

    return NextResponse.json({ data: updated });
  } catch (err: unknown) {
    if (err instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Naməlum xəta";
    console.error("[PATCH /api/admin/appointments/:id]", message);
    return NextResponse.json({ error: "Görüş yenilənmədi" }, { status: 500 });
  }
}
