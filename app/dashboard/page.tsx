import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Octokit } from "@octokit/rest";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // User من الـ database
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      repositories: {
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) redirect("/login");

  // Stats من الـ database
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

  // AI Insights من الـ database
  const recentDecisions = await db.decision.findMany({
    where: { repository: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { repository: { select: { name: true } } },
  });

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
        healthScore: user.repositories[0]?.healthScore ?? 0,
        aiScore: user.repositories[0]?.aiScore ?? 0,
      }}
      recentRepos={user.repositories}
      recentInsights={recentDecisions}
    />
  );
}
