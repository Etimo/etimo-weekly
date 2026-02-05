import { z } from "zod";
import type { CrosswordPuzzle } from "../crossword/index.js";

// Dynamic sections - generated based on content
// Only "gossip" is a recurring staple
export const SectionType = z
	.string()
	.describe("Section identifier (e.g., 'headline', 'kudos', 'launches', 'gossip')");

export type SectionType = z.infer<typeof SectionType>;

export const ArticleSchema = z.object({
	id: z.string(),
	section: SectionType,
	sectionLabel: z
		.string()
		.optional()
		.describe("Display label for the section (e.g., '🚀 Product Launches')"),
	headline: z.string().describe("Catchy newspaper-style headline"),
	byline: z.string().optional().describe("Author or source attribution"),
	lead: z.string().describe("Opening paragraph that hooks the reader"),
	body: z.string().describe("Main article content"),
	tags: z.array(z.string()).optional(),
	publishedAt: z.string().datetime(),
	audioFile: z.string().optional().describe("Filename of the audio version"),
});

export type Article = z.infer<typeof ArticleSchema>;

export type PreviousCrosswordSolution = {
	editionNumber: number;
	title: string;
	words: Array<{
		word: string;
		row: number;
		col: number;
		direction: "across" | "down";
		number: number;
	}>;
	gridWidth: number;
	gridHeight: number;
};

export const NewspaperEditionSchema = z.object({
	editionNumber: z.number(),
	editionDate: z.string().datetime(),
	editorNote: z.string().optional().describe("A fun editor's note for the edition"),
	articles: z.array(ArticleSchema),
	crossword: z.custom<CrosswordPuzzle>().optional().describe("Weekly crossword puzzle"),
	previousCrosswordSolution: z
		.custom<PreviousCrosswordSolution>()
		.optional()
		.describe("Last week's crossword solution"),
});

export type NewspaperEdition = z.infer<typeof NewspaperEditionSchema>;

// Generate a display label for any section
export function getSectionLabel(section: string, label?: string): string {
	if (label) return label;

	// Default labels for known sections
	const defaults: Record<string, string> = {
		headline: "📰 Senaste Nytt",
		gossip: "👀 Kontorsskvaller",
	};

	return (
		defaults[section] ?? `📌 ${section.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`
	);
}
