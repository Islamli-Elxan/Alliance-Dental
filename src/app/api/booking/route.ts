import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getClinicBySlug, getDefaultClinicSlug } from "@/lib/clinic";
import { sendAndLog } from "@/lib/greenapi";
import { WA_MESSAGES, WA_BUTTONS } from "@/lib/whatsapp-messages";
import { formatDateTimeBaku } from "@/lib/utils";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

const bookingSchema = z.object({
  clinicSlug: z.string().optional(),
  serviceId: z.string().min(1, "serviceId tələb olunur"),
  doctorId: z.string().min(1, "doctorId tələb olunur"),
  startTime: z.string().refine(
    (v) => !Number.isNaN(new Date(v).getTime()),
    "startTime düzgün ISO tarix olmalıdır",
  ),
  patientName: z.string().trim().min(2, "Ad ən azı 2 simvol olmalıdır").max(100),
  patientPhone: z
    .string()
    .regex(/^\+994[0-9]{9}$/, "Telefon nömrəsi +994XXXXXXXXX formatında olmalıdır"),
  reminderOptIn: z.boolean().optional(),
});

interface CreatedBookingResponse {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  patientName: string;
  patientPhone: string;
  service: { id: string; name: string };
  doctor: { id: string; name: string };
  whatsapp: { sent: boolean; skipped: boolean; error?: string };
}

class BookingConflictError extends Error {
  constructor() {
    super("Bu vaxt artıq tutulub");
    this.name = "BookingConflictError";
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<CreatedBookingResponse>>> {
  try {
    const json: unknown = await req.json().catch(() => null);
    const parsed = bookingSchema.safeParse(json);

    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Yanlış məlumat";
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const body = parsed.data;
    const clinic = await getClinicBySlug(body.clinicSlug ?? getDefaultClinicSlug());

    const startUtc = new Date(body.startTime);
    if (startUtc.getTime() < Date.now()) {
      return NextResponse.json({ error: "Keçmiş vaxta görüş ala bilməzsiniz" }, { status: 400 });
    }

    // Transaction: re-check overlap, then create appointment + notification log atomically.
    const created = await prisma.$transaction(async (tx) => {
      const [doctor, service] = await Promise.all([
        tx.doctor.findFirst({ where: { id: body.doctorId, clinicId: clinic.id } }),
        tx.service.findFirst({ where: { id: body.serviceId, clinicId: clinic.id } }),
      ]);

      if (!doctor || !service) {
        throw new NotFoundError("Həkim və ya xidmət tapılmadı");
      }

      const endUtc = new Date(startUtc.getTime() + service.durationMinutes * 60_000);

      const overlap = await tx.appointment.findFirst({
        where: {
          clinicId: clinic.id,
          doctorId: doctor.id,
          status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
          startTime: { lt: endUtc },
          endTime: { gt: startUtc },
        },
        select: { id: true },
      });

      if (overlap) {
        throw new BookingConflictError();
      }

      const appointment = await tx.appointment.create({
        data: {
          clinicId: clinic.id,
          doctorId: doctor.id,
          serviceId: service.id,
          patientName: body.patientName.trim(),
          patientPhone: body.patientPhone,
          startTime: startUtc,
          endTime: endUtc,
          status: "PENDING",
          priceAtBooking: service.price,
        },
        include: {
          doctor: { select: { id: true, name: true } },
          service: { select: { id: true, name: true } },
        },
      });

      const messageText = WA_MESSAGES.bookingConfirmation({
        patientName: appointment.patientName,
        serviceName: appointment.service.name,
        doctorName: appointment.doctor.name,
        dateTime: formatDateTimeBaku(appointment.startTime),
      });

      return { appointment, messageText };
    });

    // Send WhatsApp confirmation OUTSIDE the transaction so a slow/failed
    // network call doesn't hold a DB lock or roll back the booking.
    // sendAndLog creates the NotificationLog row in its final state.
    const { send: sendResult } = await sendAndLog({
      appointmentId: created.appointment.id,
      type: "BOOKING_CONFIRMATION",
      phone: created.appointment.patientPhone,
      message: created.messageText,
      buttons: WA_BUTTONS.confirmCancel,
    });

    const responseBody: CreatedBookingResponse = {
      id: created.appointment.id,
      startTime: created.appointment.startTime.toISOString(),
      endTime: created.appointment.endTime.toISOString(),
      status: created.appointment.status,
      patientName: created.appointment.patientName,
      patientPhone: created.appointment.patientPhone,
      service: created.appointment.service,
      doctor: created.appointment.doctor,
      whatsapp: {
        sent: sendResult.success && !sendResult.skipped,
        skipped: sendResult.skipped === true,
        ...(sendResult.error ? { error: sendResult.error } : {}),
      },
    };

    return NextResponse.json({ data: responseBody }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof BookingConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("[POST /api/booking] prisma error", err.code, err.message);
      return NextResponse.json({ error: "Verilənlər bazası xətası" }, { status: 500 });
    }
    const message = err instanceof Error ? err.message : "Naməlum xəta";
    console.error("[POST /api/booking]", message);
    return NextResponse.json({ error: message || "Görüş yaradıla bilmədi" }, { status: 500 });
  }
}
