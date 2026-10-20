import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseInteger,
} from "../../parser.js";
import {
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const reviewsProducts = new Command("reviews-products")
  .description(
    commandDescriptions["reviewsProducts"] ??
      `What a product page shows: the published reviews of a product with its figures, per market.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const getSpecs: PromptSpec[] = [
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "The product.", type: "string", required: true },
  { key: "market", option: "--market <market>", name: "market", description: "Only reviews written in this market, with its figures. Without it: all markets.", type: "string", required: false },
  { key: "sort", option: "--sort <sort>", name: "sort", description: "Default newest.", type: "string", required: false, enum: ["newest","oldest","rating_desc","rating_asc"] },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 10).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset.", type: "integer", required: false },
];
reviewsProducts
  .command(`get`)
  .description(`Read the published reviews and figures of a product`)
  .option(`--product-id <product-id>`, `The product.`)
  .option(`--market <market>`, `Only reviews written in this market, with its figures. Without it: all markets.`)
  .option(`--sort <sort>`, `Default newest.`)
  .option(`--limit <limit>`, `Page size (default 10).`, parseInteger)
  .option(`--offset <offset>`, `Row offset.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { productId, market, sort, limit, offset } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/reviews/products/{product_id}`.replace(`{product_id}`, productId);
        const _payload: RequestParams = {};
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (sort !== undefined) {
          _payload[`sort`] = sort;
        }
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
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
registerPromptSpecs(reviewsProducts.commands.at(-1)!, getSpecs, { method: "get" });
