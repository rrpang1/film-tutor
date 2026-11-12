import type { CritiqueSubject } from "@/engine/types";

// Photographs to read. No images ship with the app (they're someone else's work):
// each subject links to an image search so you can look at it full size, then come back and write.
export const critiques: CritiqueSubject[] = [
  {
    id: "cr-migrant-mother", title: "Migrant Mother", by: "Dorothea Lange", year: "1936", search: "Dorothea Lange Migrant Mother 1936",
    context: "Made in a pea-pickers' camp in Nipomo, California, for the US Resettlement Administration (later the FSA). Lange made a handful of exposures, moving closer each time. The woman, Florence Owens Thompson, was not named publicly for decades.",
    model: {
      describe: "A black-and-white portrait of a woman in worn clothes, her right hand raised to her chin, looking off past the camera. Two children turn their faces away into her shoulders, and a baby lies in her lap. The background is the dark inside of a tent. The lighting is soft; her face is sharp, and the children's hair and clothing are rendered in close detail.",
      analyze: "The composition is a tight pyramid, with the mother's face at the apex and the children forming its sides. Her raised arm makes a strong diagonal that leads to her face and the furrowed lines of her forehead. Because the children's faces are hidden, all expression is concentrated in hers. The tonal range is compressed into greys, and the brightest tones are her face and hand.",
      interpret: "The image is about endurance under pressure. The gesture of hand to mouth reads as worry or calculation, and the looking-away says her attention is on something beyond the frame: tomorrow, food, work. The children turning inward make her a shield. Seen in its context, it became a symbol of the Depression's displaced families, sometimes at the expense of Thompson's own story.",
      judge: "Formally it is nearly perfect, and its influence is enormous. Ethically it raises lasting questions: Thompson said she received nothing from the picture's fame, and she wasn't told how it would be used. Admire its craft and empathy, and keep the question of who benefits.",
    },
    vocabulary: ["pyramidal composition", "gesture", "tonal compression", "documentary", "agency"], unlockedBy: "describe",
  },
  {
    id: "cr-gare", title: "Behind the Gare Saint-Lazare", by: "Henri Cartier-Bresson", year: "1932", search: "Cartier-Bresson Behind the Gare Saint-Lazare 1932",
    context: "Made behind a Paris railway station. Cartier-Bresson later said he shot through a gap in a fence and could barely see the scene.",
    model: {
      describe: "A man in silhouette leaps from a ladder lying in a flooded yard. His heel hovers just above the water and his reflection mirrors him exactly. Behind, a fence, buildings and posters, one showing a leaping dancer, echo his pose. The water surface is smooth, with ripples around debris.",
      analyze: "The image is built on rhymes: the man and his reflection, the man and the dancer on the poster, the circles of rings in the water. The horizon line of the fence divides the frame, and the leaping figure is placed in the left half of the lower part. Everything is sharp enough to read, and the dark figure stands out against a light background.",
      interpret: "It's a photograph about the instant, the fraction of a second before the foot touches the water. It distils the decisive moment: a man suspended, his fate (wet or dry) unresolved forever. The poster dancer adds wit: art echoing life by chance.",
      judge: "One of the most famous photographs of the twentieth century for good reason. Its formal rhymes would be impressive staged, and astonishing caught. It shows chance and readiness working together.",
    },
    vocabulary: ["visual rhyme", "reflection", "silhouette", "the decisive moment", "suspension"], unlockedBy: "formal-analysis",
  },
  {
    id: "cr-trolley", title: "Trolley, New Orleans", by: "Robert Frank", year: "1955", search: "Robert Frank Trolley New Orleans 1955",
    context: "From The Americans. New Orleans streetcars were segregated by law at the time.",
    model: {
      describe: "A side view of a trolley car with a row of windows, each framing passengers. White passengers sit in the front windows; Black passengers sit toward the back. Reflections of buildings ghost over the glass. Grainy black and white, slightly cropped and not perfectly level.",
      analyze: "The row of windows reads like a strip of film frames or a set of portraits. The rigid grid of the window frames contrasts with the varied faces and expressions. The contrast between bright reflections and dark interiors breaks up the frame, and the face of a man near the back looking out at the camera is the pivot of the picture.",
      interpret: "It's a picture of American segregation, built into the very architecture of the frame. Each window is a cell. The sequence from front to back maps a social hierarchy. The man's gaze implicates the viewer.",
      judge: "Powerful because its politics arrive through form, not slogans. The snapshot roughness, once called careless, is part of its honesty.",
    },
    vocabulary: ["grid", "framing device", "segregation", "snapshot aesthetic", "gaze"], unlockedBy: "history-americans",
  },
  {
    id: "cr-tricycle", title: "Untitled (Memphis), the tricycle", by: "William Eggleston", year: "c. 1970", search: "William Eggleston tricycle Memphis 1970",
    context: "The cover image of William Eggleston's Guide (1976).",
    model: {
      describe: "A child's tricycle, seen from ground level, towers in the foreground. Behind it are low suburban houses, a car and a pale sky. Colour, with muted tones: the red of the tricycle against greys and greens.",
      analyze: "The extremely low vantage point makes the tricycle monumental and the houses small. The tricycle is slightly off-centre and fills most of the frame's height. The colour is subdued except for the red, and the sky is flat and bright.",
      interpret: "A child's viewpoint, perhaps, or a strange monument to suburban childhood. The ordinary object made huge invites a feeling of memory and slight unease.",
      judge: "Its importance is historical (it helped legitimise colour) as well as formal. Some will find it banal, and that's the point Szarkowski argued: anything can be a subject if seen well.",
    },
    vocabulary: ["vantage point", "monumentality", "vernacular", "democratic eye", "colour accent"], unlockedBy: "history-color",
  },
  {
    id: "cr-twins", title: "Identical Twins, Roselle, New Jersey", by: "Diane Arbus", year: "1967", search: "Diane Arbus Identical Twins Roselle New Jersey 1967",
    context: "Made at a Christmas party for twins. The girls are Cathleen and Colleen Wade.",
    model: {
      describe: "Two young girls in matching dark dresses with white collars and white headbands stand side by side against a pale wall, looking straight at the camera. One has a slight smile and the other a slight frown. Square, black and white.",
      analyze: "Strict symmetry and a centred, frontal camera. The square frame makes the two halves exactly equal. Everything is the same, so the small differences in expression, posture and light become the whole subject.",
      interpret: "It's about sameness and difference, and about how identity hides inside small details. It's eerie because we look for the 'real' difference, and find it in mood.",
      judge: "Arbus's power lies in making the ordinary look strange. The question of whether she exaggerated difference, or revealed it, is part of the image's ongoing life.",
    },
    vocabulary: ["symmetry", "frontality", "square format", "the uncanny", "portraiture ethics"], unlockedBy: "history-americans",
  },
  {
    id: "cr-pepper", title: "Pepper No. 30", by: "Edward Weston", year: "1930", search: "Edward Weston Pepper No. 30 1930",
    context: "Made with an 8×10 view camera. Weston placed the pepper inside a tin funnel to make the background and light, and used long exposures.",
    model: {
      describe: "A single green pepper, photographed in black and white against a dark, curved background. Its surface gleams with highlights; its folds twist like muscles. It fills the frame vertically.",
      analyze: "Light falls from above and grades from bright to deep shadow, modelling the form like a sculpture. Fine detail and smooth tones, with full tonal range from bright highlights to deep blacks.",
      interpret: "The pepper becomes a body, a torso or embracing figures. It's about seeing: how attention and light transform ordinary things into form and sensuality.",
      judge: "A cornerstone of straight photography. The question 'is it just a pepper?' is the image's argument: photography can reveal the extraordinary in the ordinary with no manipulation.",
    },
    vocabulary: ["form", "modelling light", "straight photography", "abstraction", "tonal range"], unlockedBy: "history-modernism",
  },
  {
    id: "cr-moonrise", title: "Moonrise, Hernandez, New Mexico", by: "Ansel Adams", year: "1941", search: "Ansel Adams Moonrise Hernandez New Mexico 1941",
    context: "Adams saw the scene from his car, couldn't find his light meter, and calculated the exposure from the known brightness of the moon. He reprinted it for decades, darkening the sky.",
    model: {
      describe: "A small village with a church and white crosses in a cemetery, lit by the last low light, under a vast black sky with a gibbous moon. Snow-capped mountains and clouds in the middle distance.",
      analyze: "The frame is divided into horizontal bands: lit village, dark foreground, cloud band, black sky. The crosses are tiny bright points. The extreme tonal contrast between the bright crosses and the near-black sky gives drama. The moon is placed high and slightly off-centre.",
      interpret: "It's about mortality and transcendence: the crosses of the dead lit up under the cosmic dark. It feels like a vision more than a document.",
      judge: "A summit of technical craft. Its later, darker prints show how much the print is an interpretation of the negative.",
    },
    vocabulary: ["tonal contrast", "zone system", "printing", "horizontal banding", "transcendence"], unlockedBy: "zone-system",
  },
  {
    id: "cr-beverly", title: "Beverly Boulevard and La Brea Avenue", by: "Stephen Shore", year: "1975", search: "Stephen Shore Beverly Boulevard and La Brea Avenue 1975",
    context: "From Uncommon Places, made with an 8×10 view camera.",
    model: {
      describe: "A wide view of a Los Angeles intersection in colour: wide roads, low buildings, billboards, power lines, a few people and cars. Even daylight, with everything sharp.",
      analyze: "Deadpan frontality. Lines of road, wires and buildings are carefully arranged within the frame, with nothing cut awkwardly. The colour is natural and even. No single focal point dominates, so the eye wanders.",
      interpret: "It's about the ordinary American built environment, seen without irony or romance. The attention itself is the meaning: this place is worth looking at.",
      judge: "Quiet and rigorous; the more you look, the more you see. Its influence on later colour and topographic work is enormous.",
    },
    vocabulary: ["deadpan", "frontality", "large format detail", "vernacular landscape", "democratic composition"], unlockedBy: "history-color",
  },
  {
    id: "cr-stray-dog", title: "Stray Dog, Misawa", by: "Daido Moriyama", year: "1971", search: "Daido Moriyama Stray Dog Misawa 1971",
    context: "Made in Misawa, a town in northern Japan near a US air base. It became Moriyama's emblem.",
    model: {
      describe: "A thin dog looks back over its shoulder at the camera on a street. Black and white, grainy, with harsh contrast, and the background is soft.",
      analyze: "The dog fills most of the frame, turned three-quarters away, with its eye as the point of contact. Heavy grain and contrast make it rough and textured. The cropping is tight and abrupt.",
      interpret: "Often read as Moriyama's self-portrait: wandering, wary, outside. Its context (an American base in postwar Japan) adds tension.",
      judge: "Raw and memorable, a showcase of are-bure-boke. Its feeling of looking back over the shoulder is unforgettable.",
    },
    vocabulary: ["are-bure-boke", "grain", "self-portrait by proxy", "gaze", "high contrast"], unlockedBy: "history-japan",
  },
  {
    id: "cr-hyeres", title: "Hyères, France", by: "Henri Cartier-Bresson", year: "1932", search: "Cartier-Bresson Hyeres France 1932 bicycle staircase",
    context: "Made from the top of a staircase looking down; Cartier-Bresson waited for a cyclist to pass.",
    model: {
      describe: "From above, a curving iron railing spirals down a staircase in the foreground; below, a cyclist passes on a cobbled street, slightly blurred. Black and white.",
      analyze: "The spiral railing and the curve of the street create a sweeping S-shape that leads the eye down to the small cyclist. The high vantage point flattens the scene into a pattern. The blur of the cyclist contrasts with the sharp geometry.",
      interpret: "It's about waiting: geometry prepared, then the 'actor' arrives. The cyclist completes the composition, a human note in an abstract design.",
      judge: "A perfect example of 'fishing'. Its strength is the marriage of design and chance.",
    },
    vocabulary: ["vantage point", "S-curve", "fishing", "geometry", "motion blur"], unlockedBy: "moment",
  },
];
