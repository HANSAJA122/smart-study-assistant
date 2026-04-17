import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateChatReply } from "@/lib/ollama";
import { chatSchema } from "@/lib/validations";
import {
  assertTrustedOrigin,
  handleApiError,
  parseJsonBody,
  requireAiRateLimit,
  requireAuth,
} from "@/lib/api-security";
import {
  CHAT_STUDY_TUTOR_SYSTEM_PROMPT,
  isClearlyNonEducationalUserInput,
  studyScopeRejectResponse,
} from "@/lib/study-ai-scope";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;

    const messages = await db.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return NextResponse.json(messages);
  } catch (error) {
    return handleApiError(error, "chat GET");
  }
}

export async function POST(req: Request) {
  try {
    const forbidden = assertTrustedOrigin(req);
    if (forbidden) return forbidden;

    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      console.warn("[api] chat POST: unauthenticated");
      return authResult;
    }
    const userId = authResult;

    const limited = requireAiRateLimit(userId);
    if (limited !== true) return limited;

    const raw = await parseJsonBody(req);
    if (raw instanceof NextResponse) return raw;

    const parsed = chatSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    if (isClearlyNonEducationalUserInput(parsed.data.message)) {
      return studyScopeRejectResponse("chat:message", parsed.data.message.slice(0, 80));
    }

    const history = await db.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const conversationHistory = history.reverse().map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const reply = await generateChatReply(
      CHAT_STUDY_TUTOR_SYSTEM_PROMPT,
      conversationHistory,
      parsed.data.message
    );

    if (!reply) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    const [userMessage, assistantMessage] = await db.$transaction([
      db.chatMessage.create({
        data: {
          role: "user",
          content: parsed.data.message,
          userId,
        },
      }),
      db.chatMessage.create({
        data: {
          role: "assistant",
          content: reply,
          userId,
        },
      }),
    ]);

    return NextResponse.json({ userMessage, assistantMessage });
  } catch (error) {
    return handleApiError(error, "chat POST", {
      fallbackMessage: "Failed to get AI response.",
    });
  }
}

export async function DELETE() {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;

    await db.chatMessage.deleteMany({
      where: { userId },
    });

    return NextResponse.json({ message: "Chat history cleared." });
  } catch (error) {
    return handleApiError(error, "chat DELETE", {
      fallbackMessage: "Failed to clear chat history.",
    });
  }
}
