import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import CodeReviewClient from "./CodeReviewClient";
import Groq from "groq-sdk";
import { getUserOctokit } from "@/lib/github";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export default async function CodeReviewPage({
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

  let fileContents: { path: string; content: string }[] = [];

  try {
    const octokit = await getUserOctokit(session.user.id);
    const [owner, repoName] = repo.fullName.split("/");

    const reviewableFiles = repo.files
      .filter((f) =>
        ["ts", "tsx", "js", "jsx", "py", "go"].includes(f.extension ?? ""),
      )
      .slice(0, 5);

    for (const file of reviewableFiles) {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo: repoName,
          path: file.path,
        });
        if ("content" in data) {
          const content = Buffer.from(data.content, "base64").toString("utf-8");
          fileContents.push({
            path: file.path,
            content: content.slice(0, 800),
          });
        }
      } catch {
        continue;
      }
    }
  } catch {}

  // AI Review
  let review = {
    security: { score: 65, issues: ["XSS Vulnerability", "CSRF Token Missing"], severity: "high" },
    performance: { score: 80, issues: [] as string[] },
    architecture: { score: 90, adherence: 85, patterns: [] as string[] },
    maintainability: { grade: "B", issues: [] as string[] },
    suggestions: [] as {
      type: string;
      title: string;
      description: string;
      file: string;
      before: string;
      after: string;
    }[],
  };

  if (fileContents.length > 0) {
    try {
      const prompt = `You are a senior code reviewer. Analyze this code and return ONLY a JSON object.

Files:
${fileContents.map((f) => `// ${f.path}\n${f.content}`).join("\n\n---\n\n")}

Return this exact JSON structure:
{
  "security": {
    "score": <0-100>,
    "severity": "<low|medium|high>",
    "issues": ["<issue1>", "<issue2>"]
  },
  "performance": {
    "score": <0-100>,
    "issues": ["<issue1>"]
  },
  "architecture": {
    "score": <0-100>,
    "adherence": <0-100>,
    "patterns": ["<pattern1>"]
  },
  "maintainability": {
    "grade": "<A|B|C|D>",
    "issues": ["<issue1>"]
  },
  "suggestions": [
    {
      "type": "<security|performance|architecture|maintainability>",
      "title": "<title>",
      "description": "<description>",
      "file": "<filename>",
      "before": "<problematic code snippet>",
      "after": "<improved code snippet>"
    }
  ]
}`;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
      });

      const text = completion.choices[0]?.message?.content ?? "";
      const json = text.replace(/```json|```/g, "").trim();
      review = JSON.parse(json);
    } catch {}
  }
  if (repo.aiReview && repo.reviewedAt) {
    const savedReview = repo.aiReview as any;
    return (
      <CodeReviewClient
        repo={{ id: repo.id, name: repo.name, fullName: repo.fullName }}
        review={review}
        filesAnalyzed={fileContents.length}
        analyzedFiles={fileContents.map((f) => f.path)}
        allFiles={repo.files.map((f) => f.path)}
      />
    );
  }
}
