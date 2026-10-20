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
  confirmDestructive,
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const journeysWatches = new Command("journeys-watches")
  .description(
    commandDescriptions["journeysWatches"] ??
      `Requests to be told when a product is available again. The back-in-stock trigger enrols the people waiting for the product.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Keep only rows whose `contact_id` equals this.", type: "string", required: false },
  { key: "email", option: "--email <email>", name: "email", description: "Keep only rows whose `email` equals this.", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Keep only rows whose `product_id` equals this.", type: "string", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Keep only rows whose `sku` equals this.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "Keep only rows whose `market` equals this.", type: "string", required: false },
  { key: "state", option: "--state <state>", name: "state", description: "Keep only rows whose `state` equals this.", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Keep only rows whose `source` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
journeysWatches
  .command(`list`)
  .description(`Filter \`?product_id=&state=waiting\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--contact-id <contact-id>`, `Keep only rows whose \`contact_id\` equals this.`)
  .option(`--email <email>`, `Keep only rows whose \`email\` equals this.`)
  .option(`--product-id <product-id>`, `Keep only rows whose \`product_id\` equals this.`)
  .option(`--sku <sku>`, `Keep only rows whose \`sku\` equals this.`)
  .option(`--market <market>`, `Keep only rows whose \`market\` equals this.`)
  .option(`--state <state>`, `Keep only rows whose \`state\` equals this.`)
  .option(`--source <source>`, `Keep only rows whose \`source\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, contactId, email, productId, sku, market, state, source, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/stock-watches`;
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
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (state !== undefined) {
          _payload[`state`] = state;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
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
registerPromptSpecs(journeysWatches.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "email", option: "--email <email>", name: "email", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", type: "string", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", type: "string", required: false },
];
journeysWatches
  .command(`create`)
  .description(`What the storefront posts from a sold-out product page. A person already waiting for the product gets the existing request back.`)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--email <email>`, ``)
  .option(`--market <market>`, ``)
  .option(`--product-id <product-id>`, ``)
  .option(`--sku <sku>`, ``)
  .option(`--source <source>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, email, market, productId, sku, source } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/stock-watches`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
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
registerPromptSpecs(journeysWatches.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/stock-watches", hasLimit: true } },
];
journeysWatches
  .command(`delete`)
  .description(`Withdraw a notification request`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`journeys-watches delete`);
        const _client = await sdkForProject();
        const _apiPath = `/journeys/stock-watches/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `delete`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(journeysWatches.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/stock-watches", hasLimit: true } },
];
journeysWatches
  .command(`get`)
  .description(`Read one notification request`)
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
        const _apiPath = `/journeys/stock-watches/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(journeysWatches.commands.at(-1)!, getSpecs, { method: "get" });
