import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const noteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  subjectId: z.string().optional(),
});

export const quizGenerateSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  numberOfQuestions: z.number().min(1).max(20).default(5),
  subjectId: z.string().optional(),
});

export const flashcardGenerateSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  numberOfCards: z.number().min(1).max(30).default(10),
  subjectId: z.string().optional(),
});

export const studyPlanSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subjectId: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  tasks: z
    .array(
      z.object({
        title: z.string().min(1),
        dueDate: z.string().optional(),
      })
    )
    .optional(),
});

export const chatSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  color: z.string().optional(),
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
