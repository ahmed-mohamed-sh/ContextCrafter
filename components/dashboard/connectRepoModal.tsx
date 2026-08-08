"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GitHubRepo {
  githubId: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  private: boolean;
  language: string | null;
  stars: number;
  updatedAt: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export function ConnectRepoModal({ isOpen, onClose, onConnected }: Props) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) fetchRepos();
  }, [isOpen]);

  async function fetchRepos() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/repos/github");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRepos(data.repos);
    } catch (e) {
      setError("Failed to load repositories");
    } finally {
      setLoading(false);
    }
  }

  async function connectRepo(repo: GitHubRepo) {
    setConnecting(repo.githubId);
    try {
      const res = await fetch("/api/repos/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(repo),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      onConnected();
      onClose();
    } catch {
      setError("Failed to connect repository");
    } finally {
      setConnecting(null);
    }
  }

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
          >
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "rgba(17,25,51,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(20px)",
                boxShadow:
                  "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2
                    style={{
                      fontFamily: "Geist, sans-serif",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#dae2fd",
                    }}
                  >
                    Connect Repository
                  </h2>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      color: "#918fa1",
                      marginTop: 2,
                    }}
                  >
                    Select a GitHub repository to analyze
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-white/5">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-surface-container/50 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              {/* Repo List */}
              <div className="overflow-y-auto max-h-80">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-[40px] text-error/50">
                      error
                    </span>
                    <p className="text-sm text-on-surface-variant mt-2">
                      {error}
                    </p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30">
                      folder_off
                    </span>
                    <p className="text-sm text-on-surface-variant mt-2">
                      No repositories found
                    </p>
                  </div>
                ) : (
                  filtered.map((repo) => (
                    <div
                      key={repo.githubId}
                      className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                          {repo.private ? "lock" : "folder"}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">
                            {repo.name}
                          </p>
                          {repo.description && (
                            <p className="text-[11px] text-on-surface-variant truncate">
                              {repo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {repo.language && (
                              <span
                                className="text-[10px] text-on-surface-variant"
                                style={{
                                  fontFamily: "JetBrains Mono, monospace",
                                }}
                              >
                                {repo.language}
                              </span>
                            )}
                            {repo.private && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant border border-white/10">
                                Private
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => connectRepo(repo)}
                        disabled={connecting === repo.githubId}
                        className="ml-4 shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all hover:brightness-110 disabled:opacity-50"
                        style={{
                          background: "#4f46e5",
                          color: "#dad7ff",
                          borderTop: "1px solid rgba(255,255,255,0.15)",
                        }}
                      >
                        {connecting === repo.githubId ? (
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          "Connect"
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
