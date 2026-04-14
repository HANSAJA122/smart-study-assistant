import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "Missing OPENAI_API_KEY environment variable. Add it to your .env file."
  );
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Calls the OpenAI Responses API and returns the plain-text output.
 * Centralises model choice, error handling, and the output-text extraction
 * so every route handler stays slim.
 */
export async function generateText(
  instructions: string,
  input: string,
  opts?: { temperature?: number; maxOutputTokens?: number }
): Promise<string> {
  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    instructions,
    input,
    temperature: opts?.temperature ?? 0.7,
    max_output_tokens: opts?.maxOutputTokens ?? 1024,
  });

  // The SDK adds an `output_text` convenience accessor that concatenates
  // all output_text content items from the response.
  return response.output_text ?? "";
}

/**
 * Calls the Responses API and parses the reply as JSON.
 * Strips any markdown code fences the model might wrap around the JSON,
 * then parses.  Throws on failure so callers get a clear error.
 */
export async function generateJSON<T = unknown>(
  instructions: string,
  input: string,
  opts?: { temperature?: number; maxOutputTokens?: number }
): Promise<T> {
  const raw = await generateText(instructions, input, {
    temperature: opts?.temperature ?? 0.4,
    maxOutputTokens: opts?.maxOutputTokens ?? 2048,
  });

  // Strip markdown fences the model sometimes adds (```json ... ```)
  const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `OpenAI returned text that is not valid JSON.\n\nRaw output:\n${raw.slice(0, 500)}`
    );
  }
}

/**
 * Calls the Responses API with multi-turn conversation context.
 * Uses the `input` array format that the Responses API accepts
 * for conversational flows.
 */
export async function generateChatReply(
  instructions: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  userMessage: string
): Promise<string> {
  const input = [
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    instructions,
    input,
    temperature: 0.7,
    max_output_tokens: 1024,
  });

  return response.output_text ?? "";
}
