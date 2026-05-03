import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main(): Promise<void> {
  const last = await p.appointment.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      doctor: { select: { name: true } },
      service: { select: { name: true } },
      notifications: true,
    },
  });

  if (!last) {
    console.log("No appointments found");
    return;
  }

  console.log("Latest appointment:");
  console.log("  id:           ", last.id);
  console.log("  patient:      ", last.patientName, last.patientPhone);
  console.log("  service:      ", last.service.name);
  console.log("  doctor:       ", last.doctor.name);
  console.log("  status:       ", last.status);
  console.log("  startTime UTC:", last.startTime.toISOString());
  console.log("  endTime UTC:  ", last.endTime.toISOString());
  console.log("  price:        ", last.priceAtBooking.toString());
  console.log("  notifications:");
  for (const n of last.notifications) {
    console.log(`    [${n.type}] status=${n.status} retry=${n.retryCount} sentAt=${n.sentAt?.toISOString() ?? "—"}`);
    if (n.errorMessage) console.log(`      errorMessage: ${n.errorMessage}`);
    console.log(`      message: ${n.messageText.replace(/\n/g, " ¶ ").slice(0, 120)}...`);
  }

  await p.$disconnect();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
