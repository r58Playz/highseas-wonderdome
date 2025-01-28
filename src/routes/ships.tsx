import { Button, ButtonLink, Card, CardClickable, Chip, Dialog, LinearProgressIndeterminate, TextField, TextFieldMultiline } from "m3-dreamland";
import { callAction } from "../api";
import { settings } from "../store";

import iconPaid from "@ktibow/iconset-material-symbols/paid";
import iconTimer from "@ktibow/iconset-material-symbols/timer";
import iconCalendarMonth from "@ktibow/iconset-material-symbols/calendar-month";
import iconTrophy from "@ktibow/iconset-material-symbols/trophy";
import iconUpdate from "@ktibow/iconset-material-symbols/update";
import iconThumbsUpDown from "@ktibow/iconset-material-symbols/thumbs-up-down";

type ShipType = 'project' | 'update'
type ShipStatus = 'shipped' | 'staged' | 'deleted'
type YswsType =
	| 'none'
	| 'onboard'
	| 'blot'
	| 'sprig'
	| 'bin'
	| 'hackpad'
	| 'llm'
	| 'boba'
	| 'cascade'
	| 'retrospect'
	| 'hackcraft'
	| 'cider'
	| 'browser buddy'
	| 'cargo-cult'
	| 'fraps'
	| 'riceathon'
	| 'counterspell'
	| 'anchor'
	| 'dessert'
	| 'asylum'
	| 'hackapet'
	| 'constellation'
	| 'raspi-api'
	| 'say-cheese'
	| 'minus-twelve'

type ApiShip = {
	id: string // The Airtable row's ID.
	autonumber: number
	// doubloonsPaid?: number;
	matchups_count: number
	hours: number | null
	credited_hours: number | null
	total_hours: number | null
	voteRequirementMet: boolean
	voteBalanceExceedsRequirement: boolean
	doubloonPayout: number
	shipType: ShipType
	shipStatus: ShipStatus
	wakatimeProjectNames: string[]
	createdTime: string
	updateDescription: string | null
	reshippedFromId: string | null
	reshippedToId: string | null
	reshippedAll: string[] | null
	reshippedFromAll: string[] | null
	paidOut: boolean
	yswsType: YswsType
	feedback: string | null
	isInYswsBase: boolean

	title: string
	repoUrl: string
	deploymentUrl?: string
	readmeUrl: string
	screenshotUrl: string
}

type ShipGroup = {
	title: string,
	created: Date,
	total_doubloons: number,
	total_hours: number,
	golden: boolean,
	ships: ApiShip[],
};

const EditShip: Component<{
	id: string,
	title: string,
	repoUrl: string,
	readmeUrl: string,
	deployUrl: string,
	screenshotUrl: string,
	updateDescription: string,
	yswsType: YswsType,
	open: boolean,

	reload: () => void,
}, {
	loading: boolean
}> = function() {
	this.css = `
		dialog {
			width: min(48em, calc(100vw - 1em));
			max-width: 48em !important;
		}

		.TextField-m3-container, .TextFieldMultiline-m3-container {
			width: 100%;
		}

		.actions {
			display: flex;
			gap: 1em;
		}
	`;

	this.loading = false;

	const update = async () => {
		this.loading = true;
		const ret = await callAction("src/app/harbor/shipyard/ship-utils.ts", "updateShip", {
			auth: true, args: [{
				id: this.id,
				title: this.title,
				repoUrl: this.repoUrl,
				readmeUrl: this.readmeUrl,
				deployUrl: this.deployUrl,
				screenshotUrl: this.screenshotUrl,
				updateDescription: this.updateDescription,
				yswsType: this.yswsType,
			}]
		});
		console.log(ret);
		this.loading = false;
		this.open = false;
		this.reload();
	}

	return (
		<div>
			<Dialog bind:open={use(this.open)} headline="Edit" closeOnEsc={false} closeOnClick={false}>
				<div>
					{$if(use(this.loading), <LinearProgressIndeterminate />)}
					<TextField name="Title" bind:value={use(this.title)} disabled={use(this.loading)} />
					<TextField name="Repo URL" bind:value={use(this.repoUrl)} disabled={use(this.loading)} />
					<TextField name="Readme URL" bind:value={use(this.readmeUrl)} disabled={use(this.loading)} />
					<TextField name="Demo URL" bind:value={use(this.deployUrl)} disabled={use(this.loading)} />
					<TextField name="Screenshot URL" bind:value={use(this.screenshotUrl)} disabled={use(this.loading)} />
					<TextFieldMultiline name="Update Description" bind:value={use(this.updateDescription)} disabled={use(this.loading)} />
				</div>
				<div class="actions">
					<Button type="filled" on:click={() => this.open = false} disabled={use(this.loading)}>Close</Button>
					<Button type="tonal" on:click={update} disabled={use(this.loading)}>Save</Button>
				</div>
			</Dialog>
		</div>
	)
}

const Ship: Component<{ ship: ApiShip, direct: boolean, updateIdx: number, reload: () => void, }, {
	detailsOpen: boolean,
	editOpen: boolean,
}> = function() {
	this.css = `
		.ship {
			display: flex;
			flex-direction: column;
			gap: 0.5em;
		}

		.info {
			display: flex;
			flex-direction: row;
			align-items: start;
			gap: 1em;
		}

		.details {
			display: flex;
			flex-direction: column;
			gap: 0.5em;
		}

		.image {
			max-width: 16rem;
		}

		.chips {
			display: flex;
			gap: 0.5em;
			flex-wrap: wrap;
		}

		.details-dialog dialog {
			max-width: 64rem;
		}

		.desc {
			white-space: pre-wrap;
		}

		.CardClickable-m3-container {
			width: 100%;
		}
	`;

	this.detailsOpen = false;
	this.editOpen = false;

	let shipType;
	if (this.ship.shipStatus === "staged") {
		shipType = "Staged ship"
	} else {
		shipType = this.updateIdx === 0 ? "Root ship" : `Update ${this.updateIdx}`;
	}

	const rating = ((this.ship.doubloonPayout) / (this.ship.credited_hours || 0)) * 100 / 25;

	return (
		<div>
			<div class="details-dialog">
				<Dialog bind:open={use(this.detailsOpen)} headline="Details" closeOnClick={false}>
					<div>
						{Object.entries(this.ship).map(([k, v]) => {
							return (
								<div>
									<code>{k}: {JSON.stringify(v)}</code>
								</div>
							)
						})}
					</div>
					<div>
						<Button type="tonal" on:click={() => this.detailsOpen = false}>Close</Button>
					</div>
				</Dialog>
			</div>
			<EditShip
				bind:open={use(this.editOpen)}
				id={this.ship.id}
				title={this.ship.title || ""}
				repoUrl={this.ship.repoUrl || ""}
				readmeUrl={this.ship.readmeUrl || ""}
				deployUrl={this.ship.deploymentUrl || ""}
				screenshotUrl={this.ship.screenshotUrl || ""}
				updateDescription={this.ship.updateDescription || ""}
				yswsType={this.ship.yswsType}

				reload={this.reload}
			/>
			<CardClickable type={this.direct ? "elevated" : "filled"} on:click={() => this.editOpen = true}>
				<div class="ship">
					<div class={this.direct ? "m3-font-title-large" : "m3-font-title-medium"}>{this.ship.title}</div>
					<div class="chips">
						<Chip type="general" icon={iconUpdate}>
							{shipType}
						</Chip>
						<Chip type="general" icon={iconTimer}>
							{this.ship.shipStatus === "shipped" ? (this.ship.credited_hours || 0).toFixed(2) : "Pending"}
						</Chip>
						{this.ship.shipStatus === "shipped" ?
							<Chip type="general" icon={iconPaid}>
								{this.ship.paidOut ? this.ship.doubloonPayout : `${10 - this.ship.matchups_count} matchups left`}
							</Chip>
							: null}
						{this.ship.shipStatus === "shipped" && this.ship.paidOut ?
							<Chip type="general" icon={iconPaid}>
								{(this.ship.doubloonPayout / (this.ship.credited_hours || 0)).toFixed(2)}/hr
							</Chip>
							: null}
						{this.ship.shipStatus === "shipped" && this.ship.paidOut ?
							<Chip type="general" icon={iconThumbsUpDown}>
								{rating.toFixed(2)}% Rating
							</Chip>
							: null}
						<Chip type="general" icon={iconCalendarMonth}>{new Date(this.ship.createdTime).toLocaleString()}</Chip>
						{this.ship.isInYswsBase ? <Chip type="general" icon={iconTrophy}>Golden Ship</Chip> : null}
						<Chip type="general" on:click={(e) => { e.stopImmediatePropagation(); this.detailsOpen = true }}>Details</Chip>
					</div>
					<div class="info">
						<img class="image" alt={`Image for "${this.ship.title}"`} src={this.ship.screenshotUrl} />
						<div class="details">
							{this.ship.updateDescription ? <div>
								<div class="m3-font-title-small">Update Description</div>
								<div class="desc">{this.ship.updateDescription}</div>
							</div> : null}
							{this.ship.feedback ? <div>
								<div class="m3-font-title-small">AI Feedback</div>
								{this.ship.feedback}
							</div> : null}
						</div>
					</div>
				</div>
			</CardClickable>
		</div>
	)
}

export const Shipyard: Component<{}, {
	ships: ShipGroup[],
	staged: ApiShip[],
	loading: boolean,
}> = function() {
	this.ships = [];
	this.staged = [];
	this.loading = false;

	this.css = `
		padding: 1em;
		display: flex;
		flex-direction: column;
		gap: 1em;

		.ship-groups {
			display: flex;
			flex-direction: column;
			gap: 1em;
		}

		.ship-group {
			display: flex;
			flex-direction: column;
			gap: 1em;
		}

		.chips {
			display: flex;
			gap: 0.5em;
			flex-wrap: wrap;
		}
	`;

	const load = async () => {
		this.ships = [];
		this.staged = [];
		this.loading = true;
		const id = JSON.parse(settings.token).slackId;
		const res: any[] = await callAction("src/app/utils/data.ts", "fetchShips", { args: [id], auth: true });

		let ships: ApiShip[] = res[1];
		ships.sort((a, b) => a.autonumber - b.autonumber);

		const staged = ships.filter(x => x.shipStatus === "staged");
		ships = ships.filter(x => x.shipStatus === "shipped");

		const shipGroups: ShipGroup[] = [];

		for (let ship of ships) {
			if (!ship.reshippedFromId) {
				// root ship
				shipGroups.push({
					title: ship.title,
					created: new Date(ship.createdTime),
					total_doubloons: ship.doubloonPayout || 0,
					total_hours: ship.credited_hours || 0,
					golden: ship.isInYswsBase,
					ships: [ship],
				});
			} else {
				// ship in chain, try to find
				for (const [idx, chain] of shipGroups.map((x, i) => [i, x] as const)) {
					if (chain.ships[chain.ships.length - 1].id === ship.reshippedFromId) {
						// found chain

						shipGroups[idx].total_hours += ship.credited_hours || 0;
						shipGroups[idx].total_doubloons += ship.doubloonPayout;
						shipGroups[idx].title = ship.title;
						shipGroups[idx].golden = ship.isInYswsBase;
						shipGroups[idx].ships.push(ship);

						break;
					}
				}
			}
		}

		shipGroups.sort((a, b) => +b.created - +a.created);
		this.ships = shipGroups;
		this.staged = staged;
		this.loading = false;
	};

	return (
		<div>
			<div class="m3-font-headline-large">Shipyard</div>
			<ButtonLink type="text" href="/">Go back</ButtonLink>
			<Button type="tonal" on:click={load}>Load</Button>
			{$if(use(this.loading), <LinearProgressIndeterminate />)}

			{$if(use(this.staged.length, x => x !== 0), <div class="m3-font-headline-medium">Staged</div>)}
			<div class="ship-groups">
				{use(this.staged, x => x.map(x => <Ship ship={x} updateIdx={0} direct={true} reload={load} />))}
			</div>

			{$if(use(this.ships.length, x => x !== 0), <div class="m3-font-headline-medium">Shipped</div>)}
			<div class="ship-groups">
				{use(this.ships, x => x.map(x => {
					if (x.ships.length === 1) {
						return <Ship ship={x.ships[0]} updateIdx={0} direct={true} reload={load} />;
					}

					const rating = ((x.total_doubloons) / x.total_hours) * 100 / 25;
					return (
						<Card type="elevated">
							<div class="ship-group">
								<div class="m3-font-title-large">{x.title}</div>
								<div class="chips">
									<Chip type="general" icon={iconTimer}>{x.total_hours.toFixed(2)}</Chip>
									<Chip type="general" icon={iconPaid}>{x.total_doubloons}</Chip>
									<Chip type="general" icon={iconPaid}>{(x.total_doubloons / x.total_hours).toFixed(2)}/hr</Chip>
									<Chip type="general" icon={iconThumbsUpDown}>{rating.toFixed(2)}% Rating</Chip>
									<Chip type="general" icon={iconCalendarMonth}>{x.created.toLocaleDateString()}</Chip>
									{x.golden ? <Chip type="general" icon={iconTrophy}>Golden Ship</Chip> : null}
								</div>
								{x.ships.map((x, i) => <Ship ship={x} updateIdx={i} direct={false} reload={load} />).reverse()}
							</div>
						</Card>
					)
				}))}
			</div>
		</div>
	)
}
