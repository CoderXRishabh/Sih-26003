import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword, generateTokens } from "../services/auth";
import { generateCareCode } from "../services/careCode";
import { patientRegisterSchema, patientLoginSchema } from "../utils/validation";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();
const prisma = new PrismaClient();

// ─── POST /auth/patient/register ─────────────────────────

router.post("/register", async (req: Request, res: Response) => {
  try {
    const parsed = patientRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const { name, phone, password, age, language, email } = parsed.data;

    // Check if phone already registered
    const existing = await prisma.patient.findUnique({ where: { phone } });
    if (existing) {
      res.status(409).json({ error: "A patient with this phone number already exists" });
      return;
    }

    // Generate unique Care Code (retry on collision)
    let careCode: string;
    let attempts = 0;
    do {
      careCode = generateCareCode();
      const codeExists = await prisma.patient.findUnique({ where: { careCode } });
      if (!codeExists) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      res.status(500).json({ error: "Failed to generate unique Care Code — please retry" });
      return;
    }

    const passwordHash = await hashPassword(password);

    const patient = await prisma.patient.create({
      data: {
        name,
        phone,
        email: email || null,
        age,
        language,
        careCode,
        passwordHash,
      },
    });

    const tokens = generateTokens({ id: patient.id, type: "patient" });

    res.status(201).json({
      message: "Patient registered successfully",
      patient: {
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        age: patient.age,
        careCode: patient.careCode,
        language: patient.language,
        emergencyContact: patient.emergencyContact,
        avatar: patient.avatar,
      },
      ...tokens,
    });
  } catch (err) {
    console.error("[Patient Register]", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ─── POST /auth/patient/login ────────────────────────────

router.post("/login", authLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = patientLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const { phone, password } = parsed.data;

    const patient = await prisma.patient.findUnique({ where: { phone } });
    if (!patient) {
      res.status(401).json({ error: "Invalid phone number or password" });
      return;
    }

    const valid = await verifyPassword(password, patient.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid phone number or password" });
      return;
    }

    // Long-lived refresh token (90 days) — patient device stays signed in
    const tokens = generateTokens({ id: patient.id, type: "patient" });

    res.json({
      message: "Login successful",
      patient: {
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        age: patient.age,
        careCode: patient.careCode,
        language: patient.language,
        emergencyContact: patient.emergencyContact,
        avatar: patient.avatar,
      },
      ...tokens,
    });
  } catch (err) {
    console.error("[Patient Login]", err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
