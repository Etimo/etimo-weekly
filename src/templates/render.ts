import { MYSTICAL_REPORTER, REPORTER_TAGLINE } from "../config.js";
import { type Article, type NewspaperEdition, getSectionLabel } from "../schemas/article.js";

function renderByline(byline: string | undefined): string {
	if (!byline) return "";
	const isMystical = byline === MYSTICAL_REPORTER;
	return `<p class="byline">Av ${byline}${isMystical ? ` <span class="byline-tagline">${REPORTER_TAGLINE}</span>` : ""}</p>`;
}

function renderFrontPageHeadline(article: Article): string {
	return `
		<article class="headline-article">
			<h2 class="headline-article__title">${article.headline}</h2>
			${renderByline(article.byline)}
			<p class="headline-article__lead">${article.lead}</p>
			<div class="headline-article__body">${article.body}</div>
			${article.tags?.length ? `<div class="tags">${article.tags.map((t) => `<span class="tag">#${t}</span>`).join(" ")}</div>` : ""}
		</article>
	`;
}

function renderFrontPageTeaser(article: Article): string {
	return `
		<div class="teaser">
			<span class="teaser__section">${getSectionLabel(article.section, article.sectionLabel)}</span>
			<h3 class="teaser__title">${article.headline}</h3>
			<p class="teaser__lead">${article.lead}</p>
		</div>
	`;
}

function renderArticle(article: Article): string {
	return `
		<article class="article">
			<header class="article__header">
				<span class="article__section">${getSectionLabel(article.section, article.sectionLabel)}</span>
				<h2 class="article__headline">${article.headline}</h2>
				${renderByline(article.byline)}
			</header>
			<p class="article__lead">${article.lead}</p>
			<div class="article__body">${article.body}</div>
			${article.tags?.length ? `<div class="tags">${article.tags.map((t) => `<span class="tag">#${t}</span>`).join(" ")}</div>` : ""}
		</article>
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

	// Calculate total pages: front page + interior pages (estimate ~2 articles per page)
	const totalPages = 1 + Math.max(1, Math.ceil(interiorArticles.length / 2));

	return `<!DOCTYPE html>
<html lang="sv">
<head>
	<meta charset="UTF-8">
	<title>Etimo Veckoblad - Utgåva #${edition.editionNumber}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
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

		${edition.editorNote ? `<div class="editor-note">"${edition.editorNote}" — Redaktören</div>` : ""}

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
</body>
</html>`;
}
