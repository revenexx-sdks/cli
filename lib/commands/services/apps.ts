import { Command } from "commander";
import { resolveFileParam } from "../utils/deployment.js";
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

export const apps = new Command("apps")
  .description(
    commandDescriptions["apps"] ??
      `The Revenexx app runtime (Appwrite functions, extended) and marketplace.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: name, enabled, runtime, deploymentId, schedule, scheduleNext, schedulePrevious, timeout, entrypoint, commands, installationId", type: "array", required: false },
  { key: "search", option: "--search <search>", name: "search", description: "Search term to filter your list results. Max length: 256 chars.", type: "string", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
apps
  .command(`list`)
  .description(`List all Apps in the active project. Pass \`search\` to filter by name.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: name, enabled, runtime, deploymentId, schedule, scheduleNext, schedulePrevious, timeout, entrypoint, commands, installationId`)
  .option(`--search <search>`, `Search term to filter your list results. Max length: 256 chars.`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { queries, search, total, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps`;
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (search !== undefined) {
          _payload[`search`] = search;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
registerPromptSpecs(apps.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID. Choose a custom ID or generate a random ID with `ID.unique()`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "Function name. Max length: 128 chars.", type: "string", required: true },
  { key: "runtime", option: "--runtime <runtime>", name: "runtime", description: "Execution runtime.", type: "string", required: true, enum: ["node-18.0","node-20.0","node-22","node-23","node-24","node-25","php-8.1","php-8.2","php-8.3","php-8.4","ruby-3.1","ruby-3.2","ruby-3.3","ruby-3.4","ruby-4.0","python-3.9","python-3.10","python-3.11","python-3.12","python-3.13","python-3.14","python-ml-3.11","python-ml-3.12","python-ml-3.13","deno-1.46","deno-2.0","deno-2.5","deno-2.6","dart-2.18","dart-2.19","dart-3.0","dart-3.1","dart-3.3","dart-3.5","dart-3.8","dart-3.9","dart-3.10","dotnet-8.0","dotnet-10","java-8.0","java-11.0","java-17.0","java-21.0","java-22","java-25","swift-5.8","swift-5.9","swift-5.10","swift-6.2","kotlin-1.8","kotlin-1.9","kotlin-2.0","kotlin-2.3","cpp-17","cpp-20","cpp-23","bun-1.0","bun-1.1","bun-1.2","bun-1.3","go-1.23","go-1.24","go-1.25","go-1.26","static-1","flutter-3.24","flutter-3.27","flutter-3.29","flutter-3.32","flutter-3.35","flutter-3.38"] },
  { key: "commands", option: "--commands <commands>", name: "commands", description: "Build Commands.", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Is function enabled? When set to 'disabled', users cannot access the function but Server SDKs with and API key can still access the function. No data is lost when this is toggled.", type: "boolean", required: false },
  { key: "entrypoint", option: "--entrypoint <entrypoint>", name: "entrypoint", description: "Entrypoint File. This path is relative to the \"providerRootDirectory\".", type: "string", required: false },
  { key: "events", option: "--events [events...]", name: "events", description: "Events list. Maximum of 100 events are allowed.", type: "array", required: false },
  { key: "execute", option: "--execute [execute...]", name: "execute", description: "An array of role strings with execution permissions. By default no user is granted with any execute permissions. [learn more about roles](https://appwrite.io/docs/permissions#permission-roles). Maximum of 100 roles are allowed, each 64 characters long.", type: "array", required: false },
  { key: "installationId", option: "--installation-id <installation-id>", name: "installationId", description: "Appwrite Installation ID for VCS (Version Control System) deployment.", type: "string", required: false },
  { key: "logging", option: "--logging <logging>", name: "logging", description: "When disabled, executions will exclude logs and errors, and will be slightly faster.", type: "boolean", required: false },
  { key: "providerBranch", option: "--provider-branch <provider-branch>", name: "providerBranch", description: "Production branch for the repo linked to the function.", type: "string", required: false },
  { key: "providerRepositoryId", option: "--provider-repository-id <provider-repository-id>", name: "providerRepositoryId", description: "Repository ID of the repo linked to the function.", type: "string", required: false },
  { key: "providerRootDirectory", option: "--provider-root-directory <provider-root-directory>", name: "providerRootDirectory", description: "Path to function code in the linked repo.", type: "string", required: false },
  { key: "providerSilentMode", option: "--provider-silent-mode <provider-silent-mode>", name: "providerSilentMode", description: "Is the VCS (Version Control System) connection in silent mode for the repo linked to the function? In silent mode, comments will not be made on commits and pull requests.", type: "boolean", required: false },
  { key: "schedule", option: "--schedule <schedule>", name: "schedule", description: "Schedule CRON syntax.", type: "string", required: false },
  { key: "scopes", option: "--scopes [scopes...]", name: "scopes", description: "List of scopes allowed for API key auto-generated for every execution. Maximum of 100 scopes are allowed.", type: "array", required: false, enum: ["sessions.write","users.read","users.write","teams.read","teams.write","databases.read","databases.write","collections.read","collections.write","tables.read","tables.write","attributes.read","attributes.write","columns.read","columns.write","indexes.read","indexes.write","documents.read","documents.write","rows.read","rows.write","files.read","files.write","buckets.read","buckets.write","functions.read","functions.write","sites.read","sites.write","log.read","log.write","execution.read","execution.write","locale.read","avatars.read","health.read","providers.read","providers.write","messages.read","messages.write","topics.read","topics.write","subscribers.read","subscribers.write","targets.read","targets.write","rules.read","rules.write","migrations.read","migrations.write","vcs.read","vcs.write","assistant.read","tokens.read","tokens.write"] },
  { key: "specification", option: "--specification <specification>", name: "specification", description: "Runtime specification for the function and builds.", type: "string", required: false },
  { key: "timeout", option: "--timeout <timeout>", name: "timeout", description: "Function maximum execution time in seconds.", type: "integer", required: false },
];
apps
  .command(`create`)
  .description(`Create a new revenexx App. An App is the deployment surface for code that runs on the platform — backend jobs, APIs, integrations. The created App owns subsequent deployments and executions.

Phase 1 mirrors the underlying Functions runtime 1:1; future phases will add manifest validation, registry coupling and schema migrations.`)
  .option(`--function-id <function-id>`, `Function ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
  .option(`--name <name>`, `Function name. Max length: 128 chars.`)
  .option(`--runtime <runtime>`, `Execution runtime.`)
  .option(`--commands <commands>`, `Build Commands.`)
  .option(
    `--enabled [value]`,
    `Is function enabled? When set to 'disabled', users cannot access the function but Server SDKs with and API key can still access the function. No data is lost when this is toggled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--entrypoint <entrypoint>`, `Entrypoint File. This path is relative to the "providerRootDirectory".`)
  .option(`--events [events...]`, `Events list. Maximum of 100 events are allowed.`)
  .option(`--execute [execute...]`, `An array of role strings with execution permissions. By default no user is granted with any execute permissions. [learn more about roles](https://appwrite.io/docs/permissions#permission-roles). Maximum of 100 roles are allowed, each 64 characters long.`)
  .option(`--installation-id <installation-id>`, `Appwrite Installation ID for VCS (Version Control System) deployment.`)
  .option(
    `--logging [value]`,
    `When disabled, executions will exclude logs and errors, and will be slightly faster.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--provider-branch <provider-branch>`, `Production branch for the repo linked to the function.`)
  .option(`--provider-repository-id <provider-repository-id>`, `Repository ID of the repo linked to the function.`)
  .option(`--provider-root-directory <provider-root-directory>`, `Path to function code in the linked repo.`)
  .option(
    `--provider-silent-mode [value]`,
    `Is the VCS (Version Control System) connection in silent mode for the repo linked to the function? In silent mode, comments will not be made on commits and pull requests.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--schedule <schedule>`, `Schedule CRON syntax.`)
  .option(`--scopes [scopes...]`, `List of scopes allowed for API key auto-generated for every execution. Maximum of 100 scopes are allowed.`)
  .option(`--specification <specification>`, `Runtime specification for the function and builds.`)
  .option(`--timeout <timeout>`, `Function maximum execution time in seconds.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, name, runtime, commands, enabled, entrypoint, events, execute, installationId, logging, providerBranch, providerRepositoryId, providerRootDirectory, providerSilentMode, schedule, scopes, specification, timeout } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (commands !== undefined) {
          _payload[`commands`] = commands;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (entrypoint !== undefined) {
          _payload[`entrypoint`] = entrypoint;
        }
        if (events !== undefined) {
          _payload[`events`] = events;
        }
        if (execute !== undefined) {
          _payload[`execute`] = execute;
        }
        if (functionId !== undefined) {
          _payload[`functionId`] = functionId;
        }
        if (installationId !== undefined) {
          _payload[`installationId`] = installationId;
        }
        if (logging !== undefined) {
          _payload[`logging`] = logging;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (providerBranch !== undefined) {
          _payload[`providerBranch`] = providerBranch;
        }
        if (providerRepositoryId !== undefined) {
          _payload[`providerRepositoryId`] = providerRepositoryId;
        }
        if (providerRootDirectory !== undefined) {
          _payload[`providerRootDirectory`] = providerRootDirectory;
        }
        if (providerSilentMode !== undefined) {
          _payload[`providerSilentMode`] = providerSilentMode;
        }
        if (runtime !== undefined) {
          _payload[`runtime`] = runtime;
        }
        if (schedule !== undefined) {
          _payload[`schedule`] = schedule;
        }
        if (scopes !== undefined) {
          _payload[`scopes`] = scopes;
        }
        if (specification !== undefined) {
          _payload[`specification`] = specification;
        }
        if (timeout !== undefined) {
          _payload[`timeout`] = timeout;
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
registerPromptSpecs(apps.commands.at(-1)!, createSpecs, { method: "post" });
const listMarketplaceSpecs: PromptSpec[] = [
  { key: "search", option: "--search <search>", name: "search", description: "Search by app name, title or vendor.", type: "string", required: false },
  { key: "perPage", option: "--per-page <per-page>", name: "per_page", description: "Items per page.", type: "integer", required: false },
  { key: "page", option: "--page <page>", name: "page", description: "Page number.", type: "integer", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
apps
  .command(`list-marketplace`)
  .description(`List apps published to the Marketplace. Proxies the App Registry on Console with \`?published=true\` filter.`)
  .option(`--search <search>`, `Search by app name, title or vendor.`)
  .option(`--per-page <per-page>`, `Items per page.`, parseInteger)
  .option(`--page <page>`, `Page number.`, parseInteger)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { search, perPage, page, filter } = await promptForMissing(
          _options,
          listMarketplaceSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/marketplace`;
        const _payload: RequestParams = {};
        if (search !== undefined) {
          _payload[`search`] = search;
        }
        if (perPage !== undefined) {
          _payload[`per_page`] = perPage;
        }
        if (page !== undefined) {
          _payload[`page`] = page;
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
registerPromptSpecs(apps.commands.at(-1)!, listMarketplaceSpecs, { method: "get" });
const installFromMarketplaceSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "App name.", type: "string", required: true },
  { key: "owner", option: "--owner <owner>", name: "owner", description: "Owner tenant slug of the app being installed.", type: "string", required: true },
];
apps
  .command(`install-from-marketplace`)
  .description(`Install a Marketplace app on the calling project's tenant. Body: { owner, name }.`)
  .option(`--name <name>`, `App name.`)
  .option(`--owner <owner>`, `Owner tenant slug of the app being installed.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, owner } = await promptForMissing(
          _options,
          installFromMarketplaceSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/marketplace/install`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (owner !== undefined) {
          _payload[`owner`] = owner;
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
registerPromptSpecs(apps.commands.at(-1)!, installFromMarketplaceSpecs, { method: "post" });
const listRuntimesSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
apps
  .command(`list-runtimes`)
  .description(`Get a list of all runtimes available for an App. Identical content to \`functions.listRuntimes()\`.`)
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
          listRuntimesSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/runtimes`;
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
registerPromptSpecs(apps.commands.at(-1)!, listRuntimesSpecs, { method: "get" });
const listSpecificationsSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
apps
  .command(`list-specifications`)
  .description(`List the compute specifications (CPU + memory) available to Apps in this project.`)
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
          listSpecificationsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/specifications`;
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
registerPromptSpecs(apps.commands.at(-1)!, listSpecificationsSpecs, { method: "get" });
const listTemplatesSpecs: PromptSpec[] = [
  { key: "runtimes", option: "--runtimes [runtimes...]", name: "runtimes", description: "List of runtimes allowed for filtering function templates. Maximum of 100 runtimes are allowed.", type: "array", required: false, enum: ["node-18.0","node-20.0","node-22","node-23","node-24","node-25","php-8.1","php-8.2","php-8.3","php-8.4","ruby-3.1","ruby-3.2","ruby-3.3","ruby-3.4","ruby-4.0","python-3.9","python-3.10","python-3.11","python-3.12","python-3.13","python-3.14","python-ml-3.11","python-ml-3.12","python-ml-3.13","deno-1.46","deno-2.0","deno-2.5","deno-2.6","dart-2.18","dart-2.19","dart-3.0","dart-3.1","dart-3.3","dart-3.5","dart-3.8","dart-3.9","dart-3.10","dotnet-8.0","dotnet-10","java-8.0","java-11.0","java-17.0","java-21.0","java-22","java-25","swift-5.8","swift-5.9","swift-5.10","swift-6.2","kotlin-1.8","kotlin-1.9","kotlin-2.0","kotlin-2.3","cpp-17","cpp-20","cpp-23","bun-1.0","bun-1.1","bun-1.2","bun-1.3","go-1.23","go-1.24","go-1.25","go-1.26","static-1","flutter-3.24","flutter-3.27","flutter-3.29","flutter-3.32","flutter-3.35","flutter-3.38"] },
  { key: "useCases", option: "--use-cases [use-cases...]", name: "useCases", description: "List of use cases allowed for filtering function templates. Maximum of 100 use cases are allowed.", type: "array", required: false, enum: ["starter","databases","ai","messaging","utilities","dev-tools","auth"] },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Limit the number of templates returned in the response. Default limit is 25, and maximum limit is 5000.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Offset the list of returned templates. Maximum offset is 5000.", type: "integer", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
apps
  .command(`list-templates`)
  .description(`List the curated catalogue of App templates that can be used as starting points.`)
  .option(`--runtimes [runtimes...]`, `List of runtimes allowed for filtering function templates. Maximum of 100 runtimes are allowed.`)
  .option(`--use-cases [use-cases...]`, `List of use cases allowed for filtering function templates. Maximum of 100 use cases are allowed.`)
  .option(`--limit <limit>`, `Limit the number of templates returned in the response. Default limit is 25, and maximum limit is 5000.`, parseInteger)
  .option(`--offset <offset>`, `Offset the list of returned templates. Maximum offset is 5000.`, parseInteger)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { runtimes, useCases, limit, offset, total, filter } = await promptForMissing(
          _options,
          listTemplatesSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/templates`;
        const _payload: RequestParams = {};
        if (runtimes !== undefined) {
          _payload[`runtimes`] = runtimes;
        }
        if (useCases !== undefined) {
          _payload[`useCases`] = useCases;
        }
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
registerPromptSpecs(apps.commands.at(-1)!, listTemplatesSpecs, { method: "get" });
const getTemplateSpecs: PromptSpec[] = [
  { key: "templateId", option: "--template-id <template-id>", name: "templateId", description: "Template ID.", type: "string", required: true, resource: { listPath: "/apps/templates", hasLimit: true } },
];
apps
  .command(`get-template`)
  .description(`Get a single App template by its ID.`)
  .option(`--template-id <template-id>`, `Template ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { templateId } = await promptForMissing(
          _options,
          getTemplateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/templates/{templateId}`.replace(`{templateId}`, templateId);
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
registerPromptSpecs(apps.commands.at(-1)!, getTemplateSpecs, { method: "get" });
const listUsageSpecs: PromptSpec[] = [
  { key: "range", option: "--range <range>", name: "range", description: "Date range.", type: "string", required: false, enum: ["24h","30d","90d"] },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
apps
  .command(`list-usage`)
  .description(`Get aggregated usage stats across all Apps in the project for the requested time range.`)
  .option(`--range <range>`, `Date range.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { range, filter } = await promptForMissing(
          _options,
          listUsageSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/usage`;
        const _payload: RequestParams = {};
        if (range !== undefined) {
          _payload[`range`] = range;
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
registerPromptSpecs(apps.commands.at(-1)!, listUsageSpecs, { method: "get" });
const deleteSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "App ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
];
apps
  .command(`delete`)
  .description(`Delete an App and all of its deployments. Cascades to the App Registry — Console removes the matching \`RegisteredApp\` row.`)
  .option(`--function-id <function-id>`, `App ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`apps delete`);
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}`.replace(`{functionId}`, functionId);
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
registerPromptSpecs(apps.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
];
apps
  .command(`get`)
  .description(`Get an App by its unique ID.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}`.replace(`{functionId}`, functionId);
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
registerPromptSpecs(apps.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "name", option: "--name <name>", name: "name", description: "Function name. Max length: 128 chars.", type: "string", required: true },
  { key: "commands", option: "--commands <commands>", name: "commands", description: "Build Commands.", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Is function enabled? When set to 'disabled', users cannot access the function but Server SDKs with and API key can still access the function. No data is lost when this is toggled.", type: "boolean", required: false },
  { key: "entrypoint", option: "--entrypoint <entrypoint>", name: "entrypoint", description: "Entrypoint File. This path is relative to the \"providerRootDirectory\".", type: "string", required: false },
  { key: "events", option: "--events [events...]", name: "events", description: "Events list. Maximum of 100 events are allowed.", type: "array", required: false },
  { key: "execute", option: "--execute [execute...]", name: "execute", description: "An array of role strings with execution permissions. By default no user is granted with any execute permissions. [learn more about roles](https://appwrite.io/docs/permissions#permission-roles). Maximum of 100 roles are allowed, each 64 characters long.", type: "array", required: false },
  { key: "installationId", option: "--installation-id <installation-id>", name: "installationId", description: "Appwrite Installation ID for VCS (Version Controle System) deployment.", type: "string", required: false },
  { key: "logging", option: "--logging <logging>", name: "logging", description: "When disabled, executions will exclude logs and errors, and will be slightly faster.", type: "boolean", required: false },
  { key: "providerBranch", option: "--provider-branch <provider-branch>", name: "providerBranch", description: "Production branch for the repo linked to the function", type: "string", required: false },
  { key: "providerRepositoryId", option: "--provider-repository-id <provider-repository-id>", name: "providerRepositoryId", description: "Repository ID of the repo linked to the function", type: "string", required: false },
  { key: "providerRootDirectory", option: "--provider-root-directory <provider-root-directory>", name: "providerRootDirectory", description: "Path to function code in the linked repo.", type: "string", required: false },
  { key: "providerSilentMode", option: "--provider-silent-mode <provider-silent-mode>", name: "providerSilentMode", description: "Is the VCS (Version Control System) connection in silent mode for the repo linked to the function? In silent mode, comments will not be made on commits and pull requests.", type: "boolean", required: false },
  { key: "runtime", option: "--runtime <runtime>", name: "runtime", description: "Execution runtime.", type: "string", required: false, enum: ["node-18.0","node-20.0","node-22","node-23","node-24","node-25","php-8.1","php-8.2","php-8.3","php-8.4","ruby-3.1","ruby-3.2","ruby-3.3","ruby-3.4","ruby-4.0","python-3.9","python-3.10","python-3.11","python-3.12","python-3.13","python-3.14","python-ml-3.11","python-ml-3.12","python-ml-3.13","deno-1.46","deno-2.0","deno-2.5","deno-2.6","dart-2.18","dart-2.19","dart-3.0","dart-3.1","dart-3.3","dart-3.5","dart-3.8","dart-3.9","dart-3.10","dotnet-8.0","dotnet-10","java-8.0","java-11.0","java-17.0","java-21.0","java-22","java-25","swift-5.8","swift-5.9","swift-5.10","swift-6.2","kotlin-1.8","kotlin-1.9","kotlin-2.0","kotlin-2.3","cpp-17","cpp-20","cpp-23","bun-1.0","bun-1.1","bun-1.2","bun-1.3","go-1.23","go-1.24","go-1.25","go-1.26","static-1","flutter-3.24","flutter-3.27","flutter-3.29","flutter-3.32","flutter-3.35","flutter-3.38"] },
  { key: "schedule", option: "--schedule <schedule>", name: "schedule", description: "Schedule CRON syntax.", type: "string", required: false },
  { key: "scopes", option: "--scopes [scopes...]", name: "scopes", description: "List of scopes allowed for API Key auto-generated for every execution. Maximum of 100 scopes are allowed.", type: "array", required: false, enum: ["sessions.write","users.read","users.write","teams.read","teams.write","databases.read","databases.write","collections.read","collections.write","tables.read","tables.write","attributes.read","attributes.write","columns.read","columns.write","indexes.read","indexes.write","documents.read","documents.write","rows.read","rows.write","files.read","files.write","buckets.read","buckets.write","functions.read","functions.write","sites.read","sites.write","log.read","log.write","execution.read","execution.write","locale.read","avatars.read","health.read","providers.read","providers.write","messages.read","messages.write","topics.read","topics.write","subscribers.read","subscribers.write","targets.read","targets.write","rules.read","rules.write","migrations.read","migrations.write","vcs.read","vcs.write","assistant.read","tokens.read","tokens.write"] },
  { key: "specification", option: "--specification <specification>", name: "specification", description: "Runtime specification for the function and builds.", type: "string", required: false },
  { key: "timeout", option: "--timeout <timeout>", name: "timeout", description: "Maximum execution time in seconds.", type: "integer", required: false },
];
apps
  .command(`update`)
  .description(`Update an App. Use this endpoint to rename, change runtime, schedule, environment variables and other configuration.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .option(`--name <name>`, `Function name. Max length: 128 chars.`)
  .option(`--commands <commands>`, `Build Commands.`)
  .option(
    `--enabled [value]`,
    `Is function enabled? When set to 'disabled', users cannot access the function but Server SDKs with and API key can still access the function. No data is lost when this is toggled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--entrypoint <entrypoint>`, `Entrypoint File. This path is relative to the "providerRootDirectory".`)
  .option(`--events [events...]`, `Events list. Maximum of 100 events are allowed.`)
  .option(`--execute [execute...]`, `An array of role strings with execution permissions. By default no user is granted with any execute permissions. [learn more about roles](https://appwrite.io/docs/permissions#permission-roles). Maximum of 100 roles are allowed, each 64 characters long.`)
  .option(`--installation-id <installation-id>`, `Appwrite Installation ID for VCS (Version Controle System) deployment.`)
  .option(
    `--logging [value]`,
    `When disabled, executions will exclude logs and errors, and will be slightly faster.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--provider-branch <provider-branch>`, `Production branch for the repo linked to the function`)
  .option(`--provider-repository-id <provider-repository-id>`, `Repository ID of the repo linked to the function`)
  .option(`--provider-root-directory <provider-root-directory>`, `Path to function code in the linked repo.`)
  .option(
    `--provider-silent-mode [value]`,
    `Is the VCS (Version Control System) connection in silent mode for the repo linked to the function? In silent mode, comments will not be made on commits and pull requests.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--runtime <runtime>`, `Execution runtime.`)
  .option(`--schedule <schedule>`, `Schedule CRON syntax.`)
  .option(`--scopes [scopes...]`, `List of scopes allowed for API Key auto-generated for every execution. Maximum of 100 scopes are allowed.`)
  .option(`--specification <specification>`, `Runtime specification for the function and builds.`)
  .option(`--timeout <timeout>`, `Maximum execution time in seconds.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, name, commands, enabled, entrypoint, events, execute, installationId, logging, providerBranch, providerRepositoryId, providerRootDirectory, providerSilentMode, runtime, schedule, scopes, specification, timeout } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (commands !== undefined) {
          _payload[`commands`] = commands;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (entrypoint !== undefined) {
          _payload[`entrypoint`] = entrypoint;
        }
        if (events !== undefined) {
          _payload[`events`] = events;
        }
        if (execute !== undefined) {
          _payload[`execute`] = execute;
        }
        if (installationId !== undefined) {
          _payload[`installationId`] = installationId;
        }
        if (logging !== undefined) {
          _payload[`logging`] = logging;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (providerBranch !== undefined) {
          _payload[`providerBranch`] = providerBranch;
        }
        if (providerRepositoryId !== undefined) {
          _payload[`providerRepositoryId`] = providerRepositoryId;
        }
        if (providerRootDirectory !== undefined) {
          _payload[`providerRootDirectory`] = providerRootDirectory;
        }
        if (providerSilentMode !== undefined) {
          _payload[`providerSilentMode`] = providerSilentMode;
        }
        if (runtime !== undefined) {
          _payload[`runtime`] = runtime;
        }
        if (schedule !== undefined) {
          _payload[`schedule`] = schedule;
        }
        if (scopes !== undefined) {
          _payload[`scopes`] = scopes;
        }
        if (specification !== undefined) {
          _payload[`specification`] = specification;
        }
        if (timeout !== undefined) {
          _payload[`timeout`] = timeout;
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
registerPromptSpecs(apps.commands.at(-1)!, updateSpecs, { method: "put" });
const updateDeploymentSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "deploymentId", option: "--deployment-id <deployment-id>", name: "deploymentId", description: "Deployment ID.", type: "string", required: true },
];
apps
  .command(`update-deployment`)
  .description(`Set the active deployment for an App. The chosen deployment must already be \`ready\`.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .option(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, deploymentId } = await promptForMissing(
          _options,
          updateDeploymentSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/deployment`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (deploymentId !== undefined) {
          _payload[`deploymentId`] = deploymentId;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(apps.commands.at(-1)!, updateDeploymentSpecs, { method: "patch" });
const listDeploymentsSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: buildSize, sourceSize, totalSize, buildDuration, status, activate, type", type: "array", required: false },
  { key: "search", option: "--search <search>", name: "search", description: "Search term to filter your list results. Max length: 256 chars.", type: "string", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
apps
  .command(`list-deployments`)
  .description(`List the deployment history of an App.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: buildSize, sourceSize, totalSize, buildDuration, status, activate, type`)
  .option(`--search <search>`, `Search term to filter your list results. Max length: 256 chars.`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, queries, search, total, filter } = await promptForMissing(
          _options,
          listDeploymentsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/deployments`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (search !== undefined) {
          _payload[`search`] = search;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
registerPromptSpecs(apps.commands.at(-1)!, listDeploymentsSpecs, { method: "get" });
const createDeploymentSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "activate", option: "--activate <activate>", name: "activate", description: "Automatically activate the deployment when it is finished building.", type: "boolean", required: true },
  { key: "code", option: "--code <code>", name: "code", description: "Gzip file with your code package. When used with the Appwrite CLI, pass the path to your code directory, and the CLI will automatically package your code. Use a path that is within the current directory.", type: "file", required: true },
  { key: "commands", option: "--commands <commands>", name: "commands", description: "Build Commands.", type: "string", required: false },
  { key: "entrypoint", option: "--entrypoint <entrypoint>", name: "entrypoint", description: "Entrypoint File.", type: "string", required: false },
];
apps
  .command(`create-deployment`)
  .description(`Upload a new code deployment for an App. Accepts a \`.tar.gz\`
archive containing the App source. Phase 2 will extract the
manifest from this archive and validate it against the App
Registry before kicking off the build.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .option(`--activate <activate>`, `Automatically activate the deployment when it is finished building.`, parseBool)
  .option(`--code <code>`, `Gzip file with your code package. When used with the Appwrite CLI, pass the path to your code directory, and the CLI will automatically package your code. Use a path that is within the current directory.`)
  .option(`--commands <commands>`, `Build Commands.`)
  .option(`--entrypoint <entrypoint>`, `Entrypoint File.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, activate, code, commands, entrypoint } = await promptForMissing(
          _options,
          createDeploymentSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/deployments`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (activate !== undefined) {
          _payload[`activate`] = activate;
        }
        if (code !== undefined) {
          _payload[`code`] = code !== undefined ? await resolveFileParam(code) : undefined;
        }
        if (commands !== undefined) {
          _payload[`commands`] = commands;
        }
        if (entrypoint !== undefined) {
          _payload[`entrypoint`] = entrypoint;
        }
        const _headers: Record<string, string> = {
          "content-type": "multipart/form-data",
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
registerPromptSpecs(apps.commands.at(-1)!, createDeploymentSpecs, { method: "post" });
const createDuplicateDeploymentSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "deploymentId", option: "--deployment-id <deployment-id>", name: "deploymentId", description: "Deployment ID.", type: "string", required: true },
  { key: "buildId", option: "--build-id <build-id>", name: "buildId", description: "Build unique ID.", type: "string", required: false },
];
apps
  .command(`create-duplicate-deployment`)
  .description(`Re-deploy an existing build under a new deployment ID. Useful for promoting a known-good preview build to production without rebuilding.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .option(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .option(`--build-id <build-id>`, `Build unique ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, deploymentId, buildId } = await promptForMissing(
          _options,
          createDuplicateDeploymentSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/deployments/duplicate`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (buildId !== undefined) {
          _payload[`buildId`] = buildId;
        }
        if (deploymentId !== undefined) {
          _payload[`deploymentId`] = deploymentId;
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
registerPromptSpecs(apps.commands.at(-1)!, createDuplicateDeploymentSpecs, { method: "post" });
const createTemplateDeploymentSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "owner", option: "--owner <owner>", name: "owner", description: "The name of the owner of the template.", type: "string", required: true },
  { key: "reference", option: "--reference <reference>", name: "reference", description: "Reference value, can be a commit hash, branch name, or release tag", type: "string", required: true },
  { key: "repository", option: "--repository <repository>", name: "repository", description: "Repository name of the template.", type: "string", required: true },
  { key: "rootDirectory", option: "--root-directory <root-directory>", name: "rootDirectory", description: "Path to function code in the template repo.", type: "string", required: true },
  { key: "type", option: "--type <type>", name: "type", description: "Type for the reference provided. Can be commit, branch, or tag", type: "string", required: true, enum: ["commit","branch","tag"] },
  { key: "activate", option: "--activate <activate>", name: "activate", description: "Automatically activate the deployment when it is finished building.", type: "boolean", required: false },
];
apps
  .command(`create-template-deployment`)
  .description(`Create a new App deployment from a template in the App Templates catalogue.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .option(`--owner <owner>`, `The name of the owner of the template.`)
  .option(`--reference <reference>`, `Reference value, can be a commit hash, branch name, or release tag`)
  .option(`--repository <repository>`, `Repository name of the template.`)
  .option(`--root-directory <root-directory>`, `Path to function code in the template repo.`)
  .option(`--type <type>`, `Type for the reference provided. Can be commit, branch, or tag`)
  .option(
    `--activate [value]`,
    `Automatically activate the deployment when it is finished building.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, owner, reference, repository, rootDirectory, type, activate } = await promptForMissing(
          _options,
          createTemplateDeploymentSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/deployments/template`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (activate !== undefined) {
          _payload[`activate`] = activate;
        }
        if (owner !== undefined) {
          _payload[`owner`] = owner;
        }
        if (reference !== undefined) {
          _payload[`reference`] = reference;
        }
        if (repository !== undefined) {
          _payload[`repository`] = repository;
        }
        if (rootDirectory !== undefined) {
          _payload[`rootDirectory`] = rootDirectory;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
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
registerPromptSpecs(apps.commands.at(-1)!, createTemplateDeploymentSpecs, { method: "post" });
const createVcsDeploymentSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "reference", option: "--reference <reference>", name: "reference", description: "VCS reference to create deployment from. Depending on type this can be: branch name, commit hash", type: "string", required: true },
  { key: "type", option: "--type <type>", name: "type", description: "Type of reference passed. Allowed values are: branch, commit", type: "string", required: true, enum: ["branch","commit"] },
  { key: "activate", option: "--activate <activate>", name: "activate", description: "Automatically activate the deployment when it is finished building.", type: "boolean", required: false },
];
apps
  .command(`create-vcs-deployment`)
  .description(`Trigger a new deployment from the App's connected Git repository.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .option(`--reference <reference>`, `VCS reference to create deployment from. Depending on type this can be: branch name, commit hash`)
  .option(`--type <type>`, `Type of reference passed. Allowed values are: branch, commit`)
  .option(
    `--activate [value]`,
    `Automatically activate the deployment when it is finished building.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, reference, type, activate } = await promptForMissing(
          _options,
          createVcsDeploymentSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/deployments/vcs`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (activate !== undefined) {
          _payload[`activate`] = activate;
        }
        if (reference !== undefined) {
          _payload[`reference`] = reference;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
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
registerPromptSpecs(apps.commands.at(-1)!, createVcsDeploymentSpecs, { method: "post" });
const deleteDeploymentSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "deploymentId", option: "--deployment-id <deployment-id>", name: "deploymentId", description: "Deployment ID.", type: "string", required: true, resource: { listPath: "/apps/{functionId}/deployments", hasLimit: false, search: true } },
];
apps
  .command(`delete-deployment`)
  .description(`Delete a deployment. The active deployment cannot be deleted while it is active — switch first via the deployment-update endpoint.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .option(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, deploymentId } = await promptForMissing(
          _options,
          deleteDeploymentSpecs,
          _command,
        );
        await confirmDestructive(`apps delete-deployment`);
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/deployments/{deploymentId}`.replace(`{functionId}`, functionId).replace(`{deploymentId}`, deploymentId);
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
registerPromptSpecs(apps.commands.at(-1)!, deleteDeploymentSpecs, { method: "delete", destructive: true });
const getDeploymentSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "deploymentId", option: "--deployment-id <deployment-id>", name: "deploymentId", description: "Deployment ID.", type: "string", required: true, resource: { listPath: "/apps/{functionId}/deployments", hasLimit: false, search: true } },
];
apps
  .command(`get-deployment`)
  .description(`Get a deployment by its unique ID.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .option(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, deploymentId } = await promptForMissing(
          _options,
          getDeploymentSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/deployments/{deploymentId}`.replace(`{functionId}`, functionId).replace(`{deploymentId}`, deploymentId);
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
registerPromptSpecs(apps.commands.at(-1)!, getDeploymentSpecs, { method: "get" });
const getDeploymentDownloadSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "deploymentId", option: "--deployment-id <deployment-id>", name: "deploymentId", description: "Deployment ID.", type: "string", required: true, resource: { listPath: "/apps/{functionId}/deployments", hasLimit: false, search: true } },
  { key: "type", option: "--type <type>", name: "type", description: "Deployment file to download. Can be: \"source\", \"output\".", type: "string", required: false, enum: ["source","output"] },
];
apps
  .command(`get-deployment-download`)
  .description(`Get a redirect URL to download the source archive of an App deployment. Useful for re-running a build locally or auditing what was deployed.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .option(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .option(`--type <type>`, `Deployment file to download. Can be: "source", "output".`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, deploymentId, type } = await promptForMissing(
          _options,
          getDeploymentDownloadSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/deployments/{deploymentId}/download`.replace(`{functionId}`, functionId).replace(`{deploymentId}`, deploymentId);
        const _payload: RequestParams = {};
        if (type !== undefined) {
          _payload[`type`] = type;
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
registerPromptSpecs(apps.commands.at(-1)!, getDeploymentDownloadSpecs, { method: "get" });
const updateDeploymentStatusSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "deploymentId", option: "--deployment-id <deployment-id>", name: "deploymentId", description: "Deployment ID.", type: "string", required: true, resource: { listPath: "/apps/{functionId}/deployments", hasLimit: false, search: true } },
];
apps
  .command(`update-deployment-status`)
  .description(`Cancel an in-progress deployment build. Used by the Cockpit "Cancel build" affordance.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .option(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, deploymentId } = await promptForMissing(
          _options,
          updateDeploymentStatusSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/deployments/{deploymentId}/status`.replace(`{functionId}`, functionId).replace(`{deploymentId}`, deploymentId);
        const _payload: RequestParams = {};
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(apps.commands.at(-1)!, updateDeploymentStatusSpecs, { method: "patch" });
const listExecutionsSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: trigger, status, responseStatusCode, duration, requestMethod, requestPath, deploymentId", type: "array", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
apps
  .command(`list-executions`)
  .description(`List the execution history of an App.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: trigger, status, responseStatusCode, duration, requestMethod, requestPath, deploymentId`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, queries, total, filter } = await promptForMissing(
          _options,
          listExecutionsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/executions`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
registerPromptSpecs(apps.commands.at(-1)!, listExecutionsSpecs, { method: "get" });
const createExecutionSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "async", option: "--async <async>", name: "async", description: "Execute code in the background. Default value is false.", type: "boolean", required: false },
  { key: "body", option: "--body <body>", name: "body", description: "HTTP body of execution. Default value is empty string.", type: "string", required: false },
  { key: "headers", option: "--headers <headers>", name: "headers", description: "HTTP headers of execution. Defaults to empty.", type: "object", required: false },
  { key: "method", option: "--method <method>", name: "method", description: "HTTP method of execution. Default value is POST.", type: "string", required: false, enum: ["GET","POST","PUT","PATCH","DELETE","OPTIONS","HEAD"] },
  { key: "path", option: "--path <path>", name: "path", description: "HTTP path of execution. Path can include query params. Default value is /", type: "string", required: false },
  { key: "scheduledAt", option: "--scheduled-at <scheduled-at>", name: "scheduledAt", description: "Scheduled execution time in [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format. DateTime value must be in future with precision in minutes.", type: "string", required: false },
];
apps
  .command(`create-execution`)
  .description(`Trigger an App execution. Use the optional \`body\`, \`path\`, \`method\` and \`headers\` parameters to invoke the App as if from an HTTP request.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .option(
    `--async [value]`,
    `Execute code in the background. Default value is false.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--body <body>`, `HTTP body of execution. Default value is empty string.`)
  .option(`--headers <headers>`, `HTTP headers of execution. Defaults to empty.`)
  .option(`--method <method>`, `HTTP method of execution. Default value is POST.`)
  .option(`--path <path>`, `HTTP path of execution. Path can include query params. Default value is /`)
  .option(`--scheduled-at <scheduled-at>`, `Scheduled execution time in [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format. DateTime value must be in future with precision in minutes.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, async, body, headers, method, path, scheduledAt } = await promptForMissing(
          _options,
          createExecutionSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/executions`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (async !== undefined) {
          _payload[`async`] = async;
        }
        if (body !== undefined) {
          _payload[`body`] = body;
        }
        if (headers !== undefined) {
          _payload[`headers`] = resolveBodyParam(headers);
        }
        if (method !== undefined) {
          _payload[`method`] = method;
        }
        if (path !== undefined) {
          _payload[`path`] = path;
        }
        if (scheduledAt !== undefined) {
          _payload[`scheduledAt`] = scheduledAt;
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
registerPromptSpecs(apps.commands.at(-1)!, createExecutionSpecs, { method: "post" });
const deleteExecutionSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "executionId", option: "--execution-id <execution-id>", name: "executionId", description: "Execution ID.", type: "string", required: true, resource: { listPath: "/apps/{functionId}/executions", hasLimit: false } },
];
apps
  .command(`delete-execution`)
  .description(`Delete an App execution by its unique ID.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .option(`--execution-id <execution-id>`, `Execution ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, executionId } = await promptForMissing(
          _options,
          deleteExecutionSpecs,
          _command,
        );
        await confirmDestructive(`apps delete-execution`);
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/executions/{executionId}`.replace(`{functionId}`, functionId).replace(`{executionId}`, executionId);
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
registerPromptSpecs(apps.commands.at(-1)!, deleteExecutionSpecs, { method: "delete", destructive: true });
const getExecutionSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "executionId", option: "--execution-id <execution-id>", name: "executionId", description: "Execution ID.", type: "string", required: true, resource: { listPath: "/apps/{functionId}/executions", hasLimit: false } },
];
apps
  .command(`get-execution`)
  .description(`Get an App execution by its unique ID.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .option(`--execution-id <execution-id>`, `Execution ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, executionId } = await promptForMissing(
          _options,
          getExecutionSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/executions/{executionId}`.replace(`{functionId}`, functionId).replace(`{executionId}`, executionId);
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
registerPromptSpecs(apps.commands.at(-1)!, getExecutionSpecs, { method: "get" });
const getMarketplaceStatusSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "App ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
];
apps
  .command(`get-marketplace-status`)
  .description(`Read-through view of the App's App Registry row — visibility + Marketplace publish flag. Used by Cockpit to render the Publish/Unpublish button correctly on cold load.`)
  .option(`--function-id <function-id>`, `App ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId } = await promptForMissing(
          _options,
          getMarketplaceStatusSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/marketplace-status`.replace(`{functionId}`, functionId);
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
registerPromptSpecs(apps.commands.at(-1)!, getMarketplaceStatusSpecs, { method: "get" });
const unpublishSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "App ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
];
apps
  .command(`unpublish`)
  .description(`Remove this App from the Marketplace listing. Existing tenant installations are unaffected. Idempotent.`)
  .option(`--function-id <function-id>`, `App ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId } = await promptForMissing(
          _options,
          unpublishSpecs,
          _command,
        );
        await confirmDestructive(`apps unpublish`);
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/publish`.replace(`{functionId}`, functionId);
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
registerPromptSpecs(apps.commands.at(-1)!, unpublishSpecs, { method: "delete", destructive: true });
const publishSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "App ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
];
apps
  .command(`publish`)
  .description(`Publish this App to the Marketplace. The App must have at
least one \`ready\` deployment with a registered manifest,
and its visibility (derived from \`billing.json\`) must be
\`public\` or \`included\`. Idempotent.`)
  .option(`--function-id <function-id>`, `App ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId } = await promptForMissing(
          _options,
          publishSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/publish`.replace(`{functionId}`, functionId);
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
registerPromptSpecs(apps.commands.at(-1)!, publishSpecs, { method: "post" });
const getUsageSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "range", option: "--range <range>", name: "range", description: "Date range.", type: "string", required: false, enum: ["24h","30d","90d"] },
];
apps
  .command(`get-usage`)
  .description(`Get usage stats for a single App over the requested time range.`)
  .option(`--function-id <function-id>`, `Function ID.`)
  .option(`--range <range>`, `Date range.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, range } = await promptForMissing(
          _options,
          getUsageSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/usage`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
        if (range !== undefined) {
          _payload[`range`] = range;
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
registerPromptSpecs(apps.commands.at(-1)!, getUsageSpecs, { method: "get" });
const listVariablesSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function unique ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
apps
  .command(`list-variables`)
  .description(`List all environment variables defined for the App.`)
  .option(`--function-id <function-id>`, `Function unique ID.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, filter } = await promptForMissing(
          _options,
          listVariablesSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/variables`.replace(`{functionId}`, functionId);
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
registerPromptSpecs(apps.commands.at(-1)!, listVariablesSpecs, { method: "get" });
const createVariableSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function unique ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "key", option: "--key <key>", name: "key", description: "Variable key. Max length: 255 chars.", type: "string", required: true },
  { key: "value", option: "--value <value>", name: "value", description: "Variable value. Max length: 8192 chars.", type: "string", required: true },
  { key: "secret", option: "--secret <secret>", name: "secret", description: "Secret variables can be updated or deleted, but only functions can read them during build and runtime.", type: "boolean", required: false },
];
apps
  .command(`create-variable`)
  .description(`Create a new App environment variable. These are passed into the App at runtime as \`process.env.*\`.`)
  .option(`--function-id <function-id>`, `Function unique ID.`)
  .option(`--key <key>`, `Variable key. Max length: 255 chars.`)
  .option(`--value <value>`, `Variable value. Max length: 8192 chars.`)
  .option(
    `--secret [value]`,
    `Secret variables can be updated or deleted, but only functions can read them during build and runtime.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, key, value, secret } = await promptForMissing(
          _options,
          createVariableSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/variables`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (key !== undefined) {
          _payload[`key`] = key;
        }
        if (secret !== undefined) {
          _payload[`secret`] = secret;
        }
        if (value !== undefined) {
          _payload[`value`] = value;
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
registerPromptSpecs(apps.commands.at(-1)!, createVariableSpecs, { method: "post" });
const deleteVariableSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function unique ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "variableId", option: "--variable-id <variable-id>", name: "variableId", description: "Variable unique ID.", type: "string", required: true, resource: { listPath: "/apps/{functionId}/variables", hasLimit: false } },
];
apps
  .command(`delete-variable`)
  .description(`Delete an App environment variable.`)
  .option(`--function-id <function-id>`, `Function unique ID.`)
  .option(`--variable-id <variable-id>`, `Variable unique ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, variableId } = await promptForMissing(
          _options,
          deleteVariableSpecs,
          _command,
        );
        await confirmDestructive(`apps delete-variable`);
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/variables/{variableId}`.replace(`{functionId}`, functionId).replace(`{variableId}`, variableId);
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
registerPromptSpecs(apps.commands.at(-1)!, deleteVariableSpecs, { method: "delete", destructive: true });
const getVariableSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function unique ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "variableId", option: "--variable-id <variable-id>", name: "variableId", description: "Variable unique ID.", type: "string", required: true, resource: { listPath: "/apps/{functionId}/variables", hasLimit: false } },
];
apps
  .command(`get-variable`)
  .description(`Get an App variable by its unique ID.`)
  .option(`--function-id <function-id>`, `Function unique ID.`)
  .option(`--variable-id <variable-id>`, `Variable unique ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, variableId } = await promptForMissing(
          _options,
          getVariableSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/variables/{variableId}`.replace(`{functionId}`, functionId).replace(`{variableId}`, variableId);
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
registerPromptSpecs(apps.commands.at(-1)!, getVariableSpecs, { method: "get" });
const updateVariableSpecs: PromptSpec[] = [
  { key: "functionId", option: "--function-id <function-id>", name: "functionId", description: "Function unique ID.", type: "string", required: true, resource: { listPath: "/apps", hasLimit: false, search: true } },
  { key: "variableId", option: "--variable-id <variable-id>", name: "variableId", description: "Variable unique ID.", type: "string", required: true, resource: { listPath: "/apps/{functionId}/variables", hasLimit: false } },
  { key: "key", option: "--key <key>", name: "key", description: "Variable key. Max length: 255 chars.", type: "string", required: true },
  { key: "secret", option: "--secret <secret>", name: "secret", description: "Secret variables can be updated or deleted, but only functions can read them during build and runtime.", type: "boolean", required: false },
  { key: "value", option: "--value <value>", name: "value", description: "Variable value. Max length: 8192 chars.", type: "string", required: false },
];
apps
  .command(`update-variable`)
  .description(`Update an App environment variable.`)
  .option(`--function-id <function-id>`, `Function unique ID.`)
  .option(`--variable-id <variable-id>`, `Variable unique ID.`)
  .option(`--key <key>`, `Variable key. Max length: 255 chars.`)
  .option(
    `--secret [value]`,
    `Secret variables can be updated or deleted, but only functions can read them during build and runtime.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--value <value>`, `Variable value. Max length: 8192 chars.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { functionId, variableId, key, secret, value } = await promptForMissing(
          _options,
          updateVariableSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/variables/{variableId}`.replace(`{functionId}`, functionId).replace(`{variableId}`, variableId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (key !== undefined) {
          _payload[`key`] = key;
        }
        if (secret !== undefined) {
          _payload[`secret`] = secret;
        }
        if (value !== undefined) {
          _payload[`value`] = value;
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
registerPromptSpecs(apps.commands.at(-1)!, updateVariableSpecs, { method: "put" });
