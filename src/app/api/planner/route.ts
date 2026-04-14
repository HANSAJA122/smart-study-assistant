import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { studyPlanSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plans = await db.studyPlan.findMany({
      where: { userId: session.user.id },
      include: { tasks: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Planner GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = studyPlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, description, subjectId, startDate, endDate, tasks } = parsed.data;

    const plan = await db.studyPlan.create({
      data: {
        title,
        description: description || null,
        subjectId: subjectId || null,
        userId: session.user.id,
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
    console.error("Planner POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await req.json();

    const task = await db.studyTask.findUnique({
      where: { id: taskId },
      include: { studyPlan: true },
    });

    if (!task || task.studyPlan.userId !== session.user.id) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updated = await db.studyTask.update({
      where: { id: taskId },
      data: { completed: !task.completed },
    });

    // Check if all tasks are completed, mark plan as completed
    const allTasks = await db.studyTask.findMany({
      where: { studyPlanId: task.studyPlanId },
    });
    const allCompleted = allTasks.every((t) => t.id === taskId ? !task.completed : t.completed);
    await db.studyPlan.update({
      where: { id: task.studyPlanId },
      data: { completed: allCompleted },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Planner PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 });
    }

    await db.studyPlan.delete({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ message: "Plan deleted" });
  } catch (error) {
    console.error("Planner DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
