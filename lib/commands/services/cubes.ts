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
} from "../../parser.js";
import {
  confirmDestructive,
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const cubes = new Command("cubes")
  .description(
    commandDescriptions["cubes"] ??
      `Analytics Cubes and their deployments. A deployment builds the Cube and submits it as a release for review; it does not run anything.`,
  )
  .configureHelp({
    ...hiddenAliasHelp,
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Result filters, paging and ordering. Repeat the parameter once per query — `?queries=…&queries=…` — and make each value a JSON object, e.g. `{\"method\":\"limit\",\"values\":[25]}`. The bracketed spellings `queries[]=` and `queries[0]=` are accepted too; the `limit(25)` call syntax is not. See “Query parameters” in this document's introduction. Filterable attributes, besides `$id`, `$createdAt`, `$updatedAt` and `$sequence`: name, enabled, deploymentId, installationId", type: "array", required: false },
  { key: "search", option: "--search <search>", name: "search", description: "Search term to filter your list results. Max length: 256 chars.", type: "string", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
cubes
  .command(`list`)
  .description(`Get a list of all the project's Cubes. You can use the query params to filter your results.`)
  .option(`--queries [queries...]`, `Result filters, paging and ordering. Repeat the parameter once per query — \`?queries=…&queries=…\` — and make each value a JSON object, e.g. \`{"method":"limit","values":[25]}\`. The bracketed spellings \`queries[]=\` and \`queries[0]=\` are accepted too; the \`limit(25)\` call syntax is not. See “Query parameters” in this document's introduction. Filterable attributes, besides \`\$id\`, \`\$createdAt\`, \`\$updatedAt\` and \`\$sequence\`: name, enabled, deploymentId, installationId`)
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
        const _apiPath = `/cubes`;
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
registerPromptSpecs(cubes.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "cubeId", option: "--cube-id <cube-id>", name: "cubeId", description: "Cube ID. Choose a custom ID or generate a random ID with `ID.unique()`.", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "Cube name. Max length: 128 chars.", type: "string", required: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Is Cube enabled?", type: "boolean", required: false },
  { key: "installationId", option: "--installation-id <installation-id>", name: "installationId", description: "Installation ID of the platform's VCS (Version Control System) integration to deploy from.", type: "string", required: false },
  { key: "logging", option: "--logging <logging>", name: "logging", description: "When disabled, build logs and errors are excluded.", type: "boolean", required: false },
  { key: "providerBranch", option: "--provider-branch <provider-branch>", name: "providerBranch", description: "Production branch for the repo linked to the Cube.", type: "string", required: false },
  { key: "providerRepositoryId", option: "--provider-repository-id <provider-repository-id>", name: "providerRepositoryId", description: "Repository ID of the repo linked to the Cube.", type: "string", required: false },
  { key: "providerRootDirectory", option: "--provider-root-directory <provider-root-directory>", name: "providerRootDirectory", description: "Path to the Cube in the linked repo.", type: "string", required: false },
  { key: "providerSilentMode", option: "--provider-silent-mode <provider-silent-mode>", name: "providerSilentMode", description: "In silent mode, no comments are made on commits and pull requests.", type: "boolean", required: false },
  { key: "vcsTriggerMode", option: "--vcs-trigger-mode <vcs-trigger-mode>", name: "vcsTriggerMode", description: "Controls when a VCS deployment is triggered. \"push\" deploys on every branch push, \"tag\" deploys only when a tag is pushed or a GitHub release is published.", type: "string", required: false, enum: ["push","tag"] },
];
cubes
  .command(`create`)
  .description(`Create a new Cube.`)
  .option(`--cube-id <cube-id>`, `Cube ID. Choose a custom ID or generate a random ID with \`ID.unique()\`.`)
  .option(`--name <name>`, `Cube name. Max length: 128 chars.`)
  .option(
    `--enabled [value]`,
    `Is Cube enabled?`,
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
  .option(`--provider-branch <provider-branch>`, `Production branch for the repo linked to the Cube.`)
  .option(`--provider-repository-id <provider-repository-id>`, `Repository ID of the repo linked to the Cube.`)
  .option(`--provider-root-directory <provider-root-directory>`, `Path to the Cube in the linked repo.`)
  .option(
    `--provider-silent-mode [value]`,
    `In silent mode, no comments are made on commits and pull requests.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--vcs-trigger-mode <vcs-trigger-mode>`, `Controls when a VCS deployment is triggered. "push" deploys on every branch push, "tag" deploys only when a tag is pushed or a GitHub release is published.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cubeId, name, enabled, installationId, logging, providerBranch, providerRepositoryId, providerRootDirectory, providerSilentMode, vcsTriggerMode } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cubes`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (cubeId !== undefined) {
          _payload[`cubeId`] = cubeId;
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
registerPromptSpecs(cubes.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "cubeId", option: "--cube-id <cube-id>", name: "cubeId", description: "Cube ID.", type: "string", required: true, resource: { listPath: "/cubes", hasLimit: false, search: true } },
];
cubes
  .command(`delete`)
  .description(`Delete a Cube by its unique ID.`)
  .option(`--cube-id <cube-id>`, `Cube ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cubeId } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`cubes delete`);
        const _client = await sdkForProject();
        const _apiPath = `/cubes/{cubeId}`.replace(`{cubeId}`, cubeId);
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
registerPromptSpecs(cubes.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "cubeId", option: "--cube-id <cube-id>", name: "cubeId", description: "Cube ID.", type: "string", required: true, resource: { listPath: "/cubes", hasLimit: false, search: true } },
];
cubes
  .command(`get`)
  .description(`Get a Cube by its unique ID.`)
  .option(`--cube-id <cube-id>`, `Cube ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cubeId } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cubes/{cubeId}`.replace(`{cubeId}`, cubeId);
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
registerPromptSpecs(cubes.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "cubeId", option: "--cube-id <cube-id>", name: "cubeId", description: "Cube ID.", type: "string", required: true, resource: { listPath: "/cubes", hasLimit: false, search: true } },
  { key: "name", option: "--name <name>", name: "name", description: "Cube name. Max length: 128 chars.", type: "string", required: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Is Cube enabled?", type: "boolean", required: false },
  { key: "installationId", option: "--installation-id <installation-id>", name: "installationId", description: "Installation ID of the platform's VCS (Version Control System) integration to deploy from.", type: "string", required: false },
  { key: "logging", option: "--logging <logging>", name: "logging", description: "When disabled, build logs and errors are excluded.", type: "boolean", required: false },
  { key: "providerBranch", option: "--provider-branch <provider-branch>", name: "providerBranch", description: "Production branch for the repo linked to the Cube.", type: "string", required: false },
  { key: "providerRepositoryId", option: "--provider-repository-id <provider-repository-id>", name: "providerRepositoryId", description: "Repository ID of the repo linked to the Cube.", type: "string", required: false },
  { key: "providerRootDirectory", option: "--provider-root-directory <provider-root-directory>", name: "providerRootDirectory", description: "Path to the Cube in the linked repo.", type: "string", required: false },
  { key: "providerSilentMode", option: "--provider-silent-mode <provider-silent-mode>", name: "providerSilentMode", description: "In silent mode, no comments are made on commits and pull requests.", type: "boolean", required: false },
  { key: "vcsTriggerMode", option: "--vcs-trigger-mode <vcs-trigger-mode>", name: "vcsTriggerMode", description: "Controls when a VCS deployment is triggered. \"push\" deploys on every branch push, \"tag\" deploys only when a tag is pushed or a GitHub release is published.", type: "string", required: false, enum: ["push","tag"] },
];
cubes
  .command(`update`)
  .description(`Update a Cube by its unique ID.`)
  .option(`--cube-id <cube-id>`, `Cube ID.`)
  .option(`--name <name>`, `Cube name. Max length: 128 chars.`)
  .option(
    `--enabled [value]`,
    `Is Cube enabled?`,
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
  .option(`--provider-branch <provider-branch>`, `Production branch for the repo linked to the Cube.`)
  .option(`--provider-repository-id <provider-repository-id>`, `Repository ID of the repo linked to the Cube.`)
  .option(`--provider-root-directory <provider-root-directory>`, `Path to the Cube in the linked repo.`)
  .option(
    `--provider-silent-mode [value]`,
    `In silent mode, no comments are made on commits and pull requests.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--vcs-trigger-mode <vcs-trigger-mode>`, `Controls when a VCS deployment is triggered. "push" deploys on every branch push, "tag" deploys only when a tag is pushed or a GitHub release is published.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cubeId, name, enabled, installationId, logging, providerBranch, providerRepositoryId, providerRootDirectory, providerSilentMode, vcsTriggerMode } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cubes/{cubeId}`.replace(`{cubeId}`, cubeId);
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
registerPromptSpecs(cubes.commands.at(-1)!, updateSpecs, { method: "put" });
const listDeploymentsSpecs: PromptSpec[] = [
  { key: "cubeId", option: "--cube-id <cube-id>", name: "cubeId", description: "Cube ID.", type: "string", required: true, resource: { listPath: "/cubes", hasLimit: false, search: true } },
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Result filters, paging and ordering. Repeat the parameter once per query — `?queries=…&queries=…` — and make each value a JSON object, e.g. `{\"method\":\"limit\",\"values\":[25]}`. The bracketed spellings `queries[]=` and `queries[0]=` are accepted too; the `limit(25)` call syntax is not. See “Query parameters” in this document's introduction. Filterable attributes, besides `$id`, `$createdAt`, `$updatedAt` and `$sequence`: buildSize, sourceSize, totalSize, buildDuration, status, activate, type", type: "array", required: false },
  { key: "search", option: "--search <search>", name: "search", description: "Search term to filter your list results. Max length: 256 chars.", type: "string", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
cubes
  .command(`list-deployments`)
  .description(`Get a list of all the Cube's code deployments. You can use the query params to filter your results.`)
  .option(`--cube-id <cube-id>`, `Cube ID.`)
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
        const { cubeId, queries, search, total, filter } = await promptForMissing(
          _options,
          listDeploymentsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cubes/{cubeId}/deployments`.replace(`{cubeId}`, cubeId);
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
registerPromptSpecs(cubes.commands.at(-1)!, listDeploymentsSpecs, { method: "get" });
const createDeploymentSpecs: PromptSpec[] = [
  { key: "cubeId", option: "--cube-id <cube-id>", name: "cubeId", description: "Cube ID.", type: "string", required: true, resource: { listPath: "/cubes", hasLimit: false, search: true } },
  { key: "code", option: "--code <code>", name: "code", description: "The Cube directory packaged as a gzipped tar archive (`.tar.gz`) with `cube.json` at its root, sent as the file part of the multipart request.", type: "file", required: true },
  { key: "activate", option: "--activate <activate>", name: "activate", description: "Automatically activate the deployment when it is finished building.", type: "boolean", required: false },
];
cubes
  .command(`create-deployment`)
  .description(`Create a new Cube deployment from a gzipped tar archive of the Cube directory. The build bundles the Cube and submits it as a release for review. The deployment ends \`ready\` once the release is submitted, or \`failed\` when it is rejected, with one line per problem in \`buildLogs\`. The review itself is not reported through this API.`)
  .option(`--cube-id <cube-id>`, `Cube ID.`)
  .option(`--code <code>`, `The Cube directory packaged as a gzipped tar archive (\`.tar.gz\`) with \`cube.json\` at its root, sent as the file part of the multipart request.`)
  .option(
    `--activate [value]`,
    `Automatically activate the deployment when it is finished building.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cubeId, code, activate } = await promptForMissing(
          _options,
          createDeploymentSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cubes/{cubeId}/deployments`.replace(`{cubeId}`, cubeId);
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
registerPromptSpecs(cubes.commands.at(-1)!, createDeploymentSpecs, { method: "post" });
const createVcsDeploymentSpecs: PromptSpec[] = [
  { key: "cubeId", option: "--cube-id <cube-id>", name: "cubeId", description: "Cube ID.", type: "string", required: true, resource: { listPath: "/cubes", hasLimit: false, search: true } },
  { key: "reference", option: "--reference <reference>", name: "reference", description: "VCS reference to create deployment from. Depending on type this can be: branch name, commit hash, tag name", type: "string", required: true },
  { key: "type", option: "--type <type>", name: "type", description: "Type of reference passed. Allowed values are: branch, commit, tag", type: "string", required: true, enum: ["branch","commit","tag"] },
  { key: "activate", option: "--activate <activate>", name: "activate", description: "Automatically activate the deployment when it is finished building.", type: "boolean", required: false },
];
cubes
  .command(`create-vcs-deployment`)
  .description(`Create a deployment when a Cube is connected to VCS.

This endpoint lets you create a deployment from a branch or commit.`)
  .option(`--cube-id <cube-id>`, `Cube ID.`)
  .option(`--reference <reference>`, `VCS reference to create deployment from. Depending on type this can be: branch name, commit hash, tag name`)
  .option(`--type <type>`, `Type of reference passed. Allowed values are: branch, commit, tag`)
  .option(
    `--activate [value]`,
    `Automatically activate the deployment when it is finished building.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cubeId, reference, type, activate } = await promptForMissing(
          _options,
          createVcsDeploymentSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cubes/{cubeId}/deployments/vcs`.replace(`{cubeId}`, cubeId);
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
registerPromptSpecs(cubes.commands.at(-1)!, createVcsDeploymentSpecs, { method: "post" });
const getDeploymentSpecs: PromptSpec[] = [
  { key: "cubeId", option: "--cube-id <cube-id>", name: "cubeId", description: "Cube ID.", type: "string", required: true, resource: { listPath: "/cubes", hasLimit: false, search: true } },
  { key: "deploymentId", option: "--deployment-id <deployment-id>", name: "deploymentId", description: "Deployment ID.", type: "string", required: true, resource: { listPath: "/cubes/{cubeId}/deployments", hasLimit: false, search: true } },
];
cubes
  .command(`get-deployment`)
  .description(`Get a Cube deployment by its unique ID.`)
  .option(`--cube-id <cube-id>`, `Cube ID.`)
  .option(`--deployment-id <deployment-id>`, `Deployment ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cubeId, deploymentId } = await promptForMissing(
          _options,
          getDeploymentSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cubes/{cubeId}/deployments/{deploymentId}`.replace(`{cubeId}`, cubeId).replace(`{deploymentId}`, deploymentId);
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
registerPromptSpecs(cubes.commands.at(-1)!, getDeploymentSpecs, { method: "get" });
