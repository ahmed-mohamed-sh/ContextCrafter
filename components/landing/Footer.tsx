const links = {
  Product: ["Features", "Integrations", "Changelog", "Pricing"],
  Resources: ["Documentation", "API Reference", "Community", "Blog"],
  Company: ["About", "Careers", "Privacy", "Terms"],
};

export function Footer() {
  return (
    <footer
      className="mt-12"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "#060e20",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#c3c0ff]">
              hub
            </span>
            <span
              className="font-bold text-xl text-[#c3c0ff] tracking-tight"
              style={{ fontFamily: "Geist, sans-serif" }}
            >
              ContextCrafter
            </span>
          </div>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              color: "#918fa1",
              maxWidth: 280,
            }}
          >
            Building the intelligent orchestration layer for modern development
            teams.
          </p>
        </div>
        {Object.entries(links).map(([title, items]) => (
          <div key={title} className="space-y-4">
            <h4
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.05em",
                color: "#dae2fd",
              }}
            >
              {title}
            </h4>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      color: "#918fa1",
                    }}
                    className="hover:text-[#c3c0ff] transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div
        className="max-w-6xl mx-auto px-6 md:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            color: "#918fa1",
          }}
        >
          © 2024 ContextCrafter. All rights reserved.
        </p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 12,
              color: "#918fa1",
            }}
          >
            Systems Operational
          </span>
        </div>
      </div>
    </footer>
  );
}
