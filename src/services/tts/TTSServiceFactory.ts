import { env } from "../../env.js";
import type { ITTSService } from "./ITTSService.js";
import { MockTTSService } from "./mock.js";
import { RealTTSService } from "./real.js";

export type TTSServiceType = "openai" | "fake";

export class TTSServiceFactory {
	static create(type?: TTSServiceType): ITTSService {
		const serviceType = type ?? env.SERVICES_TTS;

		if (serviceType === "fake") {
			console.log("  📦 TTS: using mock service");
			return new MockTTSService();
		}

		console.log(`  🔌 TTS: using OpenAI (${env.TTS_MODEL})`);
		return new RealTTSService(env.TTS_MODEL);
	}
}
