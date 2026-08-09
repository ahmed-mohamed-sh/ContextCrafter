import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserOctokit } from "@/lib/github";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    githubId,
    name,
    fullName,
    description,
    url,
    private: isPrivate,
    language,
    stars,
  } = body;

  try {
    const existing = await db.repository.findUnique({ where: { githubId } });
    if (existing) {
      return NextResponse.json({ error: "Already connected" }, { status: 400 });
    }

    const repo = await db.repository.create({
      data: {
        userId: session.user.id,
        githubId,
        name,
        fullName,
        description,
        url,
        private: isPrivate,
        language,
        stars,
        status: "ANALYZING",
        healthScore: 0,
        aiScore: 0,
      },
    });

    // جيب الـ files من GitHub في الـ background
    analyzeRepo(repo.id, session.user.id, fullName).catch(console.error);

    return NextResponse.json({ repo });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

const extToLang: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  py: "Python",
  go: "Go",
  rs: "Rust",
  java: "Java",
  cpp: "C++",
  cs: "C#",
  rb: "Ruby",
  php: "PHP",
  md: "Markdown",
  json: "JSON",
  css: "CSS",
  html: "HTML",
};

async function analyzeRepo(repoId: string, userId: string, fullName: string) {
  try {
    const octokit = await getUserOctokit(userId);
    const [owner, repoName] = fullName.split("/");

    // جيب الـ file tree
    const { data: tree } = await octokit.git.getTree({
      owner,
      repo: repoName,
      tree_sha: "HEAD",
      recursive: "true",
    });

    const files = tree.tree.filter(
      (f) =>
        f.type === "blob" &&
        f.path &&
        !f.path.includes("node_modules") &&
        !f.path.includes(".git") &&
        !f.path.includes("dist/") &&
        !f.path.includes(".next/"),
    );

    // احسب الـ stats
    const langCount: Record<string, number> = {};
    files.forEach((f) => {
      const ext = f.path?.split(".").pop() ?? "";
      const lang = extToLang[ext];
      if (lang) langCount[lang] = (langCount[lang] ?? 0) + 1;
    });

    const components = files.filter(
      (f) => f.path?.includes("component") || f.path?.includes("Component"),
    ).length;

    const apis = files.filter(
      (f) =>
        f.path?.includes("/api/") ||
        f.path?.includes("route.ts") ||
        f.path?.includes("routes/"),
    ).length;

    const models = files.filter(
      (f) =>
        f.path?.includes("model") ||
        f.path?.includes("schema") ||
        f.path?.includes(".prisma"),
    ).length;

    const hasTests = files.some(
      (f) => f.path?.includes("test") || f.path?.includes("spec"),
    );
    const hasReadme = files.some((f) => f.path?.toLowerCase() === "readme.md");
    const hasDocs = files.some((f) => f.path?.includes("docs/"));

    const healthScore = Math.min(
      100,
      60 + (hasTests ? 15 : 0) + (hasReadme ? 15 : 0) + (hasDocs ? 10 : 0),
    );

    const aiScore = Math.min(100, 60 + Math.floor((files.length / 100) * 40));

    // احفظ الـ files
    if (files.length > 0) {
      await db.repoFile.createMany({
        data: files.slice(0, 500).map((f) => ({
          repositoryId: repoId,
          path: f.path!,
          name: f.path!.split("/").pop()!,
          extension: f.path!.split(".").pop(),
          language: extToLang[f.path!.split(".").pop() ?? ""] ?? null,
        })),
        skipDuplicates: true,
      });
    }

    // update الـ repo
    await db.repository.update({
      where: { id: repoId },
      data: {
        status: "READY",
        analyzedAt: new Date(),
        totalFiles: files.length,
        totalComponents: components,
        totalAPIs: apis,
        totalModels: models,
        healthScore,
        aiScore,
      },
    });
  } catch (error) {
    await db.repository.update({
      where: { id: repoId },
      data: { status: "FAILED" },
    });
    console.error("Analysis failed:", error);
  }
}
