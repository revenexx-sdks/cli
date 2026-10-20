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

export const loyaltyReferrals = new Command("loyalty-referrals")
  .description(
    commandDescriptions["loyaltyReferrals"] ??
      `Referral codes of members and the referrals made with them. A referral qualifies on the referred person's first credited order; both sides are rewarded through promotions.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const codesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "membershipId", option: "--membership-id <membership-id>", name: "membership_id", description: "Keep only rows whose `membership_id` equals this.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Keep only rows whose `contact_id` equals this.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Keep only rows whose `code` equals this.", type: "string", required: false },
  { key: "uses", option: "--uses <uses>", name: "uses", description: "Keep only rows whose `uses` equals this.", type: "string", required: false },
  { key: "active", option: "--active <active>", name: "active", description: "Keep only rows whose `active` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
loyaltyReferrals
  .command(`codes-list`)
  .description(`Filter \`?membership_id=\`, \`?contact_id=\`, \`?code=\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--membership-id <membership-id>`, `Keep only rows whose \`membership_id\` equals this.`)
  .option(`--contact-id <contact-id>`, `Keep only rows whose \`contact_id\` equals this.`)
  .option(`--code <code>`, `Keep only rows whose \`code\` equals this.`)
  .option(`--uses <uses>`, `Keep only rows whose \`uses\` equals this.`)
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
        const { limit, offset, order, id, membershipId, contactId, code, uses, active, filter } = await promptForMissing(
          _options,
          codesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/referral-codes`;
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
        if (membershipId !== undefined) {
          _payload[`membership_id`] = membershipId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (uses !== undefined) {
          _payload[`uses`] = uses;
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
registerPromptSpecs(loyaltyReferrals.commands.at(-1)!, codesListSpecs, { method: "get" });
const codesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/referral-codes", hasLimit: true } },
];
loyaltyReferrals
  .command(`codes-get`)
  .description(`Read one referral code`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          codesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/referral-codes/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyReferrals.commands.at(-1)!, codesGetSpecs, { method: "get" });
const codesDeactivateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/referral-codes", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
loyaltyReferrals
  .command(`codes-deactivate`)
  .description(`Retire a referral code`)
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
          codesDeactivateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/referral-codes/{id}/deactivate`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyReferrals.commands.at(-1)!, codesDeactivateSpecs, { method: "post" });
const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "referralCodeId", option: "--referral-code-id <referral-code-id>", name: "referral_code_id", description: "Keep only rows whose `referral_code_id` equals this.", type: "string", required: false },
  { key: "referrerMembershipId", option: "--referrer-membership-id <referrer-membership-id>", name: "referrer_membership_id", description: "Keep only rows whose `referrer_membership_id` equals this.", type: "string", required: false },
  { key: "referrerContactId", option: "--referrer-contact-id <referrer-contact-id>", name: "referrer_contact_id", description: "Keep only rows whose `referrer_contact_id` equals this.", type: "string", required: false },
  { key: "refereeContactId", option: "--referee-contact-id <referee-contact-id>", name: "referee_contact_id", description: "Keep only rows whose `referee_contact_id` equals this.", type: "string", required: false },
  { key: "state", option: "--state <state>", name: "state", description: "Keep only rows whose `state` equals this.", type: "string", required: false },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", description: "Keep only rows whose `order_id` equals this.", type: "string", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Keep only rows whose `reason` equals this.", type: "string", required: false },
  { key: "refereeVoucherCode", option: "--referee-voucher-code <referee-voucher-code>", name: "referee_voucher_code", description: "Keep only rows whose `referee_voucher_code` equals this.", type: "string", required: false },
  { key: "referrerVoucherCode", option: "--referrer-voucher-code <referrer-voucher-code>", name: "referrer_voucher_code", description: "Keep only rows whose `referrer_voucher_code` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
loyaltyReferrals
  .command(`list`)
  .description(`Filter \`?state=\`, \`?referrer_contact_id=\`, \`?referee_contact_id=\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--referral-code-id <referral-code-id>`, `Keep only rows whose \`referral_code_id\` equals this.`)
  .option(`--referrer-membership-id <referrer-membership-id>`, `Keep only rows whose \`referrer_membership_id\` equals this.`)
  .option(`--referrer-contact-id <referrer-contact-id>`, `Keep only rows whose \`referrer_contact_id\` equals this.`)
  .option(`--referee-contact-id <referee-contact-id>`, `Keep only rows whose \`referee_contact_id\` equals this.`)
  .option(`--state <state>`, `Keep only rows whose \`state\` equals this.`)
  .option(`--order-id <order-id>`, `Keep only rows whose \`order_id\` equals this.`)
  .option(`--reason <reason>`, `Keep only rows whose \`reason\` equals this.`)
  .option(`--referee-voucher-code <referee-voucher-code>`, `Keep only rows whose \`referee_voucher_code\` equals this.`)
  .option(`--referrer-voucher-code <referrer-voucher-code>`, `Keep only rows whose \`referrer_voucher_code\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, referralCodeId, referrerMembershipId, referrerContactId, refereeContactId, state, orderId, reason, refereeVoucherCode, referrerVoucherCode, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/referrals`;
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
        if (referralCodeId !== undefined) {
          _payload[`referral_code_id`] = referralCodeId;
        }
        if (referrerMembershipId !== undefined) {
          _payload[`referrer_membership_id`] = referrerMembershipId;
        }
        if (referrerContactId !== undefined) {
          _payload[`referrer_contact_id`] = referrerContactId;
        }
        if (refereeContactId !== undefined) {
          _payload[`referee_contact_id`] = refereeContactId;
        }
        if (state !== undefined) {
          _payload[`state`] = state;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
        }
        if (refereeVoucherCode !== undefined) {
          _payload[`referee_voucher_code`] = refereeVoucherCode;
        }
        if (referrerVoucherCode !== undefined) {
          _payload[`referrer_voucher_code`] = referrerVoucherCode;
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
registerPromptSpecs(loyaltyReferrals.commands.at(-1)!, listSpecs, { method: "get" });
const claimSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: true },
];
loyaltyReferrals
  .command(`claim`)
  .description(`The storefront calls it at sign-up. Records the referral and, when the tenant set one, issues a welcome voucher. Claiming the same code again answers the first claim.`)
  .option(`--code <code>`, ``)
  .option(`--contact-id <contact-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, contactId } = await promptForMissing(
          _options,
          claimSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/referrals/claim`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
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
registerPromptSpecs(loyaltyReferrals.commands.at(-1)!, claimSpecs, { method: "post" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/referrals", hasLimit: true } },
];
loyaltyReferrals
  .command(`get`)
  .description(`Read one referral`)
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
        const _apiPath = `/loyalty/referrals/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyReferrals.commands.at(-1)!, getSpecs, { method: "get" });
const rejectSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/referrals", hasLimit: true } },
  { key: "reason", option: "--reason <reason>", name: "reason", type: "string", required: true },
];
loyaltyReferrals
  .command(`reject`)
  .description(`Reject a referral with a reason`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--reason <reason>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, reason } = await promptForMissing(
          _options,
          rejectSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/referrals/{id}/reject`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
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
registerPromptSpecs(loyaltyReferrals.commands.at(-1)!, rejectSpecs, { method: "post" });
const rewardSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/referrals", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
loyaltyReferrals
  .command(`reward`)
  .description(`For a referral that qualified while promotions could not issue the voucher.`)
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
          rewardSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/referrals/{id}/reward`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyReferrals.commands.at(-1)!, rewardSpecs, { method: "post" });
