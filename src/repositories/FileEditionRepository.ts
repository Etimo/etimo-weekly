import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { IEditionRepository, PersistedEdition } from "./IEditionRepository.js";

type EditionStoreData = {
	currentEditionNumber: number;
	lastEdition?: PersistedEdition;
	editions?: PersistedEdition[];
};

const DEFAULT_STORE_PATH = "data/edition-store.json";

export class FileEditionRepository implements IEditionRepository {
	private storePath: string;
	private data: EditionStoreData;

	constructor(storePath: string = DEFAULT_STORE_PATH) {
		this.storePath = storePath;
		this.data = this.load();
	}

	private load(): EditionStoreData {
		if (existsSync(this.storePath)) {
			try {
				const content = readFileSync(this.storePath, "utf-8");
				return JSON.parse(content);
			} catch (error) {
				console.warn(`  ⚠️ Could not read edition store: ${error}`);
			}
		}
		// Default starting edition number
		return { currentEditionNumber: 1 };
	}

	private save(): void {
		const dir = dirname(this.storePath);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		writeFileSync(this.storePath, JSON.stringify(this.data, null, 2));
	}

	getNextEditionNumber(): number {
		const next = this.data.currentEditionNumber;
		this.data.currentEditionNumber++;
		this.save();
		return next;
	}

	getCurrentEditionNumber(): number {
		return this.data.currentEditionNumber;
	}

	getLastEdition(): PersistedEdition | undefined {
		return this.data.lastEdition;
	}

	saveEdition(edition: PersistedEdition): void {
		this.data.lastEdition = edition;
		if (!this.data.editions) {
			this.data.editions = [];
		}
		this.data.editions.push(edition);
		this.save();
		console.log(`  💾 Saved edition #${edition.editionNumber} to store (${this.data.editions.length} total)`);
	}

	getAllEditions(): PersistedEdition[] {
		return this.data.editions ?? [];
	}
}
