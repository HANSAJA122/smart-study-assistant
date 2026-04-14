"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Layers,
  Plus,
  Loader2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Check,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingPage } from "@/components/shared/loading";
import { cn } from "@/lib/utils";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [numCards, setNumCards] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const [studying, setStudying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const fetchCards = useCallback(async () => {
    try {
      const res = await fetch("/api/flashcards");
      if (!res.ok) throw new Error("Failed to load flashcards.");
      const data = await res.json();
      setCards(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load flashcards."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  async function handleGenerate() {
    if (!topic) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, numberOfCards: numCards }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate flashcards.");
      }
      setDialogOpen(false);
      setTopic("");
      fetchCards();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI flashcard generation failed."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggleMastered(cardId: string) {
    try {
      const res = await fetch("/api/flashcards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId }),
      });
      if (!res.ok) throw new Error("Failed to update flashcard.");
      fetchCards();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update flashcard."
      );
    }
  }

  async function handleDelete(cardId: string) {
    try {
      const res = await fetch(`/api/flashcards?id=${cardId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete flashcard.");
      fetchCards();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete flashcard."
      );
    }
  }

  if (loading) return <LoadingPage />;

  const masteredCount = cards.filter((c) => c.mastered).length;
  const unmasteredCards = cards.filter((c) => !c.mastered);

  if (studying && unmasteredCards.length > 0) {
    const card = unmasteredCards[currentIndex % unmasteredCards.length];
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Study Mode</h1>
          <Button variant="outline" onClick={() => setStudying(false)}>
            <RotateCcw className="mr-2 h-4 w-4" /> Exit
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Card {(currentIndex % unmasteredCards.length) + 1} of{" "}
          {unmasteredCards.length}
        </div>
        <Progress
          value={
            (((currentIndex % unmasteredCards.length) + 1) /
              unmasteredCards.length) *
            100
          }
          className="h-2"
        />

        <div
          className="perspective-1000 cursor-pointer"
          onClick={() => setFlipped(!flipped)}
        >
          <Card
            className={cn(
              "min-h-[280px] flex items-center justify-center transition-all duration-500",
              flipped && "bg-primary/5 border-primary/20"
            )}
          >
            <CardContent className="text-center p-8">
              <Badge variant="secondary" className="mb-4">
                {flipped ? "Answer" : "Question"}
              </Badge>
              <p className="text-lg font-medium">
                {flipped ? card.back : card.front}
              </p>
              {!flipped && (
                <p className="text-xs text-muted-foreground mt-4">
                  Click to reveal answer
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentIndex(Math.max(0, currentIndex - 1));
              setFlipped(false);
            }}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="text-green-600"
            onClick={() => {
              handleToggleMastered(card.id);
              setFlipped(false);
            }}
          >
            <Check className="mr-2 h-4 w-4" /> Mastered
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentIndex(currentIndex + 1);
              setFlipped(false);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-muted-foreground mt-1">
            Generate AI flashcards and study with spaced repetition.
          </p>
        </div>
        <div className="flex gap-2">
          {unmasteredCards.length > 0 && (
            <Button variant="outline" onClick={() => setStudying(true)}>
              Study Now
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Generate Cards
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Flashcards</DialogTitle>
                <DialogDescription>
                  Enter a topic and AI will create flashcards for you.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Topic</Label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Spanish Vocabulary, Chemistry Elements"
                  />
                </div>
                <div>
                  <Label>Number of Cards</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={numCards}
                    onChange={(e) => setNumCards(Number(e.target.value))}
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

      {cards.length > 0 && (
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>Mastered</span>
                <span>
                  {masteredCount} / {cards.length}
                </span>
              </div>
              <Progress
                value={(masteredCount / cards.length) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {cards.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No flashcards yet"
          description="Generate AI-powered flashcards to master any topic."
          actionLabel="Generate Flashcards"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card
              key={card.id}
              className={cn("transition-all", card.mastered && "opacity-60")}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium">
                    {card.front}
                  </CardTitle>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title={card.mastered ? "Unmark mastered" : "Mark mastered"}
                      onClick={() => handleToggleMastered(card.id)}
                    >
                      <Check
                        className={cn(
                          "h-3.5 w-3.5",
                          card.mastered && "text-green-600"
                        )}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      title="Delete flashcard"
                      onClick={() => handleDelete(card.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {card.mastered && (
                  <Badge variant="secondary" className="w-fit text-xs">
                    Mastered
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {card.back}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
