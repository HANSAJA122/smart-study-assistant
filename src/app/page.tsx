"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import {
  GraduationCap,
  FileText,
  Brain,
  Layers,
  Calendar,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: FileText,
    title: "Notes Summarizer",
    description: "Paste your notes and get AI-powered concise summaries instantly.",
  },
  {
    icon: Brain,
    title: "Quiz Generator",
    description:
      "Generate quizzes on any topic to test your knowledge effectively.",
  },
  {
    icon: Layers,
    title: "Flashcard Creator",
    description: "Create AI-generated flashcards for efficient memorization.",
  },
  {
    icon: Calendar,
    title: "Study Planner",
    description:
      "Plan your study sessions with smart scheduling and task tracking.",
  },
  {
    icon: MessageSquare,
    title: "AI Chat Tutor",
    description:
      "Chat with an AI tutor that explains concepts in a way you understand.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracker",
    description:
      "Track your study progress with detailed analytics and visualizations.",
  },
];

export default function LandingPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">StudyAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-32 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            Powered by AI
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Study Smarter, Not Harder with{" "}
            <span className="text-primary">AI</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Your all-in-one AI-powered study companion. Summarize notes, generate
            quizzes, create flashcards, plan your studies, and track your
            progress — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg" className="text-base px-8">
                Start Studying Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Everything You Need to Excel
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful AI tools designed to supercharge your learning experience.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="flex flex-col items-center text-center p-12">
            <GraduationCap className="h-12 w-12 mb-4" />
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Studies?
            </h2>
            <p className="text-lg opacity-90 max-w-xl mb-8">
              Join thousands of students who are already studying smarter with
              AI-powered tools.
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                variant="secondary"
                className="text-base px-8"
              >
                Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} StudyAI. Built with Next.js, TypeScript & OpenAI.</p>
        </div>
      </footer>
    </div>
  );
}
