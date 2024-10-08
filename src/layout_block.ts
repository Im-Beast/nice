import { signal } from "@tui/signals";
import { Block } from "./block.ts";

export class LayoutBlock extends Block {
  override name = "Layout";

  override usedWidth = 0;
  override usedHeight = 0;

  override compute(parent: Block): void {
    super.compute(parent);
    this.usedWidth = 0;
    this.usedHeight = 0;
  }

  override draw() {
    let { parent } = this;
    if (!parent) {
      const width = signal(0);
      const height = signal(0);

      const resize = () => {
        const { columns, rows } = Deno.consoleSize();
        width.set(columns);
        height.set(rows);
        parent!.forceChange();
        parent!.resize();
      };

      parent = new Block({
        id: "terminal",
        width,
        height,
        children: [this],
      });

      resize();

      // Because SIGWINCH signal is not supported on windows
      // We just have to check whether size has changed in a loop
      if (Deno.build.os === "windows") {
        Deno.unrefTimer(setInterval(resize, 32));
      } else {
        Deno.addSignalListener("SIGWINCH", resize);
      }
    }

    this.compute(parent);

    if (this.children) {
      this.startLayout(parent);
      for (const child of this.children) {
        this.layout(child);
      }
      this.finishLayout(parent);
    }

    this.changed = false;
  }

  startLayout(parent: Block): void;
  startLayout(): void {}

  finishLayout(parent: Block): void;
  finishLayout(): void {}

  layout(child: Block): void;
  layout(): void {}
}
