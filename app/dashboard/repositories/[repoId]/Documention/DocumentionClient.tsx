"use client";

import { useState, useMemo, ReactNode } from "react";

interface Props {
  repo: {
    id: string;
    name: string;
    fullName: string;
    language: string | null;
    totalFiles: number;
    totalAPIs: number;
  };
  files: string[];
}

export default function DocumentationClient({ repo, files }: Props) {
  const [docType, setDocType] = useState("readme");
  const [tone, setTone] = useState("technical");
  const [format, setFormat] = useState("md");
  const [target, setTarget] = useState("internal");
  const [includeCode, setIncludeCode] = useState(true);
  const [autoLink, setAutoLink] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setGenerated(null);

    try {
      const res = await fetch(`/api/repos/${repo.id}/Documention`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          tone,
          format,
          target,
          includeCode,
          autoLink,
        }),
      });

      const data = await res.json();
      if (data.content) setGenerated(data.content);
    } catch {
      setGenerated("Failed to generate documentation. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    if (!generated) return;
    const ext =
      format === "md"
        ? "md"
        : format === "html"
          ? "html"
          : format === "json"
            ? "json"
            : "txt";
    const blob = new Blob([generated], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${repo.name}-${docType}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const docTypes = [
    { id: "readme", label: "README.md", desc: "Project overview & setup" },
    { id: "architecture", label: "Architecture", desc: "System design docs" },
    { id: "api", label: "API Reference", desc: "Endpoints & models" },
    { id: "schema", label: "Database Schema", desc: "Tables & relations" },
    { id: "sequence", label: "Sequence Diagrams", desc: "Mermaid.js flows" },
  ];

  /* ── Inline Markdown Renderer ─────────────────────────── */
  function renderInline(text: string): ReactNode[] {
    const parts: ReactNode[] = [];
    // bold **text**, inline `code`, and plain text
    const re = /(\*\*(.+?)\*\*)|(`([^`]+)`)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let key = 0;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      if (m[2]) {
        parts.push(
          <strong key={key++} style={{ color: "#dae2fd", fontWeight: 600 }}>
            {m[2]}
          </strong>,
        );
      } else if (m[4]) {
        parts.push(
          <code
            key={key++}
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 13,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 4,
              padding: "1px 6px",
              color: "#c3c0ff",
            }}
          >
            {m[4]}
          </code>,
        );
      }
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  }

  const renderedMarkdown = useMemo(() => {
    if (!generated) return null;
    const lines = generated.split("\n");
    const elements: ReactNode[] = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
      const line = lines[i];

      // ── Fenced code block ───────────────────────────
      if (line.startsWith("```")) {
        const lang = line.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```

        elements.push(
          <div
            key={key++}
            style={{
              background: "#0d1117",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            {lang && (
              <div
                style={{
                  background: "#161b22",
                  padding: "6px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 11,
                    color: "#918fa1",
                  }}
                >
                  {lang}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(codeLines.join("\n"));
                  }}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    color: "#918fa1",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Copy
                </button>
              </div>
            )}
            <pre
              style={{
                padding: 16,
                margin: 0,
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 13,
                lineHeight: "22px",
                color: "#c9d1d9",
                overflowX: "auto",
              }}
            >
              {codeLines.map((cl, ci) => (
                <div key={ci} style={{ display: "flex" }}>
                  <span
                    style={{
                      width: 32,
                      textAlign: "right",
                      paddingRight: 16,
                      color: "rgba(255,255,255,0.15)",
                      userSelect: "none",
                      flexShrink: 0,
                    }}
                  >
                    {ci + 1}
                  </span>
                  <span>{cl}</span>
                </div>
              ))}
            </pre>
          </div>,
        );
        continue;
      }

      // ── Headings ────────────────────────────────────
      if (line.startsWith("### ")) {
        elements.push(
          <h3
            key={key++}
            style={{
              fontFamily: "Geist, sans-serif",
              fontSize: 18,
              fontWeight: 600,
              color: "#dae2fd",
              marginTop: 24,
              marginBottom: 8,
            }}
          >
            {renderInline(line.slice(4))}
          </h3>,
        );
        i++;
        continue;
      }
      if (line.startsWith("## ")) {
        elements.push(
          <h2
            key={key++}
            style={{
              fontFamily: "Geist, sans-serif",
              fontSize: 22,
              fontWeight: 600,
              color: "#dae2fd",
              marginTop: 28,
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {renderInline(line.slice(3))}
          </h2>,
        );
        i++;
        continue;
      }
      if (line.startsWith("# ")) {
        elements.push(
          <h1
            key={key++}
            style={{
              fontFamily: "Geist, sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: "#dae2fd",
              marginBottom: 12,
            }}
          >
            {renderInline(line.slice(2))}
          </h1>,
        );
        i++;
        continue;
      }

      // ── Horizontal rule ────────────────────────────
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        elements.push(
          <hr
            key={key++}
            style={{
              border: "none",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              margin: "16px 0",
            }}
          />,
        );
        i++;
        continue;
      }

      // ── Bullet list ────────────────────────────────
      if (/^[*\-] /.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^[*\-] /.test(lines[i])) {
          items.push(lines[i].replace(/^[*\-] /, ""));
          i++;
        }
        elements.push(
          <ul key={key++} style={{ paddingLeft: 20, margin: "8px 0" }}>
            {items.map((item, ii) => (
              <li
                key={ii}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  lineHeight: "24px",
                  color: "#c7c4d8",
                  listStyleType: "disc",
                  marginBottom: 4,
                }}
              >
                {renderInline(item)}
              </li>
            ))}
          </ul>,
        );
        continue;
      }

      // ── Numbered list ──────────────────────────────
      if (/^\d+\. /.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\. /.test(lines[i])) {
          items.push(lines[i].replace(/^\d+\.\s*/, ""));
          i++;
        }
        elements.push(
          <ol key={key++} style={{ paddingLeft: 20, margin: "8px 0" }}>
            {items.map((item, ii) => (
              <li
                key={ii}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  lineHeight: "24px",
                  color: "#c7c4d8",
                  listStyleType: "decimal",
                  marginBottom: 4,
                }}
              >
                {renderInline(item)}
              </li>
            ))}
          </ol>,
        );
        continue;
      }

      // ── Empty line ─────────────────────────────────
      if (line.trim() === "") {
        i++;
        continue;
      }

      // ── Paragraph ──────────────────────────────────
      elements.push(
        <p
          key={key++}
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            lineHeight: "24px",
            color: "#c7c4d8",
          }}
        >
          {renderInline(line)}
        </p>,
      );
      i++;
    }

    return elements;
  }, [generated]);

  function renderMarkdown(md: string): ReactNode[] {
    return renderedMarkdown ?? [];
  }

  return (
    <div className="flex-1 h-full p-6 flex gap-6 overflow-hidden w-full">
      {/* Left Panel */}
      <aside className="w-72 glass-panel bg-surface-container/30 border border-white/10 rounded-xl flex flex-col shadow-lg overflow-y-auto">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-headline-lg-mobile text-[18px] text-on-surface">
            Document Types
          </h2>
          <p className="font-body-sm text-[14px] text-on-surface-variant mt-1">
            Select scope to generate
          </p>
        </div>

        <div className="p-4 space-y-2 flex-1">
          {docTypes.map((type) => (
            <label
              key={type.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors relative overflow-hidden ${
                docType === type.id
                  ? "border-primary/50 bg-primary/5"
                  : "border-white/5 hover:border-white/10 hover:bg-white/5"
              }`}
            >
              {docType === type.id && (
                <div className="absolute inset-0 bg-linear-to-r from-primary/10 to-transparent pointer-events-none" />
              )}
              <input
                type="radio"
                name="doc_type"
                checked={docType === type.id}
                onChange={() => setDocType(type.id)}
                className="text-primary focus:ring-primary/50 bg-surface border-white/20"
              />
              <div>
                <div
                  className={`font-label-xs text-[12px] ${docType === type.id ? "text-primary" : "text-on-surface"}`}
                >
                  {type.label}
                </div>
                <div className="font-body-sm text-on-surface-variant text-[11px] leading-tight mt-0.5">
                  {type.desc}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={generate}
            disabled={loading}
            className="w-full bg-primary-container text-on-primary-container font-label-xs text-[12px] py-2 rounded border-t border-white/20 shadow-[0_2px_10px_rgba(79,70,229,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">
                auto_awesome
              </span>
            )}
            {loading ? "Generating..." : "Generate Docs"}
          </button>
        </div>
      </aside>

      {/* Center Preview */}
      <section className="flex-1 glass-panel bg-surface/40 border border-white/10 rounded-xl flex flex-col shadow-lg overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-surface-container-low/50 z-10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[18px]">
              visibility
            </span>
            <h3 className="font-label-xs text-[12px] text-on-surface">
              Live Preview
            </h3>
            {generated && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(76,215,246,0.1)",
                  color: "#4cd7f6",
                  border: "1px solid rgba(76,215,246,0.2)",
                }}
              >
                {docType.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={copy}
              disabled={!generated}
              className="px-3 py-1 rounded bg-white/5 border border-white/10 font-code-md text-[11px] text-on-surface hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={download}
              disabled={!generated}
              className="px-3 py-1 rounded bg-white/5 border border-white/10 font-code-md text-[11px] text-on-surface hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              Download
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-12 h-12 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  color: "#918fa1",
                }}
              >
                Generating {docType} documentation for {repo.name}...
              </p>
            </div>
          ) : generated ? (
            <div className="max-w-3xl mx-auto space-y-5">
              {renderMarkdown(generated)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(79,70,229,0.1)",
                  border: "1px solid rgba(79,70,229,0.2)",
                }}
              >
                <span
                  className="material-symbols-outlined text-[#c3c0ff]"
                  style={{ fontSize: 32 }}
                >
                  description
                </span>
              </div>
              <div className="text-center">
                <h3
                  style={{
                    fontFamily: "Geist, sans-serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#dae2fd",
                    marginBottom: 8,
                  }}
                >
                  Ready to generate
                </h3>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    color: "#918fa1",
                  }}
                >
                  Select a document type and click Generate Docs
                </p>
              </div>
              {/* Repo info */}
              <div className="flex items-center gap-4 mt-2">
                {[
                  { label: "Files", value: repo.totalFiles },
                  { label: "APIs", value: repo.totalAPIs },
                  { label: "Language", value: repo.language ?? "Unknown" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="text-center px-4 py-2 rounded-lg"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Geist, sans-serif",
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#dae2fd",
                      }}
                    >
                      {item.value}
                    </div>
                    <div
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 11,
                        color: "#918fa1",
                      }}
                    >
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Right Panel */}
      <aside className="w-64 glass-panel bg-surface-container/30 border border-white/10 rounded-xl flex flex-col shadow-lg overflow-y-auto">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-label-xs text-[12px] text-on-surface tracking-wider uppercase">
            Output Settings
          </h2>
        </div>
        <div className="p-4 space-y-6">
          {/* Tone */}
          <div className="space-y-3">
            <label className="font-label-xs text-[12px] text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">
                record_voice_over
              </span>
              Tone
            </label>
            <div className="flex flex-col gap-2">
              {[
                { id: "technical", label: "Technical (Default)" },
                { id: "executive", label: "High-level / Executive" },
                { id: "tutorial", label: "Tutorial / Conversational" },
              ].map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="tone"
                    checked={tone === t.id}
                    onChange={() => setTone(t.id)}
                    className="text-primary bg-surface border-white/20 focus:ring-primary/50"
                  />
                  <span className="font-body-sm text-[14px] text-on-surface group-hover:text-primary transition-colors">
                    {t.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/10 w-full" />

          {/* Format */}
          <div className="space-y-3">
            <label className="font-label-xs text-[12px] text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">
                data_object
              </span>
              Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["md", "html", "pdf", "json"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`py-1.5 px-2 rounded font-label-xs text-[12px] text-center transition-colors ${
                    format === f
                      ? "bg-primary/10 border border-primary/50 text-primary"
                      : "bg-white/5 border border-white/10 text-on-surface-variant hover:text-on-surface hover:bg-white/10"
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/10 w-full" />

          {/* Target */}
          <div className="space-y-3">
            <label className="font-label-xs text-[12px] text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">
                public
              </span>
              Target Audience
            </label>
            <div className="bg-surface-dim rounded-md p-1 flex border border-white/10">
              {["internal", "public"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  className={`flex-1 py-1 text-center rounded font-label-xs text-[11px] transition-colors capitalize ${
                    target === t
                      ? "bg-white/10 text-on-surface shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {t === "internal" ? "Internal" : "Public API"}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 space-y-3">
            {[
              {
                label: "Include Code Snippets",
                value: includeCode,
                set: setIncludeCode,
              },
              {
                label: "Auto-link Entities",
                value: autoLink,
                set: setAutoLink,
              },
            ].map((toggle) => (
              <label
                key={toggle.label}
                className="flex items-center justify-between cursor-pointer group"
              >
                <span className="font-body-sm text-[14px] text-on-surface-variant group-hover:text-on-surface transition-colors">
                  {toggle.label}
                </span>
                <div
                  className="relative inline-block w-8 h-4 rounded-full transition-colors"
                  style={{
                    background: toggle.value
                      ? "#4f46e5"
                      : "rgba(255,255,255,0.2)",
                  }}
                  onClick={() => toggle.set(!toggle.value)}
                >
                  <span
                    className="absolute left-1 top-0.5 w-3 h-3 rounded-full bg-white transition-transform"
                    style={{
                      transform: toggle.value
                        ? "translateX(12px)"
                        : "translateX(0)",
                    }}
                  />
                </div>
              </label>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
