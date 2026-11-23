import { gsap } from 'gsap';
import { navigate } from '../../utils/router.js';
import { AudioManager } from '../../audio/AudioManager.js';
import { toggleSettings } from '../../components/settings/settings.js';
import { pages } from '../../data/story.js';
import { captionSrc } from '../../utils/language.js';
import captionBounds from '../../data/caption-bounds.json';   // cropped caption pictures and where each sits on the frame (scripts/crop-captions.cjs)

/** The picture to load for a caption and its place on the frame (%): the small cropped copy when there is one. */
function captionAsset(c) {
  const orig = captionSrc(c);
  const b = captionBounds[orig];
  return b ? { src: b.f, box: b } : { src: orig, box: null };
}
function captionAttrs(c) {
  const { src, box } = captionAsset(c);
  return `data-src="${encodeURI(src)}"` + (box ? ` data-l="${box.l}" data-t="${box.t}" data-bw="${box.w}" data-bh="${box.h}" style="position:absolute;left:${box.l}%;top:${box.t}%;width:${box.w}%;height:${box.h}%"` : '');
}

const PRELOAD_AHEAD = 2;

// Swap caption artwork when the story language changes
document.addEventListener('language:change', () => {
  pageEls.forEach((pe, i) => {
    pe.querySelectorAll('.reader-page-caption').forEach(img => {
      const c = pages[i]?.captions?.[Number(img.dataset.captionIndex)];
      if (!c) return;
      img._panel = null;                                   // the new picture has its own measurements
      const a = captionAsset(c);
      img.dataset.src = encodeURI(a.src);
      if (a.box) {
        Object.assign(img.dataset, { l: a.box.l, t: a.box.t, bw: a.box.w, bh: a.box.h });
        img.style.cssText = `position:absolute;left:${a.box.l}%;top:${a.box.t}%;width:${a.box.w}%;height:${a.box.h}%`;
      }
      if (!img.getAttribute('src')) return;                // not fetched yet: it will load in the new language
      img.addEventListener('load', () => layoutCaptions(pe), { once: true });
      img.src = img.dataset.src;
    });
  });
});

const HUD_IDLE_MS = 2500;
const VIDEO_START_FALLBACK_MS = 900;
const PAGE_TURN_SFX = encodeURI('/assets/audio/sfx/ui/Turn a page.mp3');
const VIDEO_END_SNAP_S = 1.5;
const LANDSCAPE = '(orientation: landscape) and (min-width: 521px)';

/** Build a placeholder page for when the real image isn't available yet. */
function placeholderPage(page, index) {
  return `
    <div class="reader-page-placeholder" aria-label="${page.alt || `Page ${index + 1}`}">
      <span class="reader-placeholder-num" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
      <span class="reader-placeholder-label">[ Art placeholder — ${page.id} ]</span>
    </div>`;
}

/** Build one .reader-page element. */
function buildPageEl(page, index) {
  const el = document.createElement('div');
  el.className = 'reader-page';
  el.dataset.pageId = page.id;
  el.dataset.index  = index;

  // A page that turns itself holds its last frame; a looping video would jump back to the start (and the
  // caption boxes with it) just before the page turns.
  if (page.video) {
    el.classList.add('reader-page--video');
    el.innerHTML = `
      <canvas class="reader-page-ambient" width="32" height="18" aria-hidden="true"></canvas>
      <div class="reader-page-media"${page.videoFit === 'contain' ? ' data-fit="contain"' : ''}${page.videoAspect ? ` style="--video-ar:${page.videoAspect}${page.videoFocusY != null ? `;--focus-y:${page.videoFocusY}` : ''}"` : ''}>
        <video class="reader-page-video" data-src="${encodeURI(page.video)}" poster="${encodeURI(page.video.replace(/.mp4$/i, '.jpg'))}" disablepictureinpicture webkit-playsinline ${page.videoSound ? '' : 'muted'} ${page.advanceAfter == null ? 'loop' : ''} playsinline
               preload="${index === 0 ? 'auto' : 'metadata'}" aria-label="${page.alt || `Page ${index + 1}`}"></video>
        <div class="reader-caption-frame">
          ${(page.captions || []).map((c, i) => `
            <div class="reader-caption" data-at-x="${c.at.x}" data-at-y="${c.at.y}" data-scale="${c.scale ?? 1}"${c.at.edge ? ` data-anchor="${c.at.edge}"` : ''}>
              <img class="reader-page-caption" ${captionAttrs(c)} alt="${c.alt}" data-caption-index="${i}" draggable="false" decoding="async">
            </div>`).join('')}
        </div>
      </div>`;
    const vid = el.querySelector('video');
    if (vid && !page.videoSound) { vid.muted = true; vid.defaultMuted = true; }   // iOS only autoplays a video that is really muted
    return el;
  }

  // Image with WebP + fallback (using <picture> when both exist)
  const imgSrc = page.image;
  const jpgSrc = imgSrc.replace(/\.webp$/, '.jpg');

  el.innerHTML = `
    ${placeholderPage(page, index)}
    <picture>
      <source srcset="${imgSrc}" type="image/webp">
      <img class="reader-page-img" src="${jpgSrc}" alt="${page.alt || `Page ${index + 1}`}">
    </picture>
    ${(page.layers || []).map(l =>
      `<div class="reader-parallax-layer"
            style="background-image:url('${l.src}');background-position:${l.position || 'center'}"
            data-depth="${l.depth}"></div>`
    ).join('')}`;

  // Hide placeholder once image loads
  const img = el.querySelector('.reader-page-img');
  const ph  = el.querySelector('.reader-page-placeholder');
  img.addEventListener('load', () => { if (ph) ph.style.display = 'none'; });

  return el;
}

export function createReaderScreen() {
  const el = document.createElement('div');
  el.className = 'screen screen-reader';
  el.dataset.screen = '#reader';

  el.innerHTML = `
    <div class="reader-stage" aria-live="polite" aria-atomic="true"></div>
    <p class="reader-loading" role="status">LOADING...</p>

    <div class="reader-hud" aria-label="Reader controls">
      <!-- Top HUD -->
      <div class="reader-hud-top" id="reader-hud-top">
        <div class="reader-hud-left">
          <!-- Home -->
          <button class="reader-hud-img-btn" id="reader-home-btn" aria-label="Return to home">
            <img src="/assets/ui/Icon/BACK.png" class="reader-hud-btn-img" alt="" aria-hidden="true" draggable="false"/>
          </button>
          <!-- Restart -->
          <button class="reader-hud-img-btn reader-hud-restart-btn" id="reader-restart-btn" aria-label="Restart from page 1">
            <span class="reader-restart-label">Restart</span>
          </button>
          <!-- Autoplay -->
          <button class="reader-hud-img-btn" id="reader-autoplay-btn" aria-label="Toggle autoplay" aria-pressed="false">
            <img src="/assets/ui/Icon/AUTOPLAY OFF.png" class="reader-hud-btn-img" alt="" aria-hidden="true" draggable="false"/>
          </button>
        </div>
        <div class="reader-hud-right">
          <!-- Settings -->
          <button class="reader-hud-img-btn" id="reader-settings-btn" aria-label="Open audio settings" aria-expanded="false">
            <img src="/assets/ui/Icon/HAMBURG.png" class="reader-hud-btn-img" alt="" aria-hidden="true" draggable="false"/>
          </button>
        </div>
      </div>

      <!-- Prev arrow -->
      <div class="reader-nav reader-nav-prev">
        <button class="reader-nav-btn" id="reader-prev-btn" aria-label="Previous page">
          <img src="/assets/ui/NEXT BUTTON.png" class="nav-arrow-img nav-arrow-flip" alt="" aria-hidden="true" draggable="false"/>
        </button>
      </div>

      <!-- Next arrow -->
      <div class="reader-nav reader-nav-next">
        <button class="reader-nav-btn" id="reader-next-btn" aria-label="Next page">
          <img src="/assets/ui/NEXT BUTTON.png" class="nav-arrow-img" alt="" aria-hidden="true" draggable="false"/>
        </button>
      </div>

      <!-- Bottom progress -->
      <div class="reader-progress" id="reader-progress">
        <div class="reader-progress-track" id="reader-progress-track">
          <div class="reader-progress-fill" id="reader-progress-fill"></div>
          <img class="reader-progress-frame" src="/assets/ui/PROGRESS BAR.png"
               alt="" draggable="false" aria-hidden="true"/>
        </div>
      </div>

    </div>
  `;

  return el;
}

/** @type {number} */
let currentIndex = 0;
/** @type {HTMLElement[]} */
let pageEls = [];
/** @type {boolean} */
let isTransitioning = false;
/** @type {HTMLElement|null} */
let readerEl = null;
/** @type {number|null} */
let advanceTimer = null;
/** @type {number} page whose video may play (set when a page becomes current) */
let videoTarget = -1;
/** @type {number|null} */
let holdPage = false;   // autoplay switched off for the current page; cleared whenever the page changes

/** @param {HTMLElement} el */
/** The bars beside or above a picture that does not fill the screen glow with the picture's own colours
 *  (a tiny copy of the current frame, blurred), instead of showing flat black. */
let ambientTimer = null;
function startAmbient() {
  clearInterval(ambientTimer);
  const draw = () => {
    const pe = pageEls[currentIndex];
    const cv = pe?.querySelector('.reader-page-ambient');
    const v = pe?.querySelector('video');
    if (!cv || !v || v.readyState < 2) return;
    try { cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height); } catch { /* frame not ready */ }
  };
  draw();
  ambientTimer = setInterval(draw, 400);
}

/** ?debug in the address shows what the current page's video is doing (for phones that will not play it). */
function startVideoDebug() {
  if (!/debug/.test(location.href) || document.getElementById('video-debug')) return;
  const box = document.createElement('pre');
  box.id = 'video-debug';
  box.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:99999;margin:0;padding:6px 8px;max-width:70vw;background:rgba(0,0,0,0.78);color:#7CFC00;font:11px/1.25 monospace;white-space:pre-wrap;pointer-events:none';
  document.body.appendChild(box);
  const t = document.createElement('video');
  const can = ['video/mp4; codecs="avc1.4D0032"', 'video/mp4; codecs="avc1.4D0028"', 'video/mp4'].map(x => t.canPlayType(x) || 'no').join('/');
  setInterval(() => {
    const v = pageEls[currentIndex]?.querySelector('video');
    if (!v) { box.textContent = 'page ' + currentIndex + ': no video'; return; }
    box.textContent = [
      'page ' + currentIndex + ' src=' + (v.getAttribute('src') ? 'yes' : 'NO'),
      'ready=' + v.readyState + ' net=' + v.networkState + ' paused=' + v.paused,
      'time=' + v.currentTime.toFixed(1) + ' / ' + (v.duration || 0).toFixed(1),
      'size=' + v.videoWidth + 'x' + v.videoHeight + ' muted=' + v.muted,
      'error=' + (v.error ? v.error.code + ' ' + (v.error.message || '') : 'none'),
      'canPlay=' + can + '  ios=' + (navigator.userAgent.match(/OS ([0-9_]+)/) || [])[1],
    ].join('\n');
  }, 500);
}

export function mountReader(el) {
  readerEl = el;
  startVideoDebug();
  startAmbient();
  const stage    = el.querySelector('.reader-stage');
  const hudTop   = el.querySelector('#reader-hud-top');
  const prevBtn  = el.querySelector('#reader-prev-btn');
  const nextBtn  = el.querySelector('#reader-next-btn');
  const progFill = el.querySelector('#reader-progress-fill');
  const refs = { stage, prevBtn, nextBtn, progFill, el };

  if (!el._mounted) {
    el._mounted = true;

    // Build page DOM once
    pageEls = pages.map((p, i) => {
      const pe = buildPageEl(p, i);
      stage.appendChild(pe);
      return pe;
    });

    // Decode caption pictures now so they are ready to fade in without a hitch
    stage.querySelectorAll('.reader-page-caption').forEach(img => {
      const done = () => layoutCaptions(img.closest('.reader-page'));
      img.addEventListener('load', () => { img._panel = null; done(); });   // also after a retry
      (img.decode ? img.decode() : Promise.resolve()).then(done, done);
    });
    // The picture is cropped differently on every screen shape: re-fit when it changes
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => layoutCaptions(pageEls[currentIndex]), 120);
    });

    // HUD — always visible
    function showHud() {
      [hudTop, ...el.querySelectorAll('.reader-nav'), el.querySelector('#reader-progress')]
        .forEach(h => h && h.classList.add('show'));
    }
    el._showHud = showHud;
    document.addEventListener('settings:closed', () => wakeHud(el));   // buttons come back, then idle out again
    ['pointermove', 'pointerdown', 'keydown'].forEach(t => el.addEventListener(t, () => wakeHud(el), { passive: true }));
    el._stopHud = () => {};

    // Navigation: buttons
    prevBtn.addEventListener('click', () => goTo(currentIndex - 1, 'prev', el));
    nextBtn.addEventListener('click', () => {
      if (currentIndex >= pages.length - 1) {
        navigate('#minigame-loading');
      } else {
        goTo(currentIndex + 1, 'next', el);
      }
    });

    // Navigation: keyboard (only fires when reader is the active screen)
    document.addEventListener('keydown', e => {
      if (!el.classList.contains('active')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(currentIndex + 1, 'next', el);
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(currentIndex - 1, 'prev', el);
    });

    // Navigation: touch swipe
    let touchStartX = 0, touchStartY = 0;
    stage.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    stage.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        dx < 0 ? goTo(currentIndex + 1, 'next', el) : goTo(currentIndex - 1, 'prev', el);
      }
    }, { passive: true });

    // Navigation: horizontal wheel / trackpad
    let wheelLock = false;
    stage.addEventListener('wheel', e => {
      if (wheelLock) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 30) return;
      wheelLock = true;
      setTimeout(() => { wheelLock = false; }, 700);
      delta > 0 ? goTo(currentIndex + 1, 'next', el) : goTo(currentIndex - 1, 'prev', el);
    }, { passive: true });

    // Navigation: click left/right half
    stage.addEventListener('click', e => {
      // Ignore clicks that originated from HUD buttons
      if (e.target.closest('.reader-hud')) return;
      const x = e.clientX / window.innerWidth;
      if (x > 0.55)      goTo(currentIndex + 1, 'next', el);
      else if (x < 0.45) goTo(currentIndex - 1, 'prev', el);
    });

    // HUD action buttons
    el.querySelector('#reader-home-btn').addEventListener('click', () => {
      AudioManager.pauseAll();
      navigate('#home');
    });

    el.querySelector('#reader-restart-btn').addEventListener('click', () => {
      goTo(0, currentIndex > 0 ? 'prev' : 'next', el);
    });

    // Autoplay is on by default: a page turns itself once its narration is done. Pressing the button holds
    // the current page for as long as the reader likes; swiping or pressing next/previous moves on and
    // autoplay is back on for the next page.
    el.querySelector('#reader-autoplay-btn').addEventListener('click', () => setHold(el, !holdPage));

    el.querySelector('#reader-settings-btn').addEventListener('click', toggleSettings);
  }

  // Every visit starts at page 1
  activatePage(0, null, refs);
  preloadAhead(0);
  if (el._showHud) el._showHud();
}

/** @param {HTMLElement} el */
export function unmountReader(el) {
  clearInterval(ambientTimer);
  pageEls.forEach(pe => pe.querySelector('video')?.pause());
  resetCaptions();
  clearTimeout(advanceTimer);
  setHold(el, false);
  stopPageSfx();
  AudioManager.stopNarration();
  AudioManager.stopAmbience({ fade: true });
  clearTimeout(el._hudIdleTimer);
  el.classList.remove('hud-idle');
  if (el._hideTimer) el._hideTimer();
  gsap.killTweensOf(pageEls);
}

// ─────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────

/** A page's sound effects belong to that page: they fade out when it is left, instead of playing on over the next one. */
const pageSfx = new Set();
function playPageSfx(src, volume, fadeInMs = 0) {
  pageSfx.add(src);
  AudioManager.playSfx(src, volume, null, fadeInMs);
}
function stopPageSfx() {
  pageSfx.forEach(src => AudioManager.stopSfx(src, null, 350));
  pageSfx.clear();
}

function goTo(idx, direction, rootEl) {
  if (idx < 0 || idx >= pages.length || isTransitioning) return;
  stopPageSfx();
  AudioManager.stopNarration();   // the voice stops as you turn, not when the next page has finished sliding in
  const refs = getRefs(rootEl);
  transitionTo(idx, direction, refs);
}

function getRefs(el) {
  return {
    stage:    el.querySelector('.reader-stage'),
    prevBtn:  el.querySelector('#reader-prev-btn'),
    nextBtn:  el.querySelector('#reader-next-btn'),
    progFill: el.querySelector('#reader-progress-fill'),
    el,
  };
}

/** Video pages: portrait keeps the buttons clear of the picture (see .is-video-page in reader.css). */
function markVideoPage(el, idx) {
  if (!el) return;
  el.classList.toggle('is-video-page', !!pages[idx]?.video);
  wakeHud(el);
}

const settingsOpen = () => !!document.querySelector('.settings-overlay.open');

/** Show the buttons; on a landscape video page, hide them again after a few idle seconds. */
function wakeHud(el) {
  el.classList.remove('hud-idle');
  clearTimeout(el._hudIdleTimer);
  if (el.classList.contains('is-video-page') && window.matchMedia(LANDSCAPE).matches) {
    // the buttons stay while the settings panel is open
    el._hudIdleTimer = setTimeout(() => { if (!settingsOpen()) el.classList.add('hud-idle'); }, HUD_IDLE_MS);
  }
}

/**
 * Put the current page's video back on its first frame; pause every other one.
 * A page with narration waits for the voice to start (see playPageVideo) so the picture and the
 * voice finish together; other video pages start right away.
 */
function syncVideos(idx) {
  videoTarget = idx;
  manageVideos(idx);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  pageEls.forEach((pe, i) => {
    const v = pe.querySelector('video');
    if (!v) return;
    v.pause();
    if (i !== idx) return;
    v.currentTime = 0;
    if (!pages[i].narration) playPageVideo(i);
  });
}

/** If the picture has not really started 1.5s after it should have, offer a big Play button (iPhone Low Power Mode, stalled download). */
function watchStart(idx, v) {
  const pe = pageEls[idx];
  clearTimeout(pe._startCheck);
  // a video can report "playing" while nothing is drawn (seen on one iPhone): count real frames, not the clock
  if (v.requestVideoFrameCallback && !v._frameWatch) {
    v._frameWatch = true;
    const onFrame = () => { v._framed = true; };
    v.requestVideoFrameCallback(onFrame);
    v.addEventListener('emptied', () => { v._framed = false; v._frameWatch = false; });
  }
  pe._startCheck = setTimeout(() => {
    if (idx !== videoTarget) return;
    const drawing = v.requestVideoFrameCallback ? !!v._framed : true;
    const moving = !v.paused && v.currentTime > 0.05 && drawing;
    let btn = pe.querySelector('.reader-tap-play');
    if (moving) { btn?.remove(); return; }
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'reader-tap-play';
      btn.setAttribute('aria-label', 'Play the picture');
      btn.textContent = '▶';
      const note = document.createElement('span');
      note.className = 'reader-tap-note';
      btn.appendChild(note);
      btn.addEventListener('click', e => {
        e.stopPropagation();
        v.muted = !pages[idx].videoSound;
        if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src;
        v._framed = false;
        const go = () => v.play().then(() => setTimeout(() => { if (v._framed || !v.requestVideoFrameCallback) btn.remove(); }, 800)).catch(() => {});
        if (v.readyState === 0 || v.error) { v.load(); v.addEventListener('loadeddata', go, { once: true }); } else go();
        if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(() => { v._framed = true; });
      });
      pe.appendChild(btn);
    }
    const note = btn.querySelector('.reader-tap-note');
    if (note) note.textContent = 'ready ' + v.readyState + ' · ' + (v.paused ? 'paused' : 'playing') + ' · ' + v.videoWidth + 'x' + v.videoHeight + (v.error ? ' · err ' + v.error.code : '');
    // keep checking: once it moves, the button goes away
    pe._startCheck = setTimeout(() => watchStart(idx, v), 1500);
  }, 1500);
}

function playPageVideo(idx) {
  const v = pageEls[idx]?.querySelector('video');
  if (!v || idx !== videoTarget) return;   // the reader has moved on
  // Reduce Motion is on (a common iPhone setting): do not start the animation by itself, but offer a Play button so the story is still reachable
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { watchStart(idx, v); return; }
  // videoSoundFrom: the video's own audio stays off until it reaches that many seconds
  const from = pages[idx].videoSoundFrom;
  if (from != null && !v._soundGate) {
    v._soundGate = true;
    v.addEventListener('timeupdate', () => { v.muted = v.currentTime < from; });
  }
  if (from != null) v.muted = v.currentTime < from;
  watchStart(idx, v);
  const p = v.play();
  p?.catch(() => {
    // autoplay blocked (iOS Low Power Mode, data saver): the poster stays up and the next tap starts the picture
    const kick = () => { if (idx === videoTarget && v.paused) v.play().catch(() => {}); };
    document.addEventListener('pointerdown', kick, { once: true, capture: true });
    document.addEventListener('touchend', kick, { once: true, capture: true });
  });
}

/**
 * Where the panel is drawn inside its frame-sized PNG: its centre and size, in % of the frame.
 * Measured once from the picture's opaque pixels, so a new caption only needs its target position.
 */
function measurePanel(img) {
  if (img._panel) return img._panel;
  if (img.dataset.bw) {                                 // cropped picture: its place on the frame is known
    const l = +img.dataset.l, t = +img.dataset.t, w = +img.dataset.bw, h = +img.dataset.bh;
    return (img._panel = { cx: l + w / 2, cy: t + h / 2, w, h });
  }
  const W = 400, H = Math.max(1, Math.round(W * img.naturalHeight / img.naturalWidth));
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, W, H);
  const px = g.getImageData(0, 0, W, H).data;
  let l = W, t = H, r = -1, b = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (px[(y * W + x) * 4 + 3] > 40) { if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y; }
    }
  }
  if (r < 0) return (img._panel = { cx: 50, cy: 50, w: 0, h: 0 });
  return (img._panel = {
    cx: (l + r + 1) / 2 / W * 100, cy: (t + b + 1) / 2 / H * 100,
    w: (r - l + 1) / W * 100,      h: (b - t + 1) / H * 100,
  });
}

/** How far to move [a,b] so it sits inside [lo,hi] (0 if it already does, or can't fit). */
const nudge = (a, b, lo, hi) => (b - a > hi - lo ? 0 : a < lo ? lo - a : b > hi ? hi - b : 0);

/**
 * Put each caption panel at its designed spot on the picture. If a narrower screen crops the
 * picture so that the panel would be cut off at the edge, slide it back inside (3% margin).
 */
function layoutCaptions(pe) {
  const frame = pe?.querySelector('.reader-caption-frame');
  const media = pe?.querySelector('.reader-page-media');
  if (!frame || !media) return;
  const fr = frame.getBoundingClientRect();
  const mr = media.getBoundingClientRect();
  if (!fr.width || !mr.width) return;
  const mx = mr.width * 0.03, my = mr.height * 0.03;

  pe.querySelectorAll('.reader-caption').forEach(wrap => {
    const img = wrap.firstElementChild;
    if (!img?.naturalWidth) return;                    // not loaded yet; laid out again once decoded
    const p = measurePanel(img);
    const ax = Number(wrap.dataset.atX), ay = Number(wrap.dataset.atY), k = Number(wrap.dataset.scale) || 1;
    const pw = p.w * k, ph = p.h * k;                   // size on screen, after the optional shrink
    // at.edge: 'left' (or 'right') means x is the box's LEFT (or RIGHT) edge (so boxes of different widths, e.g. English and Kapampangan, line up on the left)
    const axc = wrap.dataset.anchor === 'left' ? ax + pw / 2 : wrap.dataset.anchor === 'right' ? ax - pw / 2 : ax;
    const left = fr.left + (axc - pw / 2) / 100 * fr.width;
    const top = fr.top + (ay - ph / 2) / 100 * fr.height;
    const nx = nudge(left, left + pw / 100 * fr.width, mr.left + mx, mr.right - mx);
    const ny = nudge(top, top + ph / 100 * fr.height, mr.top + my, mr.bottom - my);
    wrap.style.transformOrigin = `${p.cx}% ${p.cy}%`;   // shrink around the panel's own centre
    wrap.style.scale = k === 1 ? '' : String(k);
    // percentages are of the frame (the wrapper is frame-sized), then the px nudge
    wrap.style.translate = `calc(${(axc - p.cx).toFixed(3)}% + ${nx.toFixed(1)}px) calc(${(ay - p.cy).toFixed(3)}% + ${ny.toFixed(1)}px)`;
  });
}

/** Fade a caption panel up into place over the video. */
function revealCaption(img, replaced = []) {
  if (!img || img._shown) return;
  img._shown = true;
  // a box drawn over the same spot takes the place of the earlier one
  replaced.forEach(o => { if (o?._shown) { o._shown = false; gsap.killTweensOf(o); gsap.to(o, { opacity: 0, duration: 0.5, ease: 'power1.out' }); } });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.killTweensOf(img);
  if (reduced) { gsap.set(img, { opacity: 1, y: 0 }); return; }

  // Start the fade only once the picture is decoded, otherwise the first frames are skipped and it pops
  const rise = () => {
    if (!img._shown) return;
    gsap.fromTo(img,
      { opacity: 0, y: 56 },
      { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' });
  };
  (img.decode ? img.decode() : Promise.resolve()).then(rise, rise);
}

/** Hide every caption and cancel any pending reveal (on leaving a page, or restarting it). */
function resetCaptions() {
  pageEls.forEach(pe => {
    pe._capTimers?.forEach(clearTimeout);
    pe._capTimers = null;
    pe.querySelectorAll('.reader-page-caption').forEach(img => {
      img._shown = false;
      gsap.killTweensOf(img);
      gsap.set(img, { opacity: 0, y: 0 });
    });
  });
}

/**
 * Caption i appears when narration clip i starts. If the narration can't start (audio not
 * unlocked yet, file missing), each caption still appears at its fallbackAt time.
 */
function startCaptions(idx) {
  resetCaptions();
  const page = pages[idx];
  if (!page?.captions) return;
  const imgs = [...pageEls[idx].querySelectorAll('.reader-page-caption')];
  layoutCaptions(pageEls[idx]);
  pageEls[idx]._capTimers = page.captions.map((c, i) =>
    setTimeout(() => revealCaption(imgs[i], (c.replaces || []).map(k => imgs[k])), (c.fallbackAt ?? 0) * 1000));
  return imgs;
}

/** Instantly set a page active (no animation) */
function activatePage(idx, _direction, refs) {
  markVideoPage(refs.el, idx);
  syncVideos(idx);
  pageEls.forEach((pe, i) => {
    pe.classList.toggle('is-current', i === idx);
    gsap.set(pe, { opacity: i === idx ? 1 : 0, x: 0 });
  });
  currentIndex = idx;
  updateUI(refs);
  triggerPageAudio(idx);
}

/** Animated transition to a page */
function transitionTo(idx, direction, refs) {
  if (isTransitioning || idx === currentIndex) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const outEl = pageEls[currentIndex];
  const inEl  = pageEls[idx];
  const sign   = direction === 'next' ? 1 : -1;

  isTransitioning = true;
  AudioManager.playSfx(PAGE_TURN_SFX);
  markVideoPage(refs.el, idx);
  syncVideos(idx);

  if (reduced) {
    gsap.set(outEl, { opacity: 0 });
    gsap.set(inEl,  { opacity: 1, x: 0 });
    outEl.classList.remove('is-current');
    inEl.classList.add('is-current');
    currentIndex = idx;
    isTransitioning = false;
    updateUI(refs);
    triggerPageAudio(idx);
    preloadAhead(idx);
    return;
  }

  // Position incoming page off screen
  gsap.set(inEl, { x: sign * 1920, opacity: 1 });
  inEl.classList.add('is-current');

  gsap.timeline({ onComplete: () => { isTransitioning = false; } })
    .to(outEl, { x: -sign * 200, opacity: 0, duration: 0.45, ease: 'power2.in' }, 0)
    .to(inEl,  { x: 0,            opacity: 1, duration: 0.55, ease: 'power2.out' }, 0.08)
    .add(() => {
      outEl.classList.remove('is-current');
      gsap.set(outEl, { x: 0 });
      currentIndex = idx;
      updateUI(refs);
      triggerPageAudio(idx);
      preloadAhead(idx);
    });
}

function updateUI({ prevBtn, nextBtn, progFill }) {
  const i   = currentIndex;
  const n   = pages.length;
  const pct = (n > 1) ? (i / (n - 1)) * 100 : 100;

  if (prevBtn) prevBtn.disabled = i === 0;
  if (nextBtn) nextBtn.disabled = false; // last page leads to minigame, never disabled
  if (progFill) progFill.style.setProperty('--p', String(pct / 100));

}

let gateToken = 0;
let loadingTimer = 0;

/** Resolves when the video can play through (or after maxMs, or if it fails), so a slow download is waited for. */
function whenVideoReady(v, maxMs = 6000) {
  return new Promise((resolve) => {
    if (v.readyState >= 3) { resolve(); return; }
    v.preload = 'auto';
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      v.removeEventListener('canplay', finish);
      v.removeEventListener('error', finish);
      resolve();
    };
    v.addEventListener('canplay', finish);
    v.addEventListener('error', finish);   // the retry (asset-guard) may still bring it in; do not wait forever
    setTimeout(finish, maxMs);
  });
}

/**
 * A page's sound, voice and captions begin together with its picture. If the picture (video) has not
 * downloaded enough to play, wait for it (showing LOADING...) instead of letting the voice run over a blank page.
 */
function triggerPageAudio(idx) {
  const page = pages[idx];
  if (!page) return;
  const token = ++gateToken;
  clearTimeout(loadingTimer);
  // The last page's voice, sounds and caption timers end now, even while this page is still loading
  stopPageSfx();
  AudioManager.stopNarration();
  clearTimeout(advanceTimer);
  resetCaptions();
  setHold(readerEl, false);   // each new page starts with autoplay on

  const v = pageEls[idx]?.querySelector('video');
  if (v && v.readyState < 3) {
    // the label only shows if it takes a moment (a quick seek back to the first frame is not worth a flash)
    loadingTimer = setTimeout(() => readerEl?.classList.add('is-loading'), 400);
    whenVideoReady(v).then(() => {
      clearTimeout(loadingTimer);
      readerEl?.classList.remove('is-loading');
      if (token === gateToken && idx === currentIndex) runPageAudio(idx);
    });
    return;
  }
  readerEl?.classList.remove('is-loading');
  runPageAudio(idx);
}

function runPageAudio(idx) {
  const page = pages[idx];
  if (!page) return;
  const captionImgs = startCaptions(idx);

  if (page.music)    AudioManager.playMusic(page.music);
  if (page.ambience) AudioManager.playAmbience(page.ambience, { gain: page.ambienceVolume ?? 1 });
  else if (page.ambience === null) AudioManager.stopAmbience({ fade: true });
  // The video starts with the voice; if the voice can't start (audio blocked), start it anyway
  if (page.video && page.narration) {
    (pageEls[idx]._capTimers ||= []).push(setTimeout(() => playPageVideo(idx), VIDEO_START_FALLBACK_MS));
  }
  // narrationDelay: the video plays on its own for that many seconds before the voice begins
  const startNarration = () => AudioManager.playNarration(page.narration || null, {
    onTrack: i => {
      if (i === 0) playPageVideo(idx);
      // sounds tied to this narration clip start with it (plus their own delay, if any)
      (page.sfx || []).filter(s => s.clip === i).forEach(s => {
        const src = encodeURI(s.src);
        (pageEls[idx]._capTimers ||= []).push(setTimeout(() => playPageSfx(src, s.volume ?? 1), (s.at || 0) * 1000));
      });
      // sounds that end when this clip starts (e.g. a wind that runs until the third clip arrives)
      (page.sfx || []).filter(s => s.stopAtClip === i).forEach(s => AudioManager.stopSfx(encodeURI(s.src), null, s.fadeMs ?? 600));
      // boxes for this clip: caption k belongs to clip k unless it names another with `clip`, so several
      // boxes can share one clip, each shown `voiceAt` seconds after the clip starts
      (page.captions || []).forEach((cap, k) => {
        if ((cap.clip ?? k) !== i) return;
        // wait for the voice itself (clips can open with a moment of silence)
        const t = setTimeout(() => revealCaption(captionImgs?.[k], (cap.replaces || []).map(n => captionImgs?.[n])), (cap.voiceAt ?? 0) * 1000);
        pageEls[idx]._capTimers?.push(t);
      });
    },
    // After the last clip: wait, then turn the page (unless the reader already moved on)
    onEnd: () => {
      if (page.advanceAfter == null || holdPage) return;
      let wait = page.advanceAfter;
      // If the video is about to finish anyway, turn the page as it does, so the last frame never sits still
      const v = pageEls[idx]?.querySelector('video');
      if (v && !v.loop && v.duration) {
        const left = (v.duration - v.currentTime) / v.playbackRate;
        if (page.videoSeconds != null) wait = Math.max(page.videoSeconds - (v.currentTime || 0) - 0.3, 0);   // turn as the 9s cut ends
        else if (Math.abs(left - wait) <= VIDEO_END_SNAP_S) wait = Math.max(left - 0.3, 0);   // start sliding just before the end
      }
      advanceTimer = setTimeout(() => {
        if (!holdPage && currentIndex === idx && readerEl?.classList.contains('active')) goTo(idx + 1, 'next', readerEl);
      }, wait * 1000);
    },
  });
  // A page with no narration turns itself when its video ends (after the `advanceAfter` pause)
  if (!page.narration && page.video && page.advanceAfter != null) {
    const v = pageEls[idx]?.querySelector('video');
    if (v) {
      const onEnded = () => {
        v.removeEventListener('ended', onEnded);
        if (idx !== currentIndex) return;
        advanceTimer = setTimeout(() => {
          if (!holdPage && currentIndex === idx && readerEl?.classList.contains('active')) goTo(idx + 1, 'next', readerEl);
        }, page.advanceAfter * 1000);
      };
      v.addEventListener('ended', onEnded);
    }
  }
  if (page.narrationDelay && page.narration) {
    playPageVideo(idx);
    (pageEls[idx]._capTimers ||= []).push(setTimeout(startNarration, page.narrationDelay * 1000));
  } else {
    startNarration();
  }

  // 'enter' sounds play when the page opens; with `at` they wait that many seconds first (cleared if the page is left)
  (page.sfx || []).filter(s => s.on === 'enter' && s.clip == null).forEach(s => {
    const src = encodeURI(s.src);
    if (s.stopAt != null) (pageEls[idx]._capTimers ||= []).push(setTimeout(() => AudioManager.stopSfx(src, null, s.fadeMs ?? 600), s.stopAt * 1000));   // cut off this many seconds after the page opens
    if (!s.at) { playPageSfx(src, s.volume ?? 1, s.fadeInMs); return; }
    (pageEls[idx]._capTimers ||= []).push(setTimeout(() => playPageSfx(src, s.volume ?? 1, s.fadeInMs), s.at * 1000));
  });
}

/** Hold the current page (autoplay off), or let it turn itself again. */
function setHold(el, on) {
  holdPage = on;
  if (on) clearTimeout(advanceTimer);   // a turn already waiting is cancelled
  const btn = el?.querySelector('#reader-autoplay-btn');
  btn?.classList.toggle('autoplay-active', !on);
  const icon = btn?.querySelector('img');
  if (icon) icon.src = on ? '/assets/ui/Icon/AUTOPLAY ON.png' : '/assets/ui/Icon/AUTOPLAY OFF.png';   // autoplay running = plain arrow; page held (autoplay off) = arrow with the cross
  btn?.setAttribute('aria-pressed', String(on));
}

/** Caption pictures are big (frame-sized), so only the current page and the next ones are fetched, not all of them at once. */
function loadCaptions(pe) {
  pe?.querySelectorAll('.reader-page-caption').forEach(img => {
    if (!img.getAttribute('src') && img.dataset.src) img.src = img.dataset.src;
  });
}

/**
 * Phones can only keep a few videos in memory (iPhone Safari drops them silently: black picture, or a frozen frame).
 * So only the current page's video and the next one have a source; every other video is emptied.
 */
function manageVideos(idx) {
  pageEls.forEach((pe, i) => {
    const v = pe.querySelector('video');
    if (!v) return;
    const keep = i === idx || i === idx + 1;
    if (keep && !v.getAttribute('src') && v.dataset.src) {
      v.preload = i === idx ? 'auto' : 'metadata';
      v.src = v.dataset.src;
      v._assetSrc = null;
    } else if (!keep && v.getAttribute('src')) {
      v.pause();
      v.removeAttribute('src');
      v._assetSrc = null; v._assetTries = 0;
      v.load();                                   // releases the decoder and its buffers
    }
  });
}

function preloadAhead(idx) {
  manageVideos(idx);
  loadCaptions(pageEls[idx]);
  loadCaptions(pageEls[idx - 1]);
  for (let i = idx + 1; i <= idx + PRELOAD_AHEAD && i < pages.length; i++) {
    loadCaptions(pageEls[i]);
    const img = pageEls[i]?.querySelector('.reader-page-img');
    if (img && !img.src) img.src = pages[i].image;
  }
}
