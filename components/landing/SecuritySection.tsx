"use client";

const securityFeatures = [
  {
    icon: "lock_reset",
    color: "#4cd7f6",
    title: "Zero Model Training",
    description:
      "Your private codebase and intellectual property are never used to train or fine-tune public LLMs. Your data remains strictly yours.",
  },
  {
    icon: "encrypted",
    color: "#c3c0ff",
    title: "AES-256 Encrypted Vault",
    description:
      "All GitHub OAuth tokens and API secrets are encrypted using authenticated AES-256-GCM encryption with automated key rotation.",
  },
  {
    icon: "admin_panel_settings",
    color: "#34d399",
    title: "Read-Only Scoped Access",
    description:
      "ContextCrafter operates on fine-grained read-only permissions. We never push commits or modify branches without explicit approval.",
  },
  {
    icon: "lan",
    color: "#ddb7ff",
    title: "Air-Gapped & VPC Ready",
    description:
      "Enterprise deployments support self-hosted instances within your AWS/GCP VPC, connecting directly to on-premise GitHub Enterprise.",
  },
];

export function SecuritySection() {
  return (
    <section className="py-24 px-6 md:px-8 max-w-6xl mx-auto" id="security">
      {/* Container with glowing border */}
      <div
        className="rounded-2xl p-8 sm:p-12 border border-white/10 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(23, 31, 51, 0.6) 0%, rgba(11, 19, 38, 0.8) 100%)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Glow Effects */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(76, 215, 246, 0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(195, 192, 255, 0.1) 0%, transparent 70%)",
          }}
        />

        {/* Section Header */}
        <div className="text-center mb-16 space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#34d399]/10 border border-[#34d399]/20 text-xs font-semibold text-[#34d399] tracking-wide uppercase">
            <span className="material-symbols-outlined text-[14px]">verified_user</span>
            Enterprise Grade Security
          </div>
          <h2
            style={{
              fontFamily: "Geist, sans-serif",
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "#dae2fd",
            }}
          >
            Built for High-Security Engineering Teams
          </h2>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 16,
              color: "#c7c4d8",
              maxWidth: 500,
              margin: "0 auto",
            }}
          >
            Bank-grade encryption, zero retention guarantees, and strict compliance from day one.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {securityFeatures.map((feat) => (
            <div
              key={feat.title}
              className="p-6 rounded-xl border border-white/8 bg-surface-container/30 backdrop-blur-md flex items-start gap-4 transition-all duration-300 hover:border-white/20 hover:bg-surface-container/50"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${feat.color}15`,
                  border: `1px solid ${feat.color}30`,
                  color: feat.color,
                }}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {feat.icon}
                </span>
              </div>
              <div>
                <h3
                  className="text-base font-semibold text-on-surface mb-1.5"
                  style={{ fontFamily: "Geist, sans-serif" }}
                >
                  {feat.title}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {feat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Security Badges Row */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-8 text-xs text-on-surface-variant relative z-10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-400 text-[18px]">check_circle</span>
            <span>SOC2 Type II Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-400 text-[18px]">check_circle</span>
            <span>GDPR & CCPA Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-400 text-[18px]">check_circle</span>
            <span>TLS 1.3 Strict Transport</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-400 text-[18px]">check_circle</span>
            <span>GitHub App Verified</span>
          </div>
        </div>
      </div>
    </section>
  );
}
