import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
} from "../../parser.js";

export const mailingsBlocks = new Command("mailings-blocks")
  .description(
    commandDescriptions["mailingsBlocks"] ??
      `The contract of the three blocks this app adds to the mail editor — product, voucher and the mandatory footer — and the variables that fill them per recipient.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

mailingsBlocks
  .command(`read`)
  .description(`The product, voucher and footer blocks: the keys each carries in a design and the variables that fill it per recipient.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/mailings/blocks`;
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
