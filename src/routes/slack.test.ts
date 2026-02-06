import { writeFileSync } from "node:fs";
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { slackRoutes } from "./slack.js";

const TIPS_FILE = "data/tips.json";

describe("Slack API", () => {
	const app = Fastify();

	beforeAll(async () => {
		app.setValidatorCompiler(validatorCompiler);
		app.setSerializerCompiler(serializerCompiler);

		// Parse JSON body and store raw body
		app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
			try {
				const json = JSON.parse(body as string);
				done(null, json);
			} catch (err) {
				done(err as Error, undefined);
			}
		});

		app.addHook("preHandler", (request, _reply, done) => {
			if (request.headers["content-type"]?.includes("application/json")) {
				(request as unknown as { rawBody: string }).rawBody = JSON.stringify(request.body);
			}
			done();
		});

		await app.register(slackRoutes);
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		// Clear tips before each test
		writeFileSync(TIPS_FILE, "[]", "utf-8");
	});

	describe("POST /slack/events", () => {
		it("should respond to URL verification challenge", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/slack/events",
				payload: {
					type: "url_verification",
					challenge: "test-challenge-token",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(body.challenge).toBe("test-challenge-token");
		});

		it("should save a tip from DM event", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/slack/events",
				payload: {
					type: "event_callback",
					event: {
						type: "message",
						channel: "D123456",
						user: "U789",
						text: "Secret gossip from Slack",
						ts: "1234567890.123456",
					},
				},
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(body.ok).toBe(true);
		});

		it("should ignore bot messages", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/slack/events",
				payload: {
					type: "event_callback",
					event: {
						type: "message",
						channel: "D123456",
						user: "U789",
						text: "Bot message",
						ts: "1234567890.123456",
						bot_id: "B12345",
					},
				},
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(body.ok).toBe(true);
		});

		it("should handle unknown event types gracefully", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/slack/events",
				payload: {
					type: "event_callback",
					event: {
						type: "reaction_added",
						channel: "C123",
						user: "U456",
						text: "",
						ts: "123",
					},
				},
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(body.ok).toBe(true);
		});

		it("should rate limit users after too many tips", async () => {
			const userId = `rate-limit-test-${Date.now()}`;

			// Send 5 tips (the limit)
			for (let i = 0; i < 5; i++) {
				const response = await app.inject({
					method: "POST",
					url: "/slack/events",
					payload: {
						type: "event_callback",
						event: {
							type: "message",
							channel: "D123456",
							user: userId,
							text: `Tip number ${i + 1}`,
							ts: `123456789${i}.123456`,
						},
					},
				});
				expect(response.statusCode).toBe(200);
			}

			// The 6th tip should be rate limited
			const response = await app.inject({
				method: "POST",
				url: "/slack/events",
				payload: {
					type: "event_callback",
					event: {
						type: "message",
						channel: "D123456",
						user: userId,
						text: "This tip should be rate limited",
						ts: "1234567899.123456",
					},
				},
			});

			expect(response.statusCode).toBe(429);
			const body = response.json();
			expect(body.error).toBe("Too Many Requests");
		});

		it("should not rate limit different users", async () => {
			// Two different users should each get their own rate limit
			for (let userNum = 0; userNum < 2; userNum++) {
				const userId = `independent-user-${userNum}-${Date.now()}`;
				const response = await app.inject({
					method: "POST",
					url: "/slack/events",
					payload: {
						type: "event_callback",
						event: {
							type: "message",
							channel: "D123456",
							user: userId,
							text: "First tip from this user",
							ts: `12345678${userNum}0.123456`,
						},
					},
				});
				expect(response.statusCode).toBe(200);
			}
		});
	});
});
