import { cropEnd } from "@tui/strings/crop_end";
import { textWidth } from "@tui/strings/text_width";
import type { NormalizedTextDefinition } from "./normalization.ts";

export function resizeVertically(
  lines: string[],
  desiredHeight: number,
  { ellipsisString, overflow }: NormalizedTextDefinition,
): void {
  const textHeight = lines.length;
  if (textHeight > desiredHeight) {
    while (lines.length > desiredHeight) {
      lines.pop();
    }

    if (overflow === "ellipsis") {
      const lastLine = lines[lines.length - 1];
      const lineWidth = textWidth(lastLine);

      lines[lines.length - 1] = cropEnd(lastLine, lineWidth - textWidth(ellipsisString)) + ellipsisString;
    }
  }
}
