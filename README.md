# Smart Study Assistant

A full-stack, AI-powered study companion that helps students learn more effectively. Built with Next.js and powered by **Ollama** — supports both **cloud** and **local** AI with no vendor lock-in.

## Features

| Feature | Description |
|---------|-------------|
| **AI Tutor** | Chat with an AI study tutor that explains concepts, answers questions, and suggests study strategies |
| **Notes Summarizer** | Create study notes and generate concise AI-powered summaries with one click |
| **Quiz Generator** | Instantly generate multiple-choice quizzes on any topic to test your knowledge |
| **Flashcard Generator** | AI-created flashcards with a study mode, card flipping, and mastery tracking |
| **Study Planner** | Build study plans with tasks, deadlines, and completion tracking |
| **Progress Tracking** | Visual analytics dashboard with bar, line, and pie charts to monitor your learning |

### Additional Highlights

- Secure authentication (signup/login) with NextAuth
- Dark and light mode with system preference detection
- Fully responsive — works on desktop, tablet, and mobile
- Clean, modern UI built with shadcn/ui and Radix primitives

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 15** (App Router) |
| Language | **TypeScript** |
| Styling | **Tailwind CSS v4** |
| UI | **shadcn/ui** + Radix UI |
| Database | **PostgreSQL** + Prisma ORM |
| Auth | **NextAuth v5** (Auth.js) |
| AI | **Ollama** (Cloud or Local) |
| Charts | Recharts |
| Validation | Zod |

## AI Setup (Ollama)

This project uses [Ollama](https://ollama.com) for AI. You can run it in **cloud mode** or **local mode**.

### Option A: Ollama Cloud (Recommended)

No local installation needed. Set three environment variables and you're done:

```env
OLLAMA_BASE_URL="https://ollama.com"
OLLAMA_API_KEY="your-ollama-cloud-api-key"
OLLAMA_MODEL="gemma3:4b"
```

The app sends `Authorization: Bearer <OLLAMA_API_KEY>` on every AI request automatically.

Available cloud models include `gemma3:4b`, `gemma3:12b`, `gemma3:27b`, `gemma4:31b`, `ministral-3:3b`, and more — run `curl -H "Authorization: Bearer <key>" https://ollama.com/api/tags` to see all options.

### Option B: Ollama Local (Optional)

Run AI entirely on your machine — no API key, no cloud, full privacy.

1. Install from [ollama.com](https://ollama.com)
2. Pull a model: `ollama pull gemma3`
3. Start the server: `ollama serve`
4. Set in `.env`:

```env
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_API_KEY=""
OLLAMA_MODEL="gemma3"
```

> **Note:** AI features (chat, summarize, quiz, flashcards) require a reachable Ollama server. All other features (auth, planner, notes CRUD, progress) work without it.

## Project Setup

### 1. Clone the repository

```bash
git clone https://github.com/HANSAJA122/smart-study-assistant.git
cd smart-study-assistant
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/study_assistant?schema=public"
AUTH_SECRET="generate-with: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"
# Optional (production / Vercel): NEXT_PUBLIC_APP_URL="https://your-deployment.vercel.app"

# Ollama Cloud (see AI Setup section for local alternative):
OLLAMA_BASE_URL="https://ollama.com"
OLLAMA_API_KEY="your-ollama-cloud-api-key"
OLLAMA_MODEL="gemma3:4b"
```

### 4. Set up the database

```bash
createdb study_assistant
npx prisma generate
npx prisma db push
```

### 5. Start the app

```bash
npm run dev
```

Open **http://localhost:3000** (or the URL shown in the terminal) to use the app locally.

**Vercel:** Set `AUTH_URL` (and optionally `NEXT_PUBLIC_APP_URL`) to your live site URL — never use `http://localhost:3000` in Vercel environment variables. The app resolves the public URL from `AUTH_URL` → `NEXT_PUBLIC_APP_URL` → `VERCEL_URL` → localhost for dev.

If using local Ollama, start it in a separate terminal first.

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login & Signup pages
│   ├── (protected)/         # Authenticated pages
│   │   ├── dashboard/
│   │   ├── notes/
│   │   ├── quiz/
│   │   ├── flashcards/
│   │   ├── planner/
│   │   ├── chat/
│   │   ├── progress/
│   │   └── profile/
│   └── api/                 # API route handlers
│       ├── auth/
│       ├── notes/
│       ├── summarize/
│       ├── quiz/
│       ├── flashcards/
│       ├── planner/
│       ├── chat/
│       ├── progress/
│       └── subjects/
├── components/
│   ├── layout/              # App shell, sidebar, navbar
│   ├── shared/              # Theme provider, loading states
│   └── ui/                  # Reusable UI components (shadcn/ui)
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── db.ts                # Prisma client singleton
│   ├── ollama.ts            # Ollama AI client (cloud + local)
│   ├── utils.ts             # Utility functions
│   └── validations.ts       # Zod schemas
└── types/
    └── next-auth.d.ts       # NextAuth type extensions
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| GET/POST/DELETE | `/api/notes` | Notes CRUD |
| POST | `/api/summarize` | AI-powered note summarization |
| GET/POST/PUT | `/api/quiz` | Quiz generation and submission |
| GET/POST/PUT/DELETE | `/api/flashcards` | Flashcard CRUD with mastery toggle |
| GET/POST/PUT/DELETE | `/api/planner` | Study plans and task management |
| GET/POST/DELETE | `/api/chat` | AI tutor conversation |
| GET | `/api/progress` | Progress analytics |
| GET/POST | `/api/subjects` | Subject management |

## Using a Different Model

Swap the AI model by changing `OLLAMA_MODEL` in `.env`:

```env
OLLAMA_MODEL="gemma3:12b"
```

For local mode, pull it first: `ollama pull gemma3:12b`

## Important Notes

- `OLLAMA_BASE_URL` is **required** — the app will not start without it.
- **Cloud mode** (`https://` URL): `OLLAMA_API_KEY` is required. The app sends `Authorization: Bearer` on every AI request.
- **Local mode** (`http://` URL): No API key needed. Ollama must be running on your machine.
- Without a reachable Ollama server, AI features show a friendly error — all other features work normally.

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

## License

MIT
