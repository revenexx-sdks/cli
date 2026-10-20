import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
} from "../../parser.js";

export const audit = new Command("audit")
  .description(
    commandDescriptions["audit"] ??
      `The tenant's record-history and trash retention, as set in Console (Baseline).`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

audit
  .command(`get-settings`)
  .description(`Read-only. The values are the tenant's settings in Console; they are changed there, not here. \`defaults\` is true while Console holds none for the tenant (two years of history, 90 days of trash). An app's trash purge reads \`trash_retention_days\` here.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/audit/settings`;
        const _payload: RequestParams = {};
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
