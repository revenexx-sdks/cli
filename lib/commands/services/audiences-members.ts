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

export const audiencesMembers = new Command("audiences-members")
  .description(
    commandDescriptions["audiencesMembers"] ??
      `Who is in an audience, and since when. Members are read as a stable keyset page for a send; one person's audiences are answered for the storefront; static audiences take imports and hand-picked contacts. Every join and every leave is kept as history and published on the bus.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const compositionSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true },
];
audiencesMembers
  .command(`composition`)
  .description(`Members per market (largest first, at most eight named, the rest summed, members without a market last) and per source (rule, import, by hand), each with its share. Labels follow Accept-Language (de or en).`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          compositionSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/audiences/{id}/composition`.replace(`{id}`, id);
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
registerPromptSpecs(audiencesMembers.commands.at(-1)!, compositionSpecs, { method: "get" });
const audiencesAudiencesImportSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true },
  { key: "emails", option: "--emails <emails>", name: "emails", description: "Addresses separated by lines, commas or semicolons — what a form field sends. Used when `rows` is absent.", type: "string", required: false },
  { key: "filename", option: "--filename <filename>", name: "filename", type: "string", required: false },
  { key: "rows", option: "--rows [rows...]", name: "rows", type: "array", required: false },
];
audiencesMembers
  .command(`audiences-audiences-import`)
  .description(`Each row names a contact id or a mail address of an existing contact. A row that matches nobody is refused with its reason rather than creating a person. At most 1000 rows per call.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--emails <emails>`, `Addresses separated by lines, commas or semicolons — what a form field sends. Used when \`rows\` is absent.`)
  .option(`--filename <filename>`, ``)
  .option(`--rows [rows...]`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, emails, filename, rows } = await promptForMissing(
          _options,
          audiencesAudiencesImportSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/audiences/{id}/import`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (emails !== undefined) {
          _payload[`emails`] = emails;
        }
        if (filename !== undefined) {
          _payload[`filename`] = filename;
        }
        if (rows !== undefined) {
          _payload[`rows`] = rows;
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
registerPromptSpecs(audiencesMembers.commands.at(-1)!, audiencesAudiencesImportSpecs, { method: "post" });
const readSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true },
  { key: "cursor", option: "--cursor <cursor>", name: "cursor", description: "The `next_cursor` of the previous page. Omitted: the first page.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 200, max 500).", type: "integer", required: false },
];
audiencesMembers
  .command(`read`)
  .description(`The page a send reads: members in contact-id order after \`cursor\`. Hand \`next_cursor\` back until \`done\`. Stable while a recompute runs — a page never repeats or skips a member who stays.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--cursor <cursor>`, `The \`next_cursor\` of the previous page. Omitted: the first page.`)
  .option(`--limit <limit>`, `Page size (default 200, max 500).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, cursor, limit } = await promptForMissing(
          _options,
          readSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/audiences/{id}/members`.replace(`{id}`, id);
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
registerPromptSpecs(audiencesMembers.commands.at(-1)!, readSpecs, { method: "get" });
const addSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "contactIds", option: "--contact-ids [contact-ids...]", name: "contact_ids", type: "array", required: false },
];
audiencesMembers
  .command(`add`)
  .description(`Hand-picked members — also what a journey's "add to audience" step calls. At most 500 contacts per call; a contact that does not exist is refused with its reason.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--contact-ids [contact-ids...]`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, contactId, contactIds } = await promptForMissing(
          _options,
          addSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/audiences/{id}/members`.replace(`{id}`, id);
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
        if (contactIds !== undefined) {
          _payload[`contact_ids`] = contactIds;
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
registerPromptSpecs(audiencesMembers.commands.at(-1)!, addSpecs, { method: "post" });
const removeSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The contact to take out.", type: "string", required: true, resource: { listPath: "/audiences/audiences/{id}/members", hasLimit: true } },
];
audiencesMembers
  .command(`remove`)
  .description(`Take one contact out of a static audience`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--contact-id <contact-id>`, `The contact to take out.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, contactId } = await promptForMissing(
          _options,
          removeSpecs,
          _command,
        );
        await confirmDestructive(`audiences-members remove`);
        const _client = await sdkForProject();
        const _apiPath = `/audiences/audiences/{id}/members/{contact_id}`.replace(`{id}`, id).replace(`{contact_id}`, contactId);
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
registerPromptSpecs(audiencesMembers.commands.at(-1)!, removeSpecs, { method: "delete", destructive: true });
const timelineSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true },
];
audiencesMembers
  .command(`timeline`)
  .description(`Joins and leaves per day in Europe/Berlin, from the first change to the last with every day between, at most the latest 90 days. Counted from the join/leave history; \`capped\` says the history was longer than one read covers.`)
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
        const _apiPath = `/audiences/audiences/{id}/timeline`.replace(`{id}`, id);
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
registerPromptSpecs(audiencesMembers.commands.at(-1)!, timelineSpecs, { method: "get" });
const audiencesImportsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "audienceId", option: "--audience-id <audience-id>", name: "audience_id", description: "Keep only rows whose `audience_id` equals this.", type: "string", required: false },
  { key: "filename", option: "--filename <filename>", name: "filename", description: "Keep only rows whose `filename` equals this.", type: "string", required: false },
  { key: "rows", option: "--rows <rows>", name: "rows", description: "Keep only rows whose `rows` equals this.", type: "string", required: false },
  { key: "accepted", option: "--accepted <accepted>", name: "accepted", description: "Keep only rows whose `accepted` equals this.", type: "string", required: false },
  { key: "rejected", option: "--rejected <rejected>", name: "rejected", description: "Keep only rows whose `rejected` equals this.", type: "string", required: false },
  { key: "state", option: "--state <state>", name: "state", description: "Keep only rows whose `state` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
audiencesMembers
  .command(`audiences-imports-list`)
  .description(`Every import into a static audience, with its counts and refused rows.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--audience-id <audience-id>`, `Keep only rows whose \`audience_id\` equals this.`)
  .option(`--filename <filename>`, `Keep only rows whose \`filename\` equals this.`)
  .option(`--rows <rows>`, `Keep only rows whose \`rows\` equals this.`)
  .option(`--accepted <accepted>`, `Keep only rows whose \`accepted\` equals this.`)
  .option(`--rejected <rejected>`, `Keep only rows whose \`rejected\` equals this.`)
  .option(`--state <state>`, `Keep only rows whose \`state\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, audienceId, filename, rows, accepted, rejected, state, filter } = await promptForMissing(
          _options,
          audiencesImportsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/imports`;
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
        if (filename !== undefined) {
          _payload[`filename`] = filename;
        }
        if (rows !== undefined) {
          _payload[`rows`] = rows;
        }
        if (accepted !== undefined) {
          _payload[`accepted`] = accepted;
        }
        if (rejected !== undefined) {
          _payload[`rejected`] = rejected;
        }
        if (state !== undefined) {
          _payload[`state`] = state;
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
registerPromptSpecs(audiencesMembers.commands.at(-1)!, audiencesImportsListSpecs, { method: "get" });
const audiencesImportsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/audiences/imports", hasLimit: true } },
];
audiencesMembers
  .command(`audiences-imports-get`)
  .description(`Read one import`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          audiencesImportsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/imports/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(audiencesMembers.commands.at(-1)!, audiencesImportsGetSpecs, { method: "get" });
const audiencesMemberEventsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "audienceId", option: "--audience-id <audience-id>", name: "audience_id", description: "Keep only rows whose `audience_id` equals this.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Keep only rows whose `contact_id` equals this.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Keep only rows whose `kind` equals this.", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Keep only rows whose `source` equals this.", type: "string", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Keep only rows whose `reason` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
audiencesMembers
  .command(`audiences-member-events-list`)
  .description(`The join/leave history; filter \`?audience_id=\` or \`?contact_id=\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--audience-id <audience-id>`, `Keep only rows whose \`audience_id\` equals this.`)
  .option(`--contact-id <contact-id>`, `Keep only rows whose \`contact_id\` equals this.`)
  .option(`--kind <kind>`, `Keep only rows whose \`kind\` equals this.`)
  .option(`--source <source>`, `Keep only rows whose \`source\` equals this.`)
  .option(`--reason <reason>`, `Keep only rows whose \`reason\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, audienceId, contactId, kind, source, reason, filter } = await promptForMissing(
          _options,
          audiencesMemberEventsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/member-events`;
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
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
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
registerPromptSpecs(audiencesMembers.commands.at(-1)!, audiencesMemberEventsListSpecs, { method: "get" });
const audiencesMemberEventsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/audiences/member-events", hasLimit: true } },
];
audiencesMembers
  .command(`audiences-member-events-get`)
  .description(`Read one join or leave`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          audiencesMemberEventsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/member-events/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(audiencesMembers.commands.at(-1)!, audiencesMemberEventsGetSpecs, { method: "get" });
const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "audienceId", option: "--audience-id <audience-id>", name: "audience_id", description: "Keep only rows whose `audience_id` equals this.", type: "string", required: false },
  { key: "audienceCode", option: "--audience-code <audience-code>", name: "audience_code", description: "Keep only rows whose `audience_code` equals this.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Keep only rows whose `contact_id` equals this.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Keep only rows whose `organization_id` equals this.", type: "string", required: false },
  { key: "email", option: "--email <email>", name: "email", description: "Keep only rows whose `email` equals this.", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "Keep only rows whose `locale` equals this.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "Keep only rows whose `market` equals this.", type: "string", required: false },
  { key: "eligible", option: "--eligible <eligible>", name: "eligible", description: "Keep only rows whose `eligible` equals this.", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Keep only rows whose `source` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
audiencesMembers
  .command(`list`)
  .description(`Membership rows across audiences; filter \`?audience_id=\` or \`?contact_id=\`. For a send, read GET /audiences/audiences/{id}/members instead.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--audience-id <audience-id>`, `Keep only rows whose \`audience_id\` equals this.`)
  .option(`--audience-code <audience-code>`, `Keep only rows whose \`audience_code\` equals this.`)
  .option(`--contact-id <contact-id>`, `Keep only rows whose \`contact_id\` equals this.`)
  .option(`--organization-id <organization-id>`, `Keep only rows whose \`organization_id\` equals this.`)
  .option(`--email <email>`, `Keep only rows whose \`email\` equals this.`)
  .option(`--locale <locale>`, `Keep only rows whose \`locale\` equals this.`)
  .option(`--market <market>`, `Keep only rows whose \`market\` equals this.`)
  .option(`--eligible <eligible>`, `Keep only rows whose \`eligible\` equals this.`)
  .option(`--source <source>`, `Keep only rows whose \`source\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, audienceId, audienceCode, contactId, organizationId, email, locale, market, eligible, source, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/members`;
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
        if (audienceCode !== undefined) {
          _payload[`audience_code`] = audienceCode;
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
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (eligible !== undefined) {
          _payload[`eligible`] = eligible;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
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
registerPromptSpecs(audiencesMembers.commands.at(-1)!, listSpecs, { method: "get" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/audiences/members", hasLimit: true } },
];
audiencesMembers
  .command(`get`)
  .description(`Read one membership row`)
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
        const _apiPath = `/audiences/members/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(audiencesMembers.commands.at(-1)!, getSpecs, { method: "get" });
const membershipsSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: true },
];
audiencesMembers
  .command(`memberships`)
  .description(`For the storefront's personalisation: the active audiences one logged-in contact belongs to, by id and by code.`)
  .option(`--contact-id <contact-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId } = await promptForMissing(
          _options,
          membershipsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/memberships`;
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
registerPromptSpecs(audiencesMembers.commands.at(-1)!, membershipsSpecs, { method: "post" });
