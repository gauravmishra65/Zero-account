import { Component, useEffect, useRef, useState, type ErrorInfo, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  FileText,
  Fingerprint,
  Folder,
  Instagram,
  Lock,
  Menu,
  Quote,
  ScanLine,
  Send,
  Star,
  X,
} from 'lucide-react';
import { submitClearanceRequest, supabaseReady } from '@/lib/supabase';

// Fires a named analytics event through whichever privacy-conscious provider
// the site owner has installed via index.html (GA4's gtag, Plausible, or
// Umami) — this file makes no assumption about which one is present and is a
// silent no-op otherwise, so today's build has zero third-party network
// calls and installing an analytics snippet later requires no code changes.
// No personal data (e.g. email addresses) is ever passed as a param.
function trackEvent(name: string, params?: Record<string, string>) {
  try {
    const w = window as unknown as {
      gtag?: (...args: unknown[]) => void;
      plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
      umami?: { track: (event: string, data?: Record<string, string>) => void };
    };
    if (typeof w.gtag === 'function') w.gtag('event', name, params);
    else if (typeof w.plausible === 'function') w.plausible(name, { props: params });
    else if (typeof w.umami?.track === 'function') w.umami.track(name, params);
  } catch {
    // Analytics must never break the page.
  }
}

// Fires `onVisible` once, the first time the returned ref's element scrolls
// into the viewport — used to record "excerpt completed" without any
// scroll-position math, and cleans itself up immediately after firing.
function useFireOnceVisible(onVisible: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onVisible();
          observer.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible]);
  return ref;
}

const SERIES_LINE = 'BOOK TWO IN THE GAURAV MISHRA THRILLER SERIES';
const CASE_HEADER = '> CASE_FILE :: SV-00417 // STATUS: ACTIVE';
const TAGLINE =
  'Seventeen transactions. Eight seconds. One impossible account. Every piece of evidence points to a woman who was never there.';
const SECONDARY_HOOK = 'Then a dormant credential began authorising billions.';
const LOGLINE =
  'Zero Account is a techno-noir financial thriller about disgraced forensic analyst Sunita Verma, whose dormant credentials are secretly used to authorize billions in illicit transactions while a hidden system called Zero turns her own work and identity against her. With investigator Gaurav Mishra, she must expose the architecture behind the fraud before it collapses global financial corridors — and before the manufactured evidence destroys her for crimes she never committed.';
const EXCERPT = `The running shoes had only been worn twice.

Gaurav Mishra noticed them beneath his desk the way he noticed most things in his apartment — with the faint recognition that they were there, that they represented an intention that had once been genuine, and that intentions and outcomes were rarely the same thing.

Six months had passed. Technically, he wasn't supposed to be working.`;
const TICKER_LINES = [
  'CREDENTIAL: SUNITA_VERMA',
  'STATUS: DORMANT→ACTIVE',
  'SYSTEM: ZERO',
  'ACCESS: UNAUTHORIZED',
  'INVESTIGATOR: GAURAV_MISHRA',
  'CLEARANCE: PENDING',
  'THRESHOLD_BREACH: CONFIRMED',
  'TRANSACTIONS: 17',
  'WINDOW: 00:00:08',
  'EVIDENCE_CHAIN: COMPROMISED',
  'RELEASE_WINDOW: MID-SEPTEMBER 2026',
];

const NAV_LINKS = [
  { href: '#/file', label: 'THE STORY' },
  { href: '#/excerpt', label: 'READ CHAPTER 1' },
  { href: '#/players', label: 'CHARACTERS' },
  { href: '#/book-one', label: 'START THE SERIES' },
  { href: '#/author', label: 'ABOUT GAURAV' },
];

function CaseLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[12px] uppercase tracking-[0.12em] text-signal ${className}`}>
      {children}
    </span>
  );
}

function RuleLine({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-ink-line ${className}`} />;
}

function AccentBar({ className = '' }: { className?: string }) {
  return <div className={`h-[3px] w-14 bg-gradient-to-r from-signal to-signal-glow ${className}`} />;
}

/**
 * Full-viewport canvas that renders a slow, faint stream of ledger-style
 * characters (digits, currency symbols, hex) drifting downward — a quiet
 * "moving background" that reinforces the financial-thriller / case-file
 * theme without competing with foreground text. Respects reduced-motion.
 */
function LedgerRainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const chars = '0123456789ABCDEF$€¥£₹%.,-+=:/'.split('');
    const fontSize = 15;
    let width = 0;
    let height = 0;
    let columns = 0;
    let drops: number[] = [];
    let raf = 0;

    function resize() {
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      width = canvasEl.width = window.innerWidth;
      height = canvasEl.height = window.innerHeight;
      columns = Math.max(1, Math.floor(width / fontSize));
      drops = new Array(columns).fill(0).map(() => Math.random() * -140);
    }
    resize();
    window.addEventListener('resize', resize);

    if (reduceMotion) {
      return () => window.removeEventListener('resize', resize);
    }

    function draw() {
      if (!ctx) return;
      ctx.fillStyle = 'rgba(10, 10, 12, 0.07)';
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${fontSize}px "IBM Plex Mono", ui-monospace, monospace`;
      for (let i = 0; i < columns; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const opacity = Math.random() * 0.28 + 0.04;
        ctx.fillStyle = `rgba(232, 163, 61, ${opacity.toFixed(3)})`;
        ctx.fillText(char, x, y);
        if (y > height && Math.random() > 0.982) {
          drops[i] = 0;
        }
        drops[i] += 0.32;
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 opacity-[0.32]"
    />
  );
}

// Types the hero hook line out once, always finishing within `totalMs`
// regardless of copy length (per-char speed scales to fit the budget) —
// keeps the reveal snappy rather than a slow crawl on longer lines. Skips
// straight to the full text for prefers-reduced-motion.
function useTypewriter(text: string, totalMs = 1600) {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOut(text);
      return;
    }
    let index = 0;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const speed = Math.max(8, totalMs / Math.max(text.length, 1));
    const start = setTimeout(() => {
      const tick = () => {
        if (!active) return;
        index += 1;
        setOut(text.slice(0, index));
        if (active && index < text.length) timer = setTimeout(tick, speed);
      };
      tick();
    }, 150);
    return () => {
      active = false;
      clearTimeout(start);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [text, totalMs]);
  return out;
}

function useHashPath() {
  const [path, setPath] = useState(() => window.location.hash.replace('#', '') || '/');
  useEffect(() => {
    const update = () => setPath(window.location.hash.replace('#', '') || '/');
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return path;
}

// In-page smooth scroll for hero CTAs — keeps the hash router untouched (no
// hashchange fires, so App's route-change scroll-to-top effect never fights
// the scroll). Honors the user's reduced-motion preference via the global
// `scroll-behavior` CSS rule rather than forcing 'smooth' from JS.
function scrollToId(id: string) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ block: 'start' });
  };
}

// Text-only wordmark. The author logo art is dark linework designed for a
// light background, so it can't sit directly on the dark header without a
// white box behind it (which read as a jarring rectangle against the
// cinematic theme). Rather than alter someone else's logo colors, we drop
// it from the header entirely and keep it where a light card already makes
// sense: the footer and the author page.
function SiteLogo() {
  return (
    <a href="#/" aria-label="Return to Zero Account home" className="flex flex-col leading-none">
      <span className="font-heading2 text-xl font-semibold tracking-wide text-bright transition-colors hover:text-signal">
        ZERO ACCOUNT
      </span>
      <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-bright-faint">
        A Gaurav Mishra Thriller
      </span>
    </a>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  const path = useHashPath();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close the mobile menu on Escape and return focus to the toggle button,
  // so keyboard users are never trapped inside the open panel.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink-line bg-ink-base/90 backdrop-blur-md">
      <nav aria-label="Primary" className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <span onClick={() => setOpen(false)}>
          <SiteLogo />
        </span>
        <div className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} aria-current={path === link.href.slice(1) ? 'page' : undefined} className={`font-mono text-[13px] font-medium uppercase tracking-[0.12em] transition-colors ${path === link.href.slice(1) ? 'text-signal' : 'text-bright-muted hover:text-signal'}`}>
              {link.label}
            </a>
          ))}
          <a href="#/buy" className="glitch-hover border border-signal px-4 py-2 font-mono text-[13px] font-semibold uppercase tracking-[0.12em] text-signal transition-all hover:bg-signal hover:text-ink-base hover:shadow-[0_0_18px_rgba(232,163,61,0.45)]">GET THE BOOK</a>
        </div>
        <button
          ref={menuButtonRef}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-bright lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="border-t border-ink-line bg-ink-base px-5 py-4 lg:hidden">
          {[...NAV_LINKS, { href: '#/buy', label: 'GET THE BOOK' }].map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="block min-h-[44px] border-b border-ink-line py-4 font-mono text-[13px] uppercase tracking-[0.12em] text-bright hover:text-signal">
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

function Ticker() {
  // Divider repeats between every fragment, including the loop seam between
  // the two duplicated spans, so the marquee never reads as two words jammed together.
  const line = `${TICKER_LINES.join(' // ')} // `;
  return (
    <div className="overflow-hidden border-y border-ink-line bg-ink-panel/70">
      <div className="ticker-track flex w-max animate-scrollX hover:[animation-play-state:paused]">
        <span className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-signal sm:px-8 sm:py-3 sm:text-[12px] sm:tracking-[0.18em]">{line}</span>
        <span className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-signal sm:px-8 sm:py-3 sm:text-[12px] sm:tracking-[0.18em]">{line}</span>
      </div>
    </div>
  );
}

function PageIntro({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden border-b border-ink-line bg-ink-panel/50 pt-32 pb-14 lg:pt-40 lg:pb-16">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-signal/10 blur-[100px]" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <CaseLabel className="mb-5 block">&gt; {label} :: ACTIVE</CaseLabel>
        <h1 className="max-w-4xl break-words font-heading2 text-[clamp(1.6rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-wide text-bright">{title}</h1>
        <AccentBar className="my-5" />
        <p className="max-w-2xl font-serif text-xl leading-relaxed text-bright-muted sm:text-2xl lg:text-3xl">{children}</p>
      </div>
    </div>
  );
}

function SectionLink({ href, label, text, openLabel = 'OPEN FILE', id }: { href: string; label: string; text: string; openLabel?: string; id?: string }) {
  return (
    <a id={id} href={href} className="corner-frame group block border border-ink-line bg-ink-card p-6 transition-all hover:-translate-y-1 hover:border-signal/70 hover:shadow-[0_18px_40px_-20px_rgba(232,163,61,0.35)]">
      <CaseLabel className="mb-4 block">{label}</CaseLabel>
      <p className="font-serif text-xl leading-snug text-bright">{text}</p>
      <span className="mt-6 inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-signal">{openLabel} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
    </a>
  );
}

// Real reader/press quotes not yet in hand — flip to true once verified copies land.
const SHOW_PRAISE = false;

type Praise = { quote: string; source: string };
const PRAISE: Praise[] = [
  { quote: 'A propulsive, ice-cold thriller that makes financial crime feel like a heist unfolding in real time.', source: 'EARLY READER — ADVANCE COPY' },
  { quote: 'Gaurav Mishra writes fraud the way other authors write war — total command of the terrain, and no easy exits.', source: 'EARLY READER — ADVANCE COPY' },
  { quote: 'Shadow Code does not explain the con. It makes you feel the walls closing in, one transaction at a time.', source: 'EARLY READER — ADVANCE COPY' },
];

function PraiseSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:py-16 lg:px-8 lg:py-24">
      <div className="mb-10">
        <CaseLabel className="mb-4 block">&gt; PRAISE :: THE SHADOW CODE</CaseLabel>
        <h2 className="font-heading2 text-3xl font-bold tracking-wide text-bright sm:text-4xl">WHAT READERS ARE SAYING</h2>
        <AccentBar className="mt-4" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {PRAISE.map((item) => (
          <figure key={item.quote} className="corner-frame border border-ink-line bg-ink-card p-6">
            <Quote size={22} className="mb-4 text-signal/70" aria-hidden="true" />
            <blockquote className="font-serif text-lg leading-relaxed text-bright">&ldquo;{item.quote}&rdquo;</blockquote>
            <figcaption className="mt-5 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.18em] text-bright-faint">
              <span className="flex gap-0.5 text-signal" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
                ))}
              </span>
              {item.source}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

// Classified-dossier-styled email capture. Reuses the same hardened
// za_subscribers write path (submitClearanceRequest) as the Buy page form —
// just a second entry point with its own copy, not a second mailing list.
function EmailCaptureSection() {
  return (
    <section id="subscribe" className="mx-auto max-w-7xl px-5 py-12 sm:py-16 lg:px-8 lg:py-24">
      <div className="corner-frame relative border border-dashed border-signal/50 bg-ink-card p-8 sm:p-12">
        <div className="absolute right-5 top-5 rotate-[-6deg] border border-signal/60 px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-signal">EYES ONLY</div>
        <CaseLabel className="mb-4 block">&gt; RESTRICTED ACCESS :: ACTIVE</CaseLabel>
        <h2 className="font-heading2 text-3xl font-bold tracking-wide text-bright sm:text-4xl">JOIN THE CASE FILE</h2>
        <AccentBar className="mt-4 mb-6" />
        <p className="max-w-xl font-serif text-lg leading-relaxed text-bright-muted sm:text-xl">Get Chapter One free and receive a launch alert when ZERO ACCOUNT is released.</p>
        <div className="mt-8 max-w-xl">
          <ClearanceRequest
            successMessage="CLEARANCE GRANTED — Chapter One is on its way. Please check your inbox."
            privacyNote="No spam. Unsubscribe anytime."
          />
        </div>
      </div>
    </section>
  );
}

function HomePage() {
  const tagline = useTypewriter(TAGLINE);
  return (
    <>
      <section className="relative flex min-h-[88vh] items-center overflow-hidden pt-28 pb-14 lg:pt-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/40 to-transparent" />
        <div className="hero-grid mx-auto max-w-7xl px-5 lg:px-8">
          <div className="hero-grid-top">
            <CaseLabel className="mb-6 block">{CASE_HEADER}</CaseLabel>
            <p className="mb-4 font-mono text-[12px] uppercase tracking-[0.3em] text-signal">{SERIES_LINE}</p>
            <p className="mb-5 font-mono text-[12px] uppercase tracking-[0.3em] text-signal">// ARRIVES MID-SEPTEMBER 2026</p>
            <h1 className="break-words font-heading text-[clamp(3.625rem,8vw,6.75rem)] font-bold leading-[0.94] tracking-[0.015em] text-bright">
              ZERO <span className="animate-flicker bg-[linear-gradient(90deg,#F2B94F_0%,#D8952F_55%,#B97824_100%)] bg-clip-text text-transparent">ACCOUNT</span>
            </h1>
            <p className="mt-7 min-h-[3.5rem] max-w-xl font-serif text-xl leading-snug text-bright sm:text-2xl lg:text-3xl">&ldquo;{tagline}&rdquo;</p>
          </div>
          <div className="hero-grid-cover flex justify-center lg:justify-end">
            <div className="group relative">
              <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-signal/15 blur-[70px]" />
              <div className="absolute -left-3 -top-3 z-10 bg-signal px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink-base">Book Two</div>
              <div className="corner-frame motion-safe:transition-transform motion-safe:duration-500 relative aspect-[2/3] w-[250px] overflow-hidden border border-ink-muted bg-ink-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),0_0_50px_-12px_rgba(232,163,61,0.35)] sm:w-[310px] motion-safe:lg:group-hover:[transform:perspective(900px)_rotateY(-6deg)_rotateX(2deg)]">
                <img src="https://the-shadow-code.com/covers/the-zero-account-front.webp" alt="Zero Account book cover" className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-signal/20" />
              </div>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-bright-faint">// ITEM_001 :: COVER_PLATE</p>
            </div>
          </div>
          <div className="hero-grid-bottom mt-9 flex flex-wrap gap-4 lg:mt-0">
            <a
              href="#subscribe"
              onClick={(event) => {
                trackEvent('hero_chapter_cta_click');
                scrollToId('subscribe')(event);
              }}
              className="glitch-hover group inline-flex min-h-[44px] items-center gap-2 bg-signal px-5 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-base transition-all hover:bg-signal-glow hover:shadow-[0_0_24px_rgba(232,163,61,0.5)] sm:min-h-0"
            >
              GET CHAPTER ONE FREE <span className="inline-flex"><ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
            </a>
            <a
              href="#evidence"
              onClick={(event) => {
                trackEvent('explore_case_click');
                scrollToId('evidence')(event);
              }}
              className="glitch-hover inline-flex min-h-[44px] items-center gap-2 border-2 border-signal/70 px-5 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-signal transition-all hover:-translate-y-0.5 hover:bg-signal/10 hover:shadow-[0_0_18px_rgba(232,163,61,0.35)] sm:min-h-0"
            >
              EXPLORE THE CASE
            </a>
          </div>
        </div>
      </section>
      <Ticker />
      <section id="evidence" className="mx-auto max-w-7xl px-5 py-12 sm:py-16 lg:px-8 lg:py-24">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div><CaseLabel className="mb-4 block">&gt; NAVIGATION :: CASE_INDEX</CaseLabel><h2 className="font-heading2 text-3xl font-bold tracking-wide text-bright sm:text-4xl">FOLLOW THE EVIDENCE</h2><AccentBar className="mt-4" /></div>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-bright-faint sm:block">03 FILES // 01 SUBJECT</span>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <SectionLink href="#/file" label="THE FILE" text="A dormant credential. Billions in motion. One analyst left holding the evidence." openLabel="OPEN FILE // BOOK DETAILS" />
          <SectionLink id="exhibit-a" href="#/excerpt" label="EXHIBIT A" text="The running shoes had only been worn twice. Then the file begins." openLabel="OPEN FILE // CHAPTER ONE" />
          <SectionLink href="#/players" label="THE PLAYERS" text="The analyst. The investigator. The system that has no face." openLabel="OPEN FILE // CHARACTERS" />
        </div>
      </section>
      <EmailCaptureSection />
      {SHOW_PRAISE && <PraiseSection />}
    </>
  );
}

// Renders excerpt/chapter prose as proper paragraphs in a warm reading
// serif, instead of a <pre> block — the case-file framing should surround
// the story, not make the story itself read like a technical printout.
function ReadingText({ text, className = '' }: { text: string; className?: string }) {
  const paragraphs = text.split('\n\n');
  return (
    <div className={`mx-auto max-w-[680px] font-serif ${className}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="mb-6 whitespace-pre-wrap break-words leading-[1.75] last:mb-0">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function ChapterPreview() {
  const preview = EXCERPT.split('\n\n').slice(0, 2).join('\n\n');
  return (
    <div className="mt-16 border-t border-ink-line pt-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText size={18} className="text-signal" />
          <CaseLabel className="block">EXCLUSIVE EXCERPT :: OPENING PAGES</CaseLabel>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-bright-faint">EST. READ TIME: 1 MIN</span>
      </div>
      <div className="chapter-preview-fade corner-frame relative overflow-hidden border border-ink-muted bg-ink-card p-7 sm:p-10">
        <ReadingText text={preview} className="text-[17px] text-bright-muted lg:text-[19px]" />
      </div>
      <a href="#/excerpt" className="glitch-hover mt-6 inline-flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-signal hover:text-signal-glow">READ THE FULL EXCERPT <span className="inline-flex"><ArrowRight size={15} /></span></a>
    </div>
  );
}

function FilePage() {
  return (
    <>
      <PageIntro label="THE FILE" title="A SYSTEM BUILT TO BLAME HER">{SECONDARY_HOOK}</PageIntro>
      <main className="mx-auto max-w-7xl px-5 py-12 sm:py-16 lg:px-8 lg:py-24">
        <div className="corner-frame mb-16 border border-ink-line bg-ink-card p-8 sm:p-10">
          <CaseLabel className="mb-5 block">&gt; BOOK BLURB :: CASE_FILE</CaseLabel>
          <p className="max-w-3xl font-serif text-xl leading-relaxed text-bright sm:text-2xl">Sunita Verma&apos;s account was supposed to stay dormant. Then, in eight seconds, seventeen transactions moved billions through it — and every trail points to a woman who says she was never there. Analyst Gaurav Mishra has the evidence. Someone else has the eraser.</p>
        </div>
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div><CaseLabel className="mb-5 block">CASE SUMMARY // 00417</CaseLabel><div className="flex items-center gap-3 text-bright"><Lock size={20} className="text-signal" /><span className="font-mono text-[12px] uppercase tracking-[0.18em]">EYES ONLY // CLEARANCE PENDING</span></div><RuleLine className="my-8" /><p className="font-mono text-[12px] uppercase leading-loose tracking-[0.18em] text-bright-faint">SUBJECT: SUNITA_VERMA<br />SYSTEM: ZERO<br />THREAT LEVEL: GLOBAL<br />EVIDENCE STATUS: COMPROMISED</p></div>
          <div><p className="font-serif text-2xl leading-relaxed text-bright sm:text-3xl">{LOGLINE}</p><RuleLine className="my-8" /><p className="font-mono text-[12px] uppercase tracking-[0.2em] text-signal">// THE ACCOUNT IS NOT EMPTY. IT IS WAITING.</p></div>
        </div>
        <ChapterPreview />
        <div className="mt-24 border-t border-ink-line pt-12"><CaseLabel className="mb-5 block">STRUCTURAL NOTE // ZERO</CaseLabel><div className="max-w-3xl space-y-5 font-serif text-xl leading-relaxed text-bright-muted"><p>Corridors don&apos;t collapse all at once. They reroute, one quiet instruction at a time, until the map no longer matches the territory and the territory no longer matches the ledger.</p><p>Somewhere between the authorization layer and the settlement window, a small set of rules was rewritten to look like the rules that were already there. The surface area is planetary.</p><p className="italic text-signal">You will not see it coming. You are not supposed to.</p></div></div>
      </main>
    </>
  );
}

function ExcerptPage() {
  const completedRef = useFireOnceVisible(() => trackEvent('excerpt_completed'));
  return (
    <>
      <PageIntro label="EXHIBIT A" title="OPENING TRANSMISSION">The first detail is always the one nobody thought to hide.</PageIntro>
      <main className="mx-auto max-w-4xl px-5 py-12 sm:py-16 lg:px-8 lg:py-24">
        <div className="corner-frame relative border border-ink-muted bg-[#1a1813] p-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#28251c]/40 to-[#14130f]/60" />
          <div className="absolute right-5 top-5 rotate-[-6deg] border border-signal/60 px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-signal">EYES ONLY</div>
          <div className="relative mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#3a352a] pb-5">
            <div className="flex items-center gap-3"><FileText size={17} className="text-signal" /><span className="font-mono text-[12px] uppercase tracking-[0.24em] text-bright-muted">EXCLUSIVE EXCERPT // OPENING PAGES</span></div>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-bright-faint">EST. READ TIME: 1 MIN</span>
          </div>
          <ReadingText text={EXCERPT} className="relative text-[19px] text-[#eee8d8] lg:text-[20px]" />
          <div ref={completedRef} className="relative mt-10 border-t border-[#3a352a] pt-5">
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-signal">[ THIS IS A SHORT EXCERPT — NOT THE COMPLETE CHAPTER ]</p>
            <p className="mt-3 max-w-xl font-serif text-base leading-relaxed text-bright-muted">The complete Chapter One is sent free by email the moment you request clearance below.</p>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-5 border-t border-ink-line pt-6"><p className="font-mono text-[12px] uppercase tracking-[0.2em] text-bright-faint">TRANSMISSION 001 // END</p><a href="#/buy" className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.18em] text-signal hover:text-signal-glow">ACQUIRE THE FILE <span className="inline-flex"><ArrowRight size={15} /></span></a></div>
        <div className="corner-frame mt-10 border border-dashed border-signal/50 bg-ink-card p-7 sm:p-9">
          <CaseLabel className="mb-4 block">&gt; REQUEST_CLEARANCE ::</CaseLabel>
          <h2 className="font-heading2 text-2xl font-bold tracking-wide text-bright">GET THE COMPLETE CHAPTER ONE FREE</h2>
          <p className="mt-3 mb-6 max-w-xl font-serif text-lg leading-relaxed text-bright-muted">The full chapter is sent straight to your inbox, along with a launch alert when ZERO ACCOUNT releases.</p>
          <ClearanceRequest
            successMessage="CLEARANCE GRANTED — Chapter One is on its way. Please check your inbox."
            privacyNote="No spam. Unsubscribe anytime."
          />
        </div>
      </main>
    </>
  );
}

type Player = { name: string; role: string; variant: 'human' | 'system' | 'classified'; note?: string };
const PLAYERS: Player[] = [
  {
    name: 'SUNITA VERMA',
    role: 'A gifted forensic analyst whose dormant credentials suddenly authorise billions in illegal transactions. Disgraced by manufactured evidence, Sunita must uncover who has weaponised her identity before the system destroys her completely.',
    variant: 'human',
    note: 'STATUS: DISGRACED // CLEARANCE REVOKED',
  },
  {
    name: 'GAURAV MISHRA',
    role: 'An investigator trained to notice what financial systems are designed to hide. Carrying the scars of his previous case, Gaurav follows eight seconds of impossible evidence into a conspiracy capable of destabilising global financial corridors.',
    variant: 'human',
    note: 'CROSS-REFERENCE: PROTAGONIST OF BOOK ONE',
  },
  {
    name: 'ZERO',
    role: 'Not a person, but an architecture of hidden instructions operating beneath legitimate financial systems. ZERO does not merely erase evidence—it rewrites responsibility.',
    variant: 'system',
    note: 'NO_PERSON_RECORD :: SYSTEM_ENTITY',
  },
  {
    name: '[ IDENTITY CLASSIFIED ]',
    role: 'This file remains sealed. Disclosure would compromise the investigation.',
    variant: 'classified',
    note: 'ACCESS DENIED // CLEARANCE INSUFFICIENT',
  },
];

function PlayerCard({ player }: { player: Player }) {
  const system = player.variant === 'system';
  const classified = player.variant === 'classified';
  return <article className={`corner-frame min-h-[245px] border p-6 transition-all hover:-translate-y-1 ${system ? 'border-signal/60 bg-ink-card scan-texture' : classified ? 'border-dashed border-ink-muted bg-ink-base' : 'border-ink-line bg-ink-card hover:border-signal/60 hover:shadow-[0_18px_40px_-20px_rgba(232,163,61,0.3)]'}`}>
    <div className="mb-5 flex items-center gap-3">{system ? <ScanLine size={18} className="text-signal" /> : classified ? <Lock size={18} className="text-bright-muted" /> : <Fingerprint size={18} className="text-signal" />}<span className="font-mono text-[11px] uppercase tracking-[0.22em] text-bright-faint">{system ? 'SYSTEM_ENTITY' : classified ? 'FILE_SLOT' : 'PERSON_OF_INTEREST'}</span></div>
    <h2 className={`font-heading2 text-xl font-bold tracking-wide ${system ? 'text-signal animate-flicker' : classified ? 'text-bright-muted' : 'text-bright'}`}>{player.name}</h2>
    <RuleLine className="my-5" />
    <p className="font-serif text-lg leading-relaxed text-bright-muted">{player.role}</p>
    <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-bright-faint">// {player.note}</p>
  </article>;
}

function PlayersPage() {
  return <><PageIntro label="THE PLAYERS" title="EVERYONE HAS A CLEARANCE LEVEL">Three identities. One pending file. The system is the only one that never has to explain itself.</PageIntro><main className="mx-auto max-w-7xl px-5 py-12 sm:py-16 lg:px-8 lg:py-24"><div className="mb-10 flex items-end justify-between"><div><CaseLabel className="mb-4 block">PERSONS OF INTEREST // DOSSIER</CaseLabel><p className="font-mono text-[12px] uppercase tracking-[0.2em] text-bright-muted">// READ THE NAMES. THEN READ BETWEEN THEM.</p></div><Folder className="hidden text-signal sm:block" size={28} /></div><div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">{PLAYERS.map((player) => <PlayerCard key={player.name} player={player} />)}</div></main></>;
}

function BookOnePage() {
  return <><PageIntro label="CROSS-REFERENCE" title="BOOK ONE — SHADOW CODE">Before Zero Account, there was a different kind of breach. Gaurav Mishra was already inside.</PageIntro><main className="mx-auto max-w-5xl px-5 py-12 sm:py-16 lg:px-8 lg:py-24"><a href="https://the-shadow-code.com" target="_blank" rel="noopener noreferrer" className="corner-frame group grid gap-8 border border-ink-line bg-ink-card p-8 transition-all hover:-translate-y-1 hover:border-signal/70 hover:shadow-[0_18px_40px_-20px_rgba(232,163,61,0.35)] sm:p-12 md:grid-cols-[0.55fr_1fr] md:items-center"><div className="relative mx-auto aspect-[2/3] w-[170px] overflow-hidden border border-ink-muted bg-ink-base shadow-[0_20px_50px_-20px_rgba(0,0,0,0.85)] sm:w-[200px]"><img src="https://the-shadow-code.com/Screenshot_2026-06-11_192313.png" alt="Shadow Code book cover" loading="lazy" decoding="async" className="h-full w-full object-cover" /></div><div><div className="flex flex-wrap items-start justify-between gap-6"><div><CaseLabel className="mb-5 block">BOOK ONE // THE GAURAV MISHRA SERIES</CaseLabel><h2 className="break-words font-heading2 text-[clamp(1.6rem,4vw,2.75rem)] font-bold tracking-wide text-bright">SHADOW CODE</h2><p className="mt-6 max-w-2xl font-serif text-xl leading-relaxed text-bright-muted sm:text-2xl">The case that came before. Gaurav Mishra walks into the dark, and the dark remembers his name.</p></div><ExternalLink className="shrink-0 text-signal" size={26} /></div><div className="mt-10 inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.18em] text-signal">OPEN THE SHADOW CODE FILE <span className="inline-flex"><ArrowRight size={15} /></span></div></div></a><div className="mt-8 flex items-center gap-4 font-mono text-[12px] uppercase tracking-[0.18em] text-bright-faint"><span className="inline-flex"><ArrowLeft size={14} /></span> RETURN TO THE SERIES INDEX</div></main></>;
}

function AuthorPage() {
  return (
    <>
      <PageIntro label="THE AUTHOR" title="THE HAND BEHIND THE FILE">The systems are fictional. The mechanisms are not.</PageIntro>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:py-16 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <a href="https://authorgaurav.com" target="_blank" rel="noopener noreferrer" aria-label="Visit authorgaurav.com" className="corner-frame group relative block overflow-hidden border border-ink-muted bg-ink-card shadow-[0_25px_70px_-25px_rgba(0,0,0,0.85)]">
              <img src="https://authorgaurav.com/images/author/GM-Photo.jpg" alt="Gaurav Mishra, author portrait" loading="lazy" decoding="async" className="aspect-[2/3] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-base/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 border-t border-ink-line/80 bg-ink-base/85 px-4 py-3 backdrop-blur-sm">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-bright-faint">// FIELD_PHOTO :: AUTHOR</span>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.2em] text-signal">AUTHORGAURAV.COM <ExternalLink size={11} /></span>
              </div>
            </a>
            <div className="mt-5 flex items-center gap-3 border border-ink-line bg-[#f8f5ef] px-4 py-3">
              <img src="/authorgaurav-logo.webp" alt="Gaurav Mishra logo" loading="lazy" decoding="async" className="h-8 w-auto object-contain" />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-base/70">THE GAURAV MISHRA SERIES</span>
            </div>
          </div>
          <div>
            <CaseLabel className="mb-5 block">AUTHOR PROFILE // GM-001</CaseLabel>
            <h2 className="font-heading2 text-3xl font-bold tracking-wide text-bright sm:text-4xl">GAURAV MISHRA</h2>
            <AccentBar className="my-7" />
            <p className="font-serif text-2xl leading-relaxed text-bright">Gaurav Mishra writes financial-crime thrillers grounded in how modern fraud actually works.</p>
            <p className="mt-6 font-serif text-lg leading-relaxed text-bright-muted">The Gaurav Mishra Series follows one investigator across connected cases, each one a deeper cut into the systems that move money and the people who learn to bend them.</p>
            <a href="https://authorgaurav.com" target="_blank" rel="noopener noreferrer" className="mt-9 inline-flex items-center gap-2 border border-signal px-5 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-signal transition-all hover:bg-signal hover:text-ink-base hover:shadow-[0_0_20px_rgba(232,163,61,0.45)]">MORE BY GAURAV MISHRA <span className="inline-flex"><ExternalLink size={15} /></span></a>
          </div>
        </div>
      </main>
    </>
  );
}

const RETAILERS = ['AMAZON', 'KINDLE', 'FLIPKART', 'NOTIONPRESS', 'GOODREADS'];

function ClearanceRequest({
  successMessage = 'CLEARANCE GRANTED — Chapter One is on its way. Please check your inbox.',
  privacyNote = 'No spam. Unsubscribe anytime.',
}: { successMessage?: string; privacyNote?: string } = {}) {
  const [email, setEmail] = useState('');
  // Honeypot: a field real visitors never see or fill in. Bots that
  // auto-fill every input on a form will populate it, and we silently drop
  // the submission — no CAPTCHA, no added friction for real subscribers.
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (company.trim() !== '') {
      // Bot tripped the honeypot. Pretend success; do not call the backend.
      setStatus('done');
      return;
    }
    if (!supabaseReady) { setStatus('error'); setMessage('BACKEND OFFLINE // TRY AGAIN LATER'); return; }
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || trimmed.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setStatus('error'); setMessage('INVALID_ADDRESS // CHECK INPUT'); return; }
    setStatus('loading');
    const result = await submitClearanceRequest(trimmed);
    if (result.ok) {
      setStatus('done');
      trackEvent('email_signup_success');
      return;
    }
    setStatus('error');
    setMessage(result.reason === 'rate_limited' ? 'TOO MANY REQUESTS // STAND BY AND RETRY LATER' : result.reason === 'invalid_email' ? 'INVALID_ADDRESS // CHECK INPUT' : 'TRANSMISSION FAILED // TRY AGAIN');
  }
  if (status === 'done') return <div role="status" className="border border-signal/60 bg-ink-card p-6"><p className="font-mono text-sm uppercase tracking-[0.16em] text-signal">CLEARANCE GRANTED</p><p className="mt-2 font-serif text-base text-bright-muted">{successMessage.replace(/^CLEARANCE GRANTED\s*[—-]?\s*/, '')}</p></div>;
  return (
    <form onSubmit={submit} className="border border-ink-line bg-ink-card p-6" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="email" className="sr-only">Email address</label>
        <div className="flex flex-1 items-center border border-ink-muted bg-ink-base px-3 focus-within:border-signal">
          <span className="mr-2 font-mono text-signal" aria-hidden="true">&gt;</span>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="your@email.com"
            aria-describedby={status === 'error' ? 'clearance-error' : undefined}
            className="w-full bg-transparent py-3 font-mono text-base text-bright outline-none placeholder:text-bright-faint sm:text-sm"
          />
        </div>
        {/* Honeypot field: visually and semantically hidden from real users/AT. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />
        <button disabled={status === 'loading'} className="inline-flex min-h-[44px] items-center justify-center gap-2 bg-signal px-5 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-base transition-all hover:bg-signal-glow hover:shadow-[0_0_20px_rgba(232,163,61,0.45)] disabled:opacity-60 sm:min-h-0">
          {status === 'loading' ? 'TRANSMITTING…' : 'REQUEST CLEARANCE'} <span className="inline-flex"><Send size={15} /></span>
        </button>
      </div>
      {status === 'error' && <p id="clearance-error" role="alert" className="mt-4 font-mono text-[12px] uppercase tracking-[0.16em] text-danger">{message}</p>}
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-bright-faint">
        {privacyNote} By subscribing you agree to receive Chapter One and launch updates. See our{' '}
        <a href="#/privacy" className="underline hover:text-signal">Privacy Policy</a>.
      </p>
    </form>
  );
}

// Retailer URLs are not yet confirmed. Per policy, placeholder "#" links are
// never shipped as if they were live buttons — each renders as a clearly
// disabled control until a real, verified purchase URL is supplied.
function RetailerButton({ retailer }: { retailer: string }) {
  return (
    <span
      role="button"
      aria-disabled="true"
      tabIndex={-1}
      title="Available at launch"
      className="corner-frame flex min-h-[44px] flex-wrap items-center justify-between gap-x-3 gap-y-1 border border-ink-line px-5 py-4 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-bright-faint opacity-60 cursor-not-allowed"
    >
      {retailer}
      <span className="font-mono text-[10px] tracking-[0.14em] text-bright-faint">AVAILABLE AT LAUNCH</span>
    </span>
  );
}

function BuyPage() {
  return (
    <>
      <PageIntro label="BUY NOW" title="ACQUIRE THE FILE">The truth is expensive. The book costs less.</PageIntro>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:py-16 lg:px-8 lg:py-24">
        <div className="grid gap-16 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <CaseLabel className="mb-5 block">RETAIL ACCESS // SELECT CHANNEL</CaseLabel>
            <div className="grid gap-4 sm:grid-cols-2">
              {RETAILERS.map((retailer) => <RetailerButton key={retailer} retailer={retailer} />)}
            </div>
            <p className="mt-6 max-w-sm font-serif text-base leading-relaxed text-bright-muted">RELEASING MID-SEPTEMBER 2026. Get Chapter One now and receive the launch link the moment the book goes live.</p>
          </div>
          <div>
            <CaseLabel className="mb-5 block">&gt; REQUEST_CLEARANCE ::</CaseLabel>
            <h2 className="font-heading2 text-2xl font-bold tracking-wide text-bright">GET CHAPTER ONE FIRST</h2>
            <p className="mt-3 mb-7 font-mono text-[12px] uppercase tracking-[0.16em] text-bright-muted">// OPENING TRANSMISSION SENT INSTANTLY TO YOUR INBOX</p>
            <ClearanceRequest />
          </div>
        </div>
      </main>
    </>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-line bg-ink-base">
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="mb-10 grid gap-6 sm:grid-cols-2">
          <a href="https://the-shadow-code.com" target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('start_series_click')} className="glitch-hover group flex items-center gap-4 border border-ink-line bg-ink-card p-4 transition-all hover:-translate-y-0.5 hover:border-signal/60">
            <img src="https://the-shadow-code.com/Screenshot_2026-06-11_192313.png" alt="Shadow Code book cover" loading="lazy" decoding="async" className="h-20 w-14 shrink-0 border border-ink-muted object-cover" />
            <div>
              <span className="mb-1 inline-block bg-signal px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-base">BOOK ONE IN THE SERIES</span>
              <p className="font-heading2 text-lg font-bold tracking-wide text-bright">SHADOW CODE</p>
              <span className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-signal group-hover:text-signal-glow">THE-SHADOW-CODE.COM <ExternalLink size={11} /></span>
            </div>
          </a>
          <a href="https://authorgaurav.com" target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('author_site_click')} className="glitch-hover group flex items-center gap-4 border border-ink-line bg-ink-card p-4 transition-all hover:-translate-y-0.5 hover:border-signal/60">
            <span className="flex h-20 w-14 shrink-0 items-center justify-center border border-ink-muted bg-[#f8f5ef]">
              <img src="/authorgaurav-logo.webp" alt="Gaurav Mishra" loading="lazy" decoding="async" className="h-full w-full object-contain p-2" />
            </span>
            <div>
              <span className="mb-1 inline-block border border-signal/60 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-signal">THE AUTHOR</span>
              <p className="font-heading2 text-lg font-bold tracking-wide text-bright">GAURAV MISHRA</p>
              <span className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-signal group-hover:text-signal-glow">AUTHORGAURAV.COM <ExternalLink size={11} /></span>
            </div>
          </a>
        </div>
        <nav aria-label="Footer" className="mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-ink-line pt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-bright-faint">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-signal">{link.label}</a>
          ))}
        </nav>
        <nav aria-label="Legal" className="mb-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em] text-bright-faint/80">
          <a href="#/privacy" className="hover:text-signal">Privacy Policy</a>
          <a href="#/terms" className="hover:text-signal">Terms of Use</a>
          <a href="#/contact" className="hover:text-signal">Contact / Press</a>
          <a href="#/accessibility" className="hover:text-signal">Accessibility</a>
        </nav>
        <div className="mb-8 border-t border-dashed border-signal/40 pt-8 text-center">
          <a href="#/book-one" onClick={() => trackEvent('start_series_click')} className="glitch-hover inline-flex items-center gap-2 font-mono text-[13px] font-semibold uppercase tracking-[0.18em] text-signal hover:text-signal-glow">Start with Book One: The Shadow Code <ArrowRight size={14} /></a>
        </div>
        <div className="flex flex-col items-center justify-between gap-5 border-t border-ink-line pt-6 sm:flex-row">
          <p className="font-mono text-[12px] text-bright-faint">© {new Date().getFullYear()} Gaurav Mishra. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-5 font-mono text-[12px] uppercase tracking-[0.16em]">
            <a href="https://authorgaurav.com" target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('author_site_click')} className="text-bright-muted hover:text-signal">AUTHORGAURAV.COM</a>
            <a href="https://the-shadow-code.com" target="_blank" rel="noopener noreferrer" className="text-bright-muted hover:text-signal">THE-SHADOW-CODE.COM</a>
            <a href="mailto:hello@writetogetherhub.com" className="text-bright-muted hover:text-signal">PRESS: HELLO@WRITETOGETHERHUB.COM</a>
            <a href="https://www.instagram.com/gauravmishrawrites/" target="_blank" rel="noopener noreferrer" aria-label="Gaurav Mishra on Instagram" className="flex min-h-[44px] min-w-[44px] items-center justify-center text-bright-muted hover:text-signal">
              <Instagram size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

class RouteErrorBoundary extends Component<
  { children: ReactNode; routeKey: string },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidUpdate(prev: { routeKey: string }) {
    if (prev.routeKey !== this.props.routeKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {}
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center px-5 py-20">
          <div className="text-center">
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-signal">// TRANSMISSION ERROR</p>
            <p className="mt-4 font-mono text-sm text-bright-muted">SIGNAL LOST. RETURN TO BASE.</p>
            <a href="#/" className="mt-6 inline-flex items-center gap-2 border border-signal px-5 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-signal hover:bg-signal hover:text-ink-base transition-colors">RETURN HOME</a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Fixed bottom bar on mobile only (hidden md:+) so the primary conversion
// action stays reachable without scrolling back to the hero. Hidden on the
// Buy page itself, since that page already is the destination.
function MobileStickyCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-line bg-ink-base/95 p-3 backdrop-blur-md md:hidden">
      <a href="#/buy" className="glitch-hover flex min-h-[44px] w-full items-center justify-center gap-2 bg-signal px-5 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-base transition-all hover:bg-signal-glow">
        GET CHAPTER ONE FREE <span className="inline-flex"><ArrowRight size={16} /></span>
      </a>
    </div>
  );
}

function LegalPage({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <>
      <PageIntro label={label} title={title}>Standard site information, kept plain and easy to find.</PageIntro>
      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16 lg:px-8 lg:py-20">
        <div className="space-y-6 font-serif text-lg leading-relaxed text-bright-muted">{children}</div>
      </main>
    </>
  );
}

function PrivacyPage() {
  return (
    <LegalPage label="PRIVACY" title="PRIVACY POLICY">
      <p>This site collects only the email address you choose to submit through a "Request Clearance" signup form. That address is used to send you Chapter One and occasional updates about ZERO ACCOUNT and the wider Gaurav Mishra series. It is never sold or shared with third parties for advertising.</p>
      <p>Signups are stored with our database provider (Supabase) behind a server-side function that validates each request. To prevent abuse, we also record a one-way cryptographic hash derived from your network address for a short rate-limiting window; this hash cannot be reversed to reveal your address and is not linked to your identity.</p>
      <p>This site does not use advertising or tracking cookies. If analytics are added in the future, this page will be updated to reflect it.</p>
      <p>To have your email address removed from our list at any time, contact <a href="mailto:hello@writetogetherhub.com" className="text-signal underline hover:text-signal-glow">hello@writetogetherhub.com</a>.</p>
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-bright-faint">Last updated: August 2026.</p>
    </LegalPage>
  );
}

function TermsPage() {
  return (
    <LegalPage label="TERMS" title="TERMS OF USE">
      <p>ZERO ACCOUNT, its characters, and its storyline are works of fiction. Any resemblance to real events, institutions, or persons is coincidental.</p>
      <p>All text, artwork, and cover imagery on this site belong to Gaurav Mishra and may not be reproduced without permission.</p>
      <p>This site is provided as-is, without warranty of any kind, for the purpose of sharing information about the book and collecting reader signups.</p>
      <p>For questions about these terms, contact <a href="mailto:hello@writetogetherhub.com" className="text-signal underline hover:text-signal-glow">hello@writetogetherhub.com</a>.</p>
    </LegalPage>
  );
}

function ContactPage() {
  return (
    <LegalPage label="CONTACT" title="CONTACT & PRESS">
      <p>For press inquiries, review copies, or interview requests, email <a href="mailto:hello@writetogetherhub.com" className="text-signal underline hover:text-signal-glow">hello@writetogetherhub.com</a>.</p>
      <p>For more about the author, visit <a href="https://authorgaurav.com" target="_blank" rel="noopener noreferrer" className="text-signal underline hover:text-signal-glow">authorgaurav.com</a> or follow <a href="https://www.instagram.com/gauravmishrawrites/" target="_blank" rel="noopener noreferrer" className="text-signal underline hover:text-signal-glow">@gauravmishrawrites</a> on Instagram.</p>
    </LegalPage>
  );
}

function AccessibilityPage() {
  return (
    <LegalPage label="ACCESSIBILITY" title="ACCESSIBILITY STATEMENT">
      <p>We want everyone to be able to read about ZERO ACCOUNT and sign up for updates, regardless of ability or device. This site is built to follow WCAG 2.1 AA guidance: keyboard navigation, visible focus states, sufficient colour contrast, descriptive alt text, and respect for reduced-motion preferences.</p>
      <p>If you encounter an accessibility barrier anywhere on this site, please tell us at <a href="mailto:hello@writetogetherhub.com" className="text-signal underline hover:text-signal-glow">hello@writetogetherhub.com</a> so we can fix it.</p>
    </LegalPage>
  );
}

// Per-route SEO metadata. Canonical URLs point at this site's actual
// shareable addresses (hash-based for interior pages); when clean URL
// routing ships, only this table and the canonical builder need to change.
const PAGE_META: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Zero Account | A Gaurav Mishra Thriller',
    description: 'A dormant account. Seventeen transactions in eight seconds. ZERO ACCOUNT, the new Gaurav Mishra thriller, arrives mid-September 2026.',
  },
  '/file': {
    title: 'The Story — Zero Account | Gaurav Mishra',
    description: "Sunita Verma's dormant account just moved billions in eight seconds. Read the case file behind ZERO ACCOUNT, Book Two in the Gaurav Mishra series.",
  },
  '/excerpt': {
    title: 'Read an Exclusive Excerpt — Zero Account',
    description: 'Read an exclusive excerpt from ZERO ACCOUNT and get the complete Chapter One free by email.',
  },
  '/players': {
    title: 'Characters — Zero Account | Gaurav Mishra',
    description: 'Meet Sunita Verma, investigator Gaurav Mishra, and the hidden system called ZERO — the people and non-person at the centre of ZERO ACCOUNT.',
  },
  '/book-one': {
    title: 'Start the Series: Shadow Code — Zero Account',
    description: 'Before ZERO ACCOUNT, there was Shadow Code. Start the Gaurav Mishra series from Book One.',
  },
  '/author': {
    title: 'About Gaurav Mishra — Zero Account',
    description: 'Gaurav Mishra writes financial-crime thrillers grounded in how modern fraud actually works. Learn more about the author of ZERO ACCOUNT.',
  },
  '/buy': {
    title: 'Get the Book — Zero Account | Releasing Mid-September 2026',
    description: 'ZERO ACCOUNT releases mid-September 2026. Get Chapter One free now and receive the launch link the moment the book goes live.',
  },
  '/privacy': { title: 'Privacy Policy — Zero Account', description: 'How zero-account.com collects and uses your email address.' },
  '/terms': { title: 'Terms of Use — Zero Account', description: 'Terms of use for zero-account.com.' },
  '/contact': { title: 'Contact & Press — Zero Account', description: 'Press and contact information for author Gaurav Mishra.' },
  '/accessibility': { title: 'Accessibility Statement — Zero Account', description: 'Our commitment to an accessible reading and signup experience.' },
};

/** Creates or updates a <meta> tag by attribute (name or property). */
function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Creates or updates a <link rel="..."> tag. */
function setLinkTag(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/** Injects (or replaces) a single JSON-LD <script> block by a stable id. */
function setJsonLd(id: string, data: Record<string, unknown>) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

const SITE_URL = 'https://zero-account.com/';
const COVER_IMAGE = 'https://the-shadow-code.com/covers/the-zero-account-front.webp';

// Site-wide structured data (Book, Person, WebSite) — added once. Only
// confirmed facts are included; ISBN, publisher and price are deliberately
// omitted until the author confirms them, rather than inventing placeholders.
function useStructuredData() {
  useEffect(() => {
    setJsonLd('ld-book', {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: 'Zero Account',
      author: { '@type': 'Person', name: 'Gaurav Mishra', url: 'https://authorgaurav.com' },
      image: COVER_IMAGE,
      description: LOGLINE,
      genre: 'Financial thriller',
      inLanguage: 'en',
      isPartOfSeries: { '@type': 'CreativeWorkSeries', name: 'The Gaurav Mishra Series', position: 2 },
      url: SITE_URL,
    });
    setJsonLd('ld-person', {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Gaurav Mishra',
      url: 'https://authorgaurav.com',
      sameAs: ['https://www.instagram.com/gauravmishrawrites/', 'https://the-shadow-code.com'],
      jobTitle: 'Author',
    });
    setJsonLd('ld-website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Zero Account',
      url: SITE_URL,
    });
  }, []);
}

// Keeps <title>, meta description, canonical, and Open Graph/Twitter tags in
// sync with the current hash route, and emits a WebPage + BreadcrumbList
// JSON-LD block per page — the SPA equivalent of unique per-page metadata.
function useRouteMeta(path: string) {
  useEffect(() => {
    const meta = PAGE_META[path] ?? PAGE_META['/'];
    const canonical = path === '/' ? SITE_URL : `${SITE_URL}#${path}`;
    document.title = meta.title;
    setMetaTag('name', 'description', meta.description);
    setLinkTag('canonical', canonical);
    setMetaTag('property', 'og:title', meta.title);
    setMetaTag('property', 'og:description', meta.description);
    setMetaTag('property', 'og:url', canonical);
    setMetaTag('property', 'og:image', COVER_IMAGE);
    setMetaTag('name', 'twitter:title', meta.title);
    setMetaTag('name', 'twitter:description', meta.description);
    setMetaTag('name', 'twitter:image', COVER_IMAGE);

    setJsonLd('ld-webpage', {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: meta.title,
      description: meta.description,
      url: canonical,
      isPartOf: { '@type': 'WebSite', url: SITE_URL, name: 'Zero Account' },
    });
    setJsonLd('ld-breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        ...(path === '/' ? [] : [{ '@type': 'ListItem', position: 2, name: meta.title.split(' — ')[0].split(' | ')[0], item: canonical }]),
      ],
    });
  }, [path]);
}

function App() {
  const path = useHashPath();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [path]);
  useStructuredData();
  useRouteMeta(path);
  const page =
    path === '/file' ? <FilePage /> :
    path === '/excerpt' ? <ExcerptPage /> :
    path === '/players' ? <PlayersPage /> :
    path === '/book-one' ? <BookOnePage /> :
    path === '/author' ? <AuthorPage /> :
    path === '/buy' ? <BuyPage /> :
    path === '/privacy' ? <PrivacyPage /> :
    path === '/terms' ? <TermsPage /> :
    path === '/contact' ? <ContactPage /> :
    path === '/accessibility' ? <AccessibilityPage /> :
    <HomePage />;
  return (
    <div className="scanlines vignette min-h-screen pb-[68px] text-bright md:pb-0">
      <LedgerRainBackground />
      <Nav />
      <main><RouteErrorBoundary routeKey={path}>{page}</RouteErrorBoundary></main>
      <Footer />
      {path !== '/buy' && <MobileStickyCTA />}
    </div>
  );
}

export default App;
