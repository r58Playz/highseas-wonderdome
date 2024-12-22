import { fetch } from "./epoxy";
import { settings } from "./store";

export type Matchup = { signature: string, timestamp: number, one: Project, two: Project };

export type Project = {
	id: string,
	title: string,
	rating: number,
	entrant__slack_id: string,
	ship_type: string,
	update_description?: string,

	screenshot_url: string,
	readme_url: string,
	repo_url: string,
	deploy_url: string,
};

export type UserInfo = {
	blessed: boolean,
	cursed: boolean,

	createdTime: string,
	id: string,
	referralLink: string,
	settledTickets: number,
	votesRemainingForNextPendingShip: number,

	emailSubmittedOnMobile: boolean,
	hasCompletedTutorial: boolean,
	preexistingUser: boolean,
};

export async function fetchMatchup(): Promise<{ matchup: Matchup, id: string } | null> {
	const matchupText = await fetch("https://highseas.hackclub.com/api/battles/matchups", {
		headers: { "Cookie": `hs-session=${encodeURIComponent(settings.token)}` }
	}).then(r => r.text());
	let matchup;
	try {
		matchup = JSON.parse(matchupText);
	} catch (err) {
		console.error("probably ratelimited: ", matchupText, err);
		return null;
	}
	if (!matchup.project1) throw new Error("your stuff failed to fetch: " + JSON.stringify(matchup));

	const parsed = {
		one: matchup.project1,
		two: matchup.project2,
		signature: matchup.signature,
		timestamp: matchup.ts
	};
	const id = parsed.one.id + parsed.two.id;

	return { matchup: parsed, id, };
}


// nextjs server actions suck
export async function fetchStatus(): Promise<UserInfo> {
	const res = await fetch("https://highseas.hackclub.com/wonderdome", {
		"headers": {
			"accept": "text/x-component",
			"content-type": "text/plain;charset=UTF-8",
			"next-action": settings.infoHash,
			"cookie": `hs-session=${encodeURIComponent(settings.token)};` +
				"academy-completed=true;" +
				"waka=%7B%7D;" +
				"verification=%7B%7D;" +
				"signpost-feed=%5B%5D;" +
				"ships=%5B%5D",
		},
		"body": "[]",
		"method": "POST"
	}).then(r => r.text());
	const components = res.split('\n').map(x => x.substring(x.indexOf(':') + 1));
	const userInfoString = components.find(x => x.includes("votesRemainingForNextPendingShip"));
	if (!userInfoString) throw new Error("failed to find userinfo. the next-action hash was probably updated");

	return JSON.parse(userInfoString);
};
