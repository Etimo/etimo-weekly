import { existsSync, rmSync, writeFileSync } from "node:fs";
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { tipsRoutes } from "./tips.js";

const TIPS_FILE = "data/tips.json";

describe("Tips API", () => {
	const app = Fastify();

	beforeAll(async () => {
		app.setValidatorCompiler(validatorCompiler);
		app.setSerializerCompiler(serializerCompiler);
		await app.register(tipsRoutes);
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		// Clear tips before each test
		writeFileSync(TIPS_FILE, "[]", "utf-8");
	});

	describe("POST /test/tip", () => {
		it("should create a new tip", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/test/tip",
				payload: { text: "API test tip" },
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(body.ok).toBe(true);
			expect(body.tip.text).toBe("API test tip");
			expect(body.tip.id).toBeDefined();
		});

		it("should return 400 when text is missing", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/test/tip",
				payload: {},
			});

			expect(response.statusCode).toBe(400);
		});
	});

	describe("GET /test/tips", () => {
		it("should return empty array when no tips", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/test/tips",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(body.tips).toEqual([]);
		});

		it("should return all tips", async () => {
			// Create some tips first
			await app.inject({
				method: "POST",
				url: "/test/tip",
				payload: { text: "First tip" },
			});
			await app.inject({
				method: "POST",
				url: "/test/tip",
				payload: { text: "Second tip" },
			});

			const response = await app.inject({
				method: "GET",
				url: "/test/tips",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json();
			expect(body.tips).toHaveLength(2);
		});
	});
});
