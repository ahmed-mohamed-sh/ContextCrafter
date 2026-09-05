import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function KnowledgeGraphPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const firstRepo = await db.repository.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });

  if (firstRepo) {
    redirect(`/dashboard/repositories/${firstRepo.id}/knowledge-graph`);
  }

  redirect("/dashboard");
}
