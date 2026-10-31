import { BrandRevealHero } from "@/components/site/home/BrandRevealHero";
import { WorkspaceShowcase } from "@/components/site/home/WorkspaceShowcase";
import { ProductCarousel } from "@/components/site/ProductCarousel";
import { PolicySimulator } from "@/components/site/home/PolicySimulator";
import { ClosingInvitation, CollectiveJourney, IntelligenceExperience, TrustStatement } from "@/components/site/home/IntelligenceExperience";
import { Happening } from "@/components/site/home/Happening";
import { getBanner, getPublicContent, getPublicSessions } from "@/lib/data/public";

export default async function HomePage() {
  const [banner, sessions, insights] = await Promise.all([getBanner(), getPublicSessions(), getPublicContent("insight")]);
  return (
    <div className="home-redesign">
      <BrandRevealHero />
      <WorkspaceShowcase announcement={banner?.title} />
      <IntelligenceExperience />
      <ProductCarousel />
      <PolicySimulator />
      <CollectiveJourney />
      <TrustStatement />
      <Happening sessions={sessions} insights={insights} />
      <ClosingInvitation />
    </div>
  );
}
