import type Component from "./component.js"

export default class Slot {
	private anchor: Comment;
	private content: Component | Component[] | null = null;
	private mounted: boolean = false;

	constructor (anchor: Comment) {
		this.anchor = anchor;
	}

	async setContent (content: Component | Component[]) {
		await this.clear();

		if (Array.isArray(content)) {
			this.content = content as Component[];

			let lastNode: ChildNode = this.anchor;

			for (const component of this.content) {
				lastNode.after(component.DOMNode);
				lastNode = component.DOMNode;
			}

			if (this.mounted) {
				for (const component of this.content) {
					await component.mounted();
				}
			}
		} else {
			this.content = content as Component;
			this.anchor.after(this.content.DOMNode);
			if (this.mounted) {
				await this.content.mounted();
			}
		}
	}

	async clear () {
		if (this.content === null) return;

		if (Array.isArray(this.content)) {
			for (let component of this.content as Component[]) {
				await component.unmounted();
				component.DOMNode.remove();
			}
		} else {
			await (this.content as Component).unmounted();
		}

		this.content = null;
	}

	async mount () {
		this.mounted = true;

		if (this.content === null) return;

		if (Array.isArray(this.content)) {
			for (const component of this.content as Component[]) {
				await component.mounted();
			}
		} else {
			await (this.content as Component).mounted();
		}
	}
}