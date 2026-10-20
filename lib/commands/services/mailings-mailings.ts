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

export const mailingsMailings = new Command("mailings-mailings")
  .description(
    commandDescriptions["mailingsMailings"] ??
      `The mailings: one planned send of one marketing mail to one audience under one subscription type. A draft is edited, checked against the checklist, scheduled, sent by the pipeline and read back; once it reached recipients it keeps its content.`,
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
  { key: "state", option: "--state <state>", name: "state", description: "Keep only rows whose `state` equals this.", type: "string", required: false },
  { key: "folder", option: "--folder <folder>", name: "folder", description: "Keep only rows whose `folder` equals this.", type: "string", required: false },
  { key: "campaignRef", option: "--campaign-ref <campaign-ref>", name: "campaign_ref", description: "Keep only rows whose `campaign_ref` equals this.", type: "string", required: false },
  { key: "audienceId", option: "--audience-id <audience-id>", name: "audience_id", description: "Keep only rows whose `audience_id` equals this.", type: "string", required: false },
  { key: "subscriptionType", option: "--subscription-type <subscription-type>", name: "subscription_type", description: "Keep only rows whose `subscription_type` equals this.", type: "string", required: false },
  { key: "templateKey", option: "--template-key <template-key>", name: "template_key", description: "Keep only rows whose `template_key` equals this.", type: "string", required: false },
  { key: "starter", option: "--starter <starter>", name: "starter", description: "Keep only rows whose `starter` equals this.", type: "string", required: false },
  { key: "timezoneMode", option: "--timezone-mode <timezone-mode>", name: "timezone_mode", description: "Keep only rows whose `timezone_mode` equals this.", type: "string", required: false },
  { key: "duplicatedFromId", option: "--duplicated-from-id <duplicated-from-id>", name: "duplicated_from_id", description: "Keep only rows whose `duplicated_from_id` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
mailingsMailings
  .command(`list`)
  .description(`Every mailing of this tenant. Filter \`?folder=drafts|scheduled|sent|archived\` for the four views, \`?campaign_ref=\` for the mailings a campaign claimed, \`?state=\` for one state.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--trashed <trashed>`, `\`exclude\` (default) leaves the trash out, \`only\` is the trash itself, \`include\` lists both.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--state <state>`, `Keep only rows whose \`state\` equals this.`)
  .option(`--folder <folder>`, `Keep only rows whose \`folder\` equals this.`)
  .option(`--campaign-ref <campaign-ref>`, `Keep only rows whose \`campaign_ref\` equals this.`)
  .option(`--audience-id <audience-id>`, `Keep only rows whose \`audience_id\` equals this.`)
  .option(`--subscription-type <subscription-type>`, `Keep only rows whose \`subscription_type\` equals this.`)
  .option(`--template-key <template-key>`, `Keep only rows whose \`template_key\` equals this.`)
  .option(`--starter <starter>`, `Keep only rows whose \`starter\` equals this.`)
  .option(`--timezone-mode <timezone-mode>`, `Keep only rows whose \`timezone_mode\` equals this.`)
  .option(`--duplicated-from-id <duplicated-from-id>`, `Keep only rows whose \`duplicated_from_id\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, trashed, id, state, folder, campaignRef, audienceId, subscriptionType, templateKey, starter, timezoneMode, duplicatedFromId, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings`;
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
        if (state !== undefined) {
          _payload[`state`] = state;
        }
        if (folder !== undefined) {
          _payload[`folder`] = folder;
        }
        if (campaignRef !== undefined) {
          _payload[`campaign_ref`] = campaignRef;
        }
        if (audienceId !== undefined) {
          _payload[`audience_id`] = audienceId;
        }
        if (subscriptionType !== undefined) {
          _payload[`subscription_type`] = subscriptionType;
        }
        if (templateKey !== undefined) {
          _payload[`template_key`] = templateKey;
        }
        if (starter !== undefined) {
          _payload[`starter`] = starter;
        }
        if (timezoneMode !== undefined) {
          _payload[`timezone_mode`] = timezoneMode;
        }
        if (duplicatedFromId !== undefined) {
          _payload[`duplicated_from_id`] = duplicatedFromId;
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
registerPromptSpecs(mailingsMailings.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "What the marketer calls the mailing, e.g. Black Week Newsletter. Not shown to recipients.", type: "string", required: true },
  { key: "audienceId", option: "--audience-id <audience-id>", name: "audience_id", description: "The audiences app audience the mailing goes to.", type: "string", required: false },
  { key: "campaignRef", option: "--campaign-ref <campaign-ref>", name: "campaign_ref", description: "The campaign that claimed this mailing. Written by the campaigns app; filter `?campaign_ref=` to list a campaign mails.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Three-letter currency code, e.g. EUR.", type: "string", required: false },
  { key: "excludeAudienceIds", option: "--exclude-audience-ids [exclude-audience-ids...]", name: "exclude_audience_ids", description: "Audiences whose members do not receive the mailing, as a list of ids (at most 10).", type: "array", required: false },
  { key: "graymail", option: "--graymail <graymail>", name: "graymail", description: "Hold back recipients who received many marketing mails without a click. On by default.", type: "boolean", required: false },
  { key: "graymailSends", option: "--graymail-sends <graymail-sends>", name: "graymail_sends", description: "Overrides the graymail threshold of the settings for this mailing.", type: "integer", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "previewText", option: "--preview-text <preview-text>", name: "preview_text", description: "The line mail clients show after the subject. At most 200 characters.", type: "string", required: false },
  { key: "replyTo", option: "--reply-to <reply-to>", name: "reply_to", description: "Where replies go, if not to the sender.", type: "string", required: false },
  { key: "sendAt", option: "--send-at <send-at>", name: "send_at", description: "When the mailing goes out. Empty: as soon as it is scheduled.", type: "string", required: false },
  { key: "sender", option: "--sender <sender>", name: "sender", description: "The From address. Empty: the market default sender from the settings.", type: "string", required: false },
  { key: "senderName", option: "--sender-name <sender-name>", name: "sender_name", description: "The name shown next to the From address.", type: "string", required: false },
  { key: "starter", option: "--starter <starter>", name: "starter", description: "Where the design started from: blank, simple, newsletter or promotion.", type: "string", required: false, enum: ["blank","simple","newsletter","promotion"] },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "The subject line recipients see. At most 150 characters.", type: "string", required: false },
  { key: "subscriptionType", option: "--subscription-type <subscription-type>", name: "subscription_type", description: "The marketing-consents subscription type code recipients must be allowed for.", type: "string", required: false },
  { key: "templateKey", option: "--template-key <template-key>", name: "template_key", description: "The key of the sequencer template of message class marketing the mailing renders.", type: "string", required: false },
  { key: "timezoneMode", option: "--timezone-mode <timezone-mode>", name: "timezone_mode", description: "`tenant`: everybody at send_at. `recipient`: send_at read as wall-clock time and applied in each recipient market time zone.", type: "string", required: false, enum: ["tenant","recipient"] },
  { key: "voucherBatchId", option: "--voucher-batch-id <voucher-batch-id>", name: "voucher_batch_id", description: "The promotions voucher batch every recipient draws one code from at send time.", type: "string", required: false },
];
mailingsMailings
  .command(`create`)
  .description(`A new draft. The sender and its name default to the market settings when not given.`)
  .option(`--name <name>`, `What the marketer calls the mailing, e.g. Black Week Newsletter. Not shown to recipients.`)
  .option(`--audience-id <audience-id>`, `The audiences app audience the mailing goes to.`)
  .option(`--campaign-ref <campaign-ref>`, `The campaign that claimed this mailing. Written by the campaigns app; filter \`?campaign_ref=\` to list a campaign mails.`)
  .option(`--currency <currency>`, `Three-letter currency code, e.g. EUR.`)
  .option(`--exclude-audience-ids [exclude-audience-ids...]`, `Audiences whose members do not receive the mailing, as a list of ids (at most 10).`)
  .option(
    `--graymail [value]`,
    `Hold back recipients who received many marketing mails without a click. On by default.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--graymail-sends <graymail-sends>`, `Overrides the graymail threshold of the settings for this mailing.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--preview-text <preview-text>`, `The line mail clients show after the subject. At most 200 characters.`)
  .option(`--reply-to <reply-to>`, `Where replies go, if not to the sender.`)
  .option(`--send-at <send-at>`, `When the mailing goes out. Empty: as soon as it is scheduled.`)
  .option(`--sender <sender>`, `The From address. Empty: the market default sender from the settings.`)
  .option(`--sender-name <sender-name>`, `The name shown next to the From address.`)
  .option(`--starter <starter>`, `Where the design started from: blank, simple, newsletter or promotion.`)
  .option(`--subject <subject>`, `The subject line recipients see. At most 150 characters.`)
  .option(`--subscription-type <subscription-type>`, `The marketing-consents subscription type code recipients must be allowed for.`)
  .option(`--template-key <template-key>`, `The key of the sequencer template of message class marketing the mailing renders.`)
  .option(`--timezone-mode <timezone-mode>`, `\`tenant\`: everybody at send_at. \`recipient\`: send_at read as wall-clock time and applied in each recipient market time zone.`)
  .option(`--voucher-batch-id <voucher-batch-id>`, `The promotions voucher batch every recipient draws one code from at send time.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, audienceId, campaignRef, currency, excludeAudienceIds, graymail, graymailSends, metadata, previewText, replyTo, sendAt, sender, senderName, starter, subject, subscriptionType, templateKey, timezoneMode, voucherBatchId } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings`;
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
        if (campaignRef !== undefined) {
          _payload[`campaign_ref`] = campaignRef;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (excludeAudienceIds !== undefined) {
          _payload[`exclude_audience_ids`] = excludeAudienceIds;
        }
        if (graymail !== undefined) {
          _payload[`graymail`] = graymail;
        }
        if (graymailSends !== undefined) {
          _payload[`graymail_sends`] = graymailSends;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (previewText !== undefined) {
          _payload[`preview_text`] = previewText;
        }
        if (replyTo !== undefined) {
          _payload[`reply_to`] = replyTo;
        }
        if (sendAt !== undefined) {
          _payload[`send_at`] = sendAt;
        }
        if (sender !== undefined) {
          _payload[`sender`] = sender;
        }
        if (senderName !== undefined) {
          _payload[`sender_name`] = senderName;
        }
        if (starter !== undefined) {
          _payload[`starter`] = starter;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
        }
        if (subscriptionType !== undefined) {
          _payload[`subscription_type`] = subscriptionType;
        }
        if (templateKey !== undefined) {
          _payload[`template_key`] = templateKey;
        }
        if (timezoneMode !== undefined) {
          _payload[`timezone_mode`] = timezoneMode;
        }
        if (voucherBatchId !== undefined) {
          _payload[`voucher_batch_id`] = voucherBatchId;
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
registerPromptSpecs(mailingsMailings.commands.at(-1)!, createSpecs, { method: "post" });
mailingsMailings
  .command(`empty-trash`)
  .description(`Every mailing in the trash is deleted for good on its own terms. One that something still blocks stays in the trash and is named with its reason, so a partial success says exactly what remained. Not for a storefront contact.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings/trash/empty`;
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
mailingsMailings
  .command(`purge`)
  .description(`What the nightly purge does, callable by hand: every mailing in the trash for longer than the tenant trash retention (90 days unless the tenant set another) is deleted for good through the same rules as a second delete. A blocked one stays and carries its reason. When the retention cannot be read, nothing is deleted. Also the cron schedule.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings/trash/purge`;
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
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/mailings", hasLimit: true } },
];
mailingsMailings
  .command(`delete`)
  .description(`The first DELETE moves the mailing into the trash: it stays, with everything hanging off it, and counts nowhere until it is restored. Only a mailing nobody received goes into the trash; a scheduled, sending or sent one is refused (\`trash_blocked\`, blocker \`mailing_sent\`) — cancel or archive it instead. A DELETE on a mailing already in the trash deletes it for good — refused while something still needs it, and not for a storefront contact.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`mailings-mailings delete`);
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsMailings.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/mailings", hasLimit: true } },
];
mailingsMailings
  .command(`get`)
  .description(`Read one mailing`)
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
        const _apiPath = `/mailings/mailings/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsMailings.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/mailings", hasLimit: true } },
  { key: "audienceId", option: "--audience-id <audience-id>", name: "audience_id", description: "The audiences app audience the mailing goes to.", type: "string", required: false },
  { key: "campaignRef", option: "--campaign-ref <campaign-ref>", name: "campaign_ref", description: "The campaign that claimed this mailing. Written by the campaigns app; filter `?campaign_ref=` to list a campaign mails.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Three-letter currency code, e.g. EUR.", type: "string", required: false },
  { key: "excludeAudienceIds", option: "--exclude-audience-ids [exclude-audience-ids...]", name: "exclude_audience_ids", description: "Audiences whose members do not receive the mailing, as a list of ids (at most 10).", type: "array", required: false },
  { key: "graymail", option: "--graymail <graymail>", name: "graymail", description: "Hold back recipients who received many marketing mails without a click. On by default.", type: "boolean", required: false },
  { key: "graymailSends", option: "--graymail-sends <graymail-sends>", name: "graymail_sends", description: "Overrides the graymail threshold of the settings for this mailing.", type: "integer", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "What the marketer calls the mailing, e.g. Black Week Newsletter. Not shown to recipients.", type: "string", required: false },
  { key: "previewText", option: "--preview-text <preview-text>", name: "preview_text", description: "The line mail clients show after the subject. At most 200 characters.", type: "string", required: false },
  { key: "replyTo", option: "--reply-to <reply-to>", name: "reply_to", description: "Where replies go, if not to the sender.", type: "string", required: false },
  { key: "sendAt", option: "--send-at <send-at>", name: "send_at", description: "When the mailing goes out. Empty: as soon as it is scheduled.", type: "string", required: false },
  { key: "sender", option: "--sender <sender>", name: "sender", description: "The From address. Empty: the market default sender from the settings.", type: "string", required: false },
  { key: "senderName", option: "--sender-name <sender-name>", name: "sender_name", description: "The name shown next to the From address.", type: "string", required: false },
  { key: "starter", option: "--starter <starter>", name: "starter", description: "Where the design started from: blank, simple, newsletter or promotion.", type: "string", required: false, enum: ["blank","simple","newsletter","promotion"] },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "The subject line recipients see. At most 150 characters.", type: "string", required: false },
  { key: "subscriptionType", option: "--subscription-type <subscription-type>", name: "subscription_type", description: "The marketing-consents subscription type code recipients must be allowed for.", type: "string", required: false },
  { key: "templateKey", option: "--template-key <template-key>", name: "template_key", description: "The key of the sequencer template of message class marketing the mailing renders.", type: "string", required: false },
  { key: "timezoneMode", option: "--timezone-mode <timezone-mode>", name: "timezone_mode", description: "`tenant`: everybody at send_at. `recipient`: send_at read as wall-clock time and applied in each recipient market time zone.", type: "string", required: false, enum: ["tenant","recipient"] },
  { key: "voucherBatchId", option: "--voucher-batch-id <voucher-batch-id>", name: "voucher_batch_id", description: "The promotions voucher batch every recipient draws one code from at send time.", type: "string", required: false },
];
mailingsMailings
  .command(`update`)
  .description(`A draft (or a cancelled or failed mailing nobody received) changes freely. In every other state only \`name\`, \`campaign_ref\` and \`metadata\` change — the campaigns app claims a mailing in any state.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--audience-id <audience-id>`, `The audiences app audience the mailing goes to.`)
  .option(`--campaign-ref <campaign-ref>`, `The campaign that claimed this mailing. Written by the campaigns app; filter \`?campaign_ref=\` to list a campaign mails.`)
  .option(`--currency <currency>`, `Three-letter currency code, e.g. EUR.`)
  .option(`--exclude-audience-ids [exclude-audience-ids...]`, `Audiences whose members do not receive the mailing, as a list of ids (at most 10).`)
  .option(
    `--graymail [value]`,
    `Hold back recipients who received many marketing mails without a click. On by default.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--graymail-sends <graymail-sends>`, `Overrides the graymail threshold of the settings for this mailing.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--name <name>`, `What the marketer calls the mailing, e.g. Black Week Newsletter. Not shown to recipients.`)
  .option(`--preview-text <preview-text>`, `The line mail clients show after the subject. At most 200 characters.`)
  .option(`--reply-to <reply-to>`, `Where replies go, if not to the sender.`)
  .option(`--send-at <send-at>`, `When the mailing goes out. Empty: as soon as it is scheduled.`)
  .option(`--sender <sender>`, `The From address. Empty: the market default sender from the settings.`)
  .option(`--sender-name <sender-name>`, `The name shown next to the From address.`)
  .option(`--starter <starter>`, `Where the design started from: blank, simple, newsletter or promotion.`)
  .option(`--subject <subject>`, `The subject line recipients see. At most 150 characters.`)
  .option(`--subscription-type <subscription-type>`, `The marketing-consents subscription type code recipients must be allowed for.`)
  .option(`--template-key <template-key>`, `The key of the sequencer template of message class marketing the mailing renders.`)
  .option(`--timezone-mode <timezone-mode>`, `\`tenant\`: everybody at send_at. \`recipient\`: send_at read as wall-clock time and applied in each recipient market time zone.`)
  .option(`--voucher-batch-id <voucher-batch-id>`, `The promotions voucher batch every recipient draws one code from at send time.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, audienceId, campaignRef, currency, excludeAudienceIds, graymail, graymailSends, metadata, name, previewText, replyTo, sendAt, sender, senderName, starter, subject, subscriptionType, templateKey, timezoneMode, voucherBatchId } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings/{id}`.replace(`{id}`, id);
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
        if (campaignRef !== undefined) {
          _payload[`campaign_ref`] = campaignRef;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (excludeAudienceIds !== undefined) {
          _payload[`exclude_audience_ids`] = excludeAudienceIds;
        }
        if (graymail !== undefined) {
          _payload[`graymail`] = graymail;
        }
        if (graymailSends !== undefined) {
          _payload[`graymail_sends`] = graymailSends;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (previewText !== undefined) {
          _payload[`preview_text`] = previewText;
        }
        if (replyTo !== undefined) {
          _payload[`reply_to`] = replyTo;
        }
        if (sendAt !== undefined) {
          _payload[`send_at`] = sendAt;
        }
        if (sender !== undefined) {
          _payload[`sender`] = sender;
        }
        if (senderName !== undefined) {
          _payload[`sender_name`] = senderName;
        }
        if (starter !== undefined) {
          _payload[`starter`] = starter;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
        }
        if (subscriptionType !== undefined) {
          _payload[`subscription_type`] = subscriptionType;
        }
        if (templateKey !== undefined) {
          _payload[`template_key`] = templateKey;
        }
        if (timezoneMode !== undefined) {
          _payload[`timezone_mode`] = timezoneMode;
        }
        if (voucherBatchId !== undefined) {
          _payload[`voucher_batch_id`] = voucherBatchId;
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
registerPromptSpecs(mailingsMailings.commands.at(-1)!, updateSpecs, { method: "put" });
const archiveSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/mailings", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
mailingsMailings
  .command(`archive`)
  .description(`Archive a mailing`)
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
        const _apiPath = `/mailings/mailings/{id}/archive`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsMailings.commands.at(-1)!, archiveSpecs, { method: "post" });
const cancelSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/mailings", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
mailingsMailings
  .command(`cancel`)
  .description(`Nothing more is handed to the sequencer. Recipients already handed over keep their mail.`)
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
          cancelSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings/{id}/cancel`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsMailings.commands.at(-1)!, cancelSpecs, { method: "post" });
const checklistSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/mailings", hasLimit: true } },
];
mailingsMailings
  .command(`checklist`)
  .description(`Every item with ok, severity (error or warning), state (ok, warning or error), its label and the problem as a sentence in the caller language (Accept-Language; German unless English is asked for), and where to put it right (action: route and label); errors first, then warnings: subject, preview text, sender, audience, subscription type, marketing template, footer address, unsubscribe link, links, image descriptions, voucher batch, send time. \`ready\` is true when no error stands.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          checklistSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings/{id}/checklist`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsMailings.commands.at(-1)!, checklistSpecs, { method: "get" });
const duplicateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/mailings", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
mailingsMailings
  .command(`duplicate`)
  .description(`Any mailing, sent ones included. The copy keeps content, audience and settings, and drops the send time and the campaign.`)
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
          duplicateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings/{id}/duplicate`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsMailings.commands.at(-1)!, duplicateSpecs, { method: "post" });
const previewSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/mailings", hasLimit: true } },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "device", option: "--device <device>", name: "device", type: "string", required: false, enum: ["desktop","mobile"] },
  { key: "email", option: "--email <email>", name: "email", type: "string", required: false },
  { key: "firstName", option: "--first-name <first-name>", name: "first_name", type: "string", required: false },
  { key: "lastName", option: "--last-name <last-name>", name: "last_name", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "The market code to price and render for.", type: "string", required: false },
];
mailingsMailings
  .command(`preview`)
  .description(`Products priced for the market named, the footer of that market, a sample voucher code. No code is drawn and nothing is sent.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--device <device>`, ``)
  .option(`--email <email>`, ``)
  .option(`--first-name <first-name>`, ``)
  .option(`--last-name <last-name>`, ``)
  .option(`--locale <locale>`, ``)
  .option(`--market <market>`, `The market code to price and render for.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, contactId, device, email, firstName, lastName, locale, market } = await promptForMissing(
          _options,
          previewSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings/{id}/preview`.replace(`{id}`, id);
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
        if (device !== undefined) {
          _payload[`device`] = device;
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (firstName !== undefined) {
          _payload[`first_name`] = firstName;
        }
        if (lastName !== undefined) {
          _payload[`last_name`] = lastName;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
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
registerPromptSpecs(mailingsMailings.commands.at(-1)!, previewSpecs, { method: "post" });
const reachSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/mailings", hasLimit: true } },
];
mailingsMailings
  .command(`reach`)
  .description(`The audience member and eligible counts, the excluded audiences, and at most how many addresses graymail protection would hold back. \`bars\` carries the same counts as rows of label and value, worded in the caller language.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          reachSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings/{id}/reach`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsMailings.commands.at(-1)!, reachSpecs, { method: "get" });
const restoreSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/mailings", hasLimit: true } },
];
mailingsMailings
  .command(`restore`)
  .description(`Clears the trash marks on the mailing. Its parts were never touched, so they come back with it, in the state it was in. The same right as deleting.`)
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
        const _apiPath = `/mailings/mailings/{id}/restore`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsMailings.commands.at(-1)!, restoreSpecs, { method: "post" });
const scheduleSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/mailings", hasLimit: true } },
  { key: "sendAt", option: "--send-at <send-at>", name: "send_at", description: "An ISO time, `now`, or null for at once. Omitted: the mailing own send_at.", type: "string", required: false },
  { key: "start", option: "--start <start>", name: "start", description: "false leaves even a send-at-once mailing to the next pipeline run.", type: "boolean", required: false },
  { key: "timezoneMode", option: "--timezone-mode <timezone-mode>", name: "timezone_mode", description: "Overrides the mailing time zone mode.", type: "string", required: false, enum: ["tenant","recipient"] },
];
mailingsMailings
  .command(`schedule`)
  .description(`Runs the checklist and refuses while an error stands. \`send_at\` empty or \`now\` sends at once (the first chunk is prepared in this call); a time sends then, in the shop or recipient time zone.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--send-at <send-at>`, `An ISO time, \`now\`, or null for at once. Omitted: the mailing own send_at.`)
  .option(
    `--start [value]`,
    `false leaves even a send-at-once mailing to the next pipeline run.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--timezone-mode <timezone-mode>`, `Overrides the mailing time zone mode.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, sendAt, start, timezoneMode } = await promptForMissing(
          _options,
          scheduleSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings/{id}/schedule`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (sendAt !== undefined) {
          _payload[`send_at`] = sendAt;
        }
        if (start !== undefined) {
          _payload[`start`] = start;
        }
        if (timezoneMode !== undefined) {
          _payload[`timezone_mode`] = timezoneMode;
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
registerPromptSpecs(mailingsMailings.commands.at(-1)!, scheduleSpecs, { method: "post" });
const testSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/mailings", hasLimit: true } },
  { key: "locale", option: "--locale <locale>", name: "locale", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", type: "string", required: false },
  { key: "recipients", option: "--recipients [recipients...]", name: "recipients", type: "array", required: false },
];
mailingsMailings
  .command(`test`)
  .description(`At most ten addresses, from the request or the test recipients setting. Marked as a test, with a sample voucher code; counts in no figure.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--locale <locale>`, ``)
  .option(`--market <market>`, ``)
  .option(`--recipients [recipients...]`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, locale, market, recipients } = await promptForMissing(
          _options,
          testSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings/{id}/test`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (recipients !== undefined) {
          _payload[`recipients`] = recipients;
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
registerPromptSpecs(mailingsMailings.commands.at(-1)!, testSpecs, { method: "post" });
const unarchiveSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/mailings", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
mailingsMailings
  .command(`unarchive`)
  .description(`Take a mailing out of the archive`)
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
          unarchiveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings/{id}/unarchive`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsMailings.commands.at(-1)!, unarchiveSpecs, { method: "post" });
