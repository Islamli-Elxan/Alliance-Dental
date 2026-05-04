"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Stethoscope, ChevronDown, ChevronUp } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import type { AdminDoctorDto } from "@/app/api/admin/doctors/route";

const DAYS = ["B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şən", "Baz"];
const DAYS_FULL = ["Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə", "Cümə axşamı", "Cümə", "Şənbə", "Bazar"];

const DEFAULT_AVAIL = {
  workDays: [1, 2, 3, 4, 5],
  startTime: "09:00",
  endTime: "18:00",
  breakStart: "13:00",
  breakEnd: "14:00",
};

interface FormState {
  name: string;
  specialty: string;
  photoUrl: string;
  availabilityRules: typeof DEFAULT_AVAIL;
}

const EMPTY_FORM: FormState = {
  name: "",
  specialty: "",
  photoUrl: "",
  availabilityRules: { ...DEFAULT_AVAIL },
};

export function DoctorsClient() {
  const toast = useToast();
  const [doctors, setDoctors] = useState<AdminDoctorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminDoctorDto | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminDoctorDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/doctors");
      const json = await res.json() as { data?: AdminDoctorDto[]; error?: string };
      if (json.data) setDoctors(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(d: AdminDoctorDto) {
    setEditTarget(d);
    setForm({
      name: d.name,
      specialty: d.specialty,
      photoUrl: d.photoUrl ?? "",
      availabilityRules: { ...d.availabilityRules },
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.specialty.trim()) {
      toast.error("Ad və ixtisas mütləqdir");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        specialty: form.specialty.trim(),
        photoUrl: form.photoUrl.trim() || null,
        availabilityRules: form.availabilityRules,
      };
      const url = editTarget ? `/api/admin/doctors/${editTarget.id}` : "/api/admin/doctors";
      const method = editTarget ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { toast.error(json.error ?? "Xəta baş verdi"); return; }
      toast.success(editTarget ? "Həkim yeniləndi" : "Həkim əlavə edildi");
      setModalOpen(false);
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/doctors/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json() as { error?: string };
      if (!res.ok) { toast.error(json.error ?? "Silinmədi"); return; }
      toast.success("Həkim silindi");
      setDeleteTarget(null);
      void load();
    } finally {
      setDeleting(false);
    }
  }

  function toggleDay(day: number) {
    setForm((f) => {
      const days = f.availabilityRules.workDays.includes(day)
        ? f.availabilityRules.workDays.filter((d) => d !== day)
        : [...f.availabilityRules.workDays, day].sort();
      return { ...f, availabilityRules: { ...f.availabilityRules, workDays: days } };
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-brand-navy">Həkimlər</h1>
          <p className="mt-0.5 text-sm text-brand-slate/60">
            {doctors.length} həkim qeydiyyatdadır
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-cyan-dark"
        >
          <Plus className="h-4 w-4" />
          Həkim əlavə et
        </button>
      </div>

      {loading ? (
        <DoctorsSkeleton />
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={<Stethoscope className="h-6 w-6" />}
          title="Həkim qeydiyyat yoxdur"
          description="İlk həkimi əlavə etmək üçün düyməni basın."
          action={
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-white hover:bg-brand-cyan-dark"
            >
              <Plus className="h-4 w-4" /> Həkim əlavə et
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d) => (
            <DoctorCard
              key={d.id}
              doctor={d}
              onEdit={() => openEdit(d)}
              onDelete={() => setDeleteTarget(d)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Həkimi redaktə et" : "Yeni həkim"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">Ad Soyad *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Dr. Əli Həsənov"
                className="w-full rounded-lg border border-brand-gray-border px-3 py-2.5 text-sm focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">İxtisas *</label>
              <input
                value={form.specialty}
                onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
                placeholder="Ortodontist"
                className="w-full rounded-lg border border-brand-gray-border px-3 py-2.5 text-sm focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">Foto URL (isteğe bağlı)</label>
            <input
              value={form.photoUrl}
              onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
              placeholder="https://..."
              type="url"
              className="w-full rounded-lg border border-brand-gray-border px-3 py-2.5 text-sm focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-2">İş günləri</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((label, i) => {
                const day = i + 1;
                const active = form.availabilityRules.workDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-brand-cyan text-white"
                        : "border border-brand-gray-border bg-white text-brand-slate hover:border-brand-cyan"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">İş başlanğıcı</label>
              <input
                type="time"
                value={form.availabilityRules.startTime}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    availabilityRules: { ...f.availabilityRules, startTime: e.target.value },
                  }))
                }
                className="w-full rounded-lg border border-brand-gray-border px-3 py-2.5 text-sm focus:border-brand-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">İş sonu</label>
              <input
                type="time"
                value={form.availabilityRules.endTime}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    availabilityRules: { ...f.availabilityRules, endTime: e.target.value },
                  }))
                }
                className="w-full rounded-lg border border-brand-gray-border px-3 py-2.5 text-sm focus:border-brand-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">Fasilə başlanğıcı</label>
              <input
                type="time"
                value={form.availabilityRules.breakStart}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    availabilityRules: { ...f.availabilityRules, breakStart: e.target.value },
                  }))
                }
                className="w-full rounded-lg border border-brand-gray-border px-3 py-2.5 text-sm focus:border-brand-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">Fasilə sonu</label>
              <input
                type="time"
                value={form.availabilityRules.breakEnd}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    availabilityRules: { ...f.availabilityRules, breakEnd: e.target.value },
                  }))
                }
                className="w-full rounded-lg border border-brand-gray-border px-3 py-2.5 text-sm focus:border-brand-cyan focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-brand-gray-border px-4 py-2 text-sm text-brand-slate hover:bg-brand-gray-light"
            >
              Ləğv et
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-white hover:bg-brand-cyan-dark disabled:opacity-60"
            >
              {saving ? "Saxlanılır..." : editTarget ? "Yenilə" : "Əlavə et"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Həkimi sil"
        size="sm"
      >
        <p className="text-sm text-brand-slate">
          <strong>{deleteTarget?.name}</strong> adlı həkimi silmək istədiyinizə əminsiniz?
          Bu əməliyyat geri qaytarıla bilməz.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="rounded-lg border border-brand-gray-border px-4 py-2 text-sm text-brand-slate hover:bg-brand-gray-light"
          >
            Ləğv et
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? "Silinir..." : "Sil"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function DoctorCard({
  doctor,
  onEdit,
  onDelete,
}: {
  doctor: AdminDoctorDto;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const initials = doctor.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const workDayLabels = doctor.availabilityRules.workDays
    .map((d) => DAYS_FULL[d - 1])
    .join(", ");

  return (
    <div className="rounded-xl border border-brand-gray-border bg-white shadow-card">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-cyan-light text-lg font-bold text-brand-cyan">
              {initials}
            </div>
            <div>
              <div className="font-medium text-brand-navy">{doctor.name}</div>
              <div className="text-sm text-brand-cyan">{doctor.specialty}</div>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="rounded-lg p-1.5 text-brand-slate/50 transition-colors hover:bg-brand-gray-light hover:text-brand-navy"
              title="Redaktə et"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg p-1.5 text-brand-slate/50 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-brand-slate/60">
          <span className="rounded-full bg-brand-gray-light px-2 py-0.5">
            {doctor.appointmentCount} görüş
          </span>
          <span>
            {doctor.availabilityRules.startTime}–{doctor.availabilityRules.endTime}
          </span>
        </div>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between border-t border-brand-gray-border px-5 py-3 text-xs text-brand-slate/50 hover:bg-brand-gray-light/50"
      >
        İş cədvəli
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="border-t border-brand-gray-border px-5 py-4 text-xs text-brand-slate/70 space-y-1.5">
          <div><span className="font-medium">Günlər:</span> {workDayLabels}</div>
          <div>
            <span className="font-medium">Fasilə:</span>{" "}
            {doctor.availabilityRules.breakStart}–{doctor.availabilityRules.breakEnd}
          </div>
        </div>
      )}
    </div>
  );
}

function DoctorsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-brand-gray-border bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-xl bg-brand-gray-light" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-brand-gray-light" />
              <div className="h-3 w-24 animate-pulse rounded bg-brand-gray-light" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
