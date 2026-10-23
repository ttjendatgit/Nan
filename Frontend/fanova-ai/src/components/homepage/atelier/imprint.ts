// Text handling for the Hero's fan imprint: what a visitor types becomes the word printed on the
// fan preview, so it is normalised, cleaned and limited by graphemes (not code units), so
// Vietnamese letters with stacked diacritics, and emoji, count as one character each.

export const IMPRINT_MAX = 14;
export const IMPRINT_DEFAULT = "NAN";

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("vi", { granularity: "grapheme" }) : null;

export function graphemes(value: string): string[] {
  return segmenter ? Array.from(segmenter.segment(value), (s) => s.segment) : Array.from(value);
}

/** What stays in the field while typing: NFC, no control/format/private-use characters, single
 *  spaces, at most IMPRINT_MAX graphemes. Leading space is dropped; a trailing one is kept so the
 *  visitor can type the next word. */
export function cleanDraft(value: string): string {
  const cleaned = value
    .normalize("NFC")
    .replace(/\s+/g, " ") // tabs and line breaks become spaces first (they are control characters too)
    .replace(/[\p{Cc}\p{Cf}\p{Co}\p{Cs}]/gu, "")
    .replace(/ {2,}/g, " ")
    .replace(/^ /, "");
  const g = graphemes(cleaned);
  return g.length > IMPRINT_MAX ? g.slice(0, IMPRINT_MAX).join("") : cleaned;
}

/** The word printed on the fan: trimmed, upper-cased (Vietnamese locale); empty → NAN. */
export function toImprint(draft: string): string {
  const t = cleanDraft(draft).trim();
  return t ? t.toLocaleUpperCase("vi") : IMPRINT_DEFAULT;
}

export function countGraphemes(value: string): number {
  return graphemes(value).length;
}
