import { epoxyVersion } from "./epoxy";

export const defaultInfoHash = "d483dc862f183641a65ff7b18ad1b9f1b4e4d49d";

export let settings: Stateful<{
	wispServer: string,
	epoxyVersion: string,
	numToLoad: string,
	token: string,

	infoHash: string,

	titleFilter: string,
	usernameFilter: string,
}> = $store(
	{
		wispServer: "wss://anura.pro/",
		epoxyVersion: epoxyVersion,
		numToLoad: "10",
		token: "",

		infoHash: defaultInfoHash,

		titleFilter: "",
		usernameFilter: "",
		updateFilter: false
	},
	{ ident: "settings", backing: "localstorage", autosave: "auto" },
);

if (!settings.titleFilter) settings.titleFilter = "";
if (!settings.usernameFilter) settings.usernameFilter = "";
if (!settings.infoHash) settings.infoHash = defaultInfoHash;

// @ts-ignore
window.settings = settings;
