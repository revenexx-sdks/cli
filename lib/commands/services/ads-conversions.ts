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

export const adsConversions = new Command("ads-conversions")
  .description(
    commandDescriptions["adsConversions"] ??
      `Orders from an ad click, recorded per rule: ready to send when the visitor allowed ad tracking, skipped when not. The workflow sends and reports back.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "ruleId", option: "--rule-id <rule-id>", name: "rule_id", description: "Keep only rows whose `rule_id` equals this.", type: "string", required: false },
  { key: "adAccountId", option: "--ad-account-id <ad-account-id>", name: "ad_account_id", description: "Keep only rows whose `ad_account_id` equals this.", type: "string", required: false },
  { key: "eventKey", option: "--event-key <event-key>", name: "event_key", description: "Keep only rows whose `event_key` equals this.", type: "string", required: false },
  { key: "event", option: "--event <event>", name: "event", description: "Keep only rows whose `event` equals this.", type: "string", required: false },
  { key: "platform", option: "--platform <platform>", name: "platform", description: "Keep only rows whose `platform` equals this.", type: "string", required: false },
  { key: "sourceRef", option: "--source-ref <source-ref>", name: "source_ref", description: "Keep only rows whose `source_ref` equals this.", type: "string", required: false },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", description: "Keep only rows whose `order_id` equals this.", type: "string", required: false },
  { key: "clickId", option: "--click-id <click-id>", name: "click_id", description: "Keep only rows whose `click_id` equals this.", type: "string", required: false },
  { key: "clickIdKind", option: "--click-id-kind <click-id-kind>", name: "click_id_kind", description: "Keep only rows whose `click_id_kind` equals this.", type: "string", required: false },
  { key: "hashedEmail", option: "--hashed-email <hashed-email>", name: "hashed_email", description: "Keep only rows whose `hashed_email` equals this.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Keep only rows whose `currency` equals this.", type: "string", required: false },
  { key: "state", option: "--state <state>", name: "state", description: "Keep only rows whose `state` equals this.", type: "string", required: false },
  { key: "attempts", option: "--attempts <attempts>", name: "attempts", description: "Keep only rows whose `attempts` equals this.", type: "string", required: false },
  { key: "externalRef", option: "--external-ref <external-ref>", name: "external_ref", description: "Keep only rows whose `external_ref` equals this.", type: "string", required: false },
  { key: "lastError", option: "--last-error <last-error>", name: "last_error", description: "Keep only rows whose `last_error` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
adsConversions
  .command(`list`)
  .description(`The workflow reads \`?state=ready\`; filter also \`?order_id=\`, \`?rule_id=\`, \`?platform=\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--rule-id <rule-id>`, `Keep only rows whose \`rule_id\` equals this.`)
  .option(`--ad-account-id <ad-account-id>`, `Keep only rows whose \`ad_account_id\` equals this.`)
  .option(`--event-key <event-key>`, `Keep only rows whose \`event_key\` equals this.`)
  .option(`--event <event>`, `Keep only rows whose \`event\` equals this.`)
  .option(`--platform <platform>`, `Keep only rows whose \`platform\` equals this.`)
  .option(`--source-ref <source-ref>`, `Keep only rows whose \`source_ref\` equals this.`)
  .option(`--order-id <order-id>`, `Keep only rows whose \`order_id\` equals this.`)
  .option(`--click-id <click-id>`, `Keep only rows whose \`click_id\` equals this.`)
  .option(`--click-id-kind <click-id-kind>`, `Keep only rows whose \`click_id_kind\` equals this.`)
  .option(`--hashed-email <hashed-email>`, `Keep only rows whose \`hashed_email\` equals this.`)
  .option(`--currency <currency>`, `Keep only rows whose \`currency\` equals this.`)
  .option(`--state <state>`, `Keep only rows whose \`state\` equals this.`)
  .option(`--attempts <attempts>`, `Keep only rows whose \`attempts\` equals this.`)
  .option(`--external-ref <external-ref>`, `Keep only rows whose \`external_ref\` equals this.`)
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
        const { limit, offset, order, id, ruleId, adAccountId, eventKey, event, platform, sourceRef, orderId, clickId, clickIdKind, hashedEmail, currency, state, attempts, externalRef, lastError, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/conversions`;
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
        if (ruleId !== undefined) {
          _payload[`rule_id`] = ruleId;
        }
        if (adAccountId !== undefined) {
          _payload[`ad_account_id`] = adAccountId;
        }
        if (eventKey !== undefined) {
          _payload[`event_key`] = eventKey;
        }
        if (event !== undefined) {
          _payload[`event`] = event;
        }
        if (platform !== undefined) {
          _payload[`platform`] = platform;
        }
        if (sourceRef !== undefined) {
          _payload[`source_ref`] = sourceRef;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
        }
        if (clickId !== undefined) {
          _payload[`click_id`] = clickId;
        }
        if (clickIdKind !== undefined) {
          _payload[`click_id_kind`] = clickIdKind;
        }
        if (hashedEmail !== undefined) {
          _payload[`hashed_email`] = hashedEmail;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (state !== undefined) {
          _payload[`state`] = state;
        }
        if (attempts !== undefined) {
          _payload[`attempts`] = attempts;
        }
        if (externalRef !== undefined) {
          _payload[`external_ref`] = externalRef;
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
registerPromptSpecs(adsConversions.commands.at(-1)!, listSpecs, { method: "get" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/conversions", hasLimit: true } },
];
adsConversions
  .command(`get`)
  .description(`Read one conversion`)
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
        const _apiPath = `/ads/conversions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(adsConversions.commands.at(-1)!, getSpecs, { method: "get" });
const resultSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/conversions", hasLimit: true } },
  { key: "error", option: "--error <error>", name: "error", type: "string", required: false },
  { key: "externalRef", option: "--external-ref <external-ref>", name: "external_ref", type: "string", required: false },
  { key: "ok", option: "--ok <ok>", name: "ok", type: "boolean", required: false },
];
adsConversions
  .command(`result`)
  .description(`Report whether a conversion was sent`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--error <error>`, ``)
  .option(`--external-ref <external-ref>`, ``)
  .option(
    `--ok [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, error, externalRef, ok } = await promptForMissing(
          _options,
          resultSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/conversions/{id}/result`.replace(`{id}`, id);
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
        if (externalRef !== undefined) {
          _payload[`external_ref`] = externalRef;
        }
        if (ok !== undefined) {
          _payload[`ok`] = ok;
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
registerPromptSpecs(adsConversions.commands.at(-1)!, resultSpecs, { method: "post" });
const retrySpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/conversions", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
adsConversions
  .command(`retry`)
  .description(`Put a failed conversion back in line`)
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
          retrySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/conversions/{id}/retry`.replace(`{id}`, id);
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
registerPromptSpecs(adsConversions.commands.at(-1)!, retrySpecs, { method: "post" });
