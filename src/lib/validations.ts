import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120, "Name is too long"),
  email: z.string().email("Invalid email address").max(254, "Email is too long"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password is too long"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const noteSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title is too long"),
  content: z.string().min(1, "Content is required").max(200_000, "Content is too long"),
  subjectId: z.string().max(64).optional(),
});

export const quizGenerateSchema = z.object({
  topic: z.string().min(1, "Topic is required").max(2000, "Topic is too long"),
  numberOfQuestions: z.number().min(1).max(20).default(5),
  subjectId: z.string().max(64).optional(),
});

export const quizSubmitSchema = z.object({
  quizId: z.string().min(1, "Quiz ID is required").max(64),
  answers: z.record(z.string(), z.number().int().min(0).max(25)),
});

export const flashcardGenerateSchema = z.object({
  topic: z.string().min(1, "Topic is required").max(2000, "Topic is too long"),
  numberOfCards: z.number().min(1).max(30).default(10),
  subjectId: z.string().max(64).optional(),
});

export const flashcardToggleSchema = z.object({
  cardId: z.string().min(1, "Card ID is required").max(64),
});

export const summarizeRequestSchema = z.object({
  noteId: z.string().min(1, "Note ID is required").max(64),
});

export const studyPlanSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title is too long"),
  description: z.string().max(5000).optional(),
  subjectId: z.string().max(64).optional(),
  startDate: z.string().max(40),
  endDate: z.string().max(40),
  tasks: z
    .array(
      z.object({
        title: z.string().min(1).max(500),
        dueDate: z.string().max(40).optional(),
      })
    )
    .max(200)
    .optional(),
});

export const chatSchema = z.object({
  message: z.string().min(1, "Message is required").max(8000, "Message is too long"),
});

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(120, "Subject name is too long"),
  color: z.string().max(32).optional(),
});

export const plannerTaskToggleSchema = z.object({
  taskId: z.string().min(1, "Task ID is required").max(64),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type QuizGenerateInput = z.infer<typeof quizGenerateSchema>;
export type FlashcardGenerateInput = z.infer<typeof flashcardGenerateSchema>;
export type StudyPlanInput = z.infer<typeof studyPlanSchema>;
export type ChatInput = z.infer<typeof chatSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type QuizSubmitInput = z.infer<typeof quizSubmitSchema>;
export type FlashcardToggleInput = z.infer<typeof flashcardToggleSchema>;
export type SummarizeRequestInput = z.infer<typeof summarizeRequestSchema>;
export type PlannerTaskToggleInput = z.infer<typeof plannerTaskToggleSchema>;
