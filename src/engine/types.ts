// The engine's vocabulary. Nothing here knows about film: a subject pack
// (content/<subject>) fills these shapes with its own nodes, ranks and words.

export type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "list"; items: string[]; ordered?: boolean }
  | { kind: "tip"; text: string; tone?: "note" | "warn" | "gear" }
  | { kind: "terms"; items: [term: string, meaning: string][] }
  | { kind: "widget"; widget: string; props?: Record<string, unknown> };

export type QuizItem =
  | { id: string; kind: "choice"; q: string; options: string[]; answer: number; why: string }
  | { id: string; kind: "truefalse"; q: string; answer: boolean; why: string }
  | { id: string; kind: "number"; q: string; answer: number; tolerance?: number; unit?: string; why: string };

export type Card = { id: string; front: string; back: string };

export type Assignment = {
  id: string;
  title: string;
  brief: string;
  checklist: string[];
  frames?: number;
};

export type Gate = {
  /** minimum level (roll number) before the node can develop */
  level?: number;
  /** number of logged rolls/sessions in the field log */
  logs?: number;
  /** number of completed critiques */
  critiques?: number;
};

export type SkillNode = {
  id: string;
  branch: string;
  tier: number;
  title: string;
  blurb: string;
  prereqs: string[];
  gate?: Gate;
  xp: number;
  minutes: number;
  lesson: Block[];
  quiz: QuizItem[];
  cards: Card[];
  assignment?: Assignment;
};

export type Branch = { id: string; title: string; blurb: string; hue?: string };

export type Rank = { level: number; title: string; line: string };

export type LibraryEntry = {
  id: string;
  kind: "photographer" | "book";
  name: string;
  /** years, e.g. "1902–1984" or "1958" */
  years: string;
  by?: string;
  tags: string[];
  summary: string;
  lookFor: string[];
  prompts: string[];
  works?: string[];
  related?: string[];
  /** library entries unlock with nodes so the canon arrives in a sensible order */
  unlockedBy?: string;
};

export type CritiqueSubject = {
  id: string;
  title: string;
  by: string;
  year: string;
  search: string;
  context: string;
  model: { describe: string; analyze: string; interpret: string; judge: string };
  vocabulary: string[];
  unlockedBy?: string;
};

export type SubjectPack = {
  id: string;
  title: string;
  /** what a unit of XP is called, singular/plural ("frame"/"frames") */
  unit: [string, string];
  /** what a level is called ("roll") */
  levelWord: string;
  branches: Branch[];
  nodes: SkillNode[];
  ranks: Rank[];
  library: LibraryEntry[];
  critiques: CritiqueSubject[];
  glossary: Card[];
};

// ─── progress ───

export type NodeRec = { learnedAt?: number; best?: number; attempts: number; updatedAt: number };
export type CardRec = { ease: number; interval: number; reps: number; lapses: number; due: number; updatedAt: number };
export type XpEvent = { id: string; at: number; amount: number; reason: string };
export type FrameNote = { n: number; aperture?: string; shutter?: string; note?: string };
export type LogRec = {
  id: string;
  date: string;
  camera: string;
  stock: string;
  iso: number;
  title: string;
  assignment?: string;
  conditions?: string;
  frames: FrameNote[];
  checklist: Record<string, boolean>;
  reflection?: string;
  links: string[];
  updatedAt: number;
  deleted?: boolean;
};
export type LibRec = { studied?: number; notes?: string; updatedAt: number };
export type CritiqueRec = {
  id: string;
  subject: string;
  answers: { describe: string; analyze: string; interpret: string; judge: string };
  score?: Record<string, number>;
  at: number;
  updatedAt: number;
  deleted?: boolean;
};

export type Progress = {
  schemaVersion: number;
  nodes: Record<string, NodeRec>;
  cards: Record<string, CardRec>;
  xp: XpEvent[];
  logs: Record<string, LogRec>;
  library: Record<string, LibRec>;
  critiques: Record<string, CritiqueRec>;
  days: string[];
  updatedAt: number;
};
