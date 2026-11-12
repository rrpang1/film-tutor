import type { Card } from "@/engine/types";

// "speaking photography": the vocabulary deck. It enrols when the critique branch's first frame develops.
const g = (front: string, back: string, i: number): Card => ({ id: `gl-${i}`, front, back });

export const glossary: Card[] = [
  ["acutance", "the perceived edge sharpness of an image"],
  ["tonality", "the range and distribution of tones from black to white"],
  ["high key / low key", "mostly light tones / mostly dark tones"],
  ["vantage point", "where the camera stood: height, angle, distance"],
  ["picture plane", "the flat surface of the photograph itself"],
  ["frontality", "a subject photographed squarely face-on"],
  ["deadpan", "a cool, neutral, emotionless presentation"],
  ["vernacular", "everyday, ordinary, non-art subjects or styles"],
  ["juxtaposition", "placing two elements together so they comment on each other"],
  ["visual rhyme", "a repetition or echo of form between elements or images"],
  ["figure-ground", "how a subject separates from its background"],
  ["negative space", "empty area around a subject that shapes it"],
  ["layering", "meaningful elements arranged at several depths"],
  ["studium", "Barthes: shared, cultural interest in a photograph"],
  ["punctum", "Barthes: a detail that personally pierces the viewer"],
  ["the decisive moment", "Cartier-Bresson: the instant form and meaning align"],
  ["indexicality", "a photograph's physical link to what was in front of the lens"],
  ["the gaze", "who is looking at whom, and the power in that looking"],
  ["sequence", "the order of images, and the meaning that order creates"],
  ["snapshot aesthetic", "casual-looking framing, tilt and blur used deliberately"],
  ["are-bure-boke", "grainy, blurry, out-of-focus: the Provoke aesthetic"],
  ["straight photography", "unmanipulated, sharp photography of what the camera sees"],
  ["pictorialism", "c. 1900 style imitating painting: soft focus, hand-worked prints"],
  ["typology", "a series of similar subjects shown uniformly for comparison (the Bechers)"],
  ["mise-en-scène", "everything arranged within the frame: setting, figures, props, light"],
  ["contact sheet", "a same-size print of a whole roll, used for editing"],
  ["edition", "the fixed number of prints made of an image"],
  ["vintage print", "a print made close to the time the negative was exposed"],
].map(([f, b], i) => g(f, b, i + 1));
