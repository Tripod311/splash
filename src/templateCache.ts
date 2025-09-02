export default class TemplateCache {
	private static templates: Map<string, Node> = new Map();

	static compileTemplate (componentName: string, template: string): Node {
		const root = document.createElement("div");
		root.innerHTML = template;
		const compiled = root.firstElementChild as Node;
		TemplateCache.templates.set(componentName, compiled);
		return compiled.cloneNode(true);
	}

	static getTemplate (componentName: string): Node | null {
		return TemplateCache.templates.get(componentName)?.cloneNode(true) || null;
	}
}