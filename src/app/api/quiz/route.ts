import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateJSON } from "@/lib/ollama";
import { quizGenerateSchema, quizSubmitSchema } from "@/lib/validations";
import {
  assertTrustedOrigin,
  handleApiError,
  parseJsonBody,
  requireAiRateLimit,
  requireAuth,
} from "@/lib/api-security";
import {
  buildQuizGeneratorSystemPrompt,
  isClearlyNonEducationalUserInput,
  studyScopeRejectResponse,
} from "@/lib/study-ai-scope";

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;

    const quizzes = await db.quiz.findMany({
      where: { userId },
      include: { questions: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    return handleApiError(error, "quiz GET", { fallbackMessage: "Failed to load quizzes." });
  }
}

export async function POST(req: Request) {
  try {
    const forbidden = assertTrustedOrigin(req);
    if (forbidden) return forbidden;

    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      console.warn("[api] quiz POST: unauthenticated");
      return authResult;
    }
    const userId = authResult;

    const limited = requireAiRateLimit(userId);
    if (limited !== true) return limited;

    const raw = await parseJsonBody(req);
    if (raw instanceof NextResponse) return raw;

    const parsed = quizGenerateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { topic, numberOfQuestions, subjectId } = parsed.data;

    if (isClearlyNonEducationalUserInput(topic)) {
      return studyScopeRejectResponse("quiz:topic", topic.slice(0, 80));
    }

    const questions = await generateJSON<GeneratedQuestion[]>(
      buildQuizGeneratorSystemPrompt(numberOfQuestions),
      `Topic or study focus for the quiz (stay strictly within educational material): ${topic}`,
      { temperature: 0.7, maxOutputTokens: 2500, wrapperKey: "questions" }
    );

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: "AI failed to generate valid quiz questions. Try again." },
        { status: 502 }
      );
    }
    if (questions.length === 0) {
      return studyScopeRejectResponse("quiz:empty-model", topic.slice(0, 80));
    }

    const validated = questions.filter(
      (q) =>
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        typeof q.correctAnswer === "number" &&
        q.correctAnswer >= 0 &&
        q.correctAnswer < q.options.length
    );

    if (validated.length === 0) {
      return NextResponse.json(
        { error: "AI returned questions in an unexpected format. Try again." },
        { status: 502 }
      );
    }

    const quiz = await db.quiz.create({
      data: {
        title: `Quiz: ${topic}`,
        userId,
        subjectId: subjectId || null,
        total: validated.length,
        questions: {
          create: validated.map((q) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
          })),
        },
      },
      include: { questions: true },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    return handleApiError(error, "quiz POST", { fallbackMessage: "Failed to generate quiz." });
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

    const parsed = quizSubmitSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { quizId, answers } = parsed.data;

    const quiz = await db.quiz.findFirst({
      where: { id: quizId, userId },
      include: { questions: true },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
    }

    let score = 0;
    for (const question of quiz.questions) {
      const userAnswer = answers[question.id] as number | undefined;
      if (userAnswer === question.correctAnswer) score++;
      await db.quizQuestion.update({
        where: { id: question.id },
        data: { userAnswer: userAnswer ?? null },
      });
    }

    const updated = await db.quiz.update({
      where: { id: quizId, userId },
      data: { score },
      include: { questions: true },
    });

    await db.progress.create({
      data: {
        userId,
        type: "quiz",
        score: Math.round((score / quiz.total) * 100),
        subjectId: quiz.subjectId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "quiz PUT", { fallbackMessage: "Failed to submit quiz." });
  }
}
