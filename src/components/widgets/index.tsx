"use client";
import ExposureSim from "./ExposureSim";
import Sunny16 from "./Sunny16";
import { StopsLadder, ZoneScale, DofWidget, ThirdsWidget } from "./small";

// Names match KNOWN_WIDGETS in engine/pack.ts; the pack validator fails on unknown names.
export function Widget({ name, props }: { name: string; props?: Record<string, unknown> }) {
  switch (name) {
    case "exposure-sim": return <ExposureSim />;
    case "sunny16": return <Sunny16 />;
    case "stops-ladder": return <StopsLadder />;
    case "zone-scale": return <ZoneScale simple={!!props?.simple} />;
    case "dof": return <DofWidget />;
    case "rule-of-thirds": return <ThirdsWidget />;
    default: return null;
  }
}
