import ReactiveElement from "../reactiveElement.js"

export default class ReactiveClass extends ReactiveElement {
	protected currentClasses: string[] = [];

	constructor (element: HTMLElement) {
		super(element);

		this.currentClasses = Array.from(element.classList);
	}

	update (newValue: any, oldValue: any) {
		if (!Array.isArray(newValue)) throw new Error("ReactiveClass::update accepts only string[]");

		this.currentClasses = (newValue as any[]).map(c => c.toString());

		this.element.className = this.currentClasses.join(" ");
	}

	current (): string[] {
		return this.currentClasses.slice();
	}
}