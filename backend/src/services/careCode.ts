import crypto from "crypto";
import QRCode from "qrcode";

/**
 * Generates a unique 6-character alphanumeric Care Code in the format SM-XXXX.
 * Uses crypto.randomBytes for unpredictability.
 */
export function generateCareCode(): string {
  // Generate 4 random alphanumeric characters (uppercase + digits)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded ambiguous: 0, O, I, 1
  let code = "";
  const bytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `SM-${code}`;
}

/**
 * Generates a QR code data URI encoding the Care Code.
 * The QR encodes a JSON payload so scanners can identify the source app.
 */
export async function generateQRDataURI(careCode: string): Promise<string> {
  const payload = JSON.stringify({
    app: "smriti",
    type: "care_code",
    code: careCode,
  });

  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
    color: {
      dark: "#2E6F6E",  // Smriti teal
      light: "#FAF6EF", // Smriti cream background
    },
  });
}
