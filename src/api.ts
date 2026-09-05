// ── Smriti API Client ─────────────────────────────────────────────────────
// Centralised HTTP client for the Smriti backend.
// Handles token storage, auto-refresh on 401, and typed API calls.

const API_BASE = "http://localhost:4000";

// ── Token helpers ─────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem("smriti_access_token");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("smriti_refresh_token");
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("smriti_access_token", access);
  localStorage.setItem("smriti_refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("smriti_access_token");
  localStorage.removeItem("smriti_refresh_token");
  localStorage.removeItem("smriti_role");
  localStorage.removeItem("smriti_logged_in");
}

export function getStoredRole(): "user" | "caregiver" | null {
  const r = localStorage.getItem("smriti_role");
  return r === "user" || r === "caregiver" ? r : null;
}

// ── Core fetch with auth ──────────────────────────────────────────────────

async function apiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(`${API_BASE}${path}`, { ...opts, headers });

  // Auto-refresh on 401
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getAccessToken()}`;
      res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    }
  }

  return res;
}

async function apiJSON<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, opts);
  const data = await res.json();
  if (!res.ok) {
    let errMsg = data.error || `API error ${res.status}`;
    if (data.details?.fieldErrors) {
      const fieldErrs = Object.entries(data.details.fieldErrors)
        .map(([field, errs]) => `${field}: ${(errs as string[]).join(", ")}`)
        .join("; ");
      if (fieldErrs) errMsg += `: ${fieldErrs}`;
    }
    throw new Error(errMsg);
  }
  return data as T;
}

// ── Auth: Patient ─────────────────────────────────────────────────────────

export interface PatientRegisterData {
  name: string;
  phone: string;
  password: string;
  age: number;
  language: "en" | "as" | "mn";
  email?: string;
}

export interface PatientLoginData {
  phone: string;
  password: string;
}

export interface PatientProfile {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  age: number;
  language: string;
  careCode: string;
  emergencyContact?: string | null;
  avatar?: string | null;
}

export interface CaregiverProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  patient?: PatientProfile;
  caregiver?: CaregiverProfile;
}

export async function fetchPatientProfile(): Promise<PatientProfile> {
  const data = await apiJSON<{ patient: PatientProfile }>("/patient/profile");
  return data.patient;
}

export async function updatePatientProfile(data: Partial<PatientProfile>): Promise<PatientProfile> {
  const res = await apiJSON<{ patient: PatientProfile }>("/patient/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.patient;
}

export async function fetchCaregiverProfile(): Promise<CaregiverProfile> {
  const data = await apiJSON<{ caregiver: CaregiverProfile }>("/caregiver/profile");
  return data.caregiver;
}

export async function updateCaregiverProfile(data: Partial<CaregiverProfile>): Promise<CaregiverProfile> {
  const res = await apiJSON<{ caregiver: CaregiverProfile }>("/caregiver/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.caregiver;
}

export async function patientRegister(data: PatientRegisterData): Promise<AuthResponse> {
  const res = await apiJSON<AuthResponse>("/auth/patient/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setTokens(res.accessToken, res.refreshToken);
  localStorage.setItem("smriti_role", "user");
  localStorage.setItem("smriti_logged_in", "1");
  return res;
}

export async function patientLogin(data: PatientLoginData): Promise<AuthResponse> {
  const res = await apiJSON<AuthResponse>("/auth/patient/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setTokens(res.accessToken, res.refreshToken);
  localStorage.setItem("smriti_role", "user");
  localStorage.setItem("smriti_logged_in", "1");
  return res;
}

// ── Auth: Caregiver ───────────────────────────────────────────────────────

export interface CaregiverRegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "family" | "health_worker";
}

export interface CaregiverLoginData {
  email: string;
  password: string;
}

export async function caregiverRegister(data: CaregiverRegisterData): Promise<AuthResponse> {
  const res = await apiJSON<AuthResponse>("/auth/caregiver/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setTokens(res.accessToken, res.refreshToken);
  localStorage.setItem("smriti_role", "caregiver");
  localStorage.setItem("smriti_logged_in", "1");
  return res;
}

export async function caregiverLogin(data: CaregiverLoginData): Promise<AuthResponse> {
  const res = await apiJSON<AuthResponse>("/auth/caregiver/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setTokens(res.accessToken, res.refreshToken);
  localStorage.setItem("smriti_role", "caregiver");
  localStorage.setItem("smriti_logged_in", "1");
  return res;
}

// ── Auth: Refresh ─────────────────────────────────────────────────────────

export async function refreshTokens(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) { clearTokens(); return false; }
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

// ── Care Code ─────────────────────────────────────────────────────────────

export interface CareCodeResponse {
  careCode: string;
  qr: string; // data URI
}

export async function fetchCareCode(): Promise<CareCodeResponse> {
  return apiJSON<CareCodeResponse>("/patient/care-code");
}

// ── Reminders (Patient) ───────────────────────────────────────────────────

export interface ApiReminder {
  id: number;
  patientId: number;
  title: string;
  time: string;
  category: string;
  frequency: "today" | "daily" | "specific_days";
  days: string[];
  isCompleted: boolean;
  completedAt?: string | null;
  createdAt?: string;
}

export interface CreateReminderPayload {
  title: string;
  time: string;
  category: string;
  frequency?: "today" | "daily" | "specific_days";
  days?: string[];
}

export async function fetchMyReminders(): Promise<ApiReminder[]> {
  const data = await apiJSON<{ reminders: ApiReminder[] }>("/patient/reminders");
  return data.reminders;
}

export async function createReminder(reminder: CreateReminderPayload): Promise<ApiReminder> {
  const body = {
    type: reminder.category,
    label: reminder.title,
    scheduled_time: reminder.time,
    frequency: reminder.frequency || "daily",
    days: reminder.days || [],
  };
  const data = await apiJSON<{ reminder: ApiReminder }>("/patient/reminders", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.reminder;
}

export async function completeReminder(id: number, completed?: boolean): Promise<ApiReminder> {
  const data = await apiJSON<{ reminder: ApiReminder }>(`/patient/reminders/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
  return data.reminder;
}

export async function deleteReminder(id: number): Promise<void> {
  await apiJSON(`/patient/reminders/${id}`, {
    method: "DELETE",
  });
}

// ── Activity Logging (Patient) ────────────────────────────────────────────

export async function logActivity(
  type: "game" | "reminder" | "mood_checkin",
  payload: Record<string, unknown>
): Promise<void> {
  await apiJSON("/activity", {
    method: "POST",
    body: JSON.stringify({ type, payload }),
  });
}

export async function fetchMyActivities(): Promise<ActivityLog[]> {
  try {
    const data = await apiJSON<{ activity: ActivityLog[] }>("/activity");
    return data.activity || [];
  } catch (e) {
    return [];
  }
}

// ── Caregiver: Link / Patients ────────────────────────────────────────────

export interface LinkedPatient {
  id: number;
  name: string;
  phone: string;
  age: number;
  language: string;
  careCode: string;
  permissionLevel: string;
  linkedAt: string;
}

export async function linkPatient(careCode: string): Promise<{ patient: { id: number; name: string } }> {
  return apiJSON("/caregiver/link-patient", {
    method: "POST",
    body: JSON.stringify({ care_code: careCode }),
  });
}

export async function fetchLinkedPatients(): Promise<LinkedPatient[]> {
  const data = await apiJSON<{ patients: LinkedPatient[] }>("/caregiver/patients");
  return data.patients;
}

export async function unlinkPatient(patientId: number): Promise<void> {
  await apiJSON(`/caregiver/unlink/${patientId}`, { method: "DELETE" });
}

// ── Caregiver: Patient Data ───────────────────────────────────────────────

export interface ActivityLog {
  id: number;
  patientId: number;
  type: "game" | "reminder" | "mood_checkin";
  payload: Record<string, unknown>;
  createdAt: string;
}

export async function fetchPatientActivity(patientId: number): Promise<ActivityLog[]> {
  const data = await apiJSON<{ activity: ActivityLog[] }>(`/caregiver/patients/${patientId}/activity`);
  return data.activity;
}

export async function fetchPatientReminders(patientId: number): Promise<ApiReminder[]> {
  const data = await apiJSON<{ reminders: ApiReminder[] }>(`/caregiver/patients/${patientId}/reminders`);
  return data.reminders;
}

export async function addReminderForPatient(
  patientId: number,
  reminder: CreateReminderPayload
): Promise<ApiReminder> {
  const body = {
    type: reminder.category,
    label: reminder.title,
    scheduled_time: reminder.time,
    frequency: reminder.frequency || "daily",
    days: reminder.days || [],
  };
  const data = await apiJSON<{ reminder: ApiReminder }>(`/caregiver/patients/${patientId}/reminders`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.reminder;
}

export async function deletePatientReminder(patientId: number, id: number): Promise<void> {
  await apiJSON(`/caregiver/patients/${patientId}/reminders/${id}`, {
    method: "DELETE",
  });
}

// ── Chit-Chat Voice Quiz (Patient) ────────────────────────────────────────

export interface ChitChatQuestion {
  id: number;
  text: string;
  audioFile: string;
}

export interface ChitChatSession {
  id: number;
  language: string;
  status: string;
  createdAt: string;
}

export interface StartSessionResponse {
  session: ChitChatSession;
  questions: ChitChatQuestion[];
}

export async function startChitChatSession(language: string): Promise<StartSessionResponse> {
  return apiJSON<StartSessionResponse>("/chitchat/sessions", {
    method: "POST",
    body: JSON.stringify({ language }),
  });
}

export async function submitChitChatResponse(
  sessionId: number,
  questionId: number,
  audioBase64: string
): Promise<void> {
  await apiJSON(`/chitchat/sessions/${sessionId}/responses`, {
    method: "POST",
    body: JSON.stringify({ questionId, audioBase64 }),
  });
}

export async function completeChitChatSession(sessionId: number): Promise<void> {
  await apiJSON(`/chitchat/sessions/${sessionId}/complete`, {
    method: "POST",
  });
}

export async function fetchChitChatSession(sessionId: number): Promise<unknown> {
  return apiJSON(`/chitchat/sessions/${sessionId}`);
}

// ── Chit-Chat Caregiver Analysis ──────────────────────────────────────────

export interface ChitChatAlert {
  id: number;
  sessionId: number;
  level: "info" | "watch" | "concern";
  message: string;
  moodScore: number;
  date: string;
}

export interface MoodTrendPoint {
  date: string;
  moodScore: number;
  moodLabel: string;
}

export interface ThemeCount {
  theme: string;
  count: number;
}

export interface ChitChatAnalysis {
  moodTrend: MoodTrendPoint[];
  topThemes: ThemeCount[];
  latestReport: {
    sessionId: number;
    date: string;
    summaryBullets: string[];
    moodScore: number;
    themes: string[];
    responseLength: number | null;
  } | null;
  responseLengthTrend: Array<{ date: string; avgWords: number | null }>;
  totalSessions: number;
}

export interface ChitChatSessionDetail {
  id: number;
  language: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  responses: Array<{
    id: number;
    questionId: number;
    questionText: string;
    transcript: string | null;
    createdAt: string;
  }>;
  report: {
    id: number;
    summaryBullets: string;
    moodScore: number;
    themes: string;
    alertLevel: string | null;
    alertMessage: string | null;
    responseLength: number | null;
    fullReport: string;
    createdAt: string;
  } | null;
}

export async function fetchChitChatSessions(
  patientId: number,
  limit: number = 7
): Promise<{ sessions: ChitChatSessionDetail[]; total: number }> {
  return apiJSON(`/caregiver/patients/${patientId}/chitchat/sessions?limit=${limit}`);
}

export async function fetchChitChatAnalysis(patientId: number, days: number = 30): Promise<ChitChatAnalysis> {
  return apiJSON(`/caregiver/patients/${patientId}/chitchat/analysis?days=${days}`);
}

export async function fetchChitChatAlerts(patientId: number): Promise<{ alerts: ChitChatAlert[] }> {
  return apiJSON(`/caregiver/patients/${patientId}/chitchat/alerts`);
}

// ── Activity Log (extended type for chit-chat) ────────────────────────────

export interface ApiActivityLog {
  id: number;
  patientId: number;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
  timestamp?: string;
}
