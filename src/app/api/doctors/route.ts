import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClinicBySlug, getDefaultClinicSlug } from "@/lib/clinic";
import type { ApiResponse, AvailabilityRules } from "@/types";

export const dynamic = "force-dynamic";

interface DoctorDto {
  id: string;
  name: string;
  specialty: string;
  photoUrl: string | null;
  availabilityRules: AvailabilityRules;
}

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<DoctorDto[]>>> {
  try {
    const { searchParams } = new URL(req.url);
    const clinicSlug = searchParams.get("clinicSlug") ?? getDefaultClinicSlug();
    const clinic = await getClinicBySlug(clinicSlug);

    const doctors = await prisma.doctor.findMany({
      where: { clinicId: clinic.id },
      orderBy: { name: "asc" },
    });

    const data: DoctorDto[] = doctors.map((d) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      photoUrl: d.photoUrl,
      availabilityRules: d.availabilityRules as unknown as AvailabilityRules,
    }));

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Naməlum xəta";
    console.error("[GET /api/doctors]", message);
    return NextResponse.json({ error: "Həkimlər yüklənmədi" }, { status: 500 });
  }
}
