import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> },
) {
  const { repoId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { filePath } = await req.json();

  const repo = await db.repository.findUnique({
    where: { id: repoId, userId: session.user.id },
  });

  if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const file = await db.repoFile.findFirst({
    where: { repositoryId: repoId, path: filePath },
  });

  if (!file) return NextResponse.json({ affected: [], depth: 0 });

  const affected = new Set<string>();
  const queue = [file.id];
  const visited = new Set<string>();
  let depth = 0;

  while (queue.length > 0 && depth < 5) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const dependents = await db.fileConnection.findMany({
      where: { toFileId: current },
      include: { fromFile: { select: { id: true, path: true } } },
    });

    for (const dep of dependents) {
      if (!visited.has(dep.fromFileId)) {
        affected.add(dep.fromFile.path);
        queue.push(dep.fromFileId);
      }
    }

    depth++;
  }

  return NextResponse.json({
    affected: Array.from(affected),
    depth,
    filePath,
  });
}
