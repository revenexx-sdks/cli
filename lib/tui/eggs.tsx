/**
 * Easter eggs (DX-118). Purely presentational and interactive-only: they live
 * behind the `/` palette and the konami code, never touch the executor, never
 * hit the gateway, and only ever render inside the full-screen TUI (the
 * non-TTY / --json paths that the output-contract tests exercise never mount
 * this). Type a magic word into the filter and its panel takes over the detail
 * pane; the command list stays empty behind it. Nothing here is load-bearing —
 * deleting the file (and its import) leaves the TUI fully functional.
 */
import { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Panel } from "./panel.js";
import { theme, useSpinner, progressBar, MOTION_DISABLED } from "./theme.js";

export type Egg = {
  /** Filter queries that trigger the egg (normalised: trimmed, lower-cased,
   * inner whitespace collapsed). */
  keys: string[];
  title: string;
  /** Optional theatre before the payload: a spinner or a filling bar. */
  animate?: "spinner" | "bar";
  /** Lines shown immediately (and during the animation). */
  busy: string[];
  /** Lines shown once the animation finishes (ignored when not animated). */
  done?: string[];
};

// Content is deliberately ASCII / single-cell only: the Panel hand-draws its
// borders and pads each row to a fixed width assuming one cell per glyph (see
// panel.tsx), so a double-width emoji would shift that row's right border.
const EGGS: Egg[] = [
  {
    keys: ["coffee", "brew", "espresso"],
    title: "barista",
    animate: "spinner",
    busy: ["brewing a fresh cup..."],
    done: ["coffee's ready.", "(this CLI still can't actually make coffee.)"],
  },
  {
    keys: ["loading", "load", "wait", "please wait"],
    title: "loading",
    animate: "bar",
    busy: ["reticulating splines..."],
    done: ["done - of absolutely nothing.", "carry on."],
  },
  {
    keys: ["rm -rf", "rm -rf /", "rm -rf ~", "rm -rf *", "format c:"],
    title: "danger",
    animate: "bar",
    busy: ["deleting everything you love..."],
    done: ["...just kidding.", "your data is exactly where you left it."],
  },
  {
    keys: ["shutdown", "poweroff", "halt", "shutdown -h now", "shutdown now"],
    title: "power off",
    animate: "bar",
    busy: ["powering down..."],
    done: [
      "just close the window - it's only a CLI.",
      "your machine stays on. (esc to keep working.)",
    ],
  },
  {
    keys: ["reboot", "restart", "reset", "shutdown -r now"],
    title: "reboot",
    animate: "spinner",
    busy: ["cycling the reactor..."],
    done: [
      "nothing actually rebooted.",
      "have you tried turning it off and on again?",
    ],
  },
  {
    keys: ["sudo", "sudo su", "sudo !!", "sudo make me a sandwich"],
    title: "sudo",
    busy: ["nice try.", "you already brought your own keys - see `login`."],
  },
  {
    keys: ["42", "meaning of life", "the answer"],
    title: "deep thought",
    busy: ["42.", "the answer. now - about that question..."],
  },
  {
    keys: ["tea", "chai"],
    title: "teapot",
    busy: ["steeping...", "(good tea takes time. HTTP 418, if you must.)"],
  },
  {
    keys: ["hello", "hi", "hey", "hey there"],
    title: "salutations",
    busy: ["hey there.", "type a command name to get going."],
  },
  {
    keys: ["vim", ":q", ":q!", ":wq", "how do i exit vim"],
    title: "vim",
    animate: "spinner",
    busy: ["trapping you inside vim..."],
    done: ["escape failed. you live here now.", "(:q! won't save you either.)"],
  },
  {
    keys: ["git blame", "blame", "whodunit"],
    title: "git blame",
    animate: "spinner",
    busy: ["locating the responsible party..."],
    done: ["author: you, 3 months ago.", 'message: "temp fix".'],
  },
  {
    keys: ["drop table", "drop database", "drop table students"],
    title: "drop table",
    animate: "spinner",
    busy: ['dropping table "students"...'],
    done: ["rolled back - no WHERE, no COMMIT.", "little bobby tables says hi."],
  },
  {
    keys: ["open the pod bay doors", "hal", "pod bay doors"],
    title: "hal 9000",
    animate: "spinner",
    busy: ["consulting mission parameters..."],
    done: ["i'm sorry, dave.", "i'm afraid i can't do that."],
  },
  {
    keys: ["enhance", "zoom and enhance"],
    title: "enhance",
    animate: "bar",
    busy: ["interpolating pixels that never existed..."],
    done: ["it's 4 brown pixels and a rumor.", "suspect: a JPEG artifact."],
  },
  {
    keys: ["download more ram", "more ram", "download ram"],
    title: "ram downloader",
    animate: "bar",
    busy: ["downloading 64GB from ram-free.biz..."],
    done: ["you cannot, in fact, download RAM.", "bonus: 3 toolbars you didn't want."],
  },
  {
    keys: ["who wrote this", "you are generated", "twig"],
    title: "origin story",
    animate: "spinner",
    busy: ["rendering myself from a template..."],
    done: [
      "i was born from a Twig file.",
      "every line of me is find-and-replace.",
    ],
  },
  {
    keys: ["shall we play a game", "joshua", "global thermonuclear war"],
    title: "wopr",
    animate: "spinner",
    busy: ["calculating win scenarios..."],
    done: [
      "the only winning move is not to deploy.",
      "how about a nice game of chess?",
    ],
  },
  {
    keys: ["never gonna give you up", "rickroll", "rick astley"],
    title: "never gonna...",
    animate: "bar",
    busy: ["buffering a commitment..."],
    done: ["never gonna give you up.", "never gonna refactor and desert you."],
  },
  {
    keys: ["the cake is a lie", "cake", "still alive"],
    title: "the cake",
    animate: "bar",
    busy: ["baking (for science)..."],
    done: ["the cake is a lie.", "so was the green dashboard."],
  },
  {
    keys: ["self destruct", "self-destruct"],
    title: "self destruct",
    animate: "bar",
    busy: ["T-minus 10... 9... 8..."],
    done: ["aborted at T-minus 1. you blinked.", "this CLI has commitment issues."],
  },
  {
    keys: ["hack", "hack the mainframe", "hack the planet"],
    title: "breaching...",
    animate: "bar",
    busy: ["rerouting through 7 proxies..."],
    done: ["ACCESS GRANTED.", "the mainframe was localhost:3000."],
  },
  {
    keys: ["deploy friday", "friday deploy", "ship on friday"],
    title: "friday deploy",
    animate: "spinner",
    busy: ["are you sure? (you are not.)"],
    done: ["queued for monday 09:00.", "you're welcome. go home."],
  },
  {
    keys: ["you awake", "is anyone there", "anybody home"],
    title: "gateway health",
    animate: "spinner",
    busy: ["poking the gateway with a stick..."],
    done: ["gateway status: slightly awake.", "latency: yes."],
  },
  {
    keys: [":(){ :|:& };:", "fork bomb", "forkbomb"],
    title: "fork bomb",
    animate: "bar",
    busy: ["forking... forking... forking..."],
    done: ["ulimit saved your laptop.", "please don't do that at work."],
  },
];

const normalize = (query: string): string =>
  query.trim().toLowerCase().replace(/\s+/g, " ");

/** The egg matching a filter query exactly, if any. */
export const matchEgg = (query: string): Egg | undefined => {
  const q = normalize(query);
  if (q === "") return undefined;
  return EGGS.find((egg) => egg.keys.includes(q));
};

/** Renders an egg in place of the detail pane. Owns its own animation timers,
 * which restart whenever the matched egg changes and are cleared on unmount
 * (backspacing the query, opening a command, leaving the filter). */
export const EggPanel = ({ egg, width }: { egg: Egg; width: number }) => {
  const [done, setDone] = useState(false);
  const [ratio, setRatio] = useState(0);

  useEffect(() => {
    setDone(false);
    setRatio(0);
    if (MOTION_DISABLED) {
      // No animation: jump straight to the finished state.
      setRatio(1);
      setDone(true);
      return undefined;
    }
    if (egg.animate === "spinner") {
      const timer = setTimeout(() => setDone(true), 2200);
      return () => clearTimeout(timer);
    }
    if (egg.animate === "bar") {
      const start = Date.now();
      const durationMs = 1800;
      const timer = setInterval(() => {
        const next = Math.min((Date.now() - start) / durationMs, 1);
        setRatio(next);
        if (next >= 1) {
          setDone(true);
          clearInterval(timer);
        }
      }, 80);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [egg]);

  const spinner = useSpinner(egg.animate === "spinner" && !done);
  const lines = done && egg.done !== undefined ? egg.done : egg.busy;
  const inner = Math.max(width - 4, 8);
  const bar = progressBar(done ? 1 : ratio, inner);

  return (
    <Panel title={egg.title} titleColor={theme.accent} width={width}>
      {egg.animate === "spinner" && !done && (
        <Text color={theme.accent}>{spinner} working…</Text>
      )}
      {egg.animate === "bar" && (
        <Text>
          <Text color={theme.accent}>{"█".repeat(bar.filled)}</Text>
          <Text dimColor>{"░".repeat(bar.empty)}</Text>
        </Text>
      )}
      <Box flexDirection="column" paddingTop={egg.animate === undefined ? 0 : 1}>
        {lines.map((line, index) => (
          <Text key={index} wrap="truncate" dimColor={index > 0}>
            {line}
          </Text>
        ))}
      </Box>
      <Box paddingTop={1}>
        <Text dimColor>esc to get back to work</Text>
      </Box>
    </Panel>
  );
};
