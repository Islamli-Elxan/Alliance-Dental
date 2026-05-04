import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.adminUser.findMany({
    select: { id: true, email: true, name: true, clinicId: true },
  });
  console.log("AdminUser count:", users.length);
  console.log("Users:", JSON.stringify(users, null, 2));

  const clinics = await prisma.clinic.findMany();
  console.log("Clinic count:", clinics.length);
  console.log("Clinics:", JSON.stringify(clinics, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
