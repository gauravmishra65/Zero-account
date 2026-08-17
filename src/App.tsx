import { Component, useEffect, useState, type ErrorInfo, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  FileText,
  Fingerprint,
  Folder,
  Lock,
  Menu,
  ScanLine,
  Send,
  X,
} from 'lucide-react';
import { submitClearanceRequest, supabaseReady } from '@/lib/supabase';

const TITLE = 'ZERO ACCOUNT';
const SERIES_LINE = 'BOOK TWO — THE GAURAV MISHRA SERIES';
const CASE_HEADER = '> CASE_FILE :: SV-00417 // STATUS: ACTIVE';
const TAGLINE = 'Eight seconds. Seventeen transactions. A truth that had to outrun a lie.';
const SECONDARY_HOOK = 'Then a dormant credential began authorising billions.';
const LOGLINE =
  'Zero Account is a techno-noir financial thriller about disgraced forensic analyst Sunita Verma, whose dormant credentials are secretly used to authorize billions in illicit transactions while a hidden system called Zero turns her own work and identity against her. With investigator Gaurav Mishra, she must expose the architecture behind the fraud before it collapses global financial corridors — and before the manufactured evidence destroys her for crimes she never committed.';
const EXCERPT = `The running shoes had only been worn twice.

Gaurav Mishra noticed them beneath his desk the way he noticed most things in his apartment — with the faint recognition that they were there, that they represented an intention that had once been genuine, and that intentions and outcomes were rarely the same thing.

Six months had passed. Technically, he wasn't supposed to be working.`;
const TICKER_LINES = [
  'CREDENTIAL: SUNITA_VERMA // STATUS: DORMANT→ACTIVE //',
  'SYSTEM: ZERO // ACCESS: UNAUTHORIZED //',
  'INVESTIGATOR: GAURAV_MISHRA // CLEARANCE: PENDING //',
  'THRESHOLD_BREACH: CONFIRMED //',
  'TRANSACTIONS: 17 // WINDOW: 00:00:08 //',
  'EVIDENCE_CHAIN: COMPROMISED //',
  'RELEASE_WINDOW: MID-SEPTEMBER 2026 //',
];

const NAV_LINKS = [
  { href: '#/file', label: 'THE FILE' },
  { href: '#/excerpt', label: 'EXCERPT' },
  { href: '#/players', label: 'THE PLAYERS' },
  { href: '#/book-one', label: 'BOOK ONE' },
  { href: '#/author', label: 'THE AUTHOR' },
];

function CaseLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[11px] uppercase tracking-[0.25em] text-signal ${className}`}>
      {children}
    </span>
  );
}

function RuleLine({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-ink-line ${className}`} />;
}

function useTypewriter(text: string, speed = 38) {
  const [out, setOut] = useState('');
  useEffect(() => {
    let index = 0;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = setTimeout(() => {
      const tick = () => {
        if (!active) return;
        index += 1;
        setOut(text.slice(0, index));
        if (active && index < text.length) timer = setTimeout(tick, speed);
      };
      tick();
    }, 350);
    return () => {
      active = false;
      clearTimeout(start);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [text, speed]);
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

function SiteLogo() {
  return (
    <a href="#/" aria-label="Return to Zero Account home" className="flex items-center gap-3">
      <span className="flex h-9 w-[104px] items-center justify-center overflow-hidden bg-[#f8f5ef] px-2">
        <img src="/authorgaurav-logo.png" alt="Gaurav Mishra" className="h-full w-full object-contain" />
      </span>
      <span className="font-mono text-sm font-semibold tracking-tight text-bright hover:text-signal transition-colors">
        ZERO_ACCOUNT<span className="text-signal">//</span>
      </span>
    </a>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  const path = useHashPath();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink-line bg-ink-base/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <span onClick={() => setOpen(false)}>
          <SiteLogo />
        </span>
        <div className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} aria-current={path === link.href.slice(1) ? 'page' : undefined} className={`font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${path === link.href.slice(1) ? 'text-signal' : 'text-bright-muted hover:text-signal'}`}>
              {link.label}
            </a>
          ))}
          <a href="#/buy" className="border border-signal px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-signal hover:bg-signal hover:text-ink-base transition-colors">BUY</a>
        </div>
        <button className="text-bright lg:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-ink-line bg-ink-base px-5 py-4 lg:hidden">
          {[...NAV_LINKS, { href: '#/buy', label: 'BUY' }].map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="block border-b border-ink-line py-4 font-mono text-[12px] uppercase tracking-[0.18em] text-bright hover:text-signal">
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

function Ticker() {
  const line = TICKER_LINES.join('   ');
  return (
    <div className="overflow-hidden border-y border-ink-line bg-ink-panel/70">
      <div className="ticker-track flex w-max animate-scrollX hover:[animation-play-state:paused]">
        <span className="whitespace-nowrap px-8 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-signal">{line}</span>
        <span className="whitespace-nowrap px-8 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-signal">{line}</span>
      </div>
    </div>
  );
}

function PageIntro({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <div className="border-b border-ink-line bg-ink-panel/50 pt-36 pb-16 lg:pt-44 lg:pb-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <CaseLabel className="mb-5 block">&gt; {label} :: ACTIVE</CaseLabel>
        <h1 className="max-w-4xl font-mono text-4xl font-bold tracking-tight text-bright sm:text-6xl">{title}</h1>
        <p className="mt-6 max-w-2xl font-serif text-xl leading-relaxed text-bright-muted sm:text-2xl">{children}</p>
      </div>
    </div>
  );
}

function SectionLink({ href, label, text }: { href: string; label: string; text: string }) {
  return (
    <a href={href} className="group block border border-ink-line bg-ink-card p-6 hover:border-signal/70 transition-colors">
      <CaseLabel className="mb-4 block">{label}</CaseLabel>
      <p className="font-serif text-xl leading-snug text-bright">{text}</p>
      <span className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-signal">OPEN FILE <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
    </a>
  );
}

function HomePage() {
  const tagline = useTypewriter(TAGLINE);
  return (
    <>
      <section className="flex min-h-screen items-center pt-32 pb-16 lg:pt-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="order-2 lg:order-1">
            <CaseLabel className="mb-7 block">{CASE_HEADER}</CaseLabel>
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-signal">{SERIES_LINE}</p>
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-signal">// ARRIVES MID-SEPTEMBER 2026</p>
            <h1 className="font-mono text-5xl font-bold leading-[0.92] tracking-tightest text-bright sm:text-7xl lg:text-8xl">
              ZERO <span className="animate-flicker text-signal">ACCOUNT</span>
            </h1>
            <p className="mt-8 min-h-[4rem] max-w-xl font-serif text-2xl leading-snug text-bright sm:text-3xl">&ldquo;{tagline}&rdquo;</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#/excerpt" className="group inline-flex items-center gap-2 bg-signal px-5 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-base hover:bg-signal-glow transition-colors">READ THE CASE FILE <span className="inline-flex"><ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span></a>
              <a href="#/players" className="inline-flex items-center gap-2 border border-ink-muted px-5 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-bright hover:border-signal hover:text-signal transition-colors">MEET THE PLAYERS</a>
            </div>
          </div>
          <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
            <div className="relative">
              <div className="absolute -left-3 -top-3 z-10 bg-signal px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-base">EXHIBIT 1</div>
              <div className="relative aspect-[2/3] w-[270px] overflow-hidden border border-ink-muted bg-ink-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] sm:w-[330px]">
                <img src="https://the-shadow-code.com/covers/the-zero-account-front.webp" alt="Zero Account book cover" className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-bright-faint">// ITEM_001 :: COVER_PLATE</p>
            </div>
          </div>
        </div>
      </section>
      <Ticker />
      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div><CaseLabel className="mb-4 block">&gt; NAVIGATION :: CASE_INDEX</CaseLabel><h2 className="font-mono text-3xl font-bold text-bright sm:text-4xl">FOLLOW THE EVIDENCE</h2></div>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-bright-faint sm:block">06 FILES // 01 SUBJECT</span>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <SectionLink href="#/file" label="THE FILE" text="A dormant credential. Billions in motion. One analyst left holding the evidence." />
          <SectionLink href="#/excerpt" label="EXHIBIT A" text="The running shoes had only been worn twice. Then the file begins." />
          <SectionLink href="#/players" label="THE PLAYERS" text="The analyst. The investigator. The system that has no face." />
        </div>
      </section>
    </>
  );
}

function FilePage() {
  return (
    <>
      <PageIntro label="THE FILE" title="A SYSTEM BUILT TO BLAME HER">{SECONDARY_HOOK}</PageIntro>
      <main className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div><CaseLabel className="mb-5 block">CASE SUMMARY // 00417</CaseLabel><div className="flex items-center gap-3 text-bright"><Lock size={20} className="text-signal" /><span className="font-mono text-[12px] uppercase tracking-[0.18em]">EYES ONLY // CLEARANCE PENDING</span></div><RuleLine className="my-8" /><p className="font-mono text-[11px] uppercase leading-loose tracking-[0.18em] text-bright-faint">SUBJECT: SUNITA_VERMA<br />SYSTEM: ZERO<br />THREAT LEVEL: GLOBAL<br />EVIDENCE STATUS: COMPROMISED</p></div>
          <div><p className="font-serif text-2xl leading-relaxed text-bright sm:text-3xl">{LOGLINE}</p><RuleLine className="my-8" /><p className="font-mono text-[12px] uppercase tracking-[0.2em] text-signal">// THE ACCOUNT IS NOT EMPTY. IT IS WAITING.</p></div>
        </div>
        <div className="mt-24 border-t border-ink-line pt-12"><CaseLabel className="mb-5 block">STRUCTURAL NOTE // ZERO</CaseLabel><div className="max-w-3xl space-y-5 font-serif text-xl leading-relaxed text-bright-muted"><p>Corridors don&apos;t collapse all at once. They reroute, one quiet instruction at a time, until the map no longer matches the territory and the territory no longer matches the ledger.</p><p>Somewhere between the authorization layer and the settlement window, a small set of rules was rewritten to look like the rules that were already there. The surface area is planetary.</p><p className="italic text-signal">You will not see it coming. You are not supposed to.</p></div></div>
      </main>
    </>
  );
}

function ExcerptPage() {
  return (
    <>
      <PageIntro label="EXHIBIT A" title="OPENING TRANSMISSION">The first detail is always the one nobody thought to hide.</PageIntro>
      <main className="mx-auto max-w-4xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="relative border border-ink-muted bg-[#1a1813] p-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#28251c]/40 to-[#14130f]/60" />
          <div className="absolute right-5 top-5 rotate-[-6deg] border border-signal/60 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-signal">EYES ONLY</div>
          <div className="relative mb-8 flex items-center gap-3 border-b border-[#3a352a] pb-5"><FileText size={17} className="text-signal" /><span className="font-mono text-[11px] uppercase tracking-[0.24em] text-bright-muted">SCANNED_DOCUMENT // INTACT</span></div>
          <pre className="relative whitespace-pre-wrap font-mono text-[15px] leading-[1.95] text-[#eee8d8]">{EXCERPT}</pre>
          <div className="relative mt-10 border-t border-[#3a352a] pt-5"><p className="font-mono text-[12px] uppercase tracking-[0.18em] text-signal">[ REMAINDER OF FILE REDACTED — CONTINUE READING IN THE FULL BOOK ]</p></div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-5 border-t border-ink-line pt-6"><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-bright-faint">TRANSMISSION 001 // END</p><a href="#/buy" className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.18em] text-signal hover:text-signal-glow">ACQUIRE THE FILE <span className="inline-flex"><ArrowRight size={15} /></span></a></div>
      </main>
    </>
  );
}

type Player = { name: string; role: string; variant: 'human' | 'system' | 'classified'; note?: string };
const PLAYERS: Player[] = [
  { name: 'SUNITA VERMA', role: 'Forensic Analyst. Disgraced. Dormant credentials, live consequences.', variant: 'human', note: 'BIO PENDING // AUTHOR TO ADD 2–3 SENTENCES' },
  { name: 'GAURAV MISHRA', role: 'Investigator. Recurring across the series.', variant: 'human', note: 'CROSS-REFERENCE: PROTAGONIST OF BOOK ONE' },
  { name: 'ZERO', role: "Not a person. A system. And it's using her own work against her.", variant: 'system', note: 'NO_PERSON_RECORD :: SYSTEM_ENTITY' },
  { name: '[ CLASSIFIED — PLAYER PENDING ]', role: 'Fourth player slot held for a future reveal.', variant: 'classified', note: 'SLOT RESERVED — AWAITING DECLASSIFICATION' },
];

function PlayerCard({ player }: { player: Player }) {
  const system = player.variant === 'system';
  const classified = player.variant === 'classified';
  return <article className={`min-h-[245px] border p-6 ${system ? 'border-signal/60 bg-ink-card scan-texture' : classified ? 'border-dashed border-ink-muted bg-ink-base' : 'border-ink-line bg-ink-card hover:border-signal/60'} transition-colors`}>
    <div className="mb-5 flex items-center gap-3">{system ? <ScanLine size={18} className="text-signal" /> : classified ? <Lock size={18} className="text-bright-muted" /> : <Fingerprint size={18} className="text-signal" />}<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-bright-faint">{system ? 'SYSTEM_ENTITY' : classified ? 'FILE_SLOT' : 'PERSON_OF_INTEREST'}</span></div>
    <h2 className={`font-mono text-xl font-bold tracking-tight ${system ? 'text-signal animate-flicker' : classified ? 'text-bright-muted' : 'text-bright'}`}>{player.name}</h2>
    <RuleLine className="my-5" />
    <p className="font-serif text-lg leading-relaxed text-bright-muted">{player.role}</p>
    <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-bright-faint">// {player.note}</p>
  </article>;
}

function PlayersPage() {
  return <><PageIntro label="THE PLAYERS" title="EVERYONE HAS A CLEARANCE LEVEL">Three identities. One pending file. The system is the only one that never has to explain itself.</PageIntro><main className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><div className="mb-10 flex items-end justify-between"><div><CaseLabel className="mb-4 block">PERSONS OF INTEREST // DOSSIER</CaseLabel><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-bright-muted">// READ THE NAMES. THEN READ BETWEEN THEM.</p></div><Folder className="hidden text-signal sm:block" size={28} /></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{PLAYERS.map((player) => <PlayerCard key={player.name} player={player} />)}</div></main></>;
}

function BookOnePage() {
  return <><PageIntro label="CROSS-REFERENCE" title="BOOK ONE — SHADOW CODE">Before Zero Account, there was a different kind of breach. Gaurav Mishra was already inside.</PageIntro><main className="mx-auto max-w-5xl px-5 py-20 lg:px-8 lg:py-28"><a href="https://the-shadow-code.com" target="_blank" rel="noopener noreferrer" className="group block border border-ink-line bg-ink-card p-8 hover:border-signal/70 transition-colors sm:p-12"><div className="flex items-start justify-between gap-6"><div><CaseLabel className="mb-5 block">BOOK ONE // THE GAURAV MISHRA SERIES</CaseLabel><h2 className="font-mono text-4xl font-bold tracking-tight text-bright sm:text-6xl">SHADOW CODE</h2><p className="mt-6 max-w-2xl font-serif text-2xl leading-relaxed text-bright-muted">The case that came before. Gaurav Mishra walks into the dark, and the dark remembers his name.</p></div><ExternalLink className="shrink-0 text-signal" size={26} /></div><div className="mt-10 inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.18em] text-signal">OPEN THE SHADOW CODE FILE <span className="inline-flex"><ArrowRight size={15} /></span></div></a><div className="mt-8 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.18em] text-bright-faint"><span className="inline-flex"><ArrowLeft size={14} /></span> RETURN TO THE SERIES INDEX</div></main></>;
}

function AuthorPage() {
  return <><PageIntro label="THE AUTHOR" title="THE HAND BEHIND THE FILE">The systems are fictional. The mechanisms are not.</PageIntro><main className="mx-auto max-w-5xl px-5 py-20 lg:px-8 lg:py-28"><div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]"><div className="flex min-h-[220px] items-center justify-center bg-[#f8f5ef] p-6 sm:p-10"><img src="/authorgaurav-logo.png" alt="Gaurav Mishra author logo" className="max-h-[260px] w-full object-contain" /></div><div><CaseLabel className="mb-5 block">AUTHOR PROFILE // GM-001</CaseLabel><h2 className="font-mono text-3xl font-bold text-bright sm:text-4xl">GAURAV MISHRA</h2><RuleLine className="my-7" /><p className="font-serif text-2xl leading-relaxed text-bright">Gaurav Mishra writes financial-crime thrillers grounded in how modern fraud actually works.</p><p className="mt-6 font-serif text-lg leading-relaxed text-bright-muted">The Gaurav Mishra Series follows one investigator across connected cases, each one a deeper cut into the systems that move money and the people who learn to bend them.</p><a href="https://authorgaurav.com" target="_blank" rel="noopener noreferrer" className="mt-9 inline-flex items-center gap-2 border border-signal px-5 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-signal hover:bg-signal hover:text-ink-base transition-colors">MORE BY GAURAV MISHRA <span className="inline-flex"><ExternalLink size={15} /></span></a></div></div></main></>;
}

const RETAILERS = ['AMAZON', 'KINDLE', 'FLIPKART', 'NOTIONPRESS', 'GOODREADS'];

function ClearanceRequest() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabaseReady) { setStatus('error'); setMessage('BACKEND OFFLINE // TRY AGAIN LATER'); return; }
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || trimmed.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setStatus('error'); setMessage('INVALID_ADDRESS // CHECK INPUT'); return; }
    setStatus('loading');
    const result = await submitClearanceRequest(trimmed);
    if (result.ok) { setStatus('done'); return; }
    setStatus('error');
    setMessage(result.reason === 'rate_limited' ? 'TOO MANY REQUESTS // STAND BY AND RETRY LATER' : result.reason === 'invalid_email' ? 'INVALID_ADDRESS // CHECK INPUT' : 'TRANSMISSION FAILED // TRY AGAIN');
  }
  if (status === 'done') return <div className="border border-signal/60 bg-ink-card p-6"><p className="font-mono text-sm uppercase tracking-[0.16em] text-signal">CLEARANCE GRANTED // YOU WILL BE NOTIFIED //</p></div>;
  return <form onSubmit={submit} className="border border-ink-line bg-ink-card p-6"><div className="flex flex-col gap-3 sm:flex-row"><label htmlFor="email" className="sr-only">Email address</label><div className="flex flex-1 items-center border border-ink-muted bg-ink-base px-3 focus-within:border-signal"><span className="mr-2 font-mono text-signal">&gt;</span><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="agent@address.tld" className="w-full bg-transparent py-3 font-mono text-sm text-bright outline-none placeholder:text-bright-faint" /></div><button disabled={status === 'loading'} className="inline-flex items-center justify-center gap-2 bg-signal px-5 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-base hover:bg-signal-glow disabled:opacity-60">{status === 'loading' ? 'TRANSMITTING…' : 'REQUEST CLEARANCE'} <span className="inline-flex"><Send size={15} /></span></button></div>{status === 'error' && <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-red-300">{message}</p>}</form>;
}

function BuyPage() {
  return <><PageIntro label="BUY NOW" title="ACQUIRE THE FILE">The truth is expensive. The book costs less.</PageIntro><main className="mx-auto max-w-5xl px-5 py-20 lg:px-8 lg:py-28"><div className="grid gap-16 lg:grid-cols-[1fr_0.8fr]"><div><CaseLabel className="mb-5 block">RETAIL ACCESS // SELECT CHANNEL</CaseLabel><div className="grid gap-4 sm:grid-cols-2">{RETAILERS.map((retailer) => <a key={retailer} href="#" data-todo="insert real purchase link" className="group flex items-center justify-between border border-signal/60 px-5 py-4 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-signal hover:bg-signal hover:text-ink-base transition-colors">{retailer}<span className="inline-flex"><ArrowRight size={15} /></span></a>)}</div><p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-bright-faint">// RELEASE_WINDOW: MID-SEPTEMBER 2026 — LINKS ACTIVATE AT LAUNCH</p></div><div><CaseLabel className="mb-5 block">&gt; REQUEST_CLEARANCE ::</CaseLabel><h2 className="font-mono text-2xl font-bold text-bright">GET THE SAMPLE CHAPTER FIRST</h2><p className="mt-3 mb-7 font-mono text-[11px] uppercase tracking-[0.16em] text-bright-muted">// OPENING TRANSMISSION SENT INSTANTLY TO YOUR INBOX</p><ClearanceRequest /></div></div></main></>;
}

function Footer() {
  return <footer className="border-t border-ink-line bg-ink-base"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-9 sm:flex-row lg:px-8"><p className="font-mono text-[11px] text-bright-faint">© {new Date().getFullYear()} Gaurav Mishra. All rights reserved.</p><div className="flex flex-wrap justify-center gap-5 font-mono text-[11px] uppercase tracking-[0.16em]"><a href="https://authorgaurav.com" target="_blank" rel="noopener noreferrer" className="text-bright-muted hover:text-signal">AUTHORGAURAV.COM</a><a href="https://the-shadow-code.com" target="_blank" rel="noopener noreferrer" className="text-bright-muted hover:text-signal">THE-SHADOW-CODE.COM</a></div></div></footer>;
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
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-signal">// TRANSMISSION ERROR</p>
            <p className="mt-4 font-mono text-sm text-bright-muted">SIGNAL LOST. RETURN TO BASE.</p>
            <a href="#/" className="mt-6 inline-flex items-center gap-2 border border-signal px-5 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-signal hover:bg-signal hover:text-ink-base transition-colors">RETURN HOME</a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const path = useHashPath();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [path]);
  const page = path === '/file' ? <FilePage /> : path === '/excerpt' ? <ExcerptPage /> : path === '/players' ? <PlayersPage /> : path === '/book-one' ? <BookOnePage /> : path === '/author' ? <AuthorPage /> : path === '/buy' ? <BuyPage /> : <HomePage />;
  return <div className="scanlines vignette min-h-screen bg-ink-base text-bright"><Nav /><main><RouteErrorBoundary routeKey={path}>{page}</RouteErrorBoundary></main><Footer /></div>;
}

export default App;
