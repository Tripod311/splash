export default class TemplateCache {
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
}