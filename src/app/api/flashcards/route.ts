import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateJSON } from "@/lib/ollama";
import {
  flashcardGenerateSchema,
  flashcardToggleSchema,
} from "@/lib/validations";
import {
  assertTrustedOrigin,
  handleApiError,
  parseJsonBody,
  requireAiRateLimit,
  requireAuth,
} from "@/lib/api-security";
import {
  buildFlashcardGeneratorSystemPrompt,
  isClearlyNonEducationalUserInput,
  studyScopeRejectResponse,
} from "@/lib/study-ai-scope";

interface GeneratedCard {
  front: string;
  back: string;
}

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;

    const flashcards = await db.flashcard.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(flashcards);
  } catch (error) {
    return handleApiError(error, "flashcards GET", {
      fallbackMessage: "Failed to load flashcards.",
    });
  }
}

export async function POST(req: Request) {
  try {
    const forbidden = assertTrustedOrigin(req);
    if (forbidden) return forbidden;

    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      console.warn("[api] flashcards POST: unauthenticated");
      return authResult;
    }
    const userId = authResult;

    const limited = requireAiRateLimit(userId);
    if (limited !== true) return limited;

    const raw = await parseJsonBody(req);
    if (raw instanceof NextResponse) return raw;

    const parsed = flashcardGenerateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { topic, numberOfCards, subjectId } = parsed.data;

    if (isClearlyNonEducationalUserInput(topic)) {
      return studyScopeRejectResponse("flashcards:topic", topic.slice(0, 80));
    }

    const cards = await generateJSON<GeneratedCard[]>(
      buildFlashcardGeneratorSystemPrompt(numberOfCards),
      `Topic or study focus for the flashcards (stay strictly within educational material): ${topic}`,
      { temperature: 0.7, maxOutputTokens: 2500, wrapperKey: "flashcards" }
    );

    if (!Array.isArray(cards)) {
      return NextResponse.json(
        { error: "AI failed to generate flashcards. Try again." },
        { status: 502 }
      );
    }
    if (cards.length === 0) {
      return studyScopeRejectResponse("flashcards:empty-model", topic.slice(0, 80));
    }

    const validated = cards.filter(
      (c) =>
        typeof c.front === "string" &&
        typeof c.back === "string" &&
        c.front.length > 0 &&
        c.back.length > 0
    );

    if (validated.length === 0) {
      return NextResponse.json(
        { error: "AI returned cards in an unexpected format. Try again." },
        { status: 502 }
      );
    }

    const created = await db.$transaction(
      validated.map((card) =>
        db.flashcard.create({
          data: {
            front: card.front,
            back: card.back,
            userId,
            subjectId: subjectId || null,
          },
        })
      )
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error, "flashcards POST", {
      fallbackMessage: "Failed to generate flashcards.",
    });
  }
}

export async function PUT(req: Request) {
  try {
    const forbidden = assertTrustedOrigin(req);
    if (forbidden) return forbidden;

    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;

    const raw = await parseJsonBody(req);
    if (raw instanceof NextResponse) return raw;

    const parsed = flashcardToggleSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { cardId } = parsed.data;

    const card = await db.flashcard.findFirst({
      where: { id: cardId, userId },
    });

    if (!card) {
      return NextResponse.json({ error: "Flashcard not found." }, { status: 404 });
    }

    const updated = await db.flashcard.update({
      where: { id: cardId, userId },
      data: { mastered: !card.mastered },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "flashcards PUT", {
      fallbackMessage: "Failed to update flashcard.",
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || id.length > 64) {
      return NextResponse.json(
        { error: "Flashcard ID is required." },
        { status: 400 }
      );
    }

    const deleted = await db.flashcard.deleteMany({
      where: { id, userId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Flashcard not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Flashcard deleted." });
  } catch (error) {
    return handleApiError(error, "flashcards DELETE", {
      fallbackMessage: "Failed to delete flashcard.",
    });
  }
}
