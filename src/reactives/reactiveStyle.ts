import ReactiveElement from "../reactiveElement.js"

export default class ReactiveStyle extends ReactiveElement {
	protected currentStyle: Record<string, string> = {};

	constructor (element: HTMLElement) {
		super(element);

		for (let i=0; i<element.style.length; i++) {
			const propName = element.style[i];
			this.currentStyle[propName] = element.style.getPropertyValue(propName);
		}
	}

	update (newValue: any, oldValue: any) {
		if (typeof newValue !== 'object') throw new Error("ReactiveStyle::update accepts only Record<string, string> | null");

		if (newValue === null || newValue === undefined) {
			for (const propName in this.currentStyle) {
				this.element.style.removeProperty(propName);
				delete this.currentStyle[propName];
			}
		} else {
			const newStyles = newValue as Record<string, string>;

			const keySet = Object.keys(this.currentStyle).concat(Object.keys(newStyles));

			for (const key of keySet) {
				if (newStyles[key] === undefined) {
					this.element.style.removeProperty(key);
					delete this.currentStyle[key];
				} else {
					this.element.style.setProperty(key, newStyles[key].toString());
					this.currentStyle[key] = newStyles[key].toString();
				}
			}
		}
	}

	current (): Record<string, string> {
		return Object.assign({}, this.currentStyle);
	}
}