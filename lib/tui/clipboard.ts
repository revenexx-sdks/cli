/**
 * Clipboard access for the TUI: tries the platform's clipboard tool first,
 * then falls back to the OSC 52 escape sequence, which asks the terminal
 * emulator itself to set the clipboard — that path even works over SSH.
 */
import { spawn } from "node:child_process";

const CANDIDATES: [string, string[]][] =
  process.platform === "darwin"
    ? [["pbcopy", []]]
    : process.platform === "win32"
      ? [["clip", []]]
      : [
          ["wl-copy", []],
          ["xclip", ["-selection", "clipboard"]],
          ["xsel", ["--clipboard", "--input"]],
        ];

const pipeTo = (command: string, args: string[], text: string): Promise<boolean> =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "ignore", "ignore"],
    });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
    child.stdin.on("error", () => {
      // Swallow EPIPE from a missing binary; the close/error handlers decide.
    });
    child.stdin.write(text);
    child.stdin.end();
  });

export const copyToClipboard = async (text: string): Promise<boolean> => {
  for (const [command, args] of CANDIDATES) {
    if (await pipeTo(command, args, text)) {
      return true;
    }
  }
  // OSC 52: emits nothing visible, the terminal intercepts the sequence.
  try {
    process.stdout.write(
      `\u001B]52;c;${Buffer.from(text).toString("base64")}\u0007`,
    );
    return true;
  } catch {
    return false;
  }
};
