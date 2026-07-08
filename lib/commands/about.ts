import { Command } from "commander";
import { log } from "../parser.js";

/**
 * Show information about this CLI and the generator that produced it.
 *
 * Contributed by the 'about' plugin.
 */
export const about = new Command("about")
  .description("Show information about this CLI and how it was generated")
  .action(() => {
    log("name:         Revenexx CLI");
    log("version:      0.0.8");
    log("language:     cli");
    log("generator:    revenexx/sdk-generator");
    log("generatorUrl: https://github.com/revenexx/sdk-generator");
  });
