import { MYSTICAL_REPORTER, REPORTER_TAGLINE } from "../config.js";
import { type Article, type NewspaperEdition, getSectionLabel } from "../schemas/article.js";

function renderByline(byline: string | undefined): string {
	if (!byline) return "";
	const isMystical = byline === MYSTICAL_REPORTER;
	return `<p class="article__byline">By ${byline}${isMystical ? ` <span class="byline-tagline">${REPORTER_TAGLINE}</span>` : ""}</p>`;
}

function renderAudioPlayer(audioFile: string | undefined): string {
	if (!audioFile) return "";
	return `
		<button class="listen-btn" onclick="this.nextElementSibling.paused ? this.nextElementSibling.play() : this.nextElementSibling.pause(); this.classList.toggle('playing')">
			<span class="listen-icon">🎧</span>
			<span class="listen-text">Listen</span>
		</button>
		<audio src="${audioFile}" preload="none"></audio>
	`;
}

function renderArticle(article: Article): string {
	return `
		<article class="article article--${article.section.replace(/\s+/g, "_")}">
			<header class="article__header">
				<span class="article__section">${getSectionLabel(article.section, article.sectionLabel)}</span>
				<h2 class="article__headline">${article.headline}</h2>
				${renderByline(article.byline)}
				${renderAudioPlayer(article.audioFile)}
			</header>
			<p class="article__lead">${article.lead}</p>
			<div class="article__body">${article.body}</div>
			${article.tags ? `<footer class="article__tags">${article.tags.map((t) => `<span class="tag">#${t}</span>`).join(" ")}</footer>` : ""}
		</article>
	`;
}

export function renderNewspaper(edition: NewspaperEdition): string {
	const date = new Date(edition.editionDate).toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const headlineArticle = edition.articles.find((a) => a.section === "headline");
	const otherArticles = edition.articles.filter((a) => a.section !== "headline");

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Etimo Weekly - Edition #${edition.editionNumber}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=Inter:wght@400;500&display=swap" rel="stylesheet">
	<style>
		:root {
			--color-bg: #f5f2e8;
			--color-paper: #fffef9;
			--color-ink: #1a1a1a;
			--color-ink-light: #4a4a4a;
			--color-accent: #8b0000;
			--color-border: #2a2a2a;
		}

		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: 'Source Serif 4', Georgia, serif;
			background: var(--color-bg);
			color: var(--color-ink);
			line-height: 1.6;
		}

		.newspaper {
			max-width: 1200px;
			margin: 0 auto;
			background: var(--color-paper);
			min-height: 100vh;
			box-shadow: 0 0 50px rgba(0,0,0,0.1);
		}

		.masthead {
			text-align: center;
			padding: 2rem 1rem;
			border-bottom: 3px double var(--color-border);
		}

		.masthead__title {
			font-family: 'Playfair Display', Georgia, serif;
			font-size: clamp(3rem, 8vw, 6rem);
			font-weight: 900;
			letter-spacing: -0.02em;
			text-transform: uppercase;
		}

		.masthead__meta {
			font-family: 'Inter', sans-serif;
			font-size: 0.875rem;
			margin-top: 0.5rem;
			color: var(--color-ink-light);
			display: flex;
			justify-content: center;
			gap: 2rem;
		}

		.editor-note {
			font-style: italic;
			text-align: center;
			padding: 1rem 2rem;
			border-bottom: 1px solid var(--color-border);
			background: linear-gradient(to bottom, var(--color-paper), #f9f7f0);
		}

		.content {
			display: grid;
			grid-template-columns: repeat(12, 1fr);
			gap: 1px;
			background: var(--color-border);
			padding: 1px;
		}

		.article {
			background: var(--color-paper);
			padding: 1.5rem;
		}

		.article--headline {
			grid-column: span 12;
			text-align: center;
			border-bottom: 2px solid var(--color-border);
		}

		.article--headline .article__headline {
			font-size: clamp(2rem, 5vw, 3.5rem);
		}

		.article--weeks_wins,
		.article--slack_highlights {
			grid-column: span 6;
		}

		.article--random_facts,
		.article--gossip {
			grid-column: span 6;
		}

		@media (max-width: 768px) {
			.article--weeks_wins,
			.article--slack_highlights,
			.article--random_facts,
			.article--gossip {
				grid-column: span 12;
			}
		}

		.article__section {
			font-family: 'Inter', sans-serif;
			font-size: 0.75rem;
			font-weight: 500;
			text-transform: uppercase;
			letter-spacing: 0.1em;
			color: var(--color-accent);
		}

		.article__headline {
			font-family: 'Playfair Display', Georgia, serif;
			font-size: 1.75rem;
			font-weight: 700;
			margin: 0.5rem 0;
			line-height: 1.2;
		}

		.article__byline {
			font-family: 'Inter', sans-serif;
			font-size: 0.8rem;
			color: var(--color-ink-light);
			margin-bottom: 1rem;
		}

		.byline-tagline {
			font-style: italic;
			opacity: 0.7;
		}

		.article__lead {
			font-weight: 600;
			font-size: 1.1rem;
			margin-bottom: 1rem;
		}

		.article__body {
			text-align: justify;
			hyphens: auto;
		}

		.article__tags {
			margin-top: 1rem;
			font-family: 'Inter', sans-serif;
			font-size: 0.75rem;
		}

		.tag {
			color: var(--color-ink-light);
			margin-right: 0.5rem;
		}

		.listen-btn {
			display: inline-flex;
			align-items: center;
			gap: 0.4rem;
			padding: 0.4rem 0.8rem;
			margin-top: 0.5rem;
			font-family: 'Inter', sans-serif;
			font-size: 0.75rem;
			font-weight: 500;
			color: var(--color-ink);
			background: var(--color-bg);
			border: 1px solid var(--color-border);
			border-radius: 2rem;
			cursor: pointer;
			transition: all 0.2s ease;
		}

		.listen-btn:hover {
			background: var(--color-ink);
			color: var(--color-paper);
		}

		.listen-btn.playing {
			background: var(--color-accent);
			color: var(--color-paper);
			border-color: var(--color-accent);
		}

		.listen-btn.playing .listen-text::after {
			content: 'ing';
		}

		.listen-icon {
			font-size: 1rem;
		}

		.footer {
			text-align: center;
			padding: 2rem;
			border-top: 3px double var(--color-border);
			font-family: 'Inter', sans-serif;
			font-size: 0.875rem;
			color: var(--color-ink-light);
		}
	</style>
</head>
<body>
	<main class="newspaper">
		<header class="masthead">
			<h1 class="masthead__title">Etimo Weekly</h1>
			<div class="masthead__meta">
				<span>Edition #${edition.editionNumber}</span>
				<span>${date}</span>
				<span>Stockholm, Sweden</span>
			</div>
		</header>

		${edition.editorNote ? `<div class="editor-note">"${edition.editorNote}" — The Editor</div>` : ""}

		<div class="content">
			${headlineArticle ? renderArticle(headlineArticle) : ""}
			${otherArticles.map(renderArticle).join("")}
		</div>

		<footer class="footer">
			<p>© ${new Date().getFullYear()} Etimo Weekly — All the news that's fit to Slack</p>
		</footer>
	</main>
</body>
</html>`;
}
