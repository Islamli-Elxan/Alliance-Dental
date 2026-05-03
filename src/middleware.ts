/**
 * Protect /admin/* routes. Anything except /admin/login requires an authenticated session.
 * Uses next-auth's middleware helper which reads the JWT cookie.
 */

import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/admin/login" },
  secret: process.env.NEXTAUTH_SECRET,
});

export const config = {
  matcher: [
    // Protect everything under /admin EXCEPT /admin/login
    "/admin/((?!login).*)",
    "/admin",
  ],
};
