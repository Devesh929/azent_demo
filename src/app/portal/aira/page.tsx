import type { Metadata } from "next";
import { Bot } from "lucide-react";
import { inEmployeeWorkspace, requireWorkspace } from "@/lib/authz/policy";
import { PageHeader } from "@/components/portal/ui";
import { AiraChat } from "@/components/portal/AiraChat";

export const metadata: Metadata = { title: "AIRA" };

export default async function AiraPage() {
  const v = await requireWorkspace();
  const suggestions = inEmployeeWorkspace(v)
    ? ["What are clients saying about seasonality?", "Summarise the prompt guidance for evidence-cited answers", "What is the status of the seasonality idea?"]
    : ["What are clients saying about seasonality?", "How does withdrawal work?", "What changed in Workbench 3.2?"];
  return (
    <>
      <PageHeader icon={Bot} title="Ask AIRA" description={`Answers draw only on what your ${v.active.orgKind === "internal" ? "employee" : "client"} workspace can open, with numbered citations.`} />
      <AiraChat suggestions={suggestions} />
    </>
  );
}
