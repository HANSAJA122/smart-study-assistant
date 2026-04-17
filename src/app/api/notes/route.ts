import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { noteSchema } from "@/lib/validations";
import {
  assertTrustedOrigin,
  handleApiError,
  parseJsonBody,
  requireAuth,
} from "@/lib/api-security";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;

    const notes = await db.note.findMany({
      where: { userId },
      include: { subject: { select: { name: true, color: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    return handleApiError(error, "notes GET", { fallbackMessage: "Failed to load notes." });
  }
}

export async function POST(req: Request) {
  try {
    const forbidden = assertTrustedOrigin(req);
    if (forbidden) return forbidden;

    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;

    const raw = await parseJsonBody(req);
    if (raw instanceof NextResponse) return raw;

    const parsed = noteSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const note = await db.note.create({
      data: {
        ...parsed.data,
        userId,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return handleApiError(error, "notes POST", { fallbackMessage: "Failed to save note." });
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
      return NextResponse.json({ error: "Note ID required" }, { status: 400 });
    }

    const result = await db.note.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Note deleted" });
  } catch (error) {
    return handleApiError(error, "notes DELETE", { fallbackMessage: "Failed to delete note." });
  }
}
