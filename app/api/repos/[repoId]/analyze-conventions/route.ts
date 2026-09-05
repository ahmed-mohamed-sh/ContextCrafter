import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserOctokit } from "@/lib/github";
import { NextResponse } from "next/server";
import { generateAICompletion } from "@/lib/ai";

type Convention = {
  type: "naming" | "structure" | "pattern";
  rule: string;
  examples: string[];
  violations: string[];
};

type FileEvidence = {
  path: string;
  content: string;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> },
) {
  const { repoId } = await params;

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repo = await db.repository.findUnique({
    where: {
      id: repoId,
      userId: session.user.id,
    },
    include: {
      files: {
        select: {
          id: true,
          path: true,
          extension: true,
        },
      },
    },
  });

  if (!repo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  /*
   * Remove previous analysis.
   */
  await db.convention.deleteMany({
    where: {
      repositoryId: repoId,
    },
  });

  const octokit = await getUserOctokit(session.user.id);

  const [owner, repoName] = repo.fullName.split("/");

  /*
   * Only analyze source files that can contain useful
   * coding conventions.
   */
  const allowedExtensions = [
    "ts",
    "tsx",
    "js",
    "jsx",
    "py",
    "go",
    "rs",
    "java",
    "css",
    "scss",
  ];

  const relevantFiles = repo.files.filter((file) =>
    allowedExtensions.includes(file.extension ?? ""),
  );

  /*
   * Limit the amount of source code sent to the model.
   *
   * We fetch more files for static analysis but cap
   * what we send to the AI to stay within token limits.
   */
  const filesToAnalyze = relevantFiles.slice(0, 30);

  const fileEvidence: FileEvidence[] = [];

  /*
   * Fetch actual source code from GitHub.
   */
  for (const file of filesToAnalyze) {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo: repoName,
        path: file.path,
      });

      if (!("content" in data)) {
        continue;
      }

      const content = Buffer.from(data.content, "base64").toString("utf-8");

      if (!content.trim()) {
        continue;
      }

      fileEvidence.push({
        path: file.path,
        content: content.slice(0, 5000),
      });
    } catch (error) {
      console.error(`Failed to read ${file.path}:`, error);
    }
  }

  /*
   * Detect conventions directly from file paths and
   * source code without AI.
   */
  const staticConventions = analyzeStaticConventions(fileEvidence);

  /*
   * Build a trimmed evidence payload for the AI call.
   *
   * The Groq free tier caps ALL models at 8,000 TPM.
   * Budget: ~300 tok prompt + ~3,000 tok evidence +
   * 1,500 tok max_tokens = ~4,800 tokens total.
   */
  const MAX_EVIDENCE_CHARS = 12_000;
  const MAX_CHARS_PER_FILE = 1_200;

  let aiConventions: Convention[] = [];

  try {
    const aiEvidence: string[] = [];
    let totalChars = 0;

    for (const file of fileEvidence) {
      const snippet = file.content.slice(0, MAX_CHARS_PER_FILE);
      const entry = `[FILE: ${file.path}]\n${snippet}`;

      if (totalChars + entry.length > MAX_EVIDENCE_CHARS) {
        break;
      }

      aiEvidence.push(entry);
      totalChars += entry.length;
    }

    const evidenceText = aiEvidence.join("\n\n====================\n\n");

    const prompt = `
You are analyzing a software repository.

Your task is to identify ONLY coding conventions that are
actually supported by the provided repository evidence.

Do NOT invent conventions.

A convention is valid only when the provided files contain
multiple pieces of evidence or one very explicit example.

You may identify conventions about:

- component naming
- hook naming
- file naming
- folder structure
- exports
- imports
- React patterns
- "use client"
- styling
- utility functions
- API route organization
- TypeScript patterns
- testing patterns
- naming patterns
- common code structure

IMPORTANT:

1. Every convention MUST have concrete examples.
2. Examples MUST be exact file paths from the provided files.
3. Do NOT mention files that were not provided.
4. Do NOT assume framework behavior.
5. Do NOT call something a convention if it appears only once unless it is explicitly obvious.
6. If there is insufficient evidence, do not create the convention.
7. Do not generate explanations outside the JSON.

Return ONLY valid JSON.

Schema:

{
  "conventions": [
    {
      "type": "naming",
      "rule": "Components use PascalCase filenames",
      "examples": [
        "src/components/Hero.tsx",
        "src/components/CTA.tsx"
      ],
      "violations": []
    }
  ]
}

Repository evidence:

${evidenceText}
`;

    const completion = await generateAICompletion({
      userId: session.user.id,
      messages: [
        {
          role: "system",
          content: "Return valid JSON only. Never use markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      maxTokens: 1500,
    });

    const text = completion.content || "";

    aiConventions = parseAIConventions(text);
  } catch (error) {
    console.error("AI convention analysis failed:", error);
  }

  /*
   * Merge static + AI conventions.
   */
  const allConventions = deduplicateConventions([
    ...staticConventions,
    ...aiConventions,
  ]);

  /*
   * Save conventions.
   */
  for (const convention of allConventions.slice(0, 30)) {
    await db.convention.create({
      data: {
        repositoryId: repoId,
        type: convention.type,
        rule: convention.rule,
        examples: convention.examples,
        violations: convention.violations,
      },
    });
  }

  return NextResponse.json({
    conventions: allConventions.length,
    filesAnalyzed: fileEvidence.length,
  });
}

/*
 * ---------------------------------------------------------
 * STATIC ANALYSIS
 * ---------------------------------------------------------
 */

function analyzeStaticConventions(files: FileEvidence[]): Convention[] {
  const conventions: Convention[] = [];

  /*
   * React component filenames.
   */
  const reactFiles = files.filter((file) => /\.(tsx|jsx)$/.test(file.path));

  const pascalComponents = reactFiles.filter((file) => {
    const name = file.path.split("/").pop() ?? "";

    return /^[A-Z][A-Za-z0-9]*\.(tsx|jsx)$/.test(name);
  });

  if (pascalComponents.length >= 2) {
    conventions.push({
      type: "naming",
      rule: "React component files use PascalCase.",
      examples: pascalComponents.slice(0, 5).map((file) => file.path),
      violations: [],
    });
  }

  /*
   * Custom hooks.
   */
  const hooks = files.filter((file) => {
    const name = file.path.split("/").pop() ?? "";

    return /^use[A-Z][A-Za-z0-9]*\.(ts|tsx|js|jsx)$/.test(name);
  });

  if (hooks.length >= 1) {
    conventions.push({
      type: "naming",
      rule: "Custom hooks use the 'use' prefix followed by PascalCase.",
      examples: hooks.slice(0, 5).map((file) => file.path),
      violations: [],
    });
  }

  /*
   * "use client"
   */
  const clientComponents = files.filter((file) =>
    file.content.trimStart().startsWith('"use client"'),
  );

  if (clientComponents.length >= 1) {
    conventions.push({
      type: "pattern",
      rule: 'Client-side components explicitly use the "use client" directive.',
      examples: clientComponents.slice(0, 5).map((file) => file.path),
      violations: [],
    });
  }

  /*
   * cn utility.
   */
  const cnFiles = files.filter(
    (file) =>
      file.content.includes('from "@/lib/utils"') &&
      file.content.includes("cn("),
  );

  if (cnFiles.length >= 2) {
    conventions.push({
      type: "pattern",
      rule: "Components use the cn utility for composing class names.",
      examples: cnFiles.slice(0, 5).map((file) => file.path),
      violations: [],
    });
  }

  /*
   * Default React exports.
   */
  const defaultExportFiles = files.filter((file) =>
    /export\s+default/.test(file.content),
  );

  if (defaultExportFiles.length >= 2) {
    conventions.push({
      type: "pattern",
      rule: "Components commonly use default exports.",
      examples: defaultExportFiles.slice(0, 5).map((file) => file.path),
      violations: [],
    });
  }

  /*
   * Next.js API route structure.
   */
  const apiRoutes = files.filter((file) =>
    /\/api\/.+\/route\.(ts|js)$/.test(file.path),
  );

  if (apiRoutes.length >= 1) {
    conventions.push({
      type: "structure",
      rule: "API endpoints are organized using route.ts files under src/app/api.",
      examples: apiRoutes.slice(0, 5).map((file) => file.path),
      violations: [],
    });
  }

  /*
   * Test naming.
   */
  const testFiles = files.filter((file) =>
    /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(file.path),
  );

  if (testFiles.length >= 1) {
    conventions.push({
      type: "pattern",
      rule: "Test files use .test or .spec suffixes.",
      examples: testFiles.slice(0, 5).map((file) => file.path),
      violations: [],
    });
  }

  return conventions;
}

/*
 * ---------------------------------------------------------
 * SAFE AI JSON PARSER
 * ---------------------------------------------------------
 */

function parseAIConventions(text: string): Convention[] {
  try {
    let cleaned = text.trim();

    /*
     * Remove markdown fences if the model returns them.
     */
    cleaned = cleaned
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    /*
     * Extract the JSON object if the model added
     * extra text around it.
     */
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
      return [];
    }

    cleaned = cleaned.slice(start, end + 1);

    const parsed = JSON.parse(cleaned);

    if (!parsed || !Array.isArray(parsed.conventions)) {
      return [];
    }

    return parsed.conventions
      .filter(
        (conv: any) =>
          conv &&
          ["naming", "structure", "pattern"].includes(conv.type) &&
          typeof conv.rule === "string" &&
          Array.isArray(conv.examples) &&
          Array.isArray(conv.violations),
      )
      .map((conv: any) => ({
        type: conv.type,
        rule: conv.rule,
        examples: conv.examples
          .filter((example: unknown) => typeof example === "string")
          .slice(0, 5),
        violations: conv.violations
          .filter((violation: unknown) => typeof violation === "string")
          .slice(0, 5),
      }));
  } catch (error) {
    console.error("Could not parse AI convention JSON:", error);

    return [];
  }
}

/*
 * ---------------------------------------------------------
 * REMOVE DUPLICATES
 * ---------------------------------------------------------
 */

function deduplicateConventions(conventions: Convention[]): Convention[] {
  const map = new Map<string, Convention>();

  for (const convention of conventions) {
    const key = `${convention.type}:${convention.rule}`.toLowerCase().trim();

    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        ...convention,
        examples: [...new Set(convention.examples)],
        violations: [...new Set(convention.violations)],
      });

      continue;
    }

    existing.examples = [
      ...new Set([...existing.examples, ...convention.examples]),
    ].slice(0, 5);

    existing.violations = [
      ...new Set([...existing.violations, ...convention.violations]),
    ].slice(0, 5);
  }

  return Array.from(map.values());
}
