import { Command } from "commander";
import { EXECUTABLE_NAME } from "../constants.js";
import { actionRunner, cliConfig, drawTable, log, parse, success, warn } from "../parser.js";
import { DEFAULT_SCHEMAS_BASE, lintCubeDirectory, type CubeProblem } from "./cube-lint.js";

/**
 * `revenexx cube …` — working on a Cube locally, before it is deployed.
 * `cube lint` runs the registry's checks on the directory (see cube-lint.ts);
 * `deploy cube` and `preview cube` upload it.
 */

interface CubeLintFlags {
  schemas?: string;
}

const where = (p: CubeProblem): string => (p.path ? `${p.document} ${p.path}` : p.document);

export const cubeLint = async (dir: string, flags: CubeLintFlags): Promise<void> => {
  const result = await lintCubeDirectory(dir, { schemas: flags.schemas });
  const label = result.cube ?? result.root;
  const ok = result.problems.length === 0;

  if (cliConfig.output !== "table") {
    parse({ cube: result.cube, ok, problems: result.problems, warnings: result.warnings });
  } else {
    if (result.problems.length) {
      log(`Problems in ${label} — the registry refuses a release with any of them`);
      drawTable(result.problems.map((p) => ({ file: p.document, path: p.path, problem: p.message })));
    }
    for (const w of result.warnings) warn(`${where(w)}: ${w.message}`);
  }

  if (!ok) {
    throw new Error(`${label}: ${result.problems.length} problem(s) — fix them before '${EXECUTABLE_NAME} deploy cube'`);
  }
  if (cliConfig.output === "table") {
    success(`${label} passes the lint (${result.warnings.length} warning(s))`);
  }
};

export const cube = new Command("cube")
  .description("Work on an analytics Cube locally: check it before you deploy it")
  .addCommand(
    new Command("lint")
      .description("Check cube.json, the analytics files and billing.json against the published schemas and the rules every Cube release must pass")
      .argument("[dir]", "Cube directory (needs cube.json)", ".")
      .option("--schemas <url-or-dir>", `where to read the schemas from: a base URL or a directory of *.schema.json (default: ${DEFAULT_SCHEMAS_BASE})`)
      .action(actionRunner(cubeLint)),
  );
