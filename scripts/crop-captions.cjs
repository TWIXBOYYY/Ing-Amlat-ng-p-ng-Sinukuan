// Crops every frame-sized caption picture (4200x2548, mostly empty) to just its box, and records where the box sits.
// Why: a phone has to decode every full-size picture in memory; the cropped copies are ~50x smaller.
// Output: public/assets/captions/<same path>.webp  and  src/data/caption-bounds.json  { "<original src>": { f, l, t, w, h } } (percent of the frame)
const fs = require('fs'), path = require('path');
const sharp = require('sharp');
const story = fs.readFileSync('src/data/story.js', 'utf8');
const srcs = [...new Set([...story.matchAll(/'(\/assets\/comic\/[^']+\.webp)'/g)].map(m => m[1]))].filter(s => /\/(English|Pampanga)[^/]*\//.test(s));
(async () => {
  const out = {}; let before = 0, after = 0;
  for (const s of srcs) {
    const file = 'public' + s;
    if (!fs.existsSync(file)) continue;
    const meta = await sharp(file).metadata();
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let l = info.width, t = info.height, r = -1, b = -1;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 8) { if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y; }
    }
    if (r < 0) continue;
    const pad = 2; l = Math.max(0, l - pad); t = Math.max(0, t - pad); r = Math.min(info.width - 1, r + pad); b = Math.min(info.height - 1, b + pad);
    const w = r - l + 1, h = b - t + 1;
    const rel = s.replace('/assets/comic/', '');
    const dest = path.join('public/assets/captions', rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await sharp(file).extract({ left: l, top: t, width: w, height: h }).webp({ quality: 90 }).toFile(dest);
    before += fs.statSync(file).size; after += fs.statSync(dest).size;
    out[s] = { f: '/assets/captions/' + rel, l: +(l / info.width * 100).toFixed(3), t: +(t / info.height * 100).toFixed(3), w: +(w / info.width * 100).toFixed(3), h: +(h / info.height * 100).toFixed(3) };
  }
  fs.writeFileSync('src/data/caption-bounds.json', JSON.stringify(out, null, 1));
  console.log('cropped', Object.keys(out).length, 'files;', (before / 1e6).toFixed(1), 'MB ->', (after / 1e6).toFixed(1), 'MB');
})();
