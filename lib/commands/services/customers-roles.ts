import { Command } from "commander";
import { resolveBodyParam } from "../../utils.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  cliConfig,
  parse,
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
const defaultsSpecs: PromptSpec[] = [
  { key: "data", option: "--data <data>", name: "data", description: "Request body", type: "object", required: true },
];
customersRoles
  .command(`defaults`)
  .description(`Idempotent: a role that already exists is left completely alone, its permissions included, so re-seeding never undoes a merchant's edits. Creates viewer, requester, buyer, approver, admin with the built-in mapping. A tenant that never calls this still behaves correctly — the catalogue and every permission read fall back to the same built-ins.`)
  .option(`--data <data>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { data } = await promptForMissing(
          _options,
          defaultsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/roles/defaults`;
        const _payload: RequestParams = {};
        if (data !== undefined) {
          Object.assign(_payload, resolveBodyParam(data));
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
const permissionsReplaceSpecs: PromptSpec[] = [
  { key: "key", option: "--key <key>", name: "key", description: "The role key — one of the tenant's own roles (GET /customers/roles).", type: "string", required: true, resource: { listPath: "/customers/roles", hasLimit: false } },
  { key: "permissions", option: "--permissions [permissions...]", name: "permissions", description: "The complete new set. Duplicates and blanks are ignored; an empty array revokes everything.", type: "array", required: true },
];
customersRoles
  .command(`permissions-replace`)
  .description(`The whole new set in one call — the shape a role editor actually produces, and the one that cannot leave a half-applied grant behind if a second call fails. Seeds the built-in roles first when the tenant has none, so editing works without calling /defaults. Permission keys are free text on purpose: they belong to whichever app declared them, and a grant for an app that is not installed simply has nothing to act on.`)
  .option(`--key <key>`, `The role key — one of the tenant's own roles (GET /customers/roles).`)
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
