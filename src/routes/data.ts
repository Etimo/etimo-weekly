import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { FileEditionRepository } from "../repositories/FileEditionRepository.js";
import { FileTipsRepository } from "../repositories/FileTipsRepository.js";

const TipSchema = z.object({
	id: z.string(),
	text: z.string(),
	receivedAt: z.string(),
});

const CrosswordWordSchema = z.object({
	word: z.string(),
	clue: z.string(),
	row: z.number(),
	col: z.number(),
	direction: z.enum(["across", "down"]),
	number: z.number(),
});

const PersistedEditionSchema = z.object({
	editionNumber: z.number(),
	editionDate: z.string(),
	crossword: z
		.object({
			title: z.string(),
			words: z.array(CrosswordWordSchema),
			gridWidth: z.number(),
			gridHeight: z.number(),
		})
		.optional(),
});

const EditionStoreResponseSchema = z.object({
	currentEditionNumber: z.number(),
	lastEdition: PersistedEditionSchema.optional(),
	editions: z.array(PersistedEditionSchema),
});

const TipsResponseSchema = z.object({
	tips: z.array(TipSchema),
});

export async function dataRoutes(fastify: FastifyInstance): Promise<void> {
	const app = fastify.withTypeProvider<ZodTypeProvider>();
	const tipsRepo = new FileTipsRepository();
	const editionRepo = new FileEditionRepository();

	app.get("/api/tips", {
		schema: {
			tags: ["Data"],
			summary: "View stored tips",
			description: "Returns all anonymous tips currently stored in tips.json",
			response: {
				200: TipsResponseSchema,
			},
		},
		handler: async () => {
			const tips = await tipsRepo.getTips();
			return { tips };
		},
	});

	app.get("/api/editions", {
		schema: {
			tags: ["Data"],
			summary: "View edition store",
			description: "Returns the full contents of edition-store.json",
			response: {
				200: EditionStoreResponseSchema,
			},
		},
		handler: async () => {
			return {
				currentEditionNumber: editionRepo.getCurrentEditionNumber(),
				lastEdition: editionRepo.getLastEdition(),
				editions: editionRepo.getAllEditions(),
			};
		},
	});
}
