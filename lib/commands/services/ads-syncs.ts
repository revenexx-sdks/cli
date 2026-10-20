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
  confirmDestructive,
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const adsSyncs = new Command("ads-syncs")
  .description(
    commandDescriptions["adsSyncs"] ??
      `Audiences kept in step with a custom audience on a platform: hashed e-mail addresses of members with a confirmed consent, uploaded by the connector workflow.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "adAccountId", option: "--ad-account-id <ad-account-id>", name: "ad_account_id", description: "Keep only rows whose `ad_account_id` equals this.", type: "string", required: false },
  { key: "audienceId", option: "--audience-id <audience-id>", name: "audience_id", description: "Keep only rows whose `audience_id` equals this.", type: "string", required: false },
  { key: "audienceCode", option: "--audience-code <audience-code>", name: "audience_code", description: "Keep only rows whose `audience_code` equals this.", type: "string", required: false },
  { key: "subscriptionType", option: "--subscription-type <subscription-type>", name: "subscription_type", description: "Keep only rows whose `subscription_type` equals this.", type: "string", required: false },
  { key: "externalAudienceId", option: "--external-audience-id <external-audience-id>", name: "external_audience_id", description: "Keep only rows whose `external_audience_id` equals this.", type: "string", required: false },
  { key: "state", option: "--state <state>", name: "state", description: "Keep only rows whose `state` equals this.", type: "string", required: false },
  { key: "active", option: "--active <active>", name: "active", description: "Keep only rows whose `active` equals this.", type: "string", required: false },
  { key: "stale", option: "--stale <stale>", name: "stale", description: "Keep only rows whose `stale` equals this.", type: "string", required: false },
  { key: "memberCount", option: "--member-count <member-count>", name: "member_count", description: "Keep only rows whose `member_count` equals this.", type: "string", required: false },
  { key: "matchedCount", option: "--matched-count <matched-count>", name: "matched_count", description: "Keep only rows whose `matched_count` equals this.", type: "string", required: false },
  { key: "uploadedCount", option: "--uploaded-count <uploaded-count>", name: "uploaded_count", description: "Keep only rows whose `uploaded_count` equals this.", type: "string", required: false },
  { key: "skippedCount", option: "--skipped-count <skipped-count>", name: "skipped_count", description: "Keep only rows whose `skipped_count` equals this.", type: "string", required: false },
  { key: "lastError", option: "--last-error <last-error>", name: "last_error", description: "Keep only rows whose `last_error` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
adsSyncs
  .command(`list`)
  .description(`Filter \`?ad_account_id=\`, \`?audience_id=\`, \`?state=failed\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--ad-account-id <ad-account-id>`, `Keep only rows whose \`ad_account_id\` equals this.`)
  .option(`--audience-id <audience-id>`, `Keep only rows whose \`audience_id\` equals this.`)
  .option(`--audience-code <audience-code>`, `Keep only rows whose \`audience_code\` equals this.`)
  .option(`--subscription-type <subscription-type>`, `Keep only rows whose \`subscription_type\` equals this.`)
  .option(`--external-audience-id <external-audience-id>`, `Keep only rows whose \`external_audience_id\` equals this.`)
  .option(`--state <state>`, `Keep only rows whose \`state\` equals this.`)
  .option(`--active <active>`, `Keep only rows whose \`active\` equals this.`)
  .option(`--stale <stale>`, `Keep only rows whose \`stale\` equals this.`)
  .option(`--member-count <member-count>`, `Keep only rows whose \`member_count\` equals this.`)
  .option(`--matched-count <matched-count>`, `Keep only rows whose \`matched_count\` equals this.`)
  .option(`--uploaded-count <uploaded-count>`, `Keep only rows whose \`uploaded_count\` equals this.`)
  .option(`--skipped-count <skipped-count>`, `Keep only rows whose \`skipped_count\` equals this.`)
  .option(`--last-error <last-error>`, `Keep only rows whose \`last_error\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, adAccountId, audienceId, audienceCode, subscriptionType, externalAudienceId, state, active, stale, memberCount, matchedCount, uploadedCount, skippedCount, lastError, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/audience-syncs`;
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
        if (adAccountId !== undefined) {
          _payload[`ad_account_id`] = adAccountId;
        }
        if (audienceId !== undefined) {
          _payload[`audience_id`] = audienceId;
        }
        if (audienceCode !== undefined) {
          _payload[`audience_code`] = audienceCode;
        }
        if (subscriptionType !== undefined) {
          _payload[`subscription_type`] = subscriptionType;
        }
        if (externalAudienceId !== undefined) {
          _payload[`external_audience_id`] = externalAudienceId;
        }
        if (state !== undefined) {
          _payload[`state`] = state;
        }
        if (active !== undefined) {
          _payload[`active`] = active;
        }
        if (stale !== undefined) {
          _payload[`stale`] = stale;
        }
        if (memberCount !== undefined) {
          _payload[`member_count`] = memberCount;
        }
        if (matchedCount !== undefined) {
          _payload[`matched_count`] = matchedCount;
        }
        if (uploadedCount !== undefined) {
          _payload[`uploaded_count`] = uploadedCount;
        }
        if (skippedCount !== undefined) {
          _payload[`skipped_count`] = skippedCount;
        }
        if (lastError !== undefined) {
          _payload[`last_error`] = lastError;
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
registerPromptSpecs(adsSyncs.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "adAccountId", option: "--ad-account-id <ad-account-id>", name: "ad_account_id", description: "The ad account this row belongs to.", type: "string", required: true },
  { key: "audienceId", option: "--audience-id <audience-id>", name: "audience_id", description: "The audience in the audiences app.", type: "string", required: true },
  { key: "subscriptionType", option: "--subscription-type <subscription-type>", name: "subscription_type", description: "The marketing-consents subscription type whose confirmed consent covers uploading a member.", type: "string", required: true },
  { key: "active", option: "--active <active>", name: "active", description: "Switched on. A switched-off row stays for its history and does nothing.", type: "boolean", required: false },
  { key: "audienceCode", option: "--audience-code <audience-code>", name: "audience_code", description: "Its code, copied for display.", type: "string", required: false },
  { key: "externalAudienceId", option: "--external-audience-id <external-audience-id>", name: "external_audience_id", description: "The custom audience id on the platform, once the workflow created it.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
];
adsSyncs
  .command(`create`)
  .description(`Sync an audience to an ad account`)
  .option(`--ad-account-id <ad-account-id>`, `The ad account this row belongs to.`)
  .option(`--audience-id <audience-id>`, `The audience in the audiences app.`)
  .option(`--subscription-type <subscription-type>`, `The marketing-consents subscription type whose confirmed consent covers uploading a member.`)
  .option(
    `--active [value]`,
    `Switched on. A switched-off row stays for its history and does nothing.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--audience-code <audience-code>`, `Its code, copied for display.`)
  .option(`--external-audience-id <external-audience-id>`, `The custom audience id on the platform, once the workflow created it.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { adAccountId, audienceId, subscriptionType, active, audienceCode, externalAudienceId, metadata } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/audience-syncs`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (active !== undefined) {
          _payload[`active`] = active;
        }
        if (adAccountId !== undefined) {
          _payload[`ad_account_id`] = adAccountId;
        }
        if (audienceCode !== undefined) {
          _payload[`audience_code`] = audienceCode;
        }
        if (audienceId !== undefined) {
          _payload[`audience_id`] = audienceId;
        }
        if (externalAudienceId !== undefined) {
          _payload[`external_audience_id`] = externalAudienceId;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (subscriptionType !== undefined) {
          _payload[`subscription_type`] = subscriptionType;
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
registerPromptSpecs(adsSyncs.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/audience-syncs", hasLimit: true } },
];
adsSyncs
  .command(`delete`)
  .description(`Stop syncing an audience`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`ads-syncs delete`);
        const _client = await sdkForProject();
        const _apiPath = `/ads/audience-syncs/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(adsSyncs.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/audience-syncs", hasLimit: true } },
];
adsSyncs
  .command(`get`)
  .description(`Read one audience sync`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/audience-syncs/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(adsSyncs.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/audience-syncs", hasLimit: true } },
  { key: "active", option: "--active <active>", name: "active", description: "Switched on. A switched-off row stays for its history and does nothing.", type: "boolean", required: false },
  { key: "adAccountId", option: "--ad-account-id <ad-account-id>", name: "ad_account_id", description: "The ad account this row belongs to.", type: "string", required: false },
  { key: "audienceCode", option: "--audience-code <audience-code>", name: "audience_code", description: "Its code, copied for display.", type: "string", required: false },
  { key: "audienceId", option: "--audience-id <audience-id>", name: "audience_id", description: "The audience in the audiences app.", type: "string", required: false },
  { key: "externalAudienceId", option: "--external-audience-id <external-audience-id>", name: "external_audience_id", description: "The custom audience id on the platform, once the workflow created it.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "subscriptionType", option: "--subscription-type <subscription-type>", name: "subscription_type", description: "The marketing-consents subscription type whose confirmed consent covers uploading a member.", type: "string", required: false },
];
adsSyncs
  .command(`update`)
  .description(`Switch a sync on or off or change its consent type`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(
    `--active [value]`,
    `Switched on. A switched-off row stays for its history and does nothing.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--ad-account-id <ad-account-id>`, `The ad account this row belongs to.`)
  .option(`--audience-code <audience-code>`, `Its code, copied for display.`)
  .option(`--audience-id <audience-id>`, `The audience in the audiences app.`)
  .option(`--external-audience-id <external-audience-id>`, `The custom audience id on the platform, once the workflow created it.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--subscription-type <subscription-type>`, `The marketing-consents subscription type whose confirmed consent covers uploading a member.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, active, adAccountId, audienceCode, audienceId, externalAudienceId, metadata, subscriptionType } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/audience-syncs/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (active !== undefined) {
          _payload[`active`] = active;
        }
        if (adAccountId !== undefined) {
          _payload[`ad_account_id`] = adAccountId;
        }
        if (audienceCode !== undefined) {
          _payload[`audience_code`] = audienceCode;
        }
        if (audienceId !== undefined) {
          _payload[`audience_id`] = audienceId;
        }
        if (externalAudienceId !== undefined) {
          _payload[`external_audience_id`] = externalAudienceId;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (subscriptionType !== undefined) {
          _payload[`subscription_type`] = subscriptionType;
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
registerPromptSpecs(adsSyncs.commands.at(-1)!, updateSpecs, { method: "put" });
const membersSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/audience-syncs", hasLimit: true } },
  { key: "cursor", option: "--cursor <cursor>", name: "cursor", description: "The next_cursor of the previous page.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default and max 500).", type: "integer", required: false },
];
adsSyncs
  .command(`members`)
  .description(`SHA-256 of the trimmed, lower-cased e-mail of every member holding a confirmed subscription of the sync type — by default only consent, not the existing-customer exemption. Members without it are counted as skipped and never served.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--cursor <cursor>`, `The next_cursor of the previous page.`)
  .option(`--limit <limit>`, `Page size (default and max 500).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, cursor, limit } = await promptForMissing(
          _options,
          membersSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/audience-syncs/{id}/members`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cursor !== undefined) {
          _payload[`cursor`] = cursor;
        }
        if (limit !== undefined) {
          _payload[`limit`] = limit;
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
registerPromptSpecs(adsSyncs.commands.at(-1)!, membersSpecs, { method: "get" });
const requestSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/audience-syncs", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
adsSyncs
  .command(`request`)
  .description(`Announces \`audience_sync.requested\` for the workflow of the platform.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { id, body } = await promptForMissing(
          _options,
          requestSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/audience-syncs/{id}/request`.replace(`{id}`, id);
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
registerPromptSpecs(adsSyncs.commands.at(-1)!, requestSpecs, { method: "post" });
const resultSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/audience-syncs", hasLimit: true } },
  { key: "error", option: "--error <error>", name: "error", type: "string", required: false },
  { key: "externalAudienceId", option: "--external-audience-id <external-audience-id>", name: "external_audience_id", type: "string", required: false },
  { key: "matchedCount", option: "--matched-count <matched-count>", name: "matched_count", type: "integer", required: false },
  { key: "memberCount", option: "--member-count <member-count>", name: "member_count", type: "integer", required: false },
  { key: "ok", option: "--ok <ok>", name: "ok", type: "boolean", required: false },
  { key: "skippedCount", option: "--skipped-count <skipped-count>", name: "skipped_count", type: "integer", required: false },
  { key: "uploadedCount", option: "--uploaded-count <uploaded-count>", name: "uploaded_count", type: "integer", required: false },
];
adsSyncs
  .command(`result`)
  .description(`Report what an upload achieved`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--error <error>`, ``)
  .option(`--external-audience-id <external-audience-id>`, ``)
  .option(`--matched-count <matched-count>`, ``, parseInteger)
  .option(`--member-count <member-count>`, ``, parseInteger)
  .option(
    `--ok [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--skipped-count <skipped-count>`, ``, parseInteger)
  .option(`--uploaded-count <uploaded-count>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, error, externalAudienceId, matchedCount, memberCount, ok, skippedCount, uploadedCount } = await promptForMissing(
          _options,
          resultSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/audience-syncs/{id}/result`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (error !== undefined) {
          _payload[`error`] = error;
        }
        if (externalAudienceId !== undefined) {
          _payload[`external_audience_id`] = externalAudienceId;
        }
        if (matchedCount !== undefined) {
          _payload[`matched_count`] = matchedCount;
        }
        if (memberCount !== undefined) {
          _payload[`member_count`] = memberCount;
        }
        if (ok !== undefined) {
          _payload[`ok`] = ok;
        }
        if (skippedCount !== undefined) {
          _payload[`skipped_count`] = skippedCount;
        }
        if (uploadedCount !== undefined) {
          _payload[`uploaded_count`] = uploadedCount;
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
registerPromptSpecs(adsSyncs.commands.at(-1)!, resultSpecs, { method: "post" });
