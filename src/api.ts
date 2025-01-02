import { fetch } from "./epoxy";
import { settings } from "./store";

import { createFlightResponse, processStringChunk } from "@rsc-parser/react-client";

type ApiMatchup = {
	project1: Project,
	project2: Project,
	signature: string,
	ts: number,
}

export type Matchup = {
	signature: string,
	timestamp: number,
	one: Project,
	two: Project,
	oneName: string | null,
	twoName: string | null,
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

	const parsed = {
		one: matchup.project1,
		two: matchup.project2,
		oneName: await fetchSlackName(matchup.project1.entrant__slack_id),
		twoName: await fetchSlackName(matchup.project2.entrant__slack_id),
		signature: matchup.signature,
		timestamp: matchup.ts
	};
	const id = parsed.one.id + parsed.two.id;

	return { matchup: parsed, id, };
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
