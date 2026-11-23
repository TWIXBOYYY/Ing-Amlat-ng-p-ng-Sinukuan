import { gsap } from 'gsap';
import { navigate } from '../../utils/router.js';
import { addParallaxLayers, startParallax } from '../../utils/parallax-bg.js';
import { playClickSound } from '../../audio/ui-sounds.js';
import { preloadImage } from '../../utils/asset-guard.js';


const DAY_BG   = '/assets/ui/MT.ALAYA_DAY.webp';
const NIGHT_BG = '/assets/ui/MT.ALAYA_DAY__NIGHT.webp';

/** The sun + LOADING... + progress bar over a parallax mountain. Day for the start, night for the minigame. */
const FOREWORD = [
  'This story is rooted in generations of oral tradition, passed down through the family of Ingkung Eliung (Cornelio Toledano Manalóto, Sr.). The creation myth was inherited from his father, Apung Magnu (Magno Manalóto), and further enriched by stories shared by his wife, Apung Nená (Elena Lim Co Lioc Tayag), and his sisters—Apung Kading, Apung Bidang, Apung Tilang, and Apung Salud.',
  'Growing up in the foothills of Bunduk Aláya, in the quiet town of Magálang, these stories were part of everyday life. Through this interactive comic, we hope to preserve and share a piece of this family’s heritage, allowing these stories to live on and reach generations beyond those who first told them.',
];

export function buildLoadingScreen({ bg, className, screen, foreword = false }) {
  const el = document.createElement('div');
  el.className = `screen screen-loading ${className}`.trim();
  el.dataset.screen = screen;

  if (foreword) el.classList.add('screen-foreword');

  el.innerHTML = `
    <p class="loading-label" role="status" aria-live="polite" aria-atomic="true">LOADING...</p>
    <div class="loading-orb-wrap" aria-hidden="true">
      <div class="loading-orb-glow"></div>
      <img src="/assets/ui/SUN (for loading).png" class="loading-orb-img" alt="" draggable="false"/>
    </div>
    ${foreword ? `<div class="loading-foreword">${FOREWORD.map(p => `<p>${p}</p>`).join('')}</div>
    <button type="button" class="loading-continue" aria-hidden="true" tabindex="-1">Continue</button>` : ''}
    <div class="loading-progress-bar" role="progressbar" aria-label="Loading progress"
         aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
      <div class="loading-progress-fill"></div>
    </div>
  `;

  addParallaxLayers(el, [{ src: bg, depth: 0.35, y: 1.6 }]);   // starts fetching now
  return el;
}

export function createLoadingScreen() {
  const el = buildLoadingScreen({ bg: DAY_BG, className: '', screen: '#loading', foreword: true });
  // The home screen's layers load while the loading screen plays
  // (Continue only appears once they have arrived, or after 10s, so the menu never opens half-drawn)
  el._homeReady = Promise.all(['bg', 'clouds', 'ayala', 'ground'].map(n => preloadImage(`/assets/ui/layer-${n}.webp`)));
  return el;
}

export function createMinigameLoadingScreen() {
  return buildLoadingScreen({ bg: NIGHT_BG, className: 'screen-minigame-loading', screen: '#minigame-loading' });
}

/** @param {HTMLElement} el */
/** waitForClick: when loading is done, ask for a click (or key press) before moving on. That first gesture is
 *  what lets the browser play sound, so hover sounds and music work from the start of the home screen. */
export function mountLoading(el, { duration = 1.6, onDone = () => navigate('#home'), fadeOut = true, waitForClick = false } = {}) {
  el._stopParallax?.();
  el._stopParallax = startParallax(el);

  const label    = el.querySelector('.loading-label');
  const bar      = el.querySelector('.loading-progress-bar');
  const fill     = el.querySelector('.loading-progress-fill');

  const orbWrap = el.querySelector('.loading-orb-wrap');

  gsap.set(label,   { opacity: 0, y: 10 });
  if (orbWrap) gsap.set(orbWrap, { opacity: 0, scale: 0.78 });

  gsap.to(label,   { opacity: 1, y: 0, duration: 0.7,  ease: 'power3.out', delay: 0.1 });
  if (orbWrap) gsap.to(orbWrap, { opacity: 1, scale: 1, duration: 1.1, ease: 'back.out(1.5)', delay: 0.2 });

  setTimeout(() => bar.classList.add('visible'), 400);

  function setProgress(p) {
    fill.style.width = `${p}%`;
    bar.setAttribute('aria-valuenow', Math.round(p));
  }

  // Slots for real critical assets (add paths when art lands)
  const criticalAssets = [
    // e.g. '/assets/ui/homepage-bg.webp'
  ];

  if (criticalAssets.length === 0) {
    // No real assets yet — simulate a short timed load
    el._loadTween = gsap.to({ v: 0 }, {
      v: 100,
      duration,
      ease: 'power1.inOut',
      onUpdate() { setProgress(this.targets()[0].v); },
      onComplete() { finish(el, onDone, fadeOut, waitForClick); },
    });
  } else {
    let done = 0;
    criticalAssets.forEach(src => {
      const img = new Image();
      img.onload = img.onerror = () => {
        done++;
        setProgress((done / criticalAssets.length) * 100);
        if (done === criticalAssets.length) finish(el, onDone, fadeOut, waitForClick);
      };
      img.src = src;
    });
  }
}

function finish(el, onDone, fadeOut, waitForClick = false) {
  // the bar has done its job: let it fade away
  el.querySelector('.loading-progress-bar')?.classList.remove('visible');

  const leave = () => {
    if (!fadeOut) { onDone(); return; }
    gsap.to(el, { opacity: 0, duration: 0.75, ease: 'power2.inOut', onComplete: onDone });
  };

  el._finishTimer = setTimeout(async () => {
    if (!waitForClick) { leave(); return; }
    await Promise.race([el._homeReady || Promise.resolve(), new Promise(r => setTimeout(r, 10000))]);
    const label = el.querySelector('.loading-label');
    const orb   = el.querySelector('.loading-orb-wrap');
    const btn   = el.querySelector('.loading-continue');   // the foreword screen has a Continue button
    if (btn) {
      btn.classList.add('is-ready');
      btn.removeAttribute('aria-hidden');
      btn.removeAttribute('tabindex');
      btn.focus({ preventScroll: true });
    } else {
      label.textContent = 'CLICK TO CONTINUE';
      label.classList.add('is-ready');
    }
    const go = () => {
      el.removeEventListener('pointerdown', go);
      document.removeEventListener('keydown', go);
      btn?.removeEventListener('click', go);
      playClickSound();
      // The text stays gold while it fades with the sun. The mountain stays too, and a sky tone sits behind the
      // hand-off to the home screen, so it never dips to black.
      const app = document.getElementById('app');
      if (app) { app.style.background = '#a9e2ec'; setTimeout(() => { app.style.background = ''; }, 2000); }
      // the mountain stays while the text, sun and button fade, so the hand-off to home never dips to black
      gsap.to([label, orb, ...el.querySelectorAll('.loading-foreword, .loading-continue')], { opacity: 0, duration: 0.5, ease: 'power1.in', onComplete: onDone });
    };
    if (btn) {
      btn.addEventListener('click', go);   // only the button moves on
      document.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(); }, { once: true });
    } else {
      el.addEventListener('pointerdown', go);
      document.addEventListener('keydown', go);
    }
    el._cancelWait = go;
  }, 350);
}
