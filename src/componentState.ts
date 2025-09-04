export type StateListener = (newValue: any, oldValue: any) => void;

export class ComponentState {
	private value: Record<string, any>;
	private listeners: Record<string, StateListener[]> = {};

	constructor (value: Record<string, any> = {}) {
		this.value = value;
	}

	on (propName: string, listener: StateListener) {
		if (this.listeners[propName] === undefined) {
			this.listeners[propName] = [];
		}

		this.listeners[propName]!.push(listener);
	}

	off (propName: string, listener: StateListener) {
		if (this.listeners[propName] !== undefined) {
			this.listeners[propName] = this.listeners[propName]!.filter(l => l !== listener);
		}
	}

	update (diff: Record<string, any>) {
		const makeCalls: Record<string, { newValue: any; oldValue: any; }> = {
			"*": {
				newValue: Object.assign({}, this.value, diff),
				oldValue: Object.assign({}, this.value)
			}
		};

		for (const propName in diff) {
			makeCalls[propName] = { newValue: diff[propName], oldValue: this.value[propName] };
			this.value[propName] = diff[propName];
		}

		for (const propName in makeCalls) {
			if (this.listeners[propName] !== undefined) {
				const arr = this.listeners[propName] as StateListener[];

				for (const l of arr) {
					l(makeCalls[propName].newValue, makeCalls[propName].oldValue);
				}
			}
		}
	}

	getProps (): Record<string, any> {
		return this.value;
	}

	getProp (propName: string): any {
		return this.value[propName];
	}

	setProp (propName: string, propValue: any) {
		const oldValue = this.value[propName];
		this.value[propName] = propValue;

		if (this.listeners[propName] !== undefined) {
			const arr = this.listeners[propName] as StateListener[];

			for (const l of arr) {
				l(propValue, oldValue);
			}
		}
	}
}