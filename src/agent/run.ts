import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { generatePdf } from "../pdf.js";
import { FileTipsRepository } from "../repositories/FileTipsRepository.js";
import { LLMServiceFactory } from "../services/llm/LLMServiceFactory.js";
import { SlackServiceFactory } from "../services/slack/SlackServiceFactory.js";
import { TTSServiceFactory } from "../services/tts/TTSServiceFactory.js";
import { renderNewspaper } from "../templates/render.js";
import { setCustomEmojis } from "../utils/emoji.js";
import { runAgent } from "./index.js";

async function main() {
	const includeAudio = process.argv.includes("--include-audio");
	const includeHtml = process.argv.includes("--include-html");

	console.log("🚀 Starting Etimo Weekly agent...");
	if (!includeAudio) {
		console.log("   (Audio generation disabled. Use --include-audio to enable.)");
	} else {
		console.log("   (Audio generation enabled.)");
	}
	console.log("");

	// Instantiate services using factories
	console.log("🔧 Initializing services...");
	const slack = SlackServiceFactory.create();
	const llm = LLMServiceFactory.create();
	const tts = TTSServiceFactory.create();
	const tips = new FileTipsRepository();

	// Fetch custom emojis before running the agent (for rendering)
	console.log("🎨 Fetching custom emojis...");
	const customEmojis = await slack.getCustomEmojis();
	setCustomEmojis(customEmojis);

	const edition = await runAgent({ slack, llm, tts, tips }, { includeAudio });

	if (!edition) {
		console.log("\n🛑 No edition generated. Exiting.");
		process.exit(1);
	}

	console.log("\n📰 Generated edition:", edition.editionNumber);
	console.log("📝 Editor's note:", edition.editorNote);
	console.log("📄 Articles:", edition.articles.length);

	// Output to file
	const outDir = "dist/generated";
	mkdirSync(outDir, { recursive: true });

	const pdfFilename = `etimo-veckoblad-${edition.editionNumber}.pdf`;
	await generatePdf(edition, `${outDir}/${pdfFilename}`);

	// Optionally save HTML for debugging
	if (includeHtml) {
		const html = renderNewspaper(edition);
		const htmlFilename = `etimo-veckoblad-${edition.editionNumber}.html`;
		writeFileSync(`${outDir}/${htmlFilename}`, html);
		writeFileSync(`${outDir}/index.html`, html);
		console.log(`✅ Saved HTML to ${outDir}/${htmlFilename} (and index.html)`);
	}
}

main().catch(console.error);
