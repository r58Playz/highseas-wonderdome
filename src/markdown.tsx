import DOMPurify from "dompurify";
import { marked } from "marked";

export const Markdown: Component<{ text: string }, {}> = function() {
	this.mount = () => {
		useChange([this.text], async () => {
			const replaced = this.text.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, "");
			this.root.innerHTML = DOMPurify.sanitize(marked(replaced, { async: false }));
		});
	}
	return <div />
}
