import type Component from "./component.js"

export default class Slot {
	private anchor: Comment;
	private content: Component[] = [];
	private mounted: boolean = false;

	constructor (anchor: Comment) {
		this.anchor = anchor;
	}

	setContent (content: Component[]) {
		this.clear();

		this.content = content.slice();

		let lastNode: ChildNode = this.anchor;

		for (const component of this.content) {
			lastNode.after(component.DOMNode);
			lastNode = component.DOMNode;
		}

		if (this.mounted) {
			for (const component of this.content) {
				component.mounted();
			}
		}
	}

	clear (): Component[] {
		for (let component of this.content as Component[]) {
			if (this.mounted) component.unmounted();
			component.DOMNode.remove();
		}

		const toReturn = this.content;

		this.content = [];

		return toReturn;
	}

	mount () {
		this.mounted = true;

		for (const component of this.content as Component[]) {
			component.mounted();
		}
	}

	unmount () {
		this.clear();

		this.mounted = false;
	}

	push (component: Component) {
		this.content.push(component);
		if (this.content.length > 1) {
			this.content[this.content.length - 2]!.DOMNode.after(component.DOMNode);
		} else {
			this.anchor.after(component.DOMNode);
		}
		if (this.mounted) {
			component.mounted();
		}
	}

	pop (): Component | undefined {
		if (this.content.length === 0) {
			return undefined;
		}

		const toReturn = this.content.pop() as Component;
		toReturn.unmounted();
		toReturn.DOMNode.remove();
		return toReturn;
	}

	unshift (component: Component) {
		this.content.unshift(component);
		if (this.content.length > 1) {
			this.content[0]!.DOMNode.before(component.DOMNode);
		} else {
			this.anchor.after(component.DOMNode);
		}
		if (this.mounted) {
			component.mounted();
		}
	}

	shift (): Component | undefined {
		if (this.content.length === 0) {
			return undefined;
		}

		const toReturn = this.content.shift() as Component;
		toReturn.unmounted();
		toReturn.DOMNode.remove();
		return toReturn;
	}

	insert (position: number, component: Component) {
		this.content.splice(position, 0, component);
		const index = this.content.indexOf(component);
		let anchor: ChildNode;
		if (index === 0) {
			anchor = this.anchor;
		} else {
			anchor = this.content[index-1].DOMNode;
		}
		anchor.after(component.DOMNode);
		if (this.mounted) {
			component.mounted();
		}
	}

	remove (position: number): Component | undefined {
		const arr = this.content.splice(position, 1);

		if (arr.length === 0) {
			return undefined;
		} else {
			const toReturn = arr[0] as Component;
			toReturn.unmounted();
			toReturn.DOMNode.remove();
			return toReturn;
		}
	}

	getByIndex(index: number): Component | undefined {
		return this.content[index];
	}

	get length (): number {
		return this.content.length;
	}
}