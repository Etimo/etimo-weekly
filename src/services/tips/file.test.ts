import { existsSync, rmSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileTipsService } from "./file.js";

const TEST_FILE = "data/tips-test.json";

describe("FileTipsService", () => {
	let service: FileTipsService;

	beforeEach(() => {
		// Clean up before each test
		if (existsSync(TEST_FILE)) {
			rmSync(TEST_FILE);
		}
		service = new FileTipsService(TEST_FILE);
	});

	afterEach(() => {
		// Clean up after each test
		if (existsSync(TEST_FILE)) {
			rmSync(TEST_FILE);
		}
	});

	describe("saveTip", () => {
		it("should save a tip and return it with an id", async () => {
			const tip = await service.saveTip("Test gossip");

			expect(tip.id).toMatch(/^tip-\d+-[a-z0-9]+$/);
			expect(tip.text).toBe("Test gossip");
			expect(tip.receivedAt).toBeDefined();
		});

		it("should trim whitespace from tip text", async () => {
			const tip = await service.saveTip("  Spaced text  ");

			expect(tip.text).toBe("Spaced text");
		});

		it("should persist tips to file", async () => {
			await service.saveTip("First tip");
			await service.saveTip("Second tip");

			// Create new instance to verify persistence
			const newService = new FileTipsService(TEST_FILE);
			const tips = await newService.getTips();

			expect(tips).toHaveLength(2);
			expect(tips[0].text).toBe("First tip");
			expect(tips[1].text).toBe("Second tip");
		});
	});

	describe("getTips", () => {
		it("should return empty array when no tips exist", async () => {
			const tips = await service.getTips();

			expect(tips).toEqual([]);
		});

		it("should return all saved tips", async () => {
			await service.saveTip("Tip 1");
			await service.saveTip("Tip 2");
			await service.saveTip("Tip 3");

			const tips = await service.getTips();

			expect(tips).toHaveLength(3);
		});
	});

	describe("clearTips", () => {
		it("should remove all tips", async () => {
			await service.saveTip("Tip to clear");
			await service.saveTip("Another tip");

			await service.clearTips();
			const tips = await service.getTips();

			expect(tips).toEqual([]);
		});
	});

	describe("consumeTips", () => {
		it("should return tips and clear them", async () => {
			await service.saveTip("Consumable tip");

			const consumed = await service.consumeTips();
			const remaining = await service.getTips();

			expect(consumed).toHaveLength(1);
			expect(consumed[0].text).toBe("Consumable tip");
			expect(remaining).toEqual([]);
		});

		it("should return empty array when no tips exist", async () => {
			const consumed = await service.consumeTips();

			expect(consumed).toEqual([]);
		});
	});
});
