"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Plus,
  Loader2,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingPage } from "@/components/shared/loading";
import { formatDate } from "@/lib/utils";

interface StudyTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
}

interface StudyPlan {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  completed: boolean;
  tasks: StudyTask[];
  createdAt: string;
}

export default function PlannerPage() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [taskInputs, setTaskInputs] = useState([""]);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const res = await fetch("/api/planner");
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!title || !startDate || !endDate) return;
    setSaving(true);
    try {
      const tasks = taskInputs
        .filter((t) => t.trim())
        .map((t) => ({ title: t }));
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, startDate, endDate, tasks }),
      });
      if (res.ok) {
        setDialogOpen(false);
        resetForm();
        fetchPlans();
      }
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setTaskInputs([""]);
  }

  async function handleToggleTask(planId: string, taskId: string) {
    await fetch("/api/planner", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    });
    fetchPlans();
    if (selectedPlan?.id === planId) {
      const res = await fetch("/api/planner");
      if (res.ok) {
        const data = await res.json();
        const updated = data.find((p: StudyPlan) => p.id === planId);
        if (updated) setSelectedPlan(updated);
      }
    }
  }

  async function handleDelete(planId: string) {
    await fetch(`/api/planner?id=${planId}`, { method: "DELETE" });
    fetchPlans();
    if (selectedPlan?.id === planId) setSelectedPlan(null);
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study Planner</h1>
          <p className="text-muted-foreground mt-1">
            Plan your study sessions and track tasks.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Study Plan</DialogTitle>
              <DialogDescription>
                Plan your study sessions with tasks and deadlines.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Plan Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Final Exam Prep"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Tasks</Label>
                <div className="space-y-2">
                  {taskInputs.map((task, i) => (
                    <Input
                      key={i}
                      value={task}
                      onChange={(e) => {
                        const newInputs = [...taskInputs];
                        newInputs[i] = e.target.value;
                        setTaskInputs(newInputs);
                      }}
                      placeholder={`Task ${i + 1}`}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTaskInputs([...taskInputs, ""])}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add Task
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleSave}
                disabled={saving || !title || !startDate || !endDate}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No study plans yet"
          description="Create a study plan to organize your sessions and track your tasks."
          actionLabel="Create Plan"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => {
            const completedTasks = plan.tasks.filter((t) => t.completed).length;
            const progress =
              plan.tasks.length > 0
                ? (completedTasks / plan.tasks.length) * 100
                : 0;

            return (
              <Card
                key={plan.id}
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => setSelectedPlan(plan)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{plan.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {formatDate(plan.startDate)} —{" "}
                        {formatDate(plan.endDate)}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(plan.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span>
                      {completedTasks}/{plan.tasks.length} tasks
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {progress === 100 && (
                    <Badge className="mt-2" variant="default">
                      Completed
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Plan Detail Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedPlan?.title}</DialogTitle>
            <DialogDescription>
              {selectedPlan &&
                `${formatDate(selectedPlan.startDate)} — ${formatDate(selectedPlan.endDate)}`}
            </DialogDescription>
          </DialogHeader>
          {selectedPlan?.description && (
            <p className="text-sm text-muted-foreground">
              {selectedPlan.description}
            </p>
          )}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Tasks</h4>
            {selectedPlan?.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() =>
                    handleToggleTask(selectedPlan.id, task.id)
                  }
                />
                <span
                  className={`text-sm flex-1 ${task.completed ? "line-through text-muted-foreground" : ""}`}
                >
                  {task.title}
                </span>
                {task.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
