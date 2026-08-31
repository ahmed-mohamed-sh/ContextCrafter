import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import TechnicalDeptClient from "./TechnicalDeptClient";

export default async function TechnicalDebtPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const repo = await db.repository.findUnique({
    where: { id: repoId, userId: session.user.id },
  });

  if (!repo) redirect("/dashboard");

  // Check if the repository has cached analysis results
  const cached = repo.aiReview as any;
  if (cached?.clusters) {
    return (
      <TechnicalDeptClient
        repo={{ id: repo.id, name: repo.name, fullName: repo.fullName }}
        clusters={cached.clusters}
        heatmap={cached.heatmap}
        roiGrade={cached.roiGrade}
        roiTrend={cached.roiTrend}
        estimatedEffort={cached.estimatedEffort}
        roiSummary={cached.roiSummary}
      />
    );
  }

  // Default empty state
  return (
    <TechnicalDeptClient
      repo={{ id: repo.id, name: repo.name, fullName: repo.fullName }}
      clusters={[]}
      heatmap={Array(4).fill(Array(6).fill({ label: "", severity: "none" }))}
      roiGrade="—"
      roiTrend={0}
      estimatedEffort={0}
      roiSummary="Click 'Rescan Now' to analyze technical debt."
    />
  );
}
