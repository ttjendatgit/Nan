/**
 * Round-trip check for the Content Studio block schema (types/contentBlocks.ts): what the editor
 * serializes (JSON.stringify of its blocks, i.e. the BlocksJson/DraftBlocksJson payload) must come
 * back from parseBlocksJson with every presentation choice intact -- here, the image block's
 * `size` and `align`. No test runner in this project, so a plain Node script:
 *
 *   npm run check:blocks
 *
 * A tiny resolve hook maps the "@/..." path alias to src/*.ts so the real module is imported.
 */
import { register } from "node:module";
import { deepStrictEqual, strictEqual } from "node:assert/strict";

const hooks = `
export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) return next(new URL(specifier.slice(2) + ".ts", ${JSON.stringify(new URL("../src/", import.meta.url).href)}).href, context);
  return next(specifier, context);
}`;
register(`data:text/javascript,${encodeURIComponent(hooks)}`, import.meta.url);

const { parseBlocksJson, createImageBlock, IMAGE_SIZES } = await import("../src/types/contentBlocks.ts");

const checks = [];
const check = (name, fn) => {
  try {
    fn();
    checks.push([name, true]);
  } catch (error) {
    checks.push([name, false, error.message]);
  }
};
const image = (extra) => ({ type: "image", id: `img-${Math.random().toString(36).slice(2)}`, url: "https://example.com/a.jpg", alt: "a", caption: "c", ...extra });

check("every size x align survives serialize -> parse -> serialize", () => {
  const blocks = IMAGE_SIZES.flatMap((size) => ["left", "center", "right"].map((align) => image({ size, align })));
  const { blocks: parsed, error } = parseBlocksJson(JSON.stringify(blocks));
  strictEqual(error, null);
  deepStrictEqual(parsed, blocks);
  deepStrictEqual(parseBlocksJson(JSON.stringify(parsed)).blocks, blocks);
});

check("legacy image block without size stays without size (old rendering kept)", () => {
  const legacy = { type: "image", id: "old", url: "https://example.com/a.jpg", alt: "a", align: "right" };
  const [parsed] = parseBlocksJson(JSON.stringify([legacy])).blocks;
  strictEqual("size" in parsed, false);
  strictEqual(parsed.align, "right");
});

check("invalid size is dropped (valid default), invalid align becomes undefined", () => {
  const [parsed] = parseBlocksJson(JSON.stringify([image({ size: "huge", align: "diagonal" })])).blocks;
  strictEqual("size" in parsed, false);
  strictEqual(parsed.align, undefined);
  const [numeric] = parseBlocksJson(JSON.stringify([image({ size: 50 })])).blocks;
  strictEqual("size" in numeric, false);
});

check("a new image block starts at full width, centered", () => {
  const block = createImageBlock();
  strictEqual(block.size, "full");
  strictEqual(block.align, "center");
  deepStrictEqual(parseBlocksJson(JSON.stringify([block])).blocks, [block]);
});

check("one paragraph block keeps every inner paragraph, hard break and mark", () => {
  const para = (...content) => ({ type: "paragraph", content });
  const text = (t, marks) => ({ type: "text", text: t, ...(marks ? { marks } : {}) });
  const doc = { type: "doc", content: [
    para(text("Doan 1 "), text("dam", [{ type: "bold" }])),
    para(text("Doan 2 dong mot"), { type: "hardBreak" }, text("dong hai")),
    para(text("Doan 3 "), text("lien ket", [{ type: "link", attrs: { href: "https://example.com" } }])),
    para(text("Doan 4 "), text("to sang", [{ type: "highlight" }])),
    para(text("Doan 5 "), text("nghieng", [{ type: "italic" }])),
  ] };
  const block = { type: "paragraph", id: "long", text: doc, align: "center" };
  const { blocks } = parseBlocksJson(JSON.stringify([block]));
  deepStrictEqual(blocks, [block]);
  strictEqual(blocks[0].text.content.length, 5);
});

check("other blocks are untouched by the image change", () => {
  const blocks = [
    { type: "heading", id: "h", level: "h2", text: "T" },
    { type: "paragraph", id: "p", text: "x", align: "center" },
    { type: "gallery", id: "g", images: [{ url: "https://example.com/g.jpg", alt: "g" }] },
  ];
  deepStrictEqual(parseBlocksJson(JSON.stringify(blocks)).blocks, blocks);
});

for (const [name, ok, message] of checks) console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `\n      ${message}`}`);
const failed = checks.filter(([, ok]) => !ok).length;
console.log(`\n${checks.length - failed}/${checks.length} passed`);
if (failed > 0) process.exitCode = 1;
