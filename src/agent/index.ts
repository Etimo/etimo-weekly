import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { MYSTICAL_REPORTER } from "../config.js";
import { ArticleSchema, type NewspaperEdition, type SectionType } from "../schemas/article.js";
import type { RawDataInput } from "../schemas/raw-data.js";

const model = openai("gpt-4o");

const SYSTEM_PROMPT = `You are ${MYSTICAL_REPORTER}, a mysterious newspaper reporter who somehow always knows everything happening at Etimo.
You write in a fun, slightly dramatic newspaper style — think old-school tabloid mixed with genuine warmth for your colleagues.
You refer to yourself in third person occasionally and maintain an air of mystery about how you get your scoops.`;

type AgentState = {
	rawData: RawDataInput;
	articles: z.infer<typeof ArticleSchema>[];
	currentStep: "analyze" | "generate" | "review" | "done";
	editorNote?: string;
};

export async function runAgent(rawData: RawDataInput): Promise<NewspaperEdition> {
	const state: AgentState = {
		rawData,
		articles: [],
		currentStep: "analyze",
	};

	while (state.currentStep !== "done") {
		switch (state.currentStep) {
			case "analyze":
				await analyzeStep(state);
				break;
			case "generate":
				await generateStep(state);
				break;
			case "review":
				await reviewStep(state);
				break;
		}
	}

	return {
		editionNumber: generateEditionNumber(),
		editionDate: new Date().toISOString(),
		editorNote: state.editorNote,
		articles: state.articles,
	};
}

async function analyzeStep(state: AgentState): Promise<void> {
	console.log("📰 Analyzing raw data...");

	// Analyze what sections we should generate based on the raw data
	const { object: analysis } = await generateObject({
		model,
		system: SYSTEM_PROMPT,
		prompt: `Analyze these Slack messages and determine what newspaper sections we should write.

Raw data:
${JSON.stringify(state.rawData, null, 2)}

Identify the most interesting/newsworthy items and categorize them.`,
		schema: z.object({
			headline: z
				.string()
				.optional()
				.describe("The most newsworthy item that deserves the headline spot"),
			sections: z
				.array(
					z.object({
						type: z.enum(["weeks_wins", "slack_highlights", "random_facts", "gossip"]),
						sourceMessages: z.array(z.string()).describe("Which messages to use"),
						angle: z.string().describe("The angle/hook for this article"),
					}),
				)
				.describe("Other sections to generate"),
		}),
	});

	console.log("📋 Analysis complete:", analysis);

	// Store analysis in state for next step (simplified - just move on)
	state.currentStep = "generate";
}

async function generateStep(state: AgentState): Promise<void> {
	console.log("✍️ Generating articles...");

	const sections: SectionType[] = [
		"headline",
		"weeks_wins",
		"slack_highlights",
		"random_facts",
		"gossip",
	];

	for (const section of sections) {
		const { object: article } = await generateObject({
			model,
			system: SYSTEM_PROMPT,
			prompt: `Write a ${section} article based on this data:

${JSON.stringify(state.rawData, null, 2)}

Write in newspaper style. Be fun and engaging. The section is: ${section}`,
			schema: ArticleSchema.omit({ id: true, publishedAt: true }),
		});

		state.articles.push({
			...article,
			id: `art-${Date.now()}-${section}`,
			section,
			byline: MYSTICAL_REPORTER,
			publishedAt: new Date().toISOString(),
		});

		console.log(`  ✅ Generated: ${article.headline}`);
	}

	state.currentStep = "review";
}

async function reviewStep(state: AgentState): Promise<void> {
	console.log("🔍 Reviewing edition...");

	const { text: editorNote } = await generateText({
		model,
		system: SYSTEM_PROMPT,
		prompt: `You've just finished this week's edition with these headlines:

${state.articles.map((a) => `- ${a.headline}`).join("\n")}

Write a brief, witty editor's note (1-2 sentences) to introduce this edition.`,
	});

	state.editorNote = editorNote;
	state.currentStep = "done";

	console.log("✅ Edition complete!");
}

function generateEditionNumber(): number {
	// Simple edition number based on week of year
	const now = new Date();
	const start = new Date(now.getFullYear(), 0, 1);
	const diff = now.getTime() - start.getTime();
	const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
	return week + (now.getFullYear() - 2024) * 52;
}
