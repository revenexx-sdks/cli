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

export const channels = new Command("channels")
  .description(
    commandDescriptions["channels"] ??
      `Manage channels resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
channels
  .command(`list`)
  .description(`List channels (filter by column; paginate limit/offset/order)`)
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
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels`;
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
registerPromptSpecs(channels.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Stable channel code, unique per tenant (e.g. shop, punchout-acme).", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "Display name.", type: "string", required: true },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Mark as the default channel (default false). At most one channel carries it — setting it demotes the previous holder.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names keyed by locale.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position (default 0).", type: "integer", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Lifecycle status (default 'active'). What 'inactive' DOES is the tenant's inactive_channel_behavior setting. Served as 'channels.statuses'.", type: "string", required: false, enum: ["active","inactive"] },
  { key: "type", option: "--type <type>", name: "type", description: "Which channel type this is — one of the codes the tenant keeps under GET /channels/types, served with labels as the 'channels.types' vocabulary. Omitted on create, it falls back to the type the tenant flagged as their default.", type: "string", required: false },
  { key: "unassignedVisibility", option: "--unassigned-visibility <unassigned-visibility>", name: "unassigned_visibility", description: "This channel's answer to what a row with NO channel assignment means here — the per-channel override of the tenant's unassigned_channel_visibility setting. 'inherit' (default) takes the tenant answer; 'all' shows unassigned rows; 'assigned_only' hides them until they are explicitly assigned, which is the assortment a punchout contract describes. Served as 'channels.unassigned-visibility'.", type: "string", required: false, enum: ["inherit","all","assigned_only"] },
];
channels
  .command(`create`)
  .description(`Create a channel`)
  .option(`--code <code>`, `Stable channel code, unique per tenant (e.g. shop, punchout-acme).`)
  .option(`--name <name>`, `Display name.`)
  .option(
    `--is-default [value]`,
    `Mark as the default channel (default false). At most one channel carries it — setting it demotes the previous holder.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized display names keyed by locale.`)
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .option(`--status <status>`, `Lifecycle status (default 'active'). What 'inactive' DOES is the tenant's inactive_channel_behavior setting. Served as 'channels.statuses'.`)
  .option(`--type <type>`, `Which channel type this is — one of the codes the tenant keeps under GET /channels/types, served with labels as the 'channels.types' vocabulary. Omitted on create, it falls back to the type the tenant flagged as their default.`)
  .option(`--unassigned-visibility <unassigned-visibility>`, `This channel's answer to what a row with NO channel assignment means here — the per-channel override of the tenant's unassigned_channel_visibility setting. 'inherit' (default) takes the tenant answer; 'all' shows unassigned rows; 'assigned_only' hides them until they are explicitly assigned, which is the assortment a punchout contract describes. Served as 'channels.unassigned-visibility'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, isDefault, labels, position, status, type, unassignedVisibility } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels`;
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
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (unassignedVisibility !== undefined) {
          _payload[`unassigned_visibility`] = unassignedVisibility;
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
registerPromptSpecs(channels.commands.at(-1)!, createSpecs, { method: "post" });
const contextSpecs: PromptSpec[] = [
  { key: "channel", option: "--channel <channel>", name: "channel", description: "Channel code to resolve, overriding the header and the claim.", type: "string", required: false },
];
channels
  .command(`context`)
  .description(`The storefront/punchout bootstrap. Resolution order is body/query, then the x-revenexx-channel header, then the scope_context.channel claim, then the channel flagged is_default — header before claim, the same order baseline.is_visible() uses. Never errors on an unknown or inactive channel: it answers resolved:false with a reason, so a caller can tell "no such channel" from "the service is down". The policy block is what a client needs to reproduce the decision itself.`)
  .option(`--channel <channel>`, `Channel code to resolve, overriding the header and the claim.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channel } = await promptForMissing(
          _options,
          contextSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/context`;
        const _payload: RequestParams = {};
        if (channel !== undefined) {
          _payload[`channel`] = channel;
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
registerPromptSpecs(channels.commands.at(-1)!, contextSpecs, { method: "get" });
channels
  .command(`defaults`)
  .description(`Ensure the default channel types and channels exist (idempotent) — seeds the five channel types and the shop channel; also runs automatically on app.installed.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/channels/defaults`;
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
const typesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
channels
  .command(`types-list`)
  .description(`What a channel may BE. This used to be a CHECK constraint over five values, which meant the merchant who runs a feed channel or a print channel needed a release of this app to say so — and nothing in the app ever branched on the value, only on membership. The set is the tenant's rows now. Seeds itself on first read, so the list is never empty and a channel can always carry a type.`)
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
          typesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/types`;
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
registerPromptSpecs(channels.commands.at(-1)!, typesListSpecs, { method: "get" });
const typesCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "title", option: "--title <title>", name: "title", description: "The fallback name. `labels` carries the per-locale ones.", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this type; the previous default is demoted.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
channels
  .command(`types-create`)
  .description(`The code is lowercase and becomes what \`channels.type\` stores; it cannot be changed afterwards, because every channel carrying it would be orphaned. A duplicate code is a 409.`)
  .option(`--code <code>`, ``)
  .option(`--title <title>`, `The fallback name. \`labels\` carries the per-locale ones.`)
  .option(`--description <description>`, ``)
  .option(`--descriptions <descriptions>`, ``)
  .option(
    `--is-default [value]`,
    `Promote this type; the previous default is demoted.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--tone <tone>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, title, description, descriptions, isDefault, labels, position, tone } = await promptForMissing(
          _options,
          typesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/types`;
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
registerPromptSpecs(channels.commands.at(-1)!, typesCreateSpecs, { method: "post" });
const typesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/channels/types", hasLimit: true } },
];
channels
  .command(`types-delete`)
  .description(`409 when at least one channel still carries it — a channel whose type no longer exists would render as a bare code and filter as nothing. 409 also for the last remaining type, because a channel must have one. Deleting the default hands the flag to the next type rather than leaving every create guessing.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          typesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`channels types-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/channels/types/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(channels.commands.at(-1)!, typesDeleteSpecs, { method: "delete", destructive: true });
const typesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/channels/types", hasLimit: true } },
];
channels
  .command(`types-get`)
  .description(`Read one channel type`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          typesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/types/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(channels.commands.at(-1)!, typesGetSpecs, { method: "get" });
const typesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/channels/types", hasLimit: true } },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this type; the previous default is demoted.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
channels
  .command(`types-update`)
  .description(`Everything but the code. Sending a different code is a 400 rather than a silent no-op: renaming it would orphan every channel that carries it.`)
  .option(`--id <id>`, ``)
  .option(`--description <description>`, ``)
  .option(`--descriptions <descriptions>`, ``)
  .option(
    `--is-default [value]`,
    `Promote this type; the previous default is demoted.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--title <title>`, ``)
  .option(`--tone <tone>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, descriptions, isDefault, labels, position, title, tone } = await promptForMissing(
          _options,
          typesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/types/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(channels.commands.at(-1)!, typesUpdateSpecs, { method: "put" });
const visibilitySpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The rows to decide on, each with the channel assignments Baseline holds for it. POST /api/v1/scopes/lookup?dimension=channel answers in exactly this shape. At most 500 — Baseline's own lookup ceiling.", type: "array", required: true },
  { key: "channel", option: "--channel <channel>", name: "channel", description: "Channel code to evaluate against. Optional — falls back to x-revenexx-channel, then the scope_context.channel claim, then the tenant's default channel.", type: "string", required: false },
];
channels
  .command(`visibility`)
  .description(`The gate. A row WITH channel assignments is decided exactly as baseline.is_visible() decides it — visible iff the active channel is among them. A row WITHOUT assignments is the case unassigned_channel_visibility owns: 'all' shows it (Baseline's open-by-default, unchanged) and 'assigned_only' hides it, which the generated _scoped view has no way to express. A channel may override the tenant answer for itself, so the shop can stay open while a punchout channel serves only its negotiated assortment. Answers 400 only when require_channel_context is on and the request named no channel.`)
  .option(`--items [items...]`, `The rows to decide on, each with the channel assignments Baseline holds for it. POST /api/v1/scopes/lookup?dimension=channel answers in exactly this shape. At most 500 — Baseline's own lookup ceiling.`)
  .option(`--channel <channel>`, `Channel code to evaluate against. Optional — falls back to x-revenexx-channel, then the scope_context.channel claim, then the tenant's default channel.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, channel } = await promptForMissing(
          _options,
          visibilitySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/visibility`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (items !== undefined) {
          _payload[`items`] = items;
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
registerPromptSpecs(channels.commands.at(-1)!, visibilitySpecs, { method: "post" });
const vocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
channels
  .command(`vocabularies-list`)
  .description(`Discovery for the vocabulary routes. Names: statuses, types, unassigned-visibility. Fetch one with GET /channels/vocabularies/{name}; a client holding the qualified pair 'channels.<name>' builds that URL from the pair alone.`)
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
        const _apiPath = `/channels/vocabularies`;
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
registerPromptSpecs(channels.commands.at(-1)!, vocabulariesListSpecs, { method: "get" });
const vocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary name — the part after the dot in the qualified id.", type: "string", required: true, enum: ["statuses","types","unassigned-visibility"], resource: { listPath: "/channels/vocabularies", hasLimit: false } },
];
channels
  .command(`vocabularies-get`)
  .description(`Two sources, one guarantee: what is served is what is in force, so no UI keeps a second copy. 'source' says which — 'schema' means the values are read out of the column's CHECK constraint (a value added to the constraint appears here even before anyone labels it, titled from its own key); 'table' means they are the tenant's own rows, which a merchant may add to, rename and retire without a release of this app. Values come back in author order, which is the order a select should offer. 'closed' says the set is exhaustive at this moment, so a value outside it is stale data rather than a missing label. Answers 404 for an unknown name. Names: statuses, types, unassigned-visibility.`)
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
        const _apiPath = `/channels/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(channels.commands.at(-1)!, vocabulariesGetSpecs, { method: "get" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/channels", hasLimit: true } },
];
channels
  .command(`delete`)
  .description(`Delete a channel by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`channels delete`);
        const _client = await sdkForProject();
        const _apiPath = `/channels/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(channels.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/channels", hasLimit: true } },
];
channels
  .command(`get`)
  .description(`Read one channel by id`)
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
        const _apiPath = `/channels/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(channels.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/channels", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Stable channel code, unique per tenant (e.g. shop, punchout-acme).", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Mark as the default channel (default false). At most one channel carries it — setting it demotes the previous holder.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names keyed by locale.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position (default 0).", type: "integer", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Lifecycle status (default 'active'). What 'inactive' DOES is the tenant's inactive_channel_behavior setting. Served as 'channels.statuses'.", type: "string", required: false, enum: ["active","inactive"] },
  { key: "type", option: "--type <type>", name: "type", description: "Which channel type this is — one of the codes the tenant keeps under GET /channels/types, served with labels as the 'channels.types' vocabulary. Omitted on create, it falls back to the type the tenant flagged as their default.", type: "string", required: false },
  { key: "unassignedVisibility", option: "--unassigned-visibility <unassigned-visibility>", name: "unassigned_visibility", description: "This channel's answer to what a row with NO channel assignment means here — the per-channel override of the tenant's unassigned_channel_visibility setting. 'inherit' (default) takes the tenant answer; 'all' shows unassigned rows; 'assigned_only' hides them until they are explicitly assigned, which is the assortment a punchout contract describes. Served as 'channels.unassigned-visibility'.", type: "string", required: false, enum: ["inherit","all","assigned_only"] },
];
channels
  .command(`update`)
  .description(`Update a channel by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, `Stable channel code, unique per tenant (e.g. shop, punchout-acme).`)
  .option(
    `--is-default [value]`,
    `Mark as the default channel (default false). At most one channel carries it — setting it demotes the previous holder.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized display names keyed by locale.`)
  .option(`--name <name>`, `Display name.`)
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .option(`--status <status>`, `Lifecycle status (default 'active'). What 'inactive' DOES is the tenant's inactive_channel_behavior setting. Served as 'channels.statuses'.`)
  .option(`--type <type>`, `Which channel type this is — one of the codes the tenant keeps under GET /channels/types, served with labels as the 'channels.types' vocabulary. Omitted on create, it falls back to the type the tenant flagged as their default.`)
  .option(`--unassigned-visibility <unassigned-visibility>`, `This channel's answer to what a row with NO channel assignment means here — the per-channel override of the tenant's unassigned_channel_visibility setting. 'inherit' (default) takes the tenant answer; 'all' shows unassigned rows; 'assigned_only' hides them until they are explicitly assigned, which is the assortment a punchout contract describes. Served as 'channels.unassigned-visibility'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, isDefault, labels, name, position, status, type, unassignedVisibility } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/{id}`.replace(`{id}`, id);
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
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (unassignedVisibility !== undefined) {
          _payload[`unassigned_visibility`] = unassignedVisibility;
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
registerPromptSpecs(channels.commands.at(-1)!, updateSpecs, { method: "put" });
