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

export const pagesDelivery = new Command("pages-delivery")
  .description(
    commandDescriptions["pagesDelivery"] ??
      `What a storefront calls, and the group to start in if you are building a theme. Four read-only routes, no editorial concepts in any of them: resolve one published page by slug or id into a ready-to-render block tree, list the published pages for routing and sitemaps, read the navigation menus, and resolve a share token into the CURRENT unpublished state for a preview link. These serve the published revision — not the live rows — with the requested language filled in from its fallback chain, block-level publish windows applied and library references expanded, so a renderer needs no second call and no knowledge of how any of it was authored.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const menusSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. A column this entity does not have, or any other shape, is refused with 400.", type: "string", required: false },
];
pagesDelivery
  .command(`menus`)
  .description(`One call gives a theme its whole chrome: header, footer and account navigation, each under the key the theme looks it up by. This route reads no filter — fetch all of them once and index by \`id\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. A column this entity does not have, or any other shape, is refused with 400.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order } = await promptForMissing(
          _options,
          menusSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/delivery/menus`;
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
registerPromptSpecs(pagesDelivery.commands.at(-1)!, menusSpecs, { method: "get" });
const pageSpecs: PromptSpec[] = [
  { key: "slug", option: "--slug <slug>", name: "slug", description: "The page slug, or the slug of one of its translations, without a leading slash — the path segment the storefront routes. Either this or `id`.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "The page id, for a storefront that already holds one (from `GET /pages/delivery/pages`). Either this or `slug`.", type: "string", required: false },
  { key: "langcode", option: "--langcode <langcode>", name: "langcode", description: "Language to resolve the tree for, e.g. `de`. Falls back to the page's source language per field, so a partly translated page still renders whole.", type: "string", required: false },
];
pagesDelivery
  .command(`page`)
  .description(`What a storefront calls to render a URL: \`GET /pages/delivery/page?slug=about-us&langcode=de\`. Send exactly one selector — \`slug\` or \`id\`. \`slug\` is matched against the page and then against its translations, so a localized URL resolves to its page. Only the PUBLISHED revision is served, so an edit in progress never leaks. What comes back is finished rather than raw: \`langcode\` is resolved field by field with the page's source language behind it, blocks whose publish window has not opened or has already closed are left out, and every library reference is expanded into the subtree it points at — so a renderer walks the tree it is given and makes no second call for any of it.`)
  .option(`--slug <slug>`, `The page slug, or the slug of one of its translations, without a leading slash — the path segment the storefront routes. Either this or \`id\`.`)
  .option(`--id <id>`, `The page id, for a storefront that already holds one (from \`GET /pages/delivery/pages\`). Either this or \`slug\`.`)
  .option(`--langcode <langcode>`, `Language to resolve the tree for, e.g. \`de\`. Falls back to the page's source language per field, so a partly translated page still renders whole.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { slug, id, langcode } = await promptForMissing(
          _options,
          pageSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/delivery/page`;
        const _payload: RequestParams = {};
        if (slug !== undefined) {
          _payload[`slug`] = slug;
        }
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (langcode !== undefined) {
          _payload[`langcode`] = langcode;
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
registerPromptSpecs(pagesDelivery.commands.at(-1)!, pageSpecs, { method: "get" });
const pagesSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 100, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. A column this entity does not have, or any other shape, is refused with 400.", type: "string", required: false },
  { key: "bundle", option: "--bundle <bundle>", name: "bundle", description: "Exact page type — how a theme asks for just its landing pages. The value set belongs to the active theme.", type: "string", required: false },
];
pagesDelivery
  .command(`pages`)
  .description(`The route a sitemap, a static build or a link picker is generated from. Only published pages, never a soft-deleted one — \`filter\` echoes both predicates the route applies on its own. A \`?status=\` of your own is ignored: this route is the published view by definition.`)
  .option(`--limit <limit>`, `Page size (default 100, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. A column this entity does not have, or any other shape, is refused with 400.`)
  .option(`--bundle <bundle>`, `Exact page type — how a theme asks for just its landing pages. The value set belongs to the active theme.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, bundle } = await promptForMissing(
          _options,
          pagesSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/delivery/pages`;
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
        if (bundle !== undefined) {
          _payload[`bundle`] = bundle;
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
registerPromptSpecs(pagesDelivery.commands.at(-1)!, pagesSpecs, { method: "get" });
const previewSpecs: PromptSpec[] = [
  { key: "token", option: "--token <token>", name: "token", description: "The token handed out by POST /pages/editor/{page_id}/preview-grant.", type: "string", required: true, secret: true },
  { key: "langcode", option: "--langcode <langcode>", name: "langcode", description: "Language to resolve the tree for. Falls back to the page's source language, per field.", type: "string", required: false },
];
pagesDelivery
  .command(`preview`)
  .description(`The same shape \`GET /pages/delivery/page\` answers, built from the UNPUBLISHED working copy instead of the published revision — so a reviewer without an editor account sees exactly what the storefront would render.`)
  .option(`--token <token>`, `The token handed out by POST /pages/editor/{page_id}/preview-grant.`)
  .option(`--langcode <langcode>`, `Language to resolve the tree for. Falls back to the page's source language, per field.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { token, langcode } = await promptForMissing(
          _options,
          previewSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/delivery/preview/{token}`.replace(`{token}`, token);
        const _payload: RequestParams = {};
        if (langcode !== undefined) {
          _payload[`langcode`] = langcode;
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
registerPromptSpecs(pagesDelivery.commands.at(-1)!, previewSpecs, { method: "get" });
