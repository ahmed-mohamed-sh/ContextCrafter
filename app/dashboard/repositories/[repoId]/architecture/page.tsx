import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ArchitectureClient from "@/app/dashboard/repositories/[repoId]/architecture/ArchitectureClient";

export default async function ArchitecturePage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const repo = await db.repository.findUnique({
    where: { id: repoId, userId: session.user.id },
    include: {
      files: {
        select: { path: true, language: true, extension: true },
      },
    },
  });
  console.log(repo?.files.slice(0, 20).map((f) => f.path));
  if (!repo) redirect("/dashboard");

  // بنا الـ architecture من الـ files
  const architecture = buildArchitecture(repo.files);

  return (
    <ArchitectureClient
      repo={{
        id: repo.id,
        name: repo.name,
        fullName: repo.fullName,
        language: repo.language,
        totalFiles: repo.totalFiles,
        totalComponents: repo.totalComponents,
        totalAPIs: repo.totalAPIs,
        totalModels: repo.totalModels,
        healthScore: repo.healthScore,
      }}
      architecture={architecture}
    />
  );
}

function buildArchitecture(
  files: { path: string; language: string | null; extension: string | null }[],
) {
  const layers = {
    frontend: files.filter(
      (f) =>
        f.path.includes("component") ||
        f.path.includes("Component") ||
        f.path.includes("pages/") ||
        f.path.includes("app/") ||
        f.path.includes("views/") ||
        f.path.includes("ui/"),
    ),
    api: files.filter(
      (f) =>
        f.path.includes("/api/") ||
        f.path.includes("route") ||
        f.path.includes("controller") ||
        f.path.includes("handler"),
    ),
    services: files.filter(
      (f) =>
        f.path.includes("service") ||
        f.path.includes("Service") ||
        f.path.includes("lib/") ||
        f.path.includes("utils/") ||
        f.path.includes("helpers/"),
    ),
    database: files.filter(
      (f) =>
        f.path.includes("model") ||
        f.path.includes("schema") ||
        f.path.includes("prisma") ||
        f.path.includes("migration") ||
        f.path.includes("repository"),
    ),
    config: files.filter(
      (f) =>
        f.path.includes("config") ||
        f.path.includes(".env") ||
        f.path.includes("docker") ||
        f.path.includes("ci/"),
    ),
  };

  // Language distribution
  const langCount: Record<string, number> = {};
  files.forEach((f) => {
    if (f.language) {
      langCount[f.language] = (langCount[f.language] ?? 0) + 1;
    }
  });

  const totalLangFiles = Object.values(langCount).reduce((a, b) => a + b, 0);
  const languages = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalLangFiles) * 100),
    }));

  // Services detected
  const services = [
    {
      name: "Frontend",
      icon: "web",
      color: "#c3c0ff",
      count: layers.frontend.length,
      files: layers.frontend.slice(0, 5).map((f) => f.path),
      tech: detectTech(layers.frontend),
    },
    {
      name: "API Layer",
      icon: "api",
      color: "#4cd7f6",
      count: layers.api.length,
      files: layers.api.slice(0, 5).map((f) => f.path),
      tech: detectTech(layers.api),
    },
    {
      name: "Services",
      icon: "memory",
      color: "#ddb7ff",
      count: layers.services.length,
      files: layers.services.slice(0, 5).map((f) => f.path),
      tech: detectTech(layers.services),
    },
    {
      name: "Database",
      icon: "database",
      color: "#93e8ff",
      count: layers.database.length,
      files: layers.database.slice(0, 5).map((f) => f.path),
      tech: detectTech(layers.database),
    },
  ].filter((s) => s.count > 0);

  return { layers, languages, services, totalFiles: files.length };
}

function detectTech(
  files: { path: string; language: string | null }[],
): string {
  const paths = files.map((f) => f.path).join(" ");
  if (paths.includes("next")) return "Next.js";
  if (paths.includes("react")) return "React";
  if (paths.includes("vue")) return "Vue";
  if (paths.includes("prisma")) return "Prisma";
  if (paths.includes("fastapi")) return "FastAPI";
  if (paths.includes("express")) return "Express";
  const lang = files[0]?.language;
  return lang ?? "Unknown";
}
