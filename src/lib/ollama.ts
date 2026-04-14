const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3";

interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaChatResponse {
  message: { role: string; content: string };
  done: boolean;
}

/**
 * Translates raw fetch errors into friendly, actionable messages.
 */
function friendlyError(error: unknown): never {
  if (error instanceof TypeError && (error as NodeJS.ErrnoException).cause) {
    const cause = (error as NodeJS.ErrnoException).cause as NodeJS.ErrnoException;
    if (cause.code === "ECONNREFUSED") {
      throw new Error(
        "Cannot connect to Ollama. Make sure Ollama is installed and running " +
          `(start it with: ollama serve). Expected at ${OLLAMA_BASE_URL}`
      );
    }
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("fetch") || msg.includes("econnrefused") || msg.includes("network")) {
      throw new Error(
        "Cannot connect to Ollama. Make sure Ollama is installed and running " +
          "(start it with: ollama serve)."
      );
    }
  }
  throw error;
}

/**
 * Core function that calls the Ollama /api/chat endpoint (non-streaming).
 */
async function ollamaChat(messages: OllamaChatMessage[], temperature: number): Promise<string> {
  let res: Response;

  try {
    res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        options: { temperature },
      }),
    });
  } catch (error) {
    friendlyError(error);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");

    if (res.status === 404 || body.includes("not found")) {
      throw new Error(
        `The model "${OLLAMA_MODEL}" is not available. Pull it first with: ollama pull ${OLLAMA_MODEL}`
      );
    }
    throw new Error(
      `Ollama returned an error (HTTP ${res.status}). Make sure Ollama is running and the model "${OLLAMA_MODEL}" is pulled.`
    );
  }

  const data = (await res.json()) as OllamaChatResponse;
  return data.message?.content ?? "";
}

/**
 * Generates plain text given a system instruction and user message.
 */
export async function generateText(
  systemInstruction: string,
  userMessage: string,
  opts?: { temperature?: number; maxOutputTokens?: number }
): Promise<string> {
  const messages: OllamaChatMessage[] = [
    { role: "system", content: systemInstruction },
    { role: "user", content: userMessage },
  ];

  return ollamaChat(messages, opts?.temperature ?? 0.7);
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

  // Strip markdown fences (```json ... ```) and any leading/trailing text
  let cleaned = raw
    .replace(/^[\s\S]*?```(?:json)?\s*\n?/i, "")
    .replace(/\n?```[\s\S]*$/i, "")
    .trim();

  // If the model didn't use fences, try to extract the first JSON array or object
  if (!cleaned.startsWith("[") && !cleaned.startsWith("{")) {
    const match = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (match) {
      cleaned = match[1];
    }
  }

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
 */
export async function generateChatReply(
  systemInstruction: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  userMessage: string
): Promise<string> {
  const messages: OllamaChatMessage[] = [
    { role: "system", content: systemInstruction },
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  return ollamaChat(messages, 0.7);
}
