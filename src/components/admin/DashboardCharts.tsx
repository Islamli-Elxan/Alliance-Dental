"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, PieChart as PieIcon } from "lucide-react";

interface DailyPoint {
  date: string;
  revenue: number;
  count: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
}

interface TimeseriesData {
  daily: DailyPoint[];
  statusBreakdown: StatusBreakdown[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Gözləmədə",
  CONFIRMED: "Təsdiqlənib",
  COMPLETED: "Tamamlanıb",
  CANCELLED: "Ləğv edilib",
  NO_SHOW: "Gəlməyib",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#F59E0B",
  CONFIRMED: "#00AEEF",
  COMPLETED: "#10B981",
  CANCELLED: "#EF4444",
  NO_SHOW: "#8B5CF6",
};

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}`;
}

export function DashboardCharts() {
  const [data, setData] = useState<TimeseriesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats/timeseries")
      .then((r) => r.json())
      .then((json: { data?: TimeseriesData }) => {
        if (json.data) setData(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-brand-gray-border bg-white p-6 shadow-card">
          <div className="h-64 animate-pulse rounded-lg bg-brand-gray-light" />
        </div>
        <div className="rounded-xl border border-brand-gray-border bg-white p-6 shadow-card">
          <div className="h-64 animate-pulse rounded-lg bg-brand-gray-light" />
        </div>
      </div>
    );
  }

  if (!data || (data.daily.length === 0 && data.statusBreakdown.length === 0)) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-dashed border-brand-gray-border bg-white p-8 text-center shadow-card">
          <BarChart3 className="mx-auto h-10 w-10 text-brand-slate/20" />
          <p className="mt-3 text-sm text-brand-slate/50">Bu ay üçün görüş datası yoxdur</p>
        </div>
        <div className="rounded-xl border border-dashed border-brand-gray-border bg-white p-8 text-center shadow-card">
          <PieIcon className="mx-auto h-10 w-10 text-brand-slate/20" />
          <p className="mt-3 text-sm text-brand-slate/50">Status bölgüsü yoxdur</p>
        </div>
      </div>
    );
  }

  const chartData = data.daily.map((d) => ({
    ...d,
    label: formatDateLabel(d.date),
  }));

  const pieData = data.statusBreakdown.map((s) => ({
    name: STATUS_LABELS[s.status] ?? s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? "#94A3B8",
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Revenue Area Chart */}
      <div className="lg:col-span-2 rounded-xl border border-brand-gray-border bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-brand-navy">Gəlir trendi</h3>
            <p className="text-xs text-brand-slate/50">Bu ay, gün üzrə</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-brand-slate/60">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-cyan" />
              Gəlir (₼)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-cyan/30" />
              Görüş sayı
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00AEEF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00AEEF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              axisLine={{ stroke: "#E2E8F0" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}₼`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: "12px",
              }}
              formatter={(value: unknown, name: unknown) => {
                const label = name === "revenue" ? "Gəlir" : "Görüşlər";
                const suffix = name === "revenue" ? " ₼" : "";
                return [`${value}${suffix}`, label];
              }}
              labelFormatter={(label: unknown) => `Tarix: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#00AEEF"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#00AEEF"
              strokeWidth={1}
              strokeDasharray="4 4"
              fillOpacity={0}
              fill="transparent"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Status Pie Chart */}
      <div className="rounded-xl border border-brand-gray-border bg-white p-6 shadow-card">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-brand-navy">Status bölgüsü</h3>
          <p className="text-xs text-brand-slate/50">Bu ayın görüşləri</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: "12px",
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
