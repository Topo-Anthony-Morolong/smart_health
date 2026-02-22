import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Bell, BarChart2, ArrowLeft } from 'lucide-react';

const NAV = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Patients', href: '/admin/patients', icon: Users },
    { name: 'Alerts', href: '/admin/alerts', icon: Bell },
];

export function DashboardLayout() {
    const location = useLocation();
    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <aside className="w-60 border-r border-slate-200 bg-white flex flex-col shadow-sm shrink-0">
                <div className="px-5 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-600 to-teal-500 p-2 rounded-xl text-white shadow-md shrink-0">
                            <BarChart2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-base font-bold tracking-tight text-slate-900 leading-tight">Smart<span className="text-blue-600">Health</span></p>
                            <p className="text-xs text-slate-400 font-medium">Clinician Portal</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    {NAV.map(item => {
                        const isActive = location.pathname.startsWith(item.href);
                        return (
                            <Link key={item.name} to={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
                                <item.icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="px-4 py-4 border-t border-slate-100">
                    <Link to="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-blue-600 transition-colors">
                        <ArrowLeft className="h-3.5 w-3.5" /> Patient Portal
                    </Link>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
