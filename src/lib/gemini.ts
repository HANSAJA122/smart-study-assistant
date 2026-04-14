import { GoogleGenAI, ApiError } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "Missing GEMINI_API_KEY environment variable. Add it to your .env file."
  );
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = "gemini-3.1-flash-lite-preview";

const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 2000, 4000];

function isRetryable(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 503 || error.status === 429;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("unavailable") || msg.includes("503") || msg.includes("overloaded");
  }
  return false;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const lastAttempt = attempt === MAX_RETRIES - 1;
      if (!isRetryable(error) || lastAttempt) {
        if (isRetryable(error)) {
          throw new Error(
            "The AI service is currently experiencing high demand. Please wait a moment and try again."
          );
        }
        throw error;
      }
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
    }
  }
  throw new Error("The AI service is temporarily unavailable. Please try again shortly.");
}

/**
 * Generates plain text from Gemini given a system instruction and user input.
 */
export async function generateText(
  systemInstruction: string,
  userMessage: string,
  opts?: { temperature?: number; maxOutputTokens?: number }
): Promise<string> {
  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: userMessage,
      config: {
        systemInstruction,
        temperature: opts?.temperature ?? 0.7,
        maxOutputTokens: opts?.maxOutputTokens ?? 1024,
      },
    })
  );

  return response.text ?? "";
}

/**
 * Generates a response and parses it as JSON.
 * Strips markdown code fences the model may wrap around the output.
 */
export async function generateJSON<T = unknown>(
  systemInstruction: string,
  userMessage: string,
  opts?: { temperature?: number; maxOutputTokens?: number }
): Promise<T> {
  const raw = await generateText(systemInstruction, userMessage, {
    temperature: opts?.temperature ?? 0.4,
    maxOutputTokens: opts?.maxOutputTokens ?? 2048,
  });

  const cleaned = raw
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      "The AI returned an unexpected response format. Please try again."
    );
  }
}

/**
 * Generates a chat reply with multi-turn conversation context.
 * Builds a Gemini-compatible contents array from the history.
 */
export async function generateChatReply(
  systemInstruction: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  userMessage: string
): Promise<string> {
  const contents = [
    ...conversationHistory.map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    })),
    { role: "user" as const, parts: [{ text: userMessage }] },
  ];

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    })
  );

  return response.text ?? "";
}
