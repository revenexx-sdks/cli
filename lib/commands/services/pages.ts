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

export const pages = new Command("pages")
  .description(
    commandDescriptions["pages"] ??
      `The records this app stores, addressed by id and edited outside the visual editor: pages and their publish history, the menus a theme renders as navigation, the block templates a new page can start from, the library of block subtrees many pages share, and the one seeding call a theme activation hook fires. A page here is its METADATA — title, slug, status, type — never its blocks; the blocks live in the editor group, because changing one is a mutation and not a field update. The vocabularies that name the permitted values of a status column are here too.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const libraryListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 24, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. A column this entity does not have, or any other shape, is refused with 400.", type: "string", required: false },
  { key: "bundles", option: "--bundles <bundles>", name: "bundles", description: "Comma-separated block types; an item matching any of them is returned. Note the plural — `?bundle=` (singular) is not read by this route and is ignored. Empty means no filter.", type: "string", required: false },
  { key: "text", option: "--text <text>", name: "text", description: "Case-insensitive substring search over the item label. Runs in the query, so `page.total` counts the matches. Empty means no search.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
pages
  .command(`library-list`)
  .description(`The pool an editor picks a reusable block from. A library item is ONE block subtree that many pages share BY REFERENCE — edit the item and every page using it changes — which is what separates it from a template, the other reusable thing here, which copies instead and is at \`GET /pages/templates\`. So the two filters are the two questions the picker asks: \`bundles\` narrows to the block types that fit the field being filled, \`text\` matches the label a person gave the item.`)
  .option(`--limit <limit>`, `Page size (default 24, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. A column this entity does not have, or any other shape, is refused with 400.`)
  .option(`--bundles <bundles>`, `Comma-separated block types; an item matching any of them is returned. Note the plural — \`?bundle=\` (singular) is not read by this route and is ignored. Empty means no filter.`)
  .option(`--text <text>`, `Case-insensitive substring search over the item label. Runs in the query, so \`page.total\` counts the matches. Empty means no search.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, bundles, text, filter } = await promptForMissing(
          _options,
          libraryListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/library`;
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
        if (bundles !== undefined) {
          _payload[`bundles`] = bundles;
        }
        if (text !== undefined) {
          _payload[`text`] = text;
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
registerPromptSpecs(pages.commands.at(-1)!, libraryListSpecs, { method: "get" });
const libraryDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The library item id.", type: "string", required: true, resource: { listPath: "/pages/library", hasLimit: true } },
];
pages
  .command(`library-delete`)
  .description(`Retires a reusable block. It leaves the picker and every list, but the blocks pointing at it keep their \`library_item_id\` — the FK's \`set null\` belongs to a hard delete, and this writes a tombstone. Delivery then skips the expansion for a struck item rather than failing on it, so a page that used it falls back to the block content stored in its own published revision: nothing breaks, but the pages quietly stop tracking each other. Nothing here tells you which pages those are, so establish that before striking it.`)
  .option(`--id <id>`, `The library item id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          libraryDeleteSpecs,
          _command,
        );
        await confirmDestructive(`pages library-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/pages/library/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(pages.commands.at(-1)!, libraryDeleteSpecs, { method: "delete", destructive: true });
const libraryGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The library item id.", type: "string", required: true, resource: { listPath: "/pages/library", hasLimit: true } },
];
pages
  .command(`library-get`)
  .description(`The stored subtree behind one reusable block, so a picker can preview what dropping it into a page would produce. Because delivery expands the reference against THIS row at read time, what comes back is also what every page already using the item is currently rendering — which makes this the call to make before editing one.`)
  .option(`--id <id>`, `The library item id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          libraryGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/library/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(pages.commands.at(-1)!, libraryGetSpecs, { method: "get" });
const libraryUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The library item id.", type: "string", required: true, resource: { listPath: "/pages/library", hasLimit: true } },
  { key: "bundle", option: "--bundle <bundle>", name: "bundle", description: "The block type this item instantiates. Changing it moves the item to a different part of the picker.", type: "string", required: false },
  { key: "label", option: "--label <label>", name: "label", description: "What the item is called in the picker.", type: "string", required: false },
  { key: "tree", option: "--tree <tree>", name: "tree", description: "A block and its whole subtree, serialized. Produced by the editor when a selection is made reusable or saved as a template, and instantiated back into real blocks when one is inserted.", type: "object", required: false },
];
pages
  .command(`library-update`)
  .description(`The one write in this app whose blast radius is not a single page. Delivery expands a library reference against this row every time it serves, so replacing \`tree\` re-renders every page that points at the item — published ones included — without any of them being edited, republished or even touched. Nothing warns you first and no revision records it, because the pages did not change; the item did. Changing \`label\` or \`bundle\` only moves the item around the picker. Detaching one page from the item, so it keeps a copy of its own, is an editor mutation and not this route.`)
  .option(`--id <id>`, `The library item id.`)
  .option(`--bundle <bundle>`, `The block type this item instantiates. Changing it moves the item to a different part of the picker.`)
  .option(`--label <label>`, `What the item is called in the picker.`)
  .option(`--tree <tree>`, `A block and its whole subtree, serialized. Produced by the editor when a selection is made reusable or saved as a template, and instantiated back into real blocks when one is inserted.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, bundle, label, tree } = await promptForMissing(
          _options,
          libraryUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/library/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (bundle !== undefined) {
          _payload[`bundle`] = bundle;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (tree !== undefined) {
          _payload[`tree`] = resolveBodyParam(tree);
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
registerPromptSpecs(pages.commands.at(-1)!, libraryUpdateSpecs, { method: "put" });
const menusListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. A column this entity does not have, or any other shape, is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
pages
  .command(`menus-list`)
  .description(`The management view of the menus a tenant keeps — \`main\`, \`footer\`, \`account\` and whatever else the theme asks for, each with the key it is looked up by. This route reads no filter at all — a \`?menu_key=\` is ignored, which the empty \`filter\` echo shows — so fetch a page and pick, or address one by id.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. A column this entity does not have, or any other shape, is refused with 400.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, filter } = await promptForMissing(
          _options,
          menusListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/menus`;
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
registerPromptSpecs(pages.commands.at(-1)!, menusListSpecs, { method: "get" });
const menusUpsertSpecs: PromptSpec[] = [
  { key: "label", option: "--label <label>", name: "label", description: "What this menu is called for the people who edit it. Required on a create; an update keeps the label it had when this is left out.", type: "string", required: true },
  { key: "menuKey", option: "--menu-key <menu-key>", name: "menuKey", description: "The stable slot the theme asks for this menu by. Idempotency is keyed on it: sending an existing key replaces that menu instead of creating a second one.", type: "string", required: true },
  { key: "items", option: "--items [items...]", name: "items", description: "The ordered navigation tree. Replaces the stored one completely.", type: "array", required: false },
];
pages
  .command(`menus-upsert`)
  .description(`Writes a menu by its KEY rather than by its id, which is what makes theme seeding safe to repeat: a key the tenant already has has its label and items replaced in place, a key it does not have is created. \`items\` is replaced wholesale and never merged, so sending an empty list empties the navigation. One caveat worth reading before you rely on the idempotence: the key's uniqueness is this route's doing and not the database's — \`menu_key\` carries an index but no unique constraint — so a duplicate key created any other way leaves this route updating whichever row it finds first.`)
  .option(`--label <label>`, `What this menu is called for the people who edit it. Required on a create; an update keeps the label it had when this is left out.`)
  .option(`--menu-key <menu-key>`, `The stable slot the theme asks for this menu by. Idempotency is keyed on it: sending an existing key replaces that menu instead of creating a second one.`)
  .option(`--items [items...]`, `The ordered navigation tree. Replaces the stored one completely.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { label, menuKey, items } = await promptForMissing(
          _options,
          menusUpsertSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/menus`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (menuKey !== undefined) {
          _payload[`menuKey`] = menuKey;
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
registerPromptSpecs(pages.commands.at(-1)!, menusUpsertSpecs, { method: "post" });
const menusDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The menu row id.", type: "string", required: true, resource: { listPath: "/pages/menus", hasLimit: true } },
];
pages
  .command(`menus-delete`)
  .description(`Writes the tombstone. The menu drops out of the management list and out of \`GET /pages/delivery/menus\` in the same moment, so a theme that reads its key gets nothing back and renders nothing — there is no fallback and no error a storefront could act on. The key is free immediately, which means re-seeding the theme is the way back. Check what reads the key before striking it.`)
  .option(`--id <id>`, `The menu row id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          menusDeleteSpecs,
          _command,
        );
        await confirmDestructive(`pages menus-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/pages/menus/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(pages.commands.at(-1)!, menusDeleteSpecs, { method: "delete", destructive: true });
const menusGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The menu row id — not the menu key.", type: "string", required: true, resource: { listPath: "/pages/menus", hasLimit: true } },
];
pages
  .command(`menus-get`)
  .description(`One menu and its whole item tree — the ordered links a theme renders as its header, footer or account navigation. \`items\` is nested, not one level, so this is the entire navigation for that key in a single read. Addressed by ROW ID here; the key a theme knows it by is \`menu_key\` on the body, and the route that works by key is the upsert.`)
  .option(`--id <id>`, `The menu row id — not the menu key.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          menusGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/menus/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(pages.commands.at(-1)!, menusGetSpecs, { method: "get" });
const menusUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The menu row id.", type: "string", required: true, resource: { listPath: "/pages/menus", hasLimit: true } },
  { key: "items", option: "--items [items...]", name: "items", description: "The ordered navigation tree. Replaces the stored one completely.", type: "array", required: false },
  { key: "label", option: "--label <label>", name: "label", description: "What this menu is called for the people who edit it.", type: "string", required: false },
];
pages
  .command(`menus-update`)
  .description(`The same write as the upsert, for a caller that already holds the row id — use this when editing a menu a person picked from a list, and the upsert when reconciling a theme's defaults. \`menu_key\` is deliberately not editable here: the key is the handle every theme reads the menu by, so changing it would empty whatever is rendering that key without anything reporting an error.`)
  .option(`--id <id>`, `The menu row id.`)
  .option(`--items [items...]`, `The ordered navigation tree. Replaces the stored one completely.`)
  .option(`--label <label>`, `What this menu is called for the people who edit it.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, items, label } = await promptForMissing(
          _options,
          menusUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/menus/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
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
registerPromptSpecs(pages.commands.at(-1)!, menusUpdateSpecs, { method: "put" });
const pagesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. A column this entity does not have, or any other shape, is refused with 400.", type: "string", required: false },
  { key: "bundle", option: "--bundle <bundle>", name: "bundle", description: "Exact page type. The value set belongs to the active theme, so this app constrains it to a non-empty string and nothing more.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Exact lifecycle status.", type: "string", required: false, enum: ["draft","published","archived"] },
  { key: "q", option: "--q <q>", name: "q", description: "Case-insensitive substring search over the page title. Runs in the query, so `page.total` counts the matches. Empty means no search.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
pages
  .command(`pages-list`)
  .description(`The EDITORIAL index — every live page of the tenant, whatever its status, newest change first. This is the list the Cockpit shows a person: drafts and archived pages are in it, and a row here says nothing about whether a visitor can see the page, because a published status without a published revision still delivers nothing. A storefront wants \`GET /pages/delivery/pages\` instead, which answers only what is actually servable. Soft-deleted pages are never returned and the predicate is this route's own, not something a caller can switch off.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. A column this entity does not have, or any other shape, is refused with 400.`)
  .option(`--bundle <bundle>`, `Exact page type. The value set belongs to the active theme, so this app constrains it to a non-empty string and nothing more.`)
  .option(`--status <status>`, `Exact lifecycle status.`)
  .option(`--q <q>`, `Case-insensitive substring search over the page title. Runs in the query, so \`page.total\` counts the matches. Empty means no search.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, bundle, status, q, filter } = await promptForMissing(
          _options,
          pagesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/pages`;
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
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (q !== undefined) {
          _payload[`q`] = q;
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
registerPromptSpecs(pages.commands.at(-1)!, pagesListSpecs, { method: "get" });
const pagesCreateSpecs: PromptSpec[] = [
  { key: "title", option: "--title <title>", name: "title", description: "What the page is called, in its source language. Shown in the editorial list and searched by `?q=`.", type: "string", required: true },
  { key: "bundle", option: "--bundle <bundle>", name: "bundle", description: "The page type. Omit to take the default_page_bundle setting.", type: "string", required: false },
  { key: "hostOptions", option: "--host-options <host-options>", name: "hostOptions", description: "Page-level blökkli display options as a flat `option key → value` map. Theme-defined; usually left out and set later from the editor.", type: "object", required: false },
  { key: "meta", option: "--meta <meta>", name: "meta", description: "The page's metadata bag (SEO and social fields). Stored and handed back untouched — this app reads no key of it, so the theme decides what goes in.", type: "object", required: false },
  { key: "slug", option: "--slug <slug>", name: "slug", description: "The path segment the storefront routes it under, without a leading slash. Unique per tenant among live pages; omit or send null for a page reached only by id. Nothing here derives one from the title.", type: "string", required: false },
  { key: "sourceLanguage", option: "--source-language <source-language>", name: "sourceLanguage", description: "The language you are authoring in, and the fallback for every later translation. Omit to take the default_source_language setting for the request market.", type: "string", required: false },
];
pages
  .command(`pages-create`)
  .description(`Writes two rows, not one: the page itself and the translation row for its source language, so a page is never without the language it was authored in and \`GET /pages/delivery/page?slug=\` can match a localized URL from the first moment. Everything the caller leaves out comes from the tenant's settings, not from a literal in this app: \`bundle\` from default_page_bundle, \`sourceLanguage\` from default_source_language (resolved for the request's market), and the status of both the page and its source translation from default_page_status (draft | published).`)
  .option(`--title <title>`, `What the page is called, in its source language. Shown in the editorial list and searched by \`?q=\`.`)
  .option(`--bundle <bundle>`, `The page type. Omit to take the default_page_bundle setting.`)
  .option(`--host-options <host-options>`, `Page-level blökkli display options as a flat \`option key → value\` map. Theme-defined; usually left out and set later from the editor.`)
  .option(`--meta <meta>`, `The page's metadata bag (SEO and social fields). Stored and handed back untouched — this app reads no key of it, so the theme decides what goes in.`)
  .option(`--slug <slug>`, `The path segment the storefront routes it under, without a leading slash. Unique per tenant among live pages; omit or send null for a page reached only by id. Nothing here derives one from the title.`)
  .option(`--source-language <source-language>`, `The language you are authoring in, and the fallback for every later translation. Omit to take the default_source_language setting for the request market.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { title, bundle, hostOptions, meta, slug, sourceLanguage } = await promptForMissing(
          _options,
          pagesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/pages`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (bundle !== undefined) {
          _payload[`bundle`] = bundle;
        }
        if (hostOptions !== undefined) {
          _payload[`hostOptions`] = resolveBodyParam(hostOptions);
        }
        if (meta !== undefined) {
          _payload[`meta`] = resolveBodyParam(meta);
        }
        if (slug !== undefined) {
          _payload[`slug`] = slug;
        }
        if (sourceLanguage !== undefined) {
          _payload[`sourceLanguage`] = sourceLanguage;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
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
registerPromptSpecs(pages.commands.at(-1)!, pagesCreateSpecs, { method: "post" });
const pagesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The page id.", type: "string", required: true, resource: { listPath: "/pages/pages", hasLimit: true } },
];
pages
  .command(`pages-delete`)
  .description(`Writes a tombstone. The page leaves every list, every read and all delivery at once, and its slug is immediately free for another page — the unique index counts live rows only. Nothing is erased: the translations, blocks, edit state, revisions, comments and preview grants that hang off the page all keep their rows, because their \`on delete cascade\` belongs to a hard delete and this is not one. So a page can be brought back intact by clearing \`deleted_at\` — but not through this app, which publishes no route that does it.`)
  .option(`--id <id>`, `The page id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          pagesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`pages pages-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/pages/pages/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(pages.commands.at(-1)!, pagesDeleteSpecs, { method: "delete", destructive: true });
const pagesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The page id.", type: "string", required: true, resource: { listPath: "/pages/pages", hasLimit: true } },
];
pages
  .command(`pages-get`)
  .description(`One page RECORD: what it is called, where it routes, what type it is, which revision is live. Not its content — the blocks are not on this row and no expansion here returns them. The editor reads them with \`GET /pages/editor/{page_id}/state\`, a renderer with \`GET /pages/delivery/page\`. A soft-deleted page answers 404 exactly like one that never existed, so this is also the check for whether an id is still good.`)
  .option(`--id <id>`, `The page id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          pagesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/pages/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(pages.commands.at(-1)!, pagesGetSpecs, { method: "get" });
const pagesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The page id.", type: "string", required: true, resource: { listPath: "/pages/pages", hasLimit: true } },
  { key: "bundle", option: "--bundle <bundle>", name: "bundle", description: "The page type. Changing it changes which template the theme renders.", type: "string", required: false },
  { key: "meta", option: "--meta <meta>", name: "meta", description: "The page's metadata bag. Replaced wholesale, not merged.", type: "object", required: false },
  { key: "slug", option: "--slug <slug>", name: "slug", description: "The path segment the storefront routes it under. Sending a slug another live page holds answers 409; sending null makes the page unreachable by path.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "The lifecycle status. Setting `published` here does NOT publish content — delivery still needs a revision, which only `POST /pages/editor/{page_id}/publish` writes.", type: "string", required: false, enum: ["draft","published","archived"] },
  { key: "title", option: "--title <title>", name: "title", description: "The page title in its source language.", type: "string", required: false },
];
pages
  .command(`pages-update`)
  .description(`Corrects the page RECORD — the five fields an editor changes without opening the visual editor, which are \`title\`, \`slug\`, \`status\`, \`meta\` and \`bundle\`, and no others. Anything else in the body is dropped rather than refused, and the block tree is unreachable from here by design: content moves only through the editor's mutation log, so a caller cannot half-edit a page behind the undo history's back. Two consequences worth knowing before you call it: a slug is unique among live pages, so claiming one that is held answers 409; and setting \`status\` to published does NOT put anything in front of a visitor — delivery needs a revision, which only \`POST /pages/editor/{page_id}/publish\` writes.`)
  .option(`--id <id>`, `The page id.`)
  .option(`--bundle <bundle>`, `The page type. Changing it changes which template the theme renders.`)
  .option(`--meta <meta>`, `The page's metadata bag. Replaced wholesale, not merged.`)
  .option(`--slug <slug>`, `The path segment the storefront routes it under. Sending a slug another live page holds answers 409; sending null makes the page unreachable by path.`)
  .option(`--status <status>`, `The lifecycle status. Setting \`published\` here does NOT publish content — delivery still needs a revision, which only \`POST /pages/editor/{page_id}/publish\` writes.`)
  .option(`--title <title>`, `The page title in its source language.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, bundle, meta, slug, status, title } = await promptForMissing(
          _options,
          pagesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/pages/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (bundle !== undefined) {
          _payload[`bundle`] = bundle;
        }
        if (meta !== undefined) {
          _payload[`meta`] = resolveBodyParam(meta);
        }
        if (slug !== undefined) {
          _payload[`slug`] = slug;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
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
registerPromptSpecs(pages.commands.at(-1)!, pagesUpdateSpecs, { method: "put" });
const pagesRevisionsSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The page whose history to read.", type: "string", required: true, resource: { listPath: "/pages/pages", hasLimit: true } },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. A column this entity does not have, or any other shape, is refused with 400.", type: "string", required: false },
  { key: "label", option: "--label <label>", name: "label", description: "Exact revision label — the name a publication was made under. An equality, not a search.", type: "string", required: false },
  { key: "createdBy", option: "--created-by <created-by>", name: "created_by", description: "Exact user id of whoever published.", type: "string", required: false },
  { key: "createdByName", option: "--created-by-name <created-by-name>", name: "created_by_name", description: "Exact display name recorded at publish time.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact publication timestamp, RFC 3339. Equality only — this data plane has no range operator, so walk the history with `order=created_at.desc` and `limit` instead.", type: "string", required: false },
];
pages
  .command(`pages-revisions`)
  .description(`One entry per publication, newest first, which is the order a history is read in and the one this route sorts by unless \`order\` says otherwise. The \`snapshot\` — the whole published page, in every language — is deliberately not in the index: it is page-sized, and nothing that renders a history needs it.`)
  .option(`--id <id>`, `The page whose history to read.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. A column this entity does not have, or any other shape, is refused with 400.`)
  .option(`--label <label>`, `Exact revision label — the name a publication was made under. An equality, not a search.`)
  .option(`--created-by <created-by>`, `Exact user id of whoever published.`)
  .option(`--created-by-name <created-by-name>`, `Exact display name recorded at publish time.`)
  .option(`--created-at <created-at>`, `Exact publication timestamp, RFC 3339. Equality only — this data plane has no range operator, so walk the history with \`order=created_at.desc\` and \`limit\` instead.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, limit, offset, order, label, createdBy, createdByName, createdAt } = await promptForMissing(
          _options,
          pagesRevisionsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/pages/{id}/revisions`.replace(`{id}`, id);
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
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (createdBy !== undefined) {
          _payload[`created_by`] = createdBy;
        }
        if (createdByName !== undefined) {
          _payload[`created_by_name`] = createdByName;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
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
registerPromptSpecs(pages.commands.at(-1)!, pagesRevisionsSpecs, { method: "get" });
const seedSpecs: PromptSpec[] = [
  { key: "menus", option: "--menus [menus...]", name: "menus", description: "The menus to create. One with no key or no label is reported under `skipped`.", type: "array", required: false },
  { key: "pages", option: "--pages [pages...]", name: "pages", description: "The pages to create. One that has no `slug` or no `title` is reported under `skipped` rather than refused, so one bad entry never loses the rest.", type: "array", required: false },
];
pages
  .command(`seed`)
  .description(`The target of a theme activation hook: hand it the theme's default pages and menus and it creates whatever is missing. Idempotent by \`slug\` and by menu key — a slug or a key the tenant already holds is skipped rather than rewritten, so re-running after a theme update adds only the new ones and never overwrites what an editor has since changed. A seeded page is published on the spot, immediately servable by delivery: the default_page_status setting deliberately does not apply, because a theme that activates with invisible pages looks broken.`)
  .option(`--menus [menus...]`, `The menus to create. One with no key or no label is reported under \`skipped\`.`)
  .option(`--pages [pages...]`, `The pages to create. One that has no \`slug\` or no \`title\` is reported under \`skipped\` rather than refused, so one bad entry never loses the rest.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { menus, pages } = await promptForMissing(
          _options,
          seedSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/seed`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (menus !== undefined) {
          _payload[`menus`] = menus;
        }
        if (pages !== undefined) {
          _payload[`pages`] = pages;
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
registerPromptSpecs(pages.commands.at(-1)!, seedSpecs, { method: "post" });
const templatesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. A column this entity does not have, or any other shape, is refused with 400.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Exact template id.", type: "string", required: false },
  { key: "label", option: "--label <label>", name: "label", description: "Exact label. An equality, not a search — there is no substring search on this route.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "Exact description text. An equality, so it is the round-trip of the value a picker already showed, not a search.", type: "string", required: false },
  { key: "pageBundle", option: "--page-bundle <page-bundle>", name: "page_bundle", description: "Exact page type the template is offered on. A template offered everywhere has no page_bundle and is not returned by this filter.", type: "string", required: false },
  { key: "fieldName", option: "--field-name <field-name>", name: "field_name", description: "Exact field the template is offered in.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Whether the template is the starting point for new pages of its bundle.", type: "boolean", required: false },
  { key: "createdBy", option: "--created-by <created-by>", name: "created_by", description: "Exact user id of whoever saved the template.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact creation timestamp, RFC 3339. Equality only — there is no range operator here, so walk the list with `order` instead.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact last-change timestamp, RFC 3339. Equality only.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
pages
  .command(`templates-list`)
  .description(`Every column of a template is an exact-match filter here: \`?page_bundle=standard&field_name=content\` is how a picker asks for the templates offered in one place, and \`?is_default=true\` is how a "new page" flow finds the one to start from.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. A column this entity does not have, or any other shape, is refused with 400.`)
  .option(`--id <id>`, `Exact template id.`)
  .option(`--label <label>`, `Exact label. An equality, not a search — there is no substring search on this route.`)
  .option(`--description <description>`, `Exact description text. An equality, so it is the round-trip of the value a picker already showed, not a search.`)
  .option(`--page-bundle <page-bundle>`, `Exact page type the template is offered on. A template offered everywhere has no page_bundle and is not returned by this filter.`)
  .option(`--field-name <field-name>`, `Exact field the template is offered in.`)
  .option(
    `--is-default [value]`,
    `Whether the template is the starting point for new pages of its bundle.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--created-by <created-by>`, `Exact user id of whoever saved the template.`)
  .option(`--created-at <created-at>`, `Exact creation timestamp, RFC 3339. Equality only — there is no range operator here, so walk the list with \`order\` instead.`)
  .option(`--updated-at <updated-at>`, `Exact last-change timestamp, RFC 3339. Equality only.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, label, description, pageBundle, fieldName, isDefault, createdBy, createdAt, updatedAt, filter } = await promptForMissing(
          _options,
          templatesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/templates`;
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
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (pageBundle !== undefined) {
          _payload[`page_bundle`] = pageBundle;
        }
        if (fieldName !== undefined) {
          _payload[`field_name`] = fieldName;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (createdBy !== undefined) {
          _payload[`created_by`] = createdBy;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
        }
        if (updatedAt !== undefined) {
          _payload[`updated_at`] = updatedAt;
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
registerPromptSpecs(pages.commands.at(-1)!, templatesListSpecs, { method: "get" });
const templatesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The template id.", type: "string", required: true, resource: { listPath: "/pages/templates", hasLimit: true } },
];
pages
  .command(`templates-delete`)
  .description(`Removes the template row outright. This is the one delete in the app that is not a tombstone — \`templates\` carries no \`deleted_at\` — so it cannot be undone and the id will not come back. Nothing else breaks by it: pages built from the template hold their own copy of the blocks and never referenced the row.`)
  .option(`--id <id>`, `The template id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          templatesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`pages templates-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/pages/templates/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(pages.commands.at(-1)!, templatesDeleteSpecs, { method: "delete", destructive: true });
const templatesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The template id.", type: "string", required: true, resource: { listPath: "/pages/templates", hasLimit: true } },
];
pages
  .command(`templates-get`)
  .description(`The blocks a page would START from if an editor picked this template — read it to preview the insert. A template is a COPY source, the opposite of a library item: nothing links back from the pages already built from it, so this tells you what future pages get and nothing about existing ones.`)
  .option(`--id <id>`, `The template id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          templatesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/templates/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(pages.commands.at(-1)!, templatesGetSpecs, { method: "get" });
const templatesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The template id.", type: "string", required: true, resource: { listPath: "/pages/templates", hasLimit: true } },
  { key: "description", option: "--description <description>", name: "description", description: "A sentence about when to reach for it, shown next to the label.", type: "string", required: false },
  { key: "fieldName", option: "--field-name <field-name>", name: "field_name", description: "The field this template is offered in. Null offers it in every field.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Whether a new page of this bundle starts from this template.", type: "boolean", required: false },
  { key: "label", option: "--label <label>", name: "label", description: "What the template is called in the picker.", type: "string", required: false },
  { key: "pageBundle", option: "--page-bundle <page-bundle>", name: "page_bundle", description: "The page type this template is offered on. Null offers it on every page type.", type: "string", required: false },
  { key: "tree", option: "--tree [tree...]", name: "tree", description: "The blocks the template inserts, in order. Replaces the stored tree completely.", type: "array", required: false },
];
pages
  .command(`templates-update`)
  .description(`Edits what a future page will start from. Because templates copy rather than share, this reaches nothing that already exists — pages built from it keep the blocks they were handed, which is exactly the property that makes a template safe to edit and a library item dangerous. \`is_default\` is the one field with an effect past the picker: it decides what a new page of \`page_bundle\` starts with, and nothing here stops two templates of the same bundle from both claiming it, so which one wins is left to whoever reads the list.`)
  .option(`--id <id>`, `The template id.`)
  .option(`--description <description>`, `A sentence about when to reach for it, shown next to the label.`)
  .option(`--field-name <field-name>`, `The field this template is offered in. Null offers it in every field.`)
  .option(
    `--is-default [value]`,
    `Whether a new page of this bundle starts from this template.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--label <label>`, `What the template is called in the picker.`)
  .option(`--page-bundle <page-bundle>`, `The page type this template is offered on. Null offers it on every page type.`)
  .option(`--tree [tree...]`, `The blocks the template inserts, in order. Replaces the stored tree completely.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, fieldName, isDefault, label, pageBundle, tree } = await promptForMissing(
          _options,
          templatesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/templates/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (fieldName !== undefined) {
          _payload[`field_name`] = fieldName;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (pageBundle !== undefined) {
          _payload[`page_bundle`] = pageBundle;
        }
        if (tree !== undefined) {
          _payload[`tree`] = tree;
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
registerPromptSpecs(pages.commands.at(-1)!, templatesUpdateSpecs, { method: "put" });
const vocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
pages
  .command(`vocabularies-list`)
  .description(`Discovery for the vocabulary routes: the enums this app publishes, each with its name, its title and what it is for, and none of them unpacked — the permitted values are not on this route, only on the one that serves a single vocabulary. Names: edit-state-statuses, page-statuses, translation-statuses. Fetch one with GET /pages/vocabularies/{name}; a client holding the qualified pair 'pages.<name>' builds that URL from the pair alone.`)
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
          vocabulariesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/vocabularies`;
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
registerPromptSpecs(pages.commands.at(-1)!, vocabulariesListSpecs, { method: "get" });
const vocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary name — the part after the dot in the qualified id.", type: "string", required: true, enum: ["edit-state-statuses","page-statuses","translation-statuses"], resource: { listPath: "/pages/vocabularies", hasLimit: false } },
];
pages
  .command(`vocabularies-get`)
  .description(`One vocabulary unpacked: every value the column permits, each with the title to show for it, the sentence explaining it and the badge tone to render it in — everything a select or a status pill needs, so nothing downstream keeps its own copy of the labels. The values are read out of the column's CHECK constraint, so the served set IS the enforced set and the two cannot drift — a value added to the constraint appears here even before anyone labels it, titled from its own key. Values come back in constraint order, which is the order a select should offer. 'closed' says the set is exhaustive, so a value outside it is stale data rather than a missing label. Names: edit-state-statuses, page-statuses, translation-statuses.`)
  .option(`--name <name>`, `The vocabulary name — the part after the dot in the qualified id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name } = await promptForMissing(
          _options,
          vocabulariesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(pages.commands.at(-1)!, vocabulariesGetSpecs, { method: "get" });
