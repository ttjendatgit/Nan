import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "./tone";

interface SectionTitleProps {
  title: ReactNode;
  /** Short lowercase lead-in, set in EB Garamond italic. Write it lowercase; it is not transformed. */
  eyebrow?: ReactNode;
  description?: ReactNode;
  tone?: Tone;
  align?: "left" | "center";
  /** Heading level; h2 for a normal section, h1 only for a page's own title. */
  as?: "h1" | "h2" | "h3";
  className?: string;
}

const eyebrowTone: Record<Tone, string> = {
  indigo: "text-bamboo",
  paper: "text-bamboo-deep",
};

const descriptionTone: Record<Tone, string> = {
  indigo: "text-on-indigo-muted",
  paper: "text-ink-muted",
};

/**
 * Section heading block: optional eyebrow, the title, optional description. The title inherits
 * the section's text color (on-indigo / ink) from Section; eyebrow and description take their
 * muted/accent color from `tone`, which should match the surrounding Section.
 */
export default function SectionTitle({
  title,
  eyebrow,
  description,
  tone = "indigo",
  align = "left",
  as: Heading = "h2",
  className,
}: SectionTitleProps) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className={cn("font-serif text-lg italic", eyebrowTone[tone])}>{eyebrow}</p>}
      <Heading
        className={cn(
          "font-serif text-4xl font-semibold leading-[1.12] md:text-5xl",
          eyebrow ? "mt-3" : undefined,
        )}
      >
        {title}
      </Heading>
      {description && (
        <p className={cn("mt-5 max-w-2xl font-sans text-base leading-relaxed md:text-lg", align === "center" && "mx-auto", descriptionTone[tone])}>
          {description}
        </p>
      )}
    </div>
  );
}
