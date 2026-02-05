import { mkdirSync } from "node:fs";
import { mockEdition } from "./mocks/mock-articles.js";
import { generatePdf } from "./pdf.js";
import { NewspaperEditionSchema } from "./schemas/article.js";

const outDir = "dist/static";

mkdirSync(outDir, { recursive: true });

const validated = NewspaperEditionSchema.parse(mockEdition);
const filename = `etimo-veckoblad-${validated.editionNumber}.pdf`;

await generatePdf(validated, `${outDir}/${filename}`);
