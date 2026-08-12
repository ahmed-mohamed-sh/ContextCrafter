import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserOctokit } from "@/lib/github";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> },
) {
  const { repoId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { files: selectedPaths } = await req.json();

  const repo = await db.repository.findUnique({
    where: { id: repoId, userId: session.user.id },
  });

  if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const octokit = await getUserOctokit(session.user.id);
  const [owner, repoName] = repo.fullName.split("/");

  const fileContents: { path: string; content: string }[] = [];

  for (const path of selectedPaths.slice(0, 5)) {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo: repoName,
        path,
      });
      if ("content" in data) {
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        fileContents.push({ path, content: content.slice(0, 800) });
      }
    } catch {
      continue;
    }
  }

  const prompt = `You are a senior code reviewer. Analyze this code and return ONLY JSON.

Files:
${fileContents.map((f) => `// ${f.path}\n${f.content}`).join("\n\n---\n\n")}

Return this exact JSON:
{
  "security": { "score": <0-100>, "severity": "<low|medium|high>", "issues": ["<attack name only e.g: SQL Injection, XSS, CSRF>"] },
  "performance": { "score": <0-100>, "issues": ["<issue>"] },
  "architecture": { "score": <0-100>, "adherence": <0-100>, "patterns": ["<pattern>"] },
  "maintainability": { "grade": "<A|B|C|D>", "issues": ["<issue>"] },
  "suggestions": [{ "type": "<security|performance|architecture|maintainability>", "title": "<title>", "description": "<description>", "file": "<filename>", "before": "<code>", "after": "<code>" }]
}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1500,
  });

  const text = completion.choices[0]?.message?.content ?? "";
  const json = text.replace(/```json|```/g, "").trim();
  const review = JSON.parse(json);

  review.analyzedFiles = fileContents.map((f) => f.path);

  await db.repository.update({
    where: { id: repoId },
    data: {
      aiReview: review,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({ review });
}
