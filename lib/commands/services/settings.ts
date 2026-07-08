import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
} from "../../parser.js";
import {
  promptForMissing,
} from "../../interactive.js";

export const settings = new Command("settings")
  .description(
    commandDescriptions["settings"] ??
      `Resolve an app's effective per-tenant / per-market settings (schema defaults merged with stored values; sensitive values masked).`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

settings
  .command(`get-app-settings`)
  .description(`The tenant's effective settings for the app — the declared schema's defaults merged with stored tenant/market values. Sensitive settings are masked (listed in \`masked\`, omitted from \`settings\`).`)
  .option(`--app <app>`, `App name, e.g. \`pages\`.`)
  .option(`--market <market>`, `Resolve market-scoped settings for this market code; falls back to the tenant value.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { app, market } = await promptForMissing(
          _options,
          [
            { key: "app", option: "--app <app>", name: "app", description: "App name, e.g. `pages`.", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/settings/apps/{app}`.replace(`{app}`, app);
        const _payload: RequestParams = {};
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `get`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
