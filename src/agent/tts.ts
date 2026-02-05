import { mkdirSync, writeFileSync } from "node:fs";
import { openai } from "@ai-sdk/openai";
import { experimental_generateSpeech as generateSpeech } from "ai";

const model = openai.speech("tts-1");

function sanitizeTextForSpeech(text: string): string {
	// Strip HTML tags
	let clean = text.replace(/<[^>]*>/g, "");
	// Replace HTML entities
	clean = clean
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "och")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"');
	// Replace Slack user mentions like <@U0AD3F01V7G> with "en kollega" (Swedish)
	clean = clean.replace(/<@[A-Z0-9]+>/g, "en kollega");
	return clean;
}

export async function generateArticleAudio(
	articleId: string,
	headline: string,
	lead: string,
	body: string,
	outDir: string,
): Promise<string> {
	const rawText = `${headline}. ${lead} ${body}`;
	const text = sanitizeTextForSpeech(rawText);

	console.log(`    🎙️ Generating audio for: ${headline.slice(0, 40)}...`);

	const { audio } = await generateSpeech({
		model,
		voice: "alloy", // Neutral voice, often better for non-English
		text,
	});

	mkdirSync(outDir, { recursive: true });
	const filename = `${articleId}.mp3`;
	const filepath = `${outDir}/${filename}`;

	writeFileSync(filepath, Buffer.from(audio.uint8Array));

	console.log(`    ✅ Audio saved: ${filename}`);
	return filename;
}
