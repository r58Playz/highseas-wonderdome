import { Button, CircularProgressIndeterminate, Icon } from "m3-dreamland";
import { ProjectView, SubmitVoteDialog } from "./project";
import iconSwapVert from "@ktibow/iconset-material-symbols/swap-vert";
import { fetchMatchup, Matchup } from "../api";

export const Tinder: Component<{}, {
	loading: boolean,
	selected: 1 | 2,
	matchup: Matchup,
}> = function() {
	this.css = `
		width: 100%;
		height: 100%;

		.loading {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
		}

		.match {
			box-sizing: border-box;
			padding: 0.5em;
			width: 100%;
			display: flex;
			flex-direction: column;
			gap: 0.5em;
		}
		
		.Button-m3-container {
			width: 100%;
		}

		.vs {
			display: flex;
			justify-content: center;
		}
	`;

	this.matchup = null!;
	this.selected = 1;

	const loadNext = async () => {
		this.loading = true;
		let matchup;
		while (!matchup) {
			console.log("trying");
			matchup = await fetchMatchup();
		}
		this.matchup = matchup.matchup;
		this.loading = false;
	}
	loadNext();

	return (
		<div>
			{$if(use(this.loading),
				<div class="loading">
					<CircularProgressIndeterminate />
					<div>
						Loading your next personalized match
					</div>
				</div>,
				<div class="match">
					{use(this.matchup, x => {
						if (x) {
							const dialogOpen = $state({ open: false });
							const open = (selected: 1 | 2) => {
								this.selected = selected;
								dialogOpen.open = true;
							}
							// @ts-expect-error
							return <>
								<SubmitVoteDialog
									matchup={x}
									remove={() => { loadNext() }}
									bind:selected={use(this.selected)}
									bind:open={use(dialogOpen.open)}
								/>
								<ProjectView data={x.one} slackName={x.oneName} open={() => open(1)} />
								<div class="vs">
									<Icon icon={iconSwapVert} />
								</div>
								<ProjectView data={x.two} slackName={x.twoName} open={() => open(2)} />
								<Button type="elevated" on:click={() => { loadNext() }}>Both of these suck</Button>
							</>

						}
					})}
				</div>
			)}
		</div>
	)
}
