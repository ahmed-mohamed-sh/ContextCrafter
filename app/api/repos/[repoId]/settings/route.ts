import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { repoId } = await params;
    const body = await req.json();

    const repo = await db.repository.findUnique({
      where: { id: repoId, userId: session.user.id },
    });

    if (!repo) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    const updated = await db.repository.update({
      where: { id: repoId },
      data: {
        ...(body.branch !== undefined ? { branch: body.branch } : {}),
        ...(body.autoSync !== undefined ? { autoSync: body.autoSync } : {}),
        ...(body.excludedPaths !== undefined ? { excludedPaths: body.excludedPaths } : {}),
      },
    });

    return NextResponse.json({ success: true, repo: updated });
  } catch (error: any) {
    console.error("[REPO_SETTINGS_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update repository settings" },
      { status: 500 }
    );
  }
}
