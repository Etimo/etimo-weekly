import { mkdirSync, writeFileSync } from "node:fs";
import { mockRawData } from "../mocks/mock-raw-data.js";
import { renderNewspaper } from "../templates/render.js";
import { runAgent } from "./index.js";

async function main() {
	console.log("🚀 Starting Etimo Weekly agent...\n");

	const edition = await runAgent(mockRawData);

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
