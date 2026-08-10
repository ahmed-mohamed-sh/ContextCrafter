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
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const safeGraph = graph ?? { nodes: [], edges: [] };
  const connectedNodes = selectedNode
    ? (safeGraph.edges
        .filter((e) => e.from === selectedNode.id || e.to === selectedNode.id)
        .map((e) => (e.from === selectedNode.id ? e.to : e.from))
        .map((id) => safeGraph.nodes.find((n) => n.id === id))
        .filter(Boolean) as GraphNode[])
    : [];

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
              const isDimmed =
                selectedNode && !isSelected && !isConnected && !isRoot;

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
                  {/* Outer glow */}
                  {(isSelected || isRoot) && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r + 12}
                      fill={color}
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
              <div className="p-4 border-t border-white/10 bg-surface-container-low/50">
                <button className="w-full py-2 bg-transparent border border-outline-variant hover:border-primary text-on-surface text-body-sm rounded transition-colors flex justify-center items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    open_in_new
                  </span>
                  View File
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
