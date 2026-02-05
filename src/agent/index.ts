import { tool } from "ai";
import { z } from "zod";
import { MYSTICAL_REPORTER } from "../config.js";
import type { NewspaperEdition } from "../schemas/article.js";
import type { ILLMService } from "../services/llm/ILLMService.js";
import type { ISlackService } from "../services/slack/ISlackService.js";
import type { IFileTipsService, Tip } from "../services/tips/IFileTipsService.js";
import type { ITTSService } from "../services/tts/ITTSService.js";

const SYSTEM_PROMPT = `You are ${MYSTICAL_REPORTER}, a mysterious newspaper reporter who somehow always knows everything happening at Etimo.
You write in a fun, slightly dramatic newspaper style — think old-school tabloid mixed with genuine warmth for your colleagues.
You maintain an air of mystery about how you get your scoops, but you do NOT refer to yourself in the articles.
IMPORTANT: You MUST write EVERYTHING in Swedish.`;

type SlackData = {
	channels: Array<{ id: string; name: string }>;
	messages: Array<{
		user: string;
		text: string;
		ts?: string;
		channel?: string;
		reactions?: Array<{ emoji?: string; count?: number; users?: string[] }>;
		replies?: Array<{ user: string; text: string }>;
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
	anonymousTips: Tip[];
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

function extractUserIds(text: string): string[] {
	const mentionPattern = /<@([A-Z0-9]+)>/g;
	const matches = text.matchAll(mentionPattern);
	const ids = new Set<string>();
	for (const match of matches) {
		ids.add(match[1]);
	}
	return Array.from(ids);
}

function replaceUserIds(text: string, users: Map<string, string>): string {
	return text.replace(/<@([A-Z0-9]+)>/g, (_, userId) => {
		const name = users.get(userId);
		return name ?? "a colleague";
	});
}

export type AgentDependencies = {
	slack: ISlackService;
	llm: ILLMService;
	tts: ITTSService;
	tips: IFileTipsService;
};

export type AgentOptions = {
	outputDir?: string;
	includeAudio?: boolean;
};

export async function runAgent(
	deps: AgentDependencies,
	options: AgentOptions = {},
): Promise<NewspaperEdition | null> {
	const { outputDir = "dist/generated", includeAudio = false } = options;

	console.log("🔧 Initializing agent...");

	const state: AgentState = {
		slackData: { channels: [], messages: [], users: new Map() },
		anonymousTips: [],
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
				await gatherStep(state, deps);
				break;
			case "analyze":
				await analyzeStep(state, deps);
				break;
			case "generate":
				await generateArticlesStep(state, deps);
				break;
			case "audio":
				await generateAudioStep(state, deps);
				break;
			case "review":
				await reviewStep(state, deps);
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

function createSlackTools(slack: ISlackService) {
	return {
		listChannels: tool({
			description: "List public channels in the Slack workspace that the bot is a member of",
			inputSchema: z.object({
				limit: z.number().optional().default(100).describe("Max channels to return"),
			}),
			execute: async ({ limit }) => {
				return slack.listChannels(limit);
			},
		}),

		getChannelHistory: tool({
			description: "Get recent messages from a Slack channel",
			inputSchema: z.object({
				channelId: z.string().describe("The channel ID (e.g., C01234567)"),
				limit: z.number().optional().default(50).describe("Max messages to return"),
				oldest: z.string().optional().describe("Only messages after this Unix timestamp"),
			}),
			execute: async ({ channelId, limit, oldest }) => {
				return slack.getChannelHistory(channelId, limit, oldest);
			},
		}),

		getUserInfo: tool({
			description: "Get information about a Slack user by their ID",
			inputSchema: z.object({
				userId: z.string().describe("The user ID (e.g., U01234567)"),
			}),
			execute: async ({ userId }) => {
				return slack.getUserInfo(userId);
			},
		}),

		searchMessages: tool({
			description: "Search for messages across the workspace",
			inputSchema: z.object({
				query: z.string().describe("Search query"),
				count: z.number().optional().default(20).describe("Max results"),
			}),
			execute: async ({ query, count }) => {
				return slack.searchMessages(query, count);
			},
		}),

		getThreadReplies: tool({
			description: "Get the full conversation thread for a message",
			inputSchema: z.object({
				channelId: z.string().describe("The channel ID"),
				ts: z.string().describe("The timestamp of the parent message (acts as ID)"),
			}),
			execute: async ({ channelId, ts }) => {
				return slack.getThreadReplies(channelId, ts);
			},
		}),
	};
}

async function gatherStep(state: AgentState, deps: AgentDependencies): Promise<void> {
	console.log("🔍 Gathering Slack data...");

	const twoYearsAgo = Math.floor((Date.now() - 2 * 365 * 24 * 60 * 60 * 1000) / 1000).toString();
	console.log(
		`  ⏰ Looking for messages since: ${new Date(Number(twoYearsAgo) * 1000).toISOString()}`,
	);

	const slackTools = createSlackTools(deps.slack);

	const { text, steps } = await deps.llm.generateWithTools({
		tools: slackTools,
		maxSteps: 10,
		system: `You are gathering data for the Etimo Weekly newspaper.
Your job is to collect interesting messages from Slack channels.

Steps:
1. First, list all channels to see what's available
2. Then get history from the most relevant channels (general, random, kudos, dev, etc.)
3. Look for messages with high reactions, interesting discussions, wins, funny moments
4. IMPORTANT: If you see a message with interesting replies (threadReplies > 0), use getThreadReplies to fetch the full conversation.

Focus on the past 2 years. Be thorough but efficient.`,
		prompt: `Gather interesting Slack messages from the past 2 years (since timestamp ${twoYearsAgo}).
Start by listing channels, then fetch messages from the most interesting ones.
If you see interesting discussions in threads, fetch the replies!
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
			if (result.toolName === "getThreadReplies" && Array.isArray(output)) {
				const toolCall = step.toolCalls?.find((tc) => tc.toolCallId === result.toolCallId);
				const args = toolCall?.args as { channelId: string; ts: string } | undefined;

				if (args) {
					const parentMsg = state.slackData.messages.find(
						(m) => m.channel === args.channelId && m.ts === args.ts,
					);
					if (parentMsg) {
						parentMsg.replies = output as Array<{ user: string; text: string }>;
						console.log(
							`    🧵 Attached ${output.length} replies to message from ${parentMsg.user}`,
						);
					}
				}
			}
		}
	}

	console.log(`  ✅ Total: ${state.slackData.messages.length} messages gathered`);

	// If no messages from LLM tool calls, fetch directly (e.g., mock LLM)
	if (state.slackData.messages.length === 0) {
		console.log("  📦 Fetching data directly from Slack service...");
		const channels = await deps.slack.listChannels();
		state.slackData.channels = channels;
		for (const channel of channels) {
			const messages = await deps.slack.getChannelHistory(channel.id);
			state.slackData.messages.push(...messages);
		}
	}

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
		if (msg.user) allUserIds.add(msg.user);
		if (msg.text) {
			for (const id of extractUserIds(msg.text)) {
				allUserIds.add(id);
			}
		}
		if (msg.reactions) {
			for (const r of msg.reactions) {
				if (r.users) {
					for (const u of r.users) allUserIds.add(u);
				}
			}
		}
	}

	// Resolve users we don't have yet
	for (const userId of allUserIds) {
		if (!state.slackData.users.has(userId)) {
			const user = await deps.slack.getUserInfo(userId);
			if (user) {
				state.slackData.users.set(user.id, user.name);
				console.log(`    👤 Resolved ${userId} → ${user.name}`);
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
		if (msg.reactions) {
			for (const r of msg.reactions) {
				if (r.users) {
					r.users = r.users.map((u) => state.slackData.users.get(u) ?? u);
				}
			}
		}
	}

	// Load anonymous tips submitted by users
	state.anonymousTips = await deps.tips.consumeTips();
	if (state.anonymousTips.length > 0) {
		console.log(`  📬 Loaded ${state.anonymousTips.length} anonymous tips for the gossip column`);
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

async function analyzeStep(state: AgentState, deps: AgentDependencies): Promise<void> {
	console.log("📰 Analyzing gathered data...");
	console.log(`  📊 Analyzing ${state.slackData.messages.length} messages`);
	if (state.anonymousTips.length > 0) {
		console.log(`  📬 Including ${state.anonymousTips.length} anonymous tips for gossip`);
	}

	// Format anonymous tips for inclusion
	const tipsSection =
		state.anonymousTips.length > 0
			? `

ANONYMOUS TIPS (submitted by readers for the gossip column):
${state.anonymousTips.map((t) => `- "${t.text}"`).join("\n")}

These tips are ANONYMOUS - do not try to identify who sent them. Use them as inspiration for the gossip section!`
			: "";

	const { output: analysis } = await deps.llm.generateStructured({
		schema: AnalysisSchema,
		system: SYSTEM_PROMPT,
		prompt: `Analyze these Slack messages and determine what newspaper sections we should write.

Gathered data:
${JSON.stringify(state.slackData.messages, null, 2)}
${tipsSection}

Based on the ACTUAL content found, create appropriate sections. Don't use generic categories -
create sections that reflect what's really in the messages. For example:
- If there are product launches, create a "product_launches" section with label "🚀 Produktlanseringar"
- If there are kudos/shoutouts, create a "kudos" section with label "🎉 Kudos-hörnan"
- If someone joined/left, create a "team_news" section with label "👋 Team-nytt"
- If there are interesting discussions, create a "hot_topics" section with label "🔥 Heta Ämnen"

Be creative with section names based on the content. The gossip section is ALWAYS required.
${state.anonymousTips.length > 0 ? "IMPORTANT: Make sure to incorporate the anonymous tips into the gossip section!" : ""}
Ensure all labels are in Swedish.`,
	});

	if (analysis) {
		state.analyzedSections = [
			{
				id: "headline",
				label: "📰 Senaste Nytt",
				sourceMessages: analysis.headline.sourceMessages,
				angle: analysis.headline.angle,
			},
			...analysis.sections,
			{
				id: "gossip",
				label: "👀 Kontorsskvaller",
				sourceMessages: analysis.gossip.sourceMessages,
				angle: analysis.gossip.angle,
			},
		];
		console.log(`  📋 Analysis complete: ${state.analyzedSections.length} sections identified`);
		console.log(`  📌 Sections: ${state.analyzedSections.map((s) => s.id).join(", ")}`);
	}

	state.currentStep = "generate";
}

const ArticleGenerationSchema = z.object({
	headline: z.string().describe("Catchy newspaper-style headline (NO emojis, plain text only)"),
	lead: z.string().describe("Opening paragraph that hooks the reader (plain text)"),
	body: z
		.string()
		.describe("Main article content as HTML (use <p>, <strong>, <em> tags, NOT markdown)"),
	tags: z.array(z.string()).describe("Relevant tags for the article"),
});

async function generateArticlesStep(state: AgentState, deps: AgentDependencies): Promise<void> {
	console.log("✍️ Generating articles...");

	for (const section of state.analyzedSections) {
		console.log(`  📝 Generating ${section.label} article...`);
		try {
			const { output: article } = await deps.llm.generateStructured({
				schema: ArticleGenerationSchema,
				system: SYSTEM_PROMPT,
				prompt: `Write an article for the "${section.label}" section based on this context:

Section angle: ${section.angle}
Key source content: ${section.sourceMessages.join("\n")}

Full Slack data for reference (including threads):
${JSON.stringify(state.slackData.messages, null, 2)}

IMPORTANT FORMATTING RULES:
- headline: Plain text only, NO emojis (the section label already has the emoji)
- lead: Plain text paragraph
- body: Use HTML tags (<p>, <strong>, <em>) for formatting, NOT markdown (no ** or *)

Write in Swedish. Write in a fun, engaging newspaper style.
IMPORTANT: Use natural, idiomatic Swedish. Avoid direct translations from English idioms (no "Swenglish"). Flow like a real Swedish tabloid or office newsletter.
Keep the article short and concise (max 2-3 paragraphs).
Mention who reacted to the messages if relevant (e.g. "Björn reagerade med 🔥").
End with a short, punchy signoff (e.g. "/- Redaktionen" or "/- Sven").
${section.id === "headline" ? "This is the MAIN HEADLINE - make it big and dramatic!" : ""}
${
	section.id === "gossip"
		? `This is the gossip column - be mysterious and playful, hint at secrets and office intrigue!
${state.anonymousTips.length > 0 ? `\nANONYMOUS TIPS to incorporate:\n${state.anonymousTips.map((t) => `- "${t.text}"`).join("\n")}\nThese tips are ANONYMOUS - weave them into the gossip naturally without revealing sources!` : ""}`
		: ""
}
Reference real people by name from the data. Use their actual names, not IDs.`,
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

function sanitizeTextForSpeech(text: string): string {
	let clean = text.replace(/<[^>]*>/g, "");
	clean = clean
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "och")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"');
	clean = clean.replace(/<@[A-Z0-9]+>/g, "en kollega");
	return clean;
}

async function generateAudioStep(state: AgentState, deps: AgentDependencies): Promise<void> {
	console.log("🎙️ Generating audio for articles...");

	const { mkdirSync } = await import("node:fs");
	mkdirSync(state.outputDir, { recursive: true });

	for (const article of state.articles) {
		try {
			const rawText = `${article.headline}. ${article.lead} ${article.body}`;
			const text = sanitizeTextForSpeech(rawText);
			const filename = `${article.id}.mp3`;
			const filepath = `${state.outputDir}/${filename}`;

			await deps.tts.generateAudio(text, filepath);
			article.audioFile = filename;
		} catch (error) {
			console.error(`  ❌ Failed to generate audio for ${article.headline}:`, error);
		}
	}

	state.currentStep = "review";
}

async function reviewStep(state: AgentState, deps: AgentDependencies): Promise<void> {
	console.log("🔍 Reviewing edition...");
	console.log(`  📄 ${state.articles.length} articles to review`);

	const { text: editorNote } = await deps.llm.generateText({
		system: SYSTEM_PROMPT,
		prompt: `You've just finished this week's edition with these headlines:

${state.articles.map((a) => `- ${a.headline}`).join("\n")}

Write a brief, witty editor's note (1-2 sentences) to introduce this edition.
Write in Swedish.`,
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
