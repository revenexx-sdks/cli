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

export const promotionsPromotions = new Command("promotions-promotions")
  .description(
    commandDescriptions["promotionsPromotions"] ??
      `What a merchant writes down: the conditions a purchase has to meet and the effects it then gets. A promotion is reached automatically or only by a voucher code, runs inside a window with an optional weekday or day-of-month recurrence read in its own timezone, and is bounded by a discount budget, a redemption ceiling and per-contact or per-organisation limits. Conditions are a tree — groups of all or any holding questions and further groups, with negation — so an offer a merchant states as one sentence stays one promotion. Stacking groups decide how several promotions are weighed together, and bundles express the offers that count units rather than money.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const promotionsBundlesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "Keep only rows whose `promotion_id` equals this.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Keep only rows whose `name` equals this.", type: "string", required: false },
  { key: "unitsRequired", option: "--units-required <units-required>", name: "units_required", description: "Keep only rows whose `units_required` equals this.", type: "string", required: false },
  { key: "maxPerCart", option: "--max-per-cart <max-per-cart>", name: "max_per_cart", description: "Keep only rows whose `max_per_cart` equals this.", type: "string", required: false },
  { key: "allocation", option: "--allocation <allocation>", name: "allocation", description: "Keep only rows whose `allocation` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
promotionsPromotions
  .command(`promotions-bundles-list`)
  .description(`The offers that count items rather than money: buy three pay two, the cheapest of any four free, a packet of coffee with every machine. A bundle forms from the units a cart holds and repeats up to a cap.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--promotion-id <promotion-id>`, `Keep only rows whose \`promotion_id\` equals this.`)
  .option(`--name <name>`, `Keep only rows whose \`name\` equals this.`)
  .option(`--units-required <units-required>`, `Keep only rows whose \`units_required\` equals this.`)
  .option(`--max-per-cart <max-per-cart>`, `Keep only rows whose \`max_per_cart\` equals this.`)
  .option(`--allocation <allocation>`, `Keep only rows whose \`allocation\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, promotionId, name, unitsRequired, maxPerCart, allocation, filter } = await promptForMissing(
          _options,
          promotionsBundlesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/bundles`;
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
        if (unitsRequired !== undefined) {
          _payload[`units_required`] = unitsRequired;
        }
        if (maxPerCart !== undefined) {
          _payload[`max_per_cart`] = maxPerCart;
        }
        if (allocation !== undefined) {
          _payload[`allocation`] = allocation;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsBundlesListSpecs, { method: "get" });
const promotionsBundlesCreateSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "What the bundle is called, and what every discount it produces is attributed to.", type: "string", required: true },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "The promotion this row belongs to. Deleting the promotion deletes it.", type: "string", required: true },
  { key: "allocation", option: "--allocation <allocation>", name: "allocation", description: "How the units that form a bundle are picked: `best_for_buyer` ranks them by price so whichever unit the effect discounts is worth as much as the cart permits, `cart_order` takes the first it finds. Empty follows the tenant default.", type: "string", required: false, enum: ["best_for_buyer","cart_order"] },
  { key: "maxPerCart", option: "--max-per-cart <max-per-cart>", name: "max_per_cart", description: "How often the bundle may repeat in one cart. Empty repeats as often as the cart allows.", type: "integer", required: false },
  { key: "selectors", option: "--selectors <selectors>", name: "selectors", description: "What counts towards the bundle, as a list of `{match, quantity}` — which is what expresses \"one machine and one packet of coffee\" rather than two units of anything.", type: "any", required: false },
  { key: "unitsRequired", option: "--units-required <units-required>", name: "units_required", description: "How many units make one bundle, when no selectors are stated.", type: "integer", required: false },
];
promotionsPromotions
  .command(`promotions-bundles-create`)
  .description(`Define a bundle`)
  .option(`--name <name>`, `What the bundle is called, and what every discount it produces is attributed to.`)
  .option(`--promotion-id <promotion-id>`, `The promotion this row belongs to. Deleting the promotion deletes it.`)
  .option(`--allocation <allocation>`, `How the units that form a bundle are picked: \`best_for_buyer\` ranks them by price so whichever unit the effect discounts is worth as much as the cart permits, \`cart_order\` takes the first it finds. Empty follows the tenant default.`)
  .option(`--max-per-cart <max-per-cart>`, `How often the bundle may repeat in one cart. Empty repeats as often as the cart allows.`, parseInteger)
  .option(`--selectors <selectors>`, `What counts towards the bundle, as a list of \`{match, quantity}\` — which is what expresses "one machine and one packet of coffee" rather than two units of anything.`)
  .option(`--units-required <units-required>`, `How many units make one bundle, when no selectors are stated.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, promotionId, allocation, maxPerCart, selectors, unitsRequired } = await promptForMissing(
          _options,
          promotionsBundlesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/bundles`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (allocation !== undefined) {
          _payload[`allocation`] = allocation;
        }
        if (maxPerCart !== undefined) {
          _payload[`max_per_cart`] = maxPerCart;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
        }
        if (selectors !== undefined) {
          _payload[`selectors`] = selectors;
        }
        if (unitsRequired !== undefined) {
          _payload[`units_required`] = unitsRequired;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsBundlesCreateSpecs, { method: "post" });
const promotionsBundlesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/bundles", hasLimit: true } },
];
promotionsPromotions
  .command(`promotions-bundles-delete`)
  .description(`Remove a bundle`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          promotionsBundlesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`promotions-promotions promotions-bundles-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/promotions/bundles/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsBundlesDeleteSpecs, { method: "delete", destructive: true });
const promotionsBundlesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/bundles", hasLimit: true } },
];
promotionsPromotions
  .command(`promotions-bundles-get`)
  .description(`Read one bundle`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          promotionsBundlesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/bundles/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsBundlesGetSpecs, { method: "get" });
const promotionsBundlesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/bundles", hasLimit: true } },
  { key: "allocation", option: "--allocation <allocation>", name: "allocation", description: "How the units that form a bundle are picked: `best_for_buyer` ranks them by price so whichever unit the effect discounts is worth as much as the cart permits, `cart_order` takes the first it finds. Empty follows the tenant default.", type: "string", required: false, enum: ["best_for_buyer","cart_order"] },
  { key: "maxPerCart", option: "--max-per-cart <max-per-cart>", name: "max_per_cart", description: "How often the bundle may repeat in one cart. Empty repeats as often as the cart allows.", type: "integer", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "What the bundle is called, and what every discount it produces is attributed to.", type: "string", required: false },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "The promotion this row belongs to. Deleting the promotion deletes it.", type: "string", required: false },
  { key: "selectors", option: "--selectors <selectors>", name: "selectors", description: "What counts towards the bundle, as a list of `{match, quantity}` — which is what expresses \"one machine and one packet of coffee\" rather than two units of anything.", type: "any", required: false },
  { key: "unitsRequired", option: "--units-required <units-required>", name: "units_required", description: "How many units make one bundle, when no selectors are stated.", type: "integer", required: false },
];
promotionsPromotions
  .command(`promotions-bundles-update`)
  .description(`Correct a bundle`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--allocation <allocation>`, `How the units that form a bundle are picked: \`best_for_buyer\` ranks them by price so whichever unit the effect discounts is worth as much as the cart permits, \`cart_order\` takes the first it finds. Empty follows the tenant default.`)
  .option(`--max-per-cart <max-per-cart>`, `How often the bundle may repeat in one cart. Empty repeats as often as the cart allows.`, parseInteger)
  .option(`--name <name>`, `What the bundle is called, and what every discount it produces is attributed to.`)
  .option(`--promotion-id <promotion-id>`, `The promotion this row belongs to. Deleting the promotion deletes it.`)
  .option(`--selectors <selectors>`, `What counts towards the bundle, as a list of \`{match, quantity}\` — which is what expresses "one machine and one packet of coffee" rather than two units of anything.`)
  .option(`--units-required <units-required>`, `How many units make one bundle, when no selectors are stated.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, allocation, maxPerCart, name, promotionId, selectors, unitsRequired } = await promptForMissing(
          _options,
          promotionsBundlesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/bundles/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (allocation !== undefined) {
          _payload[`allocation`] = allocation;
        }
        if (maxPerCart !== undefined) {
          _payload[`max_per_cart`] = maxPerCart;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
        }
        if (selectors !== undefined) {
          _payload[`selectors`] = selectors;
        }
        if (unitsRequired !== undefined) {
          _payload[`units_required`] = unitsRequired;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsBundlesUpdateSpecs, { method: "put" });
const promotionsConditionsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "Keep only rows whose `promotion_id` equals this.", type: "string", required: false },
  { key: "parentId", option: "--parent-id <parent-id>", name: "parent_id", description: "Keep only rows whose `parent_id` equals this.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Keep only rows whose `kind` equals this.", type: "string", required: false },
  { key: "matchMode", option: "--match-mode <match-mode>", name: "match_mode", description: "Keep only rows whose `match_mode` equals this.", type: "string", required: false },
  { key: "negate", option: "--negate <negate>", name: "negate", description: "Keep only rows whose `negate` equals this.", type: "string", required: false },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "Keep only rows whose `subject` equals this.", type: "string", required: false },
  { key: "comparison", option: "--comparison <comparison>", name: "comparison", description: "Keep only rows whose `comparison` equals this.", type: "string", required: false },
  { key: "rightSubject", option: "--right-subject <right-subject>", name: "right_subject", description: "Keep only rows whose `right_subject` equals this.", type: "string", required: false },
  { key: "summary", option: "--summary <summary>", name: "summary", description: "Keep only rows whose `summary` equals this.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Keep only rows whose `position` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
promotionsPromotions
  .command(`promotions-conditions-list`)
  .description(`The tree that decides which purchases a promotion catches. A row is either a group, which says whether all or any of what it holds must hold, or a question, which asks one thing from a closed vocabulary. Read the assembled tree at GET /promotions/promotions/{id}/conditions.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--promotion-id <promotion-id>`, `Keep only rows whose \`promotion_id\` equals this.`)
  .option(`--parent-id <parent-id>`, `Keep only rows whose \`parent_id\` equals this.`)
  .option(`--kind <kind>`, `Keep only rows whose \`kind\` equals this.`)
  .option(`--match-mode <match-mode>`, `Keep only rows whose \`match_mode\` equals this.`)
  .option(`--negate <negate>`, `Keep only rows whose \`negate\` equals this.`)
  .option(`--subject <subject>`, `Keep only rows whose \`subject\` equals this.`)
  .option(`--comparison <comparison>`, `Keep only rows whose \`comparison\` equals this.`)
  .option(`--right-subject <right-subject>`, `Keep only rows whose \`right_subject\` equals this.`)
  .option(`--summary <summary>`, `Keep only rows whose \`summary\` equals this.`)
  .option(`--position <position>`, `Keep only rows whose \`position\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, promotionId, parentId, kind, matchMode, negate, subject, comparison, rightSubject, summary, position, filter } = await promptForMissing(
          _options,
          promotionsConditionsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/conditions`;
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
        if (parentId !== undefined) {
          _payload[`parent_id`] = parentId;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (matchMode !== undefined) {
          _payload[`match_mode`] = matchMode;
        }
        if (negate !== undefined) {
          _payload[`negate`] = negate;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
        }
        if (comparison !== undefined) {
          _payload[`comparison`] = comparison;
        }
        if (rightSubject !== undefined) {
          _payload[`right_subject`] = rightSubject;
        }
        if (summary !== undefined) {
          _payload[`summary`] = summary;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsConditionsListSpecs, { method: "get" });
const promotionsConditionsCreateSpecs: PromptSpec[] = [
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "The promotion this row belongs to. Deleting the promotion deletes it.", type: "string", required: true },
  { key: "addend", option: "--addend <addend>", name: "addend", description: "Added to the right-hand subject after the factor.", type: "number", required: false },
  { key: "compareValue", option: "--compare-value <compare-value>", name: "compare_value", description: "What the subject is compared against.", type: "any", required: false },
  { key: "compareValueTo", option: "--compare-value-to <compare-value-to>", name: "compare_value_to", description: "The upper end of a `between` comparison.", type: "any", required: false },
  { key: "comparison", option: "--comparison <comparison>", name: "comparison", description: "How the subject is compared: eq, neq, gt, gte, lt, lte, between, in, not_in, is_true, is_false.", type: "string", required: false },
  { key: "factor", option: "--factor <factor>", name: "factor", description: "Multiplies the right-hand subject before the comparison.", type: "number", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Whether this row is a `group` (which holds others) or a `question` (which asks one thing).", type: "string", required: false, enum: ["group","question"] },
  { key: "matchMode", option: "--match-mode <match-mode>", name: "match_mode", description: "For a group: whether `all` of it must hold, or `any` of it.", type: "string", required: false, enum: ["all","any"] },
  { key: "negate", option: "--negate <negate>", name: "negate", description: "Turns the row around. Excluding a range from an offer is how a merchant protects their margin.", type: "boolean", required: false },
  { key: "parentId", option: "--parent-id <parent-id>", name: "parent_id", description: "The group this row sits inside. Rows with no parent are the outermost level.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Order among siblings, ascending. Two rows with the same position are ordered by their id, so a list never shuffles between reads.", type: "integer", required: false },
  { key: "rightSubject", option: "--right-subject <right-subject>", name: "right_subject", description: "Compare against another subject instead of a literal — \"a fifth more than they usually spend\", which no fixed threshold can express for a thousand buyers.", type: "string", required: false },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "What a question asks about — one of a closed vocabulary. A subject accepted at write time and unrecognised at checkout is a promotion that silently never fires, so an unknown one is refused here.", type: "string", required: false },
];
promotionsPromotions
  .command(`promotions-conditions-create`)
  .description(`Add a condition`)
  .option(`--promotion-id <promotion-id>`, `The promotion this row belongs to. Deleting the promotion deletes it.`)
  .option(`--addend <addend>`, `Added to the right-hand subject after the factor.`, parseInteger)
  .option(`--compare-value <compare-value>`, `What the subject is compared against.`)
  .option(`--compare-value-to <compare-value-to>`, `The upper end of a \`between\` comparison.`)
  .option(`--comparison <comparison>`, `How the subject is compared: eq, neq, gt, gte, lt, lte, between, in, not_in, is_true, is_false.`)
  .option(`--factor <factor>`, `Multiplies the right-hand subject before the comparison.`, parseInteger)
  .option(`--kind <kind>`, `Whether this row is a \`group\` (which holds others) or a \`question\` (which asks one thing).`)
  .option(`--match-mode <match-mode>`, `For a group: whether \`all\` of it must hold, or \`any\` of it.`)
  .option(
    `--negate [value]`,
    `Turns the row around. Excluding a range from an offer is how a merchant protects their margin.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--parent-id <parent-id>`, `The group this row sits inside. Rows with no parent are the outermost level.`)
  .option(`--position <position>`, `Order among siblings, ascending. Two rows with the same position are ordered by their id, so a list never shuffles between reads.`, parseInteger)
  .option(`--right-subject <right-subject>`, `Compare against another subject instead of a literal — "a fifth more than they usually spend", which no fixed threshold can express for a thousand buyers.`)
  .option(`--subject <subject>`, `What a question asks about — one of a closed vocabulary. A subject accepted at write time and unrecognised at checkout is a promotion that silently never fires, so an unknown one is refused here.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { promotionId, addend, compareValue, compareValueTo, comparison, factor, kind, matchMode, negate, parentId, position, rightSubject, subject } = await promptForMissing(
          _options,
          promotionsConditionsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/conditions`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (addend !== undefined) {
          _payload[`addend`] = addend;
        }
        if (compareValue !== undefined) {
          _payload[`compare_value`] = compareValue;
        }
        if (compareValueTo !== undefined) {
          _payload[`compare_value_to`] = compareValueTo;
        }
        if (comparison !== undefined) {
          _payload[`comparison`] = comparison;
        }
        if (factor !== undefined) {
          _payload[`factor`] = factor;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (matchMode !== undefined) {
          _payload[`match_mode`] = matchMode;
        }
        if (negate !== undefined) {
          _payload[`negate`] = negate;
        }
        if (parentId !== undefined) {
          _payload[`parent_id`] = parentId;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
        }
        if (rightSubject !== undefined) {
          _payload[`right_subject`] = rightSubject;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsConditionsCreateSpecs, { method: "post" });
promotionsPromotions
  .command(`promotions-conditions-validate`)
  .description(`What an editor calls while a merchant is still typing, so an unknown subject or a comparison that needs a second value is caught in the form rather than on save.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/promotions/conditions/validate`;
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
const promotionsConditionsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/conditions", hasLimit: true } },
];
promotionsPromotions
  .command(`promotions-conditions-delete`)
  .description(`Remove a condition`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          promotionsConditionsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`promotions-promotions promotions-conditions-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/promotions/conditions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsConditionsDeleteSpecs, { method: "delete", destructive: true });
const promotionsConditionsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/conditions", hasLimit: true } },
];
promotionsPromotions
  .command(`promotions-conditions-get`)
  .description(`Read one condition`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          promotionsConditionsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/conditions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsConditionsGetSpecs, { method: "get" });
const promotionsConditionsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/conditions", hasLimit: true } },
  { key: "addend", option: "--addend <addend>", name: "addend", description: "Added to the right-hand subject after the factor.", type: "number", required: false },
  { key: "compareValue", option: "--compare-value <compare-value>", name: "compare_value", description: "What the subject is compared against.", type: "any", required: false },
  { key: "compareValueTo", option: "--compare-value-to <compare-value-to>", name: "compare_value_to", description: "The upper end of a `between` comparison.", type: "any", required: false },
  { key: "comparison", option: "--comparison <comparison>", name: "comparison", description: "How the subject is compared: eq, neq, gt, gte, lt, lte, between, in, not_in, is_true, is_false.", type: "string", required: false },
  { key: "factor", option: "--factor <factor>", name: "factor", description: "Multiplies the right-hand subject before the comparison.", type: "number", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Whether this row is a `group` (which holds others) or a `question` (which asks one thing).", type: "string", required: false, enum: ["group","question"] },
  { key: "matchMode", option: "--match-mode <match-mode>", name: "match_mode", description: "For a group: whether `all` of it must hold, or `any` of it.", type: "string", required: false, enum: ["all","any"] },
  { key: "negate", option: "--negate <negate>", name: "negate", description: "Turns the row around. Excluding a range from an offer is how a merchant protects their margin.", type: "boolean", required: false },
  { key: "parentId", option: "--parent-id <parent-id>", name: "parent_id", description: "The group this row sits inside. Rows with no parent are the outermost level.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Order among siblings, ascending. Two rows with the same position are ordered by their id, so a list never shuffles between reads.", type: "integer", required: false },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "The promotion this row belongs to. Deleting the promotion deletes it.", type: "string", required: false },
  { key: "rightSubject", option: "--right-subject <right-subject>", name: "right_subject", description: "Compare against another subject instead of a literal — \"a fifth more than they usually spend\", which no fixed threshold can express for a thousand buyers.", type: "string", required: false },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "What a question asks about — one of a closed vocabulary. A subject accepted at write time and unrecognised at checkout is a promotion that silently never fires, so an unknown one is refused here.", type: "string", required: false },
];
promotionsPromotions
  .command(`promotions-conditions-update`)
  .description(`Correct a condition`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--addend <addend>`, `Added to the right-hand subject after the factor.`, parseInteger)
  .option(`--compare-value <compare-value>`, `What the subject is compared against.`)
  .option(`--compare-value-to <compare-value-to>`, `The upper end of a \`between\` comparison.`)
  .option(`--comparison <comparison>`, `How the subject is compared: eq, neq, gt, gte, lt, lte, between, in, not_in, is_true, is_false.`)
  .option(`--factor <factor>`, `Multiplies the right-hand subject before the comparison.`, parseInteger)
  .option(`--kind <kind>`, `Whether this row is a \`group\` (which holds others) or a \`question\` (which asks one thing).`)
  .option(`--match-mode <match-mode>`, `For a group: whether \`all\` of it must hold, or \`any\` of it.`)
  .option(
    `--negate [value]`,
    `Turns the row around. Excluding a range from an offer is how a merchant protects their margin.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--parent-id <parent-id>`, `The group this row sits inside. Rows with no parent are the outermost level.`)
  .option(`--position <position>`, `Order among siblings, ascending. Two rows with the same position are ordered by their id, so a list never shuffles between reads.`, parseInteger)
  .option(`--promotion-id <promotion-id>`, `The promotion this row belongs to. Deleting the promotion deletes it.`)
  .option(`--right-subject <right-subject>`, `Compare against another subject instead of a literal — "a fifth more than they usually spend", which no fixed threshold can express for a thousand buyers.`)
  .option(`--subject <subject>`, `What a question asks about — one of a closed vocabulary. A subject accepted at write time and unrecognised at checkout is a promotion that silently never fires, so an unknown one is refused here.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, addend, compareValue, compareValueTo, comparison, factor, kind, matchMode, negate, parentId, position, promotionId, rightSubject, subject } = await promptForMissing(
          _options,
          promotionsConditionsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/conditions/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (addend !== undefined) {
          _payload[`addend`] = addend;
        }
        if (compareValue !== undefined) {
          _payload[`compare_value`] = compareValue;
        }
        if (compareValueTo !== undefined) {
          _payload[`compare_value_to`] = compareValueTo;
        }
        if (comparison !== undefined) {
          _payload[`comparison`] = comparison;
        }
        if (factor !== undefined) {
          _payload[`factor`] = factor;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (matchMode !== undefined) {
          _payload[`match_mode`] = matchMode;
        }
        if (negate !== undefined) {
          _payload[`negate`] = negate;
        }
        if (parentId !== undefined) {
          _payload[`parent_id`] = parentId;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
        }
        if (rightSubject !== undefined) {
          _payload[`right_subject`] = rightSubject;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsConditionsUpdateSpecs, { method: "put" });
const promotionsCustomEffectTypesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Keep only rows whose `name` equals this.", type: "string", required: false },
  { key: "shapeVersion", option: "--shape-version <shape-version>", name: "shape_version", description: "Keep only rows whose `shape_version` equals this.", type: "string", required: false },
  { key: "carriesAmount", option: "--carries-amount <carries-amount>", name: "carries_amount", description: "Keep only rows whose `carries_amount` equals this.", type: "string", required: false },
  { key: "active", option: "--active <active>", name: "active", description: "Keep only rows whose `active` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
promotionsPromotions
  .command(`promotions-custom-effect-types-list`)
  .description(`Effects a tenant invents: unlock a download, extend a warranty, add a gift message. The engine validates the payload when the promotion is WRITTEN and hands it back verbatim when it applies — it never interprets one.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--name <name>`, `Keep only rows whose \`name\` equals this.`)
  .option(`--shape-version <shape-version>`, `Keep only rows whose \`shape_version\` equals this.`)
  .option(`--carries-amount <carries-amount>`, `Keep only rows whose \`carries_amount\` equals this.`)
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
        const { limit, offset, order, id, name, shapeVersion, carriesAmount, active, filter } = await promptForMissing(
          _options,
          promotionsCustomEffectTypesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/custom-effect-types`;
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
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (shapeVersion !== undefined) {
          _payload[`shape_version`] = shapeVersion;
        }
        if (carriesAmount !== undefined) {
          _payload[`carries_amount`] = carriesAmount;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsCustomEffectTypesListSpecs, { method: "get" });
const promotionsCustomEffectTypesCreateSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The identifier whatever consumes this effect dispatches on. Unique per tenant.", type: "string", required: true },
  { key: "active", option: "--active <active>", name: "active", description: "Whether a promotion may newly use this type. An inactive type stays valid on every effect already written against it, which keeps applying and keeps its title; a new effect of it, or an effect moved onto it, is refused with 409. Every type is active until a merchant says otherwise.", type: "boolean", required: false },
  { key: "carriesAmount", option: "--carries-amount <carries-amount>", name: "carries_amount", description: "When true, an effect of this type must also name an amount shape and a target scope, and then goes through exactly the caps, budgets, stacking and rounding a discount does. When false it carries no money at all.", type: "boolean", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "What the type is for, for the person configuring a promotion — rarely the person who registered it.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "payloadShape", option: "--payload-shape <payload-shape>", name: "payload_shape", description: "The JSON Schema an effect payload of this type is checked against, when the promotion is WRITTEN rather than at a till. It may grow and may not shrink while effects exist against it.", type: "any", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "What the type is called where an effect is written. Per locale.", type: "any", required: false },
];
promotionsPromotions
  .command(`promotions-custom-effect-types-create`)
  .description(`Register an effect type`)
  .option(`--name <name>`, `The identifier whatever consumes this effect dispatches on. Unique per tenant.`)
  .option(
    `--active [value]`,
    `Whether a promotion may newly use this type. An inactive type stays valid on every effect already written against it, which keeps applying and keeps its title; a new effect of it, or an effect moved onto it, is refused with 409. Every type is active until a merchant says otherwise.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--carries-amount [value]`,
    `When true, an effect of this type must also name an amount shape and a target scope, and then goes through exactly the caps, budgets, stacking and rounding a discount does. When false it carries no money at all.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--description <description>`, `What the type is for, for the person configuring a promotion — rarely the person who registered it.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--payload-shape <payload-shape>`, `The JSON Schema an effect payload of this type is checked against, when the promotion is WRITTEN rather than at a till. It may grow and may not shrink while effects exist against it.`)
  .option(`--title <title>`, `What the type is called where an effect is written. Per locale.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, active, carriesAmount, description, metadata, payloadShape, title } = await promptForMissing(
          _options,
          promotionsCustomEffectTypesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/custom-effect-types`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (active !== undefined) {
          _payload[`active`] = active;
        }
        if (carriesAmount !== undefined) {
          _payload[`carries_amount`] = carriesAmount;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (payloadShape !== undefined) {
          _payload[`payload_shape`] = payloadShape;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsCustomEffectTypesCreateSpecs, { method: "post" });
const promotionsCustomEffectTypesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/custom-effect-types", hasLimit: true } },
];
promotionsPromotions
  .command(`promotions-custom-effect-types-delete`)
  .description(`Delete an effect type nothing uses`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          promotionsCustomEffectTypesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`promotions-promotions promotions-custom-effect-types-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/promotions/custom-effect-types/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsCustomEffectTypesDeleteSpecs, { method: "delete", destructive: true });
const promotionsCustomEffectTypesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/custom-effect-types", hasLimit: true } },
];
promotionsPromotions
  .command(`promotions-custom-effect-types-get`)
  .description(`Read one effect type`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          promotionsCustomEffectTypesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/custom-effect-types/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsCustomEffectTypesGetSpecs, { method: "get" });
const promotionsCustomEffectTypesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/custom-effect-types", hasLimit: true } },
  { key: "active", option: "--active <active>", name: "active", description: "Whether a promotion may newly use this type. An inactive type stays valid on every effect already written against it, which keeps applying and keeps its title; a new effect of it, or an effect moved onto it, is refused with 409. Every type is active until a merchant says otherwise.", type: "boolean", required: false },
  { key: "carriesAmount", option: "--carries-amount <carries-amount>", name: "carries_amount", description: "When true, an effect of this type must also name an amount shape and a target scope, and then goes through exactly the caps, budgets, stacking and rounding a discount does. When false it carries no money at all.", type: "boolean", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "What the type is for, for the person configuring a promotion — rarely the person who registered it.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "The identifier whatever consumes this effect dispatches on. Unique per tenant.", type: "string", required: false },
  { key: "payloadShape", option: "--payload-shape <payload-shape>", name: "payload_shape", description: "The JSON Schema an effect payload of this type is checked against, when the promotion is WRITTEN rather than at a till. It may grow and may not shrink while effects exist against it.", type: "any", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "What the type is called where an effect is written. Per locale.", type: "any", required: false },
];
promotionsPromotions
  .command(`promotions-custom-effect-types-update`)
  .description(`Change an effect type`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(
    `--active [value]`,
    `Whether a promotion may newly use this type. An inactive type stays valid on every effect already written against it, which keeps applying and keeps its title; a new effect of it, or an effect moved onto it, is refused with 409. Every type is active until a merchant says otherwise.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--carries-amount [value]`,
    `When true, an effect of this type must also name an amount shape and a target scope, and then goes through exactly the caps, budgets, stacking and rounding a discount does. When false it carries no money at all.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--description <description>`, `What the type is for, for the person configuring a promotion — rarely the person who registered it.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--name <name>`, `The identifier whatever consumes this effect dispatches on. Unique per tenant.`)
  .option(`--payload-shape <payload-shape>`, `The JSON Schema an effect payload of this type is checked against, when the promotion is WRITTEN rather than at a till. It may grow and may not shrink while effects exist against it.`)
  .option(`--title <title>`, `What the type is called where an effect is written. Per locale.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, active, carriesAmount, description, metadata, name, payloadShape, title } = await promptForMissing(
          _options,
          promotionsCustomEffectTypesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/custom-effect-types/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (active !== undefined) {
          _payload[`active`] = active;
        }
        if (carriesAmount !== undefined) {
          _payload[`carries_amount`] = carriesAmount;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (payloadShape !== undefined) {
          _payload[`payload_shape`] = payloadShape;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsCustomEffectTypesUpdateSpecs, { method: "put" });
const promotionsEffectsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "Keep only rows whose `promotion_id` equals this.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Keep only rows whose `position` equals this.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Keep only rows whose `kind` equals this.", type: "string", required: false },
  { key: "valueType", option: "--value-type <value-type>", name: "value_type", description: "Keep only rows whose `value_type` equals this.", type: "string", required: false },
  { key: "targetScope", option: "--target-scope <target-scope>", name: "target_scope", description: "Keep only rows whose `target_scope` equals this.", type: "string", required: false },
  { key: "bundleId", option: "--bundle-id <bundle-id>", name: "bundle_id", description: "Keep only rows whose `bundle_id` equals this.", type: "string", required: false },
  { key: "unitChoice", option: "--unit-choice <unit-choice>", name: "unit_choice", description: "Keep only rows whose `unit_choice` equals this.", type: "string", required: false },
  { key: "unitPosition", option: "--unit-position <unit-position>", name: "unit_position", description: "Keep only rows whose `unit_position` equals this.", type: "string", required: false },
  { key: "spread", option: "--spread <spread>", name: "spread", description: "Keep only rows whose `spread` equals this.", type: "string", required: false },
  { key: "freeItemQuantity", option: "--free-item-quantity <free-item-quantity>", name: "free_item_quantity", description: "Keep only rows whose `free_item_quantity` equals this.", type: "string", required: false },
  { key: "requiresChoice", option: "--requires-choice <requires-choice>", name: "requires_choice", description: "Keep only rows whose `requires_choice` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
promotionsPromotions
  .command(`promotions-effects-list`)
  .description(`What a promotion takes off. Three amount shapes against six target scopes — the unit price, the line total, the cart subtotal, the grand total, the shipping cost, the payment fee — plus free items, surcharges, notices, bundles and types a tenant registered itself.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--promotion-id <promotion-id>`, `Keep only rows whose \`promotion_id\` equals this.`)
  .option(`--position <position>`, `Keep only rows whose \`position\` equals this.`)
  .option(`--kind <kind>`, `Keep only rows whose \`kind\` equals this.`)
  .option(`--value-type <value-type>`, `Keep only rows whose \`value_type\` equals this.`)
  .option(`--target-scope <target-scope>`, `Keep only rows whose \`target_scope\` equals this.`)
  .option(`--bundle-id <bundle-id>`, `Keep only rows whose \`bundle_id\` equals this.`)
  .option(`--unit-choice <unit-choice>`, `Keep only rows whose \`unit_choice\` equals this.`)
  .option(`--unit-position <unit-position>`, `Keep only rows whose \`unit_position\` equals this.`)
  .option(`--spread <spread>`, `Keep only rows whose \`spread\` equals this.`)
  .option(`--free-item-quantity <free-item-quantity>`, `Keep only rows whose \`free_item_quantity\` equals this.`)
  .option(`--requires-choice <requires-choice>`, `Keep only rows whose \`requires_choice\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, promotionId, position, kind, valueType, targetScope, bundleId, unitChoice, unitPosition, spread, freeItemQuantity, requiresChoice, filter } = await promptForMissing(
          _options,
          promotionsEffectsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/effects`;
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
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (valueType !== undefined) {
          _payload[`value_type`] = valueType;
        }
        if (targetScope !== undefined) {
          _payload[`target_scope`] = targetScope;
        }
        if (bundleId !== undefined) {
          _payload[`bundle_id`] = bundleId;
        }
        if (unitChoice !== undefined) {
          _payload[`unit_choice`] = unitChoice;
        }
        if (unitPosition !== undefined) {
          _payload[`unit_position`] = unitPosition;
        }
        if (spread !== undefined) {
          _payload[`spread`] = spread;
        }
        if (freeItemQuantity !== undefined) {
          _payload[`free_item_quantity`] = freeItemQuantity;
        }
        if (requiresChoice !== undefined) {
          _payload[`requires_choice`] = requiresChoice;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsEffectsListSpecs, { method: "get" });
const promotionsEffectsCreateSpecs: PromptSpec[] = [
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "The promotion this row belongs to. Deleting the promotion deletes it.", type: "string", required: true },
  { key: "amount", option: "--amount <amount>", name: "amount", description: "The figure the value type is read with.", type: "number", required: false },
  { key: "appliesTo", option: "--applies-to <applies-to>", name: "applies_to", description: "Which goods the effect touches, as `{skus, product_ids, categories, attribute}`. Empty touches every line.", type: "any", required: false },
  { key: "bundleId", option: "--bundle-id <bundle-id>", name: "bundle_id", description: "The bundle a bundle effect discounts.", type: "string", required: false },
  { key: "customPayload", option: "--custom-payload <custom-payload>", name: "custom_payload", description: "What a custom effect carries. Checked against the type shape when the promotion is written, and handed back unchanged when it applies.", type: "any", required: false },
  { key: "customShapeVersion", option: "--custom-shape-version <custom-shape-version>", name: "custom_shape_version", description: "The shape version the payload was checked against.", type: "integer", required: false },
  { key: "customTypeId", option: "--custom-type-id <custom-type-id>", name: "custom_type_id", description: "The registered type a custom effect is of.", type: "string", required: false },
  { key: "freeItemQuantity", option: "--free-item-quantity <free-item-quantity>", name: "free_item_quantity", description: "How many of the free item.", type: "integer", required: false },
  { key: "freeItems", option: "--free-items <free-items>", name: "free_items", description: "The items a free-item effect adds, or offers a choice between.", type: "any", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "What the effect does: `discount`, `free_item`, `surcharge`, `notice`, `bundle` or `custom`.", type: "string", required: false, enum: ["discount","free_item","surcharge","notice","bundle","custom"] },
  { key: "maxDiscount", option: "--max-discount <max-discount>", name: "max_discount", description: "A ceiling on a percentage effect. \"20% off, up to 50 euro\" is an ordinary offer, and a merchant who cannot express the cap writes the percentage smaller.", type: "number", required: false },
  { key: "message", option: "--message <message>", name: "message", description: "What a notice says, per locale. A notice carries no amount.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Order among siblings, ascending. Two rows with the same position are ordered by their id, so a list never shuffles between reads.", type: "integer", required: false },
  { key: "requiresChoice", option: "--requires-choice <requires-choice>", name: "requires_choice", description: "When true, the buyer picks one of the items and the chosen one is what is held and committed.", type: "boolean", required: false },
  { key: "spread", option: "--spread <spread>", name: "spread", description: "Whether the discount is distributed across the bundle units in proportion to price. A bill showing one line at minus thirty and three at full price cannot be returned line by line.", type: "boolean", required: false },
  { key: "targetScope", option: "--target-scope <target-scope>", name: "target_scope", description: "Which amount the effect is measured against: the unit price, the line total, the cart subtotal, the grand total, the shipping cost or the payment fee.", type: "string", required: false, enum: ["unit_price","line_total","cart_subtotal","grand_total","shipping","payment_fee"] },
  { key: "unitChoice", option: "--unit-choice <unit-choice>", name: "unit_choice", description: "Which unit inside a formed bundle is discounted: `cheapest`, `dearest`, `position` or `all`.", type: "string", required: false, enum: ["cheapest","dearest","position","all"] },
  { key: "unitPosition", option: "--unit-position <unit-position>", name: "unit_position", description: "Which unit, when unit_choice is `position`.", type: "integer", required: false },
  { key: "valueType", option: "--value-type <value-type>", name: "value_type", description: "How the amount is stated: `percentage`, `amount`, or `fixed_price` (charge this instead).", type: "string", required: false, enum: ["percentage","amount","fixed_price"] },
];
promotionsPromotions
  .command(`promotions-effects-create`)
  .description(`Add an effect`)
  .option(`--promotion-id <promotion-id>`, `The promotion this row belongs to. Deleting the promotion deletes it.`)
  .option(`--amount <amount>`, `The figure the value type is read with.`, parseInteger)
  .option(`--applies-to <applies-to>`, `Which goods the effect touches, as \`{skus, product_ids, categories, attribute}\`. Empty touches every line.`)
  .option(`--bundle-id <bundle-id>`, `The bundle a bundle effect discounts.`)
  .option(`--custom-payload <custom-payload>`, `What a custom effect carries. Checked against the type shape when the promotion is written, and handed back unchanged when it applies.`)
  .option(`--custom-shape-version <custom-shape-version>`, `The shape version the payload was checked against.`, parseInteger)
  .option(`--custom-type-id <custom-type-id>`, `The registered type a custom effect is of.`)
  .option(`--free-item-quantity <free-item-quantity>`, `How many of the free item.`, parseInteger)
  .option(`--free-items <free-items>`, `The items a free-item effect adds, or offers a choice between.`)
  .option(`--kind <kind>`, `What the effect does: \`discount\`, \`free_item\`, \`surcharge\`, \`notice\`, \`bundle\` or \`custom\`.`)
  .option(`--max-discount <max-discount>`, `A ceiling on a percentage effect. "20% off, up to 50 euro" is an ordinary offer, and a merchant who cannot express the cap writes the percentage smaller.`, parseInteger)
  .option(`--message <message>`, `What a notice says, per locale. A notice carries no amount.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--position <position>`, `Order among siblings, ascending. Two rows with the same position are ordered by their id, so a list never shuffles between reads.`, parseInteger)
  .option(
    `--requires-choice [value]`,
    `When true, the buyer picks one of the items and the chosen one is what is held and committed.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--spread [value]`,
    `Whether the discount is distributed across the bundle units in proportion to price. A bill showing one line at minus thirty and three at full price cannot be returned line by line.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--target-scope <target-scope>`, `Which amount the effect is measured against: the unit price, the line total, the cart subtotal, the grand total, the shipping cost or the payment fee.`)
  .option(`--unit-choice <unit-choice>`, `Which unit inside a formed bundle is discounted: \`cheapest\`, \`dearest\`, \`position\` or \`all\`.`)
  .option(`--unit-position <unit-position>`, `Which unit, when unit_choice is \`position\`.`, parseInteger)
  .option(`--value-type <value-type>`, `How the amount is stated: \`percentage\`, \`amount\`, or \`fixed_price\` (charge this instead).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { promotionId, amount, appliesTo, bundleId, customPayload, customShapeVersion, customTypeId, freeItemQuantity, freeItems, kind, maxDiscount, message, metadata, position, requiresChoice, spread, targetScope, unitChoice, unitPosition, valueType } = await promptForMissing(
          _options,
          promotionsEffectsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/effects`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (amount !== undefined) {
          _payload[`amount`] = amount;
        }
        if (appliesTo !== undefined) {
          _payload[`applies_to`] = appliesTo;
        }
        if (bundleId !== undefined) {
          _payload[`bundle_id`] = bundleId;
        }
        if (customPayload !== undefined) {
          _payload[`custom_payload`] = customPayload;
        }
        if (customShapeVersion !== undefined) {
          _payload[`custom_shape_version`] = customShapeVersion;
        }
        if (customTypeId !== undefined) {
          _payload[`custom_type_id`] = customTypeId;
        }
        if (freeItemQuantity !== undefined) {
          _payload[`free_item_quantity`] = freeItemQuantity;
        }
        if (freeItems !== undefined) {
          _payload[`free_items`] = freeItems;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (maxDiscount !== undefined) {
          _payload[`max_discount`] = maxDiscount;
        }
        if (message !== undefined) {
          _payload[`message`] = message;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
        }
        if (requiresChoice !== undefined) {
          _payload[`requires_choice`] = requiresChoice;
        }
        if (spread !== undefined) {
          _payload[`spread`] = spread;
        }
        if (targetScope !== undefined) {
          _payload[`target_scope`] = targetScope;
        }
        if (unitChoice !== undefined) {
          _payload[`unit_choice`] = unitChoice;
        }
        if (unitPosition !== undefined) {
          _payload[`unit_position`] = unitPosition;
        }
        if (valueType !== undefined) {
          _payload[`value_type`] = valueType;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsEffectsCreateSpecs, { method: "post" });
const promotionsEffectsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/effects", hasLimit: true } },
];
promotionsPromotions
  .command(`promotions-effects-delete`)
  .description(`Remove an effect`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          promotionsEffectsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`promotions-promotions promotions-effects-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/promotions/effects/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsEffectsDeleteSpecs, { method: "delete", destructive: true });
const promotionsEffectsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/effects", hasLimit: true } },
];
promotionsPromotions
  .command(`promotions-effects-get`)
  .description(`Read one effect`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          promotionsEffectsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/effects/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsEffectsGetSpecs, { method: "get" });
const promotionsEffectsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/effects", hasLimit: true } },
  { key: "amount", option: "--amount <amount>", name: "amount", description: "The figure the value type is read with.", type: "number", required: false },
  { key: "appliesTo", option: "--applies-to <applies-to>", name: "applies_to", description: "Which goods the effect touches, as `{skus, product_ids, categories, attribute}`. Empty touches every line.", type: "any", required: false },
  { key: "bundleId", option: "--bundle-id <bundle-id>", name: "bundle_id", description: "The bundle a bundle effect discounts.", type: "string", required: false },
  { key: "customPayload", option: "--custom-payload <custom-payload>", name: "custom_payload", description: "What a custom effect carries. Checked against the type shape when the promotion is written, and handed back unchanged when it applies.", type: "any", required: false },
  { key: "customShapeVersion", option: "--custom-shape-version <custom-shape-version>", name: "custom_shape_version", description: "The shape version the payload was checked against.", type: "integer", required: false },
  { key: "customTypeId", option: "--custom-type-id <custom-type-id>", name: "custom_type_id", description: "The registered type a custom effect is of.", type: "string", required: false },
  { key: "freeItemQuantity", option: "--free-item-quantity <free-item-quantity>", name: "free_item_quantity", description: "How many of the free item.", type: "integer", required: false },
  { key: "freeItems", option: "--free-items <free-items>", name: "free_items", description: "The items a free-item effect adds, or offers a choice between.", type: "any", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "What the effect does: `discount`, `free_item`, `surcharge`, `notice`, `bundle` or `custom`.", type: "string", required: false, enum: ["discount","free_item","surcharge","notice","bundle","custom"] },
  { key: "maxDiscount", option: "--max-discount <max-discount>", name: "max_discount", description: "A ceiling on a percentage effect. \"20% off, up to 50 euro\" is an ordinary offer, and a merchant who cannot express the cap writes the percentage smaller.", type: "number", required: false },
  { key: "message", option: "--message <message>", name: "message", description: "What a notice says, per locale. A notice carries no amount.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Order among siblings, ascending. Two rows with the same position are ordered by their id, so a list never shuffles between reads.", type: "integer", required: false },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "The promotion this row belongs to. Deleting the promotion deletes it.", type: "string", required: false },
  { key: "requiresChoice", option: "--requires-choice <requires-choice>", name: "requires_choice", description: "When true, the buyer picks one of the items and the chosen one is what is held and committed.", type: "boolean", required: false },
  { key: "spread", option: "--spread <spread>", name: "spread", description: "Whether the discount is distributed across the bundle units in proportion to price. A bill showing one line at minus thirty and three at full price cannot be returned line by line.", type: "boolean", required: false },
  { key: "targetScope", option: "--target-scope <target-scope>", name: "target_scope", description: "Which amount the effect is measured against: the unit price, the line total, the cart subtotal, the grand total, the shipping cost or the payment fee.", type: "string", required: false, enum: ["unit_price","line_total","cart_subtotal","grand_total","shipping","payment_fee"] },
  { key: "unitChoice", option: "--unit-choice <unit-choice>", name: "unit_choice", description: "Which unit inside a formed bundle is discounted: `cheapest`, `dearest`, `position` or `all`.", type: "string", required: false, enum: ["cheapest","dearest","position","all"] },
  { key: "unitPosition", option: "--unit-position <unit-position>", name: "unit_position", description: "Which unit, when unit_choice is `position`.", type: "integer", required: false },
  { key: "valueType", option: "--value-type <value-type>", name: "value_type", description: "How the amount is stated: `percentage`, `amount`, or `fixed_price` (charge this instead).", type: "string", required: false, enum: ["percentage","amount","fixed_price"] },
];
promotionsPromotions
  .command(`promotions-effects-update`)
  .description(`Correct an effect`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--amount <amount>`, `The figure the value type is read with.`, parseInteger)
  .option(`--applies-to <applies-to>`, `Which goods the effect touches, as \`{skus, product_ids, categories, attribute}\`. Empty touches every line.`)
  .option(`--bundle-id <bundle-id>`, `The bundle a bundle effect discounts.`)
  .option(`--custom-payload <custom-payload>`, `What a custom effect carries. Checked against the type shape when the promotion is written, and handed back unchanged when it applies.`)
  .option(`--custom-shape-version <custom-shape-version>`, `The shape version the payload was checked against.`, parseInteger)
  .option(`--custom-type-id <custom-type-id>`, `The registered type a custom effect is of.`)
  .option(`--free-item-quantity <free-item-quantity>`, `How many of the free item.`, parseInteger)
  .option(`--free-items <free-items>`, `The items a free-item effect adds, or offers a choice between.`)
  .option(`--kind <kind>`, `What the effect does: \`discount\`, \`free_item\`, \`surcharge\`, \`notice\`, \`bundle\` or \`custom\`.`)
  .option(`--max-discount <max-discount>`, `A ceiling on a percentage effect. "20% off, up to 50 euro" is an ordinary offer, and a merchant who cannot express the cap writes the percentage smaller.`, parseInteger)
  .option(`--message <message>`, `What a notice says, per locale. A notice carries no amount.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--position <position>`, `Order among siblings, ascending. Two rows with the same position are ordered by their id, so a list never shuffles between reads.`, parseInteger)
  .option(`--promotion-id <promotion-id>`, `The promotion this row belongs to. Deleting the promotion deletes it.`)
  .option(
    `--requires-choice [value]`,
    `When true, the buyer picks one of the items and the chosen one is what is held and committed.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--spread [value]`,
    `Whether the discount is distributed across the bundle units in proportion to price. A bill showing one line at minus thirty and three at full price cannot be returned line by line.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--target-scope <target-scope>`, `Which amount the effect is measured against: the unit price, the line total, the cart subtotal, the grand total, the shipping cost or the payment fee.`)
  .option(`--unit-choice <unit-choice>`, `Which unit inside a formed bundle is discounted: \`cheapest\`, \`dearest\`, \`position\` or \`all\`.`)
  .option(`--unit-position <unit-position>`, `Which unit, when unit_choice is \`position\`.`, parseInteger)
  .option(`--value-type <value-type>`, `How the amount is stated: \`percentage\`, \`amount\`, or \`fixed_price\` (charge this instead).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, amount, appliesTo, bundleId, customPayload, customShapeVersion, customTypeId, freeItemQuantity, freeItems, kind, maxDiscount, message, metadata, position, promotionId, requiresChoice, spread, targetScope, unitChoice, unitPosition, valueType } = await promptForMissing(
          _options,
          promotionsEffectsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/effects/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (amount !== undefined) {
          _payload[`amount`] = amount;
        }
        if (appliesTo !== undefined) {
          _payload[`applies_to`] = appliesTo;
        }
        if (bundleId !== undefined) {
          _payload[`bundle_id`] = bundleId;
        }
        if (customPayload !== undefined) {
          _payload[`custom_payload`] = customPayload;
        }
        if (customShapeVersion !== undefined) {
          _payload[`custom_shape_version`] = customShapeVersion;
        }
        if (customTypeId !== undefined) {
          _payload[`custom_type_id`] = customTypeId;
        }
        if (freeItemQuantity !== undefined) {
          _payload[`free_item_quantity`] = freeItemQuantity;
        }
        if (freeItems !== undefined) {
          _payload[`free_items`] = freeItems;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (maxDiscount !== undefined) {
          _payload[`max_discount`] = maxDiscount;
        }
        if (message !== undefined) {
          _payload[`message`] = message;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
        }
        if (requiresChoice !== undefined) {
          _payload[`requires_choice`] = requiresChoice;
        }
        if (spread !== undefined) {
          _payload[`spread`] = spread;
        }
        if (targetScope !== undefined) {
          _payload[`target_scope`] = targetScope;
        }
        if (unitChoice !== undefined) {
          _payload[`unit_choice`] = unitChoice;
        }
        if (unitPosition !== undefined) {
          _payload[`unit_position`] = unitPosition;
        }
        if (valueType !== undefined) {
          _payload[`value_type`] = valueType;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsEffectsUpdateSpecs, { method: "put" });
const promotionsGroupsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Keep only rows whose `code` equals this.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Keep only rows whose `name` equals this.", type: "string", required: false },
  { key: "mode", option: "--mode <mode>", name: "mode", description: "Keep only rows whose `mode` equals this.", type: "string", required: false },
  { key: "parentId", option: "--parent-id <parent-id>", name: "parent_id", description: "Keep only rows whose `parent_id` equals this.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Keep only rows whose `position` equals this.", type: "string", required: false },
  { key: "active", option: "--active <active>", name: "active", description: "Keep only rows whose `active` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
promotionsPromotions
  .command(`promotions-groups-list`)
  .description(`The sets promotions are weighed in. Whether two offers add up, compete on value or shadow each other is a property of the SET, which a flag on one promotion cannot state. Groups nest, and a nested group competes in its parent as one entry worth what it gives in total.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--code <code>`, `Keep only rows whose \`code\` equals this.`)
  .option(`--name <name>`, `Keep only rows whose \`name\` equals this.`)
  .option(`--mode <mode>`, `Keep only rows whose \`mode\` equals this.`)
  .option(`--parent-id <parent-id>`, `Keep only rows whose \`parent_id\` equals this.`)
  .option(`--position <position>`, `Keep only rows whose \`position\` equals this.`)
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
        const { limit, offset, order, id, code, name, mode, parentId, position, active, filter } = await promptForMissing(
          _options,
          promotionsGroupsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/groups`;
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
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (mode !== undefined) {
          _payload[`mode`] = mode;
        }
        if (parentId !== undefined) {
          _payload[`parent_id`] = parentId;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsGroupsListSpecs, { method: "get" });
const promotionsGroupsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "The stable identifier a merchant refers to the group by. Unique per tenant.", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "What the group is called in the Cockpit.", type: "string", required: true },
  { key: "active", option: "--active <active>", name: "active", description: "Whether promotions and groups may newly be put into this group. An inactive group keeps what is already in it and goes on weighing those promotions by its mode exactly as before; putting a promotion or a group into it is refused with 409. Every group is active until a merchant says otherwise.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Display text per locale, e.g. `{\"de\": \"Sommeraktion\", \"en\": \"Summer sale\"}`. What a storefront shows; `name` is what a merchant searches by.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "mode", option: "--mode <mode>", name: "mode", description: "How the promotions in this group are weighed: `stack` (all of them add up), `highest_value` (only the one worth most) or `first_match` (only the first that matches, by priority).", type: "string", required: false, enum: ["stack","highest_value","first_match"] },
  { key: "parentId", option: "--parent-id <parent-id>", name: "parent_id", description: "The group this one sits inside. A nested group is weighed among its own members first, then competes in its parent as ONE entry worth what it gives in total.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Order among siblings, ascending. Two rows with the same position are ordered by their id, so a list never shuffles between reads.", type: "integer", required: false },
];
promotionsPromotions
  .command(`promotions-groups-create`)
  .description(`Create a stacking group`)
  .option(`--code <code>`, `The stable identifier a merchant refers to the group by. Unique per tenant.`)
  .option(`--name <name>`, `What the group is called in the Cockpit.`)
  .option(
    `--active [value]`,
    `Whether promotions and groups may newly be put into this group. An inactive group keeps what is already in it and goes on weighing those promotions by its mode exactly as before; putting a promotion or a group into it is refused with 409. Every group is active until a merchant says otherwise.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Display text per locale, e.g. \`{"de": "Sommeraktion", "en": "Summer sale"}\`. What a storefront shows; \`name\` is what a merchant searches by.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--mode <mode>`, `How the promotions in this group are weighed: \`stack\` (all of them add up), \`highest_value\` (only the one worth most) or \`first_match\` (only the first that matches, by priority).`)
  .option(`--parent-id <parent-id>`, `The group this one sits inside. A nested group is weighed among its own members first, then competes in its parent as ONE entry worth what it gives in total.`)
  .option(`--position <position>`, `Order among siblings, ascending. Two rows with the same position are ordered by their id, so a list never shuffles between reads.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, active, labels, metadata, mode, parentId, position } = await promptForMissing(
          _options,
          promotionsGroupsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/groups`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (active !== undefined) {
          _payload[`active`] = active;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = labels;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (mode !== undefined) {
          _payload[`mode`] = mode;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (parentId !== undefined) {
          _payload[`parent_id`] = parentId;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsGroupsCreateSpecs, { method: "post" });
const promotionsGroupsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/groups", hasLimit: true } },
];
promotionsPromotions
  .command(`promotions-groups-delete`)
  .description(`Delete a stacking group`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          promotionsGroupsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`promotions-promotions promotions-groups-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/promotions/groups/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsGroupsDeleteSpecs, { method: "delete", destructive: true });
const promotionsGroupsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/groups", hasLimit: true } },
];
promotionsPromotions
  .command(`promotions-groups-get`)
  .description(`Read one stacking group`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          promotionsGroupsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/groups/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsGroupsGetSpecs, { method: "get" });
const promotionsGroupsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/groups", hasLimit: true } },
  { key: "active", option: "--active <active>", name: "active", description: "Whether promotions and groups may newly be put into this group. An inactive group keeps what is already in it and goes on weighing those promotions by its mode exactly as before; putting a promotion or a group into it is refused with 409. Every group is active until a merchant says otherwise.", type: "boolean", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "The stable identifier a merchant refers to the group by. Unique per tenant.", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Display text per locale, e.g. `{\"de\": \"Sommeraktion\", \"en\": \"Summer sale\"}`. What a storefront shows; `name` is what a merchant searches by.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "mode", option: "--mode <mode>", name: "mode", description: "How the promotions in this group are weighed: `stack` (all of them add up), `highest_value` (only the one worth most) or `first_match` (only the first that matches, by priority).", type: "string", required: false, enum: ["stack","highest_value","first_match"] },
  { key: "name", option: "--name <name>", name: "name", description: "What the group is called in the Cockpit.", type: "string", required: false },
  { key: "parentId", option: "--parent-id <parent-id>", name: "parent_id", description: "The group this one sits inside. A nested group is weighed among its own members first, then competes in its parent as ONE entry worth what it gives in total.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Order among siblings, ascending. Two rows with the same position are ordered by their id, so a list never shuffles between reads.", type: "integer", required: false },
];
promotionsPromotions
  .command(`promotions-groups-update`)
  .description(`Correct a stacking group`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(
    `--active [value]`,
    `Whether promotions and groups may newly be put into this group. An inactive group keeps what is already in it and goes on weighing those promotions by its mode exactly as before; putting a promotion or a group into it is refused with 409. Every group is active until a merchant says otherwise.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--code <code>`, `The stable identifier a merchant refers to the group by. Unique per tenant.`)
  .option(`--labels <labels>`, `Display text per locale, e.g. \`{"de": "Sommeraktion", "en": "Summer sale"}\`. What a storefront shows; \`name\` is what a merchant searches by.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--mode <mode>`, `How the promotions in this group are weighed: \`stack\` (all of them add up), \`highest_value\` (only the one worth most) or \`first_match\` (only the first that matches, by priority).`)
  .option(`--name <name>`, `What the group is called in the Cockpit.`)
  .option(`--parent-id <parent-id>`, `The group this one sits inside. A nested group is weighed among its own members first, then competes in its parent as ONE entry worth what it gives in total.`)
  .option(`--position <position>`, `Order among siblings, ascending. Two rows with the same position are ordered by their id, so a list never shuffles between reads.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, active, code, labels, metadata, mode, name, parentId, position } = await promptForMissing(
          _options,
          promotionsGroupsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/groups/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (active !== undefined) {
          _payload[`active`] = active;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = labels;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (mode !== undefined) {
          _payload[`mode`] = mode;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (parentId !== undefined) {
          _payload[`parent_id`] = parentId;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, promotionsGroupsUpdateSpecs, { method: "put" });
const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.", type: "string", required: false },
  { key: "trashed", option: "--trashed <trashed>", name: "trashed", description: "Whether promotions in the trash are listed: `exclude` (default) leaves them out, `only` is the trash itself, `include` lists both.", type: "string", required: false, enum: ["exclude","only","include"] },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Keep only rows whose `code` equals this.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Keep only rows whose `name` equals this.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "Keep only rows whose `description` equals this.", type: "string", required: false },
  { key: "reach", option: "--reach <reach>", name: "reach", description: "Keep only rows whose `reach` equals this.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Keep only rows whose `status` equals this.", type: "string", required: false },
  { key: "effectiveState", option: "--effective-state <effective-state>", name: "effective_state", description: "Keep only rows whose `effective_state` equals this.", type: "string", required: false },
  { key: "priority", option: "--priority <priority>", name: "priority", description: "Keep only rows whose `priority` equals this.", type: "string", required: false },
  { key: "exclusive", option: "--exclusive <exclusive>", name: "exclusive", description: "Keep only rows whose `exclusive` equals this.", type: "string", required: false },
  { key: "groupId", option: "--group-id <group-id>", name: "group_id", description: "Keep only rows whose `group_id` equals this.", type: "string", required: false },
  { key: "searchBestCombination", option: "--search-best-combination <search-best-combination>", name: "search_best_combination", description: "Keep only rows whose `search_best_combination` equals this.", type: "string", required: false },
  { key: "conditionMatch", option: "--condition-match <condition-match>", name: "condition_match", description: "Keep only rows whose `condition_match` equals this.", type: "string", required: false },
  { key: "campaignRef", option: "--campaign-ref <campaign-ref>", name: "campaign_ref", description: "Keep only the promotions one campaign claimed — what the campaigns calendar reads (`?campaign_ref={campaign_id}`, RAD-288).", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
promotionsPromotions
  .command(`list`)
  .description(`Every promotion this tenant has written down, whatever state it is in. Filter \`?status=active\` for the ones that may apply at all — whether one is live ALSO depends on its window and its recurrence, which GET /promotions/promotions/{id}/state answers.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.`)
  .option(`--trashed <trashed>`, `Whether promotions in the trash are listed: \`exclude\` (default) leaves them out, \`only\` is the trash itself, \`include\` lists both.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--code <code>`, `Keep only rows whose \`code\` equals this.`)
  .option(`--name <name>`, `Keep only rows whose \`name\` equals this.`)
  .option(`--description <description>`, `Keep only rows whose \`description\` equals this.`)
  .option(`--reach <reach>`, `Keep only rows whose \`reach\` equals this.`)
  .option(`--status <status>`, `Keep only rows whose \`status\` equals this.`)
  .option(`--effective-state <effective-state>`, `Keep only rows whose \`effective_state\` equals this.`)
  .option(`--priority <priority>`, `Keep only rows whose \`priority\` equals this.`)
  .option(`--exclusive <exclusive>`, `Keep only rows whose \`exclusive\` equals this.`)
  .option(`--group-id <group-id>`, `Keep only rows whose \`group_id\` equals this.`)
  .option(`--search-best-combination <search-best-combination>`, `Keep only rows whose \`search_best_combination\` equals this.`)
  .option(`--condition-match <condition-match>`, `Keep only rows whose \`condition_match\` equals this.`)
  .option(`--campaign-ref <campaign-ref>`, `Keep only the promotions one campaign claimed — what the campaigns calendar reads (\`?campaign_ref={campaign_id}\`, RAD-288).`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, trashed, id, code, name, description, reach, status, effectiveState, priority, exclusive, groupId, searchBestCombination, conditionMatch, campaignRef, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/promotions`;
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
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (reach !== undefined) {
          _payload[`reach`] = reach;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (effectiveState !== undefined) {
          _payload[`effective_state`] = effectiveState;
        }
        if (priority !== undefined) {
          _payload[`priority`] = priority;
        }
        if (exclusive !== undefined) {
          _payload[`exclusive`] = exclusive;
        }
        if (groupId !== undefined) {
          _payload[`group_id`] = groupId;
        }
        if (searchBestCombination !== undefined) {
          _payload[`search_best_combination`] = searchBestCombination;
        }
        if (conditionMatch !== undefined) {
          _payload[`condition_match`] = conditionMatch;
        }
        if (campaignRef !== undefined) {
          _payload[`campaign_ref`] = campaignRef;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "The short identifier a merchant recognises the promotion by. Unique per tenant.", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "What the promotion is called.", type: "string", required: true },
  { key: "audienceChannels", option: "--audience-channels <audience-channels>", name: "audience_channels", description: "Who it is for, by channel: a list of channel codes, one of which the cart must arrive through. Empty is every channel. Checked before the conditions, like a question that must hold.", type: "any", required: false },
  { key: "audienceRoles", option: "--audience-roles <audience-roles>", name: "audience_roles", description: "Who it is for, by role: a list of role keys, one of which the buying contact must carry. Empty is every role.", type: "any", required: false },
  { key: "audienceSegments", option: "--audience-segments <audience-segments>", name: "audience_segments", description: "Who it is for, by segment: a list of segment codes, one of which the buying organisation must be in — asked of customers, and never held when customers cannot say. Empty is everybody.", type: "any", required: false },
  { key: "budgetDiscount", option: "--budget-discount <budget-discount>", name: "budget_discount", description: "The most this promotion may give away in total. Reaching it stops the promotion rather than refusing the cart.", type: "number", required: false },
  { key: "budgetRedemptions", option: "--budget-redemptions <budget-redemptions>", name: "budget_redemptions", description: "The most times it may be redeemed in total.", type: "integer", required: false },
  { key: "campaignRef", option: "--campaign-ref <campaign-ref>", name: "campaign_ref", description: "The campaign this promotion belongs to — the id of a campaign in the campaigns app, written when that app claims the promotion (`PUT { campaign_ref }`, null releases it). Filterable, so the campaigns calendar finds a campaign's promotions. Nothing in an evaluation reads it; `redemption.committed` carries it for attribution.", type: "string", required: false },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", description: "The sales channel this promotion is limited to. Empty applies in every channel.", type: "string", required: false },
  { key: "conditionMatch", option: "--condition-match <condition-match>", name: "condition_match", description: "How the outermost conditions are held together when they are a flat list: `all` or `any`.", type: "string", required: false, enum: ["all","any"] },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "The currency this promotion is stated in. A cart in another currency skips it rather than inventing an exchange rate. Empty applies in every currency.", type: "string", required: false },
  { key: "deletedAt", option: "--deleted-at <deleted-at>", name: "deleted_at", description: "When the promotion was moved to the trash. Empty for a promotion that is not in it. A trashed promotion applies nowhere and keeps its code reserved.", type: "string", required: false },
  { key: "deletedBy", option: "--deleted-by <deleted-by>", name: "deleted_by", description: "Who moved it to the trash, as the platform named them — an email, or `system`.", type: "string", required: false },
  { key: "deletedById", option: "--deleted-by-id <deleted-by-id>", name: "deleted_by_id", description: "The platform subject of whoever moved it to the trash. Kept apart from the name so the history can be pseudonymised.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "What the promotion is for, in the merchant own words.", type: "string", required: false },
  { key: "endsAt", option: "--ends-at <ends-at>", name: "ends_at", description: "When it stops. Empty means it runs until somebody stops it.", type: "string", required: false },
  { key: "exclusive", option: "--exclusive <exclusive>", name: "exclusive", description: "When true, this promotion applying ends the whole evaluation across every group — the \"cannot be combined with anything\" printed on a voucher.", type: "boolean", required: false },
  { key: "groupId", option: "--group-id <group-id>", name: "group_id", description: "The stacking group this promotion is weighed in. A promotion in no group follows the tenant default.", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Display text per locale, e.g. `{\"de\": \"Sommeraktion\", \"en\": \"Summer sale\"}`. What a storefront shows; `name` is what a merchant searches by.", type: "any", required: false },
  { key: "limitPerContact", option: "--limit-per-contact <limit-per-contact>", name: "limit_per_contact", description: "How often one person may redeem it.", type: "integer", required: false },
  { key: "limitPerOrganization", option: "--limit-per-organization <limit-per-organization>", name: "limit_per_organization", description: "How often one company may redeem it. In B2B this is usually what a merchant means by \"once per customer\".", type: "integer", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "priority", option: "--priority <priority>", name: "priority", description: "Higher goes first. The order decides the money as soon as two effects touch the same amount, and a tie is settled by creation time so one cart never produces two different bills.", type: "integer", required: false },
  { key: "purgeAt", option: "--purge-at <purge-at>", name: "purge_at", description: "When the daily purge deletes it for good: the moment it was trashed plus the tenant trash retention.", type: "string", required: false },
  { key: "purgeBlockedReason", option: "--purge-blocked-reason <purge-blocked-reason>", name: "purge_blocked_reason", description: "Why the purge could not delete it for good. Empty unless a purge tried and was refused; cleared on restore.", type: "string", required: false },
  { key: "reach", option: "--reach <reach>", name: "reach", description: "How a buyer arrives at it: `automatic` applies on its own, `code` applies only to a buyer who entered one of its vouchers.", type: "string", required: false, enum: ["automatic","code"] },
  { key: "recurrenceDays", option: "--recurrence-days <recurrence-days>", name: "recurrence_days", description: "Days of the month it runs on: numbers from 1 to 31, or the word `last`. A day a month does not have simply does not occur that month.", type: "any", required: false },
  { key: "recurrenceFrom", option: "--recurrence-from <recurrence-from>", name: "recurrence_from", description: "Time of day it starts, as HH:MM. A range that crosses midnight is honoured as one range.", type: "string", required: false },
  { key: "recurrenceKind", option: "--recurrence-kind <recurrence-kind>", name: "recurrence_kind", description: "Whether it recurs inside its window, and how: `none`, `weekdays` or `days_of_month`. Never both shapes at once.", type: "string", required: false, enum: ["none","weekdays","days_of_month"] },
  { key: "recurrenceUntil", option: "--recurrence-until <recurrence-until>", name: "recurrence_until", description: "Time of day it stops, as HH:MM.", type: "string", required: false },
  { key: "recurrenceWeekdays", option: "--recurrence-weekdays <recurrence-weekdays>", name: "recurrence_weekdays", description: "Day numbers from 1 (Monday) to 7 (Sunday) the promotion runs on.", type: "any", required: false },
  { key: "returnBehaviour", option: "--return-behaviour <return-behaviour>", name: "return_behaviour", description: "What a return does to this promotion discounts: `reverse_proportionally` gives back what the returned lines carried, `reevaluate` decides again on the goods that were kept. Empty follows the tenant default.", type: "string", required: false, enum: ["reverse_proportionally","reevaluate"] },
  { key: "searchBestCombination", option: "--search-best-combination <search-best-combination>", name: "search_best_combination", description: "When true, this promotion is searched against the others that asked for it, and the order giving the buyer most is used. Bounded by a tenant setting; beyond it the stated order is used and the answer says so.", type: "boolean", required: false },
  { key: "startsAt", option: "--starts-at <starts-at>", name: "starts_at", description: "When the promotion becomes live. Empty means it is live as soon as it is active.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "What the merchant set: `draft`, `active`, `paused` or `archived`. What the promotion IS right now also depends on the clock — read `effective_state`.", type: "string", required: false, enum: ["draft","active","paused","archived"] },
  { key: "tags", option: "--tags <tags>", name: "tags", description: "Free labels a merchant groups promotions by. Carried onto every fact this app publishes.", type: "any", required: false },
  { key: "template", option: "--template <template>", name: "template", description: "Which template the Cockpit wizard started the promotion from. A record of where it began; nothing reads it.", type: "string", required: false },
  { key: "timezone", option: "--timezone <timezone>", name: "timezone", description: "The IANA timezone the window and the recurrence are read in. Empty follows the market, then the tenant setting — a merchant means their own midnight.", type: "string", required: false },
  { key: "trashBatch", option: "--trash-batch <trash-batch>", name: "trash_batch", description: "One id per trash action, shared by everything that went in with it. Restoring brings back exactly that batch.", type: "string", required: false },
];
promotionsPromotions
  .command(`create`)
  .description(`Write a promotion down`)
  .option(`--code <code>`, `The short identifier a merchant recognises the promotion by. Unique per tenant.`)
  .option(`--name <name>`, `What the promotion is called.`)
  .option(`--audience-channels <audience-channels>`, `Who it is for, by channel: a list of channel codes, one of which the cart must arrive through. Empty is every channel. Checked before the conditions, like a question that must hold.`)
  .option(`--audience-roles <audience-roles>`, `Who it is for, by role: a list of role keys, one of which the buying contact must carry. Empty is every role.`)
  .option(`--audience-segments <audience-segments>`, `Who it is for, by segment: a list of segment codes, one of which the buying organisation must be in — asked of customers, and never held when customers cannot say. Empty is everybody.`)
  .option(`--budget-discount <budget-discount>`, `The most this promotion may give away in total. Reaching it stops the promotion rather than refusing the cart.`, parseInteger)
  .option(`--budget-redemptions <budget-redemptions>`, `The most times it may be redeemed in total.`, parseInteger)
  .option(`--campaign-ref <campaign-ref>`, `The campaign this promotion belongs to — the id of a campaign in the campaigns app, written when that app claims the promotion (\`PUT { campaign_ref }\`, null releases it). Filterable, so the campaigns calendar finds a campaign's promotions. Nothing in an evaluation reads it; \`redemption.committed\` carries it for attribution.`)
  .option(`--channel-id <channel-id>`, `The sales channel this promotion is limited to. Empty applies in every channel.`)
  .option(`--condition-match <condition-match>`, `How the outermost conditions are held together when they are a flat list: \`all\` or \`any\`.`)
  .option(`--currency <currency>`, `The currency this promotion is stated in. A cart in another currency skips it rather than inventing an exchange rate. Empty applies in every currency.`)
  .option(`--deleted-at <deleted-at>`, `When the promotion was moved to the trash. Empty for a promotion that is not in it. A trashed promotion applies nowhere and keeps its code reserved.`)
  .option(`--deleted-by <deleted-by>`, `Who moved it to the trash, as the platform named them — an email, or \`system\`.`)
  .option(`--deleted-by-id <deleted-by-id>`, `The platform subject of whoever moved it to the trash. Kept apart from the name so the history can be pseudonymised.`)
  .option(`--description <description>`, `What the promotion is for, in the merchant own words.`)
  .option(`--ends-at <ends-at>`, `When it stops. Empty means it runs until somebody stops it.`)
  .option(
    `--exclusive [value]`,
    `When true, this promotion applying ends the whole evaluation across every group — the "cannot be combined with anything" printed on a voucher.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--group-id <group-id>`, `The stacking group this promotion is weighed in. A promotion in no group follows the tenant default.`)
  .option(`--labels <labels>`, `Display text per locale, e.g. \`{"de": "Sommeraktion", "en": "Summer sale"}\`. What a storefront shows; \`name\` is what a merchant searches by.`)
  .option(`--limit-per-contact <limit-per-contact>`, `How often one person may redeem it.`, parseInteger)
  .option(`--limit-per-organization <limit-per-organization>`, `How often one company may redeem it. In B2B this is usually what a merchant means by "once per customer".`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--priority <priority>`, `Higher goes first. The order decides the money as soon as two effects touch the same amount, and a tie is settled by creation time so one cart never produces two different bills.`, parseInteger)
  .option(`--purge-at <purge-at>`, `When the daily purge deletes it for good: the moment it was trashed plus the tenant trash retention.`)
  .option(`--purge-blocked-reason <purge-blocked-reason>`, `Why the purge could not delete it for good. Empty unless a purge tried and was refused; cleared on restore.`)
  .option(`--reach <reach>`, `How a buyer arrives at it: \`automatic\` applies on its own, \`code\` applies only to a buyer who entered one of its vouchers.`)
  .option(`--recurrence-days <recurrence-days>`, `Days of the month it runs on: numbers from 1 to 31, or the word \`last\`. A day a month does not have simply does not occur that month.`)
  .option(`--recurrence-from <recurrence-from>`, `Time of day it starts, as HH:MM. A range that crosses midnight is honoured as one range.`)
  .option(`--recurrence-kind <recurrence-kind>`, `Whether it recurs inside its window, and how: \`none\`, \`weekdays\` or \`days_of_month\`. Never both shapes at once.`)
  .option(`--recurrence-until <recurrence-until>`, `Time of day it stops, as HH:MM.`)
  .option(`--recurrence-weekdays <recurrence-weekdays>`, `Day numbers from 1 (Monday) to 7 (Sunday) the promotion runs on.`)
  .option(`--return-behaviour <return-behaviour>`, `What a return does to this promotion discounts: \`reverse_proportionally\` gives back what the returned lines carried, \`reevaluate\` decides again on the goods that were kept. Empty follows the tenant default.`)
  .option(
    `--search-best-combination [value]`,
    `When true, this promotion is searched against the others that asked for it, and the order giving the buyer most is used. Bounded by a tenant setting; beyond it the stated order is used and the answer says so.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--starts-at <starts-at>`, `When the promotion becomes live. Empty means it is live as soon as it is active.`)
  .option(`--status <status>`, `What the merchant set: \`draft\`, \`active\`, \`paused\` or \`archived\`. What the promotion IS right now also depends on the clock — read \`effective_state\`.`)
  .option(`--tags <tags>`, `Free labels a merchant groups promotions by. Carried onto every fact this app publishes.`)
  .option(`--template <template>`, `Which template the Cockpit wizard started the promotion from. A record of where it began; nothing reads it.`)
  .option(`--timezone <timezone>`, `The IANA timezone the window and the recurrence are read in. Empty follows the market, then the tenant setting — a merchant means their own midnight.`)
  .option(`--trash-batch <trash-batch>`, `One id per trash action, shared by everything that went in with it. Restoring brings back exactly that batch.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, audienceChannels, audienceRoles, audienceSegments, budgetDiscount, budgetRedemptions, campaignRef, channelId, conditionMatch, currency, deletedAt, deletedBy, deletedById, description, endsAt, exclusive, groupId, labels, limitPerContact, limitPerOrganization, metadata, priority, purgeAt, purgeBlockedReason, reach, recurrenceDays, recurrenceFrom, recurrenceKind, recurrenceUntil, recurrenceWeekdays, returnBehaviour, searchBestCombination, startsAt, status, tags, template, timezone, trashBatch } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/promotions`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (audienceChannels !== undefined) {
          _payload[`audience_channels`] = audienceChannels;
        }
        if (audienceRoles !== undefined) {
          _payload[`audience_roles`] = audienceRoles;
        }
        if (audienceSegments !== undefined) {
          _payload[`audience_segments`] = audienceSegments;
        }
        if (budgetDiscount !== undefined) {
          _payload[`budget_discount`] = budgetDiscount;
        }
        if (budgetRedemptions !== undefined) {
          _payload[`budget_redemptions`] = budgetRedemptions;
        }
        if (campaignRef !== undefined) {
          _payload[`campaign_ref`] = campaignRef;
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (conditionMatch !== undefined) {
          _payload[`condition_match`] = conditionMatch;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (deletedAt !== undefined) {
          _payload[`deleted_at`] = deletedAt;
        }
        if (deletedBy !== undefined) {
          _payload[`deleted_by`] = deletedBy;
        }
        if (deletedById !== undefined) {
          _payload[`deleted_by_id`] = deletedById;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (endsAt !== undefined) {
          _payload[`ends_at`] = endsAt;
        }
        if (exclusive !== undefined) {
          _payload[`exclusive`] = exclusive;
        }
        if (groupId !== undefined) {
          _payload[`group_id`] = groupId;
        }
        if (labels !== undefined) {
          _payload[`labels`] = labels;
        }
        if (limitPerContact !== undefined) {
          _payload[`limit_per_contact`] = limitPerContact;
        }
        if (limitPerOrganization !== undefined) {
          _payload[`limit_per_organization`] = limitPerOrganization;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (priority !== undefined) {
          _payload[`priority`] = priority;
        }
        if (purgeAt !== undefined) {
          _payload[`purge_at`] = purgeAt;
        }
        if (purgeBlockedReason !== undefined) {
          _payload[`purge_blocked_reason`] = purgeBlockedReason;
        }
        if (reach !== undefined) {
          _payload[`reach`] = reach;
        }
        if (recurrenceDays !== undefined) {
          _payload[`recurrence_days`] = recurrenceDays;
        }
        if (recurrenceFrom !== undefined) {
          _payload[`recurrence_from`] = recurrenceFrom;
        }
        if (recurrenceKind !== undefined) {
          _payload[`recurrence_kind`] = recurrenceKind;
        }
        if (recurrenceUntil !== undefined) {
          _payload[`recurrence_until`] = recurrenceUntil;
        }
        if (recurrenceWeekdays !== undefined) {
          _payload[`recurrence_weekdays`] = recurrenceWeekdays;
        }
        if (returnBehaviour !== undefined) {
          _payload[`return_behaviour`] = returnBehaviour;
        }
        if (searchBestCombination !== undefined) {
          _payload[`search_best_combination`] = searchBestCombination;
        }
        if (startsAt !== undefined) {
          _payload[`starts_at`] = startsAt;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (tags !== undefined) {
          _payload[`tags`] = tags;
        }
        if (template !== undefined) {
          _payload[`template`] = template;
        }
        if (timezone !== undefined) {
          _payload[`timezone`] = timezone;
        }
        if (trashBatch !== undefined) {
          _payload[`trash_batch`] = trashBatch;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, createSpecs, { method: "post" });
promotionsPromotions
  .command(`overlap-check`)
  .description(`The question the Cockpit wizard asks before a promotion exists: \`ok\` is false while any promotion is running, and \`overlaps\` names them, so the merchant checks the priorities.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/promotions/promotions/overlap-check`;
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
promotionsPromotions
  .command(`empty-trash`)
  .description(`Every promotion in the trash is deleted for good on its own terms. One that something still blocks stays in the trash and is named with its reason, so a partial success says exactly what remained. A right of its own, apart from deleting.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/promotions/promotions/trash/empty`;
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
promotionsPromotions
  .command(`purge`)
  .description(`What the daily purge does, callable by hand: every promotion in the trash for longer than the tenant trash retention (90 days unless the tenant set another) is deleted for good through the same rules as a second delete. A blocked one stays and carries its reason. When the retention cannot be read, nothing is deleted. Also the cron schedule.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/promotions/promotions/trash/purge`;
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
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/promotions", hasLimit: true } },
];
promotionsPromotions
  .command(`delete`)
  .description(`The first delete moves the promotion to the trash: it applies nowhere, its code stays reserved, and its conditions, effects, bundles, vouchers and batches stay with it untouched. Refused for a promotion that has been redeemed, which is archived instead. The second delete, on a promotion already in the trash, deletes it for good — only then do its parts go and \`promotion.deleted\` fire.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`promotions-promotions delete`);
        const _client = await sdkForProject();
        const _apiPath = `/promotions/promotions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/promotions", hasLimit: true } },
];
promotionsPromotions
  .command(`get`)
  .description(`Read one promotion`)
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
        const _apiPath = `/promotions/promotions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/promotions", hasLimit: true } },
  { key: "audienceChannels", option: "--audience-channels <audience-channels>", name: "audience_channels", description: "Who it is for, by channel: a list of channel codes, one of which the cart must arrive through. Empty is every channel. Checked before the conditions, like a question that must hold.", type: "any", required: false },
  { key: "audienceRoles", option: "--audience-roles <audience-roles>", name: "audience_roles", description: "Who it is for, by role: a list of role keys, one of which the buying contact must carry. Empty is every role.", type: "any", required: false },
  { key: "audienceSegments", option: "--audience-segments <audience-segments>", name: "audience_segments", description: "Who it is for, by segment: a list of segment codes, one of which the buying organisation must be in — asked of customers, and never held when customers cannot say. Empty is everybody.", type: "any", required: false },
  { key: "budgetDiscount", option: "--budget-discount <budget-discount>", name: "budget_discount", description: "The most this promotion may give away in total. Reaching it stops the promotion rather than refusing the cart.", type: "number", required: false },
  { key: "budgetRedemptions", option: "--budget-redemptions <budget-redemptions>", name: "budget_redemptions", description: "The most times it may be redeemed in total.", type: "integer", required: false },
  { key: "campaignRef", option: "--campaign-ref <campaign-ref>", name: "campaign_ref", description: "The campaign this promotion belongs to — the id of a campaign in the campaigns app, written when that app claims the promotion (`PUT { campaign_ref }`, null releases it). Filterable, so the campaigns calendar finds a campaign's promotions. Nothing in an evaluation reads it; `redemption.committed` carries it for attribution.", type: "string", required: false },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", description: "The sales channel this promotion is limited to. Empty applies in every channel.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "The short identifier a merchant recognises the promotion by. Unique per tenant.", type: "string", required: false },
  { key: "conditionMatch", option: "--condition-match <condition-match>", name: "condition_match", description: "How the outermost conditions are held together when they are a flat list: `all` or `any`.", type: "string", required: false, enum: ["all","any"] },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "The currency this promotion is stated in. A cart in another currency skips it rather than inventing an exchange rate. Empty applies in every currency.", type: "string", required: false },
  { key: "deletedAt", option: "--deleted-at <deleted-at>", name: "deleted_at", description: "When the promotion was moved to the trash. Empty for a promotion that is not in it. A trashed promotion applies nowhere and keeps its code reserved.", type: "string", required: false },
  { key: "deletedBy", option: "--deleted-by <deleted-by>", name: "deleted_by", description: "Who moved it to the trash, as the platform named them — an email, or `system`.", type: "string", required: false },
  { key: "deletedById", option: "--deleted-by-id <deleted-by-id>", name: "deleted_by_id", description: "The platform subject of whoever moved it to the trash. Kept apart from the name so the history can be pseudonymised.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "What the promotion is for, in the merchant own words.", type: "string", required: false },
  { key: "endsAt", option: "--ends-at <ends-at>", name: "ends_at", description: "When it stops. Empty means it runs until somebody stops it.", type: "string", required: false },
  { key: "exclusive", option: "--exclusive <exclusive>", name: "exclusive", description: "When true, this promotion applying ends the whole evaluation across every group — the \"cannot be combined with anything\" printed on a voucher.", type: "boolean", required: false },
  { key: "groupId", option: "--group-id <group-id>", name: "group_id", description: "The stacking group this promotion is weighed in. A promotion in no group follows the tenant default.", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Display text per locale, e.g. `{\"de\": \"Sommeraktion\", \"en\": \"Summer sale\"}`. What a storefront shows; `name` is what a merchant searches by.", type: "any", required: false },
  { key: "limitPerContact", option: "--limit-per-contact <limit-per-contact>", name: "limit_per_contact", description: "How often one person may redeem it.", type: "integer", required: false },
  { key: "limitPerOrganization", option: "--limit-per-organization <limit-per-organization>", name: "limit_per_organization", description: "How often one company may redeem it. In B2B this is usually what a merchant means by \"once per customer\".", type: "integer", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "What the promotion is called.", type: "string", required: false },
  { key: "priority", option: "--priority <priority>", name: "priority", description: "Higher goes first. The order decides the money as soon as two effects touch the same amount, and a tie is settled by creation time so one cart never produces two different bills.", type: "integer", required: false },
  { key: "purgeAt", option: "--purge-at <purge-at>", name: "purge_at", description: "When the daily purge deletes it for good: the moment it was trashed plus the tenant trash retention.", type: "string", required: false },
  { key: "purgeBlockedReason", option: "--purge-blocked-reason <purge-blocked-reason>", name: "purge_blocked_reason", description: "Why the purge could not delete it for good. Empty unless a purge tried and was refused; cleared on restore.", type: "string", required: false },
  { key: "reach", option: "--reach <reach>", name: "reach", description: "How a buyer arrives at it: `automatic` applies on its own, `code` applies only to a buyer who entered one of its vouchers.", type: "string", required: false, enum: ["automatic","code"] },
  { key: "recurrenceDays", option: "--recurrence-days <recurrence-days>", name: "recurrence_days", description: "Days of the month it runs on: numbers from 1 to 31, or the word `last`. A day a month does not have simply does not occur that month.", type: "any", required: false },
  { key: "recurrenceFrom", option: "--recurrence-from <recurrence-from>", name: "recurrence_from", description: "Time of day it starts, as HH:MM. A range that crosses midnight is honoured as one range.", type: "string", required: false },
  { key: "recurrenceKind", option: "--recurrence-kind <recurrence-kind>", name: "recurrence_kind", description: "Whether it recurs inside its window, and how: `none`, `weekdays` or `days_of_month`. Never both shapes at once.", type: "string", required: false, enum: ["none","weekdays","days_of_month"] },
  { key: "recurrenceUntil", option: "--recurrence-until <recurrence-until>", name: "recurrence_until", description: "Time of day it stops, as HH:MM.", type: "string", required: false },
  { key: "recurrenceWeekdays", option: "--recurrence-weekdays <recurrence-weekdays>", name: "recurrence_weekdays", description: "Day numbers from 1 (Monday) to 7 (Sunday) the promotion runs on.", type: "any", required: false },
  { key: "returnBehaviour", option: "--return-behaviour <return-behaviour>", name: "return_behaviour", description: "What a return does to this promotion discounts: `reverse_proportionally` gives back what the returned lines carried, `reevaluate` decides again on the goods that were kept. Empty follows the tenant default.", type: "string", required: false, enum: ["reverse_proportionally","reevaluate"] },
  { key: "searchBestCombination", option: "--search-best-combination <search-best-combination>", name: "search_best_combination", description: "When true, this promotion is searched against the others that asked for it, and the order giving the buyer most is used. Bounded by a tenant setting; beyond it the stated order is used and the answer says so.", type: "boolean", required: false },
  { key: "startsAt", option: "--starts-at <starts-at>", name: "starts_at", description: "When the promotion becomes live. Empty means it is live as soon as it is active.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "What the merchant set: `draft`, `active`, `paused` or `archived`. What the promotion IS right now also depends on the clock — read `effective_state`.", type: "string", required: false, enum: ["draft","active","paused","archived"] },
  { key: "tags", option: "--tags <tags>", name: "tags", description: "Free labels a merchant groups promotions by. Carried onto every fact this app publishes.", type: "any", required: false },
  { key: "template", option: "--template <template>", name: "template", description: "Which template the Cockpit wizard started the promotion from. A record of where it began; nothing reads it.", type: "string", required: false },
  { key: "timezone", option: "--timezone <timezone>", name: "timezone", description: "The IANA timezone the window and the recurrence are read in. Empty follows the market, then the tenant setting — a merchant means their own midnight.", type: "string", required: false },
  { key: "trashBatch", option: "--trash-batch <trash-batch>", name: "trash_batch", description: "One id per trash action, shared by everything that went in with it. Restoring brings back exactly that batch.", type: "string", required: false },
];
promotionsPromotions
  .command(`update`)
  .description(`Correct a promotion`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--audience-channels <audience-channels>`, `Who it is for, by channel: a list of channel codes, one of which the cart must arrive through. Empty is every channel. Checked before the conditions, like a question that must hold.`)
  .option(`--audience-roles <audience-roles>`, `Who it is for, by role: a list of role keys, one of which the buying contact must carry. Empty is every role.`)
  .option(`--audience-segments <audience-segments>`, `Who it is for, by segment: a list of segment codes, one of which the buying organisation must be in — asked of customers, and never held when customers cannot say. Empty is everybody.`)
  .option(`--budget-discount <budget-discount>`, `The most this promotion may give away in total. Reaching it stops the promotion rather than refusing the cart.`, parseInteger)
  .option(`--budget-redemptions <budget-redemptions>`, `The most times it may be redeemed in total.`, parseInteger)
  .option(`--campaign-ref <campaign-ref>`, `The campaign this promotion belongs to — the id of a campaign in the campaigns app, written when that app claims the promotion (\`PUT { campaign_ref }\`, null releases it). Filterable, so the campaigns calendar finds a campaign's promotions. Nothing in an evaluation reads it; \`redemption.committed\` carries it for attribution.`)
  .option(`--channel-id <channel-id>`, `The sales channel this promotion is limited to. Empty applies in every channel.`)
  .option(`--code <code>`, `The short identifier a merchant recognises the promotion by. Unique per tenant.`)
  .option(`--condition-match <condition-match>`, `How the outermost conditions are held together when they are a flat list: \`all\` or \`any\`.`)
  .option(`--currency <currency>`, `The currency this promotion is stated in. A cart in another currency skips it rather than inventing an exchange rate. Empty applies in every currency.`)
  .option(`--deleted-at <deleted-at>`, `When the promotion was moved to the trash. Empty for a promotion that is not in it. A trashed promotion applies nowhere and keeps its code reserved.`)
  .option(`--deleted-by <deleted-by>`, `Who moved it to the trash, as the platform named them — an email, or \`system\`.`)
  .option(`--deleted-by-id <deleted-by-id>`, `The platform subject of whoever moved it to the trash. Kept apart from the name so the history can be pseudonymised.`)
  .option(`--description <description>`, `What the promotion is for, in the merchant own words.`)
  .option(`--ends-at <ends-at>`, `When it stops. Empty means it runs until somebody stops it.`)
  .option(
    `--exclusive [value]`,
    `When true, this promotion applying ends the whole evaluation across every group — the "cannot be combined with anything" printed on a voucher.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--group-id <group-id>`, `The stacking group this promotion is weighed in. A promotion in no group follows the tenant default.`)
  .option(`--labels <labels>`, `Display text per locale, e.g. \`{"de": "Sommeraktion", "en": "Summer sale"}\`. What a storefront shows; \`name\` is what a merchant searches by.`)
  .option(`--limit-per-contact <limit-per-contact>`, `How often one person may redeem it.`, parseInteger)
  .option(`--limit-per-organization <limit-per-organization>`, `How often one company may redeem it. In B2B this is usually what a merchant means by "once per customer".`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--name <name>`, `What the promotion is called.`)
  .option(`--priority <priority>`, `Higher goes first. The order decides the money as soon as two effects touch the same amount, and a tie is settled by creation time so one cart never produces two different bills.`, parseInteger)
  .option(`--purge-at <purge-at>`, `When the daily purge deletes it for good: the moment it was trashed plus the tenant trash retention.`)
  .option(`--purge-blocked-reason <purge-blocked-reason>`, `Why the purge could not delete it for good. Empty unless a purge tried and was refused; cleared on restore.`)
  .option(`--reach <reach>`, `How a buyer arrives at it: \`automatic\` applies on its own, \`code\` applies only to a buyer who entered one of its vouchers.`)
  .option(`--recurrence-days <recurrence-days>`, `Days of the month it runs on: numbers from 1 to 31, or the word \`last\`. A day a month does not have simply does not occur that month.`)
  .option(`--recurrence-from <recurrence-from>`, `Time of day it starts, as HH:MM. A range that crosses midnight is honoured as one range.`)
  .option(`--recurrence-kind <recurrence-kind>`, `Whether it recurs inside its window, and how: \`none\`, \`weekdays\` or \`days_of_month\`. Never both shapes at once.`)
  .option(`--recurrence-until <recurrence-until>`, `Time of day it stops, as HH:MM.`)
  .option(`--recurrence-weekdays <recurrence-weekdays>`, `Day numbers from 1 (Monday) to 7 (Sunday) the promotion runs on.`)
  .option(`--return-behaviour <return-behaviour>`, `What a return does to this promotion discounts: \`reverse_proportionally\` gives back what the returned lines carried, \`reevaluate\` decides again on the goods that were kept. Empty follows the tenant default.`)
  .option(
    `--search-best-combination [value]`,
    `When true, this promotion is searched against the others that asked for it, and the order giving the buyer most is used. Bounded by a tenant setting; beyond it the stated order is used and the answer says so.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--starts-at <starts-at>`, `When the promotion becomes live. Empty means it is live as soon as it is active.`)
  .option(`--status <status>`, `What the merchant set: \`draft\`, \`active\`, \`paused\` or \`archived\`. What the promotion IS right now also depends on the clock — read \`effective_state\`.`)
  .option(`--tags <tags>`, `Free labels a merchant groups promotions by. Carried onto every fact this app publishes.`)
  .option(`--template <template>`, `Which template the Cockpit wizard started the promotion from. A record of where it began; nothing reads it.`)
  .option(`--timezone <timezone>`, `The IANA timezone the window and the recurrence are read in. Empty follows the market, then the tenant setting — a merchant means their own midnight.`)
  .option(`--trash-batch <trash-batch>`, `One id per trash action, shared by everything that went in with it. Restoring brings back exactly that batch.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, audienceChannels, audienceRoles, audienceSegments, budgetDiscount, budgetRedemptions, campaignRef, channelId, code, conditionMatch, currency, deletedAt, deletedBy, deletedById, description, endsAt, exclusive, groupId, labels, limitPerContact, limitPerOrganization, metadata, name, priority, purgeAt, purgeBlockedReason, reach, recurrenceDays, recurrenceFrom, recurrenceKind, recurrenceUntil, recurrenceWeekdays, returnBehaviour, searchBestCombination, startsAt, status, tags, template, timezone, trashBatch } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/promotions/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (audienceChannels !== undefined) {
          _payload[`audience_channels`] = audienceChannels;
        }
        if (audienceRoles !== undefined) {
          _payload[`audience_roles`] = audienceRoles;
        }
        if (audienceSegments !== undefined) {
          _payload[`audience_segments`] = audienceSegments;
        }
        if (budgetDiscount !== undefined) {
          _payload[`budget_discount`] = budgetDiscount;
        }
        if (budgetRedemptions !== undefined) {
          _payload[`budget_redemptions`] = budgetRedemptions;
        }
        if (campaignRef !== undefined) {
          _payload[`campaign_ref`] = campaignRef;
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (conditionMatch !== undefined) {
          _payload[`condition_match`] = conditionMatch;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (deletedAt !== undefined) {
          _payload[`deleted_at`] = deletedAt;
        }
        if (deletedBy !== undefined) {
          _payload[`deleted_by`] = deletedBy;
        }
        if (deletedById !== undefined) {
          _payload[`deleted_by_id`] = deletedById;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (endsAt !== undefined) {
          _payload[`ends_at`] = endsAt;
        }
        if (exclusive !== undefined) {
          _payload[`exclusive`] = exclusive;
        }
        if (groupId !== undefined) {
          _payload[`group_id`] = groupId;
        }
        if (labels !== undefined) {
          _payload[`labels`] = labels;
        }
        if (limitPerContact !== undefined) {
          _payload[`limit_per_contact`] = limitPerContact;
        }
        if (limitPerOrganization !== undefined) {
          _payload[`limit_per_organization`] = limitPerOrganization;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (priority !== undefined) {
          _payload[`priority`] = priority;
        }
        if (purgeAt !== undefined) {
          _payload[`purge_at`] = purgeAt;
        }
        if (purgeBlockedReason !== undefined) {
          _payload[`purge_blocked_reason`] = purgeBlockedReason;
        }
        if (reach !== undefined) {
          _payload[`reach`] = reach;
        }
        if (recurrenceDays !== undefined) {
          _payload[`recurrence_days`] = recurrenceDays;
        }
        if (recurrenceFrom !== undefined) {
          _payload[`recurrence_from`] = recurrenceFrom;
        }
        if (recurrenceKind !== undefined) {
          _payload[`recurrence_kind`] = recurrenceKind;
        }
        if (recurrenceUntil !== undefined) {
          _payload[`recurrence_until`] = recurrenceUntil;
        }
        if (recurrenceWeekdays !== undefined) {
          _payload[`recurrence_weekdays`] = recurrenceWeekdays;
        }
        if (returnBehaviour !== undefined) {
          _payload[`return_behaviour`] = returnBehaviour;
        }
        if (searchBestCombination !== undefined) {
          _payload[`search_best_combination`] = searchBestCombination;
        }
        if (startsAt !== undefined) {
          _payload[`starts_at`] = startsAt;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (tags !== undefined) {
          _payload[`tags`] = tags;
        }
        if (template !== undefined) {
          _payload[`template`] = template;
        }
        if (timezone !== undefined) {
          _payload[`timezone`] = timezone;
        }
        if (trashBatch !== undefined) {
          _payload[`trash_batch`] = trashBatch;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, updateSpecs, { method: "put" });
const conditionsSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/promotions", hasLimit: true } },
];
promotionsPromotions
  .command(`conditions`)
  .description(`The rows of the condition list, built into the tree the engine evaluates, with the depth it reaches. What an editor renders and what a reader checks an offer against.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          conditionsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/promotions/{id}/conditions`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, conditionsSpecs, { method: "get" });
const conditionsCheckSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/promotions", hasLimit: true } },
];
promotionsPromotions
  .command(`conditions-check`)
  .description(`An empty group holds for nothing or for everything, so whichever a merchant meant, one of the two silently ruins the promotion. This finds those, and a tree deeper than the tenant allows, before a shopper does.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          conditionsCheckSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/promotions/{id}/conditions/check`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, conditionsCheckSpecs, { method: "post" });
const copySpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/promotions", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "The code of the copy. Unique per tenant, including the trash.", type: "string", required: true },
  { key: "parts", option: "--parts [parts...]", name: "parts", description: "What comes along. Omitted means both.", type: "array", required: false, enum: ["conditions","effects"] },
];
promotionsPromotions
  .command(`copy`)
  .description(`A draft with everything the promotion says about itself, under a new code, plus the parts asked for: \`conditions\` (the whole tree) and \`effects\`. Vouchers, redemptions and the budget used are never copied — they are what happened to the original. Answers the new promotion with \`copied\` counting what came along.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--code <code>`, `The code of the copy. Unique per tenant, including the trash.`)
  .option(`--parts [parts...]`, `What comes along. Omitted means both.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, parts } = await promptForMissing(
          _options,
          copySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/promotions/{id}/copy`.replace(`{id}`, id);
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
        if (parts !== undefined) {
          _payload[`parts`] = parts;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, copySpecs, { method: "post" });
const endSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/promotions", hasLimit: true } },
  { key: "at", option: "--at <at>", name: "at", description: "When it ends, for `when: at`. Not in the past.", type: "string", required: false },
  { key: "honourReservations", option: "--honour-reservations <honour-reservations>", name: "honour_reservations", description: "Whether holds open carts carry may still be committed (default true).", type: "boolean", required: false },
  { key: "when", option: "--when <when>", name: "when", description: "Now (default) or at the date in `at`.", type: "string", required: false, enum: ["now","at"] },
];
promotionsPromotions
  .command(`end`)
  .description(`Sets the end of a running, scheduled or paused promotion — now, or at a later date — and nothing else, so its redemptions stay as they are. Holds open carts carry keep counting, unless \`honour_reservations\` is false and it ends now: then they are given back as expired.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--at <at>`, `When it ends, for \`when: at\`. Not in the past.`)
  .option(
    `--honour-reservations [value]`,
    `Whether holds open carts carry may still be committed (default true).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--when <when>`, `Now (default) or at the date in \`at\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, at, honourReservations, when } = await promptForMissing(
          _options,
          endSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/promotions/{id}/end`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (at !== undefined) {
          _payload[`at`] = at;
        }
        if (honourReservations !== undefined) {
          _payload[`honour_reservations`] = honourReservations;
        }
        if (when !== undefined) {
          _payload[`when`] = when;
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, endSpecs, { method: "post" });
const overlapsSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/promotions", hasLimit: true } },
];
promotionsPromotions
  .command(`overlaps`)
  .description(`Running or scheduled promotions whose window overlaps this one, that act on the same kind of amount (goods or shipping) and share a market — a promotion in no market is in every one. Each says when and where they meet, and how they combine by exclusivity and priority.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          overlapsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/promotions/{id}/overlaps`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, overlapsSpecs, { method: "get" });
const overviewSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/promotions", hasLimit: true } },
];
promotionsPromotions
  .command(`overview`)
  .description(`Two panels of German sentences for the Cockpit record: \`effect\` (the sentence, every effect, the goods, whether it combines) and \`runtime\` (state against release, time left, budget used, a forecast of when the budget runs out at the current pace, and how many carts hold it now). \`usage\` carries the discount budget, the redemption ceiling and the runtime as rows of label and value with the share gone, worded in the caller language (Accept-Language; German unless English is asked for), the carts holding it as a \`footer\` row.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          overviewSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/promotions/{id}/overview`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, overviewSpecs, { method: "get" });
const restoreSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/promotions", hasLimit: true } },
];
promotionsPromotions
  .command(`restore`)
  .description(`Clears the trash marks on the promotion. Its conditions, effects, bundles, vouchers and batches were never touched, so they come back with it, and it applies again exactly as it did before — in the state it was in. The same right as deleting.`)
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
        const _apiPath = `/promotions/promotions/{id}/restore`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, restoreSpecs, { method: "post" });
const stateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/promotions", hasLimit: true } },
];
promotionsPromotions
  .command(`state`)
  .description(`Two facts, never one: the state a merchant set, and what the clock has made of it. A surface showing only the first tells a merchant their finished campaign is still running. Also reports whether any buyer can reach it, and what is left of its budget.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          stateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/promotions/{id}/state`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, stateSpecs, { method: "get" });
const timelineSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/promotions", hasLimit: true } },
];
promotionsPromotions
  .command(`timeline`)
  .description(`Redemptions committed per day, and of those the ones later taken back (a cancellation or a return) on the day they were taken back, in the promotion time zone (Europe/Berlin when it names none) — from the first such day to the last with every day between, at most the latest 60 days.`)
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
        const _apiPath = `/promotions/promotions/{id}/timeline`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsPromotions.commands.at(-1)!, timelineSpecs, { method: "get" });
