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

export const adsRules = new Command("ads-rules")
  .description(
    commandDescriptions["adsRules"] ??
      `Which event is reported to which ad account, with which value and under which consent purpose.`,
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
  { key: "name", option: "--name <name>", name: "name", description: "Keep only rows whose `name` equals this.", type: "string", required: false },
  { key: "event", option: "--event <event>", name: "event", description: "Keep only rows whose `event` equals this.", type: "string", required: false },
  { key: "valueSource", option: "--value-source <value-source>", name: "value_source", description: "Keep only rows whose `value_source` equals this.", type: "string", required: false },
  { key: "externalConversionRef", option: "--external-conversion-ref <external-conversion-ref>", name: "external_conversion_ref", description: "Keep only rows whose `external_conversion_ref` equals this.", type: "string", required: false },
  { key: "consentPurpose", option: "--consent-purpose <consent-purpose>", name: "consent_purpose", description: "Keep only rows whose `consent_purpose` equals this.", type: "string", required: false },
  { key: "active", option: "--active <active>", name: "active", description: "Keep only rows whose `active` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
adsRules
  .command(`list`)
  .description(`Filter \`?ad_account_id=\`, \`?event=\`, \`?active=true\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--ad-account-id <ad-account-id>`, `Keep only rows whose \`ad_account_id\` equals this.`)
  .option(`--name <name>`, `Keep only rows whose \`name\` equals this.`)
  .option(`--event <event>`, `Keep only rows whose \`event\` equals this.`)
  .option(`--value-source <value-source>`, `Keep only rows whose \`value_source\` equals this.`)
  .option(`--external-conversion-ref <external-conversion-ref>`, `Keep only rows whose \`external_conversion_ref\` equals this.`)
  .option(`--consent-purpose <consent-purpose>`, `Keep only rows whose \`consent_purpose\` equals this.`)
  .option(`--active <active>`, `Keep only rows whose \`active\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, adAccountId, name, event, valueSource, externalConversionRef, consentPurpose, active, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/conversion-rules`;
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
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (event !== undefined) {
          _payload[`event`] = event;
        }
        if (valueSource !== undefined) {
          _payload[`value_source`] = valueSource;
        }
        if (externalConversionRef !== undefined) {
          _payload[`external_conversion_ref`] = externalConversionRef;
        }
        if (consentPurpose !== undefined) {
          _payload[`consent_purpose`] = consentPurpose;
        }
        if (active !== undefined) {
          _payload[`active`] = active;
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
registerPromptSpecs(adsRules.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "adAccountId", option: "--ad-account-id <ad-account-id>", name: "ad_account_id", description: "The ad account this row belongs to.", type: "string", required: true },
  { key: "event", option: "--event <event>", name: "event", description: "`order.placed`, `subscription.confirmed` or `form.submitted`.", type: "string", required: true, enum: ["order.placed","subscription.confirmed","form.submitted"] },
  { key: "name", option: "--name <name>", name: "name", description: "What the merchant calls the rule.", type: "string", required: true },
  { key: "active", option: "--active <active>", name: "active", description: "Switched on. A switched-off row stays for its history and does nothing.", type: "boolean", required: false },
  { key: "consentPurpose", option: "--consent-purpose <consent-purpose>", name: "consent_purpose", description: "The consent manager purpose the visitor must have allowed.", type: "string", required: false },
  { key: "externalConversionRef", option: "--external-conversion-ref <external-conversion-ref>", name: "external_conversion_ref", description: "The conversion action or event name on the platform.", type: "string", required: false },
  { key: "fixedValue", option: "--fixed-value <fixed-value>", name: "fixed_value", description: "The value when value_source is fixed.", type: "number", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "valueSource", option: "--value-source <value-source>", name: "value_source", description: "`order_net` (goods after discount, no tax or freight), `order_gross`, `fixed` or `none`.", type: "string", required: false, enum: ["order_net","order_gross","fixed","none"] },
];
adsRules
  .command(`create`)
  .description(`Add a conversion rule`)
  .option(`--ad-account-id <ad-account-id>`, `The ad account this row belongs to.`)
  .option(`--event <event>`, `\`order.placed\`, \`subscription.confirmed\` or \`form.submitted\`.`)
  .option(`--name <name>`, `What the merchant calls the rule.`)
  .option(
    `--active [value]`,
    `Switched on. A switched-off row stays for its history and does nothing.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--consent-purpose <consent-purpose>`, `The consent manager purpose the visitor must have allowed.`)
  .option(`--external-conversion-ref <external-conversion-ref>`, `The conversion action or event name on the platform.`)
  .option(`--fixed-value <fixed-value>`, `The value when value_source is fixed.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--value-source <value-source>`, `\`order_net\` (goods after discount, no tax or freight), \`order_gross\`, \`fixed\` or \`none\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { adAccountId, event, name, active, consentPurpose, externalConversionRef, fixedValue, metadata, valueSource } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/conversion-rules`;
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
        if (consentPurpose !== undefined) {
          _payload[`consent_purpose`] = consentPurpose;
        }
        if (event !== undefined) {
          _payload[`event`] = event;
        }
        if (externalConversionRef !== undefined) {
          _payload[`external_conversion_ref`] = externalConversionRef;
        }
        if (fixedValue !== undefined) {
          _payload[`fixed_value`] = fixedValue;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (valueSource !== undefined) {
          _payload[`value_source`] = valueSource;
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
registerPromptSpecs(adsRules.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/conversion-rules", hasLimit: true } },
];
adsRules
  .command(`delete`)
  .description(`Delete a rule that recorded nothing`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`ads-rules delete`);
        const _client = await sdkForProject();
        const _apiPath = `/ads/conversion-rules/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(adsRules.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/conversion-rules", hasLimit: true } },
];
adsRules
  .command(`get`)
  .description(`Read one conversion rule`)
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
        const _apiPath = `/ads/conversion-rules/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(adsRules.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/conversion-rules", hasLimit: true } },
  { key: "active", option: "--active <active>", name: "active", description: "Switched on. A switched-off row stays for its history and does nothing.", type: "boolean", required: false },
  { key: "adAccountId", option: "--ad-account-id <ad-account-id>", name: "ad_account_id", description: "The ad account this row belongs to.", type: "string", required: false },
  { key: "consentPurpose", option: "--consent-purpose <consent-purpose>", name: "consent_purpose", description: "The consent manager purpose the visitor must have allowed.", type: "string", required: false },
  { key: "event", option: "--event <event>", name: "event", description: "`order.placed`, `subscription.confirmed` or `form.submitted`.", type: "string", required: false, enum: ["order.placed","subscription.confirmed","form.submitted"] },
  { key: "externalConversionRef", option: "--external-conversion-ref <external-conversion-ref>", name: "external_conversion_ref", description: "The conversion action or event name on the platform.", type: "string", required: false },
  { key: "fixedValue", option: "--fixed-value <fixed-value>", name: "fixed_value", description: "The value when value_source is fixed.", type: "number", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "What the merchant calls the rule.", type: "string", required: false },
  { key: "valueSource", option: "--value-source <value-source>", name: "value_source", description: "`order_net` (goods after discount, no tax or freight), `order_gross`, `fixed` or `none`.", type: "string", required: false, enum: ["order_net","order_gross","fixed","none"] },
];
adsRules
  .command(`update`)
  .description(`Correct a conversion rule`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(
    `--active [value]`,
    `Switched on. A switched-off row stays for its history and does nothing.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--ad-account-id <ad-account-id>`, `The ad account this row belongs to.`)
  .option(`--consent-purpose <consent-purpose>`, `The consent manager purpose the visitor must have allowed.`)
  .option(`--event <event>`, `\`order.placed\`, \`subscription.confirmed\` or \`form.submitted\`.`)
  .option(`--external-conversion-ref <external-conversion-ref>`, `The conversion action or event name on the platform.`)
  .option(`--fixed-value <fixed-value>`, `The value when value_source is fixed.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--name <name>`, `What the merchant calls the rule.`)
  .option(`--value-source <value-source>`, `\`order_net\` (goods after discount, no tax or freight), \`order_gross\`, \`fixed\` or \`none\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, active, adAccountId, consentPurpose, event, externalConversionRef, fixedValue, metadata, name, valueSource } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/conversion-rules/{id}`.replace(`{id}`, id);
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
        if (consentPurpose !== undefined) {
          _payload[`consent_purpose`] = consentPurpose;
        }
        if (event !== undefined) {
          _payload[`event`] = event;
        }
        if (externalConversionRef !== undefined) {
          _payload[`external_conversion_ref`] = externalConversionRef;
        }
        if (fixedValue !== undefined) {
          _payload[`fixed_value`] = fixedValue;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (valueSource !== undefined) {
          _payload[`value_source`] = valueSource;
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
registerPromptSpecs(adsRules.commands.at(-1)!, updateSpecs, { method: "put" });
