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

export const tagManagerContainer = new Command("tag-manager-container")
  .description(
    commandDescriptions["tagManagerContainer"] ??
      `Validating, publishing and rolling back the container — the active marketing tags, triggers and variables, frozen. A container is published only when the consent manager's published policy discloses every vendor it loads under the purpose it is used for, the vendors a tag chains (Google Analytics under Google Tag Manager) included; a refusal is a 409 listing EVERY violation. A published version never changes: it keeps its snapshot, its sha256 and the policy version it was checked against, and a rollback publishes an old snapshot as a new version after the same checks. When the consent manager publishes a new policy, the live containers are re-checked and the result is recorded; nothing is switched off.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const checksListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Only rows whose `id` equals this value.", type: "string", required: false },
  { key: "containerVersionId", option: "--container-version-id <container-version-id>", name: "container_version_id", description: "Only rows whose `container_version_id` equals this value.", type: "string", required: false },
  { key: "containerVersionNumber", option: "--container-version-number <container-version-number>", name: "container_version_number", description: "Only rows whose `container_version_number` equals this value.", type: "integer", required: false },
  { key: "policyVersionNumber", option: "--policy-version-number <policy-version-number>", name: "policy_version_number", description: "Only rows whose `policy_version_number` equals this value.", type: "integer", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Only rows whose `reason` equals this value.", type: "string", required: false },
  { key: "ok", option: "--ok <ok>", name: "ok", description: "Only rows whose `ok` equals this value.", type: "boolean", required: false },
  { key: "checkedAt", option: "--checked-at <checked-at>", name: "checked_at", description: "Only rows whose `checked_at` equals this value.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
tagManagerContainer
  .command(`checks-list`)
  .description(`Every container check of this tenant visible in the requested market, paged. Equality filters on plain columns; jsonb columns are answered but not filterable.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(`--id <id>`, `Only rows whose \`id\` equals this value.`)
  .option(`--container-version-id <container-version-id>`, `Only rows whose \`container_version_id\` equals this value.`)
  .option(`--container-version-number <container-version-number>`, `Only rows whose \`container_version_number\` equals this value.`, parseInteger)
  .option(`--policy-version-number <policy-version-number>`, `Only rows whose \`policy_version_number\` equals this value.`, parseInteger)
  .option(`--reason <reason>`, `Only rows whose \`reason\` equals this value.`)
  .option(
    `--ok [value]`,
    `Only rows whose \`ok\` equals this value.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--checked-at <checked-at>`, `Only rows whose \`checked_at\` equals this value.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, containerVersionId, containerVersionNumber, policyVersionNumber, reason, ok, checkedAt, filter } = await promptForMissing(
          _options,
          checksListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/container-checks`;
        const _payload: RequestParams = {};
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
        }
        if (order !== undefined) {
          _payload[`order`] = order;
        }
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (containerVersionId !== undefined) {
          _payload[`container_version_id`] = containerVersionId;
        }
        if (containerVersionNumber !== undefined) {
          _payload[`container_version_number`] = containerVersionNumber;
        }
        if (policyVersionNumber !== undefined) {
          _payload[`policy_version_number`] = policyVersionNumber;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
        }
        if (ok !== undefined) {
          _payload[`ok`] = ok;
        }
        if (checkedAt !== undefined) {
          _payload[`checked_at`] = checkedAt;
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
registerPromptSpecs(tagManagerContainer.commands.at(-1)!, checksListSpecs, { method: "get" });
const checksGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The id of the container check.", type: "string", required: true, resource: { listPath: "/tag-manager/container-checks", hasLimit: true } },
];
tagManagerContainer
  .command(`checks-get`)
  .description(`One container check by id.`)
  .option(`--id <id>`, `The id of the container check.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          checksGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/container-checks/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(tagManagerContainer.commands.at(-1)!, checksGetSpecs, { method: "get" });
const versionsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Only rows whose `id` equals this value.", type: "string", required: false },
  { key: "number", option: "--number <number>", name: "number", description: "Only rows whose `number` equals this value.", type: "integer", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "Only rows whose `market` equals this value.", type: "string", required: false },
  { key: "sha256", option: "--sha256 <sha256>", name: "sha256", description: "Only rows whose `sha256` equals this value.", type: "string", required: false },
  { key: "policyVersionNumber", option: "--policy-version-number <policy-version-number>", name: "policy_version_number", description: "Only rows whose `policy_version_number` equals this value.", type: "integer", required: false },
  { key: "policySha256", option: "--policy-sha256 <policy-sha256>", name: "policy_sha256", description: "Only rows whose `policy_sha256` equals this value.", type: "string", required: false },
  { key: "rolledBackFrom", option: "--rolled-back-from <rolled-back-from>", name: "rolled_back_from", description: "Only rows whose `rolled_back_from` equals this value.", type: "integer", required: false },
  { key: "note", option: "--note <note>", name: "note", description: "Only rows whose `note` equals this value.", type: "string", required: false },
  { key: "publishedBy", option: "--published-by <published-by>", name: "published_by", description: "Only rows whose `published_by` equals this value.", type: "string", required: false },
  { key: "publishedAt", option: "--published-at <published-at>", name: "published_at", description: "Only rows whose `published_at` equals this value.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
tagManagerContainer
  .command(`versions-list`)
  .description(`Every container version of this tenant visible in the requested market, paged. Equality filters on plain columns; jsonb columns are answered but not filterable.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(`--id <id>`, `Only rows whose \`id\` equals this value.`)
  .option(`--number <number>`, `Only rows whose \`number\` equals this value.`, parseInteger)
  .option(`--market <market>`, `Only rows whose \`market\` equals this value.`)
  .option(`--sha256 <sha256>`, `Only rows whose \`sha256\` equals this value.`)
  .option(`--policy-version-number <policy-version-number>`, `Only rows whose \`policy_version_number\` equals this value.`, parseInteger)
  .option(`--policy-sha256 <policy-sha256>`, `Only rows whose \`policy_sha256\` equals this value.`)
  .option(`--rolled-back-from <rolled-back-from>`, `Only rows whose \`rolled_back_from\` equals this value.`, parseInteger)
  .option(`--note <note>`, `Only rows whose \`note\` equals this value.`)
  .option(`--published-by <published-by>`, `Only rows whose \`published_by\` equals this value.`)
  .option(`--published-at <published-at>`, `Only rows whose \`published_at\` equals this value.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, number, market, sha256, policyVersionNumber, policySha256, rolledBackFrom, note, publishedBy, publishedAt, filter } = await promptForMissing(
          _options,
          versionsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/container-versions`;
        const _payload: RequestParams = {};
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
        }
        if (order !== undefined) {
          _payload[`order`] = order;
        }
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (number !== undefined) {
          _payload[`number`] = number;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (sha256 !== undefined) {
          _payload[`sha256`] = sha256;
        }
        if (policyVersionNumber !== undefined) {
          _payload[`policy_version_number`] = policyVersionNumber;
        }
        if (policySha256 !== undefined) {
          _payload[`policy_sha256`] = policySha256;
        }
        if (rolledBackFrom !== undefined) {
          _payload[`rolled_back_from`] = rolledBackFrom;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
        }
        if (publishedBy !== undefined) {
          _payload[`published_by`] = publishedBy;
        }
        if (publishedAt !== undefined) {
          _payload[`published_at`] = publishedAt;
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
registerPromptSpecs(tagManagerContainer.commands.at(-1)!, versionsListSpecs, { method: "get" });
const versionsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The id of the container version.", type: "string", required: true, resource: { listPath: "/tag-manager/container-versions", hasLimit: true } },
];
tagManagerContainer
  .command(`versions-get`)
  .description(`One container version by id.`)
  .option(`--id <id>`, `The id of the container version.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          versionsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/container-versions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(tagManagerContainer.commands.at(-1)!, versionsGetSpecs, { method: "get" });
const publishSpecs: PromptSpec[] = [
  { key: "note", option: "--note <note>", name: "note", description: "A note kept with the version.", type: "string", required: false },
];
tagManagerContainer
  .command(`publish`)
  .description(`Freeze the active marketing tags, triggers and variables for the requested market into a new container version, after checking them against the consent manager's published policy. Every violation is answered at once.`)
  .option(`--note <note>`, `A note kept with the version.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { note } = await promptForMissing(
          _options,
          publishSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/container/publish`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (note !== undefined) {
          _payload[`note`] = note;
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
registerPromptSpecs(tagManagerContainer.commands.at(-1)!, publishSpecs, { method: "post" });
const recheckSpecs: PromptSpec[] = [
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
tagManagerContainer
  .command(`recheck`)
  .description(`Check every live container against the consent policy published now and record the result. Also runs on the consent manager's policy_version.published event. Changes no tag.`)
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
          recheckSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/container/recheck`;
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
registerPromptSpecs(tagManagerContainer.commands.at(-1)!, recheckSpecs, { method: "post" });
const rollbackSpecs: PromptSpec[] = [
  { key: "containerVersion", option: "--container-version <container-version>", name: "version", description: "The number of the version to publish again.", type: "integer", required: true },
];
tagManagerContainer
  .command(`rollback`)
  .description(`Publish the snapshot of an earlier version as a NEW version, after the same checks against the policy published now. The old version is not touched.`)
  .option(`--container-version <container-version>`, `The number of the version to publish again.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { containerVersion } = await promptForMissing(
          _options,
          rollbackSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/container/rollback`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (containerVersion !== undefined) {
          _payload[`version`] = containerVersion;
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
registerPromptSpecs(tagManagerContainer.commands.at(-1)!, rollbackSpecs, { method: "post" });
tagManagerContainer
  .command(`status`)
  .description(`Per market: the live version, its hash and policy version, and the latest check with its violations — what the Studio shows as a notice when a new policy no longer discloses a live vendor.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/container/status`;
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
const validateSpecs: PromptSpec[] = [
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
tagManagerContainer
  .command(`validate`)
  .description(`A dry run of the publish: builds the draft for the requested market, reads the consent manager's published policy for it and answers every violation. Writes nothing.`)
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
          validateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/container/validate`;
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
registerPromptSpecs(tagManagerContainer.commands.at(-1)!, validateSpecs, { method: "post" });
const tagManagerPreviewCreateSpecs: PromptSpec[] = [
  { key: "ttlMinutes", option: "--ttl-minutes <ttl-minutes>", name: "ttl_minutes", description: "Lifetime in minutes, default 60, at most 7 days.", type: "integer", required: false },
];
tagManagerContainer
  .command(`tag-manager-preview-create`)
  .description(`Mint a token that lets a storefront load the unpublished draft (\`?rvx_tm_preview=<token>\`). The token is answered once and stored only as its hash.`)
  .option(`--ttl-minutes <ttl-minutes>`, `Lifetime in minutes, default 60, at most 7 days.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { ttlMinutes } = await promptForMissing(
          _options,
          tagManagerPreviewCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/preview`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (ttlMinutes !== undefined) {
          _payload[`ttl_minutes`] = ttlMinutes;
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
registerPromptSpecs(tagManagerContainer.commands.at(-1)!, tagManagerPreviewCreateSpecs, { method: "post" });
