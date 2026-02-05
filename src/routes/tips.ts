import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../env.js";
import type { IFileTipsService } from "../services/tips/IFileTipsService.js";
import { FileTipsService } from "../services/tips/file.js";

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
let tipsService: IFileTipsService | null = null;

export function getTipsService(): IFileTipsService {
	if (!tipsService) {
		tipsService = new FileTipsService();
	}
	return tipsService;
}

export async function tipsRoutes(app: FastifyInstance): Promise<void> {
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

			const body = request.body as { text?: string };
			if (!body.text) {
				return reply.status(400).send({ error: "Missing 'text' field" });
			}

			const tip = await service.saveTip(body.text);
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
