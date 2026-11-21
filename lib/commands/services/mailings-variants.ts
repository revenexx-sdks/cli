import { Command } from "commander";
import { hiddenAliasHelp } from "../../legacy-names.js";
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

export const mailingsVariants = new Command("mailings-variants")
  .description(
    commandDescriptions["mailingsVariants"] ??
      `The A/B test of a mailing: two to five variants of subject, preview text or template, each sent to its share of the audience; the rest receives the winner by open rate, click rate or a pick by hand.`,
  )
  .configureHelp({
    ...hiddenAliasHelp,
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "mailingId", option: "--mailing-id <mailing-id>", name: "mailing_id", description: "Keep only rows whose `mailing_id` equals this.", type: "string", required: false },
  { key: "isWinner", option: "--is-winner <is-winner>", name: "is_winner", description: "Keep only rows whose `is_winner` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
mailingsVariants
  .command(`list`)
  .description(`Filter \`?mailing_id=\` for the variants of one mailing. Each row carries its share, the content it overrides, whether it won and its figures.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--mailing-id <mailing-id>`, `Keep only rows whose \`mailing_id\` equals this.`)
  .option(`--is-winner <is-winner>`, `Keep only rows whose \`is_winner\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, mailingId, isWinner, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/variants`;
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
        if (mailingId !== undefined) {
          _payload[`mailing_id`] = mailingId;
        }
        if (isWinner !== undefined) {
          _payload[`is_winner`] = isWinner;
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
registerPromptSpecs(mailingsVariants.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "mailingId", option: "--mailing-id <mailing-id>", name: "mailing_id", description: "The mailing this row belongs to.", type: "string", required: true },
  { key: "label", option: "--label <label>", name: "label", description: "What the variant is called, e.g. A. Empty on create: the next free letter.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Its place among the variants; on a tie the first wins.", type: "integer", required: false },
  { key: "previewText", option: "--preview-text <preview-text>", name: "preview_text", description: "Its preview text. Empty: the mailing preview text.", type: "string", required: false },
  { key: "share", option: "--share <share>", name: "share", description: "Percent of the audience that receives this variant, 1 to 100; all variants together at most 100. Omitted on create: 20, or what is left.", type: "integer", required: false },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "Its subject line. Empty: the mailing subject.", type: "string", required: false },
  { key: "templateKey", option: "--template-key <template-key>", name: "template_key", description: "Its marketing template. Empty: the mailing template.", type: "string", required: false },
];
mailingsVariants
  .command(`create`)
  .description(`A mailing with two to five variants is an A/B test. A variant overrides the subject, the preview text or the template and takes the rest from the mailing. Only while the mailing is a draft (or cancelled or failed with nobody reached).`)
  .option(`--mailing-id <mailing-id>`, `The mailing this row belongs to.`)
  .option(`--label <label>`, `What the variant is called, e.g. A. Empty on create: the next free letter.`)
  .option(`--position <position>`, `Its place among the variants; on a tie the first wins.`, parseInteger)
  .option(`--preview-text <preview-text>`, `Its preview text. Empty: the mailing preview text.`)
  .option(`--share <share>`, `Percent of the audience that receives this variant, 1 to 100; all variants together at most 100. Omitted on create: 20, or what is left.`, parseInteger)
  .option(`--subject <subject>`, `Its subject line. Empty: the mailing subject.`)
  .option(`--template-key <template-key>`, `Its marketing template. Empty: the mailing template.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { mailingId, label, position, previewText, share, subject, templateKey } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/variants`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (mailingId !== undefined) {
          _payload[`mailing_id`] = mailingId;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (previewText !== undefined) {
          _payload[`preview_text`] = previewText;
        }
        if (share !== undefined) {
          _payload[`share`] = share;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
        }
        if (templateKey !== undefined) {
          _payload[`template_key`] = templateKey;
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
registerPromptSpecs(mailingsVariants.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/variants", hasLimit: true } },
];
mailingsVariants
  .command(`delete`)
  .description(`Only while the mailing is open. A mailing left with one variant does not pass the checklist; with none it is a mailing without a test.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`mailings-variants delete`);
        const _client = await sdkForProject();
        const _apiPath = `/mailings/variants/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsVariants.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/variants", hasLimit: true } },
];
mailingsVariants
  .command(`get`)
  .description(`Read one variant`)
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
        const _apiPath = `/mailings/variants/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsVariants.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/variants", hasLimit: true } },
  { key: "label", option: "--label <label>", name: "label", description: "What the variant is called, e.g. A. Empty on create: the next free letter.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Its place among the variants; on a tie the first wins.", type: "integer", required: false },
  { key: "previewText", option: "--preview-text <preview-text>", name: "preview_text", description: "Its preview text. Empty: the mailing preview text.", type: "string", required: false },
  { key: "share", option: "--share <share>", name: "share", description: "Percent of the audience that receives this variant, 1 to 100; all variants together at most 100. Omitted on create: 20, or what is left.", type: "integer", required: false },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "Its subject line. Empty: the mailing subject.", type: "string", required: false },
  { key: "templateKey", option: "--template-key <template-key>", name: "template_key", description: "Its marketing template. Empty: the mailing template.", type: "string", required: false },
];
mailingsVariants
  .command(`update`)
  .description(`One field or the whole row as read back: id, mailing_id, figures and timestamps are ignored. Only while the mailing is open.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--label <label>`, `What the variant is called, e.g. A. Empty on create: the next free letter.`)
  .option(`--position <position>`, `Its place among the variants; on a tie the first wins.`, parseInteger)
  .option(`--preview-text <preview-text>`, `Its preview text. Empty: the mailing preview text.`)
  .option(`--share <share>`, `Percent of the audience that receives this variant, 1 to 100; all variants together at most 100. Omitted on create: 20, or what is left.`, parseInteger)
  .option(`--subject <subject>`, `Its subject line. Empty: the mailing subject.`)
  .option(`--template-key <template-key>`, `Its marketing template. Empty: the mailing template.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, label, position, previewText, share, subject, templateKey } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/variants/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (previewText !== undefined) {
          _payload[`preview_text`] = previewText;
        }
        if (share !== undefined) {
          _payload[`share`] = share;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
        }
        if (templateKey !== undefined) {
          _payload[`template_key`] = templateKey;
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
registerPromptSpecs(mailingsVariants.commands.at(-1)!, updateSpecs, { method: "put" });
const winSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/variants", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
mailingsVariants
  .command(`win`)
  .description(`While the variants go out or the test waits, under any rule: the variant becomes the winner, decided by hand, and the rest of the audience receives it with the next send run.`)
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
          winSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/variants/{id}/win`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsVariants.commands.at(-1)!, winSpecs, { method: "post" });
