export default class ReactiveElement {
	protected element: HTMLElement;

	constructor (element: HTMLElement) {
		this.element = element;
	}

	update (newValue: any, oldValue: any) {
		// abstract method
	}

	current (): any {
		// abstract
	}
}