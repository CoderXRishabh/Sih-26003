import { Router, Request, Response } from "express";
import { verifyRefreshToken, generateTokens } from "../services/auth";
import { refreshTokenSchema } from "../utils/validation";

const router = Router();

// ─── POST /auth/refresh ──────────────────────────────────
// Accepts a refresh token, returns a new access token + new refresh token.
// Works for both patient and caregiver tokens (type is embedded in payload).

router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = refreshTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const { refreshToken } = parsed.data;

    const payload = verifyRefreshToken(refreshToken);
    const tokens = generateTokens({ id: payload.id, type: payload.type });

    res.json({
      message: "Tokens refreshed",
      ...tokens,
    });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

export default router;
