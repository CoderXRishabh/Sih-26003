// ── Chit-Chat Quiz Routes (Patient-Facing) ───────────────────────────────
// Handles starting sessions, submitting voice responses, and completing quizzes.

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyPatientToken } from "../middleware/auth";
import { pickRandomQuestions, QUESTION_BANK } from "../data/questionBank";
import { transcribeAudio } from "../services/groqWhisper";
import { generateAnalysisReport } from "../services/nemotronAnalysis";
import { broadcastSync } from "../socket";

const router = Router();
const prisma = new PrismaClient();

// All routes require patient authentication
router.use(verifyPatientToken);

// ─── POST /chitchat/sessions — Start a new quiz session ─────────────────

router.post("/sessions", async (req: Request, res: Response) => {
  try {
    const patientId = req.user!.id;
    const language = (req.body.language as string) || "en";

    // Pick 5 random questions
    const questions = pickRandomQuestions(5);
    const questionIds = questions.map((q) => q.id);

    // Create session
    const session = await prisma.chitChatSession.create({
      data: {
        patientId,
        language,
        status: "in_progress",
        questionIds: JSON.stringify(questionIds),
      },
    });

    // Return session with questions in the requested language
    const lang = language as "en" | "as" | "mn";
    const sessionQuestions = questions.map((q) => ({
      id: q.id,
      text: q.text[lang] || q.text.en,
      audioFile: q.audioFile[lang] || q.audioFile.en,
    }));

    res.status(201).json({
      session: {
        id: session.id,
        language: session.language,
        status: session.status,
        createdAt: session.createdAt,
      },
      questions: sessionQuestions,
    });
  } catch (err) {
    console.error("[ChitChat] Start session error:", err);
    res.status(500).json({ error: "Failed to start chit-chat session" });
  }
});

// ─── POST /chitchat/sessions/:id/responses — Submit a voice answer ──────

router.post("/sessions/:id/responses", async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    if (isNaN(sessionId)) {
      res.status(400).json({ error: "Invalid session ID" });
      return;
    }

    // Verify session belongs to this patient
    const session = await prisma.chitChatSession.findFirst({
      where: { id: sessionId, patientId: req.user!.id },
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (session.status === "completed") {
      res.status(400).json({ error: "Session already completed" });
      return;
    }

    const { questionId, audioBase64 } = req.body;

    if (!questionId) {
      res.status(400).json({ error: "questionId is required" });
      return;
    }

    // Look up question text
    const lang = session.language as "en" | "as" | "mn";
    const question = QUESTION_BANK.find((q) => q.id === questionId);
    const questionText = question?.text[lang] || question?.text.en || `Question ${questionId}`;

    // Save the response
    const response = await prisma.chitChatResponse.create({
      data: {
        sessionId,
        questionId,
        questionText,
        audioBase64: audioBase64 || null,
      },
    });

    res.status(201).json({
      response: {
        id: response.id,
        questionId: response.questionId,
        saved: true,
      },
    });
  } catch (err) {
    console.error("[ChitChat] Submit response error:", err);
    res.status(500).json({ error: "Failed to save response" });
  }
});

// ─── POST /chitchat/sessions/:id/complete — Finish and trigger pipeline ─

router.post("/sessions/:id/complete", async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    if (isNaN(sessionId)) {
      res.status(400).json({ error: "Invalid session ID" });
      return;
    }

    const patientId = req.user!.id;

    // Verify session
    const session = await prisma.chitChatSession.findFirst({
      where: { id: sessionId, patientId },
      include: { responses: true },
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (session.status === "completed") {
      res.status(400).json({ error: "Session already completed" });
      return;
    }

    // Determine status
    const questionIds: number[] = JSON.parse(session.questionIds || "[]");
    const isPartial = session.responses.length < questionIds.length;
    const status = isPartial ? "partial" : "completed";

    // Update session status
    await prisma.chitChatSession.update({
      where: { id: sessionId },
      data: { status, completedAt: new Date() },
    });

    // Return immediately, process transcription + analysis in background
    res.json({
      session: { id: sessionId, status },
      message: "Session completed. Analysis will be processed in the background.",
    });

    // ── Background Processing Pipeline ──────────────────────

    processSessionAsync(sessionId, patientId, session.language, session.responses, req.app.get("io")).catch((err) => {
      console.error("[ChitChat Pipeline] Background processing failed:", err);
    });
  } catch (err) {
    console.error("[ChitChat] Complete session error:", err);
    res.status(500).json({ error: "Failed to complete session" });
  }
});

// ─── GET /chitchat/sessions/:id — Get session details ───────────────────

router.get("/sessions/:id", async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    if (isNaN(sessionId)) {
      res.status(400).json({ error: "Invalid session ID" });
      return;
    }

    const session = await prisma.chitChatSession.findFirst({
      where: { id: sessionId, patientId: req.user!.id },
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
    console.error("[ChitChat] Get session error:", err);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// ─── GET /chitchat/questions — Get full question bank ───────────────────

router.get("/questions", async (req: Request, res: Response) => {
  const language = (req.query.language as string) || "en";
  const lang = language as "en" | "as" | "mn";

  const questions = QUESTION_BANK.map((q) => ({
    id: q.id,
    text: q.text[lang] || q.text.en,
    audioFile: q.audioFile[lang] || q.audioFile.en,
  }));

  res.json({ questions });
});

// ─── Background Processing Pipeline ─────────────────────────────────────

async function processSessionAsync(
  sessionId: number,
  patientId: number,
  language: string,
  responses: Array<{ id: number; questionId: number; questionText: string; audioBase64: string | null }>,
  io: any
) {
  console.log(`[ChitChat Pipeline] Starting for session #${sessionId}...`);

  // Step 1: Transcribe all audio responses
  for (const resp of responses) {
    if (!resp.audioBase64) continue;

    try {
      const result = await transcribeAudio(resp.audioBase64, language, `q${resp.questionId}.webm`);

      await prisma.chitChatResponse.update({
        where: { id: resp.id },
        data: { transcript: result.text },
      });

      console.log(`[ChitChat Pipeline] Transcribed Q${resp.questionId}: "${result.text.substring(0, 60)}..."`);
    } catch (err) {
      console.error(`[ChitChat Pipeline] Transcription failed for Q${resp.questionId}:`, err);
    }
  }

  // Step 2: Fetch updated transcripts
  const updatedResponses = await prisma.chitChatResponse.findMany({
    where: { sessionId },
    orderBy: { questionId: "asc" },
  });

  const qaPairs = updatedResponses.map((r) => ({
    question_id: r.questionId,
    question_text: r.questionText,
    answer_text: r.transcript || "[No response recorded]",
  }));

  // Step 3: Fetch historical session data for comparison
  const historicalSessions = await prisma.chitChatSession.findMany({
    where: {
      patientId,
      status: "completed",
      id: { not: sessionId },
    },
    include: { report: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const history = historicalSessions
    .filter((s) => s.report)
    .map((s) => ({
      session_date: s.createdAt.toISOString().split("T")[0],
      mood_score: s.report!.moodScore,
      themes: JSON.parse(s.report!.themes || "[]") as string[],
      summary: (JSON.parse(s.report!.summaryBullets || "[]") as string[]).join("; "),
    }));

  // Step 4: Generate AI analysis report
  console.log(`[ChitChat Pipeline] Generating analysis with ${history.length} historical sessions...`);
  const report = await generateAnalysisReport(qaPairs, language, history);

  // Step 5: Store the report
  await prisma.chitChatReport.create({
    data: {
      sessionId,
      summaryBullets: JSON.stringify(report.summary_bullets),
      moodScore: report.mood_score,
      themes: JSON.stringify(report.themes),
      alertLevel: report.alert.level,
      alertMessage: report.alert.message,
      responseLength: report.metrics.avg_response_length,
      fullReport: JSON.stringify(report),
    },
  });

  console.log(`[ChitChat Pipeline] Report stored for session #${sessionId}`);

  // Step 6: Log activity
  await prisma.activityLog.create({
    data: {
      patientId,
      type: "chitchat",
      payload: {
        sessionId,
        questionsAnswered: qaPairs.length,
        moodScore: report.mood_score,
        alertLevel: report.alert.level,
      },
    },
  });

  // Step 7: Broadcast to caregivers via Socket.io
  broadcastSync(io, patientId, "chitchat", "created", {
    sessionId,
    moodScore: report.mood_score,
    alertLevel: report.alert.level,
    alertMessage: report.alert.message,
  });

  console.log(`[ChitChat Pipeline] Complete for session #${sessionId}`);
}

export default router;
