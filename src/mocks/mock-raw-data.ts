import type { RawDataInput } from "../schemas/raw-data.js";

export const mockRawData: RawDataInput = {
	period: {
		start: "2024-02-01T00:00:00Z",
		end: "2024-02-07T23:59:59Z",
	},
	slackMessages: [
		{
			channel: "#general",
			author: "Anna Andersson",
			content: "We just landed the big client deal! 🎉",
			reactions: [
				{ emoji: "🎉", count: 15 },
				{ emoji: "🚀", count: 8 },
			],
			timestamp: "2024-02-05T10:30:00Z",
		},
		{
			channel: "#random",
			author: "Erik Eriksson",
			content:
				"Someone left a mysterious rubber duck on my desk. I'm not complaining, just... confused.",
			reactions: [{ emoji: "🦆", count: 12 }],
			timestamp: "2024-02-03T14:22:00Z",
		},
		{
			channel: "#dev",
			author: "Sofia Svensson",
			content:
				"Finally fixed that bug that's been haunting us for 3 weeks. Turns out it was a single semicolon.",
			reactions: [
				{ emoji: "🙌", count: 20 },
				{ emoji: "😅", count: 5 },
			],
			timestamp: "2024-02-06T16:45:00Z",
		},
		{
			channel: "#kudos",
			author: "Marcus Magnusson",
			content:
				"Big shoutout to @lisa for staying late to help with the demo prep. You're a legend!",
			reactions: [{ emoji: "❤️", count: 18 }],
			timestamp: "2024-02-04T18:00:00Z",
		},
		{
			channel: "#random",
			author: "Lisa Lindgren",
			content:
				"Did anyone else see Johan practicing his presentation to the office plants? Very wholesome.",
			reactions: [
				{ emoji: "😂", count: 25 },
				{ emoji: "🌱", count: 7 },
			],
			timestamp: "2024-02-02T11:15:00Z",
		},
	],
};
