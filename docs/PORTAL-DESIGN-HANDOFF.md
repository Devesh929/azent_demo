# Azentio portal — complete design and implementation handoff

For the next coding agent. This records the dashboard as implemented, not a new design proposal. Source baseline: `ca4d8786d051585d5ab97fd015fdfcc7081a1fa2`, repository https://github.com/Devesh929/azent_demo.

Scope: the client/employee dashboards and portal pages, shared controls, appearance switch, breadcrumbs and guided tour. The public landing film, Lenis scrolling and product carousel are separate.

## 1. Design concept

A pale sage workspace with frosted white surfaces, deep blue-green text, mint primary actions and restrained depth. The sidebar/topbar act as translucent chrome. Content is readable and mostly still. The requested iPhone/liquid-glass feeling comes from transparent gradients, highlight edges, inset controls, soft corners and short interactions.

“Liquid” describes the appearance. There is no glass-refraction shader, fluid simulation or WebGL dashboard. Most of the effect is CSS; charts and icons are SVG. The selected sidebar surface uses Motion shared-layout animation.

Preserve the relationships: pale ground → brighter frosted panels → inset controls → dark readable text → mint action. Reuse the same materials on lists, forms, moderation, administration and sandboxes. Use actual counts and honest empty states. Do not move the public site's tilted mockups, video or long scroll sequences into working screens.

This was a redesign of an existing functional application. Existing components, data queries, forms and permissions were retained and restyled; they were not all newly written from scratch.

## 2. Skills and tools actually used

The local **Taste Skill v2**, internal name `design-taste-frontend`, informed app composition, distinction between public pages and working screens, reusable fragments and screenshot review.

Read:

- `.claude/skills/taste-skill/SKILL.md`
- `.claude/skills/taste-skill/references/app-screens.md`
- `.claude/skills/taste-skill/scripts/draw.mjs`
- `.claude/skills/taste-skill/scripts/inspect.mjs`
- `.claude/skills/taste-skill/scripts/lib/cdp.mjs`

The chosen app composition was **Framed sheet**, retaining brand palette and typography. The original local record `.taste-skill/light-app/direction.json` is gitignored; its exported copy accompanies this handoff.

Taste Skill normally discourages glass, gradients, glows and decorative surfaces. The user's explicit green-liquid-glass preference took precedence. This is an adaptation of its composition and review workflow, not literal adherence to its flat-surface rules.

Components were built/restyled directly in React, TypeScript, CSS and SVG. Taste Skill's Chromium/CDP harness provided screenshots and interaction tests. No UI UX Pro Max skill, separate TasteCode skill, 21st.dev import, paid component pack or external design MCP was needed for the portal. Those references were discussed as inspiration, not dependencies. Generated public-site mockups were references; the dashboard is functional HTML, not an image.

## 3. Technology and source map

- Next.js 16.4.3 App Router; React 19.3.0; TypeScript.
- Tailwind CSS 4 with the project's `@tailwindcss/turbopack` build setup.
- `motion/react` from `motion` for UI interactions.
- `lucide-react` for outline icons.
- CSS grid/flex, gradients, shadows, masks and SVG for layout/materials/data visuals.
- `cn()` in `src/lib/utils.ts` combines `clsx` and `tailwind-merge`.
- Existing Supabase authentication/data/storage remain behind the UI.

GSAP, Lenis and Three.js are installed for public-site work. The portal shell does not initialise Lenis or use a GSAP scroll timeline. Spotlight is exported from an effects module that imports/registers GSAP, but Spotlight itself only updates pointer CSS variables.

| Read in order | Responsibility |
| --- | --- |
| `src/app/layout.tsx` | Fonts and global stylesheet order |
| `src/app/globals.css` | Tailwind semantic token bridge, base styles/effects, CSS reduced motion |
| `src/app/redesign.css` | Portal tokens, materials, layout, type, mobile/dark overrides |
| `src/app/liquid.css` | Final light-system refinements and accent foreground correction |
| `src/app/portal/layout.tsx` | Verified viewer, permitted nav, workspace and tour identity |
| `src/components/portal/PortalShell.tsx` | Sidebar, topbar, drawer, appearance, breadcrumbs, tour placement |
| `src/components/portal/ui.tsx` | Shared panels, headers, stats, pills, lists, tabs and empty states |
| `src/components/ui/button.tsx`, `form.tsx` | Button variants and accessible form controls |
| `src/components/portal/Welcome.tsx` | Dashboard greeting/actions |
| `src/app/portal/page.tsx` | Actual client/employee dashboard composition and queries |
| `src/components/fx/static.tsx` | Icon tiles, avatars and SVG ring/sparkline helpers |
| `src/components/fx/client.tsx` | Spotlight and other shared effect helpers |
| `src/components/portal/PortalTour.tsx`, `portal-tour.css` | Tour UI, storage, materials and responsive behaviour |
| `src/lib/portal-tour.ts` | Itineraries, nested guidance, query-tab matching, restored-state validation |
| `src/lib/authz/nav.ts`, `rules.ts`, `policy.ts`, `viewer.ts` | Server-owned permissions/navigation: preserve when restyling |

Specialised portal components cover observation capture/actions, consent, moderation, ideas, invitations, publishing, sandbox runs and AIRA. Their exact source is included in the ZIP.

## 4. The cascade matters

Root layout imports, in order:

```tsx
import "./globals.css";
import "./redesign.css";
import "./liquid.css";
```

Tailwind aliases such as `--color-ink: var(--ink)` and `--color-ground: var(--ground)` make `text-ink`, `bg-ground`, `bg-surface-2` and `text-accent` follow the nearest scoped variables.

`.portal-root` overrides the public palette. `.portal-root:not(.portal-dark)` adds final light refinements. `.portal-dark` changes optional dark appearance. A later plain `.glass` rule does not necessarily beat a more-specific `.portal-root .glass` rule. Unlayered scoped CSS can also override utility classes.

Do not copy only the original `:root` palette or the primitive JSX and expect the current appearance. Use all relevant scoped styles. `portal-design-system/computed-styles.json` records actual resolved values; original CSS records declarations/intent.

## 5. Light palette and primary action

The table below is generated from the current browser-resolved portal variables, not the public root colours. Eight-digit hex values include alpha. `tokens.json` contains the complete light/dark matrix.

| Token | Light | Dark |
| --- | --- | --- |
| `--ground` | `#edf5ef` | `#102d38` |
| `--ground-2` | `#e4f0e7` | `#16303d` |
| `--surface` | `#ffffff8f` | `#ffffff8f` |
| `--surface-2` | `#cfe4d88c` | `#52827c40` |
| `--surface-3` | `#c2d9ce8c` | `#729a8e33` |
| `--surface-solid` | `#f5f9f7` | `#16303d` |
| `--ink` | `#16303d` | `#f0f8f5` |
| `--ink-2` | `#48636b` | `#c0d4d2` |
| `--muted` | `#627c80` | `#9eb9b7` |
| `--accent` | `#087553` | `#55ffbe` |
| `--accent-ink` | `#f4fff8` | `#f4fff8` |
| `--accent-soft` | `#14a26b14` | `#55ffbe1a` |
| `--blue` | `#1d7d7e` | `#83d9cd` |
| `--blue-soft` | `#1d7d7e14` | `#1d7d7e14` |
| `--cyan` | `#16846b` | `#16846b` |
| `--violet` | `#5c876e` | `#5c876e` |
| `--warn` | `#8c650c` | `#e9c97c` |
| `--warn-soft` | `#c48f211c` | `#c48f211c` |
| `--bad` | `#b0404d` | `#ef929c` |
| `--bad-soft` | `#b0404d14` | `#b0404d14` |
| `--good` | `#087b56` | `#087b56` |
| `--line` | `#5c897926` | `#5c897926` |
| `--line-strong` | `#5c89794d` | `#5c89794d` |
| `--ease-out` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` |
| `--ease-in-out` | `cubic-bezier(.65, 0, .35, 1)` | `cubic-bezier(.65, 0, .35, 1)` |

The key light values are sage ground `#EDF5EF`, deep blue-green ink `#16303D`, secondary `#48636B`, muted `#627C80` and readable action green `#087553`. Do not confuse the darker text/link accent with the brighter mint primary button.

Primary action material:

```css
.portal-root .btn-glow {
  background: linear-gradient(135deg, #9dffd4, #55f5b5);
  color: #103e30;
  box-shadow: inset 0 1px rgb(255 255 255 / .8),
              0 5px 16px rgb(24 135 82 / .1);
}
/* Hover: #85f6c2; 0 8px 24px rgb(24 135 82 / .16). */
```

The brand basis was observed from the Azentio website: deep blue-green `#16303D`, mint `#55FFBE`, supporting green and pale whites. This is an interface interpretation, not an official corporate-token certification. The small inline interface mark is Azentio-inspired SVG, not an imported official brand master.

## 6. The material recipe

### Background

`.portal-root` establishes isolation and the pale ground. Its fixed decorative `::before` is behind content, ignores pointers and adds soft edge lighting:

```css
background:
  radial-gradient(ellipse at 88% 0%, rgb(121 235 168 / .25), transparent 50%),
  radial-gradient(ellipse at 8% 90%, rgb(164 208 176 / .2), transparent 55%);
```

### Main panels and statistics

The final light material is:

```css
.portal-root:not(.portal-dark) .glass,
.portal-root:not(.portal-dark) .portal-stat {
  background: linear-gradient(135deg,
    rgb(255 255 255 / .86), rgb(239 255 244 / .54));
  border-color: rgb(255 255 255 / .92);
  box-shadow: inset 0 1px white,
              0 12px 35px -25px rgb(31 92 53 / .22);
}
```

The earlier scoped `.glass` declaration supplies a 1px border and authored `backdrop-filter: blur(25px) saturate(150%)`, including its WebKit-prefixed form. Soft fills, a bright top edge and a low diffuse shadow create most of the depth.

### Strong chrome and tactile controls

| Material | Authored recipe |
| --- | --- |
| Sidebar `.glass-strong` | `rgb(248 252 249 / .70)`; white right border; blur 35px/saturate 160%; inset `1px 1px rgb(255 255 255 / .9)` |
| Topbar | `rgb(244 249 246 / .66)`; white bottom border; Tailwind `backdrop-blur-xl` = 24px |
| Raised `.neu` | 145-degree white/pale-green gradient; white border; tiny shadow; inset white highlight |
| Inset `.neu-inset` | `rgb(231 240 233 / .58)`; `inset 0 1px 3px rgb(41 79 59 / .05)`; white 70% border |
| `.ring-gradient::before` | Masked 1px gradient hairline following the parent's radius; white/faint sage/white; decorative, pointer-transparent |
| Selected sidebar surface | `linear-gradient(120deg,#fff,#d5f4df)`; white border; 12px radius; faint shadow/highlight |

Reduced original decoration: portal border-beam pseudo-elements are hidden; KPI `[data-stat-glow]` is hidden; KPI icon tiles lose their fill/shadow; public dot patterns and aurora blobs are hidden within the portal. Do not re-enable those indiscriminately.

**Measured-browser caveat:** exported Chromium styles reported `backdropFilter: none` for normal panels/sidebar despite the authored blur rules, while topbar resolved to `blur(24px)`. The visual effect still comes from transparency, gradients, highlights and background lighting. Preserve the distinction between declarations and observed output; verify the target browser/cascade if exact blur is important. The reference stylesheet retains authored blur, not a claim about every browser's rendered blur.

## 7. Optional dark appearance

The shell starts light with `useState(false)`. The button toggles `.portal-dark`. Appearance is not currently persisted and is not initialised from the operating system.

Dark material uses:

```css
/* Panel / statistic */
background: linear-gradient(135deg,
  rgb(83 128 125 / .24), rgb(34 70 74 / .32));
border-color: rgb(215 255 238 / .12);
box-shadow: inset 0 1px rgb(255 255 255 / .07),
            0 12px 30px -15px rgb(0 16 20 / .24);
```

Sidebar is `rgb(25 61 68 / .66)`; topbar `rgb(16 45 56 / .70)`; selected plate/control `rgb(121 174 153 / .12)`. Deep ground is `#102D38`; light ink is `#F0F8F5`; accent becomes `#55FFBE`.

Some secondary variables inherit from the light declaration, including `--surface` and several soft status colours. This is not a completely independent dark token system; the full actual matrix above is intentional documentation of the current state. Primary mint buttons and guide Next buttons use explicit dark foregrounds so they do not become white-on-mint.

## 8. Typography

Poppins is loaded with `next/font/google`:

```tsx
const poppins = Poppins({
  variable: "--font-geist-sans", // starter name; the face is Poppins
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
```

Next handles font build output/self-hosting. Geist Mono is separately loaded for existing code/technical text. Body uses Poppins at weight 400. The class named `.serif-accent` is overridden to the same sans family, normal style; it is not an instruction to add an italic serif.

| Role | Effective treatment |
| --- | --- |
| Dashboard greeting | `clamp(26px,3vw,37px)`, weight 500, line-height 1.2, tracking -.05em |
| Standard portal h1 | `clamp(25px,2.5vw,33px)`, weight 500; 26px on small mobile |
| Panel title | 14px/600; overrides original 16px utility |
| Content/rows | Usually 13–15px; follow component density |
| Welcome description | 13px, line-height 1.85, max-width 620px |
| Sidebar link | 12px; 17px icon, stroke 1.6 |
| Sidebar group | 11px uppercase, tracking .12em, subdued |
| KPI value | 34px/600, tight tracking, tabular numerals |
| Status pill | 12px/500 |
| Input/textarea/select | Final portal override 13px; field label 14px; hint/error 13px |
| Guide body | 11px desktop; some explanatory copy 12px mobile |
| Guide topic heading | 19px desktop / 20px mobile |

Keep application-scale typography; do not import public display headlines. Use tabular numerals for changing values and aligned numbers.

## 9. Layout, spacing and radii

- Desktop (`lg`, 1024px): 255px sidebar column and a min-width-safe flexible main column.
- Sidebar: 14px outer inset; sticky top 14px; 25px radius; height `calc(100svh - 28px)`. Inner padding 16px horizontal / 20px vertical; navigation scrolls independently.
- Topbar: sticky top 0, height 72px, z-index 30. Desktop horizontal padding 32px; tighter mobile gaps/padding.
- Content: width 100%, max-width 1440px, centred. Top padding 24px; bottom 96px; horizontal 32px, mobile 16px.
- KPI grid: gap 16px; one column initially, two at sm, four at xl.
- Main dashboard: gap 20px; one column until xl, then a 7fr/5fr split. Inner stacks use 20px gaps.
- Panel padding: 20px base / 24px at sm; list panels support `pad={false}`.

| Object | Radius |
| --- | --- |
| Sidebar | 25px |
| Panel | Final 23px desktop / 19px small mobile |
| Stat | 22px |
| Spotlight/offering card | 24px |
| List row/segmented wrapper | 16px |
| Selected nav/fields | 12px |
| Small icon tile | 8px |
| Search/action buttons/status pills | Fully rounded |
| Guide | 19px; compact mobile launcher 16px |

Standard breakpoints: sm 640px, md 768px, lg 1024px, xl 1280px. Existing custom rules also use 639px, 767px and 1279px. Inspect the boundary when introducing an override.

## 10. Component catalogue

Reuse actual exports rather than restyling every route independently.

| Component | Contract / purpose |
| --- | --- |
| `PortalShell` | Chrome, verified nav/user/workspace props, drawer, appearance, breadcrumbs, tour |
| `Welcome` | Dashboard greeting, context line, description and action slot |
| `PageHeader` | title, description, actions, back link and optional Lucide icon |
| `Panel` | title, description, actions, children, className, pad, icon; optional glow exists but portal beam is suppressed |
| `Stat` | Real value, label, hint, semantic tone and optional icon; do not fabricate trend data |
| `Pill` | neutral/info/good/warn/bad/accent tones; optional dot; textual status |
| `Notice` | Semantic message surface with narrow left marker |
| `Empty` | Honest explanation with optional useful action |
| `KV` | Definition list for detail metadata |
| `Tabs` | Real route links and optional counts; active raised surface |
| `ListRow` | Link, leading icon, title/meta, right-side status/action; min-width-safe flex |
| `Button` / `LinkButton` | primary, secondary, ghost, danger, quiet; sm/md/lg |
| `Field` / controls | Accessible labels, hints, validation, input state and errors |
| `FormMessage` | Actual action status/error; not a fabricated success |
| `IconTile` | Lucide outline icon in small material tile; neutralised on stats |
| `Avatar` | Initials and stable name-derived HSL gradient; not a photo service |
| `Ring` | SVG percentage derived from actual data |
| `Spotlight` | Pointer-lit surface, often with gentle card hover lift |
| `PortalBreadcrumbs` / `PortalTour` | Real parent links, role-aware guidance and visit progress |

Buttons: sm 32px tall/13px text; md 40px/14px; lg 48px/15px. Pill radii, 200ms transitions, press scale .97. Disabled controls reduce opacity and disable pointer interaction. Primary is mint; secondary raised pale material; quiet translucent; danger uses the negative semantic pair.

Forms: 48px control height, 12px radius, inset material; textarea min-height 128px. Portal focus shadow is softened to `0 0 0 4px rgb(35 167 117 / .07)`, overriding the older deep inset focus recipe. Selected visibility cards use accent-soft plus accent border. Preserve labels, `aria-invalid`, errors and separate consent controls.

Example composition (the loader is illustrative, not an existing export):

```tsx
import { FileText } from "lucide-react";
import { PageHeader, Panel, ListRow, Pill, Empty } from "@/components/portal/ui";
import { LinkButton } from "@/components/ui/button";

export default async function ExamplePage() {
  const rows = await loadPermittedRows(); // use this route's real server guard/query
  return <>
    <PageHeader title="Observations" icon={FileText}
      description="Your permitted records."
      actions={<LinkButton href="/portal/observations/new">New observation</LinkButton>} />
    <Panel title="Latest work" pad={false} className="p-2">
      {rows.length ? <ul>{rows.map(row => <li key={row.id}>
        <ListRow href={`/portal/observations/${row.id}`} title={row.title}
          meta={row.updatedLabel} right={<Pill tone="info">{row.statusLabel}</Pill>} />
      </li>)}</ul> : <Empty title="No observations yet">Start with a private draft.</Empty>}
    </Panel>
  </>;
}
```

## 11. Dashboard data visuals

Client composition uses the verified author's observations in the active organisation, entitled offerings, relevant sessions and client-visible improvement updates. Employee composition uses assigned ideas, permitted internal content, real current counts and the moderation queue only when authorised.

The SVG contribution ring uses `circumference = 2πr`, clamps value to 0–1 and sets `stroke-dashoffset = circumference * (1-value)`. The client instance is 92px, stroke 8px, 13px label, with a soft ring shadow. Its fraction is actual published observations / total observations. The Sparkline helper exists, but the redesigned dashboard does not pass invented historical trends to Stat.

Keep zeros, suppressed cohorts and empty lists real. Never populate an empty tenant with someone else's information just to improve the screenshot.

## 12. Motion — exact portal interactions

| Interaction | Mechanism | Timing/behaviour |
| --- | --- | --- |
| Sidebar selected surface | `motion.span layoutId="portal-nav"` | .25s, ease `[.22,1,.36,1]`; one plate moves between links |
| Content entry | CSS `workspace-enter` | translateY(8px) → 0, .35s cubic-bezier(.22,1,.36,1) |
| Main wrapper | `motion.main key={path}`, `initial={false}` | Declares opacity 1/y0, .35s or 0 for reduced motion; no initial opacity-0 reveal |
| Mobile drawer | AnimatePresence + motion aside | x -300 → 0; 288px panel; .3s; positional move disabled for reduced motion |
| Drawer backdrop | Motion opacity | Fades; click closes |
| Buttons | CSS | About 200ms; hover lift 1px; pressed scale .97 |
| Cards | CSS | About 300ms; selected quick-link/offering cards lift 4px |
| Rows | CSS | 200ms tint transition; no large movement |
| Spotlight | CSS pointer variables `--mx`, `--my` | 420px radial mint highlight at pointer; opacity .35s |
| Sensitive-content warning | AnimatePresence/motion | height 0 + opacity 0 → auto height + opacity 1 |
| Sandbox result | Motion | opacity/y12 entry; check items enter from x10 with .06s stagger |
| AIRA message | Motion | opacity 0/y10 → visible |
| AIRA thinking dots | Motion keyframes | opacity [.3,1,.3], 1s infinite, .15s stagger |
| Tour progress | CSS width | .35s with shared ease; reduced-motion override |
| Tour rail | Native horizontal scroll | Bring active link into rail viewport without scrolling the page |
| Toolbar Guide | `scrollIntoView` | Smooth or instant under reduced motion; 88px scroll margin |

Ease tokens: `cubic-bezier(.22,1,.36,1)` and `cubic-bezier(.65,0,.35,1)`.

The moving sidebar plate is approximately:

```tsx
{active && <motion.span layoutId="portal-nav"
  className="portal-nav-active absolute inset-0 -z-10 rounded-xl"
  transition={{ duration: .25, ease: [.22, 1, .36, 1] }} />}
```

Spotlight measures its own rectangle on pointer movement and updates `--mx`/`--my`. CSS uses `radial-gradient(420px circle at var(--mx,50%) var(--my,50%), rgb(62 230 196 / .13), transparent 60%)`. Its pseudo-element fades in on hover. There is no per-frame React rerender for the pointer.

No continuous floating cards, 3D dashboard tilt, portal video or Lenis scroll hijacking is added. Border-beam decoration is suppressed inside the portal. Some static avatar/ring shadows and status-dot effects remain from the shared primitives.

Reduced-motion detail: globals reduce CSS durations to .01ms and disable smooth CSS scrolling; Shell and Guide add explicit preference branches. Some inherited AIRA/sandbox Motion animations do not have explicit reduced-motion branches, notably repeated JS thinking dots. CSS duration rules do not disable every JavaScript animation. Do not claim a complete motion-accessibility audit; add guards when extending those components.

## 13. Guided tour and breadcrumbs

This is an in-page aid, not an overlay/automation engine.

- Server layout supplies permitted navigation and an identity key from verified user ID plus active membership ID.
- Hidden on public pages, before workspace selection, and before required client terms are accepted.
- Known itineraries are intersected with server-owned nav. A locally forged role string alone cannot introduce admin/publisher destinations.
- More-specific theme paths beat the general learning prefix. Publisher has three query-tab steps; admin has seven.
- Context changes for draft creation, observation detail/sharing, shared contribution detail and moderation detail.
- Storage key: `azentio:workspace-guide:v1:<userId>:<membershipId>`.
- Stored fields: version, idle/active/finished status and visited step IDs only. No private text, credentials, consent choices or business completion records.
- `useSyncExternalStore` handles hydration-safe subscription; memory fallback supports unavailable storage. Restoration rejects malformed data and ignores unknown/revoked step IDs.
- Start/resume keeps the current route. Restart returns to the overview. Minimize/end returns focus to the toolbar trigger. The toolbar can bring an offscreen guide back into view.
- Progress means **pages visited**, not tasks completed. The guide never submits, publishes, approves, trains, changes permissions or switches personas.
- Breadcrumbs show meaningful parent routes and Details/Create rather than resource UUID labels.

Visuals: 19px radius; 26px bottom margin; compact header; 2px progress line; horizontally scrollable trail; 1fr/1.25fr explanation/checklist columns; 25px/24px body padding; Back/Next footer. Mobile stacks content. `portal-tour.css` holds exact values.

## 14. Responsive behaviour and accessibility

Below 1024px the desktop sidebar is hidden. A 288px drawer opens at z-index 50 over a z-index-40 backdrop. It has dialog semantics, focus containment, Escape dismissal, return focus to the menu trigger and body-scroll locking. Navigation closes it.

On mobile, content gutters become 16px, welcome title 29px, ordinary page title 26px, panel radius 19px and statistic padding 17px. Observation titles wrap instead of truncating. Search is hidden when space is insufficient. Toolbar guide text collapses to an accessible named icon; the in-page panel remains available. Desktop breadcrumbs give way to the mobile page/workspace title and tour trail.

Keep min-width:0 on flex/grid content; wrap meaningful metadata; restrict horizontal overflow to intended scrollers. Do not hide global document overflow as a substitute for fixing widths.

Preserve labelled controls, visible focus, icon-button accessible names, aria-current, status/error announcements, textual status indicators and useful empty-state actions. The guide heading receives programmatic focus without a decorative outline; interactive controls keep focus styling.

## 15. Security boundaries to preserve

Menus and tours are not authority. Existing server pages/actions enforce identity, active membership, tenant, entitlement, audience and action permission. Preserve separate specialist grants and the private-source/reviewed-copy distinction. Client-visible messages must not expose internal notes. Keep consent choices separate and email statuses truthful.

Do not reuse tour localStorage as an authentication or permission mechanism. No new environment variables, database migration or Python process was needed for the design or guide.

## 16. How the result was built

1. Read the assignment and existing functional routes before choosing the presentation.
2. Inspect shared layout/primitives and preserve queries/actions.
3. Keep Poppins and observed green/teal brand direction; darken light-theme text accents for readability.
4. Use framed-sheet app composition with the user's explicit glass-material override.
5. Scope portal variables and centralise reusable materials.
6. Compose client/employee dashboards using actual counts and shared components.
7. Reduce excessive original glow, beams and heavy focus shadows.
8. Add short layout/hover transitions and functional mobile navigation; keep content initially visible.
9. Add breadcrumbs and tour through the shared shell instead of editing every page independently.
10. Build/typecheck/test, then inspect real screenshots at desktop/tablet/mobile and fix observed issues.

The CSS remains layered because this evolved an existing app. For a fresh project, consolidate final materials into one scoped stylesheet instead of rebuilding historical override layers.

## 17. Files supplied for the next agent

All following paths are relative to docs/:

| Asset | Purpose |
| --- | --- |
| `portal-design-system/AGENT-BRIEF.md` | Short instruction to paste into another agent |
| `portal-design-system/tokens.json` | Resolved light/dark variables |
| `portal-design-system/computed-styles.json` | Observed representative surfaces, type and geometry |
| `portal-design-system/portal-reference.css` | Consolidated authored materials/tokens; not imported by app |
| `portal-design-system/framed-sheet-direction.json` | Export of original local app direction |
| `portal-design-system/dashboard-light.png`, `dashboard-dark.png`, `dashboard-mobile.png` | Actual dashboard captures |
| `portal-design-system/guide-client.png`, `guide-admin.png`, `guide-mobile.png` | Actual guided-tour captures |
| `portal-design-system/verification.json` | Final passing tour browser results |

The ZIP also includes the relevant exact React/CSS/TypeScript source in repository paths and the local Taste Skill. It excludes credentials, .env files, dependencies and build output. Extracted source is a reference slice, not a standalone configured application; clone the complete repository when extending this solution.

The reference CSS preserves authored blur. Computed snapshots document what one browser actually resolved. They are deliberately separate artifacts.

## 18. Validation and known limits

At the source baseline: production build, TypeScript, targeted ESLint, 19 unit tests and 30 tour browser assertions passed. The browser pass checks role itineraries, nested guidance, tab queries, refresh/resume/restart, per-workspace isolation, light/dark, mobile/tablet overflow, reduced motion, no public tour and no runtime exceptions.

```sh
npm run typecheck
npm run build
npm test
npm run start -- -p 3001
# Separate terminal, using the prepared synthetic demo environment:
npm run test:tour
```

The browser harness needs the checked-in Taste Skill and installed Chrome/Edge. `UI_CHECK_URL` can select another running app. `scripts/export-portal-design.mjs` reads/toggles the synthetic Raj dashboard to refresh tokens/screenshots; it creates no observations or publications.

Some legacy IconTile backgrounds and Avatar hues remain hard-coded. Dark variables are partly inherited. Some JS animation paths need a fuller reduced-motion audit. Authored blur and measured blur differ in this capture. These are current implementation facts, not new design recommendations. No accessibility certification, complete live Vercel verification or proof of every possible workflow is claimed.

## 19. Acceptance checklist for extensions

- Match current screenshots before adding another visual language.
- Reuse Panel/Header/Stat/Pill/ListRow/form primitives and scoped tokens.
- Keep normal application-scale type, actual data and honest empty states.
- Preserve the final CSS cascade and verify materials in the target browser.
- Avoid inventing KPI trends or using another tenant's records as placeholders.
- Keep server guards, consent, validation and audience filtering intact.
- Introduce guide destinations only through permitted navigation.
- Test mobile drawer, keyboard focus, horizontal overflow and reduced motion.
- Keep public video/scroll/tilt effects out of operational pages.
- Attach build/test evidence and screenshots of affected states to the next handoff.
