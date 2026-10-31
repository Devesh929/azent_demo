import type { Metadata } from "next";
import Experience from "./Experience";

export const metadata: Metadata = {
  title: "Connected intelligence — a motion experience",
  description: "Explore a new perspective on enterprise intelligence. An interactive Azentio concept, brought to life through scroll.",
};

export default function ExperiencePage() {
  return <Experience />;
}
