import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserOctokit } from "@/lib/github";
import { NextResponse } from "next/server";
import { generateAICompletion } from "@/lib/ai";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> },
) {
  const { repoId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repo = await db.repository.findUnique({
    where: { id: repoId, userId: session.user.id },
    include: {
      files: { select: { id: true, path: true, extension: true } },
    },
  });

  if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const octokit = await getUserOctokit(session.user.id);
  const [owner, repoName] = repo.fullName.split("/");

  const codeFiles = repo.files
    .filter((f) =>
      ["ts", "tsx", "js", "jsx", "py", "go"].includes(f.extension ?? ""),
    )
    .slice(0, 30);

  const fileAnalysis: {
    path: string;
    complexity: number;
    lines: number;
    content: string;
  }[] = [];

  for (const file of codeFiles) {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo: repoName,
        path: file.path,
      });
      if (!("content" in data)) continue;
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      const complexity = calculateComplexity(content);
      const lines = content.split("\n").length;
      fileAnalysis.push({
        path: file.path,
        complexity,
        lines,
        content: content.slice(0, 300),
      });
    } catch {
      continue;
    }
  }

  // Cyclomatic Complexity clusters
  const complexFiles = fileAnalysis
    .filter((f) => f.complexity > 10)
    .sort((a, b) => b.complexity - a.complexity);

  // Large files
  const largeFiles = fileAnalysis
    .filter((f) => f.lines > 200)
    .sort((a, b) => b.lines - a.lines);

  // Duplicate detection - files with similar content
  const duplicates = findDuplicates(fileAnalysis);

  // Dead code - files with no imports
  const connectedFileIds = new Set(
    (
      await db.fileConnection.findMany({
        where: { fromFile: { repositoryId: repoId } },
        select: { toFileId: true, fromFileId: true },
      })
    ).flatMap((c) => [c.fromFileId, c.toFileId]),
  );

  const deadFiles = repo.files
    .filter(
      (f) =>
        ["ts", "tsx", "js", "jsx"].includes(f.extension ?? "") &&
        !connectedFileIds.has(f.id) &&
        !f.path.includes("page") &&
        !f.path.includes("layout") &&
        !f.path.includes("route"),
    )
    .slice(0, 8);

  // Groq AI للـ summary
  let roiSummary = "";
  let roiGrade = "B";
  let roiTrend = -5;

  try {
    const prompt = `Analyze this codebase technical debt and respond in JSON only:
{
  "roiGrade": "<A|B|C|D>",
  "roiTrend": <number between -20 and 20>,
  "roiSummary": "<2 sentences about the debt and priority>"
}

Stats:
- Total files: ${fileAnalysis.length}
- Complex files (complexity > 10): ${complexFiles.length}
- Large files (> 200 lines): ${largeFiles.length}
- Potential duplicates: ${duplicates.length}
- Potentially unused files: ${deadFiles.length}

Most complex files:
${complexFiles
        .slice(0, 3)
        .map((f) => `- ${f.path}: complexity ${f.complexity}`)
        .join("\n")}`;

    const completion = await generateAICompletion({
      userId: session.user.id,
      messages: [{ role: "user", content: prompt }],
      maxTokens: 300,
    });

    const text = completion.content || "";
    const json = JSON.parse(text.replace(/```json|```/g, "").trim());
    roiGrade = json.roiGrade ?? "B";
    roiTrend = json.roiTrend ?? -5;
    roiSummary = json.roiSummary ?? "";
  } catch { }

  // Clusters
  const clusters = [
    complexFiles.length > 0 && {
      id: "complexity",
      title: "High Complexity",
      description: "Files with cyclomatic complexity > 10",
      icon: "account_tree",
      severity: complexFiles.length > 5 ? "critical" : "major",
      impactedFiles: complexFiles.length,
      impactLabel: `${complexFiles.length} files — avg complexity ${Math.round(complexFiles.reduce((s, f) => s + f.complexity, 0) / complexFiles.length)}`,
      remediationHours: complexFiles.length * 3,
      files: complexFiles.slice(0, 6).map((f) => f.path),
    },
    largeFiles.length > 0 && {
      id: "large-files",
      title: "Large Files",
      description: "Files exceeding 200 lines — harder to maintain",
      icon: "description",
      severity: "major",
      impactedFiles: largeFiles.length,
      impactLabel: `${largeFiles.length} files — largest: ${largeFiles[0]?.lines} lines`,
      remediationHours: largeFiles.length * 2,
      files: largeFiles.slice(0, 6).map((f) => f.path),
    },
    duplicates.length > 0 && {
      id: "duplicates",
      title: "Duplicate Code",
      description: "Similar code patterns detected across files",
      icon: "content_copy",
      severity: "major",
      impactedFiles: duplicates.length,
      impactLabel: `${duplicates.length} similar files`,
      remediationHours: duplicates.length * 2,
      files: duplicates.slice(0, 6).map((f) => f.path),
    },
    deadFiles.length > 0 && {
      id: "dead-code",
      title: "Potentially Unused Files",
      description: "Files with no detected imports from other files",
      icon: "delete_sweep",
      severity: "minor",
      impactedFiles: deadFiles.length,
      impactLabel: `${deadFiles.length} files`,
      remediationHours: deadFiles.length * 0.5,
      files: deadFiles.map((f) => f.path),
    },
  ].filter(Boolean);

  // Heatmap
  const heatmapFiles = fileAnalysis.slice(0, 24);
  const getFileSeverity = (file: (typeof fileAnalysis)[0]) => {
    if (file.complexity > 15) return "critical" as const;
    if (file.complexity > 10 || file.lines > 300) return "major" as const;
    if (file.complexity > 5 || file.lines > 150) return "minor" as const;
    return "none" as const;
  };

  const heatmapFlat = heatmapFiles.map((f) => ({
    label: f.path.split("/").pop()?.slice(0, 3) ?? "",
    severity: getFileSeverity(f),
  }));

  while (heatmapFlat.length < 24) {
    heatmapFlat.push({ label: "", severity: "none" as const });
  }

  const heatmap = Array.from({ length: 4 }, (_, i) =>
    heatmapFlat.slice(i * 6, i * 6 + 6),
  );

  const estimatedEffort = Math.ceil(
    (clusters as any[]).reduce(
      (s: number, c: any) => s + c.remediationHours,
      0,
    ),
  );

  // Update the repository with the analysis results
  await db.repository.update({
    where: { id: repoId },
    data: {
      aiReview: {
        clusters,
        heatmap,
        roiGrade,
        roiTrend,
        estimatedEffort,
        roiSummary,
      } as any,
    },
  });

  return NextResponse.json({
    clusters,
    heatmap,
    roiGrade,
    roiTrend,
    estimatedEffort,
    roiSummary,
  });
}

function calculateComplexity(content: string): number {
  const patterns = [
    /\bif\b/g,
    /\belse\b/g,
    /\belseif\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bdo\b/g,
    /\bswitch\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\b&&\b/g,
    /\b\|\|\b/g,
    /\?\s/g,
    /\breturn\b/g,
  ];
  return (
    1 +
    patterns.reduce((count, pattern) => {
      return count + (content.match(pattern)?.length ?? 0);
    }, 0)
  );
}

function findDuplicates(
  files: { path: string; content: string; lines: number }[],
) {
  const duplicates: typeof files = [];
  const seen = new Map<string, string>();

  files.forEach((file) => {
    const signature = file.content.slice(0, 100).replace(/\s+/g, "");
    if (seen.has(signature)) {
      duplicates.push(file);
    } else {
      seen.set(signature, file.path);
    }
  });

  return duplicates;
}
