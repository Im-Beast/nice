import { effect, getValue, type MaybeSignal, signal } from "@tui/signals";

import type { Unit } from "./unit.ts";

export interface BlockOptions {
  id?: string;
  width: MaybeSignal<Unit>;
  height: MaybeSignal<Unit>;
  children?: MaybeSignal<Block>[];
}

export interface BoundingRectangle {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface BlockEventListeners {
  mount: (() => void)[];
  unmount: (() => void)[];
}

export class Block {
  id: string;
  name?: string;

  listeners: BlockEventListeners = {
    mount: [],
    unmount: [],
  };

  // Whether block depends on parent when width or height are set to "auto"
  autoParentDependant = true;
  width!: Unit;
  height!: Unit;

  changed = true;
  computedTop = 0;
  computedLeft = 0;
  computedWidth = 0;
  computedHeight = 0;

  usedWidth = 0;
  usedHeight = 0;

  parent?: MaybeSignal<Block>;
  children?: MaybeSignal<Block>[];

  lines: string[] = [];

  constructor(options: BlockOptions) {
    this.id = options.id ?? "not set";

    effect(() => {
      this.width = getValue(options.width);
      if (typeof this.width === "number") this.computedWidth = this.width;

      this.height = getValue(options.height);
      if (typeof this.height === "number") this.computedHeight = this.height;

      this.changed = true;
    });

    if (options.children) {
      for (const childSignal of getValue(options.children)) {
        let lastChild: Block | undefined;
        effect(() => {
          const child = getValue(childSignal);

          if (lastChild && child.almostTheSame(lastChild)) {
            return;
          }

          if (lastChild) this.removeChild(lastChild);
          this.addChild(child);
          lastChild = child;
        });
      }
    }
  }

  almostTheSame(other: Block): boolean {
    if (this === other) return true;

    if (this.id !== other.id) {
      return false;
    }

    if (this.children?.length !== other.children?.length) {
      return false;
    }

    if (!this.children) return true;

    for (let i = 0; i < this.children.length; ++i) {
      const child = getValue(this.children[i]);
      const otherChild = getValue(other.children![i]);

      if (!child.almostTheSame(otherChild)) return false;
    }

    return true;
  }

  forceUpdate(): void {
    this.changed = true;
    if (!this.children) return;
    for (const child of this.children) {
      getValue(child).forceUpdate();
    }
  }

  hasChanged(): boolean {
    return (this.changed = this.changed || (
      this.children?.some((block) => getValue(block).hasChanged()) ?? false
    ));
  }

  boundingRectangle(): BoundingRectangle {
    let top = this.computedTop;
    let left = this.computedLeft;

    let parent = getValue(this.parent);
    while (parent) {
      if (!Number.isFinite(parent.computedTop)) {
        throw parent;
      }
      top += parent.computedTop;
      left += parent.computedLeft;
      parent = getValue(parent.parent);
    }

    return {
      top,
      left,
      width: this.computedWidth,
      height: this.computedHeight,
    };
  }

  addEventListener(event: keyof BlockEventListeners, listener: () => void) {
    this.listeners[event].push(listener);
  }

  mount() {
    this.changed = true;
    for (const listener of this.listeners.mount) {
      listener();
    }

    if (this.children) {
      for (const child of this.children) getValue(child).mount();
    }
  }

  unmount() {
    for (const listener of this.listeners.unmount) {
      listener();
    }

    if (this.children) {
      for (const child of this.children) getValue(child).unmount();
    }
  }

  addChild(blockSignal: MaybeSignal<Block>): void {
    const block = getValue(blockSignal);
    block.parent = this;
    this.children ??= [];
    this.children.push(blockSignal);
    block.mount();
    this.changed = true;
  }

  clearChildren(): void {
    if (!this.children) return;
    for (const child of this.children.splice(0)) {
      const childValue = getValue(child);
      childValue.parent = undefined;
      childValue.unmount();
    }
    this.changed = true;
  }

  removeChild(blockSignal: MaybeSignal<Block>): void {
    const block = getValue(blockSignal);
    block.parent = undefined;

    const index = this.children?.findIndex((value) => value === block || value === blockSignal);
    if (typeof index !== "number" || index === -1) return;

    this.children!.splice(index, 1);
    block.unmount();
    this.changed = true;
  }

  draw() {
    if (!this.hasChanged()) {
      return;
    }

    if (!this.parent) {
      const size = Deno.consoleSize();
      const width = signal(size.columns);
      const height = signal(size.rows);

      Deno.addSignalListener("SIGWINCH", () => {
        const { columns, rows } = Deno.consoleSize();
        width.set(columns);
        height.set(rows);

        terminal.forceUpdate();
        this.compute(terminal);
      });

      const terminal = new Block({
        id: "terminal",
        width,
        height,
      });

      terminal.addChild(this);
      this.compute(this.parent!);
    }

    if (this.children) {
      this.startLayout();
      for (const child of this.children) {
        this.layout(child);
      }
      this.finishLayout();
    }
  }

  startLayout(): void {
    throw new Error("Default block doesn't implement 'Block.startLayout'");
  }

  layout(_child: MaybeSignal<Block>): void {
    throw new Error("Default block doesn't implement 'Block.layout'");
  }

  finishLayout(): void {
    throw new Error("Default block doesn't implement 'Block.finishLayout'");
  }

  compute(_parent: MaybeSignal<Block>): void {
    if (this.hasChanged()) {
      this.computedTop = 0;
      this.computedLeft = 0;
      this.computedWidth = 0;
      this.computedHeight = 0;
    }
  }

  render(relative = false): string {
    this.draw();

    if (relative) {
      // This does these steps to render lines in correct position no matter the cursor position:
      //  1. Save cursor position
      //  2. Line
      //  3. Reset cursor position
      //  4. Move cursor down
      //  5. Save cursor position
      return `\x1b7${this.lines.join("\x1b8\x1b[1B\x1b7")}`;
    }

    return this.lines.join("\n");
  }
}
