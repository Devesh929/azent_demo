import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FileText } from "lucide-react";
import { audienceAllows, requireWorkspace } from "@/lib/authz/policy";
import { getViewer } from "@/lib/authz/viewer";
import { db } from "@/lib/supabase/server";
import { AUDIENCE_LABEL } from "@/lib/constants";
import { KV, PageHeader, Panel, Pill } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Library item" };

async function loadVisible(id: string) {
  const v = await getViewer();
  const { data: c } = await db().from("content_items").select("*, profiles!content_items_owner_id_fkey(display_name)").eq("id", id).eq("status", "published").maybeSingle();
  if (!v || !c || !audienceAllows(v, c)) return null;
  return { v, c };
}

async function rate(fd: FormData) {
  "use server";
  const r = await loadVisible(String(fd.get("id")));
  if (!r) return;
  await db().from("content_feedback").upsert({ content_id: r.c.id, user_id: r.v.userId, rating: Number(fd.get("rating")), comment: String(fd.get("comment") ?? "").slice(0, 1000) || null }, { onConflict: "content_id,user_id" });
  revalidatePath(`/portal/library/${r.c.id}`);
}

export default async function LibraryItem({ params }: PageProps<"/portal/library/[id]">) {
  await requireWorkspace();
  const { id } = await params;
  const r = await loadVisible(id);
  if (!r) notFound();
  const { c, v } = r;
  const { data: mine } = await db().from("content_feedback").select("rating").eq("content_id", id).eq("user_id", v.userId).maybeSingle();

  return (
    <>
      <PageHeader title={c.title} back={{ href: "/portal/library", label: "Library" }}
        description={<span className="flex flex-wrap gap-2"><Pill>{c.kind.replace("_", " ")}</Pill><Pill tone={c.audience === "employees" ? "info" : "good"}>{AUDIENCE_LABEL[c.audience as keyof typeof AUDIENCE_LABEL]}</Pill></span>} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <Panel>
          {c.summary && <p className="text-[17px] leading-relaxed text-ink">{c.summary}</p>}
          {c.body && <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-ink-2">{c.body.split(/\n\n+/).map((p: string, i: number) => <p key={i}>{p}</p>)}</div>}
          {c.media_asset_id && <a href={`/api/media/${c.media_asset_id}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2.5 text-[14px] hover:bg-white/[0.09]"><FileText size={16} className="text-accent" /> Open attachment</a>}
        </Panel>
        <div className="space-y-5">
          <Panel title="Details">
            <KV items={[["Owner", (c.profiles as { display_name: string } | null)?.display_name ?? "—"], ["Review due", c.review_due ? formatDate(c.review_due) : "—"], ["Published", formatDate(c.published_at)]]} />
          </Panel>
          <Panel title="Feedback for the owner" description="Feedback loops keep the library accurate.">
            <form action={rate} className="space-y-3">
              <input type="hidden" name="id" value={id} />
              <div className="flex gap-1.5">{[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer"><input type="radio" name="rating" value={n} defaultChecked={mine?.rating === n} className="peer sr-only" /><span className="grid size-9 place-items-center rounded-full bg-surface-2 text-[13px] peer-checked:bg-accent peer-checked:text-accent-ink">{n}</span></label>
              ))}</div>
              <textarea name="comment" placeholder="Out of date? Missing something?" className="min-h-20 w-full rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-3 text-[14px] outline-none ring-1 ring-line focus:ring-accent" />
              <Button size="sm" variant="secondary">Send feedback</Button>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
