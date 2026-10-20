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

export const loyaltyPoints = new Command("loyalty-points")
  .description(
    commandDescriptions["loyaltyPoints"] ??
      `The point ledger: every credit, redemption, expiry, correction and reversal as one keyed entry. Points are spent oldest first and expire per the tenant setting.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "membershipId", option: "--membership-id <membership-id>", name: "membership_id", description: "Keep only rows whose `membership_id` equals this.", type: "string", required: false },
  { key: "entryKey", option: "--entry-key <entry-key>", name: "entry_key", description: "Keep only rows whose `entry_key` equals this.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Keep only rows whose `kind` equals this.", type: "string", required: false },
  { key: "points", option: "--points <points>", name: "points", description: "Keep only rows whose `points` equals this.", type: "string", required: false },
  { key: "remaining", option: "--remaining <remaining>", name: "remaining", description: "Keep only rows whose `remaining` equals this.", type: "string", required: false },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", description: "Keep only rows whose `order_id` equals this.", type: "string", required: false },
  { key: "rewardId", option: "--reward-id <reward-id>", name: "reward_id", description: "Keep only rows whose `reward_id` equals this.", type: "string", required: false },
  { key: "redemptionId", option: "--redemption-id <redemption-id>", name: "redemption_id", description: "Keep only rows whose `redemption_id` equals this.", type: "string", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Keep only rows whose `reason` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
loyaltyPoints
  .command(`list`)
  .description(`The ledger. Filter \`?membership_id=\`, \`?kind=\`, \`?order_id=\`. Read-only.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--membership-id <membership-id>`, `Keep only rows whose \`membership_id\` equals this.`)
  .option(`--entry-key <entry-key>`, `Keep only rows whose \`entry_key\` equals this.`)
  .option(`--kind <kind>`, `Keep only rows whose \`kind\` equals this.`)
  .option(`--points <points>`, `Keep only rows whose \`points\` equals this.`)
  .option(`--remaining <remaining>`, `Keep only rows whose \`remaining\` equals this.`)
  .option(`--order-id <order-id>`, `Keep only rows whose \`order_id\` equals this.`)
  .option(`--reward-id <reward-id>`, `Keep only rows whose \`reward_id\` equals this.`)
  .option(`--redemption-id <redemption-id>`, `Keep only rows whose \`redemption_id\` equals this.`)
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
        const { limit, offset, order, id, membershipId, entryKey, kind, points, remaining, orderId, rewardId, redemptionId, reason, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/point-ledger`;
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
        if (entryKey !== undefined) {
          _payload[`entry_key`] = entryKey;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (points !== undefined) {
          _payload[`points`] = points;
        }
        if (remaining !== undefined) {
          _payload[`remaining`] = remaining;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
        }
        if (rewardId !== undefined) {
          _payload[`reward_id`] = rewardId;
        }
        if (redemptionId !== undefined) {
          _payload[`redemption_id`] = redemptionId;
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
registerPromptSpecs(loyaltyPoints.commands.at(-1)!, listSpecs, { method: "get" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/point-ledger", hasLimit: true } },
];
loyaltyPoints
  .command(`get`)
  .description(`Read one point booking`)
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
        const _apiPath = `/loyalty/point-ledger/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyPoints.commands.at(-1)!, getSpecs, { method: "get" });
const awardSpecs: PromptSpec[] = [
  { key: "points", option: "--points <points>", name: "points", type: "integer", required: true },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "key", option: "--key <key>", name: "key", type: "string", required: false },
  { key: "membershipId", option: "--membership-id <membership-id>", name: "membership_id", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", type: "string", required: false },
  { key: "programCode", option: "--program-code <program-code>", name: "program_code", type: "string", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", type: "string", required: false },
];
loyaltyPoints
  .command(`award`)
  .description(`What the journeys award_points step calls. Names the member by membership, contact or company (\`program_code\` when the holder collects in several programmes). A \`key\` makes a retry book once.`)
  .option(`--points <points>`, ``, parseInteger)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--key <key>`, ``)
  .option(`--membership-id <membership-id>`, ``)
  .option(`--organization-id <organization-id>`, ``)
  .option(`--program-code <program-code>`, ``)
  .option(`--reason <reason>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { points, contactId, key, membershipId, organizationId, programCode, reason } = await promptForMissing(
          _options,
          awardSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/points/award`;
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
        if (key !== undefined) {
          _payload[`key`] = key;
        }
        if (membershipId !== undefined) {
          _payload[`membership_id`] = membershipId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (points !== undefined) {
          _payload[`points`] = points;
        }
        if (programCode !== undefined) {
          _payload[`program_code`] = programCode;
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
registerPromptSpecs(loyaltyPoints.commands.at(-1)!, awardSpecs, { method: "post" });
