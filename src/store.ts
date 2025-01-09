import { epoxyVersion } from "./epoxy";

export let settings: Stateful<{
	wispServer: string,
	epoxyVersion: string,
	numToLoad: string,
	token: string,
	color: string,

	shareVote: "none" | "public" | "anonymous",

	titleFilter: string,
	usernameFilter: string,
}> = $store(
	{
		wispServer: "wss://anura.pro/",
		epoxyVersion: epoxyVersion,
		numToLoad: "10",
		token: "",
		color: "CBA6F7",

		shareVote: "none",

		titleFilter: "",
		usernameFilter: "",
	},
	{ ident: "settings", backing: "localstorage", autosave: "auto" },
);

if (!settings.titleFilter) settings.titleFilter = "";
if (!settings.usernameFilter) settings.usernameFilter = "";
if (!settings.shareVote) settings.shareVote = "none";
if (!settings.color) settings.color = "CBA6F7";

// @ts-ignore
window.settings = settings;
