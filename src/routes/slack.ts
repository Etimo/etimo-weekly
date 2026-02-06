import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { env } from "../env.js";
import { createSlackRateLimitHandler } from "../plugins/rate-limit.js";
import { getTipsService } from "./tips.js";

// Verify Slack request signature — returns null if valid, or an error reason string
function verifySlackSignature(
	signingSecret: string,
	signature: string,
	timestamp: string,
	body: string,
): string | null {
	const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
	if (Number.parseInt(timestamp, 10) < fiveMinutesAgo) {
		return "Request timestamp too old";
	}

	const sigBasestring = `v0:${timestamp}:${body}`;
	const mySignature = `v0=${createHmac("sha256", signingSecret).update(sigBasestring).digest("hex")}`;

	try {
		if (!timingSafeEqual(Buffer.from(mySignature), Buffer.from(signature))) {
			return "Signature mismatch";
		}
		return null;
	} catch {
		return "Signature comparison failed";
	}
}

// Send a DM confirmation back to the user
async function sendConfirmationDM(channel: string): Promise<void> {
	if (!env.SLACK_BOT_TOKEN) {
		console.log("  ⚠️ No SLACK_BOT_TOKEN, skipping confirmation DM");
		return;
	}

	try {
		const response = await fetch("https://slack.com/api/chat.postMessage", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
			},
			body: JSON.stringify({
				channel,
				text: "Tack! Ditt tips har mottagits anonymt 🕵️ Det kan dyka upp i nästa nummer av Etimo Weekly!",
			}),
		});
		const result = (await response.json()) as { ok: boolean; error?: string };
		if (!result.ok) {
			console.error("  ❌ Failed to send confirmation:", result.error);
		} else {
			console.log("  ✅ Sent confirmation DM");
		}
	} catch (error) {
		console.error("  ❌ Error sending confirmation:", error);
	}
}

const SlackEventSchema = z.object({
	type: z.enum(["url_verification", "event_callback"]),
	challenge: z.string().optional(),
	event: z
		.object({
			type: z.string(), // Accept any event type - we filter for "message" in the handler
			channel: z.string(),
			user: z.string().optional(), // Some event types don't have user
			text: z.string().optional(), // Some event types don't have text
			ts: z.string(),
			bot_id: z.string().optional(),
		})
		.optional(),
});

const SlackResponseSchema = z.union([
	z.object({ challenge: z.string() }),
	z.object({ ok: z.boolean() }),
	z.object({ error: z.string() }),
]);

export async function slackRoutes(fastify: FastifyInstance): Promise<void> {
	const app = fastify.withTypeProvider<ZodTypeProvider>();
	const service = getTipsService();
	const rateLimitHandler = createSlackRateLimitHandler(fastify);

	app.post("/slack/events", {
		preHandler: rateLimitHandler,
		schema: {
			tags: ["Slack"],
			summary: "Slack Events API webhook",
			description: "Receives events from Slack (DMs to the bot become anonymous tips)",
			body: SlackEventSchema,
			response: {
				200: SlackResponseSchema,
				401: z.object({ error: z.string() }),
				429: z.object({
					statusCode: z.literal(429),
					error: z.string(),
					message: z.string(),
				}),
			},
		},
		handler: async (request, reply) => {
			const { body, rawBody } = request;

			if (!env.SLACK_SIGNING_SECRET) {
				return reply.status(401).send({ error: "SLACK_SIGNING_SECRET not configured" });
			}

			const signature = request.headers["x-slack-signature"] as string;
			const timestamp = request.headers["x-slack-request-timestamp"] as string;

			if (!signature || !timestamp || !rawBody) {
				console.log("  ⚠️ Missing Slack signature headers or body");
				return reply.status(401).send({ error: "Missing signature" });
			}

			const signatureError = verifySlackSignature(
				env.SLACK_SIGNING_SECRET,
				signature,
				timestamp,
				rawBody,
			);
			if (signatureError) {
				console.log(`  ⚠️ Invalid Slack signature: ${signatureError}`);
				return reply.status(401).send({ error: `Invalid signature: ${signatureError}` });
			}

			// Handle URL verification challenge (Slack sends this when setting up)
			if (body.type === "url_verification" && body.challenge) {
				console.log("  🔗 Slack URL verification challenge received");
				return { challenge: body.challenge };
			}

			// Handle events
			if (body.type === "event_callback" && body.event) {
				const event = body.event;

				// Ignore bot messages (including our own)
				if (event.bot_id) {
					return { ok: true };
				}

				// Handle DMs (message.im events)
				if (event.type === "message" && event.text) {
					console.log(`  📨 Received DM: "${event.text.slice(0, 50)}..."`);

					// Save the tip anonymously (we intentionally don't store event.user)
					await service.saveTip(event.text);

					// Send confirmation DM
					await sendConfirmationDM(event.channel);

					return { ok: true };
				}
			}

			return { ok: true };
		},
	});
}
