import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateJSON } from "@/lib/ollama";
import { quizGenerateSchema } from "@/lib/validations";

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quizzes = await db.quiz.findMany({
      where: { userId: session.user.id },
      include: { questions: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("Quiz GET error:", error);
    return NextResponse.json(
      { error: "Failed to load quizzes." },
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
    const parsed = quizGenerateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { topic, numberOfQuestions, subjectId } = parsed.data;

    const questions = await generateJSON<GeneratedQuestion[]>(
      "You are a quiz generator. Respond with a JSON object containing a single key " +
        '"questions" whose value is an array.\n' +
        `Create exactly ${numberOfQuestions} multiple-choice questions.\n` +
        'Each element has keys: "question" (string), "options" (array of 4 strings), ' +
        '"correctAnswer" (0-based index of the correct option).\n' +
        "Example:\n" +
        '{"questions":[{"question":"What is 2+2?","options":["1","3","4","5"],"correctAnswer":2}]}',
      `Topic: ${topic}`,
      { temperature: 0.7, maxOutputTokens: 2500, wrapperKey: "questions" }
    );

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "AI failed to generate valid quiz questions. Try again." },
        { status: 502 }
      );
    }

    // Validate every generated question before persisting
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
        userId: session.user.id,
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
    console.error("Quiz POST error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate quiz.";
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

    const { quizId, answers } = await req.json();

    if (!quizId || typeof answers !== "object") {
      return NextResponse.json(
        { error: "quizId and answers are required." },
        { status: 400 }
      );
    }

    const quiz = await db.quiz.findUnique({
      where: { id: quizId, userId: session.user.id },
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
      where: { id: quizId },
      data: { score },
      include: { questions: true },
    });

    await db.progress.create({
      data: {
        userId: session.user.id,
        type: "quiz",
        score: Math.round((score / quiz.total) * 100),
        subjectId: quiz.subjectId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Quiz PUT error:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz." },
      { status: 500 }
    );
  }
}
