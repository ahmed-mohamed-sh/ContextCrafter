"use client";

const languages = [
  { name: "TypeScript", icon: "code", color: "#3178c6" },
  { name: "Python", icon: "terminal", color: "#3776ab" },
  { name: "Go", icon: "data_object", color: "#00add8" },
  { name: "Rust", icon: "memory", color: "#dea584" },
  { name: "React / Next.js", icon: "web", color: "#61dafb" },
  { name: "Node.js", icon: "settings_ethernet", color: "#68a063" },
  { name: "Java / Kotlin", icon: "coffee", color: "#b07219" },
  { name: "PostgreSQL / Prisma", icon: "database", color: "#336791" },
];

const integrations = [
  {
    title: "GitHub & GitHub Enterprise",
    desc: "Seamless synchronization with public & private repositories via GitHub App.",
    icon: "deployed_code",
  },
  {
    title: "VS Code & JetBrains Ready",
    desc: "Export contextual system prompts and conventions directly into IDE assistants.",
    icon: "integration_instructions",
  },
  {
    title: "CI/CD Code Review Hooks",
    desc: "Automate code quality, convention audits, and debt checks on every pull request.",
    icon: "sync_alt",
  },
];

export function IntegrationsSection() {
  return (
    <section className="py-24 px-6 md:px-8 max-w-6xl mx-auto" id="integrations">
      {/* Section Header */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ddb7ff]/10 border border-[#ddb7ff]/20 text-xs font-semibold text-[#ddb7ff] tracking-wide uppercase">
          <span className="material-symbols-outlined text-[14px]">grid_view</span>
          Ecosystem & Syntaxes
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
          Built for Your Entire Tech Stack
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
          Polyglot architectural understanding across modern frameworks, databases, and microservices.
        </p>
      </div>

      {/* Language Pills Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {languages.map((lang) => (
          <div
            key={lang.name}
            className="p-4 rounded-xl border border-white/8 bg-surface-container/30 backdrop-blur-md flex items-center gap-3 transition-all hover:border-white/20 hover:bg-surface-container/50"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${lang.color}15`,
                border: `1px solid ${lang.color}30`,
                color: lang.color,
              }}
            >
              <span className="material-symbols-outlined text-[18px]">
                {lang.icon}
              </span>
            </div>
            <span
              className="text-xs font-semibold text-on-surface"
              style={{ fontFamily: "Geist, sans-serif" }}
            >
              {lang.name}
            </span>
          </div>
        ))}
      </div>

      {/* Integrations Trio Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {integrations.map((item) => (
          <div
            key={item.title}
            className="p-6 rounded-xl border border-white/8 bg-surface-container/20 backdrop-blur-md flex flex-col justify-between transition-all hover:border-white/15"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-container/20 border border-primary-container/30 text-[#c3c0ff] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
            </div>
            <h3
              className="text-sm font-semibold text-on-surface mb-2"
              style={{ fontFamily: "Geist, sans-serif" }}
            >
              {item.title}
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
