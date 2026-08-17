import { Command } from "commander";
import { resolveBodyParam } from "../../utils.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  cliConfig,
  parse,
  parseInteger,
} from "../../parser.js";
import {
  confirmDestructive,
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const io = new Command("io")
  .description(
    commandDescriptions["io"] ??
      `Bulk data plane: import/export profiles, upload tickets, ad-hoc jobs and the job registry (Baseline).`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listBulkJobsSpecs: PromptSpec[] = [
  { key: "type", option: "--type <type>", name: "type", type: "any", required: false },
  { key: "status", option: "--status <status>", name: "status", type: "any", required: false },
  { key: "vendor", option: "--vendor <vendor>", name: "vendor", type: "string", required: false },
  { key: "app", option: "--app <app>", name: "app", type: "string", required: false },
  { key: "entity", option: "--entity <entity>", name: "entity", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", type: "integer", required: false, default: "50" },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
io
  .command(`list-bulk-jobs`)
  .description(`The calling tenant's bulk jobs, newest first. Jobs are created by the
feature blocks (import / export / A/B swap / tenant copy / sample) —
never here; this surface is read-only.`)
  .option(`--type <type>`, ``)
  .option(`--status <status>`, ``)
  .option(`--vendor <vendor>`, ``)
  .option(`--app <app>`, ``)
  .option(`--entity <entity>`, ``)
  .option(`--limit <limit>`, ``, parseInteger)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { type, status, vendor, app, entity, limit, filter } = await promptForMissing(
          _options,
          listBulkJobsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/io/bulk-jobs`;
        const _payload: RequestParams = {};
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (vendor !== undefined) {
          _payload[`vendor`] = vendor;
        }
        if (app !== undefined) {
          _payload[`app`] = app;
        }
        if (entity !== undefined) {
          _payload[`entity`] = entity;
        }
        if (limit !== undefined) {
          _payload[`limit`] = limit;
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
registerPromptSpecs(io.commands.at(-1)!, listBulkJobsSpecs, { method: "get" });
const getBulkJobSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/io/bulk-jobs", hasLimit: true } },
];
io
  .command(`get-bulk-job`)
  .description(`Status, row counts, and progress for one bulk job.

Tenant-scoped: an id belonging to another tenant is filtered out and
is therefore indistinguishable from a non-existent one — which is the
intent.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getBulkJobSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/io/bulk-jobs/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(io.commands.at(-1)!, getBulkJobSpecs, { method: "get" });
const listIoEntitiesSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
io
  .command(`list-io-entities`)
  .description(`Flat list of the entities the calling tenant's installed apps expose,
sorted by vendor, app, entity. Feeds the entity pickers of the
Integration Studio I/O nodes.

The app set comes from \`baseline.tenant_app_versions\`. Per app the
entity list is resolved from the tenant's pinned schema version; when
that pointer is stale (missing or not applied) it falls back to the
latest applied version of \`(vendor, app)\`. Apps with no applied
schema at all contribute no entities.`)
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
          listIoEntitiesSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/io/entities`;
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
registerPromptSpecs(io.commands.at(-1)!, listIoEntitiesSpecs, { method: "get" });
const createExportSpecs: PromptSpec[] = [
  { key: "app", option: "--app <app>", name: "app", type: "string", required: true },
  { key: "entity", option: "--entity <entity>", name: "entity", type: "string", required: true },
  { key: "vendor", option: "--vendor <vendor>", name: "vendor", type: "string", required: true },
  { key: "format", option: "--format <format>", name: "format", type: "string", required: false, default: "csv", enum: ["csv","xml","json","xlsx"] },
  { key: "profileId", option: "--profile-id <profile-id>", name: "profile_id", type: "string", required: false },
];
io
  .command(`create-export`)
  .description(`Creates a \`bulk_job\` and dispatches the engine to export the tenant's
rows for an entity. CSV/XML stream row-by-row into an S3 multipart
upload (flat RAM); JSON/XLSX are buffered. The response carries the
object key the result will be written to.`)
  .option(`--app <app>`, ``)
  .option(`--entity <entity>`, ``)
  .option(`--vendor <vendor>`, ``)
  .option(`--format <format>`, ``)
  .option(`--profile-id <profile-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { app, entity, vendor, format, profileId } = await promptForMissing(
          _options,
          createExportSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/io/exports`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (app !== undefined) {
          _payload[`app`] = app;
        }
        if (entity !== undefined) {
          _payload[`entity`] = entity;
        }
        if (format !== undefined) {
          _payload[`format`] = format;
        }
        if (profileId !== undefined) {
          _payload[`profile_id`] = profileId;
        }
        if (vendor !== undefined) {
          _payload[`vendor`] = vendor;
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
registerPromptSpecs(io.commands.at(-1)!, createExportSpecs, { method: "post" });
const getExportUrlSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The export job's id.", type: "string", required: true },
];
io
  .command(`get-export-url`)
  .description(`Mints a short-TTL signed S3 \`GET\` URL for the object a completed
export wrote. Tenant-scoped: an id belonging to another tenant — or
to a job that is not an export — is indistinguishable from a
non-existent one and answers \`404\`.

The job must have reached \`completed\` or \`partial\`; any earlier
state answers \`409\` and carries the current \`job_status\`.`)
  .option(`--id <id>`, `The export job's id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getExportUrlSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/io/exports/{id}/url`.replace(`{id}`, id);
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
registerPromptSpecs(io.commands.at(-1)!, getExportUrlSpecs, { method: "get" });
const createImportSpecs: PromptSpec[] = [
  { key: "app", option: "--app <app>", name: "app", type: "string", required: true },
  { key: "entity", option: "--entity <entity>", name: "entity", type: "string", required: true },
  { key: "objectKey", option: "--object-key <object-key>", name: "object_key", type: "string", required: true },
  { key: "vendor", option: "--vendor <vendor>", name: "vendor", type: "string", required: true },
  { key: "format", option: "--format <format>", name: "format", type: "string", required: false, default: "csv", enum: ["csv","xml","json","xlsx"] },
  { key: "keys", option: "--keys [keys...]", name: "keys", description: "Natural-key columns for upsert / delta.", type: "array", required: false },
  { key: "maxRejects", option: "--max-rejects <max-rejects>", name: "max_rejects", description: "Rejected rows tolerated before the import fails. Omit for\nunlimited (reject-and-continue); `0` = fail-fast.", type: "integer", required: false },
  { key: "mode", option: "--mode <mode>", name: "mode", type: "string", required: false, default: "upsert", enum: ["upsert","full-sync","append"] },
  { key: "profileId", option: "--profile-id <profile-id>", name: "profile_id", type: "string", required: false },
  { key: "target", option: "--target <target>", name: "target", description: "`shadow` stages the dataset into the A/B `{table}__shadow`\nsibling for diff + switch-over instead of writing live.", type: "string", required: false, default: "live", enum: ["live","shadow"] },
];
io
  .command(`create-import`)
  .description(`Creates a \`bulk_job\` and dispatches the engine to import a previously
uploaded object into the named entity. The engine streams CSV
row-by-row (flat RAM at 1M+ rows) and COPYs into the entity's staging
sibling before a merge / content-hash delta into the target.`)
  .option(`--app <app>`, ``)
  .option(`--entity <entity>`, ``)
  .option(`--object-key <object-key>`, ``)
  .option(`--vendor <vendor>`, ``)
  .option(`--format <format>`, ``)
  .option(`--keys [keys...]`, `Natural-key columns for upsert / delta.`)
  .option(`--max-rejects <max-rejects>`, `Rejected rows tolerated before the import fails. Omit for
unlimited (reject-and-continue); \`0\` = fail-fast.
`, parseInteger)
  .option(`--mode <mode>`, ``)
  .option(`--profile-id <profile-id>`, ``)
  .option(`--target <target>`, `\`shadow\` stages the dataset into the A/B \`{table}__shadow\`
sibling for diff + switch-over instead of writing live.
`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { app, entity, objectKey, vendor, format, keys, maxRejects, mode, profileId, target } = await promptForMissing(
          _options,
          createImportSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/io/imports`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (app !== undefined) {
          _payload[`app`] = app;
        }
        if (entity !== undefined) {
          _payload[`entity`] = entity;
        }
        if (format !== undefined) {
          _payload[`format`] = format;
        }
        if (keys !== undefined) {
          _payload[`keys`] = keys;
        }
        if (maxRejects !== undefined) {
          _payload[`max_rejects`] = maxRejects;
        }
        if (mode !== undefined) {
          _payload[`mode`] = mode;
        }
        if (objectKey !== undefined) {
          _payload[`object_key`] = objectKey;
        }
        if (profileId !== undefined) {
          _payload[`profile_id`] = profileId;
        }
        if (target !== undefined) {
          _payload[`target`] = target;
        }
        if (vendor !== undefined) {
          _payload[`vendor`] = vendor;
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
registerPromptSpecs(io.commands.at(-1)!, createImportSpecs, { method: "post" });
const listProfilesSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
io
  .command(`list-profiles`)
  .description(`The calling tenant's saved profiles, ordered by name.

When \`X-Revenexx-Market\` is present the listing is filtered to the
profiles offered for that market — global profiles (\`markets: null\`)
plus those whose \`markets\` contain it. Omit the header to get every
profile, which is what the management view wants.`)
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
          listProfilesSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/io/profiles`;
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
registerPromptSpecs(io.commands.at(-1)!, listProfilesSpecs, { method: "get" });
const createProfileSpecs: PromptSpec[] = [
  { key: "app", option: "--app <app>", name: "app", type: "string", required: true },
  { key: "direction", option: "--direction <direction>", name: "direction", type: "string", required: true, enum: ["import","export"] },
  { key: "entity", option: "--entity <entity>", name: "entity", type: "string", required: true },
  { key: "format", option: "--format <format>", name: "format", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "vendor", option: "--vendor <vendor>", name: "vendor", type: "string", required: true },
  { key: "applyMode", option: "--apply-mode <apply-mode>", name: "apply_mode", type: "string", required: false, default: "upsert", enum: ["upsert","full-sync","append"] },
  { key: "mapping", option: "--mapping <mapping>", name: "mapping", description: "Field mapping. `fields[]` carry `target` (DB column),\n`source` (external name) and ordered `transforms`; `keys[]`\nare natural-key columns. Optional `max_rejects`/`target`\nride along for import runs.", type: "object", required: false },
  { key: "markets", option: "--markets [markets...]", name: "markets", description: "Markets this profile applies to (n:m). Omitted, `null` or\nempty means global — offered for every market.", type: "array", required: false },
  { key: "options", option: "--options <options>", name: "options", description: "Free-form per-profile engine options.", type: "object", required: false },
];
io
  .command(`create-profile`)
  .description(`A tenant-secured, reusable mapping (field rename + transforms + keys)
for a direction (\`import\`/\`export\`), format, and entity. Runnable
on-click via \`/io/profiles/{id}/run\`.`)
  .option(`--app <app>`, ``)
  .option(`--direction <direction>`, ``)
  .option(`--entity <entity>`, ``)
  .option(`--format <format>`, ``)
  .option(`--name <name>`, ``)
  .option(`--vendor <vendor>`, ``)
  .option(`--apply-mode <apply-mode>`, ``)
  .option(`--mapping <mapping>`, `Field mapping. \`fields[]\` carry \`target\` (DB column),
\`source\` (external name) and ordered \`transforms\`; \`keys[]\`
are natural-key columns. Optional \`max_rejects\`/\`target\`
ride along for import runs.
`)
  .option(`--markets [markets...]`, `Markets this profile applies to (n:m). Omitted, \`null\` or
empty means global — offered for every market.
`)
  .option(`--options <options>`, `Free-form per-profile engine options.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { app, direction, entity, format, name, vendor, applyMode, mapping, markets, options } = await promptForMissing(
          _options,
          createProfileSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/io/profiles`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (app !== undefined) {
          _payload[`app`] = app;
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
        if (mapping !== undefined) {
          _payload[`mapping`] = resolveBodyParam(mapping);
        }
        if (markets !== undefined) {
          _payload[`markets`] = markets;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (options !== undefined) {
          _payload[`options`] = resolveBodyParam(options);
        }
        if (vendor !== undefined) {
          _payload[`vendor`] = vendor;
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
registerPromptSpecs(io.commands.at(-1)!, createProfileSpecs, { method: "post" });
const deleteProfileSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/io/profiles", hasLimit: false } },
];
io
  .command(`delete-profile`)
  .description(`Permanently remove a saved profile owned by the calling tenant.

Idempotent, and deliberately not a \`404\` path: deleting an id that
does not belong to the tenant still answers \`200\`, with \`deleted: 0\`.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteProfileSpecs,
          _command,
        );
        await confirmDestructive(`io delete-profile`);
        const _client = await sdkForProject();
        const _apiPath = `/io/profiles/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(io.commands.at(-1)!, deleteProfileSpecs, { method: "delete", destructive: true });
const showProfileSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/io/profiles", hasLimit: false } },
];
io
  .command(`show-profile`)
  .description(`A single saved profile. Tenant-scoped: an id owned by another tenant
is indistinguishable from a non-existent one and answers \`404\`.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          showProfileSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/io/profiles/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(io.commands.at(-1)!, showProfileSpecs, { method: "get" });
const updateProfileSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/io/profiles", hasLimit: false } },
  { key: "app", option: "--app <app>", name: "app", type: "string", required: true },
  { key: "direction", option: "--direction <direction>", name: "direction", type: "string", required: true, enum: ["import","export"] },
  { key: "entity", option: "--entity <entity>", name: "entity", type: "string", required: true },
  { key: "format", option: "--format <format>", name: "format", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "vendor", option: "--vendor <vendor>", name: "vendor", type: "string", required: true },
  { key: "applyMode", option: "--apply-mode <apply-mode>", name: "apply_mode", type: "string", required: false, default: "upsert", enum: ["upsert","full-sync","append"] },
  { key: "mapping", option: "--mapping <mapping>", name: "mapping", description: "Field mapping. `fields[]` carry `target` (DB column),\n`source` (external name) and ordered `transforms`; `keys[]`\nare natural-key columns. Optional `max_rejects`/`target`\nride along for import runs.", type: "object", required: false },
  { key: "markets", option: "--markets [markets...]", name: "markets", description: "Markets this profile applies to (n:m). Omitted, `null` or\nempty means global — offered for every market.", type: "array", required: false },
  { key: "options", option: "--options <options>", name: "options", description: "Free-form per-profile engine options.", type: "object", required: false },
];
io
  .command(`update-profile`)
  .description(`Replace a saved profile's mapping, format, or apply mode (tenant-scoped).`)
  .option(`--id <id>`, ``)
  .option(`--app <app>`, ``)
  .option(`--direction <direction>`, ``)
  .option(`--entity <entity>`, ``)
  .option(`--format <format>`, ``)
  .option(`--name <name>`, ``)
  .option(`--vendor <vendor>`, ``)
  .option(`--apply-mode <apply-mode>`, ``)
  .option(`--mapping <mapping>`, `Field mapping. \`fields[]\` carry \`target\` (DB column),
\`source\` (external name) and ordered \`transforms\`; \`keys[]\`
are natural-key columns. Optional \`max_rejects\`/\`target\`
ride along for import runs.
`)
  .option(`--markets [markets...]`, `Markets this profile applies to (n:m). Omitted, \`null\` or
empty means global — offered for every market.
`)
  .option(`--options <options>`, `Free-form per-profile engine options.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, app, direction, entity, format, name, vendor, applyMode, mapping, markets, options } = await promptForMissing(
          _options,
          updateProfileSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/io/profiles/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (app !== undefined) {
          _payload[`app`] = app;
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
        if (mapping !== undefined) {
          _payload[`mapping`] = resolveBodyParam(mapping);
        }
        if (markets !== undefined) {
          _payload[`markets`] = markets;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (options !== undefined) {
          _payload[`options`] = resolveBodyParam(options);
        }
        if (vendor !== undefined) {
          _payload[`vendor`] = vendor;
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
registerPromptSpecs(io.commands.at(-1)!, updateProfileSpecs, { method: "put" });
const runProfileSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/io/profiles", hasLimit: false } },
  { key: "markets", option: "--markets [markets...]", name: "markets", description: "Target market(s) the imported rows are assigned to (n:m).\nOverrides the profile's own `markets` for this run; an\nempty array means global (no assignment).", type: "array", required: false },
  { key: "objectKey", option: "--object-key <object-key>", name: "object_key", description: "The uploaded object to import. Required for an import\nrun; ignored for an export run, which generates its own\nkey. Omitting it on an import answers `422` with\n`RUN_NO_OBJECT`.", type: "string", required: false },
];
io
  .command(`run-profile`)
  .description(`Dispatches the engine using the saved profile. An import run requires
\`object_key\` (upload first); an export run writes a generated key.`)
  .option(`--id <id>`, ``)
  .option(`--markets [markets...]`, `Target market(s) the imported rows are assigned to (n:m).
Overrides the profile's own \`markets\` for this run; an
empty array means global (no assignment).
`)
  .option(`--object-key <object-key>`, `The uploaded object to import. Required for an import
run; ignored for an export run, which generates its own
key. Omitting it on an import answers \`422\` with
\`RUN_NO_OBJECT\`.
`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, markets, objectKey } = await promptForMissing(
          _options,
          runProfileSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/io/profiles/{id}/run`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (markets !== undefined) {
          _payload[`markets`] = markets;
        }
        if (objectKey !== undefined) {
          _payload[`object_key`] = objectKey;
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
registerPromptSpecs(io.commands.at(-1)!, runProfileSpecs, { method: "post" });
const createUploadSpecs: PromptSpec[] = [
  { key: "extension", option: "--extension <extension>", name: "extension", description: "File extension for the generated key.", type: "string", required: false, default: "csv" },
];
io
  .command(`create-upload`)
  .description(`Returns a short-lived signed S3 \`PUT\` URL (+ required headers) and
the \`object_key\` to reference in a subsequent \`/io/imports\`. The
client uploads bytes directly to object storage — never through
Baseline.`)
  .option(`--extension <extension>`, `File extension for the generated key.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { extension } = await promptForMissing(
          _options,
          createUploadSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/io/uploads`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (extension !== undefined) {
          _payload[`extension`] = extension;
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
registerPromptSpecs(io.commands.at(-1)!, createUploadSpecs, { method: "post" });
