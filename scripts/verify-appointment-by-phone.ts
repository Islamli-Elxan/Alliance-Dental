import { PrismaClient } from "@prisma/client";

const phone = process.argv[2];
if (!phone) {
  console.error("Usage: tsx scripts/verify-appointment-by-phone.ts +994XXXXXXXXX");
  process.exit(1);
}

const p = new PrismaClient();

async function main(): Promise<void> {
  const appt = await p.appointment.findFirst({
    where: { patientPhone: phone },
    orderBy: { createdAt: "desc" },
    include: {
      doctor: { select: { name: true } },
      service: { select: { name: true } },
      notifications: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!appt) {
    console.log(`No appointment for ${phone}`);
    await p.$disconnect();
    return;
  }
  console.log(`Latest appointment for ${phone}:`);
  console.log(`  id:          ${appt.id}`);
  console.log(`  status:      ${appt.status}`);
  console.log(`  service:     ${appt.service.name}`);
  console.log(`  doctor:      ${appt.doctor.name}`);
  console.log(`  startTime:   ${appt.startTime.toISOString()}`);
  console.log(`  notifications (${appt.notifications.length}):`);
  for (const n of appt.notifications) {
    console.log(
      `    [${n.type}] status=${n.status} sentAt=${n.sentAt?.toISOString() ?? "—"}`,
    );
    if (n.errorMessage) console.log(`      err: ${n.errorMessage}`);
    console.log(`      msg: ${n.messageText.replace(/\n/g, " ¶ ").slice(0, 100)}...`);
  }
  await p.$disconnect();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
