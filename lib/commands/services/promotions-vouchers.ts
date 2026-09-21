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

export const promotionsVouchers = new Command("promotions-vouchers")
  .description(
    commandDescriptions["promotionsVouchers"] ??
      `The codes a buyer types, and the batches they were made in. A voucher belongs to exactly one promotion and carries four independent limits: how often it may be redeemed, an amount that is spent down rather than used up, the buyer it was issued to, and its own validity window. A code may also be reserved for a buyer without being given to them, and may require a reservation before it works at all. Batches generate fifty thousand codes from one pattern, import existing ones unchanged, and account for the whole mailing afterwards.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const promotionsBatchesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "Keep only rows whose `promotion_id` equals this.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Keep only rows whose `name` equals this.", type: "string", required: false },
  { key: "pattern", option: "--pattern <pattern>", name: "pattern", description: "Keep only rows whose `pattern` equals this.", type: "string", required: false },
  { key: "alphabet", option: "--alphabet <alphabet>", name: "alphabet", description: "Keep only rows whose `alphabet` equals this.", type: "string", required: false },
  { key: "requested", option: "--requested <requested>", name: "requested", description: "Keep only rows whose `requested` equals this.", type: "string", required: false },
  { key: "createdCount", option: "--created-count <created-count>", name: "created_count", description: "Keep only rows whose `created_count` equals this.", type: "string", required: false },
  { key: "redeemedCount", option: "--redeemed-count <redeemed-count>", name: "redeemed_count", description: "Keep only rows whose `redeemed_count` equals this.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Keep only rows whose `status` equals this.", type: "string", required: false },
  { key: "requestRef", option: "--request-ref <request-ref>", name: "request_ref", description: "Keep only rows whose `request_ref` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
promotionsVouchers
  .command(`promotions-batches-list`)
  .description(`The unit a mailing is accounted for by. "How many of the spring codes have been used" is a question about a batch, not about fifty thousand rows.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--promotion-id <promotion-id>`, `Keep only rows whose \`promotion_id\` equals this.`)
  .option(`--name <name>`, `Keep only rows whose \`name\` equals this.`)
  .option(`--pattern <pattern>`, `Keep only rows whose \`pattern\` equals this.`)
  .option(`--alphabet <alphabet>`, `Keep only rows whose \`alphabet\` equals this.`)
  .option(`--requested <requested>`, `Keep only rows whose \`requested\` equals this.`)
  .option(`--created-count <created-count>`, `Keep only rows whose \`created_count\` equals this.`)
  .option(`--redeemed-count <redeemed-count>`, `Keep only rows whose \`redeemed_count\` equals this.`)
  .option(`--status <status>`, `Keep only rows whose \`status\` equals this.`)
  .option(`--request-ref <request-ref>`, `Keep only rows whose \`request_ref\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, promotionId, name, pattern, alphabet, requested, createdCount, redeemedCount, status, requestRef, filter } = await promptForMissing(
          _options,
          promotionsBatchesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/batches`;
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
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (pattern !== undefined) {
          _payload[`pattern`] = pattern;
        }
        if (alphabet !== undefined) {
          _payload[`alphabet`] = alphabet;
        }
        if (requested !== undefined) {
          _payload[`requested`] = requested;
        }
        if (createdCount !== undefined) {
          _payload[`created_count`] = createdCount;
        }
        if (redeemedCount !== undefined) {
          _payload[`redeemed_count`] = redeemedCount;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (requestRef !== undefined) {
          _payload[`request_ref`] = requestRef;
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, promotionsBatchesListSpecs, { method: "get" });
const promotionsBatchesCreateSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "What the batch is called — the unit a mailing is accounted for by afterwards.", type: "string", required: true },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "The promotion this row belongs to. Deleting the promotion deletes it.", type: "string", required: true },
  { key: "alphabet", option: "--alphabet <alphabet>", name: "alphabet", description: "The characters generated codes may use. The default omits the ones people confuse reading a code off paper.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "object", required: false },
  { key: "pattern", option: "--pattern <pattern>", name: "pattern", description: "The shape generated codes take. `#` draws a character from the alphabet; every other character is kept.", type: "string", required: false },
  { key: "requestRef", option: "--request-ref <request-ref>", name: "request_ref", description: "A reference the caller chose, so a retried generation makes no second batch. A timed-out call is retried by whoever sent it, and a retry that doubled a mailing is discovered when the codes are in the post.", type: "string", required: false },
  { key: "requested", option: "--requested <requested>", name: "requested", description: "How many codes have been asked for.", type: "integer", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "A leaked batch is `disabled`, which refuses every code in it at once — a leak is discovered as a batch and has to be stopped as one.", type: "string", required: false, enum: ["active","disabled"] },
];
promotionsVouchers
  .command(`promotions-batches-create`)
  .description(`Create a code batch`)
  .option(`--name <name>`, `What the batch is called — the unit a mailing is accounted for by afterwards.`)
  .option(`--promotion-id <promotion-id>`, `The promotion this row belongs to. Deleting the promotion deletes it.`)
  .option(`--alphabet <alphabet>`, `The characters generated codes may use. The default omits the ones people confuse reading a code off paper.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--pattern <pattern>`, `The shape generated codes take. \`#\` draws a character from the alphabet; every other character is kept.`)
  .option(`--request-ref <request-ref>`, `A reference the caller chose, so a retried generation makes no second batch. A timed-out call is retried by whoever sent it, and a retry that doubled a mailing is discovered when the codes are in the post.`)
  .option(`--requested <requested>`, `How many codes have been asked for.`, parseInteger)
  .option(`--status <status>`, `A leaked batch is \`disabled\`, which refuses every code in it at once — a leak is discovered as a batch and has to be stopped as one.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, promotionId, alphabet, metadata, pattern, requestRef, requested, status } = await promptForMissing(
          _options,
          promotionsBatchesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/batches`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (alphabet !== undefined) {
          _payload[`alphabet`] = alphabet;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (pattern !== undefined) {
          _payload[`pattern`] = pattern;
        }
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
        }
        if (requestRef !== undefined) {
          _payload[`request_ref`] = requestRef;
        }
        if (requested !== undefined) {
          _payload[`requested`] = requested;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, promotionsBatchesCreateSpecs, { method: "post" });
const promotionsBatchesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/batches", hasLimit: true } },
];
promotionsVouchers
  .command(`promotions-batches-delete`)
  .description(`Delete a batch`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          promotionsBatchesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`promotions-vouchers promotions-batches-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/promotions/batches/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, promotionsBatchesDeleteSpecs, { method: "delete", destructive: true });
const promotionsBatchesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/batches", hasLimit: true } },
];
promotionsVouchers
  .command(`promotions-batches-get`)
  .description(`Read one batch`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          promotionsBatchesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/batches/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, promotionsBatchesGetSpecs, { method: "get" });
const promotionsBatchesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/batches", hasLimit: true } },
  { key: "name", option: "--name <name>", name: "name", description: "What the batch is called — the unit a mailing is accounted for by afterwards.", type: "string", required: true },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "The promotion this row belongs to. Deleting the promotion deletes it.", type: "string", required: true },
  { key: "alphabet", option: "--alphabet <alphabet>", name: "alphabet", description: "The characters generated codes may use. The default omits the ones people confuse reading a code off paper.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "object", required: false },
  { key: "pattern", option: "--pattern <pattern>", name: "pattern", description: "The shape generated codes take. `#` draws a character from the alphabet; every other character is kept.", type: "string", required: false },
  { key: "requestRef", option: "--request-ref <request-ref>", name: "request_ref", description: "A reference the caller chose, so a retried generation makes no second batch. A timed-out call is retried by whoever sent it, and a retry that doubled a mailing is discovered when the codes are in the post.", type: "string", required: false },
  { key: "requested", option: "--requested <requested>", name: "requested", description: "How many codes have been asked for.", type: "integer", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "A leaked batch is `disabled`, which refuses every code in it at once — a leak is discovered as a batch and has to be stopped as one.", type: "string", required: false, enum: ["active","disabled"] },
];
promotionsVouchers
  .command(`promotions-batches-update`)
  .description(`Correct a batch`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--name <name>`, `What the batch is called — the unit a mailing is accounted for by afterwards.`)
  .option(`--promotion-id <promotion-id>`, `The promotion this row belongs to. Deleting the promotion deletes it.`)
  .option(`--alphabet <alphabet>`, `The characters generated codes may use. The default omits the ones people confuse reading a code off paper.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--pattern <pattern>`, `The shape generated codes take. \`#\` draws a character from the alphabet; every other character is kept.`)
  .option(`--request-ref <request-ref>`, `A reference the caller chose, so a retried generation makes no second batch. A timed-out call is retried by whoever sent it, and a retry that doubled a mailing is discovered when the codes are in the post.`)
  .option(`--requested <requested>`, `How many codes have been asked for.`, parseInteger)
  .option(`--status <status>`, `A leaked batch is \`disabled\`, which refuses every code in it at once — a leak is discovered as a batch and has to be stopped as one.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, name, promotionId, alphabet, metadata, pattern, requestRef, requested, status } = await promptForMissing(
          _options,
          promotionsBatchesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/batches/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (alphabet !== undefined) {
          _payload[`alphabet`] = alphabet;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (pattern !== undefined) {
          _payload[`pattern`] = pattern;
        }
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
        }
        if (requestRef !== undefined) {
          _payload[`request_ref`] = requestRef;
        }
        if (requested !== undefined) {
          _payload[`requested`] = requested;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, promotionsBatchesUpdateSpecs, { method: "put" });
const promotionsBatchesExportSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/batches", hasLimit: true } },
];
promotionsVouchers
  .command(`promotions-batches-export`)
  .description(`The codes are only useful once they are out of this system and in a mailing tool, so a batch that cannot leave was made for nobody.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          promotionsBatchesExportSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/batches/{id}/export`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, promotionsBatchesExportSpecs, { method: "get" });
const promotionsBatchesGenerateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/batches", hasLimit: true } },
  { key: "count", option: "--count <count>", name: "count", description: "How many codes to make. Bounded by the tenant setting.", type: "integer", required: true },
  { key: "alphabet", option: "--alphabet <alphabet>", name: "alphabet", description: "The characters they may use.", type: "string", required: false },
  { key: "pattern", option: "--pattern <pattern>", name: "pattern", description: "The shape they take. Defaults to the batch pattern, then the tenant default.", type: "string", required: false },
  { key: "requestRef", option: "--request-ref <request-ref>", name: "request_ref", description: "A reference the caller chose, so a retry makes nothing further.", type: "string", required: false },
  { key: "usageLimit", option: "--usage-limit <usage-limit>", name: "usage_limit", description: "How often each code may be redeemed. Zero is unlimited.", type: "integer", required: false },
];
promotionsVouchers
  .command(`promotions-batches-generate`)
  .description(`Fifty thousand codes from one pattern, in one call, accounted for as one batch. The alphabet omits the characters people confuse reading a code off paper. A request carrying a reference makes no second batch when it is retried — a retry that doubled a mailing is discovered when the codes are in the post.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--count <count>`, `How many codes to make. Bounded by the tenant setting.`, parseInteger)
  .option(`--alphabet <alphabet>`, `The characters they may use.`)
  .option(`--pattern <pattern>`, `The shape they take. Defaults to the batch pattern, then the tenant default.`)
  .option(`--request-ref <request-ref>`, `A reference the caller chose, so a retry makes nothing further.`)
  .option(`--usage-limit <usage-limit>`, `How often each code may be redeemed. Zero is unlimited.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, count, alphabet, pattern, requestRef, usageLimit } = await promptForMissing(
          _options,
          promotionsBatchesGenerateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/batches/{id}/generate`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (alphabet !== undefined) {
          _payload[`alphabet`] = alphabet;
        }
        if (count !== undefined) {
          _payload[`count`] = count;
        }
        if (pattern !== undefined) {
          _payload[`pattern`] = pattern;
        }
        if (requestRef !== undefined) {
          _payload[`request_ref`] = requestRef;
        }
        if (usageLimit !== undefined) {
          _payload[`usage_limit`] = usageLimit;
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, promotionsBatchesGenerateSpecs, { method: "post" });
const promotionsBatchesGenerateForSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/batches", hasLimit: true } },
  { key: "recipients", option: "--recipients [recipients...]", name: "recipients", description: "The contacts to issue a code to, one each.", type: "array", required: true },
];
promotionsVouchers
  .command(`promotions-batches-generate-for`)
  .description(`A personalised mailing needs one code per recipient, issued to them alone. Generating them separately would turn one campaign into ten thousand calls.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--recipients [recipients...]`, `The contacts to issue a code to, one each.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, recipients } = await promptForMissing(
          _options,
          promotionsBatchesGenerateForSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/batches/{id}/generate-for`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, promotionsBatchesGenerateForSpecs, { method: "post" });
const promotionsBatchesImportSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/batches", hasLimit: true } },
  { key: "codes", option: "--codes [codes...]", name: "codes", description: "The codes to take, exactly as they are.", type: "array", required: true },
  { key: "usageLimit", option: "--usage-limit <usage-limit>", name: "usage_limit", description: "How often each may be redeemed.", type: "integer", required: false },
];
promotionsVouchers
  .command(`promotions-batches-import`)
  .description(`A migrated shop has codes already printed on cards, and a code the new system rewrote is a card in somebody wallet that no longer works. Every collision is named rather than silently skipped — an import that quietly dropped duplicates leaves a merchant believing they issued codes they did not.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--codes [codes...]`, `The codes to take, exactly as they are.`)
  .option(`--usage-limit <usage-limit>`, `How often each may be redeemed.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, codes, usageLimit } = await promptForMissing(
          _options,
          promotionsBatchesImportSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/batches/{id}/import`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (codes !== undefined) {
          _payload[`codes`] = codes;
        }
        if (usageLimit !== undefined) {
          _payload[`usage_limit`] = usageLimit;
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, promotionsBatchesImportSpecs, { method: "post" });
const promotionsVoucherReservationsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "voucherId", option: "--voucher-id <voucher-id>", name: "voucher_id", description: "Keep only rows whose `voucher_id` equals this.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Keep only rows whose `contact_id` equals this.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Keep only rows whose `organization_id` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
promotionsVouchers
  .command(`promotions-voucher-reservations-list`)
  .description(`A code held FOR a buyer without being given to them — which is what a shop handing a limited code to the first hundred who ask actually needs. An expired reservation stops counting when the code is next looked at.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--voucher-id <voucher-id>`, `Keep only rows whose \`voucher_id\` equals this.`)
  .option(`--contact-id <contact-id>`, `Keep only rows whose \`contact_id\` equals this.`)
  .option(`--organization-id <organization-id>`, `Keep only rows whose \`organization_id\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, voucherId, contactId, organizationId, filter } = await promptForMissing(
          _options,
          promotionsVoucherReservationsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/voucher-reservations`;
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
        if (voucherId !== undefined) {
          _payload[`voucher_id`] = voucherId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, promotionsVoucherReservationsListSpecs, { method: "get" });
const promotionsVoucherReservationsCreateSpecs: PromptSpec[] = [
  { key: "voucherId", option: "--voucher-id <voucher-id>", name: "voucher_id", description: "The code being held.", type: "string", required: true },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Who it is held for.", type: "string", required: false },
  { key: "expiresAt", option: "--expires-at <expires-at>", name: "expires_at", description: "When the hold stops counting. Empty is held until it is used or deleted.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Which company it is held for.", type: "string", required: false },
];
promotionsVouchers
  .command(`promotions-voucher-reservations-create`)
  .description(`Hold a code for a buyer`)
  .option(`--voucher-id <voucher-id>`, `The code being held.`)
  .option(`--contact-id <contact-id>`, `Who it is held for.`)
  .option(`--expires-at <expires-at>`, `When the hold stops counting. Empty is held until it is used or deleted.`)
  .option(`--organization-id <organization-id>`, `Which company it is held for.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { voucherId, contactId, expiresAt, organizationId } = await promptForMissing(
          _options,
          promotionsVoucherReservationsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/voucher-reservations`;
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
        if (expiresAt !== undefined) {
          _payload[`expires_at`] = expiresAt;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (voucherId !== undefined) {
          _payload[`voucher_id`] = voucherId;
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, promotionsVoucherReservationsCreateSpecs, { method: "post" });
const promotionsVoucherReservationsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/voucher-reservations", hasLimit: true } },
];
promotionsVouchers
  .command(`promotions-voucher-reservations-delete`)
  .description(`Release a reservation`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          promotionsVoucherReservationsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`promotions-vouchers promotions-voucher-reservations-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/promotions/voucher-reservations/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, promotionsVoucherReservationsDeleteSpecs, { method: "delete", destructive: true });
const promotionsVoucherReservationsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/voucher-reservations", hasLimit: true } },
];
promotionsVouchers
  .command(`promotions-voucher-reservations-get`)
  .description(`Read one reservation`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          promotionsVoucherReservationsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/voucher-reservations/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, promotionsVoucherReservationsGetSpecs, { method: "get" });
const promotionsVoucherReservationsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/voucher-reservations", hasLimit: true } },
  { key: "voucherId", option: "--voucher-id <voucher-id>", name: "voucher_id", description: "The code being held.", type: "string", required: true },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Who it is held for.", type: "string", required: false },
  { key: "expiresAt", option: "--expires-at <expires-at>", name: "expires_at", description: "When the hold stops counting. Empty is held until it is used or deleted.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Which company it is held for.", type: "string", required: false },
];
promotionsVouchers
  .command(`promotions-voucher-reservations-update`)
  .description(`Correct a reservation`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--voucher-id <voucher-id>`, `The code being held.`)
  .option(`--contact-id <contact-id>`, `Who it is held for.`)
  .option(`--expires-at <expires-at>`, `When the hold stops counting. Empty is held until it is used or deleted.`)
  .option(`--organization-id <organization-id>`, `Which company it is held for.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, voucherId, contactId, expiresAt, organizationId } = await promptForMissing(
          _options,
          promotionsVoucherReservationsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/voucher-reservations/{id}`.replace(`{id}`, id);
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
        if (expiresAt !== undefined) {
          _payload[`expires_at`] = expiresAt;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (voucherId !== undefined) {
          _payload[`voucher_id`] = voucherId;
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, promotionsVoucherReservationsUpdateSpecs, { method: "put" });
const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "Keep only rows whose `promotion_id` equals this.", type: "string", required: false },
  { key: "batchId", option: "--batch-id <batch-id>", name: "batch_id", description: "Keep only rows whose `batch_id` equals this.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Keep only rows whose `code` equals this.", type: "string", required: false },
  { key: "codeKey", option: "--code-key <code-key>", name: "code_key", description: "Keep only rows whose `code_key` equals this.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Keep only rows whose `status` equals this.", type: "string", required: false },
  { key: "usageLimit", option: "--usage-limit <usage-limit>", name: "usage_limit", description: "Keep only rows whose `usage_limit` equals this.", type: "string", required: false },
  { key: "usageCount", option: "--usage-count <usage-count>", name: "usage_count", description: "Keep only rows whose `usage_count` equals this.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Keep only rows whose `currency` equals this.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Keep only rows whose `contact_id` equals this.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Keep only rows whose `organization_id` equals this.", type: "string", required: false },
  { key: "reservationRequired", option: "--reservation-required <reservation-required>", name: "reservation_required", description: "Keep only rows whose `reservation_required` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
promotionsVouchers
  .command(`list`)
  .description(`The codes buyers type. A voucher belongs to exactly one promotion and carries four independent limits — how often it may be redeemed, an amount spent down rather than used up, the buyer it was issued to, and its own validity window.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--promotion-id <promotion-id>`, `Keep only rows whose \`promotion_id\` equals this.`)
  .option(`--batch-id <batch-id>`, `Keep only rows whose \`batch_id\` equals this.`)
  .option(`--code <code>`, `Keep only rows whose \`code\` equals this.`)
  .option(`--code-key <code-key>`, `Keep only rows whose \`code_key\` equals this.`)
  .option(`--status <status>`, `Keep only rows whose \`status\` equals this.`)
  .option(`--usage-limit <usage-limit>`, `Keep only rows whose \`usage_limit\` equals this.`)
  .option(`--usage-count <usage-count>`, `Keep only rows whose \`usage_count\` equals this.`)
  .option(`--currency <currency>`, `Keep only rows whose \`currency\` equals this.`)
  .option(`--contact-id <contact-id>`, `Keep only rows whose \`contact_id\` equals this.`)
  .option(`--organization-id <organization-id>`, `Keep only rows whose \`organization_id\` equals this.`)
  .option(`--reservation-required <reservation-required>`, `Keep only rows whose \`reservation_required\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, promotionId, batchId, code, codeKey, status, usageLimit, usageCount, currency, contactId, organizationId, reservationRequired, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/vouchers`;
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
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
        }
        if (batchId !== undefined) {
          _payload[`batch_id`] = batchId;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (codeKey !== undefined) {
          _payload[`code_key`] = codeKey;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (usageLimit !== undefined) {
          _payload[`usage_limit`] = usageLimit;
        }
        if (usageCount !== undefined) {
          _payload[`usage_count`] = usageCount;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (reservationRequired !== undefined) {
          _payload[`reservation_required`] = reservationRequired;
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "The code as it is printed and as a buyer types it.", type: "string", required: true },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "The promotion this row belongs to. Deleting the promotion deletes it.", type: "string", required: true },
  { key: "batchId", option: "--batch-id <batch-id>", name: "batch_id", description: "The batch this code was made in, when it was made in one.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person the code was issued to. Anybody else is refused — a personal apology code is worthless if it can be forwarded.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "The currency a residual value is stated in.", type: "string", required: false },
  { key: "endsAt", option: "--ends-at <ends-at>", name: "ends_at", description: "When it expires. A merchant runs one promotion for a quarter and hands out codes that expire in a fortnight.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "object", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The company it was issued to. Any of its contacts may redeem it.", type: "string", required: false },
  { key: "reservationLimit", option: "--reservation-limit <reservation-limit>", name: "reservation_limit", description: "How many reservations may be held at once. A reservation that never ran out would promise a limited code to everybody who asked.", type: "integer", required: false },
  { key: "reservationRequired", option: "--reservation-required <reservation-required>", name: "reservation_required", description: "When true the code works only for a buyer who has reserved it — which is what makes a code printed in a public place usable at all.", type: "boolean", required: false },
  { key: "residualValue", option: "--residual-value <residual-value>", name: "residual_value", description: "An amount the code is worth, spent down rather than used up — how a goodwill amount survives a smaller first purchase.", type: "number", required: false },
  { key: "startsAt", option: "--starts-at <starts-at>", name: "starts_at", description: "When the code becomes valid. Empty is bounded only by the promotion.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "A leaked code is `disabled`, not deleted: it has to stop working within the minute, and deleting it would take the evidence with it.", type: "string", required: false, enum: ["active","disabled"] },
  { key: "usageLimit", option: "--usage-limit <usage-limit>", name: "usage_limit", description: "How often the code may be redeemed. Zero is unlimited, though the promotion own limits still apply.", type: "integer", required: false },
];
promotionsVouchers
  .command(`create`)
  .description(`Issue a voucher code`)
  .option(`--code <code>`, `The code as it is printed and as a buyer types it.`)
  .option(`--promotion-id <promotion-id>`, `The promotion this row belongs to. Deleting the promotion deletes it.`)
  .option(`--batch-id <batch-id>`, `The batch this code was made in, when it was made in one.`)
  .option(`--contact-id <contact-id>`, `The person the code was issued to. Anybody else is refused — a personal apology code is worthless if it can be forwarded.`)
  .option(`--currency <currency>`, `The currency a residual value is stated in.`)
  .option(`--ends-at <ends-at>`, `When it expires. A merchant runs one promotion for a quarter and hands out codes that expire in a fortnight.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--organization-id <organization-id>`, `The company it was issued to. Any of its contacts may redeem it.`)
  .option(`--reservation-limit <reservation-limit>`, `How many reservations may be held at once. A reservation that never ran out would promise a limited code to everybody who asked.`, parseInteger)
  .option(
    `--reservation-required [value]`,
    `When true the code works only for a buyer who has reserved it — which is what makes a code printed in a public place usable at all.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--residual-value <residual-value>`, `An amount the code is worth, spent down rather than used up — how a goodwill amount survives a smaller first purchase.`, parseInteger)
  .option(`--starts-at <starts-at>`, `When the code becomes valid. Empty is bounded only by the promotion.`)
  .option(`--status <status>`, `A leaked code is \`disabled\`, not deleted: it has to stop working within the minute, and deleting it would take the evidence with it.`)
  .option(`--usage-limit <usage-limit>`, `How often the code may be redeemed. Zero is unlimited, though the promotion own limits still apply.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, promotionId, batchId, contactId, currency, endsAt, metadata, organizationId, reservationLimit, reservationRequired, residualValue, startsAt, status, usageLimit } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/vouchers`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (batchId !== undefined) {
          _payload[`batch_id`] = batchId;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (endsAt !== undefined) {
          _payload[`ends_at`] = endsAt;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
        }
        if (reservationLimit !== undefined) {
          _payload[`reservation_limit`] = reservationLimit;
        }
        if (reservationRequired !== undefined) {
          _payload[`reservation_required`] = reservationRequired;
        }
        if (residualValue !== undefined) {
          _payload[`residual_value`] = residualValue;
        }
        if (startsAt !== undefined) {
          _payload[`starts_at`] = startsAt;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (usageLimit !== undefined) {
          _payload[`usage_limit`] = usageLimit;
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/vouchers", hasLimit: true } },
];
promotionsVouchers
  .command(`delete`)
  .description(`Delete a voucher that was never redeemed`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`promotions-vouchers delete`);
        const _client = await sdkForProject();
        const _apiPath = `/promotions/vouchers/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/vouchers", hasLimit: true } },
];
promotionsVouchers
  .command(`get`)
  .description(`Read one voucher`)
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
        const _apiPath = `/promotions/vouchers/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/vouchers", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "The code as it is printed and as a buyer types it.", type: "string", required: true },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "The promotion this row belongs to. Deleting the promotion deletes it.", type: "string", required: true },
  { key: "batchId", option: "--batch-id <batch-id>", name: "batch_id", description: "The batch this code was made in, when it was made in one.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person the code was issued to. Anybody else is refused — a personal apology code is worthless if it can be forwarded.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "The currency a residual value is stated in.", type: "string", required: false },
  { key: "endsAt", option: "--ends-at <ends-at>", name: "ends_at", description: "When it expires. A merchant runs one promotion for a quarter and hands out codes that expire in a fortnight.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "object", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The company it was issued to. Any of its contacts may redeem it.", type: "string", required: false },
  { key: "reservationLimit", option: "--reservation-limit <reservation-limit>", name: "reservation_limit", description: "How many reservations may be held at once. A reservation that never ran out would promise a limited code to everybody who asked.", type: "integer", required: false },
  { key: "reservationRequired", option: "--reservation-required <reservation-required>", name: "reservation_required", description: "When true the code works only for a buyer who has reserved it — which is what makes a code printed in a public place usable at all.", type: "boolean", required: false },
  { key: "residualValue", option: "--residual-value <residual-value>", name: "residual_value", description: "An amount the code is worth, spent down rather than used up — how a goodwill amount survives a smaller first purchase.", type: "number", required: false },
  { key: "startsAt", option: "--starts-at <starts-at>", name: "starts_at", description: "When the code becomes valid. Empty is bounded only by the promotion.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "A leaked code is `disabled`, not deleted: it has to stop working within the minute, and deleting it would take the evidence with it.", type: "string", required: false, enum: ["active","disabled"] },
  { key: "usageLimit", option: "--usage-limit <usage-limit>", name: "usage_limit", description: "How often the code may be redeemed. Zero is unlimited, though the promotion own limits still apply.", type: "integer", required: false },
];
promotionsVouchers
  .command(`update`)
  .description(`Correct a voucher`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--code <code>`, `The code as it is printed and as a buyer types it.`)
  .option(`--promotion-id <promotion-id>`, `The promotion this row belongs to. Deleting the promotion deletes it.`)
  .option(`--batch-id <batch-id>`, `The batch this code was made in, when it was made in one.`)
  .option(`--contact-id <contact-id>`, `The person the code was issued to. Anybody else is refused — a personal apology code is worthless if it can be forwarded.`)
  .option(`--currency <currency>`, `The currency a residual value is stated in.`)
  .option(`--ends-at <ends-at>`, `When it expires. A merchant runs one promotion for a quarter and hands out codes that expire in a fortnight.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--organization-id <organization-id>`, `The company it was issued to. Any of its contacts may redeem it.`)
  .option(`--reservation-limit <reservation-limit>`, `How many reservations may be held at once. A reservation that never ran out would promise a limited code to everybody who asked.`, parseInteger)
  .option(
    `--reservation-required [value]`,
    `When true the code works only for a buyer who has reserved it — which is what makes a code printed in a public place usable at all.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--residual-value <residual-value>`, `An amount the code is worth, spent down rather than used up — how a goodwill amount survives a smaller first purchase.`, parseInteger)
  .option(`--starts-at <starts-at>`, `When the code becomes valid. Empty is bounded only by the promotion.`)
  .option(`--status <status>`, `A leaked code is \`disabled\`, not deleted: it has to stop working within the minute, and deleting it would take the evidence with it.`)
  .option(`--usage-limit <usage-limit>`, `How often the code may be redeemed. Zero is unlimited, though the promotion own limits still apply.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, promotionId, batchId, contactId, currency, endsAt, metadata, organizationId, reservationLimit, reservationRequired, residualValue, startsAt, status, usageLimit } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/vouchers/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (batchId !== undefined) {
          _payload[`batch_id`] = batchId;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (endsAt !== undefined) {
          _payload[`ends_at`] = endsAt;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
        }
        if (reservationLimit !== undefined) {
          _payload[`reservation_limit`] = reservationLimit;
        }
        if (reservationRequired !== undefined) {
          _payload[`reservation_required`] = reservationRequired;
        }
        if (residualValue !== undefined) {
          _payload[`residual_value`] = residualValue;
        }
        if (startsAt !== undefined) {
          _payload[`starts_at`] = startsAt;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (usageLimit !== undefined) {
          _payload[`usage_limit`] = usageLimit;
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
registerPromptSpecs(promotionsVouchers.commands.at(-1)!, updateSpecs, { method: "put" });
