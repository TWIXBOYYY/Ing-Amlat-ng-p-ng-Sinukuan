/**
 * ─────────────────────────────────────────────────────────────
 *  HOW TO ADD A COMIC PAGE
 * ─────────────────────────────────────────────────────────────
 *  1. Drop the page image into /public/assets/comic/ (WebP preferred,
 *     PNG/JPG as fallback). Name it e.g. page-06.webp / page-06.jpg.
 *  2. Add a new object to the `pages` array below.
 *  3. Only `id` and `image` are required. Everything else is optional.
 *
 *  FIELD REFERENCE
 *  ───────────────
 *  id          {string}       Unique slug, e.g. "page-06"
 *  image       {string}       Path from /public root, e.g. "/assets/comic/page-06.webp"
 *  videoAspect {number}       width / height of the video file (default 1920/1165); sets how it is cropped/fitted
 *  videoFit    {string}       'contain' shows the whole frame instead of cropping it to fill a wide screen (default: fill)
 *  videoFocusY {number}       0..1, which part of a tall video stays in view on wide screens (0 top, 1 bottom, default .5)
 *  video       {string}       Optional motion video (MP4) shown instead of the image + layers;
 *                             it loops muted and is kept clear of the on-screen buttons
 *  alt         {string}       Accessibility description of the page
 *  layers      {PageLayer[]}  Parallax layers rendered over the image (depth 0=static,1=full)
 *  narration   {Clip|Clip[]}  Audio file (or several, played one after another) — plays on page enter.
 *                             A clip is a path, or { src, startSeconds, maxSeconds } to play just that part
 *                             of the file (skip leading silence / cut a tail so clips join without a gap)
 *  narrationDelay {number}    Seconds the video plays on its own before the narration starts (default 0)
 *  advanceAfter {number}      Seconds to wait after the narration ends, then turn to the next page
 *  captions    {Caption[]}    Text panels (transparent PNGs the size of the video frame) animated in over
 *                             a video page; caption i appears when narration clip i starts
 *  music       {string}       Background music — continues unchanged if same as prev page
 *  ambience    {string|null}  Ambience loop   — continues unchanged if same as prev page; null fades it out
 *  ambienceVolume {number}    0..1, how loud the ambience sits under the narration (default 1)
 *  sfx         {SfxTrigger[]} One-shot sounds { src, on: 'enter'|'reveal', at?: delay in seconds, clip?: narration clip index to start with, volume?: 0..1,
 *                             stopAtClip?: fade it out when that narration clip starts }
 * ─────────────────────────────────────────────────────────────
 */

/**
 * @typedef {Object} PageLayer
 * @property {string} src
 * @property {number} depth
 * @property {string} [position]
 */

/**
 * @typedef {string|{src:string,startSeconds?:number,maxSeconds?:number,pauseSeconds?:number}} Clip
 */

/**
 * @typedef {Object} Caption
 * @property {string} src       WebP/PNG with the panel drawn on a transparent canvas the size of the video frame
 * @property {string} alt       the panel's text, for screen readers
 * @property {{x:number,y:number}} at      where its centre should sit on the page, in % of the frame (as designed).
 *                    Panels are never resized. Where the picture is cropped by a narrower screen, a panel that
 *                    would be cut off is nudged back inside the screen.
 * @property {number} [voiceAt]  seconds after its narration clip starts that the voice begins (the clip can open with silence)
 * @property {number} fallbackAt  seconds after page enter to show it if the narration can't play (clip start + voiceAt)
 * @property {number[]} [replaces]  indexes of earlier boxes drawn over the same spot; they fade out as this one appears
 */

/**
 * @typedef {Object} SfxTrigger
 * @property {string} src
 * @property {'enter'|'reveal'} on
 * @property {number} [at]     seconds to wait (after the page opens, or after its narration clip starts); default 0
 * @property {number} [clip]   narration clip index: start with that clip instead of when the page opens
 * @property {number} [stopAtClip] fade the sound out when that narration clip starts
 */

/**
 * @typedef {Object} StoryPage
 * @property {string}       id
 * @property {string}       image
 * @property {string}       [video]
 * @property {number}       [videoAspect]
 * @property {number}       [videoFocusY]
 * @property {string}       [alt]
 * @property {PageLayer[]}  [layers]
 * @property {Clip|Clip[]} [narration]
 * @property {number}       [advanceAfter]
 * @property {boolean}      [videoSound]  leave the video's own audio on (default: muted)
 * @property {number}       [videoSoundFrom]  with videoSound: keep the video's audio off until this second
 * @property {number}       [videoSeconds]  play only this many seconds of the video, then turn the page
 * @property {Caption[]}    [captions]
 * @property {string}       [music]
 * @property {string|null}  [ambience]
 * @property {number}       [ambienceVolume]
 * @property {SfxTrigger[]} [sfx]
 */

/** @type {StoryPage[]} */
export const pages = [
  {
    id: 'page-01',
    image: '/assets/comic/page-01.webp',
    video: '/assets/comic/S1/S1p1 Motion.mp4',
    alt: 'The sacred mountain of Arayat rises against a golden dawn sky, its silhouette wreathed in ancient mist.',
    music:    '/assets/audio/music/theme-main.mp3',
    ambience: '/assets/audio/ambience/space-ambient.mp3',
    ambienceVolume: 0.3,
    narration: [
      '/assets/narration/S1/S1-P1-NARRATOR-001.wav',
      '/assets/narration/S1/S1-P1-NARRATOR-002.1.wav',
    ],
    // The voice says "a great giant spider named Apung Mangacha" from ~2.7s into clip 1; the alien sound (30s, quiet) starts there
    sfx: [{ src: '/assets/audio/sfx/s1p1/Alien sound.mp3', on: 'enter', clip: 0, at: 2.7, volume: 0.8 }],
    advanceAfter: 3,
    captions: [
      {
        src: '/assets/comic/S1/English/ENG_IN THE BEGINNING.webp',
        srcByLang: { pam: '/assets/comic/S1/Pampanga/PAM_IN THE BEGINNING.webp' },
        alt: 'In the beginning of the world, a great giant spider named Apung Mangacha wove a dome called the "Sikluban."',
        at: { x: 11.81, y: 50.47 },
        voiceAt: 0.2,
        fallbackAt: 0.6,
      },
      {
        src: '/assets/comic/S1/English/ENG_BOTTOM OF THE DOME.webp',
        srcByLang: { pam: '/assets/comic/S1/Pampanga/PAM_BOTTOM OF THE DOME.webp' },
        alt: 'The bottom of the dome, the Suklob, was tightly woven and filled with water. Meanwhile, the top was loosely knit and had holes as the great spider ran out of silk.',
        at: { x: 83.77, y: 52.99 },
        voiceAt: 0.8,
        fallbackAt: 11.3,   // first clip (10.45s) + voiceAt
      },
    ],
  },
  {
    id: 'page-02',
    image: '/assets/comic/page-02.webp',
    video: '/assets/comic/S1p2/S1P2 MOTION.mp4',
    alt: 'The Sikluban dome has two parts: at the top, the Father Sky where a great Sky Bird spreads his blue wings, with stars peeking through the holes.',
    music:    '/assets/audio/music/theme-main.mp3',
    ambience: null,   // the space ambience from page 1 ends here
    narration: [
      // clip 1: voice ends ~9.3s, played to 10s so it finishes in silence. Clip 2: voice starts ~1.8s in,
      // played from 0.8s so a 1s silent beat separates the two; its tail is cut at 16s (silent from ~15.6s)
      { src: '/assets/narration/s1p2/S1-P2-NARRATOR-001.wav', maxSeconds: 10 },
      { src: '/assets/narration/s1p2/S1-P2-NARRATOR-002.wav', startSeconds: 0.8, maxSeconds: 16 },
    ],
    // The wing flap is 2.0-3.0s into its file. Started 7.2s into clip 1 it sounds at 9.2-10.2s: the end of clip 1 (10s), just before clip 2
    sfx: [{ src: '/assets/audio/sfx/s1p2/WINGS.mp3', on: 'enter', clip: 0, at: 7.2 }],
    advanceAfter: 3,
    // Narration clip 1 reads the "Through the holes" box, clip 2 reads the "Sikluban" box
    captions: [
      {
        src: '/assets/comic/S1p2/English/ENG_Through the holes.webp',
        srcByLang: { pam: '/assets/comic/S1p2/Pampanga/PAM_Through the holes.webp' },
        alt: 'Through the holes, the Diwatas\' eyes—the stars—peek at the world below.',
        at: { x: 24.6, y: 30.4 },
        voiceAt: 2.2,
        fallbackAt: 2.2,
      },
      {
        src: '/assets/comic/S1p2/English/ENG_The Sikluban.webp',
        srcByLang: { pam: '/assets/comic/S1p2/Pampanga/PAM_The Sikluban.webp' },
        alt: 'The Sikluban has two parts. At the top is *Ibpang Banua, the Father Sky, where a Sky Bird holds dominion—his wings painting the heavens a beautiful blue.',
        at: { x: 82.35, y: 69.5 },
        voiceAt: 0,
        fallbackAt: 10,   // as the second clip starts (after the first, 10s)
      },
    ],
  },
  {
    id: 'page-03',
    image: '/assets/comic/page-03.webp',
    video: '/assets/comic/s1p3/S1P3 MOTION.mp4',
    alt: 'At the bottom lies Indung Laut, the mother ocean, where a giant crocodile rests.',
    music:    '/assets/audio/music/theme-main.mp3',
    ambience: null,
    // Clip 1: the recording has other takes before the line for this page, which starts at 16s.
    // Clips 2-3 are one recording: the croco line (voice stops ~7.3s) and the "world shakes" line (starts ~8.1s),
    // split at 7.5s so each has its own box; the 0.6s of silence between them is kept.
    narration: [
      { src: '/assets/narration/s1p3/S1-P3-NARRATOR-001.wav', startSeconds: 16, maxSeconds: 24.5 },        // 8.5s
      { src: '/assets/narration/s1p3/S1-P3-PANEL1-NARRATOR-001.wav', startSeconds: 0.3, maxSeconds: 7.5 },   // 7.2s
      { src: '/assets/narration/s1p3/S1-P3-PANEL1-NARRATOR-001.wav', startSeconds: 7.5, maxSeconds: 11.8 },  // 4.3s
    ],
    // The sliding is audible 2.5-4.7s into its file. Started 3.8s into clip 1 (8.5s long) it sounds at ~6.3-8.5s: right before clip 1 ends
    sfx: [{ src: '/assets/audio/sfx/s1p3/Crocodile sliding.mp3', on: 'enter', clip: 0, at: 3.8 }],
    advanceAfter: 3,
    videoSeconds: 20,          // the narration adds up to 8.5 + 7.2 + 4.3 = 20s; only that much video is used
    // Box i is shown as narration clip i starts. Every box stays on screen once it has appeared.
    captions: [
      {
        src: '/assets/comic/s1p3/English/ENG_At the bottom lies.webp',
        srcByLang: { pam: '/assets/comic/s1p3/Pampanga/PAM_At the bottom lies.webp' },
        alt: 'At the bottom lies Indung Laut, the mother ocean, where a giant crocodile rests.',
        at: { x: 18.05, y: 26.05 },
        voiceAt: 0.3,
        fallbackAt: 0.3,
      },
      {
        src: '/assets/comic/s1p3/English/ENG_The giant crocodile.webp',   // no Kapampangan art yet: shows the English box
        alt: 'The giant crocodile is named Indung Tibuan.',
        at: { x: 21.15, y: 34.95 },
        voiceAt: 0.5,
        fallbackAt: 8.5,
      },
      {
        src: '/assets/comic/s1p3/English/ENG_and the world shakes.webp',
        srcByLang: { pam: '/assets/comic/s1p3/Pampanga/PAM_and the world shakes.webp' },
        alt: '...and the world shakes whenever she moves!',
        at: { x: 85.2, y: 74.45 },
        voiceAt: 0.6,
        fallbackAt: 16.2,
      },
      {
        src: '/assets/comic/s1p3/English/ENG_FOOTNOTE.webp',   // no Kapampangan art yet: shows the English box
        alt: '*Ibpang Banua is the sky and Indung Laut is the water. They are both formless in nature.',
        at: { x: 21.65, y: 92.7 },
        fallbackAt: 6,   // no voice of its own: it follows the first box
      },
      {
        // second half of the croco narration clip (starts at 8.5s): no clip of its own, so it is timed
        src: '/assets/comic/s1p3/English/ENG_The earth rests upon her back.webp',
        srcByLang: { pam: '/assets/comic/s1p3/Pampanga/PAM_The earth rests upon her back.webp' },
        alt: 'The earth rests upon her back...',
        at: { x: 76.85, y: 66.05 },
        fallbackAt: 12.2,
      },
    ],
  },
  {
    id: 'page-04',
    video: '/assets/comic/s1p4/S1P4 Motion.mp4',
    alt: 'Long ago, it fell down...',
    music:    '/assets/audio/music/theme-mystery.mp3',
    ambience: null,
    // Clip 1 plays from 1s to 12s (11s). Clip 2 skips 0.5s of lead-in (~2.9s). Clip 3 follows after a 1s pause.
    narration: [
      { src: '/assets/narration/s1p4/S1-P4-PANEL1-NARRATOR-002.wav', startSeconds: 1, maxSeconds: 12 },
      // the voice in 003 and PANEL2-001 starts ~1.0s into the file; each clip opens 0.1s before it
      { src: '/assets/narration/s1p4/S1-P4-PANEL1-NARRATOR-003.wav', startSeconds: 0.9, maxSeconds: 2.6, pauseSeconds: 0.9 },   // voice at 0:12
      { src: '/assets/narration/s1p4/S1-P4-PANEL2-NARRATOR-001.wav', startSeconds: 0.9, maxSeconds: 12.39, pauseSeconds: 0.8 },  // 1s of silence after "It fell down", voice at ~0:14.5
    ],
    // clip 2 (index 1) is the "It fell down" box: the flying sound starts with it.
    // clip 3 (index 2) is "Landing right on...": the impact lands with it (see below) and the roar starts with it.
    sfx: [
      { src: '/assets/audio/sfx/s1p4/SUPERMAN FLYING SOUND EFFECT - FREE.mp3', on: 'enter', clip: 1 },
      // the impact is 2.0s into its file; clip 2 lasts 1.7s and the pause before clip 3 is 0.8s (2.5s in total), so starting
      // it 0.5s into clip 2 makes the hit land as clip 3 starts
      { src: '/assets/audio/sfx/s1p4/WATER IMPACT.mp3', on: 'enter', clip: 1, at: 0.5 },
      { src: '/assets/audio/sfx/s1p4/MONSTER ROAR.mp3', on: 'enter', clip: 2 },
    ],
    advanceAfter: 3,
    videoSeconds: 27.5,        // narration ends at ~25.9s
    // Box centres follow the artwork's own layout. Boxes stay on screen once shown; only "Landing right on" clears the first two.
    captions: [
      {
        src: '/assets/comic/s1p4/English/ENG_LONG AGO AS APUNG.webp',
        srcByLang: { pam: '/assets/comic/s1p4/Pampanga/PAM_Long ago as Apung.webp' },
        alt: 'Long ago, as Apung Mangacha was still weaving, her *sikwan slipped from her grip... dropping deep into the dome.',
        at: { x: 18.1, y: 12.2 },     // top left
        voiceAt: 0.3,
        fallbackAt: 0.3,
      },
      {
        src: '/assets/comic/s1p4/English/ENG_IT FELL DOWN.webp',
        srcByLang: { pam: '/assets/comic/s1p4/Pampanga/PAM_IT FELL DOWN.webp' },
        alt: 'It fell down...',
        at: { x: 18.45, y: 86.8 },    // bottom left
        voiceAt: 0.1,        // shows as its voice starts, 0:12
        fallbackAt: 12,
      },
      {
        src: '/assets/comic/s1p4/English/ENG_LANDING RIGHT ON INDUNG.webp',
        srcByLang: { pam: '/assets/comic/s1p4/Pampanga/PAM_LANDING RIGHT ON INDUNG.webp' },
        alt: "Landing right on Indung Tibuan's back, piercing her into place. The end of sikwan pokes out from her, forming Mt. Alaya.",
        at: { x: 67.25, y: 19.45 },   // open sky, upper right
        voiceAt: 0.1,         // ~0:14.5
        fallbackAt: 14.5,
        replaces: [0, 1],     // "Long ago" and "It fell down" go away only now
      },
      {
        src: '/assets/comic/s1p4/English/FOOTNOTE.webp',
        srcByLang: { pam: '/assets/comic/s1p4/Pampanga/PAM_FOOTNOTE.webp' },
        alt: '"Sikwan" is a Kapampangan term for a weaving or netting needle. In this story, the sikwan is a bamboo needle that Apung Mangacha used to weave the dome.',
        at: { x: 77.55, y: 93.7 },    // bottom right
        fallbackAt: 3,   // no voice of its own: it follows the first box
      },
    ],
  },
  {
    id: 'page-05',
    video: '/assets/comic/S2P1/S2-P1 Motion Finall.mp4',
    videoAspect: 1920 / 1165,   // the file's own shape, so it is cropped to fill the screen (landscape) or shown whole (portrait)
    alt: 'Season 2, page 1 — motion graphic.',
    music:    '/assets/audio/music/theme-mystery.mp3',
    ambience: null,
    // Four clips back to back (13.8 + 10.5 + 6.6 + 16.1 = 47s); the video starts with the first voice
    narration: [
      { src: '/assets/narration/s2p1/S2-P1-PANEL1-NARRATOR-001.wav' },     // played whole so the last word is not cut
      { src: '/assets/narration/s2p1/S2-P1-PANEL1-NARRATOR-002.wav', startSeconds: 0.5, maxSeconds: 11 },     // 0:00.5 to 0:11 (10.5s)
      { src: '/assets/narration/s2p1/S2-P1-PANEL2-NARRATOR-001.wav', startSeconds: 1.2, maxSeconds: 7.8 },     // skips the 1.2s of silence before the voice (starts ~1.5s), so no gap
      { src: '/assets/narration/s2p1/S2-P1-PANEL3-NARRATOR-001.wav' },
    ],
    advanceAfter: 3,
    // Layout: kept inside y 11-89%, because a wide screen crops the top and bottom of the video and would push boxes together.
    // "Until" and "But found nothing" use the template's two slots on the middle panel (top, bottom); the boxes still to come go in the last panel's slots.
    // Captions follow the narration: clip 1 (13.8s) says the first two boxes, clip 2 (from 0.5s) the next three and, as its last word, "until".
    // voiceAt is seconds after the clip starts; fallbackAt is seconds after the page opens (used only if the voice can't start).
    captions: [
      { src: '/assets/comic/S2P1/English/ENG_HIGH IN THE HEAVENS.webp', srcByLang: { pam: '/assets/comic/S2P1/Pampanga/PAM_HIGH IN THE HEAVENS.webp' },        alt: 'High in the heavens, Apung Batala, the majestic sky bird, reigns.', at: { x: 21.6, y: 15 },    clip: 0, voiceAt: 0.5, fallbackAt: 1.5 },
      { src: '/assets/comic/S2P1/English/ENG_ONE FATEFUL DAY.webp', srcByLang: { pam: '/assets/comic/S2P1/Pampanga/PAM_ONE FAITHFUL DAY.webp' },            alt: 'One fateful day, they wandered the world, hungry.',               at: { x: 30.8, y: 25 },   clip: 0, voiceAt: 6.0, fallbackAt: 7 },
      { src: '/assets/comic/S2P1/English/ENG_THEY SEARCHED EVERYWHERE.webp', srcByLang: { pam: '/assets/comic/S2P1/Pampanga/PAM_THEY SEARCHED EVERYWHERE.webp' },   alt: 'They searched everywhere—above...',                            at: { x: 23, y: 74 },     clip: 1, voiceAt: 0.5, fallbackAt: 15.3 },
      { src: '/assets/comic/S2P1/English/ENG_AND BELOW.webp', srcByLang: { pam: '/assets/comic/S2P1/Pampanga/PAM_AND BELOW.webp' },                  alt: 'And below...',                                                    at: { x: 32, y: 83 },     clip: 1, voiceAt: 3.8, fallbackAt: 18.6 },
      { src: '/assets/comic/S2P1/English/ENG_BUT FOUND NOTHING.webp', srcByLang: { pam: '/assets/comic/S2P1/Pampanga/PAM_BUT FOUND NOTHING.webp' },          alt: 'But found nothing...',                                            at: { x: 49.5, y: 80 }, clip: 1, voiceAt: 6.1, fallbackAt: 20.9 },
      { src: '/assets/comic/S2P1/English/ENG_UNTIL.webp', srcByLang: { pam: '/assets/comic/S2P1/Pampanga/PAM_UNTIL.webp' },                      alt: 'Until...',                                                        at: { x: 58.5, y: 20 }, clip: 1, voiceAt: 9.5, fallbackAt: 24.3,   // the last word of narration clip 2 (its voice is ~10.1-10.7s in the file, 9.6-10.2s after the clip starts)
        replaces: [0, 1, 2, 3, 4] },   // every earlier box clears away as "Until" appears
      // After "Until": the bottom-centre slot of the middle panel, then the right panel. Timings are a first guess
      // (the voice of narration clip 3, then clip 4).
      { src: '/assets/comic/S2P1/English/ENG_HE SPOTTED SOMETHING.webp', srcByLang: { pam: '/assets/comic/S2P1/Pampanga/PAM_HE SPOTTED SOMETHING.webp' },
        alt: 'He spotted something...', at: { x: 54, y: 79 }, clip: 2, voiceAt: 0.5, fallbackAt: 26 },
      { src: '/assets/comic/S2P1/English/ENG_A PIECE OF FISH MEAT.webp', srcByLang: { pam: '/assets/comic/S2P1/Pampanga/PAM_A PIECE OF MEAT.webp' },
        alt: "A piece of fish meat glistened in between Indung Tibuan's mouth!", at: { x: 54, y: 73 }, scale: 0.8, clip: 2, voiceAt: 2.3, fallbackAt: 30,
        replaces: [6] },   // takes the place of "He spotted something"
      // The fourth voice clip fills the right panel's four slots: 0:00, 0:04, 0:09 and 0:12 into the clip
      { src: '/assets/comic/S2P1/English/ENG_WITH NO HESITATION.webp', srcByLang: { pam: '/assets/comic/S2P1/Pampanga/PAM_WITH NO HESISTATION.webp' },
        alt: 'With no hesitation, he flew down...', at: { x: 84.1, y: 6 }, clip: 3, voiceAt: 1.1, fallbackAt: 32 },
      { src: '/assets/comic/S2P1/English/ENG_DRIVEN BY HUNGER.webp', srcByLang: { pam: '/assets/comic/S2P1/Pampanga/PAM_DRIVEN BY HUNGER.webp' },
        alt: 'Driven by hunger, he took a small peck...', at: { x: 87.7, y: 22 }, clip: 3, voiceAt: 4, fallbackAt: 36 },
      { src: '/assets/comic/S2P1/English/ENG_THEN A BIG ONE.webp', srcByLang: { pam: '/assets/comic/S2P1/Pampanga/PAM_THEN A BIG ONE.webp' },
        alt: 'Then a big one...', at: { x: 92.3, y: 58.6 }, clip: 3, voiceAt: 9, fallbackAt: 41 },
      { src: '/assets/comic/S2P1/English/ENG_THEN AN EVEN BIGGER ONE.webp', srcByLang: { pam: '/assets/comic/S2P1/Pampanga/PAM_THEN AN EVEN BIGGER ONE.webp' },
        alt: 'Then an even bigger one...', at: { x: 86.3, y: 88.4 }, clip: 3, voiceAt: 12, fallbackAt: 44 },
    ],
    // Wings with the first voice; the wind runs under the story until the third clip ("until...") arrives and then fades;
    // the stomach growl lands at the end of the first clip (the voice says "hungry" at ~11.9s)
    sfx: [
      { src: '/assets/audio/sfx/s2p1/Wings Flapping Soaring Sound Effect.mp3', on: 'enter', clip: 0 },
      // the bird is silent for its first 2.5s, then sings until ~7s: under "Apung Batala, the majestic sky bird" (voice at 2.7-5.5s)
      { src: '/assets/audio/sfx/s2p1/One Bird Singing Sound Effect.mp3', on: 'enter', clip: 0, volume: 0.8 },
      { src: '/assets/audio/sfx/s2p1/WindFlying Sound Effects.mp3', on: 'enter', clip: 0, volume: 0.5, stopAtClip: 2 },
      { src: '/assets/audio/sfx/s2p1/Stomach Growling Sound Effect.mp3', on: 'enter', clip: 0, at: 11.6 },
    ],
  },
  {
    id: 'page-06',
    video: '/assets/comic/S2P2/S2P2 Motion Final.mp4',
    videoAspect: 1920 / 1080,   // the file's own shape, so it is cropped to fill the screen (landscape) or shown whole (portrait)
    alt: 'Season 2, page 2 — motion graphic.',
    music:    '/assets/audio/music/theme-mystery.mp3',
    ambience: null,
    // Clip 1 (13.6s) is cut at 0:10; clip 2 (3.6s) follows straight after. The video runs 24.2s, so the page turns as it ends.
    narration: [
      { src: '/assets/narration/s2p2/S2-P2-NARRATOR-001.1.wav', startSeconds: 0, maxSeconds: 10 },
      { src: '/assets/narration/s2p2/S2-P2-PANEL3-NARRATOR-001.2.wav' },
    ],
    advanceAfter: 3,
    videoSeconds: 17.1,   // "Until suddenly" is spoken at ~10.9-12.3s; the page turns 4.5s after those words (about 16.8s), before the 24.2s video ends
    // Boxes stay once shown (none clears): "Such a courageous feat" when the voice starts (0:00.7) and "Salaksak, a name" at 0:04.5 on the left,
    // "Until suddenly" on the right as the first audio finishes (the second audio starts)
    captions: [
      { src: '/assets/comic/S2P2/English/ENG_SUCH A COUREOUS FEAT.webp', srcByLang: { pam: '/assets/comic/S2P2/Pampanga/PAM_SUCH A COUREOUS FEAT.webp' },
        alt: 'Such a courageous feat...', at: { x: 13.8, y: 11.4 }, clip: 0, voiceAt: 0.7, fallbackAt: 1 },
      { src: '/assets/comic/S2P2/English/ENG_SALAKSAK A NAME.webp', srcByLang: { pam: '/assets/comic/S2P2/Pampanga/PAM_SALAKSAK A NAME.webp' },
        alt: 'Salaksak, a name...', at: { x: 35.4, y: 21.2 }, clip: 0, voiceAt: 4.5, fallbackAt: 4.5 },
      { src: '/assets/comic/S2P2/English/ENG_UNTIL SUDDENLY.webp', srcByLang: { pam: '/assets/comic/S2P2/Pampanga/PAM_UNTIL SUDDENLY.webp' },
        alt: 'Until suddenly...', at: { x: 87, y: 32 }, clip: 1, voiceAt: 0, fallbackAt: 10 },
    ],
    // The sound starts 8s into narration clip 1 (clip index 0)
    sfx: [{ src: '/assets/audio/sfx/s2p2/Alligator Growl And Snap Sound Effect.mp3', on: 'enter', clip: 0, at: 8 }],
  },
  {
    id: 'page-07',
    video: '/assets/comic/S2P3/S2-P3.mp4',
    videoAspect: 1920 / 1080,   // natural 16:9 size; fills the screen on landscape, shown whole in portrait
    alt: 'Season 2, page 3 — motion graphic.',
    music:    '/assets/audio/music/theme-mystery.mp3',
    ambience: '/assets/audio/ambience/water-flow-loop.mp3',   // WATER FLOW, a 45s loop cut from the recording and raised to a usable level
    ambienceVolume: 0.5,
    // The video plays alone for 6s, then the two clips follow back to back (11.8 + 9.4s); the page turns as the 30s video ends
    narrationDelay: 6,
    narration: [
      { src: '/assets/narration/s2p3/S2-P3-NARRATOR-001.wav' },
    ],
    advanceAfter: 3,
    videoSeconds: 25,   // the growl plays 17.8-22.2s; the page turns 2.5s after it ends (about 24.7s), before the 30s video ends
    // One box, top centre of the frame (where the layout puts it); it appears at 0:07.2, where the voice starts (the clip starts at 0:06)
    captions: [
      {
        src: '/assets/comic/S2P3/English/ENG_SALAKSAKS FORM.webp',
        srcByLang: { pam: '/assets/comic/S2P3/Pampanga/PAM_SALAKSAKS FORM.webp' },
        alt: "Salaksak's form.",
        at: { x: 50.5, y: 22.9 }, clip: 0, voiceAt: 1.2, fallbackAt: 7.2,
      },
    ],
    // The phoenix roar and the shining play at 0:12 of the page; the growl plays at 0:17.8, where the (removed) second voice clip used to start
    sfx: [
      { src: '/assets/audio/sfx/s2p3/Phoenix Roars.mp3', on: 'enter', at: 12, volume: 0.6 },
      { src: '/assets/audio/sfx/s2p3/Shining SFX.mp3', on: 'enter', at: 12 },
      { src: '/assets/audio/sfx/s2p3/Stomach Growling Sound Effect.mp3', on: 'enter', at: 17.8, volume: 0.8 },
    ],
  },
  {
    id: 'page-08',
    video: '/assets/comic/s3p1/S3 P1 Motion.mp4',   // S3 page 1 (20s); muted like every page video
    alt: 'Season 3, page 8 — motion graphic.',
    music:    '/assets/audio/music/theme-mystery.mp3',
    ambience: null,
    // Layout: "Aldo the Sun" top left, "And Bulan the Moon" bottom right (the Sun and the Moon of the artwork), and the footnote hugging
    // the bottom-left corner. The voice says Aldo at ~1.0s and Bulan at ~3.9s; the footnote shows with the first box. Boxes stay.
    captions: [
      { src: '/assets/comic/s3p1/English/ENG_ALDO THE SUN.webp', srcByLang: { pam: '/assets/comic/s3p1/Pampanga/PAM_ALDO THE SUN.webp' },
        alt: 'Aldo, the Sun', at: { x: 11.2, y: 9.5 }, clip: 0, voiceAt: 1.0, fallbackAt: 1.2 },
      { src: '/assets/comic/s3p1/English/ENG_AND BULAN THE MOON.webp', srcByLang: { pam: '/assets/comic/s3p1/Pampanga/PAM_AND BULAN THE MOON.webp' },
        alt: 'And Bulan, the Moon', at: { x: 74.9, y: 92.6 }, clip: 0, voiceAt: 3.9, fallbackAt: 4 },
      { src: '/assets/comic/s3p1/English/ENG_FOOTNOTE.webp', srcByLang: { pam: '/assets/comic/s3p1/Pampanga/PAM_FOOTNOTE.webp' },
        alt: 'Footnote', at: { x: 3.8, y: 87.6, edge: 'left' }, clip: 0, voiceAt: 1.0, fallbackAt: 1.2 },
    ],
    // One 7.2s clip: the voice runs from ~1.1s to ~5.9s and the file is quiet for its last 1.3s. The page turns 1.5s after
    // the clip ends (about 2.8s after the last word) and does not wait for the rest of the 20s video.
    narration: [
      { src: '/assets/narration/s3p1/S3-P1-NARRATOR-001.wav' },
    ],
    advanceAfter: 1.5,
  },
  {
    id: 'page-09',
    video: '/assets/comic/s3p2/S3 P2 Motion.mp4',   // S3 page 2 (30s)
    alt: 'Season 3, page 9 — motion graphic.',
    music:    '/assets/audio/music/theme-mystery.mp3',
    ambience: null,
    // Part 2.1 boxes, then "The two gods" (part 2.2) at the bottom centre the moment the third voice clip starts: "In times past" top left with the first voice clip (voice ~1.6s),
    // "But with Salaksak's soul" bottom right with the second clip (voice ~2.3s in), the footnote in the bottom-left corner with the first box.
    // The boxes stay once shown.
    captions: [
      { src: '/assets/comic/s3p2/English 2.1/ENG_IN TIMES PAST.webp', srcByLang: { pam: '/assets/comic/s3p2/Pampanga 2.1/PAM_IN TIMES PAST.webp' },
        alt: 'In times past...', at: { x: 13.3, y: 14.5 }, scale: 0.8, clip: 0, voiceAt: 1.6, fallbackAt: 1.8 },
      { src: '/assets/comic/s3p2/English 2.1/ENG_BUT WITH SALAKSAKS SOUL.webp', srcByLang: { pam: '/assets/comic/s3p2/Pampanga 2.1/PAM_BUT WITH SALAKSAKS SOUL.webp' },
        alt: "But with Salaksak's soul...", at: { x: 74, y: 83 }, scale: 0.8, clip: 1, voiceAt: 2.3, fallbackAt: 9.1 },
      { src: '/assets/comic/s3p2/English 2.1/ENG_FOOTNOTE.webp', srcByLang: { pam: '/assets/comic/s3p2/Pampanga 2.1/PAM_FOOTNOTE.webp' },
        alt: 'Footnote', at: { x: 3, y: 91.1, edge: 'left' }, clip: 0, voiceAt: 1.6, fallbackAt: 1.8 },
      { src: '/assets/comic/s3p2/English 2.2/ENG_THE TWO GODS.webp', srcByLang: { pam: '/assets/comic/s3p2/Pampanga 2.2/PAM_THE TWO GODS.webp' },
        alt: 'The two gods...', at: { x: 52, y: 84.3 }, clip: 2, voiceAt: 0, fallbackAt: 17 },
    ],
    // Part 2.1 (two clips) then part 2.2, played whole back to back (6.8 + 10.2 + 8.9s); the video is 30s, so the page turns as it ends
    narration: [
      { src: '/assets/narration/s3p2/s3p2.1/S3-P2.1-NARRATOR-001 (NEW).wav' },
      { src: '/assets/narration/s3p2/s3p2.1/S3-P2.1-NARRATOR-002.wav' },
      { src: '/assets/narration/s3p2/s3p2.2/S3-P2.2-NARRATOR-001.wav' },
    ],
    advanceAfter: 3,
    videoSeconds: 30,
    // The distant explosion starts with part 2.2 (clip index 2); its boom is ~0.75s in, just before the voice (~1.2s)
    sfx: [{ src: '/assets/audio/sfx/s3p2/Distant Explosion Sound Effect Realistic Boom for Films _ Games.mp3', on: 'enter', clip: 2 }],
  },
  {
    id: 'page-10',
    video: '/assets/comic/s3p3/S3_P3 Motion.mp4',   // S3 page 3 (25s, 4200x2548, 32 MB)
    alt: 'Season 3, page 10 — motion graphic.',
    music:    '/assets/audio/music/theme-mystery.mp3',
    ambience: null,
    // Boxes in the order spoken, each where the voice says it (seconds into the one 23s clip, from its voice stretches):
    // 1.0 "But since the battle...", 8.3 "Their flames...", 11.1 "They were as tall...", 13.8 "And with it...", 16.9 "Aldo became...",
    // 20.3 "Bulan became..."; the trivia footnote comes in with "And with it..." (13.8). Positions are the ones drawn into the files.
    // When the second page of the artwork shows up (13.8s) the first three boxes clear away; the rest stay.
    captions: [
      { src: '/assets/comic/s3p3/English/ENG_BUT SINCE THE BATTLE.webp', srcByLang: { pam: '/assets/comic/s3p3/Pampanga/PAM_BUT SINCE THE BATTLE.webp' },
        alt: "But since the battle of the two gods cannot be resolved, they continued their battle down to earth.", at: { x: 16.4, y: 47.5 }, clip: 0, voiceAt: 1, fallbackAt: 1 },
      { src: '/assets/comic/s3p3/English/ENG_THEIR FLAMES TURNED INTO FLESH.webp', srcByLang: { pam: '/assets/comic/s3p3/Pampanga/PAM_THEIR FLAMES TURNED INTO FLESH.webp' },
        alt: "Their flames turned into flesh.", at: { x: 63.8, y: 25.2 }, clip: 0, voiceAt: 8.3, fallbackAt: 8.3 },
      { src: '/assets/comic/s3p3/English/ENG_AND THEY WERE AS TALL.webp', srcByLang: { pam: '/assets/comic/s3p3/Pampanga/PAM_THEY WERE AS TALL.webp' },
        alt: "They were as tall as mountains.", at: { x: 83.1, y: 81.1 }, clip: 0, voiceAt: 11.1, fallbackAt: 11.1 },
      { src: '/assets/comic/s3p3/English/ENG_WITH IT THEY GAIN NEW NAMES.webp', srcByLang: { pam: '/assets/comic/s3p3/Pampanga/PAM_WITH IT THEY GAIN NEW NAMES.webp' },
        alt: "And with it they gained new titles:", at: { x: 9.3, y: 18.3 }, clip: 0, voiceAt: 13.8, fallbackAt: 13.8,
        replaces: [0, 1, 2] },   // the second page of the artwork starts here: the first page's three boxes clear away
      { src: '/assets/comic/s3p3/English/ENG_ALDO BECAME APUNG SUKU.webp', srcByLang: { pam: '/assets/comic/s3p3/Pampanga/PAM_ALDO BECAME APUNG SUKU.webp' },
        alt: "Aldo became Apung Suku", at: { x: 88.9, y: 22.1 }, clip: 0, voiceAt: 16.9, fallbackAt: 16.9 },
      { src: '/assets/comic/s3p3/English/ENG_BULAN BECAME APUNG MALLARI.webp', srcByLang: { pam: '/assets/comic/s3p3/Pampanga/PAM_BULAN BECAME APUNG MALLARI.webp' },
        alt: "Bulan became Apung Mallari", at: { x: 17.7, y: 79.1 }, clip: 0, voiceAt: 20.3, fallbackAt: 20.3 },
      { src: '/assets/comic/s3p3/English/ENG_FOOTNOTE.webp', srcByLang: { pam: '/assets/comic/s3p3/Pampanga/PAM_FOOTNOTE.webp' },
        alt: 'Trivia: Kapampangans believed that names were a vital form of protection.', at: { x: 97.5, y: 93.5, edge: 'right' }, clip: 0, voiceAt: 13.8, fallbackAt: 13.8 },
    ],
    // One clip (23s), played whole. The page turns about 2.2s after it ends (the video is 25s and holds its last frame).
    narration: [
      { src: '/assets/narration/s3p3/S3-P3-NARRATOR-001.wav' },
    ],
    advanceAfter: 3,
    videoSeconds: 25.5,
  },
  {
    id: 'page-11',
    videoFit: 'contain',   // the whole frame, not cropped: the artwork has panels at the very edges
    video: '/assets/comic/s3p4/S3_P4 w_ audio.mp4',   // S3 page 4 (17.5s, 4200x2548, 23 MB); muted like every page video
    alt: 'Season 3, page 4 — motion graphic.',
    music:    '/assets/audio/music/theme-mystery.mp3',
    ambience: null,
    // Boxes in the order spoken, each where the voice says it (seconds into the one 16s clip, from its voice stretches; the bamboo
    // sound is not used for timing): 1.2 "They continued...", 3.5 "From the valleys", 5.3 "Down through the plains", 7.9 "To the beaches",
    // 9.7 "Their battle unceasing...". Positions follow the layout; the boxes stay.
    captions: [
      { src: '/assets/comic/s3p4/English/ENG_THEY CONTINUED THEIR FIGHT.webp', srcByLang: { pam: '/assets/comic/s3p4/Pampanga/PAM_THEY CONTINUED.webp' },
        alt: "They continued their fight—", at: { x: 10.4, y: 81.8 }, clip: 0, voiceAt: 1.2, fallbackAt: 1.2 },
      { src: '/assets/comic/s3p4/English/ENG_FROM THE VALLEYS.webp', srcByLang: { pam: '/assets/comic/s3p4/Pampanga/PAM_FROM THE VALLEYS.webp' },
        alt: "From the valleys…", at: { x: 40.6, y: 27.4 }, clip: 0, voiceAt: 3.5, fallbackAt: 3.5 },
      { src: '/assets/comic/s3p4/English/ENG_DOWN THROUGH THE PLAINS.webp', srcByLang: { pam: '/assets/comic/s3p4/Pampanga/PAM_DOWN THROUGH THE PLAINS.webp' },
        alt: "Down through the plains…", at: { x: 66.9, y: 63 }, clip: 0, voiceAt: 5.3, fallbackAt: 5.3 },
      { src: '/assets/comic/s3p4/English/ENG_TO THE BEACHES.webp', srcByLang: { pam: '/assets/comic/s3p4/Pampanga/PAM_TO THE BEACHES.webp' },
        alt: "To the beaches…", at: { x: 40.5, y: 87.8 }, clip: 0, voiceAt: 7.9, fallbackAt: 7.9 },
      { src: '/assets/comic/s3p4/English/ENG_Their battle unceasing, neither willing to back down.webp', srcByLang: { pam: '/assets/comic/s3p4/Pampanga/PAM_Their battle unceasing, neither willing to back down.webp' },
        alt: "Their battle unceasing, neither willing to back down.", at: { x: 84.3, y: 13.6 }, clip: 0, voiceAt: 9.7, fallbackAt: 9.7 },
    ],
    // The bamboo knock (~2.2s) repeats 4 times back to back
    sfx: Array.from({ length: 4 }, (_, n) => ({ src: '/assets/audio/sfx/s3p4/Bamboo hitting.mp3', on: 'enter', at: n * 2.2 || undefined })),
    narration: [
      { src: '/assets/narration/s3p4/S3-P4-NARRATOR-001.wav' },
    ],
    advanceAfter: 1.5,
  },
  {
    id: 'page-12',
    video: '/assets/comic/s3p5/S3 P5 Motion.mp4',   // S3 page 5 (25s)
    alt: 'Season 3, page 5 — motion graphic.',
    music:    '/assets/audio/music/theme-mystery.mp3',
    ambience: null,
    // seconds from when the page opens: the voice at 0:02, the tremor at 0:06, the stab and scream together at 0:18
    narrationDelay: 2,
    // Boxes in the order spoken, timed to the voice only (not the sound effects). Voice stretches: first clip (starts 0:02) at 0.8 and 3.6s,
    // second clip (starts 0:08.5) at 1.2 and 6.2s into it, third clip (starts 0:22.1, trimmed) at 0.4 and 3.7s into it. Positions are the ones drawn into the files (they match the layout). Boxes stay.
    captions: [
      { src: '/assets/comic/s3p5/English/1_UNTIL SUDDENLY.webp', srcByLang: { pam: '/assets/comic/s3p5/Pampanga/1 HANGGANG BIGLA.webp' },
        alt: "Until suddenly…", at: { x: 29.4, y: 3.9 }, clip: 0, voiceAt: 0.8, fallbackAt: 2.8 },
      { src: '/assets/comic/s3p5/English/2_INDUNG TIBUAN MOVED.webp', srcByLang: { pam: '/assets/comic/s3p5/Pampanga/2 INDUNG TIBUAN MIGLIPAT YA.webp' },
        alt: "Indung Tibuan moved.", at: { x: 7.7, y: 55.2 }, clip: 0, voiceAt: 3.6, fallbackAt: 5.6 },
      { src: '/assets/comic/s3p5/English/3_APUNG MALLARI SUDDENLY LOST HER BALANCE AND FELL.webp', srcByLang: { pam: '/assets/comic/s3p5/Pampanga/3 BIGLA YANG MEWALAN TIMBANGAN I APUNG MALLARI AT MIRAGSA YA.webp' },
        alt: "Apung Mallari suddenly lost her balance and fell.", at: { x: 15.1, y: 90.7 }, clip: 1, voiceAt: 1.2, fallbackAt: 9.7 },
      { src: '/assets/comic/s3p5/English/4_AND WITHOUT A SECOND THOUGHT APUNG SUKU STRUCK MALLARI IN THE EYE.webp', srcByLang: { pam: '/assets/comic/s3p5/Pampanga/4 AT ALANG KADUANG PAMISIP TIGLUS NENG APUNG SUKU KING MATA I MALLARI.webp' },
        alt: "And without a second thought, Apung Suku struck Mallari in the eye.", at: { x: 52.8, y: 11.9 }, clip: 1, voiceAt: 6.2, fallbackAt: 14.7 },
      { src: '/assets/comic/s3p5/English/5_APUNG MALLARI SHRIEKED IN PAIN.webp', srcByLang: { pam: '/assets/comic/s3p5/Pampanga/5 GULISAK YA KING SAKIT I APUNG MALLARI.webp' },
        alt: "Apung Mallari shrieked in pain.", at: { x: 83.5, y: 17.4 }, clip: 2, voiceAt: 0.4, fallbackAt: 22.5 },
      { src: '/assets/comic/s3p5/English/6_HER LIGHT BEGAN TO DIM.webp', srcByLang: { pam: '/assets/comic/s3p5/Pampanga/6 ING SULU NA MEGUMPISA YANG MEWALA.webp' },
        alt: "Her light began to dim.", at: { x: 87.7, y: 28.4 }, clip: 2, voiceAt: 3.7, fallbackAt: 25.9 },
    ],
    sfx: [
      { src: '/assets/audio/sfx/s3p5/EARTH SHAKING.mp3', on: 'enter', at: 6, volume: 0.35 },
      { src: '/assets/audio/sfx/s3p5/Knife Stab Original Sound Effect.mp3', on: 'enter', at: 18 },
      { src: '/assets/audio/sfx/s3p5/Female Scream Sound Effect (HD).mp3', on: 'enter', at: 18 },
    ],
    narration: [
      { src: '/assets/narration/s3p5/S3-P5-PANEL1-3-NARRATOR-001.wav' },
      // the second clip's voice ends at ~12.9s of its 15.6s: it is cut at 13.6s (a soft fade) so the last clip follows sooner
      { src: '/assets/narration/s3p5/S3-P5-PANEL1-3-NARRATOR-002.wav', maxSeconds: 13.6 },
      // the last clip skips its first 0.2s of quiet and ends after its last word (voice 0.6-2.9s and 3.9-5.7s of the 7.6s file)
      { src: '/assets/narration/s3p5/S3-P6-PANEL1-4-NARRATOR-001.wav', startSeconds: 0.2, maxSeconds: 6.3 },
    ],
    // The narration now ends at about 0:28.2 (the video is 25s and holds its last frame); the page turns 2.5s after it ends
    advanceAfter: 2.5,
  },
  {
    id: 'page-13',
    video: '/assets/comic/s3p6/S3 P6 Motion.mp4',   // S3 page 6 (25s)
    alt: 'Season 3, page 6 — motion graphic.',
    music:    '/assets/audio/music/theme-mystery.mp3',
    ambience: null,
    videoSound: true,   // this video's own audio plays...
    videoSoundFrom: 10, // ...but only from 0:10 of the video
    narrationDelay: 7.6,
    sfx: [{ src: '/assets/audio/sfx/s3p6/Wind Blowing Through Grass Sound Effect.mp3', on: 'enter', volume: 0.5 }],
    narration: [
      // The file's voice has two stretches (1.5-3.2s "he reaches his hand" and 4.3-5.5s "Mallari looks up"). In the video the hand
      // starts to reach in at ~0:07.8 and the panel with "Rise, let us cease..." comes in at ~0:11.9. The narration waits (narrationDelay 7.6s,
      // 1.2s of the file's leading quiet skipped) so the first stretch begins at 0:07.9 with the hand; the second stays at 0:09.9.
      { src: '/assets/narration/s3p6/S3-P6-PANEL1-4-NARRATOR-002.wav', startSeconds: 1.2, maxSeconds: 3.4 },
      { src: '/assets/narration/s3p6/S3-P6-PANEL1-4-NARRATOR-002.wav', startSeconds: 4.2, maxSeconds: 5.8 },
    ],
    advanceAfter: 1.5,
    videoSeconds: 25,   // the page turns as the whole 25s video ends, not when the voice does
  },
  {
    id: 'page-14',
    video: '/assets/comic/s3p7/S3p7 Motion.mp4',   // S3 page 7 (35s)
    alt: 'Season 3, page 7 — motion graphic.',
    music:    '/assets/audio/music/theme-mystery.mp3',
    ambience: null,
    // Boxes in the order spoken, each at its voice (seconds into the clip, from the voice stretches of the narration only):
    // clip 1 (cut at 0:19): 1.3 "From that day on...", 6.5 "Thus, they earned new names..."; clip 2 (starts at 0:19): 0.8 "...and Apung Mallari became Apung Punsalang";
    // the footnote comes in with that last box. Positions are the ones drawn into the files (they match the layout). Boxes stay.
    captions: [
      { src: '/assets/comic/s3p7/English/1 FROM THAT DAY ON THE TWO GODS AGREED TO DIVIDE THE HEAVENS.webp', srcByLang: { pam: '/assets/comic/s3p7/Pampanga/1 MANIBAT KING ALDONG ITA.webp' },
        alt: "From that day on, the two gods agreed to divide the heavens…", at: { x: 9.2, y: 13.9 }, clip: 0, voiceAt: 1.3, fallbackAt: 1.5 },
      { src: '/assets/comic/s3p7/English/2 THUS THEY EARNED NEW NAMES.webp', srcByLang: { pam: '/assets/comic/s3p7/Pampanga/2 MAKANYAN MIKA BAYUNG LAGYA LA.webp' },
        alt: "Thus, they earned new names: As the victor, Apung Suku became Apung Sinukuan, ruler of the day when the sun shines bright…", at: { x: 23.9, y: 30 }, clip: 0, voiceAt: 6.5, fallbackAt: 6.7 },
      { src: '/assets/comic/s3p7/English/3 AND APUNG MALLARI BECAME APUNG PUNSALANG.webp', srcByLang: { pam: '/assets/comic/s3p7/Pampanga/3 AT APUNG MALLARI MEGING YANG APUNG PUNSALANG.webp' },
        alt: "…and Apung Mallari became Apung Punsalang, ruler of the night when the moon illuminates the darkness.", at: { x: 78.4, y: 55.8 }, clip: 1, voiceAt: 0.8, fallbackAt: 19.8 },
      { src: '/assets/comic/s3p7/English/FOOTNOTE.webp', srcByLang: { pam: '/assets/comic/s3p7/Pampanga/FOOTNOTE.webp' },
        alt: 'Footnote: this celestial pact marked the origin of day and night in Kapampangan mythology. From this division, Panaun (Time) was born.', at: { x: 72.7, y: 85 }, clip: 1, voiceAt: 0.8, fallbackAt: 19.8 },
    ],
    // night until 0:20 (fades out), then dawn fades in
    sfx: [
      { src: '/assets/audio/sfx/s3p7/Night _ Midnight Sound Effect.mp3', on: 'enter', stopAt: 20, fadeMs: 1500 },
      { src: '/assets/audio/sfx/s3p7/Dawn _ Morning Sound Effect.mp3', on: 'enter', at: 20, fadeInMs: 2500 },
    ],
    narration: [
      { src: '/assets/narration/s3p7/S3-P7-NARRATOR-001.1.wav', maxSeconds: 19 },   // cut off (fading out) at 0:19
      { src: '/assets/narration/s3p7/S3-P7-NARRATOR-001.2.wav', fadeInMs: 2000 },   // eases in
    ],
    advanceAfter: 1.5,
    videoSeconds: 35,   // the page turns as the whole 35s video ends, not when the voice does
  },
  {
    id: 'page-15',
    video: '/assets/comic/s3p8/S3 P8 Motion.mp4',   // S3 page 8 (25s)
    alt: 'Season 3, page 8 — motion graphic.',
    music:    '/assets/audio/music/theme-mystery.mp3',
    ambience: null,
    // The Eagle Cry plays as the bird shows up (a first guess at 0:00.5). Boxes in the order spoken, each at its voice (seconds into the one 21s clip,
    // from its voice stretches): 0.9 "Apung Sinukuan dwelled..." (the long first sentence runs to ~13.4), 14.5 "Meanwhile, Apung Punsalang..." (the last 5 stretches, to ~19.8), the trivia footnote and "THE END" / "DULU" fade up together with the first box (0.9s). Positions are the ones drawn into the files. The boxes stay.
    sfx: [{ src: '/assets/audio/sfx/s3p8/Cinematic Eagle Cry Sound Effect.mp3', on: 'enter', at: 0.5, volume: 0.8 }],
    captions: [
      { src: '/assets/comic/s3p8/English/ENG_APUNG SINUKUAN DWELLED UPON_S3P8 CAPTION BOX.webp', srcByLang: { pam: '/assets/comic/s3p8/Pampanga/PAM_APUNG SINUKUAN DWELLED UPON_S3P8 CAPTION.webp' },
        alt: "Apung Sinukuan dwelled upon Mount Alaya, the highest and most solitary peak rising from a sea of primordial flames—a place fit for a victor.", at: { x: 16.2, y: 21.1 }, scale: 0.34, clip: 0, voiceAt: 0.9, fallbackAt: 0.9 },
      { src: '/assets/comic/s3p8/English/ENG_Meanwhile, Apung Punsalang retreated to Mount Pinatubo.webp', srcByLang: { pam: '/assets/comic/s3p8/Pampanga/PAM_Samantalang i Apung Punsalang minatras ya king Bunduk Pinatubu.webp' },
        alt: "Meanwhile, Apung Punsalang retreated to Mount Pinatubo.", at: { x: 85.7, y: 54.1 }, clip: 0, voiceAt: 14.5, fallbackAt: 14.5 },
      { src: '/assets/comic/s3p8/English/ENG_FOOTNOTE.webp', srcByLang: { pam: '/assets/comic/s3p8/Pampanga/PAM_FOOTNOTE.webp' },
        alt: "Trivia: at its heart stood Batung Maputi, the great white rock that served as Apung Sinukuan’s throne and the gateway to the upper world.", at: { x: 23.5, y: 88.9 }, clip: 0, voiceAt: 0.9, fallbackAt: 0.9 },
      { src: '/assets/comic/s3p8/English/THE END.webp', srcByLang: { pam: '/assets/comic/s3p8/Pampanga/DULU.webp' },
        alt: 'The end', at: { x: 95, y: 95.3 }, clip: 0, voiceAt: 0.9, fallbackAt: 0.9 },
    ],
    narration: [
      { src: '/assets/narration/s3p8/S3-P8-NARRATOR-001.wav' },
    ],
    advanceAfter: 1.5,
  },
];

export const totalPages = pages.length;
