import { epoxyVersion } from "./epoxy";

export let settings: Stateful<{
	wispServer: string,
	epoxyVersion: string,
	numToLoad: string,
	token: string,
}> = $store(
	{
		wispServer: "wss://anura.pro/",
		epoxyVersion: epoxyVersion,
		numToLoad: "10",
		token: "",
	},
	{ ident: "settings", backing: "localstorage", autosave: "auto" },
);
