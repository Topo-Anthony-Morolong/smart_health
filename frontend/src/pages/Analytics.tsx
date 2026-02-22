import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, AnalyticsResult } from "@/lib/api";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  AlertTriangle,
  BarChart2,
  Activity,
} from "lucide-react";

function RingChart({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 100 100" width="90" height="90">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text
          x="50"
          y="54"
          textAnchor="middle"
          fontSize="18"
          fontWeight="700"
          fill="#1e293b"
        >
          {value}
        </text>
      </svg>
      <p className="text-xs font-semibold text-slate-500 text-center">
        {label}
      </p>
    </div>
  );
}

export function Analytics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getAnalytics(id)
      .then(setData)
      .catch(() => setError("Could not compute analytics for this patient."))
      .finally(() => setLoading(false));
  }, [id]);

  const trendIcon =
    data?.trend_direction === "Improving" ? (
      <TrendingDown className="h-5 w-5 text-emerald-600" />
    ) : data?.trend_direction === "Worsening" ? (
      <TrendingUp className="h-5 w-5 text-red-600" />
    ) : (
      <Minus className="h-5 w-5 text-slate-400" />
    );

  const trendColor =
    data?.trend_direction === "Improving"
      ? "text-emerald-700"
      : data?.trend_direction === "Worsening"
        ? "text-red-700"
        : "text-slate-600";

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  if (error || !data)
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-2" />
          <p className="text-red-700 font-medium">
            {error || "No analytics available."}
          </p>
        </div>
      </div>
    );

  const total = data.total_readings;
  const dist = data.risk_distribution;
  const avgs = data.averages;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 bg-slate-50 min-h-full">
      <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
        <button
          onClick={() => navigate(-1)}
          title="Go back"
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart2 className="h-7 w-7 text-blue-600" /> Patient Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Trend analysis based on the last {total} vital reading
            {total !== 1 ? "s" : ""}.
          </p>
        </div>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Activity className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            No vital readings recorded yet. Submit readings to see analytics.
          </p>
        </div>
      ) : (
        <>
          {/* Risk Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-teal-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              Risk Distribution
            </h2>
            <div className="flex justify-around flex-wrap gap-6">
              <RingChart
                value={dist.low}
                max={total}
                color="#10b981"
                label="Low Risk"
              />
              <RingChart
                value={dist.medium}
                max={total}
                color="#f59e0b"
                label="Moderate Risk"
              />
              <RingChart
                value={dist.high}
                max={total}
                color="#ef4444"
                label="High Risk"
              />
            </div>
            <p className="text-center text-xs text-slate-400 mt-4">
              Based on {total} reading{total !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Trend Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`bg-white rounded-2xl border shadow-sm p-5 ${data.deteriorating ? "border-red-200 bg-red-50/30" : "border-slate-200"}`}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Health Trajectory
              </p>
              <div className="flex items-center gap-3">
                {trendIcon}
                <span className={`text-2xl font-extrabold ${trendColor}`}>
                  {data.trend_direction}
                </span>
              </div>
              {data.deteriorating && (
                <div className="mt-3 flex items-center gap-2 text-sm text-red-600 font-medium">
                  <AlertTriangle className="h-4 w-4" /> Deterioration flag
                  active — review recent readings.
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Latest Risk Level
              </p>
              <span
                className={`text-2xl font-extrabold ${data.latest_risk_level === "high" ? "text-red-600" : data.latest_risk_level === "medium" ? "text-amber-600" : "text-emerald-600"}`}
              >
                {data.latest_risk_level ?? "N/A"}
              </span>
            </div>
          </div>

          {/* Averages Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5">
              Clinical Averages
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Systolic BP",
                  value: avgs.blood_pressure_systolic,
                  unit: "mmHg",
                },
                {
                  label: "Diastolic BP",
                  value: avgs.blood_pressure_diastolic,
                  unit: "mmHg",
                },
                { label: "Heart Rate", value: avgs.heart_rate, unit: "bpm" },
                { label: "Temperature", value: avgs.temperature, unit: "°C" },
                { label: "SpO₂", value: avgs.oxygen_saturation, unit: "%" },
                { label: "Risk Score", value: avgs.risk_score, unit: "/100" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="bg-slate-50 rounded-xl p-4 border border-slate-100"
                >
                  <p className="text-xs text-slate-400 font-medium mb-1">
                    {m.label}
                  </p>
                  <p className="text-xl font-bold text-slate-900">
                    {m.value !== null ? m.value.toFixed(1) : "–"}
                    <span className="text-xs text-slate-400 font-normal ml-1">
                      {m.unit}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
