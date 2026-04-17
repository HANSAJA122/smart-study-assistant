import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { plannerTaskToggleSchema, studyPlanSchema } from "@/lib/validations";
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

    const plans = await db.studyPlan.findMany({
      where: { userId },
      include: { tasks: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    return handleApiError(error, "planner GET", { fallbackMessage: "Failed to load plans." });
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

    const parsed = studyPlanSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { title, description, subjectId, startDate, endDate, tasks } = parsed.data;

    const plan = await db.studyPlan.create({
      data: {
        title,
        description: description || null,
        subjectId: subjectId || null,
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        tasks: tasks
          ? {
              create: tasks.map((t) => ({
                title: t.title,
                dueDate: t.dueDate ? new Date(t.dueDate) : null,
              })),
            }
          : undefined,
      },
      include: { tasks: true },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    return handleApiError(error, "planner POST", { fallbackMessage: "Failed to create plan." });
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

    const parsed = plannerTaskToggleSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { taskId } = parsed.data;

    const task = await db.studyTask.findUnique({
      where: { id: taskId },
      include: { studyPlan: true },
    });

    if (!task || task.studyPlan.userId !== userId) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updated = await db.studyTask.update({
      where: { id: taskId },
      data: { completed: !task.completed },
    });

    const allTasks = await db.studyTask.findMany({
      where: { studyPlanId: task.studyPlanId },
    });
    const allCompleted = allTasks.every((t) =>
      t.id === taskId ? !task.completed : t.completed
    );
    await db.studyPlan.update({
      where: { id: task.studyPlanId, userId },
      data: { completed: allCompleted },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "planner PUT", { fallbackMessage: "Failed to update task." });
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
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 });
    }

    const result = await db.studyPlan.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Plan deleted" });
  } catch (error) {
    return handleApiError(error, "planner DELETE", { fallbackMessage: "Failed to delete plan." });
  }
}
