import { MotionConfig } from "motion/react";
import Navbar from "@/components/common/Navbar";
import HeroSection from "@/components/homepage/HeroSection";
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

        {/* 1. Hero — what Nan is, primary CTA */}
        <HeroSection />

        {/* Narrative wrapper: BrandStatement → FinalCTA. The R6 bamboo rib (BrandStatement) and
            the Process rail carry the thread between chapters; the old fixed motif is gone. */}
        <div id="homepage-narrative">

          {/* 2. Brand Statement — manifesto, why Nan exists */}
          <BrandStatementSection />

          {/* 3. Choose Fan Type — real category discovery */}
          <ProductTypeSection />

          {/* 4–5. Problem + Solution — one editorial spread (R6) */}
          <ProblemSolutionSection />

          {/* 6. Materials & Craft — paper, fabric, finishes */}
          <MaterialSection />

          {/* 7. Use Cases — events, resorts, restaurants, corporate, brand */}
          <UseCaseSection />

          {/* 8. Process — quote-first workflow */}
          <ProcessSection />

          {/* 9. FAQ */}
          <FAQSection />

          {/* 10. Final Quote CTA */}
          <FinalCTASection />

        </div>

        <Footer />
      </main>
    </MotionConfig>
  );
}
