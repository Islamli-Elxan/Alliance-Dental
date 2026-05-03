/**
 * Standalone tests for the slot generation engine.
 * Run with:
 *   npx dotenv-cli -e .env.local -- tsx src/lib/slots.test.ts
 *
 * Each test prints PASS or FAIL with details. Process exits with code 1
 * if any test fails so it can be wired into CI later.
 */

import { fromZonedTime } from "date-fns-tz";
import { generateAvailableSlots, clinicDateFromIsoDateString } from "./slots";
import type { AvailabilityRules } from "@/types";
import type {
  SlotGeneratorDoctor,
  SlotGeneratorService,
  SlotGeneratorExistingAppointment,
} from "./slots";

const TZ = "Asia/Baku";

const DR_ALI_AVAILABILITY: AvailabilityRules = {
  workDays: [1, 2, 3, 4, 5], // Mon-Fri
  startTime: "09:00",
  endTime: "18:00",
  breakStart: "13:00",
  breakEnd: "14:00",
};

const DR_ALI: SlotGeneratorDoctor = {
  id: "doc-ali",
  availabilityRules: DR_ALI_AVAILABILITY,
};

const SERVICE_30MIN: SlotGeneratorService = { durationMinutes: 30 };
const SERVICE_60MIN: SlotGeneratorService = { durationMinutes: 60 };

// Anchor "now" far in the past so all slots from May 2026 onward are in the future
const FAR_PAST_NOW = new Date("2020-01-01T00:00:00.000Z");

// A known Monday in clinic-local time
const MONDAY_DATE_STR = "2026-05-04"; // Monday, May 4 2026
const SUNDAY_DATE_STR = "2026-05-03"; // Sunday, May 3 2026

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`PASS  ${name}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, message });
    console.log(`FAIL  ${name}`);
    console.log(`      ${message}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message} (expected: ${String(expected)}, actual: ${String(actual)})`);
  }
}

// ---------------------------------------------------------------------------
// Test 1: Normal work day — slots are generated correctly
// ---------------------------------------------------------------------------
test("1. Normal iş günü — boş slotlar düzgün generasiya olunur", () => {
  const date = clinicDateFromIsoDateString(MONDAY_DATE_STR, TZ);

  const slots = generateAvailableSlots({
    doctor: DR_ALI,
    service: SERVICE_30MIN,
    date,
    timezone: TZ,
    existingAppointments: [],
    now: FAR_PAST_NOW,
  });

  assert(slots.length > 0, "expected at least one slot");

  // First slot must be at 09:00 in clinic time
  const first = slots[0];
  assert(first !== undefined, "first slot must exist");
  assertEqual(first.displayTime, "09:00", "first slot displayTime");
  assertEqual(first.available, true, "first slot must be available");

  // All slots within 09:00–18:00, none before, none after the working window
  for (const s of slots) {
    const [hStr] = s.displayTime.split(":");
    const h = Number.parseInt(hStr ?? "", 10);
    assert(h >= 9 && h < 18, `slot ${s.displayTime} outside 09:00-18:00`);
  }

  // Last slot's endTime should be <= 18:00 in clinic time
  const last = slots[slots.length - 1];
  assert(last !== undefined, "last slot must exist");
  // Convert 18:00 clinic time to UTC for comparison
  const clinicEndUtc = fromZonedTime(`${MONDAY_DATE_STR}T18:00:00`, TZ);
  assert(
    new Date(last.endTime).getTime() <= clinicEndUtc.getTime(),
    `last slot ends after 18:00 clinic time (last endTime: ${last.endTime})`,
  );
});

// ---------------------------------------------------------------------------
// Test 2: No slot during break (13:00–14:00)
// ---------------------------------------------------------------------------
test("2. Break vaxtında (13:00-14:00) slot olmamalıdır", () => {
  const date = clinicDateFromIsoDateString(MONDAY_DATE_STR, TZ);

  const slots = generateAvailableSlots({
    doctor: DR_ALI,
    service: SERVICE_30MIN,
    date,
    timezone: TZ,
    existingAppointments: [],
    now: FAR_PAST_NOW,
  });

  // No slot may overlap the 13:00-14:00 break.
  // For a 30-minute service: 13:00 (inside break) and 13:30 (inside break) are forbidden.
  // 12:30 ends at 13:00 (touches but does not overlap) — must remain available.
  const forbidden = ["13:00", "13:30"];
  for (const time of forbidden) {
    const found = slots.find((s) => s.displayTime === time);
    assert(!found, `slot ${time} should not exist (overlaps break)`);
  }

  // 12:00 should exist (ends at 12:30 — well before break)
  const noon = slots.find((s) => s.displayTime === "12:00");
  assert(noon !== undefined, "expected slot at 12:00");

  // 12:30 should exist (ends exactly at 13:00 — touches break edge, no overlap)
  const noonHalf = slots.find((s) => s.displayTime === "12:30");
  assert(noonHalf !== undefined, "expected slot at 12:30 (touches break edge, no overlap)");

  // 14:00 should exist (right after break)
  const afterBreak = slots.find((s) => s.displayTime === "14:00");
  assert(afterBreak !== undefined, "expected slot at 14:00");

  // For a 60-min service, 12:30 WOULD overlap break (12:30-13:30) and must be excluded
  const longSlots = generateAvailableSlots({
    doctor: DR_ALI,
    service: SERVICE_60MIN,
    date,
    timezone: TZ,
    existingAppointments: [],
    now: FAR_PAST_NOW,
  });
  const longNoonHalf = longSlots.find((s) => s.displayTime === "12:30");
  assert(!longNoonHalf, "60-min slot at 12:30 must not exist (overlaps break)");
});

// ---------------------------------------------------------------------------
// Test 3: Existing appointment marks overlapping slot as unavailable
// ---------------------------------------------------------------------------
test("3. Artıq tutulmuş slot available: false olmalıdır", () => {
  const date = clinicDateFromIsoDateString(MONDAY_DATE_STR, TZ);

  // Existing 60-min appointment: 10:00-11:00 clinic time
  const occupiedStart = fromZonedTime(`${MONDAY_DATE_STR}T10:00:00`, TZ);
  const occupiedEnd = fromZonedTime(`${MONDAY_DATE_STR}T11:00:00`, TZ);

  const existing: SlotGeneratorExistingAppointment[] = [
    { startTime: occupiedStart, endTime: occupiedEnd },
  ];

  const slots = generateAvailableSlots({
    doctor: DR_ALI,
    service: SERVICE_30MIN,
    date,
    timezone: TZ,
    existingAppointments: existing,
    now: FAR_PAST_NOW,
  });

  // 10:00 and 10:30 must both be unavailable (overlap with 10:00-11:00)
  const tenAm = slots.find((s) => s.displayTime === "10:00");
  const tenThirty = slots.find((s) => s.displayTime === "10:30");
  assert(tenAm !== undefined, "10:00 slot must exist");
  assert(tenThirty !== undefined, "10:30 slot must exist");
  assertEqual(tenAm.available, false, "10:00 must be unavailable");
  assertEqual(tenThirty.available, false, "10:30 must be unavailable");

  // 09:30 (ends at 10:00) does NOT overlap an appointment starting at 10:00 — must remain available
  const nineThirty = slots.find((s) => s.displayTime === "09:30");
  assert(nineThirty !== undefined, "09:30 slot must exist");
  assertEqual(nineThirty.available, true, "09:30 must remain available");

  // 11:00 (starts exactly when appointment ends) — no overlap, must be available
  const eleven = slots.find((s) => s.displayTime === "11:00");
  assert(eleven !== undefined, "11:00 slot must exist");
  assertEqual(eleven.available, true, "11:00 must be available");
});

// ---------------------------------------------------------------------------
// Test 4: No slots on a non-work day (Sunday for Dr. Əli)
// ---------------------------------------------------------------------------
test("4. İstirahət günündə (Dr. Əli — bazar) heç bir slot olmamalıdır", () => {
  const date = clinicDateFromIsoDateString(SUNDAY_DATE_STR, TZ);

  const slots = generateAvailableSlots({
    doctor: DR_ALI,
    service: SERVICE_60MIN,
    date,
    timezone: TZ,
    existingAppointments: [],
    now: FAR_PAST_NOW,
  });

  assertEqual(slots.length, 0, "Sunday should produce zero slots");
});

// ---------------------------------------------------------------------------
// Test 5: No slots in the past
// ---------------------------------------------------------------------------
test("5. Keçmiş tarixdə slot olmamalıdır", () => {
  const date = clinicDateFromIsoDateString(MONDAY_DATE_STR, TZ);

  // Pretend "now" is 15:00 clinic time on the same Monday
  const now = fromZonedTime(`${MONDAY_DATE_STR}T15:00:00`, TZ);

  const slots = generateAvailableSlots({
    doctor: DR_ALI,
    service: SERVICE_30MIN,
    date,
    timezone: TZ,
    existingAppointments: [],
    now,
  });

  // No slot should start before 15:00
  for (const s of slots) {
    assert(
      new Date(s.startTime).getTime() >= now.getTime(),
      `slot ${s.displayTime} starts in the past relative to now=15:00`,
    );
  }

  // Specifically, none of these should appear
  for (const past of ["09:00", "10:00", "11:00", "12:00", "14:00", "14:30"]) {
    const found = slots.find((s) => s.displayTime === past);
    assert(!found, `past slot ${past} should not appear`);
  }

  // 15:00 must be present (not strictly past)
  const threePm = slots.find((s) => s.displayTime === "15:00");
  assert(threePm !== undefined, "15:00 slot must exist");
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const failed = results.filter((r) => !r.passed).length;
const passed = results.length - failed;

console.log("");
console.log(`Total: ${results.length}  Passed: ${passed}  Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
