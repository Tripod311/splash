# Splash

Splash is a zero-dependency minimalistic UI framework that tries to achieve JSX/Vue template level of comfort without a virtual DOM.

In Splash every component is an extended DOM node with all the consequences — you can add, remove or insert them in regular DOM elements.  
That’s why it’s called **Splash** — just splash your component anywhere on the page and it will work according to its inner logic.

Splash does not separate props and state variables like other frameworks, primarily because it focuses on rendering the view only.  
That means a clear split between **component view** and **component logic**.  
Also it means that all the data passed from a parent component to its children can affect child views immediately — you just need to take it into account.

---

## Core Ideas

1. **Component = one DOM element**  
   - No ambiguities, no phantom nodes.  
   - Conditional rendering is solved inside the component.  
   - If you need a hybrid case — use `ref` and manage it manually.  

2. **Direct DOM**  
   - No virtual tree.  
   - Everything is stored and updated directly in the DOM.  
   - The browser already optimizes repaints — no need for batching.  

3. **Minimal directives**  
   Just six built-in directives:  
   - `data-ref` — reference to a specific element.  
   - `data-slot` — mount point for other components.  
   - `data-text` — reactive text.  
   - `data-html` — dynamic HTML.  
   - `data-class` — reactive classes.  
   - `data-style` — reactive styles.  
   Additionally:  
   - `data-prop-*` — reactive binding to any attribute (src, href, etc.).  

4. **Lifecycle hooks**  
   - `mounted()` — called after insertion into the DOM.  
   - `unmounted()` — called when removed.  
   - `transitionEntry()` — called after mounting + rendering (for CSS animations).  

5. **Single source of truth: state**  
   - Each component receives `options: Record<string, any>`.  
   - These turn into the component’s `state`.  
   - No props vs. state confusion — only a single object.  
   - State updates trigger view updates exactly where needed.  

6. **Errors are not hidden**  
   - Splash is not a nanny.  
   - If you create an infinite update loop, that’s your bug.  
   - Architectural mistakes are visible immediately.  

---

## Philosophy

- **No extra layers.** DOM already does everything, no need to reinvent it.  
- **Simplicity over magic.** Minimal directives, maximum predictability.  
- **Trust the developer.** If you want to work directly with DOM — go ahead.  
- **Efficiency is natural.** Browsers already batch repaints, no extra abstraction needed.  

---

## API

### 1. Component

Each component is a visible entity. You may think of it as an extension of a DOM node. Each component exposes its root DOM element via the component.DOMNode property, so you can directly manipulate it if needed.
A component must have a **template** — plain HTML with several helper directives.

**Example template (myComponent.html):**
```html
<div data-ref="container">
  <h1 data-text="header-text"></h1>
  <p>Static paragraph</p>
  <!--slot:conditionalPart-->
  <p data-style="conclusion-style">This is finishing paragraph</p>
</div>
```

**Component definition (myComponent.ts):**
```ts
import { Component } from "@tripod311/splash"
import View from "./myComponent.html?raw"
import ChildComponent from "./childComponent.js"

export default class MyComponent extends Component {
  private static componentName: string = "MyComponent";
  private static template: string = View;

  constructor (options: Record<string, any>) {
    super(options);

    // Initialize state
    this.state.setProp("header-text", "My component title");

    // Subscribe to state changes
    this.state.on("src", (newValue: any, oldValue: any) => {
      /* inner logic */
    });

    // Batch update
    this.state.update({
      diffVar1: "someValue",
      diffVar2: "someOtherValue"
    });

    // Fill slots
    this.slots["conditionalPart"].push(new ChildComponent({ var1: 1 }));
  }

  mounted () {
    super.mounted();
  }

  transitionEntry () {
    // Called after mounted + rendered → safe for CSS animations
  }

  unmounted () {
    super.unmounted();
  }
}
```

**Events:**
```ts
// Child → Parent
this.emit("click", { some: "payload" });

// Parent listens
childComponent.on("click", payload => {
  console.log(payload);
});
```

**Updating child from parent:**
```ts
childComponent.update({ color: "newColor" });
```

⚠️ Note: Each component must have a distinct `componentName`.  
Splash caches and shares templates between components with the same names.

---

### 2. Slots

Slots manage child components declaratively. They behave like arrays with lifecycle tracking.

**Example:**
```ts
const child = new ChildComponent({ ...state });
this.slots["mySlot"].setContent([child]);
```

**API:**
- `setContent(Component[])` — replace slot contents.  
- `clear(): Component[]` — unmount all and return them.  
- `push(c: Component)` — append component.  
- `pop(): Component | undefined` — remove last.  
- `unshift(c: Component)` — prepend component.  
- `shift(): Component | undefined` — remove first.  
- `inject(pos: number, c: Component)` — insert at position.  
- `remove(pos: number): Component | undefined` — remove at position.  
- `getByIndex(index: number): Component | undefined` — access without unmounting.  
- `length: number` — number of components in slot.  

---

### 3. Drops

Drops are lightweight HTML snippets stored in the `TemplateCache`.  
They are not components: no state, no lifecycle, no reactivity.  
Instead, they allow you to register small reusable pieces of HTML with the same directives (`data-ref`, `data-text`, `data-html`, `data-class`, `data-style`, `data-prop-*`).  

A drop can be **instantiated** at any moment, filled with values, and mounted into the DOM as a regular element.  

**Example template registration:**
```ts
TemplateCache.registerDrop("chatMessage", `
  <div class="msg">
    <span data-ref="author" data-text="author"></span>
    <p data-ref="text" data-html="text"></p>
  </div>
`);
```

**Creating a drop**
```ts
const drop = TemplateCache.createDrop("chatMessage", {
  author: "Alice",
  text: "<b>Hello!</b>"
});

// Access refs
console.log(drop.refs.author.innerText); // "Alice"

// Insert into DOM
document.body.appendChild(drop.node);
```

**Drop interface**
```ts
export interface Drop {
  node: Node;                         // the root DOM node
  refs: Record<string, HTMLElement>;  // all elements with data-ref
}
```

---

### 4. Mounting & Unmounting

To place a component on the page you can use the `mount` method:

```ts
import MyComponent from "./MyComponent.js";

const app = new MyComponent({ title: "Hello Splash!" });
app.mount(document.body);
```

This will append the component’s DOM node into the provided container and call its `mounted()` lifecycle hook.  

To remove a component from the page, call:

```ts
app.unmount();
```

This will remove the DOM node and call its `unmounted()` lifecycle hook.

⚠️ **Important:**  
Unmounting a component does **not** destroy its state or DOM nodes.  
The component can be mounted again into another container without losing any data:

```ts
// move component from one place to another
app.unmount();
app.mount(document.getElementById("new-container")!);
```

This behavior allows implementing modals, window managers, tab systems and other features where components may be parked and reinserted freely.

---

## Template Directives

All directives work with **string-based identifiers**. They are not evaluated — only bound.  
Initial HTML values are used to initialize state.

- `data-ref` — reference in `this.refs`.  
- `data-text` — reactive `innerText`.  
- `data-html` — reactive `innerHTML`.  
- `data-class` — array of strings for CSS classes.  
- `data-style` — object `{ [prop]: value }` for styles.  
- `data-prop-*` — any other attribute (e.g. `data-prop-src` for `<img>`).  

Current reactive values can be accessed via:
```ts
this.state.getProp("reactive-var-name")
```

---

## How it Differs from React/Vue

- No virtual DOM → simpler and faster.  
- No props/state/context zoo → just `state`.  
- No hidden batching or reconciliation → updates are explicit.  
- No “child restrictions” → developers freely manipulate the DOM.  
- Tiny core, only a few kilobytes.  

---

## Example Scenarios

- **Form:** use `data-ref` for `<input>` and plain native events. No `v-model` or controlled/uncontrolled hacks.  
- **Mount animations:** use `transitionEntry()` for CSS transitions.  
- **Conditional rendering:** mount/unmount via `data-slot`, no `v-if` or diffing logic.  

---
