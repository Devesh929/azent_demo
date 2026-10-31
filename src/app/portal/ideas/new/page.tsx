import type { Metadata } from "next";
import { Lightbulb } from "lucide-react";
import { requirePlatformRole } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/portal/ui";
import { NewIdeaForm } from "@/components/portal/IdeaForms";

export const metadata: Metadata = { title: "New improvement idea" };

export default async function NewIdeaPage({ searchParams }: PageProps<"/portal/ideas/new">) {
  await requirePlatformRole("product_owner");
  const { theme } = await searchParams;
  const [{ data: offerings }, { data: themes }, { data: shared }] = await Promise.all([
    db().from("offerings").select("id, name").order("sort"),
    db().from("themes").select("id, title").neq("status", "archived"),
    // Product owners link approved shared copies only.
    db().from("shared_contributions").select("id, title, theme_contributions(theme_id)").eq("status", "published").order("published_at", { ascending: false }),
  ]);
  const evidence = (shared ?? []).map((s) => ({ id: s.id, title: s.title, theme_ids: ((s.theme_contributions ?? []) as { theme_id: string }[]).map((t) => t.theme_id) }));
  return (
    <>
      <PageHeader icon={Lightbulb} title="New improvement idea" back={{ href: "/portal/ideas", label: "Improvement ideas" }} />
      <Panel><NewIdeaForm offerings={offerings ?? []} themes={themes ?? []} evidence={evidence} preTheme={typeof theme === "string" ? theme : undefined} /></Panel>
    </>
  );
}
