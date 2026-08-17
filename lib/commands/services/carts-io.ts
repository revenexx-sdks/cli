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

export const cartsIo = new Command("carts-io")
  .description(
    commandDescriptions["cartsIo"] ??
      `Moving carts in and out as JSON or CSV — the bulk data plane, which a storefront checkout never touches. An import/export profile (Baseline-IO-compatible) declares which direction it runs in, whether it carries whole carts or bare lines, the format, how the external columns are named, and what an import does with the lines a target cart already has; four templates ship with the app and are seeded idempotently by name. The two routes that actually move data are here as well: export one cart through an export profile or ad hoc, and import a payload into a new cart or an existing one. A profile only ever runs in the direction it declares — handing an import profile to the export route is a 400.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const cartsImportSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Owner of the cart this import creates. Ignored when target_cart_id is sent.", type: "string", required: false },
  { key: "csv", option: "--csv <csv>", name: "csv", description: "The CSV rows, when that is easier than putting them in `payload`. First line is the header, and its names are the ones the profile's mapping expects (the bundled quick-order template reads sku, name, quantity, unit_price). Numbers are coerced; a JSON column survives as a JSON string.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Name for the cart this import creates. A name in the payload's own `cart` block wins over it; without either the cart is called 'Imported cart'.", type: "string", required: false },
  { key: "payload", option: "--payload <payload>", name: "payload", description: "The import itself. As an object: `{ \"cart\": { name, status, currency, channel_id, metadata }, \"items\": [ … ] }` — the same document carts.export produces, so an export round-trips. As a string: that document as raw JSON, or CSV rows when the profile is a csv one. A line with neither `name` nor `sku` is dropped, and a payload that leaves no line at all is a 400.", type: "object", required: false },
  { key: "profileId", option: "--profile-id <profile-id>", name: "profile_id", description: "The import profile to run — one of the ids `GET /carts/io/profiles?direction=import` lists. Omit it for an ad-hoc import: the payload is then read in the canonical shape, and as CSV if `csv` is what carried it.", type: "string", required: false },
  { key: "sessionKey", option: "--session-key <session-key>", name: "session_key", description: "Guest owner of the cart this import creates — the storefront's own session key. Ignored when target_cart_id is sent.", type: "string", required: false },
  { key: "targetCartId", option: "--target-cart-id <target-cart-id>", name: "target_cart_id", description: "An existing ACTIVE cart to import into. The lines are added to it (merging identical product lines), unless the profile says `apply_mode: replace`, which clears it first. Without this a new cart is created and an owner is required.", type: "string", required: false },
];
cartsIo
  .command(`carts-import`)
  .description(`Reads a payload of lines into a cart — the bulk-order path a buyer pastes a spreadsheet into. With \`target_cart_id\` the lines land in that cart, which must be active, and the profile's \`apply_mode\` decides what happens to the lines already there: 'replace' clears them first, 'insert' and 'append' both add. Without a target a new cart is created, and an OWNER is then required — \`contact_id\` or \`session_key\` — because a cart with neither cannot exist. \`profile_id\` names an IMPORT profile; without one the payload is read ad hoc, as CSV when \`csv\` is present and as JSON otherwise. The lines fold into identical product lines exactly as carts.items.create does, so \`imported_lines\` counts the lines READ and the cart may have gained fewer rows than that. A payload that parses to no line at all is a 400 rather than a quiet no-op.`)
  .option(`--contact-id <contact-id>`, `Owner of the cart this import creates. Ignored when target_cart_id is sent.`)
  .option(`--csv <csv>`, `The CSV rows, when that is easier than putting them in \`payload\`. First line is the header, and its names are the ones the profile's mapping expects (the bundled quick-order template reads sku, name, quantity, unit_price). Numbers are coerced; a JSON column survives as a JSON string.`)
  .option(`--name <name>`, `Name for the cart this import creates. A name in the payload's own \`cart\` block wins over it; without either the cart is called 'Imported cart'.`)
  .option(`--payload <payload>`, `The import itself. As an object: \`{ "cart": { name, status, currency, channel_id, metadata }, "items": [ … ] }\` — the same document carts.export produces, so an export round-trips. As a string: that document as raw JSON, or CSV rows when the profile is a csv one. A line with neither \`name\` nor \`sku\` is dropped, and a payload that leaves no line at all is a 400.`)
  .option(`--profile-id <profile-id>`, `The import profile to run — one of the ids \`GET /carts/io/profiles?direction=import\` lists. Omit it for an ad-hoc import: the payload is then read in the canonical shape, and as CSV if \`csv\` is what carried it.`)
  .option(`--session-key <session-key>`, `Guest owner of the cart this import creates — the storefront's own session key. Ignored when target_cart_id is sent.`)
  .option(`--target-cart-id <target-cart-id>`, `An existing ACTIVE cart to import into. The lines are added to it (merging identical product lines), unless the profile says \`apply_mode: replace\`, which clears it first. Without this a new cart is created and an owner is required.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, csv, name, payload, profileId, sessionKey, targetCartId } = await promptForMissing(
          _options,
          cartsImportSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/import`;
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
        if (csv !== undefined) {
          _payload[`csv`] = csv;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (payload !== undefined) {
          _payload[`payload`] = resolveBodyParam(payload);
        }
        if (profileId !== undefined) {
          _payload[`profile_id`] = profileId;
        }
        if (sessionKey !== undefined) {
          _payload[`session_key`] = sessionKey;
        }
        if (targetCartId !== undefined) {
          _payload[`target_cart_id`] = targetCartId;
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
registerPromptSpecs(cartsIo.commands.at(-1)!, cartsImportSpecs, { method: "post" });
const profilesListSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "One profile, in list form.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Exact profile name — how the bundled templates are addressed, since they are identified by name.", type: "string", required: false },
  { key: "direction", option: "--direction <direction>", name: "direction", description: "Import or export profiles. `?direction=export` is how a client offers exactly the profiles carts.export will accept — the other half is a 400.", type: "string", required: false, enum: ["import","export"] },
  { key: "entity", option: "--entity <entity>", name: "entity", description: "Profiles that carry whole carts, or profiles that carry lines.", type: "string", required: false, enum: ["carts","cart_items"] },
  { key: "format", option: "--format <format>", name: "format", description: "JSON profiles or CSV profiles.", type: "string", required: false, enum: ["json","csv"] },
  { key: "applyMode", option: "--apply-mode <apply-mode>", name: "apply_mode", description: "Profiles that replace a target cart's lines, as against those that add to them.", type: "string", required: false, enum: ["insert","append","replace"] },
  { key: "isTemplate", option: "--is-template <is-template>", name: "is_template", description: "The four bundled templates, or everything a merchant wrote.", type: "boolean", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact instant, not a range.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact instant, not a range.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
cartsIo
  .command(`profiles-list`)
  .description(`The filters are what make this list usable: \`?direction=export\` is how a client offers the profiles that carts.export will accept, and \`?is_template=true\` separates the four bundled templates from what a merchant wrote. An unknown column is dropped rather than refused — \`filter\` echoes what was understood.`)
  .option(`--id <id>`, `One profile, in list form.`)
  .option(`--name <name>`, `Exact profile name — how the bundled templates are addressed, since they are identified by name.`)
  .option(`--direction <direction>`, `Import or export profiles. \`?direction=export\` is how a client offers exactly the profiles carts.export will accept — the other half is a 400.`)
  .option(`--entity <entity>`, `Profiles that carry whole carts, or profiles that carry lines.`)
  .option(`--format <format>`, `JSON profiles or CSV profiles.`)
  .option(`--apply-mode <apply-mode>`, `Profiles that replace a target cart's lines, as against those that add to them.`)
  .option(
    `--is-template [value]`,
    `The four bundled templates, or everything a merchant wrote.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--created-at <created-at>`, `Exact instant, not a range.`)
  .option(`--updated-at <updated-at>`, `Exact instant, not a range.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, name, direction, entity, format, applyMode, isTemplate, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          profilesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/io/profiles`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (direction !== undefined) {
          _payload[`direction`] = direction;
        }
        if (entity !== undefined) {
          _payload[`entity`] = entity;
        }
        if (format !== undefined) {
          _payload[`format`] = format;
        }
        if (applyMode !== undefined) {
          _payload[`apply_mode`] = applyMode;
        }
        if (isTemplate !== undefined) {
          _payload[`is_template`] = isTemplate;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
        }
        if (updatedAt !== undefined) {
          _payload[`updated_at`] = updatedAt;
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
registerPromptSpecs(cartsIo.commands.at(-1)!, profilesListSpecs, { method: "get" });
const profilesCreateSpecs: PromptSpec[] = [
  { key: "direction", option: "--direction <direction>", name: "direction", description: "Which way this profile runs. A profile only ever runs in the direction it declares: handing an import profile to carts.export is a 400, and the other way round.", type: "string", required: true, enum: ["import","export"] },
  { key: "name", option: "--name <name>", name: "name", description: "What a merchant picks this profile by. Unique within the tenant — reusing a name is a 409.", type: "string", required: true },
  { key: "applyMode", option: "--apply-mode <apply-mode>", name: "apply_mode", description: "What an import does with the lines the target cart already has: 'replace' clears them first, 'insert' and 'append' both add and behave identically today. Read only when the import names a target_cart_id. Default 'insert'.", type: "string", required: false, enum: ["insert","append","replace"] },
  { key: "entity", option: "--entity <entity>", name: "entity", description: "What the profile carries: whole carts (the `{cart, items}` document) or bare cart lines. Default 'carts'.", type: "string", required: false, enum: ["carts","cart_items"] },
  { key: "format", option: "--format <format>", name: "format", description: "The wire format. 'json' is the canonical, re-importable document; 'csv' is the spreadsheet form, and only line fields survive it. Default 'json'.", type: "string", required: false, enum: ["json","csv"] },
  { key: "isTemplate", option: "--is-template <is-template>", name: "is_template", description: "One of the bundled templates. Set by carts.io.profiles.defaults; a profile a merchant writes is not one.", type: "boolean", required: false },
  { key: "mapping", option: "--mapping <mapping>", name: "mapping", description: "Baseline-IO-compatible column mapping. An empty object (or null) is identity: the full canonical shape, every field under its own name.", type: "object", required: false },
  { key: "options", option: "--options <options>", name: "options", description: "Free-form options carried with the profile. The four bundled templates put one human sentence under `description` and nothing else; no other key is read by this app, so anything a merchant needs alongside a profile can live here.", type: "object", required: false },
];
cartsIo
  .command(`profiles-create`)
  .description(`Defines a new import/export profile. Two fields are required and have no default — \`name\`, which must be unique within the tenant, and \`direction\`, which fixes the one way this profile will ever run. Everything else defaults to the common case: whole carts, JSON, \`apply_mode\` 'insert', not a template. The uniqueness of the name is a unique index rather than a check in this app, so a reused name is a 409 no matter which route wrote the other one, including the four bundled templates. The shape is Baseline-IO-compatible, so a mapping written for another app's import reads the same way here. Creating a profile does not move any data: carts.export and carts.import are what execute one, and each refuses a profile pointed the wrong way.`)
  .option(`--direction <direction>`, `Which way this profile runs. A profile only ever runs in the direction it declares: handing an import profile to carts.export is a 400, and the other way round.`)
  .option(`--name <name>`, `What a merchant picks this profile by. Unique within the tenant — reusing a name is a 409.`)
  .option(`--apply-mode <apply-mode>`, `What an import does with the lines the target cart already has: 'replace' clears them first, 'insert' and 'append' both add and behave identically today. Read only when the import names a target_cart_id. Default 'insert'.`)
  .option(`--entity <entity>`, `What the profile carries: whole carts (the \`{cart, items}\` document) or bare cart lines. Default 'carts'.`)
  .option(`--format <format>`, `The wire format. 'json' is the canonical, re-importable document; 'csv' is the spreadsheet form, and only line fields survive it. Default 'json'.`)
  .option(
    `--is-template [value]`,
    `One of the bundled templates. Set by carts.io.profiles.defaults; a profile a merchant writes is not one.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--mapping <mapping>`, `Baseline-IO-compatible column mapping. An empty object (or null) is identity: the full canonical shape, every field under its own name.`)
  .option(`--options <options>`, `Free-form options carried with the profile. The four bundled templates put one human sentence under \`description\` and nothing else; no other key is read by this app, so anything a merchant needs alongside a profile can live here.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { direction, name, applyMode, entity, format, isTemplate, mapping, options } = await promptForMissing(
          _options,
          profilesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/io/profiles`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (applyMode !== undefined) {
          _payload[`apply_mode`] = applyMode;
        }
        if (direction !== undefined) {
          _payload[`direction`] = direction;
        }
        if (entity !== undefined) {
          _payload[`entity`] = entity;
        }
        if (format !== undefined) {
          _payload[`format`] = format;
        }
        if (isTemplate !== undefined) {
          _payload[`is_template`] = isTemplate;
        }
        if (mapping !== undefined) {
          _payload[`mapping`] = resolveBodyParam(mapping);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (options !== undefined) {
          _payload[`options`] = resolveBodyParam(options);
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
registerPromptSpecs(cartsIo.commands.at(-1)!, profilesCreateSpecs, { method: "post" });
cartsIo
  .command(`profiles-defaults`)
  .description(`Seeds the 4 bundled templates and reports which of them it had to create — the call that gives a fresh tenant something to export through before anybody has written a profile. Idempotent and matched by NAME, so a second call answers with everything under 'existing' and writes nothing, and a template a merchant has edited is left exactly as they left it rather than reset. It also runs by itself on app.installed; call it by hand where that event cannot be relied on, and after deleting a template to get it back.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/io/profiles/defaults`;
        const _payload: RequestParams = {};
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
const profilesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The import/export profile, by its id — one of the ids `GET /carts/io/profiles` lists.", type: "string", required: true, resource: { listPath: "/carts/io/profiles", hasLimit: true } },
];
cartsIo
  .command(`profiles-delete`)
  .description(`Removes a profile. Nothing in this app points at one — no cart and no line stores the profile it was imported through — so no foreign key holds the delete up and nothing is orphaned by it; what breaks is the caller still holding that \`profile_id\`, which answers 404 on its next run. Deleting one of the four bundled templates is not permanent either: the next carts.io.profiles.defaults, and the next install of this app, seeds it again by name, in the shape it ships with rather than the shape a merchant had edited it into.`)
  .option(`--id <id>`, `The import/export profile, by its id — one of the ids \`GET /carts/io/profiles\` lists.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          profilesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`carts-io profiles-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/carts/io/profiles/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(cartsIo.commands.at(-1)!, profilesDeleteSpecs, { method: "delete", destructive: true });
const profilesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The import/export profile, by its id — one of the ids `GET /carts/io/profiles` lists.", type: "string", required: true, resource: { listPath: "/carts/io/profiles", hasLimit: true } },
];
cartsIo
  .command(`profiles-get`)
  .description(`One profile by id — the id carts.export and carts.import name in \`profile_id\`. Read it to see what a run will do before starting one: \`direction\`, because a profile only ever runs the way it declares; \`entity\`, whole carts or bare lines; \`format\`, where json round-trips and csv carries line fields only; \`mapping\`, what the external columns are called; and \`apply_mode\`, which decides what an import does with the lines a target cart already has. \`is_template\` says whether this is one of the four the app ships with or something a merchant wrote. Reading a profile runs nothing and changes nothing.`)
  .option(`--id <id>`, `The import/export profile, by its id — one of the ids \`GET /carts/io/profiles\` lists.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          profilesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/io/profiles/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(cartsIo.commands.at(-1)!, profilesGetSpecs, { method: "get" });
const profilesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The import/export profile, by its id — one of the ids `GET /carts/io/profiles` lists.", type: "string", required: true, resource: { listPath: "/carts/io/profiles", hasLimit: true } },
  { key: "applyMode", option: "--apply-mode <apply-mode>", name: "apply_mode", description: "What an import does with the lines the target cart already has: 'replace' clears them first, 'insert' and 'append' both add and behave identically today. Read only when the import names a target_cart_id. Default 'insert'.", type: "string", required: false, enum: ["insert","append","replace"] },
  { key: "direction", option: "--direction <direction>", name: "direction", description: "Which way this profile runs. A profile only ever runs in the direction it declares: handing an import profile to carts.export is a 400, and the other way round.", type: "string", required: false, enum: ["import","export"] },
  { key: "entity", option: "--entity <entity>", name: "entity", description: "What the profile carries: whole carts (the `{cart, items}` document) or bare cart lines. Default 'carts'.", type: "string", required: false, enum: ["carts","cart_items"] },
  { key: "format", option: "--format <format>", name: "format", description: "The wire format. 'json' is the canonical, re-importable document; 'csv' is the spreadsheet form, and only line fields survive it. Default 'json'.", type: "string", required: false, enum: ["json","csv"] },
  { key: "isTemplate", option: "--is-template <is-template>", name: "is_template", description: "One of the bundled templates. Set by carts.io.profiles.defaults; a profile a merchant writes is not one.", type: "boolean", required: false },
  { key: "mapping", option: "--mapping <mapping>", name: "mapping", description: "Baseline-IO-compatible column mapping. An empty object (or null) is identity: the full canonical shape, every field under its own name.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "What a merchant picks this profile by. Unique within the tenant — reusing a name is a 409.", type: "string", required: false },
  { key: "options", option: "--options <options>", name: "options", description: "Free-form options carried with the profile. The four bundled templates put one human sentence under `description` and nothing else; no other key is read by this app, so anything a merchant needs alongside a profile can live here.", type: "object", required: false },
];
cartsIo
  .command(`profiles-update`)
  .description(`Edits a profile in place, the four bundled templates included — seeding matches on name and never rewrites what it finds, so an edit made here survives every later call to carts.io.profiles.defaults and every reinstall of the app. The name stays unique in the tenant, so renaming onto another profile's name is a 409, and a payload carrying no updatable field answers 400 rather than storing nothing quietly. Runs that already happened are unaffected: a profile is read at the moment carts.export or carts.import executes and nothing is kept pointing back at it, so changing a mapping changes the next run and no earlier one.`)
  .option(`--id <id>`, `The import/export profile, by its id — one of the ids \`GET /carts/io/profiles\` lists.`)
  .option(`--apply-mode <apply-mode>`, `What an import does with the lines the target cart already has: 'replace' clears them first, 'insert' and 'append' both add and behave identically today. Read only when the import names a target_cart_id. Default 'insert'.`)
  .option(`--direction <direction>`, `Which way this profile runs. A profile only ever runs in the direction it declares: handing an import profile to carts.export is a 400, and the other way round.`)
  .option(`--entity <entity>`, `What the profile carries: whole carts (the \`{cart, items}\` document) or bare cart lines. Default 'carts'.`)
  .option(`--format <format>`, `The wire format. 'json' is the canonical, re-importable document; 'csv' is the spreadsheet form, and only line fields survive it. Default 'json'.`)
  .option(
    `--is-template [value]`,
    `One of the bundled templates. Set by carts.io.profiles.defaults; a profile a merchant writes is not one.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--mapping <mapping>`, `Baseline-IO-compatible column mapping. An empty object (or null) is identity: the full canonical shape, every field under its own name.`)
  .option(`--name <name>`, `What a merchant picks this profile by. Unique within the tenant — reusing a name is a 409.`)
  .option(`--options <options>`, `Free-form options carried with the profile. The four bundled templates put one human sentence under \`description\` and nothing else; no other key is read by this app, so anything a merchant needs alongside a profile can live here.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, applyMode, direction, entity, format, isTemplate, mapping, name, options } = await promptForMissing(
          _options,
          profilesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/io/profiles/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (applyMode !== undefined) {
          _payload[`apply_mode`] = applyMode;
        }
        if (direction !== undefined) {
          _payload[`direction`] = direction;
        }
        if (entity !== undefined) {
          _payload[`entity`] = entity;
        }
        if (format !== undefined) {
          _payload[`format`] = format;
        }
        if (isTemplate !== undefined) {
          _payload[`is_template`] = isTemplate;
        }
        if (mapping !== undefined) {
          _payload[`mapping`] = resolveBodyParam(mapping);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (options !== undefined) {
          _payload[`options`] = resolveBodyParam(options);
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
registerPromptSpecs(cartsIo.commands.at(-1)!, profilesUpdateSpecs, { method: "put" });
const cartsExportSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The cart, by its id — the `id` every cart answer carries. A uuid: the data plane casts the segment, so a code or a slug is refused before the cart is looked up.", type: "string", required: true },
  { key: "format", option: "--format <format>", name: "format", description: "Format of an ad-hoc export, read only when no profile_id is sent. 'json' returns the whole `{cart, items}` document, 'csv' the lines alone. Default 'json'.", type: "string", required: false, enum: ["json","csv"] },
  { key: "profileId", option: "--profile-id <profile-id>", name: "profile_id", description: "The export profile to run — one of the ids `GET /carts/io/profiles?direction=export` lists. Omit it for an ad-hoc export in the canonical shape, which is what `format` is for.", type: "string", required: false },
];
cartsIo
  .command(`carts-export`)
  .description(`Renders one cart as a document somebody can take away. With \`profile_id\` the named EXPORT profile decides the format, the entity and the column names; handing it an import profile is a 400, because a profile only runs the way it declares. Without one the call runs ad hoc — JSON, unless \`format: 'csv'\` says otherwise. The JSON form is \`{cart: {…}, items: […]}\` and is exactly what carts.import takes back, so an export round-trips; the CSV form is the lines only, header first, and drops everything that lives on the cart rather than on a line. Nothing is stored and nothing about the cart changes — \`filename\` is a suggestion for a browser download, not a file this app keeps — and a cart of any status can be exported, including one already ordered.`)
  .option(`--id <id>`, `The cart, by its id — the \`id\` every cart answer carries. A uuid: the data plane casts the segment, so a code or a slug is refused before the cart is looked up.`)
  .option(`--format <format>`, `Format of an ad-hoc export, read only when no profile_id is sent. 'json' returns the whole \`{cart, items}\` document, 'csv' the lines alone. Default 'json'.`)
  .option(`--profile-id <profile-id>`, `The export profile to run — one of the ids \`GET /carts/io/profiles?direction=export\` lists. Omit it for an ad-hoc export in the canonical shape, which is what \`format\` is for.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, format, profileId } = await promptForMissing(
          _options,
          cartsExportSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}/export`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (format !== undefined) {
          _payload[`format`] = format;
        }
        if (profileId !== undefined) {
          _payload[`profile_id`] = profileId;
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
registerPromptSpecs(cartsIo.commands.at(-1)!, cartsExportSpecs, { method: "post" });
