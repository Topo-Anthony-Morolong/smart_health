import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Heart, ArrowLeft, Loader2, Activity, HelpCircle } from 'lucide-react';

const HELP: Record<string, { what: string; normal: string }> = {
    heart_rate: { what: 'How many times your heart beats per minute.', normal: 'Normal: 60–100 bpm' },
    blood_pressure_systolic: { what: 'The "top" number — pressure when your heart beats.', normal: 'Normal: 90–120 mmHg' },
    blood_pressure_diastolic: { what: 'The "bottom" number — pressure between heartbeats.', normal: 'Normal: 60–80 mmHg' },
    temperature: { what: 'Your body temperature in degrees Celsius.', normal: 'Normal: 36.1–37.2 °C' },
    oxygen_saturation: { what: 'How much oxygen your blood is carrying (SpO₂).', normal: 'Normal: 95–100%' },
};

type VitalsForm = { heart_rate: string; blood_pressure_systolic: string; blood_pressure_diastolic: string; temperature: string; oxygen_saturation: string; };

export function LogVitals() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<string | null>(null);
    const [form, setForm] = useState<VitalsForm>({ heart_rate: '', blood_pressure_systolic: '', blood_pressure_diastolic: '', temperature: '', oxygen_saturation: '' });

    const valid = form.heart_rate && form.blood_pressure_systolic && form.blood_pressure_diastolic && form.temperature && form.oxygen_saturation;

    const handleSubmit = async () => {
        if (!valid || !id) return;
        setSubmitting(true); setError(null);
        try {
            const result = await api.submitVitals(id, {
                heart_rate: parseFloat(form.heart_rate),
                blood_pressure_systolic: parseFloat(form.blood_pressure_systolic),
                blood_pressure_diastolic: parseFloat(form.blood_pressure_diastolic),
                temperature: parseFloat(form.temperature),
                oxygen_saturation: parseFloat(form.oxygen_saturation),
            });
            navigate(`/my-results/${id}`, { state: { result } });
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Submission failed.');
        } finally { setSubmitting(false); }
    };

    const change = (field: keyof VitalsForm, val: string) => setForm(prev => ({ ...prev, [field]: val }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex flex-col">
            <nav className="px-8 py-5 flex items-center gap-3 border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <button onClick={() => navigate(`/my-health/${id}`)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><ArrowLeft className="h-5 w-5" /></button>
                <div className="flex items-center gap-2.5">
                    <div className="bg-gradient-to-br from-blue-600 to-teal-500 p-2 rounded-xl text-white shadow-md"><Heart className="h-5 w-5" /></div>
                    <span className="text-lg font-bold tracking-tight text-slate-900">Smart<span className="text-blue-600">Health</span></span>
                </div>
            </nav>

            <div className="flex-1 flex items-start justify-center px-4 py-12">
                <div className="w-full max-w-lg">
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden p-8">
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Log Your Vitals</h2>
                        <p className="text-slate-500 text-sm mb-6">Enter your current readings for an instant risk assessment.</p>

                        <div className="space-y-4">
                            <VitalCard title="Heart Rate" helpKey="heart_rate" tooltip={tooltip} setTooltip={setTooltip}>
                                <VitalInput label="Heart Rate (bpm) *" value={form.heart_rate} onChange={v => change('heart_rate', v)} placeholder="e.g. 72" />
                            </VitalCard>

                            <VitalCard title="Blood Pressure" helpKey="blood_pressure_systolic" tooltip={tooltip} setTooltip={setTooltip}>
                                <div className="grid grid-cols-2 gap-3">
                                    <VitalInput label="Systolic (mmHg) *" value={form.blood_pressure_systolic} onChange={v => change('blood_pressure_systolic', v)} placeholder="e.g. 120" />
                                    <VitalInput label="Diastolic (mmHg) *" value={form.blood_pressure_diastolic} onChange={v => change('blood_pressure_diastolic', v)} placeholder="e.g. 80" />
                                </div>
                            </VitalCard>

                            <VitalCard title="Temperature" helpKey="temperature" tooltip={tooltip} setTooltip={setTooltip}>
                                <VitalInput label="Temperature (°C) *" value={form.temperature} onChange={v => change('temperature', v)} placeholder="e.g. 36.6" />
                            </VitalCard>

                            <VitalCard title="Oxygen Saturation" helpKey="oxygen_saturation" tooltip={tooltip} setTooltip={setTooltip}>
                                <VitalInput label="SpO₂ (%) *" value={form.oxygen_saturation} onChange={v => change('oxygen_saturation', v)} placeholder="e.g. 98" />
                            </VitalCard>
                        </div>

                        {error && <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

                        <button onClick={handleSubmit} disabled={!valid || submitting}
                            className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl shadow-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                            {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Analysing…</> : <><Activity className="h-5 w-5" /> Submit & Get Risk Score</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function VitalCard({ title, helpKey, tooltip, setTooltip, children }: { title: string; helpKey: string; tooltip: string | null; setTooltip: (v: string | null) => void; children: React.ReactNode }) {
    const info = HELP[helpKey];
    return (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{title}</p>
                {info && <button onClick={() => setTooltip(tooltip === helpKey ? null : helpKey)} className="text-slate-400 hover:text-blue-500"><HelpCircle className="h-4 w-4" /></button>}
            </div>
            {tooltip === helpKey && info && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-xs text-blue-800 space-y-1">
                    <p>{info.what}</p><p className="font-semibold text-blue-600">{info.normal}</p>
                </div>
            )}
            {children}
        </div>
    );
}

function VitalInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
            <input type="number" step="0.1" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all" />
        </div>
    );
}
