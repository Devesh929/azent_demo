import "server-only";
import type { Viewer } from "@/lib/authz/viewer";
import { search, type SearchHit } from "@/lib/data/search";
import { groqChat } from "@/lib/groq";

export type AiraAnswer = {
  answer: string;
  mode: "ai" | "extractive" | "none";
  citations: { n: number; title: string; url: string; type: string }[];
  scope: string;
};

const TYPE: Record<string, string> = { shared_contribution: "Approved contribution", theme: "Theme", content: "Article", offering: "Product", session: "Session" };

// Retrieval is the same audience-filtered query as site search, so AIRA can only ever see
// what this viewer could open. Withdrawn contributions have no index row, so they drop out
// of retrieval the moment they are withdrawn. Nothing here retrains a model.
async function retrieve(viewer: Viewer | null, question: string) {
  let { hits } = await search(viewer, question, { limit: 6 });
  if (hits.length < 2) {
    const words = question.toLowerCase().match(/[a-z]{4,}/g) ?? [];
    if (words.length) hits = (await search(viewer, words.slice(0, 8).join(" OR "), { limit: 6 })).hits;
  }
  return hits;
}

function scopeLabel(v: Viewer | null) {
  if (!v || !v.active) return "public content only";
  return v.active.orgKind === "internal" ? "employee workspace" : `${v.active.orgName} workspace and the learning community`;
}

export async function askAira(viewer: Viewer | null, question: string): Promise<AiraAnswer> {
  const q = question.trim().slice(0, 500);
  const hits: SearchHit[] = await retrieve(viewer, q);
  const citations = hits.map((h, i) => ({ n: i + 1, title: h.title, url: h.url, type: TYPE[h.source_type] ?? h.source_type }));
  const scope = scopeLabel(viewer);
  if (!hits.length) {
    return { answer: "I could not find anything you have access to that answers this. Try different words, or ask a colleague who owns this topic.", mode: "none", citations: [], scope };
  }

  const sources = hits.map((h, i) => `[S${i + 1}] (${TYPE[h.source_type] ?? h.source_type}) ${h.title}\n${h.body.slice(0, 900)}`).join("\n\n");
  try {
    const answer = await groqChat([
      {
        role: "system",
        content:
          "You are AIRA, azentio.ai's assistant. Answer ONLY from the numbered sources. Cite every claim with [S#]. " +
          "If the sources do not answer the question, say so plainly. Describe shared observations as reported patterns from a small sample, never as market prevalence or proof. " +
          "Never speculate about which organisation or person contributed something. Never present sandbox or simulated output as a decision. Keep it under 160 words.",
      },
      { role: "user", content: `Sources:\n${sources}\n\nQuestion: ${q}` },
    ]);
    // Models vary in citation style (【S2】, [S1, S3]); normalise to [S#] so links render.
    if (answer) {
      const normalised = answer
        .replace(/【\s*S?(\d+)\s*】/g, "[S$1]")
        .replace(/\[(S\d+(?:\s*[,;]\s*S\d+)+)\]/g, (_, list: string) => list.split(/[,;]/).map((s) => `[${s.trim()}]`).join(""));
      return { answer: normalised, mode: "ai", citations, scope };
    }
  } catch {
    // fall through to the extractive answer
  }
  const extract = hits.slice(0, 3).map((h, i) => `${h.title} [S${i + 1}]: ${h.body.slice(0, 220).trim()}…`).join("\n\n");
  return { answer: `Here is what I found in sources you can access:\n\n${extract}`, mode: "extractive", citations, scope };
}
