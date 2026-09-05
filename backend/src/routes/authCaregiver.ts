import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword, generateTokens } from "../services/auth";
import { caregiverRegisterSchema, caregiverLoginSchema } from "../utils/validation";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();
const prisma = new PrismaClient();

// ─── POST /auth/caregiver/register ───────────────────────

router.post("/register", async (req: Request, res: Response) => {
  try {
    const parsed = caregiverRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const { name, email, phone, password, role } = parsed.data;

    // Check if email already registered
    const existing = await prisma.caregiver.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "A caregiver with this email already exists" });
      return;
    }

    const passwordHash = await hashPassword(password);

    const caregiver = await prisma.caregiver.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role,
      },
    });

    const tokens = generateTokens({ id: caregiver.id, type: "caregiver" });

    res.status(201).json({
      message: "Caregiver registered successfully",
      caregiver: {
        id: caregiver.id,
        name: caregiver.name,
        email: caregiver.email,
        phone: caregiver.phone,
        role: caregiver.role,
        avatar: caregiver.avatar,
      },
      ...tokens,
    });
  } catch (err) {
    console.error("[Caregiver Register]", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ─── POST /auth/caregiver/login ──────────────────────────

router.post("/login", authLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = caregiverLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const { email, password } = parsed.data;

    const caregiver = await prisma.caregiver.findUnique({ where: { email } });
    if (!caregiver) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await verifyPassword(password, caregiver.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const tokens = generateTokens({ id: caregiver.id, type: "caregiver" });

    res.json({
      message: "Login successful",
      caregiver: {
        id: caregiver.id,
        name: caregiver.name,
        email: caregiver.email,
        phone: caregiver.phone,
        role: caregiver.role,
        avatar: caregiver.avatar,
      },
      ...tokens,
    });
  } catch (err) {
    console.error("[Caregiver Login]", err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
