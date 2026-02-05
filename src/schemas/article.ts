import { z } from "zod";

export const SectionType = z.enum([
	"headline",
	"weeks_wins",
	"slack_highlights",
	"random_facts",
	"gossip",
]);

export type SectionType = z.infer<typeof SectionType>;

export const ArticleSchema = z.object({
	id: z.string(),
	section: SectionType,
	headline: z.string().describe("Catchy newspaper-style headline"),
	byline: z.string().optional().describe("Author or source attribution"),
	lead: z.string().describe("Opening paragraph that hooks the reader"),
	body: z.string().describe("Main article content"),
	tags: z.array(z.string()).optional(),
	publishedAt: z.string().datetime(),
	audioFile: z.string().optional().describe("Filename of the audio version"),
});

export type Article = z.infer<typeof ArticleSchema>;

export const NewspaperEditionSchema = z.object({
	editionNumber: z.number(),
	editionDate: z.string().datetime(),
	editorNote: z.string().optional().describe("A fun editor's note for the edition"),
	articles: z.array(ArticleSchema),
});

export type NewspaperEdition = z.infer<typeof NewspaperEditionSchema>;

export const sectionLabels: Record<SectionType, string> = {
	headline: "📰 Breaking News",
	weeks_wins: "🏆 This Week's Wins",
	slack_highlights: "💬 Slack Highlights",
	random_facts: "🎲 Random Fun Facts",
	gossip: "👀 Office Gossip",
};
