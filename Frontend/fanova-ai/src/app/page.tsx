import { MotionConfig } from "motion/react";
import Navbar from "@/components/common/Navbar";
import HeroSignature from "@/components/homepage/signature/HeroSignature";
import BrandStatementSection from "@/components/homepage/BrandStatementSection";
import ProductTypeSection from "@/components/homepage/ProductTypeSection";
import ProblemSolutionSection from "@/components/homepage/ProblemSolutionSection";
import MaterialSection from "@/components/homepage/MaterialSection";
import UseCaseSection from "@/components/homepage/UseCaseSection";
import ProcessSection from "@/components/homepage/ProcessSection";
import FAQSection from "@/components/homepage/FAQSection";
import FinalCTASection from "@/components/homepage/FinalCTASection";
import Footer from "@/components/common/Footer";

export default function Home() {
  // Homepage motion respects prefers-reduced-motion: Motion skips transform animations for those
  // users (reveals and the FAQ accordion also pass an instant transition; see ui/Reveal.tsx).
  return (
    <MotionConfig reducedMotion="user">
      <main>
        {/* H4: FanIntroWrapper removed from the homepage per the H4 task's own decision point --
            the ported HeroSilkStage's own ~3s opening animation now plays that role instead.
            components/intro/ is kept (FanIntroWrapper, FanIntro), just unused here, in case a
            future decision brings the full-screen intro back. */}
        <Navbar />

        {/* 1. Hero — what Nan is, primary CTA. R20: HeroSignature (one fan in one light, with a
            name tag the visitor writes on). Rollback to R19: import and mount
            components/homepage/atelier/HeroAtelier instead (R18: HeroImprint). */}
        <HeroSignature />

        {/* Narrative wrapper: BrandStatement → FinalCTA. The R6 bamboo rib (BrandStatement) and
            the Process rail carry the thread between chapters; the old fixed motif is gone. */}
        <div id="homepage-narrative">

          {/* 2. Brand Statement — manifesto, why Nan exists */}
          <BrandStatementSection />

          {/* 3. Problem + Solution — one editorial spread (R6). R10.2: moved ahead of the
              catalogue so the two paper sections (ProductType, Material) form one continuous paper
              chapter: dark → paper → dark, instead of navy/cream alternating block by block. */}
          <ProblemSolutionSection />

          {/* 4. Choose Fan Type — real category discovery */}
          <ProductTypeSection />

          {/* 5. Materials & Craft — paper, fabric, finishes */}
          <MaterialSection />

          {/* 6. Use Cases — events, resorts, restaurants, corporate, brand */}
          <UseCaseSection />

          {/* 7. Process — quote-first workflow */}
          <ProcessSection />

          {/* 8. FAQ */}
          <FAQSection />

          {/* 9. Final Quote CTA */}
          <FinalCTASection />

        </div>

        <Footer />
      </main>
    </MotionConfig>
  );
}
