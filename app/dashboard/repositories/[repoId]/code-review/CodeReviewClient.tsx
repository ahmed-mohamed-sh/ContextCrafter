"use client";

import { useState } from "react";

interface Review {
  security: { score: number; issues: string[]; severity: string };
  performance: { score: number; issues: string[] };
  architecture: { score: number; adherence: number; patterns: string[] };
  maintainability: { grade: string; issues: string[] };
  suggestions: {
    type: string;
    title: string;
    description: string;
    file: string;
    before: string;
    after: string;
  }[];
}

interface Props {
  repo: { id: string; name: string; fullName: string };
  review: Review;
  filesAnalyzed: number;
  analyzedFiles: string[];
  allFiles: string[];
}

const severityColor = {
  low: "#4cd7f6",
  medium: "#ddb7ff",
  high: "#ffb4ab",
};

const gradeColor = {
  A: "#4cd7f6",
  B: "#c3c0ff",
  C: "#ddb7ff",
  D: "#ffb4ab",
};

const typeIcon = {
  security: "security",
  performance: "speed",
  architecture: "account_tree",
  maintainability: "build",
};

const typeColor = {
  security: "#ffb4ab",
  performance: "#4cd7f6",
  architecture: "#c3c0ff",
  maintainability: "#ddb7ff",
};

export default function CodeReviewClient({
  repo,
  review,
  filesAnalyzed,
  analyzedFiles,
  allFiles,
}: Props) {
  const [showSelector, setShowSelector] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>(analyzedFiles);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentReview, setCurrentReview] = useState<Review>(review);
  const [currentAnalyzedFiles, setCurrentAnalyzedFiles] =
    useState<string[]>(analyzedFiles);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  async function reanalyze() {
    if (selectedFiles.length === 0) return;
    setAnalyzing(true);

    try {
      const res = await fetch(`/api/repos/${repo.id}/code-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: selectedFiles }),
      });

      const data = await res.json();

      if (data.review) {
        setCurrentReview(data.review);
        setCurrentAnalyzedFiles(selectedFiles);
        setShowSelector(false);
      }
    } catch {
      console.error("Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }
  if (!repo)
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-on-surface-variant">Repository not found</p>
      </div>
    );
  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="font-code-md text-[14px] font-medium text-primary bg-primary-container/10 px-2 py-0.5 rounded border border-primary/20">
              AI Review
            </span>
            <h1 className="font-headline-lg text-[32px] leading-10 tracking-[-0.01em] font-bold text-on-surface">
              {repo.fullName}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-on-surface-variant font-body-sm text-[14px]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                folder
              </span>
              {repo.fullName}
            </span>
            <span>•</span>
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1 text-tertiary">
                <span className="material-symbols-outlined text-[16px]">
                  description
                </span>
                {currentAnalyzedFiles.length} files analyzed
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentAnalyzedFiles.map((f) => (
                  <span
                    key={f}
                    className="text-[11px] px-2 py-0.5 rounded"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      background: "rgba(76,215,246,0.1)",
                      border: "1px solid rgba(76,215,246,0.2)",
                      color: "#4cd7f6",
                    }}
                  >
                    {f.split("/").pop()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="glass-panel font-label-xs text-[12px] font-semibold tracking-wider text-on-surface hover:bg-white/5 px-4 py-2 rounded-md cursor-pointer transition-colors border border-outline-variant/50">
            Export Report
          </button>
          <button
            onClick={() => setShowSelector(true)}
            className="bg-primary-container text-on-primary-container font-label-xs text-[12px] font-semibold tracking-wider px-4 py-2 rounded-md border-t border-white/20 cursor-pointer hover:brightness-110 transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)]"
          >
            Choose Files
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Security */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-error/10 rounded-full blur-2xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="font-label-xs text-[12px] font-semibold tracking-wider text-on-surface-variant uppercase">
              Security
            </span>
            <span
              className="material-symbols-outlined text-error"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield
            </span>
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <span
              className="font-headline-lg-mobile text-[24px] font-bold"
              style={{
                color:
                  severityColor[
                    currentReview.security
                      .severity as keyof typeof severityColor
                  ] ?? "#4cd7f6",
              }}
            >
              {currentReview.security.score}/100
            </span>
            <span className="font-body-sm text-[14px] text-on-surface-variant">
              {currentReview.security.issues.length} issue
              {currentReview.security.issues.length !== 1 ? "s" : ""} detected
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 relative z-10 flex flex-col gap-2">
            {currentReview.security.issues.slice(0, 2).map((issue, i) => (
              <span
                key={i}
                className="font-label-xs text-[12px] font-semibold px-2 py-1 rounded inline-flex items-center gap-1"
                style={{
                  background: "rgba(255,180,171,0.1)",
                  border: "1px solid rgba(255,180,171,0.3)",
                  color: "#ffb4ab",
                }}
              >
                <span className="material-symbols-outlined text-[14px]">
                  warning
                </span>
                {issue}
              </span>
            ))}
          </div>
        </div>

        {/* Performance */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/10 rounded-full blur-2xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="font-label-xs text-[12px] font-semibold tracking-wider text-on-surface-variant uppercase">
              Performance
            </span>
            <span
              className="material-symbols-outlined text-tertiary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              speed
            </span>
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="font-headline-lg-mobile text-[24px] font-bold text-tertiary">
              {currentReview.performance.score}/100
            </span>
            <span className="font-body-sm text-[14px] text-on-surface-variant">
              {currentReview.performance.issues[0] ?? "No issues found"}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 relative z-10">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-tertiary rounded-full transition-all duration-700"
                style={{ width: `${currentReview.performance.score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Architecture */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="font-label-xs text-[12px] font-semibold tracking-wider text-on-surface-variant uppercase">
              Architecture
            </span>
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_tree
            </span>
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="font-headline-lg-mobile text-[24px] font-bold text-primary">
              {currentReview.architecture.adherence}%
            </span>
            <span className="font-body-sm text-[14px] text-on-surface-variant">
              Pattern Adherence
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 relative z-10 flex flex-wrap gap-2">
            {currentReview.architecture.patterns.slice(0, 3).map((p) => (
              <span
                key={p}
                className="font-code-md text-[10px] text-outline px-1.5 py-0.5 rounded bg-surface border border-outline-variant/30"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Maintainability */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="font-label-xs text-[12px] font-semibold tracking-wider text-on-surface-variant uppercase">
              Maintainability
            </span>
            <span
              className="material-symbols-outlined text-secondary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              build
            </span>
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <div className="flex items-baseline gap-2">
              <span
                className="font-headline-lg-mobile text-[24px] font-bold"
                style={{
                  color:
                    gradeColor[
                      currentReview.maintainability
                        .grade as keyof typeof gradeColor
                    ] ?? "#ddb7ff",
                }}
              >
                {currentReview.maintainability.grade}
              </span>
              <span className="font-body-sm text-[14px] text-on-surface-variant">
                Grade
              </span>
            </div>
            <span className="font-body-sm text-[14px] text-on-surface-variant">
              {currentReview.maintainability.issues[0] ??
                "Good maintainability"}
            </span>
          </div>
          {currentReview.maintainability.issues.length > 1 && (
            <div className="mt-4 pt-3 border-t border-white/5 relative z-10">
              <span className="font-label-xs text-[12px] font-semibold tracking-wider text-on-surface-variant">
                {currentReview.maintainability.issues.length} issues found
              </span>
            </div>
          )}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="glass-panel rounded-xl overflow-hidden shadow-[0_0_20px_0_rgba(79,70,229,0.15)] border-primary/30">
        <div className="bg-surface-container-high/80 px-6 py-4 border-b border-white/10 flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-primary/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <span className="material-symbols-outlined text-primary text-[18px]">
                auto_awesome
              </span>
            </div>
            <h2 className="font-headline-lg-mobile text-[24px] font-semibold text-on-surface">
              AI Recommendations
            </h2>
          </div>
          <span className="font-label-xs text-[12px] font-semibold tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
            {currentReview.suggestions.length} Suggestions
          </span>
        </div>

        <div className="p-6 flex flex-col gap-8">
          {currentReview.suggestions.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">
                check_circle
              </span>
              <p
                className="text-on-surface-variant mt-2"
                style={{ fontFamily: "Inter, sans-serif", fontSize: 14 }}
              >
                No suggestions — code looks good!
              </p>
            </div>
          ) : (
            currentReview.suggestions.map((s, i) => (
              <div key={i}>
                {i > 0 && (
                  <hr className="border-white/5 border-t w-full mb-8" />
                )}
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="material-symbols-outlined mt-0.5 text-[20px]"
                      style={{
                        color:
                          typeColor[s.type as keyof typeof typeColor] ??
                          "#c3c0ff",
                      }}
                    >
                      {typeIcon[s.type as keyof typeof typeIcon] ?? "lightbulb"}
                    </span>
                    <div>
                      <h3 className="font-body-md text-[16px] font-semibold text-on-surface">
                        {s.title}
                      </h3>
                      <p className="font-body-sm text-[14px] text-on-surface-variant mt-1">
                        {s.description}
                      </p>
                      <p className="font-code-md text-[11px] text-on-surface-variant/60 mt-1">
                        {s.file}
                      </p>
                    </div>
                  </div>

                  {(s.before || s.after) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                      {/* Before */}
                      <div className="bg-[#0d152a] rounded-lg overflow-hidden flex flex-col border border-error/20">
                        <div className="bg-error/10 px-4 py-2 border-b border-error/20">
                          <span className="font-code-md text-[12px] text-error">
                            Before
                          </span>
                        </div>
                        <div className="p-4 overflow-x-auto">
                          <pre
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: 13,
                              color: "#c7c4d8",
                              lineHeight: "22px",
                            }}
                          >
                            {s.before}
                          </pre>
                        </div>
                      </div>

                      {/* After */}
                      <div className="bg-[#0d152a] rounded-lg overflow-hidden flex flex-col border border-tertiary/20">
                        <div className="bg-tertiary/10 px-4 py-2 border-b border-tertiary/20 flex items-center justify-between">
                          <span className="font-code-md text-[12px] text-tertiary">
                            AI Suggested
                          </span>
                          <button
                            onClick={() => handleCopy(s.after, i)}
                            className="font-label-xs text-[10px] font-semibold text-tertiary hover:text-on-surface transition-colors cursor-pointer"
                          >
                            {copiedIndex === i ? "Copied!" : "Copy Fix"}
                          </button>
                        </div>
                        <div className="p-4 overflow-x-auto">
                          <pre
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: 13,
                              color: "#c7c4d8",
                              lineHeight: "22px",
                            }}
                          >
                            {s.after}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {showSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div
            className="w-full max-w-lg rounded-xl overflow-hidden"
            style={{
              background: "rgba(17,25,51,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3
                style={{
                  fontFamily: "Geist, sans-serif",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#dae2fd",
                }}
              >
                Select Files to Analyze
              </h3>
              <button
                onClick={() => setShowSelector(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* File List */}
            <div className="overflow-y-auto max-h-80 p-2">
              {allFiles.map((file) => (
                <div
                  key={file}
                  onClick={() =>
                    setSelectedFiles((prev) =>
                      prev.includes(file)
                        ? prev.filter((f) => f !== file)
                        : [...prev, file],
                    )
                  }
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
                  style={{
                    background: selectedFiles.includes(file)
                      ? "rgba(79,70,229,0.1)"
                      : "transparent",
                    border: selectedFiles.includes(file)
                      ? "1px solid rgba(79,70,229,0.3)"
                      : "1px solid transparent",
                    marginBottom: 4,
                  }}
                >
                  {/* Checkbox */}
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                    style={{
                      background: selectedFiles.includes(file)
                        ? "#4f46e5"
                        : "transparent",
                      border: selectedFiles.includes(file)
                        ? "none"
                        : "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    {selectedFiles.includes(file) && (
                      <span
                        className="material-symbols-outlined text-white"
                        style={{ fontSize: 12 }}
                      >
                        check
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 12,
                      color: "#dae2fd",
                    }}
                  >
                    {file}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  color: "#918fa1",
                }}
              >
                {selectedFiles.length} files selected
              </span>
              <button
                onClick={reanalyze}
                disabled={selectedFiles.length === 0 || analyzing}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-40"
                style={{
                  background: "#4f46e5",
                  color: "#dad7ff",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {analyzing ? "Analyzing..." : "Analyze Selected"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
