import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { SolutionExplorer } from "@/components/site/SolutionExplorer";
export const metadata: Metadata = { title: "Solutions" };
export default function SolutionsPage() {
  return <><PageIntro title="Built around the way you work." lede="Choose your team. Follow a workflow from its first piece of evidence to a decision someone can stand behind." /><SolutionExplorer /></>;
}
