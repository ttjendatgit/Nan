import { cn } from "@/lib/utils";
import type { ProductFact } from "@/lib/productFacts";

/**
 * Commercial facts as a definition list: a quiet label over each value, hairline dividers, no
 * boxes, pills, icons or colour coding. Values wrap naturally (never truncated).
 * - "strip": one row of three, the price column wider (catalogue rows, compared down the page).
 * - "grid": two columns, rows divided by hairlines (product detail, room for longer values).
 */
export default function ProductFacts({
  facts,
  layout,
  className,
}: {
  facts: ProductFact[];
  layout: "strip" | "grid";
  className?: string;
}) {
  if (layout === "strip") {
    return (
      <dl className={cn("grid grid-cols-[3fr_2fr_2fr] border-y border-line-on-indigo py-3", className)}>
        {facts.map((fact, i) => (
          <div key={fact.label} className={cn("min-w-0 pr-3", i > 0 && "border-l border-line-on-indigo pl-3 sm:pl-4")}>
            <dt className="text-xs text-on-indigo-muted">{fact.label}</dt>
            <dd className={cn("mt-1 text-[0.9375rem] leading-snug text-on-indigo", fact.strong ? "font-semibold" : "font-medium")}>
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className={cn("grid grid-cols-2 border-t border-line-on-indigo", className)}>
      {facts.map((fact, i) => (
        <div
          key={fact.label}
          className={cn("min-w-0 border-b border-line-on-indigo py-4", i % 2 === 0 ? "pr-4" : "border-l border-line-on-indigo pl-4 sm:pl-6")}
        >
          <dt className="text-xs text-on-indigo-muted">{fact.label}</dt>
          <dd className={cn("mt-1.5 text-base leading-snug text-on-indigo", fact.strong ? "font-semibold" : "font-medium")}>
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
