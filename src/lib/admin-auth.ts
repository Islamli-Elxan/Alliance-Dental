/**
 * Helper for admin API routes: load the session and return the caller's clinicId.
 * Throws AdminUnauthorizedError when there is no session — callers convert that
 * into a 401 JSON response.
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export class AdminUnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "AdminUnauthorizedError";
  }
}

export interface AdminContext {
  clinicId: string;
  userId: string;
  email: string;
}

export async function requireAdminContext(): Promise<AdminContext> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) {
    throw new AdminUnauthorizedError();
  }
  return {
    clinicId: session.user.clinicId,
    userId: session.user.id,
    email: session.user.email,
  };
}
