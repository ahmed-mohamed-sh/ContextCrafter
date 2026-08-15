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

  const { docType, tone, target, includeCode } = await req.json();

  const repo = await db.repository.findUnique({
    where: { id: repoId, userId: session.user.id },
    include: {
      files: { select: { path: true, language: true, extension: true } },
    },
  });

  if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let fileContents: { path: string; content: string }[] = [];
  try {
    const octokit = await getUserOctokit(session.user.id);
    const [owner, repoName] = repo.fullName.split("/");

    const relevantFiles = repo.files
      .filter((f) =>
        ["ts", "tsx", "js", "jsx", "py", "go", "md"].includes(
          f.extension ?? "",
        ),
      )
      .slice(0, 5);

    for (const file of relevantFiles) {
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
            content: content.slice(0, 600),
          });
        }
      } catch {
        continue;
      }
    }
  } catch {}

  const docTypePrompts: Record<string, string> = {
    readme: `Generate a professional README.md for the repository "${repo.name}".`,
    architecture: `Generate an Architecture documentation for "${repo.name}" describing the system design.`,
    api: `Generate an API Reference documentation for "${repo.name}" listing all endpoints.`,
    schema: `Generate a Database Schema documentation for "${repo.name}".`,
    sequence: `Generate Mermaid.js sequence diagrams for the main flows in "${repo.name}".`,
  };

  const tonePrompts: Record<string, string> = {
    technical: "Use technical language with code examples.",
    executive:
      "Use high-level, non-technical language suitable for executives.",
    tutorial: "Use a friendly, tutorial-style conversational tone.",
  };

  const prompt = `${docTypePrompts[docType] ?? docTypePrompts.readme}

Repository info:
- Name: ${repo.name}
- Language: ${repo.language ?? "Unknown"}
- Total files: ${repo.totalFiles}
- Target audience: ${target}
- ${tonePrompts[tone] ?? tonePrompts.technical}
${includeCode ? "Include relevant code snippets where appropriate." : "Do not include code snippets."}

${fileContents.length > 0 ? `Files context:\n${fileContents.map((f) => `// ${f.path}\n${f.content}`).join("\n\n---\n\n")}` : ""}

Generate the documentation now. Return only the documentation content, no extra explanation.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000,
  });

  const content = completion.choices[0]?.message?.content ?? "";

  return NextResponse.json({ content });
}
