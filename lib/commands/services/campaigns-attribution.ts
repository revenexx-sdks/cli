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

export const campaignsAttribution = new Command("campaigns-attribution")
  .description(
    commandDescriptions["campaignsAttribution"] ??
      `The attribution ledger: one fact per order, campaign and touch, with first- and last-touch flags so a report can pick its model. Facts are never deleted; a return reduces the amount still credited. The sweep records what the owning apps keep to be read.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "factKey", option: "--fact-key <fact-key>", name: "fact_key", description: "Keep only rows whose `fact_key` equals this.", type: "string", required: false },
  { key: "campaignId", option: "--campaign-id <campaign-id>", name: "campaign_id", description: "Keep only rows whose `campaign_id` equals this.", type: "string", required: false },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", description: "Keep only rows whose `order_id` equals this.", type: "string", required: false },
  { key: "orderNumber", option: "--order-number <order-number>", name: "order_number", description: "Keep only rows whose `order_number` equals this.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Keep only rows whose `contact_id` equals this.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Keep only rows whose `organization_id` equals this.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Keep only rows whose `currency` equals this.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "Keep only rows whose `market` equals this.", type: "string", required: false },
  { key: "touchKind", option: "--touch-kind <touch-kind>", name: "touch_kind", description: "Keep only rows whose `touch_kind` equals this.", type: "string", required: false },
  { key: "touchRef", option: "--touch-ref <touch-ref>", name: "touch_ref", description: "Keep only rows whose `touch_ref` equals this.", type: "string", required: false },
  { key: "isFirstTouch", option: "--is-first-touch <is-first-touch>", name: "is_first_touch", description: "Keep only rows whose `is_first_touch` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
campaignsAttribution
  .command(`list`)
  .description(`The ledger. Filter \`?campaign_id=\`, \`?order_id=\`, \`?is_last_touch=true\`. Read-only: facts are written from orders, redemptions and touches.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--fact-key <fact-key>`, `Keep only rows whose \`fact_key\` equals this.`)
  .option(`--campaign-id <campaign-id>`, `Keep only rows whose \`campaign_id\` equals this.`)
  .option(`--order-id <order-id>`, `Keep only rows whose \`order_id\` equals this.`)
  .option(`--order-number <order-number>`, `Keep only rows whose \`order_number\` equals this.`)
  .option(`--contact-id <contact-id>`, `Keep only rows whose \`contact_id\` equals this.`)
  .option(`--organization-id <organization-id>`, `Keep only rows whose \`organization_id\` equals this.`)
  .option(`--currency <currency>`, `Keep only rows whose \`currency\` equals this.`)
  .option(`--market <market>`, `Keep only rows whose \`market\` equals this.`)
  .option(`--touch-kind <touch-kind>`, `Keep only rows whose \`touch_kind\` equals this.`)
  .option(`--touch-ref <touch-ref>`, `Keep only rows whose \`touch_ref\` equals this.`)
  .option(`--is-first-touch <is-first-touch>`, `Keep only rows whose \`is_first_touch\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, factKey, campaignId, orderId, orderNumber, contactId, organizationId, currency, market, touchKind, touchRef, isFirstTouch, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/attribution-facts`;
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
        if (factKey !== undefined) {
          _payload[`fact_key`] = factKey;
        }
        if (campaignId !== undefined) {
          _payload[`campaign_id`] = campaignId;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
        }
        if (orderNumber !== undefined) {
          _payload[`order_number`] = orderNumber;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (touchKind !== undefined) {
          _payload[`touch_kind`] = touchKind;
        }
        if (touchRef !== undefined) {
          _payload[`touch_ref`] = touchRef;
        }
        if (isFirstTouch !== undefined) {
          _payload[`is_first_touch`] = isFirstTouch;
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
registerPromptSpecs(campaignsAttribution.commands.at(-1)!, listSpecs, { method: "get" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/attribution-facts", hasLimit: true } },
];
campaignsAttribution
  .command(`get`)
  .description(`Read one attribution fact`)
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
        const _apiPath = `/campaigns/attribution-facts/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(campaignsAttribution.commands.at(-1)!, getSpecs, { method: "get" });
const sweepSpecs: PromptSpec[] = [
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
campaignsAttribution
  .command(`sweep`)
  .description(`The hourly schedule, callable by hand: reads committed redemptions of attached promotions and orders placed in the last 48 hours from their apps, and records facts under the same keys the event handlers use. Also moves campaigns whose window opened or closed.`)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { body } = await promptForMissing(
          _options,
          sweepSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/attribution/sweep`;
        const _payload: RequestParams = {};
        if (body !== undefined || cliConfig.data !== undefined) {
          Object.assign(_payload, resolveBodyParam(body ?? cliConfig.data));
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
registerPromptSpecs(campaignsAttribution.commands.at(-1)!, sweepSpecs, { method: "post" });
