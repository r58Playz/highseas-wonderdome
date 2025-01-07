import { fetch } from "./epoxy";
import { settings } from "./store";

import { createFlightResponse, processStringChunk } from "@rsc-parser/react-client";

type ApiMatchup = {
	project1: Project,
	project2: Project,
	signature: string,
	ts: number,
}

export type MatchupExtras = {
	name: string | null,
	stars: number | null,
	forks: number | null,
};

export type Matchup = {
	signature: string,
	timestamp: number,
	one: Project,
	two: Project,
	oneExtras: MatchupExtras,
	twoExtras: MatchupExtras,
};

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

export type AirtableRes = {
	id: string,
	createdTime: string,
	fields: Airtable,
}

export const AirtableKeys = [
	"github_username",
	"average_ship_rating",
	"vote_balance", "vote_count", "vote_count_prior_week",
	"vote_quality_multiplier", "voter_quality_classification", "voting_trust_factor",
	"mean_discordance",
	"readme_opened_percentage", "repo_opened_percentage", "demo_opened_percentage",
];
export type Airtable = {
	github_username: string,

	average_ship_rating: number,

	vote_balance: number,
	vote_count: number,
	vote_count_prior_week: number,
	vote_quality_multiplier: number,
	voter_quality_classification: string,
	voting_trust_factor: number,
	mean_discordance: number,

	readme_opened_percentage: string,
	repo_opened_percentage: string,
	demo_opened_percentage: string,
};

async function fetchSlackName(id: string): Promise<string | null> {
	const info = await fetch(`https://cachet.dunkirk.sh/users/${id}`).then(r => r.json());
	if (!info.displayName) {
		console.error("failed to fetch from cachet: ", info);
		return null;
	}
	if (info.displayName.includes("https://")) {
		console.log(`slackid ${id} has the displayName bug: `, info);
		return null;
	}
	return info.displayName;
}

async function fetchGithubStats(url: string): Promise<{ stars: number, forks: number, } | null> {
	try {
		const ret = await fetch(url).then(r => r.text());
		const dom = new DOMParser().parseFromString(ret, "text/html");
		const stars = +dom.getElementById("repo-stars-counter-star")!.innerText;
		const forks = +dom.getElementById("repo-network-counter")!.innerText;

		if (!Number.isFinite(stars) || !Number.isFinite(forks)) {
			console.error(`failed to fetch github stats: stars ${stars} forks ${forks}`);
			return null;
		}

		return { stars, forks };
	} catch (err) {
		console.error("failed to fetch github stats:", err);
		return null;
	}
}

export async function fetchMatchup(): Promise<{ matchup: Matchup, id: string } | null> {
	const matchupText = await fetch("https://highseas.hackclub.com/api/battles/matchups", {
		headers: { "Cookie": `hs-session=${encodeURIComponent(settings.token)}` }
	}).then(r => r.text());
	let matchup;
	try {
		matchup = JSON.parse(matchupText) as ApiMatchup;
	} catch (err) {
		console.error("probably ratelimited: ", matchupText, err);
		return null;
	}
	if (!matchup.project1) throw new Error("matchup failed to fetch: " + JSON.stringify(matchup));

	const emptyExtras: MatchupExtras = {
		name: null,
		stars: null,
		forks: null,
	};

	const parsed = {
		one: matchup.project1,
		two: matchup.project2,
		signature: matchup.signature,
		timestamp: matchup.ts,

		oneExtras: structuredClone(emptyExtras),
		twoExtras: structuredClone(emptyExtras),
	};

	const id = parsed.one.id + parsed.two.id;

	parsed.oneExtras.name = await fetchSlackName(parsed.one.entrant__slack_id);
	parsed.twoExtras.name = await fetchSlackName(parsed.two.entrant__slack_id);

	return { matchup: parsed, id, };
}

export async function fillMatchup(matchup: Matchup): Promise<Matchup> {
	const oneGithub = await fetchGithubStats(matchup.one.repo_url);
	const twoGithub = await fetchGithubStats(matchup.two.repo_url);

	if (oneGithub) matchup.oneExtras = Object.assign(matchup.oneExtras, oneGithub);
	if (twoGithub) matchup.twoExtras = Object.assign(matchup.twoExtras, twoGithub);

	return matchup;
}

async function getActionHash(path: string, name: string) {
	const input = `/vercel/path0/${path}:${name}`;
	const hashed = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
	return [...new Uint8Array(hashed)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function cookieHeader(): string {
	return `hs-session=${encodeURIComponent(settings.token)};` +
		"academy-completed=true;" +
		"waka=%7B%7D;" +
		"verification=%7B%7D;" +
		"signpost-feed=%5B%5D;" +
		"ships=%5B%5D";
}

async function callAction(
	path: string,
	name: string,
	info: {
		actionPath?: string,
		args?: string[],
		auth: boolean,
	}
) {
	const fetchRes = await fetch(`https://highseas.hackclub.com/${info.actionPath || ""}`, {
		"headers": Object.assign({
			"accept": "text/x-component",
			"content-type": "text/plain;charset=UTF-8",
			"next-action": await getActionHash(path, name),
		}, info.auth ? { "cookie": cookieHeader() } : {}),
		"body": JSON.stringify(info.args || []),
		"method": "POST"
	}).then(r => r.text());

	// this doesn't work for person() for some reason
	const res = createFlightResponse();
	processStringChunk(res, fetchRes);
	return res._chunks.filter(x => x.type === "model").map(x => x.value);
}

(self as any).callAction = callAction;

export async function fetchStatus(): Promise<UserInfo> {
	const components = await callAction("src/app/utils/airtable.ts", "safePerson", { auth: true });
	return components[1] as any;
};

export async function fetchPerson(): Promise<AirtableRes> {
	const res = await fetch("https://highseas.hackclub.com/", {
		"headers": {
			"accept": "text/x-component",
			"content-type": "text/plain;charset=UTF-8",
			"next-action": await getActionHash("src/app/utils/data.ts", "person"),
			"cookie": cookieHeader()
		},
		"body": JSON.stringify([]),
		"method": "POST"
	}).then(r => r.text());
	const components = res.split('\n').map(x => x.substring(x.indexOf(':') + 1));
	return JSON.parse(`{"id":"` + components[components.length - 2].split(`{"id":"`)[1]);
}

(self as any).person = fetchPerson;
