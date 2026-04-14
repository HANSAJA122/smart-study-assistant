"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Brain,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingPage } from "@/components/shared/loading";
import { cn, formatDate } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer: number | null;
}

interface Quiz {
  id: string;
  title: string;
  score: number | null;
  total: number;
  createdAt: string;
  questions: QuizQuestion[];
}

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    try {
      const res = await fetch("/api/quiz");
      if (!res.ok) throw new Error("Failed to load quizzes.");
      const data = await res.json();
      setQuizzes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quizzes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  async function handleGenerate() {
    if (!topic) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, numberOfQuestions: numQuestions }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate quiz.");
      }
      setDialogOpen(false);
      setTopic("");
      setActiveQuiz(data);
      setCurrentQ(0);
      setAnswers({});
      setSubmitted(false);
      fetchQuizzes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "AI quiz generation failed."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmitQuiz() {
    if (!activeQuiz) return;
    setError(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: activeQuiz.id, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit quiz.");
      }
      setActiveQuiz(data);
      setSubmitted(true);
      fetchQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz.");
    }
  }

  if (loading) return <LoadingPage />;

  if (activeQuiz) {
    const questions = activeQuiz.questions;
    const question = questions[currentQ];
    const score = submitted
      ? questions.filter((q) => answers[q.id] === q.correctAnswer).length
      : 0;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{activeQuiz.title}</h1>
          <Button
            variant="outline"
            onClick={() => {
              setActiveQuiz(null);
              setSubmitted(false);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Back to Quizzes
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
              <CardDescription>
                You scored {score} out of {questions.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-5xl font-bold text-primary mb-4">
                {Math.round((score / questions.length) * 100)}%
              </div>
              <Progress
                value={(score / questions.length) * 100}
                className="h-3 mb-6"
              />
              <div className="space-y-3 text-left">
                {questions.map((q, i) => {
                  const isCorrect = answers[q.id] === q.correctAnswer;
                  return (
                    <div
                      key={q.id}
                      className={cn(
                        "rounded-lg p-3 border",
                        isCorrect
                          ? "border-green-500/20 bg-green-50 dark:bg-green-950/20"
                          : "border-red-500/20 bg-red-50 dark:bg-red-950/20"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {i + 1}. {q.question}
                          </p>
                          {!isCorrect && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Correct: {q.options[q.correctAnswer]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  Question {currentQ + 1} of {questions.length}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {Object.keys(answers).length} answered
                </span>
              </div>
              <Progress
                value={((currentQ + 1) / questions.length) * 100}
                className="h-2 mt-3"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">{question.question}</h3>
              <div className="space-y-2">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      setAnswers({ ...answers, [question.id]: index })
                    }
                    className={cn(
                      "w-full text-left rounded-lg border p-3 text-sm transition-colors hover:bg-accent",
                      answers[question.id] === index &&
                        "border-primary bg-primary/5 ring-1 ring-primary"
                    )}
                  >
                    <span className="font-medium mr-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0}
              >
                Previous
              </Button>
              {currentQ < questions.length - 1 ? (
                <Button onClick={() => setCurrentQ(currentQ + 1)}>Next</Button>
              ) : (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(answers).length !== questions.length}
                >
                  Submit Quiz
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
          <p className="text-muted-foreground mt-1">
            Generate AI-powered quizzes on any topic.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Generate Quiz
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Quiz</DialogTitle>
              <DialogDescription>
                Enter a topic and AI will generate a quiz for you.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Topic</Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis, World War II, Linear Algebra"
                />
              </div>
              <div>
                <Label>Number of Questions</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <DialogFooter>
              <Button
                onClick={handleGenerate}
                disabled={generating || !topic}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && !dialogOpen && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {quizzes.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No quizzes yet"
          description="Generate your first AI quiz to test your knowledge on any subject."
          actionLabel="Generate Quiz"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Card
              key={quiz.id}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => {
                setActiveQuiz(quiz);
                setCurrentQ(0);
                setAnswers({});
                setSubmitted(quiz.score !== null);
                setError(null);
              }}
            >
              <CardHeader>
                <CardTitle className="text-base">{quiz.title}</CardTitle>
                <CardDescription>{formatDate(quiz.createdAt)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {quiz.total} questions
                  </span>
                  {quiz.score !== null && (
                    <Badge
                      variant={
                        quiz.score / quiz.total >= 0.7 ? "default" : "secondary"
                      }
                    >
                      {Math.round((quiz.score / quiz.total) * 100)}%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
