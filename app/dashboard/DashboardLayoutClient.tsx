"use client";

import { signOut } from "next-auth/react";
import { useState, useEffect, useRef, ReactNode } from "react";
import { ConnectRepoModal } from "@/components/dashboard/connectRepoModal";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface Repo {
  id: string;
  name: string;
  language: string | null;
  status: string;
  healthScore: number;
  updatedAt: Date;
}

interface Props {
  user: User;
  recentRepos: Repo[];
  children: ReactNode;
}

export default function DashboardLayoutClient({
  user,
  recentRepos,
  children,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("dark-obsidian");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifFilter, setNotifFilter] = useState<"all" | "unread" | "security">("all");
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifOpen]);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);
  }

  function formatRelativeTime(dateStr: string | Date) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  useEffect(() => {
    const applySavedTheme = () => {
      const saved = localStorage.getItem("cc_theme_mode") || "dark-obsidian";
      setCurrentTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
      if (saved === "cyber-blue") {
        document.documentElement.style.backgroundColor = "#040b17";
        document.body.style.background = "#040b17";
      } else if (saved === "deep-violet") {
        document.documentElement.style.backgroundColor = "#090314";
        document.body.style.background = "#090314";
      } else {
        document.documentElement.style.backgroundColor = "#0b1326";
        document.body.style.background = "#0b1326";
      }
    };

    applySavedTheme();
    window.addEventListener("theme-change", applySavedTheme);
    window.addEventListener("storage", applySavedTheme);
    return () => {
      window.removeEventListener("theme-change", applySavedTheme);
      window.removeEventListener("storage", applySavedTheme);
    };
  }, []);

  function cycleTheme() {
    const nextTheme =
      currentTheme === "dark-obsidian"
        ? "cyber-blue"
        : currentTheme === "cyber-blue"
        ? "deep-violet"
        : "dark-obsidian";

    setCurrentTheme(nextTheme);
    localStorage.setItem("cc_theme_mode", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    if (nextTheme === "cyber-blue") {
      document.documentElement.style.backgroundColor = "#040b17";
      document.body.style.background = "#040b17";
    } else if (nextTheme === "deep-violet") {
      document.documentElement.style.backgroundColor = "#090314";
      document.body.style.background = "#090314";
    } else {
      document.documentElement.style.backgroundColor = "#0b1326";
      document.body.style.background = "#0b1326";
    }
    window.dispatchEvent(new Event("theme-change"));

    fetch("/api/setting/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeMode: nextTheme }),
    }).catch(() => {});
  }

  useEffect(() => {
    const hasAnalyzing = recentRepos.some(
      (r) => r.status === "ANALYZING" || r.status === "PENDING",
    );

    if (!hasAnalyzing) return;

    const interval = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [recentRepos, router]);

  return (
    <div className="min-h-screen overflow-x-hidden antialiased text-on-background bg-background flex">
      {/* Ambient Background */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-container/10 blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary-container/10 blur-[120px] pointer-events-none -z-10" />

      {/* Sidebar */}
      <nav className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface/60 backdrop-blur-xl border-r border-white/10 shadow-xl shadow-primary/5 z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center">
              <span
                className="material-symbols-outlined text-on-primary-container"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                hub
              </span>
            </div>
            <div>
              <h1
                className="font-bold text-primary tracking-tight"
                style={{ fontFamily: "Geist, sans-serif", fontSize: "1.1rem" }}
              >
                ContextCrafter
              </h1>
              <p
                className="text-[11px] text-on-surface-variant"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                v1.0.0
              </p>
            </div>
          </div>
          <button className="w-full py-2 px-4 mb-6 rounded-lg bg-primary-container text-on-primary-container font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition-all text-sm cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Workspace
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
          {[
            { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
            {
              icon: "account_tree",
              label: "Repositories",
              href: "/dashboard/repositories",
            },
            {
              icon: "forum",
              label: "AI Chat",
              href: "#",
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                if (recentRepos.length > 0) {
                  router.push(
                    `/dashboard/repositories/${recentRepos[0].id}/chat`,
                  );
                } else {
                  alert("Connect a repository first");
                }
              },
            },
            {
              icon: "account_tree",
              label: "Architecture",
              href: "#",
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                if (recentRepos.length > 0) {
                  router.push(
                    `/dashboard/repositories/${recentRepos[0].id}/architecture`,
                  );
                } else {
                  alert("Connect a repository first");
                }
              },
            },
            {
              icon: "hub",
              label: "Knowledge Graph",
              href: "#",
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                if (recentRepos.length > 0) {
                  router.push(
                    `/dashboard/repositories/${recentRepos[0].id}/knowledge-graph`,
                  );
                } else {
                  alert("Connect a repository first");
                }
              },
            },
            {
              icon: "code",
              label: "Code Review",
              href: "#",
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                if (recentRepos.length > 0) {
                  router.push(
                    `/dashboard/repositories/${recentRepos[0].id}/code-review`,
                  );
                } else {
                  alert("Connect a repository first");
                }
              },
            },
            {
              icon: "description",
              label: "Documentation",
              href: "#",
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                if (recentRepos.length > 0) {
                  router.push(
                    `/dashboard/repositories/${recentRepos[0].id}/Documention`,
                  );
                } else {
                  alert("Connect a repository first");
                }
              },
            },
            {
              icon: "construction",
              label: "Technical Debt",
              href: "#",
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                if (recentRepos.length > 0) {
                  router.push(
                    `/dashboard/repositories/${recentRepos[0].id}/technical-dept`,
                  );
                } else {
                  alert("Connect a repository first");
                }
              },
            },
            {
              icon: "settings",
              label: "Settings",
              href: "#",
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                if (recentRepos.length > 0) {
                  router.push(
                    `/dashboard/repositories/${recentRepos[0].id}/setting`,
                  );
                } else {
                  alert("Connect a repository first");
                }
              },
            },
          ].map((item) => {
            const isActive =
              pathname === item.href ||
              (item.label === "AI Chat" && pathname.includes("/chat")) ||
              (item.label === "Code Review" && pathname.includes("/code-review")) ||
              (item.label === "Documentation" && pathname.includes("/Documention")) ||
              (item.label === "Technical Debt" && pathname.includes("/technical-dept")) ||
              (item.label === "Knowledge Graph" && pathname.includes("/knowledge-graph")) ||
              (item.label === "Settings" && pathname.includes("/setting"));

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={item.onClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                  isActive
                    ? "bg-primary-container/20 text-primary font-semibold border-r-2 border-primary"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Profile */}
        <div className="p-4 border-t border-white/10">
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <img
              src={user.image ?? "/default-avatar.png"}
              alt={user.name ?? "Profile"}
              className="w-8 h-8 rounded-full object-cover border border-white/20"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-on-surface-variant truncate">
                {user.email}
              </p>
            </div>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              logout
            </span>
          </div>
        </div>
      </nav>

      {/* Topbar */}
      <header className="fixed top-0 right-0 md:w-[calc(100%-16rem)] w-full z-40 bg-surface/40 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-4 md:px-8 h-16">
        <div className="flex-1 flex items-center">
          <div className="relative w-full max-w-md hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              className="w-full bg-surface-container-high/50 border border-outline-variant/50 rounded-lg py-1.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-all"
              placeholder="Search repositories, code, or settings..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setModalOpen(true)}
            className="hidden md:flex px-4 py-1.5 rounded-lg border border-primary/30 text-primary text-sm hover:bg-primary/10 transition-colors cursor-pointer"
          >
            Connect Repo
          </button>
          {/* Quick Theme Switcher */}
          <button
            onClick={cycleTheme}
            title={`Current Theme: ${
              currentTheme === "cyber-blue"
                ? "Cyber Neon"
                : currentTheme === "deep-violet"
                ? "Midnight Violet"
                : "Dark Obsidian"
            } (Click to switch)`}
            aria-label="Toggle visual theme"
            className="text-on-surface-variant hover:text-primary transition-all p-2 rounded-xl hover:bg-white/5 relative cursor-pointer flex items-center justify-center group"
          >
            <span className="material-symbols-outlined text-[22px] group-hover:rotate-45 transition-transform duration-300">
              {currentTheme === "cyber-blue"
                ? "palette"
                : currentTheme === "deep-violet"
                ? "auto_awesome"
                : "dark_mode"}
            </span>
            <span
              className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border border-black/40"
              style={{
                background:
                  currentTheme === "cyber-blue"
                    ? "#38bdf8"
                    : currentTheme === "deep-violet"
                    ? "#c084fc"
                    : "#c3c0ff",
              }}
            />
          </button>

          {/* Notification Bell & Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              onMouseEnter={() => setNotifOpen(true)}
              aria-label="View notifications"
              className="text-on-surface-variant hover:text-primary transition-all p-2 rounded-xl hover:bg-white/5 relative cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[24px]">
                notifications
              </span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white flex items-center justify-center shadow-lg border border-black/50">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Floating Notification Window */}
            {notifOpen && (
              <div
                onMouseLeave={() => setNotifOpen(false)}
                className="absolute right-0 top-12 w-84 sm:w-96 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                style={{
                  background: "rgba(13, 19, 36, 0.95)",
                  boxShadow: "0 25px 60px -15px rgba(0,0,0,0.8), 0 0 1px 1px rgba(255,255,255,0.08)",
                }}
              >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-400 text-[20px]">
                      notifications_active
                    </span>
                    <h4 className="text-sm font-semibold text-white font-sans">
                      Notifications
                    </h4>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-medium text-slate-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">done_all</span>
                      Mark read
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="px-4 py-2 border-b border-white/5 flex items-center gap-1.5 bg-black/20">
                  {[
                    { id: "all", label: "All" },
                    { id: "unread", label: `Unread (${unreadCount})` },
                    { id: "security", label: "Security" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setNotifFilter(f.id as any)}
                      className={`cursor-pointer px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        notifFilter === f.id
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                  {notifications
                    .filter((n) => {
                      if (notifFilter === "unread") return n.unread;
                      if (notifFilter === "security") return n.type === "security";
                      return true;
                    })
                    .map((item) => (
                      <Link
                        key={item.id}
                        href={item.link || "/dashboard"}
                        onClick={() => setNotifOpen(false)}
                        className={`block p-3.5 hover:bg-white/5 transition-all text-left group ${
                          item.unread ? "bg-indigo-950/20" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                            style={{
                              background: `${item.color || "#4f46e5"}15`,
                              border: `1px solid ${item.color || "#4f46e5"}30`,
                            }}
                          >
                            <span
                              className="material-symbols-outlined text-[18px]"
                              style={{ color: item.color || "#4f46e5" }}
                            >
                              {item.icon || "notifications"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                                {item.title}
                              </p>
                              <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                {formatRelativeTime(item.timestamp)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                              {item.message}
                            </p>
                          </div>
                          {item.unread && (
                            <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-500 shrink-0 mt-2" />
                          )}
                        </div>
                      </Link>
                    ))}

                  {notifications.filter((n) => {
                    if (notifFilter === "unread") return n.unread;
                    if (notifFilter === "security") return n.type === "security";
                    return true;
                  }).length === 0 && (
                    <div className="p-8 text-center">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined text-[22px]">
                          notifications_off
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-400">
                        No notifications in this filter
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1">
                        All workspace activities and PR alerts are up to date.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/10 bg-black/40 text-center">
                  <span className="text-[11px] text-slate-400">
                    Manage alert channels in{" "}
                    <span className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer">
                      Settings &gt; Notifications
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>


      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 pt-16 h-screen overflow-y-auto">
        {children}
      </div>

      <ConnectRepoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConnected={() => router.refresh()}
      />
    </div>
  );
}
