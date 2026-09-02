"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const comparisonData = [
  {
    feature: "Cross-file Dependencies",
    generic: "Blind to external imports; hallucinates missing interfaces and functions",
    contextCrafter: "Full AST graph mapping across microservices with verified type contracts",
    icon: "account_tree",
  },
  {
    feature: "Coding Conventions & Rules",
    generic: "Applies generic boilerplate that breaks existing repository styling rules",
    contextCrafter: "Learns and enforces naming, folder structures, and export paradigms automatically",
    icon: "rule",
  },
  {
    feature: "Downstream Impact Analysis",
    generic: "No awareness of breaking changes across dependent downstream files",
    contextCrafter: "Predicts exact ripple effects and lists impacted files before you commit",
    icon: "warning",
  },
  {
    feature: "Code Quality & Technical Debt",
    generic: "Cannot measure complexity or track codebase degradation over time",
    contextCrafter: "Live cyclomatic complexity radar, dead code detection, and ROI effort metrics",
    icon: "speed",
  },
  {
    feature: "Security & Secret Privacy",
    generic: "Prompts may be stored or used to train public foundational models",
    contextCrafter: "Zero data retention policy; scoped read-only tokens encrypted with AES-256",
    icon: "security",
  },
];

export function ComparisonSection() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section className="py-24 px-6 md:px-8 max-w-6xl mx-auto" id="comparison">
      {/* Section Header */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4cd7f6]/10 border border-[#4cd7f6]/20 text-xs font-semibold text-[#4cd7f6] tracking-wide uppercase">
          <span className="material-symbols-outlined text-[14px]">compare_arrows</span>
          Why Context Matters
        </div>
        <h2
          style={{
            fontFamily: "Geist, sans-serif",
            fontSize: 34,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "#dae2fd",
          }}
        >
          Generic AI vs. Full Architectural Context
        </h2>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
            color: "#c7c4d8",
            maxWidth: 520,
            margin: "0 auto",
          }}
        >
          See why pasting code snippets into generic LLMs fails for production codebases—and how ContextCrafter changes the game.
        </p>
      </div>

      {/* Comparison Grid Table */}
      <div
        className="rounded-2xl border border-white/10 overflow-hidden"
        style={{
          background: "rgba(19, 27, 46, 0.4)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Table Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 p-6 border-b border-white/10 bg-surface-container/30 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          <div className="md:col-span-4 hidden md:block">Capability / Dimension</div>
          <div className="md:col-span-4 text-[#ffb4ab] flex items-center gap-1.5 mb-2 md:mb-0">
            <span className="material-symbols-outlined text-[16px]">cancel</span>
            Generic AI Assistant
          </div>
          <div className="md:col-span-4 text-[#c3c0ff] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            ContextCrafter Platform
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          {comparisonData.map((row, i) => (
            <motion.div
              key={row.feature}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`grid grid-cols-1 md:grid-cols-12 p-5 sm:p-6 transition-colors duration-200 ${
                hoveredIdx === i ? "bg-white/[0.03]" : ""
              }`}
            >
              {/* Feature Title */}
              <div className="md:col-span-4 flex items-start gap-3 mb-3 md:mb-0">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high/60 border border-white/10 flex items-center justify-center shrink-0 text-primary">
                  <span className="material-symbols-outlined text-[18px]">
                    {row.icon}
                  </span>
                </div>
                <div>
                  <h4
                    className="text-sm font-semibold text-on-surface"
                    style={{ fontFamily: "Geist, sans-serif" }}
                  >
                    {row.feature}
                  </h4>
                </div>
              </div>

              {/* Generic AI Column */}
              <div className="md:col-span-4 pr-0 md:pr-4 mb-3 md:mb-0">
                <span className="md:hidden text-[10px] uppercase font-bold text-[#ffb4ab] block mb-1">
                  Generic AI:
                </span>
                <p className="text-xs text-on-surface-variant/80 leading-relaxed flex items-start gap-2">
                  <span className="text-[#ffb4ab] font-bold text-sm shrink-0">✕</span>
                  <span>{row.generic}</span>
                </p>
              </div>

              {/* ContextCrafter Column */}
              <div className="md:col-span-4 pl-0 md:pl-2">
                <span className="md:hidden text-[10px] uppercase font-bold text-[#c3c0ff] block mb-1">
                  ContextCrafter:
                </span>
                <p className="text-xs text-on-surface font-medium leading-relaxed flex items-start gap-2">
                  <span className="text-green-400 font-bold text-sm shrink-0">✓</span>
                  <span>{row.contextCrafter}</span>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
