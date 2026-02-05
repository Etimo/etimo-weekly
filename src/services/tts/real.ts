import { writeFileSync } from "node:fs";
import { openai } from "@ai-sdk/openai";
import { experimental_generateSpeech as generateSpeech } from "ai";
import type { ITTSService } from "./ITTSService.js";

export class RealTTSService implements ITTSService {
	private model;

	constructor(modelId = "tts-1") {
		this.model = openai.speech(modelId);
	}

	async generateAudio(text: string, outputPath: string, voice = "alloy"): Promise<void> {
		console.log("    🎙️ Generating audio...");

		const { audio } = await generateSpeech({
			model: this.model,
			voice,
			text,
		});

		writeFileSync(outputPath, Buffer.from(audio.uint8Array));
		console.log(`    ✅ Audio saved: ${outputPath}`);
	}
}
