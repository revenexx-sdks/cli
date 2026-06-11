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

export const sites = new Command("sites")
  .description(commandDescriptions["sites"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

sites
  .command(`sites-list`)
  .description(`Get a list of all the project's sites. You can use the query params to filter your results.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: name, enabled, framework, deploymentId, buildCommand, installCommand, outputDirectory, installationId`)
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
        const _apiPath = `/sites`;
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
sites
  .command(`sites-create`)
  .description(`Create a new site.`)
  .requiredOption(`--build-runtime <build-runtime>`, `Runtime to use during build step.`)
  .requiredOption(`--framework <framework>`, `Sites framework.`)
  .requiredOption(`--name <name>`, `Site name. Max length: 128 chars.`)
  .requiredOption(`--site-id <site-id>`, `Site ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
  .option(`--adapter <adapter>`, `Framework adapter defining rendering strategy. Allowed values are: static, ssr`)
  .option(`--build-command <build-command>`, `Build Command.`)
  .option(
    `--enabled [value]`,
    `Is site enabled? When set to 'disabled', users cannot access the site but Server SDKs with and API key can still access the site. No data is lost when this is toggled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--fallback-file <fallback-file>`, `Fallback file for single page application sites.`)
  .option(`--install-command <install-command>`, `Install Command.`)
  .option(`--installation-id <installation-id>`, `Appwrite Installation ID for VCS (Version Control System) deployment.`)
  .option(
    `--logging [value]`,
    `When disabled, request logs will exclude logs and errors, and site responses will be slightly faster.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--output-directory <output-directory>`, `Output Directory for site.`)
  .option(`--provider-branch <provider-branch>`, `Production branch for the repo linked to the site.`)
  .option(`--provider-repository-id <provider-repository-id>`, `Repository ID of the repo linked to the site.`)
  .option(`--provider-root-directory <provider-root-directory>`, `Path to site code in the linked repo.`)
  .option(
    `--provider-silent-mode [value]`,
    `Is the VCS (Version Control System) connection in silent mode for the repo linked to the site? In silent mode, comments will not be made on commits and pull requests.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--specification <specification>`, `Framework specification for the site and builds.`)
  .option(`--timeout <timeout>`, `Maximum request time in seconds.`, parseInteger)
  .action(
    actionRunner(
      async ({ buildRuntime, framework, name, siteId, adapter, buildCommand, enabled, fallbackFile, installCommand, installationId, logging, outputDirectory, providerBranch, providerRepositoryId, providerRootDirectory, providerSilentMode, specification, timeout }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites`;
        const _payload: RequestParams = {};
        if (adapter !== undefined) {
          _payload[`adapter`] = adapter;
        }
        if (buildCommand !== undefined) {
          _payload[`buildCommand`] = buildCommand;
        }
        if (buildRuntime !== undefined) {
          _payload[`buildRuntime`] = buildRuntime;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (fallbackFile !== undefined) {
          _payload[`fallbackFile`] = fallbackFile;
        }
        if (framework !== undefined) {
          _payload[`framework`] = framework;
        }
        if (installCommand !== undefined) {
          _payload[`installCommand`] = installCommand;
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
        if (outputDirectory !== undefined) {
          _payload[`outputDirectory`] = outputDirectory;
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
        if (siteId !== undefined) {
          _payload[`siteId`] = siteId;
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
sites
  .command(`sites-list-frameworks`)
  .description(`Get a list of all frameworks that are currently available on the server instance.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/frameworks`;
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
sites
  .command(`sites-list-specifications`)
  .description(`List allowed site specifications for this instance.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/specifications`;
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
sites
  .command(`sites-delete`)
  .description(`Delete a site by its unique ID.`)
  .requiredOption(`--site-id <site-id>`, `Site ID.`)
  .action(
    actionRunner(
      async ({ siteId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}`.replace(`{siteId}`, siteId);
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
sites
  .command(`sites-get`)
  .description(`Get a site by its unique ID.`)
  .requiredOption(`--site-id <site-id>`, `Site ID.`)
  .action(
    actionRunner(
      async ({ siteId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}`.replace(`{siteId}`, siteId);
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
sites
  .command(`sites-update`)
  .description(`Update site by its unique ID.`)
  .requiredOption(`--site-id <site-id>`, `Site ID.`)
  .requiredOption(`--framework <framework>`, `Sites framework.`)
  .requiredOption(`--name <name>`, `Site name. Max length: 128 chars.`)
  .option(`--adapter <adapter>`, `Framework adapter defining rendering strategy. Allowed values are: static, ssr`)
  .option(`--build-command <build-command>`, `Build Command.`)
  .option(`--build-runtime <build-runtime>`, `Runtime to use during build step.`)
  .option(
    `--enabled [value]`,
    `Is site enabled? When set to 'disabled', users cannot access the site but Server SDKs with and API key can still access the site. No data is lost when this is toggled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--fallback-file <fallback-file>`, `Fallback file for single page application sites.`)
  .option(`--install-command <install-command>`, `Install Command.`)
  .option(`--installation-id <installation-id>`, `Appwrite Installation ID for VCS (Version Control System) deployment.`)
  .option(
    `--logging [value]`,
    `When disabled, request logs will exclude logs and errors, and site responses will be slightly faster.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--output-directory <output-directory>`, `Output Directory for site.`)
  .option(`--provider-branch <provider-branch>`, `Production branch for the repo linked to the site.`)
  .option(`--provider-repository-id <provider-repository-id>`, `Repository ID of the repo linked to the site.`)
  .option(`--provider-root-directory <provider-root-directory>`, `Path to site code in the linked repo.`)
  .option(
    `--provider-silent-mode [value]`,
    `Is the VCS (Version Control System) connection in silent mode for the repo linked to the site? In silent mode, comments will not be made on commits and pull requests.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--specification <specification>`, `Framework specification for the site and builds.`)
  .option(`--timeout <timeout>`, `Maximum request time in seconds.`, parseInteger)
  .action(
    actionRunner(
      async ({ siteId, framework, name, adapter, buildCommand, buildRuntime, enabled, fallbackFile, installCommand, installationId, logging, outputDirectory, providerBranch, providerRepositoryId, providerRootDirectory, providerSilentMode, specification, timeout }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}`.replace(`{siteId}`, siteId);
        const _payload: RequestParams = {};
        if (adapter !== undefined) {
          _payload[`adapter`] = adapter;
        }
        if (buildCommand !== undefined) {
          _payload[`buildCommand`] = buildCommand;
        }
        if (buildRuntime !== undefined) {
          _payload[`buildRuntime`] = buildRuntime;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (fallbackFile !== undefined) {
          _payload[`fallbackFile`] = fallbackFile;
        }
        if (framework !== undefined) {
          _payload[`framework`] = framework;
        }
        if (installCommand !== undefined) {
          _payload[`installCommand`] = installCommand;
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
        if (outputDirectory !== undefined) {
          _payload[`outputDirectory`] = outputDirectory;
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
sites
  .command(`sites-update-site-deployment`)
  .description(`Update the site active deployment. Use this endpoint to switch the code deployment that should be used when visitor opens your site.`)
  .requiredOption(`--site-id <site-id>`, `Site ID.`)
  .requiredOption(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async ({ siteId, deploymentId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/deployment`.replace(`{siteId}`, siteId);
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
sites
  .command(`sites-list-deployments`)
  .description(`Get a list of all the site's code deployments. You can use the query params to filter your results.`)
  .requiredOption(`--site-id <site-id>`, `Site ID.`)
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
      async ({ siteId, queries, search, total }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/deployments`.replace(`{siteId}`, siteId);
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
sites
  .command(`sites-create-deployment`)
  .description(`Create a new site code deployment. Use this endpoint to upload a new version of your site code. To activate your newly uploaded code, you'll need to update the site's deployment to use your new deployment ID.`)
  .requiredOption(`--site-id <site-id>`, `Site ID.`)
  .requiredOption(`--activate <activate>`, `Automatically activate the deployment when it is finished building.`, parseBool)
  .requiredOption(`--code <code>`, `Gzip file with your code package. When used with the Appwrite CLI, pass the path to your code directory, and the CLI will automatically package your code. Use a path that is within the current directory.`)
  .option(`--build-command <build-command>`, `Build Commands.`)
  .option(`--install-command <install-command>`, `Install Commands.`)
  .option(`--output-directory <output-directory>`, `Output Directory.`)
  .action(
    actionRunner(
      async ({ siteId, activate, code, buildCommand, installCommand, outputDirectory }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/deployments`.replace(`{siteId}`, siteId);
        const _payload: RequestParams = {};
        if (activate !== undefined) {
          _payload[`activate`] = activate;
        }
        if (buildCommand !== undefined) {
          _payload[`buildCommand`] = buildCommand;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (installCommand !== undefined) {
          _payload[`installCommand`] = installCommand;
        }
        if (outputDirectory !== undefined) {
          _payload[`outputDirectory`] = outputDirectory;
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
sites
  .command(`sites-create-duplicate-deployment`)
  .description(`Create a new build for an existing site deployment. This endpoint allows you to rebuild a deployment with the updated site configuration, including its commands and output directory if they have been modified. The build process will be queued and executed asynchronously. The original deployment's code will be preserved and used for the new build.`)
  .requiredOption(`--site-id <site-id>`, `Site ID.`)
  .requiredOption(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async ({ siteId, deploymentId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/deployments/duplicate`.replace(`{siteId}`, siteId);
        const _payload: RequestParams = {};
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
sites
  .command(`sites-create-template-deployment`)
  .description(`Create a deployment based on a template.

Use this endpoint with combination of [listTemplates](https://appwrite.io/docs/products/sites/templates) to find the template details.`)
  .requiredOption(`--site-id <site-id>`, `Site ID.`)
  .requiredOption(`--owner <owner>`, `The name of the owner of the template.`)
  .requiredOption(`--reference <reference>`, `Reference value, can be a commit hash, branch name, or release tag`)
  .requiredOption(`--repository <repository>`, `Repository name of the template.`)
  .requiredOption(`--root-directory <root-directory>`, `Path to site code in the template repo.`)
  .requiredOption(`--type <type>`, `Type for the reference provided. Can be commit, branch, or tag`)
  .option(
    `--activate [value]`,
    `Automatically activate the deployment when it is finished building.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ siteId, owner, reference, repository, rootDirectory, type, activate }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/deployments/template`.replace(`{siteId}`, siteId);
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
sites
  .command(`sites-create-vcs-deployment`)
  .description(`Create a deployment when a site is connected to VCS.

This endpoint lets you create deployment from a branch, commit, or a tag.`)
  .requiredOption(`--site-id <site-id>`, `Site ID.`)
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
      async ({ siteId, reference, type, activate }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/deployments/vcs`.replace(`{siteId}`, siteId);
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
sites
  .command(`sites-delete-deployment`)
  .description(`Delete a site deployment by its unique ID.`)
  .requiredOption(`--site-id <site-id>`, `Site ID.`)
  .requiredOption(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async ({ siteId, deploymentId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/deployments/{deploymentId}`.replace(`{siteId}`, siteId).replace(`{deploymentId}`, deploymentId);
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
sites
  .command(`sites-get-deployment`)
  .description(`Get a site deployment by its unique ID.`)
  .requiredOption(`--site-id <site-id>`, `Site ID.`)
  .requiredOption(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async ({ siteId, deploymentId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/deployments/{deploymentId}`.replace(`{siteId}`, siteId).replace(`{deploymentId}`, deploymentId);
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
sites
  .command(`sites-get-deployment-download`)
  .description(`Get a site deployment content by its unique ID. The endpoint response return with a 'Content-Disposition: attachment' header that tells the browser to start downloading the file to user downloads directory.`)
  .requiredOption(`--site-id <site-id>`, `Site ID.`)
  .requiredOption(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .option(`--type <type>`, `Deployment file to download. Can be: "source", "output".`)
  .action(
    actionRunner(
      async ({ siteId, deploymentId, type }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/deployments/{deploymentId}/download`.replace(`{siteId}`, siteId).replace(`{deploymentId}`, deploymentId);
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
sites
  .command(`sites-update-deployment-status`)
  .description(`Cancel an ongoing site deployment build. If the build is already in progress, it will be stopped and marked as canceled. If the build hasn't started yet, it will be marked as canceled without executing. You cannot cancel builds that have already completed (status 'ready') or failed. The response includes the final build status and details.`)
  .requiredOption(`--site-id <site-id>`, `Site ID.`)
  .requiredOption(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async ({ siteId, deploymentId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/deployments/{deploymentId}/status`.replace(`{siteId}`, siteId).replace(`{deploymentId}`, deploymentId);
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
sites
  .command(`sites-list-logs`)
  .description(`Get a list of all site logs. You can use the query params to filter your results.`)
  .requiredOption(`--site-id <site-id>`, `Site ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: trigger, status, responseStatusCode, duration, requestMethod, requestPath, deploymentId`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ siteId, queries, total }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/logs`.replace(`{siteId}`, siteId);
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
sites
  .command(`sites-delete-log`)
  .description(`Delete a site log by its unique ID.`)
  .requiredOption(`--site-id <site-id>`, `Site ID.`)
  .requiredOption(`--log-id <log-id>`, `Log ID.`)
  .action(
    actionRunner(
      async ({ siteId, logId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/logs/{logId}`.replace(`{siteId}`, siteId).replace(`{logId}`, logId);
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
sites
  .command(`sites-get-log`)
  .description(`Get a site request log by its unique ID.`)
  .requiredOption(`--site-id <site-id>`, `Site ID.`)
  .requiredOption(`--log-id <log-id>`, `Log ID.`)
  .action(
    actionRunner(
      async ({ siteId, logId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/logs/{logId}`.replace(`{siteId}`, siteId).replace(`{logId}`, logId);
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
sites
  .command(`sites-list-variables`)
  .description(`Get a list of all variables of a specific site.`)
  .requiredOption(`--site-id <site-id>`, `Site unique ID.`)
  .action(
    actionRunner(
      async ({ siteId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/variables`.replace(`{siteId}`, siteId);
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
sites
  .command(`sites-create-variable`)
  .description(`Create a new site variable. These variables can be accessed during build and runtime (server-side rendering) as environment variables.`)
  .requiredOption(`--site-id <site-id>`, `Site unique ID.`)
  .requiredOption(`--key <key>`, `Variable key. Max length: 255 chars.`)
  .requiredOption(`--value <value>`, `Variable value. Max length: 8192 chars.`)
  .option(
    `--secret [value]`,
    `Secret variables can be updated or deleted, but only sites can read them during build and runtime.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ siteId, key, value, secret }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/variables`.replace(`{siteId}`, siteId);
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
sites
  .command(`sites-delete-variable`)
  .description(`Delete a variable by its unique ID.`)
  .requiredOption(`--site-id <site-id>`, `Site unique ID.`)
  .requiredOption(`--variable-id <variable-id>`, `Variable unique ID.`)
  .action(
    actionRunner(
      async ({ siteId, variableId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/variables/{variableId}`.replace(`{siteId}`, siteId).replace(`{variableId}`, variableId);
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
sites
  .command(`sites-get-variable`)
  .description(`Get a variable by its unique ID.`)
  .requiredOption(`--site-id <site-id>`, `Site unique ID.`)
  .requiredOption(`--variable-id <variable-id>`, `Variable unique ID.`)
  .action(
    actionRunner(
      async ({ siteId, variableId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/variables/{variableId}`.replace(`{siteId}`, siteId).replace(`{variableId}`, variableId);
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
sites
  .command(`sites-update-variable`)
  .description(`Update variable by its unique ID.`)
  .requiredOption(`--site-id <site-id>`, `Site unique ID.`)
  .requiredOption(`--variable-id <variable-id>`, `Variable unique ID.`)
  .requiredOption(`--key <key>`, `Variable key. Max length: 255 chars.`)
  .option(
    `--secret [value]`,
    `Secret variables can be updated or deleted, but only sites can read them during build and runtime.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--value <value>`, `Variable value. Max length: 8192 chars.`)
  .action(
    actionRunner(
      async ({ siteId, variableId, key, secret, value }) => {
        const _client = await sdkForProject();
        const _apiPath = `/sites/{siteId}/variables/{variableId}`.replace(`{siteId}`, siteId).replace(`{variableId}`, variableId);
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
