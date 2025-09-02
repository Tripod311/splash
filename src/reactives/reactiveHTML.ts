import ReactiveElement from "../reactiveElement.js"

export default class ReactiveHTML extends ReactiveElement {
	protected currentHTML: string = "";

	constructor (element: HTMLElement) {
		super(element);

		this.currentHTML = element.innerHTML;
	}

	update (newValue: any, oldValue: any) {
		this.currentHTML = newValue.toString()
		this.element.innerHTML = this.currentHTML;
	}

	current (): string {
		return this.currentHTML;
	}
}