import KnowledgeGraphClient from "../repositories/[repoId]/knowledge-graph/KnowledgeGraphClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Knowledge Graph | ContextCrafter",
  description: "Visualize relationships between components in your codebase",
};

export default function KnowledgeGraphPage() {
  return <KnowledgeGraphClient />;
}
