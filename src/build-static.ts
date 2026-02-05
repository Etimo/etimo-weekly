import { mkdirSync, writeFileSync } from "node:fs";
import { mockEdition } from "./mocks/mock-articles.js";
import { NewspaperEditionSchema } from "./schemas/article.js";
import { renderNewspaper } from "./templates/render.js";

const outDir = "dist/static";

mkdirSync(outDir, { recursive: true });

const validated = NewspaperEditionSchema.parse(mockEdition);
const html = renderNewspaper(validated);

writeFileSync(`${outDir}/index.html`, html);

console.log(`✅ Built static site to ${outDir}/index.html`);
