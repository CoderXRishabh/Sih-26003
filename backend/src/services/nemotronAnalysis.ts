// ── NVIDIA Nemotron Analysis Service ──────────────────────────────────────
// Generates structured AI analysis reports from chit-chat Q&A transcripts.

import { env } from "../config/env";

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

// ── Output Schema ────────────────────────────────────────────────────────

export interface AnalysisReport {
  summary_bullets: string[];
  mood_score: number;          // 1-10
  mood_label: string;          // e.g. "positive", "neutral", "low", "anxious"
  themes: string[];            // e.g. ["sleep", "appetite", "social_interaction"]
  notable_statements: string[];
  behavioral_mentions: string[];
  comparison_notes: string[];  // vs previous sessions
  alert: {
    level: "info" | "watch" | "concern" | null;
    message: string | null;
  };
  metrics: {
    avg_response_length: number;  // avg words per answer
    topic_diversity: number;      // 1-10
    positive_negative_ratio: number;
  };
}

interface QAPair {
  question_id: number;
  question_text: string;
  answer_text: string;
}

interface HistoricalSummary {
  session_date: string;
  mood_score: number;
  themes: string[];
  summary: string;
}

// ── Prompt Builder ───────────────────────────────────────────────────────

function buildAnalysisPrompt(
  qaPairs: QAPair[],
  language: string,
  history: HistoricalSummary[]
): string {
  const langName = language === "en" ? "English" : language === "as" ? "Assamese" : "Meitei (Manipuri)";

  const historySection = history.length > 0
    ? `\n## Previous Session History (for trend comparison)\n${history.map((h, i) =>
        `Session ${i + 1} (${h.session_date}): Mood=${h.mood_score}/10, Themes=[${h.themes.join(", ")}]\nSummary: ${h.summary}`
      ).join("\n\n")}\n`
    : "\nNo previous session history available — this is the first session.\n";

  return `You are a compassionate elderly care AI analyst for a dementia care app called "Smriti".
You are analyzing spoken responses from an elderly patient during a daily chit-chat quiz session.
The responses were originally spoken in ${langName} and transcribed via speech-to-text.

## Current Session Q&A Pairs
${qaPairs.map((qa) =>
  `Q${qa.question_id}: "${qa.question_text}"\nA${qa.question_id}: "${qa.answer_text}"`
).join("\n\n")}
${historySection}
## Your Task
Analyze the patient's responses and return a SINGLE JSON object (no markdown fencing, no extra text) with this exact schema:

{
  "summary_bullets": ["string array of 3-5 key observations in plain English"],
  "mood_score": <number 1-10, where 1=very low/distressed, 5=neutral, 10=very positive>,
  "mood_label": "<one of: positive, neutral, low, anxious, confused, mixed>",
  "themes": ["array of detected themes, e.g.: sleep, appetite, social_interaction, pain, medication, activity, family, memory, routine"],
  "notable_statements": ["any concerning or noteworthy quotes from the patient"],
  "behavioral_mentions": ["mentions of sleep, eating, activity, pain, etc."],
  "comparison_notes": ["how this session compares to previous ones, if history available"],
  "alert": {
    "level": "<info|watch|concern|null>",
    "message": "<natural language alert for caregiver, or null if none warranted>"
  },
  "metrics": {
    "avg_response_length": <average number of words per answer>,
    "topic_diversity": <1-10 how varied the topics discussed>,
    "positive_negative_ratio": <ratio of positive to negative sentiment words, e.g. 1.5>
  }
}

Important guidelines:
- Be empathetic and clinically aware in your analysis.
- If the transcription is poor or incomplete, note it but still attempt analysis.
- If responses are in ${langName}, translate key observations to English for the summary.
- Compare against historical data when available to detect trends.
- Only raise an alert if genuinely warranted — do not over-alert.
- Return ONLY the JSON object, no other text.`;
}

// ── Main Analysis Function ───────────────────────────────────────────────

function generateHeuristicReport(qaPairs: QAPair[]): AnalysisReport {
  const allText = qaPairs.map((qa) => qa.answer_text || "").join(" ");
  const wordCount = allText.split(/\s+/).filter(Boolean).length;
  const avgWords = Math.round((wordCount / Math.max(qaPairs.length, 1)) * 10) / 10;

  const bullets: string[] = [];
  const themes: string[] = [];

  qaPairs.forEach((qa) => {
    const ans = (qa.answer_text || "").toLowerCase();
    if (!ans) return;
    if (qa.question_text.toLowerCase().includes("water") || ans.includes("water") || ans.includes("liter") || ans.includes("drink")) {
      bullets.push(`Hydration: Patient shared fluid intake details ("${qa.answer_text.trim()}").`);
      themes.push("hydration");
    } else if (qa.question_text.toLowerCase().includes("visit") || ans.includes("friend") || ans.includes("team") || ans.includes("talk")) {
      bullets.push(`Social Connection: Patient engaged with friends or family ("${qa.answer_text.trim()}").`);
      themes.push("social_interaction");
    } else if (qa.question_text.toLowerCase().includes("food") || ans.includes("eat") || ans.includes("oats") || ans.includes("omelet") || ans.includes("rice")) {
      bullets.push(`Nutrition: Patient mentioned meal choices ("${qa.answer_text.trim()}").`);
      themes.push("nutrition");
    } else if (qa.question_text.toLowerCase().includes("happy") || ans.includes("happy") || ans.includes("show") || ans.includes("enjoy")) {
      bullets.push(`Positive Activity: Patient expressed joy/entertainment ("${qa.answer_text.trim()}").`);
      themes.push("mood");
    } else {
      bullets.push(`Q: "${qa.question_text}" — "${qa.answer_text.trim()}"`);
    }
  });

  if (bullets.length === 0) {
    bullets.push(`Patient completed quiz session answering ${qaPairs.length} questions.`);
  }

  let moodScore = 7;
  if (allText.includes("sad") || allText.includes("lonely") || allText.includes("pain") || allText.includes("sick")) {
    moodScore = 4;
  } else if (allText.includes("happy") || allText.includes("friend") || allText.includes("good") || allText.includes("enjoy")) {
    moodScore = 8;
  }

  return {
    summary_bullets: bullets.slice(0, 5),
    mood_score: moodScore,
    mood_label: moodScore >= 7 ? "positive" : moodScore >= 5 ? "neutral" : "low",
    themes: Array.from(new Set(themes.concat(["routine", "cognition"]))),
    notable_statements: qaPairs.map((q) => q.answer_text).filter(Boolean).slice(0, 3),
    behavioral_mentions: themes,
    comparison_notes: [],
    alert: moodScore <= 4
      ? { level: "watch", message: "Patient expressed signs of low mood or distress during quiz." }
      : { level: "info", message: "Session completed smoothly with healthy cognitive engagement." },
    metrics: {
      avg_response_length: avgWords,
      topic_diversity: Math.min(themes.length * 2 + 4, 10),
      positive_negative_ratio: 1.4,
    },
  };
}

export async function generateAnalysisReport(
  qaPairs: QAPair[],
  language: string,
  history: HistoricalSummary[] = []
): Promise<AnalysisReport> {
  const heuristicFallback = generateHeuristicReport(qaPairs);

  if (!env.NVIDIA_API_KEY) {
    console.warn("[Nemotron] No API key configured — returning heuristic report");
    return heuristicFallback;
  }

  const modelCandidates = [
    env.NEMOTRON_MODEL || "meta/llama-3.2-11b-vision-instruct",
    "meta/llama-3.2-11b-vision-instruct",
  ];

  for (const model of modelCandidates) {
    try {
      const prompt = buildAnalysisPrompt(qaPairs, language, history);

      const response = await fetch(NVIDIA_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 2048,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Nemotron] API error for model ${model} (${response.status}):`, errText);
        continue;
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };

      const content = data.choices?.[0]?.message?.content || "";

      let jsonStr = content.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      const parsed = JSON.parse(jsonStr) as AnalysisReport;

      if (!parsed.summary_bullets || !Array.isArray(parsed.summary_bullets) || parsed.summary_bullets.length === 0) {
        parsed.summary_bullets = heuristicFallback.summary_bullets;
      }
      if (typeof parsed.mood_score !== "number" || parsed.mood_score < 1 || parsed.mood_score > 10) {
        parsed.mood_score = heuristicFallback.mood_score;
      }
      if (!parsed.mood_label) parsed.mood_label = heuristicFallback.mood_label;
      if (!Array.isArray(parsed.themes) || parsed.themes.length === 0) parsed.themes = heuristicFallback.themes;
      if (!parsed.alert) parsed.alert = heuristicFallback.alert;
      if (!parsed.metrics) parsed.metrics = heuristicFallback.metrics;

      console.log(`[Nemotron] AI Analysis complete via model ${model}: mood=${parsed.mood_score}, themes=${parsed.themes.join(",")}`);
      return parsed;
    } catch (err) {
      console.error(`[Nemotron] Model ${model} failed:`, err);
    }
  }

  console.warn("[Nemotron] All API candidates failed — returning transcript heuristic report");
  return heuristicFallback;
}
