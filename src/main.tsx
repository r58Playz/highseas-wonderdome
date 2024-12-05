import 'dreamland/dev';
import Home from './routes/home';

import './index.css';
import { StyleFromParams } from 'm3-dreamland';

const App: Component<{}, { renderRoot: HTMLElement }> = function() {
	return (
		<div>
			<StyleFromParams scheme="vibrant" contrast={0} color="CBA6F7" />
			<Home />
		</div>
	)
}

try {
	document.getElementById('app')!.replaceWith(<App />);
} catch (err) {
	document.getElementById('app')!.replaceWith(document.createTextNode("Error while rendering: " + err));
	console.error(err);
}
