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

export const audiencesRules = new Command("audiences-rules")
  .description(
    commandDescriptions["audiencesRules"] ??
      `The rule tree of an active audience: groups of all or any holding questions about one person — contact fields and role, lifecycle stage, the organisation's segments and figures, market and locale, subscription state, engagement, membership of another audience, form submissions, loyalty tier, reviews — with negation. Every question names the app that answers it, and an unanswered one excludes the person.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "audienceId", option: "--audience-id <audience-id>", name: "audience_id", description: "Keep only rows whose `audience_id` equals this.", type: "string", required: false },
  { key: "parentId", option: "--parent-id <parent-id>", name: "parent_id", description: "Keep only rows whose `parent_id` equals this.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Keep only rows whose `kind` equals this.", type: "string", required: false },
  { key: "matchMode", option: "--match-mode <match-mode>", name: "match_mode", description: "Keep only rows whose `match_mode` equals this.", type: "string", required: false },
  { key: "negate", option: "--negate <negate>", name: "negate", description: "Keep only rows whose `negate` equals this.", type: "string", required: false },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "Keep only rows whose `subject` equals this.", type: "string", required: false },
  { key: "field", option: "--field <field>", name: "field", description: "Keep only rows whose `field` equals this.", type: "string", required: false },
  { key: "operator", option: "--operator <operator>", name: "operator", description: "Keep only rows whose `operator` equals this.", type: "string", required: false },
  { key: "windowDays", option: "--window-days <window-days>", name: "window_days", description: "Keep only rows whose `window_days` equals this.", type: "string", required: false },
  { key: "channel", option: "--channel <channel>", name: "channel", description: "Keep only rows whose `channel` equals this.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Keep only rows whose `position` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
audiencesRules
  .command(`list`)
  .description(`The rule rows of every active audience; filter \`?audience_id=\` for one audience's tree.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--audience-id <audience-id>`, `Keep only rows whose \`audience_id\` equals this.`)
  .option(`--parent-id <parent-id>`, `Keep only rows whose \`parent_id\` equals this.`)
  .option(`--kind <kind>`, `Keep only rows whose \`kind\` equals this.`)
  .option(`--match-mode <match-mode>`, `Keep only rows whose \`match_mode\` equals this.`)
  .option(`--negate <negate>`, `Keep only rows whose \`negate\` equals this.`)
  .option(`--subject <subject>`, `Keep only rows whose \`subject\` equals this.`)
  .option(`--field <field>`, `Keep only rows whose \`field\` equals this.`)
  .option(`--operator <operator>`, `Keep only rows whose \`operator\` equals this.`)
  .option(`--window-days <window-days>`, `Keep only rows whose \`window_days\` equals this.`)
  .option(`--channel <channel>`, `Keep only rows whose \`channel\` equals this.`)
  .option(`--position <position>`, `Keep only rows whose \`position\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, audienceId, parentId, kind, matchMode, negate, subject, field, operator, windowDays, channel, position, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/rules`;
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
        if (audienceId !== undefined) {
          _payload[`audience_id`] = audienceId;
        }
        if (parentId !== undefined) {
          _payload[`parent_id`] = parentId;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (matchMode !== undefined) {
          _payload[`match_mode`] = matchMode;
        }
        if (negate !== undefined) {
          _payload[`negate`] = negate;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
        }
        if (field !== undefined) {
          _payload[`field`] = field;
        }
        if (operator !== undefined) {
          _payload[`operator`] = operator;
        }
        if (windowDays !== undefined) {
          _payload[`window_days`] = windowDays;
        }
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(audiencesRules.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "audienceId", option: "--audience-id <audience-id>", name: "audience_id", description: "The audience this row belongs to. Deleting the audience deletes it.", type: "string", required: true },
  { key: "channel", option: "--channel <channel>", name: "channel", description: "For a subscription question: `email`, `sms` or `whatsapp`.", type: "string", required: false, enum: ["email","sms","whatsapp"] },
  { key: "field", option: "--field <field>", name: "field", description: "Which contact column, organisation figure, order window or subscription type the question reads, where the subject needs one.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "`group` holds further rules; `question` asks one thing about a person.", type: "string", required: false, enum: ["group","question"] },
  { key: "matchMode", option: "--match-mode <match-mode>", name: "match_mode", description: "For a group: `all` or `any` of its rules.", type: "string", required: false, enum: ["all","any"] },
  { key: "negate", option: "--negate <negate>", name: "negate", description: "Turns the answer around. An unanswered question stays unanswered.", type: "boolean", required: false },
  { key: "operator", option: "--operator <operator>", name: "operator", description: "How it compares — one of GET /audiences/vocabularies/operators, limited per subject.", type: "string", required: false },
  { key: "parentId", option: "--parent-id <parent-id>", name: "parent_id", description: "The group this rule sits inside. Empty at the top level.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Order among siblings, ascending; ties are ordered by id.", type: "integer", required: false },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "What the question asks about — one of the subjects in GET /audiences/vocabularies/subjects.", type: "string", required: false },
  { key: "value", option: "--value <value>", name: "value", description: "What it compares against: a list of codes, a text or a number.", type: "any", required: false },
  { key: "valueTo", option: "--value-to <value-to>", name: "value_to", description: "The upper bound of a `between`.", type: "any", required: false },
  { key: "windowDays", option: "--window-days <window-days>", name: "window_days", description: "How many days back a time-bound question looks.", type: "integer", required: false },
];
audiencesRules
  .command(`create`)
  .description(`Add a rule or a group to an audience`)
  .option(`--audience-id <audience-id>`, `The audience this row belongs to. Deleting the audience deletes it.`)
  .option(`--channel <channel>`, `For a subscription question: \`email\`, \`sms\` or \`whatsapp\`.`)
  .option(`--field <field>`, `Which contact column, organisation figure, order window or subscription type the question reads, where the subject needs one.`)
  .option(`--kind <kind>`, `\`group\` holds further rules; \`question\` asks one thing about a person.`)
  .option(`--match-mode <match-mode>`, `For a group: \`all\` or \`any\` of its rules.`)
  .option(
    `--negate [value]`,
    `Turns the answer around. An unanswered question stays unanswered.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--operator <operator>`, `How it compares — one of GET /audiences/vocabularies/operators, limited per subject.`)
  .option(`--parent-id <parent-id>`, `The group this rule sits inside. Empty at the top level.`)
  .option(`--position <position>`, `Order among siblings, ascending; ties are ordered by id.`, parseInteger)
  .option(`--subject <subject>`, `What the question asks about — one of the subjects in GET /audiences/vocabularies/subjects.`)
  .option(`--value <value>`, `What it compares against: a list of codes, a text or a number.`)
  .option(`--value-to <value-to>`, `The upper bound of a \`between\`.`)
  .option(`--window-days <window-days>`, `How many days back a time-bound question looks.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { audienceId, channel, field, kind, matchMode, negate, operator, parentId, position, subject, value, valueTo, windowDays } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/rules`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (audienceId !== undefined) {
          _payload[`audience_id`] = audienceId;
        }
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (field !== undefined) {
          _payload[`field`] = field;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (matchMode !== undefined) {
          _payload[`match_mode`] = matchMode;
        }
        if (negate !== undefined) {
          _payload[`negate`] = negate;
        }
        if (operator !== undefined) {
          _payload[`operator`] = operator;
        }
        if (parentId !== undefined) {
          _payload[`parent_id`] = parentId;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
        }
        if (value !== undefined) {
          _payload[`value`] = value;
        }
        if (valueTo !== undefined) {
          _payload[`value_to`] = valueTo;
        }
        if (windowDays !== undefined) {
          _payload[`window_days`] = windowDays;
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
registerPromptSpecs(audiencesRules.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/audiences/rules", hasLimit: true } },
];
audiencesRules
  .command(`delete`)
  .description(`Remove a rule (and, for a group, what it holds)`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`audiences-rules delete`);
        const _client = await sdkForProject();
        const _apiPath = `/audiences/rules/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(audiencesRules.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/audiences/rules", hasLimit: true } },
];
audiencesRules
  .command(`get`)
  .description(`Read one rule`)
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
        const _apiPath = `/audiences/rules/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(audiencesRules.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/audiences/rules", hasLimit: true } },
  { key: "audienceId", option: "--audience-id <audience-id>", name: "audience_id", description: "The audience this row belongs to. Deleting the audience deletes it.", type: "string", required: false },
  { key: "channel", option: "--channel <channel>", name: "channel", description: "For a subscription question: `email`, `sms` or `whatsapp`.", type: "string", required: false, enum: ["email","sms","whatsapp"] },
  { key: "field", option: "--field <field>", name: "field", description: "Which contact column, organisation figure, order window or subscription type the question reads, where the subject needs one.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "`group` holds further rules; `question` asks one thing about a person.", type: "string", required: false, enum: ["group","question"] },
  { key: "matchMode", option: "--match-mode <match-mode>", name: "match_mode", description: "For a group: `all` or `any` of its rules.", type: "string", required: false, enum: ["all","any"] },
  { key: "negate", option: "--negate <negate>", name: "negate", description: "Turns the answer around. An unanswered question stays unanswered.", type: "boolean", required: false },
  { key: "operator", option: "--operator <operator>", name: "operator", description: "How it compares — one of GET /audiences/vocabularies/operators, limited per subject.", type: "string", required: false },
  { key: "parentId", option: "--parent-id <parent-id>", name: "parent_id", description: "The group this rule sits inside. Empty at the top level.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Order among siblings, ascending; ties are ordered by id.", type: "integer", required: false },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "What the question asks about — one of the subjects in GET /audiences/vocabularies/subjects.", type: "string", required: false },
  { key: "value", option: "--value <value>", name: "value", description: "What it compares against: a list of codes, a text or a number.", type: "any", required: false },
  { key: "valueTo", option: "--value-to <value-to>", name: "value_to", description: "The upper bound of a `between`.", type: "any", required: false },
  { key: "windowDays", option: "--window-days <window-days>", name: "window_days", description: "How many days back a time-bound question looks.", type: "integer", required: false },
];
audiencesRules
  .command(`update`)
  .description(`Correct a rule`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--audience-id <audience-id>`, `The audience this row belongs to. Deleting the audience deletes it.`)
  .option(`--channel <channel>`, `For a subscription question: \`email\`, \`sms\` or \`whatsapp\`.`)
  .option(`--field <field>`, `Which contact column, organisation figure, order window or subscription type the question reads, where the subject needs one.`)
  .option(`--kind <kind>`, `\`group\` holds further rules; \`question\` asks one thing about a person.`)
  .option(`--match-mode <match-mode>`, `For a group: \`all\` or \`any\` of its rules.`)
  .option(
    `--negate [value]`,
    `Turns the answer around. An unanswered question stays unanswered.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--operator <operator>`, `How it compares — one of GET /audiences/vocabularies/operators, limited per subject.`)
  .option(`--parent-id <parent-id>`, `The group this rule sits inside. Empty at the top level.`)
  .option(`--position <position>`, `Order among siblings, ascending; ties are ordered by id.`, parseInteger)
  .option(`--subject <subject>`, `What the question asks about — one of the subjects in GET /audiences/vocabularies/subjects.`)
  .option(`--value <value>`, `What it compares against: a list of codes, a text or a number.`)
  .option(`--value-to <value-to>`, `The upper bound of a \`between\`.`)
  .option(`--window-days <window-days>`, `How many days back a time-bound question looks.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, audienceId, channel, field, kind, matchMode, negate, operator, parentId, position, subject, value, valueTo, windowDays } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/rules/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (audienceId !== undefined) {
          _payload[`audience_id`] = audienceId;
        }
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (field !== undefined) {
          _payload[`field`] = field;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (matchMode !== undefined) {
          _payload[`match_mode`] = matchMode;
        }
        if (negate !== undefined) {
          _payload[`negate`] = negate;
        }
        if (operator !== undefined) {
          _payload[`operator`] = operator;
        }
        if (parentId !== undefined) {
          _payload[`parent_id`] = parentId;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
        }
        if (value !== undefined) {
          _payload[`value`] = value;
        }
        if (valueTo !== undefined) {
          _payload[`value_to`] = valueTo;
        }
        if (windowDays !== undefined) {
          _payload[`window_days`] = windowDays;
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
registerPromptSpecs(audiencesRules.commands.at(-1)!, updateSpecs, { method: "put" });
