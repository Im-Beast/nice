// Copyright 2023 Im-Beast. All rights reserved. MIT license.
import { cropEnd } from "@tui/strings/crop_end";
import { textWidth } from "@tui/strings/text_width";
import type { Dimensions } from "@tui/strings/dimensions";

export function fitIntoDimensions(text: string[], { columns, rows }: Dimensions): void {
  while (text.length > rows) {
    text.pop();
  }

  for (const i in text) {
    const line = text[i];
    if (textWidth(line) <= columns) continue;
    text[i] = cropEnd(line, columns);
  }
}
