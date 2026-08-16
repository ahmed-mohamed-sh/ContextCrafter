"use client";

import { useState } from "react";

interface DebtCluster {
  id: string;
  title: string;
  description: string;
  icon: string;
  severity: "critical" | "major" | "minor";
  impactedFiles: number;
  impactLabel: string;
  remediationHours: number;
  files: string[];
}

interface HeatmapCell {
  label: string;
  severity: "critical" | "major" | "minor" | "none";
}

interface Props {
  repo: { id: string; name: string; fullName: string };
  clusters: DebtCluster[];
  heatmap: HeatmapCell[][];
  roiGrade: string;
  roiTrend: number;
  estimatedEffort: number;
  roiSummary: string;
}

const severityStyles = {
  critical: {
    color: "#ffb4ab",
    bg: "rgba(255,180,171,0.1)",
    border: "1px solid rgba(255,180,171,0.2)",
    cellBg: "rgba(255,180,171,0.7)",
    cellBorder: "1px solid rgba(255,180,171,0.5)",
  },
  major: {
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.1)",
    border: "1px solid rgba(251,191,36,0.2)",
    cellBg: "rgba(251,191,36,0.6)",
    cellBorder: "1px solid rgba(251,191,36,0.4)",
  },
  minor: {
    color: "#34d399",
    bg: "rgba(52,211,153,0.1)",
    border: "1px solid rgba(52,211,153,0.2)",
    cellBg: "rgba(52,211,153,0.4)",
    cellBorder: "1px solid rgba(52,211,153,0.3)",
  },
  none: {
    color: "#464555",
    bg: "transparent",
    border: "1px solid rgba(255,255,255,0.05)",
    cellBg: "rgba(45,52,73,0.6)",
    cellBorder: "1px solid rgba(255,255,255,0.05)",
  },
};

export default function TechnicalDeptClient({
  repo,
  clusters,
  heatmap,
  roiGrade,
  roiTrend,
  estimatedEffort,
  roiSummary,
}: Props) {
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto p-8 relative z-10 w-full">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2
            style={{
              fontFamily: "Geist, sans-serif",
              fontSize: 32,
              fontWeight: 700,
              color: "#dae2fd",
              letterSpacing: "-0.01em",
            }}
          >
            Technical Debt Overview
          </h2>
          <p
            className="flex items-center gap-2 mt-1"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              color: "#918fa1",
            }}
          >
            <span className="material-symbols-outlined text-[16px]">
              folder_open
            </span>
            {repo.fullName}
            <span
              className="w-1 h-1 rounded-full mx-1"
              style={{ background: "#464555" }}
            />
            Last scanned: just now
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: "#c7c4d8",
              background: "rgba(19,27,46,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span className="material-symbols-outlined text-[16px]">
              filter_list
            </span>
            Filter
          </button>
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:brightness-110"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: "#dad7ff",
              background: "#4f46e5",
              borderTop: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 4px 12px rgba(79,70,229,0.2)",
            }}
          >
            <span className="material-symbols-outlined text-[16px]">scan</span>
            Rescan Now
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ROI Score Card */}
        <div
          className="col-span-1 lg:col-span-4 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between"
          style={{
            background: "rgba(19,27,46,0.4)",
            backdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            borderLeft: "1px solid rgba(255,255,255,0.15)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            borderRight: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="absolute top-0 right-0 p-4">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 60, color: "rgba(195,192,255,0.1)" }}
            >
              analytics
            </span>
          </div>
          <div>
            <h3
              className="uppercase tracking-wider mb-2"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: "#918fa1",
                letterSpacing: "0.05em",
              }}
            >
              Refactor ROI Score
            </h3>
            <div className="flex items-baseline gap-3">
              <span
                style={{
                  fontFamily: "Geist, sans-serif",
                  fontSize: 48,
                  fontWeight: 700,
                  color: "#dae2fd",
                  lineHeight: "56px",
                  letterSpacing: "-0.02em",
                }}
              >
                {roiGrade}
              </span>
              <span
                className="px-2 py-0.5 rounded flex items-center gap-1"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase" as const,
                  color: roiTrend >= 0 ? "#34d399" : "#ffb4ab",
                  background:
                    roiTrend >= 0
                      ? "rgba(52,211,153,0.1)"
                      : "rgba(255,180,171,0.1)",
                  border:
                    roiTrend >= 0
                      ? "1px solid rgba(52,211,153,0.2)"
                      : "1px solid rgba(255,180,171,0.2)",
                }}
              >
                <span className="material-symbols-outlined text-[12px]">
                  {roiTrend >= 0 ? "trending_up" : "trending_down"}
                </span>
                {Math.abs(roiTrend)}%
              </span>
            </div>
            <p
              className="mt-4 max-w-[80%]"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "#918fa1",
                lineHeight: "20px",
              }}
            >
              {roiSummary}
            </p>
          </div>
          <div
            className="mt-6 pt-4 flex justify-between items-center"
            style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#918fa1",
                  letterSpacing: "0.05em",
                }}
              >
                Est. Effort
              </p>
              <p
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 14,
                  color: "#dae2fd",
                }}
              >
                ~{estimatedEffort} Hours
              </p>
            </div>
          </div>
        </div>

        {/* Debt Heatmap */}
        <div
          className="col-span-1 lg:col-span-8 rounded-xl p-6"
          style={{
            background: "rgba(19,27,46,0.4)",
            backdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            borderLeft: "1px solid rgba(255,255,255,0.15)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            borderRight: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3
              className="uppercase tracking-wider"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: "#918fa1",
                letterSpacing: "0.05em",
              }}
            >
              Debt Heatmap
            </h3>
            <div className="flex gap-3" style={{ fontSize: 12 }}>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#ffb4ab" }}
                />
                <span
                  style={{ color: "#918fa1", fontFamily: "Inter, sans-serif" }}
                >
                  Critical
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#fbbf24" }}
                />
                <span
                  style={{ color: "#918fa1", fontFamily: "Inter, sans-serif" }}
                >
                  Major
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#34d399" }}
                />
                <span
                  style={{ color: "#918fa1", fontFamily: "Inter, sans-serif" }}
                >
                  Minor
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2" style={{ minHeight: 128 }}>
            {heatmap.flat().map((cell, i) => {
              const s = severityStyles[cell.severity];
              return (
                <div
                  key={i}
                  className="rounded flex items-center justify-center group relative cursor-crosshair transition-all"
                  style={{
                    background: s.cellBg,
                    border: s.cellBorder,
                  }}
                >
                  {cell.label && (
                    <span
                      className="opacity-0 group-hover:opacity-100 z-10 transition-opacity"
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 14,
                        color: "#fff",
                      }}
                    >
                      {cell.label}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Debt Clusters List */}
        <div
          className="col-span-1 lg:col-span-12 rounded-xl overflow-hidden mt-2"
          style={{
            background: "rgba(19,27,46,0.4)",
            backdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            borderLeft: "1px solid rgba(255,255,255,0.15)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            borderRight: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            className="px-6 py-4 flex justify-between items-center"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(19,27,46,0.5)",
            }}
          >
            <h3
              className="uppercase tracking-wider"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: "#918fa1",
                letterSpacing: "0.05em",
              }}
            >
              Debt Clusters
            </h3>
          </div>
          <div>
            {clusters.map((cluster) => {
              const s = severityStyles[cluster.severity];
              const isExpanded = expandedCluster === cluster.id;

              return (
                <div
                  key={cluster.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <div
                    className="p-6 flex items-center group cursor-pointer transition-colors hover:bg-white/2"
                    onClick={() =>
                      setExpandedCluster(isExpanded ? null : cluster.id)
                    }
                  >
                    <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4 flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            color: s.color,
                            background: s.bg,
                            border: s.border,
                          }}
                        >
                          <span className="material-symbols-outlined">
                            {cluster.icon}
                          </span>
                        </div>
                        <div>
                          <h4
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: 16,
                              fontWeight: 600,
                              color: "#dae2fd",
                            }}
                          >
                            {cluster.title}
                          </h4>
                          <p
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: 14,
                              color: "#918fa1",
                            }}
                          >
                            {cluster.description}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <p
                          className="mb-1"
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#918fa1",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Impacted Files
                        </p>
                        <p
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 14,
                            color: "#dae2fd",
                          }}
                        >
                          {cluster.impactLabel}
                        </p>
                      </div>
                      <div className="col-span-3">
                        <p
                          className="mb-1"
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#918fa1",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Time to Remediate
                        </p>
                        <p
                          className="flex items-center gap-2"
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 14,
                            color: "#dae2fd",
                          }}
                        >
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                            schedule
                          </span>
                          ~{cluster.remediationHours}h
                        </p>
                      </div>
                      <div className="col-span-2 text-right">
                        <span
                          className="px-2.5 py-1 rounded-full inline-block"
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase" as const,
                            color: s.color,
                            background: s.bg,
                            border: s.border,
                          }}
                        >
                          {cluster.severity}
                        </span>
                      </div>
                    </div>
                    <button className="ml-6 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-white/10 text-on-surface-variant">
                      <span
                        className="material-symbols-outlined transition-transform"
                        style={{
                          transform: isExpanded
                            ? "rotate(90deg)"
                            : "rotate(0deg)",
                        }}
                      >
                        arrow_forward
                      </span>
                    </button>
                  </div>

                  {/* Expanded file list */}
                  {isExpanded && cluster.files.length > 0 && (
                    <div
                      className="px-6 pb-4"
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.03)",
                      }}
                    >
                      <div className="ml-14 pt-3 flex flex-wrap gap-2">
                        {cluster.files.map((file) => (
                          <span
                            key={file}
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: 11,
                              color: "#c3c0ff",
                              background: "rgba(195,192,255,0.08)",
                              border: "1px solid rgba(195,192,255,0.15)",
                              borderRadius: 4,
                              padding: "2px 8px",
                            }}
                          >
                            {file.split("/").pop()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="h-16 w-full" />
    </div>
  );
}
