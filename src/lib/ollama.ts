const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "";

if (!OLLAMA_BASE_URL) {
  throw new Error(
    "Missing OLLAMA_BASE_URL environment variable. Set it in your .env file."
  );
}

interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaChatResponse {
  message: { role: string; content: string };
  done: boolean;
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (OLLAMA_API_KEY) {
    headers["Authorization"] = `Bearer ${OLLAMA_API_KEY}`;
  }
  return headers;
}

/**
 * Translates raw fetch errors into friendly, actionable messages.
 */
function friendlyError(error: unknown): never {
  if (error instanceof TypeError && (error as NodeJS.ErrnoException).cause) {
    const cause = (error as NodeJS.ErrnoException).cause as NodeJS.ErrnoException;
    if (cause.code === "ECONNREFUSED") {
      throw new Error(
        `Cannot connect to Ollama at ${OLLAMA_BASE_URL}. Check your OLLAMA_BASE_URL and make sure the server is reachable.`
      );
    }
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("fetch") || msg.includes("econnrefused") || msg.includes("network")) {
      throw new Error(
        `Cannot reach Ollama at ${OLLAMA_BASE_URL}. Check your network connection and OLLAMA_BASE_URL.`
      );
    }
  }
  throw error;
}

/**
 * Handles non-OK HTTP responses with user-friendly messages.
 */
function handleHttpError(status: number, body: string): never {
  if (status === 401 || body.includes("unauthorized") || body.includes("invalid key") || body.includes("invalid api key")) {
    throw new Error(
      "Authentication failed. Your OLLAMA_API_KEY is missing or invalid. Check your .env file."
    );
  }
  if (status === 403) {
    throw new Error(
      "Access denied. Your Ollama API key does not have permission for this request."
    );
  }
  if (status === 429 || body.includes("rate limit") || body.includes("quota") || body.includes("too many")) {
    throw new Error(
      "Rate limit or quota exceeded. Please wait a moment and try again."
    );
  }
  if (status === 404 || body.includes("not found") || body.includes("model")) {
    throw new Error(
      `The model "${OLLAMA_MODEL}" was not found. Check that the model name is correct and available on your Ollama server.`
    );
  }
  if (status === 502 || status === 503 || status === 504) {
    throw new Error(
      "The Ollama server is temporarily unavailable. Please try again in a moment."
    );
  }
  throw new Error(
    `Ollama returned an error (HTTP ${status}). Check your OLLAMA_BASE_URL, OLLAMA_API_KEY, and OLLAMA_MODEL in .env.`
  );
}

/**
 * Calls the Ollama /api/chat endpoint (non-streaming).
 * When jsonMode is true, Ollama constrains the output to valid JSON.
 */
async function ollamaChat(
  messages: OllamaChatMessage[],
  temperature: number,
  jsonMode = false
): Promise<string> {
  let res: Response;

  try {
    res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        ...(jsonMode && { format: "json" }),
        options: { temperature },
      }),
    });
  } catch (error) {
    friendlyError(error);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    handleHttpError(res.status, body.toLowerCase());
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
 * Uses Ollama's JSON mode for reliable structured output.
 * Accepts a `wrapperKey` — when provided the prompt should ask for
 * `{ [wrapperKey]: [...] }` and this function extracts the inner array.
 */
export async function generateJSON<T = unknown>(
  systemInstruction: string,
  userMessage: string,
  opts?: { temperature?: number; maxOutputTokens?: number; wrapperKey?: string }
): Promise<T> {
  const messages: OllamaChatMessage[] = [
    { role: "system", content: systemInstruction },
    { role: "user", content: userMessage },
  ];

  const raw = await ollamaChat(messages, opts?.temperature ?? 0.4, true);

  let cleaned = raw
    .replace(/^[\s\S]*?```(?:json)?\s*\n?/i, "")
    .replace(/\n?```[\s\S]*$/i, "")
    .trim();

  if (!cleaned.startsWith("[") && !cleaned.startsWith("{")) {
    const match = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (match) {
      cleaned = match[1];
    }
  }

  try {
    const parsed = JSON.parse(cleaned);

    if (opts?.wrapperKey && typeof parsed === "object" && !Array.isArray(parsed)) {
      const inner = parsed[opts.wrapperKey];
      if (Array.isArray(inner)) {
        return inner as T;
      }
      for (const val of Object.values(parsed)) {
        if (Array.isArray(val)) return val as T;
      }
    }

    return parsed as T;
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
