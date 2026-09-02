"use client";
import Link from "next/link";

export function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 h-16 flex justify-between items-center px-8"
      style={{
        background: "rgba(11,19,38,0.4)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#c3c0ff]">hub</span>
        <span
          className="font-bold text-xl text-[#c3c0ff] tracking-tight"
          style={{ fontFamily: "Geist, sans-serif" }}
        >
          ContextCrafter
        </span>
      </div>
      <div className="hidden md:flex items-center gap-6">
        {[
          { name: "Features", href: "#features" },
          { name: "How It Works", href: "#how-it-works" },
          { name: "Comparison", href: "#comparison" },
          { name: "Security", href: "#security" },
          { name: "Pricing", href: "#pricing" },
        ].map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="text-[12px] font-semibold tracking-widest text-on-surface-variant hover:text-[#c3c0ff] transition-colors uppercase"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {item.name}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Link href="/login" passHref legacyBehavior>
          <button
            className="text-[12px] font-semibold text-[#c3c0ff] px-4 py-2 rounded transition-colors hover:bg-white/5 cursor-pointer"
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Sign In
          </button>
        </Link>
        <Link href="/login" passHref legacyBehavior>
          <button
            className="text-[12px] font-semibold px-4 py-2 rounded transition-all hover:brightness-110 cursor-pointer"
            style={{
              background: "#4f46e5",
              color: "#dad7ff",
              borderTop: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 0 15px rgba(79,70,229,0.3)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Get Started
          </button>
        </Link>
      </div>
    </nav>
  );
}
