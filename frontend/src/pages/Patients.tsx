import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import {
    Search, Filter, ChevronLeft, ChevronRight, AlertCircle,
    User, Phone, Clock, X, ArrowUpDown
} from 'lucide-react';

// --- Types ---
interface Patient {
    id: string;
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    contact: string | null;
    medical_history: string | null;
    created_at: string;
}

type SortField = 'name' | 'age' | 'gender' | 'created_at';
type SortOrder = 'asc' | 'desc';

// --- API Client ---
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// --- Component ---
export function Patients() {
    // State: Data & Network
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State: Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGender, setSelectedGender] = useState<string>('All');

    // State: Sorting
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // State: Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // State: UI Modals
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    // --- Fetch Data ---
    const fetchPatients = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get<Patient[]>('/patients/');
            setPatients(response.data);
        } catch (err) {
            console.error('API Error:', err);
            setError('Failed to securely connect to the patient registry. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    // --- Derived State (Memoized for Performance) ---
    const uniqueGenders = useMemo(() => {
        const gen = new Set(patients.map(p => p.gender).filter(Boolean) as string[]);
        return ['All', ...Array.from(gen)].sort();
    }, [patients]);

    const filteredAndSortedPatients = useMemo(() => {
        let result = [...patients];

        // 1. Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.medical_history && p.medical_history.toLowerCase().includes(q)) ||
                (p.contact && p.contact.toLowerCase().includes(q))
            );
        }

        // 2. Dropdown Filter (Gender)
        if (selectedGender !== 'All') {
            result = result.filter(p => p.gender === selectedGender);
        }

        // 3. Sorting
        result.sort((a, b) => {
            let valA: any = a[sortField] || '';
            let valB: any = b[sortField] || '';

            if (sortField === 'created_at') {
                valA = valA ? new Date(valA).getTime() : 0;
                valB = valB ? new Date(valB).getTime() : 0;
            } else if (sortField === 'age') {
                valA = Number(valA);
                valB = Number(valB);
            } else {
                valA = String(valA).toLowerCase();
                valB = String(valB).toLowerCase();
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [patients, searchQuery, selectedGender, sortField, sortOrder]);

    // --- Pagination Logic ---
    const totalPages = Math.ceil(filteredAndSortedPatients.length / itemsPerPage);
    const currentPatients = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedPatients.slice(start, start + itemsPerPage);
    }, [filteredAndSortedPatients, currentPage, itemsPerPage]);

    // Reset page to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedGender]);

    // --- Handlers ---
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const getStatusBadge = (condition: string | null) => {
        if (!condition) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        const l = condition.toLowerCase();
        if (l.includes('critical') || l.includes('severe') || l.includes('hypertension')) {
            return 'bg-red-50 text-red-700 border-red-200';
        }
        if (l.includes('monitoring') || l.includes('type 2') || l.includes('asthma')) {
            return 'bg-amber-50 text-amber-700 border-amber-200';
        }
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'; // Default stable
    };

    // --- Render Helpers ---
    const SortIcon = ({ field }: { field: SortField }) => (
        <ArrowUpDown className={`inline-block ml-1 h-3 w-3 transition-colors ${sortField === field ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-400'}`} />
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-100">

            {/* Top Navigation */}
            <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-br from-blue-600 to-teal-500 p-2 rounded-xl text-white shadow-md">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Patient Management</h1>
                            <p className="text-xs font-medium text-slate-500">Department of Clinical Records</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm font-medium text-slate-600">
                        <span>{format(new Date(), 'EEEE, MMMM do, yyyy')}</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

                {/* Statistics & Filters */}
                <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
                    <div className="flex items-center space-x-6">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Patients</p>
                            <p className="text-3xl font-bold tracking-tight text-slate-900">{patients.length}</p>
                        </div>
                        <div className="w-px h-10 bg-slate-200"></div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Filtered Results</p>
                            <p className="text-3xl font-bold tracking-tight text-blue-600">{filteredAndSortedPatients.length}</p>
                        </div>
                    </div>

                    <div className="flex flex-1 w-full md:w-auto md:justify-end gap-3 flex-wrap">
                        {/* Search Bar */}
                        <div className="relative flex-1 md:max-w-xs shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search name, contact, history..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Doctor Filter */}
                        <div className="relative shadow-sm min-w-[160px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Filter className="h-4 w-4 text-slate-400" />
                            </div>
                            <select
                                className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm outline-none text-slate-700"
                                value={selectedGender}
                                onChange={(e) => setSelectedGender(e.target.value)}
                            >
                                {uniqueGenders.map(gen => (
                                    <option key={gen} value={gen}>{gen === 'All' ? 'All Genders' : gen.charAt(0).toUpperCase() + gen.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Data Table Wrapper */}
                <section className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden relative">

                    {/* Top subtle structural gradient */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400 opacity-80" />

                    {error ? (
                        <div className="p-12 text-center rounded-xl m-4 bg-red-50 border border-red-100 flex flex-col items-center">
                            <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
                            <h3 className="text-lg font-semibold text-red-800 mb-1">System Error</h3>
                            <p className="text-red-700">{error}</p>
                            <button
                                onClick={fetchPatients}
                                className="mt-4 px-4 py-2 bg-white text-red-700 text-sm font-medium rounded-lg border border-red-200 shadow-sm hover:bg-red-50 transition-colors"
                            >
                                Retry Connection
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto pt-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200">
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap group cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                                            Patient Name <SortIcon field="name" />
                                        </th>
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap group cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('age')}>
                                            Age <SortIcon field="age" />
                                        </th>
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap group cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('gender')}>
                                            Gender <SortIcon field="gender" />
                                        </th>
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                            Contact
                                        </th>
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap text-right group cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('created_at')}>
                                            Registered <SortIcon field="created_at" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {isLoading ? (
                                        // Skeleton State
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                                                <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                                                <td className="py-4 px-6"><div className="h-6 bg-slate-200 rounded-full w-24"></div></td>
                                                <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                                                <td className="py-4 px-6 flex justify-end"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                                            </tr>
                                        ))
                                    ) : currentPatients.length === 0 ? (
                                        // Empty State
                                        <tr>
                                            <td colSpan={5} className="py-16 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                        <PatientNotFoundIcon />
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-slate-800">No patients found</h3>
                                                    <p className="text-slate-500 mt-1 max-w-sm">Try adjusting your search criteria or the clinician filter to see results.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        // Loaded Data State
                                        currentPatients.map((patient) => (
                                            <tr
                                                key={patient.id}
                                                onClick={() => setSelectedPatient(patient)}
                                                className="hover:bg-blue-50/50 transition-colors duration-200 cursor-pointer group"
                                            >
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center">
                                                        <div className="h-9 w-9 rounded-full bg-slate-100 text-blue-600 flex items-center justify-center font-bold text-sm border border-slate-200 mr-3 group-hover:bg-blue-100 group-hover:border-blue-200 transition-colors">
                                                            {patient.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold text-slate-800">{patient.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="text-sm text-slate-900">{patient.age} yrs</span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="capitalize text-sm text-slate-700">{patient.gender}</span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {patient.contact ? (
                                                        <a
                                                            href={`tel:${patient.contact}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                                                        >
                                                            <Phone className="h-3 w-3 mr-1" /> {patient.contact}
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">No contact</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-sm text-slate-500 text-right whitespace-nowrap">
                                                    {format(parseISO(patient.created_at), 'MMM d, yyyy')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Footer */}
                    {!error && filteredAndSortedPatients.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                            <span className="text-sm text-slate-600 font-medium">
                                Showing <span className="text-slate-900 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredAndSortedPatients.length)}</span> of <span className="text-slate-900 font-bold">{filteredAndSortedPatients.length}</span> results
                            </span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || isLoading}
                                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <div className="flex items-center px-3 text-sm font-semibold text-slate-700">
                                    {currentPage} <span className="font-normal text-slate-400 mx-1">/</span> {totalPages}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || isLoading}
                                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </main>

            {/* Patient Detail Modal */}
            {selectedPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedPatient(null)}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all border border-slate-200 ring-1 ring-slate-900/5"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="relative h-28 bg-gradient-to-r from-blue-600 to-teal-500 rounded-t-2xl px-6 flex items-center">
                            <button
                                onClick={() => setSelectedPatient(null)}
                                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="absolute -bottom-10 left-6">
                                <div className="h-24 w-24 rounded-full bg-white p-1.5 shadow-md">
                                    <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center">
                                        <User className="h-10 w-10 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="pt-14 px-8 pb-8 overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{selectedPatient.name}</h2>
                                    <div className="flex items-center space-x-3 mt-2 text-sm text-slate-500">
                                        <span className="flex items-center"><User className="h-4 w-4 mr-1 text-slate-400" /> {selectedPatient.age} yrs, <span className="capitalize ml-1">{selectedPatient.gender}</span></span>
                                        <span>•</span>
                                        <span className="flex items-center"><Clock className="h-4 w-4 mr-1 text-slate-400" /> Reg: {format(parseISO(selectedPatient.created_at), 'MMM d, yyyy')}</span>
                                    </div>
                                </div>
                                {selectedPatient.medical_history && (
                                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getStatusBadge(selectedPatient.medical_history)}`}>
                                        {selectedPatient.medical_history.slice(0, 30)}{selectedPatient.medical_history.length > 30 ? '...' : ''}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                {/* Contact Group */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Contact Details</h3>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/50">
                                        <p className="text-xs text-slate-500 mb-1 font-medium">Contact Number / Email</p>
                                        <p className="font-semibold text-slate-800 flex items-center">
                                            <Phone className="h-4 w-4 text-teal-500 mr-2" />
                                            {selectedPatient.contact ? (
                                                <a href={`tel:${selectedPatient.contact}`} className="hover:text-blue-600 transition-colors">{selectedPatient.contact}</a>
                                            ) : 'No contact provided'}
                                        </p>
                                    </div>
                                </div>

                                {/* Medical History Group */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Medical History</h3>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/50 h-[178px] overflow-y-auto custom-scrollbar">
                                        {selectedPatient.medical_history ? (
                                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedPatient.medical_history}</p>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                <span className="text-sm italic">No medical history recorded yet for this patient profile.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => setSelectedPatient(null)}
                                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                                >
                                    Close Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Simple internal icon for empty state so we don't need external SVG files
function PatientNotFoundIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="19" y1="8" x2="19" y2="14"></line>
            <line x1="22" y1="11" x2="16" y2="11"></line>
        </svg>
    );
}
