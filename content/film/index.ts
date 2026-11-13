import type { SubjectPack } from "@/engine/types";
import { basics } from "./basics";
import { light } from "./light";
import { gear } from "./gear";
import { technique } from "./technique";
import { composition } from "./composition";
import { darkroom } from "./darkroom";
import { styles } from "./styles";
import { history } from "./history";
import { critique } from "./critique";
import { editing } from "./editing";
import { colour } from "./colour";
import { library } from "./library";
import { critiques } from "./critiques";
import { glossary } from "./glossary";

export const film: SubjectPack = {
  id: "film",
  title: "film photography",
  unit: ["frame", "frames"],
  levelWord: "roll",
  branches: [
    { id: "camera", title: "the camera", blurb: "film, your k1000, loading, care" },
    { id: "light", title: "light & exposure", blurb: "stops, the triangle, metering, zones" },
    { id: "technique", title: "technique", blurb: "focus, depth, motion, low light" },
    { id: "composition", title: "composition", blurb: "the frame, light, moment, sequence" },
    { id: "gear", title: "gear & film", blurb: "formats, stocks, lenses, filters, flash" },
    { id: "darkroom", title: "darkroom & scanning", blurb: "processes, negatives, developing, prints" },
    { id: "styles", title: "genres & style", blurb: "street, portrait, landscape, documentary" },
    { id: "history", title: "history & canon", blurb: "from niépce to provoke" },
    { id: "critique", title: "speaking photography", blurb: "describe, analyze, interpret, judge" },
    { id: "editing", title: "the digital darkroom", blurb: "scans, lightroom classic, b&w, export" },
    { id: "colour", title: "colour", blurb: "theory, white balance, hsl, grading" },
  ],
  nodes: [...basics, ...light, ...technique, ...composition, ...gear, ...darkroom, ...styles, ...history, ...critique, ...editing, ...colour],
  ranks: [
    { level: 1, title: "latent image", line: "something is there. nothing is developed yet." },
    { level: 2, title: "first roll", line: "the first frames are in the can." },
    { level: 3, title: "test strip", line: "learning what each second does." },
    { level: 4, title: "contact sheet", line: "seeing the roll as a whole." },
    { level: 6, title: "work print", line: "choosing, and knowing why." },
    { level: 8, title: "fibre print", line: "deep blacks, patient hands." },
    { level: 11, title: "portfolio", line: "a body of work is forming." },
    { level: 14, title: "exhibition print", line: "made to be looked at for a long time." },
    { level: 18, title: "monograph", line: "a way of seeing, bound." },
    { level: 24, title: "retrospective", line: "a life looking." },
  ],
  library,
  critiques,
  glossary,
};
