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
  confirmDestructive,
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const campaignsTasks = new Command("campaigns-tasks")
  .description(
    commandDescriptions["campaignsTasks"] ??
      `Tasks on a campaign with an assignee and a due date. They appear on the calendar on the day they are due.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "campaignId", option: "--campaign-id <campaign-id>", name: "campaign_id", description: "Keep only rows whose `campaign_id` equals this.", type: "string", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "Keep only rows whose `title` equals this.", type: "string", required: false },
  { key: "notes", option: "--notes <notes>", name: "notes", description: "Keep only rows whose `notes` equals this.", type: "string", required: false },
  { key: "assignee", option: "--assignee <assignee>", name: "assignee", description: "Keep only rows whose `assignee` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
campaignsTasks
  .command(`list`)
  .description(`List campaign tasks`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--campaign-id <campaign-id>`, `Keep only rows whose \`campaign_id\` equals this.`)
  .option(`--title <title>`, `Keep only rows whose \`title\` equals this.`)
  .option(`--notes <notes>`, `Keep only rows whose \`notes\` equals this.`)
  .option(`--assignee <assignee>`, `Keep only rows whose \`assignee\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, campaignId, title, notes, assignee, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/tasks`;
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
        if (campaignId !== undefined) {
          _payload[`campaign_id`] = campaignId;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (notes !== undefined) {
          _payload[`notes`] = notes;
        }
        if (assignee !== undefined) {
          _payload[`assignee`] = assignee;
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
registerPromptSpecs(campaignsTasks.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "campaignId", option: "--campaign-id <campaign-id>", name: "campaign_id", description: "The campaign this row belongs to.", type: "string", required: true },
  { key: "title", option: "--title <title>", name: "title", description: "What has to be done.", type: "string", required: true },
  { key: "assignee", option: "--assignee <assignee>", name: "assignee", description: "Who does it: a name, an email or a sales-rep code.", type: "string", required: false },
  { key: "doneAt", option: "--done-at <done-at>", name: "done_at", description: "When it was ticked off. Empty while open.", type: "string", required: false },
  { key: "dueAt", option: "--due-at <due-at>", name: "due_at", description: "When it is due. A task with a due date appears on the calendar.", type: "string", required: false },
  { key: "notes", option: "--notes <notes>", name: "notes", description: "Anything else the assignee needs.", type: "string", required: false },
];
campaignsTasks
  .command(`create`)
  .description(`Add a task to a campaign`)
  .option(`--campaign-id <campaign-id>`, `The campaign this row belongs to.`)
  .option(`--title <title>`, `What has to be done.`)
  .option(`--assignee <assignee>`, `Who does it: a name, an email or a sales-rep code.`)
  .option(`--done-at <done-at>`, `When it was ticked off. Empty while open.`)
  .option(`--due-at <due-at>`, `When it is due. A task with a due date appears on the calendar.`)
  .option(`--notes <notes>`, `Anything else the assignee needs.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { campaignId, title, assignee, doneAt, dueAt, notes } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/tasks`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (assignee !== undefined) {
          _payload[`assignee`] = assignee;
        }
        if (campaignId !== undefined) {
          _payload[`campaign_id`] = campaignId;
        }
        if (doneAt !== undefined) {
          _payload[`done_at`] = doneAt;
        }
        if (dueAt !== undefined) {
          _payload[`due_at`] = dueAt;
        }
        if (notes !== undefined) {
          _payload[`notes`] = notes;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
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
registerPromptSpecs(campaignsTasks.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/tasks", hasLimit: true } },
];
campaignsTasks
  .command(`delete`)
  .description(`Delete a task`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`campaigns-tasks delete`);
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/tasks/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(campaignsTasks.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/tasks", hasLimit: true } },
];
campaignsTasks
  .command(`get`)
  .description(`Read one task`)
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
        const _apiPath = `/campaigns/tasks/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(campaignsTasks.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/tasks", hasLimit: true } },
  { key: "assignee", option: "--assignee <assignee>", name: "assignee", description: "Who does it: a name, an email or a sales-rep code.", type: "string", required: false },
  { key: "campaignId", option: "--campaign-id <campaign-id>", name: "campaign_id", description: "The campaign this row belongs to.", type: "string", required: false },
  { key: "doneAt", option: "--done-at <done-at>", name: "done_at", description: "When it was ticked off. Empty while open.", type: "string", required: false },
  { key: "dueAt", option: "--due-at <due-at>", name: "due_at", description: "When it is due. A task with a due date appears on the calendar.", type: "string", required: false },
  { key: "notes", option: "--notes <notes>", name: "notes", description: "Anything else the assignee needs.", type: "string", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "What has to be done.", type: "string", required: false },
];
campaignsTasks
  .command(`update`)
  .description(`Correct a task`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--assignee <assignee>`, `Who does it: a name, an email or a sales-rep code.`)
  .option(`--campaign-id <campaign-id>`, `The campaign this row belongs to.`)
  .option(`--done-at <done-at>`, `When it was ticked off. Empty while open.`)
  .option(`--due-at <due-at>`, `When it is due. A task with a due date appears on the calendar.`)
  .option(`--notes <notes>`, `Anything else the assignee needs.`)
  .option(`--title <title>`, `What has to be done.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, assignee, campaignId, doneAt, dueAt, notes, title } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/tasks/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (assignee !== undefined) {
          _payload[`assignee`] = assignee;
        }
        if (campaignId !== undefined) {
          _payload[`campaign_id`] = campaignId;
        }
        if (doneAt !== undefined) {
          _payload[`done_at`] = doneAt;
        }
        if (dueAt !== undefined) {
          _payload[`due_at`] = dueAt;
        }
        if (notes !== undefined) {
          _payload[`notes`] = notes;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
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
registerPromptSpecs(campaignsTasks.commands.at(-1)!, updateSpecs, { method: "put" });
const completeSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/tasks", hasLimit: true } },
];
campaignsTasks
  .command(`complete`)
  .description(`Stamps done_at now. A task already done keeps its first stamp.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          completeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/tasks/{id}/complete`.replace(`{id}`, id);
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
registerPromptSpecs(campaignsTasks.commands.at(-1)!, completeSpecs, { method: "post" });
const reopenSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/tasks", hasLimit: true } },
];
campaignsTasks
  .command(`reopen`)
  .description(`Open a task again`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          reopenSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/tasks/{id}/reopen`.replace(`{id}`, id);
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
registerPromptSpecs(campaignsTasks.commands.at(-1)!, reopenSpecs, { method: "post" });
