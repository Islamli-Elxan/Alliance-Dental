import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.adminUser.findUnique({
    where: { email: "admin@alliance.az" },
  });

  if (!user) {
    console.log("❌ User NOT FOUND in database!");
    return;
  }

  console.log("✅ User found:", user.email);
  console.log("   Hash stored:", user.password);

  const match = await bcrypt.compare("demo2024", user.password);
  console.log("   Password 'demo2024' matches:", match ? "✅ YES" : "❌ NO");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
