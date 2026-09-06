import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, repos, teamMembers, settings] = await Promise.all([
      db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      db.repository.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          name: true,
          fullName: true,
          status: true,
          healthScore: true,
          aiScore: true,
          reviewedAt: true,
          aiReview: true,
          updatedAt: true,
          createdAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      db.teamMember.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.userSettings.findUnique({
        where: { userId: session.user.id },
      }),
    ]);

    const notifications: any[] = [];

    // 1. Team member invite notifications
    teamMembers.forEach((m) => {
      notifications.push({
        id: `team_${m.id}`,
        type: "team",
        title: m.status === "active" ? "Team member joined" : "Workspace invitation active",
        message: `${m.email} (${m.role}) is ${m.status === "active" ? "active on" : "invited to"} your workspace.`,
        timestamp: m.createdAt,
        unread: m.status === "invited",
        link: `/dashboard`,
        icon: "group",
        color: "#c3c0ff",
      });
    });

    // 2. Repository AI review & security alerts
    repos.forEach((r) => {
      const review = r.aiReview as any;
      if (review?.security?.issues?.length) {
        notifications.push({
          id: `sec_${r.id}`,
          type: "security",
          title: `Security alert in ${r.name}`,
          message: `Found ${review.security.issues.length} potential vulnerability issues: ${review.security.issues.slice(0, 2).join(", ")}.`,
          timestamp: r.reviewedAt || r.updatedAt,
          unread: true,
          link: `/dashboard/repositories/${r.id}/code-review`,
          icon: "security",
          color: "#ff6b6b",
        });
      }

      if (r.reviewedAt) {
        notifications.push({
          id: `review_${r.id}`,
          type: "review",
          title: `AI Code Review completed`,
          message: `Quality score for ${r.name} evaluated. Maintainability grade: ${review?.maintainability?.grade || "A"}.`,
          timestamp: r.reviewedAt,
          unread: false,
          link: `/dashboard/repositories/${r.id}/code-review`,
          icon: "rate_review",
          color: "#4cd7f6",
        });
      }

      // Repository sync notification
      if (r.status === "READY") {
        notifications.push({
          id: `sync_${r.id}`,
          type: "sync",
          title: `Repository index up to date`,
          message: `${r.name} AST knowledge graph and code embeddings are ready.`,
          timestamp: r.updatedAt,
          unread: false,
          link: `/dashboard/repositories/${r.id}`,
          icon: "sync_saved_locally",
          color: "#93e8ff",
        });
      }
    });

    // 3. System welcome / connection notification
    if (notifications.length === 0) {
      notifications.push({
        id: "sys_welcome",
        type: "system",
        title: "Welcome to ContextCrafter",
        message: "Your AI codebase intelligence workspace is initialized and ready.",
        timestamp: user?.createdAt || new Date(),
        unread: false,
        link: `/dashboard`,
        icon: "auto_awesome",
        color: "#a855f7",
      });
    }

    // Sort by newest timestamp
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const unreadCount = notifications.filter((n) => n.unread).length;

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("[NOTIFICATIONS_GET_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load notifications" },
      { status: 500 }
    );
  }
}
