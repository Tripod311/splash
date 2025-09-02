import TemplateCache from "./templateCache.js"
import { ComponentState } from "./componentState.js"
import ReactiveText from "./reactives/reactiveText.js"
import ReactiveHTML from "./reactives/reactiveHTML.js"
import ReactiveStyle from "./reactives/reactiveStyle.js"
import ReactiveClass from "./reactives/reactiveClass.js"
import ReactiveProp from "./reactives/reactiveProp.js"
import Slot from "./slot.js"

export default class Component {
	protected static componentName: string = "";
	protected static template: string = "";

	protected state!: ComponentState;
	protected view: Node;
	protected parentElement?: HTMLElement;
	private setupAF?: ReturnType<typeof requestAnimationFrame>;

	protected refs: Map<string, HTMLElement> = new Map();
	protected slots: Map<string, Slot> = new Map();

	protected textReactives: Map<string, ReactiveText> = new Map();
	protected htmlReactives: Map<string, ReactiveHTML> = new Map();
	protected classReactives: Map<string, ReactiveClass> = new Map();
	protected styleReactives: Map<string, ReactiveStyle> = new Map();
	protected propReactives: Map<string, ReactiveProp> = new Map();

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
				this.slots.set(slotName, new Slot(comment));
				return;
			}
		} else if (root.nodeType === Node.ELEMENT_NODE) {
			const element = root as HTMLElement;

			for (const attr of Array.from(element.attributes)) {
				if (attr.name.startsWith("data-ref")) {
					this.refs.set(attr.value, element);
				}

				if (attr.name.startsWith("data-text")) {
					this.textReactives.set(attr.value, new ReactiveText(element));
				}

				if (attr.name.startsWith("data-html")) {
					this.htmlReactives.set(attr.value, new ReactiveHTML(element));
				}

				if (attr.name.startsWith("data-class")) {
					this.classReactives.set(attr.value, new ReactiveClass(element));
				}

				if (attr.name.startsWith("data-style")) {
					this.styleReactives.set(attr.value, new ReactiveStyle(element));
				}

				if (attr.name.startsWith("data-prop-")) {
					const propName = attr.name.slice("data-prop-".length);
					this.propReactives.set(attr.value, new ReactiveProp(element, propName));
				}
			}

			for (const child of Array.from(root.childNodes)) {
				this.build(child as HTMLElement);
			}
		}
	}

	protected buildState (options: Record<string, any>) {
		const base: Record<string, any> = {};

		for (const key of this.textReactives.keys()) {
			base[key] = this.textReactives.get(key)!.current();
		}
		for (const key of this.htmlReactives.keys()) {
			base[key] = this.htmlReactives.get(key)!.current();
		}
		for (const key of this.classReactives.keys()) {
			base[key] = this.classReactives.get(key)!.current();
		}
		for (const key of this.styleReactives.keys()) {
			base[key] = this.styleReactives.get(key)!.current();
		}
		for (const key of this.propReactives.keys()) {
			base[key] = this.propReactives.get(key)!.current();
		}

		this.state = new ComponentState(base);

		for (const key of this.textReactives.keys()) {
			const reactive = this.textReactives.get(key);
			this.state.on(key, reactive!.update.bind(reactive));
		}
		for (const key of this.htmlReactives.keys()) {
			const reactive = this.htmlReactives.get(key);
			this.state.on(key, reactive!.update.bind(reactive));
		}
		for (const key of this.classReactives.keys()) {
			const reactive = this.classReactives.get(key);
			this.state.on(key, reactive!.update.bind(reactive));
		}
		for (const key of this.styleReactives.keys()) {
			const reactive = this.styleReactives.get(key);
			this.state.on(key, reactive!.update.bind(reactive));
		}
		for (const key of this.propReactives.keys()) {
			const reactive = this.propReactives.get(key);
			this.state.on(key, reactive!.update.bind(reactive));
		}

		this.state.update(options);
	}

	async mounted () {
		await new Promise((resolve, reject) => {
			this.setupAF = requestAnimationFrame(resolve);	
		})
		await new Promise((resolve, reject) => {
			this.setupAF = requestAnimationFrame(resolve);	
		})
		this.setupAF = undefined;

		for (const [slotId, slot] of this.slots) {
			await slot.mount();
		}
	}

	async unmounted () {
		if (this.setupAF !== undefined) cancelAnimationFrame(this.setupAF as ReturnType<typeof requestAnimationFrame>);
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

	async unmount () {
		for (const [id, slot] of this.slots) {
			await slot.clear();
		}
		await this.unmounted();
		this.parentElement?.removeChild(this.view);
	}

	get DOMNode (): HTMLElement {
		return this.view as HTMLElement;
	}
}