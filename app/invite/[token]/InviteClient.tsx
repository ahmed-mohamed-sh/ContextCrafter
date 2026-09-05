"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

interface Props {
  token: string;
  invite: {
    id: string;
    email: string;
    role: string;
    status: string;
    inviter: {
      name: string;
      email: string;
      image: string | null;
      reposCount: number;
      sampleRepos: string[];
    };
  };
  currentUser: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export default function InviteClient({ token, invite, currentUser }: Props) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(invite.status === "active");

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to accept invitation");

      setAccepted(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "An error occurred while accepting");
      setAccepting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1326] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div
        className="max-w-lg w-full rounded-3xl p-6 sm:p-10 border border-white/10 relative z-10 shadow-2xl shadow-black/80 space-y-6"
        style={{ background: "rgba(19, 27, 46, 0.75)", backdropFilter: "blur(20px)" }}
      >
        {/* Brand Header */}
        <div className="text-center space-y-2 pb-4 border-b border-white/5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px] text-cyan-400">group_add</span>
            Workspace Invitation
          </div>
          <h1 style={{ fontFamily: "Geist, sans-serif", fontSize: 24, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>
            Join ContextCrafter Workspace
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#918fa1" }}>
            You have been invited to collaborate and access AI architectural intelligence.
          </p>
        </div>

        {/* Inviter Info Card */}
        <div className="p-5 rounded-2xl bg-black/30 border border-white/5 space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 border border-white/10"
              style={{ background: "linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)" }}
            >
              {invite.inviter.image ? (
                <img src={invite.inviter.image} alt={invite.inviter.name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[24px] text-indigo-300">person</span>
              )}
            </div>
            <div>
              <p style={{ fontFamily: "Geist, sans-serif", fontSize: 16, fontWeight: 600, color: "#dae2fd" }}>
                {invite.inviter.name}
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#918fa1" }}>
                {invite.inviter.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold mb-0.5">Assigned Role</span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 font-semibold inline-block">
                {invite.role}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold mb-0.5">Target Email</span>
              <span className="text-slate-200 font-mono truncate block">{invite.email}</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {accepted ? (
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 text-green-400 text-sm font-semibold">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                Invitation Accepted! Redirecting to Dashboard...
              </div>
              <Link
                href="/dashboard"
                className="block w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold text-center transition-all shadow-lg"
              >
                Go to Workspace
              </Link>
            </div>
          ) : currentUser ? (
            <div className="space-y-3">
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="cursor-pointer w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:brightness-110 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${accepting ? "animate-spin" : ""}`}>
                  {accepting ? "sync" : "how_to_reg"}
                </span>
                {accepting ? "Joining Workspace..." : `Accept & Join as ${currentUser.name || currentUser.email}`}
              </button>

              <Link
                href="/dashboard"
                className="block text-center text-xs text-slate-400 hover:text-white py-1 transition-colors"
              >
                Decline and return
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => signIn("github", { callbackUrl: window.location.href })}
                className="cursor-pointer w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:brightness-110 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">login</span>
                Sign In with GitHub to Accept
              </button>
              <p className="text-[11px] text-center text-slate-500">
                You must sign in with your GitHub account to link your workspace membership.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
