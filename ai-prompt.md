# Etimo Weekly — AI Context Document

## Project Overview

Etimo Weekly is a fun internal project that transforms company Slack messages and events into a newspaper-style website. It's an agentic AI application that processes raw company data and outputs formatted HTML articles.

**Core concept:** An AI agent reads Slack messages and generates a weekly "newspaper" with different sections, all written by a fictional mysterious reporter named **Sven 'The Shadow' Spansen** — who somehow always knows everything, yet nobody has ever seen in the flesh.

## Tech Stack

- **Language:** TypeScript (ES modules)
- **Runtime:** Node.js
- **AI:** Vercel AI SDK with OpenAI provider (gpt-4o)
- **Validation:** Zod schemas for both input data and LLM output
- **Linting:** Biome
- **Output:** Pure HTML with inline CSS (newspaper styling)

## Project Structure

```
src/
  config.ts              # Shared constants (reporter name, tagline)
  index.ts               # Package exports
  server.ts              # Express dev server (serves HTML at localhost:3000)
  build-static.ts        # Generates static HTML file

  agent/
    index.ts             # Main agentic loop
    run.ts               # CLI entry point for running the agent

  schemas/
    article.ts           # Zod schemas: Article, NewspaperEdition, SectionType
    raw-data.ts          # Zod schemas: SlackMessage, RawDataInput

  mocks/
    mock-articles.ts     # Sample newspaper edition (for testing render)
    mock-raw-data.ts     # Sample Slack messages (for testing agent)

  templates/
    render.ts            # Pure HTML rendering function
```

## Key Schemas

### Article (output)
```typescript
{
  id: string
  section: "headline" | "weeks_wins" | "slack_highlights" | "random_facts" | "gossip"
  headline: string           // Catchy newspaper-style headline
  byline?: string            // Always "Sven 'The Shadow' Spansen"
  lead: string               // Opening hook paragraph
  body: string               // Main article content
  tags?: string[]
  publishedAt: string        // ISO datetime
}
```

### NewspaperEdition (output)
```typescript
{
  editionNumber: number
  editionDate: string        // ISO datetime
  editorNote?: string        // Witty intro from "The Editor"
  articles: Article[]
}
```

### RawDataInput (input)
```typescript
{
  period: { start: string, end: string }
  slackMessages: Array<{
    channel: string
    author: string
    content: string
    reactions?: Array<{ emoji: string, count: number }>
    timestamp: string
  }>
}
```

## Agent Loop

The agent runs in 3 steps:

1. **Analyze** — Examines raw Slack data, identifies the most newsworthy item for the headline, categorizes other messages into sections, determines angles/hooks for each article.

2. **Generate** — For each section (headline, weeks_wins, slack_highlights, random_facts, gossip), calls the LLM with `generateObject()` using the Article Zod schema to ensure structured output.

3. **Review** — Generates a witty editor's note based on all the headlines.

State machine: `analyze → generate → review → done`

## Newspaper Sections

| Section | Label | Purpose |
|---------|-------|---------|
| `headline` | Breaking News | The biggest story of the week |
| `weeks_wins` | This Week's Wins | Achievements, shipped features, closed deals |
| `slack_highlights` | Slack Highlights | Notable messages, kudos, shoutouts |
| `random_facts` | Random Fun Facts | Quirky observations, fun moments |
| `gossip` | Office Gossip | Lighthearted mysteries, rumors, speculation |

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload (localhost:3000) |
| `npm run agent` | Run the AI agent to generate a new edition |
| `npm run build:static` | Generate static HTML from mock data |
| `npm run lint` | Run Biome linter |
| `npm run lint:fix` | Run Biome with auto-fix |

## Environment Variables

```
OPENAI_API_KEY=sk-...   # Required for agent
```

## Writing Style

The fictional reporter Sven 'The Shadow' Spansen writes in:
- Fun, slightly dramatic newspaper style
- Old-school tabloid tone mixed with genuine warmth
- Occasionally refers to himself in third person
- Maintains an air of mystery about how he gets his scoops
- Uses newspaper conventions: "sources say", "reportedly", "when reached for comment"

## Future Enhancements

Potential areas for expansion:
- Slack API integration for real data ingestion
- Multiple LLM provider support
- Image generation for article illustrations
- Email distribution
- Archive of past editions
- More section types (interviews, polls, weather-style "mood of the office")

## Key Files to Modify

| Task | Files |
|------|-------|
| Change article structure | `src/schemas/article.ts` |
| Change raw data format | `src/schemas/raw-data.ts` |
| Modify agent behavior | `src/agent/index.ts` |
| Change HTML/CSS output | `src/templates/render.ts` |
| Add new sections | `src/schemas/article.ts` (SectionType), `src/templates/render.ts` (CSS) |
| Change reporter persona | `src/config.ts`, `src/agent/index.ts` (SYSTEM_PROMPT) |
