import express from "express";
import cors from "cors";
import { createServer } from "http";
import { env } from "./config/env";
import { initSocket } from "./socket";
import { initReminderCron } from "./services/cron";
import { errorHandler } from "./middleware/errorHandler";

// ─── Route imports ───────────────────────────────────────
import authPatientRoutes from "./routes/authPatient";
import authCaregiverRoutes from "./routes/authCaregiver";
import authRefreshRoutes from "./routes/authRefresh";
import patientRoutes from "./routes/patient";
import caregiverRoutes from "./routes/caregiver";
import activityRoutes from "./routes/activity";
import chitchatRoutes from "./routes/chitchat";
import chitchatCaregiverRoutes from "./routes/chitchatCaregiver";

// ─── App Setup ───────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "50mb" })); // Increased for base64 audio uploads

// ─── Health Check & Root ─────────────────────────────────

app.get("/", (_req, res) => {
  res.json({
    name: "Smriti Dementia Care API",
    status: "online",
    healthCheck: "/health",
    endpoints: {
      authPatient: "/auth/patient",
      authCaregiver: "/auth/caregiver",
      patient: "/patient",
      caregiver: "/caregiver",
      activity: "/activity",
      chitchat: "/chitchat",
    },
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "smriti-backend",
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ──────────────────────────────────────────────

// Auth
app.use("/auth/patient", authPatientRoutes);
app.use("/auth/caregiver", authCaregiverRoutes);
app.use("/auth/refresh", authRefreshRoutes);

// Patient-facing (requires patient token)
app.use("/patient", patientRoutes);

// Caregiver-facing (requires caregiver token)
app.use("/caregiver", caregiverRoutes);

// Activity logging (requires patient token, emits socket events)
app.use("/activity", activityRoutes);

// Chit-chat voice quiz (requires patient token)
app.use("/chitchat", chitchatRoutes);

// Chit-chat caregiver analysis (requires caregiver token)
app.use("/caregiver", chitchatCaregiverRoutes);

// ─── Error Handler ───────────────────────────────────────

app.use(errorHandler);

// ─── Socket.io & Cron ────────────────────────────────────

const io = initSocket(httpServer);
app.set("io", io);
initReminderCron(io);

// ─── Start Server ────────────────────────────────────────

httpServer.listen(env.PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║          🪷  Smriti Backend Running  🪷          ║
╠══════════════════════════════════════════════════╣
║  REST API:   http://localhost:${env.PORT}              ║
║  Socket.io:  ws://localhost:${env.PORT}/care            ║
║  Health:     http://localhost:${env.PORT}/health         ║
╚══════════════════════════════════════════════════╝
  `);
});

export default app;
