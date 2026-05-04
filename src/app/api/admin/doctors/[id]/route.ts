import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminContext, AdminUnauthorizedError } from "@/lib/admin-auth";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  specialty: z.string().min(2).max(100).optional(),
  photoUrl: z.string().url().nullable().optional(),
  availabilityRules: z.object({
    workDays: z.array(z.number().int().min(1).max(7)),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    breakStart: z.string().regex(/^\d{2}:\d{2}$/),
    breakEnd: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const ctx = await requireAdminContext();
    const existing = await prisma.doctor.findFirst({
      where: { id: params.id, clinicId: ctx.clinicId },
    });
    if (!existing)
      return NextResponse.json({ error: "Həkim tapılmadı" }, { status: 404 });

    const json: unknown = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success)
      return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });

    const updated = await prisma.doctor.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.name ? { name: parsed.data.name } : {}),
        ...(parsed.data.specialty ? { specialty: parsed.data.specialty } : {}),
        ...(parsed.data.photoUrl !== undefined ? { photoUrl: parsed.data.photoUrl } : {}),
        ...(parsed.data.availabilityRules ? { availabilityRules: parsed.data.availabilityRules } : {}),
      },
      select: { id: true },
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    if (err instanceof AdminUnauthorizedError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Həkim yenilənmədi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const ctx = await requireAdminContext();
    const doctor = await prisma.doctor.findFirst({
      where: { id: params.id, clinicId: ctx.clinicId },
      include: { _count: { select: { appointments: true } } },
    });
    if (!doctor)
      return NextResponse.json({ error: "Həkim tapılmadı" }, { status: 404 });

    if (doctor._count.appointments > 0)
      return NextResponse.json(
        { error: `Bu həkimin ${doctor._count.appointments} görüşü var. Əvvəlcə görüşləri silin.` },
        { status: 409 },
      );

    await prisma.doctor.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { id: params.id } });
  } catch (err) {
    if (err instanceof AdminUnauthorizedError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Həkim silinmədi" }, { status: 500 });
  }
}
