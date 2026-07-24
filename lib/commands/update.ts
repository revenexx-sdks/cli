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
const isInstalledViaHomebrew = (): boolean => {
  try {
    const scriptPath = process.argv[1];
    return (
      scriptPath.includes("/opt/homebrew/") ||
      scriptPath.includes("/usr/local/Cellar/")
    );
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
const updateViaHomebrew = async (): Promise<void> => {
  // Homebrew distribution is not available yet for this CLI.
  console.log("");
  warn("Homebrew distribution is not available yet.");
  hint(`Update via NPM instead: npm install -g ${NPM_PACKAGE_NAME}@latest`);
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

  log(`${chalk.bold("Option 2: Homebrew")} (not available yet)`);
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
      await updateViaHomebrew();
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
