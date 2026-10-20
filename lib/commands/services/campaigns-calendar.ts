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
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const campaignsCalendar = new Command("campaigns-calendar")
  .description(
    commandDescriptions["campaignsCalendar"] ??
      `The marketing calendar: campaign windows, mail send times, promotion windows, automation live periods, page publish dates and due tasks in one range, each read from the app that owns it.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const readSpecs: PromptSpec[] = [
  { key: "from", option: "--from <from>", name: "from", description: "Start of the range, a date or a time. Required.", type: "string", required: false },
  { key: "to", option: "--to <to>", name: "to", description: "End of the range; a bare date means the whole day. At most 400 days after from.", type: "string", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "Comma-separated kinds: campaign, mailing, promotion, journey, page, task.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "Only campaigns in this market, or in no market.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Only campaigns with this status.", type: "string", required: false },
  { key: "ownerId", option: "--owner-id <owner-id>", name: "owner_id", description: "Only campaigns of this owner.", type: "string", required: false },
];
campaignsCalendar
  .command(`read`)
  .description(`Campaign windows and due tasks from this app; mail send times, promotion windows, automation live periods and page publish dates read from their own apps on every call. \`sources\` says which app answered.`)
  .option(`--from <from>`, `Start of the range, a date or a time. Required.`)
  .option(`--to <to>`, `End of the range; a bare date means the whole day. At most 400 days after from.`)
  .option(`--type <type>`, `Comma-separated kinds: campaign, mailing, promotion, journey, page, task.`)
  .option(`--market <market>`, `Only campaigns in this market, or in no market.`)
  .option(`--status <status>`, `Only campaigns with this status.`)
  .option(`--owner-id <owner-id>`, `Only campaigns of this owner.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { from, to, type, market, status, ownerId } = await promptForMissing(
          _options,
          readSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/calendar`;
        const _payload: RequestParams = {};
        if (from !== undefined) {
          _payload[`from`] = from;
        }
        if (to !== undefined) {
          _payload[`to`] = to;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (ownerId !== undefined) {
          _payload[`owner_id`] = ownerId;
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
registerPromptSpecs(campaignsCalendar.commands.at(-1)!, readSpecs, { method: "get" });
