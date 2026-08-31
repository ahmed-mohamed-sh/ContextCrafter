import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
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
    select: {
      id: true,
    },
  });

  if (!repo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [embeddingCount, conventionCount] = await Promise.all([
    db.embedding.count({
      where: {
        repositoryId: repoId,
      },
    }),

    db.convention.count({
      where: {
        repositoryId: repoId,
      },
    }),
  ]);

  return NextResponse.json({
    indexed: embeddingCount > 0,
    embeddingCount,

    conventionsLearned: conventionCount > 0,
    conventionCount,
  });
}
