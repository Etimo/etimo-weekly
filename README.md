# Etimo Weekly

An AI-powered newspaper generator that transforms Slack messages into a fun, Swedish-language weekly newspaper. Aggregates messages, reactions, threads, and anonymous tips, then uses LLM reporters with distinct personalities to write articles.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 (API docs at http://localhost:3000/docs)

## Environment Variables

Create a `.env` file:

```env
# Required
OPENAI_API_KEY=sk-...
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# Service overrides (default: real services)
SERVICES_SLACK=slack        # "slack" or "fake"
SERVICES_LLM=openai         # "openai" or "fake"
SERVICES_TTS=openai          # "openai" or "fake"

# Optional
OPENAI_MODEL=gpt-5.2
TTS_MODEL=tts-1
PORT=3000
NODE_ENV=development
```

## Running the AI Agent

Generate a new newspaper edition from Slack data:

```bash
pnpm agent                        # Generate newspaper (PDF)
pnpm agent -- --include-audio     # With audio narration (MP3 per article)
pnpm agent -- --include-html      # Also save HTML output
pnpm agent:fake                   # Run with mock services (no API keys needed)
```

Output is saved to `dist/generated/`:
- `etimo-veckoblad-{N}.pdf` — each edition gets a unique PDF
- `etimo-veckoblad-{N}.html` — archived HTML (if `--include-html`)
- `index.html` — always points to the latest edition

## Anonymous Tips

Users can DM the Slack bot to submit anonymous tips. Tips are woven into the gossip column ("Kontorsskvaller") by **Den Mystiska Reportern**.

### Flow

1. User sends a DM to the bot in Slack
2. Slack delivers the event to `POST /slack/events`
3. Request signature is verified (HMAC-SHA256)
4. Rate limit is checked (5 tips/hour per user)
5. Tip text is saved to `data/tips.json` (user ID is **not** stored)
6. Bot sends a confirmation DM back to the user
7. On the next agent run, `consumeTips()` reads all tips and clears the file
8. Tips are fed to the LLM as material for the gossip column

### Dev Endpoints

These are disabled in production:

- `POST /test/tip` — submit a test tip (`{ "text": "..." }`)
- `GET /test/tips` — view all pending tips

## Local Testing with ngrok

To test the Slack webhook locally, you need a public URL:

1. Install ngrok and authenticate:
   ```bash
   ngrok config add-authtoken <your-token>
   ```

2. Start the dev server and ngrok:
   ```bash
   pnpm dev                # terminal 1
   ngrok http 3000         # terminal 2
   ```

3. Copy the ngrok `https://` URL and configure it in your Slack app:
   - **Event Subscriptions** > Request URL: `https://<id>.ngrok-free.app/slack/events`
   - **Subscribe to bot events**: `message.im`

4. DM the bot — you should see the tip logged in your dev server terminal.

Note: the ngrok URL changes on every restart (free plan). Update the Slack Request URL accordingly.

## Slack App Setup

### Required Bot Token Scopes

| Scope | Purpose |
|-------|---------|
| `channels:history` | Read public channel messages |
| `channels:read` | List public channels |
| `groups:history` | Read private channel messages |
| `groups:read` | List private channels the bot is in |
| `chat:write` | Send confirmation DMs |
| `im:history` | Read DM messages |
| `im:read` | Access DM channels |
| `reactions:read` | Read emoji reactions |
| `users:read` | Resolve user IDs to names |
| `emoji:read` | Fetch custom workspace emojis |
| `search:read` | Search messages |

### App Home Settings

Enable **Messages Tab** and check **"Allow users to send Slash commands and messages from the messages tab"** — otherwise users will see "Sending messages to this app has been turned off."

After changing scopes or settings, **reinstall the app** to your workspace.

## Architecture

```
src/
  agent/
    index.ts              # Agent state machine (Gather -> Analyze -> Generate -> Crossword -> Audio -> Review)
    run.ts                # CLI entry point for agent
    reporters.ts          # Reporter characters with distinct voices
  routes/
    slack.ts              # Slack Events API webhook (DM -> anonymous tip)
    tips.ts               # Dev endpoints for tip management
    newspaper.ts          # Newspaper viewing routes
  services/
    slack/                # Slack API client (real + mock)
    llm/                  # LLM integration (real + mock)
    tts/                  # Text-to-speech (real + mock)
    tips/                 # File-based tip storage
  plugins/
    rate-limit.ts         # Per-user rate limiting for tips (5/hour)
  persistence/
    edition-store.ts      # Edition history and crossword solutions
  crossword/
    generator.ts          # Crossword puzzle generator
  templates/
    render.ts             # HTML rendering with emoji support
  utils/
    emoji.ts              # Slack emoji shortcode -> Unicode/image conversion
  schemas/
    article.ts            # Zod schemas for articles and editions
data/
  tips.json               # Pending anonymous tips (consumed on agent run)
  edition-store.json      # Edition counter and history
dist/generated/           # Output PDFs, HTML, and audio files
```


## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm agent` | Generate a newspaper edition |
| `pnpm agent:fake` | Generate with mock services |
| `pnpm build:pdf` | Generate PDF from existing edition |
| `pnpm build:static` | Build static HTML |
| `pnpm test` | Run tests (watch mode) |
| `pnpm test:run` | Run tests once |
| `pnpm lint` | Check linting |
| `pnpm lint:fix` | Auto-fix linting issues |

## Tech Stack

- TypeScript
- Node.js + Fastify
- Vercel AI SDK (OpenAI provider)
- Slack Web API
- Puppeteer (PDF generation)
- Zod (schema validation)
- Vitest (testing)
- Biome (linting/formatting)
