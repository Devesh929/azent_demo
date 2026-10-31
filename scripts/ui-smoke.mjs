// Visual checks using the browser harness bundled with the requested Taste Skill.
// This only signs into existing synthetic demo accounts; it does not modify records.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Browser, sleep } from "../.claude/skills/taste-skill/scripts/lib/cdp.mjs";

const base = process.env.UI_CHECK_URL || "http://localhost:3000";
const out = resolve(".taste-skill/ui-final");
mkdirSync(out, { recursive: true });
const browser = await Browser.launch();
const page = await browser.newPage({ width: 1440, height: 1000 });
const checks = [];
const assert = (condition, label) => { checks.push({ label, passed: !!condition }); if (!condition) throw new Error(label); };
const waitFor = async (expression, label) => {
  for (let i = 0; i < 40; i++) { if (await page.eval(expression)) return; await sleep(250); }
  throw new Error(label);
};
const capture = async (name) => { await page.screenshot({ path: resolve(out, name + ".png"), format: "png" }); };

try {
  await page.goto(base, { timeoutMs: 45000, settleMs: 1500 });
  await waitFor(() => !!document.querySelector(".hero-stage"), "Homepage did not load");
  await waitFor(() => Object.keys(document.querySelector(".experience-selector button")).some(k => k.startsWith("__reactProps")), "Product preview did not hydrate");
  await capture("homepage-desktop");
  assert(await page.eval(() => document.documentElement.scrollWidth <= innerWidth + 1), "Desktop has no horizontal overflow");
  await page.eval(() => document.querySelector("#intelligence").scrollIntoView());
  await sleep(700);
  await page.eval(() => [...document.querySelectorAll(".experience-selector button")].find(b => b.textContent.includes("KYC")).click());
  await sleep(500);
  assert(await page.eval(() => !!document.querySelector(".document-preview")), "Document preview opens manually");
  await page.eval(() => document.querySelector(".preview-action").click());
  assert(await page.eval(() => document.querySelector(".preview-action").textContent.includes("Reset")), "Synthetic KYC control responds");
  await capture("document-preview");
  await page.eval(() => [...document.querySelectorAll(".experience-selector button")].find(b => b.textContent.includes("Credit")).click());
  await sleep(300);
  await page.eval(() => [...document.querySelectorAll(".preview-segment button")].find(b => b.textContent.includes("stress")).click());
  assert(await page.eval(() => document.querySelector(".credit-verdict h4").textContent.includes("Additional")), "Credit scenario changes recommendation");
  await page.wheel(600);
  await sleep(1200);
  assert(await page.eval(() => !!document.querySelector(".document-preview")), "Scrolling advances the product scene");

  await page.goto(base + "/login", { timeoutMs: 45000 });
  await waitFor(() => [...document.querySelectorAll("button")].some(b => b.textContent.includes("Raj Menon")), "Demo accounts unavailable");
  await page.eval(() => [...document.querySelectorAll("button")].find(b => b.textContent.includes("Raj Menon")).click());
  await waitFor(() => location.pathname === "/portal" && !!document.querySelector(".workspace-welcome"), "Client sign-in failed");
  await sleep(700);
  assert(await page.eval(() => getComputedStyle(document.querySelector("main")).opacity === "1"), "Portal content is visible");
  assert(await page.eval(() => document.querySelector("h1").textContent.includes("Raj")), "Client identity appears");
  await capture("dashboard-light");
  await page.eval(() => document.querySelector(".portal-theme-button").click());
  await sleep(250);
  assert(await page.eval(() => document.querySelector(".portal-root").classList.contains("portal-dark")), "Dark appearance toggle works");
  await capture("dashboard-dark");
  await page.eval(() => document.querySelector(".portal-theme-button").click());
  await page.setViewport({ width: 390, height: 844, mobile: true });
  await sleep(400);
  assert(await page.eval(() => document.documentElement.scrollWidth <= innerWidth + 1), "Client mobile layout has no horizontal overflow");
  await capture("dashboard-mobile");
  await page.eval(() => document.querySelector('[aria-label="Open menu"]').click());
  await sleep(300);
  assert(await page.eval(() => !!document.querySelector('[role="dialog"]')), "Mobile navigation opens");
  await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await sleep(400);
  assert(await page.eval(() => !document.querySelector('[role="dialog"]')), "Escape closes mobile navigation");

  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base + "/portal/observations/new", { timeoutMs: 45000 });
  await capture("observation-form");
  await page.goto(base + "/login", { timeoutMs: 45000 });
  await page.eval(() => [...document.querySelectorAll("button")].find(b => b.textContent.includes("Mei Tan")).click());
  await waitFor(() => location.pathname === "/portal" && document.body.textContent.includes("Mei"), "Moderator sign-in failed");
  await page.goto(base + "/portal/moderation", { timeoutMs: 45000 });
  await capture("moderation");
  assert(await page.eval(() => document.querySelector("h1").textContent.toLowerCase().includes("moderation")), "Moderator queue loads");

  await page.setViewport({ width: 390, height: 844, mobile: true });
  await page.goto(base, { timeoutMs: 45000 });
  await capture("homepage-mobile");
  assert(await page.eval(() => document.documentElement.scrollWidth <= innerWidth + 1), "Mobile homepage has no horizontal overflow");
  await page.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await sleep(300);
  assert(await page.eval(() => getComputedStyle(document.querySelector(".scan-line") || document.querySelector(".hero-workspace")).animationDuration === "0.00001s" || !document.documentElement.classList.contains("lenis")), "Reduced motion disables smooth scrolling");
  assert(await page.eval(() => getComputedStyle(document.querySelector(".hero-workspace")).transform === "none"), "Reduced motion removes hero tilt");
  assert(page.consoleErrors.length === 0, "No browser runtime exceptions");
} finally {
  writeFileSync(resolve(out, "checks.json"), JSON.stringify({ checks, errors: page.consoleErrors }, null, 2));
  console.log(JSON.stringify({ checks, errors: page.consoleErrors }, null, 2));
  await browser.close();
}
