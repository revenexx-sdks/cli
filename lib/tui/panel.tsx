/**
 * A bordered pane whose title sits in the top border and whose footer sits in
 * the bottom border — the DX-118 concept-mockup look. Ink has no native
 * border-title support, so the top and bottom border rows are drawn by hand
 * (with the corners) and Ink draws only the left/right sides of the content
 * box between them. That means the panel needs an explicit `width` so the
 * hand-drawn corners line up with Ink's side borders.
 */
import type { ReactNode } from "react";
import { Box, Text } from "ink";
import { theme, gradientColors } from "./theme.js";

/** Display width for our controlled title/footer strings — every glyph we use
 * (ASCII plus ·, ›, ‹, ▌, ▸) is a single cell. */
const displayWidth = (text: string): number => [...text].length;

/** One border segment: either drawn in the theme gradient (the frame edges) or
 * a fixed colour (the embedded title/footer text). */
export type BorderSeg = {
  text: string;
  color?: string;
  bold?: boolean;
  dim?: boolean;
  gradient?: boolean;
};

/** Render a full-width row of segments: `gradient` segments fade each cell
 * through the theme's gradient (by absolute column, so it's continuous across
 * the whole width), other segments keep their fixed colour. Adjacent same-style
 * cells coalesce into one <Text> to keep the node count down; colour-off
 * terminals just render the characters. Exported so other rules (e.g. the nav's
 * section headers) can share the same gradient. */
export const borderRow = (segments: BorderSeg[], width: number): ReactNode => {
  const colors = gradientColors(width);
  const runs: { color?: string; bold: boolean; dim: boolean; text: string }[] =
    [];
  let pos = 0;
  for (const seg of segments) {
    for (const ch of [...seg.text]) {
      const color = seg.gradient
        ? colors[Math.min(pos, colors.length - 1)]
        : seg.color;
      const bold = seg.bold ?? false;
      const dim = seg.dim ?? false;
      const last = runs[runs.length - 1];
      if (
        last !== undefined &&
        last.color === color &&
        last.bold === bold &&
        last.dim === dim
      ) {
        last.text += ch;
      } else {
        runs.push({ color, bold, dim, text: ch });
      }
      pos += 1;
    }
  }
  return runs.map((run, index) => (
    <Text key={index} color={run.color} bold={run.bold} dimColor={run.dim}>
      {run.text}
    </Text>
  ));
};

export const Panel = ({
  title,
  titleColor,
  footer,
  footerColor,
  focused = false,
  width,
  grow = false,
  flush = false,
  children,
}: {
  /** Rendered into the top border. */
  title?: string;
  /** Colour for the title text (defaults to the theme accent; focus adds bold). */
  titleColor?: string;
  /** Right-aligned into the bottom border. */
  footer?: string;
  /** Colour for the footer text (defaults to dim). */
  footerColor?: string;
  focused?: boolean;
  /** Total outer width in cells — corners align to Ink's side borders. */
  width: number;
  /** Fill the remaining main-axis space of the parent (e.g. a column sidebar).
   * Panes laid out in a row already stretch to full height via align; this is
   * for panels stacked in a column that should still reach full height. */
  grow?: boolean;
  /** Drop the inner horizontal padding so children reach the side borders —
   * needed for a gapless background fill. */
  flush?: boolean;
  children: ReactNode;
}) => {
  // Each vertical side (and its two corners) takes the gradient's value at that
  // edge — left = the gradient's first stop, right = its last — so a side meets
  // the horizontal fade it touches with the same colour. Only the top/bottom
  // dashes gradient across; the verticals are a single, edge-matched colour
  // (Ink draws each border side in one colour). gradientColors(2) yields
  // exactly [firstStop, lastStop].
  const w = Math.max(width, 6);
  const [gradStart, gradEnd] = gradientColors(2);

  const top =
    title === undefined || title === "" ? (
      <Text wrap="truncate">
        {borderRow(
          [
            { text: "╭", color: gradStart },
            { text: "─".repeat(w - 2), gradient: true },
            { text: "╮", color: gradEnd },
          ],
          w,
        )}
      </Text>
    ) : (
      <Text wrap="truncate">
        {borderRow(
          [
            { text: "╭", color: gradStart },
            { text: "─ ", gradient: true },
            {
              // Titles are always the accent so every pane header matches
              // (browse, welcome, results, …); focus is shown by weight, not
              // colour. A caller may still override with an explicit titleColor.
              text: title,
              color: titleColor ?? theme.accent,
              bold: focused,
            },
            { text: " " },
            {
              text: "─".repeat(Math.max(w - 5 - displayWidth(title), 0)),
              gradient: true,
            },
            { text: "╮", color: gradEnd },
          ],
          w,
        )}
      </Text>
    );

  const bottom =
    footer === undefined || footer === "" ? (
      <Text wrap="truncate">
        {borderRow(
          [
            { text: "╰", color: gradStart },
            { text: "─".repeat(w - 2), gradient: true },
            { text: "╯", color: gradEnd },
          ],
          w,
        )}
      </Text>
    ) : (
      <Text wrap="truncate">
        {borderRow(
          [
            { text: "╰", color: gradStart },
            {
              text: `${"─".repeat(Math.max(w - 5 - displayWidth(footer), 0))} `,
              gradient: true,
            },
            {
              text: footer,
              color: footerColor,
              dim: footerColor === undefined,
              bold: footerColor !== undefined,
            },
            { text: " ─", gradient: true },
            { text: "╯", color: gradEnd },
          ],
          w,
        )}
      </Text>
    );

  return (
    <Box
      flexDirection="column"
      width={w}
      flexShrink={0}
      flexGrow={grow ? 1 : undefined}
    >
      {top}
      <Box
        borderStyle="round"
        borderLeftColor={gradStart}
        borderRightColor={gradEnd}
        borderTop={false}
        borderBottom={false}
        flexDirection="column"
        flexGrow={1}
        paddingX={flush ? 0 : 1}
      >
        {children}
      </Box>
      {bottom}
    </Box>
  );
};

/**
 * A one-row "pill" button matching the concept: `primary` is brand purple,
 * `danger` is red, `default` is a muted grey.
 *
 * `focused` makes the pill focus-aware for keyboard navigation: the focused
 * button is a filled pill with a `»` marker; an unfocused one is a dim ghost.
 * Omit `focused` for a static, always-filled pill (e.g. the confirm modal,
 * whose keys `y`/`n` drive it directly).
 */
export const Button = ({
  label,
  variant = "default",
  focused,
}: {
  label: string;
  variant?: "default" | "primary" | "danger";
  focused?: boolean;
}) => {
  const bg =
    variant === "primary"
      ? theme.selectionBg
      : variant === "danger"
        ? theme.danger
        : theme.muted;
  const fg = variant === "default" ? "#d7dde8" : "#ffffff";
  if (focused === false) {
    // Ghost: a navigable-but-unfocused button. Leading spaces match the
    // focused marker's width so focus never shifts the row.
    return <Text color={bg}>{`  ${label} `}</Text>;
  }
  return (
    <Text
      backgroundColor={bg}
      color={fg}
      bold={focused === true || variant !== "default"}
    >
      {`${focused === true ? "» " : " "}${label} `}
    </Text>
  );
};
