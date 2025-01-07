import { Button, CircularProgressIndeterminate, Icon } from "m3-dreamland";
import { ProjectView, SubmitVoteDialog } from "./project";
import iconSwapVert from "@ktibow/iconset-material-symbols/swap-vert";
import { fetchMatchup, fillMatchup, Matchup } from "../api";

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
		matchup.matchup = await fillMatchup(matchup.matchup);
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
							const state: Stateful<{
								open: boolean,
								el: ComponentType<typeof SubmitVoteDialog>
							}> = $state({ open: false, el: null!, });
							const open = (selected: 1 | 2) => {
								this.selected = selected;
								state.open = true;
							}
							// @ts-expect-error
							return <>
								<SubmitVoteDialog
									matchup={x}
									remove={() => { loadNext() }}
									bind:selected={use(this.selected)}
									bind:open={use(state.open)}

									bind:this={use(state.el)}
								/>
								<ProjectView
									data={x.one}
									extras={x.oneExtras}
									open={() => open(1)}
									on:analytics={(x) => { state.el.analytics("one", x) }}
								/>
								<div class="vs">
									<Icon icon={iconSwapVert} />
								</div>
								<ProjectView
									data={x.two}
									extras={x.twoExtras}
									open={() => open(2)}
									on:analytics={(x) => { state.el.analytics("two", x) }}
								/>
								<Button type="elevated" on:click={() => { loadNext() }}>Both of these suck</Button>
							</>

						}
					})}
				</div>
			)}
		</div>
	)
}
