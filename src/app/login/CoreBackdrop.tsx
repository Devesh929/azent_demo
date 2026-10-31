"use client";

import dynamic from "next/dynamic";

const IntelligenceCore = dynamic(() => import("@/components/three/IntelligenceCore"), { ssr: false });

export function CoreBackdrop() {
  return <IntelligenceCore settled centered className="absolute inset-0" />;
}
