import ReactiveElement from "../reactiveElement.js"

export default class ReactiveProp extends ReactiveElement {
	protected propName: string;
	protected currentValue: string | null;

	constructor (element: HTMLElement, propName: string) {
		super(element);

		this.propName = propName;

		if (element.hasAttribute(propName)) {
			this.currentValue = element.getAttribute(this.propName);
		} else {
			this.currentValue = null;
		}
	}

	update (newValue: any, oldValue: any) {
		if (newValue === null) {
			this.currentValue = null;

			this.element.removeAttribute(this.propName);
		} else {
			this.currentValue = newValue.toString();

			this.element.setAttribute(this.propName, this.currentValue as string);
		}
	}

	current (): string | null {
		return this.currentValue;
	}
}