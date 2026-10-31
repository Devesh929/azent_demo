import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";
import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/authz/policy";
import { engineBySlug } from "@/lib/playground";
import { canUseEngine } from "@/lib/data/portal";
import { audit } from "@/lib/audit";
import { PageHeader, Pill } from "@/components/portal/ui";
import { PlaygroundRunner } from "@/components/portal/PlaygroundRunner";

export const metadata: Metadata = { title: "Playground" };

export default async function EnginePage({ params }: PageProps<"/portal/playground/[slug]">) {
  const v = await requireWorkspace();
  const { slug } = await params;
  const engine = engineBySlug(slug);
  // Knowing the URL is not enough: entitlement and internal-only checks run here too.
  if (!engine || !(await canUseEngine(v, engine))) {
    await audit(v, "playground.denied", "engine", slug, {}, v.active.orgId);
    notFound();
  }
  return (
    <>
      <PageHeader icon={FlaskConical} title={engine.name} back={{ href: "/portal/playground", label: "Playground" }}
        description={<span className="flex flex-wrap items-center gap-2"><Pill tone="warn">Synthetic data</Pill><Pill tone="warn">Simulated output</Pill> A sandbox recommendation is never an approved credit or business decision.</span>} />
      <PlaygroundRunner slug={engine.slug} params={engine.params} scenarios={engine.scenarios} />
    </>
  );
}
