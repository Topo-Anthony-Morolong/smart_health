import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Patient, VitalRecord, Alert } from '@/lib/api';
import { Activity, AlertTriangle, Bot, Loader2, Heart, ArrowRight, Bell, TrendingUp, TrendingDown, Minus, Plus, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const RISK = {
    High: { badge: 'bg-red-100 text-red-700 border-red-200', bar: 'bg-red-500', label: 'High Risk', icon: TrendingUp },
    Moderate: { badge: 'bg-amber-100 text-amber-700 border-amber-200', bar: 'bg-amber-400', label: 'Moderate Risk', icon: Minus },
    Low: { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500', label: 'Low Risk', icon: TrendingDown },
};

export function MyDashboard() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [history, setHistory] = useState<VitalRecord[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [acking, setAcking] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!id) return;
        Promise.all([
            api.getPatient(id),
            api.getVitalsHistory(id, 5),
            api.getPatientAlerts(id, true), // unacknowledged only
        ]).then(([pt, hx, al]) => { setPatient(pt); setHistory(hx); setAlerts(al); })
            .catch(() => navigate('/'))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    const handleAck = async (alertId: string) => {
        setAcking(p => new Set(p).add(alertId));
        try {
            await api.acknowledgeAlert(alertId);
            setAlerts(p => p.filter(a => a.id !== alertId));
        } finally {
            setAcking(p => { const s = new Set(p); s.delete(alertId); return s; });
        }
    };

    if (loading) return <div className="flex items-center justify-center h-80"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
    if (!patient) return null;

    const latest = history[0];
    const riskLevel = (latest?.risk_level as keyof typeof RISK) || 'Low';
    const cfg = RISK[riskLevel] ?? RISK.Low;
    const TrendIcon = cfg.icon;
    const age = patient.age;

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
            {/* Greeting */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-400">Welcome back,</p>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">{patient.name}</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {patient.medical_history && <span className="truncate max-w-xs block">{patient.medical_history.slice(0, 60)}{patient.medical_history.length > 60 ? '…' : ''}</span>}
                        Age {age} · {patient.gender}
                        {patient.contact && <> · {patient.contact}</>}
                    </p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-md">
                    {patient.name.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* Active Alerts Banner */}
            {alerts.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-red-700 font-bold">
                        <Bell className="h-4 w-4" /> {alerts.length} Unacknowledged Alert{alerts.length > 1 ? 's' : ''}
                    </div>
                    {alerts.map(a => (
                        <div key={a.id} className="flex items-start justify-between gap-3 bg-white rounded-xl p-3 border border-red-100">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className={`h-4 w-4 shrink-0 ${a.severity === 'Critical' ? 'text-red-500' : 'text-amber-500'}`} />
                                <p className="text-sm text-slate-700 leading-snug">{a.message}</p>
                            </div>
                            <button onClick={() => handleAck(a.id)} disabled={acking.has(a.id)}
                                className="shrink-0 px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center gap-1">
                                {acking.has(a.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                OK
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Latest Risk Card */}
            <div className={`rounded-3xl border-2 p-6 relative overflow-hidden ${riskLevel === 'High' ? 'border-red-200 bg-red-50/60' : riskLevel === 'Moderate' ? 'border-amber-200 bg-amber-50/60' : 'border-emerald-200 bg-emerald-50/60'
                }`}>
                <div className="absolute right-6 top-6 opacity-10">
                    <Heart className={`h-28 w-28 ${riskLevel === 'High' ? 'text-red-600' : riskLevel === 'Moderate' ? 'text-amber-500' : 'text-emerald-600'}`} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Your Latest Risk Assessment</p>
                {latest ? (
                    <>
                        <div className="flex items-center gap-3 mb-3">
                            <TrendIcon className={`h-7 w-7 ${riskLevel === 'High' ? 'text-red-600' : riskLevel === 'Moderate' ? 'text-amber-600' : 'text-emerald-600'}`} />
                            <span className={`text-4xl font-extrabold ${riskLevel === 'High' ? 'text-red-700' : riskLevel === 'Moderate' ? 'text-amber-700' : 'text-emerald-700'}`}>{cfg.label}</span>
                        </div>
                        {/* Score bar */}
                        <div className="mb-3">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Risk Score</span><span className="font-bold">{latest.risk_score.toFixed(0)} / 100</span>
                            </div>
                            <div className="h-3 bg-white/70 rounded-full overflow-hidden border border-slate-200">
                                <div className={`h-full ${cfg.bar} rounded-full transition-all duration-700`} style={{ width: `${Math.min(latest.risk_score, 100)}%` }} />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">Recorded {format(parseISO(latest.recorded_at), 'MMM d, yyyy · HH:mm')}</p>
                    </>
                ) : (
                    <div className="flex items-center gap-3">
                        <p className="text-slate-500 text-base">No readings yet. Log your first vitals to see your risk score.</p>
                    </div>
                )}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
                <ActionCard
                    icon={Activity}
                    label="Log New Vitals"
                    sub="Get updated risk score"
                    onClick={() => navigate(`/log-vitals/${id}`)}
                    gradient="from-blue-600 to-teal-500"
                />
                <ActionCard
                    icon={Bot}
                    label="Ask Assistant"
                    sub="Health questions answered"
                    onClick={() => navigate('/assistant')}
                    gradient="from-purple-600 to-blue-500"
                />
            </div>

            {/* Vitals History */}
            {history.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-700">Recent Readings</h2>
                        <button onClick={() => navigate(`/analytics/${id}`)} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                            View Analytics <ArrowRight className="h-3 w-3" />
                        </button>
                    </div>
                    <ul className="divide-y divide-slate-50">
                        {history.map(r => {
                            const lvl = (r.risk_level as keyof typeof RISK) || 'Low';
                            const c = RISK[lvl];
                            return (
                                <li key={r.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center border text-xs font-bold ${c.badge}`}>
                                            {r.risk_score.toFixed(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">{format(parseISO(r.recorded_at), 'MMM d, yyyy')}</p>
                                            <p className="text-sm font-medium text-slate-700">HR {r.heart_rate} · BP {r.blood_pressure_systolic}/{r.blood_pressure_diastolic} · SpO₂ {r.oxygen_saturation}%</p>
                                        </div>
                                    </div>
                                    <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${c.badge}`}>{lvl}</span>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="px-5 py-3 border-t border-slate-50">
                        <button onClick={() => navigate(`/log-vitals/${id}`)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                            <Plus className="h-4 w-4" /> Log New Reading
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ActionCard({ icon: Icon, label, sub, onClick, gradient }: { icon: React.ElementType; label: string; sub: string; onClick: () => void; gradient: string }) {
    return (
        <button onClick={onClick}
            className={`relative overflow-hidden bg-gradient-to-br ${gradient} text-white rounded-2xl p-5 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all text-left`}>
            <Icon className="h-6 w-6 mb-3 opacity-90" />
            <p className="font-bold text-base leading-tight">{label}</p>
            <p className="text-xs opacity-70 mt-0.5">{sub}</p>
            <ArrowRight className="absolute right-4 bottom-4 h-4 w-4 opacity-50" />
        </button>
    );
}
