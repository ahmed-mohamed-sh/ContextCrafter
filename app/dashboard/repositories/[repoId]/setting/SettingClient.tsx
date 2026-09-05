"use client";

import { useState, useEffect } from "react";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  status: "active" | "read-only" | "expired";
  created: string;
  lastUsed: string;
  expires: string;
}

interface ConnectedRepo {
  id: string;
  name: string;
  branch: string;
  status: "synced" | "syncing" | "error";
  autoSync: boolean;
  excludedPaths?: string[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "Owner" | "Admin" | "Developer" | "Viewer";
  status: "active" | "invited";
  isCurrent?: boolean;
}

interface UserSettingsData {
  llmProvider?: string;
  llmApiKey?: string | null;
  embedModel?: string;
  temperature?: number;
  maxTokens?: number;
  customBaseUrl?: string | null;
  chunkSize?: number;
  chunkOverlap?: number;
  topK?: number;
  hybridWeight?: number;
  themeMode?: string;
  syntaxTheme?: string;
  notifyCodeReview?: boolean;
  notifySecurity?: boolean;
  notifySync?: boolean;
  notifyDebtSpike?: boolean;
  notifyWeekly?: boolean;
  alertEmail?: string | null;
  slackWebhookUrl?: string | null;
  discordWebhookUrl?: string | null;
  integrations?: any;
}

interface Props {
  user: { name: string; email: string; image: string | null };
  repos: ConnectedRepo[];
  usage: { repos: number; messages: number; reviews: number; docs: number };
  settings: UserSettingsData | null;
  initialApiKeys?: ApiKey[];
  initialTeamMembers?: TeamMember[];
}

type SettingsTab =
  | "profile"
  | "repositories"
  | "team"
  | "integrations"
  | "api-keys"
  | "llm"
  | "models"
  | "notifications"
  | "billing";

const tabs: { id: SettingsTab; label: string; icon: string; badge?: string }[] = [
  { id: "profile", label: "Profile & Account", icon: "person" },
  { id: "repositories", label: "Connected Repos", icon: "folder_managed" },
  { id: "team", label: "Team & Access", icon: "group" },
  { id: "integrations", label: "Integrations", icon: "integration_instructions" },
  { id: "api-keys", label: "API Keys", icon: "key" },
  { id: "llm", label: "LLM Providers", icon: "memory", badge: "AI" },
  { id: "models", label: "Embeddings & RAG", icon: "layers" },
  { id: "notifications", label: "Notifications", icon: "notifications" },
  { id: "billing", label: "Billing & Usage", icon: "receipt_long" },
];

export default function SettingClient({
  user,
  repos: initialRepos,
  usage,
  settings,
  initialApiKeys = [],
  initialTeamMembers = [],
}: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  function showToast(message: string, type: "success" | "error" | "info" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  // --- Profile State ---
  const [profileName, setProfileName] = useState(user.name);
  const [profileBio, setProfileBio] = useState("Full-stack engineer building AI-driven developer tooling.");
  const [profileRole, setProfileRole] = useState("Lead Developer");
  const [themeMode, setThemeMode] = useState(settings?.themeMode || "dark-obsidian");
  const [syntaxTheme, setSyntaxTheme] = useState(settings?.syntaxTheme || "tokyo-night");
  const [savingProfile, setSavingProfile] = useState(false);

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/setting/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      showToast("Profile changes saved to database!");
    } catch (err: any) {
      showToast(err?.message || "Error updating profile", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  // --- Repositories State ---
  const [reposList, setReposList] = useState<ConnectedRepo[]>(initialRepos);
  const [repoSearch, setRepoSearch] = useState("");
  const [repoSync, setRepoSync] = useState<Record<string, boolean>>(
    Object.fromEntries(initialRepos.map((r) => [r.id, r.autoSync]))
  );
  const [syncingRepoId, setSyncingRepoId] = useState<string | null>(null);
  const [editingRepo, setEditingRepo] = useState<ConnectedRepo | null>(null);
  const [repoBranchInput, setRepoBranchInput] = useState("main");
  const [repoIgnoreInput, setRepoIgnoreInput] = useState("node_modules, .next, dist, coverage, .git");
  const [savingRepoSettings, setSavingRepoSettings] = useState(false);

  async function triggerRepoSync(repoId: string) {
    setSyncingRepoId(repoId);
    setReposList((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, status: "syncing" } : r))
    );
    try {
      // Trigger real index rebuild
      const res = await fetch(`/api/repos/${repoId}/rebuild-index`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to synchronize repository");
      setReposList((prev) =>
        prev.map((r) => (r.id === repoId ? { ...r, status: "synced" } : r))
      );
      showToast("Repository synchronized and vector index refreshed!");
    } catch (err: any) {
      showToast(err?.message || "Failed to sync repository", "error");
      setReposList((prev) =>
        prev.map((r) => (r.id === repoId ? { ...r, status: "error" } : r))
      );
    } finally {
      setSyncingRepoId(null);
    }
  }

  async function handleSaveRepoConfig() {
    if (!editingRepo) return;
    setSavingRepoSettings(true);
    try {
      const excludedArray = repoIgnoreInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/repos/${editingRepo.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch: repoBranchInput,
          autoSync: repoSync[editingRepo.id] ?? true,
          excludedPaths: excludedArray,
        }),
      });

      if (!res.ok) throw new Error("Failed to save repository settings");

      setReposList((prev) =>
        prev.map((r) =>
          r.id === editingRepo.id
            ? {
              ...r,
              branch: repoBranchInput,
              autoSync: repoSync[editingRepo.id] ?? true,
              excludedPaths: excludedArray,
            }
            : r
        )
      );
      setEditingRepo(null);
      showToast("Repository configuration saved to database!");
    } catch (err: any) {
      showToast(err?.message || "Error saving repository settings", "error");
    } finally {
      setSavingRepoSettings(false);
    }
  }

  async function handleDisconnectRepo(repoId: string) {
    if (!confirm("Are you sure you want to disconnect this repository and delete its vector index?")) return;
    try {
      const res = await fetch(`/api/repos/${repoId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect repository");
      setReposList((prev) => prev.filter((r) => r.id !== repoId));
      showToast("Repository disconnected successfully from database");
    } catch (err: any) {
      showToast(err?.message || "Error disconnecting repository", "error");
    }
  }

  // --- Team State ---
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Developer" | "Viewer">("Developer");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes("@")) {
      showToast("Please provide a valid email address", "error");
      return;
    }
    setSendingInvite(true);
    try {
      const res = await fetch("/api/setting/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to create invite");

      setTeamMembers((prev) => [...prev, data.member]);
      if (data.inviteLink) {
        setGeneratedInviteLink(`${window.location.origin}${data.inviteLink}`);
      }
      setInviteEmail("");
      showToast(`Real invitation generated for ${inviteEmail}!`);
    } catch (err: any) {
      showToast(err?.message || "Failed to send invitation", "error");
    } finally {
      setSendingInvite(false);
    }
  }

  async function handleRemoveMember(id: string) {
    if (!confirm("Remove this member from your workspace?")) return;
    try {
      const res = await fetch(`/api/setting/team/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete member");
      setTeamMembers((prev) => prev.filter((m) => m.id !== id));
      showToast("Team member removed from workspace");
    } catch (err: any) {
      showToast(err?.message || "Error removing member", "error");
    }
  }

  async function handleChangeRole(id: string, newRole: "Admin" | "Developer" | "Viewer") {
    try {
      const res = await fetch(`/api/setting/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      setTeamMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, role: newRole } : m))
      );
      showToast("Member role updated in database");
    } catch (err: any) {
      showToast(err?.message || "Error updating role", "error");
    }
  }

  // --- API Keys State ---
  const [apiKeysList, setApiKeysList] = useState<ApiKey[]>(initialApiKeys);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [showKeyGenModal, setShowKeyGenModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRole, setNewKeyRole] = useState<"active" | "read-only">("active");
  const [newKeyExpiry, setNewKeyExpiry] = useState("90 days");
  const [generatedKeyResult, setGeneratedKeyResult] = useState<string | null>(null);
  const [unmaskedKeys, setUnmaskedKeys] = useState<Record<string, boolean>>({});
  const [generatingKey, setGeneratingKey] = useState(false);

  function copyKey(key: string, id: string) {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    showToast("API Key copied to clipboard!");
    setTimeout(() => setCopiedKeyId(null), 2000);
  }

  async function handleGenerateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) {
      showToast("Please provide a name for this key", "error");
      return;
    }
    setGeneratingKey(true);
    try {
      const res = await fetch("/api/setting/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim(),
          status: newKeyRole,
          expires: newKeyExpiry,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to create API key");

      setApiKeysList((prev) => [data.key, ...prev]);
      setGeneratedKeyResult(data.key.key);
      showToast("API Key successfully generated and saved!");
    } catch (err: any) {
      showToast(err?.message || "Error creating API key", "error");
    } finally {
      setGeneratingKey(false);
    }
  }

  async function handleRevokeKey(id: string) {
    if (!confirm("Are you sure you want to revoke this API key? Applications using it will be blocked.")) return;
    try {
      const res = await fetch(`/api/setting/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke API key");
      setApiKeysList((prev) => prev.filter((k) => k.id !== id));
      showToast("API Key revoked and deleted from database");
    } catch (err: any) {
      showToast(err?.message || "Error revoking API key", "error");
    }
  }

  // --- LLM Providers State ---
  const [activeProvider, setActiveProvider] = useState(settings?.llmProvider ?? "groq");
  const [providerApiKeys, setProviderApiKeys] = useState<Record<string, string>>({
    groq: settings?.llmApiKey ?? "",
    openai: "",
    anthropic: "",
    deepseek: "",
    gemini: "",
    ollama: settings?.customBaseUrl || "http://localhost:11434",
  });
  const [showKeyVisibility, setShowKeyVisibility] = useState<Record<string, boolean>>({});
  const [savingLlm, setSavingLlm] = useState(false);
  const [testingLlm, setTestingLlm] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [temperature, setTemperature] = useState(settings?.temperature ?? 0.2);
  const [maxTokens, setMaxTokens] = useState(settings?.maxTokens ?? 4096);
  const [customBaseUrl, setCustomBaseUrl] = useState(settings?.customBaseUrl ?? "");

  async function handleSaveLlm(providerToSave?: string) {
    const p = providerToSave || activeProvider;
    setSavingLlm(true);
    try {
      const res = await fetch("/api/setting/LLM", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: p,
          apiKey: providerApiKeys[p] ?? "",
          temperature,
          maxTokens,
          customBaseUrl: p === "ollama" ? (customBaseUrl || "http://localhost:11434") : customBaseUrl,
        }),
      });
      if (!res.ok) throw new Error("Failed to save LLM settings");
      setActiveProvider(p);
      showToast(`LLM configuration saved in database! Active: ${p.toUpperCase()}`);
    } catch (err: any) {
      showToast(err?.message || "Error saving LLM settings", "error");
    } finally {
      setSavingLlm(false);
    }
  }

  async function handleTestConnection(providerId: string) {
    setTestingLlm(providerId);
    try {
      const res = await fetch("/api/setting/test-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerId,
          apiKey: providerApiKeys[providerId] || undefined,
          baseUrl: providerId === "ollama" ? (customBaseUrl || "http://localhost:11434") : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setTestResult((prev) => ({
          ...prev,
          [providerId]: { ok: false, message: data.error || "Connection failed" },
        }));
        showToast(`Connection failed: ${data.error}`, "error");
      } else {
        setTestResult((prev) => ({
          ...prev,
          [providerId]: { ok: true, message: `Connected (${data.latency}ms)` },
        }));
        showToast(`Connection to ${providerId.toUpperCase()} verified! Latency: ${data.latency}ms`);
      }
    } catch (err: any) {
      setTestResult((prev) => ({
        ...prev,
        [providerId]: { ok: false, message: err?.message || "Connection error" },
      }));
      showToast("Connection test failed", "error");
    } finally {
      setTestingLlm(null);
    }
  }

  // --- Embeddings & RAG State ---
  const [activeModel, setActiveModel] = useState(settings?.embedModel ?? "nomic");
  const [chunkSize, setChunkSize] = useState(settings?.chunkSize ?? 512);
  const [chunkOverlap, setChunkOverlap] = useState(settings?.chunkOverlap ?? 64);
  const [topKRetrieval, setTopKRetrieval] = useState(settings?.topK ?? 8);
  const [hybridSearchWeight, setHybridSearchWeight] = useState(settings?.hybridWeight ?? 0.7);
  const [savingModel, setSavingModel] = useState(false);

  async function handleSaveModel(modelId?: string) {
    const m = modelId || activeModel;
    setSavingModel(true);
    try {
      const res = await fetch("/api/setting/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embedModel: m,
          chunkSize,
          chunkOverlap,
          topK: topKRetrieval,
          hybridWeight: hybridSearchWeight,
        }),
      });
      if (!res.ok) throw new Error("Failed to save embedding model");
      setActiveModel(m);
      showToast(`RAG & Embedding configuration saved to database! Active: ${m}`);
    } catch (err: any) {
      showToast(err?.message || "Error saving model settings", "error");
    } finally {
      setSavingModel(false);
    }
  }

  // --- Integrations State ---
  const [integrationsData, setIntegrationsData] = useState<Record<string, any>>({
    github: { connected: true, username: user.name || "GitHub Account", details: "Connected via OAuth" },
    gitlab: { connected: false, host: "gitlab.com", username: null },
    slack: { connected: Boolean(settings?.slackWebhookUrl), webhookUrl: settings?.slackWebhookUrl || "" },
    discord: { connected: Boolean(settings?.discordWebhookUrl), webhookUrl: settings?.discordWebhookUrl || "" },
    jira: { connected: false, domain: "", email: "" },
    vscode: { connected: false, activeKey: null },
  });

  const [activeConfigModal, setActiveConfigModal] = useState<string | null>(null);
  const [gitlabHost, setGitlabHost] = useState("gitlab.com");
  const [gitlabToken, setGitlabToken] = useState("");
  const [slackWebhookUrl, setSlackWebhookUrl] = useState(settings?.slackWebhookUrl || "");
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(settings?.discordWebhookUrl || "");
  const [jiraDomain, setJiraDomain] = useState("");
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraToken, setJiraToken] = useState("");
  const [testingIntegration, setTestingIntegration] = useState(false);
  const [savingIntegration, setSavingIntegration] = useState(false);

  async function fetchIntegrations() {
    try {
      const res = await fetch("/api/setting/integrations");
      if (res.ok) {
        const data = await res.json();
        if (data.integrations) {
          setIntegrationsData(data.integrations);
          if (data.rawConfig?.gitlab) {
            setGitlabHost(data.rawConfig.gitlab.host || "gitlab.com");
            setGitlabToken(data.rawConfig.gitlab.token || "");
          }
          if (data.rawConfig?.jira) {
            setJiraDomain(data.rawConfig.jira.domain || "");
            setJiraEmail(data.rawConfig.jira.email || "");
            setJiraToken(data.rawConfig.jira.token || "");
          }
          if (data.integrations.slack?.webhookUrl) {
            setSlackWebhookUrl(data.integrations.slack.webhookUrl);
          }
          if (data.integrations.discord?.webhookUrl) {
            setDiscordWebhookUrl(data.integrations.discord.webhookUrl);
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch integrations", e);
    }
  }

  useEffect(() => {
    fetchIntegrations();
  }, []);

  async function handleTestIntegration(provider: string, config: any) {
    setTestingIntegration(true);
    try {
      const res = await fetch("/api/setting/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, config }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Verification failed");
      showToast(data.message || `${provider.toUpperCase()} connection verified!`);
      return true;
    } catch (err: any) {
      showToast(err?.message || "Connection verification failed", "error");
      return false;
    } finally {
      setTestingIntegration(false);
    }
  }

  async function handleSaveIntegration(provider: string, config: any) {
    setSavingIntegration(true);
    try {
      const res = await fetch("/api/setting/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, config }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to save integration");
      showToast(data.message || `${provider.toUpperCase()} integration saved!`);
      await fetchIntegrations();
      setActiveConfigModal(null);
    } catch (err: any) {
      showToast(err?.message || "Error saving integration", "error");
    } finally {
      setSavingIntegration(false);
    }
  }

  async function handleDisconnectIntegration(provider: string) {
    try {
      const res = await fetch(`/api/setting/integrations?provider=${provider}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to disconnect");
      showToast(`${provider.toUpperCase()} disconnected!`);
      await fetchIntegrations();
    } catch (err: any) {
      showToast(err?.message || "Error disconnecting integration", "error");
    }
  }

  // --- Notifications State ---
  const [notifSettings, setNotifSettings] = useState({
    codeReviews: settings?.notifyCodeReview ?? true,
    securityFlaws: settings?.notifySecurity ?? true,
    syncStatus: settings?.notifySync ?? false,
    weeklyDigest: settings?.notifyWeekly ?? true,
    debtSpike: settings?.notifyDebtSpike ?? true,
  });
  const [alertEmail, setAlertEmail] = useState(settings?.alertEmail || user.email);
  const [savingNotifs, setSavingNotifs] = useState(false);

  async function handleSaveNotifications() {
    setSavingNotifs(true);
    try {
      const res = await fetch("/api/setting/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...notifSettings,
          alertEmail,
          slackWebhookUrl,
          discordWebhookUrl,
        }),
      });
      if (!res.ok) throw new Error("Failed to save notifications");
      showToast("Notification preferences updated in database!");
    } catch (err: any) {
      showToast(err?.message || "Error saving notifications", "error");
    } finally {
      setSavingNotifs(false);
    }
  }

  function toggleNotif(key: keyof typeof notifSettings) {
    setNotifSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // --- Billing State ---
  const [billingPlan, setBillingPlan] = useState<"Hobby" | "Pro" | "Team">("Hobby");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Apply theme dynamically to root document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    if (themeMode === "cyber-blue") {
      document.body.style.background = "#060e20";
    } else if (themeMode === "deep-violet") {
      document.body.style.background = "#0d0718";
    } else {
      document.body.style.background = "#0b1326";
    }
    window.dispatchEvent(new Event("theme-change"));
  }, [themeMode]);

  return (
    <div className="flex-1 overflow-y-auto pt-8 pb-16 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl transition-all animate-bounce duration-300"
          style={{
            backdropFilter: "blur(16px)",
            background:
              toast.type === "success"
                ? "rgba(79, 70, 229, 0.95)"
                : toast.type === "error"
                  ? "rgba(220, 38, 38, 0.95)"
                  : "rgba(30, 41, 59, 0.95)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#ffffff",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === "success"
              ? "check_circle"
              : toast.type === "error"
                ? "error"
                : "info"}
          </span>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500 }}>
            {toast.message}
          </p>
        </div>
      )}

      {/* Settings Navigation Sidebar */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-tertiary" style={{ color: "#4cd7f6" }}>
              settings
            </span>
            <h2
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 28,
                fontWeight: 700,
                color: "#dae2fd",
                letterSpacing: "-0.02em",
              }}
            >
              Settings
            </h2>
          </div>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#918fa1" }}>
            Real-time repository context, LLM configuration, credentials, and team access.
          </p>
        </div>

        <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="cursor-pointer flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left whitespace-nowrap transition-all duration-200 group relative"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  ...(isActive
                    ? {
                      color: "#dae2fd",
                      background: "linear-gradient(135deg, rgba(79,70,229,0.25) 0%, rgba(195,192,255,0.08) 100%)",
                      border: "1px solid rgba(195,192,255,0.3)",
                      boxShadow: "0 0 20px rgba(79,70,229,0.2)",
                    }
                    : {
                      color: "#918fa1",
                      background: "transparent",
                      border: "1px solid transparent",
                    }),
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-[18px] transition-transform group-hover:scale-110"
                    style={{ color: isActive ? "#4cd7f6" : "#918fa1" }}
                  >
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{
                      background: "rgba(76,215,246,0.15)",
                      color: "#4cd7f6",
                      border: "1px solid rgba(76,215,246,0.3)",
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Plan Indicator in Sidebar */}
        <div
          className="hidden md:block mt-8 p-4 rounded-xl border border-white/5"
          style={{
            background: "rgba(19,27,46,0.5)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: "#918fa1", textTransform: "uppercase" }}>
              Current Plan
            </span>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold"
              style={{
                background: "rgba(195,192,255,0.15)",
                color: "#c3c0ff",
                border: "1px solid rgba(195,192,255,0.3)",
              }}
            >
              {billingPlan}
            </span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(usage.repos / 3) * 100}%`,
                background: "#4cd7f6",
              }}
            />
          </div>
          <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#918fa1" }}>
            {usage.repos}/3 Repositories Synced
          </p>
        </div>
      </aside>

      {/* Main Settings Content Area */}
      <main className="flex-1 min-w-0 space-y-6">

        {/* ========================================================================= */}
        {/* 1. PROFILE & ACCOUNT TAB */}
        {/* ========================================================================= */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <section
              className="rounded-2xl p-6 sm:p-8"
              style={{
                backdropFilter: "blur(16px)",
                background: "rgba(19,27,46,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                <div>
                  <h3
                    style={{
                      fontFamily: "Geist, sans-serif",
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#dae2fd",
                    }}
                  >
                    Personal Profile
                  </h3>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#918fa1", marginTop: 2 }}>
                    Update your personal information. Changes are saved directly to your PostgreSQL user account.
                  </p>
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="cursor-pointer px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all self-start sm:self-auto disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    color: "#ffffff",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {savingProfile ? "sync" : "save"}
                  </span>
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>

              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 my-6 p-4 rounded-xl bg-black/20 border border-white/5">
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                      border: "2px solid rgba(195,192,255,0.3)",
                    }}
                  >
                    {user.image ? (
                      <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[36px]" style={{ color: "#c3c0ff" }}>
                        person
                      </span>
                    )}
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-green-500 border-2 border-slate-900"
                    title="Active"
                  >
                    <span className="material-symbols-outlined text-[14px] text-white">check</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 style={{ fontFamily: "Geist, sans-serif", fontSize: 17, fontWeight: 600, color: "#dae2fd" }}>
                    {profileName || "User"}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant">mail</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#918fa1" }}>
                      {user.email}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold"
                      style={{ background: "rgba(76,215,246,0.1)", color: "#4cd7f6" }}
                    >
                      GitHub Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label
                    className="block mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      color: "#dae2fd",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div>
                  <label
                    className="block mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Role / Job Title
                  </label>
                  <input
                    type="text"
                    value={profileRole}
                    onChange={(e) => setProfileRole(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      color: "#dae2fd",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    className="block mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Bio & Personal Context
                  </label>
                  <textarea
                    rows={2}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all resize-none"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      color: "#dae2fd",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    placeholder="Brief description used to personalize AI responses..."
                  />
                </div>
              </div>
            </section>

            {/* Developer Appearance & Editor Preferences */}
            <section
              className="rounded-2xl p-6 sm:p-8"
              style={{
                backdropFilter: "blur(16px)",
                background: "rgba(19,27,46,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3
                style={{
                  fontFamily: "Geist, sans-serif",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#dae2fd",
                  marginBottom: 4,
                }}
              >
                Interface & Code Aesthetics
              </h3>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#918fa1", marginBottom: 20 }}>
                Customize visual themes and code snippet rendering styles.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                  { id: "dark-obsidian", label: "Dark Obsidian", desc: "Pure high contrast glass", color: "#c3c0ff" },
                  { id: "cyber-blue", label: "Cyber Neon", desc: "Cyan & electric accents", color: "#4cd7f6" },
                  { id: "deep-violet", label: "Midnight Violet", desc: "Deep purple ambiance", color: "#ddb7ff" },
                ].map((t) => {
                  const isSel = themeMode === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setThemeMode(t.id);
                        showToast(`Theme changed to ${t.label}`);
                      }}
                      className="cursor-pointer p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02]"
                      style={{
                        background: isSel ? "rgba(79,70,229,0.15)" : "rgba(0,0,0,0.2)",
                        borderColor: isSel ? t.color : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ fontFamily: "Geist, sans-serif", fontSize: 14, fontWeight: 600, color: "#dae2fd" }}>
                          {t.label}
                        </span>
                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ background: t.color, boxShadow: isSel ? `0 0 8px ${t.color}` : "none" }}
                        />
                      </div>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#918fa1" }}>
                        {t.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div>
                <label
                  className="block mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Syntax Highlighting Palette
                </label>
                <select
                  value={syntaxTheme}
                  onChange={(e) => {
                    setSyntaxTheme(e.target.value);
                    showToast(`Code syntax theme updated`);
                  }}
                  className="w-full sm:w-72 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all cursor-pointer"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: "#dae2fd",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <option value="tokyo-night">Tokyo Night Dark</option>
                  <option value="one-dark-pro">One Dark Pro</option>
                  <option value="dracula">Dracula Official</option>
                  <option value="github-dark">GitHub Dark Default</option>
                </select>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. CONNECTED REPOSITORIES TAB */}
        {/* ========================================================================= */}
        {activeTab === "repositories" && (
          <div className="space-y-6">
            <section
              className="rounded-2xl p-6 sm:p-8"
              style={{
                backdropFilter: "blur(16px)",
                background: "rgba(19,27,46,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                <div>
                  <h3
                    style={{
                      fontFamily: "Geist, sans-serif",
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#dae2fd",
                    }}
                  >
                    Connected Repositories
                  </h3>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#918fa1", marginTop: 2 }}>
                    Manage repository branch tracking, automatic sync schedules, and vector index caches in PostgreSQL.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Filter repositories..."
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    className="rounded-xl px-3.5 py-2 text-xs focus:outline-none w-48 sm:w-60"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      color: "#dae2fd",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                </div>
              </div>

              {/* Repositories Table */}
              <div className="mt-6 space-y-3">
                {reposList
                  .filter((r) => r.name.toLowerCase().includes(repoSearch.toLowerCase()))
                  .map((repo) => {
                    const isSyncing = syncingRepoId === repo.id;
                    return (
                      <div
                        key={repo.id}
                        className="p-4 sm:p-5 rounded-xl border border-white/5 transition-all hover:border-white/15 bg-black/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "rgba(79,70,229,0.15)", border: "1px solid rgba(195,192,255,0.2)" }}
                          >
                            <span className="material-symbols-outlined text-[22px]" style={{ color: "#c3c0ff" }}>
                              folder_code
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span style={{ fontFamily: "Geist, sans-serif", fontSize: 15, fontWeight: 600, color: "#dae2fd" }}>
                                {repo.name}
                              </span>
                              <span
                                className="px-2 py-0.5 rounded text-[11px] font-mono"
                                style={{ background: "rgba(255,255,255,0.06)", color: "#c7c4d8" }}
                              >
                                {repo.branch}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "#918fa1" }}>
                              <span className="flex items-center gap-1">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    background: repo.status === "synced" ? "#4cd7f6" : isSyncing ? "#ddb7ff" : "#ffb4ab",
                                    boxShadow: repo.status === "synced" ? "0 0 8px rgba(76,215,246,0.6)" : "none",
                                  }}
                                />
                                {isSyncing ? "Syncing index..." : repo.status === "synced" ? "Index Synced" : "Pending Sync"}
                              </span>
                              <span>•</span>
                              <span>Auto-sync: {repoSync[repo.id] ? "Enabled" : "Disabled"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Repo Action Buttons */}
                        <div className="flex items-center gap-2 self-end md:self-auto">
                          <button
                            onClick={() => triggerRepoSync(repo.id)}
                            disabled={isSyncing}
                            className="cursor-pointer px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all hover:bg-white/10"
                            style={{
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#dae2fd",
                            }}
                            title="Rescan & Index"
                          >
                            <span className={`material-symbols-outlined text-[16px] ${isSyncing ? "animate-spin text-cyan-400" : ""}`}>
                              sync
                            </span>
                            {isSyncing ? "Syncing..." : "Sync Now"}
                          </button>

                          <button
                            onClick={() => {
                              setEditingRepo(repo);
                              setRepoBranchInput(repo.branch);
                              setRepoIgnoreInput(repo.excludedPaths?.join(", ") || "node_modules, .next, dist, coverage, .git");
                            }}
                            className="cursor-pointer p-2 rounded-lg transition-all hover:bg-white/10 text-slate-300"
                            title="Configure Settings"
                          >
                            <span className="material-symbols-outlined text-[18px]">tune</span>
                          </button>

                          <button
                            onClick={() => handleDisconnectRepo(repo.id)}
                            className="cursor-pointer p-2 rounded-lg transition-all hover:bg-red-500/20 text-red-400"
                            title="Disconnect Repository"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {reposList.length === 0 && (
                  <div className="p-10 text-center rounded-xl bg-black/20 border border-white/5">
                    <span className="material-symbols-outlined text-[40px] text-slate-600 mb-2">folder_off</span>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#918fa1" }}>
                      No repositories connected. Connect a repository from the dashboard to start analyzing.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Repo Config Modal */}
            {editingRepo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                <div
                  className="w-full max-w-lg rounded-2xl p-6 sm:p-8 space-y-5 border border-white/10"
                  style={{ background: "#131b2e", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)" }}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <h3 style={{ fontFamily: "Geist, sans-serif", fontSize: 18, fontWeight: 600, color: "#dae2fd" }}>
                      Repository Settings: {editingRepo.name}
                    </h3>
                    <button
                      onClick={() => setEditingRepo(null)}
                      className="cursor-pointer p-1 text-slate-400 hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-slate-400">Default Target Branch</label>
                      <input
                        type="text"
                        value={repoBranchInput}
                        onChange={(e) => setRepoBranchInput(e.target.value)}
                        className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                        style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#dae2fd" }}
                      />
                    </div>

                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-slate-400">Excluded Directories & Files</label>
                      <input
                        type="text"
                        value={repoIgnoreInput}
                        onChange={(e) => setRepoIgnoreInput(e.target.value)}
                        className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none font-mono text-xs"
                        style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#dae2fd" }}
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">Comma-separated glob patterns saved to PostgreSQL.</span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-white/5">
                      <div>
                        <p className="text-sm font-semibold text-slate-200">Continuous Auto-Sync</p>
                        <p className="text-xs text-slate-400">Automatically re-index on new git push webhook events</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={repoSync[editingRepo.id] ?? true}
                        onChange={(e) =>
                          setRepoSync((prev) => ({ ...prev, [editingRepo.id]: e.target.checked }))
                        }
                        className="w-5 h-5 rounded accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      onClick={() => setEditingRepo(null)}
                      className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveRepoConfig}
                      disabled={savingRepoSettings}
                      className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg disabled:opacity-50"
                    >
                      {savingRepoSettings ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. TEAM & ACCESS TAB */}
        {/* ========================================================================= */}
        {activeTab === "team" && (
          <div className="space-y-6">
            <section
              className="rounded-2xl p-6 sm:p-8"
              style={{
                backdropFilter: "blur(16px)",
                background: "rgba(19,27,46,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                <div>
                  <h3
                    style={{
                      fontFamily: "Geist, sans-serif",
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#dae2fd",
                    }}
                  >
                    Team Members & Invitations
                  </h3>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#918fa1", marginTop: 2 }}>
                    Manage workspace collaborators and real database invitations.
                  </p>
                </div>
                <div
                  className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-black/30 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px] text-cyan-400">group</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#dae2fd" }}>
                    {teamMembers.length} / 5 Seats Used
                  </span>
                </div>
              </div>

              {/* Invite Form */}
              <form onSubmit={handleSendInvite} className="my-6 flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    color: "#dae2fd",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <select
                  value={inviteRole}
                  onChange={(e: any) => setInviteRole(e.target.value)}
                  className="rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-pointer"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    color: "#dae2fd",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <option value="Admin">Admin</option>
                  <option value="Developer">Developer</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="cursor-pointer px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-white text-sm font-semibold disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {sendingInvite ? "sync" : "person_add"}
                  </span>
                  {sendingInvite ? "Creating..." : "Send Invite"}
                </button>
              </form>

              {/* Shareable Invite Link Callout */}
              {generatedInviteLink && (
                <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-indigo-300">Shareable Invite URL Generated:</span>
                    <p className="font-mono text-xs text-slate-200 mt-1 break-all">{generatedInviteLink}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInviteLink);
                      showToast("Invite link copied to clipboard!");
                    }}
                    className="cursor-pointer px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0"
                  >
                    Copy Link
                  </button>
                </div>
              )}

              {/* Team Members List */}
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-xl border border-white/5 bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                        style={{
                          background: "rgba(79,70,229,0.15)",
                          border: "1px solid rgba(195,192,255,0.2)",
                        }}
                      >
                        {member.image ? (
                          <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-[20px]" style={{ color: "#c3c0ff" }}>
                            person
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p style={{ fontFamily: "Geist, sans-serif", fontSize: 14, fontWeight: 600, color: "#dae2fd" }}>
                            {member.name}
                          </p>
                          {member.isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-indigo-500/20 text-indigo-300">
                              YOU
                            </span>
                          )}
                          {member.status === "invited" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-yellow-500/20 text-yellow-300">
                              INVITATION PENDING
                            </span>
                          )}
                        </div>
                        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#918fa1" }}>
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      {member.role === "Owner" ? (
                        <span
                          className="px-3 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: "rgba(195,192,255,0.15)", color: "#c3c0ff" }}
                        >
                          Workspace Owner
                        </span>
                      ) : (
                        <select
                          value={member.role}
                          onChange={(e: any) => handleChangeRole(member.id, e.target.value)}
                          className="rounded-lg px-2.5 py-1 text-xs focus:outline-none cursor-pointer bg-black/40 border border-white/10 text-slate-300"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Developer">Developer</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      )}

                      {!member.isCurrent && member.role !== "Owner" && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Remove Member"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. INTEGRATIONS TAB */}
        {/* ========================================================================= */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            <section
              className="rounded-2xl p-6 sm:p-8"
              style={{
                backdropFilter: "blur(16px)",
                background: "rgba(19,27,46,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="pb-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3
                    style={{
                      fontFamily: "Geist, sans-serif",
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#dae2fd",
                    }}
                  >
                    Connected Integrations & Webhooks
                  </h3>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#918fa1", marginTop: 2 }}>
                    Connect external accounts, chat bots, and IDE plugins with live verification and database persistence.
                  </p>
                </div>
                <button
                  onClick={fetchIntegrations}
                  className="cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[16px]">sync</span>
                  Refresh Status
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {[
                  {
                    id: "github",
                    name: "GitHub",
                    desc: integrationsData.github?.connected
                      ? `Connected via OAuth (${integrationsData.github?.username || "Active"})`
                      : "Repository webhooks, PR review bots, and AST sync.",
                    icon: "code",
                    color: "#c3c0ff",
                    isConnected: Boolean(integrationsData.github?.connected),
                    isOAuth: true,
                  },
                  {
                    id: "gitlab",
                    name: "GitLab",
                    desc: integrationsData.gitlab?.connected
                      ? `Connected to ${integrationsData.gitlab?.host || "gitlab.com"}`
                      : "Self-hosted & SaaS GitLab merge request bot.",
                    icon: "account_tree",
                    color: "#ddb7ff",
                    isConnected: Boolean(integrationsData.gitlab?.connected),
                  },
                  {
                    id: "slack",
                    name: "Slack Webhooks",
                    desc: integrationsData.slack?.connected
                      ? "Active incoming alert webhook configured"
                      : "Real-time debt warnings and AI code review summaries.",
                    icon: "forum",
                    color: "#4cd7f6",
                    isConnected: Boolean(integrationsData.slack?.connected),
                  },
                  {
                    id: "discord",
                    name: "Discord Bot & Webhook",
                    desc: integrationsData.discord?.connected
                      ? "Active Discord alert channel webhook configured"
                      : "Community and dev alerts channel notifications.",
                    icon: "smart_toy",
                    color: "#93e8ff",
                    isConnected: Boolean(integrationsData.discord?.connected),
                  },
                  {
                    id: "jira",
                    name: "Jira Software",
                    desc: integrationsData.jira?.connected
                      ? `Connected to ${integrationsData.jira?.domain || "Atlassian"}`
                      : "Automatically create debt remediation issue tickets.",
                    icon: "task",
                    color: "#ddb7ff",
                    isConnected: Boolean(integrationsData.jira?.connected),
                  },
                  {
                    id: "vscode",
                    name: "VS Code & Cursor Extension",
                    desc: integrationsData.vscode?.connected
                      ? "Workspace extension token active"
                      : "Inline codebase context & architectural knowledge graph.",
                    icon: "terminal",
                    color: "#4cd7f6",
                    isConnected: Boolean(integrationsData.vscode?.connected),
                  },
                ].map((item) => {
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border border-white/5 bg-black/20 flex flex-col justify-between gap-4 transition-all hover:border-white/15"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}
                        >
                          <span className="material-symbols-outlined text-[22px]" style={{ color: item.color }}>
                            {item.icon}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 style={{ fontFamily: "Geist, sans-serif", fontSize: 16, fontWeight: 600, color: "#dae2fd" }}>
                              {item.name}
                            </h4>
                            {item.isConnected ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400 border border-white/10">
                                NOT CONNECTED
                              </span>
                            )}
                          </div>
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#918fa1", marginTop: 4 }}>
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <button
                          onClick={() => setActiveConfigModal(item.id)}
                          className="cursor-pointer text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {item.isConnected ? "tune" : "add_link"}
                          </span>
                          {item.id === "vscode" ? "Setup Guide" : item.isConnected ? "Configure" : "Setup Connection"}
                        </button>

                        {item.isOAuth ? (
                          <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                            OAuth Active
                          </span>
                        ) : item.isConnected ? (
                          <button
                            onClick={() => handleDisconnectIntegration(item.id)}
                            className="cursor-pointer px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-all"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveConfigModal(item.id)}
                            className="cursor-pointer px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Integration Configuration Modals */}
            {activeConfigModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                <div
                  className="w-full max-w-lg rounded-2xl p-6 sm:p-8 space-y-5 border border-white/10"
                  style={{ background: "#131b2e", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)" }}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-indigo-300 text-[18px]">
                          {activeConfigModal === "slack"
                            ? "forum"
                            : activeConfigModal === "discord"
                            ? "smart_toy"
                            : activeConfigModal === "gitlab"
                            ? "account_tree"
                            : activeConfigModal === "jira"
                            ? "task"
                            : activeConfigModal === "vscode"
                            ? "terminal"
                            : "integration_instructions"}
                        </span>
                      </div>
                      <h3 style={{ fontFamily: "Geist, sans-serif", fontSize: 18, fontWeight: 600, color: "#dae2fd" }}>
                        {activeConfigModal === "slack" && "Configure Slack Webhook"}
                        {activeConfigModal === "discord" && "Configure Discord Webhook"}
                        {activeConfigModal === "gitlab" && "Connect GitLab Account"}
                        {activeConfigModal === "jira" && "Connect Atlassian Jira"}
                        {activeConfigModal === "vscode" && "Connect VS Code / Cursor"}
                        {activeConfigModal === "github" && "GitHub Integration"}
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveConfigModal(null)}
                      className="cursor-pointer p-1 text-slate-400 hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>

                  {/* 1. SLACK MODAL */}
                  {activeConfigModal === "slack" && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        To receive code quality alerts, PR reviews, and architectural debt spikes in Slack, paste your Incoming Webhook URL below.
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Slack Incoming Webhook URL</label>
                        <input
                          type="text"
                          placeholder="https://hooks.slack.com/services/T000/B000/XXXX"
                          value={slackWebhookUrl}
                          onChange={(e) => setSlackWebhookUrl(e.target.value)}
                          className="w-full rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
                          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#dae2fd" }}
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleTestIntegration("slack", { webhookUrl: slackWebhookUrl })}
                          disabled={testingIntegration || !slackWebhookUrl}
                          className="cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5 disabled:opacity-40"
                        >
                          <span className={`material-symbols-outlined text-[16px] ${testingIntegration ? "animate-spin" : ""}`}>
                            {testingIntegration ? "sync" : "send"}
                          </span>
                          {testingIntegration ? "Sending Test..." : "Send Real Test Ping"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2. DISCORD MODAL */}
                  {activeConfigModal === "discord" && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Receive instant channel notifications on security flaws and PR analysis in your Discord server.
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Discord Webhook URL</label>
                        <input
                          type="text"
                          placeholder="https://discord.com/api/webhooks/123456789/xxxx"
                          value={discordWebhookUrl}
                          onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                          className="w-full rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
                          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#dae2fd" }}
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleTestIntegration("discord", { webhookUrl: discordWebhookUrl })}
                          disabled={testingIntegration || !discordWebhookUrl}
                          className="cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5 disabled:opacity-40"
                        >
                          <span className={`material-symbols-outlined text-[16px] ${testingIntegration ? "animate-spin" : ""}`}>
                            {testingIntegration ? "sync" : "send"}
                          </span>
                          {testingIntegration ? "Sending Test..." : "Send Real Test Ping"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. GITLAB MODAL */}
                  {activeConfigModal === "gitlab" && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Enter your GitLab Personal Access Token (with <code className="text-indigo-300 bg-white/5 px-1 py-0.5 rounded font-mono">read_api</code> scope) to connect your GitLab projects.
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">GitLab Host</label>
                        <input
                          type="text"
                          placeholder="gitlab.com (or your private domain)"
                          value={gitlabHost}
                          onChange={(e) => setGitlabHost(e.target.value)}
                          className="w-full rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
                          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#dae2fd" }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Personal Access Token</label>
                        <input
                          type="password"
                          placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                          value={gitlabToken}
                          onChange={(e) => setGitlabToken(e.target.value)}
                          className="w-full rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
                          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#dae2fd" }}
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleTestIntegration("gitlab", { host: gitlabHost, token: gitlabToken })}
                          disabled={testingIntegration || !gitlabToken}
                          className="cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5 disabled:opacity-40"
                        >
                          <span className={`material-symbols-outlined text-[16px] ${testingIntegration ? "animate-spin" : ""}`}>
                            {testingIntegration ? "sync" : "verified_user"}
                          </span>
                          {testingIntegration ? "Verifying..." : "Verify Token Live"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. JIRA MODAL */}
                  {activeConfigModal === "jira" && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Connect your Jira workspace to automatically file remediation tickets when architectural violations or dead code spikes occur.
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Atlassian Domain</label>
                        <input
                          type="text"
                          placeholder="your-company.atlassian.net"
                          value={jiraDomain}
                          onChange={(e) => setJiraDomain(e.target.value)}
                          className="w-full rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
                          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#dae2fd" }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Atlassian Account Email</label>
                        <input
                          type="email"
                          placeholder="developer@company.com"
                          value={jiraEmail}
                          onChange={(e) => setJiraEmail(e.target.value)}
                          className="w-full rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
                          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#dae2fd" }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Jira API Token</label>
                        <input
                          type="password"
                          placeholder="API token from id.atlassian.com"
                          value={jiraToken}
                          onChange={(e) => setJiraToken(e.target.value)}
                          className="w-full rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
                          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#dae2fd" }}
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleTestIntegration("jira", { domain: jiraDomain, email: jiraEmail, token: jiraToken })}
                          disabled={testingIntegration || !jiraDomain || !jiraEmail || !jiraToken}
                          className="cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5 disabled:opacity-40"
                        >
                          <span className={`material-symbols-outlined text-[16px] ${testingIntegration ? "animate-spin" : ""}`}>
                            {testingIntegration ? "sync" : "verified_user"}
                          </span>
                          {testingIntegration ? "Testing..." : "Verify Connection"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 5. VS CODE MODAL */}
                  {activeConfigModal === "vscode" && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        The ContextCrafter VS Code & Cursor extension uses your workspace API key to stream live codebase intelligence, dead code highlights, and architectural graph context directly in your editor.
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Workspace API Key</label>
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-indigo-300 flex items-center justify-between">
                          <span className="truncate pr-2">
                            {integrationsData.vscode?.activeKey || apiKeysList[0]?.key || "No key generated yet"}
                          </span>
                          <button
                            onClick={() => {
                              const key = integrationsData.vscode?.activeKey || apiKeysList[0]?.key;
                              if (!key) {
                                showToast("Please generate an API key in the API Keys tab first", "error");
                                return;
                              }
                              navigator.clipboard.writeText(key);
                              showToast("API Key copied to clipboard!");
                            }}
                            className="p-1 hover:text-white shrink-0"
                          >
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
                        <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">terminal</span>
                          Editor Configuration (.vscode/settings.json)
                        </div>
                        <pre className="text-[11px] font-mono text-slate-300 bg-black/50 p-2.5 rounded-lg overflow-x-auto">
{`{
  "contextcrafter.apiKey": "${integrationsData.vscode?.activeKey || apiKeysList[0]?.key || "YOUR_API_KEY"}",
  "contextcrafter.apiUrl": "${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}"
}`}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* 6. GITHUB MODAL */}
                  {activeConfigModal === "github" && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Your workspace is authenticated with GitHub OAuth. Real-time webhooks sync repository branches, pull requests, and commit diffs.
                      </p>
                      <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                        <span className="material-symbols-outlined text-green-400 text-[20px]">check_circle</span>
                        <div>
                          <p className="text-xs font-semibold text-green-300">GitHub Connected</p>
                          <p className="text-[11px] text-slate-400">{user.name || user.email} (OAuth Token Active)</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal Footer Actions */}
                  <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      onClick={() => setActiveConfigModal(null)}
                      className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5"
                    >
                      Close
                    </button>

                    {activeConfigModal === "slack" && (
                      <button
                        onClick={() => handleSaveIntegration("slack", { webhookUrl: slackWebhookUrl })}
                        disabled={savingIntegration || !slackWebhookUrl}
                        className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg disabled:opacity-40"
                      >
                        {savingIntegration ? "Saving..." : "Save Slack Webhook"}
                      </button>
                    )}

                    {activeConfigModal === "discord" && (
                      <button
                        onClick={() => handleSaveIntegration("discord", { webhookUrl: discordWebhookUrl })}
                        disabled={savingIntegration || !discordWebhookUrl}
                        className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg disabled:opacity-40"
                      >
                        {savingIntegration ? "Saving..." : "Save Discord Webhook"}
                      </button>
                    )}

                    {activeConfigModal === "gitlab" && (
                      <button
                        onClick={() => handleSaveIntegration("gitlab", { host: gitlabHost, token: gitlabToken })}
                        disabled={savingIntegration || !gitlabToken}
                        className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg disabled:opacity-40"
                      >
                        {savingIntegration ? "Connecting..." : "Save & Connect GitLab"}
                      </button>
                    )}

                    {activeConfigModal === "jira" && (
                      <button
                        onClick={() => handleSaveIntegration("jira", { domain: jiraDomain, email: jiraEmail, token: jiraToken })}
                        disabled={savingIntegration || !jiraDomain || !jiraEmail || !jiraToken}
                        className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg disabled:opacity-40"
                      >
                        {savingIntegration ? "Connecting..." : "Save & Connect Jira"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


        {/* ========================================================================= */}
        {/* 5. API KEYS TAB */}
        {/* ========================================================================= */}
        {activeTab === "api-keys" && (
          <div className="space-y-6">
            <section
              className="rounded-2xl p-6 sm:p-8"
              style={{
                backdropFilter: "blur(16px)",
                background: "rgba(19,27,46,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                <div>
                  <h3
                    style={{
                      fontFamily: "Geist, sans-serif",
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#dae2fd",
                    }}
                  >
                    API Keys & Tokens
                  </h3>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#918fa1", marginTop: 2 }}>
                    Manage programmatic credentials stored in PostgreSQL for automated CI/CD runs, AST ingestion, and CLI tools.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setGeneratedKeyResult(null);
                    setNewKeyName("");
                    setShowKeyGenModal(true);
                  }}
                  className="cursor-pointer px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-white text-sm font-semibold self-start sm:self-auto"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Generate New Key
                </button>
              </div>

              {/* API Keys List */}
              <div className="space-y-4 mt-6">
                {apiKeysList.map((ak) => {
                  const isUnmasked = unmaskedKeys[ak.id];
                  const displayKey = isUnmasked
                    ? ak.key
                    : `${ak.key.substring(0, 10)}••••••••••••••••${ak.key.slice(-4)}`;
                  return (
                    <div
                      key={ak.id}
                      className="p-5 rounded-xl border border-white/5 bg-black/20 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-white/10"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <span style={{ fontFamily: "Geist, sans-serif", fontSize: 15, fontWeight: 600, color: "#dae2fd" }}>
                            {ak.name}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                            style={{
                              background: ak.status === "active" ? "rgba(76,215,246,0.15)" : "rgba(255,255,255,0.06)",
                              color: ak.status === "active" ? "#4cd7f6" : "#918fa1",
                              border: ak.status === "active" ? "1px solid rgba(76,215,246,0.3)" : "none",
                            }}
                          >
                            {ak.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <code
                            className="px-3 py-1 rounded-lg text-xs font-mono select-all"
                            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", color: "#c7c4d8" }}
                          >
                            {displayKey}
                          </code>

                          <button
                            onClick={() =>
                              setUnmaskedKeys((prev) => ({ ...prev, [ak.id]: !prev[ak.id] }))
                            }
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title={isUnmasked ? "Hide" : "Show"}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isUnmasked ? "visibility_off" : "visibility"}
                            </span>
                          </button>

                          <button
                            onClick={() => copyKey(ak.key, ak.id)}
                            className="p-1 rounded text-slate-400 hover:text-cyan-400"
                            title="Copy Key"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {copiedKeyId === ak.id ? "check" : "content_copy"}
                            </span>
                          </button>
                        </div>

                        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#918fa1" }}>
                          Created: {ak.created} • Last used: {ak.lastUsed} • Expires: {ak.expires}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRevokeKey(ak.id)}
                        className="cursor-pointer px-3.5 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1 self-end md:self-auto"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                        Revoke
                      </button>
                    </div>
                  );
                })}

                {apiKeysList.length === 0 && (
                  <div className="p-8 text-center rounded-xl bg-black/20 border border-white/5">
                    <span className="material-symbols-outlined text-[36px] text-slate-600 mb-2">key_off</span>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#918fa1" }}>
                      No API keys generated yet. Create one to enable external CLI and webhook integrations.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Key Generation Modal */}
            {showKeyGenModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                <div
                  className="w-full max-w-lg rounded-2xl p-6 sm:p-8 space-y-5 border border-white/10"
                  style={{ background: "#131b2e", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)" }}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <h3 style={{ fontFamily: "Geist, sans-serif", fontSize: 18, fontWeight: 600, color: "#dae2fd" }}>
                      Generate API Key
                    </h3>
                    <button
                      onClick={() => setShowKeyGenModal(false)}
                      className="cursor-pointer p-1 text-slate-400 hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>

                  {!generatedKeyResult ? (
                    <form onSubmit={handleGenerateKey} className="space-y-4">
                      <div>
                        <label className="block mb-1.5 text-xs font-semibold text-slate-400">Key Description</label>
                        <input
                          type="text"
                          placeholder="e.g. GitHub Actions CI Runner"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#dae2fd" }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-1.5 text-xs font-semibold text-slate-400">Permissions</label>
                          <select
                            value={newKeyRole}
                            onChange={(e: any) => setNewKeyRole(e.target.value)}
                            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none bg-black/40 border border-white/10 text-slate-300"
                          >
                            <option value="active">Full Read & Write</option>
                            <option value="read-only">Read Only</option>
                          </select>
                        </div>
                        <div>
                          <label className="block mb-1.5 text-xs font-semibold text-slate-400">Expiration</label>
                          <select
                            value={newKeyExpiry}
                            onChange={(e) => setNewKeyExpiry(e.target.value)}
                            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none bg-black/40 border border-white/10 text-slate-300"
                          >
                            <option value="30 days">30 Days</option>
                            <option value="90 days">90 Days</option>
                            <option value="Never">Never</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => setShowKeyGenModal(false)}
                          className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={generatingKey}
                          className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg disabled:opacity-50"
                        >
                          {generatingKey ? "Generating..." : "Create Key"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                        ⚠️ Please copy this key immediately. For security reasons, you will not be able to view it again.
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                        <code className="font-mono text-xs text-cyan-300 break-all">{generatedKeyResult}</code>
                        <button
                          onClick={() => copyKey(generatedKeyResult, "modal")}
                          className="p-1.5 text-cyan-400 hover:text-white"
                          title="Copy"
                        >
                          <span className="material-symbols-outlined text-[18px]">content_copy</span>
                        </button>
                      </div>

                      <div className="flex justify-end pt-3 border-t border-white/10">
                        <button
                          onClick={() => setShowKeyGenModal(false)}
                          className="cursor-pointer px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. LLM PROVIDERS TAB */}
        {/* ========================================================================= */}
        {activeTab === "llm" && (
          <div className="space-y-6">
            <section
              className="rounded-2xl p-6 sm:p-8"
              style={{
                backdropFilter: "blur(16px)",
                background: "rgba(19,27,46,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                <div>
                  <h3
                    style={{
                      fontFamily: "Geist, sans-serif",
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#dae2fd",
                    }}
                  >
                    LLM & Reasoning Providers
                  </h3>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#918fa1", marginTop: 2 }}>
                    Configure inference endpoints, custom API keys, and model parameters in PostgreSQL.
                  </p>
                </div>

                <button
                  onClick={() => handleSaveLlm()}
                  disabled={savingLlm}
                  className="cursor-pointer px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-white text-sm font-semibold self-start sm:self-auto disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {savingLlm ? "sync" : "save"}
                  </span>
                  {savingLlm ? "Saving..." : "Save LLM Config"}
                </button>
              </div>

              {/* Provider Cards */}
              <div className="space-y-4 mt-6">
                {[
                  {
                    id: "groq",
                    name: "Groq Cloud",
                    model: "Llama 3.3 70B Versatile",
                    desc: "Ultra-fast inference (750+ tokens/sec) — optimal for real-time indexing & chat.",
                    color: "#4cd7f6",
                    icon: "bolt",
                  },
                  {
                    id: "openai",
                    name: "OpenAI",
                    model: "GPT-4o / GPT-4o-mini",
                    desc: "Premier coding reasoning & technical debt synthesis.",
                    color: "#c3c0ff",
                    icon: "smart_toy",
                  },
                  {
                    id: "anthropic",
                    name: "Anthropic",
                    model: "Claude 3.5 Sonnet",
                    desc: "Industry-leading AST comprehension and refactoring output.",
                    color: "#ddb7ff",
                    icon: "psychology",
                  },
                  {
                    id: "deepseek",
                    name: "DeepSeek",
                    model: "DeepSeek-V3 / DeepSeek-R1",
                    desc: "Advanced open-weight reasoning model with chain-of-thought verification.",
                    color: "#93e8ff",
                    icon: "neurology",
                  },
                  {
                    id: "ollama",
                    name: "Ollama Local (Self-Hosted)",
                    model: "Qwen2.5-Coder 32B",
                    desc: "Completely private, zero telemetry, on-premise local server execution.",
                    color: "#a8c7fa",
                    icon: "computer",
                  },
                ].map((provider) => {
                  const isActive = activeProvider === provider.id;
                  const isTesting = testingLlm === provider.id;
                  const tResult = testResult[provider.id];
                  const showKey = showKeyVisibility[provider.id];

                  return (
                    <div
                      key={provider.id}
                      className="p-5 rounded-2xl border transition-all duration-200"
                      style={{
                        background: isActive ? `${provider.color}08` : "rgba(0,0,0,0.2)",
                        borderColor: isActive ? `${provider.color}40` : "rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${provider.color}15`, border: `1px solid ${provider.color}30` }}
                          >
                            <span className="material-symbols-outlined text-[22px]" style={{ color: provider.color }}>
                              {provider.icon}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 style={{ fontFamily: "Geist, sans-serif", fontSize: 16, fontWeight: 600, color: "#dae2fd" }}>
                                {provider.name}
                              </h4>
                              {isActive && (
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                                  style={{
                                    background: `${provider.color}20`,
                                    color: provider.color,
                                    border: `1px solid ${provider.color}40`,
                                  }}
                                >
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#918fa1" }}>
                              {provider.desc}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => handleTestConnection(provider.id)}
                            disabled={isTesting}
                            className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 hover:bg-white/5 flex items-center gap-1.5 text-slate-300"
                            title="Verify connectivity"
                          >
                            <span className={`material-symbols-outlined text-[15px] ${isTesting ? "animate-spin text-cyan-400" : ""}`}>
                              {isTesting ? "sync" : "network_ping"}
                            </span>
                            {isTesting ? "Testing..." : "Test"}
                          </button>

                          {!isActive && (
                            <button
                              onClick={() => handleSaveLlm(provider.id)}
                              className="cursor-pointer px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Connection Test Result Badge */}
                      {tResult && (
                        <div
                          className="mt-3 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2"
                          style={{
                            background: tResult.ok ? "rgba(76,215,246,0.1)" : "rgba(239,68,68,0.1)",
                            color: tResult.ok ? "#4cd7f6" : "#f87171",
                            border: `1px solid ${tResult.ok ? "rgba(76,215,246,0.2)" : "rgba(239,68,68,0.2)"}`,
                          }}
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {tResult.ok ? "check_circle" : "error"}
                          </span>
                          {tResult.message}
                        </div>
                      )}

                      {/* Key & Base URL Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/5">
                        <div className="relative">
                          <input
                            type={showKey ? "text" : "password"}
                            placeholder={provider.id === "ollama" ? "Ollama Host URL (default: http://localhost:11434)" : `${provider.name} API Key (e.g. sk-...)`}
                            value={providerApiKeys[provider.id] || ""}
                            onChange={(e) =>
                              setProviderApiKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))
                            }
                            className="w-full rounded-xl px-4 py-2 text-xs font-mono focus:outline-none pr-10"
                            style={{
                              background: "rgba(0,0,0,0.3)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              color: "#dae2fd",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowKeyVisibility((prev) => ({ ...prev, [provider.id]: !prev[provider.id] }))
                            }
                            className="absolute right-3 top-2 text-slate-400 hover:text-white"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {showKey ? "visibility_off" : "visibility"}
                            </span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-slate-500">layers</span>
                          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#918fa1" }}>
                            Default Model: <strong className="text-slate-200">{provider.model}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Advanced Model Hyperparameters */}
              <div className="mt-8 p-6 rounded-xl bg-black/20 border border-white/5 space-y-4">
                <h4 style={{ fontFamily: "Geist, sans-serif", fontSize: 16, fontWeight: 600, color: "#dae2fd" }}>
                  Inference Hyperparameters
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-semibold">Temperature ({temperature})</span>
                      <span className="text-cyan-400 font-mono">0.0 (Deterministic) - 1.0 (Creative)</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-semibold">Max Completion Tokens ({maxTokens})</span>
                      <span className="text-indigo-400 font-mono">1024 - 16384</span>
                    </div>
                    <input
                      type="range"
                      min={1024}
                      max={16384}
                      step={1024}
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. VECTOR EMBEDDINGS & RAG TAB */}
        {/* ========================================================================= */}
        {activeTab === "models" && (
          <div className="space-y-6">
            <section
              className="rounded-2xl p-6 sm:p-8"
              style={{
                backdropFilter: "blur(16px)",
                background: "rgba(19,27,46,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                <div>
                  <h3
                    style={{
                      fontFamily: "Geist, sans-serif",
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#dae2fd",
                    }}
                  >
                    Vector Embeddings & RAG Engine
                  </h3>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#918fa1", marginTop: 2 }}>
                    Tune vector embedding dimensions, semantic AST chunking, and hybrid search weights stored in database.
                  </p>
                </div>

                <button
                  onClick={() => handleSaveModel()}
                  disabled={savingModel}
                  className="cursor-pointer px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-white text-sm font-semibold self-start sm:self-auto disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {savingModel ? "sync" : "save"}
                  </span>
                  {savingModel ? "Saving..." : "Apply RAG Settings"}
                </button>
              </div>

              {/* Embedding Model Choices */}
              <div className="space-y-3.5 mt-6">
                {[
                  {
                    id: "nomic",
                    name: "Nomic Embed Text (v1.5)",
                    provider: "Nomic AI",
                    dims: "768d",
                    speed: "Ultra-Fast",
                    quality: "High",
                    color: "#4cd7f6",
                  },
                  {
                    id: "text-embedding-3-small",
                    name: "text-embedding-3-small",
                    provider: "OpenAI",
                    dims: "1536d",
                    speed: "Fast",
                    quality: "Excellent",
                    color: "#c3c0ff",
                  },
                  {
                    id: "text-embedding-3-large",
                    name: "text-embedding-3-large",
                    provider: "OpenAI",
                    dims: "3072d",
                    speed: "Medium",
                    quality: "State-of-the-Art",
                    color: "#ddb7ff",
                  },
                  {
                    id: "voyage-code-2",
                    name: "Voyage Code 2",
                    provider: "Voyage AI",
                    dims: "1536d",
                    speed: "Fast",
                    quality: "Best for Source Code AST",
                    color: "#93e8ff",
                  },
                ].map((model) => {
                  const isActive = activeModel === model.id;
                  return (
                    <div
                      key={model.id}
                      onClick={() => handleSaveModel(model.id)}
                      className="cursor-pointer p-4 sm:p-5 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:scale-[1.01]"
                      style={{
                        background: isActive ? `${model.color}08` : "rgba(0,0,0,0.2)",
                        borderColor: isActive ? `${model.color}40` : "rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${model.color}15`, border: `1px solid ${model.color}30` }}
                        >
                          <span className="material-symbols-outlined text-[20px]" style={{ color: model.color }}>
                            layers
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span style={{ fontFamily: "Geist, sans-serif", fontSize: 15, fontWeight: 600, color: "#dae2fd" }}>
                              {model.name}
                            </span>
                            {isActive && (
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold"
                                style={{ background: `${model.color}20`, color: model.color }}
                              >
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#918fa1" }}>
                            Provider: {model.provider}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono self-end sm:self-auto" style={{ color: "#918fa1" }}>
                        <span className="px-2 py-1 rounded bg-black/40 border border-white/5 text-slate-300">
                          {model.dims}
                        </span>
                        <span className="px-2 py-1 rounded bg-black/40 border border-white/5 text-cyan-300">
                          {model.quality}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RAG Pipeline Fine Tuning */}
              <div className="mt-8 p-6 rounded-xl bg-black/20 border border-white/5 space-y-5">
                <h4 style={{ fontFamily: "Geist, sans-serif", fontSize: 16, fontWeight: 600, color: "#dae2fd" }}>
                  RAG Pipeline & Retrieval Parameters
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-semibold">Chunk Size ({chunkSize} tokens)</span>
                      <span className="text-slate-500 font-mono">256 - 2048</span>
                    </div>
                    <input
                      type="range"
                      min={256}
                      max={2048}
                      step={128}
                      value={chunkSize}
                      onChange={(e) => setChunkSize(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-semibold">Chunk Overlap ({chunkOverlap} tokens)</span>
                      <span className="text-slate-500 font-mono">0 - 256</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={256}
                      step={32}
                      value={chunkOverlap}
                      onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-semibold">Top-K Retrieved Snippets ({topKRetrieval})</span>
                      <span className="text-slate-500 font-mono">3 - 20 snippets</span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={20}
                      step={1}
                      value={topKRetrieval}
                      onChange={(e) => setTopKRetrieval(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-semibold">Hybrid Search (Dense vs BM25)</span>
                      <span className="text-cyan-400 font-mono">{(hybridSearchWeight * 100).toFixed(0)}% Dense</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={0.9}
                      step={0.05}
                      value={hybridSearchWeight}
                      onChange={(e) => setHybridSearchWeight(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 8. NOTIFICATIONS TAB */}
        {/* ========================================================================= */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <section
              className="rounded-2xl p-6 sm:p-8"
              style={{
                backdropFilter: "blur(16px)",
                background: "rgba(19,27,46,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                <div>
                  <h3
                    style={{
                      fontFamily: "Geist, sans-serif",
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#dae2fd",
                    }}
                  >
                    Notification Preferences & Alerts
                  </h3>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#918fa1", marginTop: 2 }}>
                    Configure alert dispatching rules saved directly to PostgreSQL.
                  </p>
                </div>

                <button
                  onClick={handleSaveNotifications}
                  disabled={savingNotifs}
                  className="cursor-pointer px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-white text-sm font-semibold self-start sm:self-auto disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {savingNotifs ? "sync" : "save"}
                  </span>
                  {savingNotifs ? "Saving..." : "Save Preferences"}
                </button>
              </div>

              <div className="space-y-4 mt-6">
                {[
                  {
                    key: "codeReviews" as const,
                    title: "Automated Code Review Completions",
                    desc: "Notify when PRs and local git diffs receive full AI structural audits.",
                  },
                  {
                    key: "securityFlaws" as const,
                    title: "Critical Security Flaws & Secret Leaks",
                    desc: "Immediate priority notifications when high-severity vulnerabilities are found.",
                  },
                  {
                    key: "syncStatus" as const,
                    title: "Repository Index & AST Sync Logs",
                    desc: "Receive logs whenever repository vector embeddings are regenerated.",
                  },
                  {
                    key: "debtSpike" as const,
                    title: "Technical Debt Spike Alerts",
                    desc: "Alert when codebase complexity exceeds defined maintainability thresholds.",
                  },
                  {
                    key: "weeklyDigest" as const,
                    title: "Weekly Codebase Health Digest",
                    desc: "Weekly executive summary of architectural drift, conventions, and dead code.",
                  },
                ].map((item) => {
                  const isEnabled = notifSettings[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleNotif(item.key)}
                      className="cursor-pointer p-4 sm:p-5 rounded-xl border border-white/5 bg-black/20 flex items-center justify-between gap-4 transition-all hover:border-white/15"
                    >
                      <div>
                        <p style={{ fontFamily: "Geist, sans-serif", fontSize: 15, fontWeight: 600, color: "#dae2fd" }}>
                          {item.title}
                        </p>
                        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#918fa1", marginTop: 2 }}>
                          {item.desc}
                        </p>
                      </div>

                      <div
                        className="relative w-11 h-6 rounded-full cursor-pointer transition-colors shrink-0"
                        style={{
                          background: isEnabled ? "#4f46e5" : "rgba(34,42,61,0.8)",
                          border: isEnabled ? "1px solid #4f46e5" : "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <span
                          className="absolute top-0.75 w-4.5 h-4.5 rounded-full bg-white transition-transform"
                          style={{
                            left: 3,
                            transform: isEnabled ? "translateX(20px)" : "translateX(0)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery Channels */}
              <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                <h4 style={{ fontFamily: "Geist, sans-serif", fontSize: 16, fontWeight: 600, color: "#dae2fd" }}>
                  Delivery Destination
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Primary Notification Email</label>
                  <input
                    type="email"
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    className="w-full sm:w-96 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#dae2fd" }}
                  />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 9. BILLING & USAGE TAB */}
        {/* ========================================================================= */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <section
              className="rounded-2xl p-6 sm:p-8"
              style={{
                backdropFilter: "blur(16px)",
                background: "rgba(19,27,46,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                <div>
                  <h3
                    style={{
                      fontFamily: "Geist, sans-serif",
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#dae2fd",
                    }}
                  >
                    Subscription Plan & Workspace Quotas
                  </h3>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#918fa1", marginTop: 2 }}>
                    Manage billing tiers, monthly compute units, and invoice receipts.
                  </p>
                </div>

                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="cursor-pointer px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-white text-sm font-semibold self-start sm:self-auto"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">upgrade</span>
                  Upgrade Plan
                </button>
              </div>

              {/* Current Plan Overview */}
              <div
                className="my-6 p-6 rounded-2xl relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(19,27,46,0.8) 100%)",
                  border: "1px solid rgba(195,192,255,0.2)",
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                      Active Subscription
                    </span>
                    <h4 style={{ fontFamily: "Geist, sans-serif", fontSize: 26, fontWeight: 700, color: "#ffffff", marginTop: 2 }}>
                      {billingPlan} Plan
                    </h4>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#918fa1", marginTop: 2 }}>
                      {billingPlan === "Hobby"
                        ? "Free forever plan with up to 3 connected repositories & 100 monthly chats."
                        : "Unlimited repositories, infinite vector context, and priority AST indexing."}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span style={{ fontFamily: "Geist, sans-serif", fontSize: 28, fontWeight: 700, color: "#4cd7f6" }}>
                      {billingPlan === "Hobby" ? "$0" : "$29"}
                    </span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#918fa1" }}>/month</span>
                  </div>
                </div>
              </div>

              {/* Usage Progress Meters */}
              <div className="space-y-4">
                <h4 style={{ fontFamily: "Geist, sans-serif", fontSize: 16, fontWeight: 600, color: "#dae2fd" }}>
                  Monthly Usage Quotas
                </h4>

                {[
                  { label: "Active Connected Repositories", used: usage.repos, max: 3, unit: "repos", color: "#4cd7f6" },
                  { label: "AI Reasoning & Chat Queries", used: usage.messages, max: 100, unit: "messages", color: "#c3c0ff" },
                  { label: "Automated Code Reviews", used: usage.reviews, max: 10, unit: "reviews", color: "#ddb7ff" },
                  { label: "Architecture Docs Generated", used: usage.docs, max: 5, unit: "docs", color: "#93e8ff" },
                ].map((meter) => {
                  const pct = Math.min(100, (meter.used / meter.max) * 100);
                  return (
                    <div key={meter.label} className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, color: "#dae2fd" }}>
                          {meter.label}
                        </span>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", color: "#918fa1" }}>
                          <strong className="text-slate-200">{meter.used}</strong> / {meter.max} {meter.unit}
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: meter.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Invoices Table */}
              <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                <h4 style={{ fontFamily: "Geist, sans-serif", fontSize: 16, fontWeight: 600, color: "#dae2fd" }}>
                  Billing History & Invoices
                </h4>

                <div className="rounded-xl overflow-hidden border border-white/5 bg-black/20">
                  {[
                    { id: "INV-2026-08", date: "Aug 01, 2026", amount: "$0.00", status: "Paid" },
                    { id: "INV-2026-07", date: "Jul 01, 2026", amount: "$0.00", status: "Paid" },
                  ].map((inv) => (
                    <div
                      key={inv.id}
                      className="p-4 flex items-center justify-between border-b border-white/5 last:border-0 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">receipt</span>
                        <div>
                          <p className="font-mono font-semibold text-slate-200">{inv.id}</p>
                          <p className="text-slate-400">{inv.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-slate-200">{inv.amount}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-300">
                          {inv.status}
                        </span>
                        <button
                          onClick={() => showToast("Invoice receipt downloaded!")}
                          className="cursor-pointer text-slate-400 hover:text-white"
                          title="Download Receipt"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Upgrade Modal */}
            {showUpgradeModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                <div
                  className="w-full max-w-2xl rounded-2xl p-6 sm:p-8 space-y-6 border border-white/10"
                  style={{ background: "#131b2e", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)" }}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <h3 style={{ fontFamily: "Geist, sans-serif", fontSize: 20, fontWeight: 700, color: "#dae2fd" }}>
                        Select Your Workspace Tier
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Upgrade anytime with prorated billing.</p>
                    </div>
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="cursor-pointer p-1 text-slate-400 hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        name: "Pro Developer",
                        price: "$29",
                        desc: "For individual developers & consultants building serious systems.",
                        features: [
                          "Unlimited Repositories",
                          "Infinite AST Vector Context",
                          "Full Knowledge Graph 3D",
                          "Priority Inference Queue",
                          "VS Code Extension Pro",
                        ],
                        color: "#c3c0ff",
                        tag: "MOST POPULAR",
                      },
                      {
                        name: "Team & Enterprise",
                        price: "$79",
                        desc: "For engineering teams needing shared standards & SOC-2 compliance.",
                        features: [
                          "Up to 15 Team Members",
                          "Custom LLM & On-Prem Ollama",
                          "Automated PR Review Gatekeeper",
                          "Jira / Linear Issue Sync",
                          "Dedicated Support Engineer",
                        ],
                        color: "#4cd7f6",
                        tag: "TEAM SCALE",
                      },
                    ].map((plan) => (
                      <div
                        key={plan.name}
                        className="p-5 rounded-2xl border border-white/10 bg-black/30 flex flex-col justify-between space-y-4"
                      >
                        <div>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{ background: `${plan.color}20`, color: plan.color }}
                          >
                            {plan.tag}
                          </span>
                          <h4 style={{ fontFamily: "Geist, sans-serif", fontSize: 18, fontWeight: 700, color: "#ffffff", marginTop: 8 }}>
                            {plan.name}
                          </h4>
                          <div className="flex items-baseline gap-1 my-2">
                            <span style={{ fontFamily: "Geist, sans-serif", fontSize: 28, fontWeight: 700, color: plan.color }}>
                              {plan.price}
                            </span>
                            <span className="text-xs text-slate-400">/mo</span>
                          </div>
                          <p className="text-xs text-slate-400 mb-4">{plan.desc}</p>
                          <ul className="space-y-2 text-xs text-slate-300">
                            {plan.features.map((f) => (
                              <li key={f} className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px]" style={{ color: plan.color }}>
                                  check_circle
                                </span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          onClick={() => {
                            setBillingPlan("Pro");
                            setShowUpgradeModal(false);
                            showToast(`Successfully switched to ${plan.name}!`);
                          }}
                          className="cursor-pointer w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110"
                          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" }}
                        >
                          Switch to {plan.name}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
