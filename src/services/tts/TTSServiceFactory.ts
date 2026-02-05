import type { ITTSService } from "./ITTSService.js";
import { MockTTSService } from "./mock.js";
import { RealTTSService } from "./real.js";

export type TTSServiceType = "openai" | "fake";

export class TTSServiceFactory {
	static create(type?: TTSServiceType): ITTSService {
		const serviceType = type ?? TTSServiceFactory.getTypeFromEnv();

		if (serviceType === "fake") {
			console.log("  📦 TTS: using mock service");
			return new MockTTSService();
		}

		const model = process.env.TTS_MODEL ?? "tts-1";
		console.log(`  🔌 TTS: using OpenAI (${model})`);
		return new RealTTSService(model);
	}

	static getTypeFromEnv(): TTSServiceType {
		const value = process.env.SERVICES_TTS?.toLowerCase();
		if (value === "fake") return "fake";
		return "openai";
	}
}
