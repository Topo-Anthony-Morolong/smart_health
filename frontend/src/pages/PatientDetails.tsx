import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Patient, VitalRecord, Alert, PatientUpdate } from '@/lib/api';
import { ArrowLeft, Activity, Loader2, AlertTriangle, CheckCircle2, Edit2, Trash2, BarChart2, Bell, X, Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';

type Tab = 'vitals' | 'alerts';

const RISK_STYLE: Record<string, string> = {
    High: 'bg-red-50 text-red-700 border-red-200',
    Moderate: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function PatientDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [history, setHistory] = useState<VitalRecord[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('vitals');

    // Edit modal
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState<PatientUpdate>({});
    const [editSaving, setEditSaving] = useState(false);

    // Delete confirmation
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Vitals form
    const [vitalOpen, setVitalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [vitalResult, setVitalResult] = useState<(VitalRecord & { recommendations: string[]; alert_triggered: boolean }) | null>(null);
    const [vitals, setVitals] = useState({ heart_rate: '', blood_pressure_systolic: '', blood_pressure_diastolic: '', temperature: '', oxygen_saturation: '' });

    // Acknowledge
    const [acking, setAcking] = useState<Set<string>>(new Set());

    useEffect(() => { if (id) loadAll(id); }, [id]);

    const loadAll = async (pid: string) => {
        setLoading(true);
        try {
            const [pt, hx, al] = await Promise.all([
                api.getPatient(pid),
                api.getVitalsHistory(pid),
                api.getPatientAlerts(pid),
            ]);
            setPatient(pt);
            setHistory(hx);
            setAlerts(al);
            setEditForm({ name: pt.name, age: pt.age, gender: pt.gender, contact: pt.contact ?? '', medical_history: pt.medical_history ?? '' });
        } catch { navigate('/patients'); }
        finally { setLoading(false); }
    };

    const handleSaveEdit = async () => {
        if (!id) return;
        setEditSaving(true);
        try {
            const updated = await api.updatePatient(id, editForm);
            setPatient(updated);
            setEditOpen(false);
        } catch { alert('Update failed.'); }
        finally { setEditSaving(false); }
    };

    const handleDelete = async () => {
        if (!id) return;
        setDeleteLoading(true);
        try {
            await api.deletePatient(id);
            navigate('/patients');
        } catch { alert('Delete failed.'); setDeleteLoading(false); }
    };

    const handleVitalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !patient) return;
        setSubmitting(true);
        setVitalResult(null);
        try {
            const res = await api.submitVitals(id, {
                heart_rate: parseFloat(vitals.heart_rate),
                blood_pressure_systolic: parseFloat(vitals.blood_pressure_systolic),
                blood_pressure_diastolic: parseFloat(vitals.blood_pressure_diastolic),
                temperature: parseFloat(vitals.temperature),
                oxygen_saturation: parseFloat(vitals.oxygen_saturation),
            });
            setVitalResult(res);
            setVitalOpen(false);
            setVitals({ heart_rate: '', blood_pressure_systolic: '', blood_pressure_diastolic: '', temperature: '', oxygen_saturation: '' });
            await loadAll(id);
        } catch { alert('Submission failed.'); }
        finally { setSubmitting(false); }
    };

    const handleAck = async (alertId: string) => {
        setAcking(prev => new Set(prev).add(alertId));
        try {
            await api.acknowledgeAlert(alertId);
            setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
        } finally { setAcking(prev => { const s = new Set(prev); s.delete(alertId); return s; }); }
    };

    if (loading) return <div className="flex items-center justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
    if (!patient) return null;

    const unackAlerts = alerts.filter(a => !a.acknowledged).length;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6 bg-slate-50 min-h-full">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/patients')} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"><ArrowLeft className="h-5 w-5" /></button>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{patient.name}</h1>
                        <p className="text-slate-500 mt-1 text-sm">
                            Age {patient.age} · {patient.gender}
                            {patient.contact && <> · {patient.contact}</>}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate(`/analytics/${id}`)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
                        <BarChart2 className="h-4 w-4" /> Analytics
                    </button>
                    <button onClick={() => setEditOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
                        <Edit2 className="h-4 w-4" /> Edit
                    </button>
                    <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-red-500 border border-red-500 rounded-xl shadow-sm hover:bg-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" /> Delete
                    </button>
                    <button onClick={() => setVitalOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl shadow-sm hover:opacity-90 transition-opacity">
                        <Activity className="h-4 w-4" /> Log Vitals
                    </button>
                </div>
            </div>

            {/* ML Result alert */}
            {vitalResult && (
                <div className={`rounded-2xl border-2 p-4 ${vitalResult.alert_triggered ? 'border-red-300 bg-red-50' : 'border-emerald-300 bg-emerald-50'}`}>
                    <div className="flex items-center gap-2 font-bold mb-1">
                        {vitalResult.alert_triggered ? <AlertTriangle className="h-5 w-5 text-red-500" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                        <span className={vitalResult.alert_triggered ? 'text-red-800' : 'text-emerald-800'}>
                            {vitalResult.risk_level} Risk · Score {vitalResult.risk_score.toFixed(0)}
                        </span>
                        {vitalResult.alert_triggered && <span className="text-xs font-semibold text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">Alert Triggered</span>}
                        <button onClick={() => setVitalResult(null)} className="ml-auto text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                    </div>
                    <ul className="list-disc pl-5 text-sm space-y-0.5">
                        {vitalResult.recommendations.map((r, i) => <li key={i} className={vitalResult.alert_triggered ? 'text-red-700' : 'text-emerald-700'}>{r}</li>)}
                    </ul>
                </div>
            )}

            {/* Tab bar */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                <button onClick={() => setTab('vitals')} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${tab === 'vitals' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Activity className="h-4 w-4" /> Vitals
                </button>
                <button onClick={() => setTab('alerts')} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${tab === 'alerts' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Bell className="h-4 w-4" /> Alerts
                    {unackAlerts > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{unackAlerts}</span>}
                </button>
            </div>

            {/* Vitals Tab */}
            {tab === 'vitals' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-teal-400" />
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Clinical Vitals History</h2>
                    </div>
                    {history.length === 0 ? (
                        <div className="py-16 text-center text-slate-400">
                            <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No vitals recorded yet. Click "Log Vitals" to begin.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                                    <tr>
                                        {['Date', 'HR', 'BP', 'Temp', 'SpO₂', 'Score', 'Risk'].map(h => (
                                            <th key={h} className="px-5 py-3 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {history.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{format(parseISO(r.recorded_at), 'MMM d, yyyy HH:mm')}</td>
                                            <td className="px-5 py-3.5 font-semibold text-slate-800">{r.heart_rate} bpm</td>
                                            <td className="px-5 py-3.5 font-semibold text-slate-800">{r.blood_pressure_systolic}/{r.blood_pressure_diastolic}</td>
                                            <td className="px-5 py-3.5 text-slate-600">{r.temperature} °C</td>
                                            <td className="px-5 py-3.5 text-slate-600">{r.oxygen_saturation}%</td>
                                            <td className="px-5 py-3.5 font-bold">{r.risk_score?.toFixed(0) ?? '-'}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${RISK_STYLE[r.risk_level ?? 'Low']}`}>{r.risk_level}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Alerts Tab */}
            {tab === 'alerts' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-amber-400" />
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Patient Alerts</h2>
                    </div>
                    {alerts.length === 0 ? (
                        <div className="py-16 text-center text-slate-400">
                            <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No alerts for this patient.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-50">
                            {alerts.map(a => (
                                <li key={a.id} className={`p-4 flex items-start gap-4 ${a.acknowledged ? 'opacity-60' : ''} hover:bg-slate-50 transition-colors`}>
                                    <div className={`p-2 rounded-xl border shrink-0 ${a.severity === 'Critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                                        <AlertTriangle className={`h-4 w-4 ${a.severity === 'Critical' ? 'text-red-500' : 'text-amber-500'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${a.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{a.severity}</span>
                                            {a.acknowledged && <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Acknowledged</span>}
                                            <span className="ml-auto text-xs text-slate-400">{a.created_at ? format(parseISO(a.created_at), 'MMM d, HH:mm') : ''}</span>
                                        </div>
                                        <p className="text-sm text-slate-700">{a.message}</p>
                                    </div>
                                    {!a.acknowledged && (
                                        <button onClick={() => handleAck(a.id)} disabled={acking.has(a.id)}
                                            className="shrink-0 text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors disabled:opacity-50">
                                            {acking.has(a.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Acknowledge'}
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Edit Patient Modal */}
            {editOpen && (
                <ModalOverlay onClose={() => setEditOpen(false)}>
                    <h2 className="text-xl font-bold text-slate-900 mb-5">Edit Patient Profile</h2>
                    <div className="space-y-4">
                        {([['name', 'Full Name', 'text'], ['contact', 'Phone / Contact', 'tel']] as [keyof PatientUpdate, string, string][]).map(([field, label, type]) => (
                            <div key={field}>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
                                <input type={type} value={(editForm[field] as string) ?? ''} onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-slate-50" />
                            </div>
                        ))}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Medical History / Notes</label>
                            <textarea rows={3} value={editForm.medical_history ?? ''} onChange={e => setEditForm(f => ({ ...f, medical_history: e.target.value }))}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-slate-50 resize-none" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setEditOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                        <button onClick={handleSaveEdit} disabled={editSaving} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
                            {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Changes
                        </button>
                    </div>
                </ModalOverlay>
            )}

            {/* Delete Confirmation Modal */}
            {deleteOpen && (
                <ModalOverlay onClose={() => setDeleteOpen(false)}>
                    <div className="text-center">
                        <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="h-6 w-6 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Delete Patient?</h2>
                        <p className="text-slate-500 mt-2 text-sm">This will permanently delete <strong>{patient.name}</strong> and all associated readings and alerts. This action cannot be undone.</p>
                        <div className="flex justify-center gap-3 mt-6">
                            <button onClick={() => setDeleteOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteLoading} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60">
                                {deleteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Yes, Delete
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Log Vitals Modal */}
            {vitalOpen && (
                <ModalOverlay onClose={() => setVitalOpen(false)}>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Record New Vitals</h2>
                    <p className="text-sm text-slate-500 mb-5">Results are analyzed by the ML risk engine instantly.</p>
                    <form onSubmit={handleVitalSubmit} className="grid grid-cols-2 gap-4">
                        {([['heart_rate', 'Heart Rate (bpm)'], ['blood_pressure_systolic', 'Systolic BP (mmHg)'], ['blood_pressure_diastolic', 'Diastolic BP (mmHg)'], ['temperature', 'Temperature (°C)'], ['oxygen_saturation', 'SpO₂ (%)']] as [keyof typeof vitals, string][]).map(([field, label]) => (
                            <div key={field}>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                                <input type="number" step="0.1" value={vitals[field]} onChange={e => setVitals(v => ({ ...v, [field]: e.target.value }))}
                                    required
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-slate-50" />
                            </div>
                        ))}
                        <div className="col-span-2 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={() => setVitalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl hover:opacity-90 disabled:opacity-60">
                                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />} Analyze Risk
                            </button>
                        </div>
                    </form>
                </ModalOverlay>
            )}
        </div>
    );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative border border-slate-200 ring-1 ring-slate-900/5" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                    <X className="h-4 w-4" />
                </button>
                {children}
            </div>
        </div>
    );
}
