import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import {
  // Patient-facing (no layout wrapper — full screen)
  Landing, PatientRegister, MyDashboard, LogVitals, RiskResult,
  // Clinician portal (inside DashboardLayout)
  Dashboard, Patients, PatientDetails, Analytics, Alerts, Assistant,
} from '@/pages';

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Patient Portal (standalone, no sidebar) ─────────────── */}
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<PatientRegister />} />
        <Route path="/my-health/:id" element={<MyDashboard />} />
        <Route path="/log-vitals/:id" element={<LogVitals />} />
        <Route path="/my-results/:id" element={<RiskResult />} />
        <Route path="/assistant" element={<Assistant />} />

        {/* ── Clinician Dashboard (with sidebar layout) ────────────── */}
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientDetails />} />
          <Route path="analytics/:id" element={<Analytics />} />
          <Route path="alerts" element={<Alerts />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
