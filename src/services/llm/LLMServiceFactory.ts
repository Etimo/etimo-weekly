import type { ILLMService } from "./ILLMService.js";
import { MockLLMService } from "./mock.js";
import { RealLLMService } from "./real.js";

export type LLMServiceType = "openai" | "fake";

export class LLMServiceFactory {
	static create(type?: LLMServiceType): ILLMService {
		const serviceType = type ?? LLMServiceFactory.getTypeFromEnv();

		if (serviceType === "fake") {
			console.log("  📦 LLM: using mock service");
			return new MockLLMService();
		}

		const model = process.env.OPENAI_MODEL ?? "gpt-4o";
		console.log(`  🔌 LLM: using OpenAI (${model})`);
		return new RealLLMService(model);
	}

	static getTypeFromEnv(): LLMServiceType {
		const value = process.env.SERVICES_LLM?.toLowerCase();
		if (value === "fake") return "fake";
		return "openai";
	}
}
