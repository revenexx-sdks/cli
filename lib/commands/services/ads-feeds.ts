import { Command } from "commander";
import { resolveBodyParam } from "../../utils.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  cliConfig,
  parse,
  parseBool,
  parseInteger,
} from "../../parser.js";
import {
  confirmDestructive,
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const adsFeeds = new Command("ads-feeds")
  .description(
    commandDescriptions["adsFeeds"] ??
      `Which product feed of the seo service each market hands to Merchant Center, the Meta catalogue or LinkedIn. A reference only — the feed is built by seo.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "Keep only rows whose `market` equals this.", type: "string", required: false },
  { key: "destination", option: "--destination <destination>", name: "destination", description: "Keep only rows whose `destination` equals this.", type: "string", required: false },
  { key: "feedId", option: "--feed-id <feed-id>", name: "feed_id", description: "Keep only rows whose `feed_id` equals this.", type: "string", required: false },
  { key: "feedUrl", option: "--feed-url <feed-url>", name: "feed_url", description: "Keep only rows whose `feed_url` equals this.", type: "string", required: false },
  { key: "label", option: "--label <label>", name: "label", description: "Keep only rows whose `label` equals this.", type: "string", required: false },
  { key: "active", option: "--active <active>", name: "active", description: "Keep only rows whose `active` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
adsFeeds
  .command(`list`)
  .description(`One reference per market and destination. The feed itself is built by the seo service.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--market <market>`, `Keep only rows whose \`market\` equals this.`)
  .option(`--destination <destination>`, `Keep only rows whose \`destination\` equals this.`)
  .option(`--feed-id <feed-id>`, `Keep only rows whose \`feed_id\` equals this.`)
  .option(`--feed-url <feed-url>`, `Keep only rows whose \`feed_url\` equals this.`)
  .option(`--label <label>`, `Keep only rows whose \`label\` equals this.`)
  .option(`--active <active>`, `Keep only rows whose \`active\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, market, destination, feedId, feedUrl, label, active, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/feed-refs`;
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
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (destination !== undefined) {
          _payload[`destination`] = destination;
        }
        if (feedId !== undefined) {
          _payload[`feed_id`] = feedId;
        }
        if (feedUrl !== undefined) {
          _payload[`feed_url`] = feedUrl;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (active !== undefined) {
          _payload[`active`] = active;
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
registerPromptSpecs(adsFeeds.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "destination", option: "--destination <destination>", name: "destination", description: "`google_merchant_center`, `meta_catalog`, `linkedin` or `other`.", type: "string", required: true, enum: ["google_merchant_center","meta_catalog","linkedin","other"] },
  { key: "market", option: "--market <market>", name: "market", description: "The market code.", type: "string", required: true },
  { key: "active", option: "--active <active>", name: "active", description: "Switched on. A switched-off row stays for its history and does nothing.", type: "boolean", required: false },
  { key: "feedId", option: "--feed-id <feed-id>", name: "feed_id", description: "The feed id in the seo service.", type: "string", required: false },
  { key: "feedUrl", option: "--feed-url <feed-url>", name: "feed_url", description: "The feed address the platform fetches.", type: "string", required: false },
  { key: "label", option: "--label <label>", name: "label", description: "A note for the merchant.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
];
adsFeeds
  .command(`create`)
  .description(`Name the seo feed of a market for a destination`)
  .option(`--destination <destination>`, `\`google_merchant_center\`, \`meta_catalog\`, \`linkedin\` or \`other\`.`)
  .option(`--market <market>`, `The market code.`)
  .option(
    `--active [value]`,
    `Switched on. A switched-off row stays for its history and does nothing.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--feed-id <feed-id>`, `The feed id in the seo service.`)
  .option(`--feed-url <feed-url>`, `The feed address the platform fetches.`)
  .option(`--label <label>`, `A note for the merchant.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { destination, market, active, feedId, feedUrl, label, metadata } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/feed-refs`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (active !== undefined) {
          _payload[`active`] = active;
        }
        if (destination !== undefined) {
          _payload[`destination`] = destination;
        }
        if (feedId !== undefined) {
          _payload[`feed_id`] = feedId;
        }
        if (feedUrl !== undefined) {
          _payload[`feed_url`] = feedUrl;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
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
registerPromptSpecs(adsFeeds.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/feed-refs", hasLimit: true } },
];
adsFeeds
  .command(`delete`)
  .description(`Remove a feed reference`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`ads-feeds delete`);
        const _client = await sdkForProject();
        const _apiPath = `/ads/feed-refs/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(adsFeeds.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/feed-refs", hasLimit: true } },
];
adsFeeds
  .command(`get`)
  .description(`Read one feed reference`)
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
        const _apiPath = `/ads/feed-refs/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(adsFeeds.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/feed-refs", hasLimit: true } },
  { key: "active", option: "--active <active>", name: "active", description: "Switched on. A switched-off row stays for its history and does nothing.", type: "boolean", required: false },
  { key: "destination", option: "--destination <destination>", name: "destination", description: "`google_merchant_center`, `meta_catalog`, `linkedin` or `other`.", type: "string", required: false, enum: ["google_merchant_center","meta_catalog","linkedin","other"] },
  { key: "feedId", option: "--feed-id <feed-id>", name: "feed_id", description: "The feed id in the seo service.", type: "string", required: false },
  { key: "feedUrl", option: "--feed-url <feed-url>", name: "feed_url", description: "The feed address the platform fetches.", type: "string", required: false },
  { key: "label", option: "--label <label>", name: "label", description: "A note for the merchant.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "The market code.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
];
adsFeeds
  .command(`update`)
  .description(`Change a feed reference`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(
    `--active [value]`,
    `Switched on. A switched-off row stays for its history and does nothing.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--destination <destination>`, `\`google_merchant_center\`, \`meta_catalog\`, \`linkedin\` or \`other\`.`)
  .option(`--feed-id <feed-id>`, `The feed id in the seo service.`)
  .option(`--feed-url <feed-url>`, `The feed address the platform fetches.`)
  .option(`--label <label>`, `A note for the merchant.`)
  .option(`--market <market>`, `The market code.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, active, destination, feedId, feedUrl, label, market, metadata } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/feed-refs/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (active !== undefined) {
          _payload[`active`] = active;
        }
        if (destination !== undefined) {
          _payload[`destination`] = destination;
        }
        if (feedId !== undefined) {
          _payload[`feed_id`] = feedId;
        }
        if (feedUrl !== undefined) {
          _payload[`feed_url`] = feedUrl;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `put`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(adsFeeds.commands.at(-1)!, updateSpecs, { method: "put" });
