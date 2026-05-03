import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main(): Promise<void> {
  const clinics = await p.clinic.count();
  const admins = await p.adminUser.count();
  const doctors = await p.doctor.count();
  const services = await p.service.count();
  const appointments = await p.appointment.count();
  const notifications = await p.notificationLog.count();
  const byStatus = await p.appointment.groupBy({ by: ["status"], _count: true });
  const notiByStatus = await p.notificationLog.groupBy({ by: ["status"], _count: true });

  console.log("== Seed verification ==");
  console.log("Clinics:        ", clinics);
  console.log("Admin users:    ", admins);
  console.log("Doctors:        ", doctors);
  console.log("Services:       ", services);
  console.log("Appointments:   ", appointments);
  console.log("Notifications:  ", notifications);
  console.log("Appointment status breakdown:");
  for (const s of byStatus) console.log("  ", s.status.padEnd(12), s._count);
  console.log("Notification status breakdown:");
  for (const s of notiByStatus) console.log("  ", s.status.padEnd(12), s._count);

  const sampleService = await p.service.findFirst({ orderBy: { name: "asc" } });
  console.log("\nSample service:", sampleService?.name, "—", sampleService?.price.toString(), "AZN");

  const sampleDoctor = await p.doctor.findFirst({ orderBy: { name: "asc" } });
  console.log("Sample doctor: ", sampleDoctor?.name, "—", sampleDoctor?.specialty);
  console.log("  availability:", JSON.stringify(sampleDoctor?.availabilityRules));

  await p.$disconnect();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
