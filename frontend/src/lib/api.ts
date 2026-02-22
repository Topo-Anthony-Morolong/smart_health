const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  contact: string | null;
  medical_history: string | null;
  created_at: string;
}

export interface PatientCreate {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  contact?: string;
  medical_history?: string;
}

export interface PatientUpdate {
  name?: string;
  age?: number;
  gender?: string;
  contact?: string;
  medical_history?: string;
}

export interface VitalReading {
  heart_rate: number;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  temperature: number;
  oxygen_saturation: number;
}

export interface VitalRecord extends VitalReading {
  id: string;
  patient_id: string;
  risk_score: number;
  risk_level: "low" | "medium" | "high";
  recommendations?: string[];
  alert_triggered?: boolean;
  recorded_at: string;
}

export interface Alert {
  id: string;
  patient_id: string;
  vital_id: string | null;
  alert_type: string | null;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  is_acknowledged: boolean;
  created_at: string | null;
  // Joined from patients table (clinician dashboard)
  patients?: { name: string };
}

export interface AssistantResponse {
  topic: string;
  response: string;
  disclaimer: string;
}

export interface AnalyticsResult {
  patient_id: string;
  total_readings: number;
  risk_distribution: { low: number; medium: number; high: number };
  averages: {
    blood_pressure_systolic: number | null;
    blood_pressure_diastolic: number | null;
    heart_rate: number | null;
    temperature: number | null;
    oxygen_saturation: number | null;
    risk_score: number | null;
  };
  deteriorating: boolean;
  trend_direction: "Improving" | "Stable" | "Worsening" | "Insufficient data";
  latest_risk_level: string | null;
}

// ─── HTTP Helper ─────────────────────────────────────────────────────────────

const REQUEST_TIMEOUT_MS = 30_000; // 30 seconds

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        "Request timed out. Please check your connection and try again.",
      );
    }
    // Network error (backend down, CORS block, etc.)
    throw new Error(
      "Unable to reach the server. Make sure the backend is running on port 8000.",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    let detail = errorBody;
    try {
      const parsed = JSON.parse(errorBody);
      detail = parsed?.detail ?? errorBody;
    } catch {
      /* keep raw text */
    }
    throw new Error(`Server error ${response.status}: ${detail}`);
  }

  if (response.status === 204) return {} as T;

  return response.json();
}

// ─── API Surface ─────────────────────────────────────────────────────────────

export const api = {
  // ── Patients ──────────────────────────────────────────────────────────
  getPatients: () => fetchApi<Patient[]>("/patients/"),

  getPatient: (id: string) => fetchApi<Patient>(`/patients/${id}`),

  createPatient: (data: PatientCreate) =>
    fetchApi<Patient>("/patients/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updatePatient: (id: string, data: PatientUpdate) =>
    fetchApi<Patient>(`/patients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deletePatient: (id: string) =>
    fetchApi<void>(`/patients/${id}`, { method: "DELETE" }),

  // ── Vitals ────────────────────────────────────────────────────────────
  getVitalsHistory: (patientId: string, limit = 30) =>
    fetchApi<VitalRecord[]>(`/vitals/${patientId}?limit=${limit}`),

  submitVitals: (patientId: string, vitals: VitalReading) =>
    fetchApi<
      VitalRecord & { recommendations: string[]; alert_triggered: boolean }
    >(`/vitals/${patientId}`, { method: "POST", body: JSON.stringify(vitals) }),

  // ── Alerts ────────────────────────────────────────────────────────────
  getPatientAlerts: (patientId: string, unacknowledgedOnly = false) =>
    fetchApi<Alert[]>(
      `/alerts/${patientId}?unacknowledged_only=${unacknowledgedOnly}`,
    ),

  getAllAlerts: (limit = 50) => fetchApi<Alert[]>(`/alerts/?limit=${limit}`),

  acknowledgeAlert: (alertId: string) =>
    fetchApi<Alert>(`/alerts/${alertId}/acknowledge`, { method: "PATCH" }),

  // ── Virtual Assistant ─────────────────────────────────────────────────
  askAssistant: (question: string, patientId?: string) =>
    fetchApi<AssistantResponse>("/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ question, patient_id: patientId }),
    }),

  // ── Analytics ─────────────────────────────────────────────────────────
  getAnalytics: (patientId: string) =>
    fetchApi<AnalyticsResult>(`/analytics/${patientId}`),
};
