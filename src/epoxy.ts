import epoxyInit, { EpoxyClient, EpoxyClientOptions, info as epoxyInfo } from "@mercuryworkshop/epoxy-tls/minimal-epoxy";
import { settings } from "./store";

export let epoxyVersion = epoxyInfo.version;

const EPOXY_PATH = "/epoxy/epoxy.wasm";

let cache: Cache;
let initted: boolean = false;

let currentClient: EpoxyClient;
let currentWispUrl: string;

async function evictEpoxy() {
	if (!cache) cache = await window.caches.open("classlinkv2-epoxy");
	await cache.delete(EPOXY_PATH);
}

async function instantiateEpoxy() {
	if (!cache) cache = await window.caches.open("classlinkv2-epoxy");
	if (!await cache.match(EPOXY_PATH)) {
		await cache.add(EPOXY_PATH);
	}
	const module = await cache.match(EPOXY_PATH);
	await epoxyInit({ module_or_path: module });
	initted = true;
}

export async function createEpoxy() {
	let options = new EpoxyClientOptions();
	options.user_agent = navigator.userAgent;
	options.udp_extension_required = false;

	currentWispUrl = settings.wispServer;
	currentClient = new EpoxyClient(settings.wispServer, options);
}

export async function fetch(url: string, options?: any): Promise<Response> {
	if (!initted) {
		if (epoxyVersion === settings.epoxyVersion) {
			await instantiateEpoxy();
		} else {
			await evictEpoxy();
			await instantiateEpoxy();
		}
	}

	if (currentWispUrl !== settings.wispServer) {
		await createEpoxy();
	}
	try {
		return await currentClient.fetch(url, options);
	} catch (err2) {
		let err = err2 as Error;
		console.log(err);

		if (err.message.includes("Wisp server closed: Throttled")) {
			console.log("retrying, wisp-server-workers throttled us");
			// wisp-server-workers thing, just clear all of the streams by reconnecting
			currentClient.replace_stream_provider();
			return await fetch(url, options);
		}

		throw err;
	}
}
