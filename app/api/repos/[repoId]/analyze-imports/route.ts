import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserOctokit } from "@/lib/github";
import { NextResponse } from "next/server";

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
      files: {
        select: { id: true, path: true, extension: true },
      },
    },
  });

  if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const octokit = await getUserOctokit(session.user.id);
  const [owner, repoName] = repo.fullName.split("/");

  await db.fileConnection.deleteMany({
    where: { fromFile: { repositoryId: repoId } },
  });

  const codeFiles = repo.files
    .filter((f) =>
      ["ts", "tsx", "js", "jsx", "py", "go"].includes(f.extension ?? ""),
    )
    .slice(0, 50);

  const pathToId: Record<string, string> = {};
  repo.files.forEach((f) => {
    pathToId[f.path] = f.id;
  });

  let connections = 0;

  for (const file of codeFiles) {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo: repoName,
        path: file.path,
      });

      if (!("content" in data)) continue;

      const content = Buffer.from(data.content, "base64").toString("utf-8");

      const imports = extractImports(content, file.path, file.extension ?? "");

      for (const importPath of imports) {
        const targetFile = findTargetFile(importPath, file.path, repo.files);
        if (!targetFile) continue;

        try {
          await db.fileConnection.create({
            data: {
              fromFileId: file.id,
              toFileId: targetFile.id,
              type: "import",
            },
          });
          connections++;
        } catch {
          // skip duplicates
        }
      }
    } catch {
      continue;
    }
  }

  return NextResponse.json({ connections, files: codeFiles.length });
}

function extractImports(
  content: string,
  filePath: string,
  ext: string,
): string[] {
  const imports: string[] = [];

  if (["ts", "tsx", "js", "jsx"].includes(ext)) {
    // ES imports: import x from './path'
    const esImports = content.matchAll(/from\s+['"]([^'"]+)['"]/g);
    for (const match of esImports) {
      imports.push(match[1]);
    }
    // require: require('./path')
    const requires = content.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
    for (const match of requires) {
      imports.push(match[1]);
    }
  }

  if (ext === "py") {
    // from x import y
    const pyImports = content.matchAll(/from\s+([\w.]+)\s+import/g);
    for (const match of pyImports) {
      imports.push(match[1].replace(/\./g, "/"));
    }
    // import x
    const pyImports2 = content.matchAll(/^import\s+([\w.]+)/gm);
    for (const match of pyImports2) {
      imports.push(match[1].replace(/\./g, "/"));
    }
  }

  if (ext === "go") {
    const goImports = content.matchAll(/"([^"]+)"/g);
    for (const match of goImports) {
      if (match[1].includes("/")) imports.push(match[1]);
    }
  }

  return imports.filter(
    (i) => i.startsWith(".") || i.startsWith("@/") || i.startsWith("~/"),
  );
}

function findTargetFile(
  importPath: string,
  currentFilePath: string,
  files: { id: string; path: string }[],
): { id: string; path: string } | null {
  const currentDir = currentFilePath.split("/").slice(0, -1).join("/");

  let resolvedPath = importPath;

  if (importPath.startsWith("./") || importPath.startsWith("../")) {
    const parts = (currentDir + "/" + importPath).split("/");
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === "..") resolved.pop();
      else if (part !== ".") resolved.push(part);
    }
    resolvedPath = resolved.join("/");
  } else if (importPath.startsWith("@/")) {
    resolvedPath = "src/" + importPath.slice(2);
  }

  const extensions = ["ts", "tsx", "js", "jsx", "py", "go"];
  for (const ext of extensions) {
    const withExt = `${resolvedPath}.${ext}`;
    const found = files.find(
      (f) => f.path === withExt || f.path.endsWith(withExt),
    );
    if (found) return found;
  }

  const found = files.find(
    (f) =>
      f.path === resolvedPath || f.path.startsWith(resolvedPath + "/index"),
  );

  return found ?? null;
}
