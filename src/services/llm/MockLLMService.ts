import type { z } from "zod";
import type { LLMStep } from "../types.js";
import type {
	GenerateStructuredOptions,
	GenerateTextOptions,
	GenerateWithToolsOptions,
	ILLMService,
} from "./ILLMService.js";

// Mock responses for different prompts
const MOCK_EDITOR_NOTE =
	"Ännu en vecka, ännu en utgåva av kaos, triumfer och mystiska gummiankors. Håll er vakna, kära läsare.";

const MOCK_ANALYSIS = {
	headline: {
		sourceMessages: ["We just landed the big client deal! 🎉"],
		angle: "Etimo lands major client deal, team celebrates",
	},
	sections: [
		{
			id: "veckans_buggar",
			label: "🐛 Veckans Buggar",
			sourceMessages: [
				"Finally fixed that bug that's been haunting us for 3 weeks. Turns out it was a single semicolon.",
			],
			angle: "Epic bug hunt ends with semicolon revelation",
		},
		{
			id: "kudos",
			label: "🎉 Kudos-hörnan",
			sourceMessages: ["Big shoutout to Lisa for staying late to help with the demo prep."],
			angle: "Lisa celebrated for demo prep heroics",
		},
		{
			id: "kontoret",
			label: "🌱 Livet på Kontoret",
			sourceMessages: [
				"Did anyone else see Johan practicing his presentation to the office plants?",
			],
			angle: "Johan's unique presentation prep method goes viral",
		},
	],
	gossip: {
		sourceMessages: [
			"Someone left a mysterious rubber duck on my desk.",
			"The duck has chosen you.",
		],
		angle: "Mystery duck appearance sparks office intrigue",
	},
};

const MOCK_ARTICLES: Record<
	string,
	{
		headline: string;
		lead: string;
		body: string;
		tags: string[];
	}
> = {
	headline: {
		headline: "ETIMO LANDAR STOR KUND I HISTORISKT AVTAL",
		lead: "I vad branschexperter kallar 'riktigt häftigt' har Etimo lyckats landa en stor kundaffär som fått hela kontoret att surra av förväntan.",
		body: '<p>Beskedet kom via Slack, som alla viktiga nyheter gör nuförtiden, när Anna Andersson släppte bomben i #general. Meddelandet fick hela 15 party-emojis och 8 raketer, vilket gör det till det mest firade Slack-meddelandet sedan någon hittade pizza i fikarummet.</p><p>"Detta är stort för oss", kommenterade en anonym källa som definitivt inte var undertecknad.</p><p><em>— Redaktionen</em></p>',
		tags: ["affärer", "vinster", "firande"],
	},
	veckans_buggar: {
		headline: "Tre Veckors Bugg Äntligen Krossad: 'Det Var Bara Ett Semikolon'",
		lead: "Seniorutvecklare Sofia Svensson har segrat ur en tre veckor lång kamp mot vad som visade sig vara ett enda felplacerat semikolon.",
		body: '<p>Buggen, som hade undgått hela utvecklingsteamet, blev äntligen tillintetgjord på torsdagen. "Jag stirrade på den koden så länge", rapporterade Svensson, "att jag började se semikolon i mina drömmar."</p><p>Fixet tog ungefär 0,5 sekunder att implementera. Firandet pågick betydligt längre.</p><p><em>— Redaktionen</em></p>',
		tags: ["teknik", "buggar", "seger"],
	},
	kudos: {
		headline: "Veckans Hjälte: Lisa Brinner Midnattsolja för Demo",
		lead: "I en inspirerande uppvisning av lagarbete stannade Lisa Lindgren kvar sent för att hjälpa kollegor förbereda en viktig demo, vilket gav henne 18 hjärt-reaktioner och evig tacksamhet.",
		body: '<p>Marcus Magnusson bröt nyheten i #kudos, vilket utlöste en våg av uppskattning över hela företaget. När Lisa tillfrågades svarade hon enkelt: "Någon var tvungen att se till att bilderna inte var i Comic Sans."</p><p>Demon blev enligt uppgift en succé.</p><p><em>— Redaktionen</em></p>',
		tags: ["kudos", "teamwork", "hjältar"],
	},
	kontoret: {
		headline: "Johan Siktad Presenterandes för Växter: 'Väldigt Mysigt'",
		lead: "I en hjärtevärmande scen som fångade kontorets uppmärksamhet observerades Johan när han övade sin presentation för kontorsväxterna.",
		body: '<p>Den improviserade publiken av ormbunkar och suckulenter gav enligt uppgift utmärkt feedback, nickande försiktigt i brisen från AC:n. "De är fantastiska lyssnare", ska Johan ha sagt till en kollega.</p><p>Upptäckten utlöste 25 skratt-reaktioner och 7 växt-emojis.</p><p><em>— Redaktionen</em></p>',
		tags: ["mysigt", "presentationer", "växter"],
	},
	gossip: {
		headline: "MYSTERIUM: Vem Lämnade Gummiangan?",
		lead: "En mystisk gummianka har dykt upp på Erik Erikssons skrivbord, och ingen tar på sig ansvaret.",
		body: '<p>Den gula vattenfågeln upptäcktes på måndagsmorgonen, tronande ovanpå en hög med post-it-lappar som en liten, pipande väktare. Eriksson har uttryckt en blandning av förtjusning och misstänksamhet.</p><p>"Jag har döpt honom till Kvansen", avslöjade han, "men jag måste veta vem som gjorde detta." Utredningen fortsätter.</p><p><em>— Sven</em></p>',
		tags: ["mysterium", "ankor", "kontorsliv"],
	},
};

export class MockLLMService implements ILLMService {
	async generateText(options: GenerateTextOptions): Promise<{ text: string }> {
		console.log("    [Mock LLM] Generating text response");

		// Check if this is an editor's note request
		if (options.prompt.includes("editor's note") || options.prompt.includes("editor")) {
			return { text: MOCK_EDITOR_NOTE };
		}

		return { text: "Mock LLM response" };
	}

	async generateWithTools(
		options: GenerateWithToolsOptions,
	): Promise<{ text: string; steps: LLMStep[] }> {
		console.log("    [Mock LLM] Simulating tool calls");

		// Simulate the gather step - return mock tool calls and results
		const steps: LLMStep[] = [
			{
				toolCalls: [{ toolCallId: "call-1", toolName: "listChannels", args: { limit: 100 } }],
				toolResults: [
					{
						toolCallId: "call-1",
						toolName: "listChannels",
						output: [
							{ id: "C001", name: "general" },
							{ id: "C002", name: "random" },
							{ id: "C003", name: "dev" },
							{ id: "C004", name: "kudos" },
						],
					},
				],
			},
			{
				toolCalls: [
					{
						toolCallId: "call-2",
						toolName: "getChannelHistory",
						args: { channelId: "C001", limit: 50 },
					},
					{
						toolCallId: "call-3",
						toolName: "getChannelHistory",
						args: { channelId: "C002", limit: 50 },
					},
					{
						toolCallId: "call-4",
						toolName: "getChannelHistory",
						args: { channelId: "C003", limit: 50 },
					},
					{
						toolCallId: "call-5",
						toolName: "getChannelHistory",
						args: { channelId: "C004", limit: 50 },
					},
				],
				toolResults: [],
			},
		];

		return {
			text: "I gathered messages from all available channels and found interesting content about a client deal, bug fixes, kudos, and office happenings.",
			steps,
		};
	}

	async generateStructured<T>(
		options: GenerateStructuredOptions<T>,
	): Promise<{ output: T | undefined }> {
		console.log("    [Mock LLM] Generating structured response");

		// Check what kind of structured output is expected based on the prompt
		if (options.prompt.includes("Analyze these Slack messages")) {
			return { output: MOCK_ANALYSIS as T };
		}

		// Article generation - extract section from prompt
		const sectionMatch = options.prompt.match(/\"([^\"]+)\" section/);
		if (sectionMatch) {
			const sectionLabel = sectionMatch[1];
			// Find matching mock article
			for (const [key, article] of Object.entries(MOCK_ARTICLES)) {
				if (sectionLabel.toLowerCase().includes(key) || key === "headline") {
					if (options.prompt.includes(sectionLabel)) {
						// Try to match by section id in the label
						const matchingKey = Object.keys(MOCK_ARTICLES).find(
							(k) =>
								sectionLabel.toLowerCase().includes(k) ||
								(k === "headline" && sectionLabel.includes("Nytt")),
						);
						if (matchingKey) {
							return { output: MOCK_ARTICLES[matchingKey] as T };
						}
					}
				}
			}
			// Default to headline article if no match
			return { output: MOCK_ARTICLES.headline as T };
		}

		// Fallback for article generation based on section hints
		if (options.prompt.includes("headline") || options.prompt.includes("HEADLINE")) {
			return { output: MOCK_ARTICLES.headline as T };
		}
		if (options.prompt.includes("gossip") || options.prompt.includes("skvaller")) {
			return { output: MOCK_ARTICLES.gossip as T };
		}
		if (options.prompt.includes("kudos") || options.prompt.includes("Kudos")) {
			return { output: MOCK_ARTICLES.kudos as T };
		}
		if (options.prompt.includes("bugg") || options.prompt.includes("bug")) {
			return { output: MOCK_ARTICLES.veckans_buggar as T };
		}
		if (
			options.prompt.includes("kontor") ||
			options.prompt.includes("växt") ||
			options.prompt.includes("plant")
		) {
			return { output: MOCK_ARTICLES.kontoret as T };
		}

		// Default fallback
		return { output: MOCK_ARTICLES.headline as T };
	}
}
