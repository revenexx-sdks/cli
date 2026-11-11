import { Command } from "commander";
import { hiddenAliasHelp } from "../../legacy-names.js";
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

export const integrations = new Command("integrations")
  .description(
    commandDescriptions["integrations"] ??
      `Integration Studio node packages, their deployments and release rounds. A deployment builds the package and submits it as a release for review; tenants can use a version once its round is approved.`,
  )
  .configureHelp({
    ...hiddenAliasHelp,
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Result filters, paging and ordering. Repeat the parameter once per query — `?queries=…&queries=…` — and make each value a JSON object, e.g. `{\"method\":\"limit\",\"values\":[25]}`. The bracketed spellings `queries[]=` and `queries[0]=` are accepted too; the `limit(25)` call syntax is not. See “Query parameters” in this document's introduction. Filterable attributes, besides `$id`, `$createdAt`, `$updatedAt` and `$sequence`: name, enabled, deploymentId, buildCommand, installCommand, installationId", type: "array", required: false },
  { key: "search", option: "--search <search>", name: "search", description: "Search term to filter your list results. Max length: 256 chars.", type: "string", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
integrations
  .command(`list`)
  .description(`Get a list of all the project's integration node packages. You can use the query params to filter your results.`)
  .option(`--queries [queries...]`, `Result filters, paging and ordering. Repeat the parameter once per query — \`?queries=…&queries=…\` — and make each value a JSON object, e.g. \`{"method":"limit","values":[25]}\`. The bracketed spellings \`queries[]=\` and \`queries[0]=\` are accepted too; the \`limit(25)\` call syntax is not. See “Query parameters” in this document's introduction. Filterable attributes, besides \`\$id\`, \`\$createdAt\`, \`\$updatedAt\` and \`\$sequence\`: name, enabled, deploymentId, buildCommand, installCommand, installationId`)
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
        const _apiPath = `/integrations`;
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
registerPromptSpecs(integrations.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "integrationId", option: "--integration-id <integration-id>", name: "integrationId", description: "Integration ID. Choose a custom ID or generate a random ID with `ID.unique()`.", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "Integration name. Max length: 128 chars.", type: "string", required: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Is integration enabled?", type: "boolean", required: false },
  { key: "installationId", option: "--installation-id <installation-id>", name: "installationId", description: "Installation ID of the platform's VCS (Version Control System) integration to deploy from.", type: "string", required: false },
  { key: "logging", option: "--logging <logging>", name: "logging", description: "When disabled, build logs and errors are excluded.", type: "boolean", required: false },
  { key: "providerBranch", option: "--provider-branch <provider-branch>", name: "providerBranch", description: "Production branch for the repo linked to the integration.", type: "string", required: false },
  { key: "providerRepositoryId", option: "--provider-repository-id <provider-repository-id>", name: "providerRepositoryId", description: "Repository ID of the repo linked to the integration.", type: "string", required: false },
  { key: "providerRootDirectory", option: "--provider-root-directory <provider-root-directory>", name: "providerRootDirectory", description: "Path to the package in the linked repo.", type: "string", required: false },
  { key: "providerSilentMode", option: "--provider-silent-mode <provider-silent-mode>", name: "providerSilentMode", description: "In silent mode, no comments are made on commits and pull requests.", type: "boolean", required: false },
  { key: "vcsPreviewsEnabled", option: "--vcs-previews-enabled <vcs-previews-enabled>", name: "vcsPreviewsEnabled", description: "Whether pull request events create preview deployments and PR comments.", type: "boolean", required: false },
  { key: "vcsTriggerMode", option: "--vcs-trigger-mode <vcs-trigger-mode>", name: "vcsTriggerMode", description: "Controls when a VCS deployment is triggered. \"push\" deploys on every branch push, \"tag\" deploys only when a tag is pushed or a GitHub release is published.", type: "string", required: false, enum: ["push","tag"] },
];
integrations
  .command(`create`)
  .description(`Create a new integration node package.`)
  .option(`--integration-id <integration-id>`, `Integration ID. Choose a custom ID or generate a random ID with \`ID.unique()\`.`)
  .option(`--name <name>`, `Integration name. Max length: 128 chars.`)
  .option(
    `--enabled [value]`,
    `Is integration enabled?`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--installation-id <installation-id>`, `Installation ID of the platform's VCS (Version Control System) integration to deploy from.`)
  .option(
    `--logging [value]`,
    `When disabled, build logs and errors are excluded.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--provider-branch <provider-branch>`, `Production branch for the repo linked to the integration.`)
  .option(`--provider-repository-id <provider-repository-id>`, `Repository ID of the repo linked to the integration.`)
  .option(`--provider-root-directory <provider-root-directory>`, `Path to the package in the linked repo.`)
  .option(
    `--provider-silent-mode [value]`,
    `In silent mode, no comments are made on commits and pull requests.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--vcs-previews-enabled [value]`,
    `Whether pull request events create preview deployments and PR comments.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--vcs-trigger-mode <vcs-trigger-mode>`, `Controls when a VCS deployment is triggered. "push" deploys on every branch push, "tag" deploys only when a tag is pushed or a GitHub release is published.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { integrationId, name, enabled, installationId, logging, providerBranch, providerRepositoryId, providerRootDirectory, providerSilentMode, vcsPreviewsEnabled, vcsTriggerMode } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/integrations`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (installationId !== undefined) {
          _payload[`installationId`] = installationId;
        }
        if (integrationId !== undefined) {
          _payload[`integrationId`] = integrationId;
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
        if (vcsPreviewsEnabled !== undefined) {
          _payload[`vcsPreviewsEnabled`] = vcsPreviewsEnabled;
        }
        if (vcsTriggerMode !== undefined) {
          _payload[`vcsTriggerMode`] = vcsTriggerMode;
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
registerPromptSpecs(integrations.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "integrationId", option: "--integration-id <integration-id>", name: "integrationId", description: "Integration ID.", type: "string", required: true, resource: { listPath: "/integrations", hasLimit: false, search: true } },
];
integrations
  .command(`delete`)
  .description(`Delete an integration by its unique ID.`)
  .option(`--integration-id <integration-id>`, `Integration ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { integrationId } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`integrations delete`);
        const _client = await sdkForProject();
        const _apiPath = `/integrations/{integrationId}`.replace(`{integrationId}`, integrationId);
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
registerPromptSpecs(integrations.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "integrationId", option: "--integration-id <integration-id>", name: "integrationId", description: "Integration ID.", type: "string", required: true, resource: { listPath: "/integrations", hasLimit: false, search: true } },
];
integrations
  .command(`get`)
  .description(`Get an integration by its unique ID.`)
  .option(`--integration-id <integration-id>`, `Integration ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { integrationId } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/integrations/{integrationId}`.replace(`{integrationId}`, integrationId);
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
registerPromptSpecs(integrations.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "integrationId", option: "--integration-id <integration-id>", name: "integrationId", description: "Integration ID.", type: "string", required: true, resource: { listPath: "/integrations", hasLimit: false, search: true } },
  { key: "name", option: "--name <name>", name: "name", description: "Integration name. Max length: 128 chars.", type: "string", required: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Is integration enabled?", type: "boolean", required: false },
  { key: "installationId", option: "--installation-id <installation-id>", name: "installationId", description: "Installation ID of the platform's VCS (Version Control System) integration to deploy from.", type: "string", required: false },
  { key: "logging", option: "--logging <logging>", name: "logging", description: "When disabled, build logs and errors are excluded.", type: "boolean", required: false },
  { key: "providerBranch", option: "--provider-branch <provider-branch>", name: "providerBranch", description: "Production branch for the repo linked to the integration.", type: "string", required: false },
  { key: "providerRepositoryId", option: "--provider-repository-id <provider-repository-id>", name: "providerRepositoryId", description: "Repository ID of the repo linked to the integration.", type: "string", required: false },
  { key: "providerRootDirectory", option: "--provider-root-directory <provider-root-directory>", name: "providerRootDirectory", description: "Path to the package in the linked repo.", type: "string", required: false },
  { key: "providerSilentMode", option: "--provider-silent-mode <provider-silent-mode>", name: "providerSilentMode", description: "In silent mode, no comments are made on commits and pull requests.", type: "boolean", required: false },
  { key: "vcsPreviewsEnabled", option: "--vcs-previews-enabled <vcs-previews-enabled>", name: "vcsPreviewsEnabled", description: "Whether pull request events create preview deployments and PR comments.", type: "boolean", required: false },
  { key: "vcsTriggerMode", option: "--vcs-trigger-mode <vcs-trigger-mode>", name: "vcsTriggerMode", description: "Controls when a VCS deployment is triggered. \"push\" deploys on every branch push, \"tag\" deploys only when a tag is pushed or a GitHub release is published.", type: "string", required: false, enum: ["push","tag"] },
];
integrations
  .command(`update`)
  .description(`Update an integration by its unique ID.`)
  .option(`--integration-id <integration-id>`, `Integration ID.`)
  .option(`--name <name>`, `Integration name. Max length: 128 chars.`)
  .option(
    `--enabled [value]`,
    `Is integration enabled?`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--installation-id <installation-id>`, `Installation ID of the platform's VCS (Version Control System) integration to deploy from.`)
  .option(
    `--logging [value]`,
    `When disabled, build logs and errors are excluded.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--provider-branch <provider-branch>`, `Production branch for the repo linked to the integration.`)
  .option(`--provider-repository-id <provider-repository-id>`, `Repository ID of the repo linked to the integration.`)
  .option(`--provider-root-directory <provider-root-directory>`, `Path to the package in the linked repo.`)
  .option(
    `--provider-silent-mode [value]`,
    `In silent mode, no comments are made on commits and pull requests.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--vcs-previews-enabled [value]`,
    `Whether pull request events create preview deployments and PR comments.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--vcs-trigger-mode <vcs-trigger-mode>`, `Controls when a VCS deployment is triggered. "push" deploys on every branch push, "tag" deploys only when a tag is pushed or a GitHub release is published.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { integrationId, name, enabled, installationId, logging, providerBranch, providerRepositoryId, providerRootDirectory, providerSilentMode, vcsPreviewsEnabled, vcsTriggerMode } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/integrations/{integrationId}`.replace(`{integrationId}`, integrationId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
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
        if (vcsPreviewsEnabled !== undefined) {
          _payload[`vcsPreviewsEnabled`] = vcsPreviewsEnabled;
        }
        if (vcsTriggerMode !== undefined) {
          _payload[`vcsTriggerMode`] = vcsTriggerMode;
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
registerPromptSpecs(integrations.commands.at(-1)!, updateSpecs, { method: "put" });
const listDeploymentsSpecs: PromptSpec[] = [
  { key: "integrationId", option: "--integration-id <integration-id>", name: "integrationId", description: "Integration ID.", type: "string", required: true, resource: { listPath: "/integrations", hasLimit: false, search: true } },
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Result filters, paging and ordering. Repeat the parameter once per query — `?queries=…&queries=…` — and make each value a JSON object, e.g. `{\"method\":\"limit\",\"values\":[25]}`. The bracketed spellings `queries[]=` and `queries[0]=` are accepted too; the `limit(25)` call syntax is not. See “Query parameters” in this document's introduction. Filterable attributes, besides `$id`, `$createdAt`, `$updatedAt` and `$sequence`: buildSize, sourceSize, totalSize, buildDuration, status, activate, type", type: "array", required: false },
  { key: "search", option: "--search <search>", name: "search", description: "Search term to filter your list results. Max length: 256 chars.", type: "string", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
integrations
  .command(`list-deployments`)
  .description(`Get a list of all the integration's code deployments. You can use the query params to filter your results.`)
  .option(`--integration-id <integration-id>`, `Integration ID.`)
  .option(`--queries [queries...]`, `Result filters, paging and ordering. Repeat the parameter once per query — \`?queries=…&queries=…\` — and make each value a JSON object, e.g. \`{"method":"limit","values":[25]}\`. The bracketed spellings \`queries[]=\` and \`queries[0]=\` are accepted too; the \`limit(25)\` call syntax is not. See “Query parameters” in this document's introduction. Filterable attributes, besides \`\$id\`, \`\$createdAt\`, \`\$updatedAt\` and \`\$sequence\`: buildSize, sourceSize, totalSize, buildDuration, status, activate, type`)
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
        const { integrationId, queries, search, total, filter } = await promptForMissing(
          _options,
          listDeploymentsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/integrations/{integrationId}/deployments`.replace(`{integrationId}`, integrationId);
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
registerPromptSpecs(integrations.commands.at(-1)!, listDeploymentsSpecs, { method: "get" });
const createDeploymentSpecs: PromptSpec[] = [
  { key: "integrationId", option: "--integration-id <integration-id>", name: "integrationId", description: "Integration ID.", type: "string", required: true, resource: { listPath: "/integrations", hasLimit: false, search: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Gzip file with the node package directory (package.json at its root). When used with the CLI, pass the path to the package directory, and the CLI will package it.", type: "file", required: true },
  { key: "activate", option: "--activate <activate>", name: "activate", description: "Automatically activate the deployment when it is finished building.", type: "boolean", required: false },
  { key: "releaseMode", option: "--release-mode <release-mode>", name: "releaseMode", description: "Release mode: `deploy` releases the version once its round is approved; `preview` makes it a candidate the vendor accepts after checking it.", type: "string", required: false, enum: ["deploy","preview"] },
];
integrations
  .command(`create-deployment`)
  .description(`Create a new integration deployment from a gzipped tar archive of the node package directory. The build publishes the package and registers the version in the integrations registry as a release round.`)
  .option(`--integration-id <integration-id>`, `Integration ID.`)
  .option(`--code <code>`, `Gzip file with the node package directory (package.json at its root). When used with the CLI, pass the path to the package directory, and the CLI will package it.`)
  .option(
    `--activate [value]`,
    `Automatically activate the deployment when it is finished building.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--release-mode <release-mode>`, `Release mode: \`deploy\` releases the version once its round is approved; \`preview\` makes it a candidate the vendor accepts after checking it.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { integrationId, code, activate, releaseMode } = await promptForMissing(
          _options,
          createDeploymentSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/integrations/{integrationId}/deployments`.replace(`{integrationId}`, integrationId);
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
        if (releaseMode !== undefined) {
          _payload[`releaseMode`] = releaseMode;
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
registerPromptSpecs(integrations.commands.at(-1)!, createDeploymentSpecs, { method: "post" });
const createVcsDeploymentSpecs: PromptSpec[] = [
  { key: "integrationId", option: "--integration-id <integration-id>", name: "integrationId", description: "Integration ID.", type: "string", required: true, resource: { listPath: "/integrations", hasLimit: false, search: true } },
  { key: "reference", option: "--reference <reference>", name: "reference", description: "VCS reference to create deployment from. Depending on type this can be: branch name, commit hash", type: "string", required: true },
  { key: "type", option: "--type <type>", name: "type", description: "Type of reference passed. Allowed values are: branch, commit", type: "string", required: true, enum: ["branch","commit","tag"] },
  { key: "activate", option: "--activate <activate>", name: "activate", description: "Automatically activate the deployment when it is finished building.", type: "boolean", required: false },
];
integrations
  .command(`create-vcs-deployment`)
  .description(`Create a deployment when an integration is connected to VCS.

This endpoint lets you create a deployment from a branch or commit.`)
  .option(`--integration-id <integration-id>`, `Integration ID.`)
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
        const { integrationId, reference, type, activate } = await promptForMissing(
          _options,
          createVcsDeploymentSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/integrations/{integrationId}/deployments/vcs`.replace(`{integrationId}`, integrationId);
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
registerPromptSpecs(integrations.commands.at(-1)!, createVcsDeploymentSpecs, { method: "post" });
const getDeploymentSpecs: PromptSpec[] = [
  { key: "integrationId", option: "--integration-id <integration-id>", name: "integrationId", description: "Integration ID.", type: "string", required: true, resource: { listPath: "/integrations", hasLimit: false, search: true } },
  { key: "deploymentId", option: "--deployment-id <deployment-id>", name: "deploymentId", description: "Deployment ID.", type: "string", required: true, resource: { listPath: "/integrations/{integrationId}/deployments", hasLimit: false, search: true } },
];
integrations
  .command(`get-deployment`)
  .description(`Get an integration deployment by its unique ID.`)
  .option(`--integration-id <integration-id>`, `Integration ID.`)
  .option(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { integrationId, deploymentId } = await promptForMissing(
          _options,
          getDeploymentSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/integrations/{integrationId}/deployments/{deploymentId}`.replace(`{integrationId}`, integrationId).replace(`{deploymentId}`, deploymentId);
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
registerPromptSpecs(integrations.commands.at(-1)!, getDeploymentSpecs, { method: "get" });
const listReleasesSpecs: PromptSpec[] = [
  { key: "integrationId", option: "--integration-id <integration-id>", name: "integrationId", description: "Integration ID.", type: "string", required: true, resource: { listPath: "/integrations", hasLimit: false, search: true } },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
integrations
  .command(`list-releases`)
  .description(`List the release rounds of this integration as the
integrations registry holds them: version, round number,
state (submitted, candidate, approved, rejected), release
mode, gate results, decision deadline and rejection reason.`)
  .option(`--integration-id <integration-id>`, `Integration ID.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { integrationId, filter } = await promptForMissing(
          _options,
          listReleasesSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/integrations/{integrationId}/releases`.replace(`{integrationId}`, integrationId);
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
registerPromptSpecs(integrations.commands.at(-1)!, listReleasesSpecs, { method: "get" });
const acceptReleaseSpecs: PromptSpec[] = [
  { key: "integrationId", option: "--integration-id <integration-id>", name: "integrationId", description: "Integration ID.", type: "string", required: true, resource: { listPath: "/integrations", hasLimit: false, search: true } },
  { key: "rc", option: "--rc <rc>", name: "rc", description: "Release round to accept. Defaults to the newest candidate round of the version.", type: "integer", required: false },
  { key: "integrationsVersion", option: "--integrations-version <integrations-version>", name: "version", description: "Version to accept. Defaults to the version of the latest registered deployment.", type: "string", required: false },
];
integrations
  .command(`accept-release`)
  .description(`Accept a preview candidate of this integration after checking
it. Without \`version\` the version of the latest registered
deployment is accepted; without \`rc\` its newest candidate
round. Only the integration's vendor can accept, and only a
candidate in preview mode.`)
  .option(`--integration-id <integration-id>`, `Integration ID.`)
  .option(`--rc <rc>`, `Release round to accept. Defaults to the newest candidate round of the version.`, parseInteger)
  .option(`--integrations-version <integrations-version>`, `Version to accept. Defaults to the version of the latest registered deployment.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { integrationId, rc, integrationsVersion } = await promptForMissing(
          _options,
          acceptReleaseSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/integrations/{integrationId}/releases/accept`.replace(`{integrationId}`, integrationId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (rc !== undefined) {
          _payload[`rc`] = rc;
        }
        if (integrationsVersion !== undefined) {
          _payload[`version`] = integrationsVersion;
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
registerPromptSpecs(integrations.commands.at(-1)!, acceptReleaseSpecs, { method: "post" });
const rebuildReleaseSpecs: PromptSpec[] = [
  { key: "integrationId", option: "--integration-id <integration-id>", name: "integrationId", description: "Integration ID.", type: "string", required: true, resource: { listPath: "/integrations", hasLimit: false, search: true } },
  { key: "integrationsVersion", option: "--integrations-version <integrations-version>", name: "version", description: "Version to rebuild.", type: "string", required: true },
  { key: "commit", option: "--commit <commit>", name: "commit", description: "Commit SHA the round recorded (7 to 64 hex characters). Optional.", type: "string", required: false },
];
integrations
  .command(`rebuild-release`)
  .description(`Rebuild the source a release of this integration was built
from, so its release gates run again and a new release round
opens. Picks the newest deployment whose manifest names this
version; \`commit\` narrows it to that commit.`)
  .option(`--integration-id <integration-id>`, `Integration ID.`)
  .option(`--integrations-version <integrations-version>`, `Version to rebuild.`)
  .option(`--commit <commit>`, `Commit SHA the round recorded (7 to 64 hex characters). Optional.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { integrationId, integrationsVersion, commit } = await promptForMissing(
          _options,
          rebuildReleaseSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/integrations/{integrationId}/releases/rebuild`.replace(`{integrationId}`, integrationId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (commit !== undefined) {
          _payload[`commit`] = commit;
        }
        if (integrationsVersion !== undefined) {
          _payload[`version`] = integrationsVersion;
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
registerPromptSpecs(integrations.commands.at(-1)!, rebuildReleaseSpecs, { method: "post" });
