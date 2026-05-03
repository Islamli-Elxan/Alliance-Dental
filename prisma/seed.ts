import { PrismaClient, AppointmentStatus, NotificationType, NotificationStatus, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface AvailabilityRules {
  workDays: number[];
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
}

const SERVICES_DATA = [
  { name: "Diş ağardılması", price: 150, durationMinutes: 60, iconName: "sparkles", description: "Professional ağardma proseduru" },
  { name: "İmplant", price: 800, durationMinutes: 120, iconName: "zap", description: "Diş implant qurğusu və yerləşdirilməsi" },
  { name: "Ortodontiya konsultasiyası", price: 50, durationMinutes: 30, iconName: "stethoscope", description: "İlkin ortodontik müayinə" },
  { name: "Diş müalicəsi", price: 80, durationMinutes: 45, iconName: "heart-pulse", description: "Karies müalicəsi və plomba" },
  { name: "Diş daşı təmizlənməsi", price: 60, durationMinutes: 30, iconName: "shield-check", description: "Professional gigiyenik təmizlik" },
];

const DOCTORS_DATA: Array<{ name: string; specialty: string; availability: AvailabilityRules }> = [
  {
    name: "Dr. Əli Həsənov",
    specialty: "Ortodontist",
    availability: { workDays: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "18:00", breakStart: "13:00", breakEnd: "14:00" },
  },
  {
    name: "Dr. Nigar Əliyeva",
    specialty: "Ümumi Diş Həkimi",
    availability: { workDays: [1, 2, 3, 4, 5, 6], startTime: "09:00", endTime: "17:00", breakStart: "13:00", breakEnd: "14:00" },
  },
  {
    name: "Dr. Kamran Məmmədov",
    specialty: "İmplantologiya",
    availability: { workDays: [2, 3, 4, 5, 6], startTime: "10:00", endTime: "19:00", breakStart: "13:00", breakEnd: "14:00" },
  },
];

const DEMO_PATIENTS = [
  { name: "Aysel Məmmədova", phone: "+994501234567" },
  { name: "Rəşad Quliyev", phone: "+994552345678" },
  { name: "Səbinə Hüseynova", phone: "+994703456789" },
  { name: "Elnur Babayev", phone: "+994774567890" },
  { name: "Lalə Rəhimova", phone: "+994515678901" },
  { name: "Tural Mehdiyev", phone: "+994556789012" },
  { name: "Günel Əhmədova", phone: "+994707890123" },
  { name: "Vüsal Cəfərov", phone: "+994778901234" },
  { name: "Mətanət Süleymanova", phone: "+994519012345" },
  { name: "Orxan Kərimov", phone: "+994550123456" },
  { name: "Nərmin İbrahimova", phone: "+994701234567" },
  { name: "Cavid Abbasov", phone: "+994772345678" },
  { name: "Sevinc Nəzərova", phone: "+994513456789" },
  { name: "Ramil Zeynalov", phone: "+994554567890" },
  { name: "Aytən Qurbanova", phone: "+994705678901" },
  { name: "Fərid Vəliyev", phone: "+994776789012" },
  { name: "Türkan Xəlilova", phone: "+994517890123" },
  { name: "Eldar Sadıqov", phone: "+994558901234" },
];

function pickStatus(daysFromNow: number): AppointmentStatus {
  if (daysFromNow < -1) {
    const r = Math.random();
    if (r < 0.7) return "COMPLETED";
    if (r < 0.85) return "NO_SHOW";
    return "CANCELLED";
  }
  if (daysFromNow < 0) {
    return Math.random() < 0.6 ? "COMPLETED" : "NO_SHOW";
  }
  const r = Math.random();
  if (r < 0.6) return "CONFIRMED";
  if (r < 0.9) return "PENDING";
  return "CANCELLED";
}

function setHoursMinutes(date: Date, h: number, m: number): Date {
  // Assumes the host runs in a tz close enough; for seed demo we set in clinic local approximation.
  const d = new Date(date);
  d.setUTCHours(h - 4, m, 0, 0); // Asia/Baku is UTC+4
  return d;
}

async function main(): Promise<void> {
  console.log("Seed: clearing existing data...");
  await prisma.notificationLog.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.service.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.clinic.deleteMany();

  console.log("Seed: creating clinic...");
  const clinic = await prisma.clinic.create({
    data: {
      name: "Alliance Dental Clinic",
      slug: "alliance",
      timezone: "Asia/Baku",
    },
  });

  console.log("Seed: creating admin user...");
  const passwordHash = await bcrypt.hash("demo2024", 10);
  await prisma.adminUser.create({
    data: {
      clinicId: clinic.id,
      email: "admin@alliance.az",
      password: passwordHash,
      name: "Alliance Admin",
    },
  });

  console.log("Seed: creating services...");
  const services = [];
  for (const s of SERVICES_DATA) {
    const created = await prisma.service.create({
      data: {
        clinicId: clinic.id,
        name: s.name,
        description: s.description,
        price: s.price,
        durationMinutes: s.durationMinutes,
        iconName: s.iconName,
      },
    });
    services.push(created);
  }

  console.log("Seed: creating doctors...");
  const doctors = [];
  for (const d of DOCTORS_DATA) {
    const created = await prisma.doctor.create({
      data: {
        clinicId: clinic.id,
        name: d.name,
        specialty: d.specialty,
        availabilityRules: d.availability as unknown as Prisma.InputJsonValue,
      },
    });
    doctors.push(created);
  }

  console.log("Seed: creating demo appointments...");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const slots = [
    { h: 9, m: 0 },
    { h: 9, m: 30 },
    { h: 10, m: 0 },
    { h: 10, m: 30 },
    { h: 11, m: 0 },
    { h: 11, m: 30 },
    { h: 14, m: 0 },
    { h: 14, m: 30 },
    { h: 15, m: 0 },
    { h: 15, m: 30 },
    { h: 16, m: 0 },
    { h: 16, m: 30 },
  ];

  let patientIdx = 0;
  let appointmentsCreated = 0;
  const target = DEMO_PATIENTS.length;

  for (let dayOffset = -7; dayOffset <= 7 && appointmentsCreated < target; dayOffset++) {
    // Skip Sundays (ISO 7)
    const dayDate = new Date(today);
    dayDate.setUTCDate(today.getUTCDate() + dayOffset);
    const isoDay = dayDate.getUTCDay() === 0 ? 7 : dayDate.getUTCDay();
    if (isoDay === 7) continue;

    // 2 appointments per day average
    const perDay = Math.random() < 0.5 ? 1 : 2;
    for (let i = 0; i < perDay && appointmentsCreated < target; i++) {
      const patient = DEMO_PATIENTS[patientIdx % DEMO_PATIENTS.length];
      if (!patient) break;
      patientIdx++;

      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      if (!doctor || !service) continue;

      const slot = slots[Math.floor(Math.random() * slots.length)];
      if (!slot) continue;

      const start = setHoursMinutes(dayDate, slot.h, slot.m);
      const end = new Date(start.getTime() + service.durationMinutes * 60_000);
      const status = pickStatus(dayOffset);

      const appt = await prisma.appointment.create({
        data: {
          clinicId: clinic.id,
          doctorId: doctor.id,
          serviceId: service.id,
          patientName: patient.name,
          patientPhone: patient.phone,
          startTime: start,
          endTime: end,
          status,
          priceAtBooking: service.price,
        },
      });

      // Confirmation log for every appointment
      await prisma.notificationLog.create({
        data: {
          appointmentId: appt.id,
          type: NotificationType.BOOKING_CONFIRMATION,
          status: status === "CANCELLED" || dayOffset < 0 ? NotificationStatus.SENT : NotificationStatus.SENT,
          messageText: `Salam, ${patient.name}! Görüşünüz qeydə alındı.`,
          sentAt: new Date(start.getTime() - 24 * 60 * 60_000),
        },
      });

      // 24h reminder for past or recent confirmed
      if ((status === "COMPLETED" || status === "NO_SHOW") && dayOffset < 0) {
        await prisma.notificationLog.create({
          data: {
            appointmentId: appt.id,
            type: NotificationType.REMINDER_24H,
            status: NotificationStatus.SENT,
            messageText: `Salam, ${patient.name}! Sabah görüşünüz var.`,
            sentAt: new Date(start.getTime() - 24 * 60 * 60_000),
          },
        });
      }

      // One simulated failed notification for variety
      if (appointmentsCreated === 5) {
        await prisma.notificationLog.create({
          data: {
            appointmentId: appt.id,
            type: NotificationType.REMINDER_2H,
            status: NotificationStatus.FAILED,
            messageText: `Salam, ${patient.name}! 2 saat qaldı.`,
            errorMessage: "Green API timeout (simulated)",
            retryCount: 1,
          },
        });
      }

      appointmentsCreated++;
    }
  }

  console.log(`Seed: created ${appointmentsCreated} appointments.`);
  console.log("Seed: done.");
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
