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
		},
		handler: async () => {
			const validated = NewspaperEditionSchema.parse(mockEdition);
			return validated;
		},
	});
}
