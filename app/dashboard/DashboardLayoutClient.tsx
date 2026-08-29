"use client";

import { signOut } from "next-auth/react";
import { useState, useEffect, ReactNode } from "react";
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
  const router = useRouter();
  const pathname = usePathname();

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
          <button className="text-on-surface-variant hover:text-primary transition-colors relative">
            <span className="material-symbols-outlined text-[24px]">
              notifications
            </span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border border-surface" />
          </button>
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
