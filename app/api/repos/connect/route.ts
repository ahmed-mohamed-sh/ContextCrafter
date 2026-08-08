import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
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
    // تأكد مش موجود already
    const existing = await db.repository.findUnique({
      where: { githubId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Repository already connected" },
        { status: 400 },
      );
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
        status: "READY",
        healthScore: 75,
        aiScore: 70,
        analyzedAt: new Date(),
      },
    });

    return NextResponse.json({ repo });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to connect repository" },
      { status: 500 },
    );
  }
}
