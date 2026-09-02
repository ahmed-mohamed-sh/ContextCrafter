"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface Stats {
  totalRepos: number;
  totalFiles: number;
  readyRepos: number;
  healthScore: number;
  aiScore: number;
}

interface Repo {
  id: string;
  name: string;
  fullName: string;
  language: string | null;
  status: string;
  healthScore: number;
  aiScore: number;
  totalFiles: number;
  reviewedAt: string | null;
  updatedAt: string;
}

interface Insight {
  id: string;
  title: string;
  context: string;
  tags: string[];
  repository: { id: string; name: string };
}

interface LanguageStat {
  name: string;
  count: number;
  percentage: number;
}

interface Activity {
  id: string;
  type: "review" | "chat" | "convention" | "connect";
  title: string;
  description: string;
  repoId: string;
  repoName: string;
  timestamp: string;
}

interface Props {
  user: User;
  stats: Stats;
  recentRepos: Repo[];
  recentInsights: Insight[];
  languages: LanguageStat[];
  activities: Activity[];
}

const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3776ab",
  Go: "#00add8",
  Rust: "#dea584",
  HTML: "#e34f26",
  CSS: "#1572b6",
  Java: "#b07219",
  Unknown: "#918fa1",
};

export default function DashboardClient({
  user,
  stats,
  recentRepos,
  recentInsights,
  languages,
  activities,
}: Props) {
  const router = useRouter();
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  async function disconnectRepo(repoId: string) {
    if (!confirm("Are you sure you want to disconnect this repository?")) return;
    setDisconnectingId(repoId);
    try {
      await fetch(`/api/repos/${repoId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDisconnectingId(null);
    }
  }

  const primaryRepoId = recentRepos[0]?.id;

  // Format relative time helper
  function formatRelativeTime(dateString: string) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);

      if (diffMins < 2) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      return `${diffDays}d ago`;
    } catch {
      return "Recently";
    }
  }

  const quickActions = [
    {
      title: "Connect Repository",
      description: "Import & index a GitHub repo",
      icon: "add_circle",
      color: "#c3c0ff",
      href: "/dashboard/repositories",
    },
    {
      title: "Run Code Review",
      description: "Static analysis & AI audit",
      icon: "rate_review",
      color: "#4cd7f6",
      href: primaryRepoId
        ? `/dashboard/repositories/${primaryRepoId}/code-review`
        : "/dashboard/repositories",
      disabled: !primaryRepoId,
    },
    {
      title: "Knowledge Graph",
      description: "Interactive AST dependencies",
      icon: "hub",
      color: "#ddb7ff",
      href: primaryRepoId
        ? `/dashboard/repositories/${primaryRepoId}/knowledge-graph`
        : "/dashboard/repositories",
      disabled: !primaryRepoId,
    },
    {
      title: "Technical Debt",
      description: "ROI & complexity heatmaps",
      icon: "speed",
      color: "#fbbf24",
      href: primaryRepoId
        ? `/dashboard/repositories/${primaryRepoId}/technical-dept`
        : "/dashboard/repositories",
      disabled: !primaryRepoId,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface"
              style={{ fontFamily: "Geist, sans-serif" }}
            >
              Welcome back, {user.name?.split(" ")[0] ?? "Developer"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-container/30 text-[#c3c0ff] border border-primary-container/40">
              Pro Workspace
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">
            Here is your live codebase intelligence, semantic context depth, and system health overview.
          </p>
        </div>

        {/* Global Health Score Pill */}
        <div
          className="rounded-xl p-3 px-5 flex items-center gap-4 border border-white/10"
          style={{
            background: "rgba(19, 27, 46, 0.6)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="3.5"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={stats.healthScore > 75 ? "#34d399" : stats.healthScore > 50 ? "#4cd7f6" : "#fbbf24"}
                strokeDasharray={`${stats.healthScore}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
                style={{ transition: "stroke-dasharray 0.5s ease" }}
              />
            </svg>
            <span className="absolute text-sm font-bold text-on-surface">
              {stats.healthScore}%
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface uppercase tracking-wider">
              Health Index
            </p>
            <p className="text-[11px] text-on-surface-variant">
              {stats.healthScore > 75 ? "Optimal State" : stats.healthScore > 50 ? "Stable Quality" : "Needs Review"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Enhanced Stats Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Repos */}
        <div
          className="rounded-xl p-5 border border-white/10 transition-all hover:border-white/20 flex flex-col justify-between relative overflow-hidden"
          style={{
            background: "rgba(19, 27, 46, 0.45)",
            backdropFilter: "blur(16px)",
            borderLeft: "3px solid #c3c0ff",
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Connected Repos
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#c3c0ff]/10 flex items-center justify-center text-[#c3c0ff]">
              <span className="material-symbols-outlined text-[18px]">folder_managed</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-on-surface tracking-tight" style={{ fontFamily: "Geist, sans-serif" }}>
            {stats.totalRepos}
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-green-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              {stats.readyRepos} Active
            </span>
            <span className="text-on-surface-variant">
              {stats.totalRepos - stats.readyRepos} Pending
            </span>
          </div>
        </div>

        {/* Total Files Indexed */}
        <div
          className="rounded-xl p-5 border border-white/10 transition-all hover:border-white/20 flex flex-col justify-between relative overflow-hidden"
          style={{
            background: "rgba(19, 27, 46, 0.45)",
            backdropFilter: "blur(16px)",
            borderLeft: "3px solid #4cd7f6",
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Indexed Files
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#4cd7f6]/10 flex items-center justify-center text-[#4cd7f6]">
              <span className="material-symbols-outlined text-[18px]">description</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-on-surface tracking-tight" style={{ fontFamily: "Geist, sans-serif" }}>
            {stats.totalFiles.toLocaleString()}
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-[#4cd7f6] font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">account_tree</span>
              AST & Embeddings
            </span>
            <span className="text-on-surface-variant">Indexed</span>
          </div>
        </div>

        {/* AI Context Depth */}
        <div
          className="rounded-xl p-5 border border-white/10 transition-all hover:border-white/20 flex flex-col justify-between relative overflow-hidden"
          style={{
            background: "rgba(19, 27, 46, 0.45)",
            backdropFilter: "blur(16px)",
            borderLeft: "3px solid #ddb7ff",
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Context Depth
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ddb7ff]/10 flex items-center justify-center text-[#ddb7ff]">
              <span className="material-symbols-outlined text-[18px]">psychology</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-on-surface tracking-tight" style={{ fontFamily: "Geist, sans-serif" }}>
              {stats.aiScore}
            </span>
            <span className="text-lg text-on-surface-variant">%</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-[#ddb7ff] font-medium">
              {stats.aiScore > 70 ? "Deep Semantic Map" : "Moderate Context"}
            </span>
            <span className="text-on-surface-variant">Llama-3.3</span>
          </div>
        </div>

        {/* Code Quality & Debt Index */}
        <div
          className="rounded-xl p-5 border border-white/10 transition-all hover:border-white/20 flex flex-col justify-between relative overflow-hidden"
          style={{
            background: "rgba(19, 27, 46, 0.45)",
            backdropFilter: "blur(16px)",
            borderLeft: "3px solid #34d399",
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Quality Index
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#34d399]/10 flex items-center justify-center text-[#34d399]">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-on-surface tracking-tight" style={{ fontFamily: "Geist, sans-serif" }}>
            {stats.healthScore}
            <span className="text-lg font-normal text-on-surface-variant">/100</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-green-400 font-medium">Verified Clean</span>
            <span className="text-on-surface-variant">Automated</span>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions Panel (NEW) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-base font-semibold text-on-surface flex items-center gap-2"
            style={{ fontFamily: "Geist, sans-serif" }}
          >
            <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`rounded-xl p-4 border border-white/10 transition-all duration-200 group flex items-center gap-4 ${
                action.disabled ? "opacity-60 cursor-not-allowed" : "hover:border-white/25 hover:bg-white/[0.04]"
              }`}
              style={{
                background: "rgba(19, 27, 46, 0.4)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                style={{
                  backgroundColor: `${action.color}15`,
                  border: `1px solid ${action.color}30`,
                  color: action.color,
                }}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {action.icon}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                  {action.title}
                </h3>
                <p className="text-xs text-on-surface-variant truncate">
                  {action.description}
                </p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all text-[18px]">
                arrow_forward
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Repositories & Insights */}
        <div className="lg:col-span-8 space-y-8">
          {/* Connected Repositories Section */}
          <div
            className="rounded-xl border border-white/10 overflow-hidden"
            style={{
              background: "rgba(19, 27, 46, 0.4)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3
                  className="text-base font-semibold text-on-surface"
                  style={{ fontFamily: "Geist, sans-serif" }}
                >
                  Connected Repositories
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Manage repositories, inspect architecture, and initiate AI conversations.
                </p>
              </div>
              <Link
                href="/dashboard/repositories"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                View all ({recentRepos.length})
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>

            <div className="divide-y divide-white/5">
              {recentRepos.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[24px]">folder_open</span>
                  </div>
                  <h4 className="text-sm font-semibold text-on-surface mb-1">
                    No repositories connected yet
                  </h4>
                  <p className="text-xs text-on-surface-variant max-w-sm mx-auto mb-4">
                    Connect your GitHub repository to generate automatic code reviews, dependency graphs, and technical debt analysis.
                  </p>
                  <Link
                    href="/dashboard/repositories"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-xs font-semibold hover:brightness-110 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Connect GitHub Repo
                  </Link>
                </div>
              ) : (
                recentRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high/60 border border-white/10 flex items-center justify-center shrink-0 text-primary mt-0.5 sm:mt-0">
                        <span className="material-symbols-outlined text-[20px]">
                          folder
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/repositories/${repo.id}/chat`}
                            className="text-sm font-semibold text-on-surface hover:text-primary transition-colors truncate"
                          >
                            {repo.name}
                          </Link>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                              repo.status === "READY"
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : repo.status === "ANALYZING"
                                ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                : "bg-white/5 text-on-surface-variant border border-white/10"
                            }`}
                          >
                            {repo.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  languageColors[repo.language ?? "Unknown"] || "#918fa1",
                              }}
                            />
                            {repo.language ?? "Codebase"}
                          </span>
                          <span>•</span>
                          <span>{repo.totalFiles} files</span>
                          <span>•</span>
                          <span>Updated {formatRelativeTime(repo.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Link
                        href={`/dashboard/repositories/${repo.id}/chat`}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-semibold flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">chat</span>
                        AI Chat
                      </Link>
                      <Link
                        href={`/dashboard/repositories/${repo.id}/knowledge-graph`}
                        className="p-1.5 rounded-lg border border-white/10 text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
                        title="Knowledge Graph"
                      >
                        <span className="material-symbols-outlined text-[16px]">hub</span>
                      </Link>
                      <Link
                        href={`/dashboard/repositories/${repo.id}/code-review`}
                        className="p-1.5 rounded-lg border border-white/10 text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
                        title="Code Review"
                      >
                        <span className="material-symbols-outlined text-[16px]">rate_review</span>
                      </Link>
                      <button
                        onClick={() => disconnectRepo(repo.id)}
                        disabled={disconnectingId === repo.id}
                        className="p-1.5 rounded-lg border border-white/10 text-outline hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Disconnect repository"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {disconnectingId === repo.id ? "sync" : "link_off"}
                        </span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent AI Insights Section */}
          <div
            className="rounded-xl border border-white/10 overflow-hidden"
            style={{
              background: "rgba(19, 27, 46, 0.4)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3
                  className="text-base font-semibold text-on-surface flex items-center gap-2"
                  style={{ fontFamily: "Geist, sans-serif" }}
                >
                  <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">
                    insights
                  </span>
                  Recent AI Insights & Architectural Flags
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Automated findings discovered during code reviews and semantic indexing.
                </p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {recentInsights.length === 0 ? (
                // Rich default architectural sample cards if empty
                [
                  {
                    color: "#4cd7f6",
                    icon: "memory",
                    title: "Coupling Detected in Service Layer",
                    file: "auth/service.ts",
                    desc: "Deep nesting found in token refresh handler. Recommended: extract to isolated middleware helper.",
                    impact: "High Impact",
                    tag: "Architecture",
                  },
                  {
                    color: "#fbbf24",
                    icon: "speed",
                    title: "Potential N+1 Database Query",
                    file: "db/repository.ts",
                    desc: "Iterative relationship lookups inside user profile loop. Batch resolution will improve throughput.",
                    impact: "Optimization",
                    tag: "Database",
                  },
                  {
                    color: "#ddb7ff",
                    icon: "security",
                    title: "Missing Input Validation Guard",
                    file: "api/routes.ts",
                    desc: "Payload deserialization without strict schema parsing. Zod schema validation recommended.",
                    impact: "Security",
                    tag: "Validation",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center border border-white/8 bg-surface-container/20 backdrop-blur-md transition-all hover:bg-white/[0.03]"
                    style={{ borderLeft: `3px solid ${item.color}` }}
                  >
                    <div
                      className="p-2.5 rounded-lg hidden sm:flex items-center justify-center shrink-0"
                      style={{
                        background: `${item.color}15`,
                        color: item.color,
                        border: `1px solid ${item.color}25`,
                      }}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {item.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-on-surface truncate">
                          {item.title}
                        </h4>
                        <code
                          className="text-[11px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono"
                          style={{ fontFamily: "JetBrains Mono, monospace" }}
                        >
                          {item.file}
                        </code>
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-1">
                        {item.desc}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container-high border border-white/5 text-on-surface-variant font-medium">
                        {item.tag}
                      </span>
                      {primaryRepoId && (
                        <Link
                          href={`/dashboard/repositories/${primaryRepoId}/code-review`}
                          className="px-3 py-1 rounded bg-surface-container-high text-on-surface text-xs font-medium border border-outline-variant/30 hover:bg-white/10 transition-colors"
                        >
                          Review
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                recentInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className="rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center border border-white/8 bg-surface-container/20 backdrop-blur-md transition-all hover:bg-white/[0.03]"
                    style={{ borderLeft: "3px solid #4cd7f6" }}
                  >
                    <div className="p-2.5 rounded-lg hidden sm:flex items-center justify-center shrink-0 bg-[#4cd7f6]/10 text-[#4cd7f6] border border-[#4cd7f6]/20">
                      <span className="material-symbols-outlined text-[20px]">memory</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-on-surface mb-1 truncate">
                        {insight.title}{" "}
                        <span className="text-xs font-normal text-on-surface-variant">
                          — {insight.repository.name}
                        </span>
                      </h4>
                      <p className="text-xs text-on-surface-variant line-clamp-1">
                        {insight.context}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                        {insight.tags[0] ?? "insight"}
                      </span>
                      <Link
                        href={`/dashboard/repositories/${insight.repository.id}/code-review`}
                        className="px-3 py-1 rounded bg-surface-container-high text-on-surface text-xs border border-outline-variant/30 hover:bg-white/10 transition-colors"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Language Distribution & Activity Timeline */}
        <div className="lg:col-span-4 space-y-8">
          {/* Language Distribution Component (NEW) */}
          <div
            className="rounded-xl p-5 border border-white/10 space-y-4"
            style={{
              background: "rgba(19, 27, 46, 0.4)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-sm font-semibold text-on-surface flex items-center gap-2"
                style={{ fontFamily: "Geist, sans-serif" }}
              >
                <span className="material-symbols-outlined text-[#ddb7ff] text-[18px]">
                  pie_chart
                </span>
                Language Distribution
              </h3>
              <span className="text-[11px] text-on-surface-variant">
                {stats.totalFiles} total files
              </span>
            </div>

            {/* Stacked Proportional Bar */}
            <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-white/5 border border-white/5">
              {languages.length === 0 ? (
                <div className="h-full w-full bg-[#3178c6]" />
              ) : (
                languages.map((lang) => (
                  <div
                    key={lang.name}
                    style={{
                      width: `${Math.max(5, lang.percentage)}%`,
                      backgroundColor: languageColors[lang.name] || "#918fa1",
                    }}
                    title={`${lang.name}: ${lang.percentage}%`}
                  />
                ))
              )}
            </div>

            {/* Language breakdown list */}
            <div className="space-y-2.5 pt-1">
              {(languages.length === 0
                ? [
                    { name: "TypeScript", count: stats.totalFiles || 120, percentage: 68 },
                    { name: "Python", count: 40, percentage: 22 },
                    { name: "Go", count: 18, percentage: 10 },
                  ]
                : languages
              ).map((lang) => (
                <div key={lang.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: languageColors[lang.name] || "#918fa1",
                      }}
                    />
                    <span className="text-on-surface font-medium">{lang.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant font-mono">
                    <span>{lang.count.toLocaleString()} files</span>
                    <span className="text-[11px] text-on-surface-variant/60 font-semibold w-8 text-right">
                      {lang.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Timeline Component (NEW) */}
          <div
            className="rounded-xl p-5 border border-white/10 space-y-4"
            style={{
              background: "rgba(19, 27, 46, 0.4)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-sm font-semibold text-on-surface flex items-center gap-2"
                style={{ fontFamily: "Geist, sans-serif" }}
              >
                <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">
                  history
                </span>
                Activity Timeline
              </h3>
              <span className="text-[11px] text-on-surface-variant">Recent events</span>
            </div>

            <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
              {activities.length === 0 ? (
                <div className="text-xs text-on-surface-variant py-2">
                  No recent activities recorded. Connect a repository to start tracking.
                </div>
              ) : (
                activities.map((act) => {
                  const iconMap: Record<string, { icon: string; color: string }> = {
                    review: { icon: "rate_review", color: "#4cd7f6" },
                    chat: { icon: "chat", color: "#c3c0ff" },
                    convention: { icon: "rule", color: "#34d399" },
                    connect: { icon: "folder_open", color: "#ddb7ff" },
                  };
                  const meta = iconMap[act.type] || { icon: "info", color: "#918fa1" };

                  return (
                    <div key={act.id} className="relative group">
                      {/* Timeline Dot */}
                      <div
                        className="absolute -left-5 top-0.5 w-2 h-2 rounded-full ring-4 ring-[#0b1326]"
                        style={{ backgroundColor: meta.color }}
                      />
                      <div className="text-xs">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-semibold text-on-surface truncate">
                            {act.title}
                          </span>
                          <span className="text-[10px] text-on-surface-variant shrink-0">
                            {formatRelativeTime(act.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant line-clamp-1">
                          {act.description}
                        </p>
                        <p className="text-[10px] text-primary/70 font-mono mt-0.5">
                          {act.repoName}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* AI Capabilities Card */}
          <div
            className="rounded-xl p-5 border border-primary/20 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(19, 27, 46, 0.4) 100%)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 text-[#c3c0ff] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              </div>
              <h4 className="text-sm font-semibold text-on-surface">
                Code Intelligence Active
              </h4>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              ContextCrafter continuously parses code syntax, extracts coding conventions, and constructs vector search embeddings.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] text-on-surface font-mono">
                Groq Llama-3.3 Engine Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
