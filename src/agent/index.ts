import { openai } from "@ai-sdk/openai";
import { Output, generateText, stepCountIs } from "ai";
import { z } from "zod";
import { MYSTICAL_REPORTER } from "../config.js";
import {
	type NewspaperEdition,
	type SectionType,
	SectionType as SectionTypeEnum,
} from "../schemas/article.js";
import { slackTools } from "./tools.js";

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

type AgentState = {
	slackData: SlackData;
	articles: Array<{
		id: string;
		section: SectionType;
		headline: string;
		byline: string;
		lead: string;
		body: string;
		tags: string[];
		publishedAt: string;
	}>;
	currentStep: "gather" | "analyze" | "generate" | "review" | "done";
	editorNote?: string;
};

const MIN_MESSAGES_REQUIRED = 3;

export async function runAgent(): Promise<NewspaperEdition | null> {
	console.log("🔧 Initializing agent...");

	const state: AgentState = {
		slackData: { channels: [], messages: [], users: new Map() },
		articles: [],
		currentStep: "gather",
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
	state.currentStep = "analyze";
}

const AnalysisSchema = z.object({
	headline: z.string().describe("The most newsworthy item that deserves the headline spot"),
	sections: z
		.array(
			z.object({
				type: z.enum(["weeks_wins", "slack_highlights", "random_facts", "gossip"]),
				sourceMessages: z.array(z.string()).describe("Key quotes/content to use"),
				angle: z.string().describe("The angle/hook for this article"),
			}),
		)
		.describe("Other sections to generate"),
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

Identify the most interesting/newsworthy items and categorize them into sections.`,
		output: Output.object({ schema: AnalysisSchema }),
	});

	console.log("  📋 Analysis complete:", analysis?.headline);
	state.currentStep = "generate";
}

// Schema for LLM output - all fields required (OpenAI strict mode requirement)
const ArticleGenerationSchema = z.object({
	section: SectionTypeEnum.describe("The section this article belongs to"),
	headline: z.string().describe("Catchy newspaper-style headline"),
	lead: z.string().describe("Opening paragraph that hooks the reader"),
	body: z.string().describe("Main article content"),
	tags: z.array(z.string()).describe("Relevant tags for the article"),
});

async function generateArticlesStep(state: AgentState): Promise<void> {
	console.log("✍️ Generating articles...");

	const sections: SectionType[] = [
		"headline",
		"weeks_wins",
		"slack_highlights",
		"random_facts",
		"gossip",
	];

	for (const section of sections) {
		console.log(`  📝 Generating ${section} article...`);
		try {
			const { output: article } = await generateText({
				model,
				system: SYSTEM_PROMPT,
				prompt: `Write a ${section} article based on this Slack data:

${JSON.stringify(state.slackData.messages, null, 2)}

Write in newspaper style. Be fun and engaging. The section is: ${section}
Make sure to reference real messages and people from the data (or make up plausible content if no data).`,
				output: Output.object({ schema: ArticleGenerationSchema }),
			});

			if (article) {
				state.articles.push({
					...article,
					id: `art-${Date.now()}-${section}`,
					section,
					byline: MYSTICAL_REPORTER,
					publishedAt: new Date().toISOString(),
				});
				console.log(`  ✅ Generated: ${article.headline}`);
			}
		} catch (error) {
			console.error(`  ❌ Failed to generate ${section}:`, error);
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
