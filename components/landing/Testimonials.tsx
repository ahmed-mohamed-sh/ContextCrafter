"use client";

import { motion, type Variants } from "framer-motion";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "VP Engineering at TechFlow",
    quote:
      "ContextCrafter has saved our team hundreds of hours in code reviews. Its architectural understanding is unmatched.",
  },
  {
    name: "Marcus Thorne",
    role: "Staff Engineer at Nexa",
    quote:
      "Onboarding new engineers used to take weeks. Now, they can ask the codebase questions directly and get accurate answers instantly.",
  },
  {
    name: "Elena Rodriguez",
    role: "CTO at BuildKite",
    quote:
      "The refactoring suggestions alone are worth the price. It identifies tight coupling that our senior devs missed during architecture reviews.",
  },
];

const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const card: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    filter: "blur(8px)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function Testimonials() {
  return (
    <section
      className="py-24 px-6 md:px-8 max-w-6xl mx-auto"
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
          Trusted by Technical Leaders
        </h2>
      </div>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
      >
        {testimonials.map((t) => (
          <motion.div
            key={t.name}
            variants={card}
            whileHover={{
              y: -8,
              scale: 1.02,
              transition: {
                duration: 0.25,
              },
            }}
            className="rounded-xl p-6"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(23,31,51,0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "#31394d" }}
              >
                <span className="material-symbols-outlined text-[#c7c4d8]">
                  person
                </span>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#dae2fd",
                  }}
                >
                  {t.name}
                </p>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    color: "#918fa1",
                  }}
                >
                  {t.role}
                </p>
              </div>
            </div>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                lineHeight: "20px",
                color: "#c7c4d8",
                fontStyle: "italic",
              }}
            >
              &quot;{t.quote}&quot;
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
