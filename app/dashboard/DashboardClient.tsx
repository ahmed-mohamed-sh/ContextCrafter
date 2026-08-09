"use client";

import { useRouter } from "next/navigation";

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
  language: string | null;
  status: string;
  healthScore: number;
  updatedAt: Date;
}

interface Insight {
  id: string;
  title: string;
  context: string;
  tags: string[];
  repository: { name: string };
}

interface Props {
  user: User;
  stats: Stats;
  recentRepos: Repo[];
  recentInsights: Insight[];
}

export default function DashboardClient({
  user,
  stats,
  recentRepos,
  recentInsights,
}: Props) {
  const router = useRouter();

  async function disconnectRepo(repoId: string) {
    await fetch(`/api/repos/${repoId}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h2
              className="font-bold text-3xl text-primary mb-2"
              style={{ fontFamily: "Geist, sans-serif" }}
            >
              Welcome back, {user.name?.split(" ")[0] ?? "Developer"}
            </h2>
            <p className="text-on-surface-variant text-sm">
              Here is the current state of your connected repositories.
            </p>
          </div>

          {/* Health Score */}
          <div className="rounded-xl p-4 flex items-center gap-6 border border-white/10 bg-surface-container/30 backdrop-blur-md">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#4cd7f6"
                  strokeDasharray={`${stats.healthScore}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute text-lg font-bold text-[#4cd7f6]">
                {stats.healthScore}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-on-surface mb-1">
                Global Health Score
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                {stats.totalRepos} repositories connected
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {/* AI Score */}
          <div className="rounded-xl p-6 border border-white/10 bg-surface-container/30 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-primary text-[28px]">
                  psychology
                </span>
                <span className="text-[11px] px-2 py-1 bg-surface-container-high rounded text-primary font-semibold">
                  {stats.aiScore > 80
                    ? "High"
                    : stats.aiScore > 50
                      ? "Medium"
                      : "Low"}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant mb-1">
                AI Context Depth
              </p>
              <div
                className="text-4xl font-bold text-on-surface"
                style={{ fontFamily: "Geist, sans-serif" }}
              >
                {stats.aiScore}
                <span className="text-2xl text-on-surface-variant">%</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#4cd7f6]">
                  trending_up
                </span>
                {stats.readyRepos} repos fully analyzed
              </p>
            </div>
          </div>

          {/* Files */}
          <div className="rounded-xl p-6 border border-white/10 bg-surface-container/30 backdrop-blur-md lg:col-span-2 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-on-surface">
                Connected Repositories
              </h3>
              <span className="text-[11px] text-on-surface-variant">
                {stats.totalRepos} total
              </span>
            </div>
            <div className="space-y-3">
              {recentRepos.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30">
                    account_tree
                  </span>
                  <p className="text-sm text-on-surface-variant mt-2">
                    No repositories connected yet
                  </p>
                  <button className="mt-3 px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-sm font-semibold hover:brightness-110 transition-all">
                    Connect GitHub Repo
                  </button>
                </div>
              ) : (
                recentRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-container-high/30 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-[18px]">
                        folder
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">
                          {repo.name}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          {repo.language ?? "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] px-2 py-1 rounded-full font-semibold ${
                          repo.status === "READY"
                            ? "bg-green-500/10 text-green-400"
                            : repo.status === "ANALYZING"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {repo.status}
                      </span>
                      <button
                        onClick={() => disconnectRepo(repo.id)}
                        className="p-1 rounded hover:bg-white/5 transition-colors flex items-center justify-center"
                        title="Disconnect"
                      >
                        <span className="material-symbols-outlined text-[#918fa1] hover:text-red-400 transition-colors" style={{ fontSize: 16 }}>
                          link_off
                        </span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Total Files */}
          <div className="rounded-xl p-6 border border-white/10 bg-surface-container/30 backdrop-blur-md flex flex-col justify-between">
            <div>
              <span className="material-symbols-outlined text-[#ddb7ff] text-[28px] mb-4 block">
                folder_data
              </span>
              <p className="text-sm text-on-surface-variant mb-1">
                Total Files Indexed
              </p>
              <div
                className="text-2xl font-bold text-on-surface"
                style={{ fontFamily: "Geist, sans-serif" }}
              >
                {stats.totalFiles.toLocaleString()}
              </div>
            </div>
            <div className="mt-4 flex gap-2 flex-wrap">
              {["src/", "lib/", "api/"].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded text-[11px] text-on-surface-variant border border-outline-variant/30 bg-surface-container"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h3
              className="text-xl font-semibold text-on-surface"
              style={{ fontFamily: "Geist, sans-serif" }}
            >
              Recent AI Insights
            </h3>
            <a
              className="text-sm text-primary hover:underline flex items-center gap-1"
              href="#"
            >
              View all{" "}
              <span className="material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </a>
          </div>

          <div className="space-y-4">
            {recentInsights.length === 0 ? (
              // Static preview لو مفيش insights لسه
              <>
                {[
                  {
                    color: "#4cd7f6",
                    icon: "memory",
                    title: "Extract highly coupled logic in",
                    file: "auth.service.ts",
                    desc: "The user authentication flow contains deep nesting which increases cognitive load.",
                    impact: "High Impact",
                    repo: "—",
                  },
                  {
                    color: "#ddb7ff",
                    icon: "speed",
                    title: "Potential N+1 Query detected in",
                    file: "user.repository.go",
                    desc: "Fetching user profiles inside the team loop. Consider eager loading or a batch fetch approach.",
                    impact: "Medium Impact",
                    repo: "—",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center border border-white/8 bg-surface-container/20 backdrop-blur-md"
                    style={{ borderLeft: `2px solid ${item.color}` }}
                  >
                    <div
                      className="p-2 rounded hidden md:block"
                      style={{
                        background: `${item.color}15`,
                        color: item.color,
                      }}
                    >
                      <span className="material-symbols-outlined">
                        {item.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-on-surface mb-1">
                        {item.title}{" "}
                        <code
                          className="text-[11px] bg-surface-container px-1 py-0.5 rounded text-on-surface-variant"
                          style={{ fontFamily: "JetBrains Mono, monospace" }}
                        >
                          {item.file}
                        </code>
                      </h4>
                      <p className="text-sm text-on-surface-variant line-clamp-1">
                        {item.desc}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-on-surface-variant">
                        {item.impact}
                      </span>
                      <button className="px-3 py-1.5 rounded bg-surface-container-high text-on-surface text-sm border border-outline-variant/30 hover:bg-surface-bright transition-colors">
                        Review Code
                      </button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              recentInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center border border-white/8 bg-surface-container/20 backdrop-blur-md"
                  style={{ borderLeft: "2px solid #4cd7f6" }}
                >
                  <div className="p-2 rounded hidden md:block bg-[#4cd7f6]/10 text-[#4cd7f6]">
                    <span className="material-symbols-outlined">memory</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-on-surface mb-1">
                      {insight.title}{" "}
                      <span className="text-[11px] text-on-surface-variant">
                        — {insight.repository.name}
                      </span>
                    </h4>
                    <p className="text-sm text-on-surface-variant line-clamp-1">
                      {insight.context}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] px-2 py-1 rounded-full bg-surface-container text-on-surface-variant">
                      {insight.tags[0] ?? "insight"}
                    </span>
                    <button className="px-3 py-1.5 rounded bg-surface-container-high text-on-surface text-sm border border-outline-variant/30 hover:bg-surface-bright transition-colors">
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
    </div>
  );
}
