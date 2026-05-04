"use client";

import { useState, useCallback } from "react";
import { Step1Service } from "./Step1Service";
import { Step2Doctor } from "./Step2Doctor";
import { Step3Confirm } from "./Step3Confirm";
import { BookingSuccess } from "./BookingSuccess";
import { WizardStepper } from "./WizardStepper";
import type { ServiceDto, DoctorDto, TimeSlotDto, BookingResultDto } from "./types";

type Step = 1 | 2 | 3 | 4;

interface WizardState {
  step: Step;
  service: ServiceDto | null;
  doctor: DoctorDto | null;
  date: string | null; // YYYY-MM-DD in clinic timezone
  slot: TimeSlotDto | null;
  patientName: string;
  patientPhone: string;
  reminderOptIn: boolean;
  result: BookingResultDto | null;
}

const INITIAL_STATE: WizardState = {
  step: 1,
  service: null,
  doctor: null,
  date: null,
  slot: null,
  patientName: "",
  patientPhone: "",
  reminderOptIn: true,
  result: null,
};

export function BookingWizard({
  onComplete,
}: {
  onComplete?: () => void;
} = {}) {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  const goTo = useCallback((step: Step) => setState((s) => ({ ...s, step })), []);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const handleServiceSelect = useCallback((service: ServiceDto) => {
    setState((s) => ({
      ...s,
      service,
      // Reset downstream choices if service changed
      doctor: s.service?.id === service.id ? s.doctor : null,
      slot: s.service?.id === service.id ? s.slot : null,
    }));
  }, []);

  const handleDoctorSlotSelect = useCallback(
    (doctor: DoctorDto, date: string, slot: TimeSlotDto) => {
      setState((s) => ({ ...s, doctor, date, slot }));
    },
    [],
  );

  const handleSuccess = useCallback((result: BookingResultDto) => {
    setState((s) => ({ ...s, result, step: 4 }));
  }, []);

  return (
    <div className="rounded-xl border border-brand-gray-border bg-white p-6 shadow-card md:p-8">
      <WizardStepper current={state.step} />

      <div className="mt-6">
        {state.step === 1 && (
          <Step1Service
            selectedServiceId={state.service?.id ?? null}
            onSelect={handleServiceSelect}
            onNext={() => goTo(2)}
          />
        )}

        {state.step === 2 && state.service && (
          <Step2Doctor
            service={state.service}
            selected={
              state.doctor && state.date && state.slot
                ? { doctor: state.doctor, date: state.date, slot: state.slot }
                : null
            }
            onSelect={handleDoctorSlotSelect}
            onBack={() => goTo(1)}
            onNext={() => goTo(3)}
          />
        )}

        {state.step === 3 && state.service && state.doctor && state.slot && (
          <Step3Confirm
            service={state.service}
            doctor={state.doctor}
            slot={state.slot}
            patientName={state.patientName}
            patientPhone={state.patientPhone}
            reminderOptIn={state.reminderOptIn}
            onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
            onBack={() => goTo(2)}
            onSuccess={handleSuccess}
          />
        )}

        {state.step === 4 && state.result && (
          <BookingSuccess result={state.result} onReset={reset} onComplete={onComplete} />
        )}
      </div>
    </div>
  );
}
