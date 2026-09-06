# Splash

Splash is a small, zero-dependency UI library built around direct DOM rendering. It aims to provide a component-oriented development experience without introducing a virtual DOM or a separate rendering tree.

Each Splash component owns a single root DOM element. Components can be mounted into slots or regular DOM containers, moved between containers, and accessed through their underlying DOM nodes when direct control is useful.

Splash uses a deliberately compact model: component inputs and local values live in one state object, while templates describe how selected state fields are reflected in the DOM. This approach is designed for small applications and interfaces where a lightweight abstraction and explicit DOM behavior are more useful than a larger framework ecosystem.

Splash is also a practical exploration of component lifecycle, selective reactivity, template caching, and direct DOM updates. It is not intended as a drop-in replacement for established production frameworks; it represents a different set of trade-offs tailored to the author's own projects.

---

## Core ideas

### One root element per component

Every component owns one root DOM element. This gives the component a clear position in the document and allows it to be mounted, moved, or removed as a single unit.

Conditional content is normally handled through slots. When lower-level control is needed, elements can also be accessed through refs or the component's root node.

### Direct DOM rendering

Splash stores and updates the rendered view directly in the DOM. It does not maintain a virtual representation or perform reconciliation.

Reactive directives update only the elements bound to the state field that changed. Splash does not add its own scheduling layer, so update timing remains explicit and follows normal browser DOM behavior.

### A small directive set

Splash provides a limited set of template directives:

- `data-ref` — stores a reference to an element.
- `data-slot` — declares a mount point for child components.
- `data-text` — binds a state value to `innerText`.
- `data-html` — binds a state value to `innerHTML`.
- `data-class` — binds an array of CSS classes.
- `data-style` — binds an object of inline styles.
- `data-prop-*` — binds a value to an HTML attribute such as `src` or `href`.

Directive values are identifiers, not JavaScript expressions. Application logic remains in the component class.

### Component lifecycle

Components can respond to three lifecycle stages:

- `mounted()` — called after the component is inserted into the DOM.
- `transitionReady()` — called after mounting and initial rendering, allowing CSS transitions to begin.
- `unmounted()` — called when the component is unmounted.

### One component state object

Each component receives an `options: Record<string, any>` object, which is used to initialize its state. Splash does not create separate props and local-state systems.

State fields can be updated individually or as a group. Only directives bound to changed fields are updated.

### Explicit behavior

Splash keeps its update model intentionally small. State changes, DOM access, and component relationships remain visible in application code. The library provides lifecycle and rendering primitives while leaving broader architecture decisions to the application.

---

## API

### 1. Components

A component combines a template, a state object, lifecycle hooks, and one root DOM element. The root is available through `component.DOMNode` when direct DOM access is required.

A component template is regular HTML with optional Splash directives.

**Example template (`myComponent.html`):**

```html
<div data-ref="container">
  <h1 data-text="header-text"></h1>
  <p>Static paragraph</p>
  <!--slot:conditionalPart-->
  <p data-style="conclusion-style">This is the final paragraph.</p>
</div>
```

**Component definition (`myComponent.ts`):**

```ts
import { Component } from "@tripod311/splash";
import View from "./myComponent.html?raw";
import ChildComponent from "./childComponent.js";

export default class MyComponent extends Component {
  private static componentName: string = "MyComponent";
  private static template: string = View;

  constructor (options: Record<string, any>) {
    super(options);

    // Update one state field.
    this.state.setProp("header-text", "My component title");

    // Observe a state field.
    this.state.on("src", (newValue: any, oldValue: any) => {
      // Component-specific logic.
    });

    // Update several fields together.
    this.state.update({
      diffVar1: "someValue",
      diffVar2: "someOtherValue"
    });

    // Add a child component to a slot.
    this.slots.conditionalPart.push(
      new ChildComponent({ var1: 1 })
    );
  }

  mounted () {
    super.mounted();
  }

  transitionReady () {
    // The component is mounted and ready for CSS transitions.
  }

  unmounted () {
    super.unmounted();
  }
}
```

Each component class must have a distinct `componentName`. Splash uses this name as the key for its shared template cache.

#### Component events

Components can emit and subscribe to application-level events:

```ts
// Child component
this.emit("click", { some: "payload" });

// Parent component
childComponent.on("click", payload => {
  console.log(payload);
});
```

#### Updating a child component

```ts
childComponent.update({
  color: "newColor"
});
```

### 2. Slots

Slots are ordered collections of child components associated with mount points in a template. They manage insertion, removal, and the corresponding component lifecycle calls.

```ts
const child = new ChildComponent({
  title: "Child component"
});

this.slots.mySlot.setContent([child]);
```

Slot API:

- `setContent(components: Component[])` — replaces the current contents.
- `clear(): Component[]` — unmounts and returns all components.
- `push(component: Component)` — appends a component.
- `pop(): Component | undefined` — removes the last component.
- `unshift(component: Component)` — prepends a component.
- `shift(): Component | undefined` — removes the first component.
- `inject(position: number, component: Component)` — inserts a component at a specified position.
- `remove(position: number): Component | undefined` — removes a component at a specified position.
- `getByIndex(index: number): Component | undefined` — returns a component without removing it.
- `length: number` — returns the number of components in the slot.

### 3. Drops

Drops are lightweight reusable HTML fragments stored in `TemplateCache`. They support the same element-binding directives as component templates but do not have component state, events, or lifecycle hooks.

A drop can be created, populated with initial values, and inserted into the DOM as a regular node.

#### Registering a drop

```ts
TemplateCache.registerDrop("chatMessage", `
  <div class="msg">
    <span data-ref="author" data-text="author"></span>
    <p data-ref="text" data-html="text"></p>
  </div>
`);
```

#### Creating a drop

The second argument is optional and can be used to populate the drop's directives:

```ts
const drop = TemplateCache.createDrop("chatMessage", {
  author: "Alice",
  text: "<b>Hello!</b>"
});

console.log(drop.refs.author.innerText);

document.body.appendChild(drop.node);
```

Drop interface:

```ts
export interface Drop {
  node: Node;
  refs: Record<string, HTMLElement>;
}
```

Values passed to `data-html` are assigned through `innerHTML`. Do not use unsanitized user-provided content with this directive.

### 4. Generic components

Generic components provide component lifecycle and slot compatibility without requiring a dedicated component class and template file.

They are useful when a slot may contain either a regular component or a small piece of interface such as an empty-state or error message.

```ts
const result = await someAsyncRequest();

if (!result.error) {
  this.slots.content.push(
    new MyRegularComponent({})
  );
} else {
  const errorDrop = TemplateCache.createDrop("errorMessage");

  this.slots.content.push(
    Component.generic(
      { text: result.details },
      errorDrop.node
    )
  );
}
```

This keeps the slot API consistent: every slot contains components, while simple DOM fragments can be wrapped only when lifecycle-aware mounting is needed.

### 5. Mounting and unmounting

Use `mount()` to append a component to a DOM container:

```ts
import MyComponent from "./MyComponent.js";

const app = new MyComponent({
  title: "Hello Splash!"
});

app.mount(document.body);
```

Mounting inserts the component's root node and calls its `mounted()` lifecycle hook.

Use `unmount()` to remove it:

```ts
app.unmount();
```

Unmounting does not destroy the component's state or DOM tree. The same instance can later be mounted into another container:

```ts
app.unmount();
app.mount(
  document.getElementById("new-container")!
);
```

This behavior is useful for interfaces such as modal systems, tabs, movable panels, and window managers.

When lifecycle hooks matter, prefer `mount()`, `unmount()`, and slots over manipulating `component.DOMNode` directly.

---

## Template directives

Directive values are string identifiers. Splash binds them to state fields but does not evaluate them as expressions.

- `data-ref` — exposes an element through `this.refs`.
- `data-text` — assigns a value through `innerText`.
- `data-html` — assigns a value through `innerHTML`.
- `data-class` — applies an array of CSS class names.
- `data-style` — applies an object in the form `{ [property]: value }`.
- `data-prop-*` — binds another HTML attribute, such as `data-prop-src` or `data-prop-href`.

Initial directive values declared in the template are used to initialize the corresponding state fields.

The current value of a reactive field can be read with:

```ts
this.state.getProp("reactive-variable-name");
```

---

## Design choices

Splash differs from virtual-DOM and compiler-based UI frameworks in several deliberate ways:

- The DOM is the only rendered tree.
- Each component corresponds to one root DOM element.
- Reactivity is opt-in through template directives.
- Component inputs and local values share one state interface.
- DOM access remains available when an application needs it.
- Update scheduling and broader application architecture remain under developer control.

These choices reduce the amount of machinery between component code and the browser, while placing more responsibility on the application to manage update patterns and DOM interactions carefully.

---

## Example scenarios

### Forms

Use `data-ref` to access native form controls and attach regular DOM event listeners. Splash does not introduce a separate form model.

### Mount transitions

Use `transitionReady()` to apply classes or styles after the component has been mounted and initially rendered.

### Conditional content

Use slots to add, replace, or remove child components while preserving their lifecycle behavior.

### Direct DOM integration

Use refs or `component.DOMNode` when integrating browser APIs or third-party code that expects regular DOM elements.
