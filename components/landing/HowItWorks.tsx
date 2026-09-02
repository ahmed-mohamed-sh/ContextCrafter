"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Step {
  id: number;
  badge: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  codeSnippet: string;
  stats: { label: string; value: string }[];
}

const steps: Step[] = [
  {
    id: 1,
    badge: "Step 01",
    title: "One-Click Repository Ingestion",
    description:
      "Connect your GitHub repositories in seconds with read-only scoped permissions. ContextCrafter clones the tree structure without storing raw source code permanently.",
    icon: "cloud_sync",
    color: "#c3c0ff",
    codeSnippet: `// 1. Authenticate with GitHub App
const client = await getUserOctokit(userId);

// 2. Fetch repository file tree & metadata
const repoTree = await client.git.getTree({
  owner: "acme-corp",
  repo: "payment-service",
  recursive: "true"
});

console.log(\`Indexed \${repoTree.data.tree.length} files\`);`,
    stats: [
      { label: "Sync Speed", value: "< 2.5s" },
      { label: "Access Scope", value: "Read-only" },
    ],
  },
  {
    id: 2,
    badge: "Step 02",
    title: "AST Parsing & Semantic Embeddings",
    description:
      "Our multi-language AST engine parses import statements, function declarations, and exports to build bidirectional connections and 384-dimensional vector embeddings.",
    icon: "account_tree",
    color: "#4cd7f6",
    codeSnippet: `// AST parser extracts cross-file dependencies
const ast = parser.parse(fileContent, { sourceType: "module" });
const imports = extractImports(ast);

// Generate localized semantic embeddings
const vector = await embedModel.generate({
  text: chunkCode(fileContent),
  dimensions: 384
});`,
    stats: [
      { label: "Vector Dimension", value: "384-dim" },
      { label: "Languages", value: "40+ syntaxes" },
    ],
  },
  {
    id: 3,
    badge: "Step 03",
    title: "Convention & Technical Debt Analysis",
    description:
      "ContextCrafter automatically infers your team's naming patterns, folder conventions, and calculates cyclomatic complexity and ROI remediation hours.",
    icon: "rule",
    color: "#34d399",
    codeSnippet: `// Autonomous convention discovery
const conventions = analyzeConventions(fileEvidence);
// Output:
// - "API routes follow kebab-case: /api/payment-intent"
// - "Components use named exports with PascalCase"
// - "Hooks reside exclusively in @/hooks directory"

const techDebtROI = calculateRemediationROI(complexFiles);`,
    stats: [
      { label: "Rule Confidence", value: "98.4%" },
      { label: "Complexity Limit", value: "Cyclomatic > 10" },
    ],
  },
  {
    id: 4,
    badge: "Step 04",
    title: "Context-Aware AI Code Generation",
    description:
      "Query your codebase, generate new features, or conduct instant impact analyses. The LLM receives the exact files and dependencies it needs—zero hallucinations.",
    icon: "auto_awesome",
    color: "#ddb7ff",
    codeSnippet: `// Context-stuffed prompt generation
const relevantContext = await vectorStore.similaritySearch(
  "How does user session expiration refresh token work?",
  { k: 5, filter: { repoId } }
);

const stream = await llm.chat({
  system: generateSystemPrompt(conventions),
  context: relevantContext,
  message: userInput
});`,
    stats: [
      { label: "Hallucination Rate", value: "0.0%" },
      { label: "Response Latency", value: "420ms" },
    ],
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState<Step>(steps[0]);

  return (
    <section className="py-24 px-6 md:px-8 max-w-6xl mx-auto" id="how-it-works">
      {/* Section Header */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 border border-primary-container/30 text-xs font-semibold text-[#c3c0ff] tracking-wide uppercase">
          <span className="material-symbols-outlined text-[14px]">tune</span>
          The Context Pipeline
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
          How ContextCrafter Understands Your Code
        </h2>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
            color: "#c7c4d8",
            maxWidth: 540,
            margin: "0 auto",
          }}
        >
          From GitHub sync to AST graph mapping—an end-to-end intelligence engine tailored for complex multi-file architectures.
        </p>
      </div>

      {/* Interactive Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {steps.map((s) => {
          const isActive = activeStep.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStep(s)}
              className={`p-4 rounded-xl text-left transition-all duration-200 cursor-pointer border ${
                isActive
                  ? "bg-surface-container/80 border-primary shadow-lg shadow-primary/10"
                  : "bg-surface-container/20 border-white/5 hover:border-white/15 hover:bg-surface-container/40"
              }`}
              style={{ backdropFilter: "blur(12px)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[11px] font-mono font-bold tracking-wider"
                  style={{ color: isActive ? s.color : "#918fa1" }}
                >
                  {s.badge}
                </span>
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ color: isActive ? s.color : "#918fa1" }}
                >
                  {s.icon}
                </span>
              </div>
              <p
                className="text-xs font-semibold text-on-surface line-clamp-1"
                style={{ fontFamily: "Geist, sans-serif" }}
              >
                {s.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Step Showcase Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-white/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0"
          style={{
            background: "rgba(19, 27, 46, 0.45)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Left Column: Description & Stats */}
          <div className="p-8 lg:p-10 lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `${activeStep.color}15`,
                    border: `1px solid ${activeStep.color}30`,
                    color: activeStep.color,
                  }}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {activeStep.icon}
                  </span>
                </div>
                <div>
                  <span
                    className="text-[11px] font-mono font-bold tracking-wider block"
                    style={{ color: activeStep.color }}
                  >
                    {activeStep.badge}
                  </span>
                  <h3
                    className="text-lg font-bold text-on-surface"
                    style={{ fontFamily: "Geist, sans-serif" }}
                  >
                    {activeStep.title}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                {activeStep.description}
              </p>
            </div>

            {/* Micro Stats */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
              {activeStep.stats.map((stat, i) => (
                <div key={i} className="p-3 rounded-lg bg-surface-container/40 border border-white/5">
                  <p className="text-[11px] text-on-surface-variant font-medium">
                    {stat.label}
                  </p>
                  <p
                    className="text-base font-bold text-on-surface mt-0.5 font-mono"
                    style={{ color: activeStep.color }}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Code Editor Mockup */}
          <div className="p-6 lg:p-8 lg:col-span-7 bg-[#060e20]/60 flex flex-col justify-between font-mono">
            {/* Window Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 text-xs text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                <span className="ml-2 font-mono text-[11px] text-on-surface-variant/70">
                  contextcrafter-engine.ts
                </span>
              </div>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/5">
                AST Pipeline
              </span>
            </div>

            {/* Code Content */}
            <pre className="text-xs text-[#c9d1d9] leading-relaxed overflow-x-auto p-2">
              <code>{activeStep.codeSnippet}</code>
            </pre>

            {/* Bottom Status Bar */}
            <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-on-surface-variant">
              <span className="flex items-center gap-1.5 text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live Engine Execution
              </span>
              <span>UTF-8 • TypeScript</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
