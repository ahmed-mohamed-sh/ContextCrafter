"use client";

import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-24 px-6 md:px-8 max-w-6xl mx-auto" id="cta">
      <div
        className="rounded-3xl p-10 sm:p-16 border border-primary/30 relative overflow-hidden text-center flex flex-col items-center justify-center shadow-2xl"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(79, 70, 229, 0.3) 0%, rgba(19, 27, 46, 0.9) 70%)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 0 80px rgba(79, 70, 229, 0.15)",
        }}
      >
        {/* Background ambient glow circles */}
        <div className="w-125500px] rounded-full border border-white/5 opacity-30 absolute pointer-events-none" />
        <div className="w-75 h-75 rounded-full border border-white/5 opacity-30 absolute pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-container/30 border border-primary-container/40 text-xs font-semibold text-[#c3c0ff] tracking-wide uppercase mb-6 relative z-10">
          <span className="material-symbols-outlined text-[15px]">
            rocket_launch
          </span>
          Start in less than 2 minutes
        </div>

        {/* Headline */}
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-on-surface tracking-tight max-w-2xl mb-4 relative z-10"
          style={{ fontFamily: "Geist, sans-serif" }}
        >
          Ready to supercharge your codebase with deep AI context?
        </h2>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-on-surface-variant max-w-xl mb-8 relative z-10 leading-relaxed">
          Connect your GitHub repository today. Experience zero-hallucination
          code generation, automatic architectural mapping, and technical debt
          insights for free.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 hover:brightness-110 flex items-center gap-2.5 shadow-lg shadow-primary-container/30"
            style={{
              background: "#4f46e5",
              color: "#dad7ff",
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
            }}
          >
            <span className="material-symbols-outlined text-[18px]">
              terminal
            </span>
            Start Building Free
          </Link>
          <a
            href="https://github.com/ahmed-mohamed-sh/ContextCrafter"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 hover:bg-white/10 flex items-center gap-2 border border-white/10"
            style={{
              color: "#dae2fd",
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
            }}
          >
            <span className="material-symbols-outlined text-[18px]">star</span>
            Star on GitHub
          </a>
        </div>

        {/* Feature Points Under Button */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-on-surface-variant relative z-10">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-green-400 text-[16px]">
              check
            </span>
            No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-green-400 text-[16px]">
              check
            </span>
            Free for public & personal repos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-green-400 text-[16px]">
              check
            </span>
            Instant 60-second setup
          </span>
        </div>
      </div>
    </section>
  );
}
