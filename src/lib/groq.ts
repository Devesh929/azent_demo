import "server-only";
import { env } from "@/lib/env";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Groq's OpenAI-compatible endpoint. Callers must pass only content the viewer may see;
// raw private records, tenant identifiers and employee-only material never go in a prompt
// unless the viewer is entitled to it.
export async function groqChat(messages: ChatMessage[], opts: { maxTokens?: number; temperature?: number } = {}) {
  if (!env.groqKey) return null;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.groqKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.groqModel,
      messages,
      // Reasoning models spend tokens before answering; keep headroom so answers are not cut off.
      max_tokens: (opts.maxTokens ?? 700) + 600,
      temperature: opts.temperature ?? 0.2,
      ...(env.groqModel.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`AI provider error ${res.status}`);
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  return json.choices[0]?.message?.content?.trim() ?? null;
}
