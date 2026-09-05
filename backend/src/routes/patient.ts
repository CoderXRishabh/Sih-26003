import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyPatientToken } from "../middleware/auth";
import { generateQRDataURI } from "../services/careCode";
import { createReminderSchema, updatePatientProfileSchema } from "../utils/validation";
import { broadcastSync } from "../socket";

const router = Router();
const prisma = new PrismaClient();

// All routes require patient authentication
router.use(verifyPatientToken);

// ─── GET /patient/profile ────────────────────────────────

router.get("/profile", async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        age: true,
        language: true,
        careCode: true,
        emergencyContact: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!patient) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    res.json({ patient });
  } catch (err) {
    console.error("[Patient Profile GET]", err);
    res.status(500).json({ error: "Failed to fetch patient profile" });
  }
});

// ─── PATCH /patient/profile ──────────────────────────────

router.patch("/profile", async (req: Request, res: Response) => {
  try {
    const parsed = updatePatientProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const patient = await prisma.patient.update({
      where: { id: req.user!.id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        age: true,
        language: true,
        careCode: true,
        emergencyContact: true,
        avatar: true,
        createdAt: true,
      },
    });

    broadcastSync(req.app.get("io"), req.user!.id, "patient_profile", "updated", patient);

    res.json({ message: "Profile updated successfully", patient });
  } catch (err) {
    console.error("[Patient Profile PATCH]", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ─── GET /patient/care-code ──────────────────────────────

router.get("/care-code", async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.user!.id },
      select: { careCode: true },
    });

    if (!patient) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    const qrDataUri = await generateQRDataURI(patient.careCode);

    res.json({
      careCode: patient.careCode,
      qr: qrDataUri,
    });
  } catch (err) {
    console.error("[Care Code]", err);
    res.status(500).json({ error: "Failed to fetch Care Code" });
  }
});

// ─── GET /patient/reminders ──────────────────────────────

router.get("/reminders", async (req: Request, res: Response) => {
  try {
    const rawReminders = await prisma.reminder.findMany({
      where: { patientId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });

    const reminders = rawReminders.map((r) => ({
      id: r.id,
      patientId: r.patientId,
      title: r.label,
      time: r.scheduledTime,
      category: r.type,
      frequency: r.frequency || "daily",
      days: JSON.parse(r.days || "[]"),
      isCompleted: !!r.completedAt,
      completedAt: r.completedAt,
      createdAt: r.createdAt,
    }));

    res.json({ reminders });
  } catch (err) {
    console.error("[Patient Reminders]", err);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

// ─── POST /patient/reminders ─────────────────────────────

router.post("/reminders", async (req: Request, res: Response) => {
  try {
    const parsed = createReminderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const type = parsed.data.type || parsed.data.category || "medicine";
    const label = parsed.data.label || parsed.data.title || "Reminder";
    const scheduledTime = parsed.data.scheduled_time || parsed.data.time || "9:00 AM";
    const frequency = parsed.data.frequency || "daily";
    const days = JSON.stringify(parsed.data.days || []);

    const reminder = await prisma.reminder.create({
      data: {
        patientId: req.user!.id,
        type,
        label,
        scheduledTime,
        frequency,
        days,
      },
    });

    const reminderPayload = {
      id: reminder.id,
      patientId: reminder.patientId,
      title: reminder.label,
      time: reminder.scheduledTime,
      category: reminder.type,
      frequency: reminder.frequency,
      days: JSON.parse(reminder.days || "[]"),
      isCompleted: !!reminder.completedAt,
      completedAt: reminder.completedAt,
      createdAt: reminder.createdAt,
    };

    broadcastSync(req.app.get("io"), req.user!.id, "reminder", "created", reminderPayload);

    res.status(201).json({ reminder: reminderPayload });
  } catch (err) {
    console.error("[Create Reminder]", err);
    res.status(500).json({ error: "Failed to create reminder" });
  }
});

// ─── PATCH /patient/reminders/:id/complete ───────────────

router.patch("/reminders/:id/complete", async (req: Request, res: Response) => {
  try {
    const reminderId = parseInt(req.params.id as string, 10);
    if (isNaN(reminderId)) {
      res.status(400).json({ error: "Invalid reminder ID" });
      return;
    }

    // Verify the reminder belongs to this patient
    const existing = await prisma.reminder.findFirst({
      where: { id: reminderId, patientId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({ error: "Reminder not found" });
      return;
    }

    const reminder = await prisma.reminder.update({
      where: { id: reminderId },
      data: { completedAt: existing.completedAt ? null : new Date() },
    });

    const reminderPayload = {
      id: reminder.id,
      patientId: reminder.patientId,
      title: reminder.label,
      time: reminder.scheduledTime,
      category: reminder.type,
      frequency: reminder.frequency,
      days: JSON.parse(reminder.days || "[]"),
      isCompleted: !!reminder.completedAt,
      completedAt: reminder.completedAt,
      createdAt: reminder.createdAt,
    };

    broadcastSync(req.app.get("io"), req.user!.id, "reminder", "updated", reminderPayload);

    res.json({ reminder: reminderPayload });
  } catch (err) {
    console.error("[Complete Reminder]", err);
    res.status(500).json({ error: "Failed to complete reminder" });
  }
});

// ─── DELETE /patient/reminders/:id ────────────────────────

router.delete("/reminders/:id", async (req: Request, res: Response) => {
  try {
    const reminderId = parseInt(req.params.id as string, 10);
    if (isNaN(reminderId)) {
      res.status(400).json({ error: "Invalid reminder ID" });
      return;
    }

    const existing = await prisma.reminder.findFirst({
      where: { id: reminderId, patientId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({ error: "Reminder not found" });
      return;
    }

    await prisma.reminder.delete({ where: { id: reminderId } });

    broadcastSync(req.app.get("io"), req.user!.id, "reminder", "deleted", { id: reminderId });

    res.json({ message: "Reminder deleted successfully", id: reminderId });
  } catch (err) {
    console.error("[Delete Reminder]", err);
    res.status(500).json({ error: "Failed to delete reminder" });
  }
});

export default router;
