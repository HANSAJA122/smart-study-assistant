"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  FileText,
  Sparkles,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingPage } from "@/components/shared/loading";
import { formatDate } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  createdAt: string;
  subject?: { name: string; color: string } | null;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/notes");
      if (!res.ok) throw new Error("Failed to load notes.");
      const data = await res.json();
      setNotes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function handleSave() {
    if (!title || !content) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save note.");
      }
      setTitle("");
      setContent("");
      setDialogOpen(false);
      fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSummarize(noteId: string) {
    setSummarizing(noteId);
    setError(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to summarize note.");
      }
      await fetchNotes();
      // Auto-select the note that was just summarized so the user sees the result
      const updated = notes.find((n) => n.id === noteId);
      if (updated) {
        const freshRes = await fetch("/api/notes");
        if (freshRes.ok) {
          const freshNotes: Note[] = await freshRes.json();
          const refreshed = freshNotes.find((n) => n.id === noteId);
          if (refreshed) setSelectedNote(refreshed);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "AI summarization failed."
      );
    } finally {
      setSummarizing(null);
    }
  }

  async function handleDelete(noteId: string) {
    setError(null);
    try {
      const res = await fetch(`/api/notes?id=${noteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note.");
      fetchNotes();
      if (selectedNote?.id === noteId) setSelectedNote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note.");
    }
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-muted-foreground mt-1">
            Create and summarize your study notes with AI.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Note</DialogTitle>
              <DialogDescription>
                Add your study notes. You can summarize them with AI later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Chapter 5 - Photosynthesis"
                />
              </div>
              <div>
                <Label htmlFor="note-content">Content</Label>
                <Textarea
                  id="note-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste or type your notes here..."
                  className="min-h-[200px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleSave}
                disabled={saving || !title || !content}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error banner */}
      {error && (
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

      {notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes yet"
          description="Create your first note and use AI to generate a concise summary."
          actionLabel="Create Note"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card
              key={note.id}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => setSelectedNote(note)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-1">
                    {note.title}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Summarize with AI"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSummarize(note.id);
                      }}
                      disabled={summarizing === note.id}
                    >
                      {summarizing === note.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      title="Delete note"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-xs">
                  {formatDate(note.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {note.content}
                </p>
                {note.summary && (
                  <Badge variant="secondary" className="mt-3">
                    <Sparkles className="mr-1 h-3 w-3" /> Summarized
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Note Detail Dialog */}
      <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedNote?.title}</DialogTitle>
            <DialogDescription>
              {selectedNote && formatDate(selectedNote.createdAt)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Content</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {selectedNote?.content}
              </p>
            </div>
            {selectedNote?.summary ? (
              <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-primary">AI Summary</h4>
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  {selectedNote.summary}
                </p>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (selectedNote) handleSummarize(selectedNote.id);
                }}
                disabled={
                  !!summarizing && summarizing === selectedNote?.id
                }
              >
                {summarizing === selectedNote?.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate AI Summary
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
