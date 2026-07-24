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

export const search = new Command("search")
  .description(
    commandDescriptions["search"] ??
      `Read-only full-text search over the tenant's installed collections.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listCollectionsSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
search
  .command(`list-collections`)
  .description(`The collections the tenant's installed apps have provisioned.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { filter } = await promptForMissing(
          _options,
          listCollectionsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/search/collections`;
        const _payload: RequestParams = {};
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
registerPromptSpecs(search.commands.at(-1)!, listCollectionsSpecs, { method: "get" });
const searchDocumentsGetSpecs: PromptSpec[] = [
  { key: "collection", option: "--collection <collection>", name: "collection", description: "Collection key (one the tenant has installed).", type: "string", required: true, enum: ["greetings","products"], resource: { listPath: "/search/collections", hasLimit: false } },
  { key: "q", option: "--q <q>", name: "q", description: "Query text. Use `*` to match all.", type: "string", required: false },
  { key: "queryBy", option: "--query-by <query-by>", name: "query_by", description: "Comma-separated fields to search.", type: "string", required: false },
  { key: "filterBy", option: "--filter-by <filter-by>", name: "filter_by", description: "Filter expression.", type: "string", required: false },
  { key: "sortBy", option: "--sort-by <sort-by>", name: "sort_by", description: "Sort expression.", type: "string", required: false },
  { key: "page", option: "--page <page>", name: "page", description: "1-based page.", type: "integer", required: false },
  { key: "perPage", option: "--per-page <per-page>", name: "per_page", description: "Hits per page (max 250).", type: "integer", required: false },
];
search
  .command(`search-documents-get`)
  .description(`Full-text search within one collection using Typesense query parameters as the query string.`)
  .option(`--collection <collection>`, `Collection key (one the tenant has installed).`)
  .option(`--q <q>`, `Query text. Use \`*\` to match all.`)
  .option(`--query-by <query-by>`, `Comma-separated fields to search.`)
  .option(`--filter-by <filter-by>`, `Filter expression.`)
  .option(`--sort-by <sort-by>`, `Sort expression.`)
  .option(`--page <page>`, `1-based page.`, parseInteger)
  .option(`--per-page <per-page>`, `Hits per page (max 250).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { collection, q, queryBy, filterBy, sortBy, page, perPage } = await promptForMissing(
          _options,
          searchDocumentsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/search/collections/{collection}/documents/search`.replace(`{collection}`, collection);
        const _payload: RequestParams = {};
        if (q !== undefined) {
          _payload[`q`] = q;
        }
        if (queryBy !== undefined) {
          _payload[`query_by`] = queryBy;
        }
        if (filterBy !== undefined) {
          _payload[`filter_by`] = filterBy;
        }
        if (sortBy !== undefined) {
          _payload[`sort_by`] = sortBy;
        }
        if (page !== undefined) {
          _payload[`page`] = page;
        }
        if (perPage !== undefined) {
          _payload[`per_page`] = perPage;
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
registerPromptSpecs(search.commands.at(-1)!, searchDocumentsGetSpecs, { method: "get" });
const searchDocumentsSpecs: PromptSpec[] = [
  { key: "collection", option: "--collection <collection>", name: "collection", description: "Collection key (one the tenant has installed).", type: "string", required: true, enum: ["greetings","products"], resource: { listPath: "/search/collections", hasLimit: false } },
  { key: "facetBy", option: "--facet-by <facet-by>", name: "facet_by", description: "Comma-separated fields to facet on.", type: "string", required: false },
  { key: "filterBy", option: "--filter-by <filter-by>", name: "filter_by", description: "Filter expression, e.g. `in_stock:=true`.", type: "string", required: false },
  { key: "page", option: "--page <page>", name: "page", type: "integer", required: false },
  { key: "perPage", option: "--per-page <per-page>", name: "per_page", type: "integer", required: false },
  { key: "q", option: "--q <q>", name: "q", description: "Query text. Use `*` to match all.", type: "string", required: false },
  { key: "queryBy", option: "--query-by <query-by>", name: "query_by", description: "Comma-separated fields to search.", type: "string", required: false },
  { key: "sortBy", option: "--sort-by <sort-by>", name: "sort_by", description: "Sort expression, e.g. `price:desc`.", type: "string", required: false },
];
search
  .command(`search-documents`)
  .description(`Full-text search within one collection. The body holds Typesense search parameters.`)
  .option(`--collection <collection>`, `Collection key (one the tenant has installed).`)
  .option(`--facet-by <facet-by>`, `Comma-separated fields to facet on.`)
  .option(`--filter-by <filter-by>`, `Filter expression, e.g. \`in_stock:=true\`.`)
  .option(`--page <page>`, ``, parseInteger)
  .option(`--per-page <per-page>`, ``, parseInteger)
  .option(`--q <q>`, `Query text. Use \`*\` to match all.`)
  .option(`--query-by <query-by>`, `Comma-separated fields to search.`)
  .option(`--sort-by <sort-by>`, `Sort expression, e.g. \`price:desc\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { collection, facetBy, filterBy, page, perPage, q, queryBy, sortBy } = await promptForMissing(
          _options,
          searchDocumentsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/search/collections/{collection}/documents/search`.replace(`{collection}`, collection);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (facetBy !== undefined) {
          _payload[`facet_by`] = facetBy;
        }
        if (filterBy !== undefined) {
          _payload[`filter_by`] = filterBy;
        }
        if (page !== undefined) {
          _payload[`page`] = page;
        }
        if (perPage !== undefined) {
          _payload[`per_page`] = perPage;
        }
        if (q !== undefined) {
          _payload[`q`] = q;
        }
        if (queryBy !== undefined) {
          _payload[`query_by`] = queryBy;
        }
        if (sortBy !== undefined) {
          _payload[`sort_by`] = sortBy;
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
registerPromptSpecs(search.commands.at(-1)!, searchDocumentsSpecs, { method: "post" });
const getDocumentSpecs: PromptSpec[] = [
  { key: "collection", option: "--collection <collection>", name: "collection", description: "Collection key (one the tenant has installed).", type: "string", required: true, enum: ["greetings","products"], resource: { listPath: "/search/collections", hasLimit: false } },
  { key: "documentId", option: "--document-id <document-id>", name: "documentId", description: "Document id within the collection.", type: "string", required: true },
];
search
  .command(`get-document`)
  .description(`Fetch a single document by id from a collection the tenant has installed.`)
  .option(`--collection <collection>`, `Collection key (one the tenant has installed).`)
  .option(`--document-id <document-id>`, `Document id within the collection.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { collection, documentId } = await promptForMissing(
          _options,
          getDocumentSpecs,
          _command,
        );
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
registerPromptSpecs(search.commands.at(-1)!, getDocumentSpecs, { method: "get" });
const multiSearchSpecs: PromptSpec[] = [
  { key: "searches", option: "--searches [searches...]", name: "searches", type: "array", required: true },
];
search
  .command(`multi-search`)
  .description(`Run several searches in one request (the InstantSearch adapter uses this). Each entry names its collection.`)
  .option(`--searches [searches...]`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { searches } = await promptForMissing(
          _options,
          multiSearchSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/search/multi_search`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
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
registerPromptSpecs(search.commands.at(-1)!, multiSearchSpecs, { method: "post" });
