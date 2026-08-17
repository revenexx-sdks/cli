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

export const carts = new Command("carts")
  .description(
    commandDescriptions["carts"] ??
      `The cart itself and every move it makes. Who owns one — a customer as \`contact_id\`, or a guest as the storefront's own \`session_key\`, never neither — how it is opened, read, renamed and thrown away, which of an owner's carts is THE current one, and the lifecycle a cart travels: abandoned and taken back, handed to order management, folded into another cart, or claimed for a contact on login. The scheduled sweep that abandons and deletes on a clock is the same lifecycle without a human, so it lives here too, as do the vocabularies behind the enums these routes enforce. The LINES inside a cart are their own group, and so is moving carts in and out as files.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "One cart, in list form — the same row carts.get answers, but inside the page envelope.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Exact name, not a search: 'Weekly' does not find 'Weekly order'. Useful with contact_id, to resume a named cart a buyer keeps.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "By lifecycle status — the abandoned queue, the ordered ones, the merged trail.", type: "string", required: false, enum: ["active","abandoned","ordered","merged"] },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Every cart of one customer. With multi_cart_enabled this is a list, not a row.", type: "string", required: false },
  { key: "sessionKey", option: "--session-key <session-key>", name: "session_key", description: "Every cart of one guest session — what a storefront asks for before anybody logs in, and what carts.claim then hands over.", type: "string", required: false },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", description: "Carts opened in one sales channel.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Carts priced in one currency.", type: "string", required: false },
  { key: "isCurrent", option: "--is-current <is-current>", name: "is_current", description: "The owner's current cart — the flag carts.activate sets, and the only way to read what it wrote. Pair it with contact_id or session_key; on its own it selects every current cart in the tenant.", type: "boolean", required: false },
  { key: "itemCount", option: "--item-count <item-count>", name: "item_count", description: "Exact total quantity. `?item_count=0` is the one that earns its place: the empty carts.", type: "integer", required: false },
  { key: "subtotal", option: "--subtotal <subtotal>", name: "subtotal", description: "Exact subtotal. Equality only — there is no range form on this route, so this finds `0` and little else.", type: "number", required: false },
  { key: "abandonedAt", option: "--abandoned-at <abandoned-at>", name: "abandoned_at", description: "Exact instant, not a range. Of little use on its own; `status=abandoned` is the question people actually have.", type: "string", required: false },
  { key: "orderedAt", option: "--ordered-at <ordered-at>", name: "ordered_at", description: "Exact instant, not a range. `status=ordered` is usually the question.", type: "string", required: false },
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "The cart behind an order number — the join order management and support both need.", type: "string", required: false },
  { key: "mergedIntoCartId", option: "--merged-into-cart-id <merged-into-cart-id>", name: "merged_into_cart_id", description: "Every cart that was merged INTO this one: the other half of the trail, and the answer to \"what did this cart absorb\".", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact instant, not a range: this matches a timestamp to the microsecond, so it is for reproducing a row, not for reporting on a day.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact instant, not a range. Idleness is the sweep's business, not a filter's.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
carts
  .command(`list`)
  .description(`The cart index, and the route a storefront resumes a session with: \`?contact_id=…\` for a customer's carts, \`?session_key=…\` for a guest's, and \`?is_current=true\` alongside one of those two for the single cart carts.activate last marked — this list is the ONLY place that flag can be read back, and on its own the filter selects every current cart in the tenant. Filters are exact equality and never a search, unknown keys are dropped rather than refused, and \`filter\` echoes what was understood. Each row carries its own stored totals — \`item_count\` is the sum of the line QUANTITIES, not the number of lines — but never its lines: those are one call per cart. With no filter at all this is every cart the tenant holds, paged, which is a report rather than a session lookup.`)
  .option(`--id <id>`, `One cart, in list form — the same row carts.get answers, but inside the page envelope.`)
  .option(`--name <name>`, `Exact name, not a search: 'Weekly' does not find 'Weekly order'. Useful with contact_id, to resume a named cart a buyer keeps.`)
  .option(`--status <status>`, `By lifecycle status — the abandoned queue, the ordered ones, the merged trail.`)
  .option(`--contact-id <contact-id>`, `Every cart of one customer. With multi_cart_enabled this is a list, not a row.`)
  .option(`--session-key <session-key>`, `Every cart of one guest session — what a storefront asks for before anybody logs in, and what carts.claim then hands over.`)
  .option(`--channel-id <channel-id>`, `Carts opened in one sales channel.`)
  .option(`--currency <currency>`, `Carts priced in one currency.`)
  .option(
    `--is-current [value]`,
    `The owner's current cart — the flag carts.activate sets, and the only way to read what it wrote. Pair it with contact_id or session_key; on its own it selects every current cart in the tenant.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--item-count <item-count>`, `Exact total quantity. \`?item_count=0\` is the one that earns its place: the empty carts.`, parseInteger)
  .option(`--subtotal <subtotal>`, `Exact subtotal. Equality only — there is no range form on this route, so this finds \`0\` and little else.`, parseInteger)
  .option(`--abandoned-at <abandoned-at>`, `Exact instant, not a range. Of little use on its own; \`status=abandoned\` is the question people actually have.`)
  .option(`--ordered-at <ordered-at>`, `Exact instant, not a range. \`status=ordered\` is usually the question.`)
  .option(`--order-ref <order-ref>`, `The cart behind an order number — the join order management and support both need.`)
  .option(`--merged-into-cart-id <merged-into-cart-id>`, `Every cart that was merged INTO this one: the other half of the trail, and the answer to "what did this cart absorb".`)
  .option(`--created-at <created-at>`, `Exact instant, not a range: this matches a timestamp to the microsecond, so it is for reproducing a row, not for reporting on a day.`)
  .option(`--updated-at <updated-at>`, `Exact instant, not a range. Idleness is the sweep's business, not a filter's.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, name, status, contactId, sessionKey, channelId, currency, isCurrent, itemCount, subtotal, abandonedAt, orderedAt, orderRef, mergedIntoCartId, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (sessionKey !== undefined) {
          _payload[`session_key`] = sessionKey;
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (isCurrent !== undefined) {
          _payload[`is_current`] = isCurrent;
        }
        if (itemCount !== undefined) {
          _payload[`item_count`] = itemCount;
        }
        if (subtotal !== undefined) {
          _payload[`subtotal`] = subtotal;
        }
        if (abandonedAt !== undefined) {
          _payload[`abandoned_at`] = abandonedAt;
        }
        if (orderedAt !== undefined) {
          _payload[`ordered_at`] = orderedAt;
        }
        if (orderRef !== undefined) {
          _payload[`order_ref`] = orderRef;
        }
        if (mergedIntoCartId !== undefined) {
          _payload[`merged_into_cart_id`] = mergedIntoCartId;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
        }
        if (updatedAt !== undefined) {
          _payload[`updated_at`] = updatedAt;
        }
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
        }
        if (order !== undefined) {
          _payload[`order`] = order;
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
registerPromptSpecs(carts.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", description: "The sales channel this cart is being opened in, as a channel of the channels app. Stored for attribution; nothing in this app reads it.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The customer who owns this cart, as a contact of the customers app. Send this OR session_key — a cart with neither owner is refused.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code the cart is priced in (default EUR). Lines added without a currency inherit it.", type: "string", required: false },
  { key: "isCurrent", option: "--is-current <is-current>", name: "is_current", description: "Make this THE current cart of its owner as it is created — the same thing carts.activate does later, and it clears the flag on every sibling cart of the same owner.", type: "boolean", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form data the storefront hangs on the cart. Stored and returned verbatim; no key in here is read by this app, and none is indexed.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "What the buyer calls this cart (default 'Cart'). An empty string is legal and lands on the default.", type: "string", required: false },
  { key: "sessionKey", option: "--session-key <session-key>", name: "session_key", description: "The guest session that owns this cart — the key the storefront already keeps in its own session or cookie. Any non-empty string is accepted; this app issues none and parses none, so the example shows a shape and not a format. Send this OR contact_id.", type: "string", required: false },
];
carts
  .command(`create`)
  .description(`Opens an empty cart. The one thing it requires is an OWNER — \`contact_id\` for a signed-in customer or \`session_key\` for a guest, never neither: that is a database check on the table, and this route refuses it first with a 400 so the caller gets a sentence rather than a constraint name. Everything else is defaulted: the name 'Cart', currency EUR, status 'active', both totals 0. No column of a cart is unique, so one owner may hold as many carts as they like — unless the tenant's \`multi_cart_enabled\` is off, in which case a second ACTIVE cart for the same owner answers 409 naming the cart that already exists, because a storefront that hit that wants to fill THAT cart. Send \`is_current: true\` to have the new cart made current in the same call, which clears the flag on every sibling of the same owner. Lines are added afterwards, one call each or one bulk replace.`)
  .option(`--channel-id <channel-id>`, `The sales channel this cart is being opened in, as a channel of the channels app. Stored for attribution; nothing in this app reads it.`)
  .option(`--contact-id <contact-id>`, `The customer who owns this cart, as a contact of the customers app. Send this OR session_key — a cart with neither owner is refused.`)
  .option(`--currency <currency>`, `ISO 4217 code the cart is priced in (default EUR). Lines added without a currency inherit it.`)
  .option(
    `--is-current [value]`,
    `Make this THE current cart of its owner as it is created — the same thing carts.activate does later, and it clears the flag on every sibling cart of the same owner.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--metadata <metadata>`, `Free-form data the storefront hangs on the cart. Stored and returned verbatim; no key in here is read by this app, and none is indexed.`)
  .option(`--name <name>`, `What the buyer calls this cart (default 'Cart'). An empty string is legal and lands on the default.`)
  .option(`--session-key <session-key>`, `The guest session that owns this cart — the key the storefront already keeps in its own session or cookie. Any non-empty string is accepted; this app issues none and parses none, so the example shows a shape and not a format. Send this OR contact_id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channelId, contactId, currency, isCurrent, metadata, name, sessionKey } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (isCurrent !== undefined) {
          _payload[`is_current`] = isCurrent;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (sessionKey !== undefined) {
          _payload[`session_key`] = sessionKey;
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
registerPromptSpecs(carts.commands.at(-1)!, createSpecs, { method: "post" });
const claimSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The contact taking ownership. Every active cart of that session ends up with this contact — adopted as it stands, or folded into `target_cart_id`.", type: "string", required: true },
  { key: "sessionKey", option: "--session-key <session-key>", name: "session_key", description: "The guest session whose active carts are handed over — the key the storefront keeps in its own session or cookie and has been sending on every anonymous call. This app neither issues nor parses it, so the example shows the shape of an opaque token and not a format anything enforces.", type: "string", required: true },
  { key: "strategy", option: "--strategy <strategy>", name: "strategy", description: "Override the tenant's cart_merge_strategy for this call: 'merge' keeps the target cart's own lines, 'replace' clears them first. Omit to use the setting.", type: "string", required: false, enum: ["merge","replace"] },
  { key: "targetCartId", option: "--target-cart-id <target-cart-id>", name: "target_cart_id", description: "Merge the session carts into this cart instead of adopting them.", type: "string", required: false },
];
carts
  .command(`claim`)
  .description(`The login call, and the one route that turns a guest into a customer: every ACTIVE cart of one session_key is handed to a contact_id, which is what a storefront fires the moment somebody signs in with a basket already filled. There are two ways it can land, and the body picks between them. Without a target_cart_id the session carts are ADOPTED as they stand — same carts, same lines, contact_id set and session_key cleared, nothing copied and nothing closed. With a target_cart_id they are instead folded into that cart, which survives while each session cart is closed as status merged; 'adopted' and 'merged' in the answer say which of the two happened to each one. With a target cart, cart_merge_strategy decides what happens to the target's OWN lines: 'merge' keeps them and folds the session lines in, 'replace' clears them first. 'strategy' overrides it for one call (merge | replace); the answer always echoes which one ran and how many lines a replace removed.`)
  .option(`--contact-id <contact-id>`, `The contact taking ownership. Every active cart of that session ends up with this contact — adopted as it stands, or folded into \`target_cart_id\`.`)
  .option(`--session-key <session-key>`, `The guest session whose active carts are handed over — the key the storefront keeps in its own session or cookie and has been sending on every anonymous call. This app neither issues nor parses it, so the example shows the shape of an opaque token and not a format anything enforces.`)
  .option(`--strategy <strategy>`, `Override the tenant's cart_merge_strategy for this call: 'merge' keeps the target cart's own lines, 'replace' clears them first. Omit to use the setting.`)
  .option(`--target-cart-id <target-cart-id>`, `Merge the session carts into this cart instead of adopting them.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, sessionKey, strategy, targetCartId } = await promptForMissing(
          _options,
          claimSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/claim`;
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
        if (sessionKey !== undefined) {
          _payload[`session_key`] = sessionKey;
        }
        if (strategy !== undefined) {
          _payload[`strategy`] = strategy;
        }
        if (targetCartId !== undefined) {
          _payload[`target_cart_id`] = targetCartId;
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
registerPromptSpecs(carts.commands.at(-1)!, claimSpecs, { method: "post" });
const maintenanceRunSpecs: PromptSpec[] = [
  { key: "dryRun", option: "--dry-run <dry-run>", name: "dry_run", description: "Report what the sweep WOULD do and write nothing. Worth doing before a first retention run: cart_ttl_days deletes carts and their lines.", type: "boolean", required: false },
];
carts
  .command(`maintenance-run`)
  .description(`Two sweeps in one pass. abandon_after_minutes marks active carts that have sat untouched past the window as abandoned (stamping abandoned_at, which nothing else in the platform ever sets — without this the abandonment funnel is empty by construction, not empty because nobody abandons carts). cart_ttl_days / guest_cart_ttl_days then DELETE carts past their retention window, line items included; both default to 0 (never), and an 'ordered' cart is never touched at any setting because it is the source record of a sale. Send dry_run to get the same counts and cart ids while writing nothing. The platform runs this per installed tenant on the schedule; it is idempotent, so calling it by hand between ticks is safe.`)
  .option(
    `--dry-run [value]`,
    `Report what the sweep WOULD do and write nothing. Worth doing before a first retention run: cart_ttl_days deletes carts and their lines.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { dryRun } = await promptForMissing(
          _options,
          maintenanceRunSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/maintenance/run`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (dryRun !== undefined) {
          _payload[`dry_run`] = dryRun;
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
registerPromptSpecs(carts.commands.at(-1)!, maintenanceRunSpecs, { method: "post" });
const mergeSpecs: PromptSpec[] = [
  { key: "sourceCartId", option: "--source-cart-id <source-cart-id>", name: "source_cart_id", description: "The cart being folded in. It must be active, and it does NOT survive as a workspace: its lines are copied into the target, it becomes status merged, and merged_into_cart_id points at the target. Its own lines stay on it as the record of what was moved.", type: "string", required: true },
  { key: "targetCartId", option: "--target-cart-id <target-cart-id>", name: "target_cart_id", description: "The cart that SURVIVES. Must be active; it gains the source's lines (identical product lines at the same price adding up) and its totals are recomputed.", type: "string", required: true },
];
carts
  .command(`merge`)
  .description(`Which of the two carts survives is the whole question, and the answer is the TARGET: the source's lines are COPIED into the target, the target keeps every line it already had, its totals are recomputed, and it is the cart the caller goes on using. Nothing is replaced and nothing is moved — the source keeps its own line rows and is closed with status 'merged' and \`merged_into_cart_id\` pointing at the target, so a merged cart stays readable as the record of what went where. On the way in, a plain product line with the same product/sku AND the same \`unit_price\` as a line already in the target adds its quantity to that line; configured and custom lines always land as new ones. Both carts must be active and must differ, and the tenant's line limits are enforced on the target as the copies land (422). Reach for carts.merge_into where the caller holds one cart id and not two.`)
  .option(`--source-cart-id <source-cart-id>`, `The cart being folded in. It must be active, and it does NOT survive as a workspace: its lines are copied into the target, it becomes status merged, and merged_into_cart_id points at the target. Its own lines stay on it as the record of what was moved.`)
  .option(`--target-cart-id <target-cart-id>`, `The cart that SURVIVES. Must be active; it gains the source's lines (identical product lines at the same price adding up) and its totals are recomputed.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { sourceCartId, targetCartId } = await promptForMissing(
          _options,
          mergeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/merge`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (sourceCartId !== undefined) {
          _payload[`source_cart_id`] = sourceCartId;
        }
        if (targetCartId !== undefined) {
          _payload[`target_cart_id`] = targetCartId;
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
registerPromptSpecs(carts.commands.at(-1)!, mergeSpecs, { method: "post" });
const vocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
carts
  .command(`vocabularies-list`)
  .description(`Discovery for the vocabulary routes: every enum this app publishes, each as its name, its title and its description and nothing else. The VALUES are deliberately not here — this is the index a client builds a menu from, and one call per vocabulary fills it. Names: io-apply-modes, io-directions, io-entities, io-formats, item-types, statuses. Fetch one with GET /carts/vocabularies/{name}; a client holding the qualified pair 'carts.<name>' builds that URL from the pair alone.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { filter } = await promptForMissing(
          _options,
          vocabulariesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/vocabularies`;
        const _payload: RequestParams = {};
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
registerPromptSpecs(carts.commands.at(-1)!, vocabulariesListSpecs, { method: "get" });
const vocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary name — the part after the dot in the qualified id.", type: "string", required: true, enum: ["io-apply-modes","io-directions","io-entities","io-formats","item-types","statuses"], resource: { listPath: "/carts/vocabularies", hasLimit: false } },
];
carts
  .command(`vocabularies-get`)
  .description(`One vocabulary with its values filled in — every value permitted by the column behind it, each carrying the key the database stores, a human title, a description where one was written and the badge tone a UI should render it in, which is everything a select or a status chip needs from one call. The values are read out of the column's CHECK constraint, so the served set IS the enforced set and the two cannot drift — a value added to the constraint appears here even before anyone labels it, titled from its own key. Values come back in constraint order, which is the order a select should offer. 'closed' says the set is exhaustive, so a value outside it is stale data rather than a missing label. Names: io-apply-modes, io-directions, io-entities, io-formats, item-types, statuses.`)
  .option(`--name <name>`, `The vocabulary name — the part after the dot in the qualified id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name } = await promptForMissing(
          _options,
          vocabulariesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(carts.commands.at(-1)!, vocabulariesGetSpecs, { method: "get" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The cart, by its id — the `id` every cart answer carries. A uuid: the data plane casts the segment, so a code or a slug is refused before the cart is looked up.", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
];
carts
  .command(`delete`)
  .description(`Removes the cart row and, through the \`on delete cascade\` on \`cart_items.cart_id\`, every line in it. There is no soft delete and no undo. One status is protected and it is protected permanently: an 'ordered' cart is the source record of a sale — the order carries its id in \`cart_id\` and the order.placed event records it — so this route refuses it with 400 and there is no flag, no force and no lifecycle route that makes it deletable. Do not go looking for one. 'active', 'abandoned' and 'merged' are all deletable, which is deliberate and is the same set the cart-maintenance sweep removes on a retention window: clearing out abandoned guest carts is the main thing anyone deletes a cart for, and a merged cart's lines were COPIED into the target, which still holds them. What the delete does NOT take with it is the trail: \`merged_into_cart_id\` is a plain uuid column and not a foreign key, so deleting a cart that other carts were merged INTO leaves those carts pointing at a row that no longer exists, and nothing refuses the delete or clears the pointer — the retention sweep does the same, so this is a property of the column and not of this route. For a cart a buyer simply walked away from, carts.abandon keeps the row and the funnel; for deleting on a retention window, the cart-maintenance sweep does it per market and can be asked first with \`dry_run\`.`)
  .option(`--id <id>`, `The cart, by its id — the \`id\` every cart answer carries. A uuid: the data plane casts the segment, so a code or a slug is refused before the cart is looked up.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`carts delete`);
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(carts.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The cart, by its id — the `id` every cart answer carries. A uuid: the data plane casts the segment, so a code or a slug is refused before the cart is looked up.", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
];
carts
  .command(`get`)
  .description(`One cart with its owner, its totals and its lifecycle stamps — and none of its lines: those are a separate call (\`GET /carts/{cart_id}/items\`), because a cart row is small and a filled cart is not. The two totals are derived and stored, never taken from a caller: \`item_count\` is the sum of the line QUANTITIES rather than the number of lines (two lines of five pieces answer 10, not 2) and \`subtotal\` the sum of the line totals, net of shipping and tax; both are recomputed after every line write. \`status\` says what may still be done — only an 'active' cart accepts a write of any kind, 'abandoned' is the one reversible ending, and a 'merged' cart carries \`merged_into_cart_id\`, which is the trail to the cart its lines were copied into.`)
  .option(`--id <id>`, `The cart, by its id — the \`id\` every cart answer carries. A uuid: the data plane casts the segment, so a code or a slug is refused before the cart is looked up.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(carts.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The cart, by its id — the `id` every cart answer carries. A uuid: the data plane casts the segment, so a code or a slug is refused before the cart is looked up.", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", description: "Move the cart to another sales channel.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code. Changes what NEW lines inherit; lines already in the cart keep the currency they were added with.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form data the storefront hangs on the cart. Stored and returned verbatim; no key in here is read by this app, and none is indexed.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Rename the cart. Unlike on create, this is written verbatim — `null` and `''` are refused by the database.", type: "string", required: false },
];
carts
  .command(`update`)
  .description(`The four columns a cart's own editing screen owns, and only those: \`name\`, \`currency\`, \`channel_id\` and \`metadata\`. Everything else about a cart is either derived or a lifecycle move, and both are deliberately out of reach here — \`item_count\` and \`subtotal\` are recomputed from the lines, \`status\` travels through the action routes (activate, abandon, reopen, order, merge) so that every transition is guarded, and \`market_id\` is the platform's scope on the row rather than a column this app writes. A payload carrying none of the four answers 400 rather than storing nothing quietly, so a caller never believes an ignored field was saved. The owner is not updatable either: a guest cart becomes a customer's through carts.claim.`)
  .option(`--id <id>`, `The cart, by its id — the \`id\` every cart answer carries. A uuid: the data plane casts the segment, so a code or a slug is refused before the cart is looked up.`)
  .option(`--channel-id <channel-id>`, `Move the cart to another sales channel.`)
  .option(`--currency <currency>`, `ISO 4217 code. Changes what NEW lines inherit; lines already in the cart keep the currency they were added with.`)
  .option(`--metadata <metadata>`, `Free-form data the storefront hangs on the cart. Stored and returned verbatim; no key in here is read by this app, and none is indexed.`)
  .option(`--name <name>`, `Rename the cart. Unlike on create, this is written verbatim — \`null\` and \`''\` are refused by the database.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, channelId, currency, metadata, name } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
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
registerPromptSpecs(carts.commands.at(-1)!, updateSpecs, { method: "put" });
const abandonSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The cart, by its id — the `id` every cart answer carries. A uuid: the data plane casts the segment, so a code or a slug is refused before the cart is looked up.", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
];
carts
  .command(`abandon`)
  .description(`The by-hand half of the abandonment funnel: an active cart becomes 'abandoned', \`abandoned_at\` is stamped, and \`is_current\` is cleared — so its owner is left with no current cart until another one is activated. Nothing else in the platform writes \`abandoned_at\`; the only other writer is the cart-maintenance sweep, which does exactly this once a cart has sat untouched past the market's \`abandon_after_minutes\`. This is the one reversible ending: the lines are untouched throughout and carts.reopen takes the cart back. Only an active cart can be abandoned — an ordered or merged cart is already finished and answers 400 naming the status it actually holds.`)
  .option(`--id <id>`, `The cart, by its id — the \`id\` every cart answer carries. A uuid: the data plane casts the segment, so a code or a slug is refused before the cart is looked up.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          abandonSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}/abandon`.replace(`{id}`, id);
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
registerPromptSpecs(carts.commands.at(-1)!, abandonSpecs, { method: "post" });
const activateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The cart, by its id — the `id` every cart answer carries. A uuid: the data plane casts the segment, so a code or a slug is refused before the cart is looked up.", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
];
carts
  .command(`activate`)
  .description(`Activate writes exactly one thing: \`is_current\` on this cart, cleared on every other cart of the same owner (the same contact_id, or the same session_key). It does NOT change the status — an active cart stays active, and only an active cart may be made current. Read it back with \`GET /carts?is_current=true\` plus the owner: that filter is the only way to see what this route wrote, and a storefront resuming a session is its main caller. The flag is cleared again by abandoning, ordering or merging the cart, so an owner can legitimately have no current cart at all.`)
  .option(`--id <id>`, `The cart, by its id — the \`id\` every cart answer carries. A uuid: the data plane casts the segment, so a code or a slug is refused before the cart is looked up.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          activateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}/activate`.replace(`{id}`, id);
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
registerPromptSpecs(carts.commands.at(-1)!, activateSpecs, { method: "post" });
const mergeIntoSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The SOURCE cart — the one whose lines move and which becomes status merged.", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
  { key: "targetCartId", option: "--target-cart-id <target-cart-id>", name: "target_cart_id", description: "Receiving cart (must be active). The cart in the path is the source and becomes status merged.", type: "string", required: true },
];
carts
  .command(`merge-into`)
  .description(`Identical to carts.merge, with the SOURCE taken from the path — which is what makes the merge reachable from anything holding one cart and only one: a Cockpit row action, a detail page, a storefront session. The cart in the path is therefore the one that ends: its lines are copied into the \`target_cart_id\` named in the body, that target keeps its own lines and survives, and the path cart is closed with status 'merged' and \`merged_into_cart_id\` pointing at it. Getting the two the wrong way round is the mistake this route exists to make hard, so read the path id as "the cart I am giving away". Both carts must be active and must differ.`)
  .option(`--id <id>`, `The SOURCE cart — the one whose lines move and which becomes status merged.`)
  .option(`--target-cart-id <target-cart-id>`, `Receiving cart (must be active). The cart in the path is the source and becomes status merged.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, targetCartId } = await promptForMissing(
          _options,
          mergeIntoSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}/merge-into`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (targetCartId !== undefined) {
          _payload[`target_cart_id`] = targetCartId;
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
registerPromptSpecs(carts.commands.at(-1)!, mergeIntoSpecs, { method: "post" });
const orderSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The cart, by its id — the `id` every cart answer carries. A uuid: the data plane casts the segment, so a code or a slug is refused before the cart is looked up.", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "The order number this cart becomes, in order management's own numbering. Stored on the cart — filtering on it is how anyone gets from an order back to the cart behind it — and it is also the reference the stock reservation is booked under. Omit it and the cart id is used for the reservation instead.", type: "string", required: false },
];
carts
  .command(`order`)
  .description(`The hand-over to order management, and the end of the cart as a workspace: an ACTIVE cart becomes 'ordered', ordered_at is stamped, and the order_ref the call carries — order management's own number for the order this cart became — is stored on the cart, which is what lets anyone filter their way from an order number back to the cart behind it. Nothing moves out of 'ordered' afterwards, and no route will delete it. The conversion applies the two tenant decisions a cart cannot make for itself. price_snapshot_mode (snapshot | live) settles which of a line's two prices is charged — the snapshot the buyer was shown, or the current unit_price — and the cart's subtotal is rewritten to match, so cart and order can never disagree; 'pricing' reports the mode, the lines it rewrote and the subtotal on both sides. convert_reserves_stock (never | request | require) decides whether inventories is asked to hold the lines; at 'require' a refusal answers 409 and the cart stays active and unchanged. The reservation is attempted BEFORE anything is written.`)
  .option(`--id <id>`, `The cart, by its id — the \`id\` every cart answer carries. A uuid: the data plane casts the segment, so a code or a slug is refused before the cart is looked up.`)
  .option(`--order-ref <order-ref>`, `The order number this cart becomes, in order management's own numbering. Stored on the cart — filtering on it is how anyone gets from an order back to the cart behind it — and it is also the reference the stock reservation is booked under. Omit it and the cart id is used for the reservation instead.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, orderRef } = await promptForMissing(
          _options,
          orderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}/order`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (orderRef !== undefined) {
          _payload[`order_ref`] = orderRef;
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
registerPromptSpecs(carts.commands.at(-1)!, orderSpecs, { method: "post" });
const reopenSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The cart, by its id — the `id` every cart answer carries. A uuid: the data plane casts the segment, so a code or a slug is refused before the cart is looked up.", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
];
carts
  .command(`reopen`)
  .description(`Takes an abandoned cart back to 'active' with its lines exactly as they were — what a storefront calls when a buyer follows a recovery mail, and the way out of the 400 a write gets on a cart the maintenance sweep closed while nobody was looking. It also CLEARS \`abandoned_at\`, so a cart that was abandoned and reopened leaves nothing behind in the funnel: the funnel counts carts that are still abandoned, not carts that ever were. It does not restore \`is_current\` — a reopened cart is active but not current until carts.activate says so. Only an abandoned cart may be reopened; 'ordered' and 'merged' are final and answer 400 naming the status the cart holds.`)
  .option(`--id <id>`, `The cart, by its id — the \`id\` every cart answer carries. A uuid: the data plane casts the segment, so a code or a slug is refused before the cart is looked up.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          reopenSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}/reopen`.replace(`{id}`, id);
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
registerPromptSpecs(carts.commands.at(-1)!, reopenSpecs, { method: "post" });
