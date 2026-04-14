# StudyAI - Smart Study Assistant

A full-stack AI-powered study assistant built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, **Prisma**, **PostgreSQL**, **NextAuth**, and **Ollama** (local AI).

## Features

- **Notes Summarizer** — Create notes and generate AI-powered summaries
- **Quiz Generator** — Generate multiple-choice quizzes on any topic with AI
- **Flashcard Creator** — AI-generated flashcards with study mode and mastery tracking
- **Study Planner** — Create study plans with tasks and track completion
- **AI Chat Tutor** — Interactive AI tutor that explains concepts conversationally
- **Progress Tracker** — Analytics dashboard with charts (bar, line, pie)
- **Authentication** — Secure signup/login with NextAuth credentials
- **Dark/Light Mode** — Theme toggle with system preference detection
- **Responsive UI** — Mobile-first design that works on all screen sizes

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui + Radix UI |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth v5 (Auth.js) |
| AI | Ollama (local) + Gemma 3 |
| Charts | Recharts |
| Validation | Zod |
| Icons | Lucide React |

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login & Signup pages
│   │   ├── login/
│   │   └── signup/
│   ├── (protected)/      # Authenticated pages
│   │   ├── dashboard/
│   │   ├── notes/
│   │   ├── quiz/
│   │   ├── flashcards/
│   │   ├── planner/
│   │   ├── chat/
│   │   ├── progress/
│   │   └── profile/
│   ├── api/              # API route handlers
│   │   ├── auth/
│   │   ├── notes/
│   │   ├── summarize/
│   │   ├── quiz/
│   │   ├── flashcards/
│   │   ├── planner/
│   │   ├── chat/
│   │   ├── progress/
│   │   └── subjects/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx          # Landing page
├── components/
│   ├── layout/           # App shell, sidebar, navbar
│   ├── shared/           # Theme provider, loading states
│   └── ui/               # Reusable UI components (shadcn/ui)
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── auth-utils.ts     # Auth helper functions
│   ├── db.ts             # Prisma client singleton
│   ├── ollama.ts         # Ollama local AI client
│   ├── utils.ts          # Utility functions
│   └── validations.ts    # Zod schemas
├── types/
│   └── next-auth.d.ts    # NextAuth type extensions
└── generated/
    └── prisma/           # Generated Prisma client
prisma/
└── schema.prisma         # Database schema
```

## Prerequisites

- **Node.js** 18+ installed
- **PostgreSQL** database running locally or remotely
- **Ollama** installed locally (see setup below)

## Ollama Setup

### 1. Install Ollama

**macOS:**

```bash
brew install ollama
```

Or download from [ollama.com/download](https://ollama.com/download).

**Linux:**

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**

Download the installer from [ollama.com/download](https://ollama.com/download).

### 2. Pull the model

```bash
ollama pull gemma3
```

This downloads the Gemma 3 model (~3.9 GB). It only needs to run once.

### 3. Start the Ollama server

```bash
ollama serve
```

The server runs at `http://localhost:11434` by default. Keep this terminal open while using the app.

### 4. Verify it works

```bash
curl http://localhost:11434/api/tags
```

You should see `gemma3` in the model list.

## Getting Started

### 1. Clone and install dependencies

```bash
cd "Study Assistant"
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/study_assistant?schema=public"
AUTH_SECRET="generate-with: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"

# Ollama (defaults work out of the box — no API key needed)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="gemma3"
```

### 3. Set up the database

Create a PostgreSQL database:

```bash
createdb study_assistant
```

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma db push
```

### 4. Start Ollama (in a separate terminal)

```bash
ollama serve
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 6. (Optional) View database with Prisma Studio

```bash
npx prisma studio
```

## Using a Different Model

You can swap the AI model by changing `OLLAMA_MODEL` in your `.env` file:

```env
OLLAMA_MODEL="llama3.2"
```

Then pull it:

```bash
ollama pull llama3.2
```

Any Ollama-compatible model works. Smaller models are faster; larger models give better answers.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| GET/POST/DELETE | `/api/notes` | CRUD for notes |
| POST | `/api/summarize` | AI-summarize a note |
| GET/POST/PUT | `/api/quiz` | Quiz generation and submission |
| GET/POST/PUT/DELETE | `/api/flashcards` | Flashcard CRUD + mastery toggle |
| GET/POST/PUT/DELETE | `/api/planner` | Study plan CRUD + task toggle |
| GET/POST/DELETE | `/api/chat` | AI chat tutor messages |
| GET | `/api/progress` | Progress stats and analytics |
| GET/POST | `/api/subjects` | Subject management |

## Database Models

- **User** — Account with auth credentials
- **Subject** — Study subject/category
- **Note** — Study notes with optional AI summary
- **Quiz / QuizQuestion** — Generated quizzes with scoring
- **Flashcard** — Front/back cards with mastery tracking
- **StudyPlan / StudyTask** — Plans with task checklists
- **Progress** — Score records for analytics
- **ChatMessage** — AI tutor conversation history

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Deployment

For local deployment, just ensure Ollama is running on the same machine. For cloud deployment, you would need an Ollama instance accessible from the server, or switch back to a cloud AI provider.

For the database, use a hosted PostgreSQL provider like **Neon**, **Supabase**, or **Railway**.

## License

MIT
