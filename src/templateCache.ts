export default class TemplateCache {
	private static templates: Record<string, Node> = {};

	static compileTemplate (componentName: string, template: string): Node {
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