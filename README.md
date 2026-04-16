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
OLLAMA_MODEL="llama3.1"
```

The app automatically sends `Authorization: Bearer <OLLAMA_API_KEY>` on every request when using a cloud URL.

### Option B: Ollama Local

Run AI entirely on your machine — no API key, no cloud, full privacy.

**1. Install Ollama**

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

Or download from [ollama.com](https://ollama.com).

**2. Pull a model and start the server**

```bash
ollama pull gemma3
ollama serve
```

**3. Configure `.env` for local mode**

```env
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_API_KEY=""
OLLAMA_MODEL="gemma3"
```

> **Note:** AI features (chat, summarize, quiz, flashcards) require Ollama to be reachable. All other features (auth, planner, notes CRUD, progress) work without it.

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

# Ollama Cloud:
OLLAMA_BASE_URL="https://ollama.com"
OLLAMA_API_KEY="your-ollama-cloud-api-key"
OLLAMA_MODEL="llama3.1"

# Or Ollama Local (no API key):
# OLLAMA_BASE_URL="http://localhost:11434"
# OLLAMA_API_KEY=""
# OLLAMA_MODEL="gemma3"
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

Open **[http://localhost:3000](http://localhost:3000)** to use the app.

If using local Ollama, start it in a separate terminal first: `ollama serve`

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
OLLAMA_MODEL="llama3.2"
```

For local mode, pull it first: `ollama pull llama3.2`

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
