export interface Drop {
	node: HTMLElement;
	refs: Record<string, HTMLElement>;
}

export class TemplateCache {
	private static drops: Record<string, HTMLElement> = {};
	private static templates: Record<string, Node> = {};

	static compileTemplate (componentName: string, template: string): Node {
		if (componentName in TemplateCache.templates) {
			console.warn(`TemplateCache already contains template with name ${componentName}`);
		}

		const root = document.createElement("div");
		root.innerHTML = template;
		const compiled = root.firstElementChild as Node;
		TemplateCache.templates[componentName] = compiled;
		return compiled.cloneNode(true);
	}

	static getTemplate (componentName: string): Node | null {
		return TemplateCache.templates[componentName]?.cloneNode(true) || null;
	}

	static registerDrop (dropName: string, template: string) {
		if (dropName in TemplateCache.drops) {
			console.warn(`TemplateCache already contains drop with name ${dropName}`);
		}

		const root = document.createElement("div");
		root.innerHTML = template;
		const compiled = root.firstElementChild as HTMLElement;
		TemplateCache.drops[dropName] = compiled;
	}

	static createDrop (dropName: string, fill: Record<string, any> = {}): Drop | null {
		if (TemplateCache.drops[dropName] === undefined) return null;

		const result = {
			node: TemplateCache.drops[dropName].cloneNode(true) as HTMLElement,
			refs: {}
		};

		if (fill !== undefined) {
			TemplateCache.fillDrop(result, result.node, fill);
		}

		return result;
	}

	private static fillDrop (drop: Drop, root: Node, fill: Record<string, any>) {
		if (root.nodeType !== Node.ELEMENT_NODE) return;

		const element = root as HTMLElement;

		for (const attr of Array.from(element.attributes)) {
			if (attr.name === "data-ref") {
				drop.refs[attr.value] = element;
			}

			if (attr.name === "data-text") {
				if (fill[attr.value] !== undefined) {
					element.innerText = fill[attr.value];
				}
			}

			if (attr.name === "data-html") {
				if (fill[attr.value] !== undefined) {
					element.innerHTML = fill[attr.value];
				}
			}

			if (attr.name === "data-class") {
				if (fill[attr.value] !== undefined) {
					element.className = fill[attr.value].join(' ');
				}
			}

			if (attr.name === "data-style") {
				if (fill[attr.value] !== undefined) {
					const styles = fill[attr.value];

					for (const key in styles) {
						element.style.setProperty(key, styles[key].toString());
					}
				}
			}

			if (attr.name.startsWith("data-prop-")) {
				const propName = attr.name.slice("data-prop-".length);
				if (fill[attr.value] !== undefined) {
					element.setAttribute(propName, fill[attr.value]);
				}
			}
		}

		for (const child of Array.from(root.childNodes)) {
			TemplateCache.fillDrop(drop, child, fill);
		}
	}
}