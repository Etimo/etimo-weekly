import type { CrosswordPuzzle } from "../crossword/index.js";

export type PersistedEdition = {
	editionNumber: number;
	editionDate: string;
	crossword?: {
		title: string;
		words: Array<{
			word: string;
			clue: string;
			row: number;
			col: number;
			direction: "across" | "down";
			number: number;
		}>;
		gridWidth: number;
		gridHeight: number;
	};
};

export interface IEditionRepository {
	getNextEditionNumber(): number;
	getCurrentEditionNumber(): number;
	getLastEdition(): PersistedEdition | undefined;
	saveEdition(edition: PersistedEdition): void;
	getAllEditions(): PersistedEdition[];
}

export function crosswordToPersisted(puzzle: CrosswordPuzzle): PersistedEdition["crossword"] {
	return {
		title: puzzle.title,
		words: puzzle.grid.placements.map((p) => ({
			word: p.word,
			clue: p.clue,
			row: p.row,
			col: p.col,
			direction: p.direction,
			number: p.number,
		})),
		gridWidth: puzzle.grid.width,
		gridHeight: puzzle.grid.height,
	};
}
