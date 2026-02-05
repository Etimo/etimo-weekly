import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { mockEdition } from "../mocks/mock-articles.js";
import { NewspaperEditionSchema } from "../schemas/article.js";
import { renderNewspaper } from "../templates/render.js";

export async function newspaperRoutes(app: FastifyInstance): Promise<void> {
	app.get("/", {
		schema: {
			tags: ["Newspaper"],
			summary: "View newspaper",
			description: "Returns the newspaper as rendered HTML",
			response: {
				200: z.string().describe("HTML content"),
			},
		},
		handler: async (_request, reply) => {
			const validated = NewspaperEditionSchema.parse(mockEdition);
			const html = renderNewspaper(validated);
			return reply.type("text/html").send(html);
		},
	});

	app.get("/api/edition", {
		schema: {
			tags: ["Newspaper"],
			summary: "Get edition data",
			description: "Returns the current newspaper edition as JSON",
			response: {
				200: NewspaperEditionSchema,
			},
		},
		handler: async () => {
			const validated = NewspaperEditionSchema.parse(mockEdition);
			return validated;
		},
	});
}
