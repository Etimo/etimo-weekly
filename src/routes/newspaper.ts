import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { mockEdition } from "../mocks/mock-articles.js";
import { NewspaperEditionSchema } from "../schemas/article.js";

export async function newspaperRoutes(fastify: FastifyInstance): Promise<void> {
	const app = fastify.withTypeProvider<ZodTypeProvider>();

	app.get("/api/edition", {
		schema: {
			tags: ["Newspaper"],
			summary: "Get edition data",
			description: "Returns the current newspaper edition as JSON",
			response: {
				200: NewspaperEditionSchema,
			},
			openapi: {
				responses: {
					"200": {
						content: {
							"application/json": {
								example: {
									editionNumber: 42,
									editionDate: "2024-02-07T08:00:00Z",
									editorNote: "Ännu en vecka, ännu en upplaga av kaos, triumfer och mystiska badankor.",
									articles: [
										{
											id: "art-001",
											section: "headline",
											sectionLabel: "📰 Senaste Nytt",
											headline: "ETIMO LANDAR JÄTTEKUND I HISTORISK AFFÄR",
											byline: "Sansen",
											lead: "I vad branschinsiders kallar 'riktigt jäkla najs' har Etimo framgångsrikt stängt en stor kundaffär.",
											body: "Tillkännagivandet kom via Slack, som alla viktiga nyheter gör nu för tiden.",
											tags: ["affärer", "vinster"],
											publishedAt: "2024-02-07T08:00:00Z",
										},
									],
								},
							},
						},
					},
				},
			},
		},
		handler: async () => {
			const validated = NewspaperEditionSchema.parse(mockEdition);
			return validated;
		},
	});
}
