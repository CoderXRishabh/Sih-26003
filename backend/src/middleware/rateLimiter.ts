import rateLimit from "express-rate-limit";

/**
 * Rate limiter for the Care Code link endpoint.
 * Care Codes are short (SM-XXXX, ~30^4 = ~810k combinations),
 * so we aggressively limit brute-force attempts.
 *
 * Max 5 attempts per 15 minutes per IP.
 */
export const linkPatientLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many link attempts — please try again in 15 minutes",
  },
});

/**
 * General auth rate limiter — prevents credential stuffing.
 * Max 10 login attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many login attempts — please try again later",
  },
});
