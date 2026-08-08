"use client";

const features = [
  {
    icon: "memory",
    color: "#c3c0ff",
    glow: "rgba(79,70,229,0.15)",
    hoverBorder: "rgba(195,192,255,0.25)",
    title: "Deep Context Windows",
    description:
      "Analyze entire microservices simultaneously. Our chunking engine feeds relevant context to the LLM without exceeding limits.",
    wide: true,
  },
  {
    icon: "account_tree",
    color: "#4cd7f6",
    glow: "rgba(76,215,246,0.1)",
    hoverBorder: "rgba(76,215,246,0.25)",
    title: "Architectural Awareness",
    description:
      "Understands the relationships between your frontend components and backend APIs automatically.",
    wide: false,
  },
  {
    icon: "translate",
    color: "#ddb7ff",
    glow: "rgba(221,183,255,0.1)",
    hoverBorder: "rgba(221,183,255,0.25)",
    title: "Language Agnostic",
    description:
      "Fluent in Rust, Go, TypeScript, Python, and 40+ other languages. Maps dependencies across language boundaries.",
    wide: false,
  },
  {
    icon: "bolt",
    color: "#e2dfff",
    glow: "rgba(226,223,255,0.08)",
    hoverBorder: "rgba(226,223,255,0.2)",
    title: "Real-time Intelligence",
    description:
      "The graph updates in milliseconds as you type. Suggestions evolve based on your immediate architectural decisions.",
    wide: true,
  },
];

export function Features() {
  return (
    <section className="py-24 px-6 md:px-8 max-w-6xl mx-auto" id="features">
      <div className="text-center mb-16 space-y-4">
        <h2
          style={{
            fontFamily: "Geist, sans-serif",
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "#dae2fd",
          }}
        >
          Unprecedented Context
        </h2>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
            color: "#c7c4d8",
            maxWidth: 480,
            margin: "0 auto",
          }}
        >
          We don't just read your current file. We build a living knowledge
          graph of your entire architecture.
        </p>
      </div>
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
        style={{ gridAutoRows: "260px" }}
      >
        {features.map((f, i) => (
          <div
            key={i}
            className={`relative rounded-xl overflow-hidden p-8 flex flex-col justify-end transition-all duration-300 ${f.wide ? "md:col-span-2" : ""}`}
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(23,31,51,0.4)",
              backdropFilter: "blur(16px)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.border = `1px solid ${f.hoverBorder}`)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.border =
                "1px solid rgba(255,255,255,0.08)")
            }
          >
            <div
              className="absolute top-0 right-0 w-56 h-56 rounded-full -mr-12 -mt-12 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${f.glow} 0%, transparent 70%)`,
              }}
            />
            <span
              className="material-symbols-outlined mb-4 relative z-10"
              style={{ fontSize: 36, color: f.color }}
            >
              {f.icon}
            </span>
            <h3
              className="mb-2 relative z-10"
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 17,
                fontWeight: 600,
                color: "#dae2fd",
              }}
            >
              {f.title}
            </h3>
            <p
              className="relative z-10"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                lineHeight: "20px",
                color: "#918fa1",
              }}
            >
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
