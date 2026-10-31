import type { Metadata } from "next";
import { PenLine } from "lucide-react";
import { requireClient } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/portal/ui";
import { ObservationForm } from "@/components/portal/ObservationForm";

export const metadata: Metadata = { title: "New observation" };

export default async function NewObservationPage() {
  const v = await requireClient();
  const { data: offerings } = await db().from("offerings").select("id, name").order("sort");
  return (
    <>
      <PageHeader icon={PenLine} title="New observation" back={{ href: "/portal/observations", label: "Observations" }}
        description={<>Saved as a private draft in <strong className="text-ink">{v.active.orgName}</strong>. Saving never shares it.</>} />
      <Panel><ObservationForm offerings={offerings ?? []} initial={{ visibility: "private" }} /></Panel>
    </>
  );
}
