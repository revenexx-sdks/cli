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

export const shippingValueLists = new Command("shipping-value-lists")
  .description(
    commandDescriptions["shippingValueLists"] ??
      `The code lists the other two groups point at, and what each code MEANS. Service levels and weight units were CHECK constraints until a merchant wanted a night-courier tier and a tonne — they are the tenant's own ROWS now, so adding one is a call rather than a release of this app, and both sets seed themselves on first read so neither ever answers empty. A weight unit is the one that is not merely a label: it carries a \`factor\`, kilograms per unit, and that number prices parcels, because every weight matrix converts a rate request through it into the unit its tiers are keyed in. The vocabulary routes sit here as the general form of the same question — they serve these two tenant-owned sets AND the enums this app really does fix (pricing model, matrix basis, carrier status), each with its title, description and badge tone, so no client keeps a second copy of a list it cannot see.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const shippingServiceLevelsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A value outside the range is clamped rather than refused, and `page.limit` echoes what was applied.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). The next page is `page.offset + page.returned`.", type: "integer", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
shippingValueLists
  .command(`shipping-service-levels-list`)
  .description(`What class of service a carrier row represents. This used to be a CHECK constraint, which meant a merchant with a night-courier tier or a two-man delivery service needed a release of this app to say so — and nothing in the app ever branched on the value, it only carried it. The set is the tenant's rows now, and the first read seeds it, so this never answers empty. Hand-rolled rather than a generic mount, because seeding is the point: it therefore honours limit/offset AND NOTHING ELSE. There is no \`?code=\` filter and no \`order\` — the rows always come back in \`position\` order, and a sort or a filter sent anyway is accepted, ignored, and answered 200.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A value outside the range is clamped rather than refused, and \`page.limit\` echoes what was applied.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). The next page is \`page.offset + page.returned\`.`, parseInteger)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, filter } = await promptForMissing(
          _options,
          shippingServiceLevelsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/service-levels`;
        const _payload: RequestParams = {};
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
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
registerPromptSpecs(shippingValueLists.commands.at(-1)!, shippingServiceLevelsListSpecs, { method: "get" });
const shippingServiceLevelsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Lowercase letters, digits, - or _, starting with a letter. What `shipping_carriers.service_level` stores. Immutable once created — renaming it would orphan every row carrying it.", type: "string", required: true },
  { key: "title", option: "--title <title>", name: "title", description: "What an operator reads in a select. The name a merchant renames; the code underneath never moves.", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", description: "The sentence under the title, explaining when to pick this service level. Null when the title says enough.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "Localized descriptions. A flat map keyed by locale — the Cockpit falls back to `en`. Null means the row has no translations and every client shows the untranslated column instead.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value on creation; the previous default is demoted.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized titles. A flat map keyed by locale — the Cockpit falls back to `en`. Null means the row has no translations and every client shows the untranslated column instead.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order in a select — the collection is returned in it.", type: "integer", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Semantic badge colour for a UI listing the set. The client owns what each tone looks like.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
shippingValueLists
  .command(`shipping-service-levels-create`)
  .description(`A service level is the class of service a carrier row represents, as one of the tenant's own codes. It is carried by \`shipping_carriers.service_level\` and reported on a rate as \`carrier_service_level\`; nothing in this app branches on it. A method never names one — it gets its level through the carrier it ships with. Reach for this when a merchant sells a class this app was not shipped with — a night courier, a two-man delivery, a same-day run. A create cannot omit \`code\` and \`title\`; every other column is optional or defaulted by the database. Two rows of this tenant may not share \`code\` — that is the 409. The code is lowercase and becomes what a carrier stores; it cannot be changed afterwards, because every carrier carrying it would be orphaned. Creating one changes nothing on its own: a carrier has to be moved onto it before it means anything.`)
  .option(`--code <code>`, `Lowercase letters, digits, - or _, starting with a letter. What \`shipping_carriers.service_level\` stores. Immutable once created — renaming it would orphan every row carrying it.`)
  .option(`--title <title>`, `What an operator reads in a select. The name a merchant renames; the code underneath never moves.`)
  .option(`--description <description>`, `The sentence under the title, explaining when to pick this service level. Null when the title says enough.`)
  .option(`--descriptions <descriptions>`, `Localized descriptions. A flat map keyed by locale — the Cockpit falls back to \`en\`. Null means the row has no translations and every client shows the untranslated column instead.`)
  .option(
    `--is-default [value]`,
    `Promote this value on creation; the previous default is demoted.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized titles. A flat map keyed by locale — the Cockpit falls back to \`en\`. Null means the row has no translations and every client shows the untranslated column instead.`)
  .option(`--position <position>`, `Sort order in a select — the collection is returned in it.`, parseInteger)
  .option(`--tone <tone>`, `Semantic badge colour for a UI listing the set. The client owns what each tone looks like.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, title, description, descriptions, isDefault, labels, position, tone } = await promptForMissing(
          _options,
          shippingServiceLevelsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/service-levels`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (descriptions !== undefined) {
          _payload[`descriptions`] = resolveBodyParam(descriptions);
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (tone !== undefined) {
          _payload[`tone`] = tone;
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
registerPromptSpecs(shippingValueLists.commands.at(-1)!, shippingServiceLevelsCreateSpecs, { method: "post" });
const shippingServiceLevelsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/service-levels", hasLimit: true } },
];
shippingValueLists
  .command(`shipping-service-levels-delete`)
  .description(`There is no foreign key doing this: adding one to a table that starts empty would fail the migration of every existing tenant. The refusal lives in the handler instead.`)
  .option(`--id <id>`, `The row id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          shippingServiceLevelsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`shipping-value-lists shipping-service-levels-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/shipping/service-levels/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(shippingValueLists.commands.at(-1)!, shippingServiceLevelsDeleteSpecs, { method: "delete", destructive: true });
const shippingServiceLevelsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/service-levels", hasLimit: true } },
];
shippingValueLists
  .command(`shipping-service-levels-get`)
  .description(`A service level is the class of service a carrier row represents, as one of the tenant's own codes. It is carried by \`shipping_carriers.service_level\` and reported on a rate as \`carrier_service_level\`; nothing in this app branches on it. A method never names one — it gets its level through the carrier it ships with. This reads one of them by ROW ID — which is what an editor holds after listing the set, and not what anything else in the platform stores. A caller holding the CODE (off a carrier row, or off a rate's \`carrier_service_level\`) cannot use this route: there is no \`?code=\` filter on the collection either, so read GET /shipping/vocabularies/service-levels, which is keyed the way the rest of the platform refers to these values.`)
  .option(`--id <id>`, `The row id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          shippingServiceLevelsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/service-levels/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(shippingValueLists.commands.at(-1)!, shippingServiceLevelsGetSpecs, { method: "get" });
const shippingServiceLevelsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/service-levels", hasLimit: true } },
  { key: "description", option: "--description <description>", name: "description", description: "The sentence under the title, explaining when to pick this service level. Null when the title says enough.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "Localized descriptions. A flat map keyed by locale — the Cockpit falls back to `en`. Null means the row has no translations and every client shows the untranslated column instead.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value; the previous default is demoted. POST …/make-default does the same thing without an edit.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized titles. A flat map keyed by locale — the Cockpit falls back to `en`. Null means the row has no translations and every client shows the untranslated column instead.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order in a select — the collection is returned in it.", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "What an operator reads in a select. The name a merchant renames; the code underneath never moves.", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Semantic badge colour for a UI listing the set. The client owns what each tone looks like.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
shippingValueLists
  .command(`shipping-service-levels-update`)
  .description(`A service level is the class of service a carrier row represents, as one of the tenant's own codes. It is carried by \`shipping_carriers.service_level\` and reported on a rate as \`carrier_service_level\`; nothing in this app branches on it. A method never names one — it gets its level through the carrier it ships with. This edits the DISPLAY half of one — title, description, their locale maps, badge tone, position, and the default flag. Everything a carrier or a filter joins on stays put: the code is immutable (a different one in the payload is a 400, not a silent no-op), and no carrier is moved onto or off this level by renaming it. Moving a row's \`position\` does not renumber its neighbours — the collection is returned in position order and ties fall back to whatever the database returns, so a deliberate order means writing every row's position.`)
  .option(`--id <id>`, `The row id.`)
  .option(`--description <description>`, `The sentence under the title, explaining when to pick this service level. Null when the title says enough.`)
  .option(`--descriptions <descriptions>`, `Localized descriptions. A flat map keyed by locale — the Cockpit falls back to \`en\`. Null means the row has no translations and every client shows the untranslated column instead.`)
  .option(
    `--is-default [value]`,
    `Promote this value; the previous default is demoted. POST …/make-default does the same thing without an edit.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized titles. A flat map keyed by locale — the Cockpit falls back to \`en\`. Null means the row has no translations and every client shows the untranslated column instead.`)
  .option(`--position <position>`, `Sort order in a select — the collection is returned in it.`, parseInteger)
  .option(`--title <title>`, `What an operator reads in a select. The name a merchant renames; the code underneath never moves.`)
  .option(`--tone <tone>`, `Semantic badge colour for a UI listing the set. The client owns what each tone looks like.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, descriptions, isDefault, labels, position, title, tone } = await promptForMissing(
          _options,
          shippingServiceLevelsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/service-levels/{id}`.replace(`{id}`, id);
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
        if (descriptions !== undefined) {
          _payload[`descriptions`] = resolveBodyParam(descriptions);
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (tone !== undefined) {
          _payload[`tone`] = tone;
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
registerPromptSpecs(shippingValueLists.commands.at(-1)!, shippingServiceLevelsUpdateSpecs, { method: "put" });
const shippingServiceLevelsMakeDefaultSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/service-levels", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
shippingValueLists
  .command(`shipping-service-levels-make-default`)
  .description(`The flag is a single answer, not a per-row opinion: it is what every fallback lands on, so two defaults leave the result to row order and none leaves it to the seeded value. This row takes it and whoever was holding it is demoted in the same call — there is no separate write to clear the old one, and no window in which both carry it. Only the rows whose flag is wrong are written, so repeating the call is free.`)
  .option(`--id <id>`, `The row id.`)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { id, body } = await promptForMissing(
          _options,
          shippingServiceLevelsMakeDefaultSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/service-levels/{id}/make-default`.replace(`{id}`, id);
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
registerPromptSpecs(shippingValueLists.commands.at(-1)!, shippingServiceLevelsMakeDefaultSpecs, { method: "post" });
const shippingVocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
shippingValueLists
  .command(`shipping-vocabularies-list`)
  .description(`Discovery for the vocabulary routes: every enum this app publishes, each with its name, its title and its description, and deliberately without its values — an index stays an index, and the set a value belongs to is one further call. Names: carrier-statuses, matrix-bases, pricing-types, service-levels, weight-units. Fetch one with GET /shipping/vocabularies/{name}; a client holding the qualified pair 'shipping.<name>' builds that URL from the pair alone. \`title\` and \`description\` are either one string or a locale map keyed by locale — every entry here carries the map, because every one of them is curated copy.`)
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
          shippingVocabulariesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/vocabularies`;
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
registerPromptSpecs(shippingValueLists.commands.at(-1)!, shippingVocabulariesListSpecs, { method: "get" });
const shippingVocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary name — the part after the dot in the qualified id.", type: "string", required: true, enum: ["carrier-statuses","matrix-bases","pricing-types","service-levels","weight-units"], resource: { listPath: "/shipping/vocabularies", hasLimit: false } },
];
shippingValueLists
  .command(`shipping-vocabularies-get`)
  .description(`One vocabulary in full: every value it permits, each carrying the title to show, the description to explain it and the badge tone to draw it in — everything a select or a status chip needs, so nothing has to be labelled a second time in a client. Two sources, one guarantee: what is served is what is enforced, so no UI keeps a second copy. 'source: schema' means the values are read out of a CHECK constraint — a value added to the constraint appears here even before anyone labels it, titled from its own key, in constraint order. 'source: table' means the values are the TENANT's own rows (service-levels, weight-units), read per request and seeded on first use, so a merchant may add one without a release of this app; those values also carry labels/descriptions, is_system and is_default, and weight-units carries the conversion factor. 'closed' says the set is exhaustive either way, so a value outside it is stale data rather than a missing label. \`title\` and \`description\` — the vocabulary's and every value's — are either one string or a locale map keyed by locale: curated copy carries the map, a value titled from its own key carries the string. Names: carrier-statuses, matrix-bases, pricing-types, service-levels, weight-units.`)
  .option(`--name <name>`, `The vocabulary name — the part after the dot in the qualified id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name } = await promptForMissing(
          _options,
          shippingVocabulariesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(shippingValueLists.commands.at(-1)!, shippingVocabulariesGetSpecs, { method: "get" });
const shippingWeightUnitsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A value outside the range is clamped rather than refused, and `page.limit` echoes what was applied.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). The next page is `page.offset + page.returned`.", type: "integer", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
shippingValueLists
  .command(`shipping-weight-units-list`)
  .description(`Not a taxonomy: a unit is a code PLUS a factor, and the factor prices parcels. \`factor\` is how many kilograms one of this unit weighs, so a matrix keyed in one unit can price a request expressed in another. Exactly one row is the BASE (kg, factor 1) — the anchor every other factor and every stored rate tier is expressed in — and it is fixed at install. Seeded on first read, so this never answers empty. Like the service levels it is hand-rolled and honours limit/offset AND NOTHING ELSE: no column filter, no \`order\`, always \`position\` order, and a sort sent anyway is ignored rather than refused.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A value outside the range is clamped rather than refused, and \`page.limit\` echoes what was applied.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). The next page is \`page.offset + page.returned\`.`, parseInteger)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, filter } = await promptForMissing(
          _options,
          shippingWeightUnitsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/weight-units`;
        const _payload: RequestParams = {};
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
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
registerPromptSpecs(shippingValueLists.commands.at(-1)!, shippingWeightUnitsListSpecs, { method: "get" });
const shippingWeightUnitsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Lowercase letters, digits, - or _, starting with a letter. What a rate request names in `weight_unit`, and what a market's `weight_unit` setting stores. Immutable once created — renaming it would orphan every row carrying it.", type: "string", required: true },
  { key: "factor", option: "--factor <factor>", name: "factor", description: "How many BASE units (kilograms) one of this unit weighs — a tonne is 1000, a gram 0.001, a pound 0.45359237. This number prices parcels: every weight matrix converts a request through it. Must be > 0; the base unit is fixed at 1 and rejects a change.", type: "number", required: true },
  { key: "title", option: "--title <title>", name: "title", description: "What an operator reads in a select. The name a merchant renames; the code underneath never moves.", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", description: "The sentence under the title, explaining when to pick this weight unit. Null when the title says enough.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "Localized descriptions. A flat map keyed by locale — the Cockpit falls back to `en`. Null means the row has no translations and every client shows the untranslated column instead.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value on creation; the previous default is demoted.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized titles. A flat map keyed by locale — the Cockpit falls back to `en`. Null means the row has no translations and every client shows the untranslated column instead.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order in a select — the collection is returned in it.", type: "integer", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Semantic badge colour for a UI listing the set. The client owns what each tone looks like.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
shippingValueLists
  .command(`shipping-weight-units-create`)
  .description(`Reach for this when a merchant weighs goods in something this app was not shipped with — a tonne for pallet freight, a carat for jewellery — and wants a rate matrix keyed in it. \`factor\` is required and must be greater than 0: zero does not convert a weight, it divides by it, and a negative factor turns a parcel into a credit. The new unit is never the base — which unit anchors the others is decided at install, and moving it would silently reprice every weight matrix in the shop.`)
  .option(`--code <code>`, `Lowercase letters, digits, - or _, starting with a letter. What a rate request names in \`weight_unit\`, and what a market's \`weight_unit\` setting stores. Immutable once created — renaming it would orphan every row carrying it.`)
  .option(`--factor <factor>`, `How many BASE units (kilograms) one of this unit weighs — a tonne is 1000, a gram 0.001, a pound 0.45359237. This number prices parcels: every weight matrix converts a request through it. Must be > 0; the base unit is fixed at 1 and rejects a change.`, parseInteger)
  .option(`--title <title>`, `What an operator reads in a select. The name a merchant renames; the code underneath never moves.`)
  .option(`--description <description>`, `The sentence under the title, explaining when to pick this weight unit. Null when the title says enough.`)
  .option(`--descriptions <descriptions>`, `Localized descriptions. A flat map keyed by locale — the Cockpit falls back to \`en\`. Null means the row has no translations and every client shows the untranslated column instead.`)
  .option(
    `--is-default [value]`,
    `Promote this value on creation; the previous default is demoted.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized titles. A flat map keyed by locale — the Cockpit falls back to \`en\`. Null means the row has no translations and every client shows the untranslated column instead.`)
  .option(`--position <position>`, `Sort order in a select — the collection is returned in it.`, parseInteger)
  .option(`--tone <tone>`, `Semantic badge colour for a UI listing the set. The client owns what each tone looks like.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, factor, title, description, descriptions, isDefault, labels, position, tone } = await promptForMissing(
          _options,
          shippingWeightUnitsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/weight-units`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (descriptions !== undefined) {
          _payload[`descriptions`] = resolveBodyParam(descriptions);
        }
        if (factor !== undefined) {
          _payload[`factor`] = factor;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (tone !== undefined) {
          _payload[`tone`] = tone;
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
registerPromptSpecs(shippingValueLists.commands.at(-1)!, shippingWeightUnitsCreateSpecs, { method: "post" });
const shippingWeightUnitsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/weight-units", hasLimit: true } },
];
shippingValueLists
  .command(`shipping-weight-units-delete`)
  .description(`The market check is best effort by design — the setting is per market and this request carries one, so another market may still name the unit. That case degrades to the market falling back to the flagged unit rather than failing its quotes.`)
  .option(`--id <id>`, `The row id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          shippingWeightUnitsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`shipping-value-lists shipping-weight-units-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/shipping/weight-units/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(shippingValueLists.commands.at(-1)!, shippingWeightUnitsDeleteSpecs, { method: "delete", destructive: true });
const shippingWeightUnitsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/weight-units", hasLimit: true } },
];
shippingValueLists
  .command(`shipping-weight-units-get`)
  .description(`A weight unit is a code PLUS a factor — how many kilograms one of this unit weighs — and the factor is what prices parcels: a rate request expressed in one unit is converted through the two factors into the unit the market's tiers are keyed in. Exactly one row is the base (kg, factor 1), fixed at install. This reads one of them by ROW ID, which is what an editor holds after listing the set; a caller holding the CODE (a market's \`weight_unit\` setting, a rate request's \`weight_unit\`) has no filter for it here and should read GET /shipping/vocabularies/weight-units instead. Reading the factor back is NOT how a past quote is checked: a rate answer echoes the factors it applied in \`basis.weight_unit_factor\` and \`basis.request_weight_unit_factor\` precisely so it stays re-derivable after this row has been edited.`)
  .option(`--id <id>`, `The row id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          shippingWeightUnitsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/weight-units/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(shippingValueLists.commands.at(-1)!, shippingWeightUnitsGetSpecs, { method: "get" });
const shippingWeightUnitsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/weight-units", hasLimit: true } },
  { key: "description", option: "--description <description>", name: "description", description: "The sentence under the title, explaining when to pick this weight unit. Null when the title says enough.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "Localized descriptions. A flat map keyed by locale — the Cockpit falls back to `en`. Null means the row has no translations and every client shows the untranslated column instead.", type: "object", required: false },
  { key: "factor", option: "--factor <factor>", name: "factor", description: "How many BASE units (kilograms) one of this unit weighs — a tonne is 1000, a gram 0.001, a pound 0.45359237. This number prices parcels: every weight matrix converts a request through it. Must be > 0; the base unit is fixed at 1 and rejects a change.", type: "number", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value; the previous default is demoted. POST …/make-default does the same thing without an edit.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized titles. A flat map keyed by locale — the Cockpit falls back to `en`. Null means the row has no translations and every client shows the untranslated column instead.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order in a select — the collection is returned in it.", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "What an operator reads in a select. The name a merchant renames; the code underneath never moves.", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Semantic badge colour for a UI listing the set. The client owns what each tone looks like.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
shippingValueLists
  .command(`shipping-weight-units-update`)
  .description(`Everything but the code and the base flag. A factor sent for the BASE unit is refused rather than silently ignored: it reads as 1 because every other factor is relative to it, so changing it would rescale the whole table without touching another row.`)
  .option(`--id <id>`, `The row id.`)
  .option(`--description <description>`, `The sentence under the title, explaining when to pick this weight unit. Null when the title says enough.`)
  .option(`--descriptions <descriptions>`, `Localized descriptions. A flat map keyed by locale — the Cockpit falls back to \`en\`. Null means the row has no translations and every client shows the untranslated column instead.`)
  .option(`--factor <factor>`, `How many BASE units (kilograms) one of this unit weighs — a tonne is 1000, a gram 0.001, a pound 0.45359237. This number prices parcels: every weight matrix converts a request through it. Must be > 0; the base unit is fixed at 1 and rejects a change.`, parseInteger)
  .option(
    `--is-default [value]`,
    `Promote this value; the previous default is demoted. POST …/make-default does the same thing without an edit.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized titles. A flat map keyed by locale — the Cockpit falls back to \`en\`. Null means the row has no translations and every client shows the untranslated column instead.`)
  .option(`--position <position>`, `Sort order in a select — the collection is returned in it.`, parseInteger)
  .option(`--title <title>`, `What an operator reads in a select. The name a merchant renames; the code underneath never moves.`)
  .option(`--tone <tone>`, `Semantic badge colour for a UI listing the set. The client owns what each tone looks like.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, descriptions, factor, isDefault, labels, position, title, tone } = await promptForMissing(
          _options,
          shippingWeightUnitsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/weight-units/{id}`.replace(`{id}`, id);
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
        if (descriptions !== undefined) {
          _payload[`descriptions`] = resolveBodyParam(descriptions);
        }
        if (factor !== undefined) {
          _payload[`factor`] = factor;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (tone !== undefined) {
          _payload[`tone`] = tone;
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
registerPromptSpecs(shippingValueLists.commands.at(-1)!, shippingWeightUnitsUpdateSpecs, { method: "put" });
const shippingWeightUnitsMakeDefaultSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/weight-units", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
shippingValueLists
  .command(`shipping-weight-units-make-default`)
  .description(`The flag is a single answer, not a per-row opinion: it is what every fallback lands on, so two defaults leave the result to row order and none leaves it to the seeded value. This row takes it and whoever was holding it is demoted in the same call — there is no separate write to clear the old one, and no window in which both carry it. Only the rows whose flag is wrong are written, so repeating the call is free.`)
  .option(`--id <id>`, `The row id.`)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { id, body } = await promptForMissing(
          _options,
          shippingWeightUnitsMakeDefaultSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/weight-units/{id}/make-default`.replace(`{id}`, id);
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
registerPromptSpecs(shippingValueLists.commands.at(-1)!, shippingWeightUnitsMakeDefaultSpecs, { method: "post" });
