export function AIChatPreview() {
  return (
    <section className="py-24 px-6 md:px-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center gap-16">
        <div className="md:w-1/2 space-y-6">
          <h2
            style={{
              fontFamily: "Geist, sans-serif",
              fontSize: "clamp(28px,4vw,40px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#dae2fd",
            }}
          >
            Your Code, Now Conversational
          </h2>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 16,
              lineHeight: "24px",
              color: "#c7c4d8",
            }}
          >
            Ask complex architectural questions or request refactors.
            ContextCrafter understands the full context of your repository.
          </p>
        </div>
        <div
          className="md:w-1/2 w-full rounded-xl p-6"
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(23,31,51,0.3)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 0 40px rgba(79,70,229,0.05)",
          }}
        >
          <div className="space-y-4">
            {/* User */}
            <div className="flex gap-3 items-start">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(195,192,255,0.15)" }}
              >
                <span
                  className="material-symbols-outlined text-[#c3c0ff]"
                  style={{ fontSize: 16 }}
                >
                  person
                </span>
              </div>
              <div
                className="rounded-2xl rounded-tl-none p-4"
                style={{
                  background: "rgba(11,19,38,0.5)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    color: "#dae2fd",
                  }}
                >
                  How does the payment processing flow work?
                </p>
              </div>
            </div>
            {/* AI */}
            <div className="flex gap-3 items-start">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(76,215,246,0.15)" }}
              >
                <span
                  className="material-symbols-outlined text-[#4cd7f6]"
                  style={{ fontSize: 16 }}
                >
                  smart_toy
                </span>
              </div>
              <div
                className="rounded-2xl rounded-tr-none p-4 space-y-2"
                style={{
                  background: "rgba(79,70,229,0.1)",
                  border: "1px solid rgba(79,70,229,0.2)",
                }}
              >
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    color: "#dae2fd",
                  }}
                >
                  The payment flow involves several key components:
                </p>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    color: "#c7c4d8",
                  }}
                >
                  1. Starts in{" "}
                  <code
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 12,
                      padding: "2px 6px",
                      background: "#0b1326",
                      borderRadius: 4,
                      color: "#4cd7f6",
                    }}
                  >
                    auth.service.ts
                  </code>{" "}
                  where user session is validated.
                </p>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    color: "#c7c4d8",
                  }}
                >
                  2. Then{" "}
                  <code
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 12,
                      padding: "2px 6px",
                      background: "#0b1326",
                      borderRadius: 4,
                      color: "#4cd7f6",
                    }}
                  >
                    payment.engine.js
                  </code>{" "}
                  handles transaction logic and interfaces with the external
                  gateway.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
