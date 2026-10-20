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

export const reviewsAggregates = new Command("reviews-aggregates")
  .description(
    commandDescriptions["reviewsAggregates"] ??
      `Per-product figures — count, average, stars — per market and for all markets together, for mail product blocks and the seo feeds.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "productIds", option: "--product-ids <product-ids>", name: "product_ids", description: "Comma-separated product ids.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "A market code; default `*`, all markets together.", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Without product_ids: one product.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
reviewsAggregates
  .command(`list`)
  .description(`With \`product_ids\` (comma-separated, at most 200): one entry per product, zero for a product nobody reviewed. Without: the stored figures, paged, most reviewed first.`)
  .option(`--product-ids <product-ids>`, `Comma-separated product ids.`)
  .option(`--market <market>`, `A market code; default \`*\`, all markets together.`)
  .option(`--product-id <product-id>`, `Without product_ids: one product.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { productIds, market, productId, limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/reviews/aggregates`;
        const _payload: RequestParams = {};
        if (productIds !== undefined) {
          _payload[`product_ids`] = productIds;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
        }
        if (order !== undefined) {
          _payload[`order`] = order;
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
registerPromptSpecs(reviewsAggregates.commands.at(-1)!, listSpecs, { method: "get" });
const rebuildSpecs: PromptSpec[] = [
  { key: "productIds", option: "--product-ids [product-ids...]", name: "product_ids", type: "array", required: false },
];
reviewsAggregates
  .command(`rebuild`)
  .description(`For the named products, or for every product with reviews or figures (up to 1000 per call).`)
  .option(`--product-ids [product-ids...]`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { productIds } = await promptForMissing(
          _options,
          rebuildSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/reviews/aggregates/rebuild`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (productIds !== undefined) {
          _payload[`product_ids`] = productIds;
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
registerPromptSpecs(reviewsAggregates.commands.at(-1)!, rebuildSpecs, { method: "post" });
const reviewStarsSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true },
];
reviewsAggregates
  .command(`review-stars`)
  .description(`The stars of the review's product across all markets, five stars down to one, each with its count and share of the published reviews, worded in the caller language (Accept-Language; German unless English is asked for); average, count and verified purchases are \`footer\` rows, no published review answers no rows; the row of the review's own stars says so in \`sub\`.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          reviewStarsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/reviews/reviews/{id}/stars`.replace(`{id}`, id);
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
registerPromptSpecs(reviewsAggregates.commands.at(-1)!, reviewStarsSpecs, { method: "get" });
