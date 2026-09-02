"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnalysisModal } from "@/components/AnalysisModal";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources?: { path: string }[];
  createdAt: Date;
}

interface ChatSession {
  id: string;
  title: string | null;
  updatedAt: Date;
}

interface Props {
  repo: { id: string; name: string };
  chatSessions: ChatSession[];
  user: { name?: string | null; image?: string | null };
}

export function ChatClient({ repo, chatSessions, user }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState(chatSessions);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [indexing, setIndexing] = useState(false);
  const [indexed, setIndexed] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const [conventionsLearned, setConventionsLearned] = useState(false);

  const [impactFile, setImpactFile] = useState("");
  const [impactResult, setImpactResult] = useState<string[]>([]);
  const [showImpact, setShowImpact] = useState(false);

  const [analysisModal, setAnalysisModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    steps: { label: string; icon?: string }[];
    assetLabel?: string;
    assetCount?: string;
  }>({
    isOpen: false,
    title: "",
    description: "",
    steps: [],
  });

  async function buildIndex() {
    setIndexing(true);
    setAnalysisModal({
      isOpen: true,
      title: "Building Knowledge Index...",
      description: "ContextCrafter is parsing files, generating vector embeddings, and structuring semantic context.",
      steps: [
        { label: "Scanning repository source files...", icon: "folder_open" },
        { label: "Generating semantic vector embeddings...", icon: "data_object" },
        { label: "Structuring knowledge base...", icon: "hub" },
        { label: "Finalizing retrieval index...", icon: "check_circle" },
      ],
      assetLabel: "Repository",
      assetCount: repo.name,
    });
    try {
      const res = await fetch(`/api/repos/${repo.id}/index`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.indexed) setIndexed(true);
    } finally {
      setTimeout(() => {
        setAnalysisModal((prev) => ({ ...prev, isOpen: false }));
        setIndexing(false);
      }, 600);
    }
  }

  async function analyzeConventions() {
    setAnalysisModal({
      isOpen: true,
      title: "Learning your coding conventions...",
      description: "ContextCrafter is analyzing architecture patterns and naming rules to provide tailored suggestions.",
      steps: [
        { label: "Parsing repository codebase...", icon: "folder_open" },
        { label: "Extracting naming and structural patterns...", icon: "rule" },
        { label: "Evaluating architectural conventions...", icon: "architecture" },
        { label: "Saving learned project rules...", icon: "check_circle" },
      ],
      assetLabel: "Repository",
      assetCount: repo.name,
    });
    try {
      const res = await fetch(
        `/api/repos/${repo.id}/analyze-conventions`,
        {
          method: "POST",
        },
      );

      if (!res.ok) {
        throw new Error("Failed to analyze conventions");
      }

      setConventionsLearned(true);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze conventions");
    } finally {
      setTimeout(() => {
        setAnalysisModal((prev) => ({ ...prev, isOpen: false }));
      }, 600);
    }
  }

  async function analyzeImpact() {
    if (!impactFile) return;
    setAnalysisModal({
      isOpen: true,
      title: `Analyzing impact for ${impactFile.split("/").pop()}...`,
      description: "Tracing upstream dependencies and calculating downstream affected modules.",
      steps: [
        { label: "Locating target file in AST...", icon: "description" },
        { label: "Traversing dependency graph...", icon: "account_tree" },
        { label: "Identifying affected components...", icon: "warning" },
      ],
      assetLabel: "Target File",
      assetCount: impactFile.split("/").pop() || impactFile,
    });
    try {
      const res = await fetch(`/api/repos/${repo.id}/impact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: impactFile }),
      });
      const data = await res.json();
      setImpactResult(data.affected || []);
      setShowImpact(true);
    } catch (error) {
      console.error("Failed to analyze impact:", error);
    } finally {
      setTimeout(() => {
        setAnalysisModal((prev) => ({ ...prev, isOpen: false }));
      }, 600);
    }
  }

  useEffect(() => {
    async function loadIndexStatus() {
      try {
        const res = await fetch(
          `/api/repos/${repo.id}/index/status`,
        );

        if (!res.ok) return;

        const data = await res.json();

        setIndexed(data.indexed);
        setConventionsLearned(data.conventionsLearned);
      } catch (error) {
        console.error("Failed to load index status:", error);
      } finally {
        setIsLoadingStatus(false);
      }
    }

    loadIndexStatus();
  }, [repo.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "USER",
      content: input,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/repos/${repo.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          sessionId,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (data.sessionId && !sessionId) setSessionId(data.sessionId);

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "ASSISTANT",
        content: data.response,
        sources: data.sources,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ASSISTANT",
          content: "Sorry, something went wrong. Please try again.",
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function loadSession(session: ChatSession) {
    const res = await fetch(
      `/api/repos/${repo.id}/chat?sessionId=${session.id}`,
    );
    const data = await res.json();
    setSessionId(session.id);
    setMessages(data.messages);
  }

  function newChat() {
    setSessionId(null);
    setMessages([]);
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-[#0b1326] text-[#dae2fd]">
      {/* Three Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — History */}
        <div
          className="w-72 shrink-0 hidden lg:flex flex-col"
          style={{
            borderRight: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(11,19,38,0.4)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            className="p-4 flex flex-col gap-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex justify-between items-center">
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  color: "#918fa1",
                  textTransform: "uppercase",
                }}
              >
                Conversation History
              </p>
              <button
                onClick={newChat}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:brightness-110"
                style={{
                  background: "#4f46e5",
                  color: "#dad7ff",
                  borderTop: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <span className="material-symbols-outlined text-[14px]">
                  add
                </span>
                New Chat
              </button>
            </div>
            <div className="relative">
              <span
                className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline"
                style={{ fontSize: 16 }}
              >
                search
              </span>
              <input
                type="text"
                placeholder="Filter..."
                className="w-full rounded pl-8 pr-3 py-1.5 text-sm focus:outline-none"
                style={{
                  background: "rgba(23,31,51,0.6)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  color: "#dae2fd",
                }}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <span
                  className="material-symbols-outlined text-outline"
                  style={{ fontSize: 32 }}
                >
                  chat_bubble
                </span>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    color: "#918fa1",
                    marginTop: 8,
                  }}
                >
                  No conversations yet
                </p>
              </div>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s)}
                  className="w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors hover:bg-white/5"
                  style={{
                    background:
                      s.id === sessionId
                        ? "rgba(79,70,229,0.1)"
                        : "transparent",
                    border:
                      s.id === sessionId
                        ? "1px solid rgba(79,70,229,0.2)"
                        : "1px solid transparent",
                  }}
                >
                  <span
                    className="material-symbols-outlined mt-0.5"
                    style={{
                      fontSize: 16,
                      color: s.id === sessionId ? "#c3c0ff" : "#918fa1",
                    }}
                  >
                    chat_bubble
                  </span>
                  <div className="min-w-0">
                    <p
                      className="truncate"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        color: "#dae2fd",
                      }}
                    >
                      {s.title ?? "New conversation"}
                    </p>
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 11,
                        color: "#918fa1",
                        marginTop: 2,
                      }}
                    >
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(s.updatedAt))}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Center — Chat */}
        <div className="flex-1 flex flex-col relative min-w-0">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(79,70,229,0.05) 0%, transparent 70%)",
            }}
          />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 relative z-10">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(79,70,229,0.15)",
                    border: "1px solid rgba(79,70,229,0.3)",
                  }}
                >
                  <span
                    className="material-symbols-outlined text-[#c3c0ff]"
                    style={{ fontSize: 32 }}
                  >
                    smart_toy
                  </span>
                </div>
                <div className="text-center">
                  <h3
                    style={{
                      fontFamily: "Geist, sans-serif",
                      fontSize: 20,
                      fontWeight: 600,
                      color: "#dae2fd",
                      marginBottom: 8,
                    }}
                  >
                    Ask anything about {repo.name}
                  </h3>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      color: "#918fa1",
                    }}
                  >
                    I understand your entire codebase
                  </p>
                </div>
                <div className="flex gap-4 items-center mt-6">
                  <button
                    onClick={buildIndex}
                    disabled={isLoadingStatus || indexing}
                    className="cursor-pointer flex items-center gap-2 px-6 py-3 rounded-lg transition-all hover:brightness-110 disabled:opacity-50"
                    style={{
                      background: indexed ? "rgba(79, 70, 229, 0.25)" : "#4f46e5",
                      color: "#dad7ff",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      border: indexed ? "1px solid #4f46e5" : "none",
                    }}
                  >
                    {isLoadingStatus ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Checking...
                      </>
                    ) : indexing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Building Index...
                      </>
                    ) : indexed ? (
                      <>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 18 }}
                        >
                          refresh
                        </span>
                        Rebuild Index
                      </>
                    ) : (
                      <>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 18 }}
                        >
                          hub
                        </span>
                        Build Index
                      </>
                    )}
                  </button>
                  <button
                    onClick={analyzeConventions}
                    disabled={isLoadingStatus}
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all hover:bg-white/5 disabled:opacity-50"
                    style={{
                      background: conventionsLearned ? "rgba(52, 211, 153, 0.1)" : "rgba(255,255,255,0.05)",
                      border: conventionsLearned ? "1px solid rgba(52, 211, 153, 0.3)" : "1px solid rgba(255,255,255,0.1)",
                      color: conventionsLearned ? "#34d399" : "#dae2fd",
                    }}
                  >
                    {isLoadingStatus ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Checking...
                      </>
                    ) : conventionsLearned ? (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          refresh
                        </span>
                        Relearn Conventions
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          rule
                        </span>
                        Learn Conventions
                      </>
                    )}
                  </button>
                </div>
                {/* Suggested questions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {[
                    "Explain the authentication flow",
                    "How is the database structured?",
                    "What are the main API endpoints?",
                    "Explain the project architecture",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="p-3 rounded-lg text-left text-sm transition-all hover:bg-white/5"
                      style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#c7c4d8",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "ASSISTANT" && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-3 mt-1"
                        style={{
                          background: "rgba(79,70,229,0.2)",
                          border: "1px solid rgba(79,70,229,0.3)",
                        }}
                      >
                        <span
                          className="material-symbols-outlined text-[#c3c0ff]"
                          style={{ fontSize: 18 }}
                        >
                          smart_toy
                        </span>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${msg.role === "USER" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                      style={{
                        background:
                          msg.role === "USER"
                            ? "rgba(11,19,38,0.6)"
                            : "transparent",
                        border:
                          msg.role === "USER"
                            ? "1px solid rgba(255,255,255,0.08)"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: 15,
                          lineHeight: "24px",
                          color: "#dae2fd",
                        }}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ node, ...props }) => (
                              <p className="mb-4 last:mb-0" {...props} />
                            ),
                            code: ({
                              node,
                              className,
                              children,
                              ...props
                            }: any) => {
                              const isInline =
                                node?.position?.start?.line ===
                                node?.position?.end?.line;

                              return isInline ? (
                                <code
                                  className="bg-surface-container px-1.5 py-0.5 rounded text-sm text-[#4cd7f6] font-mono break-words"
                                  {...props}
                                >
                                  {children}
                                </code>
                              ) : (
                                <pre className="bg-surface-container p-4 rounded-lg overflow-x-auto text-sm my-4 border border-outline-variant/30">
                                  <code
                                    className="text-[#dae2fd] font-mono"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                </pre>
                              );
                            },

                            ul: ({ node, ...props }) => (
                              <ul
                                className="list-disc pl-6 mb-4 space-y-2"
                                {...props}
                              />
                            ),
                            ol: ({ node, ...props }) => (
                              <ol
                                className="list-decimal pl-6 mb-4 space-y-2"
                                {...props}
                              />
                            ),
                            li: ({ node, ...props }) => (
                              <li className="text-[#dae2fd]" {...props} />
                            ),
                            h1: ({ node, ...props }) => (
                              <h1
                                className="text-xl font-bold mt-6 mb-4 text-primary"
                                {...props}
                              />
                            ),
                            h2: ({ node, ...props }) => (
                              <h2
                                className="text-lg font-bold mt-6 mb-4 text-primary"
                                {...props}
                              />
                            ),
                            h3: ({ node, ...props }) => (
                              <h3
                                className="text-base font-bold mt-4 mb-2 text-primary"
                                {...props}
                              />
                            ),
                            strong: ({ node, ...props }) => (
                              <strong
                                className="font-semibold text-white"
                                {...props}
                              />
                            ),
                            a: ({ node, ...props }) => (
                              <a
                                className="text-[#4cd7f6] hover:underline break-words"
                                target="_blank"
                                rel="noopener noreferrer"
                                {...props}
                              />
                            ),
                            blockquote: ({ node, ...props }) => (
                              <blockquote
                                className="border-l-4 border-primary/50 pl-4 my-4 italic text-outline"
                                {...props}
                              />
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      {/* Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div
                          className="mt-3 pt-3 flex flex-wrap gap-2"
                          style={{
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          {msg.sources.map((s, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1 px-2 py-1 rounded"
                              style={{
                                background: "rgba(76,215,246,0.1)",
                                border: "1px solid rgba(76,215,246,0.2)",
                                fontFamily: "JetBrains Mono, monospace",
                                fontSize: 11,
                                color: "#4cd7f6",
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 12 }}
                              >
                                description
                              </span>
                              {s.path.split("/").pop()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Loading */}
                {loading && (
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: "rgba(79,70,229,0.2)",
                        border: "1px solid rgba(79,70,229,0.3)",
                      }}
                    >
                      <span
                        className="material-symbols-outlined text-[#c3c0ff]"
                        style={{ fontSize: 18 }}
                      >
                        smart_toy
                      </span>
                    </div>
                    <div className="flex items-center gap-1 p-4">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-[#c3c0ff]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-6 pt-2 relative z-10">
            <div
              className="relative rounded-xl p-2 transition-all"
              style={{
                background: "rgba(11,19,38,0.6)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask anything about your codebase..."
                rows={2}
                className="w-full bg-transparent border-none resize-none focus:ring-0 focus:outline-none p-3"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 15,
                  color: "#dae2fd",
                }}
              />
              <div className="flex justify-between items-center px-2 pb-1">
                <div className="flex gap-2">
                  {["attach_file", "code"].map((icon) => (
                    <button
                      key={icon}
                      className="p-1.5 rounded transition-colors hover:bg-white/5 text-outline hover:text-[#c3c0ff]"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18 }}
                      >
                        {icon}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="p-2 rounded-lg transition-all hover:brightness-110 disabled:opacity-40"
                  style={{
                    background: "#4f46e5",
                    color: "#dad7ff",
                    boxShadow: "0 0 10px rgba(79,70,229,0.3)",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18 }}
                  >
                    send
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Context Panel */}
        <div
          className="w-80 shrink-0 hidden xl:flex flex-col"
          style={{
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(11,19,38,0.4)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            className="p-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <p
              className="flex items-center gap-2"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.05em",
                color: "#918fa1",
                textTransform: "uppercase",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16 }}
              >
                memory
              </span>
              Context Window
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Impact Analysis */}
            <div>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#dae2fd",
                  marginBottom: 8,
                }}
              >
                Impact Analysis
              </p>
              {showImpact && (
                <div className="mb-3">
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 11,
                      color: "#918fa1",
                      marginBottom: 8,
                    }}
                  >
                    {impactResult.length} files affected
                  </p>
                  {impactResult.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 p-2 rounded mb-1"
                      style={{
                        background: "rgba(255,180,171,0.08)",
                        border: "1px solid rgba(255,180,171,0.15)",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 12, color: "#ffb4ab" }}
                      >
                        warning
                      </span>
                      <span
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: 11,
                          color: "#dae2fd",
                        }}
                      >
                        {f.split("/").pop()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="src/auth/service.ts"
                  value={impactFile}
                  onChange={(e) => setImpactFile(e.target.value)}
                  className="flex-1 rounded px-3 py-1.5 text-sm focus:outline-none"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#dae2fd",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 12,
                  }}
                />
                <button
                  onClick={analyzeImpact}
                  className="px-3 py-1.5 rounded text-sm font-semibold transition-all hover:brightness-110 cursor-pointer"
                  style={{
                    background: "#4f46e5",
                    color: "#dad7ff",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                  }}
                >
                  Analyze
                </button>
              </div>
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    color: "#918fa1",
                  }}
                >
                  Context will appear here as you chat
                </p>
              </div>
            ) : (
              <>
                {/* Files Mentioned */}
                {messages.some((m) => m.sources?.length) && (
                  <div>
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#dae2fd",
                        marginBottom: 12,
                      }}
                    >
                      Files Referenced
                    </p>
                    <div className="space-y-2">
                      {Array.from(
                        new Set(
                          messages.flatMap(
                            (m) => m.sources?.map((s) => s.path) ?? [],
                          ),
                        ),
                      ).map((path) => (
                        <div
                          key={path}
                          className="flex items-center gap-2 p-2 rounded transition-colors hover:bg-white/5"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <span
                            className="material-symbols-outlined text-[#4cd7f6]"
                            style={{ fontSize: 16 }}
                          >
                            description
                          </span>
                          <span
                            className="truncate"
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: 12,
                              color: "#dae2fd",
                            }}
                          >
                            {path.split("/").pop()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repo Info */}
                <div>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#dae2fd",
                      marginBottom: 12,
                    }}
                  >
                    Repository
                  </p>
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      background: "rgba(23,31,51,0.6)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 12,
                        color: "#c3c0ff",
                      }}
                    >
                      {repo.name}
                    </p>
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 11,
                        color: "#918fa1",
                        marginTop: 4,
                      }}
                    >
                      {messages.length} messages in this session
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Loading Modal */}
      <AnalysisModal
        isOpen={analysisModal.isOpen}
        title={analysisModal.title}
        description={analysisModal.description}
        steps={analysisModal.steps}
        assetLabel={analysisModal.assetLabel}
        assetCount={analysisModal.assetCount}
      />
    </div>
  );
}
