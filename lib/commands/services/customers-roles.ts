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
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const customersRoles = new Command("customers-roles")
  .description(
    commandDescriptions["customersRoles"] ??
      `The role catalogue and the tenant's own role-to-permission mapping. A role is held by a CONTACT and applies inside that contact's organization; there is no global customer role. Permissions are DERIVED from the role on every read and never stored per contact, so a role change takes effect immediately and can never leave a stale grant behind. Five built-in roles answer for a tenant that has written none of its own down; seeding them and replacing a role's permission set are the two writes. What one PERSON ends up holding is read in Contacts.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

customersRoles
  .command(`customers-permissions-ledger`)
  .description(`What the role editor offers: every permission with its words per language, its area, the app that owns it and whether the platform enforces it yet, plus the built-in set of every built-in role — what resetting a role to its default restores.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/customers/permissions/ledger`;
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
const listSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customersRoles
  .command(`list`)
  .description(`The whole catalogue in one read: every role a contact of this tenant can hold, the permissions each one grants, and the built-in permission vocabulary those grants are drawn from. Roles are held by a CONTACT and apply inside that contact's organization; there is no global customer role. Permissions are derived from the role at read time and never stored per contact, so a role change takes effect immediately and cannot leave a stale grant. The role to permission MAPPING is per tenant and configurable (PUT /customers/roles/{key}/permissions); a tenant that has not configured anything gets the built-ins and 'source' says which of the two answered. Built-in roles, least to most privileged: viewer (Viewer), requester (Requester), buyer (Buyer), approver (Approver), admin (Administrator). The permission KEYS themselves come from the cross-app ledger — every installed app declares what it enforces — so a tenant may grant a key this list does not mention.`)
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
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/roles`;
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
registerPromptSpecs(customersRoles.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "title", option: "--title <title>", name: "title", description: "The name a merchant reads.", type: "string", required: true },
  { key: "active", option: "--active <active>", name: "active", description: "Whether the role is offered when a contact gets one. Default true. An inactive role cannot be the default.", type: "boolean", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "One line on what the role is for.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "The one line per locale.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Make this the role a contact created without one gets. The previous default stops being one.", type: "boolean", required: false },
  { key: "key", option: "--key <key>", name: "key", description: "Optional. Made from `title` when left out.", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "The name per locale.", type: "object", required: false },
  { key: "permissions", option: "--permissions [permissions...]", name: "permissions", description: "What the role grants. Duplicates and blanks are ignored; left out, it grants nothing yet.", type: "array", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Optional. Defaults to after every existing role.", type: "integer", required: false },
];
customersRoles
  .command(`create`)
  .description(`One call for a whole new role: its name, and the permissions it grants. The key is made from the name when none is sent — 'Einkauf Zentrale' becomes \`einkauf-zentrale\`, German letters spelled out — and it is fixed from then on, because every contact holding the role stores it. Seeds the built-in roles first when the tenant never wrote them down, so the first role of a tenant's own leaves what every existing contact may do exactly as it was.`)
  .option(`--title <title>`, `The name a merchant reads.`)
  .option(
    `--active [value]`,
    `Whether the role is offered when a contact gets one. Default true. An inactive role cannot be the default.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--description <description>`, `One line on what the role is for.`)
  .option(`--descriptions <descriptions>`, `The one line per locale.`)
  .option(
    `--is-default [value]`,
    `Make this the role a contact created without one gets. The previous default stops being one.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--key <key>`, `Optional. Made from \`title\` when left out.`)
  .option(`--labels <labels>`, `The name per locale.`)
  .option(`--permissions [permissions...]`, `What the role grants. Duplicates and blanks are ignored; left out, it grants nothing yet.`)
  .option(`--position <position>`, `Optional. Defaults to after every existing role.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { title, active, description, descriptions, isDefault, key, labels, permissions, position } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/roles`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (active !== undefined) {
          _payload[`active`] = active;
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
        if (key !== undefined) {
          _payload[`key`] = key;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (permissions !== undefined) {
          _payload[`permissions`] = permissions;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(customersRoles.commands.at(-1)!, createSpecs, { method: "post" });
const defaultsSpecs: PromptSpec[] = [
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
customersRoles
  .command(`defaults`)
  .description(`Idempotent: a role that already exists is left completely alone, its permissions included, so re-seeding never undoes a merchant's edits. Creates viewer, requester, buyer, approver, admin with the built-in mapping. A tenant that never calls this still behaves correctly — the catalogue and every permission read fall back to the same built-ins.`)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { body } = await promptForMissing(
          _options,
          defaultsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/roles/defaults`;
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
registerPromptSpecs(customersRoles.commands.at(-1)!, defaultsSpecs, { method: "post" });
const updateSpecs: PromptSpec[] = [
  { key: "key", option: "--key <key>", name: "key", description: "The role key, or the role's id, which is what a record page holds.", type: "string", required: true, resource: { listPath: "/customers/roles", hasLimit: false } },
  { key: "active", option: "--active <active>", name: "active", description: "False retires the role: contacts holding it keep it, it is no longer offered. Refused on a built-in role and on the default.", type: "boolean", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "One line on what the role is for.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "The one line per locale.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Make this the role a contact created without one gets. Refused for an inactive role.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "The name per locale.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Display order, least privileged first. Grants nothing by itself.", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "The name a merchant reads.", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Semantic badge colour.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customersRoles
  .command(`update`)
  .description(`A role's words, its rank, the default flag and whether it is still offered — not its key, which every contact holding the role stores, and not its grants, which \`PUT /customers/roles/{key}/permissions\` replaces. A role marked inactive is no longer offered when a contact gets a role (the roles vocabulary leaves it out), while every contact that holds it keeps it and keeps its grants. Two roles stay on offer: a built-in one, which is what every tenant starts from, and the default, which is what a new contact gets. Promoting a role to the default demotes the previous one; clearing the flag on the default changes nothing. Seeds the built-in roles first when the tenant never wrote them down.`)
  .option(`--key <key>`, `The role key, or the role's id, which is what a record page holds.`)
  .option(
    `--active [value]`,
    `False retires the role: contacts holding it keep it, it is no longer offered. Refused on a built-in role and on the default.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--description <description>`, `One line on what the role is for.`)
  .option(`--descriptions <descriptions>`, `The one line per locale.`)
  .option(
    `--is-default [value]`,
    `Make this the role a contact created without one gets. Refused for an inactive role.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `The name per locale.`)
  .option(`--position <position>`, `Display order, least privileged first. Grants nothing by itself.`, parseInteger)
  .option(`--title <title>`, `The name a merchant reads.`)
  .option(`--tone <tone>`, `Semantic badge colour.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { key, active, description, descriptions, isDefault, labels, position, title, tone } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/roles/{key}`.replace(`{key}`, key);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (active !== undefined) {
          _payload[`active`] = active;
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
registerPromptSpecs(customersRoles.commands.at(-1)!, updateSpecs, { method: "put" });
const copySpecs: PromptSpec[] = [
  { key: "key", option: "--key <key>", name: "key", description: "The role to copy, by key or by id.", type: "string", required: true, resource: { listPath: "/customers/roles", hasLimit: false } },
  { key: "title", option: "--title <title>", name: "title", description: "The name of the new role.", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", description: "Optional. The source's description when left out.", type: "string", required: false },
  { key: "keyBody", option: "--key-body <key-body>", name: "key_body", description: "Optional. Made from `title` when left out.", type: "string", required: false },
];
customersRoles
  .command(`copy`)
  .description(`A new role with the permissions of \`key\` and a name of its own — the quick way to a role that differs from a built-in by one grant. The source may be a built-in the tenant never wrote down; the built-ins are seeded first, exactly as a create does. The copy is the tenant's own role, never a built-in, and it is not the default.`)
  .option(`--key <key>`, `The role to copy, by key or by id.`)
  .option(`--title <title>`, `The name of the new role.`)
  .option(`--description <description>`, `Optional. The source's description when left out.`)
  .option(`--key-body <key-body>`, `Optional. Made from \`title\` when left out.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { key, title, description, keyBody } = await promptForMissing(
          _options,
          copySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/roles/{key}/copy`.replace(`{key}`, key);
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
        if (keyBody !== undefined) {
          _payload[`key`] = keyBody;
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
registerPromptSpecs(customersRoles.commands.at(-1)!, copySpecs, { method: "post" });
const permissionsReplaceSpecs: PromptSpec[] = [
  { key: "key", option: "--key <key>", name: "key", description: "The role key — one of the tenant's own roles (GET /customers/roles) — or the role's id, which is what a record page holds.", type: "string", required: true, resource: { listPath: "/customers/roles", hasLimit: false } },
  { key: "permissions", option: "--permissions [permissions...]", name: "permissions", description: "The complete new set. Duplicates and blanks are ignored; an empty array revokes everything.", type: "array", required: true },
];
customersRoles
  .command(`permissions-replace`)
  .description(`The whole new set in one call — the shape a role editor actually produces, and the one that cannot leave a half-applied grant behind if a second call fails. Seeds the built-in roles first when the tenant never wrote them down, so editing works without calling /defaults. Permission keys are free text on purpose: they belong to whichever app declared them, and a grant for an app that is not installed simply has nothing to act on.`)
  .option(`--key <key>`, `The role key — one of the tenant's own roles (GET /customers/roles) — or the role's id, which is what a record page holds.`)
  .option(`--permissions [permissions...]`, `The complete new set. Duplicates and blanks are ignored; an empty array revokes everything.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { key, permissions } = await promptForMissing(
          _options,
          permissionsReplaceSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/roles/{key}/permissions`.replace(`{key}`, key);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (permissions !== undefined) {
          _payload[`permissions`] = permissions;
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
registerPromptSpecs(customersRoles.commands.at(-1)!, permissionsReplaceSpecs, { method: "put" });
