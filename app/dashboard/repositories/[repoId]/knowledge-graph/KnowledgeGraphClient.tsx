"use client";

import { useState } from "react";

interface GraphNode {
  id: string;
  label: string;
  type: "service" | "component" | "page" | "utility" | "model" | "api";
  path: string;
  x: number;
  y: number;
  r: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface Props {
  repo: { id: string; name: string };
  graph: Graph;
}

const typeColors = {
  service: "#c3c0ff",
  component: "#ddb7ff",
  page: "#4cd7f6",
  api: "#93e8ff",
  model: "#c3c0ff",
  utility: "#918fa1",
};

const typeLabels = {
  service: "Services",
  component: "Components",
  page: "Pages",
  api: "API Routes",
  model: "Models",
  utility: "Utilities",
};

export default function KnowledgeGraphClient({ repo, graph }: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  async function analyzeImports() {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/repos/${repo.id}/analyze-imports`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.connections >= 0) {
        setAnalyzed(true);
        window.location.reload();
      }
    } finally {
      setAnalyzing(false);
    }
  }

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const safeGraph = graph ?? { nodes: [], edges: [] };
  const connectedNodes = selectedNode
    ? (safeGraph.edges
        .filter((e) => e.from === selectedNode.id || e.to === selectedNode.id)
        .map((e) => (e.from === selectedNode.id ? e.to : e.from))
        .map((id) => safeGraph.nodes.find((n) => n.id === id))
        .filter(Boolean) as GraphNode[])
    : [];

  const searchMatches = searchQuery.trim()
    ? safeGraph.nodes.filter(
        (n) =>
          n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.path.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  async function viewFile(node: GraphNode) {
    setLoadingFile(true);
    setShowCode(true);
    setFileContent(null);
    try {
      const res = await fetch(
        `/api/repos/${repo.id}/file-content?path=${encodeURIComponent(node.path)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content ?? "// File content not available");
      } else {
        setFileContent("// Failed to load file content");
      }
    } catch {
      setFileContent("// Error loading file");
    } finally {
      setLoadingFile(false);
    }
  }

  return (
    <div className="flex-1 relative flex flex-col h-full overflow-hidden">
      <main className="flex-1 relative overflow-hidden flex items-center justify-center">
        {/* Graph Canvas */}
        <div
          className="absolute inset-0 z-0 flex items-center justify-center"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center",
            transition: "transform 0.2s",
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 800 600"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Edges */}
            {safeGraph.edges.map((edge, i) => {
              const from = safeGraph.nodes.find((n) => n.id === edge.from);
              const to = safeGraph.nodes.find((n) => n.id === edge.to);
              if (!from || !to) return null;

              const isHighlighted =
                selectedNode &&
                (edge.from === selectedNode.id || edge.to === selectedNode.id);

              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={
                    isHighlighted
                      ? typeColors[selectedNode!.type]
                      : "rgba(195,192,255,0.12)"
                  }
                  strokeWidth={isHighlighted ? 1.5 : 0.6}
                  strokeDasharray={isHighlighted ? "none" : "none"}
                />
              );
            })}

            {/* Nodes */}
            {safeGraph.nodes.map((node) => {
              const color = typeColors[node.type];
              const isSelected = selectedNode?.id === node.id;
              const isConnected = connectedNodes.some((n) => n.id === node.id);
              const isRoot = node.id === "root";
              const isSearchMatch =
                searchQuery.trim() !== "" &&
                searchMatches.some((m) => m.id === node.id);
              const isDimmed =
                (selectedNode && !isSelected && !isConnected && !isRoot) ||
                (searchQuery.trim() !== "" && !isSearchMatch && !isSelected);

              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedNode(isSelected ? null : node)}
                  style={{
                    opacity: isDimmed ? 0.15 : 1,
                    transition: "opacity 0.3s",
                  }}
                >
                  {/* Search highlight ring */}
                  {isSearchMatch && !isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r + 10}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth={2}
                      opacity={0.8}
                      strokeDasharray="4 2"
                    />
                  )}

                  {/* Outer glow */}
                  {(isSelected || isRoot || isSearchMatch) && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r + 12}
                      fill={isSearchMatch && !isSelected ? "#fbbf24" : color}
                      opacity={0.08}
                    />
                  )}

                  {/* Pulse ring للـ selected */}
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r + 6}
                      fill="none"
                      stroke={color}
                      strokeWidth={1}
                      opacity={0.4}
                    />
                  )}

                  {/* Node */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r}
                    fill={
                      isRoot ? color : isConnected ? `${color}ee` : `${color}99`
                    }
                    stroke={isSelected || isConnected ? color : "transparent"}
                    strokeWidth={1.5}
                    style={{
                      filter: isSelected
                        ? `drop-shadow(0 0 8px ${color})`
                        : isRoot
                          ? `drop-shadow(0 0 12px ${color})`
                          : "none",
                    }}
                  />

                  {/* Label — بس لو selected أو root أو connected */}
                  {(isSelected || isRoot || isConnected || node.r >= 9) && (
                    <text
                      x={node.x}
                      y={node.y + node.r + 12}
                      textAnchor="middle"
                      fill={isSelected || isConnected ? color : "#918fa1"}
                      fontSize={isRoot ? 11 : 8}
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight={isSelected ? "600" : "400"}
                    >
                      {node.label.length > 14
                        ? node.label.slice(0, 14) + "…"
                        : node.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Graph Controls */}
        <div className="glass-panel absolute bottom-8 right-8 rounded-lg flex flex-col gap-1 p-1 z-20">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
            className="p-2 text-on-surface-variant hover:text-primary hover:bg-white/5 rounded-md transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
          <div className="w-full h-px bg-white/10 my-1" />
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
            className="p-2 text-on-surface-variant hover:text-primary hover:bg-white/5 rounded-md transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">
              remove
            </span>
          </button>
          <div className="w-full h-px bg-white/10 my-1" />
          <button
            onClick={() => setZoom(1)}
            className="p-2 text-on-surface-variant hover:text-primary hover:bg-white/5 rounded-md transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">
              my_location
            </span>
          </button>
        </div>
        {/* Search Bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-80">
          <div className="glass-panel rounded-lg flex items-center gap-2 px-3 py-2 border border-white/10">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Auto-select if exactly one match
                const q = e.target.value.trim().toLowerCase();
                if (q) {
                  const matches = safeGraph.nodes.filter(
                    (n) =>
                      n.label.toLowerCase().includes(q) ||
                      n.path.toLowerCase().includes(q),
                  );
                  if (matches.length === 1) setSelectedNode(matches[0]);
                }
              }}
              placeholder="Search files in graph..."
              className="bg-transparent border-none outline-none flex-1 text-sm text-on-surface placeholder:text-on-surface-variant/50"
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}
            />
            {searchQuery && (
              <>
                <span
                  className="text-[11px] text-on-surface-variant"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {searchMatches.length} match
                  {searchMatches.length !== 1 ? "es" : ""}
                </span>
                <button
                  onClick={() => {
                    setSearchQuery("");
                  }}
                  className="text-on-surface-variant hover:text-white transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    close
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        <button
          onClick={analyzeImports}
          disabled={analyzing}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:brightness-110 disabled:opacity-50"
          style={{
            background: "#4f46e5",
            color: "#dad7ff",
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {analyzing ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
            >
              account_tree
            </span>
          )}
          {analyzing
            ? "Analyzing..."
            : analyzed
              ? "Re-analyze Imports"
              : "Analyze Real Imports"}
        </button>

        {/* Legend */}
        <div className="glass-panel absolute bottom-8 left-8 rounded-lg p-4 z-20 flex flex-col gap-3 min-w-40">
          <h3 className="text-label-xs text-on-surface-variant uppercase tracking-widest border-b border-white/10 pb-2 mb-1">
            Legend
          </h3>
          {Object.entries(typeColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
              />
              <span className="text-body-sm text-on-surface">
                {typeLabels[type as keyof typeof typeLabels]}
              </span>
            </div>
          ))}
        </div>

        {/* Node Detail Panel */}
        <div
          className={`glass-panel absolute top-8 right-8 bottom-8 w-80 rounded-xl z-30 flex flex-col shadow-2xl shadow-black/50 border border-white/10 transform transition-transform duration-300 overflow-hidden bg-surface-container-highest/80 ${
            selectedNode ? "translate-x-0" : "translate-x-[120%]"
          }`}
        >
          {selectedNode && (
            <>
              {/* Header */}
              <div className="p-5 border-b border-white/10 bg-linear-to-br from-white/5 to-transparent flex justify-between items-start">
                <div>
                  <div
                    className="font-code-md mb-1 flex items-center gap-2"
                    style={{ color: typeColors[selectedNode.type] }}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      description
                    </span>
                    {selectedNode.label}
                  </div>
                  <span
                    className="text-label-xs px-2 py-0.5 rounded-full border inline-block capitalize"
                    style={{
                      background: `${typeColors[selectedNode.type]}20`,
                      color: typeColors[selectedNode.type],
                      borderColor: `${typeColors[selectedNode.type]}40`,
                    }}
                  >
                    {selectedNode.type}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-on-surface-variant hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    close
                  </span>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
                {/* Path */}
                <div className="p-3 rounded-lg bg-surface-container/50 border border-white/5">
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold mb-1">
                    Path
                  </p>
                  <p
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 12,
                      color: "#dae2fd",
                    }}
                  >
                    {selectedNode.path}
                  </p>
                </div>

                {/* Metrics */}
                <div>
                  <h4 className="text-label-xs text-on-surface-variant uppercase tracking-widest mb-3">
                    Connections
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 border border-white/5 rounded p-3 text-center">
                      <div className="text-headline-lg-mobile text-on-surface mb-1">
                        {connectedNodes.length}
                      </div>
                      <div className="text-[10px] text-on-surface-variant uppercase font-semibold">
                        Connected
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded p-3 text-center">
                      <div className="text-headline-lg-mobile text-on-surface mb-1">
                        {selectedNode.type === "service" ? "High" : "Low"}
                      </div>
                      <div className="text-[10px] text-on-surface-variant uppercase font-semibold">
                        Coupling
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connected nodes */}
                {connectedNodes.length > 0 && (
                  <div>
                    <h4 className="text-label-xs text-on-surface-variant uppercase tracking-widest mb-3">
                      Connected To
                    </h4>
                    <ul className="flex flex-col gap-2">
                      {connectedNodes.map((n) => (
                        <li
                          key={n.id}
                          className="flex items-center justify-between font-code-md text-xs bg-surface-container/50 border border-white/5 p-2 rounded cursor-pointer hover:border-white/20 transition-colors"
                          onClick={() => setSelectedNode(n)}
                        >
                          <span style={{ color: typeColors[n.type] }}>
                            {n.label}
                          </span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded capitalize"
                            style={{
                              background: `${typeColors[n.type]}15`,
                              color: typeColors[n.type],
                            }}
                          >
                            {n.type}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-surface-container-low/50 flex flex-col gap-2">
                <button
                  onClick={() => viewFile(selectedNode)}
                  className="cursor-pointer w-full py-2 bg-transparent border border-outline-variant hover:border-primary text-on-surface text-body-sm rounded transition-colors flex justify-center items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showCode ? "visibility_off" : "code"}
                  </span>
                  {showCode ? "Hide Code" : "View File"}
                </button>
              </div>

              {/* Source Code Panel */}
              {showCode && (
                <div className="border-t border-white/10 flex flex-col max-h-[40vh]">
                  <div className="flex items-center justify-between px-4 py-2 bg-surface-container-low/80 border-b border-white/5">
                    <span className="text-[10px] text-on-surface-variant uppercase font-semibold tracking-wider">
                      Source Code
                    </span>
                    <button
                      onClick={() => setShowCode(false)}
                      className="cursor-pointer text-on-surface-variant hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        close
                      </span>
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 bg-[#0d1117]">
                    {loadingFile ? (
                      <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      <pre
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: 11,
                          lineHeight: 1.6,
                          color: "#c9d1d9",
                          margin: 0,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                        }}
                      >
                        {fileContent}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
