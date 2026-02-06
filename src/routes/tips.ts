import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { env } from "../env.js";
import { FileTipsRepository } from "../repositories/FileTipsRepository.js";
import type { ITipsRepository } from "../repositories/ITipsRepository.js";

const TipSchema = z.object({
	id: z.string(),
	text: z.string(),
	receivedAt: z.string(),
});

const SubmitTipBodySchema = z.object({
	text: z.string().describe("The anonymous tip text"),
});

const SubmitTipResponseSchema = z.object({
	ok: z.boolean(),
	tip: TipSchema,
});

const GetTipsResponseSchema = z.object({
	tips: z.array(TipSchema),
});

const ErrorResponseSchema = z.object({
	error: z.string(),
});

// Singleton instance
let tipsService: ITipsRepository | null = null;

export function getTipsService(): ITipsRepository {
	if (!tipsService) {
		tipsService = new FileTipsRepository();
	}
	return tipsService;
}

export async function tipsRoutes(fastify: FastifyInstance): Promise<void> {
	const app = fastify.withTypeProvider<ZodTypeProvider>();
	const service = getTipsService();

	// Test endpoint for local development (simulates a tip submission)
	app.post("/test/tip", {
		schema: {
			tags: ["Tips"],
			summary: "Submit a test tip",
			description: "Submit an anonymous tip for testing (dev only)",
			body: SubmitTipBodySchema,
			response: {
				200: SubmitTipResponseSchema,
				400: ErrorResponseSchema,
				404: ErrorResponseSchema,
			},
		},
		handler: async (request, reply) => {
			if (env.NODE_ENV === "production") {
				return reply.status(404).send({ error: "Not found" });
			}

			const tip = await service.saveTip(request.body.text);
			return { ok: true, tip };
		},
	});

	// Get all pending tips (for debugging)
	app.get("/test/tips", {
		schema: {
			tags: ["Tips"],
			summary: "Get all pending tips",
			description: "View all anonymous tips waiting to be published (dev only)",
			response: {
				200: GetTipsResponseSchema,
				404: ErrorResponseSchema,
			},
		},
		handler: async (_request, reply) => {
			if (env.NODE_ENV === "production") {
				return reply.status(404).send({ error: "Not found" });
			}

			const tips = await service.getTips();
			return { tips };
		},
	});
}
