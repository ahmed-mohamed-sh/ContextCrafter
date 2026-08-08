import { Octokit } from "@octokit/rest";
import { db } from "./db";

export async function getUserOctokit(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { githubToken: true },
  });

  if (!user?.githubToken) throw new Error("No GitHub token found");

  return new Octokit({ auth: user.githubToken });
}

export async function fetchUserRepos(userId: string) {
  const octokit = await getUserOctokit(userId);

  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 50,
    type: "all",
  });

  return data.map((repo) => ({
    githubId: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    url: repo.html_url,
    private: repo.private,
    language: repo.language,
    stars: repo.stargazers_count,
    updatedAt: repo.updated_at,
  }));
}
