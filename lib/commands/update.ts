import { spawn } from "child_process";
import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { success, log, warn, error, hint, actionRunner } from "../parser.js";
import {
  getLatestVersion,
  compareVersions,
  getErrorMessage,
} from "../utils.js";
import {
  GITHUB_RELEASES_URL,
  HOMEBREW_FORMULA,
  NPM_PACKAGE_NAME,
  SDK_TITLE,
  EXECUTABLE_NAME,
} from "../constants.js";
import packageJson from "../../package.json" with { type: "json" };
const { version } = packageJson;

type ExecCommandOptions = Exclude<Parameters<typeof spawn>[2], undefined>;

/**
 * The GitHub release tag for a version. Release tags are `v`-prefixed
 * (`v1.2.3`) while npm reports the bare version (`1.2.3`), so normalise to a
 * single leading `v` — otherwise the releases page 404s.
 */
export const releaseTag = (version: string): string =>
  `v${version.replace(/^v/, "")}`;

/** The npm command update runs (and prints under --dry-run) — a single source
 * so the shown command can never drift from the executed one. */
export const NPM_UPDATE_ARGS = ["install", "-g", `${NPM_PACKAGE_NAME}@latest`];
export const npmUpdateCommandLine = (): string =>
  `npm ${NPM_UPDATE_ARGS.join(" ")}`;

/** The Homebrew counterpart — `brew update` first, otherwise the tap still
 * carries the formula revision that was current at install time and the upgrade
 * is a no-op. Single source for the shown and the executed command. */
export const BREW_UPDATE_ARGS = ["upgrade", HOMEBREW_FORMULA];
export const brewUpdateCommandLine = (): string =>
  `brew update && brew ${BREW_UPDATE_ARGS.join(" ")}`;

/**
 * Check if the CLI was installed via npm
 */
const isInstalledViaNpm = (): boolean => {
  try {
    const scriptPath = process.argv[1];

    if (
      scriptPath.includes("node_modules") &&
      scriptPath.includes(NPM_PACKAGE_NAME)
    ) {
      return true;
    }

    if (
      scriptPath.includes("/usr/local/lib/node_modules/") ||
      scriptPath.includes("/opt/homebrew/lib/node_modules/") ||
      scriptPath.includes("/.npm-global/") ||
      scriptPath.includes("/node_modules/.bin/") ||
      scriptPath.includes("/.nvm/versions/node/")
    ) {
      return true;
    }

    return false;
  } catch (_e) {
    return false;
  }
};

/**
 * Check if the CLI was installed via Homebrew
 */
/**
 * Whether any of the given runtime paths points inside a Homebrew installation.
 *
 * Matching `/Cellar/` covers both macOS prefixes (`/opt/homebrew` and
 * `/usr/local`) while *not* mistaking a Homebrew-installed `node` — which lives
 * in `/opt/homebrew/bin` — for a Homebrew-installed CLI; `/linuxbrew/` covers
 * Homebrew on Linux.
 *
 * Both `process.execPath` and `process.argv[1]` are checked because the
 * Homebrew build is the Bun-compiled single-file binary: there `argv[1]` is a
 * path inside the binary's virtual filesystem rather than anything on disk, and
 * only `execPath` names the installed file.
 */
export const isHomebrewPath = (paths: readonly string[]): boolean =>
  paths.some(
    (path) => path.includes("/Cellar/") || path.includes("/linuxbrew/"),
  );

const isInstalledViaHomebrew = (): boolean => {
  try {
    return isHomebrewPath([process.execPath, process.argv[1] ?? ""]);
  } catch (_e) {
    return false;
  }
};

/**
 * Run a shell command line and resolve on exit 0.
 *
 * The whole command is passed as a single string (not command + args array):
 * with `shell: true`, passing a separate args array trips Node's DEP0190
 * warning because the args would be concatenated into the shell line
 * unescaped. Callers must therefore pass a complete, trusted command line —
 * never interpolate untrusted input here.
 */
const execCommand = (
  commandLine: string,
  options: ExecCommandOptions = {},
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const child = spawn(commandLine, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
};

/**
 * Update via npm
 */
const updateViaNpm = async (dryRun = false): Promise<void> => {
  if (dryRun) {
    log(`Dry run — would run: ${chalk.cyan(npmUpdateCommandLine())}`);
    return;
  }
  try {
    await execCommand(npmUpdateCommandLine());
    console.log("");
    success("Updated to latest version via npm!");
    hint(`Run '${EXECUTABLE_NAME} --version' to verify the new version.`);
  } catch (e: unknown) {
    const message = getErrorMessage(e);

    if (message.includes("EEXIST") || message.includes("file already exists")) {
      console.log("");
      success("Latest version is already installed via npm!");
      hint(`The CLI is up to date. Run '${EXECUTABLE_NAME} --version' to verify.`);
    } else {
      console.log("");
      error(`Failed to update via npm: ${message}`);
      hint(`Try running: npm install -g ${NPM_PACKAGE_NAME}@latest --force`);
    }
  }
};

/**
 * Update via Homebrew
 */
const updateViaHomebrew = async (dryRun = false): Promise<void> => {
  if (dryRun) {
    log(`Dry run — would run: ${chalk.cyan(brewUpdateCommandLine())}`);
    return;
  }
  try {
    await execCommand(brewUpdateCommandLine());
    console.log("");
    success("Updated to latest version via Homebrew!");
    hint(`Run '${EXECUTABLE_NAME} --version' to verify the new version.`);
  } catch (e: unknown) {
    console.log("");
    error(`Failed to update via Homebrew: ${getErrorMessage(e)}`);
    hint(`Try running: brew reinstall ${HOMEBREW_FORMULA}`);
  }
};

/**
 * Show manual update instructions
 */
const showManualInstructions = (latestVersion: string): void => {
  log("Manual update options:");
  console.log("");

  log(`${chalk.bold("Option 1: NPM")}`);
  console.log(`  npm install -g ${NPM_PACKAGE_NAME}@latest`);
  console.log("");

  log(`${chalk.bold("Option 2: Homebrew")} (macOS / Linux)`);
  console.log(`  ${brewUpdateCommandLine()}`);
  console.log(`  # not installed via Homebrew yet? brew install ${HOMEBREW_FORMULA}`);
  console.log("");

  log(`${chalk.bold("Option 3: Download Binary")}`);
  console.log(`  Visit: ${GITHUB_RELEASES_URL}/tag/${releaseTag(latestVersion)}`);
};

/**
 * Show interactive menu for choosing update method
 */
const chooseUpdateMethod = async (latestVersion: string): Promise<void> => {
  const choices = [
    { name: "NPM", value: "npm" },
    { name: "Homebrew", value: "homebrew" },
    { name: "Show manual instructions", value: "manual" },
  ];

  const { method } = await inquirer.prompt([
    {
      type: "list",
      name: "method",
      message:
        "Could not detect installation method. How would you like to update?",
      choices: choices,
    },
  ]);

  switch (method) {
    case "npm":
      await updateViaNpm();
      break;
    case "homebrew":
      await updateViaHomebrew();
      break;
    case "manual":
      showManualInstructions(latestVersion);
      break;
  }
};

interface UpdateOptions {
  manual?: boolean;
  dryRun?: boolean;
}

/**
 * Main update function
 */
const updateCli = async ({ manual, dryRun }: UpdateOptions = {}): Promise<void> => {
  try {
    const latestVersion = await getLatestVersion();

    const comparison = compareVersions(version, latestVersion);

    if (comparison === 0) {
      success(
        `You're already running the latest version (${chalk.bold(version)})!`,
      );
      return;
    } else if (comparison < 0) {
      warn(
        `You're running a newer version (${chalk.bold(version)}) than the latest released version (${chalk.bold(latestVersion)}).`,
      );
      hint("This might be a pre-release or development version.");
      return;
    }

    log(
      `Updating from ${chalk.blue(version)} to ${chalk.green(latestVersion)}...`,
    );
    console.log("");

    if (manual) {
      showManualInstructions(latestVersion);
      return;
    }

    if (isInstalledViaNpm()) {
      if (dryRun) log(`Detected install method: ${chalk.bold("npm")}`);
      await updateViaNpm(dryRun);
    } else if (isInstalledViaHomebrew()) {
      if (dryRun) log(`Detected install method: ${chalk.bold("Homebrew")}`);
      await updateViaHomebrew(dryRun);
    } else if (dryRun) {
      // Non-interactive by design: report what would happen instead of prompting.
      warn("Could not detect the install method.");
      hint(
        `Without --dry-run you'd be asked to choose. NPM would run: ${chalk.cyan(npmUpdateCommandLine())}`,
      );
    } else {
      await chooseUpdateMethod(latestVersion);
    }
  } catch (e: unknown) {
    const message = getErrorMessage(e);
    console.log("");
    error(`Failed to check for updates: ${message}`);
    hint(`You can manually check for updates at: ${GITHUB_RELEASES_URL}`);
  }
};

export const update = new Command("update")
  .description(`Update the ${SDK_TITLE} CLI to the latest version`)
  .option(
    "--manual",
    "Show manual update instructions instead of auto-updating",
  )
  .option(
    "--dry-run",
    "Print what update would do (detected method + command) without changing anything",
  )
  .action(actionRunner(updateCli));
