import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminContext, AdminUnauthorizedError } from "@/lib/admin-auth";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

const availabilitySchema = z.object({
  workDays: z.array(z.number().int().min(1).max(7)),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  breakStart: z.string().regex(/^\d{2}:\d{2}$/),
  breakEnd: z.string().regex(/^\d{2}:\d{2}$/),
});

const createSchema = z.object({
  name: z.string().min(2).max(100),
  specialty: z.string().min(2).max(100),
  photoUrl: z.string().url().nullable().optional(),
  availabilityRules: availabilitySchema,
});

export interface AdminDoctorDto {
  id: string;
  name: string;
  specialty: string;
  photoUrl: string | null;
  availabilityRules: {
    workDays: number[];
    startTime: string;
    endTime: string;
    breakStart: string;
    breakEnd: string;
  };
  appointmentCount: number;
  createdAt: string;
}

export async function GET(): Promise<NextResponse<ApiResponse<AdminDoctorDto[]>>> {
  try {
    const ctx = await requireAdminContext();
    const doctors = await prisma.doctor.findMany({
      where: { clinicId: ctx.clinicId },
      orderBy: { name: "asc" },
      include: { _count: { select: { appointments: true } } },
    });

    const data: AdminDoctorDto[] = doctors.map((d) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      photoUrl: d.photoUrl,
      availabilityRules: d.availabilityRules as AdminDoctorDto["availabilityRules"],
      appointmentCount: d._count.appointments,
      createdAt: d.createdAt.toISOString(),
    }));

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof AdminUnauthorizedError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Həkimlər yüklənmədi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<AdminDoctorDto>>> {
  try {
    const ctx = await requireAdminContext();
    const json: unknown = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(json);
    if (!parsed.success)
      return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });

    const d = await prisma.doctor.create({
      data: {
        clinicId: ctx.clinicId,
        name: parsed.data.name,
        specialty: parsed.data.specialty,
        photoUrl: parsed.data.photoUrl ?? null,
        availabilityRules: parsed.data.availabilityRules,
      },
      include: { _count: { select: { appointments: true } } },
    });

    return NextResponse.json({
      data: {
        id: d.id,
        name: d.name,
        specialty: d.specialty,
        photoUrl: d.photoUrl,
        availabilityRules: d.availabilityRules as AdminDoctorDto["availabilityRules"],
        appointmentCount: d._count.appointments,
        createdAt: d.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (err) {
    if (err instanceof AdminUnauthorizedError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Həkim yaradılmadı" }, { status: 500 });
  }
}
