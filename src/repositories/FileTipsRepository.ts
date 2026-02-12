import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { ITipsRepository, Tip } from "./ITipsRepository.js";

export class FileTipsRepository implements ITipsRepository {
	private filePath: string;

	constructor(filePath = "data/tips.json") {
		this.filePath = filePath;
		this.ensureDataDir();
	}

	private ensureDataDir(): void {
		const dir = dirname(this.filePath);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
	}

	private readTipsFile(): Tip[] {
		this.ensureDataDir();
		if (!existsSync(this.filePath)) {
			return [];
		}
		try {
			const content = readFileSync(this.filePath, "utf-8");
			return JSON.parse(content) as Tip[];
		} catch {
			return [];
		}
	}

	private writeTipsFile(tips: Tip[]): void {
		this.ensureDataDir();
		writeFileSync(this.filePath, JSON.stringify(tips, null, 2), "utf-8");
	}

	async saveTip(text: string): Promise<Tip> {
		const tips = this.readTipsFile();
		const tip: Tip = {
			id: `tip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			text: text.trim(),
			receivedAt: new Date().toISOString(),
		};
		tips.push(tip);
		this.writeTipsFile(tips);
		console.log(`  💾 Saved anonymous tip: "${text.slice(0, 50)}..."`);
		return tip;
	}

	async getTips(): Promise<Tip[]> {
		return this.readTipsFile();
	}

	async clearTips(): Promise<void> {
		this.writeTipsFile([]);
		console.log("  🗑️ Cleared all tips");
	}

	async consumeTips(editionNumber: number): Promise<Tip[]> {
		const tips = this.readTipsFile();
		const unconsumed = tips.filter((t) => !t.consumed);
		if (unconsumed.length > 0) {
			const now = new Date().toISOString();
			for (const tip of unconsumed) {
				tip.consumed = true;
				tip.consumedByEdition = editionNumber;
				tip.consumedAt = now;
			}
			this.writeTipsFile(tips);
			console.log(`  📬 Consumed ${unconsumed.length} tips for edition #${editionNumber}`);
		}
		return unconsumed;
	}
}
