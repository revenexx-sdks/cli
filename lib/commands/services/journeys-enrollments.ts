import { Command } from "commander";
import { resolveBodyParam } from "../../utils.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  cliConfig,
  parse,
  parseInteger,
} from "../../parser.js";
import {
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const journeysEnrollments = new Command("journeys-enrollments")
  .description(
    commandDescriptions["journeysEnrollments"] ??
      `One person's passage through one version: the current step, when it is due, the state and why it ended. Read-only except for taking a person out.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "journeyId", option: "--journey-id <journey-id>", name: "journey_id", description: "Keep only rows whose `journey_id` equals this.", type: "string", required: false },
  { key: "enrollmentsVersion", option: "--enrollments-version <enrollments-version>", name: "version", description: "Keep only rows whose `version` equals this.", type: "string", required: false },
  { key: "journeyVersionId", option: "--journey-version-id <journey-version-id>", name: "journey_version_id", description: "Keep only rows whose `journey_version_id` equals this.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Keep only rows whose `contact_id` equals this.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Keep only rows whose `organization_id` equals this.", type: "string", required: false },
  { key: "email", option: "--email <email>", name: "email", description: "Keep only rows whose `email` equals this.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", description: "Keep only rows whose `phone` equals this.", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "Keep only rows whose `locale` equals this.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "Keep only rows whose `market` equals this.", type: "string", required: false },
  { key: "currentStep", option: "--current-step <current-step>", name: "current_step", description: "Keep only rows whose `current_step` equals this.", type: "string", required: false },
  { key: "state", option: "--state <state>", name: "state", description: "Keep only rows whose `state` equals this.", type: "string", required: false },
  { key: "exitReason", option: "--exit-reason <exit-reason>", name: "exit_reason", description: "Keep only rows whose `exit_reason` equals this.", type: "string", required: false },
  { key: "triggerEventId", option: "--trigger-event-id <trigger-event-id>", name: "trigger_event_id", description: "Keep only rows whose `trigger_event_id` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
journeysEnrollments
  .command(`list`)
  .description(`Filter \`?journey_id=\`, \`?state=\`, \`?contact_id=\`, \`?current_step=\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--journey-id <journey-id>`, `Keep only rows whose \`journey_id\` equals this.`)
  .option(`--enrollments-version <enrollments-version>`, `Keep only rows whose \`version\` equals this.`)
  .option(`--journey-version-id <journey-version-id>`, `Keep only rows whose \`journey_version_id\` equals this.`)
  .option(`--contact-id <contact-id>`, `Keep only rows whose \`contact_id\` equals this.`)
  .option(`--organization-id <organization-id>`, `Keep only rows whose \`organization_id\` equals this.`)
  .option(`--email <email>`, `Keep only rows whose \`email\` equals this.`)
  .option(`--phone <phone>`, `Keep only rows whose \`phone\` equals this.`)
  .option(`--locale <locale>`, `Keep only rows whose \`locale\` equals this.`)
  .option(`--market <market>`, `Keep only rows whose \`market\` equals this.`)
  .option(`--current-step <current-step>`, `Keep only rows whose \`current_step\` equals this.`)
  .option(`--state <state>`, `Keep only rows whose \`state\` equals this.`)
  .option(`--exit-reason <exit-reason>`, `Keep only rows whose \`exit_reason\` equals this.`)
  .option(`--trigger-event-id <trigger-event-id>`, `Keep only rows whose \`trigger_event_id\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, journeyId, enrollmentsVersion, journeyVersionId, contactId, organizationId, email, phone, locale, market, currentStep, state, exitReason, triggerEventId, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/enrollments`;
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
        if (journeyId !== undefined) {
          _payload[`journey_id`] = journeyId;
        }
        if (enrollmentsVersion !== undefined) {
          _payload[`version`] = enrollmentsVersion;
        }
        if (journeyVersionId !== undefined) {
          _payload[`journey_version_id`] = journeyVersionId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (currentStep !== undefined) {
          _payload[`current_step`] = currentStep;
        }
        if (state !== undefined) {
          _payload[`state`] = state;
        }
        if (exitReason !== undefined) {
          _payload[`exit_reason`] = exitReason;
        }
        if (triggerEventId !== undefined) {
          _payload[`trigger_event_id`] = triggerEventId;
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
registerPromptSpecs(journeysEnrollments.commands.at(-1)!, listSpecs, { method: "get" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/enrollments", hasLimit: true } },
];
journeysEnrollments
  .command(`get`)
  .description(`Read one enrollment`)
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
        const _apiPath = `/journeys/enrollments/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(journeysEnrollments.commands.at(-1)!, getSpecs, { method: "get" });
const exitSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/enrollments", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
journeysEnrollments
  .command(`exit`)
  .description(`Take a person out of a journey`)
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
          exitSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/enrollments/{id}/exit`.replace(`{id}`, id);
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
registerPromptSpecs(journeysEnrollments.commands.at(-1)!, exitSpecs, { method: "post" });
