import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // User & Repositories
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      repositories: {
        orderBy: { updatedAt: "desc" },
        take: 8,
      },
    },
  });

  if (!user) redirect("/login");

  // Stats
  const totalRepos = await db.repository.count({
    where: { userId: user.id },
  });

  const totalFiles = await db.repository.aggregate({
    where: { userId: user.id },
    _sum: { totalFiles: true },
  });

  const readyRepos = await db.repository.count({
    where: { userId: user.id, status: "READY" },
  });

  // Calculate average health & AI score across repositories
  const avgHealthScore =
    user.repositories.length > 0
      ? Math.round(
          user.repositories.reduce((acc, r) => acc + (r.healthScore || 0), 0) /
            user.repositories.length,
        )
      : 0;

  const avgAiScore =
    user.repositories.length > 0
      ? Math.round(
          user.repositories.reduce((acc, r) => acc + (r.aiScore || 0), 0) /
            user.repositories.length,
        )
      : 0;

  // Language distribution
  let languageStats: { name: string; count: number; percentage: number }[] = [];
  try {
    const rawLanguages = await db.repoFile.groupBy({
      by: ["language"],
      where: {
        repository: { userId: user.id },
        language: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const totalLangFiles = rawLanguages.reduce((sum, item) => sum + item._count.id, 0);

    languageStats = rawLanguages
      .filter((l) => l.language)
      .map((l) => ({
        name: l.language as string,
        count: l._count.id,
        percentage: totalLangFiles > 0 ? Math.round((l._count.id / totalLangFiles) * 100) : 0,
      }));
  } catch (err) {
    console.error("Failed to query language stats:", err);
  }

  // If no file languages found, fallback to repository primary languages
  if (languageStats.length === 0 && user.repositories.length > 0) {
    const langCounts: Record<string, number> = {};
    for (const repo of user.repositories) {
      if (repo.language) {
        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
      }
    }
    const totalLang = Object.values(langCounts).reduce((a, b) => a + b, 0);
    languageStats = Object.entries(langCounts).map(([name, count]) => ({
      name,
      count,
      percentage: totalLang > 0 ? Math.round((count / totalLang) * 100) : 0,
    }));
  }

  // AI Insights
  const recentDecisions = await db.decision.findMany({
    where: { repository: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { repository: { select: { id: true, name: true } } },
  });

  // Recent Activities
  const recentChatSessions = await db.chatSession.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 3,
    include: { repository: { select: { id: true, name: true } } },
  });

  const recentConventions = await db.convention.findMany({
    where: { repository: { userId: user.id } },
    take: 2,
    include: { repository: { select: { id: true, name: true } } },
  });

  interface ActivityItem {
    id: string;
    type: "review" | "chat" | "convention" | "connect";
    title: string;
    description: string;
    repoId: string;
    repoName: string;
    timestamp: string;
  }

  const activities: ActivityItem[] = [];

  for (const session of recentChatSessions) {
    activities.push({
      id: `chat-${session.id}`,
      type: "chat",
      title: "AI Chat Interaction",
      description: session.title || "Codebase conversation & architecture query",
      repoId: session.repository.id,
      repoName: session.repository.name,
      timestamp: session.updatedAt.toISOString(),
    });
  }

  for (const conv of recentConventions) {
    activities.push({
      id: `conv-${conv.id}`,
      type: "convention",
      title: "Coding Convention Extracted",
      description: conv.rule,
      repoId: conv.repository.id,
      repoName: conv.repository.name,
      timestamp: new Date().toISOString(),
    });
  }

  for (const repo of user.repositories) {
    if (repo.reviewedAt) {
      activities.push({
        id: `review-${repo.id}`,
        type: "review",
        title: "Code Quality Assessment",
        description: `Automated analysis completed with health score ${repo.healthScore}%`,
        repoId: repo.id,
        repoName: repo.name,
        timestamp: repo.reviewedAt.toISOString(),
      });
    } else {
      activities.push({
        id: `connect-${repo.id}`,
        type: "connect",
        title: "Repository Synced",
        description: `Connected with ${repo.totalFiles} files indexed`,
        repoId: repo.id,
        repoName: repo.name,
        timestamp: repo.createdAt.toISOString(),
      });
    }
  }

  // Sort activities by timestamp desc
  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <DashboardClient
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
      }}
      stats={{
        totalRepos,
        totalFiles: totalFiles._sum.totalFiles ?? 0,
        readyRepos,
        healthScore: avgHealthScore,
        aiScore: avgAiScore,
      }}
      recentRepos={user.repositories.map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.fullName,
        language: r.language,
        status: r.status,
        healthScore: r.healthScore,
        aiScore: r.aiScore,
        totalFiles: r.totalFiles,
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
        updatedAt: r.updatedAt.toISOString(),
      }))}
      recentInsights={recentDecisions.map((d) => ({
        id: d.id,
        title: d.title,
        context: d.context,
        tags: d.tags,
        repository: { id: d.repository.id, name: d.repository.name },
      }))}
      languages={languageStats}
      activities={activities.slice(0, 5)}
    />
  );
}
