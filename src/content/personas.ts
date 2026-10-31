// Synthetic demo personas for judging. Shared by the seed script and the DEMO_MODE persona switcher.
export type Persona = { email: string; name: string; title: string; memberships: { org: string; roles: string[] }[] };

export const PERSONAS: Persona[] = [
  { email: "ava.employee@azentio.com", name: "Ava Raman", title: "AI Engineer", memberships: [{ org: "azentio", roles: ["employee"] }] },
  { email: "omar.owner@azentio.com", name: "Omar Haddad", title: "Product Owner, Financial Analysis", memberships: [{ org: "azentio", roles: ["employee", "product_owner"] }] },
  { email: "mei.moderator@azentio.com", name: "Mei Tan", title: "Learning Moderator", memberships: [{ org: "azentio", roles: ["employee", "learning_moderator"] }] },
  { email: "leo.publisher@azentio.com", name: "Leo Fernandes", title: "Content Publisher", memberships: [{ org: "azentio", roles: ["employee", "content_publisher"] }] },
  { email: "priya.admin@azentio.com", name: "Priya Nair", title: "Portal Administrator", memberships: [{ org: "azentio", roles: ["employee", "portal_admin"] }] },
  { email: "noah.ml@azentio.com", name: "Noah Okafor", title: "ML Platform Lead", memberships: [{ org: "azentio", roles: ["employee", "fl_coordinator"] }] },
  { email: "hana.admin@harbourline.example", name: "Hana Iqbal", title: "Head of SME Credit", memberships: [{ org: "harbourline", roles: ["client_member", "client_admin"] }] },
  { email: "raj.analyst@harbourline.example", name: "Raj Menon", title: "Credit Analyst", memberships: [{ org: "harbourline", roles: ["client_member"] }] },
  { email: "sara.admin@saffron.example", name: "Sara Al-Amin", title: "Chief Risk Officer", memberships: [{ org: "saffron", roles: ["client_member", "client_admin"] }] },
  { email: "tom.analyst@saffron.example", name: "Tomás Reyes", title: "Portfolio Analyst", memberships: [{ org: "saffron", roles: ["client_member"] }] },
  { email: "lina.admin@tidewater.example", name: "Lina Hartono", title: "Head of Regulatory Reporting", memberships: [{ org: "tidewater", roles: ["client_member", "client_admin"] }] },
  { email: "ken.analyst@tidewater.example", name: "Ken Wijaya", title: "Reporting Analyst", memberships: [{ org: "tidewater", roles: ["client_member"] }] },
  { email: "zuri.member@orchid.example", name: "Zuri Mwangi", title: "Operations Manager", memberships: [{ org: "orchid", roles: ["client_member"] }] },
  {
    email: "maya.advisor@consult.example", name: "Maya Lindqvist", title: "Credit Transformation Advisor",
    memberships: [{ org: "harbourline", roles: ["client_member"] }, { org: "saffron", roles: ["client_member"] }],
  },
];

export const PERSONA_EMAILS = new Set(PERSONAS.map((p) => p.email));
