import { Router, Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { verifyPatientToken } from "../middleware/auth";
import { activityLogSchema } from "../utils/validation";
import { getIO, broadcastSync } from "../socket";

const router = Router();
const prisma = new PrismaClient();

// All routes require patient authentication
router.use(verifyPatientToken);

// ─── POST /activity ──────────────────────────────────────
// Logs a patient activity (game score, reminder completion, mood check-in).
// 1. Saves to activity_logs table
// 2. Emits via Socket.io to the patient's room so linked caregivers receive it

router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = activityLogSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const { type, payload } = parsed.data;
    const patientId = req.user!.id;

    // 1. Save to database
    const log = await prisma.activityLog.create({
      data: {
        patientId,
        type,
        payload: payload as Prisma.InputJsonValue,
      },
    });

    // 2. Emit via broadcastSync and legacy event
    const io = getIO();
    broadcastSync(io, patientId, "activity", "created", log);

    io.of("/care").to(`patient:${patientId}`).emit("activity:new", {
      id: log.id,
      patientId,
      type: log.type,
      payload: log.payload,
      createdAt: log.createdAt,
    });

    res.status(201).json({
      message: "Activity logged",
      activity: log,
    });
  } catch (err) {
    console.error("[Activity Log]", err);
    res.status(500).json({ error: "Failed to log activity" });
  }
});

export default router;
