import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, PatientCreate } from '@/lib/api';
import { Heart, ArrowRight, ArrowLeft, Loader2, CheckCircle2, HelpCircle } from 'lucide-react';

const HELP: Record<string, { what: string; normal: string }> = {
    heart_rate: { what: 'How many times your heart beats per minute.', normal: 'Normal: 60–100 bpm' },
    blood_pressure_systolic: { what: 'The "top" number — pressure when your heart beats.', normal: 'Normal: 90–120 mmHg' },
    blood_pressure_diastolic: { what: 'The "bottom" number — pressure between heartbeats.', normal: 'Normal: 60–80 mmHg' },
    temperature: { what: 'Your body temperature in degrees Celsius.', normal: 'Normal: 36.1–37.2 °C' },
    oxygen_saturation: { what: 'How much oxygen your blood is carrying (SpO₂ %).', normal: 'Normal: 95–100%' },
};

type Step1 = { name: string; age: string; gender: 'male' | 'female' | 'other' | ''; contact: string; medical_history: string; };
type Step2 = { heart_rate: string; blood_pressure_systolic: string; blood_pressure_diastolic: string; temperature: string; oxygen_saturation: string; };

export function PatientRegister() {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<string | null>(null);

    const [s1, setS1] = useState<Step1>({ name: '', age: '', gender: '', contact: '', medical_history: '' });
    const [s2, setS2] = useState<Step2>({ heart_rate: '', blood_pressure_systolic: '', blood_pressure_diastolic: '', temperature: '', oxygen_saturation: '' });

    const handleS2Change = (field: keyof Step2, val: string) => {
        setS2(prev => ({ ...prev, [field]: val }));
    };

    const step1Valid = s1.name.trim() && s1.age && s1.gender;
    const step2Valid = s2.heart_rate && s2.blood_pressure_systolic && s2.blood_pressure_diastolic && s2.temperature && s2.oxygen_saturation;

    const handleSubmit = async () => {
        if (!step2Valid || !s1.gender) return;
        setSubmitting(true); setError(null);
        try {
            const patientData: PatientCreate = {
                name: s1.name.trim(),
                age: parseInt(s1.age),
                gender: s1.gender,
                contact: s1.contact || undefined,
                medical_history: s1.medical_history || undefined,
            };
            const patient = await api.createPatient(patientData);
            const result = await api.submitVitals(patient.id, {
                heart_rate: parseFloat(s2.heart_rate),
                blood_pressure_systolic: parseFloat(s2.blood_pressure_systolic),
                blood_pressure_diastolic: parseFloat(s2.blood_pressure_diastolic),
                temperature: parseFloat(s2.temperature),
                oxygen_saturation: parseFloat(s2.oxygen_saturation),
            });
            navigate(`/my-results/${patient.id}`, { state: { result, patient } });
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Registration failed. Please check your entries and try again.');
        } finally { setSubmitting(false); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex flex-col">
            <nav className="px-8 py-5 flex items-center gap-3 border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <button onClick={() => navigate('/')} aria-label="Go back to home" className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><ArrowLeft className="h-5 w-5" /></button>
                <div className="flex items-center gap-2.5">
                    <div className="bg-gradient-to-br from-blue-600 to-teal-500 p-2 rounded-xl text-white shadow-md"><Heart className="h-5 w-5" /></div>
                    <span className="text-lg font-bold tracking-tight text-slate-900">Smart<span className="text-blue-600">Health</span></span>
                </div>
            </nav>

            <div className="flex-1 flex items-start justify-center px-4 py-12">
                <div className="w-full max-w-xl">
                    {/* Progress */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            {[1, 2].map(n => (
                                <div key={n} className="flex items-center gap-3 flex-1">
                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${step > n ? 'bg-emerald-500 border-emerald-500 text-white' : step === n ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                                        {step > n ? <CheckCircle2 className="h-4 w-4" /> : n}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-semibold ${step >= n ? 'text-slate-800' : 'text-slate-400'}`}>{n === 1 ? 'Your Details' : 'Health Vitals'}</p>
                                        <p className="text-xs text-slate-400">{n === 1 ? 'Personal information' : 'Measurements for risk scan'}</p>
                                    </div>
                                    {n < 2 && <div className={`h-0.5 w-8 rounded ${step > n ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                                </div>
                            ))}
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full transition-all duration-500 ${step === 1 ? 'w-1/2' : 'w-full'}`} />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        {step === 1 && (
                            <div className="p-8">
                                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Tell us about yourself</h2>
                                <p className="text-slate-500 text-sm mb-6">We'll create your personal health profile.</p>
                                <div className="space-y-4">
                                    <Field label="Full Name *" value={s1.name} onChange={v => setS1(p => ({ ...p, name: v }))} placeholder="e.g. Jane Smith" />
                                    <Field label="Age *" value={s1.age} onChange={v => setS1(p => ({ ...p, age: v }))} placeholder="e.g. 42" type="number" />
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gender *</label>
                                        <div className="flex gap-3">
                                            {(['male', 'female', 'other'] as const).map(g => (
                                                <button key={g} type="button" onClick={() => setS1(p => ({ ...p, gender: g }))}
                                                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold capitalize transition-all ${s1.gender === g ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <Field label="Phone / Contact" value={s1.contact} onChange={v => setS1(p => ({ ...p, contact: v }))} placeholder="Optional" />
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Medical History / Notes</label>
                                        <textarea rows={3} value={s1.medical_history} onChange={e => setS1(p => ({ ...p, medical_history: e.target.value }))} placeholder="Current medications, conditions, allergies… (optional)"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 resize-none" />
                                    </div>
                                </div>
                                <button onClick={() => setStep(2)} disabled={!step1Valid}
                                    className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl shadow-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                                    Continue to Vitals <ArrowRight className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="p-8">
                                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Enter your vital signs</h2>
                                <p className="text-slate-500 text-sm mb-6">These readings power your instant risk assessment.</p>
                                <div className="space-y-4">
                                    {/* Heart Rate */}
                                    <FieldGroup title="Heart Rate" helpKey="heart_rate" tooltip={tooltip} setTooltip={setTooltip} help={HELP}>
                                        <VitalField label="Heart Rate (bpm) *" value={s2.heart_rate} onChange={v => handleS2Change('heart_rate', v)} placeholder="e.g. 72" />
                                    </FieldGroup>

                                    {/* Blood Pressure */}
                                    <FieldGroup title="Blood Pressure" helpKey="blood_pressure_systolic" tooltip={tooltip} setTooltip={setTooltip} help={HELP}>
                                        <div className="grid grid-cols-2 gap-3">
                                            <VitalField label="Systolic (mmHg) *" value={s2.blood_pressure_systolic} onChange={v => handleS2Change('blood_pressure_systolic', v)} placeholder="e.g. 120" />
                                            <VitalField label="Diastolic (mmHg) *" value={s2.blood_pressure_diastolic} onChange={v => handleS2Change('blood_pressure_diastolic', v)} placeholder="e.g. 80" />
                                        </div>
                                    </FieldGroup>

                                    {/* Temperature */}
                                    <FieldGroup title="Body Temperature" helpKey="temperature" tooltip={tooltip} setTooltip={setTooltip} help={HELP}>
                                        <VitalField label="Temperature (°C) *" value={s2.temperature} onChange={v => handleS2Change('temperature', v)} placeholder="e.g. 36.6" />
                                    </FieldGroup>

                                    {/* Oxygen Saturation */}
                                    <FieldGroup title="Oxygen Saturation" helpKey="oxygen_saturation" tooltip={tooltip} setTooltip={setTooltip} help={HELP}>
                                        <VitalField label="SpO₂ (%) *" value={s2.oxygen_saturation} onChange={v => handleS2Change('oxygen_saturation', v)} placeholder="e.g. 98" />
                                    </FieldGroup>
                                </div>

                                {error && <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

                                <div className="mt-8 flex gap-3">
                                    <button onClick={() => setStep(1)} className="px-5 py-4 text-sm font-semibold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors flex items-center gap-2">
                                        <ArrowLeft className="h-4 w-4" /> Back
                                    </button>
                                    <button onClick={handleSubmit} disabled={!step2Valid || submitting}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl shadow-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                                        {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Analysing…</> : <><CheckCircle2 className="h-5 w-5" /> Get My Risk Assessment</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder = '', type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all" />
        </div>
    );
}

function VitalField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
            <input type="number" step="0.1" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all" />
        </div>
    );
}

function HelpCard({ info }: { info: { what: string; normal: string } }) {
    return (
        <div className="mb-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-xs text-blue-800 space-y-1">
            <p>{info.what}</p><p className="font-semibold text-blue-600">{info.normal}</p>
        </div>
    );
}

function FieldGroup({ title, helpKey, tooltip, setTooltip, help, children }: { title: string; helpKey: string; tooltip: string | null; setTooltip: (v: string | null) => void; help: typeof HELP; children: React.ReactNode }) {
    return (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{title}</p>
                {help[helpKey] && (
                    <button aria-label={`Help for ${title}`} onClick={() => setTooltip(tooltip === helpKey ? null : helpKey)} className="text-slate-400 hover:text-blue-500 transition-colors"><HelpCircle className="h-4 w-4" /></button>
                )}
            </div>
            {tooltip === helpKey && help[helpKey] && <HelpCard info={help[helpKey]} />}
            {children}
        </div>
    );
}
