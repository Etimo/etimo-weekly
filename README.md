# Etimo Weekly

A newspaper-style website for Etimo company happenings. Aggregates Slack messages and company events into a fun, old-school newspaper format.

All articles are authored by the mysterious **Sven 'The Shadow' Spansen** — who somehow always knows, yet nobody has ever seen in the flesh.

**Now fully localized in Swedish! 🇸🇪**

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Running the AI Agent

To generate a new edition from real Slack data:

```bash
# Generate newspaper
npm run agent

# Generate newspaper with audio narration (requires extra flags)
npm run agent -- --include-audio
```

## Features

- **Swedish Localization**: All articles and UI text are generated in natural, idiomatic Swedish.
- **Thread Support**: The agent reads full threaded conversations to get the full context of discussions.
- **Dynamic Sections**: Sections are created dynamically based on content (e.g., "🚀 Produktlanseringar", "🔥 Heta Ämnen").
- **Audio Output**: Can generate MP3 narrations for every article (using OpenAI TTS).

## Project Structure

```
src/
  agent/
    index.ts          # Main agent loop (Gather -> Analyze -> Generate -> Review)
    tools.ts          # Slack tools (listCannels, history, threads)
  schemas/
    article.ts        # Zod schemas for Article, NewspaperEdition
  mocks/
    mock-articles.ts  # Mock newspaper edition
  templates/
    render.ts         # Pure HTML rendering
  server.ts           # Express dev server
```

## Tech Stack

- TypeScript
- Node.js + Express
- Vercel AI SDK (OpenAI Provider)
- Slack Web API
- Zod (schema validation)
- Biome (linting/formatting)
