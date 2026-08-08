import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { AIChatPreview } from "@/components/landing/AIChatPreview";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { ShaderBackground } from "@/components/landing/ShaderBackground";

export default function LandingPage() {
  return (
    <main className="relative bg-[#0b1326] text-[#dae2fd] min-h-screen flex flex-col selection:bg-[#c3c0ff]/30 selection:text-[#c3c0ff]">
      <div className="fixed inset-0 z-0">
        <ShaderBackground opacity={0.5} />
      </div>
      <div className="relative z-10 flex flex-col">
        <Navbar />
        <Hero />
        <Features />
        <ArchitectureSection />
        <AIChatPreview />
        <Testimonials />
        <FAQ />
        <Pricing />
        <Footer />
      </div>
    </main>
  );
}
