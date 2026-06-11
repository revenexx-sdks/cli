import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseInteger,
} from "../../parser.js";

export const search = new Command("search")
  .description(commandDescriptions["search"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

search
  .command(`search-list-collections`)
  .description(`The collections the tenant's installed apps have provisioned.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/search/collections`;
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
search
  .command(`search-search-documents-get`)
  .description(`Full-text search within one collection using Typesense query parameters as the query string.`)
  .requiredOption(`--collection <collection>`, `Collection key (one the tenant has installed).`)
  .option(`--q <q>`, `Query text. Use \`*\` to match all.`)
  .option(`--query-_by <query-_by>`, `Comma-separated fields to search.`)
  .option(`--filter-_by <filter-_by>`, `Filter expression.`)
  .option(`--sort-_by <sort-_by>`, `Sort expression.`)
  .option(`--page <page>`, `1-based page.`, parseInteger)
  .option(`--per-_page <per-_page>`, `Hits per page (max 250).`, parseInteger)
  .action(
    actionRunner(
      async ({ collection, q, query_by, filter_by, sort_by, page, per_page }) => {
        const _client = await sdkForProject();
        const _apiPath = `/search/collections/{collection}/documents/search`.replace(`{collection}`, collection);
        const _payload: RequestParams = {};
        if (q !== undefined) {
          _payload[`q`] = q;
        }
        if (query_by !== undefined) {
          _payload[`query_by`] = query_by;
        }
        if (filter_by !== undefined) {
          _payload[`filter_by`] = filter_by;
        }
        if (sort_by !== undefined) {
          _payload[`sort_by`] = sort_by;
        }
        if (page !== undefined) {
          _payload[`page`] = page;
        }
        if (per_page !== undefined) {
          _payload[`per_page`] = per_page;
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
search
  .command(`search-search-documents`)
  .description(`Full-text search within one collection. The body holds Typesense search parameters.`)
  .requiredOption(`--collection <collection>`, `Collection key (one the tenant has installed).`)
  .option(`--facet-_by <facet-_by>`, `Comma-separated fields to facet on.`)
  .option(`--filter-_by <filter-_by>`, `Filter expression, e.g. \`in_stock:=true\`.`)
  .option(`--page <page>`, ``, parseInteger)
  .option(`--per-_page <per-_page>`, ``, parseInteger)
  .option(`--q <q>`, `Query text. Use \`*\` to match all.`)
  .option(`--query-_by <query-_by>`, `Comma-separated fields to search.`)
  .option(`--sort-_by <sort-_by>`, `Sort expression, e.g. \`price:desc\`.`)
  .action(
    actionRunner(
      async ({ collection, facet_by, filter_by, page, per_page, q, query_by, sort_by }) => {
        const _client = await sdkForProject();
        const _apiPath = `/search/collections/{collection}/documents/search`.replace(`{collection}`, collection);
        const _payload: RequestParams = {};
        if (facet_by !== undefined) {
          _payload[`facet_by`] = facet_by;
        }
        if (filter_by !== undefined) {
          _payload[`filter_by`] = filter_by;
        }
        if (page !== undefined) {
          _payload[`page`] = page;
        }
        if (per_page !== undefined) {
          _payload[`per_page`] = per_page;
        }
        if (q !== undefined) {
          _payload[`q`] = q;
        }
        if (query_by !== undefined) {
          _payload[`query_by`] = query_by;
        }
        if (sort_by !== undefined) {
          _payload[`sort_by`] = sort_by;
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
search
  .command(`search-get-document`)
  .description(`Fetch a single document by id from a collection the tenant has installed.`)
  .requiredOption(`--collection <collection>`, `Collection key (one the tenant has installed).`)
  .requiredOption(`--document-id <document-id>`, `Document id within the collection.`)
  .action(
    actionRunner(
      async ({ collection, documentId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/search/collections/{collection}/documents/{documentId}`.replace(`{collection}`, collection).replace(`{documentId}`, documentId);
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
search
  .command(`search-multi-search`)
  .description(`Run several searches in one request (the InstantSearch adapter uses this). Each entry names its collection.`)
  .requiredOption(`--searches [searches...]`, ``)
  .action(
    actionRunner(
      async ({ searches }) => {
        const _client = await sdkForProject();
        const _apiPath = `/search/multi_search`;
        const _payload: RequestParams = {};
        if (searches !== undefined) {
          _payload[`searches`] = searches;
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
