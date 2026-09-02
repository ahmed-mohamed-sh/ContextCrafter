"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";

/* ─── Animated Code Graph (Canvas) ─── */

interface GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: "file" | "component" | "api";
}

function CodeGraphCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.clientWidth * 2;
      canvas.height = canvas.clientHeight * 2;
      ctx!.scale(2, 2);
    }
    resize();
    window.addEventListener("resize", resize);

    const types: GraphNode["type"][] = [
      "file",
      "component",
      "api",
    ];
    const colors = {
      file: "rgba(195, 192, 255, 0.6)",
      component: "rgba(76, 215, 246, 0.6)",
      api: "rgba(221, 183, 255, 0.6)",
    };
    const glowColors = {
      file: "rgba(195, 192, 255, 0.15)",
      component: "rgba(76, 215, 246, 0.15)",
      api: "rgba(221, 183, 255, 0.15)",
    };

    const count = 40;
    const nodes: GraphNode[] = [];
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * canvas.clientWidth,
        y: Math.random() * canvas.clientHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 2,
        type: types[Math.floor(Math.random() * types.length)],
      });
    }
    nodesRef.current = nodes;

    function draw() {
      if (!canvas || !ctx) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      ctx.clearRect(0, 0, w, h);

      const currentNodes = nodesRef.current;
      const distLimit = 100;

      /* connections */
      for (let i = 0; i < currentNodes.length; i++) {
        for (let j = i + 1; j < currentNodes.length; j++) {
          const a = currentNodes[i];
          const b = currentNodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < distLimit) {
            const alpha = (1 - dist / distLimit) * 0.12;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(76, 215, 246, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      /* nodes */
      currentNodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > w) node.vx *= -1;
        if (node.y < 0 || node.y > h) node.vy *= -1;

        /* glow */
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = glowColors[node.type];
        ctx.fill();

        /* dot */
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = colors[node.type];
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    />
  );
}

/* ─── Floating Code Snippet ─── */

function CodeSnippet({
  code,
  delay,
  top,
  left,
}: {
  code: string;
  delay: number;
  top: string;
  left: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className="absolute pointer-events-none select-none"
      style={{ top, left }}
    >
      <div
        className="rounded-lg px-4 py-3 text-xs font-mono max-w-[260px]"
        style={{
          background: "rgba(23, 31, 51, 0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          color: "rgba(195, 192, 255, 0.7)",
          lineHeight: "1.6",
        }}
      >
        {/* window dots */}
        <div className="flex gap-1.5 mb-2">
          <div className="w-2 h-2 rounded-full bg-red-400/40" />
          <div className="w-2 h-2 rounded-full bg-yellow-400/40" />
          <div className="w-2 h-2 rounded-full bg-green-400/40" />
        </div>
        <pre className="whitespace-pre-wrap text-[11px]">{code}</pre>
      </div>
    </motion.div>
  );
}

/* ─── Feature Pill ─── */

function FeaturePill({
  icon,
  label,
  delay,
}: {
  icon: string;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
      style={{
        background: "rgba(79, 70, 229, 0.08)",
        border: "1px solid rgba(79, 70, 229, 0.15)",
        color: "#c3c0ff",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 14 }}
      >
        {icon}
      </span>
      {label}
    </motion.div>
  );
}

/* ─── Animated Stats Counter ─── */

function AnimatedStat({
  value,
  label,
  delay,
}: {
  value: string;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="text-center"
    >
      <p
        style={{
          fontFamily: "Geist, sans-serif",
          fontSize: 24,
          fontWeight: 700,
          color: "#c3c0ff",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 11,
          color: "#918fa1",
          marginTop: 4,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </p>
    </motion.div>
  );
}

/* ─── Main Login Page ─── */

export default function LoginPage() {
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  const handleGitHubSignIn = () => {
    setStatus("loading");
    signIn("github");
  };

  return (
    <div className="bg-[#0b1326] text-[#dae2fd] min-h-screen flex relative overflow-hidden antialiased">
      {/* ── Left Side: Product Showcase ── */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
        {/* Background glow */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Code graph */}
        <CodeGraphCanvas />

        {/* Floating code snippets */}
        <CodeSnippet
          code={`const graph = new CodeGraph();\nawait graph.buildIndexes({\n  depth: Infinity,\n  followImports: true\n});`}
          delay={0.4}
          top="12%"
          left="8%"
        />
        <CodeSnippet
          code={`// AI convention detection\nconventions.analyze({\n  naming: true,\n  patterns: true\n});`}
          delay={0.7}
          top="58%"
          left="55%"
        />

        {/* Central message */}
        <div className="relative z-10 text-center px-12 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 40,
                fontWeight: 700,
                color: "#dae2fd",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}
            >
              Understand your{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #c3c0ff 0%, #4cd7f6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                entire codebase
              </span>
            </h1>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 15,
                color: "#918fa1",
                marginTop: 16,
                lineHeight: 1.6,
              }}
            >
              AI-powered code analysis that maps dependencies,
              detects conventions, and answers questions about
              any repository.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center gap-8 mt-8"
          >
            <AnimatedStat value="500+" label="Repos analyzed" delay={0.7} />
            <AnimatedStat value="10x" label="Faster onboarding" delay={0.8} />
            <AnimatedStat value="99%" label="Accuracy" delay={0.9} />
          </motion.div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <FeaturePill icon="smart_toy" label="AI Chat" delay={1.0} />
            <FeaturePill icon="account_tree" label="Code Graph" delay={1.1} />
            <FeaturePill icon="rule" label="Convention Detection" delay={1.2} />
            <FeaturePill icon="code" label="Code Review" delay={1.3} />
            <FeaturePill icon="description" label="Auto Docs" delay={1.4} />
          </div>
        </div>
      </div>

      {/* ── Right Side: Login Card ── */}
      <div className="w-full lg:w-[480px] xl:w-[520px] flex items-center justify-center relative shrink-0">
        {/* Subtle border glow on left edge */}
        <div
          className="hidden lg:block absolute left-0 top-0 bottom-0 w-px"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(79,70,229,0.3) 50%, transparent 100%)",
          }}
        />

        {/* Card background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(11,19,38,0.95) 0%, rgba(23,31,51,0.8) 100%)",
            backdropFilter: "blur(40px)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="relative z-10 w-full max-w-sm px-8 lg:px-10"
        >
          {/* Logo + Brand */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{
                background: "rgba(79, 70, 229, 0.15)",
                border: "1px solid rgba(79, 70, 229, 0.25)",
                boxShadow: "0 0 40px rgba(79, 70, 229, 0.15)",
              }}
            >
              <span
                className="material-symbols-outlined text-[#c3c0ff]"
                style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}
              >
                hub
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 28,
                fontWeight: 700,
                color: "#dae2fd",
                letterSpacing: "-0.02em",
              }}
            >
              ContextCrafter
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "#918fa1",
                marginTop: 6,
              }}
            >
              Sign in to explore your repositories
            </motion.p>
          </div>

          {/* GitHub Sign In */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <motion.button
              onClick={handleGitHubSignIn}
              disabled={status === "loading"}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full py-4 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-3 cursor-pointer overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                fontFamily: "Inter, sans-serif",
                background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.1)",
                borderTop: "1px solid rgba(255,255,255,0.2)",
                boxShadow:
                  "0 4px 24px rgba(79, 70, 229, 0.35), 0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)",
                }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              <AnimatePresence mode="wait">
                {status === "idle" ? (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <svg
                      className="w-5 h-5 fill-current"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    Continue with GitHub
                  </motion.span>
                ) : (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"
                  />
                )}
              </AnimatePresence>
            </motion.button>

            {/* Info text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                color: "#918fa1",
                lineHeight: 1.5,
              }}
            >
              We&apos;ll access your repositories to build
              semantic indexes and analyze code patterns.
            </motion.p>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.8 }}
            className="my-8 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
            }}
          />

          {/* What you get */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="space-y-3"
          >
            {[
              {
                icon: "smart_toy",
                title: "AI-Powered Chat",
                desc: "Ask questions about your codebase",
              },
              {
                icon: "account_tree",
                title: "Knowledge Graph",
                desc: "Visualize file dependencies",
              },
              {
                icon: "rule",
                title: "Convention Detection",
                desc: "Auto-discover coding patterns",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 + i * 0.1 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/[0.03]"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(79, 70, 229, 0.1)",
                    border: "1px solid rgba(79, 70, 229, 0.15)",
                  }}
                >
                  <span
                    className="material-symbols-outlined text-[#c3c0ff]"
                    style={{ fontSize: 16 }}
                  >
                    {feature.icon}
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#dae2fd",
                    }}
                  >
                    {feature.title}
                  </p>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      color: "#918fa1",
                    }}
                  >
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="text-center mt-8"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              color: "#918fa1",
            }}
          >
            By signing in, you agree to our{" "}
            <a href="#" className="text-[#c3c0ff] hover:underline">
              Terms
            </a>{" "}
            &{" "}
            <a href="#" className="text-[#c3c0ff] hover:underline">
              Privacy Policy
            </a>
          </motion.p>
        </motion.div>
      </div>

      {/* ── Mobile: Full-screen login (no split) ── */}
      <style>{`
        @media (max-width: 1023px) {
          /* On mobile, the right panel fills the screen */
        }
      `}</style>
    </div>
  );
}
