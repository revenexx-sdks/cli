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

export const carts = new Command("carts")
  .description(
    commandDescriptions["carts"] ??
      `Manage carts resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Filter to one owning contact.", type: "string", required: false },
  { key: "sessionKey", option: "--session-key <session-key>", name: "session_key", description: "Filter to one guest session.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Filter by cart status (e.g. active).", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
carts
  .command(`list`)
  .description(`List carts (filter by contact_id/session_key/status; paginate limit/offset/order)`)
  .option(`--contact-id <contact-id>`, `Filter to one owning contact.`)
  .option(`--session-key <session-key>`, `Filter to one guest session.`)
  .option(`--status <status>`, `Filter by cart status (e.g. active).`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, sessionKey, status, limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts`;
        const _payload: RequestParams = {};
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (sessionKey !== undefined) {
          _payload[`session_key`] = sessionKey;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
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
registerPromptSpecs(carts.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Owning customer contact.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default EUR).", type: "string", required: false },
  { key: "isCurrent", option: "--is-current <is-current>", name: "is_current", description: "Make this THE current cart of its owner.", type: "boolean", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name (default 'Cart').", type: "string", required: false },
  { key: "sessionKey", option: "--session-key <session-key>", name: "session_key", description: "Owning guest session.", type: "string", required: false },
];
carts
  .command(`create`)
  .description(`Create a cart — owner is contact_id (customer) or session_key (guest)`)
  .option(`--channel-id <channel-id>`, ``)
  .option(`--contact-id <contact-id>`, `Owning customer contact.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR).`)
  .option(
    `--is-current [value]`,
    `Make this THE current cart of its owner.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, `Display name (default 'Cart').`)
  .option(`--session-key <session-key>`, `Owning guest session.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channelId, contactId, currency, isCurrent, metadata, name, sessionKey } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (isCurrent !== undefined) {
          _payload[`is_current`] = isCurrent;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (sessionKey !== undefined) {
          _payload[`session_key`] = sessionKey;
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
registerPromptSpecs(carts.commands.at(-1)!, createSpecs, { method: "post" });
const claimSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Contact taking ownership.", type: "string", required: true },
  { key: "sessionKey", option: "--session-key <session-key>", name: "session_key", description: "Guest session whose active carts are handed over.", type: "string", required: true },
  { key: "targetCartId", option: "--target-cart-id <target-cart-id>", name: "target_cart_id", description: "Merge the session carts into this cart instead of adopting them.", type: "string", required: false },
];
carts
  .command(`claim`)
  .description(`Hand session carts to a contact on login — adopt as customer carts or merge into a target cart`)
  .option(`--contact-id <contact-id>`, `Contact taking ownership.`)
  .option(`--session-key <session-key>`, `Guest session whose active carts are handed over.`)
  .option(`--target-cart-id <target-cart-id>`, `Merge the session carts into this cart instead of adopting them.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, sessionKey, targetCartId } = await promptForMissing(
          _options,
          claimSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/claim`;
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
registerPromptSpecs(carts.commands.at(-1)!, claimSpecs, { method: "post" });
const importSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Owner of a newly created cart.", type: "string", required: false },
  { key: "csv", option: "--csv <csv>", name: "csv", description: "Raw CSV content (alternative to payload for csv profiles).", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Name for a newly created cart.", type: "string", required: false },
  { key: "payload", option: "--payload <payload>", name: "payload", description: "The import payload: '{cart, items}' object, or a raw JSON/CSV string in the profile's format.", type: "object", required: false },
  { key: "profileId", option: "--profile-id <profile-id>", name: "profile_id", description: "Import profile to run; ad-hoc import when omitted.", type: "string", required: false },
  { key: "sessionKey", option: "--session-key <session-key>", name: "session_key", description: "Guest owner of a newly created cart.", type: "string", required: false },
  { key: "targetCartId", option: "--target-cart-id <target-cart-id>", name: "target_cart_id", description: "Existing active cart to import into.", type: "string", required: false },
];
carts
  .command(`import`)
  .description(`Import a cart through an import profile — into a new cart (owner required) or an existing target cart`)
  .option(`--contact-id <contact-id>`, `Owner of a newly created cart.`)
  .option(`--csv <csv>`, `Raw CSV content (alternative to payload for csv profiles).`)
  .option(`--name <name>`, `Name for a newly created cart.`)
  .option(`--payload <payload>`, `The import payload: '{cart, items}' object, or a raw JSON/CSV string in the profile's format.`)
  .option(`--profile-id <profile-id>`, `Import profile to run; ad-hoc import when omitted.`)
  .option(`--session-key <session-key>`, `Guest owner of a newly created cart.`)
  .option(`--target-cart-id <target-cart-id>`, `Existing active cart to import into.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, csv, name, payload, profileId, sessionKey, targetCartId } = await promptForMissing(
          _options,
          importSpecs,
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
registerPromptSpecs(carts.commands.at(-1)!, importSpecs, { method: "post" });
const ioProfilesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
carts
  .command(`io-profiles-list`)
  .description(`List import/export profiles (paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
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
          ioProfilesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/io/profiles`;
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
registerPromptSpecs(carts.commands.at(-1)!, ioProfilesListSpecs, { method: "get" });
const ioProfilesCreateSpecs: PromptSpec[] = [
  { key: "direction", option: "--direction <direction>", name: "direction", type: "string", required: true, enum: ["import","export"] },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "applyMode", option: "--apply-mode <apply-mode>", name: "apply_mode", description: "Default 'insert'.", type: "string", required: false, enum: ["insert","append","replace"] },
  { key: "entity", option: "--entity <entity>", name: "entity", description: "Default 'carts'.", type: "string", required: false, enum: ["carts","cart_items"] },
  { key: "format", option: "--format <format>", name: "format", description: "Default 'json'.", type: "string", required: false, enum: ["json","csv"] },
  { key: "isTemplate", option: "--is-template <is-template>", name: "is_template", type: "boolean", required: false },
  { key: "mapping", option: "--mapping <mapping>", name: "mapping", description: "Column mapping (Baseline-IO-compatible).", type: "object", required: false },
  { key: "options", option: "--options <options>", name: "options", type: "object", required: false },
];
carts
  .command(`io-profiles-create`)
  .description(`Create an import/export profile (Baseline-IO-compatible shape)`)
  .option(`--direction <direction>`, ``)
  .option(`--name <name>`, ``)
  .option(`--apply-mode <apply-mode>`, `Default 'insert'.`)
  .option(`--entity <entity>`, `Default 'carts'.`)
  .option(`--format <format>`, `Default 'json'.`)
  .option(
    `--is-template [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--mapping <mapping>`, `Column mapping (Baseline-IO-compatible).`)
  .option(`--options <options>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { direction, name, applyMode, entity, format, isTemplate, mapping, options } = await promptForMissing(
          _options,
          ioProfilesCreateSpecs,
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
registerPromptSpecs(carts.commands.at(-1)!, ioProfilesCreateSpecs, { method: "post" });
carts
  .command(`io-profiles-defaults`)
  .description(`Ensure the bundled profile templates exist (idempotent) — also runs on app.installed`)
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
const ioProfilesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts/io/profiles", hasLimit: true } },
];
carts
  .command(`io-profiles-delete`)
  .description(`Delete an import/export profile`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          ioProfilesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`carts io-profiles-delete`);
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
registerPromptSpecs(carts.commands.at(-1)!, ioProfilesDeleteSpecs, { method: "delete", destructive: true });
const ioProfilesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts/io/profiles", hasLimit: true } },
];
carts
  .command(`io-profiles-get`)
  .description(`Read one import/export profile`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          ioProfilesGetSpecs,
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
registerPromptSpecs(carts.commands.at(-1)!, ioProfilesGetSpecs, { method: "get" });
const ioProfilesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts/io/profiles", hasLimit: true } },
  { key: "applyMode", option: "--apply-mode <apply-mode>", name: "apply_mode", description: "Default 'insert'.", type: "string", required: false, enum: ["insert","append","replace"] },
  { key: "direction", option: "--direction <direction>", name: "direction", type: "string", required: false, enum: ["import","export"] },
  { key: "entity", option: "--entity <entity>", name: "entity", description: "Default 'carts'.", type: "string", required: false, enum: ["carts","cart_items"] },
  { key: "format", option: "--format <format>", name: "format", description: "Default 'json'.", type: "string", required: false, enum: ["json","csv"] },
  { key: "isTemplate", option: "--is-template <is-template>", name: "is_template", type: "boolean", required: false },
  { key: "mapping", option: "--mapping <mapping>", name: "mapping", description: "Column mapping (Baseline-IO-compatible).", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
  { key: "options", option: "--options <options>", name: "options", type: "object", required: false },
];
carts
  .command(`io-profiles-update`)
  .description(`Update an import/export profile`)
  .option(`--id <id>`, ``)
  .option(`--apply-mode <apply-mode>`, `Default 'insert'.`)
  .option(`--direction <direction>`, ``)
  .option(`--entity <entity>`, `Default 'carts'.`)
  .option(`--format <format>`, `Default 'json'.`)
  .option(
    `--is-template [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--mapping <mapping>`, `Column mapping (Baseline-IO-compatible).`)
  .option(`--name <name>`, ``)
  .option(`--options <options>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, applyMode, direction, entity, format, isTemplate, mapping, name, options } = await promptForMissing(
          _options,
          ioProfilesUpdateSpecs,
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
registerPromptSpecs(carts.commands.at(-1)!, ioProfilesUpdateSpecs, { method: "put" });
const mergeSpecs: PromptSpec[] = [
  { key: "sourceCartId", option: "--source-cart-id <source-cart-id>", name: "source_cart_id", description: "Cart whose lines move into the target (becomes status merged).", type: "string", required: true },
  { key: "targetCartId", option: "--target-cart-id <target-cart-id>", name: "target_cart_id", description: "Receiving cart (must be active).", type: "string", required: true },
];
carts
  .command(`merge`)
  .description(`Merge the source cart into the target cart (product lines merge by product+price; source becomes status merged)`)
  .option(`--source-cart-id <source-cart-id>`, `Cart whose lines move into the target (becomes status merged).`)
  .option(`--target-cart-id <target-cart-id>`, `Receiving cart (must be active).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { sourceCartId, targetCartId } = await promptForMissing(
          _options,
          mergeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/merge`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (sourceCartId !== undefined) {
          _payload[`source_cart_id`] = sourceCartId;
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
registerPromptSpecs(carts.commands.at(-1)!, mergeSpecs, { method: "post" });
const itemsListSpecs: PromptSpec[] = [
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
carts
  .command(`items-list`)
  .description(`List the items of a cart (position order)`)
  .option(`--cart-id <cart-id>`, ``)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cartId, filter } = await promptForMissing(
          _options,
          itemsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items`.replace(`{cart_id}`, cartId);
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
registerPromptSpecs(carts.commands.at(-1)!, itemsListSpecs, { method: "get" });
const itemsCreateSpecs: PromptSpec[] = [
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
  { key: "configuration", option: "--configuration <configuration>", name: "configuration", description: "Free-form configuration — configured lines never merge.", type: "object", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Defaults to the cart's currency.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Falls back to 'sku' when omitted.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Default 1.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", type: "string", required: false },
  { key: "snapshot", option: "--snapshot <snapshot>", name: "snapshot", description: "Loose product snapshot at add-time (price, name, image, …).", type: "object", required: false },
  { key: "taxRate", option: "--tax-rate <tax-rate>", name: "tax_rate", type: "number", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "Line type (default 'product'). Plain product lines merge by product+price; configurations always stand alone.", type: "string", required: false, enum: ["product","configuration","custom"] },
  { key: "unit", option: "--unit <unit>", name: "unit", type: "string", required: false },
  { key: "unitPrice", option: "--unit-price <unit-price>", name: "unit_price", description: "Per-unit net price — line_total is always derived.", type: "number", required: false },
];
carts
  .command(`items-create`)
  .description(`Add an item — plain product lines merge by product+price, configurations always stand alone`)
  .option(`--cart-id <cart-id>`, ``)
  .option(`--configuration <configuration>`, `Free-form configuration — configured lines never merge.`)
  .option(`--currency <currency>`, `Defaults to the cart's currency.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, `Falls back to 'sku' when omitted.`)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--product-id <product-id>`, ``)
  .option(`--quantity <quantity>`, `Default 1.`, parseInteger)
  .option(`--sku <sku>`, ``)
  .option(`--snapshot <snapshot>`, `Loose product snapshot at add-time (price, name, image, …).`)
  .option(`--tax-rate <tax-rate>`, ``, parseInteger)
  .option(`--type <type>`, `Line type (default 'product'). Plain product lines merge by product+price; configurations always stand alone.`)
  .option(`--unit <unit>`, ``)
  .option(`--unit-price <unit-price>`, `Per-unit net price — line_total is always derived.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cartId, configuration, currency, metadata, name, position, productId, quantity, sku, snapshot, taxRate, type, unit, unitPrice } = await promptForMissing(
          _options,
          itemsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items`.replace(`{cart_id}`, cartId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (configuration !== undefined) {
          _payload[`configuration`] = resolveBodyParam(configuration);
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (snapshot !== undefined) {
          _payload[`snapshot`] = resolveBodyParam(snapshot);
        }
        if (taxRate !== undefined) {
          _payload[`tax_rate`] = taxRate;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
        }
        if (unitPrice !== undefined) {
          _payload[`unit_price`] = unitPrice;
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
registerPromptSpecs(carts.commands.at(-1)!, itemsCreateSpecs, { method: "post" });
const itemsReplaceSpecs: PromptSpec[] = [
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
  { key: "items", option: "--items [items...]", name: "items", description: "The complete new item set (set semantics).", type: "array", required: true },
];
carts
  .command(`items-replace`)
  .description(`Replace ALL items of a cart (set semantics — the storefront sync)`)
  .option(`--cart-id <cart-id>`, ``)
  .option(`--items [items...]`, `The complete new item set (set semantics).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cartId, items } = await promptForMissing(
          _options,
          itemsReplaceSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items`.replace(`{cart_id}`, cartId);
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
registerPromptSpecs(carts.commands.at(-1)!, itemsReplaceSpecs, { method: "put" });
const itemsDeleteSpecs: PromptSpec[] = [
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts/{cart_id}/items", hasLimit: false } },
];
carts
  .command(`items-delete`)
  .description(`Remove an item from a cart`)
  .option(`--cart-id <cart-id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cartId, id } = await promptForMissing(
          _options,
          itemsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`carts items-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items/{id}`.replace(`{cart_id}`, cartId).replace(`{id}`, id);
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
registerPromptSpecs(carts.commands.at(-1)!, itemsDeleteSpecs, { method: "delete", destructive: true });
const itemsGetSpecs: PromptSpec[] = [
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts/{cart_id}/items", hasLimit: false } },
];
carts
  .command(`items-get`)
  .description(`Read one cart item`)
  .option(`--cart-id <cart-id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cartId, id } = await promptForMissing(
          _options,
          itemsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items/{id}`.replace(`{cart_id}`, cartId).replace(`{id}`, id);
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
registerPromptSpecs(carts.commands.at(-1)!, itemsGetSpecs, { method: "get" });
const itemsUpdateSpecs: PromptSpec[] = [
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts/{cart_id}/items", hasLimit: false } },
  { key: "configuration", option: "--configuration <configuration>", name: "configuration", description: "Free-form configuration — configured lines never merge.", type: "object", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Defaults to the cart's currency.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Falls back to 'sku' when omitted.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Default 1.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", type: "string", required: false },
  { key: "snapshot", option: "--snapshot <snapshot>", name: "snapshot", description: "Loose product snapshot at add-time (price, name, image, …).", type: "object", required: false },
  { key: "taxRate", option: "--tax-rate <tax-rate>", name: "tax_rate", type: "number", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "Line type (default 'product'). Plain product lines merge by product+price; configurations always stand alone.", type: "string", required: false, enum: ["product","configuration","custom"] },
  { key: "unit", option: "--unit <unit>", name: "unit", type: "string", required: false },
  { key: "unitPrice", option: "--unit-price <unit-price>", name: "unit_price", description: "Per-unit net price — line_total is always derived.", type: "number", required: false },
];
carts
  .command(`items-update`)
  .description(`Update a cart item (quantity, price, configuration, …) — line_total is derived`)
  .option(`--cart-id <cart-id>`, ``)
  .option(`--id <id>`, ``)
  .option(`--configuration <configuration>`, `Free-form configuration — configured lines never merge.`)
  .option(`--currency <currency>`, `Defaults to the cart's currency.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, `Falls back to 'sku' when omitted.`)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--product-id <product-id>`, ``)
  .option(`--quantity <quantity>`, `Default 1.`, parseInteger)
  .option(`--sku <sku>`, ``)
  .option(`--snapshot <snapshot>`, `Loose product snapshot at add-time (price, name, image, …).`)
  .option(`--tax-rate <tax-rate>`, ``, parseInteger)
  .option(`--type <type>`, `Line type (default 'product'). Plain product lines merge by product+price; configurations always stand alone.`)
  .option(`--unit <unit>`, ``)
  .option(`--unit-price <unit-price>`, `Per-unit net price — line_total is always derived.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cartId, id, configuration, currency, metadata, name, position, productId, quantity, sku, snapshot, taxRate, type, unit, unitPrice } = await promptForMissing(
          _options,
          itemsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items/{id}`.replace(`{cart_id}`, cartId).replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (configuration !== undefined) {
          _payload[`configuration`] = resolveBodyParam(configuration);
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (snapshot !== undefined) {
          _payload[`snapshot`] = resolveBodyParam(snapshot);
        }
        if (taxRate !== undefined) {
          _payload[`tax_rate`] = taxRate;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
        }
        if (unitPrice !== undefined) {
          _payload[`unit_price`] = unitPrice;
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
registerPromptSpecs(carts.commands.at(-1)!, itemsUpdateSpecs, { method: "put" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
];
carts
  .command(`delete`)
  .description(`Delete a cart including its items`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`carts delete`);
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(carts.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
];
carts
  .command(`get`)
  .description(`Read one cart by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(carts.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
];
carts
  .command(`update`)
  .description(`Update a cart (name, currency, market/channel, metadata) — status moves through the lifecycle routes`)
  .option(`--id <id>`, ``)
  .option(`--channel-id <channel-id>`, ``)
  .option(`--currency <currency>`, `ISO 4217 code.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, channelId, currency, metadata, name } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
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
registerPromptSpecs(carts.commands.at(-1)!, updateSpecs, { method: "put" });
const abandonSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
];
carts
  .command(`abandon`)
  .description(`Abandon an active cart (analytics: abandonment funnel)`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          abandonSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}/abandon`.replace(`{id}`, id);
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
registerPromptSpecs(carts.commands.at(-1)!, abandonSpecs, { method: "post" });
const activateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
];
carts
  .command(`activate`)
  .description(`Mark a cart as THE current cart of its owner (one per owner)`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          activateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}/activate`.replace(`{id}`, id);
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
registerPromptSpecs(carts.commands.at(-1)!, activateSpecs, { method: "post" });
const exportSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
  { key: "format", option: "--format <format>", name: "format", description: "Ad-hoc export format (only without profile_id).", type: "string", required: false, enum: ["json","csv"] },
  { key: "profileId", option: "--profile-id <profile-id>", name: "profile_id", description: "Export profile to run; ad-hoc JSON/CSV export when omitted.", type: "string", required: false },
];
carts
  .command(`export`)
  .description(`Export a cart through an export profile (or ad-hoc json/csv)`)
  .option(`--id <id>`, ``)
  .option(`--format <format>`, `Ad-hoc export format (only without profile_id).`)
  .option(`--profile-id <profile-id>`, `Export profile to run; ad-hoc JSON/CSV export when omitted.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, format, profileId } = await promptForMissing(
          _options,
          exportSpecs,
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
registerPromptSpecs(carts.commands.at(-1)!, exportSpecs, { method: "post" });
const orderSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "External order reference from order management.", type: "string", required: false },
];
carts
  .command(`order`)
  .description(`Mark an active cart as ordered (+order_ref) — the order-management hand-over`)
  .option(`--id <id>`, ``)
  .option(`--order-ref <order-ref>`, `External order reference from order management.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, orderRef } = await promptForMissing(
          _options,
          orderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}/order`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (orderRef !== undefined) {
          _payload[`order_ref`] = orderRef;
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
registerPromptSpecs(carts.commands.at(-1)!, orderSpecs, { method: "post" });
const reopenSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
];
carts
  .command(`reopen`)
  .description(`Reopen an abandoned cart`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          reopenSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}/reopen`.replace(`{id}`, id);
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
registerPromptSpecs(carts.commands.at(-1)!, reopenSpecs, { method: "post" });
