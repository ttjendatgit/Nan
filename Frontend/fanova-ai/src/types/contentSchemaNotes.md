# Content block schema audit (Phase 1.8)

Written for: engineers picking up Content Studio's next phase, deciding whether/how to unify
`Product.ContentBlocksJson` with `ContentDocument`.

This documents the current state of two parallel content-block schemas in this codebase. It is
an audit, not a migration — nothing here changes stored data or the backend contract.

## The two schemas

| | Legacy (`types/catalog.ts`) | New (`types/contentBlocks.ts`) |
|---|---|---|
| Used by | `ContentBlockEditor.tsx` (product detail page editor) | `BlockEditor`, `BlockRenderer`, `useContentEditor` (Content Studio) |
| Backend storage | `Products.ContentBlocksJson` (`text` column) | `ContentDocuments.BlocksJson` / `DraftBlocksJson` (`text` columns) |
| Backend validation | `ProductService.UpdateContentAsync`: "is it valid JSON and is the root an array?" — nothing more | `ContentDocumentService`: identical check, same pattern |
| Block identity | none — no `id` field on any block | every block has a required `id: string` (needed for React keys and for `updateBlock`/`removeBlock`/`moveBlock` to target the right one) |
| Block types | `heading`, `paragraph`, `image`, `list`, `quote`, `divider` (6) | `heading`, `paragraph`, `quote`, `divider`, `image` (5) — **no `list` block exists yet** |
| `heading.level` | `2 \| 3` (number; no level-1 option) | `"h1" \| "h2" \| "h3"` (string; includes h1) |
| Per-block styling | `heading`/`paragraph`/`quote` all carry optional `align`, `tone`, `weight`, `size`, `italic` | none — blocks are plain content, no styling knobs at all |
| `image` fields | `secureUrl`, `publicId` (Cloudinary-specific), `alt`, `caption?` | `url`, `alt`, `caption?` (caption added this phase) — generic URL, no Cloudinary coupling |
| `quote` fields | `text`, `caption?`, `tone?` | `text` only (plus `id`) |
| `divider` fields | `{ type: "divider" }` | `{ type: "divider", id }` |
| Parser resilience | `parseContentBlocks()` in `lib/api/products.ts`: per-field validation, silently `continue`s past malformed entries, never throws | `parseBlocksJson()` in `types/contentBlocks.ts`: same philosophy, hardened this phase to also *fall back* on malformed-but-recoverable fields instead of dropping the whole block (see below) |

## Why they're separate, and why that's currently safe

`ContentDocument.BlocksJson`/`DraftBlocksJson` and `Products.ContentBlocksJson` are different
columns on different tables. The backend treats both as an opaque string — it never parses or
validates the block shape beyond "valid JSON array" — so there is no shared storage and no way
for one schema's data to corrupt the other's. Nothing about this phase's changes touches
`Product.ContentBlocksJson`, `ContentBlockEditor.tsx`, or its parser in any way.

## What happens if a `ContentDocument` ends up holding legacy-shaped JSON

This can't happen through the current UI (Content Studio only ever writes its own schema), but
it's worth knowing the failure mode is graceful, not a crash, in case of manual data entry,
copy-paste, or a future migration attempt. Given a legacy block like:

```json
{ "type": "heading", "level": 2, "text": "Xin chào", "align": "center" }
```

`parseBlocksJson()` recovers it as `{ type: "heading", id: <generated>, level: "h2", text: "Xin
chào" }` — the recognized `type` and `text` survive, the missing `id` is generated, the
incompatible numeric `level` falls back to `"h2"` (matching the "add heading" factory's own
default), and the unmapped `align` field is silently dropped. Nothing crashes, nothing corrupts,
but the alignment styling is lost.

A legacy `image` block fares worse: it uses `secureUrl`, which the new schema doesn't recognize
at all (only `url`), so it recovers as an empty image slot (`url: ""`) — the Cloudinary asset
reference is not lost from storage, but it also isn't picked up. A `list` block recovers as
nothing at all (`type` unrecognized by the new schema, so it's dropped and counted in the
"skipped N blocks" warning) — this is the one genuinely unrecoverable case today.

## Migration risk if a future phase unifies the two

The three real options, roughly in order of effort:

1. **Keep them separate indefinitely.** `Product.ContentBlocksJson` stays exactly as-is;
   `ContentDocument` (type `ProductContent`) becomes a second, unrelated way to attach content to
   a product, if that's ever actually used. Zero migration risk, but two editors and two schemas
   live on forever.
2. **Migrate `Product.ContentBlocksJson` into `ContentDocument` rows (type `ProductContent`), then
   retire `ContentBlockEditor`.** This matches the direction `ContentDocument`'s own Phase 1.1
   comments already point at ("Product.ContentBlocksJson remains the live storage... until a
   later phase migrates it here"). Requires a one-time transform script, not just a copy:
   - Generate an `id` for every block.
   - Map `heading.level` 2/3 → `"h2"`/`"h3"` (there's no legacy 1:1 for `"h1"`).
   - Map `image.secureUrl` → `url` (verbatim, both are already absolute Cloudinary URLs).
   - **Decide what to do with `align`/`tone`/`weight`/`size`/`italic`** — the new schema has no
     equivalent today. Either drop them (content survives, styling doesn't) or extend the new
     schema to carry them (more editor UI work, but no data loss).
   - **Decide what to do with `list` blocks** — no equivalent exists. Drop, or add a `ListBlock`
     to the new schema (straightforward addition: a new union member + factory + editor +
     renderer case, no compile-time surprises since every dispatch site here is an exhaustive
     switch).
   - This is a product decision (is styling/lists actually used and worth preserving?) as much as
     an engineering one — flagging it rather than picking an answer here.
3. **Extend the new schema to be a strict superset of the legacy one first** (optional styling
   props, a `ListBlock`), then migrate losslessly. Safest for data, but grows Content Studio's
   editor UI scope substantially before that complexity is known to be needed.

**Recommendation (non-binding):** option 2, deferred until there's an actual reason to retire
`ContentBlockEditor` — building out styling controls and list-block UI speculatively, before any
content actually needs them, isn't worth the scope. Revisit this file when that phase starts.

## `image` block's future `source` field

Part 5 of this phase asked whether `ImageBlock` should grow toward `{ type, source, url, alt,
caption }`, where `source` would eventually distinguish "entered as a URL" from "uploaded via
Cloudinary." This phase adds `caption` (implemented, optional, backward-compatible — old
serialized blocks without it still parse fine) but deliberately does **not** add `source` yet:
until upload actually exists, `source` would only ever hold one value (`"url"`), which is dead
schema surface with no real distinguishing purpose. When upload/Cloudinary support lands, add it
as `source?: "url" | "upload"` (optional, so old blocks with no `source` keep parsing — treat a
missing `source` as `"url"` in `coerceContentBlock`, matching how every other optional field here
already degrades).

## `paragraph` block's rich text (Phase 2.1)

`ParagraphBlock.text` went from plain text to optionally holding a constrained inline-HTML
subset — bold, italic, link, line break — produced by the new `RichTextEditor`. Three extension
shapes were considered:

1. **Rename/replace `text` with an `html` field.** Rejected outright: breaks every serialized
   `ParagraphBlock` ever saved (the field they have is called `text`), and forces every read site
   to branch on which field is present.
2. **Add a new optional field alongside `text`** (e.g. `richText?: string`), keeping `text` as a
   permanent plain-text fallback. Rejected: creates two sources of truth for one block's content
   and an ambiguous "which one is authoritative, and when" question with no clean answer.
3. **Keep `text: string` exactly as it is — same name, same type — and reinterpret what it may
   contain.** Chosen. A plain string with zero tags (every `ParagraphBlock` saved before this
   phase) is *already* valid content under the new interpretation: no tags means nothing to
   strip, so it renders identically before and after. No field rename, no version flag, no
   migration, and both old and new editor code read/write the exact same property.

**Compatibility mechanics**: `coerceContentBlock` (`types/contentBlocks.ts`) now runs `text`
through `sanitizeRichText()` (`lib/richText.ts`) at parse time — an allowlist sanitizer that keeps
only `<b>/<strong>/<i>/<em>/<a href>/<br>`, stripping everything else while preserving its text
content (so a plain string, or a pasted Word doc, or a hand-edited API payload, all degrade
gracefully rather than crashing or smuggling something unsafe into state). The same sanitizer runs
again in `BlockRenderer`'s paragraph case immediately before `dangerouslySetInnerHTML` — sanitizing
once at parse time is not treated as sufficient justification to trust the value at every later
render site.

**Not implemented this phase, deliberately**: no `align`/`tone`/list/heading-level formatting
inside a paragraph (those remain separate block types or aren't supported at all), no toolbar
"active state" highlighting (e.g. Bold showing pressed when the cursor is inside bold text) — a
scoped simplification given no way to visually verify contentEditable selection-state UI this
session, not a silent gap.

## Three new block types + `align` settings (Phase 2.2)

Added `ListBlock`, `GalleryBlock`, `CalloutBlock` to the union, plus an optional `align` field on
`ParagraphBlock` and `ImageBlock`. All additive — no existing field was renamed, retyped, or
removed, so this phase adds zero migration risk on its own.

**New block types**: each follows the same shape philosophy already established here — plain,
JSON-serializable, no nested rich text (list items and callout text are plain strings, same scope
decision as `QuoteBlock`). `GalleryBlock.images` is its own `{ url, alt }[]`, deliberately not
reusing `ImageBlock` — a gallery item never needs a caption or per-image alignment, so giving it
`ImageBlock`'s full shape would just invite fields that don't apply. Old documents have no `list`,
`gallery`, or `callout` items, so nothing about them changes; `coerceContentBlock`'s three new
`case` branches only ever fire on new data.

**`align` on `ParagraphBlock`/`ImageBlock`**: same reasoning as Phase 2.1's paragraph rich text —
extend by adding an *optional* field rather than requiring one. `align` is `"left" | "center" |
"right" | undefined`. The important compatibility property: **`undefined` is defined to render
identically to how the block already rendered before `align` existed** —
- Paragraph: no `align` = browser-default left alignment, which is exactly what every paragraph
  already had (nothing previously set `text-align`).
- Image: no `align` = full-width, which is exactly what every image block already had (there was
  no narrower/side-aligned rendering before this phase). "center" is defined as the same full-width
  behavior, so it round-trips through old data with zero visual change; only explicit "left"/"right"
  visibly differ.

This means `parseBlocksJson()` needs no special-casing for legacy paragraph/image blocks at all —
`v.align` is simply `undefined` on old JSON, `asAlign()` maps that straight through to `undefined`,
and every renderer/editor already treats `undefined` as the pre-2.2 default.

**Parser resilience for the new types**, matching the existing "degrade the smallest unit, not the
whole block" pattern:
- `list`: non-string items are dropped individually (`items.filter(typeof === "string")`); the
  block itself always survives with whatever items remain, even zero.
- `gallery`: each image is validated independently (`coerceGalleryImage`) and a missing/non-string
  `url` drops just that one image, not the gallery.
- `callout`: an unrecognized `tone` falls back to `"info"`, matching the "invalid enum -> safe
  default" convention already used for `heading.level`.

## `paragraph` rich text moves from an HTML string to TipTap JSON (Phase 2.3.1)

`ParagraphBlock.text` changed from `string` to `string | TipTapDocument`. This is a bigger change
than Phase 2.1's or 2.2's (both stayed inside `string`), so it gets its own extended writeup.

**Why not migrate every string to TipTap JSON up front?** Rejected outright, twice over: the task
explicitly said not to (no database migration this phase), and it would also be strictly worse
engineering even if allowed -- a migration script is one more failure mode (partial runs, bad
rows) for zero benefit, when a union type gets the same result for free and non-destructively.

**Why a union instead of a second field (`text` + `tiptapText?`)?** Same reasoning Phase 2.1
already used for the same fork in the road: two fields is two sources of truth for one block's
content, with no clean answer for which one wins if both are ever present. A union keeps `text`
the single source of truth for both eras of data.

**How old data still renders identically:** `RichTextInput.tsx` (the editor) doesn't require its
input to already be TipTap JSON -- TipTap's own `content` option accepts a plain HTML string and
parses it through the editor's registered schema, which is exactly what Phase 2.1's sanitizer
allowlist already was a subset of (bold/italic/link). So a legacy string -- plain text, or
Phase 2.1's constrained HTML -- loads into the new editor and displays exactly as before, with no
conversion step. `RichTextRenderer.tsx` (the read-only preview) branches on `typeof content ===
"string"` first and, for that branch, renders through the *exact same* `sanitizeRichText` +
`dangerouslySetInnerHTML` path BlockRenderer used directly before this phase -- untouched
behavior, just relocated into a shared component so both the admin preview and any future public
renderer get it for free.

**The upgrade is one-way and lazy, not a migration:** a block's `text` stays a plain string
forever unless someone actually edits it in the new editor. The moment they do, `onUpdate` fires
`editor.getJSON()` and `text` becomes a `TipTapDocument` from then on (in memory; nothing reaches
the database until the existing Save/Publish flow persists it, exactly as any other edit would).
Untouched paragraphs in an untouched document stay plain strings indefinitely. This is the same
"the old shape is still valid new-schema content, so nothing has to change unless it's touched"
principle Phase 2.1 and 2.2 both already established -- extended here to a real structural change
instead of just a new optional field, because storing HTML strings long-term (Priority 2's ask)
doesn't hold up once formatting needs to compose (bold *and* highlighted *and* linked, all at
once) the way a real editor's toolbar implies -- DOM-string sanitization handles that fine to
render, but JSON is the more honest source of truth to keep editing and re-editing indefinitely.

**Trust boundary for the new shape:** `lib/tiptapContent.ts` is the TipTap-JSON equivalent of
`lib/richText.ts` -- `isTipTapDocument()` is a shallow `{ type: "doc", content: [...] }` shape
check used at parse time (`coerceContentBlock`) to decide whether an unrecognized `text` value
should be trusted as TipTap JSON or fall back to `""`. It is deliberately not a full ProseMirror
schema validator; `RichTextRenderer.tsx` independently re-validates every individual node and mark
at render time regardless (unrecognized node/mark types degrade to their text content or are
dropped, link hrefs are re-checked against the same `isSafeHref` allowlist used everywhere else in
this codebase) -- the same "don't trust one layer alone" posture `sanitizeRichText` already
established for the string path, applied to the new one.

**No HTML string is ever stored or rendered via `dangerouslySetInnerHTML` for the TipTap path.**
`RichTextRenderer` turns JSON nodes into real React elements (`<strong>`, `<em>`, `<a>`, `<mark>`,
`<br>`) directly -- there's no HTML-injection surface to sanitize away in the first place for this
half of the union. A link's `href` is still independently validated before being used as a real
`href` attribute, since React does not sanitize that for you the way it does text content.

**Paste behavior**: no manual sanitizer runs on paste for the TipTap path. ProseMirror's paste-HTML
parser only ever produces node/mark types the editor's own extension config registers -- with
every StarterKit node except paragraph/text/hardBreak disabled (no heading, list, blockquote, code
block, horizontal rule, strike, underline), pasted font styles, colors, and structure outside
bold/italic/link have no schema slot to land in and are dropped automatically, while the words
themselves are kept. This is a property of the schema being narrow, not a separate cleanup pass.

**Enter's behavior changed again in Phase A1 -- see the section below.** The paragraph immediately
below described Phase 2.3.1's original decision (Enter always remapped to a hard break); that
decision has since been reversed and no longer reflects what the editor does. Kept only as
history, not as documentation of current behavior: Enter was remapped to a hard break (not a new
paragraph node), so normal typing could never turn one ParagraphBlock into multiple paragraphs
internally -- adding another paragraph was a BlockToolbar action only, matching how every other
block type works. Pasting external content that contains multiple `<p>` elements was (and still
is) the one path that can produce more than one top-level paragraph node in a single block's
stored doc (paste preserves structure rather than collapsing it) -- `RichTextRenderer` still
handles that correctly, rendering each paragraph node as its own `<p>`.

**Nan gold highlight**: `--accent-gold` already existed in `globals.css` (the storefront's
"Accent Gold — use sparingly" token). Reused as-is for the Highlight mark's fixed color
(`.cs-highlight` in `globals.css`, blended to 45% via `color-mix()` so text stays readable) rather
than defining a second gold -- `Highlight` is configured with `multicolor: false`, so there is no
color picker and no way to store a different color even if the JSON were hand-edited.

## Enter splits a paragraph instead of hard-breaking (Phase A1 -- reverses Phase 2.3.1)

Phase 2.3.1 deliberately made plain Enter insert a hard break inside a ParagraphBlock, keeping
one block permanently equal to one paragraph and pushing "start a new paragraph" onto the
BlockToolbar. That decision is reversed as of this phase, on product grounds, not a technical
correction: an article with 15 paragraphs meant 15 trips to the mouse to add the "Đoạn văn"
block before typing each one -- editing felt like filling out a form field by field, not writing.
Enter now behaves the way every other block-based or plain-text editor's Enter behaves (splitting
into a new unit at the cursor), and Shift+Enter is what still produces a hard break within one
paragraph -- unchanged from before this phase.

**No schema change.** `ParagraphBlock` is exactly what Phase 2.3.1 left it -- `text: string |
TipTapDocument`, optional `align`. A1 is purely an input-handling change: pressing Enter now
produces *more ParagraphBlock entries in the array* via `useContentEditor`'s `addBlockAt`/
`insertBlockAt`, instead of more content inside one block's own TipTap doc. Nothing about how a
`ParagraphBlock` is shaped, serialized, or parsed is different, so every backward-compatibility
guarantee from Phase 2.1/2.2/2.3.1 still holds unchanged.

**Where the split happens**: `RichTextInput.tsx` intercepts plain Enter in `editorProps.
handleKeyDown` (not a keyboard-shortcut Extension -- an Extension is created once at module scope
and would close over a stale `onEnter`, exactly the kind of bug a `useRef`-backed "always read the
latest callback" pattern avoids) and cuts the live ProseMirror doc at the cursor with `Node.cut()`
rather than slicing text, so marks spanning the cut point (bold, italic, link, highlight) land
correctly on whichever side they end up on. It hands the two pieces up as a
`{ before, after, atStart }` payload and does not touch the block array itself -- it has no
concept of one. `ContentStudio.handleParagraphEnter` is the actual decision-maker: cursor at doc
start -> insert an empty block above without moving focus; cursor at the end -> update the current
block with `before` and insert a fresh empty block after it, focused; cursor mid-paragraph ->
update the current block with `before` and insert a new block carrying `after` (plus the original
block's `align`, so the continuation reads the same way) after it, focused.

**Focus after a split** is expressed as data, not imperative DOM calls reaching across components:
`useContentEditor` gained `pendingFocusBlockId`/`requestFocus`, threaded down through
ContentStudio -> EditorPanel -> BlockEditor -> BlockCanvas (the extra two components exist between
ContentStudio and BlockCanvas in the real component tree and just pass these three straight
through) -> BlockItem -> ParagraphBlockEditor -> RichTextInput's `autoFocus` prop. BlockCanvas
clears the pending id back to null via the same `onFocusCapture` signal BlockItem already had for
its own "which block is active" tracking, once the newly split block's editor actually receives
DOM focus -- not the moment the request is made, so a stale request can never re-fire.

**Deliberately not undo-able yet.** Creating a block via Enter doesn't participate in any
undo/redo mechanism (there isn't one at the document level in Content Studio at all) -- known and
accepted for this phase, not a gap this phase was scoped to close.
