import { crayon } from "../deps.ts";
import { TestCase } from "../nice-test-runner.ts";

import { Nice } from "../../mod.ts";
import { horizontal, vertical } from "../../src/layout/mod.ts";

const wrap = new Nice({
  style: crayon.bgRed.bold.white,

  width: 13,
  height: 12,

  padding: { all: 1 },
  margin: { right: 1 },
  border: { type: "rounded", all: true, style: crayon.white },

  text: {
    wrap: "wrap",
    verticalAlign: "middle",
  },
});

const nowrap = wrap.derive({
  style: crayon.bgBlue.bold.white,
  text: { wrap: "nowrap" },
});

function render() {
  const TEXT = `\
Sneaky

Tippity tick tapity typing test theoritically taking time to test the tight text

snack
smack`;

  const SCREEN_FG = Nice.render(
    horizontal(
      0.5,
      vertical(0.5, ["wrap"], wrap.draw(TEXT)),
      vertical(0.5, ["nowrap"], nowrap.draw(TEXT)),
    ),
  );

  console.log(SCREEN_FG);
}

export const testCase = new TestCase(
  "Text wrapping",
  crayon`\
{bold This test showcases the different text wrapping modes.}
Words starting with an "S" should be alone on their line.
There should be 1 line of space between words starting with an "S" and words starting with "T".
Test should contain exactly 3 words starting with an "S" and 13 words starting with "T".`,
  render,
);

if (import.meta.main) {
  testCase.run();
}
