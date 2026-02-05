import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { renderNewspaper } from "../templates/render.js";
import { runAgent } from "./index.js";

async function main() {
	const includeAudio = process.argv.includes("--include-audio");

	console.log("🚀 Starting Etimo Weekly agent...");
	if (!includeAudio) {
		console.log("   (Audio generation disabled. Use --include-audio to enable.)\n");
	} else {
		console.log("   (Audio generation enabled.)\n");
	}

	const edition = await runAgent({ includeAudio });

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

	const html = renderNewspaper(edition);
	writeFileSync(`${outDir}/index.html`, html);

	console.log(`\n✅ Saved to ${outDir}/index.html`);
}

main().catch(console.error);
