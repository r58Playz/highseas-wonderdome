function difference(a: string[], b: string[]) {
	return a.filter(x => !b.includes(x));
}

export const IframeSafeList: Component<{ list: { el: HTMLElement, id: string }[], class: string }, { oldList: string[] }> = function() {
	this.oldList = [];
	this.mount = () => {
		useChange([this.list], () => {
			const ids = this.list.map(({ id }) => id);
			const removed = difference(this.oldList, ids);
			const added = difference(ids, this.oldList);
			for (const id of removed) {
				this.root.querySelector(`[data-id="${id}"]`)?.remove();
			}
			for (const id of added) {
				const el = this.list.find(({ id: x }) => x === id)!;
				el.el.setAttribute("data-id", id);
				this.root.appendChild(el.el);
			}
			this.oldList = ids;
		});
	};
	return <div class={this.class}></div>;
}
