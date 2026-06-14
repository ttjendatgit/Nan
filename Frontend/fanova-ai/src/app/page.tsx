import FanIntroWrapper from "@/components/intro/FanIntroWrapper";
import Navbar from "@/components/common/Navbar";
import HeroSection from "@/components/homepage/HeroSection";
import ProductTypeSection from "@/components/homepage/ProductTypeSection";
import AIDesignerSection from "@/components/homepage/AIDesignerSection";
import MaterialSection from "@/components/homepage/MaterialSection";
import ProcessSection from "@/components/homepage/ProcessSection";
import UseCaseSection from "@/components/homepage/UseCaseSection";
import FAQSection from "@/components/homepage/FAQSection";
import FinalCTASection from "@/components/homepage/FinalCTASection";
import Footer from "@/components/common/Footer";

export default function Home() {
  return (
    <main>
      <FanIntroWrapper />
      <Navbar />
      <HeroSection />
      <ProductTypeSection />
      <AIDesignerSection />
      <MaterialSection />
      <ProcessSection />
      <UseCaseSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </main>
  );
}
