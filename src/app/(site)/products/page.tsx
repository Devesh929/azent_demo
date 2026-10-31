import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { ProductCarousel } from "@/components/site/ProductCarousel";
export const metadata: Metadata = { title: "Products", description: "Explainable AI products for credit, analysis, portfolio insight and regulatory reporting." };
export default function ProductsPage() {
  return <><PageIntro title="Products that show their working." lede="Six products for credit, analysis and reporting teams. Explore the interfaces, follow the evidence and see where human judgment comes in." /><ProductCarousel compact /></>;
}
