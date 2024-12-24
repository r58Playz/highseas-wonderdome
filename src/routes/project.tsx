import iconBadge from "@ktibow/iconset-material-symbols/badge";
import iconDirectionsBoat from "@ktibow/iconset-material-symbols/directions-boat";
import iconMenuBook from "@ktibow/iconset-material-symbols/menu-book";
import iconCode from "@ktibow/iconset-material-symbols/code";
import iconLink from "@ktibow/iconset-material-symbols/link";
import iconPerson from "@ktibow/iconset-material-symbols/person";
import iconThumbsUpDown from "@ktibow/iconset-material-symbols/thumbs-up-down";
import { Button, CardClickable, Chip, Dialog, LinearProgressIndeterminate, SegmentedButtonContainer, SegmentedButtonItem, TextFieldMultiline } from "m3-dreamland";
import { settings } from "../store";
import { fetch } from "../epoxy";
import { Matchup, Project } from "../api";

type ProjectAnalytics = {
	readmeOpened: boolean,
	repoOpened: boolean,
	demoOpened: boolean,
};

export const SubmitVoteDialog: Component<{ matchup: Matchup, selected: 1 | 2, open: boolean, remove: () => void, }, {
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

	this.reason = "";

	this.readmeOpenedOne = true;
	this.readmeOpenedTwo = true;
	this.repoOpenedOne = true;
	this.repoOpenedTwo = true;
	this.demoOpenedOne = true;
	this.demoOpenedTwo = true;

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
		const ret = await fetch("https://highseas.hackclub.com/api/battles/vote", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Cookie": `hs-session=${encodeURIComponent(settings.token)}`
			},
			body: JSON.stringify(body),
		}).then(r => r.text());
		console.log("Submitted vote: ", getProject(this.selected).id, getOtherProject(this.selected).id, ret);
		this.loading = false;
		close();
		setTimeout(this.remove, 100);
	}

	const notEnoughWords = use(this.reason, x => x.trim().split(" ").length < 10);

	useChange([notEnoughWords, this.loading], () => {
		this.submitdisabled = notEnoughWords.value || this.loading;
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
					<div>Your reason must be at least 10 words.</div>
					<TextFieldMultiline name="Reason" bind:value={use(this.reason)} error={notEnoughWords} />
					<div class="analytics">
						<div class="analyticsrow">
							Opened README:
							<SegmentedButtonContainer>
								<SegmentedButtonItem
									type="checkbox"
									name="readme-opened"
									input={`readme-opened-${this.matchup.signature}-${this.matchup.one.id}`}
									bind:checked={use(this.readmeOpenedOne)}
								>
									Left
								</SegmentedButtonItem>
								<SegmentedButtonItem
									type="checkbox"
									name="readme-opened"
									input={`readme-opened-${this.matchup.signature}-${this.matchup.two.id}`}
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
									input={`demo-opened-${this.matchup.signature}-${this.matchup.one.id}`}
									bind:checked={use(this.demoOpenedOne)}
								>
									Left
								</SegmentedButtonItem>
								<SegmentedButtonItem
									type="checkbox"
									name="demo-opened"
									input={`demo-opened-${this.matchup.signature}-${this.matchup.two.id}`}
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
									input={`repo-opened-${this.matchup.signature}-${this.matchup.one.id}`}
									bind:checked={use(this.repoOpenedOne)}
								>
									Left
								</SegmentedButtonItem>
								<SegmentedButtonItem
									type="checkbox"
									name="repo-opened"
									input={`repo-opened-${this.matchup.signature}-${this.matchup.two.id}`}
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
		</div>
	)
}

export const ProjectView: Component<{ data: Project, slackName: string | null, open: () => void }, {}> = function() {
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

	const user = new URL(this.data.repo_url).pathname.split("/")[1];

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
	const slack = (e: Event) => {
		e.stopImmediatePropagation();
		window.open(`https://hackclub.slack.com/app_redirect?channel=${this.data.entrant__slack_id}`, "_blank");
	}
	const github = (e: Event) => {
		e.stopImmediatePropagation();
		window.open(`https://github.com/${user}`, "_blank");
	}

	return (
		<div>
			<CardClickable type="elevated" on:click={this.open}>
				<div class="matchup">
					<div class="m3-font-title-large">{this.data.title}</div>
					<div class="chips">
						<Chip type="general" icon={iconDirectionsBoat}><span class="caps">{this.data.ship_type}</span></Chip>
						<Chip type="general" icon={iconThumbsUpDown}>{this.data.rating}</Chip>
						<Chip type="general" icon={iconPerson} on:click={github}>GH: {user}</Chip>
						<Chip type="general" icon={iconBadge} on:click={slack}>Slack: {this.slackName || this.data.entrant__slack_id}</Chip>

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
