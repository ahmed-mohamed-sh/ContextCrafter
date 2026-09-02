import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { AIChatPreview } from "@/components/landing/AIChatPreview";
import { IntegrationsSection } from "@/components/landing/IntegrationsSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { ShaderBackground } from "@/components/landing/ShaderBackground";

export default function LandingPage() {
  return (
    <main className="relative bg-[#0b1326] text-[#dae2fd] min-h-screen flex flex-col selection:bg-[#c3c0ff]/30 selection:text-[#c3c0ff]">
      {/* Background WebGL Shader */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ShaderBackground opacity={0.4} />
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col">
        <Navbar />
        <Hero />
        <Features />
        <HowItWorks />
        <ArchitectureSection />
        <ComparisonSection />
        <AIChatPreview />
        <IntegrationsSection />
        <SecuritySection />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTASection />
        <Footer />
      </div>
    </main>
  );
}
