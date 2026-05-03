import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getClinicBySlug, getDefaultClinicSlug } from "@/lib/clinic";
import { generateAvailableSlots, clinicDateFromIsoDateString } from "@/lib/slots";
import type { AvailabilityRules, ApiResponse, TimeSlot } from "@/types";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  doctorId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  clinicSlug: z.string().optional(),
});

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<TimeSlot[]>>> {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      doctorId: searchParams.get("doctorId"),
      serviceId: searchParams.get("serviceId"),
      date: searchParams.get("date"),
      clinicSlug: searchParams.get("clinicSlug") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Yanlış sorğu parametrləri" },
        { status: 400 },
      );
    }

    const { doctorId, serviceId, date, clinicSlug } = parsed.data;
    const clinic = await getClinicBySlug(clinicSlug ?? getDefaultClinicSlug());

    const [doctor, service] = await Promise.all([
      prisma.doctor.findFirst({ where: { id: doctorId, clinicId: clinic.id } }),
      prisma.service.findFirst({ where: { id: serviceId, clinicId: clinic.id } }),
    ]);

    if (!doctor || !service) {
      return NextResponse.json({ error: "Həkim və ya xidmət tapılmadı" }, { status: 404 });
    }

    // Window for existing-appointment query: the entire clinic-local day
    const dayStartUtc = clinicDateFromIsoDateString(date, clinic.timezone);
    const dayEndUtc = new Date(dayStartUtc.getTime() + 24 * 60 * 60_000);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        clinicId: clinic.id,
        doctorId: doctor.id,
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
        startTime: { gte: dayStartUtc, lt: dayEndUtc },
      },
      select: { startTime: true, endTime: true },
    });

    const slots = generateAvailableSlots({
      doctor: {
        id: doctor.id,
        availabilityRules: doctor.availabilityRules as unknown as AvailabilityRules,
      },
      service: { durationMinutes: service.durationMinutes },
      date: dayStartUtc,
      timezone: clinic.timezone,
      existingAppointments,
    });

    return NextResponse.json({ data: slots });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Naməlum xəta";
    console.error("[GET /api/slots]", message);
    return NextResponse.json({ error: "Slot məlumatları alınmadı" }, { status: 500 });
  }
}
