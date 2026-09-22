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
