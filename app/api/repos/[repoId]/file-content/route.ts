import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserOctokit } from "@/lib/github";

export async function GET(
  req: Request,
  { params }: { params: { repoId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { repoId } = await params;
    const url = new URL(req.url);
    const path = url.searchParams.get("path");

    if (!path) {
      return new NextResponse("Path is required", { status: 400 });
    }

    // Verify repository ownership
    const repo = await db.repository.findUnique({
      where: {
        id: repoId,
        userId: session.user.id,
      },
    });

    if (!repo) {
      return new NextResponse("Repository not found", { status: 404 });
    }

    try {
      const octokit = await getUserOctokit(session.user.id);
      const [owner, repoName] = repo.fullName.split("/");

      const response = await octokit.repos.getContent({
        owner,
        repo: repoName,
        path: path,
      });

      if (Array.isArray(response.data)) {
        return new NextResponse("Cannot fetch directory content", { status: 400 });
      }

      if (response.data.type === "file" && "content" in response.data) {
        const content = Buffer.from(response.data.content, "base64").toString("utf-8");
        return NextResponse.json({ content });
      }

      return new NextResponse("Invalid file content", { status: 400 });
    } catch (e) {
      console.error("Github fetch error:", e);
      return new NextResponse("Failed to fetch file from GitHub", { status: 500 });
    }
  } catch (error) {
    console.error("[FILE_CONTENT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
