import { Command } from "commander";
import { resolveFileParam } from "../utils/deployment.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseBool,
  parseInteger,
} from "../../parser.js";
import {
  confirmDestructive,
  promptForMissing,
} from "../../interactive.js";

export const sites = new Command("sites")
  .description(
    commandDescriptions["sites"] ??
      `Static sites and their deployments.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

sites
  .command(`list`)
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
  .command(`create`)
  .description(`Create a new site.`)
  .option(`--build-runtime <build-runtime>`, `Runtime to use during build step.`)
  .option(`--framework <framework>`, `Sites framework.`)
  .option(`--name <name>`, `Site name. Max length: 128 chars.`)
  .option(`--site-id <site-id>`, `Site ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
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
      async (_options, _command) => {
        const { buildRuntime, framework, name, siteId, adapter, buildCommand, enabled, fallbackFile, installCommand, installationId, logging, outputDirectory, providerBranch, providerRepositoryId, providerRootDirectory, providerSilentMode, specification, timeout } = await promptForMissing(
          _options,
          [
            { key: "buildRuntime", option: "--build-runtime <build-runtime>", name: "buildRuntime", description: "Runtime to use during build step.", type: "string", required: true, enum: ["node-18.0","node-20.0","node-22","node-23","node-24","node-25","php-8.1","php-8.2","php-8.3","php-8.4","ruby-3.1","ruby-3.2","ruby-3.3","ruby-3.4","ruby-4.0","python-3.9","python-3.10","python-3.11","python-3.12","python-3.13","python-3.14","python-ml-3.11","python-ml-3.12","python-ml-3.13","deno-1.46","deno-2.0","deno-2.5","deno-2.6","dart-2.18","dart-2.19","dart-3.0","dart-3.1","dart-3.3","dart-3.5","dart-3.8","dart-3.9","dart-3.10","dotnet-8.0","dotnet-10","java-8.0","java-11.0","java-17.0","java-21.0","java-22","java-25","swift-5.8","swift-5.9","swift-5.10","swift-6.2","kotlin-1.8","kotlin-1.9","kotlin-2.0","kotlin-2.3","cpp-17","cpp-20","cpp-23","bun-1.0","bun-1.1","bun-1.2","bun-1.3","go-1.23","go-1.24","go-1.25","go-1.26","static-1","flutter-3.24","flutter-3.27","flutter-3.29","flutter-3.32","flutter-3.35","flutter-3.38"] },
            { key: "framework", option: "--framework <framework>", name: "framework", description: "Sites framework.", type: "string", required: true, enum: ["analog","angular","nextjs","react","nuxt","vue","sveltekit","astro","tanstack-start","remix","lynx","flutter","react-native","vite","other"] },
            { key: "name", option: "--name <name>", name: "name", description: "Site name. Max length: 128 chars.", type: "string", required: true },
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID. Choose a custom ID or generate a random ID with `ID.unique()`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.", type: "string", required: true },
          ],
          _command,
        );
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
  .command(`list-frameworks`)
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
  .command(`list-specifications`)
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
  .command(`delete`)
  .description(`Delete a site by its unique ID.`)
  .option(`--site-id <site-id>`, `Site ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
          ],
          _command,
        );
        await confirmDestructive(`sites delete`);
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
  .command(`get`)
  .description(`Get a site by its unique ID.`)
  .option(`--site-id <site-id>`, `Site ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
          ],
          _command,
        );
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
  .command(`update`)
  .description(`Update site by its unique ID.`)
  .option(`--site-id <site-id>`, `Site ID.`)
  .option(`--framework <framework>`, `Sites framework.`)
  .option(`--name <name>`, `Site name. Max length: 128 chars.`)
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
      async (_options, _command) => {
        const { siteId, framework, name, adapter, buildCommand, buildRuntime, enabled, fallbackFile, installCommand, installationId, logging, outputDirectory, providerBranch, providerRepositoryId, providerRootDirectory, providerSilentMode, specification, timeout } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
            { key: "framework", option: "--framework <framework>", name: "framework", description: "Sites framework.", type: "string", required: true, enum: ["analog","angular","nextjs","react","nuxt","vue","sveltekit","astro","tanstack-start","remix","lynx","flutter","react-native","vite","other"] },
            { key: "name", option: "--name <name>", name: "name", description: "Site name. Max length: 128 chars.", type: "string", required: true },
          ],
          _command,
        );
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
  .command(`update-site-deployment`)
  .description(`Update the site active deployment. Use this endpoint to switch the code deployment that should be used when visitor opens your site.`)
  .option(`--site-id <site-id>`, `Site ID.`)
  .option(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId, deploymentId } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
            { key: "deploymentId", option: "--deployment-id <deployment-id>", name: "deploymentId", description: "Deployment ID.", type: "string", required: true },
          ],
          _command,
        );
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
  .command(`list-deployments`)
  .description(`Get a list of all the site's code deployments. You can use the query params to filter your results.`)
  .option(`--site-id <site-id>`, `Site ID.`)
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
      async (_options, _command) => {
        const { siteId, queries, search, total } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
          ],
          _command,
        );
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
  .command(`create-deployment`)
  .description(`Create a new site code deployment. Use this endpoint to upload a new version of your site code. To activate your newly uploaded code, you'll need to update the site's deployment to use your new deployment ID.`)
  .option(`--site-id <site-id>`, `Site ID.`)
  .option(`--activate <activate>`, `Automatically activate the deployment when it is finished building.`, parseBool)
  .option(`--code <code>`, `Gzip file with your code package. When used with the Appwrite CLI, pass the path to your code directory, and the CLI will automatically package your code. Use a path that is within the current directory.`)
  .option(`--build-command <build-command>`, `Build Commands.`)
  .option(`--install-command <install-command>`, `Install Commands.`)
  .option(`--output-directory <output-directory>`, `Output Directory.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId, activate, code, buildCommand, installCommand, outputDirectory } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
            { key: "activate", option: "--activate <activate>", name: "activate", description: "Automatically activate the deployment when it is finished building.", type: "boolean", required: true },
            { key: "code", option: "--code <code>", name: "code", description: "Gzip file with your code package. When used with the Appwrite CLI, pass the path to your code directory, and the CLI will automatically package your code. Use a path that is within the current directory.", type: "file", required: true },
          ],
          _command,
        );
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
          _payload[`code`] = code !== undefined ? await resolveFileParam(code) : undefined;
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
  .command(`create-duplicate-deployment`)
  .description(`Create a new build for an existing site deployment. This endpoint allows you to rebuild a deployment with the updated site configuration, including its commands and output directory if they have been modified. The build process will be queued and executed asynchronously. The original deployment's code will be preserved and used for the new build.`)
  .option(`--site-id <site-id>`, `Site ID.`)
  .option(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId, deploymentId } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
            { key: "deploymentId", option: "--deployment-id <deployment-id>", name: "deploymentId", description: "Deployment ID.", type: "string", required: true },
          ],
          _command,
        );
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
  .command(`create-template-deployment`)
  .description(`Create a deployment based on a template.

Use this endpoint with combination of [listTemplates](https://appwrite.io/docs/products/sites/templates) to find the template details.`)
  .option(`--site-id <site-id>`, `Site ID.`)
  .option(`--owner <owner>`, `The name of the owner of the template.`)
  .option(`--reference <reference>`, `Reference value, can be a commit hash, branch name, or release tag`)
  .option(`--repository <repository>`, `Repository name of the template.`)
  .option(`--root-directory <root-directory>`, `Path to site code in the template repo.`)
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
        const { siteId, owner, reference, repository, rootDirectory, type, activate } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
            { key: "owner", option: "--owner <owner>", name: "owner", description: "The name of the owner of the template.", type: "string", required: true },
            { key: "reference", option: "--reference <reference>", name: "reference", description: "Reference value, can be a commit hash, branch name, or release tag", type: "string", required: true },
            { key: "repository", option: "--repository <repository>", name: "repository", description: "Repository name of the template.", type: "string", required: true },
            { key: "rootDirectory", option: "--root-directory <root-directory>", name: "rootDirectory", description: "Path to site code in the template repo.", type: "string", required: true },
            { key: "type", option: "--type <type>", name: "type", description: "Type for the reference provided. Can be commit, branch, or tag", type: "string", required: true, enum: ["branch","commit","tag"] },
          ],
          _command,
        );
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
  .command(`create-vcs-deployment`)
  .description(`Create a deployment when a site is connected to VCS.

This endpoint lets you create deployment from a branch, commit, or a tag.`)
  .option(`--site-id <site-id>`, `Site ID.`)
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
        const { siteId, reference, type, activate } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
            { key: "reference", option: "--reference <reference>", name: "reference", description: "VCS reference to create deployment from. Depending on type this can be: branch name, commit hash", type: "string", required: true },
            { key: "type", option: "--type <type>", name: "type", description: "Type of reference passed. Allowed values are: branch, commit", type: "string", required: true, enum: ["branch","commit","tag"] },
          ],
          _command,
        );
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
  .command(`delete-deployment`)
  .description(`Delete a site deployment by its unique ID.`)
  .option(`--site-id <site-id>`, `Site ID.`)
  .option(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId, deploymentId } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
            { key: "deploymentId", option: "--deployment-id <deployment-id>", name: "deploymentId", description: "Deployment ID.", type: "string", required: true, resource: { listPath: "/sites/{siteId}/deployments", hasLimit: false } },
          ],
          _command,
        );
        await confirmDestructive(`sites delete-deployment`);
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
  .command(`get-deployment`)
  .description(`Get a site deployment by its unique ID.`)
  .option(`--site-id <site-id>`, `Site ID.`)
  .option(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId, deploymentId } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
            { key: "deploymentId", option: "--deployment-id <deployment-id>", name: "deploymentId", description: "Deployment ID.", type: "string", required: true, resource: { listPath: "/sites/{siteId}/deployments", hasLimit: false } },
          ],
          _command,
        );
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
  .command(`get-deployment-download`)
  .description(`Get a site deployment content by its unique ID. The endpoint response return with a 'Content-Disposition: attachment' header that tells the browser to start downloading the file to user downloads directory.`)
  .option(`--site-id <site-id>`, `Site ID.`)
  .option(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .option(`--type <type>`, `Deployment file to download. Can be: "source", "output".`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId, deploymentId, type } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
            { key: "deploymentId", option: "--deployment-id <deployment-id>", name: "deploymentId", description: "Deployment ID.", type: "string", required: true, resource: { listPath: "/sites/{siteId}/deployments", hasLimit: false } },
          ],
          _command,
        );
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
  .command(`update-deployment-status`)
  .description(`Cancel an ongoing site deployment build. If the build is already in progress, it will be stopped and marked as canceled. If the build hasn't started yet, it will be marked as canceled without executing. You cannot cancel builds that have already completed (status 'ready') or failed. The response includes the final build status and details.`)
  .option(`--site-id <site-id>`, `Site ID.`)
  .option(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId, deploymentId } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
            { key: "deploymentId", option: "--deployment-id <deployment-id>", name: "deploymentId", description: "Deployment ID.", type: "string", required: true, resource: { listPath: "/sites/{siteId}/deployments", hasLimit: false } },
          ],
          _command,
        );
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
  .command(`list-logs`)
  .description(`Get a list of all site logs. You can use the query params to filter your results.`)
  .option(`--site-id <site-id>`, `Site ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: trigger, status, responseStatusCode, duration, requestMethod, requestPath, deploymentId`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId, queries, total } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
          ],
          _command,
        );
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
  .command(`delete-log`)
  .description(`Delete a site log by its unique ID.`)
  .option(`--site-id <site-id>`, `Site ID.`)
  .option(`--log-id <log-id>`, `Log ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId, logId } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
            { key: "logId", option: "--log-id <log-id>", name: "logId", description: "Log ID.", type: "string", required: true, resource: { listPath: "/sites/{siteId}/logs", hasLimit: false } },
          ],
          _command,
        );
        await confirmDestructive(`sites delete-log`);
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
  .command(`get-log`)
  .description(`Get a site request log by its unique ID.`)
  .option(`--site-id <site-id>`, `Site ID.`)
  .option(`--log-id <log-id>`, `Log ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId, logId } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
            { key: "logId", option: "--log-id <log-id>", name: "logId", description: "Log ID.", type: "string", required: true, resource: { listPath: "/sites/{siteId}/logs", hasLimit: false } },
          ],
          _command,
        );
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
  .command(`list-variables`)
  .description(`Get a list of all variables of a specific site.`)
  .option(`--site-id <site-id>`, `Site unique ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site unique ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
          ],
          _command,
        );
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
  .command(`create-variable`)
  .description(`Create a new site variable. These variables can be accessed during build and runtime (server-side rendering) as environment variables.`)
  .option(`--site-id <site-id>`, `Site unique ID.`)
  .option(`--key <key>`, `Variable key. Max length: 255 chars.`)
  .option(`--value <value>`, `Variable value. Max length: 8192 chars.`)
  .option(
    `--secret [value]`,
    `Secret variables can be updated or deleted, but only sites can read them during build and runtime.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId, key, value, secret } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site unique ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
            { key: "key", option: "--key <key>", name: "key", description: "Variable key. Max length: 255 chars.", type: "string", required: true },
            { key: "value", option: "--value <value>", name: "value", description: "Variable value. Max length: 8192 chars.", type: "string", required: true },
          ],
          _command,
        );
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
  .command(`delete-variable`)
  .description(`Delete a variable by its unique ID.`)
  .option(`--site-id <site-id>`, `Site unique ID.`)
  .option(`--variable-id <variable-id>`, `Variable unique ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId, variableId } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site unique ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
            { key: "variableId", option: "--variable-id <variable-id>", name: "variableId", description: "Variable unique ID.", type: "string", required: true, resource: { listPath: "/sites/{siteId}/variables", hasLimit: false } },
          ],
          _command,
        );
        await confirmDestructive(`sites delete-variable`);
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
  .command(`get-variable`)
  .description(`Get a variable by its unique ID.`)
  .option(`--site-id <site-id>`, `Site unique ID.`)
  .option(`--variable-id <variable-id>`, `Variable unique ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId, variableId } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site unique ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
            { key: "variableId", option: "--variable-id <variable-id>", name: "variableId", description: "Variable unique ID.", type: "string", required: true, resource: { listPath: "/sites/{siteId}/variables", hasLimit: false } },
          ],
          _command,
        );
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
  .command(`update-variable`)
  .description(`Update variable by its unique ID.`)
  .option(`--site-id <site-id>`, `Site unique ID.`)
  .option(`--variable-id <variable-id>`, `Variable unique ID.`)
  .option(`--key <key>`, `Variable key. Max length: 255 chars.`)
  .option(
    `--secret [value]`,
    `Secret variables can be updated or deleted, but only sites can read them during build and runtime.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--value <value>`, `Variable value. Max length: 8192 chars.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { siteId, variableId, key, secret, value } = await promptForMissing(
          _options,
          [
            { key: "siteId", option: "--site-id <site-id>", name: "siteId", description: "Site unique ID.", type: "string", required: true, resource: { listPath: "/sites", hasLimit: false } },
            { key: "variableId", option: "--variable-id <variable-id>", name: "variableId", description: "Variable unique ID.", type: "string", required: true, resource: { listPath: "/sites/{siteId}/variables", hasLimit: false } },
            { key: "key", option: "--key <key>", name: "key", description: "Variable key. Max length: 255 chars.", type: "string", required: true },
          ],
          _command,
        );
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
