import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyCaregiverToken } from "../middleware/auth";
import { linkPatientLimiter } from "../middleware/rateLimiter";
import { verifyActiveLink } from "../services/linkGuard";
import { linkPatientSchema, updateCaregiverProfileSchema } from "../utils/validation";
import { broadcastSync } from "../socket";

const router = Router();
const prisma = new PrismaClient();

// All routes require caregiver authentication
router.use(verifyCaregiverToken);

// ─── GET /caregiver/profile ──────────────────────────────

router.get("/profile", async (req: Request, res: Response) => {
  try {
    const caregiver = await prisma.caregiver.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!caregiver) {
      res.status(404).json({ error: "Caregiver not found" });
      return;
    }

    res.json({ caregiver });
  } catch (err) {
    console.error("[Caregiver Profile GET]", err);
    res.status(500).json({ error: "Failed to fetch caregiver profile" });
  }
});

// ─── PATCH /caregiver/profile ────────────────────────────

router.patch("/profile", async (req: Request, res: Response) => {
  try {
    const parsed = updateCaregiverProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const caregiver = await prisma.caregiver.update({
      where: { id: req.user!.id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    res.json({ message: "Profile updated successfully", caregiver });
  } catch (err) {
    console.error("[Caregiver Profile PATCH]", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ─── POST /caregiver/link-patient ────────────────────────
// Links a caregiver to a patient via Care Code. Rate-limited.

router.post("/link-patient", linkPatientLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = linkPatientSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const { care_code, permission_level } = parsed.data;
    const caregiverId = req.user!.id;

    // Find patient by Care Code
    const patient = await prisma.patient.findUnique({
      where: { careCode: care_code },
      select: { id: true, name: true, careCode: true },
    });

    if (!patient) {
      res.status(404).json({ error: "No patient found with this Care Code" });
      return;
    }

    // Check if link already exists
    const existingLink = await prisma.patientCaregiverLink.findUnique({
      where: {
        patientId_caregiverId: {
          patientId: patient.id,
          caregiverId,
        },
      },
    });

    if (existingLink) {
      if (existingLink.status === "active") {
        res.status(409).json({ error: "You are already linked to this patient" });
        return;
      }

      // Re-activate a previously revoked link
      const reactivated = await prisma.patientCaregiverLink.update({
        where: { id: existingLink.id },
        data: { status: "active", permissionLevel: permission_level, linkedAt: new Date() },
      });

      broadcastSync(req.app.get("io"), patient.id, "link", "created", { caregiverId, patientId: patient.id });

      res.json({
        message: "Link reactivated",
        link: reactivated,
        patient: { id: patient.id, name: patient.name },
      });
      return;
    }

    // Create new link — auto-approved (possessing Care Code implies authorization)
    const link = await prisma.patientCaregiverLink.create({
      data: {
        patientId: patient.id,
        caregiverId,
        permissionLevel: permission_level,
        status: "active",
      },
    });

    broadcastSync(req.app.get("io"), patient.id, "link", "created", { caregiverId, patientId: patient.id });

    res.status(201).json({
      message: "Patient linked successfully",
      link,
      patient: { id: patient.id, name: patient.name },
    });
  } catch (err) {
    console.error("[Link Patient]", err);
    res.status(500).json({ error: "Failed to link patient" });
  }
});

// ─── GET /caregiver/patients ─────────────────────────────
// Lists all patients linked to this caregiver with basic info.

router.get("/patients", async (req: Request, res: Response) => {
  try {
    const links = await prisma.patientCaregiverLink.findMany({
      where: {
        caregiverId: req.user!.id,
        status: "active",
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            age: true,
            language: true,
            careCode: true,
          },
        },
      },
      orderBy: { linkedAt: "desc" },
    });

    const patients = links.map((link) => ({
      ...link.patient,
      permissionLevel: link.permissionLevel,
      linkedAt: link.linkedAt,
    }));

    res.json({ patients });
  } catch (err) {
    console.error("[List Patients]", err);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

// ─── DELETE /caregiver/unlink/:patientId ─────────────────
// Revokes the link (soft delete — sets status to "revoked").

router.delete("/unlink/:patientId", async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId as string, 10);
    if (isNaN(patientId)) {
      res.status(400).json({ error: "Invalid patient ID" });
      return;
    }

    const link = await verifyActiveLink(req.user!.id, patientId);
    if (!link) {
      res.status(404).json({ error: "No active link found with this patient" });
      return;
    }

    await prisma.patientCaregiverLink.update({
      where: { id: link.id },
      data: { status: "revoked" },
    });

    broadcastSync(req.app.get("io"), patientId, "link", "deleted", { caregiverId: req.user!.id, patientId });

    res.json({ message: "Patient unlinked successfully" });
  } catch (err) {
    console.error("[Unlink Patient]", err);
    res.status(500).json({ error: "Failed to unlink patient" });
  }
});

// ─── GET /caregiver/patients/:patientId/activity ─────────
// Fetches activity logs for a linked patient. Link-guarded.

router.get("/patients/:patientId/activity", async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId as string, 10);
    if (isNaN(patientId)) {
      res.status(400).json({ error: "Invalid patient ID" });
      return;
    }

    const link = await verifyActiveLink(req.user!.id, patientId);
    if (!link) {
      res.status(403).json({ error: "You are not authorized to view this patient's data" });
      return;
    }

    const logs = await prisma.activityLog.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      take: 50, // Last 50 entries
    });

    res.json({ activity: logs });
  } catch (err) {
    console.error("[Patient Activity]", err);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

// ─── GET /caregiver/patients/:patientId/reminders ────────
// Fetches reminders for a linked patient. Link-guarded.

router.get("/patients/:patientId/reminders", async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId as string, 10);
    if (isNaN(patientId)) {
      res.status(400).json({ error: "Invalid patient ID" });
      return;
    }

    const link = await verifyActiveLink(req.user!.id, patientId);
    if (!link) {
      res.status(403).json({ error: "You are not authorized to view this patient's data" });
      return;
    }

    const rawReminders = await prisma.reminder.findMany({
      where: { patientId },
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

// ─── POST /caregiver/patients/:patientId/reminders ───────

router.post("/patients/:patientId/reminders", async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId as string, 10);
    if (isNaN(patientId)) {
      res.status(400).json({ error: "Invalid patient ID" });
      return;
    }

    const link = await verifyActiveLink(req.user!.id, patientId);
    if (!link) {
      res.status(403).json({ error: "You are not authorized to manage this patient's reminders" });
      return;
    }

    const body = req.body || {};
    const type = body.type || body.category || "medicine";
    const label = body.label || body.title || "Reminder";
    const scheduledTime = body.scheduled_time || body.time || "9:00 AM";
    const frequency = body.frequency || "daily";
    const days = JSON.stringify(body.days || []);

    const reminder = await prisma.reminder.create({
      data: {
        patientId,
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

    broadcastSync(req.app.get("io"), patientId, "reminder", "created", reminderPayload);

    res.status(201).json({ reminder: reminderPayload });
  } catch (err) {
    console.error("[Caregiver Add Reminder]", err);
    res.status(500).json({ error: "Failed to add reminder" });
  }
});

// ─── DELETE /caregiver/patients/:patientId/reminders/:id ─

router.delete("/patients/:patientId/reminders/:id", async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId as string, 10);
    const reminderId = parseInt(req.params.id as string, 10);
    if (isNaN(patientId) || isNaN(reminderId)) {
      res.status(400).json({ error: "Invalid parameters" });
      return;
    }

    const link = await verifyActiveLink(req.user!.id, patientId);
    if (!link) {
      res.status(403).json({ error: "You are not authorized to delete this patient's reminders" });
      return;
    }

    const existing = await prisma.reminder.findFirst({
      where: { id: reminderId, patientId },
    });

    if (!existing) {
      res.status(404).json({ error: "Reminder not found" });
      return;
    }

    await prisma.reminder.delete({ where: { id: reminderId } });

    broadcastSync(req.app.get("io"), patientId, "reminder", "deleted", { id: reminderId });

    res.json({ message: "Reminder deleted successfully", id: reminderId });
  } catch (err) {
    console.error("[Caregiver Delete Reminder]", err);
    res.status(500).json({ error: "Failed to delete reminder" });
  }
});

export default router;
