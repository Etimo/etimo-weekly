# Etimo Weekly — AI Context Document

## Project Overview

Etimo Weekly is a fun internal project that transforms company Slack messages and events into a newspaper-style website. It's an agentic AI application that fetches real Slack data and outputs formatted HTML articles.

**Core concept:** An AI agent connects to Slack, gathers interesting messages, and generates a weekly "newspaper" with different sections, all written by a fictional mysterious reporter named **Sven 'The Shadow' Spansen** — who somehow always knows everything, yet nobody has ever seen in the flesh.

## Tech Stack

- **Language:** TypeScript (ES modules)
- **Runtime:** Node.js
- **AI:** Vercel AI SDK v6 with OpenAI provider (gpt-4o)
- **Slack:** @slack/web-api for fetching messages
- **Validation:** Zod schemas for LLM structured output
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
    index.ts             # Main agentic loop (4 steps)
    tools.ts             # Slack tools for the agent
    run.ts               # CLI entry point for running the agent

  schemas/
    article.ts           # Zod schemas: Article, NewspaperEdition, SectionType
    raw-data.ts          # Zod schemas: SlackMessage, RawDataInput (for reference)

  mocks/
    mock-articles.ts     # Sample newspaper edition (for testing render)
    mock-raw-data.ts     # Sample Slack messages (legacy, not used by agent)

  templates/
    render.ts            # Pure HTML rendering function
```

## Agent Architecture

### Agent Loop (4 steps)

1. **Gather** — Uses Slack tools to fetch messages from channels the bot is a member of. Looks for interesting content over the past 2 years.

2. **Analyze** — LLM examines gathered messages, identifies the most newsworthy item for the headline, categorizes other messages into sections.

3. **Generate** — For each section (headline, weeks_wins, slack_highlights, random_facts, gossip), calls the LLM with `generateText()` + `Output.object()` using Zod schemas.

4. **Review** — Generates a witty editor's note based on all the headlines.

State machine: `gather → analyze → generate → review → done`

### Slack Tools

The agent has access to these tools (defined in `src/agent/tools.ts`):

| Tool | Description |
|------|-------------|
| `listChannels` | List channels the bot is a member of |
| `getChannelHistory` | Get messages from a specific channel |
| `getUserInfo` | Resolve user IDs to names |
| `searchMessages` | Search messages across workspace |

### Early Exit

The agent exits early if:
- Fewer than 3 messages are gathered
- Bot isn't invited to any channels

## Key Schemas

### Article (LLM output)
```typescript
{
  section: "headline" | "weeks_wins" | "slack_highlights" | "random_facts" | "gossip"
  headline: string           // Catchy newspaper-style headline
  lead: string               // Opening hook paragraph
  body: string               // Main article content
  tags: string[]             // Relevant tags
}
// id, byline, publishedAt are added after generation
```

### NewspaperEdition (final output)
```typescript
{
  editionNumber: number
  editionDate: string        // ISO datetime
  editorNote?: string        // Witty intro from "The Editor"
  articles: Article[]
}
```

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
OPENAI_API_KEY=sk-...        # Required for LLM calls
SLACK_BOT_TOKEN=xoxb-...     # Required for Slack API
```

## Slack Setup

1. Create a Slack App at api.slack.com/apps
2. Add Bot Token Scopes: `channels:history`, `channels:read`, `users:read`, `reactions:read`
3. Install to workspace
4. Copy Bot User OAuth Token to `.env`
5. **Important:** Invite the bot to channels with `/invite @YourAppName`

## Writing Style

The fictional reporter Sven 'The Shadow' Spansen writes in:
- Fun, slightly dramatic newspaper style
- Old-school tabloid tone mixed with genuine warmth
- Occasionally refers to himself in third person
- Maintains an air of mystery about how he gets his scoops
- Uses newspaper conventions: "sources say", "reportedly", "when reached for comment"

## Vercel AI SDK v6 Notes

- `generateObject()` is deprecated — use `generateText()` with `Output.object({ schema })` instead
- Multi-step tool calling uses `stopWhen: stepCountIs(n)` instead of `maxSteps`
- Tool results are accessed via `steps[].toolResults[].output` (not `.result`)
- Tool definitions use `inputSchema` (not `parameters`)

## Key Files to Modify

| Task | Files |
|------|-------|
| Change article structure | `src/schemas/article.ts` |
| Modify agent behavior | `src/agent/index.ts` |
| Add/modify Slack tools | `src/agent/tools.ts` |
| Change HTML/CSS output | `src/templates/render.ts` |
| Add new sections | `src/schemas/article.ts` (SectionType), `src/templates/render.ts` (CSS) |
| Change reporter persona | `src/config.ts`, `src/agent/index.ts` (SYSTEM_PROMPT) |

## Future Enhancements

Potential areas for expansion:
- Multiple LLM provider support (Anthropic, etc.)
- Image generation for article illustrations
- Email distribution
- Archive of past editions
- Scheduled runs (cron)
- More section types (interviews, polls, weather-style "mood of the office")
- Web UI for browsing past editions
