"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Brain,
  Layers,
  Calendar,
  MessageSquare,
  BarChart3,
  TrendingUp,
  BookOpen,
  Target,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LoadingPage } from "@/components/shared/loading";

interface DashboardStats {
  totalNotes: number;
  totalQuizzes: number;
  totalFlashcards: number;
  totalPlans: number;
  averageScore: number;
  studyStreak: number;
}

const quickActions = [
  { href: "/notes", label: "Summarize Notes", icon: FileText, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { href: "/quiz", label: "Take a Quiz", icon: Brain, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { href: "/flashcards", label: "Study Flashcards", icon: Layers, color: "bg-green-500/10 text-green-600 dark:text-green-400" },
  { href: "/planner", label: "Plan Study", icon: Calendar, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  { href: "/chat", label: "Ask AI Tutor", icon: MessageSquare, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  { href: "/progress", label: "View Progress", icon: BarChart3, color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/progress");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch {
        // Use defaults if API fails
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <LoadingPage />;

  const dashboardStats = stats || {
    totalNotes: 0,
    totalQuizzes: 0,
    totalFlashcards: 0,
    totalPlans: 0,
    averageScore: 0,
    studyStreak: 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s your study overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalNotes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalQuizzes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.averageScore}%</div>
            <Progress value={dashboardStats.averageScore} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalFlashcards}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`rounded-lg p-3 ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">
                      {action.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
