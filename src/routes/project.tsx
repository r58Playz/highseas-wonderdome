import { Button, CardClickable, CheckboxAnim, Chip, Dialog, LinearProgressIndeterminate, RadioAnim1, SegmentedButtonContainer, SegmentedButtonItem, TextFieldMultiline } from "m3-dreamland";
import { settings } from "../store";
import { fetch } from "../epoxy";
import { callAction, Matchup, MatchupExtras, Project } from "../api";
import { Link } from "./home";
import { Markdown } from "../markdown";

import iconBadge from "@ktibow/iconset-material-symbols/badge";
import iconDirectionsBoat from "@ktibow/iconset-material-symbols/directions-boat";
import iconMenuBook from "@ktibow/iconset-material-symbols/menu-book";
import iconCode from "@ktibow/iconset-material-symbols/code";
import iconLink from "@ktibow/iconset-material-symbols/link";
import iconPerson from "@ktibow/iconset-material-symbols/person";
import iconThumbsUpDown from "@ktibow/iconset-material-symbols/thumbs-up-down";
import iconCallSplit from "@ktibow/iconset-material-symbols/call-split";
import iconStar from "@ktibow/iconset-material-symbols/star";
import iconVisibility from "@ktibow/iconset-material-symbols/visibility";
import iconFlag from "@ktibow/iconset-material-symbols/flag";

type ProjectAnalytics = {
	readmeOpened: boolean,
	repoOpened: boolean,
	demoOpened: boolean,
};

const AnalyticsRow: Component<{ one: boolean, two: boolean, matchup: Matchup, ident: string }> = function() {
	return <div>
		<SegmentedButtonContainer>
			<SegmentedButtonItem
				type="checkbox"
				name={`${this.ident}-${this.matchup.signature}`}
				input={`${this.ident}-${this.matchup.signature}-${this.matchup.one.id}`}
				bind:checked={use(this.one)}
				disabled={true}
			>
				Left
			</SegmentedButtonItem>
			<SegmentedButtonItem
				type="checkbox"
				name={`${this.ident}-${this.matchup.signature}`}
				input={`${this.ident}-${this.matchup.signature}-${this.matchup.two.id}`}
				bind:checked={use(this.two)}
				disabled={true}
			>
				Right
			</SegmentedButtonItem>
		</SegmentedButtonContainer>
	</div>
}

const FraudRadio: Component<{ reason: string, id: string, type: string, disabled: boolean }, { el: HTMLElement }> = function() {
	this.css = `
		display: flex;
		gap: 1em;
	`;

	this.mount = () => {
		if (this.reason === this.type) {
			this.el.click();
		}
	};

	return (
		<label for={`fraud-reason-${this.id}-${this.reason}`}>
			<RadioAnim1>
				<input
					type="radio"
					id={`fraud-reason-${this.id}-${this.reason}`}
					name={`fraud-reason-${this.id}`}
					on:change={() => this.type = this.reason}

					disabled={use(this.disabled)}

					bind:this={use(this.el)}
				/>
			</RadioAnim1>
			{this.reason}
		</label>
	)
}

export const FraudDialog: Component<{
	id: string,
	sig: string,
	name: string,
	open: boolean
}, {
	type: string,
	reason: string,
	loading: boolean,
	submitDisabled: boolean
}> = function() {
	this.css = `
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

		.reasons {
			display: flex;
			flex-direction: column;
			gap: 0.5em;
		}
	`;

	this.type = "Suspected fraud";
	this.reason = "";
	this.loading = false;

	const submit = async () => {
		this.loading = true;
		const args = [{ id: this.id }, this.type, this.reason];
		console.log(`await callAction("src/app/harbor/battles/fraud-utils.ts", "sendFraudReport", { auth: true, args: ${JSON.stringify(args)} })`);
		console.log(await callAction("src/app/harbor/battles/fraud-utils.ts", "sendFraudReport", { auth: true, args: args }));
		this.loading = false;
		this.open = false;
	};

	useChange([this.reason, this.loading], () => {
		this.submitDisabled = this.reason.length === 0 || this.loading;
	});

	return (
		<div>
			<Dialog
				headline={`Submit fraud report for "${this.name}"`}
				bind:open={use(this.open)}
				closeOnClick={false}
			>
				<div class="body">
					<div class="reasons">
						<FraudRadio bind:type={use(this.type)} disabled={use(this.loading)} id={`${this.sig}-${this.id}`} reason="Incomplete README" />
						<FraudRadio bind:type={use(this.type)} disabled={use(this.loading)} id={`${this.sig}-${this.id}`} reason="No screenshot" />
						<FraudRadio bind:type={use(this.type)} disabled={use(this.loading)} id={`${this.sig}-${this.id}`} reason="No demo link" />
						<FraudRadio bind:type={use(this.type)} disabled={use(this.loading)} id={`${this.sig}-${this.id}`} reason="Suspected fraud" />
						<FraudRadio bind:type={use(this.type)} disabled={use(this.loading)} id={`${this.sig}-${this.id}`} reason="Wrong repo" />
					</div>
					<TextFieldMultiline name="Reason" bind:value={use(this.reason)} />
				</div>
				<div class="buttons">
					<Button disabled={use(this.loading)} type="filled" on:click={() => this.open = false}>Close</Button>
					<Button disabled={use(this.submitDisabled)} type="tonal" on:click={submit}>Submit</Button>
				</div>
			</Dialog>
		</div>
	)
}

export const SubmitVoteDialog: Component<{ matchup: Matchup, selected: 1 | 2, open: boolean, remove: () => void, }, {
	reason: string,
	loading: boolean

	shareVote: "none" | "public" | "anonymous",
	sendToUser: boolean,

	readmeOpenedOne: boolean,
	readmeOpenedTwo: boolean,
	demoOpenedOne: boolean,
	demoOpenedTwo: boolean,
	repoOpenedOne: boolean,
	repoOpenedTwo: boolean,
}, {
	analytics: (project: "one" | "two", clicked: "readme" | "repo" | "demo") => void
	submitDisabled: boolean,
	error: string,
}> = function() {
	this.reason = "";

	this.shareVote = settings.shareVote;
	this.sendToUser = false;

	this.readmeOpenedOne = false;
	this.readmeOpenedTwo = false;
	this.repoOpenedOne = false;
	this.repoOpenedTwo = false;
	this.demoOpenedOne = false;
	this.demoOpenedTwo = false;

	this.css = `
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

	this.analytics = (project, clicked) => {
		const ident = clicked + "Opened" + project[0].toUpperCase() + project.slice(1);
		console.log(`analytics event: ${ident}`);
		// @ts-expect-error
		this[ident] = true;
	}

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
	const close = () => {
		this.open = false;
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
		this.loading = true;
		if (this.shareVote !== "none") {
			fetch("https://api.saahild.com/api/highseasships/send_vote", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-User-ID": JSON.parse(settings.token).slackId,
				},
				body: JSON.stringify({
					vote: this.reason,
					send_it_to_user: this.sendToUser,
					anon: this.shareVote === "anonymous",
					repo: getProject(this.selected).repo_url,
					demo: getProject(this.selected).deploy_url,
					title: getProject(this.selected).title,
					author: getProject(this.selected).entrant__slack_id,
					mathchup_against: getOtherProject(this.selected).title,
				})
			}).then(() => {
				console.log("api.saahild.com finally returned");
			});
		}

		const trySubmitVote = async () => {
			const ret = await fetch("https://highseas.hackclub.com/api/battles/vote", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Cookie": `hs-session=${encodeURIComponent(settings.token)}`
				},
				body: JSON.stringify(body),
			}).then(r => r.text());
			console.log("Tried to submit vote: ", getProject(this.selected).id, getOtherProject(this.selected).id, ret);

			return ret;
		}

		let refetchCount = 0;
		while (true) {
			const ret = await trySubmitVote();
			let res;
			try {
				res = JSON.parse(ret);
				if (!res.ok && res.error !== "Vote already submitted") {
					this.error = ret;
					throw new Error("guh");
				}
			} catch {
				this.error = ret;
				const timeout = 4000 * (Math.pow(2, refetchCount));
				console.log(`retrying once: refetchCount ${refetchCount}; timeout ${timeout}`);
				await new Promise(r => setTimeout(r, timeout));
				refetchCount++;
				continue;
			}
			console.log("Really submitted vote: ", getProject(this.selected).id, getOtherProject(this.selected).id, res);
			break;
		}

		this.loading = false;
		close();
		setTimeout(this.remove, 100);
	}

	const impatient = () => {
		close();
		this.remove();
	}

	const notEnoughWords = use(this.reason, x => x.trim().split(" ").length < 10);

	useChange([notEnoughWords, this.loading, this.error], () => {
		this.submitDisabled = notEnoughWords.value || this.loading || !!this.error;
	});
	useChange([this.open], () => {
		this.reason = "";
	});

	return (
		<div>
			<Dialog
				bind:open={use(this.open)}

				headline={use(this.selected, x => `Why are you voting for ${getProject(x).title}?`)}
				closeOnClick={false}
			>
				<div class="body">
					{$if(use(this.loading), <LinearProgressIndeterminate />)}
					{use(this.error, x => {
						if (x) {
							return <pre>{x}</pre>
						}
					})}
					<div>Your reason must be at least 10 words.</div>
					<TextFieldMultiline name="Reason" bind:value={use(this.reason)} error={notEnoughWords} />
					<div class="analytics">
						<div class="analyticsrow">
							Opened README:
							<AnalyticsRow bind:one={use(this.readmeOpenedOne)} bind:two={use(this.readmeOpenedTwo)} matchup={this.matchup} ident="readme" />
						</div>
						<div class="analyticsrow">
							Opened demo:
							<AnalyticsRow bind:one={use(this.demoOpenedOne)} bind:two={use(this.demoOpenedTwo)} matchup={this.matchup} ident="demo" />
						</div>
						<div class="analyticsrow">
							Opened repo:
							<AnalyticsRow bind:one={use(this.repoOpenedOne)} bind:two={use(this.repoOpenedTwo)} matchup={this.matchup} ident="repo" />
						</div>
					</div>
					<div>These features need you to authorize the vote sharing API.</div>
					<div class="analytics">
						<div class="analyticsrow" on:change={(e: Event) => {
							const target = e.target as HTMLInputElement | undefined;
							this.shareVote = target!.id.split("-")[2] as any;
						}}>
							Send to slack?
							<SegmentedButtonContainer>
								<SegmentedButtonItem
									type="radio"
									name={`feedback-${this.matchup.signature}`}
									input={`feedback-${this.matchup.signature}-none`}
									checked={use(this.shareVote, x => x === "none")}
								>
									No
								</SegmentedButtonItem>
								<SegmentedButtonItem
									type="radio"
									name={`feedback-${this.matchup.signature}`}
									input={`feedback-${this.matchup.signature}-public`}
									checked={use(this.shareVote, x => x === "public")}
								>
									Public
								</SegmentedButtonItem>
								<SegmentedButtonItem
									type="radio"
									name={`feedback-${this.matchup.signature}`}
									input={`feedback-${this.matchup.signature}-anonymous`}
									checked={use(this.shareVote, x => x === "anonymous")}
								>
									Anonymous
								</SegmentedButtonItem>
							</SegmentedButtonContainer>
						</div>
						<div class="analyticsrow">
							<CheckboxAnim><input type="checkbox" bind:checked={use(this.sendToUser)} /></CheckboxAnim>
							Send to user
						</div>
					</div>
				</div>
				<div class="buttons">
					{$if(use(this.loading), <Button type="text" on:click={impatient}>I'm impatient</Button>)}
					<Button type="tonal" on:click={close} disabled={use(this.loading)}>Close</Button>
					<Button type="filled" on:click={submit} disabled={use(this.submitDisabled)}>Submit</Button>
				</div>
			</Dialog>
		</div>
	)
}

export const ProjectView: Component<{
	data: Project,
	sig: string,
	extras: MatchupExtras,
	open: () => void
	"on:analytics": (clicked: "readme" | "repo" | "demo") => void,
}, {
	imageOpen: boolean,
	readmeOpen: boolean,
	fraudOpen: boolean,
}> = function() {
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

		.screenshot {
			max-width: 100%;
			max-height: 16rem;
			height: auto;
			width: auto;

			z-index: 100;
			align-self: center;
		}
		dialog {
			max-width: 90vw !important;
			max-height: 90vh !important;
		}
		dialog .screenshot {
			height: 75vh;
			max-height: 100vh;
			max-width: 90vw;
		}
		.expand { flex: 1; }

		.actions {
			margin-bottom: 1rem;
		}
	`;

	this.imageOpen = false;
	this.readmeOpen = false;
	this.fraudOpen = false;

	const user = new URL(this.data.repo_url).pathname.split("/")[1];

	const readme = (e: Event) => {
		this["on:analytics"]("readme");
		e.stopImmediatePropagation();
		this.readmeOpen = true;
	};
	const code = (e: Event) => {
		this["on:analytics"]("repo");
		e.stopImmediatePropagation();
		window.open(this.data.repo_url, "_blank");
	};
	const demo = (e: Event) => {
		this["on:analytics"]("demo");
		e.stopImmediatePropagation();
		window.open(this.data.deploy_url, "_blank");
	};
	const slack = (e: Event) => {
		this["on:analytics"]("demo");
		e.stopImmediatePropagation();
		window.open(`https://hackclub.slack.com/app_redirect?channel=${this.data.entrant__slack_id}`, "_blank");
	}
	const github = (e: Event) => {
		e.stopImmediatePropagation();
		window.open(`https://github.com/${user}`, "_blank");
	}
	const expand = (e: Event) => {
		e.stopImmediatePropagation();
		this.imageOpen = true;
	}
	const report = (e: Event) => {
		e.stopImmediatePropagation();
		this.fraudOpen = true;
	}

	return (
		<div>
			<Dialog
				headline="Image"
				bind:open={use(this.imageOpen)}

				closeOnClick={false}
			>
				<img class="screenshot" src={this.data.screenshot_url} alt={`Image for project: ${this.data.title}`} />
				<div class="actions">
					<Button type="tonal" on:click={() => this.imageOpen = false}>Close</Button>
				</div>
			</Dialog>
			<Dialog
				headline="Readme"
				bind:open={use(this.readmeOpen)}

				closeOnClick={false}
			>
				<div>
					<Link href={this.data.readme_url}>Open in new tab</Link>
					<Markdown text={this.extras.readme || ""} />
				</div>
				<div class="actions">
					<Button type="tonal" on:click={() => this.readmeOpen = false}>Close</Button>
				</div>
			</Dialog>
			<FraudDialog id={this.data.id} sig={this.sig} name={this.data.title} bind:open={use(this.fraudOpen)} />
			<CardClickable type="elevated" on:click={this.open}>
				<div class="matchup">
					<div class="m3-font-title-large">{this.data.title}</div>
					<div class="chips">
						<Chip type="general" icon={iconDirectionsBoat}><span class="caps">{this.data.ship_type}</span></Chip>
						<Chip type="general" icon={iconThumbsUpDown}>{this.data.rating}</Chip>
						<Chip type="general" icon={iconPerson} on:click={github}>GH: {user}</Chip>
						<Chip type="general" icon={iconBadge} on:click={slack}>Slack: {this.extras.name || this.data.entrant__slack_id}</Chip>
						{this.extras.stars !== null ? <Chip type="general" icon={iconStar}>{this.extras.stars}</Chip> : null}
						{this.extras.forks !== null ? <Chip type="general" icon={iconCallSplit}>{this.extras.forks}</Chip> : null}
						{this.extras.watchers !== null ? <Chip type="general" icon={iconVisibility}>{this.extras.watchers}</Chip> : null}

						<Chip type="general" icon={iconMenuBook} on:click={readme}>README</Chip>
						<Chip type="general" icon={iconCode} on:click={code}>Code</Chip>
						<Chip type="general" icon={iconLink} on:click={demo}>Demo</Chip>
						<Chip type="general" icon={iconFlag} on:click={report}>Report</Chip>
					</div>

					<div class="expand" />
					<img class="screenshot" src={this.data.screenshot_url} alt={`Image for project: ${this.data.title}`} on:click={expand} />
					<div class="expand pre">{this.data.update_description}</div>
				</div>
			</CardClickable>
		</div>
	)
}
