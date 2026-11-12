// The registry of subject packs. To add a subject (videography, a school course…),
// create content/<subject>/index.ts exporting a SubjectPack and add it here.
import { film } from "@content/film";
import type { SubjectPack } from "@/engine/types";

export const packs: Record<string, SubjectPack> = { film };
export const defaultPack = film;
