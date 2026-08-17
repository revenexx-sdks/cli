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
  .description(`The collections the tenant's installed apps have provisioned. Available on the API-gateway-trust path only — a \`revx_\` key authorises a single collection, so discovery is a gateway concern and a key-authenticated caller gets 403.`)
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
const getCollectionSpecs: PromptSpec[] = [
  { key: "collection", option: "--collection <collection>", name: "collection", description: "A collection the tenant owns (see `GET /api/v1/collections`). Resolved to its namespaced Typesense name server-side; a collection the tenant does not own is a 404.", type: "string", required: true, enum: ["products"], resource: { listPath: "/search/collections", hasLimit: false } },
];
search
  .command(`get-collection`)
  .description(`Returns the Typesense collection definition (fields, defaults, document count). Requires the \`collections:read\` action.`)
  .option(`--collection <collection>`, `A collection the tenant owns (see \`GET /api/v1/collections\`). Resolved to its namespaced Typesense name server-side; a collection the tenant does not own is a 404.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { collection } = await promptForMissing(
          _options,
          getCollectionSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/search/collections/{collection}`.replace(`{collection}`, collection);
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
registerPromptSpecs(search.commands.at(-1)!, getCollectionSpecs, { method: "get" });
const searchDocumentsGetSpecs: PromptSpec[] = [
  { key: "collection", option: "--collection <collection>", name: "collection", description: "A collection the tenant owns (see `GET /api/v1/collections`). Resolved to its namespaced Typesense name server-side; a collection the tenant does not own is a 404.", type: "string", required: true, enum: ["products"], resource: { listPath: "/search/collections", hasLimit: false } },
  { key: "q", option: "--q <q>", name: "q", description: "Query text. Use `*` to match everything.", type: "string", required: false },
  { key: "queryBy", option: "--query-by <query-by>", name: "query_by", description: "Comma-separated fields to search, in weight order.", type: "string", required: false },
  { key: "filterBy", option: "--filter-by <filter-by>", name: "filter_by", description: "Filter expression, e.g. `in_stock:=true && price:<100`. ANDed with the tenant filter the proxy injects.", type: "string", required: false },
  { key: "sortBy", option: "--sort-by <sort-by>", name: "sort_by", description: "Sort expression, e.g. `price:desc`.", type: "string", required: false },
  { key: "facetBy", option: "--facet-by <facet-by>", name: "facet_by", description: "Comma-separated fields to facet on.", type: "string", required: false },
  { key: "maxFacetValues", option: "--max-facet-values <max-facet-values>", name: "max_facet_values", description: "Facet values to return per field.", type: "integer", required: false },
  { key: "groupBy", option: "--group-by <group-by>", name: "group_by", description: "Comma-separated fields to group results by.", type: "string", required: false },
  { key: "includeFields", option: "--include-fields <include-fields>", name: "include_fields", description: "Comma-separated document fields to return.", type: "string", required: false },
  { key: "excludeFields", option: "--exclude-fields <exclude-fields>", name: "exclude_fields", description: "Comma-separated document fields to omit.", type: "string", required: false },
  { key: "highlightFullFields", option: "--highlight-full-fields <highlight-full-fields>", name: "highlight_full_fields", description: "Comma-separated fields to highlight in full.", type: "string", required: false },
  { key: "numTypos", option: "--num-typos <num-typos>", name: "num_typos", description: "Typos tolerated per query token.", type: "integer", required: false },
  { key: "prefix", option: "--prefix <prefix>", name: "prefix", description: "Whether the last token is a prefix; per-field when comma-separated.", type: "string", required: false },
  { key: "page", option: "--page <page>", name: "page", description: "1-based page number.", type: "integer", required: false },
  { key: "perPage", option: "--per-page <per-page>", name: "per_page", description: "Hits per page.", type: "integer", required: false },
];
search
  .command(`search-documents-get`)
  .description(`Full-text search within one collection. Typesense search parameters are passed through verbatim as the query string, so parameters not listed here still reach Typesense. Requires the \`documents:search\` action.`)
  .option(`--collection <collection>`, `A collection the tenant owns (see \`GET /api/v1/collections\`). Resolved to its namespaced Typesense name server-side; a collection the tenant does not own is a 404.`)
  .option(`--q <q>`, `Query text. Use \`*\` to match everything.`)
  .option(`--query-by <query-by>`, `Comma-separated fields to search, in weight order.`)
  .option(`--filter-by <filter-by>`, `Filter expression, e.g. \`in_stock:=true && price:<100\`. ANDed with the tenant filter the proxy injects.`)
  .option(`--sort-by <sort-by>`, `Sort expression, e.g. \`price:desc\`.`)
  .option(`--facet-by <facet-by>`, `Comma-separated fields to facet on.`)
  .option(`--max-facet-values <max-facet-values>`, `Facet values to return per field.`, parseInteger)
  .option(`--group-by <group-by>`, `Comma-separated fields to group results by.`)
  .option(`--include-fields <include-fields>`, `Comma-separated document fields to return.`)
  .option(`--exclude-fields <exclude-fields>`, `Comma-separated document fields to omit.`)
  .option(`--highlight-full-fields <highlight-full-fields>`, `Comma-separated fields to highlight in full.`)
  .option(`--num-typos <num-typos>`, `Typos tolerated per query token.`, parseInteger)
  .option(`--prefix <prefix>`, `Whether the last token is a prefix; per-field when comma-separated.`)
  .option(`--page <page>`, `1-based page number.`, parseInteger)
  .option(`--per-page <per-page>`, `Hits per page.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { collection, q, queryBy, filterBy, sortBy, facetBy, maxFacetValues, groupBy, includeFields, excludeFields, highlightFullFields, numTypos, prefix, page, perPage } = await promptForMissing(
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
        if (facetBy !== undefined) {
          _payload[`facet_by`] = facetBy;
        }
        if (maxFacetValues !== undefined) {
          _payload[`max_facet_values`] = maxFacetValues;
        }
        if (groupBy !== undefined) {
          _payload[`group_by`] = groupBy;
        }
        if (includeFields !== undefined) {
          _payload[`include_fields`] = includeFields;
        }
        if (excludeFields !== undefined) {
          _payload[`exclude_fields`] = excludeFields;
        }
        if (highlightFullFields !== undefined) {
          _payload[`highlight_full_fields`] = highlightFullFields;
        }
        if (numTypos !== undefined) {
          _payload[`num_typos`] = numTypos;
        }
        if (prefix !== undefined) {
          _payload[`prefix`] = prefix;
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
  { key: "collection", option: "--collection <collection>", name: "collection", description: "A collection the tenant owns (see `GET /api/v1/collections`). Resolved to its namespaced Typesense name server-side; a collection the tenant does not own is a 404.", type: "string", required: true, enum: ["products"], resource: { listPath: "/search/collections", hasLimit: false } },
  { key: "excludeFields", option: "--exclude-fields <exclude-fields>", name: "exclude_fields", description: "Comma-separated document fields to omit.", type: "string", required: false },
  { key: "facetBy", option: "--facet-by <facet-by>", name: "facet_by", description: "Comma-separated fields to facet on.", type: "string", required: false },
  { key: "filterBy", option: "--filter-by <filter-by>", name: "filter_by", description: "Filter expression, e.g. `in_stock:=true && price:<100`. ANDed with the tenant filter the proxy injects.", type: "string", required: false },
  { key: "groupBy", option: "--group-by <group-by>", name: "group_by", description: "Comma-separated fields to group results by.", type: "string", required: false },
  { key: "highlightFullFields", option: "--highlight-full-fields <highlight-full-fields>", name: "highlight_full_fields", description: "Comma-separated fields to highlight in full.", type: "string", required: false },
  { key: "includeFields", option: "--include-fields <include-fields>", name: "include_fields", description: "Comma-separated document fields to return.", type: "string", required: false },
  { key: "maxFacetValues", option: "--max-facet-values <max-facet-values>", name: "max_facet_values", description: "Facet values to return per field.", type: "integer", required: false },
  { key: "numTypos", option: "--num-typos <num-typos>", name: "num_typos", description: "Typos tolerated per query token.", type: "integer", required: false },
  { key: "page", option: "--page <page>", name: "page", description: "1-based page number.", type: "integer", required: false },
  { key: "perPage", option: "--per-page <per-page>", name: "per_page", description: "Hits per page.", type: "integer", required: false },
  { key: "prefix", option: "--prefix <prefix>", name: "prefix", description: "Whether the last token is a prefix; per-field when comma-separated.", type: "string", required: false },
  { key: "q", option: "--q <q>", name: "q", description: "Query text. Use `*` to match everything.", type: "string", required: false },
  { key: "queryBy", option: "--query-by <query-by>", name: "query_by", description: "Comma-separated fields to search, in weight order.", type: "string", required: false },
  { key: "sortBy", option: "--sort-by <sort-by>", name: "sort_by", description: "Sort expression, e.g. `price:desc`.", type: "string", required: false },
];
search
  .command(`search-documents`)
  .description(`Full-text search within one collection, with the Typesense search parameters in the body. Requires the \`documents:search\` action.`)
  .option(`--collection <collection>`, `A collection the tenant owns (see \`GET /api/v1/collections\`). Resolved to its namespaced Typesense name server-side; a collection the tenant does not own is a 404.`)
  .option(`--exclude-fields <exclude-fields>`, `Comma-separated document fields to omit.`)
  .option(`--facet-by <facet-by>`, `Comma-separated fields to facet on.`)
  .option(`--filter-by <filter-by>`, `Filter expression, e.g. \`in_stock:=true && price:<100\`. ANDed with the tenant filter the proxy injects.`)
  .option(`--group-by <group-by>`, `Comma-separated fields to group results by.`)
  .option(`--highlight-full-fields <highlight-full-fields>`, `Comma-separated fields to highlight in full.`)
  .option(`--include-fields <include-fields>`, `Comma-separated document fields to return.`)
  .option(`--max-facet-values <max-facet-values>`, `Facet values to return per field.`, parseInteger)
  .option(`--num-typos <num-typos>`, `Typos tolerated per query token.`, parseInteger)
  .option(`--page <page>`, `1-based page number.`, parseInteger)
  .option(`--per-page <per-page>`, `Hits per page.`, parseInteger)
  .option(`--prefix <prefix>`, `Whether the last token is a prefix; per-field when comma-separated.`)
  .option(`--q <q>`, `Query text. Use \`*\` to match everything.`)
  .option(`--query-by <query-by>`, `Comma-separated fields to search, in weight order.`)
  .option(`--sort-by <sort-by>`, `Sort expression, e.g. \`price:desc\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { collection, excludeFields, facetBy, filterBy, groupBy, highlightFullFields, includeFields, maxFacetValues, numTypos, page, perPage, prefix, q, queryBy, sortBy } = await promptForMissing(
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
        if (excludeFields !== undefined) {
          _payload[`exclude_fields`] = excludeFields;
        }
        if (facetBy !== undefined) {
          _payload[`facet_by`] = facetBy;
        }
        if (filterBy !== undefined) {
          _payload[`filter_by`] = filterBy;
        }
        if (groupBy !== undefined) {
          _payload[`group_by`] = groupBy;
        }
        if (highlightFullFields !== undefined) {
          _payload[`highlight_full_fields`] = highlightFullFields;
        }
        if (includeFields !== undefined) {
          _payload[`include_fields`] = includeFields;
        }
        if (maxFacetValues !== undefined) {
          _payload[`max_facet_values`] = maxFacetValues;
        }
        if (numTypos !== undefined) {
          _payload[`num_typos`] = numTypos;
        }
        if (page !== undefined) {
          _payload[`page`] = page;
        }
        if (perPage !== undefined) {
          _payload[`per_page`] = perPage;
        }
        if (prefix !== undefined) {
          _payload[`prefix`] = prefix;
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
  { key: "collection", option: "--collection <collection>", name: "collection", description: "A collection the tenant owns (see `GET /api/v1/collections`). Resolved to its namespaced Typesense name server-side; a collection the tenant does not own is a 404.", type: "string", required: true, enum: ["products"], resource: { listPath: "/search/collections", hasLimit: false } },
  { key: "documentId", option: "--document-id <document-id>", name: "documentId", description: "The document's `id` within the collection.", type: "string", required: true },
];
search
  .command(`get-document`)
  .description(`Fetch a single document by id. The document shape is the collection's own schema, so it is described as a free-form object. Requires the \`documents:get\` action.`)
  .option(`--collection <collection>`, `A collection the tenant owns (see \`GET /api/v1/collections\`). Resolved to its namespaced Typesense name server-side; a collection the tenant does not own is a 404.`)
  .option(`--document-id <document-id>`, `The document's \`id\` within the collection.`)
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
const gatewayFacetResyncSpecs: PromptSpec[] = [
  { key: "app", option: "--app <app>", name: "app", type: "string", required: false },
  { key: "vendor", option: "--vendor <vendor>", name: "vendor", type: "string", required: false },
];
search
  .command(`gateway-facet-resync`)
  .description(`Idempotent, and bounded by the tenant's own configuration: it can add
no field for an attribute the tenant has not marked \`is_filterable\`,
and drops only fields whose attribute it has itself un-marked. A run
that changes nothing makes zero calls to Typesense.

Body (optional) narrows the sweep to one app:

    {"vendor": "revenexx", "app": "products"}

Omitted, every app the tenant has installed is swept. Apps outside the
facet-sync allowlist are included in the response with
\`skipped: app_not_enabled\` rather than silently dropped — a caller
asking for an app that cannot have facets deserves to be told so.

The response shape below is DECLARED rather than inferred. Its entries
are built by spreading AttributeFacetSyncer::syncForCollection()'s
summary, and the generator cannot see through an array spread: left to
itself it emits an unnamed property and a null in \`required\`, which
Spectral rejects as \`"1" property must be string\`.
AppController::resyncFacets() carries the same declaration for the same
reason — keep both in step with syncForApp()'s return type.`)
  .option(`--app <app>`, ``)
  .option(`--vendor <vendor>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { app, vendor } = await promptForMissing(
          _options,
          gatewayFacetResyncSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/search/facets/resync`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (app !== undefined) {
          _payload[`app`] = app;
        }
        if (vendor !== undefined) {
          _payload[`vendor`] = vendor;
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
registerPromptSpecs(search.commands.at(-1)!, gatewayFacetResyncSpecs, { method: "post" });
const multiSearchSpecs: PromptSpec[] = [
  { key: "searches", option: "--searches [searches...]", name: "searches", description: "The searches to run, in order. Must not be empty.", type: "array", required: true },
];
search
  .command(`multi-search`)
  .description(`Run several searches in one round trip — the endpoint the typesense-js \`multiSearch\` helper and the InstantSearch adapter use for every query. On the gateway-trust path each entry must name a collection the tenant owns. With a \`revx_\` key \`collection_name\` is optional and is forced to the key's own collection. Requires the \`documents:search\` action.`)
  .option(`--searches [searches...]`, `The searches to run, in order. Must not be empty.`)
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
