import ReactiveElement from "../reactiveElement.js"

export default class ReactiveText extends ReactiveElement {
	protected currentText: string = "";

	constructor (element: HTMLElement) {
		super(element);

		this.currentText = element.innerText;
	}

	update (newValue: any, oldValue: any) {
		this.currentText = newValue ? newValue.toString() : "";
		this.element.innerText = this.currentText;
	}

	current (): string {
		return this.currentText;
	}
}