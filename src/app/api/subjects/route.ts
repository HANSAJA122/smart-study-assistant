import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subjectSchema } from "@/lib/validations";
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

    const subjects = await db.subject.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    return handleApiError(error, "subjects GET", {
      fallbackMessage: "Failed to load subjects.",
    });
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

    const parsed = subjectSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const subject = await db.subject.create({
      data: {
        name: parsed.data.name,
        color: parsed.data.color || "#6366f1",
        userId,
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    return handleApiError(error, "subjects POST", {
      fallbackMessage: "Failed to create subject.",
    });
  }
}
