export type StateListener = (newValue: any, oldValue: any) => void;

export class ComponentState {
	private value: Record<string, any>;
	private listeners: Map<string, StateListener[]> = new Map();

	constructor (value: Record<string, any> = {}) {
		this.value = value;
	}

	on (propName: string, listener: StateListener) {
		if (!this.listeners.has(propName)) {
			this.listeners.set(propName, []);
		}

		this.listeners.get(propName)!.push(listener);
	}

	off (propName: string, listener: StateListener) {
		if (this.listeners.has(propName)) {
			this.listeners.set(
				propName,
				this.listeners.get(propName)!.filter(l => l !== listener)
			);
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
			if (this.listeners.has(propName)) {
				const arr = this.listeners.get(propName) as StateListener[];

				for (const l of arr) {
					l(makeCalls[propName].newValue, makeCalls[propName].oldValue);
				}
			}
		}
	}
}