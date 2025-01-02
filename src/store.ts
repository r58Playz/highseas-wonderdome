import { epoxyVersion } from "./epoxy";

export let settings: Stateful<{
	wispServer: string,
	epoxyVersion: string,
	numToLoad: string,
	token: string,

	titleFilter: string,
	usernameFilter: string,
}> = $store(
	{
		wispServer: "wss://anura.pro/",
		epoxyVersion: epoxyVersion,
		numToLoad: "10",
		token: "",

		titleFilter: "",
		usernameFilter: "",
		updateFilter: false
	},
	{ ident: "settings", backing: "localstorage", autosave: "auto" },
);

if (!settings.titleFilter) settings.titleFilter = "";
if (!settings.usernameFilter) settings.usernameFilter = "";

// @ts-ignore
window.settings = settings;
