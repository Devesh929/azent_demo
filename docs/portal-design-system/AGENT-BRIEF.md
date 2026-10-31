# Brief for the next agent: reproduce/extend the Azentio portal style

Read `docs/PORTAL-DESIGN-HANDOFF.md` first, then `docs/portal-design-system/tokens.json`, `computed-styles.json` and the actual light/dark/mobile screenshots. The original implementation is https://github.com/Devesh929/azent_demo, UI baseline commit `ca4d8786d051585d5ab97fd015fdfcc7081a1fa2`.

The requested look is pale sage ground, deep blue-green Poppins text, frosted white/green sheets, soft highlight edges, tactile inset controls, rounded corners and mint actions. It is an operational app, not a landing page. Keep content readable and mostly still. “Liquid glass” here is CSS material styling, not a WebGL refraction shader.

Reuse or adapt the existing Panel, PageHeader, Welcome, Stat, Pill, Notice, Empty, Tabs, ListRow, buttons and form controls. Read PortalShell for the 255px sidebar, 72px topbar, mobile drawer, focus handling and appearance toggle. Root CSS is layered globals → redesign → liquid; portal-scoped variables and specificity determine the final result. Copying the public :root palette alone is wrong.

Use actual final light values: ground #EDF5EF, ink #16303D, secondary #48636B, muted #627C80, readable accent #087553. Primary mint action uses #9DFFD4 → #55F5B5 with dark #103E30 text. Panels use white 86% → pale green 54%, white edge and low diffuse green shadow. Read the full files for alpha values and dark materials.

Use Poppins 400/500/600/700. Application headings are about 25–37px; panel headings 14px; content mostly 13–15px. Keep the repeated corner/padding system. Do not apply public display typography everywhere.

Motion is short: selected sidebar plate shared layout .25s; content CSS rise 8px/.35s; buttons .2s; cards .3s; mobile drawer .3s; guide progress .35s. The portal does not initialise Lenis or use scroll-driven GSAP scenes. Preserve reduced-motion behaviour and add explicit guards to any new JS animations.

The local Taste Skill v2 (design-taste-frontend) informed framed-sheet composition and real-browser review. The user's explicit glass preference overrides its flat-surface bans. No separate UI UX Pro Max/TasteCode/21st.dev/Figma component pack was used. Preserve that actual direction rather than replacing it with a generic template.

For this repository: preserve server-side tenant, role, audience and entitlement checks, existing actions, separate consent and source/shared-copy boundaries. The guide is navigation only, stores visits per user/membership and never completes business actions automatically. No invented dashboard statistics or cross-tenant placeholder data.

For another product: reuse the visual relationships and component APIs, adapting content, permissions and data to that product. The source ZIP is a reference slice with imports into the original application, not a standalone configured app. Do not copy credentials, assume backend setup or add Azentio business features unless requested.

Verify desktop, tablet and mobile screenshots, keyboard/focus, overflow, empty/loading/error states, light/dark and reduced motion. Inspect computed styles when blur or token precedence differs from expectation. Known limits and caveats are documented honestly in the main handoff.
