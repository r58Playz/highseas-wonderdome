import { Button, ButtonLink, Card, Icon, LinearProgressIndeterminate, TextField } from "m3-dreamland";
import { defaultInfoHash, settings } from "../store";
import { IframeSafeList } from "../iframesafelist";

import iconRefresh from "@ktibow/iconset-material-symbols/refresh";
import iconSwapHoriz from "@ktibow/iconset-material-symbols/swap-horiz";
import { ProjectView, SubmitVoteDialog } from "./project";
import { fetchMatchup, fetchStatus as fetchInfo, Matchup, UserInfo } from "../api";

const MatchupView: Component<{ matchup: Matchup, remove: () => void }, {
	selected: 1 | 2,
	open: boolean,
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
	`;

	this.selected = 1;
	this.open = false;

	const open = (selected: 1 | 2) => {
		this.selected = selected;
		this.open = true;
	}

	return (
		<div>
			<Card type="filled">
				<SubmitVoteDialog remove={this.remove} bind:selected={use(this.selected)} matchup={this.matchup} bind:open={use(this.open)} />
				<div class="matchup">
					<ProjectView data={this.matchup.one} open={() => open(1)} />
					<div class="vs m3-font-headline-small"><Icon icon={iconSwapHoriz} /></div>
					<ProjectView data={this.matchup.two} open={() => open(2)} />
				</div>
			</Card>
		</div>
	)
}

export const Home: Component<{}, {
	matchups: { el: DLElement<typeof MatchupView>, id: string }[]
	info: UserInfo | null
	loading: boolean,
	infoLoading: boolean,
}> = function() {
	this.css = `
		padding: 1em;
		display: flex;
		flex-direction: column;
		gap: 1em;

		.settings-container {
			display: flex;
			flex-direction: column;
			gap: 1em;
		}
		.settings-text {
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.settings-text code {
			word-break: break-all;
		}

		.settings {
			display: flex;
			gap: 1em;
			flex-wrap: wrap;
		}
		.settings > * {
			flex: 1;
		}
		.settings .TextField-m3-container {
			width: 100%;
		}

		.info-empty {
			display: flex;
			align-items: center;
			justify-content: center;
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
		
		@media (max-width: 775px) {
			.settings-hash {
				flex-direction: column;
			}
		}
	`;

	this.matchups = [];
	this.info = null;
	this.loading = false;

	const reloadInfo = async () => {
		this.info = null;
		this.infoLoading = true;
		this.info = await fetchInfo();
		this.infoLoading = false;
	}
	const loadOne = async () => {
		const matchup = await fetchMatchup();
		if (matchup) {
			this.matchups = [...this.matchups, {
				el: <MatchupView
					matchup={matchup.matchup}
					remove={() => {
						this.matchups = this.matchups.filter((x) => x.id !== matchup.id);
						reloadInfo();
					}}
				/>,
				id: matchup.id,
			}];
		}
	}
	const loadMore = async () => {
		this.loading = true;
		const promises = [reloadInfo()];
		await new Promise(r => setTimeout(r, 50));
		for (let i = 0; i < +settings.numToLoad; i++) {
			await new Promise(r => setTimeout(r, 50));
			promises.push(loadOne());
		}
		await Promise.all(promises).catch(() => this.loading = false);
		this.loading = false;
	}
	const reload = async () => {
		this.matchups = [];
		loadMore();
	}

	const doesNotHaveToken = use(settings.token, x => { try { return !JSON.parse(x).slackId } catch (e) { console.error(e); return true } });

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

			<ButtonLink type="text" href="?tinder">Try out tinder mode!</ButtonLink>

			<Card type="elevated">
				<div class="settings-container">
					<div class="m3-font-headline-small">Settings</div>
					<div class="settings">
						<TextField name="Token (hs-session cookie)" bind:value={use(settings.token)} extraOptions={{ type: "password" }} />
						<TextField name="Wisp Server" bind:value={use(settings.wispServer)} />
						<TextField name="Number to load" bind:value={use(settings.numToLoad)} />
					</div>
					<div class="settings settings-hash">
						<div class="settings-text">
							<span>Default user info Next-Action hash: <code>{defaultInfoHash}</code></span>
						</div>
						<TextField name="User info Next-Action hash" bind:value={use(settings.infoHash)} />
					</div>
				</div>
			</Card>

			{$if(use(doesNotHaveToken),
				<Card type="elevated">
					<div>Your token was invalid</div>
					<pre>
						{use(settings.token, x => {
							try {
								if (!JSON.parse(x).slackId) {
									return "Your token parsed as a JSON object, but it did not have the fields needed";
								} else {
									return "";
								}
							} catch(e) {
								return ""+e;
							}
						})}
					</pre>
				</Card>
			)}

			<Card type="elevated">
				<div class="m3-font-headline-small">User info</div>
				<div class="options">
					{$if(use(this.infoLoading), <LinearProgressIndeterminate />)}
					<div class="expand" />
					<Button type="filled" iconType="left" on:click={reloadInfo} disabled={doesNotHaveToken}><Icon icon={iconRefresh} />Load info</Button>
				</div>
				{$if(use(this.info, x => !!x),
					<div class="info">
						<div>Blessed: {use(this.info!.blessed)}</div>
						<div>Cursed: {use(this.info!.cursed)}</div>
						<div>Votes remaining for a pending ship: {use(this.info!.votesRemainingForNextPendingShip)}</div>
						<div>Doubloons: {use(this.info!.settledTickets)}</div>
						<div>Referral link: <a href={use(this.info!.referralLink)}>{use(this.info!.referralLink)}</a></div>
					</div>,
					<div class="info-empty">
						<span>User info has not been fetched</span>
					</div>
				)}
			</Card>

			<Card type="elevated">
				<div class="m3-font-headline-small">Matchups</div>
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
