import type { CrosswordGrid, CrosswordPuzzle, WordPlacement } from "./types.js";

type WordWithClue = {
	word: string;
	clue: string;
};

type PlacementCandidate = {
	word: string;
	clue: string;
	row: number;
	col: number;
	direction: "down" | "across";
	intersections: number;
};

/**
 * Generates an interlocking crossword grid from a list of words with clues.
 * Uses a greedy algorithm to maximize intersections.
 */
export function generateCrosswordGrid(
	wordsWithClues: WordWithClue[],
	maxGridSize = 15,
): CrosswordGrid | null {
	// Sort words by length (longer words first - easier to build around)
	const sortedWords = [...wordsWithClues].sort((a, b) => b.word.length - a.word.length);

	if (sortedWords.length === 0) return null;

	// Initialize empty grid
	const cells: (string | null)[][] = Array(maxGridSize)
		.fill(null)
		.map(() => Array(maxGridSize).fill(null));

	const placements: WordPlacement[] = [];
	let wordNumber = 1;

	// Place first word horizontally in the middle
	const firstWord = sortedWords[0];

	// Check if first word fits in grid
	if (firstWord.word.length > maxGridSize) {
		return null;
	}

	const startRow = Math.floor(maxGridSize / 2);
	const startCol = Math.floor((maxGridSize - firstWord.word.length) / 2);

	placeWord(cells, firstWord.word, startRow, startCol, "across");
	placements.push({
		word: firstWord.word,
		clue: firstWord.clue,
		row: startRow,
		col: startCol,
		direction: "across",
		number: wordNumber++,
	});

	// Try to place remaining words
	for (let i = 1; i < sortedWords.length; i++) {
		const wordData = sortedWords[i];
		const candidate = findBestPlacement(cells, wordData, placements, maxGridSize);

		if (candidate) {
			placeWord(cells, candidate.word, candidate.row, candidate.col, candidate.direction);
			placements.push({
				word: candidate.word,
				clue: candidate.clue,
				row: candidate.row,
				col: candidate.col,
				direction: candidate.direction,
				number: wordNumber++,
			});
		}
	}

	// Trim grid to actual content
	const { trimmedCells, offsetRow, offsetCol, width, height } = trimGrid(cells);

	// Adjust placements for trimmed grid
	const adjustedPlacements = placements.map((p) => ({
		...p,
		row: p.row - offsetRow,
		col: p.col - offsetCol,
	}));

	// Renumber based on position (top-to-bottom, left-to-right)
	const renumbered = renumberPlacements(adjustedPlacements);

	return {
		width,
		height,
		cells: trimmedCells,
		placements: renumbered,
	};
}

function placeWord(
	cells: (string | null)[][],
	word: string,
	row: number,
	col: number,
	direction: "across" | "down",
): void {
	for (let i = 0; i < word.length; i++) {
		if (direction === "across") {
			cells[row][col + i] = word[i].toUpperCase();
		} else {
			cells[row + i][col] = word[i].toUpperCase();
		}
	}
}

function findBestPlacement(
	cells: (string | null)[][],
	wordData: WordWithClue,
	existingPlacements: WordPlacement[],
	maxGridSize: number,
): PlacementCandidate | null {
	const word = wordData.word.toUpperCase();
	const candidates: PlacementCandidate[] = [];

	// Try to intersect with existing words
	for (const placement of existingPlacements) {
		const existingWord = placement.word.toUpperCase();
		const oppositeDir = placement.direction === "across" ? "down" : "across";

		// Find common letters
		for (let i = 0; i < word.length; i++) {
			for (let j = 0; j < existingWord.length; j++) {
				if (word[i] === existingWord[j]) {
					// Calculate position for intersection
					let row: number;
					let col: number;

					if (placement.direction === "across") {
						// Existing word is across, new word goes down
						col = placement.col + j;
						row = placement.row - i;
					} else {
						// Existing word is down, new word goes across
						row = placement.row + j;
						col = placement.col - i;
					}

					// Check if placement is valid
					if (isValidPlacement(cells, word, row, col, oppositeDir, maxGridSize)) {
						const intersections = countIntersections(cells, word, row, col, oppositeDir);
						candidates.push({
							word: wordData.word,
							clue: wordData.clue,
							row,
							col,
							direction: oppositeDir,
							intersections,
						});
					}
				}
			}
		}
	}

	// Return candidate with most intersections
	if (candidates.length === 0) return null;
	candidates.sort((a, b) => b.intersections - a.intersections);
	return candidates[0];
}

function isValidPlacement(
	cells: (string | null)[][],
	word: string,
	row: number,
	col: number,
	direction: "across" | "down",
	maxGridSize: number,
): boolean {
	const upperWord = word.toUpperCase();

	// Check bounds
	if (row < 0 || col < 0) return false;
	if (direction === "across" && col + word.length > maxGridSize) return false;
	if (direction === "down" && row + word.length > maxGridSize) return false;

	// Check each cell
	for (let i = 0; i < upperWord.length; i++) {
		const r = direction === "across" ? row : row + i;
		const c = direction === "across" ? col + i : col;

		const existing = cells[r][c];

		if (existing !== null && existing !== upperWord[i]) {
			return false; // Conflict with existing letter
		}

		// Check adjacent cells (no parallel words touching)
		if (existing === null) {
			if (direction === "across") {
				// Check above and below
				if (r > 0 && cells[r - 1][c] !== null) return false;
				if (r < maxGridSize - 1 && cells[r + 1][c] !== null) return false;
			} else {
				// Check left and right
				if (c > 0 && cells[r][c - 1] !== null) return false;
				if (c < maxGridSize - 1 && cells[r][c + 1] !== null) return false;
			}
		}
	}

	// Check cell before word start
	if (direction === "across" && col > 0 && cells[row][col - 1] !== null) return false;
	if (direction === "down" && row > 0 && cells[row - 1][col] !== null) return false;

	// Check cell after word end
	if (
		direction === "across" &&
		col + word.length < maxGridSize &&
		cells[row][col + word.length] !== null
	)
		return false;
	if (
		direction === "down" &&
		row + word.length < maxGridSize &&
		cells[row + word.length][col] !== null
	)
		return false;

	return true;
}

function countIntersections(
	cells: (string | null)[][],
	word: string,
	row: number,
	col: number,
	direction: "across" | "down",
): number {
	const upperWord = word.toUpperCase();
	let count = 0;

	for (let i = 0; i < upperWord.length; i++) {
		const r = direction === "across" ? row : row + i;
		const c = direction === "across" ? col + i : col;

		if (cells[r][c] === upperWord[i]) {
			count++;
		}
	}

	return count;
}

function trimGrid(cells: (string | null)[][]): {
	trimmedCells: (string | null)[][];
	offsetRow: number;
	offsetCol: number;
	width: number;
	height: number;
} {
	let minRow = cells.length;
	let maxRow = 0;
	let minCol = cells[0].length;
	let maxCol = 0;

	for (let r = 0; r < cells.length; r++) {
		for (let c = 0; c < cells[r].length; c++) {
			if (cells[r][c] !== null) {
				minRow = Math.min(minRow, r);
				maxRow = Math.max(maxRow, r);
				minCol = Math.min(minCol, c);
				maxCol = Math.max(maxCol, c);
			}
		}
	}

	const height = maxRow - minRow + 1;
	const width = maxCol - minCol + 1;

	const trimmedCells: (string | null)[][] = [];
	for (let r = minRow; r <= maxRow; r++) {
		trimmedCells.push(cells[r].slice(minCol, maxCol + 1));
	}

	return { trimmedCells, offsetRow: minRow, offsetCol: minCol, width, height };
}

function renumberPlacements(placements: WordPlacement[]): WordPlacement[] {
	// Sort by position (top-to-bottom, left-to-right)
	const sorted = [...placements].sort((a, b) => {
		if (a.row !== b.row) return a.row - b.row;
		return a.col - b.col;
	});

	// Group by starting position
	const positionMap = new Map<string, number>();
	let currentNumber = 1;

	return sorted.map((p) => {
		const posKey = `${p.row},${p.col}`;
		if (!positionMap.has(posKey)) {
			positionMap.set(posKey, currentNumber++);
		}
		return { ...p, number: positionMap.get(posKey) ?? 0 };
	});
}

/**
 * Converts a CrosswordGrid to a full CrosswordPuzzle with organized clues
 */
export function createPuzzle(grid: CrosswordGrid, title: string): CrosswordPuzzle {
	const acrossClues = grid.placements
		.filter((p) => p.direction === "across")
		.sort((a, b) => a.number - b.number)
		.map((p) => ({ number: p.number, clue: p.clue }));

	const downClues = grid.placements
		.filter((p) => p.direction === "down")
		.sort((a, b) => a.number - b.number)
		.map((p) => ({ number: p.number, clue: p.clue }));

	return {
		grid,
		acrossClues,
		downClues,
		title,
	};
}
