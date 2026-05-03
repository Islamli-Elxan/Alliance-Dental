import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClinicBySlug, getDefaultClinicSlug } from "@/lib/clinic";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

interface ServiceDto {
  id: string;
  name: string;
  description: string | null;
  price: string;
  durationMinutes: number;
  iconName: string | null;
}

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<ServiceDto[]>>> {
  try {
    const { searchParams } = new URL(req.url);
    const clinicSlug = searchParams.get("clinicSlug") ?? getDefaultClinicSlug();
    const clinic = await getClinicBySlug(clinicSlug);

    const services = await prisma.service.findMany({
      where: { clinicId: clinic.id },
      orderBy: { price: "asc" },
    });

    const data: ServiceDto[] = services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price.toString(),
      durationMinutes: s.durationMinutes,
      iconName: s.iconName,
    }));

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Naməlum xəta";
    console.error("[GET /api/services]", message);
    return NextResponse.json({ error: "Xidmətlər yüklənmədi" }, { status: 500 });
  }
}
