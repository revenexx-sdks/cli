/**
 * Central TUI palette and small presentational helpers (DX-118), aligned to the
 * Revenexx brand (purple #620DFF + yellow #FFF200). Colours are truecolor hex;
 * ink routes them through chalk, so terminals without 24-bit colour get the
 * nearest ansi256/16 and colour-off environments (CI, NO_COLOR/--no-color, the
 * test runner) drop them entirely — the layout and text stay intact either way.
 *
 * Brand tokens are tuned for a dark terminal: the accent is purple-3 (#A090E0,
 * 7.56:1 on black / WCAG AAA) rather than the too-dark brand primary (#620DFF,
 * 3.02:1), which is kept only as the bold wordmark's first gradient stop. warn
 * is brand yellow. `success` (green) and `danger` (red) are *functional* — the
 * brand defines neither, and they are the universal terminal conventions for
 * enabled/error (brand yellow-for-enabled would read as a warning).
 *
 * Only *accents* commit to the palette. Body and secondary text stay
 * terminal-native (default colour / `dimColor`) so the UI reads on any
 * background.
 */
import { useEffect, useRef, useState } from "react";

/** The token set every theme defines. Only *accents* commit to the palette;
 * body text stays terminal-native, so themes really only need these. */
export interface Theme {
  /** Registry key, e.g. "revenexx". */
  name: string;
  /** Structural tint — the gradient wordmark's mid stop. */
  brand: string;
  /** The chrome accent: every border, keys, selection markers, focused
   * titles, the `/` palette prompt. Tuned to read on `surface`. */
  accent: string;
  /** Enabled / true / created — functional green. */
  success: string;
  /** PRODUCTION banner and highlighted values. */
  warn: string;
  /** Destructive actions and errors — functional red. */
  danger: string;
  /** Selected-row / focused-button bar background + its text. */
  selectionBg: string;
  selectionFg: string;
  /** Secondary (default) button pill. */
  muted: string;
  /** Whole-pane fill + the OSC-11 terminal background. */
  surface: string;
  /** Text that reads on `surface`. */
  onSurface: string;
  /** Wordmark gradient stops (left → right), as [r,g,b]. */
  gradient: readonly (readonly [number, number, number])[];
}

/**
 * The built-in palettes. `revenexx` is the brand default; the rest are
 * popular, recognisable terminal themes so the UI can match a user's setup.
 * Accents are chosen to read on each theme's `surface`.
 */
export const THEMES: Record<string, Theme> = {
  revenexx: {
    name: "revenexx",
    brand: "#8977cd",
    accent: "#a090e0",
    success: "#86d97c",
    warn: "#fde549",
    danger: "#ff6a55",
    selectionBg: "#5b18c6",
    selectionFg: "#ffffff",
    muted: "#3b364c",
    surface: "#17122a",
    onSurface: "#d7dde8",
    gradient: [
      [0x62, 0x0d, 0xff],
      [0x89, 0x77, 0xcd],
      [0xa0, 0x90, 0xe0],
    ],
  },
  dark: {
    name: "dark",
    brand: "#79c0ff",
    accent: "#58a6ff",
    success: "#3fb950",
    warn: "#d29922",
    danger: "#f85149",
    selectionBg: "#1f6feb",
    selectionFg: "#ffffff",
    muted: "#30363d",
    surface: "#0d1117",
    onSurface: "#c9d1d9",
    gradient: [
      [0x58, 0xa6, 0xff],
      [0x79, 0xc0, 0xff],
      [0xa5, 0xd6, 0xff],
    ],
  },
  light: {
    name: "light",
    brand: "#8250df",
    accent: "#0969da",
    success: "#1a7f37",
    warn: "#9a6700",
    danger: "#cf222e",
    selectionBg: "#0969da",
    selectionFg: "#ffffff",
    muted: "#d0d7de",
    surface: "#ffffff",
    onSurface: "#24292f",
    // Darker stops than the dark themes use: a light-purple wordmark would
    // wash out on a white surface.
    gradient: [
      [0x82, 0x50, 0xdf],
      [0x6e, 0x40, 0xc9],
      [0x51, 0x2a, 0x9c],
    ],
  },
  dracula: {
    name: "dracula",
    brand: "#ff79c6",
    accent: "#bd93f9",
    success: "#50fa7b",
    warn: "#f1fa8c",
    danger: "#ff5555",
    selectionBg: "#44475a",
    selectionFg: "#f8f8f2",
    muted: "#6272a4",
    surface: "#282a36",
    onSurface: "#f8f8f2",
    gradient: [
      [0xbd, 0x93, 0xf9],
      [0xff, 0x79, 0xc6],
      [0x8b, 0xe9, 0xfd],
    ],
  },
  nord: {
    name: "nord",
    brand: "#81a1c1",
    accent: "#88c0d0",
    success: "#a3be8c",
    warn: "#ebcb8b",
    danger: "#bf616a",
    selectionBg: "#434c5e",
    selectionFg: "#eceff4",
    muted: "#4c566a",
    surface: "#2e3440",
    onSurface: "#d8dee9",
    gradient: [
      [0x81, 0xa1, 0xc1],
      [0x88, 0xc0, 0xd0],
      [0x8f, 0xbc, 0xbb],
    ],
  },
  "solarized-dark": {
    name: "solarized-dark",
    brand: "#6c71c4",
    accent: "#268bd2",
    success: "#859900",
    warn: "#b58900",
    danger: "#dc322f",
    selectionBg: "#073642",
    selectionFg: "#eee8d5",
    muted: "#586e75",
    surface: "#002b36",
    onSurface: "#93a1a1",
    gradient: [
      [0x6c, 0x71, 0xc4],
      [0x26, 0x8b, 0xd2],
      [0x2a, 0xa1, 0x98],
    ],
  },
  "solarized-light": {
    name: "solarized-light",
    brand: "#6c71c4",
    accent: "#268bd2",
    success: "#859900",
    warn: "#b58900",
    danger: "#dc322f",
    selectionBg: "#268bd2",
    selectionFg: "#fdf6e3",
    muted: "#93a1a1",
    surface: "#fdf6e3",
    onSurface: "#586e75",
    gradient: [
      [0x6c, 0x71, 0xc4],
      [0x26, 0x8b, 0xd2],
      [0x2a, 0xa1, 0x98],
    ],
  },
  gruvbox: {
    name: "gruvbox",
    brand: "#d3869b",
    accent: "#83a598",
    success: "#b8bb26",
    warn: "#fabd2f",
    danger: "#fb4934",
    selectionBg: "#504945",
    selectionFg: "#ebdbb2",
    muted: "#928374",
    surface: "#282828",
    onSurface: "#ebdbb2",
    gradient: [
      [0xd3, 0x86, 0x9b],
      [0xfa, 0xbd, 0x2f],
      [0x8e, 0xc0, 0x7c],
    ],
  },
  monokai: {
    name: "monokai",
    brand: "#ae81ff",
    accent: "#66d9ef",
    success: "#a6e22e",
    warn: "#e6db74",
    danger: "#f92672",
    selectionBg: "#49483e",
    selectionFg: "#f8f8f2",
    muted: "#75715e",
    surface: "#272822",
    onSurface: "#f8f8f2",
    gradient: [
      [0xae, 0x81, 0xff],
      [0x66, 0xd9, 0xef],
      [0xa6, 0xe2, 0x2e],
    ],
  },
  "one-dark": {
    name: "one-dark",
    brand: "#c678dd",
    accent: "#61afef",
    success: "#98c379",
    warn: "#e5c07b",
    danger: "#e06c75",
    selectionBg: "#3e4451",
    selectionFg: "#ffffff",
    muted: "#5c6370",
    surface: "#282c34",
    onSurface: "#abb2bf",
    gradient: [
      [0xc6, 0x78, 0xdd],
      [0x61, 0xaf, 0xef],
      [0x56, 0xb6, 0xc2],
    ],
  },
  matrix: {
    name: "matrix",
    brand: "#00a32a",
    // Strong green body text (onSurface) with an even brighter neon accent for
    // borders/keys. Danger stays red — a destructive action must break the
    // monochrome.
    accent: "#00ff41",
    success: "#7dff9e",
    warn: "#c6ff33",
    danger: "#ff4d4d",
    selectionBg: "#0b6b25",
    selectionFg: "#d6ffd6",
    muted: "#1a3d24",
    surface: "#000000",
    onSurface: "#2bff5e",
    gradient: [
      [0x00, 0x66, 0x11],
      [0x00, 0xb3, 0x2a],
      [0x00, 0xff, 0x41],
    ],
  },
};

/** All theme keys, in registry order (revenexx first). */
export const THEME_NAMES = Object.keys(THEMES);
export const DEFAULT_THEME = "revenexx";
export const isTheme = (name: string | undefined): name is string =>
  name !== undefined && name in THEMES;

/**
 * The *active* palette. It's a single mutable object (not `as const`) that
 * every component reads as `theme.accent` etc. `applyTheme` mutates it in
 * place with Object.assign, so all existing references stay valid and simply
 * render the new colours on the next React render — no context plumbing.
 */
export const theme: Theme = { ...THEMES[DEFAULT_THEME] };

/** Switch the active palette. Unknown names fall back to the default. */
export const applyTheme = (name: string | undefined): void => {
  Object.assign(theme, THEMES[isTheme(name) ? name : DEFAULT_THEME]);
};

/**
 * OSC sequences that set the terminal's default *background* (OSC 11) AND
 * *foreground* (OSC 10) to the active theme. Both are needed: body text is
 * terminal-native (it renders in the terminal's default fg), so setting only
 * the background — as an earlier version did — leaves light-on-light and dark
 * text unreadable on light themes. Honoured by terminals like Ghostty and
 * iTerm2; silently ignored elsewhere (where the theme's accents still apply
 * but the canvas stays terminal-native). No leading '#', as OSC expects.
 */
export const themeTerminalColors = (): string =>
  `\x1b]10;#${theme.onSurface.replace(/^#/, "")}\x07` +
  `\x1b]11;#${theme.surface.replace(/^#/, "")}\x07`;

/** Reset the terminal's default foreground (OSC 110) and background (OSC 111)
 * to its own configured colours — used on exit. */
export const THEME_TERMINAL_RESET = "\x1b]110\x07\x1b]111\x07";

const hex = (channel: number): string =>
  Math.round(channel).toString(16).padStart(2, "0");

/**
 * Per-character hex colours interpolating the brand gradient across `length`
 * cells. Rendering each glyph in its own <Text> lets chalk downgrade/strip the
 * colour per the terminal — the characters themselves are unaffected, so the
 * wordmark stays a contiguous substring when colour is off.
 */
export const gradientColors = (length: number): string[] => {
  const stops = theme.gradient;
  if (length <= 0) return [];
  if (length === 1) return [`#${hex(stops[0][0])}${hex(stops[0][1])}${hex(stops[0][2])}`];
  const spans = stops.length - 1;
  return Array.from({ length }, (_, index) => {
    const t = (index / (length - 1)) * spans;
    const lo = Math.min(Math.floor(t), spans - 1);
    const frac = t - lo;
    const [r1, g1, b1] = stops[lo];
    const [r2, g2, b2] = stops[lo + 1];
    return `#${hex(r1 + (r2 - r1) * frac)}${hex(g1 + (g2 - g1) * frac)}${hex(
      b1 + (b2 - b1) * frac,
    )}`;
  });
};

/** Mix a `#rrggbb` colour toward white by `amount` (0..1). Used by the konami
 * shimmer to brighten the sweep head without leaving the brand hues. */
export const brighten = (color: string, amount: number): string => {
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  if (match === null) return color;
  const t = Math.min(Math.max(amount, 0), 1);
  const mix = (channel: number): number => channel + (255 - channel) * t;
  const [r, g, b] = [match[1], match[2], match[3]].map((h) => parseInt(h, 16));
  return `#${hex(mix(r))}${hex(mix(g))}${hex(mix(b))}`;
};

/** Reduced-motion opt-out: honour a dedicated env var plus the common
 * "keep it plain" signals. When set, spinners freeze to a static glyph and the
 * shimmer/egg animations don't run — kinder to vestibular sensitivity and to
 * screen readers (a spinner re-rendering every 80ms is re-announced). */
export const MOTION_DISABLED =
  !!process.env.REVENEXX_NO_ANIM ||
  process.env.NO_COLOR !== undefined ||
  process.env.TERM === "dumb";

/** Sweeping shimmer phase for the wordmark easter egg (konami code): a comet
 * head that travels across the glyphs then pauses, advancing only while
 * `active`. Returns 0 when off (or motion-disabled), so the wordmark renders
 * its plain gradient. */
export const useShimmer = (active: boolean, intervalMs = 90): number => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!active || MOTION_DISABLED) {
      setPhase(0);
      return;
    }
    const timer = setInterval(() => setPhase((current) => current + 1), intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs]);
  return MOTION_DISABLED ? 0 : phase;
};

/** Braille spinner used for in-flight requests. */
export const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/** The current spinner glyph, advancing while `active`. Shared so the status
 * bar and the results pane animate in lock-step. Freezes to a static `…` when
 * motion is disabled. */
export const useSpinner = (active = true, intervalMs = 80): string => {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!active || MOTION_DISABLED) return;
    const timer = setInterval(
      () => setFrame((current) => current + 1),
      intervalMs,
    );
    return () => clearInterval(timer);
  }, [active, intervalMs]);
  return MOTION_DISABLED ? "…" : SPINNER_FRAMES[frame % SPINNER_FRAMES.length];
};

/** Live diagnostics for the hidden `debug` mode: render rate, average paint
 * interval and process memory, sampled once a second. Counts every render of
 * the component that calls it — the App, so it sees the whole tree. The TUI has
 * no frame loop (it repaints on state change), so `fps` reads ~0 at rest and
 * jumps while the spinner/shimmer timers run; `frameMs` is the mean gap between
 * those paints within the last second. Adds exactly one render/sec of its own
 * while active; runs no timer and returns zeroes when off. Not motion-gated:
 * these are readouts, not animation. */
export type DebugStats = {
  /** Renders in the last second (see note above: not a fixed frame loop). */
  fps: number;
  /** Mean ms between paints over the last second (0 when idle). */
  frameMs: number;
  /** Resident set size in MB. */
  rssMb: number;
};

export const useDebugStats = (active: boolean): DebugStats => {
  const renders = useRef(0);
  const gaps = useRef(0);
  const gapCount = useRef(0);
  const lastTs = useRef(0);
  const [stats, setStats] = useState<DebugStats>({
    fps: 0,
    frameMs: 0,
    rssMb: 0,
  });
  if (active) {
    const now = Date.now();
    if (lastTs.current !== 0) {
      gaps.current += now - lastTs.current;
      gapCount.current += 1;
    }
    lastTs.current = now;
    renders.current += 1;
  }
  useEffect(() => {
    if (!active) {
      renders.current = 0;
      gaps.current = 0;
      gapCount.current = 0;
      lastTs.current = 0;
      setStats({ fps: 0, frameMs: 0, rssMb: 0 });
      return undefined;
    }
    const timer = setInterval(() => {
      setStats({
        fps: renders.current,
        frameMs:
          gapCount.current > 0
            ? Math.round(gaps.current / gapCount.current)
            : 0,
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      });
      renders.current = 0;
      gaps.current = 0;
      gapCount.current = 0;
    }, 1000);
    return () => clearInterval(timer);
  }, [active]);
  return stats;
};

/** A leading status dot marking a *runnable* command, coloured by its HTTP
 * verb: reads purple (accent), writes amber, deletes red. Service groups are containers,
 * not commands — they get no dot (empty glyph → a plain indent), keeping the
 * root service list clean. The dot sits in a fixed 2-cell column in the navbar,
 * so its render width doesn't disturb the gapless background fill. */
export const commandGlyph = (
  method: string | undefined,
  isGroup: boolean,
): { glyph: string; color?: string; dim?: boolean } => {
  if (isGroup) return { glyph: "" };
  switch (method) {
    case "get":
      return { glyph: "•", color: theme.accent };
    case "delete":
      return { glyph: "•", color: theme.danger };
    case "post":
    case "put":
    case "patch":
      return { glyph: "•", color: theme.warn };
    default:
      return { glyph: "•", dim: true };
  }
};

/** Filled/empty cell counts for a `[████░░░░]` progress bar of `width` cells at
 * `ratio` (clamped to 0..1). */
export const progressBar = (
  ratio: number,
  width: number,
): { filled: number; empty: number } => {
  const clamped = Math.min(Math.max(ratio, 0), 1);
  const total = Math.max(width, 0);
  const filled = Math.round(clamped * total);
  return { filled, empty: total - filled };
};
