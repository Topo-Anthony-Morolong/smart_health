import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Patient } from '@/lib/api';
import { Heart, ClipboardList, Activity, Bot, ArrowRight, Loader2, Search } from 'lucide-react';

export function Landing() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [query, setQuery] = useState('');
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        api.getPatients()
            .then(setPatients)
            .catch(() => { })
            .finally(() => setLoadingPatients(false));
    }, []);

    const filtered = patients.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.medical_history && p.medical_history.toLowerCase().includes(query.toLowerCase()))
    );

    const selectPatient = (p: Patient) => {
        setQuery(p.name);
        setDropdownOpen(false);
        navigate(`/my-health/${p.id}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex flex-col">
            {/* Nav */}
            <nav className="px-8 py-5 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                    <div className="bg-gradient-to-br from-blue-600 to-teal-500 p-2 rounded-xl text-white shadow-md">
                        <Heart className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900">Smart<span className="text-blue-600">Health</span></span>
                </div>
                <button onClick={() => navigate('/register')}
                    className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl shadow-sm hover:opacity-90 transition-opacity">
                    Register Now
                </button>
            </nav>

            {/* Hero */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-sm">
                    <Activity className="h-3.5 w-3.5" /> Powered by Machine Learning Risk Engine
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-tight">
                    Know Your Heart Health<br />
                    <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Risk Today.</span>
                </h1>
                <p className="mt-6 text-xl text-slate-500 max-w-xl leading-relaxed">
                    Enter your vitals and get an instant, personalised cardiovascular risk assessment — no waiting room required.
                </p>

                {/* CTAs */}
                <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <button onClick={() => navigate('/register')}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl shadow-lg hover:shadow-xl hover:opacity-95 transition-all">
                        <ClipboardList className="h-5 w-5" />
                        I'm a New Patient
                        <ArrowRight className="h-4 w-4 ml-auto" />
                    </button>
                </div>

                {/* Returning patient lookup */}
                <div className="mt-8 w-full max-w-md">
                    <p className="text-sm text-slate-400 mb-3 font-medium">Already registered? Find your profile:</p>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            {loadingPatients ? <Loader2 className="h-4 w-4 text-slate-400 animate-spin" /> : <Search className="h-4 w-4 text-slate-400" />}
                        </div>
                        <input
                            type="text"
                            placeholder="Search your name or condition…"
                            value={query}
                            onChange={e => { setQuery(e.target.value); setDropdownOpen(true); }}
                            onFocus={() => setDropdownOpen(true)}
                            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all"
                        />
                        {dropdownOpen && query && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-20 max-h-64 overflow-y-auto">
                                {filtered.length === 0 ? (
                                    <div className="px-4 py-4 text-sm text-slate-400 text-center">No patients found. <button onClick={() => navigate('/register')} className="text-blue-600 hover:underline font-medium">Register?</button></div>
                                ) : (
                                    filtered.slice(0, 8).map(p => (
                                        <button key={p.id} onClick={() => selectPatient(p)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left">
                                            <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                                                {p.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                                                <p className="text-xs text-slate-400">Age {p.age} · {p.gender}</p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-slate-300 ml-auto" />
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Feature highlights */}
            <div className="px-8 pb-16 max-w-4xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                    { icon: Activity, title: 'Instant Risk Score', desc: 'Our ML model analyses your vitals in milliseconds.', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { icon: ClipboardList, title: 'Personalised Advice', desc: 'Targeted recommendations based on your readings.', color: 'text-teal-600', bg: 'bg-teal-50' },
                    { icon: Bot, title: 'Health Assistant', desc: 'Ask any health question and get guided answers instantly.', color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map(f => (
                    <div key={f.title} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex gap-4 items-start">
                        <div className={`p-2.5 rounded-xl ${f.bg} shrink-0`}>
                            <f.icon className={`h-5 w-5 ${f.color}`} />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">{f.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
