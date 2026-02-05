import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { CrosswordPuzzle } from "../crossword/index.js";

export type PersistedEdition = {
	editionNumber: number;
	editionDate: string;
	crossword?: {
		title: string;
		// Store word placements for the solution
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

export type EditionStoreData = {
	currentEditionNumber: number;
	lastEdition?: PersistedEdition;
};

const DEFAULT_STORE_PATH = "data/edition-store.json";

export class EditionStore {
	private storePath: string;
	private data: EditionStoreData;

	constructor(storePath: string = DEFAULT_STORE_PATH) {
		this.storePath = storePath;
		this.data = this.load();
	}

	private load(): EditionStoreData {
		if (existsSync(this.storePath)) {
			try {
				const content = readFileSync(this.storePath, "utf-8");
				return JSON.parse(content);
			} catch (error) {
				console.warn(`  ⚠️ Could not read edition store: ${error}`);
			}
		}
		// Default starting edition number
		return { currentEditionNumber: 1 };
	}

	private save(): void {
		const dir = dirname(this.storePath);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		writeFileSync(this.storePath, JSON.stringify(this.data, null, 2));
	}

	/**
	 * Get the next edition number and increment the counter
	 */
	getNextEditionNumber(): number {
		const next = this.data.currentEditionNumber;
		this.data.currentEditionNumber++;
		this.save();
		return next;
	}

	/**
	 * Get the current edition number without incrementing
	 */
	getCurrentEditionNumber(): number {
		return this.data.currentEditionNumber;
	}

	/**
	 * Get the last edition's data (for showing previous crossword solution)
	 */
	getLastEdition(): PersistedEdition | undefined {
		return this.data.lastEdition;
	}

	/**
	 * Save the current edition as the "last edition" for next week
	 */
	saveEdition(edition: PersistedEdition): void {
		this.data.lastEdition = edition;
		this.save();
		console.log(`  💾 Saved edition #${edition.editionNumber} to store`);
	}

	/**
	 * Convert a CrosswordPuzzle to the persisted format
	 */
	static crosswordToPersisted(puzzle: CrosswordPuzzle): PersistedEdition["crossword"] {
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
}
