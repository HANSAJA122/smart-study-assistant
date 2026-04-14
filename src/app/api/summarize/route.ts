import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateText } from "@/lib/ollama";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const noteId = body?.noteId;
    if (!noteId || typeof noteId !== "string") {
      return NextResponse.json(
        { error: "A valid noteId is required." },
        { status: 400 }
      );
    }

    const note = await db.note.findUnique({
      where: { id: noteId, userId: session.user.id },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    const summary = await generateText(
      "You are a study assistant. Summarize the following student notes into " +
        "concise, well-organized bullet points that capture every key concept. " +
        "Keep language clear and student-friendly.",
      `Please summarize these notes:\n\n${note.content}`,
      { temperature: 0.4, maxOutputTokens: 600 }
    );

    if (!summary) {
      return NextResponse.json(
        { error: "AI returned an empty summary. Please try again." },
        { status: 502 }
      );
    }

    const updated = await db.note.update({
      where: { id: noteId },
      data: { summary },
      include: { subject: { select: { name: true, color: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Summarize error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to summarize note.";
    const status = message.includes("Cannot connect") || message.includes("not available") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
