import { epoxyVersion } from "./epoxy";

export let settings: Stateful<{
	wispServer: string,
	epoxyVersion: string,
	token: string,
}> = $store(
	{
		wispServer: "wss://wisp-server-workers.r58-factories.workers.dev",
		epoxyVersion: epoxyVersion,
		token: "",
	},
	{ ident: "settings", backing: "localstorage", autosave: "auto" },
);
