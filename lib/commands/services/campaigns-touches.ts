import { Command } from "commander";
import { resolveBodyParam } from "../../utils.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  cliConfig,
  parse,
  parseInteger,
} from "../../parser.js";
import {
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const campaignsTouches = new Command("campaigns-touches")
  .description(
    commandDescriptions["campaignsTouches"] ??
      `Touches a campaign heard of before any order — impressions and clicks in the shop, ad clicks, clicked mails, redeemed promotions — and the outcomes it counts: new subscriptions and new leads.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "touchKey", option: "--touch-key <touch-key>", name: "touch_key", description: "Keep only rows whose `touch_key` equals this.", type: "string", required: false },
  { key: "campaignId", option: "--campaign-id <campaign-id>", name: "campaign_id", description: "Keep only rows whose `campaign_id` equals this.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Keep only rows whose `kind` equals this.", type: "string", required: false },
  { key: "ref", option: "--ref <ref>", name: "ref", description: "Keep only rows whose `ref` equals this.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Keep only rows whose `contact_id` equals this.", type: "string", required: false },
  { key: "sessionKey", option: "--session-key <session-key>", name: "session_key", description: "Keep only rows whose `session_key` equals this.", type: "string", required: false },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", description: "Keep only rows whose `order_id` equals this.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "Keep only rows whose `market` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
campaignsTouches
  .command(`list`)
  .description(`Filter \`?campaign_id=\`, \`?kind=\`, \`?contact_id=\`. Read-only.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--touch-key <touch-key>`, `Keep only rows whose \`touch_key\` equals this.`)
  .option(`--campaign-id <campaign-id>`, `Keep only rows whose \`campaign_id\` equals this.`)
  .option(`--kind <kind>`, `Keep only rows whose \`kind\` equals this.`)
  .option(`--ref <ref>`, `Keep only rows whose \`ref\` equals this.`)
  .option(`--contact-id <contact-id>`, `Keep only rows whose \`contact_id\` equals this.`)
  .option(`--session-key <session-key>`, `Keep only rows whose \`session_key\` equals this.`)
  .option(`--order-id <order-id>`, `Keep only rows whose \`order_id\` equals this.`)
  .option(`--market <market>`, `Keep only rows whose \`market\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, touchKey, campaignId, kind, ref, contactId, sessionKey, orderId, market, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/touches`;
        const _payload: RequestParams = {};
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
        }
        if (order !== undefined) {
          _payload[`order`] = order;
        }
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (touchKey !== undefined) {
          _payload[`touch_key`] = touchKey;
        }
        if (campaignId !== undefined) {
          _payload[`campaign_id`] = campaignId;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (ref !== undefined) {
          _payload[`ref`] = ref;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (sessionKey !== undefined) {
          _payload[`session_key`] = sessionKey;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        for (const _filter of filter as string[]) {
          const _eq = _filter.indexOf("=");
          if (_eq <= 0) {
            throw new Error(`--filter expects column=value, got "${_filter}"`);
          }
          _payload[_filter.slice(0, _eq)] = _filter.slice(_eq + 1);
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
registerPromptSpecs(campaignsTouches.commands.at(-1)!, listSpecs, { method: "get" });
const ingestSpecs: PromptSpec[] = [
  { key: "touches", option: "--touches [touches...]", name: "touches", type: "array", required: true },
];
campaignsTouches
  .command(`ingest`)
  .description(`A batch of at most 500 on-site impressions, on-site clicks and ad clicks. Each item is judged on its own; an item with a key already recorded is counted as a duplicate.`)
  .option(`--touches [touches...]`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { touches } = await promptForMissing(
          _options,
          ingestSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/touches`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (touches !== undefined) {
          _payload[`touches`] = touches;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `post`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(campaignsTouches.commands.at(-1)!, ingestSpecs, { method: "post" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/touches", hasLimit: true } },
];
campaignsTouches
  .command(`get`)
  .description(`Read one touch`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/touches/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(campaignsTouches.commands.at(-1)!, getSpecs, { method: "get" });
