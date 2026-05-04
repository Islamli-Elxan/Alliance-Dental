import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminContext, AdminUnauthorizedError } from "@/lib/admin-auth";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).nullable().optional(),
  price: z.number().positive().max(100000),
  durationMinutes: z.number().int().min(5).max(480),
  iconName: z.string().max(50).nullable().optional(),
});

export interface AdminServiceDto {
  id: string;
  name: string;
  description: string | null;
  price: string;
  durationMinutes: number;
  iconName: string | null;
  appointmentCount: number;
  createdAt: string;
}

export async function GET(): Promise<NextResponse<ApiResponse<AdminServiceDto[]>>> {
  try {
    const ctx = await requireAdminContext();
    const services = await prisma.service.findMany({
      where: { clinicId: ctx.clinicId },
      orderBy: { price: "asc" },
      include: { _count: { select: { appointments: true } } },
    });

    const data: AdminServiceDto[] = services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price.toString(),
      durationMinutes: s.durationMinutes,
      iconName: s.iconName,
      appointmentCount: s._count.appointments,
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof AdminUnauthorizedError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Xidmətlər yüklənmədi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<AdminServiceDto>>> {
  try {
    const ctx = await requireAdminContext();
    const json: unknown = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(json);
    if (!parsed.success)
      return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });

    const s = await prisma.service.create({
      data: {
        clinicId: ctx.clinicId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        price: parsed.data.price,
        durationMinutes: parsed.data.durationMinutes,
        iconName: parsed.data.iconName ?? null,
      },
      include: { _count: { select: { appointments: true } } },
    });

    return NextResponse.json({
      data: {
        id: s.id,
        name: s.name,
        description: s.description,
        price: s.price.toString(),
        durationMinutes: s.durationMinutes,
        iconName: s.iconName,
        appointmentCount: s._count.appointments,
        createdAt: s.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (err) {
    if (err instanceof AdminUnauthorizedError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Xidmət yaradılmadı" }, { status: 500 });
  }
}
