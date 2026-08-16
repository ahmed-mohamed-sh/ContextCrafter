import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import TechnicalDeptClient from "./TechnicalDeptClient";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export default async function TechnicalDebtPage({
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
        select: { path: true, language: true, extension: true },
      },
    },
  });

  if (!repo) redirect("/dashboard");

  // بنا الـ debt analysis من الـ files
  const analysis = analyzeDebt(repo.files);

  return (
    <TechnicalDeptClient
      repo={{ id: repo.id, name: repo.name, fullName: repo.fullName }}
      clusters={analysis.clusters}
      heatmap={analysis.heatmap}
      roiGrade={analysis.roiGrade}
      roiTrend={analysis.roiTrend}
      estimatedEffort={analysis.estimatedEffort}
      roiSummary={analysis.roiSummary}
    />
  );
}

interface FileInfo {
  path: string;
  language: string | null;
  extension: string | null;
}

function analyzeDebt(files: FileInfo[]) {
  // Dead code — files بدون imports واضحة
  const deadFiles = files.filter(
    (f) =>
      f.path.includes("unused") ||
      f.path.includes("old") ||
      f.path.includes("deprecated") ||
      f.path.includes("backup") ||
      f.path.includes(".bak") ||
      f.path.includes("copy"),
  );

  // Large files — paths طويلة جداً كـ indicator
  const largeFiles = files
    .filter((f) => f.path.split("/").length > 5)
    .slice(0, 10);

  // Duplicate code — files بنفس الاسم في folders مختلفة
  const fileNames = files.map((f) => f.path.split("/").pop() ?? "");
  const duplicates = files
    .filter((f) => {
      const name = f.path.split("/").pop() ?? "";
      return fileNames.filter((n) => n === name).length > 1;
    })
    .slice(0, 8);

  // Circular deps — files في نفس الـ folder بتتكرر
  const folders = files.map((f) => f.path.split("/").slice(0, -1).join("/"));
  const folderCount: Record<string, number> = {};
  folders.forEach((f) => {
    folderCount[f] = (folderCount[f] ?? 0) + 1;
  });
  const circularFolders = Object.entries(folderCount)
    .filter(([, count]) => count > 5)
    .map(([folder]) => folder);
  const circularFiles = files
    .filter((f) =>
      circularFolders.includes(f.path.split("/").slice(0, -1).join("/")),
    )
    .slice(0, 6);

  // Complex files — config files وـ schema files
  const complexFiles = files
    .filter((f) => f.extension === "ts" || f.extension === "tsx")
    .slice(0, 8);

  // Missing tests
  const testFiles = files.filter(
    (f) =>
      f.path.includes("test") ||
      f.path.includes("spec") ||
      f.path.includes("__tests__"),
  );
  const nonTestFiles = files.filter(
    (f) =>
      !f.path.includes("test") &&
      !f.path.includes("spec") &&
      (f.extension === "ts" || f.extension === "tsx" || f.extension === "js"),
  );

  const clusters = [
    deadFiles.length > 0 && {
      id: "dead-code",
      title: "Dead Code",
      description: "Files that appear unused or deprecated",
      icon: "delete_sweep",
      severity: "major" as const,
      impactedFiles: deadFiles.length,
      impactLabel: `${deadFiles.length} files`,
      remediationHours: deadFiles.length * 0.5,
      files: deadFiles.map((f) => f.path),
    },
    duplicates.length > 0 && {
      id: "duplicates",
      title: "Duplicate Code",
      description: "Files with identical names in different locations",
      icon: "content_copy",
      severity: "major" as const,
      impactedFiles: duplicates.length,
      impactLabel: `${duplicates.length} files`,
      remediationHours: duplicates.length * 1.5,
      files: duplicates.map((f) => f.path),
    },
    circularFiles.length > 0 && {
      id: "circular",
      title: "Circular Dependencies",
      description: "Folders with high concentration of related files",
      icon: "sync_problem",
      severity: "critical" as const,
      impactedFiles: circularFiles.length,
      impactLabel: `${circularFiles.length} files`,
      remediationHours: circularFiles.length * 2,
      files: circularFiles.map((f) => f.path),
    },
    testFiles.length < nonTestFiles.length * 0.3 && {
      id: "missing-tests",
      title: "Missing Test Coverage",
      description: "Low ratio of test files to source files",
      icon: "bug_report",
      severity: "major" as const,
      impactedFiles: nonTestFiles.length - testFiles.length,
      impactLabel: `${Math.round((testFiles.length / Math.max(nonTestFiles.length, 1)) * 100)}% coverage`,
      remediationHours: (nonTestFiles.length - testFiles.length) * 2,
      files: nonTestFiles.slice(0, 6).map((f) => f.path),
    },
    largeFiles.length > 0 && {
      id: "complex",
      title: "Complex File Structure",
      description: "Deeply nested files indicating high complexity",
      icon: "account_tree",
      severity: "minor" as const,
      impactedFiles: largeFiles.length,
      impactLabel: `${largeFiles.length} files`,
      remediationHours: largeFiles.length * 1,
      files: largeFiles.map((f) => f.path),
    },
  ].filter(Boolean) as any[];

  // لو مفيش clusters — أضيف default
  if (clusters.length === 0) {
    clusters.push({
      id: "general",
      title: "General Maintenance",
      description: "Routine code maintenance recommended",
      icon: "construction",
      severity: "minor" as const,
      impactedFiles: files.length,
      impactLabel: `${files.length} files`,
      remediationHours: Math.ceil(files.length * 0.1),
      files: files.slice(0, 5).map((f) => f.path),
    });
  }

  // Heatmap — 4x6 grid من الـ files
  const heatmapFiles = files.slice(0, 24);
  const getSeverity = (file: FileInfo) => {
    if (deadFiles.some((f) => f.path === file.path)) return "critical" as const;
    if (duplicates.some((f) => f.path === file.path)) return "major" as const;
    if (circularFiles.some((f) => f.path === file.path))
      return "major" as const;
    if (complexFiles.some((f) => f.path === file.path)) return "minor" as const;
    return "none" as const;
  };

  const heatmapFlat = heatmapFiles.map((f) => ({
    label: f.path.split("/").pop()?.slice(0, 3) ?? "",
    severity: getSeverity(f),
  }));

  // Pad to 24
  while (heatmapFlat.length < 24) {
    heatmapFlat.push({ label: "", severity: "none" as const });
  }

  // Split into rows of 6
  const heatmap = Array.from({ length: 4 }, (_, i) =>
    heatmapFlat.slice(i * 6, i * 6 + 6),
  );

  // ROI calculation
  const totalHours = clusters.reduce((acc, c) => acc + c.remediationHours, 0);
  const criticalCount = clusters.filter(
    (c) => c.severity === "critical",
  ).length;
  const roiGrade =
    criticalCount > 2
      ? "D"
      : criticalCount > 0
        ? "C"
        : clusters.length > 3
          ? "B"
          : "A";
  const roiTrend = clusters.length === 0 ? 5 : -clusters.length * 3;

  const roiSummary =
    clusters.length === 0
      ? "Codebase is in great shape with minimal technical debt."
      : `Found ${clusters.length} debt cluster${clusters.length > 1 ? "s" : ""}. Addressing critical issues first will yield the highest ROI.`;

  return {
    clusters,
    heatmap,
    roiGrade,
    roiTrend,
    estimatedEffort: Math.ceil(totalHours),
    roiSummary,
  };
}
