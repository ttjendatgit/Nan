/**
 * Regression check for lib/richText.ts's DOM-free sanitizer (the branch sanitizeRichText takes when
 * there is no `document`, i.e. server rendering of the public /[slug] pages -- Content Studio B2).
 * There is no frontend test runner in this project, so this is a plain Node script:
 *
 *   npm run check:sanitizer
 *
 * Node has no DOM, so importing richText.ts here exercises exactly the server path. Each expected
 * value was verified against the browser's DOM path (the same input through sanitizeRichText in
 * Chrome); rows with a note are the few where the output differs from the DOM path's serialization.
 */
import { sanitizeRichText } from "../src/lib/richText.ts";

/** [input, expected server output, note?] */
const CASES = [
  ["<a href=\"https://example.com/&#x110000;\">X</a>", "<a href=\"https://example.com/�\" target=\"_blank\" rel=\"noopener noreferrer\">X</a>"],
  ["<a href=\"https://example.com/&#1114112;\">X</a>", "<a href=\"https://example.com/�\" target=\"_blank\" rel=\"noopener noreferrer\">X</a>"],
  ["<a data-href=\"https://wrong.example\" href=\"https://right.example\">X</a>", "<a href=\"https://right.example\" target=\"_blank\" rel=\"noopener noreferrer\">X</a>"],
  ["<a title=\"href='https://wrong.example'\" href=\"https://right.example\">X</a>", "<a href=\"https://right.example\" target=\"_blank\" rel=\"noopener noreferrer\">X</a>"],
  ["<a title=\"1 > 0\" href=\"https://right.example\">X</a>", "<a href=\"https://right.example\" target=\"_blank\" rel=\"noopener noreferrer\">X</a>"],
  ["<a data-href=\"https://only-data.example\">X</a>", "<a>X</a>"],
  ["<a href=\"https://first.example\" href=\"https://second.example\">X</a>", "<a href=\"https://first.example\" target=\"_blank\" rel=\"noopener noreferrer\">X</a>"],
  ["<a title='a > b' href='https://single.example'>X</a> tail", "<a href=\"https://single.example\" target=\"_blank\" rel=\"noopener noreferrer\">X</a> tail"],
  ["<a HREF = \"https://spaced.example\" >X</a>", "<a href=\"https://spaced.example\" target=\"_blank\" rel=\"noopener noreferrer\">X</a>"],
  ["<a href=\"https://example.com/&#xD800;\">X</a>", "<a href=\"https://example.com/�\" target=\"_blank\" rel=\"noopener noreferrer\">X</a>"],
  ["<a href=\"https://example.com/&#99999999999999999999;\">X</a>", "<a href=\"https://example.com/�\" target=\"_blank\" rel=\"noopener noreferrer\">X</a>"],
  ["<a href=\"jav&#97script:alert(1)\">no-semicolon</a>", "<a>no-semicolon</a>"],
  ["<a href=\"https://e.example/?q=&#38;lt;\">double</a>", "<a href=\"https://e.example/?q=&amp;lt;\" target=\"_blank\" rel=\"noopener noreferrer\">double</a>"],
  ["<a href=\"https://e.example/?a=1&b=2\">rawamp</a>", "<a href=\"https://e.example/?a=1&amp;b=2\" target=\"_blank\" rel=\"noopener noreferrer\">rawamp</a>"],
  ["<b title=\"x>y\">bold</b> after", "<b>bold</b> after"],
  ["text <b unterminated", "text "],
  ["a </ x> b", "a  b", "stricter than DOM: bogus comment dropped, same visible text"],
  ["Plain text only", "Plain text only"],
  ["Bold <b>đậm</b> and <strong>strong</strong>, <i>nghiêng</i>, <em>em</em>", "Bold <b>đậm</b> and <strong>strong</strong>, <i>nghiêng</i>, <em>em</em>"],
  ["Link <a href=\"https://nan.vn/a?x=1&amp;y=2\">nan</a> and <a href=\"mailto:a@b.c\">mail</a>", "Link <a href=\"https://nan.vn/a?x=1&amp;y=2\" target=\"_blank\" rel=\"noopener noreferrer\">nan</a> and <a href=\"mailto:a@b.c\" target=\"_blank\" rel=\"noopener noreferrer\">mail</a>"],
  ["Bad <a href=\"javascript:alert(1)\">js</a> <a href=\"jav&#x61;script:alert(1)\">ent</a> <a href=\" JaVaScRiPt:alert(1)\">ws</a>", "Bad <a>js</a> <a>ent</a> <a>ws</a>"],
  ["<a href=\"java&Tab;script:alert(1)\">tab</a>", "<a>tab</a>"],
  ["<a onclick=\"x()\" href=\"https://ok.vn\" style=\"color:red\">attrs</a>", "<a href=\"https://ok.vn\" target=\"_blank\" rel=\"noopener noreferrer\">attrs</a>"],
  ["<script>alert(1)</script>after", "after"],
  ["<style>p{}</style>styled", "styled"],
  ["<img src=x onerror=alert(1)>img", "img"],
  ["<svg><script>alert(1)</script></svg>svg", "svg", "stricter than DOM: svg script text dropped"],
  ["<div><p>para <b>b</b></p></div>", "para <b>b</b>"],
  ["line1<br>line2<br/>line3", "line1<br>line2<br>line3"],
  ["5 < 6 > 4 &amp; a &lt;b&gt; &nbsp; &hellip; & raw", "5 &lt; 6 &gt; 4 &amp; a &lt;b&gt; &nbsp; &hellip; &amp; raw", "DOM serializes &hellip; as the character; same rendered text"],
  ["<b>unclosed <i>nested", "<b>unclosed <i>nested</i></b>"],
  ["</b>stray close", "stray close"],
  ["<!-- comment -->visible", "visible", "stricter than DOM: comment dropped, same visible text"],
  ["<b><i>overlap</b></i>", "<b><i>overlap</i></b>"],
  ["<scr<script>ipt>alert(1)</script>", "ipt&gt;alert(1)"],
  ["<a href='https://single.vn'>single</a> <a href=https://bare.vn>bare</a>", "<a href=\"https://single.vn\" target=\"_blank\" rel=\"noopener noreferrer\">single</a> <a href=\"https://bare.vn\" target=\"_blank\" rel=\"noopener noreferrer\">bare</a>"],
  ["<a>no href</a>", "<a>no href</a>"],
  ["<IFRAME src=x></IFRAME>frame", "frame"],
];

let failed = 0;
for (const [input, expected, note] of CASES) {
  let actual;
  try {
    actual = sanitizeRichText(input);
  } catch (error) {
    actual = `THREW ${error?.name}: ${error?.message}`;
  }
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${JSON.stringify(input)}${note ? `  (${note})` : ""}`);
  if (!ok) console.log(`      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(actual)}`);
}

console.log(`\n${CASES.length - failed}/${CASES.length} passed`);
if (failed > 0) process.exitCode = 1;
