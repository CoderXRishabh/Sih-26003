import { Request, Response, NextFunction } from "express";

/**
 * Global error handler — catches unhandled errors and returns
 * a consistent JSON response. Logs the full error server-side.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[ERROR]", err.message, err.stack);

  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { details: err.message }),
  });
}
