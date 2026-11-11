import React from 'react';
import { AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import data from './data/products.json';
import { FONT } from './fonts';
import { T, type Copy, type Lang } from './i18n';

// Charte GLACIORA (apps/web/src/theme/tokens.ts).
const C = { marine: '#0A1A2F', glacier: '#14A3F2', deep: '#0A6FAD', frost: '#A9DEFB', snow: '#E8EEF4', white: '#FFFFFF' };

// Montage (images) — 30 s. Zone sûre Reels/TikTok : textes entre y≈250 et y≈1480, marge droite ≥ 140 px.
const S = { intro: 0, question: 60, ski: 120, hockey: 165, brands: 210, products: 255, trust: 615, cta: 765 };
const PRODUCT_LEN = 60;
export const DURATION = 900;

type Product = (typeof data.products)[number];
const PRODUCTS: Product[] = data.products;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const easeOut = Easing.out(Easing.cubic);
const easeIn = Easing.in(Easing.cubic);

/** Taille de police qui fait tenir `text` (majuscules Montserrat grasses) dans `maxWidth`. */
function fit(text: string, maxWidth: number, maxSize: number, k = 0.7) {
  return Math.min(maxSize, Math.floor(maxWidth / Math.max(1, text.length * k)));
}

function price(cents: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

/* ------------------------------------------------------------------ Éléments communs */

/** Plan vidéo plein écran avec « zoom punch » à l'entrée puis lente dérive. */
const Clip: React.FC<{ name: string; dur: number; from?: number; punch?: number; filter?: string; drift?: number; rate?: number }> = ({
  name,
  dur,
  from = 0,
  punch = 0.14,
  filter,
  drift = 0.05,
  rate = 1,
}) => {
  const f = useCurrentFrame();
  const scale = 1 + drift * (1 - f / dur) + punch * (1 - interpolate(f, [0, 12], [0, 1], { ...clamp, easing: easeOut }));
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: C.marine }}>
      <OffthreadVideo
        src={staticFile(`clips/${name}.mp4`)}
        muted
        trimBefore={from}
        playbackRate={rate}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})`, filter }}
      />
    </AbsoluteFill>
  );
};

/** Dégradés marine haut et bas : lisibilité du texte sur n'importe quel plan. */
const Shade: React.FC<{ strength?: number }> = ({ strength = 1 }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, rgba(10,26,47,${0.6 * strength}) 0%, rgba(10,26,47,${0.18 * strength}) 30%, rgba(10,26,47,${0.3 * strength}) 55%, rgba(10,26,47,${0.9 * strength}) 100%)`,
    }}
  />
);

/** Flocons qui tombent (aléatoire déterministe : même rendu à chaque fois). */
const Snow: React.FC<{ count?: number; opacity?: number }> = ({ count = 60, opacity = 0.85 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: count }, (_, i) => {
        const size = 3 + random(`s${i}`) * 10;
        const speed = 1.2 + (size / 13) * 5;
        const y = ((random(`y${i}`) * 2000 + f * speed) % 2000) - 40;
        const x = random(`x${i}`) * 1080 + Math.sin((f + i * 17) / (22 + random(`d${i}`) * 30)) * 28;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: C.white,
              opacity: opacity * (0.35 + random(`o${i}`) * 0.65),
              filter: size > 10 ? 'blur(2px)' : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Éclair blanc très bref aux coupes. */
const Flash: React.FC<{ at: number; max?: number }> = ({ at, max = 0.75 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 2, at, at + 7], [0, max, 0], clamp);
  return o > 0 ? <AbsoluteFill style={{ backgroundColor: C.white, opacity: o }} /> : null;
};

/** Ligne de texte révélée par un masque (glisse de bas en haut). */
const Reveal: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - delay, fps, config: { damping: 18, mass: 0.7, stiffness: 140 } });
  return (
    <div style={{ overflow: 'hidden', paddingBottom: '0.06em', marginBottom: '-0.06em' }}>
      <div style={{ transform: `translateY(${(1 - p) * 110}%) rotate(${(1 - p) * 4}deg)`, transformOrigin: 'left bottom', ...style }}>{children}</div>
    </div>
  );
};

/** Sortie commune d'un bloc de texte : léger zoom avant + fondu. */
const useExit = (start: number, end: number) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [start, end], [0, 1], { ...clamp, easing: easeIn });
  return { opacity: 1 - p, transform: `scale(${1 + p * 0.08})`, filter: p > 0 ? `blur(${p * 8}px)` : undefined };
};

const headline: React.CSSProperties = {
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '-0.02em',
  lineHeight: 0.98,
  color: C.white,
  textShadow: '0 6px 28px rgba(10,26,47,0.55)',
};

/** Voile marine derrière un bloc de texte centré (plans très blancs : neige, glace). */
const TextVeil: React.FC<{ y?: string; strength?: number }> = ({ y = '50%', strength = 0.6 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(110% 38% at 40% ${y}, rgba(10,26,47,${strength}) 0%, rgba(10,26,47,0) 100%)` }} />
);

/* ------------------------------------------------------------------ Scènes */

const Intro: React.FC<{ t: Copy }> = ({ t }) => {
  const f = useCurrentFrame();
  const size = Math.min(fit(t.hook[0], 940, 170, 0.74), fit(t.hook[1], 940, 170, 0.74));
  const bar = interpolate(f, [10, 30], [0, 260], { ...clamp, easing: easeOut });
  const logo = interpolate(f, [0, 14], [0, 1], clamp);
  const exit = useExit(50, 60);
  return (
    <AbsoluteFill>
      <Clip name="aerial" dur={60} punch={0.22} drift={0.08} filter="brightness(0.78) saturate(1.1) contrast(1.05)" />
      <Shade />
      <TextVeil y="50%" strength={0.55} />
      <AbsoluteFill style={{ padding: '0 70px', justifyContent: 'center', ...exit }}>
        <Img src={staticFile('brand/logo-horizontal-slogan-sombre.svg')} style={{ width: 420, opacity: logo, marginBottom: 70, transform: `translateY(${(1 - logo) * 20}px)` }} />
        <Reveal delay={4}>
          <div style={{ ...headline, fontSize: size }}>{t.hook[0]}</div>
        </Reveal>
        <Reveal delay={10}>
          <div style={{ ...headline, fontSize: size, color: C.glacier }}>{t.hook[1]}</div>
        </Reveal>
        <div style={{ height: 10, width: bar, background: C.white, marginTop: 36, borderRadius: 5 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Question: React.FC<{ t: Copy }> = ({ t }) => {
  const f = useCurrentFrame();
  const size = Math.min(fit(t.question[0], 900, 150, 0.74), fit(t.question[1], 880, 150, 0.74));
  const box = interpolate(f, [8, 20], [0, 1], { ...clamp, easing: easeOut });
  const exit = useExit(52, 60);
  return (
    <AbsoluteFill style={{ padding: '0 70px', justifyContent: 'center', alignItems: 'flex-start', ...exit }}>
      <Reveal delay={2}>
        <div style={{ ...headline, fontSize: size }}>{t.question[0]}</div>
      </Reveal>
      <div style={{ position: 'relative', marginTop: 14 }}>
        <div style={{ position: 'absolute', inset: '-6px -24px', background: C.glacier, transform: `scaleX(${box})`, transformOrigin: 'left', borderRadius: 10 }} />
        <Reveal delay={12}>
          <div style={{ ...headline, fontSize: size, position: 'relative' }}>{t.question[1]}</div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

/** Mot géant (SKI / HOCKEY) : lettres qui se resserrent + contour décalé. */
const GiantWord: React.FC<{ word: string; index: string }> = ({ word, index }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Mot composé long (« Ledo ritulys ») : sur deux lignes plutôt qu'en petit.
  const lines = word.includes(' ') && word.length > 9 ? word.split(' ') : [word];
  const longest = lines.reduce((a, b) => (b.length > a.length ? b : a));
  const size = fit(longest, 1000, 330, 0.76);
  const text = lines.join(String.fromCharCode(10));
  const p = spring({ frame: f, fps, config: { damping: 20, stiffness: 120 } });
  const spacing = interpolate(p, [0, 1], [0.35, -0.03]);
  const exit = useExit(38, 45);
  const style: React.CSSProperties = { ...headline, fontSize: size, letterSpacing: `${spacing}em`, whiteSpace: 'pre', textAlign: 'center', lineHeight: 0.9 };
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 520, ...exit }}>
      <div style={{ position: 'relative', opacity: p }}>
        <div style={{ ...style, position: 'absolute', left: 0, top: 0, color: 'transparent', WebkitTextStroke: `3px ${C.glacier}`, transform: `translate(${(1 - p) * 40 + 10}px, ${12}px)` }}>{text}</div>
        <div style={{ ...style, position: 'relative', textShadow: '0 12px 40px rgba(10,26,47,0.45)' }}>{text}</div>
      </div>
      <div style={{ color: C.frost, fontWeight: 700, fontSize: 34, letterSpacing: '0.4em', marginTop: 28, opacity: interpolate(f, [8, 18], [0, 1], clamp) }}>{index}</div>
    </AbsoluteFill>
  );
};

const BrandsTitle: React.FC<{ t: Copy }> = ({ t }) => {
  const f = useCurrentFrame();
  // Une ligne par moitié de titre ; si c'est trop petit (langues aux mots longs), on passe sur deux lignes à 64 px.
  const size = Math.max(64, Math.min(fit(t.brandsTitle[0], 940, 100, 0.68), fit(t.brandsTitle[1], 940, 100, 0.68)));
  const brands = [...new Set(PRODUCTS.map((p) => p.brand))];
  const exit = useExit(38, 45);
  return (
    <AbsoluteFill>
      <Clip name="hockey-rush" dur={45} punch={0.1} filter="blur(14px) brightness(0.45) saturate(0.8)" />
      <AbsoluteFill style={{ background: 'rgba(10,26,47,0.45)' }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 60px', ...exit }}>
        <Reveal delay={0}>
          <div style={{ ...headline, fontSize: size, lineHeight: 1.12 }}>{t.brandsTitle[0]}</div>
        </Reveal>
        <Reveal delay={5}>
          <div style={{ ...headline, fontSize: size, lineHeight: 1.12, color: C.glacier }}>{t.brandsTitle[1]}</div>
        </Reveal>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px 30px', marginTop: 56, maxWidth: 900 }}>
          {brands.map((b, i) => (
            <div
              key={b}
              style={{
                color: C.frost,
                fontWeight: 700,
                fontSize: 38,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                opacity: interpolate(f, [12 + i * 3, 20 + i * 3], [0, 1], clamp),
                transform: `translateY(${interpolate(f, [12 + i * 3, 20 + i * 3], [24, 0], { ...clamp, easing: easeOut })}px)`,
              }}
            >
              {b}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ProductSlide: React.FC<{ p: Product; i: number; t: Copy }> = ({ p, i, t }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f, fps, config: { damping: 16, mass: 0.8, stiffness: 120 } });
  const leave = interpolate(f, [PRODUCT_LEN - 10, PRODUCT_LEN], [0, 1], { ...clamp, easing: easeIn });
  const cardX = (1 - enter) * 1150 - leave * 1150;
  const cardRot = (1 - enter) * 9 - leave * 9;
  const motionBlur = Math.min(14, Math.abs(1 - enter) * 30 + leave * 20);
  const shine = interpolate(f, [10, 30], [-120, 220], clamp);
  const text = (d: number) => {
    const s = spring({ frame: f - d, fps, config: { damping: 18, stiffness: 150 } });
    return { opacity: s * (1 - leave), transform: `translateY(${(1 - s) * 50}px)` };
  };
  const nameSize = fit(p.name, 960, 74, 0.6);
  const bgWord = p.brand.toUpperCase();
  return (
    <AbsoluteFill>
      {/* Marque géante en contour, qui défile derrière la carte */}
      <div
        style={{
          position: 'absolute',
          top: 470,
          left: 0,
          whiteSpace: 'nowrap',
          fontWeight: 900,
          fontSize: 330,
          letterSpacing: '-0.02em',
          color: 'transparent',
          WebkitTextStroke: `2px rgba(169,222,251,0.28)`,
          transform: `translateX(${interpolate(f, [0, PRODUCT_LEN], [160, -260])}px)`,
          opacity: enter * (1 - leave),
        }}
      >
        {bgWord} {bgWord}
      </div>
      {/* Carte produit */}
      <div
        style={{
          position: 'absolute',
          top: 330,
          left: 150,
          width: 780,
          height: 780,
          borderRadius: 48,
          overflow: 'hidden',
          background: C.white,
          boxShadow: '0 40px 90px rgba(0,0,0,0.45), 0 0 0 2px rgba(169,222,251,0.25)',
          transform: `translateX(${cardX}px) rotate(${cardRot}deg) scale(${0.92 + enter * 0.08})`,
          filter: motionBlur > 0.5 ? `blur(${motionBlur}px)` : undefined,
        }}
      >
        <Img src={staticFile(p.image)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.04 - (f / PRODUCT_LEN) * 0.04})` }} />
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            bottom: '-20%',
            width: '28%',
            left: `${shine}%`,
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0) 100%)',
            transform: 'rotate(18deg)',
          }}
        />
      </div>
      {/* Textes */}
      <div style={{ position: 'absolute', top: 1150, left: 70, right: 70 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, ...text(6) }}>
          <div style={{ border: `3px solid ${C.glacier}`, color: C.glacier, borderRadius: 999, padding: '6px 22px', fontWeight: 800, fontSize: 28, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            {t.sport[p.sport as 'SKI' | 'HOCKEY']}
          </div>
          <div style={{ color: C.frost, fontWeight: 700, fontSize: 40, letterSpacing: '0.22em', textTransform: 'uppercase' }}>{p.brand}</div>
        </div>
        <div style={{ color: C.white, fontWeight: 800, fontSize: nameSize, lineHeight: 1.05, marginTop: 18, letterSpacing: '-0.01em', ...text(10) }}>{p.name}</div>
        <div style={{ marginTop: 30, ...text(16) }}>
          <span style={{ display: 'inline-block', background: C.white, color: C.marine, fontWeight: 900, fontSize: 80, padding: '10px 34px', borderRadius: 22, letterSpacing: '-0.02em' }}>
            {price(p.priceFromCents, t.locale)}
          </span>
        </div>
      </div>
      {/* Compteur */}
      <div style={{ position: 'absolute', top: 262, left: 150, color: C.frost, fontWeight: 700, fontSize: 30, letterSpacing: '0.2em', opacity: 1 - leave }}>
        {String(i + 1).padStart(2, '0')} / {String(PRODUCTS.length).padStart(2, '0')}
      </div>
    </AbsoluteFill>
  );
};

const Products: React.FC<{ t: Copy }> = ({ t }) => {
  const f = useCurrentFrame();
  const firstHockey = PRODUCTS.findIndex((p) => p.sport === 'HOCKEY');
  const switchAt = firstHockey < 0 ? Infinity : firstHockey * PRODUCT_LEN;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={switchAt === Infinity ? undefined : switchAt}>
        <Clip name="ski-forest" dur={switchAt === Infinity ? 360 : switchAt} rate={0.7} punch={0} drift={0.06} filter="blur(22px) brightness(0.42) saturate(0.9)" />
      </Sequence>
      {switchAt !== Infinity && (
        <Sequence from={switchAt}>
          <Clip name="hockey-goal" dur={360 - switchAt} punch={0} drift={0.06} filter="blur(22px) brightness(0.42) saturate(0.9)" />
        </Sequence>
      )}
      <AbsoluteFill style={{ background: 'radial-gradient(120% 70% at 50% 35%, rgba(20,163,242,0.22) 0%, rgba(10,26,47,0.55) 60%, rgba(10,26,47,0.9) 100%)' }} />
      {/* Barre de progression façon « stories » */}
      <div style={{ position: 'absolute', top: 236, left: 150, right: 150, display: 'flex', gap: 10 }}>
        {PRODUCTS.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: C.glacier, width: `${interpolate(f, [i * PRODUCT_LEN, (i + 1) * PRODUCT_LEN], [0, 100], clamp)}%` }} />
          </div>
        ))}
      </div>
      {PRODUCTS.map((p, i) => (
        <Sequence key={p.slug} from={i * PRODUCT_LEN} durationInFrames={PRODUCT_LEN}>
          <ProductSlide p={p} i={i} t={t} />
        </Sequence>
      ))}
      <Snow count={30} opacity={0.5} />
    </AbsoluteFill>
  );
};

const Icon: React.FC<{ kind: 'truck' | 'chat' | 'bank' }> = ({ kind }) => (
  <svg viewBox="0 0 64 64" width={72} height={72} fill="none" stroke={C.white} strokeWidth={4.5} strokeLinejoin="round" strokeLinecap="round">
    {kind === 'truck' && (
      <>
        <path d="M4 16h32v26H4z" />
        <path d="M36 24h13l9 10v8H36z" />
        <circle cx="15" cy="46" r="5" fill={C.glacier} />
        <circle cx="47" cy="46" r="5" fill={C.glacier} />
      </>
    )}
    {kind === 'chat' && (
      <>
        <path d="M8 12h48v30H28L16 52V42H8z" />
        <path d="M21 27h.5M32 27h.5M43 27h.5" strokeWidth={7} />
      </>
    )}
    {kind === 'bank' && (
      <>
        <path d="M6 24 32 10l26 14z" />
        <path d="M14 30v16M26 30v16M38 30v16M50 30v16M6 52h52" />
      </>
    )}
  </svg>
);

const Trust: React.FC<{ t: Copy }> = ({ t }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const icons = ['truck', 'chat', 'bank'] as const;
  const exit = useExit(140, 150);
  return (
    <AbsoluteFill>
      <Clip name="ski-pov" dur={150} punch={0.12} drift={0.06} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(10,26,47,0.55) 0%, rgba(10,26,47,0.78) 45%, rgba(10,26,47,0.92) 100%)' }} />
      <AbsoluteFill style={{ justifyContent: 'center', padding: '0 80px', gap: 56, ...exit }}>
        <Img src={staticFile('brand/logo-horizontal-slogan-sombre.svg')} style={{ width: 360, marginBottom: 40, opacity: interpolate(f, [0, 12], [0, 1], clamp) }} />
        {t.trust.map((line, i) => {
          const s = spring({ frame: f - 6 - i * 12, fps, config: { damping: 15, stiffness: 140 } });
          return (
            <div key={line} style={{ display: 'flex', alignItems: 'center', gap: 36, opacity: s, transform: `translateX(${(1 - s) * -140}px)` }}>
              <div
                style={{
                  flex: 'none',
                  width: 128,
                  height: 128,
                  borderRadius: 36,
                  background: C.glacier,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 16px 40px rgba(20,163,242,0.35)',
                  transform: `scale(${0.6 + s * 0.4}) rotate(${(1 - s) * -20}deg)`,
                }}
              >
                <Icon kind={icons[i]} />
              </div>
              <div style={{ color: C.white, fontWeight: 800, fontSize: 54, lineHeight: 1.12, maxWidth: 680 }}>{line}</div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Snow count={40} opacity={0.6} />
    </AbsoluteFill>
  );
};

const Cta: React.FC<{ t: Copy }> = ({ t }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: f - 4, fps, config: { damping: 14, stiffness: 110 } });
  const reveal = interpolate(f, [4, 26], [100, 0], { ...clamp, easing: easeOut });
  const pill = spring({ frame: f - 26, fps, config: { damping: 12, stiffness: 160 } });
  const shine = interpolate((f - 40) % 50, [0, 22], [-40, 140], clamp);
  const urlSize = fit(t.url, 760, 66, 0.6);
  return (
    <AbsoluteFill>
      <Clip name="ski-sunset" dur={135} punch={0.1} drift={0.08} filter="blur(5px) brightness(0.55) saturate(1.15)" />
      <AbsoluteFill style={{ background: 'radial-gradient(90% 60% at 50% 40%, rgba(10,26,47,0.15) 0%, rgba(10,26,47,0.75) 70%, rgba(10,26,47,0.95) 100%)' }} />
      <Snow count={70} opacity={0.9} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 160 }}>
        <Img
          src={staticFile('brand/logo-vertical-blanc.svg')}
          style={{ width: 820, clipPath: `inset(${reveal}% 0 0 0)`, transform: `scale(${0.9 + logo * 0.1}) translateY(${(1 - logo) * 40}px)` }}
        />
        <div style={{ marginTop: 90, color: C.frost, fontWeight: 600, fontSize: 44, letterSpacing: '0.04em', opacity: pill, transform: `translateY(${(1 - pill) * 30}px)` }}>{t.cta}</div>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            marginTop: 26,
            background: C.glacier,
            color: C.white,
            fontWeight: 800,
            fontSize: urlSize,
            padding: '26px 60px',
            borderRadius: 999,
            boxShadow: '0 20px 60px rgba(20,163,242,0.45)',
            transform: `scale(${pill})`,
          }}
        >
          {t.url}
          {f > 40 && (
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                bottom: '-50%',
                width: '22%',
                left: `${shine}%`,
                background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)',
                transform: 'rotate(20deg)',
              }}
            />
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ Montage */

export const Ad: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
  return (
    <AbsoluteFill style={{ backgroundColor: C.marine, fontFamily: FONT }}>
      <Sequence from={S.intro} durationInFrames={S.question - S.intro}>
        <Intro t={t} />
        <Snow count={50} opacity={0.8} />
      </Sequence>

      <Sequence from={S.question} durationInFrames={30}>
        <Clip name="ski-spray" dur={30} punch={0.18} />
      </Sequence>
      <Sequence from={S.question + 30} durationInFrames={30}>
        <Clip name="hockey-pov" dur={30} from={90} punch={0.16} />
      </Sequence>
      <Sequence from={S.question} durationInFrames={S.ski - S.question}>
        <Shade />
        <TextVeil y="48%" strength={0.6} />
        <Question t={t} />
      </Sequence>

      <Sequence from={S.ski} durationInFrames={S.hockey - S.ski}>
        <Clip name="ski-carve" dur={45} from={15} punch={0.2} />
        <Shade />
        <TextVeil y="66%" strength={0.5} />
        <GiantWord word={t.ski} index="01" />
      </Sequence>
      <Sequence from={S.hockey} durationInFrames={S.brands - S.hockey}>
        <Clip name="hockey-shot" dur={45} from={20} punch={0.2} />
        <Shade />
        <TextVeil y="66%" strength={0.5} />
        <GiantWord word={t.hockey} index="02" />
      </Sequence>

      <Sequence from={S.brands} durationInFrames={S.products - S.brands}>
        <BrandsTitle t={t} />
      </Sequence>

      <Sequence from={S.products} durationInFrames={S.trust - S.products}>
        <Products t={t} />
      </Sequence>

      <Sequence from={S.trust} durationInFrames={S.cta - S.trust}>
        <Trust t={t} />
      </Sequence>

      <Sequence from={S.cta} durationInFrames={DURATION - S.cta}>
        <Cta t={t} />
      </Sequence>

      {[S.question, S.question + 30, S.ski, S.hockey, S.brands, S.products, S.trust, S.cta].map((at) => (
        <Flash key={at} at={at} max={at === S.products || at === S.question + 30 ? 0.45 : 0.75} />
      ))}
    </AbsoluteFill>
  );
};
