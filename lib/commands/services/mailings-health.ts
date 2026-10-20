import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
} from "../../parser.js";

export const mailingsHealth = new Command("mailings-health")
  .description(
    commandDescriptions["mailingsHealth"] ??
      `The sending health over 30 days: bounce, complaint and unsubscribe rates, with an alert when complaints pass the limit mailbox providers enforce.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

mailingsHealth
  .command(`read`)
  .description(`Sent, delivered, bounced, complained and unsubscribed over the mailings of the last 30 days, the rates, and \`alert\` when the complaint rate passes the setting. \`bars\` are the three rates as bar-list rows in the language of Accept-Language, with the counts behind them and the alert sentence on the complaint row.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/mailings/health`;
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
