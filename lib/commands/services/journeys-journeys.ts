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

export const journeysJourneys = new Command("journeys-journeys")
  .description(
    commandDescriptions["journeysJourneys"] ??
      `The journeys: a named flow with a trigger, an optional goal, re-enrolment rules and a campaign. The canvas reads and saves its draft graph here; publishing makes the draft live as a whole, pausing holds everyone where they are, archiving lets everyone out. The report gives per-step counts.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "trashed", option: "--trashed <trashed>", name: "trashed", description: "`exclude` (default) leaves the trash out, `only` is the trash itself, `include` lists both.", type: "string", required: false, enum: ["exclude","only","include"] },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Keep only rows whose `name` equals this.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "Keep only rows whose `description` equals this.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Keep only rows whose `status` equals this.", type: "string", required: false },
  { key: "triggerKind", option: "--trigger-kind <trigger-kind>", name: "trigger_kind", description: "Keep only rows whose `trigger_kind` equals this.", type: "string", required: false },
  { key: "reenrol", option: "--reenrol <reenrol>", name: "reenrol", description: "Keep only rows whose `reenrol` equals this.", type: "string", required: false },
  { key: "reenrolGapDays", option: "--reenrol-gap-days <reenrol-gap-days>", name: "reenrol_gap_days", description: "Keep only rows whose `reenrol_gap_days` equals this.", type: "string", required: false },
  { key: "campaignRef", option: "--campaign-ref <campaign-ref>", name: "campaign_ref", description: "Keep only rows whose `campaign_ref` equals this.", type: "string", required: false },
  { key: "templateCode", option: "--template-code <template-code>", name: "template_code", description: "Keep only rows whose `template_code` equals this.", type: "string", required: false },
  { key: "currentVersion", option: "--current-version <current-version>", name: "current_version", description: "Keep only rows whose `current_version` equals this.", type: "string", required: false },
  { key: "draftVersion", option: "--draft-version <draft-version>", name: "draft_version", description: "Keep only rows whose `draft_version` equals this.", type: "string", required: false },
  { key: "triggerRanOn", option: "--trigger-ran-on <trigger-ran-on>", name: "trigger_ran_on", description: "Keep only rows whose `trigger_ran_on` equals this.", type: "string", required: false },
  { key: "enrolledCount", option: "--enrolled-count <enrolled-count>", name: "enrolled_count", description: "Keep only rows whose `enrolled_count` equals this.", type: "string", required: false },
  { key: "activeCount", option: "--active-count <active-count>", name: "active_count", description: "Keep only rows whose `active_count` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
journeysJourneys
  .command(`list`)
  .description(`Every journey of this tenant, without the trash unless \`trashed\` asks for it. Filter \`?status=live\`, \`?campaign_ref=\` for the journeys a campaign claimed (the calendar reads \`live_from\`/\`live_until\`).`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--trashed <trashed>`, `\`exclude\` (default) leaves the trash out, \`only\` is the trash itself, \`include\` lists both.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--name <name>`, `Keep only rows whose \`name\` equals this.`)
  .option(`--description <description>`, `Keep only rows whose \`description\` equals this.`)
  .option(`--status <status>`, `Keep only rows whose \`status\` equals this.`)
  .option(`--trigger-kind <trigger-kind>`, `Keep only rows whose \`trigger_kind\` equals this.`)
  .option(`--reenrol <reenrol>`, `Keep only rows whose \`reenrol\` equals this.`)
  .option(`--reenrol-gap-days <reenrol-gap-days>`, `Keep only rows whose \`reenrol_gap_days\` equals this.`)
  .option(`--campaign-ref <campaign-ref>`, `Keep only rows whose \`campaign_ref\` equals this.`)
  .option(`--template-code <template-code>`, `Keep only rows whose \`template_code\` equals this.`)
  .option(`--current-version <current-version>`, `Keep only rows whose \`current_version\` equals this.`)
  .option(`--draft-version <draft-version>`, `Keep only rows whose \`draft_version\` equals this.`)
  .option(`--trigger-ran-on <trigger-ran-on>`, `Keep only rows whose \`trigger_ran_on\` equals this.`)
  .option(`--enrolled-count <enrolled-count>`, `Keep only rows whose \`enrolled_count\` equals this.`)
  .option(`--active-count <active-count>`, `Keep only rows whose \`active_count\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, trashed, id, name, description, status, triggerKind, reenrol, reenrolGapDays, campaignRef, templateCode, currentVersion, draftVersion, triggerRanOn, enrolledCount, activeCount, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys`;
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
        if (trashed !== undefined) {
          _payload[`trashed`] = trashed;
        }
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (triggerKind !== undefined) {
          _payload[`trigger_kind`] = triggerKind;
        }
        if (reenrol !== undefined) {
          _payload[`reenrol`] = reenrol;
        }
        if (reenrolGapDays !== undefined) {
          _payload[`reenrol_gap_days`] = reenrolGapDays;
        }
        if (campaignRef !== undefined) {
          _payload[`campaign_ref`] = campaignRef;
        }
        if (templateCode !== undefined) {
          _payload[`template_code`] = templateCode;
        }
        if (currentVersion !== undefined) {
          _payload[`current_version`] = currentVersion;
        }
        if (draftVersion !== undefined) {
          _payload[`draft_version`] = draftVersion;
        }
        if (triggerRanOn !== undefined) {
          _payload[`trigger_ran_on`] = triggerRanOn;
        }
        if (enrolledCount !== undefined) {
          _payload[`enrolled_count`] = enrolledCount;
        }
        if (activeCount !== undefined) {
          _payload[`active_count`] = activeCount;
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
registerPromptSpecs(journeysJourneys.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "What the journey is called, e.g. Warenkorb-Erinnerung.", type: "string", required: true },
  { key: "campaignRef", option: "--campaign-ref <campaign-ref>", name: "campaign_ref", description: "The campaign that claimed this journey, written by the campaigns app.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "The currency revenue is stated in.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "What the journey is for.", type: "string", required: false },
  { key: "entry", option: "--entry <entry>", name: "entry", description: "The first step. Defaults to the first listed.", type: "string", required: false },
  { key: "goalConfig", option: "--goal-config <goal-config>", name: "goal_config", description: "The goal: `{ kind: event, topic, match }` or `{ kind: condition, match, rules }`; empty for none. Frozen while live.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "reenrol", option: "--reenrol <reenrol>", name: "reenrol", description: "Whether a person who finished may enter again. Off by default.", type: "boolean", required: false },
  { key: "reenrolGapDays", option: "--reenrol-gap-days <reenrol-gap-days>", name: "reenrol_gap_days", description: "The least number of days between two entries. Empty means the tenant default.", type: "integer", required: false },
  { key: "steps", option: "--steps [steps...]", name: "steps", type: "array", required: false },
  { key: "triggerConfig", option: "--trigger-config <trigger-config>", name: "trigger_config", description: "The trigger: `{ topic, filter: [{ field, op, value }] }` for an event, `{ audience_id | audience_code }`, `{ stage }`, `{ field, offset_days }`. Frozen while live.", type: "any", required: false },
  { key: "triggerKind", option: "--trigger-kind <trigger-kind>", name: "trigger_kind", description: "What enrols: `event`, `audience_join`, `lifecycle_stage` or `date_field`. Frozen while live.", type: "string", required: false, enum: ["event","audience_join","lifecycle_stage","date_field"] },
];
journeysJourneys
  .command(`create`)
  .description(`Creates the journey as a draft with version 1. \`steps\` and \`entry\` may come along; otherwise the draft starts empty. The answer carries \`problems\` — what stands between the draft and going live.`)
  .option(`--name <name>`, `What the journey is called, e.g. Warenkorb-Erinnerung.`)
  .option(`--campaign-ref <campaign-ref>`, `The campaign that claimed this journey, written by the campaigns app.`)
  .option(`--currency <currency>`, `The currency revenue is stated in.`)
  .option(`--description <description>`, `What the journey is for.`)
  .option(`--entry <entry>`, `The first step. Defaults to the first listed.`)
  .option(`--goal-config <goal-config>`, `The goal: \`{ kind: event, topic, match }\` or \`{ kind: condition, match, rules }\`; empty for none. Frozen while live.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(
    `--reenrol [value]`,
    `Whether a person who finished may enter again. Off by default.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--reenrol-gap-days <reenrol-gap-days>`, `The least number of days between two entries. Empty means the tenant default.`, parseInteger)
  .option(`--steps [steps...]`, ``)
  .option(`--trigger-config <trigger-config>`, `The trigger: \`{ topic, filter: [{ field, op, value }] }\` for an event, \`{ audience_id | audience_code }\`, \`{ stage }\`, \`{ field, offset_days }\`. Frozen while live.`)
  .option(`--trigger-kind <trigger-kind>`, `What enrols: \`event\`, \`audience_join\`, \`lifecycle_stage\` or \`date_field\`. Frozen while live.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, campaignRef, currency, description, entry, goalConfig, metadata, reenrol, reenrolGapDays, steps, triggerConfig, triggerKind } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (campaignRef !== undefined) {
          _payload[`campaign_ref`] = campaignRef;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (entry !== undefined) {
          _payload[`entry`] = entry;
        }
        if (goalConfig !== undefined) {
          _payload[`goal_config`] = goalConfig;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (reenrol !== undefined) {
          _payload[`reenrol`] = reenrol;
        }
        if (reenrolGapDays !== undefined) {
          _payload[`reenrol_gap_days`] = reenrolGapDays;
        }
        if (steps !== undefined) {
          _payload[`steps`] = steps;
        }
        if (triggerConfig !== undefined) {
          _payload[`trigger_config`] = triggerConfig;
        }
        if (triggerKind !== undefined) {
          _payload[`trigger_kind`] = triggerKind;
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
registerPromptSpecs(journeysJourneys.commands.at(-1)!, createSpecs, { method: "post" });
journeysJourneys
  .command(`empty-trash`)
  .description(`Every journey in the trash is deleted for good on its own terms. One that something still blocks stays in the trash and is named with its reason, so a partial success says exactly what remained. Not for a storefront contact.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys/trash/empty`;
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
journeysJourneys
  .command(`purge`)
  .description(`What the nightly purge does, callable by hand: every journey in the trash for longer than the tenant trash retention (90 days unless the tenant set another) is deleted for good through the same rules as a second delete. A blocked one stays and carries its reason. When the retention cannot be read, nothing is deleted. Also the cron schedule.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys/trash/purge`;
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
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/journeys", hasLimit: true } },
];
journeysJourneys
  .command(`delete`)
  .description(`The first DELETE moves the journey into the trash: it stays, with everything hanging off it, and counts nowhere until it is restored. Only a draft that never went live goes into the trash; a journey people have been through is refused (\`trash_blocked\`, blocker \`journey_published\`) — archive it instead. A DELETE on a journey already in the trash deletes it for good — refused while something still needs it, and not for a storefront contact.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`journeys-journeys delete`);
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(journeysJourneys.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/journeys", hasLimit: true } },
];
journeysJourneys
  .command(`get`)
  .description(`Read one journey`)
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
        const _apiPath = `/journeys/journeys/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(journeysJourneys.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/journeys", hasLimit: true } },
  { key: "campaignRef", option: "--campaign-ref <campaign-ref>", name: "campaign_ref", description: "The campaign that claimed this journey, written by the campaigns app.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "The currency revenue is stated in.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "What the journey is for.", type: "string", required: false },
  { key: "goalConfig", option: "--goal-config <goal-config>", name: "goal_config", description: "The goal: `{ kind: event, topic, match }` or `{ kind: condition, match, rules }`; empty for none. Frozen while live.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "What the journey is called, e.g. Warenkorb-Erinnerung.", type: "string", required: false },
  { key: "reenrol", option: "--reenrol <reenrol>", name: "reenrol", description: "Whether a person who finished may enter again. Off by default.", type: "boolean", required: false },
  { key: "reenrolGapDays", option: "--reenrol-gap-days <reenrol-gap-days>", name: "reenrol_gap_days", description: "The least number of days between two entries. Empty means the tenant default.", type: "integer", required: false },
  { key: "triggerConfig", option: "--trigger-config <trigger-config>", name: "trigger_config", description: "The trigger: `{ topic, filter: [{ field, op, value }] }` for an event, `{ audience_id | audience_code }`, `{ stage }`, `{ field, offset_days }`. Frozen while live.", type: "any", required: false },
  { key: "triggerKind", option: "--trigger-kind <trigger-kind>", name: "trigger_kind", description: "What enrols: `event`, `audience_join`, `lifecycle_stage` or `date_field`. Frozen while live.", type: "string", required: false, enum: ["event","audience_join","lifecycle_stage","date_field"] },
];
journeysJourneys
  .command(`update`)
  .description(`Name, description, re-enrolment, campaign. The trigger and the goal change only while the journey is not live. Status changes go through publish, pause, resume and archive.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--campaign-ref <campaign-ref>`, `The campaign that claimed this journey, written by the campaigns app.`)
  .option(`--currency <currency>`, `The currency revenue is stated in.`)
  .option(`--description <description>`, `What the journey is for.`)
  .option(`--goal-config <goal-config>`, `The goal: \`{ kind: event, topic, match }\` or \`{ kind: condition, match, rules }\`; empty for none. Frozen while live.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--name <name>`, `What the journey is called, e.g. Warenkorb-Erinnerung.`)
  .option(
    `--reenrol [value]`,
    `Whether a person who finished may enter again. Off by default.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--reenrol-gap-days <reenrol-gap-days>`, `The least number of days between two entries. Empty means the tenant default.`, parseInteger)
  .option(`--trigger-config <trigger-config>`, `The trigger: \`{ topic, filter: [{ field, op, value }] }\` for an event, \`{ audience_id | audience_code }\`, \`{ stage }\`, \`{ field, offset_days }\`. Frozen while live.`)
  .option(`--trigger-kind <trigger-kind>`, `What enrols: \`event\`, \`audience_join\`, \`lifecycle_stage\` or \`date_field\`. Frozen while live.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, campaignRef, currency, description, goalConfig, metadata, name, reenrol, reenrolGapDays, triggerConfig, triggerKind } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (campaignRef !== undefined) {
          _payload[`campaign_ref`] = campaignRef;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (goalConfig !== undefined) {
          _payload[`goal_config`] = goalConfig;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (reenrol !== undefined) {
          _payload[`reenrol`] = reenrol;
        }
        if (reenrolGapDays !== undefined) {
          _payload[`reenrol_gap_days`] = reenrolGapDays;
        }
        if (triggerConfig !== undefined) {
          _payload[`trigger_config`] = triggerConfig;
        }
        if (triggerKind !== undefined) {
          _payload[`trigger_kind`] = triggerKind;
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
registerPromptSpecs(journeysJourneys.commands.at(-1)!, updateSpecs, { method: "put" });
const archiveSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/journeys", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
journeysJourneys
  .command(`archive`)
  .description(`Nobody enters again; everyone still inside leaves with the reason journey_archived (up to 500 at once, the rest with the next runs).`)
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
          archiveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys/{id}/archive`.replace(`{id}`, id);
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
registerPromptSpecs(journeysJourneys.commands.at(-1)!, archiveSpecs, { method: "post" });
const enrolSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/journeys", hasLimit: true } },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "journeysData", option: "--journeys-data <journeys-data>", name: "data", description: "Payload the steps may read, as a trigger would carry it.", type: "object", required: false },
  { key: "email", option: "--email <email>", name: "email", type: "string", required: false },
  { key: "key", option: "--key <key>", name: "key", description: "Makes a resent request enrol once.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", type: "string", required: false },
];
journeysJourneys
  .command(`enrol`)
  .description(`For a test or for support: the person enters the live version now, under the same re-enrolment rules as a trigger.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--journeys-data <journeys-data>`, `Payload the steps may read, as a trigger would carry it.`)
  .option(`--email <email>`, ``)
  .option(`--key <key>`, `Makes a resent request enrol once.`)
  .option(`--market <market>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, contactId, journeysData, email, key, market } = await promptForMissing(
          _options,
          enrolSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys/{id}/enrol`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (journeysData !== undefined) {
          _payload[`data`] = resolveBodyParam(journeysData);
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (key !== undefined) {
          _payload[`key`] = key;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
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
registerPromptSpecs(journeysJourneys.commands.at(-1)!, enrolSpecs, { method: "post" });
const graphSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/journeys", hasLimit: true } },
  { key: "journeysVersion", option: "--journeys-version <journeys-version>", name: "version", description: "`draft` (default: the draft, else the live version), `live`, or a number.", type: "string", required: false },
];
journeysJourneys
  .command(`graph`)
  .description(`What the canvas draws: the steps and edges of one version, the trigger, the goal, and the problems that would refuse publishing.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--journeys-version <journeys-version>`, `\`draft\` (default: the draft, else the live version), \`live\`, or a number.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, journeysVersion } = await promptForMissing(
          _options,
          graphSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys/{id}/graph`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (journeysVersion !== undefined) {
          _payload[`version`] = journeysVersion;
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
registerPromptSpecs(journeysJourneys.commands.at(-1)!, graphSpecs, { method: "get" });
const saveGraphSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/journeys", hasLimit: true } },
  { key: "steps", option: "--steps [steps...]", name: "steps", type: "array", required: true },
  { key: "entry", option: "--entry <entry>", name: "entry", description: "The first step. Defaults to the first listed.", type: "string", required: false },
  { key: "notes", option: "--notes <notes>", name: "notes", description: "What changed.", type: "string", required: false },
];
journeysJourneys
  .command(`save-graph`)
  .description(`Writes the draft, creating it as the next version when the journey has none — a live version is never edited. A graph with problems is saved; publishing refuses it.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--steps [steps...]`, ``)
  .option(`--entry <entry>`, `The first step. Defaults to the first listed.`)
  .option(`--notes <notes>`, `What changed.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, steps, entry, notes } = await promptForMissing(
          _options,
          saveGraphSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys/{id}/graph`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (entry !== undefined) {
          _payload[`entry`] = entry;
        }
        if (notes !== undefined) {
          _payload[`notes`] = notes;
        }
        if (steps !== undefined) {
          _payload[`steps`] = steps;
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
registerPromptSpecs(journeysJourneys.commands.at(-1)!, saveGraphSpecs, { method: "put" });
const pauseSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/journeys", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
journeysJourneys
  .command(`pause`)
  .description(`Nobody enters, nobody moves; everyone stays at their step. Waits that pass during the pause run after resume, in the job's budgeted chunks.`)
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
          pauseSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys/{id}/pause`.replace(`{id}`, id);
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
registerPromptSpecs(journeysJourneys.commands.at(-1)!, pauseSpecs, { method: "post" });
const publishSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/journeys", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
journeysJourneys
  .command(`publish`)
  .description(`Checks the draft, the trigger and the goal; makes the draft the live version and retires the one before. Running enrollments finish on their own version. A paused journey stays paused.`)
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
          publishSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys/{id}/publish`.replace(`{id}`, id);
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
registerPromptSpecs(journeysJourneys.commands.at(-1)!, publishSpecs, { method: "post" });
const reportSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/journeys", hasLimit: true } },
  { key: "journeysVersion", option: "--journeys-version <journeys-version>", name: "version", description: "A version number, `live` (default) or `draft`.", type: "string", required: false },
];
journeysJourneys
  .command(`report`)
  .description(`Per step: waiting now, entered, passed, sent, skipped and why, failed, exited and why, clicked, goal reached, revenue. Per version: enrolled, active, completed, goal reached, exited, failed, conversion. \`step_bars\` and \`exit_bars\` are the same figures as bar-list rows in the language of Accept-Language: who entered each step with the drop-off, and why people left.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--journeys-version <journeys-version>`, `A version number, \`live\` (default) or \`draft\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, journeysVersion } = await promptForMissing(
          _options,
          reportSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys/{id}/report`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (journeysVersion !== undefined) {
          _payload[`version`] = journeysVersion;
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
registerPromptSpecs(journeysJourneys.commands.at(-1)!, reportSpecs, { method: "get" });
const restoreSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/journeys", hasLimit: true } },
];
journeysJourneys
  .command(`restore`)
  .description(`Clears the trash marks on the journey. Its parts were never touched, so they come back with it, in the state it was in. The same right as deleting.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          restoreSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys/{id}/restore`.replace(`{id}`, id);
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
registerPromptSpecs(journeysJourneys.commands.at(-1)!, restoreSpecs, { method: "post" });
const resumeSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/journeys", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
journeysJourneys
  .command(`resume`)
  .description(`Resume a paused journey`)
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
          resumeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys/{id}/resume`.replace(`{id}`, id);
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
registerPromptSpecs(journeysJourneys.commands.at(-1)!, resumeSpecs, { method: "post" });
const runSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/journeys", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
journeysJourneys
  .command(`run`)
  .description(`The step job, limited to one live journey — what the Cockpit offers on a test journey instead of waiting for the next five-minute tick.`)
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
          runSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys/{id}/run`.replace(`{id}`, id);
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
registerPromptSpecs(journeysJourneys.commands.at(-1)!, runSpecs, { method: "post" });
const timelineSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/journeys", hasLimit: true } },
];
journeysJourneys
  .command(`timeline`)
  .description(`Entries and reached goals per day over all versions, in the tenant time zone, from the first entry to the last with every day between, at most the latest 60 days.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          timelineSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/journeys/{id}/timeline`.replace(`{id}`, id);
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
registerPromptSpecs(journeysJourneys.commands.at(-1)!, timelineSpecs, { method: "get" });
