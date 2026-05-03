import type { AvailabilityRules } from "@/types";

export interface ServiceDto {
  id: string;
  name: string;
  description: string | null;
  price: string;
  durationMinutes: number;
  iconName: string | null;
}

export interface DoctorDto {
  id: string;
  name: string;
  specialty: string;
  photoUrl: string | null;
  availabilityRules: AvailabilityRules;
}

export interface TimeSlotDto {
  startTime: string;
  endTime: string;
  displayTime: string;
  available: boolean;
}

export interface BookingResultDto {
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
