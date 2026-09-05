import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../services/auth";

// ─── Extend Express Request ─────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// ─── Helper: Extract Bearer Token ───────────────────────

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

// ─── Patient Auth Middleware ─────────────────────────────

export function verifyPatientToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== "patient") {
      res.status(403).json({ error: "Access denied — patient token required" });
      return;
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ─── Caregiver Auth Middleware ───────────────────────────

export function verifyCaregiverToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== "caregiver") {
      res.status(403).json({ error: "Access denied — caregiver token required" });
      return;
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
