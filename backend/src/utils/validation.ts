import { z } from "zod";

// ─── Auth: Patient ───────────────────────────────────────

export const patientRegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15)
    .regex(/^\+?[0-9\s-]+$/, "Phone number contains invalid characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  age: z.number().int().min(1).max(150),
  language: z.string().default("en"),
  email: z.string().email().optional().or(z.literal("")),
});

export const patientLoginSchema = z.object({
  phone: z.string().min(10).max(15),
  password: z.string().min(1, "Password is required"),
});

// ─── Auth: Caregiver ─────────────────────────────────────

export const caregiverRegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email is required"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15)
    .regex(/^\+?[0-9\s-]+$/, "Phone number contains invalid characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().min(1, "Role is required"),
});

export const caregiverLoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

// ─── Auth: Refresh ───────────────────────────────────────

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// ─── Care Code Linking ───────────────────────────────────

export const linkPatientSchema = z.object({
  care_code: z
    .string()
    .min(1, "Care Code is required")
    .regex(/^SM-[A-Z0-9]{4,6}$/i, "Care Code must be in format SM-XXXX"),
  permission_level: z.string().default("full"),
});

// ─── Activity Logging ────────────────────────────────────

export const activityLogSchema = z.object({
  type: z.string().min(1, "Activity type is required"),
  payload: z.record(z.unknown()),
});

// ─── Reminders ───────────────────────────────────────────

export const createReminderSchema = z.object({
  type: z.string().optional(),
  category: z.string().optional(),
  label: z.string().optional(),
  title: z.string().optional(),
  scheduled_time: z.string().optional(),
  time: z.string().optional(),
  frequency: z.string().default("daily"),
  days: z.array(z.string()).optional().default([]),
}).refine(
  (data) => (data.type || data.category) && (data.label || data.title) && (data.scheduled_time || data.time),
  { message: "Category, title/label, and time are required" }
);

// ─── Profile Update ─────────────────────────────────────

export const updatePatientProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal("")).or(z.null()),
  phone: z.string().min(10).max(15).optional(),
  age: z.number().int().min(1).max(150).optional(),
  language: z.string().optional(),
  emergencyContact: z.string().optional().or(z.null()),
  avatar: z.string().optional(),
});

export const updateCaregiverProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  role: z.string().optional(),
  avatar: z.string().optional(),
});
