import Navbar from "@/components/common/Navbar";
import HeroSection from "@/components/homepage/HeroSection";
import AIDesignerSection from "@/components/homepage/AIDesignerSection";
import ProductTypeSection from "@/components/homepage/ProductTypeSection";
import UseCaseSection from "@/components/homepage/UseCaseSection";
import MaterialSection from "@/components/homepage/MaterialSection";
import ProcessSection from "@/components/homepage/ProcessSection";
import FinalCTASection from "@/components/homepage/FinalCTASection";
import Footer from "@/components/common/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <AIDesignerSection />
      <ProductTypeSection />
      <UseCaseSection />
      <MaterialSection />
      <ProcessSection />
      <FinalCTASection />
      <Footer />
    </main>
  );
}