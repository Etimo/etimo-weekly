import { mkdirSync, writeFileSync } from "node:fs";
import { openai } from "@ai-sdk/openai";
import { experimental_generateSpeech as generateSpeech } from "ai";

const model = openai.speech("tts-1");

export async function generateArticleAudio(
	articleId: string,
	headline: string,
	lead: string,
	body: string,
	outDir: string,
): Promise<string> {
	const text = `${headline}. ${lead} ${body}`;

	console.log(`    🎙️ Generating audio for: ${headline.slice(0, 40)}...`);

	const { audio } = await generateSpeech({
		model,
		voice: "onyx", // Deep, authoritative voice for news
		text,
	});

	mkdirSync(outDir, { recursive: true });
	const filename = `${articleId}.mp3`;
	const filepath = `${outDir}/${filename}`;

	writeFileSync(filepath, Buffer.from(audio.uint8Array));

	console.log(`    ✅ Audio saved: ${filename}`);
	return filename;
}
