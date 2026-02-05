import { writeFileSync } from "node:fs";
import type { ITTSService } from "./ITTSService.js";

export class MockTTSService implements ITTSService {
	async generateAudio(_text: string, outputPath: string, _voice?: string): Promise<void> {
		console.log(`    [Mock TTS] Skipping audio generation for ${outputPath}`);

		// Write a tiny valid MP3 file (silent) or just skip entirely
		// For now, just create an empty placeholder
		writeFileSync(outputPath, Buffer.from([]));
		console.log(`    [Mock TTS] Created placeholder: ${outputPath}`);
	}
}
