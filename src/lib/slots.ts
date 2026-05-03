import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";
import type { AvailabilityRules, TimeSlot } from "@/types";

export interface SlotGeneratorDoctor {
  id: string;
  availabilityRules: AvailabilityRules;
}

export interface SlotGeneratorService {
  durationMinutes: number;
}

export interface SlotGeneratorExistingAppointment {
  startTime: Date;
  endTime: Date;
}

export interface SlotGeneratorInput {
  doctor: SlotGeneratorDoctor;
  service: SlotGeneratorService;
  date: Date; // Any Date — only the calendar date in `timezone` is used
  timezone: string;
  existingAppointments: SlotGeneratorExistingAppointment[];
  now?: Date; // Optional override for testing
  slotIncrementMinutes?: number; // Optional grid step; defaults to service duration
}

const SLOT_GRID_DEFAULT_MINUTES = 30;

function parseHHMM(value: string): { hours: number; minutes: number } {
  const [hStr, mStr] = value.split(":");
  const hours = Number.parseInt(hStr ?? "", 10);
  const minutes = Number.parseInt(mStr ?? "", 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    throw new Error(`Invalid HH:mm value: ${value}`);
  }
  return { hours, minutes };
}

function isoWeekdayInTimezone(date: Date, timezone: string): number {
  // date-fns format token "i" returns ISO weekday: 1=Mon ... 7=Sun
  const value = formatInTimeZone(date, timezone, "i");
  return Number.parseInt(value, 10);
}

function buildClinicLocalDate(date: Date, timezone: string): {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
} {
  const year = Number.parseInt(formatInTimeZone(date, timezone, "yyyy"), 10);
  const month = Number.parseInt(formatInTimeZone(date, timezone, "MM"), 10);
  const day = Number.parseInt(formatInTimeZone(date, timezone, "dd"), 10);
  return { year, month, day };
}

function clinicLocalDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  timezone: string,
): Date {
  // Build an ISO-style local string and let date-fns-tz interpret it in the given zone.
  const iso = `${pad4(year)}-${pad2(month)}-${pad2(day)}T${pad2(hours)}:${pad2(minutes)}:00`;
  return fromZonedTime(iso, timezone);
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function pad4(n: number): string {
  return n.toString().padStart(4, "0");
}

function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime();
}

export function generateAvailableSlots(input: SlotGeneratorInput): TimeSlot[] {
  const { doctor, service, date, timezone, existingAppointments } = input;
  const now = input.now ?? new Date();
  const rules = doctor.availabilityRules;

  if (!rules || !Array.isArray(rules.workDays) || !rules.startTime || !rules.endTime) {
    return [];
  }

  const isoDay = isoWeekdayInTimezone(date, timezone);
  if (!rules.workDays.includes(isoDay)) {
    return [];
  }

  const { year, month, day } = buildClinicLocalDate(date, timezone);
  const work = {
    start: parseHHMM(rules.startTime),
    end: parseHHMM(rules.endTime),
  };

  const breakStart = rules.breakStart ? parseHHMM(rules.breakStart) : null;
  const breakEnd = rules.breakEnd ? parseHHMM(rules.breakEnd) : null;

  const dayStartUtc = clinicLocalDateTimeToUtc(
    year,
    month,
    day,
    work.start.hours,
    work.start.minutes,
    timezone,
  );
  const dayEndUtc = clinicLocalDateTimeToUtc(
    year,
    month,
    day,
    work.end.hours,
    work.end.minutes,
    timezone,
  );
  const breakStartUtc =
    breakStart !== null
      ? clinicLocalDateTimeToUtc(year, month, day, breakStart.hours, breakStart.minutes, timezone)
      : null;
  const breakEndUtc =
    breakEnd !== null
      ? clinicLocalDateTimeToUtc(year, month, day, breakEnd.hours, breakEnd.minutes, timezone)
      : null;

  const stepMinutes =
    input.slotIncrementMinutes && input.slotIncrementMinutes > 0
      ? input.slotIncrementMinutes
      : Math.min(service.durationMinutes, SLOT_GRID_DEFAULT_MINUTES);

  const stepMs = stepMinutes * 60_000;
  const durationMs = service.durationMinutes * 60_000;

  const slots: TimeSlot[] = [];

  for (
    let slotStartMs = dayStartUtc.getTime();
    slotStartMs + durationMs <= dayEndUtc.getTime();
    slotStartMs += stepMs
  ) {
    const slotStart = new Date(slotStartMs);
    const slotEnd = new Date(slotStartMs + durationMs);

    // Skip past slots (using the optional injected `now`)
    if (slotStart.getTime() < now.getTime()) {
      continue;
    }

    // Skip slots overlapping the break window
    if (
      breakStartUtc !== null &&
      breakEndUtc !== null &&
      rangesOverlap(slotStart, slotEnd, breakStartUtc, breakEndUtc)
    ) {
      continue;
    }

    // Determine availability against existing appointments
    const conflict = existingAppointments.some((appt) =>
      rangesOverlap(slotStart, slotEnd, appt.startTime, appt.endTime),
    );

    const displayTime = formatInTimeZone(slotStart, timezone, "HH:mm");

    slots.push({
      startTime: slotStart.toISOString(),
      endTime: slotEnd.toISOString(),
      displayTime,
      available: !conflict,
    });
  }

  return slots;
}

/**
 * Convenience: build a Date that represents the start-of-day in the clinic timezone
 * for a given local YYYY-MM-DD string. Useful when the patient picks a calendar date.
 */
export function clinicDateFromIsoDateString(isoDateYYYYMMDD: string, timezone: string): Date {
  return fromZonedTime(`${isoDateYYYYMMDD}T00:00:00`, timezone);
}

/**
 * Convenience: get the local clinic-zone Date for "now". Mostly used for UI display.
 */
export function nowInClinicTimezone(timezone: string, now?: Date): Date {
  return toZonedTime(now ?? new Date(), timezone);
}
