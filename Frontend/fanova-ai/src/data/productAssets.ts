/**
 * R9B catalogue: art-directed object assets (A1, finished fans shot as objects / cut-outs) for the
 * /products rows. Categories are keyed by category slug, products by product slug, both from the
 * catalog API. Until an asset exists for a slug the row shows the image the admin uploaded
 * (`imageUrl`), so nothing here is required and nothing here is a placeholder that could ship.
 *
 * Replacing an image = filling `src` (+ `alt`, and `ratio` / `cutout` when the shot differs from the
 * row's frame). The row layout and motion do not change. A2 (production frames) is not used here;
 * it belongs to the product detail story.
 */
export interface ObjectAsset {
  /** Asset code from the shopping list, e.g. "A1-01". */
  id: string;
  /** Production URL (Cloudinary or /public). Empty = use the catalog image. */
  src: string;
  alt: string;
  /** CSS aspect-ratio of the shot, e.g. "3 / 2". Omit to use the row's frame. */
  ratio?: string;
  /** Cut-out on a transparent background. */
  cutout?: boolean;
}

export const categoryObjects: Record<string, ObjectAsset> = {
  "quat-giay": { id: "A1-01", src: "", alt: "" },
  "quat-nan-tre": { id: "A1-02", src: "", alt: "" },
  "quat-vai": { id: "A1-03", src: "", alt: "" },
};

/** Per-product A1 shots, by product slug. Empty until the shoot. */
export const productObjects: Record<string, ObjectAsset> = {};

/** The asset for `slug` when it has a real `src`, else null (use the catalog image). */
export function objectFor(map: Record<string, ObjectAsset>, slug: string | undefined): ObjectAsset | null {
  const asset = slug ? map[slug] : undefined;
  return asset?.src ? asset : null;
}
