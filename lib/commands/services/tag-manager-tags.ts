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

export const tagManagerTags = new Command("tag-manager-tags")
  .description(
    commandDescriptions["tagManagerTags"] ??
      `Marketing tags, the triggers that say when one is wanted, and the variables their settings use. A marketing tag names the VENDOR it loads and the PURPOSE it serves, exactly as the consent manager discloses them; the storefront loads it only when the visitor's consent covers that pair. There are two kinds and no third: a registry entry (the @nuxt/scripts registry plus etracker, HubSpot and Tawk.to) with a configuration checked against that entry's schema, or an https script. Custom HTML does not exist. Also here: the registry itself and the theme event vocabulary a trigger and an event map may name.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const tagManagerRegistryListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
tagManagerTags
  .command(`tag-manager-registry-list`)
  .description(`Every registry key a marketing tag may name, with its label, category, the consent catalogue vendor code it usually discloses as (\`vendor\`, repeated as \`vendor_key\` for looking up the catalogue logo), its hosts, the JSON Schema of its configuration and its default event map. Every configuration property carries \`title\` and \`description\` as English strings and \`x-title\` / \`x-description\` as { de, en } for the tag form.`)
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
          tagManagerRegistryListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/registry`;
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, tagManagerRegistryListSpecs, { method: "get" });
const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Only rows whose `id` equals this value.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Only rows whose `code` equals this value.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Only rows whose `name` equals this value.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "Only rows whose `description` equals this value.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Only rows whose `kind` equals this value.", type: "string", required: false },
  { key: "registryKey", option: "--registry-key <registry-key>", name: "registry_key", description: "Only rows whose `registry_key` equals this value.", type: "string", required: false },
  { key: "scriptUrl", option: "--script-url <script-url>", name: "script_url", description: "Only rows whose `script_url` equals this value.", type: "string", required: false },
  { key: "vendorCode", option: "--vendor-code <vendor-code>", name: "vendor_code", description: "Only rows whose `vendor_code` equals this value.", type: "string", required: false },
  { key: "purposeCode", option: "--purpose-code <purpose-code>", name: "purpose_code", description: "Only rows whose `purpose_code` equals this value.", type: "string", required: false },
  { key: "load", option: "--load <load>", name: "load", description: "Only rows whose `load` equals this value.", type: "string", required: false },
  { key: "isActive", option: "--is-active <is-active>", name: "is_active", description: "Only rows whose `is_active` equals this value.", type: "boolean", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Only rows whose `created_at` equals this value.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Only rows whose `updated_at` equals this value.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
tagManagerTags
  .command(`list`)
  .description(`Every marketing tag of this tenant visible in the requested market, paged. Equality filters on plain columns; jsonb columns are answered but not filterable.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(`--id <id>`, `Only rows whose \`id\` equals this value.`)
  .option(`--code <code>`, `Only rows whose \`code\` equals this value.`)
  .option(`--name <name>`, `Only rows whose \`name\` equals this value.`)
  .option(`--description <description>`, `Only rows whose \`description\` equals this value.`)
  .option(`--kind <kind>`, `Only rows whose \`kind\` equals this value.`)
  .option(`--registry-key <registry-key>`, `Only rows whose \`registry_key\` equals this value.`)
  .option(`--script-url <script-url>`, `Only rows whose \`script_url\` equals this value.`)
  .option(`--vendor-code <vendor-code>`, `Only rows whose \`vendor_code\` equals this value.`)
  .option(`--purpose-code <purpose-code>`, `Only rows whose \`purpose_code\` equals this value.`)
  .option(`--load <load>`, `Only rows whose \`load\` equals this value.`)
  .option(
    `--is-active [value]`,
    `Only rows whose \`is_active\` equals this value.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--created-at <created-at>`, `Only rows whose \`created_at\` equals this value.`)
  .option(`--updated-at <updated-at>`, `Only rows whose \`updated_at\` equals this value.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, code, name, description, kind, registryKey, scriptUrl, vendorCode, purposeCode, load, isActive, createdAt, updatedAt, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/tags`;
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
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (registryKey !== undefined) {
          _payload[`registry_key`] = registryKey;
        }
        if (scriptUrl !== undefined) {
          _payload[`script_url`] = scriptUrl;
        }
        if (vendorCode !== undefined) {
          _payload[`vendor_code`] = vendorCode;
        }
        if (purposeCode !== undefined) {
          _payload[`purpose_code`] = purposeCode;
        }
        if (load !== undefined) {
          _payload[`load`] = load;
        }
        if (isActive !== undefined) {
          _payload[`is_active`] = isActive;
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "chainedVendorCodes", option: "--chained-vendor-codes [chained-vendor-codes...]", name: "chained_vendor_codes", description: "Vendors this tag loads by itself — Google Analytics under a Google Tag Manager container. They do not decide whether the tag loads, but each must be disclosed in the policy, or the publish is refused.", type: "array", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "The row's stable handle, unique per tenant: lowercase letters, digits, '-' and '_'.", type: "string", required: false },
  { key: "config", option: "--config <config>", name: "config", description: "For a registry tag: the options passed to that registry entry, checked against its `config_schema` on every write. A value may be a `{{variable}}` placeholder, checked again once resolved at publish. Consent Mode defaults and personal data are never options.", type: "object", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "Free text for the merchant: why this tag exists.", type: "string", required: false },
  { key: "eventMap", option: "--event-map <event-map>", name: "event_map", description: "Theme event → the vendor's own call, `{ name, params? }` or a name. Overrides the registry's default map per event; `null` removes a default. Keys must be events of theme-events/1.", type: "object", required: false },
  { key: "isActive", option: "--is-active <is-active>", name: "is_active", description: "Whether the tag is part of the next published container. An inactive tag is kept but never published.", type: "boolean", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "`registry` (an entry of GET /tag-manager/registry) or `script` (an https address). There is no custom HTML kind, and anything else is refused with 422.", type: "string", required: false, enum: ["registry","script"] },
  { key: "load", option: "--load <load>", name: "load", description: "When the storefront starts loading the tag once allowed: `immediate`, `idle` or `interaction`. A new tag without one takes the market's `default_load` setting.", type: "string", required: false, enum: ["immediate","idle","interaction"] },
  { key: "name", option: "--name <name>", name: "name", description: "What the row is called, as a person reads it.", type: "string", required: false },
  { key: "purposeCode", option: "--purpose-code <purpose-code>", name: "purpose_code", description: "The purpose this tag serves (`statistics`, `marketing`, `necessary`, …). The vendor must be disclosed for exactly this purpose. Required.", type: "string", required: false },
  { key: "registryKey", option: "--registry-key <registry-key>", name: "registry_key", description: "For a registry tag: the @nuxt/scripts registry key (`googleAnalytics`, `etracker`, …). Empty for a script tag.", type: "string", required: false },
  { key: "scriptUrl", option: "--script-url <script-url>", name: "script_url", description: "For a script tag: the absolute https:// address it loads. Empty for a registry tag.", type: "string", required: false },
  { key: "vendorCode", option: "--vendor-code <vendor-code>", name: "vendor_code", description: "The vendor this tag loads, as the consent manager's published policy discloses it (`google-analytics`, `etracker`). Required.", type: "string", required: false },
];
tagManagerTags
  .command(`create`)
  .description(`Create one marketing tag. Every rule is checked and every broken one is named in the 422.`)
  .option(`--chained-vendor-codes [chained-vendor-codes...]`, `Vendors this tag loads by itself — Google Analytics under a Google Tag Manager container. They do not decide whether the tag loads, but each must be disclosed in the policy, or the publish is refused.`)
  .option(`--code <code>`, `The row's stable handle, unique per tenant: lowercase letters, digits, '-' and '_'.`)
  .option(`--config <config>`, `For a registry tag: the options passed to that registry entry, checked against its \`config_schema\` on every write. A value may be a \`{{variable}}\` placeholder, checked again once resolved at publish. Consent Mode defaults and personal data are never options.`)
  .option(`--description <description>`, `Free text for the merchant: why this tag exists.`)
  .option(`--event-map <event-map>`, `Theme event → the vendor's own call, \`{ name, params? }\` or a name. Overrides the registry's default map per event; \`null\` removes a default. Keys must be events of theme-events/1.`)
  .option(
    `--is-active [value]`,
    `Whether the tag is part of the next published container. An inactive tag is kept but never published.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--kind <kind>`, `\`registry\` (an entry of GET /tag-manager/registry) or \`script\` (an https address). There is no custom HTML kind, and anything else is refused with 422.`)
  .option(`--load <load>`, `When the storefront starts loading the tag once allowed: \`immediate\`, \`idle\` or \`interaction\`. A new tag without one takes the market's \`default_load\` setting.`)
  .option(`--name <name>`, `What the row is called, as a person reads it.`)
  .option(`--purpose-code <purpose-code>`, `The purpose this tag serves (\`statistics\`, \`marketing\`, \`necessary\`, …). The vendor must be disclosed for exactly this purpose. Required.`)
  .option(`--registry-key <registry-key>`, `For a registry tag: the @nuxt/scripts registry key (\`googleAnalytics\`, \`etracker\`, …). Empty for a script tag.`)
  .option(`--script-url <script-url>`, `For a script tag: the absolute https:// address it loads. Empty for a registry tag.`)
  .option(`--vendor-code <vendor-code>`, `The vendor this tag loads, as the consent manager's published policy discloses it (\`google-analytics\`, \`etracker\`). Required.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { chainedVendorCodes, code, config, description, eventMap, isActive, kind, load, name, purposeCode, registryKey, scriptUrl, vendorCode } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/tags`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (chainedVendorCodes !== undefined) {
          _payload[`chained_vendor_codes`] = chainedVendorCodes;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (config !== undefined) {
          _payload[`config`] = resolveBodyParam(config);
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (eventMap !== undefined) {
          _payload[`event_map`] = resolveBodyParam(eventMap);
        }
        if (isActive !== undefined) {
          _payload[`is_active`] = isActive;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (load !== undefined) {
          _payload[`load`] = load;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (purposeCode !== undefined) {
          _payload[`purpose_code`] = purposeCode;
        }
        if (registryKey !== undefined) {
          _payload[`registry_key`] = registryKey;
        }
        if (scriptUrl !== undefined) {
          _payload[`script_url`] = scriptUrl;
        }
        if (vendorCode !== undefined) {
          _payload[`vendor_code`] = vendorCode;
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The id of the marketing tag.", type: "string", required: true, resource: { listPath: "/tag-manager/tags", hasLimit: true } },
];
tagManagerTags
  .command(`delete`)
  .description(`Delete one marketing tag.`)
  .option(`--id <id>`, `The id of the marketing tag.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`tag-manager-tags delete`);
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/tags/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The id of the marketing tag.", type: "string", required: true, resource: { listPath: "/tag-manager/tags", hasLimit: true } },
];
tagManagerTags
  .command(`get`)
  .description(`One marketing tag by id.`)
  .option(`--id <id>`, `The id of the marketing tag.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/tags/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The id of the marketing tag.", type: "string", required: true, resource: { listPath: "/tag-manager/tags", hasLimit: true } },
  { key: "chainedVendorCodes", option: "--chained-vendor-codes [chained-vendor-codes...]", name: "chained_vendor_codes", description: "Vendors this tag loads by itself — Google Analytics under a Google Tag Manager container. They do not decide whether the tag loads, but each must be disclosed in the policy, or the publish is refused.", type: "array", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "The row's stable handle, unique per tenant: lowercase letters, digits, '-' and '_'.", type: "string", required: false },
  { key: "config", option: "--config <config>", name: "config", description: "For a registry tag: the options passed to that registry entry, checked against its `config_schema` on every write. A value may be a `{{variable}}` placeholder, checked again once resolved at publish. Consent Mode defaults and personal data are never options.", type: "object", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "Free text for the merchant: why this tag exists.", type: "string", required: false },
  { key: "eventMap", option: "--event-map <event-map>", name: "event_map", description: "Theme event → the vendor's own call, `{ name, params? }` or a name. Overrides the registry's default map per event; `null` removes a default. Keys must be events of theme-events/1.", type: "object", required: false },
  { key: "isActive", option: "--is-active <is-active>", name: "is_active", description: "Whether the tag is part of the next published container. An inactive tag is kept but never published.", type: "boolean", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "`registry` (an entry of GET /tag-manager/registry) or `script` (an https address). There is no custom HTML kind, and anything else is refused with 422.", type: "string", required: false, enum: ["registry","script"] },
  { key: "load", option: "--load <load>", name: "load", description: "When the storefront starts loading the tag once allowed: `immediate`, `idle` or `interaction`. A new tag without one takes the market's `default_load` setting.", type: "string", required: false, enum: ["immediate","idle","interaction"] },
  { key: "name", option: "--name <name>", name: "name", description: "What the row is called, as a person reads it.", type: "string", required: false },
  { key: "purposeCode", option: "--purpose-code <purpose-code>", name: "purpose_code", description: "The purpose this tag serves (`statistics`, `marketing`, `necessary`, …). The vendor must be disclosed for exactly this purpose. Required.", type: "string", required: false },
  { key: "registryKey", option: "--registry-key <registry-key>", name: "registry_key", description: "For a registry tag: the @nuxt/scripts registry key (`googleAnalytics`, `etracker`, …). Empty for a script tag.", type: "string", required: false },
  { key: "scriptUrl", option: "--script-url <script-url>", name: "script_url", description: "For a script tag: the absolute https:// address it loads. Empty for a registry tag.", type: "string", required: false },
  { key: "vendorCode", option: "--vendor-code <vendor-code>", name: "vendor_code", description: "The vendor this tag loads, as the consent manager's published policy discloses it (`google-analytics`, `etracker`). Required.", type: "string", required: false },
];
tagManagerTags
  .command(`update`)
  .description(`Edit one marketing tag. The row it would leave is checked whole.`)
  .option(`--id <id>`, `The id of the marketing tag.`)
  .option(`--chained-vendor-codes [chained-vendor-codes...]`, `Vendors this tag loads by itself — Google Analytics under a Google Tag Manager container. They do not decide whether the tag loads, but each must be disclosed in the policy, or the publish is refused.`)
  .option(`--code <code>`, `The row's stable handle, unique per tenant: lowercase letters, digits, '-' and '_'.`)
  .option(`--config <config>`, `For a registry tag: the options passed to that registry entry, checked against its \`config_schema\` on every write. A value may be a \`{{variable}}\` placeholder, checked again once resolved at publish. Consent Mode defaults and personal data are never options.`)
  .option(`--description <description>`, `Free text for the merchant: why this tag exists.`)
  .option(`--event-map <event-map>`, `Theme event → the vendor's own call, \`{ name, params? }\` or a name. Overrides the registry's default map per event; \`null\` removes a default. Keys must be events of theme-events/1.`)
  .option(
    `--is-active [value]`,
    `Whether the tag is part of the next published container. An inactive tag is kept but never published.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--kind <kind>`, `\`registry\` (an entry of GET /tag-manager/registry) or \`script\` (an https address). There is no custom HTML kind, and anything else is refused with 422.`)
  .option(`--load <load>`, `When the storefront starts loading the tag once allowed: \`immediate\`, \`idle\` or \`interaction\`. A new tag without one takes the market's \`default_load\` setting.`)
  .option(`--name <name>`, `What the row is called, as a person reads it.`)
  .option(`--purpose-code <purpose-code>`, `The purpose this tag serves (\`statistics\`, \`marketing\`, \`necessary\`, …). The vendor must be disclosed for exactly this purpose. Required.`)
  .option(`--registry-key <registry-key>`, `For a registry tag: the @nuxt/scripts registry key (\`googleAnalytics\`, \`etracker\`, …). Empty for a script tag.`)
  .option(`--script-url <script-url>`, `For a script tag: the absolute https:// address it loads. Empty for a registry tag.`)
  .option(`--vendor-code <vendor-code>`, `The vendor this tag loads, as the consent manager's published policy discloses it (\`google-analytics\`, \`etracker\`). Required.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, chainedVendorCodes, code, config, description, eventMap, isActive, kind, load, name, purposeCode, registryKey, scriptUrl, vendorCode } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/tags/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (chainedVendorCodes !== undefined) {
          _payload[`chained_vendor_codes`] = chainedVendorCodes;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (config !== undefined) {
          _payload[`config`] = resolveBodyParam(config);
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (eventMap !== undefined) {
          _payload[`event_map`] = resolveBodyParam(eventMap);
        }
        if (isActive !== undefined) {
          _payload[`is_active`] = isActive;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (load !== undefined) {
          _payload[`load`] = load;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (purposeCode !== undefined) {
          _payload[`purpose_code`] = purposeCode;
        }
        if (registryKey !== undefined) {
          _payload[`registry_key`] = registryKey;
        }
        if (scriptUrl !== undefined) {
          _payload[`script_url`] = scriptUrl;
        }
        if (vendorCode !== undefined) {
          _payload[`vendor_code`] = vendorCode;
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, updateSpecs, { method: "put" });
const triggersListSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The id of the marketing tag.", type: "string", required: true, resource: { listPath: "/tag-manager/tags", hasLimit: true } },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
tagManagerTags
  .command(`triggers-list`)
  .description(`The triggers attached to one marketing tag. A tag with none loads on every page.`)
  .option(`--id <id>`, `The id of the marketing tag.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, filter } = await promptForMissing(
          _options,
          triggersListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/tags/{id}/triggers`.replace(`{id}`, id);
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, triggersListSpecs, { method: "get" });
const triggersAttachSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The id of the marketing tag.", type: "string", required: true, resource: { listPath: "/tag-manager/tags", hasLimit: true } },
  { key: "triggerId", option: "--trigger-id <trigger-id>", name: "trigger_id", description: "The trigger to attach.", type: "string", required: true },
];
tagManagerTags
  .command(`triggers-attach`)
  .description(`Attach one trigger to one marketing tag. A pair is attached once.`)
  .option(`--id <id>`, `The id of the marketing tag.`)
  .option(`--trigger-id <trigger-id>`, `The trigger to attach.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, triggerId } = await promptForMissing(
          _options,
          triggersAttachSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/tags/{id}/triggers`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (triggerId !== undefined) {
          _payload[`trigger_id`] = triggerId;
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, triggersAttachSpecs, { method: "post" });
const triggersDetachSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The id of the marketing tag.", type: "string", required: true, resource: { listPath: "/tag-manager/tags", hasLimit: true } },
  { key: "triggerId", option: "--trigger-id <trigger-id>", name: "trigger_id", description: "The id of the trigger.", type: "string", required: true, resource: { listPath: "/tag-manager/tags/{id}/triggers", hasLimit: false } },
];
tagManagerTags
  .command(`triggers-detach`)
  .description(`Remove one trigger from one marketing tag.`)
  .option(`--id <id>`, `The id of the marketing tag.`)
  .option(`--trigger-id <trigger-id>`, `The id of the trigger.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, triggerId } = await promptForMissing(
          _options,
          triggersDetachSpecs,
          _command,
        );
        await confirmDestructive(`tag-manager-tags triggers-detach`);
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/tags/{id}/triggers/{trigger_id}`.replace(`{id}`, id).replace(`{trigger_id}`, triggerId);
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, triggersDetachSpecs, { method: "delete", destructive: true });
const tagManagerTriggersListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Only rows whose `id` equals this value.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Only rows whose `code` equals this value.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Only rows whose `name` equals this value.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Only rows whose `kind` equals this value.", type: "string", required: false },
  { key: "eventName", option: "--event-name <event-name>", name: "event_name", description: "Only rows whose `event_name` equals this value.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Only rows whose `created_at` equals this value.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Only rows whose `updated_at` equals this value.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
tagManagerTags
  .command(`tag-manager-triggers-list`)
  .description(`Every trigger of this tenant visible in the requested market, paged. Equality filters on plain columns; jsonb columns are answered but not filterable.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(`--id <id>`, `Only rows whose \`id\` equals this value.`)
  .option(`--code <code>`, `Only rows whose \`code\` equals this value.`)
  .option(`--name <name>`, `Only rows whose \`name\` equals this value.`)
  .option(`--kind <kind>`, `Only rows whose \`kind\` equals this value.`)
  .option(`--event-name <event-name>`, `Only rows whose \`event_name\` equals this value.`)
  .option(`--created-at <created-at>`, `Only rows whose \`created_at\` equals this value.`)
  .option(`--updated-at <updated-at>`, `Only rows whose \`updated_at\` equals this value.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, code, name, kind, eventName, createdAt, updatedAt, filter } = await promptForMissing(
          _options,
          tagManagerTriggersListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/triggers`;
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
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (eventName !== undefined) {
          _payload[`event_name`] = eventName;
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, tagManagerTriggersListSpecs, { method: "get" });
const tagManagerTriggersCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "The row's stable handle, unique per tenant: lowercase letters, digits, '-' and '_'.", type: "string", required: false },
  { key: "conditions", option: "--conditions <conditions>", name: "conditions", description: "Narrowing, every key optional and all set keys must match: `path_prefixes` (paths starting with /), `page_types` (the contract's page types), `b2b` (true/false).", type: "object", required: false },
  { key: "eventName", option: "--event-name <event-name>", name: "event_name", description: "For a theme_event trigger: an event of theme-events/1. Empty for a page_view trigger.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "`page_view` (on page views matching the conditions) or `theme_event` (when the named event happens).", type: "string", required: false, enum: ["page_view","theme_event"] },
  { key: "name", option: "--name <name>", name: "name", description: "What the row is called, as a person reads it.", type: "string", required: false },
];
tagManagerTags
  .command(`tag-manager-triggers-create`)
  .description(`Create one trigger. Every rule is checked and every broken one is named in the 422.`)
  .option(`--code <code>`, `The row's stable handle, unique per tenant: lowercase letters, digits, '-' and '_'.`)
  .option(`--conditions <conditions>`, `Narrowing, every key optional and all set keys must match: \`path_prefixes\` (paths starting with /), \`page_types\` (the contract's page types), \`b2b\` (true/false).`)
  .option(`--event-name <event-name>`, `For a theme_event trigger: an event of theme-events/1. Empty for a page_view trigger.`)
  .option(`--kind <kind>`, `\`page_view\` (on page views matching the conditions) or \`theme_event\` (when the named event happens).`)
  .option(`--name <name>`, `What the row is called, as a person reads it.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, conditions, eventName, kind, name } = await promptForMissing(
          _options,
          tagManagerTriggersCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/triggers`;
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
        if (conditions !== undefined) {
          _payload[`conditions`] = resolveBodyParam(conditions);
        }
        if (eventName !== undefined) {
          _payload[`event_name`] = eventName;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, tagManagerTriggersCreateSpecs, { method: "post" });
const tagManagerTriggersDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The id of the trigger.", type: "string", required: true, resource: { listPath: "/tag-manager/triggers", hasLimit: true } },
];
tagManagerTags
  .command(`tag-manager-triggers-delete`)
  .description(`Delete one trigger.`)
  .option(`--id <id>`, `The id of the trigger.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          tagManagerTriggersDeleteSpecs,
          _command,
        );
        await confirmDestructive(`tag-manager-tags tag-manager-triggers-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/triggers/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, tagManagerTriggersDeleteSpecs, { method: "delete", destructive: true });
const tagManagerTriggersGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The id of the trigger.", type: "string", required: true, resource: { listPath: "/tag-manager/triggers", hasLimit: true } },
];
tagManagerTags
  .command(`tag-manager-triggers-get`)
  .description(`One trigger by id.`)
  .option(`--id <id>`, `The id of the trigger.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          tagManagerTriggersGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/triggers/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, tagManagerTriggersGetSpecs, { method: "get" });
const tagManagerTriggersUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The id of the trigger.", type: "string", required: true, resource: { listPath: "/tag-manager/triggers", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "The row's stable handle, unique per tenant: lowercase letters, digits, '-' and '_'.", type: "string", required: false },
  { key: "conditions", option: "--conditions <conditions>", name: "conditions", description: "Narrowing, every key optional and all set keys must match: `path_prefixes` (paths starting with /), `page_types` (the contract's page types), `b2b` (true/false).", type: "object", required: false },
  { key: "eventName", option: "--event-name <event-name>", name: "event_name", description: "For a theme_event trigger: an event of theme-events/1. Empty for a page_view trigger.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "`page_view` (on page views matching the conditions) or `theme_event` (when the named event happens).", type: "string", required: false, enum: ["page_view","theme_event"] },
  { key: "name", option: "--name <name>", name: "name", description: "What the row is called, as a person reads it.", type: "string", required: false },
];
tagManagerTags
  .command(`tag-manager-triggers-update`)
  .description(`Edit one trigger. The row it would leave is checked whole.`)
  .option(`--id <id>`, `The id of the trigger.`)
  .option(`--code <code>`, `The row's stable handle, unique per tenant: lowercase letters, digits, '-' and '_'.`)
  .option(`--conditions <conditions>`, `Narrowing, every key optional and all set keys must match: \`path_prefixes\` (paths starting with /), \`page_types\` (the contract's page types), \`b2b\` (true/false).`)
  .option(`--event-name <event-name>`, `For a theme_event trigger: an event of theme-events/1. Empty for a page_view trigger.`)
  .option(`--kind <kind>`, `\`page_view\` (on page views matching the conditions) or \`theme_event\` (when the named event happens).`)
  .option(`--name <name>`, `What the row is called, as a person reads it.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, conditions, eventName, kind, name } = await promptForMissing(
          _options,
          tagManagerTriggersUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/triggers/{id}`.replace(`{id}`, id);
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
        if (conditions !== undefined) {
          _payload[`conditions`] = resolveBodyParam(conditions);
        }
        if (eventName !== undefined) {
          _payload[`event_name`] = eventName;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, tagManagerTriggersUpdateSpecs, { method: "put" });
const tagManagerVariablesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Only rows whose `id` equals this value.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Only rows whose `code` equals this value.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Only rows whose `name` equals this value.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Only rows whose `kind` equals this value.", type: "string", required: false },
  { key: "path", option: "--path <path>", name: "path", description: "Only rows whose `path` equals this value.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Only rows whose `created_at` equals this value.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Only rows whose `updated_at` equals this value.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
tagManagerTags
  .command(`tag-manager-variables-list`)
  .description(`Every variable of this tenant visible in the requested market, paged. Equality filters on plain columns; jsonb columns are answered but not filterable.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(`--id <id>`, `Only rows whose \`id\` equals this value.`)
  .option(`--code <code>`, `Only rows whose \`code\` equals this value.`)
  .option(`--name <name>`, `Only rows whose \`name\` equals this value.`)
  .option(`--kind <kind>`, `Only rows whose \`kind\` equals this value.`)
  .option(`--path <path>`, `Only rows whose \`path\` equals this value.`)
  .option(`--created-at <created-at>`, `Only rows whose \`created_at\` equals this value.`)
  .option(`--updated-at <updated-at>`, `Only rows whose \`updated_at\` equals this value.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, code, name, kind, path, createdAt, updatedAt, filter } = await promptForMissing(
          _options,
          tagManagerVariablesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/variables`;
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
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (path !== undefined) {
          _payload[`path`] = path;
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, tagManagerVariablesListSpecs, { method: "get" });
const tagManagerVariablesCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "The name a placeholder uses: `{{code}}`. Lowercase letters, digits and underscores, starting with a letter.", type: "string", required: false },
  { key: "constantValue", option: "--constant-value <constant-value>", name: "constant_value", description: "For a constant variable: its value, of any JSON type.", type: "any", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "`constant` (a value kept here), `event_field` (a field of the theme event) or `page` (a field of the page).", type: "string", required: false, enum: ["event_field","constant","page"] },
  { key: "name", option: "--name <name>", name: "name", description: "What the row is called, as a person reads it.", type: "string", required: false },
  { key: "path", option: "--path <path>", name: "path", description: "For event_field and page variables: the dotted path, e.g. `ecommerce.value_net`.", type: "string", required: false },
];
tagManagerTags
  .command(`tag-manager-variables-create`)
  .description(`Create one variable. Every rule is checked and every broken one is named in the 422.`)
  .option(`--code <code>`, `The name a placeholder uses: \`{{code}}\`. Lowercase letters, digits and underscores, starting with a letter.`)
  .option(`--constant-value <constant-value>`, `For a constant variable: its value, of any JSON type.`)
  .option(`--kind <kind>`, `\`constant\` (a value kept here), \`event_field\` (a field of the theme event) or \`page\` (a field of the page).`)
  .option(`--name <name>`, `What the row is called, as a person reads it.`)
  .option(`--path <path>`, `For event_field and page variables: the dotted path, e.g. \`ecommerce.value_net\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, constantValue, kind, name, path } = await promptForMissing(
          _options,
          tagManagerVariablesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/variables`;
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
        if (constantValue !== undefined) {
          _payload[`constant_value`] = constantValue;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (path !== undefined) {
          _payload[`path`] = path;
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, tagManagerVariablesCreateSpecs, { method: "post" });
const tagManagerVariablesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The id of the variable.", type: "string", required: true, resource: { listPath: "/tag-manager/variables", hasLimit: true } },
];
tagManagerTags
  .command(`tag-manager-variables-delete`)
  .description(`Delete one variable.`)
  .option(`--id <id>`, `The id of the variable.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          tagManagerVariablesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`tag-manager-tags tag-manager-variables-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/variables/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, tagManagerVariablesDeleteSpecs, { method: "delete", destructive: true });
const tagManagerVariablesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The id of the variable.", type: "string", required: true, resource: { listPath: "/tag-manager/variables", hasLimit: true } },
];
tagManagerTags
  .command(`tag-manager-variables-get`)
  .description(`One variable by id.`)
  .option(`--id <id>`, `The id of the variable.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          tagManagerVariablesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/variables/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, tagManagerVariablesGetSpecs, { method: "get" });
const tagManagerVariablesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The id of the variable.", type: "string", required: true, resource: { listPath: "/tag-manager/variables", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "The name a placeholder uses: `{{code}}`. Lowercase letters, digits and underscores, starting with a letter.", type: "string", required: false },
  { key: "constantValue", option: "--constant-value <constant-value>", name: "constant_value", description: "For a constant variable: its value, of any JSON type.", type: "any", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "`constant` (a value kept here), `event_field` (a field of the theme event) or `page` (a field of the page).", type: "string", required: false, enum: ["event_field","constant","page"] },
  { key: "name", option: "--name <name>", name: "name", description: "What the row is called, as a person reads it.", type: "string", required: false },
  { key: "path", option: "--path <path>", name: "path", description: "For event_field and page variables: the dotted path, e.g. `ecommerce.value_net`.", type: "string", required: false },
];
tagManagerTags
  .command(`tag-manager-variables-update`)
  .description(`Edit one variable. The row it would leave is checked whole.`)
  .option(`--id <id>`, `The id of the variable.`)
  .option(`--code <code>`, `The name a placeholder uses: \`{{code}}\`. Lowercase letters, digits and underscores, starting with a letter.`)
  .option(`--constant-value <constant-value>`, `For a constant variable: its value, of any JSON type.`)
  .option(`--kind <kind>`, `\`constant\` (a value kept here), \`event_field\` (a field of the theme event) or \`page\` (a field of the page).`)
  .option(`--name <name>`, `What the row is called, as a person reads it.`)
  .option(`--path <path>`, `For event_field and page variables: the dotted path, e.g. \`ecommerce.value_net\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, constantValue, kind, name, path } = await promptForMissing(
          _options,
          tagManagerVariablesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/variables/{id}`.replace(`{id}`, id);
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
        if (constantValue !== undefined) {
          _payload[`constant_value`] = constantValue;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (path !== undefined) {
          _payload[`path`] = path;
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, tagManagerVariablesUpdateSpecs, { method: "put" });
const tagManagerVocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
tagManagerTags
  .command(`tag-manager-vocabularies-list`)
  .description(`The event names of the theme event contract version this app supports (theme-events/1), which a trigger and an event map may name, plus the value sets of tags, triggers and variables.`)
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
          tagManagerVocabulariesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/vocabularies`;
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
registerPromptSpecs(tagManagerTags.commands.at(-1)!, tagManagerVocabulariesListSpecs, { method: "get" });
