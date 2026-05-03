import { prisma } from "@/lib/prisma";
import type { Clinic } from "@prisma/client";

/**
 * Resolve a clinic by slug. Throws if not found so callers can rely on a non-null result.
 * Cached per request via Next.js fetch cache pattern is unnecessary — Prisma queries are cheap.
 */
export async function getClinicBySlug(slug: string): Promise<Clinic> {
  const clinic = await prisma.clinic.findUnique({ where: { slug } });
  if (!clinic) {
    throw new Error(`Clinic not found for slug "${slug}"`);
  }
  return clinic;
}

export function getDefaultClinicSlug(): string {
  return process.env.NEXT_PUBLIC_CLINIC_SLUG ?? "alliance";
}
