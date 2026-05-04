"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Settings, Clock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import type { AdminServiceDto } from "@/app/api/admin/services/route";

const ICON_OPTIONS = [
  { value: "sparkles", label: "✨ Ağardılma" },
  { value: "zap", label: "⚡ İmplant" },
  { value: "stethoscope", label: "🩺 Konsultasiya" },
  { value: "heart-pulse", label: "❤️ Müalicə" },
  { value: "shield-check", label: "🛡️ Profilaktika" },
];

interface FormState {
  name: string;
  description: string;
  price: string;
  durationMinutes: string;
  iconName: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  durationMinutes: "30",
  iconName: "heart-pulse",
};

export function ServicesClient() {
  const toast = useToast();
  const [services, setServices] = useState<AdminServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminServiceDto | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminServiceDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      const json = await res.json() as { data?: AdminServiceDto[] };
      if (json.data) setServices(json.data);
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

  function openEdit(s: AdminServiceDto) {
    setEditTarget(s);
    setForm({
      name: s.name,
      description: s.description ?? "",
      price: s.price,
      durationMinutes: s.durationMinutes.toString(),
      iconName: s.iconName ?? "heart-pulse",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const price = parseFloat(form.price);
    const dur = parseInt(form.durationMinutes, 10);
    if (!form.name.trim()) { toast.error("Xidmət adı mütləqdir"); return; }
    if (isNaN(price) || price <= 0) { toast.error("Düzgün qiymət daxil edin"); return; }
    if (isNaN(dur) || dur < 5) { toast.error("Müddəti 5+ dəqiqə olmalıdır"); return; }

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        durationMinutes: dur,
        iconName: form.iconName || null,
      };
      const url = editTarget ? `/api/admin/services/${editTarget.id}` : "/api/admin/services";
      const method = editTarget ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { toast.error(json.error ?? "Xəta baş verdi"); return; }
      toast.success(editTarget ? "Xidmət yeniləndi" : "Xidmət əlavə edildi");
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
      const res = await fetch(`/api/admin/services/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json() as { error?: string };
      if (!res.ok) { toast.error(json.error ?? "Silinmədi"); return; }
      toast.success("Xidmət silindi");
      setDeleteTarget(null);
      void load();
    } finally {
      setDeleting(false);
    }
  }

  const totalRevenue = services.reduce(
    (sum, s) => sum + parseFloat(s.price) * s.appointmentCount,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-brand-navy">Xidmətlər</h1>
          <p className="mt-0.5 text-sm text-brand-slate/60">
            {services.length} xidmət · Potensial gəlir: {totalRevenue.toFixed(0)} ₼
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-cyan-dark"
        >
          <Plus className="h-4 w-4" />
          Xidmət əlavə et
        </button>
      </div>

      {loading ? (
        <ServicesSkeleton />
      ) : services.length === 0 ? (
        <EmptyState
          icon={<Settings className="h-6 w-6" />}
          title="Xidmət qeydiyyat yoxdur"
          description="İlk xidməti əlavə etmək üçün düyməni basın."
          action={
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-white hover:bg-brand-cyan-dark"
            >
              <Plus className="h-4 w-4" /> Xidmət əlavə et
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-brand-gray-border bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-gray-border bg-brand-gray-light">
                <th className="px-4 py-3 text-left font-medium text-brand-slate/70">Xidmət</th>
                <th className="hidden px-4 py-3 text-left font-medium text-brand-slate/70 sm:table-cell">Müddət</th>
                <th className="px-4 py-3 text-right font-medium text-brand-slate/70">Qiymət</th>
                <th className="hidden px-4 py-3 text-right font-medium text-brand-slate/70 md:table-cell">Görüşlər</th>
                <th className="px-4 py-3 text-right font-medium text-brand-slate/70">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gray-border">
              {services.map((s) => (
                <tr key={s.id} className="group hover:bg-brand-gray-light/50">
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-brand-navy">{s.name}</div>
                    {s.description && (
                      <div className="text-xs text-brand-slate/60 line-clamp-1">{s.description}</div>
                    )}
                  </td>
                  <td className="hidden px-4 py-3.5 sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-brand-slate/70">
                      <Clock className="h-3 w-3" />
                      {s.durationMinutes} dəq
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-brand-cyan">
                    {parseFloat(s.price).toFixed(0)} ₼
                  </td>
                  <td className="hidden px-4 py-3.5 text-right text-brand-slate/70 md:table-cell">
                    {s.appointmentCount}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        className="rounded-lg p-1.5 text-brand-slate/40 transition-colors hover:bg-brand-gray-light hover:text-brand-navy"
                        title="Redaktə et"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(s)}
                        className="rounded-lg p-1.5 text-brand-slate/40 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Xidməti redaktə et" : "Yeni xidmət"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">Xidmət adı *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Diş ağardılması"
              className="w-full rounded-lg border border-brand-gray-border px-3 py-2.5 text-sm focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">Təsvir</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Qısa açıqlama..."
              rows={2}
              className="w-full rounded-lg border border-brand-gray-border px-3 py-2.5 text-sm focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">Qiymət (₼) *</label>
              <input
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                type="number"
                min="0"
                step="0.01"
                placeholder="150"
                className="w-full rounded-lg border border-brand-gray-border px-3 py-2.5 text-sm focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">Müddət (dəq) *</label>
              <input
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                type="number"
                min="5"
                step="5"
                placeholder="60"
                className="w-full rounded-lg border border-brand-gray-border px-3 py-2.5 text-sm focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">İkon</label>
            <select
              value={form.iconName}
              onChange={(e) => setForm((f) => ({ ...f, iconName: e.target.value }))}
              className="w-full rounded-lg border border-brand-gray-border px-3 py-2.5 text-sm focus:border-brand-cyan focus:outline-none"
            >
              {ICON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
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
        title="Xidməti sil"
        size="sm"
      >
        <p className="text-sm text-brand-slate">
          <strong>{deleteTarget?.name}</strong> xidmətini silmək istədiyinizə əminsiniz?
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

function ServicesSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-brand-gray-border bg-white shadow-card">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-brand-gray-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <tr key={i}>
              <td className="px-4 py-3.5">
                <div className="h-4 w-40 animate-pulse rounded bg-brand-gray-light" />
                <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-brand-gray-light" />
              </td>
              <td className="hidden px-4 py-3.5 sm:table-cell">
                <div className="h-4 w-16 animate-pulse rounded bg-brand-gray-light" />
              </td>
              <td className="px-4 py-3.5 text-right">
                <div className="ml-auto h-4 w-12 animate-pulse rounded bg-brand-gray-light" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
