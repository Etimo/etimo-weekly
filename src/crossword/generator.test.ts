import { describe, it, expect } from "vitest";
import { generateCrosswordGrid, createPuzzle } from "./generator.js";

describe("generateCrosswordGrid", () => {
	it("should return null for empty word list", () => {
		const result = generateCrosswordGrid([]);
		expect(result).toBeNull();
	});

	it("should place a single word", () => {
		const words = [{ word: "ETIMO", clue: "Vårt företag" }];
		const grid = generateCrosswordGrid(words);

		expect(grid).not.toBeNull();
		expect(grid!.placements).toHaveLength(1);
		expect(grid!.placements[0].word).toBe("ETIMO");
		expect(grid!.placements[0].direction).toBe("across");
	});

	it("should create interlocking words when possible", () => {
		const words = [
			{ word: "ETIMO", clue: "Vårt företag" },
			{ word: "TEAM", clue: "En grupp" },
		];
		const grid = generateCrosswordGrid(words);

		expect(grid).not.toBeNull();
		// Both words share letter 'E' or 'T', so they should interlock
		expect(grid!.placements.length).toBeGreaterThanOrEqual(1);
	});

	it("should place multiple intersecting words", () => {
		const words = [
			{ word: "KORSORD", clue: "Veckans pussel" },
			{ word: "SLACK", clue: "Kommunikationsverktyg" },
			{ word: "KOD", clue: "Det vi skriver" },
		];
		const grid = generateCrosswordGrid(words);

		expect(grid).not.toBeNull();
		expect(grid!.placements.length).toBeGreaterThanOrEqual(2);
	});

	it("should assign correct numbers to placements", () => {
		const words = [
			{ word: "ABC", clue: "Clue 1" },
			{ word: "CAT", clue: "Clue 2" },
		];
		const grid = generateCrosswordGrid(words);

		expect(grid).not.toBeNull();
		// Numbers should be positive integers
		for (const placement of grid!.placements) {
			expect(placement.number).toBeGreaterThan(0);
		}
	});

	it("should have valid grid dimensions", () => {
		const words = [
			{ word: "HELLO", clue: "Greeting" },
			{ word: "WORLD", clue: "Planet" },
		];
		const grid = generateCrosswordGrid(words);

		expect(grid).not.toBeNull();
		expect(grid!.width).toBeGreaterThan(0);
		expect(grid!.height).toBeGreaterThan(0);
		expect(grid!.cells.length).toBe(grid!.height);
		expect(grid!.cells[0].length).toBe(grid!.width);
	});

	it("should place letters correctly in grid cells", () => {
		const words = [{ word: "TEST", clue: "A test word" }];
		const grid = generateCrosswordGrid(words);

		expect(grid).not.toBeNull();
		const placement = grid!.placements[0];

		// Check that the word is in the grid
		for (let i = 0; i < placement.word.length; i++) {
			const row = placement.direction === "across" ? placement.row : placement.row + i;
			const col = placement.direction === "across" ? placement.col + i : placement.col;
			expect(grid!.cells[row][col]).toBe(placement.word[i].toUpperCase());
		}
	});

	it("should handle Swedish characters", () => {
		const words = [
			{ word: "ÄPPLE", clue: "En frukt" },
			{ word: "ÖL", clue: "En dryck" },
		];
		const grid = generateCrosswordGrid(words);

		expect(grid).not.toBeNull();
		expect(grid!.placements.length).toBeGreaterThanOrEqual(1);
	});

	it("should not place words that exceed grid bounds", () => {
		const words = [{ word: "VERYLONGWORD", clue: "A very long word" }];
		const maxSize = 8; // Smaller than word length
		const grid = generateCrosswordGrid(words, maxSize);

		// Word is longer than max size, so grid should be null
		// since the first word can't be placed
		expect(grid).toBeNull();
	});
});

describe("createPuzzle", () => {
	it("should create a puzzle with organized clues", () => {
		const words = [
			{ word: "ACROSS", clue: "Horizontal" },
			{ word: "DOWN", clue: "Vertical" },
		];
		const grid = generateCrosswordGrid(words);

		expect(grid).not.toBeNull();

		const puzzle = createPuzzle(grid!, "Test Puzzle");

		expect(puzzle.title).toBe("Test Puzzle");
		expect(puzzle.grid).toBe(grid);
		expect(Array.isArray(puzzle.acrossClues)).toBe(true);
		expect(Array.isArray(puzzle.downClues)).toBe(true);
	});

	it("should separate across and down clues correctly", () => {
		const words = [
			{ word: "FIRST", clue: "Clue 1" },
			{ word: "SECOND", clue: "Clue 2" },
			{ word: "THIRD", clue: "Clue 3" },
		];
		const grid = generateCrosswordGrid(words);

		expect(grid).not.toBeNull();

		const puzzle = createPuzzle(grid!, "Test");

		// Total clues should match placed words
		const totalClues = puzzle.acrossClues.length + puzzle.downClues.length;
		expect(totalClues).toBe(grid!.placements.length);

		// Each clue should have a number and clue text
		for (const clue of [...puzzle.acrossClues, ...puzzle.downClues]) {
			expect(clue.number).toBeGreaterThan(0);
			expect(clue.clue).toBeTruthy();
		}
	});

	it("should sort clues by number", () => {
		const words = [
			{ word: "ALPHA", clue: "First" },
			{ word: "BETA", clue: "Second" },
			{ word: "GAMMA", clue: "Third" },
		];
		const grid = generateCrosswordGrid(words);

		expect(grid).not.toBeNull();

		const puzzle = createPuzzle(grid!, "Test");

		// Verify across clues are sorted
		for (let i = 1; i < puzzle.acrossClues.length; i++) {
			expect(puzzle.acrossClues[i].number).toBeGreaterThanOrEqual(puzzle.acrossClues[i - 1].number);
		}

		// Verify down clues are sorted
		for (let i = 1; i < puzzle.downClues.length; i++) {
			expect(puzzle.downClues[i].number).toBeGreaterThanOrEqual(puzzle.downClues[i - 1].number);
		}
	});
});
