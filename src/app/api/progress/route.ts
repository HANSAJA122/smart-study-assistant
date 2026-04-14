import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { format, subDays } from "date-fns";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [
      totalNotes,
      totalQuizzes,
      totalFlashcards,
      totalPlans,
      progressRecords,
    ] = await Promise.all([
      db.note.count({ where: { userId } }),
      db.quiz.count({ where: { userId } }),
      db.flashcard.count({ where: { userId } }),
      db.studyPlan.count({ where: { userId } }),
      db.progress.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      }),
    ]);

    // Calculate average quiz score
    const quizProgress = progressRecords.filter((p) => p.type === "quiz");
    const averageScore =
      quizProgress.length > 0
        ? Math.round(
            quizProgress.reduce((acc, p) => acc + p.score, 0) / quizProgress.length
          )
        : 0;

    // Weekly activity (last 7 days)
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const [dayNotes, dayQuizzes, dayFlashcards] = await Promise.all([
        db.note.count({
          where: {
            userId,
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        }),
        db.quiz.count({
          where: {
            userId,
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        }),
        db.flashcard.count({
          where: {
            userId,
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        }),
      ]);

      weeklyActivity.push({
        day: format(dayStart, "EEE"),
        notes: dayNotes,
        quizzes: dayQuizzes,
        flashcards: dayFlashcards,
      });
    }

    // Quiz scores over time
    const quizScores = quizProgress.slice(0, 10).reverse().map((p) => ({
      date: format(new Date(p.date), "MMM d"),
      score: p.score,
    }));

    // Subject distribution
    const subjects = await db.subject.findMany({
      where: { userId },
      include: {
        _count: {
          select: { notes: true, quizzes: true, flashcards: true },
        },
      },
    });

    const subjectDistribution = subjects.map((s) => ({
      name: s.name,
      value: s._count.notes + s._count.quizzes + s._count.flashcards,
    }));

    return NextResponse.json({
      stats: {
        totalNotes,
        totalQuizzes,
        totalFlashcards,
        totalPlans,
        averageScore,
        studyStreak: 0,
      },
      weeklyActivity,
      quizScores,
      subjectDistribution,
    });
  } catch (error) {
    console.error("Progress GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
