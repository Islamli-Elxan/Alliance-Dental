import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminContext, AdminUnauthorizedError } from "@/lib/admin-auth";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  price: z.number().positive().max(100000).optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  iconName: z.string().max(50).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const ctx = await requireAdminContext();
    const existing = await prisma.service.findFirst({
      where: { id: params.id, clinicId: ctx.clinicId },
    });
    if (!existing)
      return NextResponse.json({ error: "Xidmət tapılmadı" }, { status: 404 });

    const json: unknown = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success)
      return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });

    const updated = await prisma.service.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        ...(parsed.data.price !== undefined ? { price: parsed.data.price } : {}),
        ...(parsed.data.durationMinutes !== undefined ? { durationMinutes: parsed.data.durationMinutes } : {}),
        ...(parsed.data.iconName !== undefined ? { iconName: parsed.data.iconName } : {}),
      },
      select: { id: true },
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    if (err instanceof AdminUnauthorizedError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Xidmət yenilənmədi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const ctx = await requireAdminContext();
    const service = await prisma.service.findFirst({
      where: { id: params.id, clinicId: ctx.clinicId },
      include: { _count: { select: { appointments: true } } },
    });
    if (!service)
      return NextResponse.json({ error: "Xidmət tapılmadı" }, { status: 404 });

    if (service._count.appointments > 0)
      return NextResponse.json(
        { error: `Bu xidmətin ${service._count.appointments} görüşü var. Əvvəlcə görüşləri silin.` },
        { status: 409 },
      );

    await prisma.service.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { id: params.id } });
  } catch (err) {
    if (err instanceof AdminUnauthorizedError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Xidmət silinmədi" }, { status: 500 });
  }
}
