# Etimo Weekly

A newspaper-style website for Etimo company happenings. Aggregates Slack messages and company events into a fun, old-school newspaper format.

All articles are authored by the mysterious **Sven 'The Shadow' Spansen** — who somehow always knows, yet nobody has ever seen in the flesh.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build:static` | Generate static HTML to `dist/static/index.html` |
| `npm run lint` | Run Biome linter |
| `npm run lint:fix` | Run Biome with auto-fix |

## Project Structure

```
src/
  schemas/
    article.ts        # Zod schemas for Article, NewspaperEdition
    raw-data.ts       # Schema for raw Slack input
  mocks/
    mock-articles.ts  # Mock newspaper edition
    mock-raw-data.ts  # Sample Slack messages
  templates/
    render.ts         # Pure HTML rendering
  server.ts           # Express dev server
  build-static.ts     # Static site generator
```

## How It Works

1. **Raw data** (Slack messages, events) is validated against `RawDataInputSchema`
2. **AI agent** (future) processes raw data into articles using Vercel AI SDK + Zod schemas
3. **Articles** are validated against `ArticleSchema` with sections: headline, weeks_wins, slack_highlights, random_facts, gossip
4. **Renderer** outputs pure HTML with newspaper-style CSS

## Schemas

Articles follow this structure (enforced by Zod):

```typescript
{
  id: string
  section: "headline" | "weeks_wins" | "slack_highlights" | "random_facts" | "gossip"
  headline: string
  byline?: string
  lead: string      // Opening hook
  body: string      // Main content
  tags?: string[]
  publishedAt: string // ISO datetime
}
```

## Tech Stack

- TypeScript
- Node.js + Express
- Zod (schema validation)
- Vercel AI SDK (for future LLM integration)
- Biome (linting/formatting)
