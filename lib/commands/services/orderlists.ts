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

export const orderlists = new Command("orderlists")
  .description(
    commandDescriptions["orderlists"] ??
      `Manage orderlists resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "ownerId", option: "--owner-id <owner-id>", name: "owner_id", description: "Filter to one owning contact.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Filter to one organization.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Filter by list kind (shopping | label).", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
orderlists
  .command(`list`)
  .description(`List the caller's own lists plus the organization's shared lists (filters: owner_id, organization_id, kind)`)
  .option(`--owner-id <owner-id>`, `Filter to one owning contact.`)
  .option(`--organization-id <organization-id>`, `Filter to one organization.`)
  .option(`--kind <kind>`, `Filter by list kind (shopping | label).`)
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
        const { ownerId, organizationId, kind, limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists`;
        const _payload: RequestParams = {};
        if (ownerId !== undefined) {
          _payload[`owner_id`] = ownerId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
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
registerPromptSpecs(orderlists.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "ownerId", option: "--owner-id <owner-id>", name: "owner_id", description: "Owning contact.", type: "string", required: true },
  { key: "ownerName", option: "--owner-name <owner-name>", name: "owner_name", description: "Owner display name (snapshot).", type: "string", required: true },
  { key: "items", option: "--items [items...]", name: "items", description: "Optional initial positions.", type: "array", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "List kind — one of the tenant's own kinds (GET /orderlists/kinds); defaults to the flagged one, or the market's 'default_kind' setting.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Owning organization (scopes sharing).", type: "string", required: false },
  { key: "shared", option: "--shared <shared>", name: "shared", description: "Shared read-only across the organization (default false).", type: "boolean", required: false },
];
orderlists
  .command(`create`)
  .description(`Create an order list, optionally pre-filled with positions`)
  .option(`--name <name>`, ``)
  .option(`--owner-id <owner-id>`, `Owning contact.`)
  .option(`--owner-name <owner-name>`, `Owner display name (snapshot).`)
  .option(`--items [items...]`, `Optional initial positions.`)
  .option(`--kind <kind>`, `List kind — one of the tenant's own kinds (GET /orderlists/kinds); defaults to the flagged one, or the market's 'default_kind' setting.`)
  .option(`--metadata <metadata>`, ``)
  .option(`--organization-id <organization-id>`, `Owning organization (scopes sharing).`)
  .option(
    `--shared [value]`,
    `Shared read-only across the organization (default false).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, ownerId, ownerName, items, kind, metadata, organizationId, shared } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists`;
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
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (ownerId !== undefined) {
          _payload[`owner_id`] = ownerId;
        }
        if (ownerName !== undefined) {
          _payload[`owner_name`] = ownerName;
        }
        if (shared !== undefined) {
          _payload[`shared`] = shared;
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
registerPromptSpecs(orderlists.commands.at(-1)!, createSpecs, { method: "post" });
orderlists
  .command(`defaults`)
  .description(`No-op lifecycle seed (Order Lists has no seed data)`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/defaults`;
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
const kindsListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
orderlists
  .command(`kinds-list`)
  .description(`What a saved list may be FOR. This used to be a CHECK constraint, which meant a merchant who keeps reagent lists or sample lists needed a release of this app to say so — and the app never branched on the value, it only checked membership. The set is the tenant's rows now.`)
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
          kindsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/kinds`;
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
registerPromptSpecs(orderlists.commands.at(-1)!, kindsListSpecs, { method: "get" });
const kindsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this kind; the previous default is demoted.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
orderlists
  .command(`kinds-create`)
  .description(`The code is lowercase and becomes what \`lists.kind\` stores; it cannot be changed afterwards, because every list carrying it would be orphaned. A duplicate code is a 409.`)
  .option(`--code <code>`, ``)
  .option(`--title <title>`, ``)
  .option(`--description <description>`, ``)
  .option(`--descriptions <descriptions>`, ``)
  .option(
    `--is-default [value]`,
    `Promote this kind; the previous default is demoted.`,
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
          kindsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/kinds`;
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
registerPromptSpecs(orderlists.commands.at(-1)!, kindsCreateSpecs, { method: "post" });
const kindsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists/kinds", hasLimit: false } },
];
orderlists
  .command(`kinds-delete`)
  .description(`409 when at least one list still carries it — a list whose kind no longer exists would render as a bare code and filter as nothing. 409 also for the last remaining kind, because a list must have one.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          kindsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`orderlists kinds-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/kinds/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(orderlists.commands.at(-1)!, kindsDeleteSpecs, { method: "delete", destructive: true });
const kindsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists/kinds", hasLimit: false } },
];
orderlists
  .command(`kinds-get`)
  .description(`Read one list kind`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          kindsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/kinds/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(orderlists.commands.at(-1)!, kindsGetSpecs, { method: "get" });
const kindsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists/kinds", hasLimit: false } },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
orderlists
  .command(`kinds-update`)
  .description(`Everything but the code. Sending a different code is a 400 rather than a silent no-op: renaming it would orphan every list that carries it.`)
  .option(`--id <id>`, ``)
  .option(`--description <description>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--title <title>`, ``)
  .option(`--tone <tone>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, labels, position, title, tone } = await promptForMissing(
          _options,
          kindsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/kinds/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(orderlists.commands.at(-1)!, kindsUpdateSpecs, { method: "put" });
const vocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
orderlists
  .command(`vocabularies-list`)
  .description(`Discovery for the vocabulary routes. Names: kinds. Fetch one with GET /orderlists/vocabularies/{name}; a client holding the qualified pair 'orderlists.<name>' builds that URL from the pair alone.`)
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
        const _apiPath = `/orderlists/vocabularies`;
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
registerPromptSpecs(orderlists.commands.at(-1)!, vocabulariesListSpecs, { method: "get" });
const vocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary name — the part after the dot in the qualified id.", type: "string", required: true, enum: ["kinds"], resource: { listPath: "/orderlists/vocabularies", hasLimit: false } },
];
orderlists
  .command(`vocabularies-get`)
  .description(`The values are read out of the column's CHECK constraint, so the served set IS the enforced set and the two cannot drift — a value added to the constraint appears here even before anyone labels it, titled from its own key. Values come back in constraint order, which is the order a select should offer. 'closed' says the set is exhaustive, so a value outside it is stale data rather than a missing label. Answers 404 for an unknown name. Names: kinds.`)
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
        const _apiPath = `/orderlists/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(orderlists.commands.at(-1)!, vocabulariesGetSpecs, { method: "get" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
];
orderlists
  .command(`delete`)
  .description(`Delete an order list including its positions`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`orderlists delete`);
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(orderlists.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
];
orderlists
  .command(`get`)
  .description(`Read one order list with its positions`)
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
        const _apiPath = `/orderlists/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(orderlists.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "List kind — one of the tenant's own kinds (GET /orderlists/kinds); defaults to the flagged one, or the market's 'default_kind' setting.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
  { key: "shared", option: "--shared <shared>", name: "shared", type: "boolean", required: false },
];
orderlists
  .command(`update`)
  .description(`Rename a list, change its visibility or kind`)
  .option(`--id <id>`, ``)
  .option(`--kind <kind>`, `List kind — one of the tenant's own kinds (GET /orderlists/kinds); defaults to the flagged one, or the market's 'default_kind' setting.`)
  .option(`--metadata <metadata>`, ``)
  .option(`--name <name>`, ``)
  .option(
    `--shared [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, kind, metadata, name, shared } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (shared !== undefined) {
          _payload[`shared`] = shared;
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
registerPromptSpecs(orderlists.commands.at(-1)!, updateSpecs, { method: "put" });
const toCartSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "Add to this existing cart. Omit to create one for the list owner and make it their current cart.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code for the cart and its lines. Omit to let the carts app decide.", type: "string", required: false },
  { key: "mode", option: "--mode <mode>", name: "mode", description: "'append' adds the positions (the carts app merges a line by product and price, so quantities accumulate); 'replace' makes the list the cart's entire contents. Defaults to the tenant's 'cart_merge_mode' setting.", type: "string", required: false, enum: ["append","replace"] },
];
orderlists
  .command(`to-cart`)
  .description(`The reason a buyer keeps a list at all. Without 'cart_id' a cart is created for the list's owner and made their current cart, because a cart the buyer cannot see is not 'added to cart'. 'append' (the default, tenant-configurable) lets the carts app merge each line by product and price so quantities accumulate; 'replace' makes the list the cart's whole contents in one call. What the cart has no column for — cost centre, custom SKU, position texts — rides in each line's snapshot together with the list it came from. Cross-app: carts.create, carts.items.create, carts.items.replace.`)
  .option(`--id <id>`, ``)
  .option(`--cart-id <cart-id>`, `Add to this existing cart. Omit to create one for the list owner and make it their current cart.`)
  .option(`--currency <currency>`, `ISO 4217 code for the cart and its lines. Omit to let the carts app decide.`)
  .option(`--mode <mode>`, `'append' adds the positions (the carts app merges a line by product and price, so quantities accumulate); 'replace' makes the list the cart's entire contents. Defaults to the tenant's 'cart_merge_mode' setting.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, cartId, currency, mode } = await promptForMissing(
          _options,
          toCartSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{id}/cart`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (mode !== undefined) {
          _payload[`mode`] = mode;
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
registerPromptSpecs(orderlists.commands.at(-1)!, toCartSpecs, { method: "post" });
const toOrderSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code. Omit to let the orders app apply the market default.", type: "string", required: false },
  { key: "customerOrderNumber", option: "--customer-order-number <customer-order-number>", name: "customer_order_number", description: "The buyer's own order/PO number.", type: "string", required: false },
];
orderlists
  .command(`to-order`)
  .description(`Places the list's positions as an order: buyer and organization come from the list, the cost centre and the position texts land on the order's own columns. The acting contact is re-asserted on the call, so the orders app applies ITS rules to the BUYER — a contact holding only orders.request, or an order above the tenant's approval threshold, comes back with status 'pending' and no placed_at. That pending order is the platform's nearest thing to a draft; the orders app owns the state, this one only hands over the positions. Cross-app: orders.place.`)
  .option(`--id <id>`, ``)
  .option(`--currency <currency>`, `ISO 4217 code. Omit to let the orders app apply the market default.`)
  .option(`--customer-order-number <customer-order-number>`, `The buyer's own order/PO number.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, currency, customerOrderNumber } = await promptForMissing(
          _options,
          toOrderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{id}/order`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (customerOrderNumber !== undefined) {
          _payload[`customer_order_number`] = customerOrderNumber;
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
registerPromptSpecs(orderlists.commands.at(-1)!, toOrderSpecs, { method: "post" });
const itemsListSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
orderlists
  .command(`items-list`)
  .description(`List the positions of an order list (default sort: position.asc)`)
  .option(`--list-id <list-id>`, ``)
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
        const { listId, limit, offset, order, filter } = await promptForMissing(
          _options,
          itemsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items`.replace(`{list_id}`, listId);
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsListSpecs, { method: "get" });
const itemsCreateSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "name", option: "--name <name>", name: "name", description: "Display name (snapshot).", type: "string", required: true },
  { key: "categorySlug", option: "--category-slug <category-slug>", name: "category_slug", type: "string", required: false },
  { key: "costCenterId", option: "--cost-center-id <cost-center-id>", name: "cost_center_id", description: "Cost center reference (free-text).", type: "string", required: false },
  { key: "customSku", option: "--custom-sku <custom-sku>", name: "custom_sku", description: "Customer's own article number.", type: "string", required: false },
  { key: "image", option: "--image <image>", name: "image", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order (assigned automatically when omitted).", type: "integer", required: false },
  { key: "positionTexts", option: "--position-texts [position-texts...]", name: "position_texts", description: "Per-position notes.", type: "array", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "Unit price snapshot.", type: "number", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Catalog product (alternative to sku).", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Default 1.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Article SKU (alternative to product_id).", type: "string", required: false },
  { key: "subcategorySlug", option: "--subcategory-slug <subcategory-slug>", name: "subcategory_slug", type: "string", required: false },
  { key: "taxRate", option: "--tax-rate <tax-rate>", name: "tax_rate", type: "number", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", type: "string", required: false },
];
orderlists
  .command(`items-create`)
  .description(`Add a position to an order list`)
  .option(`--list-id <list-id>`, ``)
  .option(`--name <name>`, `Display name (snapshot).`)
  .option(`--category-slug <category-slug>`, ``)
  .option(`--cost-center-id <cost-center-id>`, `Cost center reference (free-text).`)
  .option(`--custom-sku <custom-sku>`, `Customer's own article number.`)
  .option(`--image <image>`, ``)
  .option(`--metadata <metadata>`, ``)
  .option(`--position <position>`, `Sort order (assigned automatically when omitted).`, parseInteger)
  .option(`--position-texts [position-texts...]`, `Per-position notes.`)
  .option(`--price <price>`, `Unit price snapshot.`, parseInteger)
  .option(`--product-id <product-id>`, `Catalog product (alternative to sku).`)
  .option(`--quantity <quantity>`, `Default 1.`, parseInteger)
  .option(`--sku <sku>`, `Article SKU (alternative to product_id).`)
  .option(`--subcategory-slug <subcategory-slug>`, ``)
  .option(`--tax-rate <tax-rate>`, ``, parseInteger)
  .option(`--unit <unit>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, name, categorySlug, costCenterId, customSku, image, metadata, position, positionTexts, price, productId, quantity, sku, subcategorySlug, taxRate, unit } = await promptForMissing(
          _options,
          itemsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items`.replace(`{list_id}`, listId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (categorySlug !== undefined) {
          _payload[`category_slug`] = categorySlug;
        }
        if (costCenterId !== undefined) {
          _payload[`cost_center_id`] = costCenterId;
        }
        if (customSku !== undefined) {
          _payload[`custom_sku`] = customSku;
        }
        if (image !== undefined) {
          _payload[`image`] = image;
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
        if (positionTexts !== undefined) {
          _payload[`position_texts`] = positionTexts;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
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
        if (subcategorySlug !== undefined) {
          _payload[`subcategory_slug`] = subcategorySlug;
        }
        if (taxRate !== undefined) {
          _payload[`tax_rate`] = taxRate;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsCreateSpecs, { method: "post" });
const itemsReplaceSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "items", option: "--items [items...]", name: "items", description: "The new full set of positions.", type: "array", required: true },
];
orderlists
  .command(`items-replace`)
  .description(`Replace all positions of an order list (set semantics)`)
  .option(`--list-id <list-id>`, ``)
  .option(`--items [items...]`, `The new full set of positions.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, items } = await promptForMissing(
          _options,
          itemsReplaceSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items`.replace(`{list_id}`, listId);
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsReplaceSpecs, { method: "put" });
const itemsDeleteSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists/{list_id}/items", hasLimit: true } },
];
orderlists
  .command(`items-delete`)
  .description(`Remove a position from an order list`)
  .option(`--list-id <list-id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, id } = await promptForMissing(
          _options,
          itemsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`orderlists items-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items/{id}`.replace(`{list_id}`, listId).replace(`{id}`, id);
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsDeleteSpecs, { method: "delete", destructive: true });
const itemsGetSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists/{list_id}/items", hasLimit: true } },
];
orderlists
  .command(`items-get`)
  .description(`Read one position`)
  .option(`--list-id <list-id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, id } = await promptForMissing(
          _options,
          itemsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items/{id}`.replace(`{list_id}`, listId).replace(`{id}`, id);
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsGetSpecs, { method: "get" });
const itemsUpdateSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists/{list_id}/items", hasLimit: true } },
  { key: "categorySlug", option: "--category-slug <category-slug>", name: "category_slug", type: "string", required: false },
  { key: "costCenterId", option: "--cost-center-id <cost-center-id>", name: "cost_center_id", description: "Cost center reference (free-text).", type: "string", required: false },
  { key: "customSku", option: "--custom-sku <custom-sku>", name: "custom_sku", description: "Customer's own article number.", type: "string", required: false },
  { key: "image", option: "--image <image>", name: "image", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name (snapshot).", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order (assigned automatically when omitted).", type: "integer", required: false },
  { key: "positionTexts", option: "--position-texts [position-texts...]", name: "position_texts", description: "Per-position notes.", type: "array", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "Unit price snapshot.", type: "number", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Catalog product (alternative to sku).", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Default 1.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Article SKU (alternative to product_id).", type: "string", required: false },
  { key: "subcategorySlug", option: "--subcategory-slug <subcategory-slug>", name: "subcategory_slug", type: "string", required: false },
  { key: "taxRate", option: "--tax-rate <tax-rate>", name: "tax_rate", type: "number", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", type: "string", required: false },
];
orderlists
  .command(`items-update`)
  .description(`Update a position`)
  .option(`--list-id <list-id>`, ``)
  .option(`--id <id>`, ``)
  .option(`--category-slug <category-slug>`, ``)
  .option(`--cost-center-id <cost-center-id>`, `Cost center reference (free-text).`)
  .option(`--custom-sku <custom-sku>`, `Customer's own article number.`)
  .option(`--image <image>`, ``)
  .option(`--metadata <metadata>`, ``)
  .option(`--name <name>`, `Display name (snapshot).`)
  .option(`--position <position>`, `Sort order (assigned automatically when omitted).`, parseInteger)
  .option(`--position-texts [position-texts...]`, `Per-position notes.`)
  .option(`--price <price>`, `Unit price snapshot.`, parseInteger)
  .option(`--product-id <product-id>`, `Catalog product (alternative to sku).`)
  .option(`--quantity <quantity>`, `Default 1.`, parseInteger)
  .option(`--sku <sku>`, `Article SKU (alternative to product_id).`)
  .option(`--subcategory-slug <subcategory-slug>`, ``)
  .option(`--tax-rate <tax-rate>`, ``, parseInteger)
  .option(`--unit <unit>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, id, categorySlug, costCenterId, customSku, image, metadata, name, position, positionTexts, price, productId, quantity, sku, subcategorySlug, taxRate, unit } = await promptForMissing(
          _options,
          itemsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items/{id}`.replace(`{list_id}`, listId).replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (categorySlug !== undefined) {
          _payload[`category_slug`] = categorySlug;
        }
        if (costCenterId !== undefined) {
          _payload[`cost_center_id`] = costCenterId;
        }
        if (customSku !== undefined) {
          _payload[`custom_sku`] = customSku;
        }
        if (image !== undefined) {
          _payload[`image`] = image;
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
        if (positionTexts !== undefined) {
          _payload[`position_texts`] = positionTexts;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
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
        if (subcategorySlug !== undefined) {
          _payload[`subcategory_slug`] = subcategorySlug;
        }
        if (taxRate !== undefined) {
          _payload[`tax_rate`] = taxRate;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsUpdateSpecs, { method: "put" });
