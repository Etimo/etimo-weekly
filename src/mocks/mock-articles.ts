import { MYSTICAL_REPORTER } from "../config.js";
import type { NewspaperEdition } from "../schemas/article.js";

export const mockEdition: NewspaperEdition = {
	editionNumber: 42,
	editionDate: "2024-02-07T08:00:00Z",
	editorNote:
		"Another week, another edition of chaos, triumphs, and mysterious rubber ducks. Our very own Sven 'The Shadow' Spansen has done it again — though nobody can confirm when or how he gathered these stories. Stay caffeinated, dear readers.",
	articles: [
		{
			id: "art-001",
			section: "headline",
			headline: "ETIMO LANDS WHALE CLIENT IN HISTORIC DEAL",
			byline: MYSTICAL_REPORTER,
			lead: "In what industry insiders are calling 'pretty darn cool,' Etimo has successfully closed a major client deal that has the whole office buzzing.",
			body: "The announcement came via Slack, as all important news does these days, when Anna Andersson dropped the bombshell in #general. The message received an unprecedented 15 party emojis and 8 rockets, making it the most celebrated Slack message since someone found pizza in the break room.",
			tags: ["business", "wins", "celebration"],
			publishedAt: "2024-02-07T08:00:00Z",
		},
		{
			id: "art-002",
			section: "weeks_wins",
			headline: "Three-Week Bug Finally Squashed: 'It Was Just a Semicolon'",
			byline: MYSTICAL_REPORTER,
			lead: "Senior developer Sofia Svensson has emerged victorious from a three-week battle with what turned out to be a single misplaced semicolon.",
			body: "The bug, which had eluded the entire development team, was finally cornered and eliminated on Thursday afternoon. 'I stared at that code for so long,' Svensson reported, 'I started seeing semicolons in my dreams.' The fix took approximately 0.5 seconds to implement. The celebration lasted considerably longer.",
			tags: ["tech", "bugs", "victory"],
			publishedAt: "2024-02-07T08:00:00Z",
		},
		{
			id: "art-003",
			section: "slack_highlights",
			headline: "Hero of the Week: Lisa Burns Midnight Oil for Demo Prep",
			byline: MYSTICAL_REPORTER,
			lead: "In an inspiring display of teamwork, Lisa Lindgren stayed late to help colleagues prepare for a crucial demo, earning her 18 heart reactions and eternal gratitude.",
			body: "Marcus Magnusson broke the news in #kudos, sparking a wave of appreciation across the company. When reached for comment, Lisa simply said, 'Someone had to make sure the slides weren't in Comic Sans.' The demo was reportedly a success.",
			tags: ["kudos", "teamwork", "heroes"],
			publishedAt: "2024-02-07T08:00:00Z",
		},
		{
			id: "art-004",
			section: "random_facts",
			headline: "Johan Spotted Presenting to Plants: 'Very Wholesome,' Witnesses Say",
			byline: MYSTICAL_REPORTER,
			lead: "In a heartwarming scene that captured the office's attention, Johan was observed rehearsing his presentation to the office plants.",
			body: "The impromptu audience of ferns and succulents reportedly gave excellent feedback, nodding gently in the breeze from the AC. 'They're great listeners,' Johan allegedly told a colleague. The sighting sparked 25 laugh reactions and 7 plant emojis, cementing its place in Etimo folklore.",
			tags: ["wholesome", "presentations", "plants"],
			publishedAt: "2024-02-07T08:00:00Z",
		},
		{
			id: "art-005",
			section: "gossip",
			headline: "MYSTERY: Who Left the Rubber Duck?",
			byline: MYSTICAL_REPORTER,
			lead: "A mysterious rubber duck has appeared on Erik Eriksson's desk, and nobody is claiming responsibility.",
			body: "The yellow waterfowl was discovered on Monday morning, perched atop a stack of post-it notes like a tiny, squeaky sentinel. Eriksson has expressed a mixture of delight and suspicion. 'I've named him Quackson,' he revealed, 'but I need to know who did this.' The investigation continues. If you have any information, please contact #random.",
			tags: ["mystery", "ducks", "office-life"],
			publishedAt: "2024-02-07T08:00:00Z",
		},
	],
};
