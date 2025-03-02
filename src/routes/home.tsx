import { Button, ButtonLink, Card, Icon, LinearProgressIndeterminate, SegmentedButtonContainer, SegmentedButtonItem, TextField } from "m3-dreamland";
import { settings } from "../store";
import { IframeSafeList } from "../iframesafelist";

import iconRefresh from "@ktibow/iconset-material-symbols/refresh";
import iconSwapHoriz from "@ktibow/iconset-material-symbols/swap-horiz";
import { ProjectView, SubmitVoteDialog } from "./project";
import { fetchMatchup, fetchStatus, Matchup, UserInfo, fillMatchup } from "../api";

export const Link: Component<{ href: string }, { children: string }> = function() {
	this.css = `
		text-decoration: underline !important;
	`;
	return <a href={this.href} target="_blank">{this.children}</a>
}

const MatchupView: Component<{ matchup: Matchup, remove: () => void }, {
	selected: 1 | 2,
	open: boolean,

	submit: ComponentType<typeof SubmitVoteDialog>,
}> = function() {
	this.css = `
		.matchup {
			display: flex;
			gap: 0.5em;
			align-items: stretch;
		}
		.vs {
			display: flex;
			flex-direction: column;
			justify-content: center;
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
				<SubmitVoteDialog
					remove={this.remove}
					bind:selected={use(this.selected)}
					matchup={this.matchup}
					bind:open={use(this.open)}

					bind:this={use(this.submit)}
				/>
				<div class="matchup">
					<ProjectView
						data={this.matchup.one}
						sig={this.matchup.signature}
						extras={this.matchup.oneExtras}
						open={() => open(1)}
						on:analytics={(x) => { this.submit.analytics("one", x) }}
					/>
					<div class="vs m3-font-headline-small"><Icon icon={iconSwapHoriz} /></div>
					<ProjectView
						data={this.matchup.two}
						sig={this.matchup.signature}
						extras={this.matchup.twoExtras}
						open={() => open(2)}
						on:analytics={(x) => { this.submit.analytics("two", x) }}
					/>
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
			align-items: center;
		}
		.settings > * {
			flex: 1;
		}
		.settings .TextField-m3-container {
			width: 100%;
		}

		.info {
			display: flex;
			flex-direction: column;
		}
		.info-container {
			display: flex;
			flex-direction: column;
			gap: 1em;
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
	`;

	this.matchups = [];
	this.info = null;
	this.loading = false;

	const reloadInfo = async () => {
		this.info = null;
		this.infoLoading = true;
		this.info = await fetchStatus();
		this.infoLoading = false;
	}
	const loadOne = async (title: RegExp | null, username: RegExp | null) => {
		const matchup = await fetchMatchup();
		if (!matchup) return false;

		if (
			(!title || (
				!title.test(matchup.matchup.one.title) &&
				!title.test(matchup.matchup.two.title)
			)) &&
			(!username || (
				!(matchup.matchup.oneExtras.name && username.test(matchup.matchup.oneExtras.name)) &&
				!(matchup.matchup.twoExtras.name && username.test(matchup.matchup.twoExtras.name))
			))
		) {
			matchup.matchup = await fillMatchup(matchup.matchup);

			const add = {
				el: <MatchupView
					matchup={matchup.matchup}
					remove={() => {
						this.matchups = this.matchups.filter((x) => x.id !== matchup.id);
						reloadInfo();
					}}
				/>,
				id: matchup.id,
			};
			this.matchups.push(add);
			this.matchups = this.matchups;
			return true;
		} else {
			console.log("matchup was filtered out: ", matchup);
			return false;
		}
	}
	const retryOne = async (title: RegExp | null, username: RegExp | null) => {
		const catchOne = async () => {
			try {
				return await loadOne(title, username)
			} catch (err) {
				console.warn("error while retrying", err);
				return false;
			}
		};
		let refetchCount = 0;
		while (!(await catchOne())) {
			const timeout = 4000 * (Math.pow(2, refetchCount));
			console.log(`retrying once: refetchCount ${refetchCount}; timeout ${timeout}`);
			await new Promise(r => setTimeout(r, timeout));
			refetchCount++;
		}
	}
	const loadMore = async () => {
		const title = !!settings.titleFilter ? new RegExp(settings.titleFilter, 'i') : null;
		const username = !!settings.usernameFilter ? new RegExp(settings.usernameFilter, 'i') : null;
		this.loading = true;

		await reloadInfo();
		for (let i = 0; i < +settings.numToLoad; i++) {
			await retryOne(title, username);
		}

		this.loading = false;
	}
	const reload = async () => {
		this.matchups = [];
		loadMore();
	}

	const validateRegex = (x: string) => {
		try {
			new RegExp(x, 'i');
			return true;
		} catch (e) {
			return false;
		}
	}

	const newColor = () => {
		const arr = new Uint8Array(3);
		crypto.getRandomValues(arr);
		settings.color = [...arr].map(x => x.toString(16).padStart(2, '0')).join('');
	};

	const doesNotHaveToken = use(settings.token, x => {
		if (x.startsWith("%7B")) {
			settings.token = decodeURIComponent(settings.token);
			return false;
		}
		try { return !JSON.parse(x).slackId } catch (e) { console.warn(e); return true }
	});

	return (
		<div>
			<div class="m3-font-headline-large">High Seas Wonderdome</div>
			<div>
				A better <Link href="https://highseas.hackclub.com">High Seas</Link> Wonderdome client.
				Doesn't spam POST requests and minified React errors, loads more than one matchup at once, and also has more info at a glance than the official one.
				You can also filter out the personal website and tic-tac-toe slop, making it easier to vote on non-filler projects.
				Additionally, you can view and export your High Seas Airtable entry.
			</div>
			<div>
				This client uses <Link href="https://github.com/mercuryworkshop/wisp-protocol">Wisp</Link> and <Link href="https://github.com/mercuryworkshop/epoxy-tls">epoxy-tls</Link> to securely fetch the data from the client side.
				There is no backend at all, all data is fetched end-to-end encrypted on the client side with epoxy-tls.
				The Wisp proxy server sees only TLS encrypted data, and you can configure this client to use your own selfhosted Wisp server for more security.
			</div>
			<div>
				Your token (the <code>hs-session</code> cookie, use DevTools -&gt; Application -&gt; Cookies to get it) is needed to fetch matchups and submit votes as you.
			</div>

			<ButtonLink type="text" href="?tinder">Try out tinder/mobile mode!</ButtonLink>
			<ButtonLink type="text" href="?ships">Try out the shipyard!</ButtonLink>

			<Card type="elevated">
				<div class="settings-container">
					<div class="m3-font-headline-small">Settings</div>
					<div class="settings">
						<TextField name="Token (hs-session cookie)" bind:value={use(settings.token)} extraOptions={{ type: "password" }} />
						<TextField name="Wisp Server" bind:value={use(settings.wispServer)} />
						<TextField name="Number to load at once" bind:value={use(settings.numToLoad)} />
					</div>
					<ButtonLink type="text" href="https://api.saahild.com/api/highseasships/slack/oauth" extraOptions={{ target: "_blank" }}>
						Authorize vote sharing API
					</ButtonLink>
					<Button type="tonal" on:click={newColor}>
						Randomize theme color
					</Button>
					<div class="settings" on:change={(e: Event) => {
						const target = e.target as HTMLInputElement | undefined;
						settings.shareVote = target!.id.split("-")[1] as any;
					}}>
						Send to slack?
						<SegmentedButtonContainer>
							<SegmentedButtonItem
								type="radio"
								name="feedback"
								input="feedback-none"
								checked={use(settings.shareVote, x => x === "none")}
							>
								No
							</SegmentedButtonItem>
							<SegmentedButtonItem
								type="radio"
								name="feedback"
								input="feedback-public"
								checked={use(settings.shareVote, x => x === "public")}
							>
								Publicly
							</SegmentedButtonItem>
							<SegmentedButtonItem
								type="radio"
								name="feedback"
								input="feedback-anonymous"
								checked={use(settings.shareVote, x => x === "anonymous")}
							>
								Anonymously
							</SegmentedButtonItem>
						</SegmentedButtonContainer>
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
							} catch (e) {
								return "" + e;
							}
						})}
					</pre>
				</Card>
			)}

			<Card type="elevated">
				<div class="settings-container">
					<div class="m3-font-headline-small">Filtering</div>
					<div>
						All regexes are case-insensitive.
						Try using <Link href="https://regex101.com">regex101</Link> to verify that your regexes are valid.
					</div>
					<div class="settings">
						<TextField
							name="Title blacklist regex"
							bind:value={use(settings.titleFilter)}
							error={use(settings.titleFilter, x => !validateRegex(x))}
						/>
						<TextField
							name="Username blacklist regex"
							bind:value={use(settings.usernameFilter)}
							error={use(settings.usernameFilter, x => !validateRegex(x))}
						/>
					</div>
				</div>
			</Card>

			<Card type="elevated">
				<div class="m3-font-headline-small">User info</div>
				<div class="options">
					{$if(use(this.infoLoading), <LinearProgressIndeterminate />)}
					<div class="expand" />
					<Button type="filled" iconType="left" on:click={reloadInfo} disabled={doesNotHaveToken}><Icon icon={iconRefresh} />Load info</Button>
				</div>
				<div class="info-container">
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
				</div>
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
							<Button
								type="tonal"
								iconType="left"
								on:click={loadMore}
								disabled={doesNotHaveToken}
							>
								<Icon icon={iconRefresh} />
								Load even more
							</Button>

							{use(this.info, (x: UserInfo | null) => {
								if (x && x.votesRemainingForNextPendingShip !== 0) {
									return `${x.votesRemainingForNextPendingShip} votes remaining!`;
								} else {
									return null;
								}
							})}

							{$if(use(this.loading), <LinearProgressIndeterminate />)}
						</div>,
						<div class="end">
							No matchups have been fetched
						</div>
					)}
				</div>
			</Card>
		</div>
	);
};
