"use client";

import { useState } from "react";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  status: "active" | "read-only";
  created: string;
  lastUsed: string;
}

interface ConnectedRepo {
  id: string;
  name: string;
  branch: string;
  status: "synced" | "syncing" | "error";
  autoSync: boolean;
}

interface Props {
  user: { name: string; email: string; image: string | null };
  repos: ConnectedRepo[];
  usage: { repos: number; messages: number; reviews: number; docs: number };
  settings: {
    llmProvider: string;
    llmApiKey: string | null;
    embedModel: string;
  } | null;
}

type SettingsTab =
  | "profile"
  | "team"
  | "integrations"
  | "api-keys"
  | "llm"
  | "models"
  | "notifications"
  | "billing";

const tabs: { id: SettingsTab; label: string; icon: string }[] = [
  { id: "profile", label: "Profile", icon: "person" },
  { id: "team", label: "Team", icon: "group" },
  {
    id: "integrations",
    label: "Integrations",
    icon: "integration_instructions",
  },
  { id: "api-keys", label: "API Keys", icon: "api" },
  { id: "llm", label: "LLM Providers", icon: "memory" },
  { id: "models", label: "Models", icon: "layers" },
  { id: "notifications", label: "Notifications", icon: "notifications" },
  { id: "billing", label: "Billing", icon: "receipt_long" },
];

export default function SettingClient({ user, repos, usage, settings }: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("api-keys");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [repoSync, setRepoSync] = useState<Record<string, boolean>>(
    Object.fromEntries(repos.map((r) => [r.id, r.autoSync])),
  );

  const [mockApiKeys] = useState<ApiKey[]>([
    {
      id: "1",
      name: "Production CI/CD",
      key: "cc_live_8f92a4b...x9q2",
      status: "active",
      created: "Oct 12, 2023",
      lastUsed: "2 hours ago",
    },
    {
      id: "2",
      name: "Local Development",
      key: "cc_test_1b3c9d...p4l8",
      status: "read-only",
      created: "Nov 05, 2023",
      lastUsed: "5 days ago",
    },
  ]);

  function copyKey(key: string, id: string) {
    navigator.clipboard.writeText(key);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  const [activeProvider, setActiveProvider] = useState(
    settings?.llmProvider ?? "groq",
  );
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function switchProvider(provider: string) {
    setSaving(provider);
    await fetch("/api/settings/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey: apiKeys[provider] ?? "" }),
    });
    setActiveProvider(provider);
    setSaving(null);
  }

  const [activeModel, setActiveModel] = useState(
    settings?.embedModel ?? "nomic",
  );

  async function switchModel(model: string) {
    await fetch("/api/settings/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embedModel: model }),
    });
    setActiveModel(model);
  }

  return (
    <div className="flex-1 overflow-y-auto pt-8 pb-12 px-6 md:px-12 max-w-350 mx-auto w-full flex flex-col md:flex-row gap-8">
      {/* Settings Sidebar */}
      <aside className="w-full md:w-56 shrink-0">
        <h2
          style={{
            fontFamily: "Geist, sans-serif",
            fontSize: 32,
            fontWeight: 600,
            color: "#dae2fd",
            letterSpacing: "-0.01em",
            marginBottom: 24,
          }}
        >
          Settings
        </h2>
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="cursor-pointer flex items-center gap-3 px-4 py-2.5 rounded-lg text-left whitespace-nowrap transition-colors"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                ...(activeTab === tab.id
                  ? {
                      color: "#c3c0ff",
                      background: "rgba(195,192,255,0.1)",
                      border: "1px solid rgba(195,192,255,0.2)",
                    }
                  : {
                      color: "#c7c4d8",
                      background: "transparent",
                      border: "1px solid transparent",
                    }),
              }}
            >
              <span className="material-symbols-outlined text-[18px]">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </aside>

      {/* Settings Content */}
      <div className="flex-1 space-y-8">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <section
            className="rounded-xl p-8"
            style={{
              backdropFilter: "blur(12px)",
              background: "rgba(19,27,46,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h3
              className="mb-2"
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 24,
                fontWeight: 600,
                color: "#dae2fd",
              }}
            >
              Profile
            </h3>
            <p
              className="mb-6"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "#918fa1",
              }}
            >
              Manage your personal information.
            </p>
            <div className="flex items-center gap-6 mb-8">
              <div
                className="w-16 h-16 rounded-full overflow-hidden shrink-0"
                style={{ border: "2px solid rgba(255,255,255,0.1)" }}
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: "rgba(79,70,229,0.2)" }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 28, color: "#c3c0ff" }}
                    >
                      person
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "Geist, sans-serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#dae2fd",
                  }}
                >
                  {user.name}
                </p>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    color: "#918fa1",
                  }}
                >
                  {user.email}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  className="block mb-1"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#918fa1",
                    letterSpacing: "0.05em",
                  }}
                >
                  Display Name
                </label>
                <input
                  type="text"
                  defaultValue={user.name}
                  className="w-full rounded-lg px-4 py-2.5 transition-all focus:outline-none"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    color: "#dae2fd",
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid #464555",
                  }}
                />
              </div>
              <div>
                <label
                  className="block mb-1"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#918fa1",
                    letterSpacing: "0.05em",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={user.email}
                  disabled
                  className="w-full rounded-lg px-4 py-2.5 opacity-60"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    color: "#dae2fd",
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid #464555",
                  }}
                />
              </div>
            </div>
          </section>
        )}

        {/* API Keys Tab */}
        {activeTab === "api-keys" && (
          <section
            className="rounded-xl p-8"
            style={{
              backdropFilter: "blur(12px)",
              background: "rgba(19,27,46,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h3
                  className="mb-2"
                  style={{
                    fontFamily: "Geist, sans-serif",
                    fontSize: 24,
                    fontWeight: 600,
                    color: "#dae2fd",
                  }}
                >
                  API Keys
                </h3>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    color: "#918fa1",
                  }}
                >
                  Manage your secret keys for external integrations. Do not
                  share these keys.
                </p>
              </div>
              <button
                className="cursor-pointer px-4 py-2 rounded flex items-center gap-2 hover:brightness-110 transition-all"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  background: "#4f46e5",
                  color: "#dad7ff",
                  borderTop: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <span className="material-symbols-outlined text-[16px]">
                  add
                </span>
                Generate Key
              </button>
            </div>
            <div className="space-y-4">
              {mockApiKeys.map((ak) => (
                <div
                  key={ak.id}
                  className="rounded-lg p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                  style={{
                    background: "rgba(19,27,46,0.6)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#dae2fd",
                        }}
                      >
                        {ak.name}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded"
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: 10,
                          ...(ak.status === "active"
                            ? {
                                background: "rgba(195,192,255,0.1)",
                                color: "#c3c0ff",
                                border: "1px solid rgba(195,192,255,0.2)",
                              }
                            : {
                                background: "rgba(45,52,73,0.6)",
                                color: "#c7c4d8",
                                border: "1px solid rgba(255,255,255,0.1)",
                              }),
                        }}
                      >
                        {ak.status === "active" ? "Active" : "Read Only"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <code
                        className="px-2 py-1 rounded cursor-pointer transition-all"
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: 14,
                          color: "#c7c4d8",
                          background: "rgba(11,19,38,0.8)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          filter: "blur(4px)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.filter = "blur(0px)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.filter = "blur(4px)")
                        }
                      >
                        {ak.key}
                      </code>
                      <button
                        onClick={() => copyKey(ak.key, ak.id)}
                        className="p-1 transition-colors"
                        style={{
                          color: copiedKey === ak.id ? "#4cd7f6" : "#c7c4d8",
                        }}
                        title="Copy"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {copiedKey === ak.id ? "check" : "content_copy"}
                        </span>
                      </button>
                    </div>
                    <p
                      className="mt-2 opacity-60"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#918fa1",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Created: {ak.created} • Last used: {ak.lastUsed}
                    </p>
                  </div>
                  <button
                    className="cursor-pointer px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      color: "#ffb4ab",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      delete
                    </span>
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Connected Repositories - always visible */}
        <section
          className="rounded-xl p-8"
          style={{
            backdropFilter: "blur(12px)",
            background: "rgba(19,27,46,0.4)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div className="mb-6">
            <h3
              className="mb-2"
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 24,
                fontWeight: 600,
                color: "#dae2fd",
              }}
            >
              Connected Repositories
            </h3>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "#918fa1",
              }}
            >
              Manage the repositories ContextCrafter has access to for analysis.
            </p>
          </div>
          <div
            className="rounded-lg overflow-hidden"
            style={{
              background: "rgba(19,27,46,0.6)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {/* Table Header */}
            <div
              className="grid grid-cols-12 gap-4 p-4"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(34,42,61,0.5)",
              }}
            >
              <div
                className="col-span-5"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#918fa1",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase" as const,
                }}
              >
                Repository
              </div>
              <div
                className="col-span-3 hidden md:block"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#918fa1",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase" as const,
                }}
              >
                Branch
              </div>
              <div
                className="col-span-2 hidden sm:block"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#918fa1",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase" as const,
                }}
              >
                Status
              </div>
              <div
                className="col-span-2 text-right"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#918fa1",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase" as const,
                }}
              >
                Auto-Sync
              </div>
            </div>

            {/* Repo Rows */}
            <div>
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="grid grid-cols-12 gap-4 p-4 items-center transition-colors hover:bg-white/3"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                  }}
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                      folder
                    </span>
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#dae2fd",
                      }}
                    >
                      {repo.name}
                    </p>
                  </div>
                  <div className="col-span-3 hidden md:flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                      call_split
                    </span>
                    <code
                      className="px-2 py-0.5 rounded"
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 12,
                        background: "rgba(11,19,38,0.8)",
                        color: "#c7c4d8",
                      }}
                    >
                      {repo.branch}
                    </code>
                  </div>
                  <div className="col-span-2 hidden sm:flex items-center gap-2">
                    {repo.status === "synced" ? (
                      <>
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: "#c3c0ff",
                            boxShadow: "0 0 8px rgba(195,192,255,0.6)",
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#dae2fd",
                          }}
                        >
                          Synced
                        </span>
                      </>
                    ) : repo.status === "syncing" ? (
                      <>
                        <span className="material-symbols-outlined text-[14px] text-tertiary animate-spin">
                          sync
                        </span>
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#4cd7f6",
                          }}
                        >
                          Syncing
                        </span>
                      </>
                    ) : (
                      <>
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: "#ffb4ab" }}
                        />
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#ffb4ab",
                          }}
                        >
                          Error
                        </span>
                      </>
                    )}
                  </div>
                  <div className="col-span-2 flex justify-end items-center gap-2">
                    <div
                      className="relative w-10 h-6 rounded-full cursor-pointer transition-colors"
                      style={{
                        background: repoSync[repo.id]
                          ? "#4f46e5"
                          : "rgba(34,42,61,0.8)",
                        border: repoSync[repo.id]
                          ? "1px solid #4f46e5"
                          : "1px solid rgba(255,255,255,0.1)",
                      }}
                      onClick={() =>
                        setRepoSync((prev) => ({
                          ...prev,
                          [repo.id]: !prev[repo.id],
                        }))
                      }
                    >
                      <span
                        className="absolute top-0.75 w-4.5 h-4.5 rounded-full bg-white transition-transform"
                        style={{
                          left: 3,
                          transform: repoSync[repo.id]
                            ? "translateX(16px)"
                            : "translateX(0)",
                        }}
                      />
                    </div>
                    <button
                      onClick={async () => {
                        await fetch(`/api/repos/${repo.id}`, {
                          method: "DELETE",
                        });
                        window.location.reload();
                      }}
                      className="p-1.5 rounded transition-colors hover:bg-white/5"
                      style={{ color: "#ffb4ab" }}
                      title="Disconnect"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        link_off
                      </span>
                    </button>
                  </div>
                </div>
              ))}

              {repos.length === 0 && (
                <div className="p-8 text-center">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 32, color: "rgba(145,143,161,0.4)" }}
                  >
                    folder_off
                  </span>
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      color: "#918fa1",
                    }}
                  >
                    No repositories connected yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <section
            className="rounded-xl p-8"
            style={{
              backdropFilter: "blur(12px)",
              background: "rgba(19,27,46,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h3
              className="mb-2"
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 24,
                fontWeight: 600,
                color: "#dae2fd",
              }}
            >
              Notifications
            </h3>
            <p
              className="mb-6"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "#918fa1",
              }}
            >
              Configure how and when you receive notifications.
            </p>
            <div className="space-y-4">
              {[
                {
                  label: "Code Review Alerts",
                  desc: "Get notified when AI reviews are complete",
                  defaultOn: true,
                },
                {
                  label: "Security Warnings",
                  desc: "Immediate alerts for critical vulnerabilities",
                  defaultOn: true,
                },
                {
                  label: "Sync Status Updates",
                  desc: "Notifications when repository sync completes",
                  defaultOn: false,
                },
                {
                  label: "Weekly Digest",
                  desc: "Summary of technical debt and code health",
                  defaultOn: true,
                },
              ].map((item) => (
                <NotificationToggle key={item.label} {...item} />
              ))}
            </div>
          </section>
        )}

        {/* Placeholder tabs */}
        {/* Team Tab */}
        {activeTab === "team" && (
          <section
            className="rounded-xl p-8"
            style={{
              backdropFilter: "blur(12px)",
              background: "rgba(19,27,46,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3
                  className="mb-2"
                  style={{
                    fontFamily: "Geist, sans-serif",
                    fontSize: 24,
                    fontWeight: 600,
                    color: "#dae2fd",
                  }}
                >
                  Team Members
                </h3>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    color: "#918fa1",
                  }}
                >
                  Invite teammates to collaborate on your repositories.
                </p>
              </div>
              <button
                className="cursor-pointer px-4 py-2 rounded flex items-center gap-2 hover:brightness-110 transition-all"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  background: "#4f46e5",
                  color: "#dad7ff",
                  borderTop: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <span className="material-symbols-outlined text-[16px]">
                  person_add
                </span>
                Invite Member
              </button>
            </div>

            {/* Invite Input */}
            <div className="flex gap-3 mb-8">
              <input
                type="email"
                placeholder="colleague@company.com"
                className="flex-1 rounded-lg px-4 py-2.5 focus:outline-none transition-all"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  color: "#dae2fd",
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid #464555",
                }}
              />
              <select
                className="rounded-lg px-3 py-2.5 focus:outline-none"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  color: "#dae2fd",
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid #464555",
                }}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <button
                className="cursor-pointer px-4 py-2 rounded transition-all hover:brightness-110"
                style={{
                  background: "#4f46e5",
                  color: "#dad7ff",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Send Invite
              </button>
            </div>

            {/* Current Members */}
            <div className="space-y-3">
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#918fa1",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Current Members
              </p>
              {[
                {
                  name: user.name,
                  email: user.email,
                  image: user.image,
                  role: "Owner",
                  you: true,
                },
              ].map((member) => (
                <div
                  key={member.email}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{
                    background: "rgba(19,27,46,0.6)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-9 h-9 rounded-full object-cover"
                        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(79,70,229,0.2)" }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 18, color: "#c3c0ff" }}
                        >
                          person
                        </span>
                      </div>
                    )}
                    <div>
                      <p
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#dae2fd",
                        }}
                      >
                        {member.name}{" "}
                        {member.you && (
                          <span style={{ fontSize: 11, color: "#918fa1" }}>
                            (you)
                          </span>
                        )}
                      </p>
                      <p
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: 12,
                          color: "#918fa1",
                        }}
                      >
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      background: "rgba(195,192,255,0.1)",
                      color: "#c3c0ff",
                      border: "1px solid rgba(195,192,255,0.2)",
                    }}
                  >
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Integrations Tab */}
        {activeTab === "integrations" && (
          <section
            className="rounded-xl p-8"
            style={{
              backdropFilter: "blur(12px)",
              background: "rgba(19,27,46,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h3
              className="mb-2"
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 24,
                fontWeight: 600,
                color: "#dae2fd",
              }}
            >
              Integrations
            </h3>
            <p
              className="mb-8"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "#918fa1",
              }}
            >
              Connect ContextCrafter with your existing tools and workflows.
            </p>

            <div className="space-y-4">
              {[
                {
                  name: "GitHub",
                  icon: "code",
                  desc: "Connected — full repo access",
                  connected: true,
                  color: "#c3c0ff",
                },
                {
                  name: "GitLab",
                  icon: "account_tree",
                  desc: "Connect your GitLab repositories",
                  connected: false,
                  color: "#ddb7ff",
                },
                {
                  name: "Bitbucket",
                  icon: "folder",
                  desc: "Connect your Bitbucket workspace",
                  connected: false,
                  color: "#4cd7f6",
                },
                {
                  name: "Slack",
                  icon: "forum",
                  desc: "Get AI insights directly in Slack",
                  connected: false,
                  color: "#93e8ff",
                },
                {
                  name: "Jira",
                  icon: "task",
                  desc: "Link debt clusters to Jira tickets",
                  connected: false,
                  color: "#ddb7ff",
                },
                {
                  name: "VS Code",
                  icon: "code",
                  desc: "Install the ContextCrafter extension",
                  connected: false,
                  color: "#4cd7f6",
                },
              ].map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-center justify-between p-5 rounded-lg"
                  style={{
                    background: "rgba(19,27,46,0.6)",
                    border: `1px solid ${integration.connected ? "rgba(195,192,255,0.15)" : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: `${integration.color}15`,
                        border: `1px solid ${integration.color}30`,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 20, color: integration.color }}
                      >
                        {integration.icon}
                      </span>
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#dae2fd",
                        }}
                      >
                        {integration.name}
                      </p>
                      <p
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: 12,
                          color: integration.connected ? "#4cd7f6" : "#918fa1",
                        }}
                      >
                        {integration.desc}
                      </p>
                    </div>
                  </div>
                  <button
                    className="cursor-pointer px-4 py-1.5 rounded transition-all hover:brightness-110"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      background: integration.connected
                        ? "rgba(255,255,255,0.05)"
                        : "#4f46e5",
                      color: integration.connected ? "#918fa1" : "#dad7ff",
                      border: integration.connected
                        ? "1px solid rgba(255,255,255,0.1)"
                        : "none",
                    }}
                  >
                    {integration.connected ? "Disconnect" : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LLM Providers Tab */}
        {activeTab === "llm" && (
          <section
            className="rounded-xl p-8"
            style={{
              backdropFilter: "blur(12px)",
              background: "rgba(19,27,46,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h3
              className="mb-2"
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 24,
                fontWeight: 600,
                color: "#dae2fd",
              }}
            >
              LLM Providers
            </h3>
            <p
              className="mb-8"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "#918fa1",
              }}
            >
              Configure which AI model powers ContextCrafter's analysis.
            </p>

            <div className="space-y-4">
              {[
                {
                  id: "groq",
                  name: "Groq",
                  model: "Llama 3.3 70B",
                  desc: "Ultra-fast inference",
                  color: "#4cd7f6",
                  icon: "bolt",
                },
                {
                  id: "openai",
                  name: "OpenAI",
                  model: "GPT-4o",
                  desc: "Best accuracy for complex analysis",
                  color: "#c3c0ff",
                  icon: "smart_toy",
                },
                {
                  id: "anthropic",
                  name: "Anthropic",
                  model: "Claude 3.5 Sonnet",
                  desc: "Excellent for code understanding",
                  color: "#ddb7ff",
                  icon: "psychology",
                },
                {
                  id: "ollama",
                  name: "Ollama (Local)",
                  model: "Qwen2.5-Coder",
                  desc: "Run locally — complete privacy",
                  color: "#93e8ff",
                  icon: "computer",
                },
              ].map((provider) => {
                const isActive = activeProvider === provider.id;
                return (
                  <div
                    key={provider.name}
                    className="p-5 rounded-lg transition-all"
                    style={{
                      background: isActive
                        ? `${provider.color}08`
                        : "rgba(19,27,46,0.6)",
                      border: isActive
                        ? `1px solid ${provider.color}30`
                        : "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            background: `${provider.color}15`,
                            border: `1px solid ${provider.color}25`,
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 20, color: provider.color }}
                          >
                            {provider.icon}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p
                              style={{
                                fontFamily: "Geist, sans-serif",
                                fontSize: 15,
                                fontWeight: 600,
                                color: "#dae2fd",
                              }}
                            >
                              {provider.name}
                            </p>
                            {isActive && (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                  background: `${provider.color}20`,
                                  color: provider.color,
                                  border: `1px solid ${provider.color}30`,
                                }}
                              >
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: 13,
                              color: "#918fa1",
                            }}
                          >
                            {provider.desc}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => !isActive && switchProvider(provider.id)}
                        disabled={isActive || saving === provider.id}
                        className="px-4 py-1.5 rounded transition-all hover:brightness-110 disabled:opacity-60"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: 12,
                          fontWeight: 600,
                          background: isActive
                            ? "rgba(255,255,255,0.05)"
                            : "#4f46e5",
                          color: isActive ? "#918fa1" : "#dad7ff",
                          border: isActive
                            ? "1px solid rgba(255,255,255,0.1)"
                            : "none",
                        }}
                      >
                        {saving === provider.id
                          ? "Switching..."
                          : isActive
                            ? "Active"
                            : "Switch"}
                      </button>
                    </div>
                    {/* API Key input */}
                    {!isActive && (
                      <div className="flex gap-2 mt-3">
                        <input
                          type="password"
                          placeholder={`${provider.name} API Key`}
                          value={apiKeys[provider.id] ?? ""}
                          onChange={(e) =>
                            setApiKeys((prev) => ({
                              ...prev,
                              [provider.id]: e.target.value,
                            }))
                          }
                          className="flex-1 rounded px-3 py-2 text-sm focus:outline-none"
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 12,
                            color: "#dae2fd",
                            background: "rgba(0,0,0,0.3)",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        />
                        <button
                          onClick={() => switchProvider(provider.id)}
                          disabled={saving === provider.id}
                          className="px-3 py-2 rounded text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-60"
                          style={{
                            background: "#4f46e5",
                            color: "#dad7ff",
                            fontFamily: "Inter, sans-serif",
                            fontSize: 12,
                          }}
                        >
                          {saving === provider.id ? "Saving..." : "Save"}
                        </button>
                      </div>
                    )}
                    {/* Model selector */}
                    <div className="flex items-center gap-2 mt-3">
                      <span
                        className="material-symbols-outlined text-[14px]"
                        style={{ color: "#918fa1" }}
                      >
                        layers
                      </span>
                      <span
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: 12,
                          color: isActive ? provider.color : "#918fa1",
                        }}
                      >
                        {provider.model}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Models Tab */}
        {activeTab === "models" && (
          <section
            className="rounded-xl p-8"
            style={{
              backdropFilter: "blur(12px)",
              background: "rgba(19,27,46,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h3
              className="mb-2"
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 24,
                fontWeight: 600,
                color: "#dae2fd",
              }}
            >
              Embedding Models
            </h3>
            <p
              className="mb-8"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "#918fa1",
              }}
            >
              Choose the embedding model used for semantic code search and RAG
              pipeline.
            </p>

            <div className="space-y-4">
              {[
                {
                  id: "nomic",
                  name: "Nomic Embed Text",
                  provider: "Nomic AI",
                  dims: 768,
                  speed: "Fast",
                  quality: "Good",
                  color: "#4cd7f6",
                },
                {
                  id: "text-embedding-3-small",
                  name: "text-embedding-3-small",
                  provider: "OpenAI",
                  dims: 1536,
                  speed: "Medium",
                  quality: "Excellent",
                  color: "#c3c0ff",
                },
                {
                  id: "text-embedding-3-large",
                  name: "text-embedding-3-large",
                  provider: "OpenAI",
                  dims: 3072,
                  speed: "Slow",
                  quality: "Best",
                  color: "#ddb7ff",
                },
                {
                  id: "voyage-code-2",
                  name: "Voyage Code 2",
                  provider: "Voyage AI",
                  dims: 1536,
                  speed: "Medium",
                  quality: "Best for Code",
                  color: "#93e8ff",
                },
              ].map((model) => {
                const isActive = activeModel === model.id;
                return (
                  <div
                    key={model.name}
                    className="p-5 rounded-lg flex items-center justify-between"
                    style={{
                      background: isActive
                        ? `${model.color}08`
                        : "rgba(19,27,46,0.6)",
                      border: isActive
                        ? `1px solid ${model.color}30`
                        : "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                          background: `${model.color}15`,
                          border: `1px solid ${model.color}25`,
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 20, color: model.color }}
                        >
                          layers
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p
                            style={{
                              fontFamily: "Geist, sans-serif",
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#dae2fd",
                            }}
                          >
                            {model.name}
                          </p>
                          {isActive && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{
                                background: `${model.color}20`,
                                color: model.color,
                                border: `1px solid ${model.color}30`,
                              }}
                            >
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: 12,
                            color: "#918fa1",
                          }}
                        >
                          {model.provider}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          {[
                            { label: "Dims", value: model.dims },
                            { label: "Speed", value: model.speed },
                            { label: "Quality", value: model.quality },
                          ].map((stat) => (
                            <span
                              key={stat.label}
                              style={{
                                fontFamily: "JetBrains Mono, monospace",
                                fontSize: 11,
                                color: "#918fa1",
                              }}
                            >
                              {stat.label}:{" "}
                              <span
                                style={{
                                  color: isActive ? model.color : "#dae2fd",
                                }}
                              >
                                {stat.value}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => !isActive && switchModel(model.id)}
                      disabled={isActive}
                      className="px-4 py-1.5 rounded transition-all hover:brightness-110 disabled:opacity-60"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        background: isActive
                          ? "rgba(255,255,255,0.05)"
                          : "#4f46e5",
                        color: isActive ? "#918fa1" : "#dad7ff",
                        border: isActive
                          ? "1px solid rgba(255,255,255,0.1)"
                          : "none",
                      }}
                    >
                      {isActive ? "Active" : "Switch"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <section
            className="rounded-xl p-8"
            style={{
              backdropFilter: "blur(12px)",
              background: "rgba(19,27,46,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h3
              className="mb-2"
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 24,
                fontWeight: 600,
                color: "#dae2fd",
              }}
            >
              Billing
            </h3>
            <p
              className="mb-8"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "#918fa1",
              }}
            >
              Manage your subscription and usage.
            </p>

            {/* Current Plan */}
            <div
              className="p-6 rounded-xl mb-6 relative overflow-hidden"
              style={{
                background: "rgba(79,70,229,0.08)",
                border: "1px solid rgba(79,70,229,0.25)",
              }}
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none"
                style={{
                  background: "rgba(79,70,229,0.15)",
                  transform: "translate(30%, -30%)",
                }}
              />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#918fa1",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Current Plan
                  </p>
                  <p
                    style={{
                      fontFamily: "Geist, sans-serif",
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#dae2fd",
                      marginTop: 4,
                    }}
                  >
                    Hobby
                  </p>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      color: "#918fa1",
                      marginTop: 4,
                    }}
                  >
                    Free forever — up to 3 repositories
                  </p>
                </div>
                <button
                  className="cursor-pointer px-5 py-2.5 rounded-lg transition-all hover:brightness-110"
                  style={{
                    background: "#4f46e5",
                    color: "#dad7ff",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    borderTop: "1px solid rgba(255,255,255,0.2)",
                    boxShadow: "0 0 20px rgba(79,70,229,0.3)",
                  }}
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>

            {/* Usage */}
            <div className="space-y-4 mb-8">
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#918fa1",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Usage This Month
              </p>
              {[
                {
                  label: "Repositories",
                  used: usage.repos,
                  max: 3,
                  color: "#c3c0ff",
                },
                {
                  label: "AI Chat Messages",
                  used: usage.messages,
                  max: 100,
                  color: "#4cd7f6",
                },
                {
                  label: "Code Reviews",
                  used: usage.reviews,
                  max: 10,
                  color: "#ddb7ff",
                },
                {
                  label: "Doc Generations",
                  used: usage.docs,
                  max: 5,
                  color: "#93e8ff",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        color: "#dae2fd",
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 12,
                        color: "#918fa1",
                      }}
                    >
                      {item.used} / {item.max}
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(item.used / item.max) * 100}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  name: "Pro",
                  price: "$29",
                  per: "/user/mo",
                  features: [
                    "Unlimited Repos",
                    "Infinite Context",
                    "Architecture Viz",
                    "Priority Support",
                  ],
                  color: "#c3c0ff",
                  popular: true,
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  per: "",
                  features: [
                    "VPC Deployment",
                    "Custom LLM",
                    "Dedicated Manager",
                    "SSO & Audit",
                  ],
                  color: "#4cd7f6",
                  popular: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className="p-5 rounded-xl"
                  style={{
                    background: plan.popular
                      ? "rgba(195,192,255,0.05)"
                      : "rgba(19,27,46,0.6)",
                    border: plan.popular
                      ? "1px solid rgba(195,192,255,0.2)"
                      : "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="flex items-baseline gap-1 mb-4">
                    <span
                      style={{
                        fontFamily: "Geist, sans-serif",
                        fontSize: 28,
                        fontWeight: 700,
                        color: plan.color,
                      }}
                    >
                      {plan.price}
                    </span>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        color: "#918fa1",
                      }}
                    >
                      {plan.per}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "Geist, sans-serif",
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#dae2fd",
                      marginBottom: 12,
                    }}
                  >
                    {plan.name}
                  </p>
                  <ul className="space-y-2 mb-5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span
                          className="material-symbols-outlined text-[14px]"
                          style={{ color: plan.color }}
                        >
                          check_circle
                        </span>
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: 13,
                            color: "#c7c4d8",
                          }}
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="cursor-pointer w-full py-2.5 rounded-lg transition-all hover:brightness-110"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      background: plan.popular ? "#4f46e5" : "transparent",
                      color: plan.popular ? "#dad7ff" : "#dae2fd",
                      border: plan.popular
                        ? "none"
                        : "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {plan.name === "Enterprise"
                      ? "Contact Sales"
                      : "Upgrade Now"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function NotificationToggle({
  label,
  desc,
  defaultOn,
}: {
  label: string;
  desc: string;
  defaultOn: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultOn);

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg"
      style={{
        background: "rgba(19,27,46,0.6)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: "#dae2fd",
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            color: "#918fa1",
          }}
        >
          {desc}
        </p>
      </div>
      <div
        className="relative w-10 h-6 rounded-full cursor-pointer transition-colors"
        style={{
          background: enabled ? "#4f46e5" : "rgba(34,42,61,0.8)",
          border: enabled
            ? "1px solid #4f46e5"
            : "1px solid rgba(255,255,255,0.1)",
        }}
        onClick={() => setEnabled(!enabled)}
      >
        <span
          className="absolute top-0.75 w-4.5 h-4.5 rounded-full bg-white transition-transform"
          style={{
            left: 3,
            transform: enabled ? "translateX(16px)" : "translateX(0)",
          }}
        />
      </div>
    </div>
  );
}
