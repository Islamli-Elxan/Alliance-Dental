export interface AvailabilityRules {
  workDays: number[]; // 1=Mon, 2=Tue, ..., 7=Sun (ISO weekday)
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  breakStart?: string;
  breakEnd?: string;
}

export interface TimeSlot {
  startTime: string; // ISO UTC string (serializable)
  endTime: string; // ISO UTC string
  displayTime: string; // "HH:mm" in clinic timezone
  available: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    pageCount: number;
  };
}

export interface BookingRequestBody {
  clinicSlug: string;
  serviceId: string;
  doctorId: string;
  startTime: string; // ISO UTC
  patientName: string;
  patientPhone: string;
  reminderOptIn?: boolean;
}

export interface KpiStats {
  monthRevenue: number;
  retentionPercent: number;
  totalAppointmentsThisMonth: number;
  totalAppointmentsLastMonth: number;
  noShowCountThisMonth: number;
}

export interface CalendarAppointment {
  id: string;
  patientName: string;
  doctorName: string;
  serviceName: string;
  startTime: string; // ISO UTC
  endTime: string; // ISO UTC
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "NO_SHOW" | "COMPLETED";
  priceAtBooking: string;
}
