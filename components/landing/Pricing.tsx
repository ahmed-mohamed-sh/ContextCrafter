const plans = [
  {
    name: "Hobby",
    price: "$0",
    per: "/mo",
    popular: false,
    features: [
      "Up to 3 Public Repos",
      "Basic Context Window",
      "Community Support",
    ],
    cta: "Start Free",
    accent: false,
  },
  {
    name: "Pro",
    price: "$29",
    per: "/mo",
    popular: true,
    features: [
      "Unlimited Repos",
      "Infinite Context Pipeline",
      "Architecture Visualization",
      "Priority Support",
    ],
    cta: "Get Pro",
    accent: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    per: "",
    popular: false,
    features: [
      "VPC Deployment",
      "Custom LLM Fine-tuning",
      "Dedicated Success Manager",
      "SSO & Advanced Audit",
    ],
    cta: "Contact Sales",
    accent: false,
  },
];

export function Pricing() {
  return (
    <section className="py-24 px-6 md:px-8 max-w-6xl mx-auto" id="pricing">
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
          Simple, transparent pricing
        </h2>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
            color: "#c7c4d8",
            maxWidth: 400,
            margin: "0 auto",
          }}
        >
          Start building with context for free. Scale up when your team grows.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="rounded-xl p-8 flex flex-col relative"
            style={{
              border: plan.accent
                ? "1px solid rgba(79,70,229,0.5)"
                : "1px solid rgba(255,255,255,0.08)",
              background: plan.accent
                ? "rgba(23,31,51,0.7)"
                : "rgba(23,31,51,0.2)",
              backdropFilter: "blur(16px)",
              boxShadow: plan.accent ? "0 0 40px rgba(79,70,229,0.1)" : "none",
            }}
          >
            {plan.popular && (
              <div className="absolute -top-3 right-4">
                <span
                  className="px-3 py-1 rounded-full text-[10px] font-bold"
                  style={{
                    background: "#4f46e5",
                    color: "#dad7ff",
                    fontFamily: "Inter, sans-serif",
                    letterSpacing: "0.05em",
                  }}
                >
                  POPULAR
                </span>
              </div>
            )}
            <h3
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 20,
                fontWeight: 600,
                color: plan.accent ? "#c3c0ff" : "#dae2fd",
                marginBottom: 8,
              }}
            >
              {plan.name}
            </h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span
                style={{
                  fontFamily: "Geist, sans-serif",
                  fontSize: 40,
                  fontWeight: 700,
                  color: "#dae2fd",
                }}
              >
                {plan.price}
              </span>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  color: "#918fa1",
                }}
              >
                {plan.per}
              </span>
            </div>
            <ul className="space-y-4 mb-8 grow">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 18,
                      color: plan.accent ? "#c3c0ff" : "#4cd7f6",
                    }}
                  >
                    done
                  </span>
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      color: plan.accent ? "#dae2fd" : "#c7c4d8",
                    }}
                  >
                    {f}
                  </span>
                </li>
              ))}
            </ul>
            <button
              className="w-full py-3 rounded font-semibold transition-all hover:brightness-110"
              style={{
                background: plan.accent ? "#4f46e5" : "transparent",
                color: plan.accent ? "#dad7ff" : "#dae2fd",
                border: plan.accent
                  ? "1px solid rgba(255,255,255,0.2)"
                  : "1px solid rgba(255,255,255,0.1)",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                letterSpacing: "0.05em",
              }}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
