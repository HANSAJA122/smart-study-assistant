# Smart Study Assistant

A full-stack, AI-powered study companion that helps students learn more effectively. Built with Next.js and powered by **Ollama local AI** — all AI features run entirely on your machine with no API keys, no cloud costs, and full privacy.

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
| AI | **Ollama** (local) — Gemma 3 model |
| Charts | Recharts |
| Validation | Zod |

## AI Setup (Ollama Local)

This project uses [Ollama](https://ollama.com) to run AI models locally. No API key is needed.

### 1. Install Ollama

Download and install from **[ollama.com](https://ollama.com)**, or use a package manager:

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Pull the AI model

```bash
ollama pull gemma3
```

This downloads Google's Gemma 3 model (~3.9 GB). Only needs to run once.

### 3. Start the Ollama server

```bash
ollama serve
```

Or, to start and interact with the model directly:

```bash
ollama run gemma3
```

Keep Ollama running in a separate terminal while using the app.

### 4. Verify it's working

```bash
curl http://localhost:11434/api/tags
```

You should see `gemma3` listed in the response.

> **Note:** Ollama must be running for AI features (chat, summarize, quiz, flashcards) to work. All other features (auth, planner, notes CRUD, progress) work without it.

### Ollama Cloud (Optional)

If you prefer not to run AI locally, you can use Ollama Cloud instead:

```env
OLLAMA_BASE_URL="https://api.ollama.com"
OLLAMA_API_KEY="your-ollama-cloud-api-key"
OLLAMA_MODEL="gemma3"
```

The app automatically detects local vs. cloud mode based on your `OLLAMA_BASE_URL` and attaches the `Authorization: Bearer` header when an API key is set.

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

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/study_assistant?schema=public"
AUTH_SECRET="generate-with: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"

# Ollama — local mode (no API key needed)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="gemma3"
OLLAMA_API_KEY=""

# Or use Ollama Cloud:
# OLLAMA_BASE_URL="https://api.ollama.com"
# OLLAMA_API_KEY="your-ollama-cloud-api-key"
```

### 4. Set up the database

```bash
createdb study_assistant
npx prisma generate
npx prisma db push
```

### 5. Start the app

```bash
# Terminal 1 — Ollama
ollama serve

# Terminal 2 — Next.js
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** to use the app.

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
│   ├── ollama.ts            # Ollama AI client
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

Then pull it: `ollama pull llama3.2`. Any Ollama-compatible model works.

## Important Notes

- **Local mode:** Ollama must be running on your machine. No API key needed — everything is private and free.
- **Cloud mode:** Set `OLLAMA_BASE_URL` to your cloud endpoint and provide `OLLAMA_API_KEY`. Works for deployment and remote setups.
- **Without Ollama,** chat, summarize, quiz, and flashcard generation will show a connection error — all other features continue to work normally.

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

## License

MIT
