import { cropEnd } from "@tui/strings/crop_end";
import { textWidth } from "@tui/strings/text_width";
import type { NormalizedTextDefinition } from "./normalization.ts";

export function resizeHorizontally(
  lines: string[],
  desiredWidth: number,
  height: number,
  textDefinition: NormalizedTextDefinition,
): void {
  for (let i = 0; i < height; i++) {
    lines[i] = resizeLineHorizontally(lines[i], desiredWidth, textDefinition);
  }
}

export function resizeLineHorizontally(
  line: string,
  desiredWidth: number,
  { ellipsisString, overflow }: NormalizedTextDefinition,
): string {
  const lineWidth = textWidth(line);
  if (lineWidth <= desiredWidth) {
    return line;
  }

  switch (overflow) {
    case "clip":
      return cropEnd(line, desiredWidth, " ");
    case "ellipsis": {
      const ellipsisWidth = textWidth(ellipsisString);
      const cropped = cropEnd(line, desiredWidth, ellipsisString);
      return cropped.slice(0, -ellipsisWidth) + ellipsisString;
    }
  }
}
