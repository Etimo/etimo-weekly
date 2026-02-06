import { mkdirSync, unlinkSync } from "node:fs";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { runAgent } from "../agent/index.js";
import { env } from "../env.js";
import { generatePdf } from "../pdf.js";
import { FileTipsRepository } from "../repositories/FileTipsRepository.js";
import { jobStore } from "../services/job-store.js";
import { LLMServiceFactory } from "../services/llm/LLMServiceFactory.js";
import { SlackServiceFactory } from "../services/slack/SlackServiceFactory.js";
import { TTSServiceFactory } from "../services/tts/TTSServiceFactory.js";
import { setCustomEmojis } from "../utils/emoji.js";

const GenerateBodySchema = z.object({
	includeAudio: z.boolean().optional().default(false),
	publishToSlack: z.boolean().optional().default(true),
});

const JobStatusSchema = z.object({
	id: z.string(),
	status: z.enum(["pending", "running", "completed", "failed"]),
	createdAt: z.string(),
	startedAt: z.string().optional(),
	completedAt: z.string().optional(),
	options: z.object({
		includeAudio: z.boolean(),
		publishToSlack: z.boolean(),
	}),
	result: z
		.object({
			editionNumber: z.number(),
			articleCount: z.number(),
			pdfFilename: z.string(),
			publishedToSlack: z.boolean(),
		})
		.optional(),
	error: z.string().optional(),
});

const JobParamsSchema = z.object({
	jobId: z.string(),
});

async function runGenerationJob(jobId: string): Promise<void> {
	jobStore.markRunning(jobId);
	const job = jobStore.get(jobId);
	if (!job) return;

	try {
		const slack = SlackServiceFactory.create();
		const llm = LLMServiceFactory.create();
		const tts = TTSServiceFactory.create();
		const tips = new FileTipsRepository();

		const customEmojis = await slack.getCustomEmojis();
		setCustomEmojis(customEmojis);

		const outputDir = "/tmp/etimo-weekly-gen";
		const edition = await runAgent(
			{ slack, llm, tts, tips },
			{ outputDir, includeAudio: job.options.includeAudio },
		);

		if (!edition) {
			jobStore.markFailed(jobId, "No edition generated (insufficient data)");
			return;
		}

		mkdirSync(outputDir, { recursive: true });
		const pdfFilename = `etimo-veckoblad-${edition.editionNumber}.pdf`;
		const pdfPath = `${outputDir}/${pdfFilename}`;
		await generatePdf(edition, pdfPath);

		let publishedToSlack = false;
		if (job.options.publishToSlack && !env.SLACK_PUBLISH_CHANNEL) {
			console.warn("publishToSlack is enabled but SLACK_PUBLISH_CHANNEL is not set, skipping upload");
		}
		if (job.options.publishToSlack && env.SLACK_PUBLISH_CHANNEL) {
			const result = await slack.uploadFile({
				channelId: env.SLACK_PUBLISH_CHANNEL,
				filePath: pdfPath,
				filename: pdfFilename,
				title: `Etimo Veckoblad #${edition.editionNumber}`,
				initialComment: `Nytt nummer av Etimo Veckoblad! #${edition.editionNumber} — ${edition.editorNote ?? ""}`,
			});
			publishedToSlack = result.ok;
		}

		try {
			unlinkSync(pdfPath);
		} catch {
			/* ignore */
		}

		jobStore.markCompleted(jobId, {
			editionNumber: edition.editionNumber,
			articleCount: edition.articles.length,
			pdfFilename,
			publishedToSlack,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Job ${jobId} failed:`, error);
		jobStore.markFailed(jobId, message);
	}
}

export async function generateRoutes(fastify: FastifyInstance): Promise<void> {
	const app = fastify.withTypeProvider<ZodTypeProvider>();

	app.post("/generate", {
		schema: {
			tags: ["Generate"],
			summary: "Start newspaper generation",
			description: "Kicks off agent + PDF generation as a background job",
			body: GenerateBodySchema,
			response: {
				202: JobStatusSchema,
				409: z.object({ error: z.string() }),
			},
		},
		handler: async (request, reply) => {
			if (jobStore.hasRunningJob()) {
				return reply.status(409).send({ error: "A generation job is already running" });
			}

			const { includeAudio, publishToSlack } = request.body;
			const job = jobStore.create({ includeAudio, publishToSlack });

			runGenerationJob(job.id).catch((err) => {
				console.error(`Unhandled error in job ${job.id}:`, err);
			});

			return reply.status(202).send(job);
		},
	});

	app.get("/generate/:jobId", {
		schema: {
			tags: ["Generate"],
			summary: "Get job status",
			description: "Returns the current status of a generation job",
			params: JobParamsSchema,
			response: {
				200: JobStatusSchema,
				404: z.object({ error: z.string() }),
			},
		},
		handler: async (request, reply) => {
			const job = jobStore.get(request.params.jobId);
			if (!job) {
				return reply.status(404).send({ error: "Job not found" });
			}
			return job;
		},
	});
}
