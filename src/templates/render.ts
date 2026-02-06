import { MYSTICAL_REPORTER, REPORTER_TAGLINE } from "../config.js";
import type { CrosswordPuzzle } from "../crossword/index.js";
import {
	type Article,
	type NewspaperEdition,
	type PreviousCrosswordSolution,
	getSectionLabel,
} from "../schemas/article.js";
import { convertEmojiShortcodes } from "../utils/emoji.js";

function renderByline(byline: string | undefined): string {
	if (!byline) return "";
	const isMystical = byline === MYSTICAL_REPORTER;
	return `<p class="byline">Av ${byline}${isMystical ? ` <span class="byline-tagline">${REPORTER_TAGLINE}</span>` : ""}</p>`;
}

function renderFrontPageHeadline(article: Article): string {
	return `
		<article class="headline-article">
			<h2 class="headline-article__title">${convertEmojiShortcodes(article.headline)}</h2>
			${renderByline(article.byline)}
			<p class="headline-article__lead">${convertEmojiShortcodes(article.lead)}</p>
			<div class="headline-article__body">${convertEmojiShortcodes(article.body)}</div>
			${article.tags?.length ? `<div class="tags">${article.tags.map((t) => `<span class="tag">#${t}</span>`).join(" ")}</div>` : ""}
		</article>
	`;
}

function renderFrontPageTeaser(article: Article): string {
	return `
		<div class="teaser">
			<span class="teaser__section">${convertEmojiShortcodes(getSectionLabel(article.section, article.sectionLabel))}</span>
			<h3 class="teaser__title">${convertEmojiShortcodes(article.headline)}</h3>
			<p class="teaser__lead">${convertEmojiShortcodes(article.lead)}</p>
		</div>
	`;
}

function renderArticle(article: Article): string {
	return `
		<article class="article">
			<header class="article__header">
				<span class="article__section">${convertEmojiShortcodes(getSectionLabel(article.section, article.sectionLabel))}</span>
				<h2 class="article__headline">${convertEmojiShortcodes(article.headline)}</h2>
				${renderByline(article.byline)}
			</header>
			<p class="article__lead">${convertEmojiShortcodes(article.lead)}</p>
			<div class="article__body">${convertEmojiShortcodes(article.body)}</div>
			${article.tags?.length ? `<div class="tags">${article.tags.map((t) => `<span class="tag">#${t}</span>`).join(" ")}</div>` : ""}
		</article>
	`;
}

function renderPreviousCrosswordSolution(solution: PreviousCrosswordSolution): string {
	// Build a grid with the solution filled in
	const cells: (string | null)[][] = Array(solution.gridHeight)
		.fill(null)
		.map(() => Array(solution.gridWidth).fill(null));

	// Fill in the words
	for (const word of solution.words) {
		for (let i = 0; i < word.word.length; i++) {
			const row = word.direction === "across" ? word.row : word.row + i;
			const col = word.direction === "across" ? word.col + i : word.col;
			cells[row][col] = word.word[i].toUpperCase();
		}
	}

	// Build grid HTML with letters filled in
	let gridHtml = '<div class="crossword-grid crossword-grid--solution">';
	for (let row = 0; row < solution.gridHeight; row++) {
		gridHtml += '<div class="crossword-row">';
		for (let col = 0; col < solution.gridWidth; col++) {
			const cell = cells[row][col];
			if (cell === null) {
				gridHtml += '<div class="crossword-cell crossword-cell--black"></div>';
			} else {
				gridHtml += `<div class="crossword-cell crossword-cell--filled"><span class="crossword-letter">${cell}</span></div>`;
			}
		}
		gridHtml += "</div>";
	}
	gridHtml += "</div>";

	return `
		<div class="crossword-solution">
			<h3 class="crossword-solution-title">Förra veckans korsord (Utgåva #${solution.editionNumber})</h3>
			${gridHtml}
		</div>
	`;
}

function renderCrossword(puzzle: CrosswordPuzzle): string {
	const { grid, acrossClues, downClues, title } = puzzle;

	// Build grid HTML with numbers
	const numberMap = new Map<string, number>();
	for (const placement of grid.placements) {
		const key = `${placement.row},${placement.col}`;
		if (!numberMap.has(key)) {
			numberMap.set(key, placement.number);
		}
	}

	let gridHtml = '<div class="crossword-grid">';
	for (let row = 0; row < grid.height; row++) {
		gridHtml += '<div class="crossword-row">';
		for (let col = 0; col < grid.width; col++) {
			const cell = grid.cells[row][col];
			const number = numberMap.get(`${row},${col}`);
			if (cell === null) {
				gridHtml += '<div class="crossword-cell crossword-cell--black"></div>';
			} else {
				gridHtml += `<div class="crossword-cell">${number ? `<span class="crossword-number">${number}</span>` : ""}</div>`;
			}
		}
		gridHtml += "</div>";
	}
	gridHtml += "</div>";

	// Build clues HTML
	const acrossHtml = acrossClues.map((c) => `<li><strong>${c.number}.</strong> ${c.clue}</li>`).join("");
	const downHtml = downClues.map((c) => `<li><strong>${c.number}.</strong> ${c.clue}</li>`).join("");

	return `
		<div class="crossword">
			<h2 class="crossword-title">🧩 ${title}</h2>
			<div class="crossword-content">
				${gridHtml}
				<div class="crossword-clues">
					<div class="crossword-clues-section">
						<h3>Vågrätt</h3>
						<ol class="crossword-clue-list">${acrossHtml}</ol>
					</div>
					<div class="crossword-clues-section">
						<h3>Lodrätt</h3>
						<ol class="crossword-clue-list">${downHtml}</ol>
					</div>
				</div>
			</div>
		</div>
	`;
}

export function renderNewspaper(edition: NewspaperEdition): string {
	const date = new Date(edition.editionDate).toLocaleDateString("sv-SE", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const headlineArticle = edition.articles.find((a) => a.section === "headline");
	const otherArticles = edition.articles.filter((a) => a.section !== "headline");

	// Take first 3 articles as front page teasers, rest go to interior pages
	const frontPageTeasers = otherArticles.slice(0, 3);
	const interiorArticles = otherArticles.slice(3);

	// Calculate total pages: front page + interior pages + crossword page (if present)
	const hasCrossword = !!edition.crossword;
	const totalPages = 1 + Math.max(1, Math.ceil(interiorArticles.length / 2)) + (hasCrossword ? 1 : 0);

	return `<!DOCTYPE html>
<html lang="sv">
<head>
	<meta charset="UTF-8">
	<title>Etimo Veckoblad - Utgåva #${edition.editionNumber}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=Inter:wght@400;500;600&family=Noto+Color+Emoji&display=swap" rel="stylesheet">
	<style>
		@page {
			size: 11in 17in;
			margin: 0.5in;
		}

		:root {
			--color-paper: #fffef9;
			--color-ink: #1a1a1a;
			--color-ink-light: #4a4a4a;
			--color-accent: #8b0000;
			--color-border: #2a2a2a;
			--column-gap: 0.3in;
		}

		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		html, body {
			font-family: 'Source Serif 4', Georgia, serif;
			font-size: 11pt;
			line-height: 1.4;
			color: var(--color-ink);
			background: var(--color-paper);
		}

		/* Emoji font fallback for proper emoji rendering */
		body {
			font-family: 'Source Serif 4', 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', Georgia, serif;
		}

		/* ===================
		   PAGE STRUCTURE
		   =================== */

		.page {
			width: 10in;
			height: 16in;
			padding: 0.25in;
			page-break-after: always;
			position: relative;
			background: var(--color-paper);
		}

		.page:last-child {
			page-break-after: auto;
		}

		.page-number {
			position: absolute;
			bottom: 0.1in;
			right: 0.25in;
			font-family: 'Inter', sans-serif;
			font-size: 9pt;
			color: var(--color-ink-light);
		}

		/* ===================
		   FRONT PAGE
		   =================== */

		.front-page {
			display: flex;
			flex-direction: column;
		}

		.masthead {
			text-align: center;
			padding: 0.2in 0 0.15in;
			border-bottom: 4pt double var(--color-border);
			margin-bottom: 0.2in;
		}

		.masthead__title {
			font-family: 'Playfair Display', Georgia, serif;
			font-size: 72pt;
			font-weight: 900;
			letter-spacing: -0.02em;
			text-transform: uppercase;
			line-height: 1;
		}

		.masthead__meta {
			font-family: 'Inter', sans-serif;
			font-size: 10pt;
			margin-top: 0.1in;
			color: var(--color-ink-light);
			display: flex;
			justify-content: center;
			gap: 0.5in;
		}

		.masthead__tagline {
			font-family: 'Playfair Display', Georgia, serif;
			font-style: italic;
			font-size: 12pt;
			margin-top: 0.05in;
			color: var(--color-ink-light);
		}

		.editor-note {
			font-style: italic;
			text-align: center;
			padding: 0.1in 0.25in;
			border-bottom: 1pt solid var(--color-border);
			margin-bottom: 0.2in;
			font-size: 11pt;
		}

		/* Front page layout: headline left, teasers right */
		.front-content {
			display: grid;
			grid-template-columns: 2fr 1fr;
			gap: 0.25in;
			flex: 1;
		}

		.headline-article {
			border-right: 1pt solid var(--color-border);
			padding-right: 0.25in;
		}

		.headline-article__title {
			font-family: 'Playfair Display', Georgia, serif;
			font-size: 36pt;
			font-weight: 900;
			line-height: 1.1;
			margin-bottom: 0.15in;
		}

		.headline-article__lead {
			font-size: 14pt;
			font-weight: 600;
			margin-bottom: 0.15in;
			line-height: 1.3;
		}

		.headline-article__body {
			column-count: 2;
			column-gap: var(--column-gap);
			text-align: justify;
			hyphens: auto;
		}

		/* Teasers sidebar */
		.teasers {
			display: flex;
			flex-direction: column;
			gap: 0.2in;
		}

		.teaser {
			padding-bottom: 0.15in;
			border-bottom: 1pt solid var(--color-border);
		}

		.teaser:last-child {
			border-bottom: none;
		}

		.teaser__section {
			font-family: 'Inter', sans-serif;
			font-size: 8pt;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--color-accent);
		}

		.teaser__title {
			font-family: 'Playfair Display', Georgia, serif;
			font-size: 16pt;
			font-weight: 700;
			line-height: 1.2;
			margin: 0.05in 0;
		}

		.teaser__lead {
			font-size: 10pt;
			color: var(--color-ink-light);
			line-height: 1.3;
		}

		/* ===================
		   INTERIOR PAGES
		   =================== */

		.interior-page {
			display: flex;
			flex-direction: column;
		}

		.page-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding-bottom: 0.1in;
			border-bottom: 2pt solid var(--color-border);
			margin-bottom: 0.2in;
		}

		.page-header__title {
			font-family: 'Playfair Display', Georgia, serif;
			font-size: 18pt;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.02em;
		}

		.page-header__date {
			font-family: 'Inter', sans-serif;
			font-size: 9pt;
			color: var(--color-ink-light);
		}

		.interior-content {
			column-count: 3;
			column-gap: var(--column-gap);
			column-rule: 1pt solid var(--color-border);
			flex: 1;
		}

		/* ===================
		   ARTICLES
		   =================== */

		.article {
			break-inside: avoid-column;
			margin-bottom: 0.25in;
		}

		.article__header {
			margin-bottom: 0.1in;
		}

		.article__section {
			font-family: 'Inter', sans-serif;
			font-size: 8pt;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--color-accent);
			display: block;
			margin-bottom: 0.05in;
		}

		.article__headline {
			font-family: 'Playfair Display', Georgia, serif;
			font-size: 18pt;
			font-weight: 700;
			line-height: 1.15;
			margin-bottom: 0.05in;
		}

		.byline {
			font-family: 'Inter', sans-serif;
			font-size: 9pt;
			color: var(--color-ink-light);
		}

		.byline-tagline {
			font-style: italic;
			opacity: 0.8;
		}

		.article__lead {
			font-weight: 600;
			font-size: 11pt;
			margin-bottom: 0.1in;
			line-height: 1.3;
		}

		.article__body {
			text-align: justify;
			hyphens: auto;
		}

		.article__body p {
			margin-bottom: 0.1in;
		}

		/* ===================
		   SHARED ELEMENTS
		   =================== */

		.tags {
			margin-top: 0.1in;
			font-family: 'Inter', sans-serif;
			font-size: 8pt;
		}

		.tag {
			color: var(--color-ink-light);
			margin-right: 0.5em;
		}

		/* ===================
		   FOOTER
		   =================== */

		.page-footer {
			position: absolute;
			bottom: 0.1in;
			left: 0.25in;
			right: 0.25in;
			display: flex;
			justify-content: space-between;
			font-family: 'Inter', sans-serif;
			font-size: 8pt;
			color: var(--color-ink-light);
			border-top: 0.5pt solid var(--color-border);
			padding-top: 0.05in;
		}

		/* ===================
		   CROSSWORD
		   =================== */

		.crossword {
			padding: 0.25in;
		}

		.crossword-title {
			font-family: 'Playfair Display', Georgia, serif;
			font-size: 28pt;
			font-weight: 700;
			text-align: center;
			margin-bottom: 0.3in;
		}

		.crossword-content {
			display: flex;
			gap: 0.5in;
			justify-content: center;
			align-items: flex-start;
		}

		.crossword-grid {
			display: flex;
			flex-direction: column;
			border: 2pt solid var(--color-border);
		}

		.crossword-row {
			display: flex;
		}

		.crossword-cell {
			width: 0.35in;
			height: 0.35in;
			border: 1pt solid var(--color-border);
			position: relative;
			background: white;
		}

		.crossword-cell--black {
			background: var(--color-ink);
		}

		.crossword-number {
			position: absolute;
			top: 1px;
			left: 2px;
			font-family: 'Inter', sans-serif;
			font-size: 7pt;
			font-weight: 600;
		}

		.crossword-clues {
			display: flex;
			gap: 0.4in;
			max-width: 4in;
		}

		.crossword-clues-section h3 {
			font-family: 'Playfair Display', Georgia, serif;
			font-size: 14pt;
			font-weight: 700;
			margin-bottom: 0.1in;
			border-bottom: 1pt solid var(--color-border);
			padding-bottom: 0.05in;
		}

		.crossword-clue-list {
			list-style: none;
			font-size: 10pt;
			line-height: 1.4;
		}

		.crossword-clue-list li {
			margin-bottom: 0.05in;
		}

		.crossword-clue-list strong {
			font-weight: 600;
		}

		/* Previous crossword solution */
		.crossword-solution {
			margin-top: 0.4in;
			padding-top: 0.2in;
			border-top: 1pt solid var(--color-border);
		}

		.crossword-solution-title {
			font-family: 'Playfair Display', Georgia, serif;
			font-size: 14pt;
			font-weight: 700;
			margin-bottom: 0.15in;
			text-align: center;
		}

		.crossword-grid--solution {
			transform: scale(0.7);
			transform-origin: center top;
			margin: 0 auto;
		}

		.crossword-cell--filled {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.crossword-letter {
			font-family: 'Inter', sans-serif;
			font-size: 12pt;
			font-weight: 600;
		}
	</style>
</head>
<body>
	<!-- FRONT PAGE -->
	<div class="page front-page">
		<header class="masthead">
			<h1 class="masthead__title">Etimo Veckoblad</h1>
			<p class="masthead__tagline">Alla nyheter som passar på Slack</p>
			<div class="masthead__meta">
				<span>Utgåva #${edition.editionNumber}</span>
				<span>${date}</span>
				<span>Stockholm, Sverige</span>
			</div>
		</header>

		${edition.editorNote ? `<div class="editor-note">"${convertEmojiShortcodes(edition.editorNote)}" — Redaktören</div>` : ""}

		<div class="front-content">
			<div class="headline-column">
				${headlineArticle ? renderFrontPageHeadline(headlineArticle) : ""}
			</div>
			<aside class="teasers">
				<h3 style="font-family: 'Inter', sans-serif; font-size: 10pt; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.15in; color: var(--color-ink-light);">I detta nummer</h3>
				${frontPageTeasers.map(renderFrontPageTeaser).join("")}
			</aside>
		</div>

		<footer class="page-footer">
			<span>© ${new Date().getFullYear()} Etimo Veckoblad</span>
			<span>Sida 1 av ${totalPages}</span>
		</footer>
	</div>

	<!-- INTERIOR PAGES -->
	${
		interiorArticles.length > 0
			? `
	<div class="page interior-page">
		<header class="page-header">
			<span class="page-header__title">Etimo Veckoblad</span>
			<span class="page-header__date">${date}</span>
		</header>

		<div class="interior-content">
			${[...frontPageTeasers, ...interiorArticles].map(renderArticle).join("")}
		</div>

		<footer class="page-footer">
			<span>© ${new Date().getFullYear()} Etimo Veckoblad</span>
			<span>Sida 2 av ${totalPages}</span>
		</footer>
	</div>
	`
			: ""
	}

	<!-- CROSSWORD PAGE -->
	${
		edition.crossword
			? `
	<div class="page interior-page">
		<header class="page-header">
			<span class="page-header__title">Etimo Veckoblad</span>
			<span class="page-header__date">${date}</span>
		</header>

		${renderCrossword(edition.crossword)}
		${edition.previousCrosswordSolution ? renderPreviousCrosswordSolution(edition.previousCrosswordSolution) : ""}

		<footer class="page-footer">
			<span>© ${new Date().getFullYear()} Etimo Veckoblad</span>
			<span>Sida ${totalPages} av ${totalPages}</span>
		</footer>
	</div>
	`
			: ""
	}
</body>
</html>`;
}
