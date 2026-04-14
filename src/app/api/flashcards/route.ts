import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateJSON } from "@/lib/ollama";
import { flashcardGenerateSchema } from "@/lib/validations";

interface GeneratedCard {
  front: string;
  back: string;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const flashcards = await db.flashcard.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(flashcards);
  } catch (error) {
    console.error("Flashcards GET error:", error);
    return NextResponse.json(
      { error: "Failed to load flashcards." },
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
    const parsed = flashcardGenerateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { topic, numberOfCards, subjectId } = parsed.data;

    const cards = await generateJSON<GeneratedCard[]>(
      `You are a flashcard creator for students. Create exactly ${numberOfCards} ` +
        "flashcards about the given topic. Each card should have a concise question " +
        "or term on the front and a clear answer or definition on the back. " +
        "Return ONLY a JSON array with this schema:\n" +
        '[{"front":"question or term","back":"answer or definition"}]\n' +
        "Do NOT wrap the JSON in markdown fences. Do NOT include any text outside the array.",
      `Create flashcards about: ${topic}`,
      { temperature: 0.7, maxOutputTokens: 2500 }
    );

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: "AI failed to generate flashcards. Try again." },
        { status: 502 }
      );
    }

    // Validate each card before persisting
    const validated = cards.filter(
      (c) => typeof c.front === "string" && typeof c.back === "string" && c.front.length > 0 && c.back.length > 0
    );

    if (validated.length === 0) {
      return NextResponse.json(
        { error: "AI returned cards in an unexpected format. Try again." },
        { status: 502 }
      );
    }

    const userId = session.user.id;
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
    console.error("Flashcards POST error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate flashcards.";
    const status = message.includes("Cannot connect") || message.includes("not available") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cardId } = await req.json();
    if (!cardId || typeof cardId !== "string") {
      return NextResponse.json(
        { error: "cardId is required." },
        { status: 400 }
      );
    }

    const card = await db.flashcard.findUnique({
      where: { id: cardId, userId: session.user.id },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Flashcard not found." },
        { status: 404 }
      );
    }

    const updated = await db.flashcard.update({
      where: { id: cardId },
      data: { mastered: !card.mastered },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Flashcards PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update flashcard." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Flashcard ID is required." },
        { status: 400 }
      );
    }

    await db.flashcard.delete({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ message: "Flashcard deleted." });
  } catch (error) {
    console.error("Flashcards DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete flashcard." },
      { status: 500 }
    );
  }
}
