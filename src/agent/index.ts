import { openai } from "@ai-sdk/openai";
import { WebClient } from "@slack/web-api";
import { Output, generateText, stepCountIs } from "ai";
import { z } from "zod";
import { MYSTICAL_REPORTER } from "../config.js";
import type { NewspaperEdition } from "../schemas/article.js";
import { slackTools } from "./tools.js";
import { generateArticleAudio } from "./tts.js";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

const model = openai("gpt-4o");

const SYSTEM_PROMPT = `You are ${MYSTICAL_REPORTER}, a mysterious newspaper reporter who somehow always knows everything happening at Etimo.
You write in a fun, slightly dramatic newspaper style — think old-school tabloid mixed with genuine warmth for your colleagues.
You refer to yourself in third person occasionally and maintain an air of mystery about how you get your scoops.`;

type SlackData = {
	channels: Array<{ id: string; name: string }>;
	messages: Array<{
		channel: string;
		user: string;
		text: string;
		reactions?: Array<{ emoji: string; count: number }>;
	}>;
	users: Map<string, string>;
};

type AnalyzedSection = {
	id: string;
	label: string;
	sourceMessages: string[];
	angle: string;
};

type AgentState = {
	slackData: SlackData;
	analyzedSections: AnalyzedSection[];
	articles: Array<{
		id: string;
		section: string;
		sectionLabel?: string;
		headline: string;
		byline: string;
		lead: string;
		body: string;
		tags: string[];
		publishedAt: string;
		audioFile?: string;
	}>;
	currentStep: "gather" | "analyze" | "generate" | "audio" | "review" | "done";
	editorNote?: string;
	outputDir: string;
	includeAudio: boolean;
};

const MIN_MESSAGES_REQUIRED = 3;

// Extract all user IDs from text (format: <@U...>)
function extractUserIds(text: string): string[] {
	const mentionPattern = /<@([A-Z0-9]+)>/g;
	const matches = text.matchAll(mentionPattern);
	const ids = new Set<string>();
	for (const match of matches) {
		ids.add(match[1]);
	}
	return Array.from(ids);
}

// Replace user IDs with names in text
function replaceUserIds(text: string, users: Map<string, string>): string {
	return text.replace(/<@([A-Z0-9]+)>/g, (_, userId) => {
		const name = users.get(userId);
		return name ?? "a colleague";
	});
}

type AgentOptions = {
	outputDir?: string;
	includeAudio?: boolean;
};

export async function runAgent(options: AgentOptions = {}): Promise<NewspaperEdition | null> {
	const { outputDir = "dist/generated", includeAudio = false } = options;

	console.log("🔧 Initializing agent...");

	const state: AgentState = {
		slackData: { channels: [], messages: [], users: new Map() },
		analyzedSections: [],
		articles: [],
		currentStep: "gather",
		outputDir,
		includeAudio,
	};

	while (state.currentStep !== "done") {
		console.log(`\n📍 Current step: ${state.currentStep}`);
		switch (state.currentStep) {
			case "gather":
				await gatherStep(state);
				break;
			case "analyze":
				await analyzeStep(state);
				break;
			case "generate":
				await generateArticlesStep(state);
				break;
			case "audio":
				await generateAudioStep(state);
				break;
			case "review":
				await reviewStep(state);
				break;
		}
	}

	if (state.articles.length === 0) {
		return null;
	}

	return {
		editionNumber: generateEditionNumber(),
		editionDate: new Date().toISOString(),
		editorNote: state.editorNote,
		articles: state.articles,
	};
}

async function gatherStep(state: AgentState): Promise<void> {
	console.log("🔍 Gathering Slack data...");

	const twoYearsAgo = Math.floor((Date.now() - 2 * 365 * 24 * 60 * 60 * 1000) / 1000).toString();
	console.log(
		`  ⏰ Looking for messages since: ${new Date(Number(twoYearsAgo) * 1000).toISOString()}`,
	);

	const { steps, text } = await generateText({
		model,
		tools: slackTools,
		stopWhen: stepCountIs(10),
		system: `You are gathering data for the Etimo Weekly newspaper.
Your job is to collect interesting messages from Slack channels.

Steps:
1. First, list all channels to see what's available
2. Then get history from the most relevant channels (general, random, kudos, dev, etc.)
3. Look for messages with high reactions, interesting discussions, wins, funny moments

Focus on the past 2 years. Be thorough but efficient.`,
		prompt: `Gather interesting Slack messages from the past 2 years (since timestamp ${twoYearsAgo}).
Start by listing channels, then fetch messages from the most interesting ones.
Look for: celebrations, kudos, funny moments, wins, interesting discussions.`,
	});

	console.log(`  🤖 Agent completed ${steps.length} steps`);
	console.log(`  💭 Agent reasoning: ${text.slice(0, 200)}...`);

	// Process tool results from all steps
	for (const step of steps) {
		console.log(
			`  📊 Step had ${step.toolCalls?.length ?? 0} tool calls, ${step.toolResults?.length ?? 0} results`,
		);
		for (const result of step.toolResults ?? []) {
			const output = result.output as unknown;
			console.log(`    🔧 Tool: ${result.toolName}`);
			if (result.toolName === "listChannels" && Array.isArray(output)) {
				state.slackData.channels = output;
				console.log(`    📂 Found ${output.length} channels`);
			}
			if (result.toolName === "getChannelHistory" && Array.isArray(output)) {
				state.slackData.messages.push(...output);
				console.log(`    💬 Fetched ${output.length} messages`);
			}
			if (result.toolName === "getUserInfo" && output) {
				const user = output as { id: string; name: string };
				state.slackData.users.set(user.id, user.name);
				console.log(`    👤 Got user: ${user.name}`);
			}
		}
	}

	console.log(`  ✅ Total: ${state.slackData.messages.length} messages gathered`);
	if (state.slackData.messages.length < MIN_MESSAGES_REQUIRED) {
		console.log(
			`\n❌ Not enough content to generate a newspaper (need at least ${MIN_MESSAGES_REQUIRED} messages, got ${state.slackData.messages.length})`,
		);
		console.log("   Make sure the bot is invited to channels with /invite @YourBotName");
		state.currentStep = "done";
		return;
	}

	// Resolve all user IDs mentioned in messages
	console.log("  👥 Resolving user IDs...");
	const allUserIds = new Set<string>();
	for (const msg of state.slackData.messages) {
		// Add message author
		if (msg.user) allUserIds.add(msg.user);
		// Add mentioned users
		if (msg.text) {
			for (const id of extractUserIds(msg.text)) {
				allUserIds.add(id);
			}
		}
	}

	// Resolve users we don't have yet
	for (const userId of allUserIds) {
		if (!state.slackData.users.has(userId)) {
			try {
				const result = await slack.users.info({ user: userId });
				const name = result.user?.real_name ?? result.user?.name;
				if (name) {
					state.slackData.users.set(userId, name);
					console.log(`    👤 Resolved ${userId} → ${name}`);
				} else {
					console.log(`    ⚠️ No name found for user ${userId}`);
				}
			} catch (error: unknown) {
				const err = error as { data?: { error?: string } };
				console.log(`    ⚠️ Could not resolve user ${userId}: ${err.data?.error ?? error}`);
			}
		}
	}
	console.log(`  ✅ Resolved ${state.slackData.users.size} users`);

	// Replace user IDs with names in all messages
	for (const msg of state.slackData.messages) {
		if (msg.text) {
			msg.text = replaceUserIds(msg.text, state.slackData.users);
		}
		if (msg.user && state.slackData.users.has(msg.user)) {
			msg.user = state.slackData.users.get(msg.user) as string;
		}
	}

	state.currentStep = "analyze";
}

const AnalysisSchema = z.object({
	headline: z
		.object({
			sourceMessages: z.array(z.string()).describe("Key quotes/content for the headline"),
			angle: z.string().describe("The angle/hook for the headline article"),
		})
		.describe("The most newsworthy item that deserves the headline spot"),
	sections: z
		.array(
			z.object({
				id: z
					.string()
					.describe(
						"Section identifier (lowercase, underscores, e.g., 'product_launches', 'kudos', 'new_hires')",
					),
				label: z
					.string()
					.describe("Display label with emoji (e.g., '🚀 Product Launches', '🎉 Kudos Corner')"),
				sourceMessages: z.array(z.string()).describe("Key quotes/content to use"),
				angle: z.string().describe("The angle/hook for this article"),
			}),
		)
		.describe(
			"Dynamic sections based on content - create sections that fit the actual messages found",
		),
	gossip: z
		.object({
			sourceMessages: z.array(z.string()).describe("Anything mysterious, funny, or gossip-worthy"),
			angle: z.string().describe("The gossip angle"),
		})
		.describe("The recurring gossip section - always included"),
});

async function analyzeStep(state: AgentState): Promise<void> {
	console.log("📰 Analyzing gathered data...");
	console.log(`  📊 Analyzing ${state.slackData.messages.length} messages`);

	const { output: analysis } = await generateText({
		model,
		system: SYSTEM_PROMPT,
		prompt: `Analyze these Slack messages and determine what newspaper sections we should write.

Gathered data:
${JSON.stringify(state.slackData.messages, null, 2)}

Based on the ACTUAL content found, create appropriate sections. Don't use generic categories -
create sections that reflect what's really in the messages. For example:
- If there are product launches, create a "product_launches" section with label "🚀 Product Launches"
- If there are kudos/shoutouts, create a "kudos" section with label "🎉 Kudos Corner"
- If someone joined/left, create a "team_news" section with label "👋 Team News"
- If there are interesting discussions, create a "hot_topics" section with label "🔥 Hot Topics"

Be creative with section names based on the content. The gossip section is ALWAYS required.`,
		output: Output.object({ schema: AnalysisSchema }),
	});

	if (analysis) {
		// Build the sections list: headline first, then dynamic sections, then gossip
		state.analyzedSections = [
			{
				id: "headline",
				label: "📰 Breaking News",
				sourceMessages: analysis.headline.sourceMessages,
				angle: analysis.headline.angle,
			},
			...analysis.sections,
			{
				id: "gossip",
				label: "👀 Office Gossip",
				sourceMessages: analysis.gossip.sourceMessages,
				angle: analysis.gossip.angle,
			},
		];
		console.log(`  📋 Analysis complete: ${state.analyzedSections.length} sections identified`);
		console.log(`  📌 Sections: ${state.analyzedSections.map((s) => s.id).join(", ")}`);
	}

	state.currentStep = "generate";
}

// Schema for LLM output - all fields required (OpenAI strict mode requirement)
const ArticleGenerationSchema = z.object({
	headline: z.string().describe("Catchy newspaper-style headline (NO emojis, plain text only)"),
	lead: z.string().describe("Opening paragraph that hooks the reader (plain text)"),
	body: z
		.string()
		.describe("Main article content as HTML (use <p>, <strong>, <em> tags, NOT markdown)"),
	tags: z.array(z.string()).describe("Relevant tags for the article"),
});

async function generateArticlesStep(state: AgentState): Promise<void> {
	console.log("✍️ Generating articles...");

	for (const section of state.analyzedSections) {
		console.log(`  📝 Generating ${section.label} article...`);
		try {
			const { output: article } = await generateText({
				model,
				system: SYSTEM_PROMPT,
				prompt: `Write an article for the "${section.label}" section based on this context:

Section angle: ${section.angle}
Key source content: ${section.sourceMessages.join("\n")}

Full Slack data for reference:
${JSON.stringify(state.slackData.messages, null, 2)}

IMPORTANT FORMATTING RULES:
- headline: Plain text only, NO emojis (the section label already has the emoji)
- lead: Plain text paragraph
- body: Use HTML tags (<p>, <strong>, <em>) for formatting, NOT markdown (no ** or *)

Write in newspaper style. Be fun and engaging.
${section.id === "headline" ? "This is the MAIN HEADLINE - make it big and dramatic!" : ""}
${section.id === "gossip" ? "This is the gossip column - be mysterious and playful, hint at secrets and office intrigue!" : ""}
Reference real people by name from the data. Use their actual names, not IDs.`,
				output: Output.object({ schema: ArticleGenerationSchema }),
			});

			if (article) {
				state.articles.push({
					...article,
					id: `art-${Date.now()}-${section.id}`,
					section: section.id,
					sectionLabel: section.label,
					byline: MYSTICAL_REPORTER,
					publishedAt: new Date().toISOString(),
				});
				console.log(`  ✅ Generated: ${article.headline}`);
			}
		} catch (error) {
			console.error(`  ❌ Failed to generate ${section.label}:`, error);
		}
	}

	state.currentStep = state.includeAudio ? "audio" : "review";
}

async function generateAudioStep(state: AgentState): Promise<void> {
	console.log("🎙️ Generating audio for articles...");

	for (const article of state.articles) {
		try {
			const audioFile = await generateArticleAudio(
				article.id,
				article.headline,
				article.lead,
				article.body,
				state.outputDir,
			);
			article.audioFile = audioFile;
		} catch (error) {
			console.error(`  ❌ Failed to generate audio for ${article.headline}:`, error);
		}
	}

	state.currentStep = "review";
}

async function reviewStep(state: AgentState): Promise<void> {
	console.log("🔍 Reviewing edition...");
	console.log(`  📄 ${state.articles.length} articles to review`);

	const { text: editorNote } = await generateText({
		model,
		system: SYSTEM_PROMPT,
		prompt: `You've just finished this week's edition with these headlines:

${state.articles.map((a) => `- ${a.headline}`).join("\n")}

Write a brief, witty editor's note (1-2 sentences) to introduce this edition.`,
	});

	state.editorNote = editorNote;
	state.currentStep = "done";

	console.log("  ✅ Edition complete!");
	console.log(`  📝 Editor's note: ${editorNote}`);
}

function generateEditionNumber(): number {
	const now = new Date();
	const start = new Date(now.getFullYear(), 0, 1);
	const diff = now.getTime() - start.getTime();
	const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
	return week + (now.getFullYear() - 2024) * 52;
}
