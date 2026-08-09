import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import DashboardLayoutClient from "./DashboardLayoutClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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

  return (
    <DashboardLayoutClient
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
      }}
      recentRepos={user.repositories}
    >
      {children}
    </DashboardLayoutClient>
  );
}
