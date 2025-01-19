import 'dreamland/dev';
import './index.css';

import { StyleFromParams } from 'm3-dreamland';

import { Tinder } from './routes/tinder';
import { Home } from './routes/home';
import { settings } from './store';
import { Shipyard } from './routes/ships';

const App: Component<{}, { renderRoot: HTMLElement }> = function() {
	this.css = `
		width: 100%;
		height: 100%;
	`;
	let component;
	if (new URLSearchParams(location.search).has("tinder")) {
		component = <Tinder />
	} else if (new URLSearchParams(location.search).has("ships")) {
		component = <Shipyard />
	} else {
		component = <Home />
	}
	return (
		<div>
			<StyleFromParams scheme="vibrant" contrast={0} color={use(settings.color)} />
			{component}
		</div>
	)
}

try {
	document.getElementById('app')!.replaceWith(<App />);
} catch (err) {
	document.getElementById('app')!.replaceWith(document.createTextNode("Error while rendering: " + err));
	console.warn(err);
}
