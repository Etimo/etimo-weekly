import express from "express";
import { mockEdition } from "./mocks/mock-articles.js";
import { NewspaperEditionSchema } from "./schemas/article.js";
import { renderNewspaper } from "./templates/render.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (_req, res) => {
	const validated = NewspaperEditionSchema.parse(mockEdition);
	const html = renderNewspaper(validated);
	res.type("html").send(html);
});

app.get("/api/edition", (_req, res) => {
	const validated = NewspaperEditionSchema.parse(mockEdition);
	res.json(validated);
});

app.listen(PORT, () => {
	console.log(`📰 Etimo Weekly is running at http://localhost:${PORT}`);
});
