import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import DocumentationClient from "./DocumentionClient";
import { getUserOctokit } from "@/lib/github";

export default async function DocumentationPage({
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

  if (!repo) redirect("/dashboard");

  return (
    <DocumentationClient
      repo={{
        id: repo.id,
        name: repo.name,
        fullName: repo.fullName,
        language: repo.language,
        totalFiles: repo.totalFiles,
        totalAPIs: repo.totalAPIs,
      }}
      files={repo.files.map((f) => f.path)}
    />
  );
}
