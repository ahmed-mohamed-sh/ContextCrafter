import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import KnowledgeGraphClient from "@/app/dashboard/repositories/[repoId]/knowledge-graph/KnowledgeGraphClient";

export default async function KnowledgeGraphPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const repo = await db.repository.findUnique({
    where: { id: repoId, userId: session.user.id },
    include: {
      files: {
        select: {
          id: true,
          path: true,
          language: true,
          extension: true,
          fromConnections: {
            select: { toFileId: true },
          },
        },
      },
    },
  });

  if (!repo) redirect("/dashboard");

  function buildGraph(files: any[]) {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    const cx = 400;
    const cy = 300;

    const getType = (path: string): GraphNode["type"] => {
      if (
        path.includes("component") ||
        path.includes("Component") ||
        path.includes("ui/")
      )
        return "component";
      if (
        path.includes("page") ||
        path.includes("pages/") ||
        path.includes("app/")
      )
        return "page";
      if (
        path.includes("/api/") ||
        path.includes("route") ||
        path.includes("controller")
      )
        return "api";
      if (path.includes("service") || path.includes("Service"))
        return "service";
      if (
        path.includes("model") ||
        path.includes("schema") ||
        path.includes("prisma")
      )
        return "model";
      return "utility";
    };

    files.slice(0, 60).forEach((file, i) => {
      const type = getType(file.path);
      const layer = Math.floor(i / 10);
      const indexInLayer = i % 10;
      const totalInLayer = Math.min(10, files.length - layer * 10);
      const radius = 80 + layer * 70;
      const angle = (indexInLayer / totalInLayer) * 2 * Math.PI;
      const jitter = 15;

      nodes.push({
        id: file.id,
        label:
          file.path
            .split("/")
            .pop()
            ?.replace(/\.[^.]+$/, "") ?? "",
        type,
        path: file.path,
        x: Math.max(
          30,
          Math.min(
            770,
            cx + radius * Math.cos(angle) + (Math.random() - 0.5) * jitter,
          ),
        ),
        y: Math.max(
          30,
          Math.min(
            570,
            cy + radius * Math.sin(angle) + (Math.random() - 0.5) * jitter,
          ),
        ),
        r: type === "service" ? 10 : type === "component" ? 9 : 7,
      });
    });

    const nodeIds = new Set(nodes.map((n) => n.id));

    files.forEach((file) => {
      file.fromConnections?.forEach((conn: { toFileId: string }) => {
        if (nodeIds.has(file.id) && nodeIds.has(conn.toFileId)) {
          const exists = edges.some(
            (e) =>
              (e.from === file.id && e.to === conn.toFileId) ||
              (e.from === conn.toFileId && e.to === file.id),
          );
          if (!exists) {
            edges.push({ from: file.id, to: conn.toFileId });
          }
        }
      });
    });

    if (edges.length === 0) {
      nodes.forEach((node, i) => {
        const nearest = nodes
          .filter((n) => n.id !== node.id)
          .map((n) => ({
            node: n,
            dist: Math.sqrt(
              Math.pow(n.x - node.x, 2) + Math.pow(n.y - node.y, 2),
            ),
          }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 2);
        nearest.forEach(({ node: other }) => {
          const exists = edges.some(
            (e) =>
              (e.from === node.id && e.to === other.id) ||
              (e.from === other.id && e.to === node.id),
          );
          if (!exists) edges.push({ from: node.id, to: other.id });
        });
      });
    }

    return { nodes, edges };
  }
  return (
    <KnowledgeGraphClient
      repo={{ id: repo.id, name: repo.name }}
      graph={buildGraph(repo.files)}
    />
  );
}

// ─── Types ───────────────────────────────────────────

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

function buildGraph(
  files: { path: string; language: string | null; extension: string | null }[],
) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const cx = 400;
  const cy = 300;

  const categorized = {
    service: files
      .filter(
        (f) =>
          f.path.includes("service") ||
          f.path.includes("Service") ||
          f.path.includes("lib/"),
      )
      .slice(0, 4),
    component: files
      .filter(
        (f) =>
          f.path.includes("component") ||
          f.path.includes("Component") ||
          f.path.includes("ui/"),
      )
      .slice(0, 4),
    page: files
      .filter(
        (f) =>
          f.path.includes("page") ||
          f.path.includes("pages/") ||
          f.path.includes("app/"),
      )
      .slice(0, 3),
    api: files
      .filter(
        (f) =>
          f.path.includes("/api/") ||
          f.path.includes("route") ||
          f.path.includes("controller"),
      )
      .slice(0, 3),
    model: files
      .filter(
        (f) =>
          f.path.includes("model") ||
          f.path.includes("schema") ||
          f.path.includes("prisma"),
      )
      .slice(0, 3),
    utility: files
      .filter(
        (f) =>
          f.path.includes("util") ||
          f.path.includes("helper") ||
          f.path.includes("config"),
      )
      .slice(0, 3),
  };

  const typeConfig = {
    service: { color: "#c3c0ff", r: 12, angleStart: 0 },
    component: { color: "#ddb7ff", r: 10, angleStart: 60 },
    page: { color: "#4cd7f6", r: 9, angleStart: 120 },
    api: { color: "#93e8ff", r: 10, angleStart: 180 },
    model: { color: "#c3c0ff", r: 8, angleStart: 240 },
    utility: { color: "#918fa1", r: 7, angleStart: 300 },
  };

  // Center node — الـ repo نفسه
  const centerId = "repo-root";
  nodes.push({
    id: centerId,
    label: "Root",
    type: "service",
    path: "/",
    x: cx,
    y: cy,
    r: 16,
  });

  // بنا الـ nodes في دوائر حول الـ center
  Object.entries(categorized).forEach(([type, typeFiles]) => {
    const config = typeConfig[type as keyof typeof typeConfig];
    const radius = 160;

    typeFiles.forEach((file, i) => {
      const angle = (config.angleStart + i * 25) * (Math.PI / 180);
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      const id = file.path;
      const label =
        file.path
          .split("/")
          .pop()
          ?.replace(/\.[^.]+$/, "") ?? file.path;

      nodes.push({
        id,
        label,
        type: type as GraphNode["type"],
        path: file.path,
        x,
        y,
        r: config.r,
      });

      // edge من الـ center للـ node
      edges.push({ from: centerId, to: id });
    });
  });

  return { nodes, edges };
}
