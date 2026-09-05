// ── Groq Whisper Transcription Service ────────────────────────────────────
// Transcribes audio blobs using Groq's hosted Whisper model.

import { env } from "../config/env";

const GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

// Map internal language codes to Whisper language hints
const LANG_MAP: Record<string, string> = {
  en: "en",
  as: "as",   // Assamese — Whisper supports it
  mn: "mni",  // Meitei/Manipuri — ISO 639-3 code
};

export interface TranscriptionResult {
  text: string;
  language: string;
}

/**
 * Transcribe a single audio file using Groq Whisper API.
 * @param audioBase64 Base64-encoded audio data (webm or mp3)
 * @param language App language code: "en" | "as" | "mn"
 * @param filename Optional filename for the audio
 */
export async function transcribeAudio(
  audioBase64: string,
  language: string,
  filename: string = "recording.webm"
): Promise<TranscriptionResult> {
  if (!env.GROQ_API_KEY) {
    console.warn("[Groq Whisper] No API key configured — returning placeholder transcript");
    return {
      text: "[Transcription unavailable — GROQ_API_KEY not set]",
      language,
    };
  }

  try {
    // Convert base64 to Buffer
    const audioBuffer = Buffer.from(audioBase64, "base64");

    // Build multipart form data manually using native Node APIs
    const boundary = "----SmritiBoundary" + Date.now();
    const whisperLang = LANG_MAP[language] || "en";

    const parts: Buffer[] = [];

    // File part
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: audio/webm\r\n\r\n`
    ));
    parts.push(audioBuffer);
    parts.push(Buffer.from("\r\n"));

    // Model part
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${env.WHISPER_MODEL}\r\n`
    ));

    // Language hint part
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\n${whisperLang}\r\n`
    ));

    // Response format
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\njson\r\n`
    ));

    // End boundary
    parts.push(Buffer.from(`--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Groq Whisper] API error ${response.status}:`, errText);
      return {
        text: `[Transcription failed: ${response.status}]`,
        language,
      };
    }

    const result = await response.json() as { text: string };
    console.log(`[Groq Whisper] Transcribed (${language}): "${result.text.substring(0, 80)}..."`);

    return {
      text: result.text || "",
      language,
    };
  } catch (err) {
    console.error("[Groq Whisper] Transcription error:", err);
    return {
      text: "[Transcription error]",
      language,
    };
  }
}

/**
 * Transcribe multiple audio responses in sequence.
 */
export async function transcribeAll(
  responses: Array<{ audioBase64: string; questionId: number }>,
  language: string
): Promise<Map<number, string>> {
  const results = new Map<number, string>();

  for (const resp of responses) {
    if (!resp.audioBase64) {
      results.set(resp.questionId, "[No audio recorded]");
      continue;
    }

    const result = await transcribeAudio(
      resp.audioBase64,
      language,
      `q${resp.questionId}_recording.webm`
    );
    results.set(resp.questionId, result.text);
  }

  return results;
}
