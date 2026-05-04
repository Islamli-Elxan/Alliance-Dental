import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminContext, AdminUnauthorizedError } from "@/lib/admin-auth";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export interface PatientDto {
  phone: string;
  name: string;
  appointmentCount: number;
  lastVisit: string;
  totalSpent: string;
}

export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<PatientDto[]>>> {
  try {
    const ctx = await requireAdminContext();

    // Use a raw query to get unique patients since Prisma groupBy doesn't 
    // easily let us get the latest name and sum of decimal fields easily 
    // in one go without raw queries.

    const patientsRaw = await prisma.$queryRaw<
      {
        phone: string;
        name: string;
        appointmentCount: bigint;
        lastVisit: Date;
        totalSpent: number;
      }[]
    >`
      SELECT 
        "patientPhone" as phone,
        MAX("patientName") as name,
        COUNT(id) as "appointmentCount",
        MAX("startTime") as "lastVisit",
        SUM("priceAtBooking") as "totalSpent"
      FROM "Appointment"
      WHERE "clinicId" = ${ctx.clinicId}
      GROUP BY "patientPhone"
      ORDER BY "lastVisit" DESC
      LIMIT 200
    `;

    const data: PatientDto[] = patientsRaw.map((p) => ({
      phone: p.phone,
      name: p.name,
      appointmentCount: Number(p.appointmentCount),
      lastVisit: p.lastVisit.toISOString(),
      totalSpent: p.totalSpent.toString(),
    }));

    return NextResponse.json({ data });
  } catch (err: unknown) {
    if (err instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Naməlum xəta";
    console.error("[GET /api/admin/patients]", message);
    return NextResponse.json({ error: "Pasiyentlər yüklənmədi" }, { status: 500 });
  }
}
