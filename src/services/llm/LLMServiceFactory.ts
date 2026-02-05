import { env } from "../../env.js";
import type { ILLMService } from "./ILLMService.js";
import { MockLLMService } from "./mock.js";
import { RealLLMService } from "./real.js";

export type LLMServiceType = "openai" | "fake";

export class LLMServiceFactory {
	static create(type?: LLMServiceType): ILLMService {
		const serviceType = type ?? env.SERVICES_LLM;

		if (serviceType === "fake") {
			console.log("  📦 LLM: using mock service");
			return new MockLLMService();
		}

		console.log(`  🔌 LLM: using OpenAI (${env.OPENAI_MODEL})`);
		return new RealLLMService(env.OPENAI_MODEL);
	}
}
