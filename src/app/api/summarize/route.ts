import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateText } from "@/lib/ollama";
import { summarizeRequestSchema } from "@/lib/validations";
import {
  assertTrustedOrigin,
  handleApiError,
  parseJsonBody,
  requireAiRateLimit,
  requireAuth,
} from "@/lib/api-security";
import { SUMMARIZE_STUDY_ASSISTANT_SYSTEM_PROMPT } from "@/lib/study-ai-scope";

export async function POST(req: Request) {
  try {
    const forbidden = assertTrustedOrigin(req);
    if (forbidden) return forbidden;

    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      console.warn("[api] summarize POST: unauthenticated");
      return authResult;
    }
    const userId = authResult;

    const limited = requireAiRateLimit(userId);
    if (limited !== true) return limited;

    const raw = await parseJsonBody(req);
    if (raw instanceof NextResponse) return raw;

    const parsed = summarizeRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { noteId } = parsed.data;

    const note = await db.note.findFirst({
      where: { id: noteId, userId },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    const summary = await generateText(
      SUMMARIZE_STUDY_ASSISTANT_SYSTEM_PROMPT,
      `Summarize the following student notes into concise, well-organized bullet points that capture every key concept. Use clear, student-friendly language.\n\n---\n${note.content}\n---`,
      { temperature: 0.4, maxOutputTokens: 600 }
    );

    if (!summary) {
      return NextResponse.json(
        { error: "AI returned an empty summary. Please try again." },
        { status: 502 }
      );
    }

    const updated = await db.note.update({
      where: { id: noteId, userId },
      data: { summary },
      include: { subject: { select: { name: true, color: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "summarize POST", {
      fallbackMessage: "Failed to summarize note.",
    });
  }
}
