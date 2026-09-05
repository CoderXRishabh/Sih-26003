import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

// ─── Types ───────────────────────────────────────────────

export interface TokenPayload {
  id: number;
  type: "patient" | "caregiver";
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── Password Hashing ────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ─── JWT Token Generation ────────────────────────────────

export function generateTokens(payload: TokenPayload): TokenPair {
  const refreshExpiry =
    payload.type === "patient"
      ? env.PATIENT_REFRESH_EXPIRY
      : env.CAREGIVER_REFRESH_EXPIRY;

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: refreshExpiry,
  });

  return { accessToken, refreshToken };
}

// ─── JWT Verification ────────────────────────────────────

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
