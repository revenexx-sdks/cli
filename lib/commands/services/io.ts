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

const jobsListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
io
  .command(`jobs-list`)
  .description(`The tenant's import/export job registry, newest first.`)
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
          jobsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/io/bulk-jobs`;
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
registerPromptSpecs(io.commands.at(-1)!, jobsListSpecs, { method: "get" });
io
  .command(`jobs-get`)
  .description(`Get a bulk job`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/io/bulk-jobs/{id}`;
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
const entitiesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
io
  .command(`entities-list`)
  .description(`The registered entities profiles and ad-hoc runs can target — the vendor/app/entity triple plus the backing baseline table.`)
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
          entitiesListSpecs,
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
registerPromptSpecs(io.commands.at(-1)!, entitiesListSpecs, { method: "get" });
const exportsCreateSpecs: PromptSpec[] = [
  { key: "app", option: "--app <app>", name: "app", type: "string", required: true },
  { key: "entity", option: "--entity <entity>", name: "entity", type: "string", required: true },
  { key: "format", option: "--format <format>", name: "format", type: "string", required: true },
  { key: "vendor", option: "--vendor <vendor>", name: "vendor", type: "string", required: true },
  { key: "mapping", option: "--mapping <mapping>", name: "mapping", type: "object", required: false },
];
io
  .command(`exports-create`)
  .description(`Queues an export of the tenant's own data without a stored profile.`)
  .option(`--app <app>`, ``)
  .option(`--entity <entity>`, ``)
  .option(`--format <format>`, ``)
  .option(`--vendor <vendor>`, ``)
  .option(`--mapping <mapping>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { app, entity, format, vendor, mapping } = await promptForMissing(
          _options,
          exportsCreateSpecs,
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
        if (mapping !== undefined) {
          _payload[`mapping`] = resolveBodyParam(mapping);
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
registerPromptSpecs(io.commands.at(-1)!, exportsCreateSpecs, { method: "post" });
io
  .command(`exports-download-url`)
  .description(`Get the signed download URL of a finished export`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/io/exports/{id}/url`;
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
const importsCreateSpecs: PromptSpec[] = [
  { key: "app", option: "--app <app>", name: "app", type: "string", required: true },
  { key: "entity", option: "--entity <entity>", name: "entity", type: "string", required: true },
  { key: "format", option: "--format <format>", name: "format", type: "string", required: true },
  { key: "objectKey", option: "--object-key <object-key>", name: "object_key", type: "string", required: true },
  { key: "vendor", option: "--vendor <vendor>", name: "vendor", type: "string", required: true },
  { key: "applyMode", option: "--apply-mode <apply-mode>", name: "apply_mode", type: "string", required: false },
  { key: "mapping", option: "--mapping <mapping>", name: "mapping", type: "object", required: false },
];
io
  .command(`imports-create`)
  .description(`Registers an uploaded object as an import job without a stored profile and dispatches the engine.`)
  .option(`--app <app>`, ``)
  .option(`--entity <entity>`, ``)
  .option(`--format <format>`, ``)
  .option(`--object-key <object-key>`, ``)
  .option(`--vendor <vendor>`, ``)
  .option(`--apply-mode <apply-mode>`, ``)
  .option(`--mapping <mapping>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { app, entity, format, objectKey, vendor, applyMode, mapping } = await promptForMissing(
          _options,
          importsCreateSpecs,
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
        if (applyMode !== undefined) {
          _payload[`apply_mode`] = applyMode;
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
        if (objectKey !== undefined) {
          _payload[`object_key`] = objectKey;
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
registerPromptSpecs(io.commands.at(-1)!, importsCreateSpecs, { method: "post" });
const profilesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
io
  .command(`profiles-list`)
  .description(`Lists the tenant's IO profiles. With \`X-Revenexx-Market\` set, returns global profiles plus those offered for that market.`)
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
          profilesListSpecs,
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
registerPromptSpecs(io.commands.at(-1)!, profilesListSpecs, { method: "get" });
const profilesCreateSpecs: PromptSpec[] = [
  { key: "app", option: "--app <app>", name: "app", type: "string", required: true },
  { key: "direction", option: "--direction <direction>", name: "direction", type: "string", required: true, enum: ["import","export"] },
  { key: "entity", option: "--entity <entity>", name: "entity", type: "string", required: true },
  { key: "format", option: "--format <format>", name: "format", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "vendor", option: "--vendor <vendor>", name: "vendor", type: "string", required: true },
  { key: "applyMode", option: "--apply-mode <apply-mode>", name: "apply_mode", type: "string", required: false, default: "upsert", enum: ["upsert","append","full-sync"] },
  { key: "mapping", option: "--mapping <mapping>", name: "mapping", type: "object", required: false },
  { key: "markets", option: "--markets [markets...]", name: "markets", type: "array", required: false },
  { key: "options", option: "--options <options>", name: "options", type: "object", required: false },
];
io
  .command(`profiles-create`)
  .description(`Create a profile`)
  .option(`--app <app>`, ``)
  .option(`--direction <direction>`, ``)
  .option(`--entity <entity>`, ``)
  .option(`--format <format>`, ``)
  .option(`--name <name>`, ``)
  .option(`--vendor <vendor>`, ``)
  .option(`--apply-mode <apply-mode>`, ``)
  .option(`--mapping <mapping>`, ``)
  .option(`--markets [markets...]`, ``)
  .option(`--options <options>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { app, direction, entity, format, name, vendor, applyMode, mapping, markets, options } = await promptForMissing(
          _options,
          profilesCreateSpecs,
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
registerPromptSpecs(io.commands.at(-1)!, profilesCreateSpecs, { method: "post" });
io
  .command(`profiles-delete`)
  .description(`Delete a profile`)
  .action(
    actionRunner(
      async () => {
        await confirmDestructive(`io profiles-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/io/profiles/{id}`;
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
registerPromptSpecs(io.commands.at(-1)!, [], { method: "delete", destructive: true });
io
  .command(`profiles-get`)
  .description(`Get a profile`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/io/profiles/{id}`;
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
const profilesUpdateSpecs: PromptSpec[] = [
  { key: "app", option: "--app <app>", name: "app", type: "string", required: true },
  { key: "direction", option: "--direction <direction>", name: "direction", type: "string", required: true, enum: ["import","export"] },
  { key: "entity", option: "--entity <entity>", name: "entity", type: "string", required: true },
  { key: "format", option: "--format <format>", name: "format", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "vendor", option: "--vendor <vendor>", name: "vendor", type: "string", required: true },
  { key: "applyMode", option: "--apply-mode <apply-mode>", name: "apply_mode", type: "string", required: false, default: "upsert", enum: ["upsert","append","full-sync"] },
  { key: "mapping", option: "--mapping <mapping>", name: "mapping", type: "object", required: false },
  { key: "markets", option: "--markets [markets...]", name: "markets", type: "array", required: false },
  { key: "options", option: "--options <options>", name: "options", type: "object", required: false },
];
io
  .command(`profiles-update`)
  .description(`Update a profile`)
  .option(`--app <app>`, ``)
  .option(`--direction <direction>`, ``)
  .option(`--entity <entity>`, ``)
  .option(`--format <format>`, ``)
  .option(`--name <name>`, ``)
  .option(`--vendor <vendor>`, ``)
  .option(`--apply-mode <apply-mode>`, ``)
  .option(`--mapping <mapping>`, ``)
  .option(`--markets [markets...]`, ``)
  .option(`--options <options>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { app, direction, entity, format, name, vendor, applyMode, mapping, markets, options } = await promptForMissing(
          _options,
          profilesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/io/profiles/{id}`;
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
registerPromptSpecs(io.commands.at(-1)!, profilesUpdateSpecs, { method: "put" });
const profilesRunSpecs: PromptSpec[] = [
  { key: "markets", option: "--markets [markets...]", name: "markets", description: "Target market slugs for imported rows; empty = global", type: "array", required: false },
  { key: "objectKey", option: "--object-key <object-key>", name: "object_key", description: "Uploaded source object (imports only)", type: "string", required: false },
];
io
  .command(`profiles-run`)
  .description(`Queues an import or export run of the profile. Import runs require \`object_key\` (from an upload ticket); \`markets\` overrides the profile's target markets (empty array = global).`)
  .option(`--markets [markets...]`, `Target market slugs for imported rows; empty = global`)
  .option(`--object-key <object-key>`, `Uploaded source object (imports only)`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { markets, objectKey } = await promptForMissing(
          _options,
          profilesRunSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/io/profiles/{id}/run`;
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
registerPromptSpecs(io.commands.at(-1)!, profilesRunSpecs, { method: "post" });
const uploadsCreateSpecs: PromptSpec[] = [
  { key: "extension", option: "--extension <extension>", name: "extension", type: "string", required: false, default: "csv" },
];
io
  .command(`uploads-create`)
  .description(`Returns a signed, time-limited S3 upload URL. PUT the file bytes directly to \`upload_url\` (with the returned headers), then reference \`object_key\` in an import run.`)
  .option(`--extension <extension>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { extension } = await promptForMissing(
          _options,
          uploadsCreateSpecs,
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
registerPromptSpecs(io.commands.at(-1)!, uploadsCreateSpecs, { method: "post" });
