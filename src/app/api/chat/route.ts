import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateChatReply } from "@/lib/openai";
import { chatSchema } from "@/lib/validations";

const SYSTEM_INSTRUCTIONS =
  "You are a knowledgeable and friendly AI study tutor. Help students " +
  "understand concepts, answer questions, provide clear explanations, " +
  "suggest study strategies, and encourage learning. Keep answers clear, " +
  "concise, and student-friendly. Use examples and analogies when they help. " +
  "If a student asks something outside of studying, gently redirect them.";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await db.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Chat GET error:", error);
    return NextResponse.json(
      { error: "Failed to load chat history." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Fetch recent conversation for context (last 10 messages)
    const history = await db.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const conversationHistory = history.reverse().map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const reply = await generateChatReply(
      SYSTEM_INSTRUCTIONS,
      conversationHistory,
      parsed.data.message
    );

    if (!reply) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    // Save both messages in a single transaction
    const [userMessage, assistantMessage] = await db.$transaction([
      db.chatMessage.create({
        data: {
          role: "user",
          content: parsed.data.message,
          userId: session.user.id,
        },
      }),
      db.chatMessage.create({
        data: {
          role: "assistant",
          content: reply,
          userId: session.user.id,
        },
      }),
    ]);

    return NextResponse.json({ userMessage, assistantMessage });
  } catch (error) {
    console.error("Chat POST error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get AI response.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.chatMessage.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ message: "Chat history cleared." });
  } catch (error) {
    console.error("Chat DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to clear chat history." },
      { status: 500 }
    );
  }
}
