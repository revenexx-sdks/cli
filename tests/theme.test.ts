import { describe, it, expect, afterEach } from "vitest";
import {
  THEMES,
  THEME_NAMES,
  theme,
  applyTheme,
  isTheme,
  DEFAULT_THEME,
} from "../lib/tui/theme.js";

// The active palette is a shared mutable object; keep tests isolated.
afterEach(() => applyTheme(DEFAULT_THEME));

const TOKENS = [
  "brand",
  "accent",
  "success",
  "warn",
  "danger",
  "selectionBg",
  "selectionFg",
  "muted",
  "surface",
  "onSurface",
] as const;

describe("theme registry", () => {
  it("ships the popular themes, with revenexx first", () => {
    expect(THEME_NAMES[0]).toBe("revenexx");
    for (const name of [
      "dark",
      "light",
      "dracula",
      "nord",
      "solarized-dark",
      "solarized-light",
      "gruvbox",
      "monokai",
      "one-dark",
      "matrix",
    ]) {
      expect(THEME_NAMES).toContain(name);
    }
  });

  it("every theme defines the full token set as hex colours", () => {
    for (const [name, palette] of Object.entries(THEMES)) {
      expect(palette.name).toBe(name);
      for (const token of TOKENS) {
        expect(palette[token], `${name}.${token}`).toMatch(/^#[0-9a-f]{6}$/i);
      }
      expect(palette.gradient.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("applyTheme swaps the active palette in place; unknown names fall back", () => {
    applyTheme("dracula");
    expect(theme.name).toBe("dracula");
    expect(theme.accent).toBe(THEMES.dracula.accent);
    expect(theme.surface).toBe(THEMES.dracula.surface);

    applyTheme("nonesuch");
    expect(theme.name).toBe(DEFAULT_THEME);
  });

  it("isTheme guards names", () => {
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("nonesuch")).toBe(false);
    expect(isTheme(undefined)).toBe(false);
  });
});
