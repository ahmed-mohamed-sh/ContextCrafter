"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "Is my code secure? Are you SOC2 compliant?",
    a: "Yes, we are SOC2 Type II compliant. Your code is encrypted at rest and in transit. We do not use your proprietary codebase to train our underlying models.",
  },
  {
    q: "Which languages do you support?",
    a: "We support over 40+ programming languages including JavaScript, TypeScript, Python, Rust, Go, Java, and C++. Our semantic engine understands dependencies across language boundaries.",
  },
  {
    q: "Can I integrate with GitHub or GitLab?",
    a: "Yes! ContextCrafter offers deep integrations with GitHub, GitLab, and Bitbucket. We can analyze PRs automatically and provide context-aware review comments.",
  },
  {
    q: "Do you support custom LLMs?",
    a: "Enterprise customers can connect their own fine-tuned models or self-hosted LLMs for maximum privacy and customized performance.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      className="py-24 px-6 md:px-8 max-w-3xl mx-auto"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="text-center mb-16">
        <h2
          style={{
            fontFamily: "Geist, sans-serif",
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "#dae2fd",
          }}
        >
          Frequently Asked Questions
        </h2>
      </div>
      <div className="space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className="rounded-xl overflow-hidden"
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(23,31,51,0.2)",
              }}
            >
              <button
                className="w-full flex items-center justify-between p-6 text-left cursor-pointer focus:outline-none"
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#dae2fd",
                  }}
                >
                  {faq.q}
                </span>
                <motion.span
                  className="material-symbols-outlined text-on-surface-variant"
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                  style={{ fontSize: 20 }}
                >
                  expand_more
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                      height: { duration: 0.35, ease: [0.25, 1, 0.5, 1] },
                      opacity: { duration: 0.25, ease: "linear" },
                    }}
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      className="px-6 pb-6"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 14,
                        lineHeight: "20px",
                        color: "#918fa1",
                      }}
                    >
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
