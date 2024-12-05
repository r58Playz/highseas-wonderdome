import 'dreamland/dev';
import { Route, Router } from 'dreamland-router';
import Home from './routes/home';

import './index.css';
import { StyleFromParams } from 'm3-dreamland';
let router = new Router(
	<Route>
		<Route path="" show={<Home />} />
	</Route>
);

const App: Component<{}, { renderRoot: HTMLElement }> = function() {

	this.mount = () => {
		router.mount(this.renderRoot);
	}

	return (
		<div>
			<StyleFromParams scheme="vibrant" contrast={0} color="CBA6F7" />
			<div bind:this={use(this.renderRoot)} />
		</div>
	)
}

try {
	document.getElementById('app')!.replaceWith(<App />);
} catch (err) {
	document.getElementById('app')!.replaceWith(document.createTextNode("Error while rendering: " + err));
	console.error(err);
}
