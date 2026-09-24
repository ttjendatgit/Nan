import { notFound } from "next/navigation";
import { SilkFan } from "@/components/homepage/silk-fan";

/**
 * H1 dev-only preview for the ported hero silk fan -- not part of the real site, not linked from
 * anywhere in the app. Exists purely to eyeball the port against reference/nan-landing.js's hero
 * without wiring it into HeroVisualStage yet (that integration is a later phase, not H1's scope).
 * Not reachable in production.
 */
export default function SilkFanDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#0D1B5E]">
      <SilkFan className="h-[80vh] w-auto" />
    </main>
  );
}
