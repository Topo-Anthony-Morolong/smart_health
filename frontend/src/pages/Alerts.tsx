import { useState, useEffect, useCallback, useRef } from 'react';
import { api, Alert } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, CheckCircle2, Bell, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SEV_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    Critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-500' },
    Warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-500' },
};

export function Alerts() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'unacknowledged'>('unacknowledged');
    const [acknowledging, setAcknowledging] = useState<Set<string>>(new Set());
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const navigate = useNavigate();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchAlerts = useCallback(async () => {
        try {
            const data = await api.getAllAlerts(100);
            setAlerts(filter === 'unacknowledged' ? data.filter(a => !a.acknowledged) : data);
            setError(null);
        } catch {
            setError('Failed to load alerts. Check backend connection.');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        setLoading(true);
        fetchAlerts();
        intervalRef.current = setInterval(fetchAlerts, 30_000); // poll every 30s
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [fetchAlerts]);

    const handleAcknowledge = async (alertId: string) => {
        setAcknowledging(prev => new Set(prev).add(alertId));
        try {
            await api.acknowledgeAlert(alertId);
            setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
            if (filter === 'unacknowledged') {
                setAlerts(prev => prev.filter(a => a.id !== alertId));
            }
        } catch { /* silent */ }
        finally { setAcknowledging(prev => { const s = new Set(prev); s.delete(alertId); return s; }); }
    };

    const critical = alerts.filter(a => a.severity === 'Critical' && !a.acknowledged).length;
    const warning = alerts.filter(a => a.severity === 'Warning' && !a.acknowledged).length;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6 bg-slate-50 min-h-full">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Alerts Centre</h1>
                    <p className="text-slate-500 mt-1">Real-time clinical alerts across all monitored patients.</p>
                </div>
                <button onClick={fetchAlerts} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Critical (Unack.)', value: critical, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                    { label: 'Warnings (Unack.)', value: warning, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                    { label: 'Total Loaded', value: alerts.length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                ].map(k => (
                    <div key={k.label} className={`${k.bg} border ${k.border} rounded-2xl p-5`}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{k.label}</p>
                        <p className={`text-4xl font-extrabold mt-1 ${k.color}`}>{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {(['unacknowledged', 'all'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filter === f ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                        {f === 'all' ? 'All Alerts' : 'Unacknowledged'}
                    </button>
                ))}
            </div>

            {/* Alerts List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300" />
                {loading ? (
                    <div className="py-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
                ) : error ? (
                    <div className="py-16 text-center text-red-600 font-medium">{error}</div>
                ) : alerts.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                        <Bell className="h-12 w-12 opacity-30" />
                        <p className="font-medium text-lg">All clear — no alerts at this time.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {alerts.map(alert => {
                            const cfg = SEV_CONFIG[alert.severity] ?? SEV_CONFIG.Warning;
                            const isExpanded = expandedId === alert.id;
                            return (
                                <li key={alert.id} className={`p-5 transition-colors hover:bg-slate-50/80 ${alert.acknowledged ? 'opacity-60' : ''}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-0.5 p-2 rounded-xl ${cfg.bg} border ${cfg.border}`}>
                                            <AlertTriangle className={`h-4 w-4 ${cfg.icon}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{alert.severity}</span>
                                                {alert.acknowledged && <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Acknowledged</span>}
                                                {alert.patients?.name && (
                                                    <button onClick={() => navigate(`/patients/${alert.patient_id}`)} className="text-xs text-blue-600 hover:underline font-medium">
                                                        {alert.patients.name}
                                                    </button>
                                                )}
                                                <span className="ml-auto text-xs text-slate-400 shrink-0">
                                                    {alert.created_at ? format(parseISO(alert.created_at), 'MMM d, HH:mm') : ''}
                                                </span>
                                            </div>
                                            <p className={`mt-2 text-sm font-medium text-slate-800 ${!isExpanded ? 'line-clamp-2' : ''}`}>{alert.message}</p>
                                            {alert.message.length > 120 && (
                                                <button onClick={() => setExpandedId(isExpanded ? null : alert.id)} className="mt-1 text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
                                                    {isExpanded ? <><ChevronUp className="h-3 w-3" />Show less</> : <><ChevronDown className="h-3 w-3" />Show more</>}
                                                </button>
                                            )}
                                        </div>
                                        {!alert.acknowledged && (
                                            <button onClick={() => handleAcknowledge(alert.id)} disabled={acknowledging.has(alert.id)}
                                                className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors disabled:opacity-50">
                                                {acknowledging.has(alert.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Acknowledge'}
                                            </button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
