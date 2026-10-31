import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { requirePlatformRole } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { AUDIENCE_LABEL } from "@/lib/constants";
import { PageHeader, Panel, Pill, Tabs } from "@/components/portal/ui";
import { ContentForm, SessionForm, UploadForm } from "@/components/portal/PublisherForms";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Publishing" };

export default async function PublisherPage({ searchParams }: PageProps<"/portal/publisher">) {
  await requirePlatformRole("content_publisher");
  const { tab = "content" } = await searchParams;
  // Publishers manage content, sessions and media only. No identity data, no private learning records.
  const [{ data: orgs }, { data: offerings }, { data: media }, { data: content }, { data: sessions }] = await Promise.all([
    db().from("organizations").select("id, name").eq("kind", "client").order("name"),
    db().from("offerings").select("id, name").order("sort"),
    db().from("media_assets").select("id, title, audience").order("created_at", { ascending: false }),
    db().from("content_items").select("id, kind, title, audience, status, updated_at").order("updated_at", { ascending: false }),
    db().from("live_sessions").select("id, title, kind, audience, status, starts_at").order("starts_at", { ascending: false }),
  ]);
  const mediaOpts = (media ?? []).map((m) => ({ id: m.id, name: `${m.title} (${AUDIENCE_LABEL[m.audience as keyof typeof AUDIENCE_LABEL]})` }));
  const t = String(tab);

  return (
    <>
      <PageHeader icon={Megaphone} title="Publishing" description="Banners, public content, client resources, employee broadcasts, sessions and media. Every item carries an explicit audience that the server enforces on each request." />
      <Tabs active={`/portal/publisher?tab=${t}`} items={[{ href: "/portal/publisher?tab=content", label: "Content", count: content?.length }, { href: "/portal/publisher?tab=sessions", label: "Live & recordings", count: sessions?.length }, { href: "/portal/publisher?tab=media", label: "Media", count: media?.length }]} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Panel title={t === "sessions" ? "Sessions" : t === "media" ? "Media library" : "Content"} pad={false} className="max-h-[760px] overflow-y-auto p-2 scroll-thin">
          <ul>
            {t === "content" && (content ?? []).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 hover:bg-white/[0.07]">
                <span className="min-w-0"><span className="block truncate text-[14px] font-medium">{c.title}</span><span className="text-[12px] text-muted">{c.kind.replace("_", " ")} · {formatDate(c.updated_at)}</span></span>
                <span className="flex shrink-0 gap-1.5"><Pill tone={c.status === "published" ? "good" : "neutral"}>{c.status}</Pill><Pill>{AUDIENCE_LABEL[c.audience as keyof typeof AUDIENCE_LABEL]}</Pill></span>
              </li>
            ))}
            {t === "sessions" && (sessions ?? []).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 hover:bg-white/[0.07]">
                <span className="min-w-0"><span className="block truncate text-[14px] font-medium">{s.title}</span><span className="text-[12px] text-muted">{s.kind} · {formatDateTime(s.starts_at)}</span></span>
                <span className="flex shrink-0 gap-1.5"><Pill tone={s.status === "live" ? "good" : "neutral"}>{s.status}</Pill><Pill>{AUDIENCE_LABEL[s.audience as keyof typeof AUDIENCE_LABEL]}</Pill></span>
              </li>
            ))}
            {t === "media" && (media ?? []).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 hover:bg-white/[0.07]">
                <a href={`/api/media/${m.id}`} className="truncate text-[14px] font-medium hover:text-accent">{m.title}</a>
                <Pill>{AUDIENCE_LABEL[m.audience as keyof typeof AUDIENCE_LABEL]}</Pill>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={t === "sessions" ? "New session" : t === "media" ? "Upload media" : "New content"}>
          {t === "sessions" ? <SessionForm orgs={orgs ?? []} offerings={offerings ?? []} media={mediaOpts} />
            : t === "media" ? <UploadForm orgs={orgs ?? []} offerings={offerings ?? []} />
            : <ContentForm orgs={orgs ?? []} offerings={offerings ?? []} media={mediaOpts} />}
        </Panel>
      </div>
    </>
  );
}
