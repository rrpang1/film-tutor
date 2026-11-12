import type { SkillNode } from "@/engine/types";
import { p, h, ul, ol, tip, k1000, quiz, choice, tf, cards } from "./h";

export const styles: SkillNode[] = [
  {
    id: "street", branch: "styles", tier: 3, xp: 14, minutes: 10, prereqs: ["zone-focus", "moment"],
    title: "street photography", blurb: "public life, candid, unposed",
    lesson: [
      p("Street photography is candid pictures of public life. The tradition runs from Atget's Paris through Cartier-Bresson, Helen Levitt, Garry Winogrand, Vivian Maier and Daido Moriyama to now."),
      ul("**zone focus** and keep the camera up and ready.", "**stay in one place**: let the scene come to you.", "**be open**: smile, nod, and delete nothing (you can't). If someone objects, be kind."),
      k1000("The K1000's mirror slap is louder than a rangefinder, but it's honest, and people often just assume it's an old camera. A 35mm or 28mm lens makes zone focusing easier than a 50mm."),
      tip("Know your local laws and the ethics: photographing in public is broadly legal in many countries, but publishing, using people commercially, and photographing children carry different rules and responsibilities."),
    ],
    quiz: quiz("str",
      choice("A classic street technique is…", ["autofocus tracking", "zone focusing", "a 300mm lens", "studio flash"], 1, "Prefocused and ready to shoot fast."),
      tf("Waiting at one good location often beats wandering.", true, "Let the scene come to you."),
    ),
    cards: cards("str", ["street photography tradition", "Atget, Cartier-Bresson, Levitt, Winogrand, Maier, Moriyama…"]),
    assignment: { id: "str-a", title: "one corner, one hour", brief: "Stand at one street corner for an hour with one roll. Zone focus at about 3 m.", checklist: ["stayed in one place", "zone focused the whole time", "shot at least 24 frames", "wrote down what kept repeating"] },
  },
  {
    id: "portrait", branch: "styles", tier: 3, xp: 14, minutes: 10, prereqs: ["light-quality", "depth-of-field"],
    title: "portraits", blurb: "light, distance, and trust",
    lesson: [
      p("A portrait is a collaboration. The technical part is easy; the human part is the work."),
      ul("**soft window light** from the side is the classic setup.", "**focal length**: 85–105mm flatters. A 50mm from a polite distance is fine. A wide lens up close distorts, so use it on purpose.", "**aperture**: f/2.8–f/4 for a soft background with both eyes sharp.", "**talk**: the best expression usually comes just *after* the posed one."),
      tip("Environmental portraits show a person in their place (a workshop, a kitchen) and say more than a face can."),
    ],
    quiz: quiz("por",
      choice("A classic flattering portrait light is…", ["noon sun overhead", "soft side window light", "on-camera flash in a dark room", "streetlight"], 1, "Soft and directional."),
      tf("An environmental portrait includes the subject's surroundings to tell their story.", true, "Place says who they are."),
    ),
    cards: cards("por", ["environmental portrait", "a portrait showing a person in their own place, which adds context"]),
  },
  {
    id: "landscape", branch: "styles", tier: 3, xp: 14, minutes: 10, prereqs: ["depth-of-field", "light-quality"],
    title: "landscape", blurb: "patience, light, and depth",
    lesson: [
      p("Landscape is about light and time: the same place is ten different photographs over a day."),
      ul("**tripod**, small aperture (f/11–f/16), hyperfocal focus.", "**foreground interest**: a rock or path to anchor the depth.", "**weather** is the subject: fog, storms, snow.", "**meter carefully**: bright skies fool the meter, so tip the camera down to meter, then recompose."),
      tip("Return to one place every week for a season. It's a classic project shape (see Ansel Adams, or Fay Godwin's walking work)."),
    ],
    quiz: quiz("lan",
      choice("For front-to-back sharpness in a landscape, use…", ["f/2 and close focus", "f/11–f/16 with hyperfocal focusing", "1/1000", "a red filter"], 1, "A small aperture and hyperfocal focus."),
    ),
    cards: cards("lan", ["landscape anchor", "a strong foreground element to lead into depth"]),
  },
  {
    id: "documentary", branch: "styles", tier: 4, xp: 16, minutes: 12, prereqs: ["street", "history-docu"],
    title: "documentary", blurb: "bearing witness over time",
    lesson: [
      p("Documentary photography is sustained, informed looking at a subject: a community, a place, an issue. It's usually long-term."),
      ul("**access and time**: return again and again.", "**research**: understand the subject before you photograph it.", "**ethics**: consent, representation, who benefits. Ask how your subjects would see the work.", "**captions**: who, where, when and why. Words are part of documentary."),
      tip("The best first documentary project is something you have access to that outsiders don't: your family, your job, your block."),
    ],
    quiz: quiz("doc", tf("Documentary projects are usually short, single-visit shoots.", false, "Time and return visits make documentary work.")),
    cards: cards("doc", ["core documentary values", "time, access, research, ethics, captions"]),
  },
  {
    id: "new-color", branch: "styles", tier: 4, xp: 14, minutes: 10, prereqs: ["color", "history-color"],
    title: "the vernacular & topographic", blurb: "ordinary places, made strange",
    lesson: [
      p("After 1975 a cool, deadpan way of looking took over: **New Topographics** (Robert Adams, Lewis Baltz, the Bechers, Stephen Shore) photographed parking lots, tract houses and industrial sites with neutral distance. Eggleston and Shore did it in colour."),
      ul("**frontality**: square-on, level camera.", "**even light**: often overcast or flat.", "**the ordinary**: gas stations, motels, signs.", "**deadpan**: no visible emotion from the photographer, so the viewer does the feeling."),
      tip("Photograph the most boring street near you as carefully as a cathedral."),
    ],
    quiz: quiz("nc", choice("New Topographics (1975) favoured…", ["dramatic wilderness", "neutral views of man-altered landscapes", "staged fantasies", "sports action"], 1, "Ordinary, man-altered places, coolly observed.")),
    cards: cards("nc", ["New Topographics", "1975 exhibition of deadpan pictures of man-altered landscapes"]),
  },
  {
    id: "personal-style", branch: "styles", tier: 6, xp: 24, minutes: 15, prereqs: ["sequencing", "street", "portrait"], gate: { level: 6, logs: 5 },
    title: "finding your way of seeing", blurb: "constraints, influences, a project",
    lesson: [
      p("Style isn't a filter. It's the residue of **repeated choices**: what you're drawn to, how close you stand, which light you wait for. You discover it by working, then sharpen it by noticing."),
      ol("**constrain**: one camera, one lens, one film for a season.", "**study**: pick three photographers you love from the library. What do they share? What do you disagree with?", "**project**: name a subject you could photograph for a year.", "**edit for consistency**: the pictures that 'don't fit' are evidence too."),
      h("an artist statement"),
      p("Write three sentences: what you photograph, how you photograph it, and why. Rewrite it every three months."),
      tip("\"Your first 10,000 photographs are your worst.\" Often attributed to Cartier-Bresson. The point is volume."),
    ],
    quiz: quiz("ps", tf("Style mostly comes from repeated choices rather than a look applied afterward.", true, "Style is the pattern in your decisions.")),
    cards: cards("ps", ["how style forms", "the pattern of repeated choices: subject, distance, light, timing"]),
    assignment: { id: "ps-a", title: "a season's project", brief: "Commit to one camera, one lens and one film stock for a season, on one subject. Log every roll against this assignment.", checklist: ["chose a single subject", "same camera, lens and film throughout", "wrote a three-sentence statement", "edited a set of 12"] },
  },
];
