# Azentio interface direction

The approved reference is a deep teal framed landing page with mint lighting and a slanted product interface. The implementation uses real HTML and SVG interface components, rather than displaying the generated mockup as an image.

## Brand

The public website palette sampled from azentio.com is deep blue-green `#16303D`, mint `#55FFBE`, supporting green `#2ED88E`, white and pale grey `#F6F8F9`. Typography is Poppins, self-hosted by Next.js. These are observed website values, not a published corporate brand specification. The inline mark is an Azentio-inspired interface mark, not an imported official logo asset.

## Page argument

1. Explain the platform through a financial-analysis interface with visible source evidence.
2. Explore analysis, document/KYC and credit scenarios in one changing workspace.
3. Provide direct routes to all six existing offerings.
4. Let a visitor try the existing synthetic policy simulator.
5. Explain private observation, review, publication and product improvement as distinct steps.
6. Show the trust commitments and routes to public sessions, insights, registration and enquiries.

## Motion

Lenis drives smooth wheel scrolling on the public site, synchronised with GSAP ScrollTrigger through the GSAP ticker. Native touch scrolling and browser navigation remain available. The inertial layer is disabled when reduced motion is requested, including changes to that preference during a session.

The hero interface straightens and rises with scroll while the side panels separate. A single sticky product section transitions between three previews. Manual selection remains available and is not reset by updates within the same scroll stage. The learning journey connects source observations to reviewed copies and improvement ideas. Mobile uses compact, manually selectable scenes without long sticky holds.

Document/KYC checks are explicitly simulated with a synthetic identity; they perform no identity verification. Analysis and credit previews are illustrative and make no actual financial decisions.

## Workspace

The portal uses a shared frosted-glass shell, translucent sidebar, tactile controls, a sliding active navigation surface, readable status colours and light/dark appearance control. Shared panels, forms, empty states, lists and tabs carry the design into the existing portal routes. Client dashboard observations are queried using the existing verified author and active organisation. Employee counts use actual current values, without fabricated historical sparklines.

## Taste Skill application

The local Taste Skill was consulted for composition, separate public/app treatments and screenshot review. The user's approved reference overrides its restrictions on glass, gradients, shadows, labels and framing. The subject-specific device is the private source becoming a reviewed representation, demonstrated in functional previews. Existing routes, access rules, actions and audience filtering are retained.

Pre-change source backup: `C:/Users/deves/AppData/Local/Temp/azentio-ui-before-20261030-210645/src`.

Visual QA captures are stored in `.taste-skill/`. They are review artifacts, not website assets.

## Verification

`npm run test:ui` runs the requested Taste Skill's real-browser harness against `http://localhost:3000`.
It checks manual and scroll-driven preview changes, the synthetic KYC interaction, credit scenarios,
client sign-in, visible dashboard content, light/dark appearance, mobile overflow, mobile navigation,
Escape dismissal, moderator access and reduced motion. It saves desktop and phone screenshots and
`checks.json` under `.taste-skill/ui-final/`. It signs into existing demo accounts and does not edit,
publish, invite, resolve reports or send messages.

The first screenshot pass found and corrected hidden entrance content, mobile notification text
constrained by a broad CSS selector, and small-screen hero wrapping. Three-line editorial headings
elsewhere and small labels inside scaled synthetic product previews are intentional. Approved
glass, framing, shadows and mint lighting are deliberate exceptions to the skill's style bans.
