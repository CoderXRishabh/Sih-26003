// ── Chit-Chat Caregiver Routes ────────────────────────────────────────────
// Provides analysis data, session history, and alerts for the caregiver dashboard.

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyCaregiverToken } from "../middleware/auth";
import { verifyActiveLink } from "../services/linkGuard";

const router = Router();
const prisma = new PrismaClient();

// All routes require caregiver authentication
router.use(verifyCaregiverToken);

// ─── GET /caregiver/patients/:patientId/chitchat/sessions ───────────────
// List chit-chat sessions for a patient. Default: last 7.

router.get("/patients/:patientId/chitchat/sessions", async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(String(req.params.patientId), 10);
    if (isNaN(patientId)) {
      res.status(400).json({ error: "Invalid patient ID" });
      return;
    }

    const link = await verifyActiveLink(req.user!.id, patientId);
    if (!link) {
      res.status(403).json({ error: "Not authorized to view this patient" });
      return;
    }

    const limit = parseInt(req.query.limit as string, 10) || 7;
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const sessions = await prisma.chitChatSession.findMany({
      where: { patientId, status: { in: ["completed", "partial"] } },
      include: {
        responses: {
          select: {
            id: true,
            questionId: true,
            questionText: true,
            transcript: true,
            createdAt: true,
          },
        },
        report: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.chitChatSession.count({
      where: { patientId, status: { in: ["completed", "partial"] } },
    });

    res.json({ sessions, total, limit, offset });
  } catch (err) {
    console.error("[ChitChat Caregiver] Sessions list error:", err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// ─── GET /caregiver/patients/:patientId/chitchat/sessions/:sessionId ────
// Get a single session with full details.

router.get("/patients/:patientId/chitchat/sessions/:sessionId", async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(String(req.params.patientId), 10);
    const sessionId = parseInt(String(req.params.sessionId), 10);
    if (isNaN(patientId) || isNaN(sessionId)) {
      res.status(400).json({ error: "Invalid parameters" });
      return;
    }

    const link = await verifyActiveLink(req.user!.id, patientId);
    if (!link) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const session = await prisma.chitChatSession.findFirst({
      where: { id: sessionId, patientId },
      include: {
        responses: {
          select: {
            id: true,
            questionId: true,
            questionText: true,
            transcript: true,
            createdAt: true,
          },
        },
        report: true,
      },
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.json({ session });
  } catch (err) {
    console.error("[ChitChat Caregiver] Session detail error:", err);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// ─── GET /caregiver/patients/:patientId/chitchat/analysis ───────────────
// Aggregated analysis data for charting (mood trends, themes, metrics).

router.get("/patients/:patientId/chitchat/analysis", async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(String(req.params.patientId), 10);
    if (isNaN(patientId)) {
      res.status(400).json({ error: "Invalid patient ID" });
      return;
    }

    const link = await verifyActiveLink(req.user!.id, patientId);
    if (!link) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const days = parseInt(req.query.days as string, 10) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const sessions = await prisma.chitChatSession.findMany({
      where: {
        patientId,
        status: { in: ["completed", "partial"] },
        createdAt: { gte: since },
      },
      include: { report: true },
      orderBy: { createdAt: "asc" },
    });

    // Build mood trend data
    const moodTrend = sessions
      .filter((s) => s.report)
      .map((s) => ({
        date: s.createdAt.toISOString().split("T")[0],
        moodScore: s.report!.moodScore,
        moodLabel: JSON.parse(s.report!.fullReport || "{}").mood_label || "neutral",
      }));

    // Aggregate themes
    const themeCount: Record<string, number> = {};
    sessions.forEach((s) => {
      if (!s.report) return;
      const themes = JSON.parse(s.report.themes || "[]") as string[];
      themes.forEach((t) => {
        themeCount[t] = (themeCount[t] || 0) + 1;
      });
    });

    const topThemes = Object.entries(themeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([theme, count]) => ({ theme, count }));

    // Latest report summary
    const latestSession = sessions[sessions.length - 1];
    const latestReport = latestSession?.report
      ? {
          sessionId: latestSession.id,
          date: latestSession.createdAt.toISOString(),
          summaryBullets: JSON.parse(latestSession.report.summaryBullets || "[]"),
          moodScore: latestSession.report.moodScore,
          themes: JSON.parse(latestSession.report.themes || "[]"),
          responseLength: latestSession.report.responseLength,
        }
      : null;

    // Average response length trend
    const responseLengthTrend = sessions
      .filter((s) => s.report?.responseLength != null)
      .map((s) => ({
        date: s.createdAt.toISOString().split("T")[0],
        avgWords: s.report!.responseLength,
      }));

    res.json({
      moodTrend,
      topThemes,
      latestReport,
      responseLengthTrend,
      totalSessions: sessions.length,
      dateRange: { from: since.toISOString(), to: new Date().toISOString() },
    });
  } catch (err) {
    console.error("[ChitChat Caregiver] Analysis error:", err);
    res.status(500).json({ error: "Failed to fetch analysis" });
  }
});

// ─── GET /caregiver/patients/:patientId/chitchat/alerts ─────────────────
// AI-generated alerts from chit-chat sessions.

router.get("/patients/:patientId/chitchat/alerts", async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(String(req.params.patientId), 10);
    if (isNaN(patientId)) {
      res.status(400).json({ error: "Invalid patient ID" });
      return;
    }

    const link = await verifyActiveLink(req.user!.id, patientId);
    if (!link) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const reports = await prisma.chitChatReport.findMany({
      where: {
        session: { patientId },
        alertLevel: { not: null },
        alertMessage: { not: null },
      },
      include: {
        session: {
          select: { id: true, createdAt: true, language: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const alerts = reports.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      level: r.alertLevel as "info" | "watch" | "concern",
      message: r.alertMessage!,
      moodScore: r.moodScore,
      date: r.session.createdAt.toISOString(),
    }));

    res.json({ alerts });
  } catch (err) {
    console.error("[ChitChat Caregiver] Alerts error:", err);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

export default router;
