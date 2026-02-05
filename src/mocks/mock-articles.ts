import { MYSTICAL_REPORTER } from "../config.js";
import type { NewspaperEdition } from "../schemas/article.js";

export const mockEdition: NewspaperEdition = {
	editionNumber: 42,
	editionDate: "2024-02-07T08:00:00Z",
	editorNote:
		"Ännu en vecka, ännu en upplaga av kaos, triumfer och mystiska badankor. Vår alldeles egna Sansen har gjort det igen — även om ingen kan bekräfta när eller hur han samlade dessa historier. Håll er koffeinhaltiga, kära läsare.",
	articles: [
		{
			id: "art-001",
			section: "headline",
			headline: "ETIMO LANDAR JÄTTEKUND I HISTORISK AFFÄR",
			byline: MYSTICAL_REPORTER,
			lead: "I vad branschinsiders kallar 'riktigt jäkla najs' har Etimo framgångsrikt stängt en stor kundaffär som fått hela kontoret att surra.",
			body: "Tillkännagivandet kom via Slack, som alla viktiga nyheter gör nu för tiden, när Anna Andersson släppte bomben i #general. Meddelandet fick hela 15 party-emojis och 8 raketer, vilket gör det till det mest firade Slack-meddelandet sedan någon hittade pizza i fikarummet.",
			tags: ["affärer", "vinster", "firande"],
			publishedAt: "2024-02-07T08:00:00Z",
		},
		{
			id: "art-002",
			section: "weeks_wins",
			headline: "Tre veckors bugg äntligen krossad: 'Det var bara ett semikolon'",
			byline: MYSTICAL_REPORTER,
			lead: "Seniorutvecklare Sofia Svensson har segrat ur en tre veckor lång kamp mot vad som visade sig vara ett enda felplacerat semikolon.",
			body: "Buggen, som hade undgått hela utvecklingsteamet, blev äntligen inträngd och eliminerad på torsdagseftermiddagen. 'Jag stirrade på den koden så länge,' rapporterade Svensson, 'att jag började se semikolon i mina drömmar.' Fixen tog ungefär 0,5 sekunder att implementera. Firandet varade betydligt längre.",
			tags: ["teknik", "buggar", "seger"],
			publishedAt: "2024-02-07T08:00:00Z",
		},
		{
			id: "art-003",
			section: "slack_highlights",
			headline: "Veckans hjälte: Lisa brände midnattsoljan för demoförberedelser",
			byline: MYSTICAL_REPORTER,
			lead: "I en inspirerande uppvisning av teamwork stannade Lisa Lindgren kvar sent för att hjälpa kollegor förbereda en avgörande demo, vilket gav henne 18 hjärtreaktioner och evig tacksamhet.",
			body: "Marcus Magnusson bröt nyheten i #kudos, vilket utlöste en våg av uppskattning över hela företaget. När Lisa nåddes för kommentar sa hon helt enkelt: 'Någon var tvungen att se till att slidesen inte var i Comic Sans.' Demon blev enligt uppgift en succé.",
			tags: ["kudos", "teamwork", "hjältar"],
			publishedAt: "2024-02-07T08:00:00Z",
		},
		{
			id: "art-004",
			section: "random_facts",
			headline: "Johan siktad när han presenterade för växter: 'Väldigt wholesome,' säger vittnen",
			byline: MYSTICAL_REPORTER,
			lead: "I en hjärtevärmande scen som fångade kontorets uppmärksamhet observerades Johan när han övade sin presentation för kontorsväxterna.",
			body: "Den improviserade publiken av ormbunkar och suckulenter gav enligt uppgift utmärkt feedback genom att nicka försiktigt i brisen från AC:n. 'De är fantastiska lyssnare,' ska Johan ha sagt till en kollega. Händelsen utlöste 25 skratt-reaktioner och 7 växt-emojis, vilket cementerade dess plats i Etimo-folkloret.",
			tags: ["wholesome", "presentationer", "växter"],
			publishedAt: "2024-02-07T08:00:00Z",
		},
		{
			id: "art-005",
			section: "gossip",
			headline: "MYSTERIET: Vem lämnade badankan?",
			byline: MYSTICAL_REPORTER,
			lead: "En mystisk badanka har dykt upp på Erik Erikssons skrivbord, och ingen tar på sig ansvaret.",
			body: "Den gula vattenfågeln upptäcktes på måndagsmorgonen, uppflugen på en hög med post-it-lappar som en liten pipig vaktpost. Eriksson har uttryckt en blandning av förtjusning och misstänksamhet. 'Jag har döpt honom till Kvansen,' avslöjade han, 'men jag måste veta vem som gjorde detta.' Utredningen fortsätter. Om du har information, kontakta #random.",
			tags: ["mysterium", "ankor", "kontorsliv"],
			publishedAt: "2024-02-07T08:00:00Z",
		},
	],
};
