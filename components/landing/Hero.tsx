"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useTransform,
  useScroll,
  useSpring,
  type Variants,
} from "framer-motion";

const code = `import { CodeGraph } from '@contextcrafter/core';

// Initialize deep semantic analysis
const graph = new CodeGraph(process.env.REPO_PATH);

await graph.buildIndexes({
  depth: Infinity,
  followImports: true,
  analyzeDependencies: true
});

// Query architecture
const impact = await graph.analyzeImpact('src/auth/session.ts');
console.log(\`Refactoring affects \${impact.files.length} files.\`);`;

const codeLines = code.split("\n");

/* ─── animation variants ─── */

const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const headlineVariant: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(20px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const paragraphVariant: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 },
  },
};

const codeWindowVariant: Variants = {
  hidden: {
    opacity: 0,
    y: 60,
    rotateX: 12,
    scale: 0.94,
    filter: "blur(6px)",
  },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 },
  },
};

/* ─── syntax highlighter ─── */

function highlightLine(line: string): string {
  return line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /\b(import|from|const|await|new|true|false|Infinity)\b/g,
      '<span style="color:#4cd7f6">$1</span>',
    )
    .replace(/('.*?'|`.*?`)/g, '<span style="color:#c3c0ff">$1</span>')
    .replace(/(\/\/.*)/g, '<span style="color:#464555">$1</span>')
    .replace(/\b(CodeGraph)\b/g, '<span style="color:#ddb7ff">$1</span>');
}

/* ─── typewriter with loop ─── */

const CHAR_DELAY = 40;
const NEWLINE_DELAY = 100;
const PAUSE_AFTER_TYPED = 3000;
const ERASE_LINE_DELAY = 60;
const PAUSE_AFTER_ERASE = 1000;

function TypewriterCode() {
  const totalChars = code.length;
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState<
    "typing" | "paused" | "erasing" | "erasePause"
  >("typing");
  const [visibleLines, setVisibleLines] = useState(codeLines.length);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (charIndex < totalChars) {
        const currentChar = code[charIndex];
        const delay = currentChar === "\n" ? NEWLINE_DELAY : CHAR_DELAY;
        timer = setTimeout(() => setCharIndex((c) => c + 1), delay);
      } else {
        timer = setTimeout(() => setPhase("paused"), PAUSE_AFTER_TYPED);
      }
    } else if (phase === "paused") {
      setVisibleLines(codeLines.length);
      setPhase("erasing");
    } else if (phase === "erasing") {
      if (visibleLines > 0) {
        timer = setTimeout(
          () => setVisibleLines((v) => v - 1),
          ERASE_LINE_DELAY,
        );
      } else {
        timer = setTimeout(() => setPhase("erasePause"), PAUSE_AFTER_ERASE);
      }
    } else if (phase === "erasePause") {
      setCharIndex(0);
      setVisibleLines(codeLines.length);
      setPhase("typing");
    }

    return () => clearTimeout(timer);
  }, [charIndex, phase, visibleLines, totalChars]);

  // Build the visible text from charIndex
  const typedText =
    phase === "erasing" || phase === "paused"
      ? codeLines.slice(0, visibleLines)
      : code.slice(0, charIndex).split("\n");

  const isTyping = phase === "typing" && charIndex < totalChars;
  const showCursor = phase === "typing" || phase === "paused";

  return (
    <pre
      style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 13,
        lineHeight: "22px",
        color: "#c7c4d8",
        minHeight: codeLines.length * 22,
      }}
    >
      {typedText.map((line, i) => (
        <div key={i} className="flex gap-4">
          <span
            style={{
              color: "rgba(255,255,255,0.2)",
              minWidth: 20,
              textAlign: "right",
              userSelect: "none",
            }}
          >
            {i + 1}
          </span>
          <span>
            <span
              dangerouslySetInnerHTML={{
                __html: highlightLine(line) || "&nbsp;",
              }}
            />
            {showCursor && i === typedText.length - 1 && (
              <motion.span
                animate={{ opacity: isTyping ? 1 : [1, 1, 0, 0] }}
                transition={
                  isTyping
                    ? { duration: 0 }
                    : {
                        duration: 1,
                        repeat: Infinity,
                        times: [0, 0.5, 0.5, 1],
                        ease: "linear" as const,
                      }
                }
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 15,
                  background: "#4cd7f6",
                  marginLeft: 2,
                  verticalAlign: "middle",
                  borderRadius: 1,
                }}
              />
            )}
          </span>
        </div>
      ))}
    </pre>
  );
}

/* ─── hero ─── */

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);

  /* 12 — Mouse parallax */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 30 });
  const parallaxX = useTransform(springX, [-0.5, 0.5], [-3, 3]);
  const parallaxY = useTransform(springY, [-0.5, 0.5], [-3, 3]);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  /* 14 — Scroll fade-out */
  const { scrollY } = useScroll();
  const scrollOpacity = useTransform(scrollY, [0, 600], [1, 0.6]);
  const scrollScale = useTransform(scrollY, [0, 600], [1, 0.95]);

  /* 13 — Floating gradient position */
  const [gradientPos, setGradientPos] = useState(50);
  useEffect(() => {
    let frame: number;
    let t = 0;
    function tick() {
      t += 0.002;
      setGradientPos(50 + Math.sin(t) * 20);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <motion.section
      ref={heroRef}
      style={{ opacity: scrollOpacity, scale: scrollScale }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 md:px-8 pt-16"
    >
      {/* ── Background glow (breathing + floating gradient) ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 2 — Breathing glow */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-125 rounded-full"
          style={{
            background: `radial-gradient(ellipse at ${gradientPos}% 50%, rgba(79,70,229,0.12) 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-40"
          style={{
            background: "linear-gradient(to bottom, transparent, #0b1326)",
          }}
        />
      </div>

      {/* 12 — Mouse parallax wrapper */}
      <motion.div
        style={{ x: parallaxX, y: parallaxY }}
        className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center gap-10"
      >
        {/* 1 — Stagger container */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center gap-10 w-full"
        >
          {/* ── Badge (3 — float) ── */}
          <motion.div variants={item}>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse" />
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 13,
                  color: "#4cd7f6",
                }}
              >
                v2.0 Beta Available
              </span>
            </motion.div>
          </motion.div>

          {/* ── Headline (4 — blur reveal) ── */}
          <motion.div variants={item} className="space-y-4 max-w-3xl">
            <motion.h1
              variants={headlineVariant}
              className="tracking-tight"
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: "clamp(40px, 6vw, 64px)",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: "#dae2fd",
              }}
            >
              AI that understands <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #c3c0ff, #4cd7f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                YOUR codebase.
              </span>
            </motion.h1>

            {/* 5 — Paragraph with delay */}
            <motion.p
              variants={paragraphVariant}
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 16,
                lineHeight: "24px",
                color: "#c7c4d8",
                maxWidth: 560,
                margin: "0 auto",
              }}
            >
              Stop generic completions. ContextCrafter builds a deep semantic
              graph of your entire repository, delivering context-aware
              assistance, architectural refactoring, and documentation
              generation.
            </motion.p>
          </motion.div>

          {/* ── CTAs (6 — hover/tap + 11 — glow pulse) ── */}
          <motion.div
            variants={item}
            className="flex flex-col sm:flex-row gap-4"
          >
            {/* Primary CTA with pulsing glow */}
            <Link href="/login" passHref legacyBehavior>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="relative flex items-center justify-center gap-2 px-8 py-4 rounded-lg cursor-pointer"
                style={{
                  background: "#4f46e5",
                  color: "#dad7ff",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  borderTop: "1px solid rgba(255,255,255,0.2)",
                  border: "none",
                  borderImage: "none",
                }}
              >
                {/* 11 — Animated glow behind button */}
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 25px rgba(79,70,229,0.4)",
                      "0 0 45px rgba(79,70,229,0.6)",
                      "0 0 25px rgba(79,70,229,0.4)",
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 rounded-lg"
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.2)",
                  }}
                />
                <span
                  className="material-symbols-outlined relative z-10"
                  style={{ fontSize: 18 }}
                >
                  code
                </span>
                <span className="relative z-10">Connect GitHub</span>
              </motion.button>
            </Link>

            {/* Secondary CTA */}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg cursor-pointer"
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: "#dae2fd",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18 }}
              >
                play_circle
              </span>
              Watch Demo
            </motion.button>
          </motion.div>

          {/* ── Code Window (7 — 3D entrance, 8 — typewriter, 9 — cursor, 10 — hover) ── */}
          <motion.div
            variants={codeWindowVariant}
            style={{ perspective: 1200 }}
            className="w-full max-w-4xl"
          >
            <motion.div
              whileHover={{
                y: -8,
                scale: 1.01,
                boxShadow: "0 50px 100px rgba(0,0,0,0.5)",
              }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="w-full rounded-xl overflow-hidden"
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(23,31,51,0.5)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
              }}
            >
              {/* Window chrome */}
              <div
                className="flex items-center gap-3 px-4 h-10"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(11,19,38,0.6)",
                }}
              >
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full"
                      style={{ background: "rgba(255,255,255,0.15)" }}
                    />
                  ))}
                </div>
                <span
                  className="ml-2"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 11,
                    color: "#918fa1",
                  }}
                >
                  crafter.ts
                </span>
              </div>

              {/* Code lines — typing animation loop */}
              <div className="relative p-6 text-left">
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, rgba(79,70,229,0.05) 0%, transparent 70%)",
                  }}
                />
                <TypewriterCode />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
