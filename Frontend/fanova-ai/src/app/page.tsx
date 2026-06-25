import FanIntroWrapper from "@/components/intro/FanIntroWrapper";
import Navbar from "@/components/common/Navbar";
import HeroSection from "@/components/homepage/HeroSection";
import BrandStatementSection from "@/components/homepage/BrandStatementSection";
import ProductTypeSection from "@/components/homepage/ProductTypeSection";
import ProblemSection from "@/components/homepage/ProblemSection";
import SolutionSection from "@/components/homepage/SolutionSection";
import AIDesignerSection from "@/components/homepage/AIDesignerSection";
import MaterialSection from "@/components/homepage/MaterialSection";
import UseCaseSection from "@/components/homepage/UseCaseSection";
import ProcessSection from "@/components/homepage/ProcessSection";
import FAQSection from "@/components/homepage/FAQSection";
import FinalCTASection from "@/components/homepage/FinalCTASection";
import Footer from "@/components/common/Footer";

export default function Home() {
  return (
    <main>
      <FanIntroWrapper />
      <Navbar />

      {/* 1. Hero — what Nan is, primary CTA */}
      <HeroSection />

      {/* 2. Brand Statement — manifesto, why Nan exists */}
      <BrandStatementSection />

      {/* 3. Choose Fan Type — real category discovery */}
      <ProductTypeSection />

      {/* 4. Problem — why generic brand gifts fail */}
      <ProblemSection />

      {/* 5. Solution — how Nan solves it */}
      <SolutionSection />

      {/* 6. AI Designer — try mockup now (preserved) */}
      <AIDesignerSection />

      {/* 7. Materials & Craft — paper, fabric, finishes */}
      <MaterialSection />

      {/* 8. Use Cases — events, resorts, restaurants, corporate, brand */}
      <UseCaseSection />

      {/* 9. Process — quote-first workflow */}
      <ProcessSection />

      {/* 10. FAQ */}
      <FAQSection />

      {/* 11. Final Quote CTA */}
      <FinalCTASection />

      <Footer />
    </main>
  );
}
