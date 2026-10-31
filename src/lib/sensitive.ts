// Heuristic scan for content that must not reach the shared community. A scan is a prompt
// for human review, NOT a privacy guarantee: moderators still read every proposed copy.
export type SensitiveFlag = { kind: string; label: string; match: string };

const PATTERNS: { kind: string; label: string; re: RegExp }[] = [
  { kind: "email_address", label: "Email address", re: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
  { kind: "iban", label: "IBAN", re: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g },
  { kind: "card_number", label: "Possible card number", re: /\b(?:\d[ -]?){13,19}\b/g },
  { kind: "account_number", label: "Possible account number", re: /\b\d{8,18}\b/g },
  { kind: "phone_number", label: "Phone number", re: /(?:\+\d{1,3}[ -]?)?(?:\(?\d{2,4}\)?[ -]?){2,4}\d{3,4}\b/g },
  { kind: "national_id", label: "Possible national ID", re: /\b(?:[A-Z]{5}\d{4}[A-Z]|\d{3}-\d{2}-\d{4}|\d{4} \d{4} \d{4})\b/g },
  { kind: "credential", label: "Credential or secret", re: /\b(?:password|passwd|api[_ -]?key|secret|token)\s*[:=]\s*\S+/gi },
  { kind: "confidential_terms", label: "Confidential pricing or terms", re: /\b(?:our|their|client'?s?)\s+(?:pricing|rate card|fee schedule|contract terms?)\b|\bconfidential\b/gi },
  { kind: "named_customer", label: "Possible named customer", re: /\b(?:customer|borrower|client)\s+(?:named\s+)?(?:Mr\.?|Mrs\.?|Ms\.?|Dr\.?)?\s?[A-Z][a-z]+\s[A-Z][a-z]+/g },
];

export function scanSensitive(...texts: (string | null | undefined)[]): SensitiveFlag[] {
  const text = texts.filter(Boolean).join("\n");
  const seen = new Set<string>();
  const flags: SensitiveFlag[] = [];
  for (const p of PATTERNS) {
    for (const m of text.matchAll(p.re)) {
      const match = m[0].trim();
      if (match.replace(/\D/g, "").length >= 8 && p.kind === "phone_number") continue; // counted as a number above
      const key = p.kind + match;
      if (seen.has(key) || match.length < 4) continue;
      seen.add(key);
      flags.push({ kind: p.kind, label: p.label, match });
    }
  }
  return flags;
}

/** Replace every flagged span with a neutral placeholder, for the moderator's proposed copy. */
export function redact(text: string, flags: SensitiveFlag[]) {
  let out = text;
  for (const f of flags) out = out.split(f.match).join(`[${f.label.toLowerCase()} removed]`);
  return out;
}

// De-identification helpers: coarsen place and time so rare observations are harder to re-identify.
const REGION_OF: Record<string, string> = {
  india: "South Asia", pakistan: "South Asia", "sri lanka": "South Asia", bangladesh: "South Asia",
  uae: "Middle East", "saudi arabia": "Middle East", qatar: "Middle East", oman: "Middle East", kuwait: "Middle East",
  indonesia: "Southeast Asia", malaysia: "Southeast Asia", singapore: "Southeast Asia", vietnam: "Southeast Asia", philippines: "Southeast Asia",
  kenya: "Africa", nigeria: "Africa", egypt: "Africa", "south africa": "Africa",
};
export function coarsenRegion(region: string | null | undefined) {
  if (!region) return null;
  const r = region.toLowerCase();
  for (const [country, broad] of Object.entries(REGION_OF)) if (r.includes(country)) return broad;
  return region;
}

export function periodLabel(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const half = (d: Date) => (d.getUTCMonth() < 6 ? "H1" : "H2");
  if (s.getUTCFullYear() !== e.getUTCFullYear()) return `${s.getUTCFullYear()}–${e.getUTCFullYear()}`;
  if (half(s) === half(e)) return `${half(s)} ${s.getUTCFullYear()}`;
  return String(s.getUTCFullYear());
}
