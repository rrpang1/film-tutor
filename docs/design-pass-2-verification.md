# film tutor — pass 2, verification round

The board reconvened after the build ran in the browser (production build on :3345, desktop and 375 px).

**interaction designer.** The halo, the shader's cursor light and the card sheen are all gone; the click ring, typing sparks and magnetic dock remain. *Verified.* The dock now has seven items (prints added) and fits at 375 px.
- **found and fixed:** the contact sheet's grid let its longest strip set the page width, so the whole page scrolled sideways on phones (a 2435 px document at 375 px). `.strips` now uses `minmax(0, 1fr)`. Re-checked at 375 px: no horizontal overflow on field, sheet, shoots, prints, bench or a lesson with the develop widget.

**teacher.** 23 new frames: the digital darkroom (15: scans → catalog → culling → basic panel → histogram → crop/clean → curves → negative conversion → masks → b&w → b&w print look → batch → export → advanced → edit-a-roll capstone) and colour (8: colour basics → white balance → harmony → HSL → grading → film looks → colour management → colour-study capstone). Every LR lesson names free equivalents. *Verified* in the pack validator (every node reachable).

**learning scientist.** The `develop` widget is embedded in six lessons; dragging a slider redraws the image and the RGB/luma histogram, `clip` shows blown and blocked areas, "hold: before" compares. "use my photo" and the prints lightbox's "try edits on it" load the owner's own image locally. *Verified* (HSL orange band on the test scene at 375 px; exposure on a wall photo in the lightbox).

**game designer.** Today's shoots ran against live Open-Meteo data (49 °F, rain, night): the top three were the subway, Grand Central and the Staten Island Ferry, all indoor or rain-proof, with "meter it" in place of sunny 16 at night. Tests cover the light/sky mapping, market days, seasons, K1000 shutter speeds and that every spot's lesson exists.

**critic.** Spots are real places described without invented events; market days (Union Square: Mon/Wed/Fri/Sat) and the seasonal rink are gated. Film-stock traits stay to documented ones. Albers and Itten are added to the library.

**engineer.** Schema v2 migrates v1 (tested); photo records merge last-write-wins (tested); encryption round-trips, rejects a wrong passphrase and passes plain text through (tested). Three generated images went onto the wall: b&w was detected, the blue one sorted into the blue family, the lightbox opened and the edit study worked.
- **not verified here:** real gist round-trips (sync and photo shards need the owner's token), and installing on the owner's iPhone, Mac and Windows machines.
