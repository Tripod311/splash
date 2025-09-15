import { TemplateCache } from "./templateCache.js"
import { ComponentState } from "./componentState.js"
import ReactiveText from "./reactives/reactiveText.js"
import ReactiveHTML from "./reactives/reactiveHTML.js"
import ReactiveStyle from "./reactives/reactiveStyle.js"
import ReactiveClass from "./reactives/reactiveClass.js"
import ReactiveProp from "./reactives/reactiveProp.js"
import Slot from "./slot.js"

type EventListener = (payload: any) => void;

export default class Component {
	protected static componentName: string = "";
	protected static template: string = "";

	protected state!: ComponentState;
	protected view: Node;
	protected parentElement?: HTMLElement;
	private setupAF?: ReturnType<typeof requestAnimationFrame>;

	protected refs: Record<string, HTMLElement> = {};
	protected slots: Record<string, Slot> = {};

	protected textReactives: Record<string, ReactiveText> = {};
	protected htmlReactives: Record<string, ReactiveHTML> = {};
	protected classReactives: Record<string, ReactiveClass> = {};
	protected styleReactives: Record<string, ReactiveStyle> = {};
	protected propReactives: Record<string, ReactiveProp> = {};

	protected listeners: Record<string, EventListener[]> = {};

	constructor (options: Record<string, any>) {
		const ctor = this.constructor as typeof Component;

		const template = TemplateCache.getTemplate(ctor.componentName);

		if (template === null) {
			this.view = TemplateCache.compileTemplate(ctor.componentName, ctor.template);
		} else {
			this.view = template as Node;
		}

		this.build(this.view);
		this.buildState(options);
	}

	protected build (root: Node) {
		if (root.nodeType === Node.COMMENT_NODE) {
			const comment = root as Comment;
			if (comment.data.startsWith("slot:")) {
				const slotName = comment.data.slice("slot:".length);
				this.slots[slotName] = new Slot(comment);
				return;
			}
		} else if (root.nodeType === Node.ELEMENT_NODE) {
			const element = root as HTMLElement;

			for (const attr of Array.from(element.attributes)) {
				if (attr.name === "data-ref") {
					this.refs[attr.value] = element;
				}

				if (attr.name === "data-text") {
					this.textReactives[attr.value] = new ReactiveText(element);
				}

				if (attr.name === "data-html") {
					this.htmlReactives[attr.value] = new ReactiveHTML(element);
				}

				if (attr.name === "data-class") {
					this.classReactives[attr.value] = new ReactiveClass(element);
				}

				if (attr.name === "data-style") {
					this.styleReactives[attr.value] = new ReactiveStyle(element);
				}

				if (attr.name.startsWith("data-prop-")) {
					const propName = attr.name.slice("data-prop-".length);
					this.propReactives[attr.value] = new ReactiveProp(element, propName);
				}
			}

			for (const child of Array.from(root.childNodes)) {
				this.build(child as HTMLElement);
			}
		}
	}

	protected buildState (options: Record<string, any>) {
		const base: Record<string, any> = {};

		for (const key in this.textReactives) {
			base[key] = this.textReactives[key]!.current();
		}
		for (const key in this.htmlReactives) {
			base[key] = this.htmlReactives[key]!.current();
		}
		for (const key in this.classReactives) {
			base[key] = this.classReactives[key]!.current();
		}
		for (const key in this.styleReactives) {
			base[key] = this.styleReactives[key]!.current();
		}
		for (const key in this.propReactives) {
			base[key] = this.propReactives[key]!.current();
		}

		this.state = new ComponentState(base);

		for (const key in this.textReactives) {
			const reactive = this.textReactives[key];
			this.state.on(key, reactive!.update.bind(reactive));
		}
		for (const key in this.htmlReactives) {
			const reactive = this.htmlReactives[key];
			this.state.on(key, reactive!.update.bind(reactive));
		}
		for (const key in this.classReactives) {
			const reactive = this.classReactives[key];
			this.state.on(key, reactive!.update.bind(reactive));
		}
		for (const key in this.styleReactives) {
			const reactive = this.styleReactives[key];
			this.state.on(key, reactive!.update.bind(reactive));
		}
		for (const key in this.propReactives) {
			const reactive = this.propReactives[key];
			this.state.on(key, reactive!.update.bind(reactive));
		}

		this.state.update(options);
	}

	mounted () {
		this.setupAF = requestAnimationFrame(() => {
			this.setupAF = requestAnimationFrame(() => {
				this.transitionReady();
				this.setupAF = undefined;
			})
		});

		for (const id in this.slots) {
			this.slots[id].mount();
		}
	}

	transitionReady () {
		// place where you can start all css animations
	}

	unmounted () {
		if (this.setupAF !== undefined) cancelAnimationFrame(this.setupAF as ReturnType<typeof requestAnimationFrame>);
		for (const id in this.slots) {
			this.slots[id].unmount();
		}
	}

	update (diff: Record<string, any>) {
		this.state.update(diff);
	}

	mount (parentElement: HTMLElement) {
		this.parentElement = parentElement;
		this.parentElement.appendChild(this.view);
		(this.view as HTMLElement).offsetWidth;
		this.mounted();
	}

	unmount () {
		this.unmounted();
		this.parentElement?.removeChild(this.view);
	}

	get DOMNode (): HTMLElement {
		return this.view as HTMLElement;
	}

	on (eventName: string, listener: EventListener) {
		if (!this.listeners[eventName]) {
			this.listeners[eventName] = [];
		}

		const arr = this.listeners[eventName] as EventListener[];

		arr.push(listener);
	}

	off (eventName: string, listener: EventListener) {
		const arr = this.listeners[eventName];

		if (arr !== undefined) {
			const lArr = arr as EventListener[];

			const index = lArr.indexOf(listener);

			if (index !== -1) {
				lArr.splice(index, 1);
				if (lArr.length === 0) {
					delete this.listeners[eventName];
				}
			}
		}
	}

	emit (eventName: string, payload: any) {
		const arr = this.listeners[eventName];

		if (arr !== undefined) {
			const lArr = (arr as EventListener[]).slice();

			for (const listener of lArr) {
				listener(payload);
			}
		}
	}
}