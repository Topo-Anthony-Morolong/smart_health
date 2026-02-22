import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { VitalRecord } from '@/lib/api';
import { Heart, Home, RotateCcw, Bot, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';

type LocationState = {
    result?: VitalRecord & { recommendations: string[]; alert_triggered: boolean };
    patient?: { name: string };
};

const RISK_CONFIG = {
    High: { bg: 'from-red-500 to-rose-600', badge: 'bg-red-100 text-red-800 border-red-200', bar: 'bg-red-500', icon: TrendingUp, msg: 'Your readings indicate elevated cardiovascular risk. Please review your recommendations carefully and consider seeking medical advice.' },
    Moderate: { bg: 'from-amber-400 to-orange-500', badge: 'bg-amber-100 text-amber-800 border-amber-200', bar: 'bg-amber-400', icon: Minus, msg: 'Your readings show moderate risk. Lifestyle improvements like diet, exercise, and regular check-ups can help.' },
    Low: { bg: 'from-emerald-500 to-teal-500', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', bar: 'bg-emerald-500', icon: TrendingDown, msg: 'Great news! Your readings are in a healthy range. Keep up your good habits and continue monitoring regularly.' },
};

export function RiskResult() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { result, patient } = (location.state as LocationState) || {};

    if (!result) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50 text-center px-6">
                <p className="text-slate-500 text-lg">No result data found.</p>
                <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                    Go Home
                </button>
            </div>
        );
    }

    const level = (result.risk_level as keyof typeof RISK_CONFIG) || 'Low';
    const cfg = RISK_CONFIG[level];
    const Icon = cfg.icon;
    const score = result.risk_score ?? 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pb-16">
            {/* Hero band */}
            <div className={`bg-gradient-to-r ${cfg.bg} px-6 py-14 text-white text-center relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10">
                    <Heart className="h-72 w-72 mx-auto mt-6" />
                </div>
                <div className="relative z-10">
                    {patient?.name && <p className="text-white/70 text-sm font-medium mb-3">Risk Assessment for {patient.name}</p>}
                    <div className="inline-flex items-center gap-3 mb-3">
                        <Icon className="h-10 w-10" />
                        <span className="text-5xl font-extrabold tracking-tight">{level} Risk</span>
                    </div>
                    <p className="text-white/80 text-sm max-w-sm mx-auto leading-relaxed">{cfg.msg}</p>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 -mt-6 space-y-5">
                {/* Score card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-slate-600">Risk Score</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold border ${cfg.badge}`}>{level}</span>
                    </div>
                    <div className="flex items-end gap-3 mb-3">
                        <span className="text-6xl font-extrabold tracking-tight text-slate-900">{score.toFixed(0)}</span>
                        <span className="text-xl text-slate-400 mb-2">/ 100</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${cfg.bar} rounded-full transition-all duration-1000`} style={{ width: `${Math.min(score, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                        <span>Low</span><span>Moderate</span><span>High</span>
                    </div>
                </div>

                {/* Alert triggered notice */}
                {result.alert_triggered && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-800 font-bold text-sm">Clinical Alert Generated</p>
                            <p className="text-red-600 text-xs mt-0.5">A risk alert has been sent to your care team for review.</p>
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                {result.recommendations?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Personalised Recommendations</h2>
                        <ul className="space-y-3">
                            {result.recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                                    <p className="text-sm text-slate-700 leading-relaxed">{rec}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Readings summary */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Submitted Readings</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Heart Rate', value: `${result.heart_rate} bpm` },
                            { label: 'Blood Pressure', value: `${result.blood_pressure_systolic}/${result.blood_pressure_diastolic} mmHg` },
                            { label: 'Temperature', value: `${result.temperature} °C` },
                            { label: 'SpO₂', value: `${result.oxygen_saturation}%` },
                        ].map(item => (
                            <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                                <p className="font-bold text-slate-800 text-sm">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button onClick={() => navigate(`/my-health/${id}`)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 transition-colors">
                        <span className="flex items-center gap-2"><Home className="h-4 w-4" /> My Health Dashboard</span>
                        <ChevronRight className="h-4 w-4 opacity-60" />
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => navigate(`/log-vitals/${id}`)}
                            className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
                            <RotateCcw className="h-4 w-4" /> Log Again
                        </button>
                        <button onClick={() => navigate('/assistant')}
                            className="flex items-center justify-center gap-2 py-3 bg-blue-50 border border-blue-200 rounded-2xl text-sm font-semibold text-blue-700 hover:bg-blue-100">
                            <Bot className="h-4 w-4" /> Ask Assistant
                        </button>
                    </div>
                </div>
                <p className="text-center text-xs text-slate-400 pt-2">
                    <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />
                    Results are automatically saved to your health profile.
                </p>
            </div>
        </div>
    );
}
