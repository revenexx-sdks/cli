import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseBool,
  parseInteger,
} from "../../parser.js";

export const apps = new Command("apps")
  .description(commandDescriptions["apps"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

apps
  .command(`apps-list`)
  .description(`List all Apps in the active project. Pass \`search\` to filter by name.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: name, enabled, runtime, deploymentId, schedule, scheduleNext, schedulePrevious, timeout, entrypoint, commands, installationId`)
  .option(`--search <search>`, `Search term to filter your list results. Max length: 256 chars.`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ queries, search, total }) => {
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
apps
  .command(`apps-create`)
  .description(`Create a new revenexx App. An App is the deployment surface for code that runs on the platform — backend jobs, APIs, integrations. The created App owns subsequent deployments and executions.

Phase 1 mirrors the underlying Functions runtime 1:1; future phases will add manifest validation, registry coupling and schema migrations.`)
  .requiredOption(`--function-id <function-id>`, `Function ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
  .requiredOption(`--name <name>`, `Function name. Max length: 128 chars.`)
  .requiredOption(`--runtime <runtime>`, `Execution runtime.`)
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
      async ({ functionId, name, runtime, commands, enabled, entrypoint, events, execute, installationId, logging, providerBranch, providerRepositoryId, providerRootDirectory, providerSilentMode, schedule, scopes, specification, timeout }) => {
        const _client = await sdkForProject();
        const _apiPath = `/apps`;
        const _payload: RequestParams = {};
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
apps
  .command(`apps-list-marketplace`)
  .description(`List apps published to the Marketplace. Proxies the App Registry on Console with \`?published=true\` filter.`)
  .option(`--search <search>`, `Search by app name, title or vendor.`)
  .option(`--per-_page <per-_page>`, `Items per page.`, parseInteger)
  .option(`--page <page>`, `Page number.`, parseInteger)
  .action(
    actionRunner(
      async ({ search, per_page, page }) => {
        const _client = await sdkForProject();
        const _apiPath = `/apps/marketplace`;
        const _payload: RequestParams = {};
        if (search !== undefined) {
          _payload[`search`] = search;
        }
        if (per_page !== undefined) {
          _payload[`per_page`] = per_page;
        }
        if (page !== undefined) {
          _payload[`page`] = page;
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
apps
  .command(`apps-install-from-marketplace`)
  .description(`Install a Marketplace app on the calling project's tenant. Body: { owner, name }.`)
  .requiredOption(`--name <name>`, `App name.`)
  .requiredOption(`--owner <owner>`, `Owner tenant slug of the app being installed.`)
  .action(
    actionRunner(
      async ({ name, owner }) => {
        const _client = await sdkForProject();
        const _apiPath = `/apps/marketplace/install`;
        const _payload: RequestParams = {};
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
apps
  .command(`apps-list-runtimes`)
  .description(`Get a list of all runtimes available for an App. Identical content to \`functions.listRuntimes()\`.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/apps/runtimes`;
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
apps
  .command(`apps-list-specifications`)
  .description(`List the compute specifications (CPU + memory) available to Apps in this project.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/apps/specifications`;
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
apps
  .command(`apps-list-templates`)
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
  .action(
    actionRunner(
      async ({ runtimes, useCases, limit, offset, total }) => {
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
apps
  .command(`apps-get-template`)
  .description(`Get a single App template by its ID.`)
  .requiredOption(`--template-id <template-id>`, `Template ID.`)
  .action(
    actionRunner(
      async ({ templateId }) => {
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
apps
  .command(`apps-list-usage`)
  .description(`Get aggregated usage stats across all Apps in the project for the requested time range.`)
  .option(`--range <range>`, `Date range.`)
  .action(
    actionRunner(
      async ({ range }) => {
        const _client = await sdkForProject();
        const _apiPath = `/apps/usage`;
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
apps
  .command(`apps-delete`)
  .description(`Delete an App and all of its deployments. Cascades to the App Registry — Console removes the matching \`RegisteredApp\` row.`)
  .requiredOption(`--function-id <function-id>`, `App ID.`)
  .action(
    actionRunner(
      async ({ functionId }) => {
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
apps
  .command(`apps-get`)
  .description(`Get an App by its unique ID.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
  .action(
    actionRunner(
      async ({ functionId }) => {
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
apps
  .command(`apps-update`)
  .description(`Update an App. Use this endpoint to rename, change runtime, schedule, environment variables and other configuration.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
  .requiredOption(`--name <name>`, `Function name. Max length: 128 chars.`)
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
      async ({ functionId, name, commands, enabled, entrypoint, events, execute, installationId, logging, providerBranch, providerRepositoryId, providerRootDirectory, providerSilentMode, runtime, schedule, scopes, specification, timeout }) => {
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
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
apps
  .command(`apps-update-deployment`)
  .description(`Set the active deployment for an App. The chosen deployment must already be \`ready\`.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
  .requiredOption(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async ({ functionId, deploymentId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/deployment`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
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
apps
  .command(`apps-list-deployments`)
  .description(`List the deployment history of an App.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: buildSize, sourceSize, totalSize, buildDuration, status, activate, type`)
  .option(`--search <search>`, `Search term to filter your list results. Max length: 256 chars.`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ functionId, queries, search, total }) => {
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
apps
  .command(`apps-create-deployment`)
  .description(`Upload a new code deployment for an App. Accepts a \`.tar.gz\`
archive containing the App source. Phase 2 will extract the
manifest from this archive and validate it against the App
Registry before kicking off the build.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
  .requiredOption(`--activate <activate>`, `Automatically activate the deployment when it is finished building.`, parseBool)
  .requiredOption(`--code <code>`, `Gzip file with your code package. When used with the Appwrite CLI, pass the path to your code directory, and the CLI will automatically package your code. Use a path that is within the current directory.`)
  .option(`--commands <commands>`, `Build Commands.`)
  .option(`--entrypoint <entrypoint>`, `Entrypoint File.`)
  .action(
    actionRunner(
      async ({ functionId, activate, code, commands, entrypoint }) => {
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/deployments`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
        if (activate !== undefined) {
          _payload[`activate`] = activate;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
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
apps
  .command(`apps-create-duplicate-deployment`)
  .description(`Re-deploy an existing build under a new deployment ID. Useful for promoting a known-good preview build to production without rebuilding.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
  .requiredOption(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .option(`--build-id <build-id>`, `Build unique ID.`)
  .action(
    actionRunner(
      async ({ functionId, deploymentId, buildId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/deployments/duplicate`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
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
apps
  .command(`apps-create-template-deployment`)
  .description(`Create a new App deployment from a template in the App Templates catalogue.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
  .requiredOption(`--owner <owner>`, `The name of the owner of the template.`)
  .requiredOption(`--reference <reference>`, `Reference value, can be a commit hash, branch name, or release tag`)
  .requiredOption(`--repository <repository>`, `Repository name of the template.`)
  .requiredOption(`--root-directory <root-directory>`, `Path to function code in the template repo.`)
  .requiredOption(`--type <type>`, `Type for the reference provided. Can be commit, branch, or tag`)
  .option(
    `--activate [value]`,
    `Automatically activate the deployment when it is finished building.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ functionId, owner, reference, repository, rootDirectory, type, activate }) => {
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/deployments/template`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
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
apps
  .command(`apps-create-vcs-deployment`)
  .description(`Trigger a new deployment from the App's connected Git repository.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
  .requiredOption(`--reference <reference>`, `VCS reference to create deployment from. Depending on type this can be: branch name, commit hash`)
  .requiredOption(`--type <type>`, `Type of reference passed. Allowed values are: branch, commit`)
  .option(
    `--activate [value]`,
    `Automatically activate the deployment when it is finished building.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ functionId, reference, type, activate }) => {
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/deployments/vcs`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
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
apps
  .command(`apps-delete-deployment`)
  .description(`Delete a deployment. The active deployment cannot be deleted while it is active — switch first via the deployment-update endpoint.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
  .requiredOption(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async ({ functionId, deploymentId }) => {
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
apps
  .command(`apps-get-deployment`)
  .description(`Get a deployment by its unique ID.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
  .requiredOption(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async ({ functionId, deploymentId }) => {
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
apps
  .command(`apps-get-deployment-download`)
  .description(`Get a redirect URL to download the source archive of an App deployment. Useful for re-running a build locally or auditing what was deployed.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
  .requiredOption(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .option(`--type <type>`, `Deployment file to download. Can be: "source", "output".`)
  .action(
    actionRunner(
      async ({ functionId, deploymentId, type }) => {
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
apps
  .command(`apps-update-deployment-status`)
  .description(`Cancel an in-progress deployment build. Used by the Cockpit "Cancel build" affordance.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
  .requiredOption(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async ({ functionId, deploymentId }) => {
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
apps
  .command(`apps-list-executions`)
  .description(`List the execution history of an App.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: trigger, status, responseStatusCode, duration, requestMethod, requestPath, deploymentId`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ functionId, queries, total }) => {
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/executions`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
apps
  .command(`apps-create-execution`)
  .description(`Trigger an App execution. Use the optional \`body\`, \`path\`, \`method\` and \`headers\` parameters to invoke the App as if from an HTTP request.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
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
      async ({ functionId, async, body, headers, method, path, scheduledAt }) => {
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/executions`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
        if (async !== undefined) {
          _payload[`async`] = async;
        }
        if (body !== undefined) {
          _payload[`body`] = body;
        }
        if (headers !== undefined) {
          _payload[`headers`] = JSON.parse(headers);
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
apps
  .command(`apps-delete-execution`)
  .description(`Delete an App execution by its unique ID.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
  .requiredOption(`--execution-id <execution-id>`, `Execution ID.`)
  .action(
    actionRunner(
      async ({ functionId, executionId }) => {
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
apps
  .command(`apps-get-execution`)
  .description(`Get an App execution by its unique ID.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
  .requiredOption(`--execution-id <execution-id>`, `Execution ID.`)
  .action(
    actionRunner(
      async ({ functionId, executionId }) => {
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
apps
  .command(`apps-get-marketplace-status`)
  .description(`Read-through view of the App's App Registry row — visibility + Marketplace publish flag. Used by Cockpit to render the Publish/Unpublish button correctly on cold load.`)
  .requiredOption(`--function-id <function-id>`, `App ID.`)
  .action(
    actionRunner(
      async ({ functionId }) => {
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
apps
  .command(`apps-unpublish`)
  .description(`Remove this App from the Marketplace listing. Existing tenant installations are unaffected. Idempotent.`)
  .requiredOption(`--function-id <function-id>`, `App ID.`)
  .action(
    actionRunner(
      async ({ functionId }) => {
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
apps
  .command(`apps-publish`)
  .description(`Publish this App to the Marketplace. The App must have at
least one \`ready\` deployment with a registered manifest,
and its visibility (derived from \`billing.json\`) must be
\`public\` or \`included\`. Idempotent.`)
  .requiredOption(`--function-id <function-id>`, `App ID.`)
  .action(
    actionRunner(
      async ({ functionId }) => {
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
apps
  .command(`apps-get-usage`)
  .description(`Get usage stats for a single App over the requested time range.`)
  .requiredOption(`--function-id <function-id>`, `Function ID.`)
  .option(`--range <range>`, `Date range.`)
  .action(
    actionRunner(
      async ({ functionId, range }) => {
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
apps
  .command(`apps-list-variables`)
  .description(`List all environment variables defined for the App.`)
  .requiredOption(`--function-id <function-id>`, `Function unique ID.`)
  .action(
    actionRunner(
      async ({ functionId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/variables`.replace(`{functionId}`, functionId);
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
apps
  .command(`apps-create-variable`)
  .description(`Create a new App environment variable. These are passed into the App at runtime as \`process.env.*\`.`)
  .requiredOption(`--function-id <function-id>`, `Function unique ID.`)
  .requiredOption(`--key <key>`, `Variable key. Max length: 255 chars.`)
  .requiredOption(`--value <value>`, `Variable value. Max length: 8192 chars.`)
  .option(
    `--secret [value]`,
    `Secret variables can be updated or deleted, but only functions can read them during build and runtime.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ functionId, key, value, secret }) => {
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/variables`.replace(`{functionId}`, functionId);
        const _payload: RequestParams = {};
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
apps
  .command(`apps-delete-variable`)
  .description(`Delete an App environment variable.`)
  .requiredOption(`--function-id <function-id>`, `Function unique ID.`)
  .requiredOption(`--variable-id <variable-id>`, `Variable unique ID.`)
  .action(
    actionRunner(
      async ({ functionId, variableId }) => {
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
apps
  .command(`apps-get-variable`)
  .description(`Get an App variable by its unique ID.`)
  .requiredOption(`--function-id <function-id>`, `Function unique ID.`)
  .requiredOption(`--variable-id <variable-id>`, `Variable unique ID.`)
  .action(
    actionRunner(
      async ({ functionId, variableId }) => {
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
apps
  .command(`apps-update-variable`)
  .description(`Update an App environment variable.`)
  .requiredOption(`--function-id <function-id>`, `Function unique ID.`)
  .requiredOption(`--variable-id <variable-id>`, `Variable unique ID.`)
  .requiredOption(`--key <key>`, `Variable key. Max length: 255 chars.`)
  .option(
    `--secret [value]`,
    `Secret variables can be updated or deleted, but only functions can read them during build and runtime.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--value <value>`, `Variable value. Max length: 8192 chars.`)
  .action(
    actionRunner(
      async ({ functionId, variableId, key, secret, value }) => {
        const _client = await sdkForProject();
        const _apiPath = `/apps/{functionId}/variables/{variableId}`.replace(`{functionId}`, functionId).replace(`{variableId}`, variableId);
        const _payload: RequestParams = {};
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
