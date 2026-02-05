import { z } from "zod";

export type WordPlacement = {
	word: string;
	clue: string;
	row: number;
	col: number;
	direction: "across" | "down";
	number: number;
};

export type CrosswordGrid = {
	width: number;
	height: number;
	cells: (string | null)[][]; // null = black cell, string = letter
	placements: WordPlacement[];
};

export type CrosswordPuzzle = {
	grid: CrosswordGrid;
	acrossClues: { number: number; clue: string }[];
	downClues: { number: number; clue: string }[];
	title: string;
};

// Schema for LLM-generated crossword content
export const CrosswordContentSchema = z.object({
	words: z
		.array(
			z.object({
				word: z
					.string()
					.describe("A word (3-10 letters, Swedish, no spaces or special characters)"),
				clue: z.string().describe("A simple, fun clue for the word in Swedish"),
			}),
		)
		.describe("6-8 words based on this week's happenings at Etimo"),
});

export type CrosswordContent = z.infer<typeof CrosswordContentSchema>;
