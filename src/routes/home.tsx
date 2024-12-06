import { Button, Card, CardClickable, Chip, Dialog, Icon, LinearProgressIndeterminate, SegmentedButtonContainer, SegmentedButtonItem, TextField, TextFieldMultiline } from "m3-dreamland";
import { settings } from "../store";
import { fetch } from '../epoxy';
import { IframeSafeList } from "../iframesafelist";

import iconRefresh from "@ktibow/iconset-material-symbols/refresh";
import iconThumbsUpDown from "@ktibow/iconset-material-symbols/thumbs-up-down";
import iconDirectionsBoat from "@ktibow/iconset-material-symbols/directions-boat";
import iconMenuBook from "@ktibow/iconset-material-symbols/menu-book";
import iconCode from "@ktibow/iconset-material-symbols/code";
import iconLink from "@ktibow/iconset-material-symbols/link";
import iconSwapHoriz from "@ktibow/iconset-material-symbols/swap-horiz";
import iconPerson from "@ktibow/iconset-material-symbols/person";

type Project = {
	id: string,
	title: string,
	rating: number,
	ship_type: string,
	update_description?: string,

	screenshot_url: string,
	readme_url: string,
	repo_url: string,
	deploy_url: string,
};

type ProjectAnalytics = {
	readmeOpened: boolean,
	repoOpened: boolean,
	demoOpened: boolean,
};

type Matchup = { signature: string, timestamp: number, one: Project, two: Project };

const ProjectView: Component<{ data: Project, open: () => void }, {}> = function() {
	this.css = `
		flex: 1;
		.CardClickable-m3-container {
			width: 100%;
			height: 100%;
		}
		.matchup {
			display: flex;
			flex-direction: column;
			gap: 0.5em;
			height: 100%;
		}

		.chips {
			display: flex;
			gap: 0.5em;
			flex-wrap: wrap;
		}
		.caps {
			text-transform: capitalize;
		}
		.pre {
			white-space: pre-wrap;
		}

		img {
			max-width: 100%;
			height: auto;
			max-height: 35vh;
			object-fit: contain;
		}
		.expand { flex: 1; }
	`;

	const readme = (e: Event) => {
		e.stopImmediatePropagation();
		window.open(this.data.readme_url, "_blank");
	};
	const code = (e: Event) => {
		e.stopImmediatePropagation();
		window.open(this.data.repo_url, "_blank");
	};
	const demo = (e: Event) => {
		e.stopImmediatePropagation();
		window.open(this.data.deploy_url, "_blank");
	};

	const user = new URL(this.data.repo_url).pathname.split("/")[1];

	return (
		<div>
			<CardClickable type="elevated" on:click={this.open}>
				<div class="matchup">
					<div class="m3-font-title-large">{this.data.title}</div>
					<div class="chips">
						<Chip type="general" icon={iconThumbsUpDown}>{this.data.rating}</Chip>
						<Chip type="general" icon={iconDirectionsBoat}><span class="caps">{this.data.ship_type}</span></Chip>
						<Chip type="general" icon={iconPerson}>{user}</Chip>

						<Chip type="general" icon={iconMenuBook} on:click={readme}>README</Chip>
						<Chip type="general" icon={iconCode} on:click={code}>Code</Chip>
						<Chip type="general" icon={iconLink} on:click={demo}>Demo</Chip>
					</div>

					<div class="expand" />
					<img src={this.data.screenshot_url} alt={`Image for project: ${this.data.title}`} />
					<div class="expand pre">{this.data.update_description}</div>
				</div>
			</CardClickable>
		</div>
	)
}

const MatchupView: Component<{ matchup: Matchup, remove: () => void }, {
	selected: 1 | 2,
	dialogopen: boolean,
	reason: string,
	loading: boolean
	submitdisabled: boolean,

	readmeOpenedOne: boolean,
	readmeOpenedTwo: boolean,
	demoOpenedOne: boolean,
	demoOpenedTwo: boolean,
	repoOpenedOne: boolean,
	repoOpenedTwo: boolean,
}> = function() {
	this.css = `
		.matchup {
			display: flex;
			gap: 0.5em;
			align-items: stretch;
		}
		.vs {
			display: flex;
			align-items: center;
		}
		.body {
			display: flex;
			flex-direction: column;
			gap: 0.5em;
			align-items: stretch;
		}
		.body .TextFieldMultiline-m3-container {
			width: 100%;
		}
		.buttons {
			display: flex;
			gap: 1em;
		}

		.analytics {
			display: flex;
			flex-direction: column;
			gap: 0.5em;
		}

		.analyticsrow {
			display: flex;
			gap: 0.5em;
			align-items: center;
		}
	`;

	this.selected = 1;
	this.dialogopen = false;
	this.reason = "";

	this.readmeOpenedOne = true;
	this.readmeOpenedTwo = true;
	this.repoOpenedOne = true;
	this.repoOpenedTwo = true;
	this.demoOpenedOne = true;
	this.demoOpenedTwo = true;

	const getProject = (selected: 1 | 2) => {
		if (selected == 1) {
			return this.matchup.one;
		} else {
			return this.matchup.two;
		}
	}
	const getOtherProject = (selected: 1 | 2) => {
		if (selected == 2) {
			return this.matchup.one;
		} else {
			return this.matchup.two;
		}
	}
	const open = (selected: 1 | 2) => {
		this.selected = selected;
		this.reason = "";
		this.dialogopen = true;
	}
	const close = () => {
		this.reason = "";
		this.dialogopen = false;
	}
	const submit = async () => {
		const slackid = JSON.parse(settings.token).slackId;
		const analytics: Record<string, ProjectAnalytics> = {};
		analytics[this.matchup.one.id] = {
			readmeOpened: this.readmeOpenedOne,
			repoOpened: this.repoOpenedOne,
			demoOpened: this.demoOpenedOne,
		};
		analytics[this.matchup.two.id] = {
			readmeOpened: this.readmeOpenedTwo,
			repoOpened: this.repoOpenedTwo,
			demoOpened: this.demoOpenedTwo,
		};

		const body = {
			signature: this.matchup.signature,
			ts: this.matchup.timestamp,
			project1: this.matchup.one,
			project2: this.matchup.two,
			slackId: slackid,
			explanation: this.reason,
			winner: getProject(this.selected).id,
			loser: getOtherProject(this.selected).id,
			winnerRating: getProject(this.selected).rating,
			loserRating: getOtherProject(this.selected).rating,
			analytics: {
				skipsBeforeVote: 0,
				matchupGeneratedAt: new Date(),
				projectResources: analytics,
			},
		};
		console.log(body);
		this.loading = true;
		await fetch("https://highseas.hackclub.com/api/battles/vote", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Cookie": `hs-session=${encodeURIComponent(settings.token)}`
			},
			body: JSON.stringify(body),
		});
		this.loading = false;
		close();
		setTimeout(this.remove, 100);
	}

	const notEnoughWords = use(this.reason, x => x.trim().split(" ").length < 10);

	useChange([notEnoughWords, this.loading], () => {
		this.submitdisabled = notEnoughWords.value || this.loading;
	});

	return (
		<div>
			<Dialog
				bind:open={use(this.dialogopen)}

				headline={use(this.selected, x => `Why are you voting for ${getProject(x).title}?`)}
				closeOnClick={false}
			>
				<div class="body">
					{$if(use(this.loading), <LinearProgressIndeterminate />)}
					<div>Your reason must be at least 10 words.</div>
					<TextFieldMultiline name="Reason" bind:value={use(this.reason)} error={notEnoughWords} />
					<div class="analytics">
						<div class="analyticsrow">
							Opened README:
							<SegmentedButtonContainer>
								<SegmentedButtonItem
									type="checkbox"
									name="readme-opened"
									input="readme-opened-1"
									bind:checked={use(this.readmeOpenedOne)}
								>
									Left
								</SegmentedButtonItem>
								<SegmentedButtonItem
									type="checkbox"
									name="readme-opened"
									input="readme-opened-2"
									bind:checked={use(this.readmeOpenedTwo)}
								>
									Right
								</SegmentedButtonItem>
							</SegmentedButtonContainer>
						</div>
						<div class="analyticsrow">
							Opened demo:
							<SegmentedButtonContainer>
								<SegmentedButtonItem
									type="checkbox"
									name="demo-opened"
									input="demo-opened-1"
									bind:checked={use(this.demoOpenedOne)}
								>
									Left
								</SegmentedButtonItem>
								<SegmentedButtonItem
									type="checkbox"
									name="demo-opened"
									input="demo-opened-2"
									bind:checked={use(this.demoOpenedTwo)}
								>
									Right
								</SegmentedButtonItem>
							</SegmentedButtonContainer>
						</div>
						<div class="analyticsrow">
							Opened repo:
							<SegmentedButtonContainer>
								<SegmentedButtonItem
									type="checkbox"
									name="repo-opened"
									input="repo-opened-1"
									bind:checked={use(this.repoOpenedOne)}
								>
									Left
								</SegmentedButtonItem>
								<SegmentedButtonItem
									type="checkbox"
									name="repo-opened"
									input="repo-opened-2"
									bind:checked={use(this.repoOpenedTwo)}
								>
									Right
								</SegmentedButtonItem>
							</SegmentedButtonContainer>
						</div>
					</div>
				</div>
				<div class="buttons">
					<Button type="tonal" on:click={close} disabled={use(this.loading)}>Close</Button>
					<Button type="filled" on:click={submit} disabled={use(this.submitdisabled)}>Submit</Button>
				</div>
			</Dialog>
			<Card type="filled">
				<div class="matchup">
					<ProjectView data={this.matchup.one} open={() => open(1)} />
					<div class="vs m3-font-headline-small"><Icon icon={iconSwapHoriz} /></div>
					<ProjectView data={this.matchup.two} open={() => open(2)} />
				</div>
			</Card>
		</div>
	)
}

const Home: Component<{}, {
	matchups: { el: DLElement<typeof MatchupView>, id: string }[]
	loading: boolean,
}> = function() {
	this.css = `
		padding: 1em;
		display: flex;
		flex-direction: column;
		gap: 1em;

		.settings {
			display: flex;
			gap: 1em;
		}
		.settings > * {
			flex: 1;
		}
		.settings .TextField-m3-container {
			width: 100%;
		}

		.matchups {
			display: flex;
			flex-direction: column;
			gap: 0.5em;
		}
		.options {
			display: flex;
			gap: 1em;
			margin-bottom: 1em;
		}
		.expand {
			flex: 1;
		}
		.end {
			margin-top: 1em;
			display: flex;
			flex-direction: column;
			gap: 0.5em;
			align-items: center;
		}
	`;

	this.matchups = [];
	this.loading = false;

	const loadOne = async () => {
		const matchupText = await fetch("https://highseas.hackclub.com/api/battles/matchups", {
			headers: { "Cookie": `hs-session=${encodeURIComponent(settings.token)}` }
		}).then(r => r.text());
		let matchup;
		try {
			matchup = JSON.parse(matchupText);
		} catch (err) {
			console.error("probably ratelimited: ", matchupText, err);
			return
		}
		if (!matchup.project1) throw new Error("your stuff failed to fetch: " + JSON.stringify(matchup));

		const parsed = {
			one: matchup.project1,
			two: matchup.project2,
			signature: matchup.signature,
			timestamp: matchup.ts
		};
		const id = parsed.one.id + parsed.two.id;
		this.matchups = [...this.matchups, {
			el: <MatchupView
				matchup={parsed}
				remove={() => this.matchups = this.matchups.filter((x) => x.id !== id)}
			/>,
			id,
		}];
	}
	const loadMore = async () => {
		this.loading = true;
		const promises = [];
		for (let i = 0; i < +settings.numToLoad; i++) {
			promises.push(loadOne());
			await new Promise(r => setTimeout(r, 50));
		}
		await Promise.all(promises).catch(() => this.loading = false);
		this.loading = false;
	}
	const reload = async () => {
		this.matchups = [];
		loadMore();
	}

	const doesNotHaveToken = use(settings.token, x => { try { !JSON.parse(x).slackId } catch(e) { console.log(e); return true } });

	return (
		<div>
			<div class="m3-font-headline-medium">High Seas Wonderdome</div>
			<div>
				A better High Seas Wonderdome client.
				Doesn't spam POST requests and minified React errors, loads more than one matchup at once, and also has more info at a glance than the official one.
				Your token (the hs-session cookie, use DevTools -&gt; Application -&gt; Cookies to get it, make sure it is URL-decoded) is needed to fetch matchups and submit votes as you.
			</div>
			<div>
				Uses Wisp and epoxy-tls to securely fetch the data from the client side. The Wisp proxy server sees only TLS encrypted data.
			</div>

			<div class="m3-font-headline-small">Settings</div>
			<Card type="elevated">
				<div class="settings">
					<TextField name="Token (hs-session cookie)" bind:value={use(settings.token)} extraOptions={{ type: "password" }} />
					<TextField name="Wisp Server" bind:value={use(settings.wispServer)} />
					<TextField name="Number to load" bind:value={use(settings.numToLoad)} />
				</div>
			</Card>

			<div class="m3-font-headline-small">Matchups</div>
			<Card type="elevated">
				<div>
					<div class="options">
						{$if(use(this.loading), <LinearProgressIndeterminate />)}
						<div class="expand" />
						<Button type="filled" iconType="left" on:click={loadMore} disabled={doesNotHaveToken}><Icon icon={iconRefresh} />Load more</Button>
						<Button type="filled" iconType="left" on:click={reload} disabled={doesNotHaveToken}><Icon icon={iconRefresh} />Refresh</Button>
					</div>
					<IframeSafeList list={use(this.matchups)} class="matchups" />
					{$if(use(this.matchups, x => x.length !== 0),
						<div class="end">
							<Button type="tonal" iconType="left" on:click={loadMore} disabled={doesNotHaveToken}><Icon icon={iconRefresh} />Load even more</Button>
							{$if(use(this.loading), <LinearProgressIndeterminate />)}
						</div>
					)}
				</div>
			</Card>
		</div>
	);
};

export default Home;
