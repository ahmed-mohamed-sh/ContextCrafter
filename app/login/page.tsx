"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import { signIn } from "next-auth/react";

/* ─── Ambient Grid Background ─── */
function AmbientGrid() {
  return (
    <motion.div
      animate={{
        x: [0, -15, 0],
        y: [0, -15, 0],
      }}
      transition={{
        duration: 30,
        repeat: Infinity,
        ease: "linear",
      }}
      className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    />
  );
}

/* ─── Floating Blurred Particles ─── */
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
}

function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const list: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      list.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 8 + 4,
        duration: Math.random() * 20 + 20,
      });
    }
    setParticles(list);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-indigo-500/10 blur-[2px]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            x: [0, (Math.random() - 0.5) * 80, 0],
            y: [0, (Math.random() - 0.5) * 80, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─── AI Network Node Graph ─── */
interface Node {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function AINetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const count = 35;
    const nodes: Node[] = [];
    for (let i = 0; i < count; i++) {
      nodes.push({
        id: i,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      });
    }
    nodesRef.current = nodes;

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const currentNodes = nodesRef.current;
      const distLimit = 120;

      // Update & Draw nodes
      currentNodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(195, 192, 255, 0.15)";
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < currentNodes.length; i++) {
        for (let j = i + 1; j < currentNodes.length; j++) {
          const n1 = currentNodes[i];
          const n2 = currentNodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < distLimit) {
            const alpha = (1 - dist / distLimit) * 0.08;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(76, 215, 246, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

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
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

/* ─── Animated Floating Label Input ─── */
interface FloatingInputProps {
  id: string;
  type: string;
  placeholder: string;
  icon: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}

function FloatingInput({
  id,
  type,
  placeholder,
  icon,
  value,
  onChange,
  required,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <motion.div
      whileFocus={{ scale: 1.01 }}
      className="relative rounded-lg flex items-center px-3 py-3 overflow-hidden bg-surface-container-lowest/60 border border-white/10 transition-colors duration-300 focus-within:border-[#c3c0ff] focus-within:shadow-[inset_0_0_0_1px_#c3c0ff,0_0_15px_rgba(195,192,255,0.1)]"
    >
      <span
        className="material-symbols-outlined text-on-surface-variant mr-3 select-none"
        style={{ fontVariationSettings: "'FILL' 0" }}
      >
        {icon}
      </span>
      <div className="relative flex-1 h-9 flex items-center">
        <motion.label
          htmlFor={id}
          initial={false}
          animate={{
            y: active ? -11 : 0,
            scale: active ? 0.85 : 1,
            color: active ? "#c3c0ff" : "#918fa1",
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute left-0 pointer-events-none origin-left font-body-sm text-body-sm text-on-surface-variant/50"
        >
          {placeholder}
        </motion.label>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          className="bg-transparent border-none outline-none text-on-surface font-body-sm text-body-sm w-full focus:ring-0 p-0 pt-3"
        />
      </div>
    </motion.div>
  );
}

/* ─── Main Welcome Back Screen ─── */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  // Mouse Parallax (Card Tilt)
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateXVal = useMotionValue(0);
  const rotateYVal = useMotionValue(0);
  const springX = useSpring(rotateXVal, { stiffness: 150, damping: 25 });
  const springY = useSpring(rotateYVal, { stiffness: 150, damping: 25 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    rotateXVal.set(-y / 15);
    rotateYVal.set(x / 15);
  }

  function handleMouseLeave() {
    rotateXVal.set(0);
    rotateYVal.set(0);
  }

  // Handle NextAuth credentials submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      setStatus("success");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } else {
      setStatus("idle");
      alert("Invalid email or password");
    }
  };

  // Page Load Timeline Delays
  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="bg-[#0b1326] text-[#dae2fd] min-h-screen flex items-center justify-center relative overflow-hidden font-body-md antialiased w-full">
      {/* 2 — Breathing Background Glow */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%)",
          }}
        />
        <AmbientGrid />
        <FloatingParticles />
        <AINetwork />
        <div className="absolute inset-0 bg-[#0b1326]/60 backdrop-blur-[2px]" />
      </div>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-md px-margin-mobile md:px-0">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-6"
        >
          {/* Brand Header & Logo Reveal */}
          <motion.div className="text-center flex flex-col items-center gap-2">
            <motion.h1
              initial={{ filter: "blur(8px)", opacity: 0 }}
              animate={{ filter: "blur(0px)", opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-black text-[#c3c0ff] tracking-tight drop-shadow-[0_0_15px_rgba(195,192,255,0.2)]"
            >
              ContextCrafter
            </motion.h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              The Quiet Powerhouse for Technical Leaders
            </p>
          </motion.div>

          {/* 1 — Entire card entrance + 12 — 3D card tilt wrapper */}
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX: springX, rotateY: springY, perspective: 1000 }}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.15,
            }}
            className="rounded-xl p-8 shadow-2xl border border-white/10 bg-[#0b1326]/40 backdrop-blur-lg flex flex-col gap-6"
          >
            <div className="text-center">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-semibold text-[#dae2fd]">
                Welcome back
              </h2>
              <p className="font-body-sm text-body-sm text-outline mt-1">
                Log in to continue to your workspace.
              </p>
            </div>

            {/* GitHub OAuth Button */}
            <motion.button
              onClick={() => signIn("github")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-3 w-full py-3 rounded-lg border border-white/10 text-[#dae2fd] bg-white/5 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(79,70,229,0.35)] transition-shadow duration-300 font-body-sm text-body-sm font-medium cursor-pointer"
            >
              <motion.svg
                variants={{
                  hover: { rotate: 8 },
                }}
                whileHover="hover"
                aria-hidden="true"
                className="w-5 h-5 fill-current"
                viewBox="0 0 24 24"
              >
                <path
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  fillRule="evenodd"
                ></path>
              </motion.svg>
              Continue with GitHub
            </motion.button>

            {/* Staggered Divider Line */}
            <div className="flex items-center gap-3 py-1">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="h-px bg-white/10 flex-1 origin-left"
              />
              <span className="font-label-xs text-label-xs text-outline uppercase select-none">
                Or
              </span>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="h-px bg-white/10 flex-1 origin-right"
              />
            </div>

            {/* Email & Password Input Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FloatingInput
                id="email"
                type="email"
                placeholder="Email address"
                icon="mail"
                value={email}
                onChange={setEmail}
                required
              />
              <FloatingInput
                id="password"
                type="password"
                placeholder="Password"
                icon="lock"
                value={password}
                onChange={setPassword}
                required
              />

              <div className="flex justify-end">
                <a
                  className="font-label-xs text-label-xs text-[#c3c0ff] hover:text-primary-fixed transition-colors"
                  href="#"
                >
                  Forgot password?
                </a>
              </div>

              {/* Success & Loading Action Button */}
              <motion.button
                type="submit"
                disabled={status !== "idle"}
                whileHover={status === "idle" ? { scale: 1.02 } : {}}
                whileTap={status === "idle" ? { scale: 0.98 } : {}}
                className={`relative overflow-hidden w-full py-3.5 rounded-lg font-body-sm text-body-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors duration-300 ${
                  status === "success"
                    ? "bg-[#10b981]"
                    : "bg-primary-container hover:bg-[#4338ca]"
                }`}
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.2)",
                  color: "#ffffff",
                }}
              >
                <AnimatePresence mode="wait">
                  {status === "idle" && (
                    <motion.span
                      key="signin"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      Sign in
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                          ease: "easeInOut",
                        }}
                        className="material-symbols-outlined text-sm font-bold"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        arrow_forward
                      </motion.span>
                    </motion.span>
                  )}

                  {status === "loading" && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"
                    />
                  )}

                  {status === "success" && (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="material-symbols-outlined text-lg"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>

            <p className="font-body-sm text-body-sm text-center text-outline">
              Don&apos;t have an account?{" "}
              <a
                className="text-[#c3c0ff] hover:text-primary-fixed transition-colors font-medium"
                href="#"
              >
                Request access
              </a>
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
