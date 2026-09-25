"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

interface ImageWithFallbackProps {
  url: string;
  alt: string;
  /** "frame" (default): fills a fixed-aspect parent box, cropped with object-cover -- the original
   * rendering, still used for image blocks without a `size`. "natural": the image at its own
   * aspect ratio (no crop, no forced height), used once a block has a `size`. */
  fit?: "frame" | "natural";
  /** "natural" only: stretch to the parent's full width (25-100% sizes) instead of the image's
   * natural width capped at the parent ("original"). */
  fill?: boolean;
}

/** The one interactive piece of BlockRenderer (an image's onError fallback), kept in its own
 * client module so BlockRenderer itself can render on the server for the public /[slug] pages
 * (Content Studio B2) as well as inside the admin preview. */
export default function ImageWithFallback({ url, alt, fit = "frame", fill = false }: ImageWithFallbackProps) {
  const [errored, setErrored] = useState(false);
  const showImage = url.trim().length > 0 && !errored;

  if (showImage) {
    return (
      // Raw <img>, not next/image: the URL is free-text from ImageBlockEditor, not a configured
      // remote pattern -- upload/Cloudinary integration is a later phase.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        onError={() => setErrored(true)}
        className={fit === "frame" ? "h-full w-full object-cover" : `block h-auto max-w-full ${fill ? "w-full" : ""}`}
      />
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 px-4 text-center ${fit === "frame" ? "h-full" : "aspect-video w-full min-w-48"}`}
    >
      <ImageIcon className="h-6 w-6" style={{ color: "var(--content-text-subtle)" }} aria-hidden="true" />
      <span className="text-[11px]" style={{ color: "var(--content-text-subtle)" }}>
        {url.trim() ? "Không thể tải hình ảnh" : "Chưa có hình ảnh"}
      </span>
    </div>
  );
}
