import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function Dashboard() {
    const [patientCount, setPatientCount] = useState<number | null>(null);

    useEffect(() => {
        api.getPatients()
            .then(data => setPatientCount(data.length))
            .catch(err => console.error("Failed to fetch dashboard stats", err));
    }, []);

    const stats = [
        {
            title: "Active Patients",
            value: patientCount !== null ? patientCount.toString() : <Loader2 className="h-5 w-5 animate-spin" />,
            icon: Users,
            description: "Total registered in system",
            trend: "up"
        },
        {
            title: "Critical Alerts",
            value: "3",
            icon: AlertTriangle,
            description: "Requires immediate attention",
            trend: "down",
            destructive: true
        },
        {
            title: "Vitals Monitored",
            value: "12,405",
            icon: Activity,
            description: "Past 24 hours",
            trend: "up"
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-background/50 min-h-full">
            <div className="flex justify-between items-end pb-4 border-b border-border/40">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground/90">Overview</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Welcome back. Here is the latest status of your facility.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat, index) => (
                    <Card key={index} className="border-border bg-card shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                        {/* Subtle top border accent */}
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.destructive ? 'from-red-400 to-rose-600' : 'from-primary to-secondary'}`} />

                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${stat.destructive ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-bold tracking-tight text-foreground/90">{stat.value}</div>
                            <p className={`text-sm mt-2 font-medium flex items-center ${stat.destructive ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle>Recent Patient Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-48 items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
                            Integration with backend upcoming...
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border">
                    <CardHeader>
                        <CardTitle>System Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-48 items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
                            Telemetry graph placeholder
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
