import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ArchitectureClient from "../repositories/[repoId]/architecture/ArchitectureClient";

export default async function ArchitecturePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      repositories: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user || user.repositories.length === 0) {
    redirect("/dashboard");
  }

  const repo = user.repositories[0];

  // Mock architecture data for now
  const architecture = {
    services: [
      {
        name: "Core Engine",
        icon: "memory",
        color: "primary",
        count: 12,
        files: ["main.go"],
        tech: "Go v1.21",
      },
      {
        name: "Analyzer Service",
        icon: "analytics",
        color: "tertiary",
        count: 5,
        files: ["analyze.py"],
        tech: "Python 3.10",
      },
      {
        name: "Auth Service",
        icon: "vpn_key",
        color: "secondary",
        count: 8,
        files: ["auth.ts"],
        tech: "Node.js",
      },
    ],
    languages: [
      { name: "TypeScript", count: 120, percentage: 65 },
      { name: "Go", count: 45, percentage: 25 },
      { name: "Python", count: 18, percentage: 10 },
    ],
    totalFiles: repo.totalFiles || 0,
  };

  return (
    <ArchitectureClient
      repo={{
        id: repo.id,
        name: repo.name,
        fullName: repo.fullName,
        language: repo.language,
        totalFiles: repo.totalFiles || 0,
        totalComponents: repo.totalComponents || 0,
        totalAPIs: repo.totalAPIs || 0,
        totalModels: repo.totalModels || 0,
        healthScore: repo.healthScore || 0,
      }}
      architecture={architecture}
    />
  );
}
