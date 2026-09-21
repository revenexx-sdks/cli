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

export const paymentsMethods = new Command("payments-methods")
  .description(
    commandDescriptions["paymentsMethods"] ??
      `WHAT a buyer may pay with, and what it costs them. A payment method is the line a checkout offers: a \`code\`, buyer-facing \`labels\`, a kind ('self_managed' for invoice and prepayment, 'psp' for anything an acquirer moves), a fee ('none', 'fixed' or 'percent' of the order), the countries it may be offered into and the order-value bounds it applies between. POST /payments/methods/eligible is the read side of everything in here — it takes the buyer context and answers only the methods that apply, with their computed fees, plus an \`excluded\` list naming the ones that did not and why. Note what eligibility does NOT ask: whether the method's PSP is configured and enabled. A method is joined to the ledger by CODE and not by a foreign key, which is why both deleting one and renaming its \`code\` are refused while a payment still names it.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Exact method code.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Restrict to self-managed or PSP-backed methods.", type: "string", required: false, enum: ["self_managed","psp"] },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Restrict to enabled or disabled methods. Indexed.", type: "boolean", required: false },
  { key: "provider", option: "--provider <provider>", name: "provider", description: "Exact PSP code.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
paymentsMethods
  .command(`list`)
  .description(`Every method this tenant has configured, enabled or not — what the Cockpit's Payment methods screen shows and how an integration finds out which codes exist. It answers CONFIGURATION, never an offer: nothing here is evaluated against a buyer, so a method restricted to Germany, one whose order-value bounds exclude this basket and one whose PSP was never set up all come back the same way. The call a checkout makes is POST /payments/methods/eligible. Rows come back in whatever order the database returns them, so a storefront-shaped list needs \`?order=position.asc\` — \`position\` is the merchant's intended sequence and nothing sorts by it here on its own.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.`)
  .option(`--code <code>`, `Exact method code.`)
  .option(`--kind <kind>`, `Restrict to self-managed or PSP-backed methods.`)
  .option(
    `--enabled [value]`,
    `Restrict to enabled or disabled methods. Indexed.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--provider <provider>`, `Exact PSP code.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, code, kind, enabled, provider, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/methods`;
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
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (provider !== undefined) {
          _payload[`provider`] = provider;
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
registerPromptSpecs(paymentsMethods.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "The machine name of the method, unique per tenant and lower case by convention ('invoice', 'prepayment', 'card', 'paypal'). It is the string the checkout asks for, the string every payment stores, and therefore the one value here that cannot be changed freely: renaming it would leave the ledger naming something that no longer exists, so it is refused with 409 for as long as any payment names it. Required on create.", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "Operator-facing name, in the language the merchant administers in. What a buyer sees comes from `labels`. Required on create.", type: "string", required: true },
  { key: "countries", option: "--countries [countries...]", name: "countries", description: "Allowed ISO 3166-1 alpha-2 country codes, compared upper-cased against the buyer country. null or an empty list means unrestricted — the invoice method this app seeds is restricted to DE, which is why an eligibility call without a country sees it excluded.", type: "array", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "One line explaining the method where it is offered — payment terms, what happens after the order. Shown to the buyer, so it is the merchant's wording rather than the app's.", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "A disabled method is never eligible and never reaches a checkout. This is the switch an operator wants: deleting a method the ledger still names — or renaming its `code` — is refused with 409. Defaults to false, so a half-configured method cannot reach a checkout by accident.", type: "boolean", required: false },
  { key: "feeAmount", option: "--fee-amount <fee-amount>", name: "fee_amount", description: "The surcharge this method costs the buyer, read as an amount or as a percentage depending on `fee_type`. Never negative — a discount for paying a certain way is not expressible here. Defaults to 0.", type: "number", required: false },
  { key: "feeCurrency", option: "--fee-currency <fee-currency>", name: "fee_currency", description: "ISO 4217 code this method is configured in: the currency of a fixed fee, and the one `min_order_value` and `max_order_value` are read in (ADR-0106 D5a). Stamped from the market’s `default_currency` when a method is created naming none, and stored upper case — an order in another currency is not offered this method. Defaults to EUR, and lower case is accepted here exactly as the handlers accept it.", type: "string", required: false },
  { key: "feeType", option: "--fee-type <fee-type>", name: "fee_type", description: "How `fee_amount` applies: 'none' (no surcharge), 'fixed' (that many units of `fee_currency`) or 'percent' (that share of the order amount). Defaults to 'none'.", type: "string", required: false, enum: ["none","fixed","percent"] },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Who moves the money. 'self_managed' — invoice, prepayment — means the merchant fulfils and reconciles it outside any PSP, and such a payment authorizes the moment it is created. 'psp' means a configured provider authorizes, captures and refunds it. Defaults to 'self_managed'; 'psp' needs a 'provider' to transact.", type: "string", required: false, enum: ["self_managed","psp"] },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Buyer-facing names keyed by language tag — what a storefront shows instead of the operator-facing `name`. Free jsonb: the database constrains neither the tags nor the values, so a client reads the tag it wants and falls back to `en`.", type: "object", required: false },
  { key: "maxOrderValue", option: "--max-order-value <max-order-value>", name: "max_order_value", description: "Largest order amount this method may be used for — the usual credit-risk cap on invoice and prepayment. null means no upper bound. Read in this method’s `fee_currency` — see `min_order_value` for why a differing order currency filters the method out instead.", type: "number", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form merchant data carried on the configuration. This app never reads it — it is storage for the integrations that do (an ERP key for the method, a ledger account, a display hint).", type: "object", required: false },
  { key: "minOrderValue", option: "--min-order-value <min-order-value>", name: "min_order_value", description: "Smallest order amount this method may be used for — the usual guard against paying a €5 order by invoice. null means no lower bound. Read in this method’s `fee_currency`, not in the order’s (ADR-0106 D5a): a method is configured for the money it charges in, and an order in another currency is not offered the method at all rather than compared against a threshold it is not denominated in.", type: "number", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order at checkout, ascending — the merchant's preferred payment method first. Defaults to 0.", type: "integer", required: false },
  { key: "provider", option: "--provider <provider>", name: "provider", description: "The PSP code this method transacts through, from GET /payments/providers/catalog. Only meaningful for kind 'psp'; a PSP method that names none falls back to the tenant's `default_provider` setting. Must be a code GET /payments/providers/catalog carries.", type: "string", required: false },
  { key: "providerMethod", option: "--provider-method <provider-method>", name: "provider_method", description: "The provider's own payment-method id ('card', 'paypal', 'sepa_debit') — what the driver is told to charge. Copied onto every payment created with this method as `metadata.provider_method`.", type: "string", required: false },
];
paymentsMethods
  .command(`create`)
  .description(`Adds a line a checkout can offer. A create cannot omit \`code\` and \`name\`; every other column is optional or defaulted by the database. Two rows of this tenant may not share \`code\` — that is the 409. Two defaults are worth knowing before the first call: \`enabled\` is false, so a new method reaches no checkout until it is switched on, and \`kind\` is 'self_managed' — a card or wallet method needs \`kind: "psp"\` plus a \`provider\` the catalog carries, or it falls back to the tenant's \`default_provider\` at payment time and fails there if none is set. The \`code\` is the value every payment, every checkout and every ERP will name this method by from now on, and once a single payment has been made under it a rename is refused with 409: choose it once.`)
  .option(`--code <code>`, `The machine name of the method, unique per tenant and lower case by convention ('invoice', 'prepayment', 'card', 'paypal'). It is the string the checkout asks for, the string every payment stores, and therefore the one value here that cannot be changed freely: renaming it would leave the ledger naming something that no longer exists, so it is refused with 409 for as long as any payment names it. Required on create.`)
  .option(`--name <name>`, `Operator-facing name, in the language the merchant administers in. What a buyer sees comes from \`labels\`. Required on create.`)
  .option(`--countries [countries...]`, `Allowed ISO 3166-1 alpha-2 country codes, compared upper-cased against the buyer country. null or an empty list means unrestricted — the invoice method this app seeds is restricted to DE, which is why an eligibility call without a country sees it excluded.`)
  .option(`--description <description>`, `One line explaining the method where it is offered — payment terms, what happens after the order. Shown to the buyer, so it is the merchant's wording rather than the app's.`)
  .option(
    `--enabled [value]`,
    `A disabled method is never eligible and never reaches a checkout. This is the switch an operator wants: deleting a method the ledger still names — or renaming its \`code\` — is refused with 409. Defaults to false, so a half-configured method cannot reach a checkout by accident.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--fee-amount <fee-amount>`, `The surcharge this method costs the buyer, read as an amount or as a percentage depending on \`fee_type\`. Never negative — a discount for paying a certain way is not expressible here. Defaults to 0.`, parseInteger)
  .option(`--fee-currency <fee-currency>`, `ISO 4217 code this method is configured in: the currency of a fixed fee, and the one \`min_order_value\` and \`max_order_value\` are read in (ADR-0106 D5a). Stamped from the market’s \`default_currency\` when a method is created naming none, and stored upper case — an order in another currency is not offered this method. Defaults to EUR, and lower case is accepted here exactly as the handlers accept it.`)
  .option(`--fee-type <fee-type>`, `How \`fee_amount\` applies: 'none' (no surcharge), 'fixed' (that many units of \`fee_currency\`) or 'percent' (that share of the order amount). Defaults to 'none'.`)
  .option(`--kind <kind>`, `Who moves the money. 'self_managed' — invoice, prepayment — means the merchant fulfils and reconciles it outside any PSP, and such a payment authorizes the moment it is created. 'psp' means a configured provider authorizes, captures and refunds it. Defaults to 'self_managed'; 'psp' needs a 'provider' to transact.`)
  .option(`--labels <labels>`, `Buyer-facing names keyed by language tag — what a storefront shows instead of the operator-facing \`name\`. Free jsonb: the database constrains neither the tags nor the values, so a client reads the tag it wants and falls back to \`en\`.`)
  .option(`--max-order-value <max-order-value>`, `Largest order amount this method may be used for — the usual credit-risk cap on invoice and prepayment. null means no upper bound. Read in this method’s \`fee_currency\` — see \`min_order_value\` for why a differing order currency filters the method out instead.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form merchant data carried on the configuration. This app never reads it — it is storage for the integrations that do (an ERP key for the method, a ledger account, a display hint).`)
  .option(`--min-order-value <min-order-value>`, `Smallest order amount this method may be used for — the usual guard against paying a €5 order by invoice. null means no lower bound. Read in this method’s \`fee_currency\`, not in the order’s (ADR-0106 D5a): a method is configured for the money it charges in, and an order in another currency is not offered the method at all rather than compared against a threshold it is not denominated in.`, parseInteger)
  .option(`--position <position>`, `Sort order at checkout, ascending — the merchant's preferred payment method first. Defaults to 0.`, parseInteger)
  .option(`--provider <provider>`, `The PSP code this method transacts through, from GET /payments/providers/catalog. Only meaningful for kind 'psp'; a PSP method that names none falls back to the tenant's \`default_provider\` setting. Must be a code GET /payments/providers/catalog carries.`)
  .option(`--provider-method <provider-method>`, `The provider's own payment-method id ('card', 'paypal', 'sepa_debit') — what the driver is told to charge. Copied onto every payment created with this method as \`metadata.provider_method\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, countries, description, enabled, feeAmount, feeCurrency, feeType, kind, labels, maxOrderValue, metadata, minOrderValue, position, provider, providerMethod } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/methods`;
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
        if (countries !== undefined) {
          _payload[`countries`] = countries;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (feeAmount !== undefined) {
          _payload[`fee_amount`] = feeAmount;
        }
        if (feeCurrency !== undefined) {
          _payload[`fee_currency`] = feeCurrency;
        }
        if (feeType !== undefined) {
          _payload[`fee_type`] = feeType;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (maxOrderValue !== undefined) {
          _payload[`max_order_value`] = maxOrderValue;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (minOrderValue !== undefined) {
          _payload[`min_order_value`] = minOrderValue;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (provider !== undefined) {
          _payload[`provider`] = provider;
        }
        if (providerMethod !== undefined) {
          _payload[`provider_method`] = providerMethod;
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
registerPromptSpecs(paymentsMethods.commands.at(-1)!, createSpecs, { method: "post" });
paymentsMethods
  .command(`defaults`)
  .description(`Writes the four methods a shop starts with — invoice and prepayment as self-managed, card and PayPal routed at the mock PSP so a fresh install can complete a checkout end to end — together with the four provider rows behind them: the built-in mock plus Stripe, PayPal and Novalnet, the three connectors this app opens outbound. The app already runs this for itself when it is installed (it listens on app.installed), so calling the route is for the second time and after: a method someone deleted, or a row a later release added that an existing install never got. Stripe, PayPal and Novalnet arrive disabled, in test mode and without credentials — the operator fills those in — while the mock arrives enabled, because it moves no money. Re-running is safe by design: it never duplicates a row and never overwrites an existing one, so nothing an operator has set can be undone by calling it again. Only genuinely missing option keys (a logo added after the first install) are filled, and those rows are reported as "updated" rather than created.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/payments/methods/defaults`;
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
const eligibleSpecs: PromptSpec[] = [
  { key: "amount", option: "--amount <amount>", name: "amount", description: "The order amount the order-value bounds are checked against and the percentage fees are computed from. Defaults to 0, which excludes every method carrying a minimum. Nothing is written, so the ledger's own amount bound does not apply here.", type: "number", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "The buyer's ISO 3166-1 alpha-2 country code. A method restricted to countries is excluded without it — an unknown buyer sees only the unrestricted methods, which is the safe default and not a bug.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code the amount is in, echoed onto every computed fee. Defaults to EUR. This app does no conversion: the fee comes back in the currency it was asked with.", type: "string", required: false },
];
paymentsMethods
  .command(`eligible`)
  .description(`The checkout's question — "what can THIS buyer pay with?" — answered server-side before any PSP is involved, so the storefront never renders a method the create would then refuse with 422. It evaluates the buyer context against every configured method: disabled, a country outside \`countries\`, a currency other than the method's own \`fee_currency\`, an amount outside \`min_order_value\`/\`max_order_value\`. The currency dimension is ADR-0106 D5a: a method is configured for the money it charges in, its two thresholds are read in that currency, and an order in another one is filtered out rather than compared against a bound it is not denominated in. It is reported before the thresholds, because a merchant told "amount below minimum 10" about a CHF order against a EUR method goes looking at the wrong number. Each eligible method carries the currency its own fee is in, never the order's. Restriction dimensions are ANDed and entries within one are ORed, and an empty dimension means unrestricted. Eligible methods come back sorted by \`position\` with their fee already computed for this amount; everything else lands in \`excluded\` with the reason in words, which is what makes a support question answerable. It reads only — nothing is written and no provider is called. Two things it does NOT check: whether the method's PSP is configured and enabled (a method whose provider is switched off is still offered here and fails at POST /payments — a provider a method names can no longer be deleted, which closes the other half of the same gap), and anything about the buyer beyond country and amount. A context that matches nothing is 200 with an empty \`methods\` list, never 404.`)
  .option(`--amount <amount>`, `The order amount the order-value bounds are checked against and the percentage fees are computed from. Defaults to 0, which excludes every method carrying a minimum. Nothing is written, so the ledger's own amount bound does not apply here.`, parseInteger)
  .option(`--country <country>`, `The buyer's ISO 3166-1 alpha-2 country code. A method restricted to countries is excluded without it — an unknown buyer sees only the unrestricted methods, which is the safe default and not a bug.`)
  .option(`--currency <currency>`, `ISO 4217 code the amount is in, echoed onto every computed fee. Defaults to EUR. This app does no conversion: the fee comes back in the currency it was asked with.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { amount, country, currency } = await promptForMissing(
          _options,
          eligibleSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/methods/eligible`;
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
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
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
registerPromptSpecs(paymentsMethods.commands.at(-1)!, eligibleSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The payment method configuration. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.", type: "string", required: true, resource: { listPath: "/payments/methods", hasLimit: true } },
];
paymentsMethods
  .command(`delete`)
  .description(`payments.method_code is a CODE, not a foreign key: a payment records what happened and has to survive the configuration it was made with. The cost of that looseness is that deleting a method turns every payment made with it into a row naming something that no longer exists. So the count is taken HERE and answered as 409 with the number, rather than left to whoever is about to click delete — a client that pre-counts asks a second question whose answer disagrees the moment a payment lands between the two calls. Disabling the method (enabled: false) is what an operator usually meant and stays available.`)
  .option(`--id <id>`, `The payment method configuration. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`payments-methods delete`);
        const _client = await sdkForProject();
        const _apiPath = `/payments/methods/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(paymentsMethods.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The payment method configuration. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.", type: "string", required: true, resource: { listPath: "/payments/methods", hasLimit: true } },
];
paymentsMethods
  .command(`get`)
  .description(`One configuration, every column, addressed by its row id — the edit form's read. It is addressed by ID and there is no route that takes a \`code\`, which matters because the CODE is what a checkout, a payment and an ERP name a method by: to resolve one, filter the list (\`GET /payments/methods?code=invoice\`), which answers a page of at most one row because (tenant_id, code) is unique. Reading a method says nothing about whether a buyer may use it — that is POST /payments/methods/eligible — and nothing about whether its PSP can transact, which is under the provider configuration.`)
  .option(`--id <id>`, `The payment method configuration. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/methods/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(paymentsMethods.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The payment method configuration. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.", type: "string", required: true, resource: { listPath: "/payments/methods", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "The machine name of the method, unique per tenant and lower case by convention ('invoice', 'prepayment', 'card', 'paypal'). It is the string the checkout asks for, the string every payment stores, and therefore the one value here that cannot be changed freely: renaming it would leave the ledger naming something that no longer exists, so it is refused with 409 for as long as any payment names it. Required on create.", type: "string", required: false },
  { key: "countries", option: "--countries [countries...]", name: "countries", description: "Allowed ISO 3166-1 alpha-2 country codes, compared upper-cased against the buyer country. null or an empty list means unrestricted — the invoice method this app seeds is restricted to DE, which is why an eligibility call without a country sees it excluded.", type: "array", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "One line explaining the method where it is offered — payment terms, what happens after the order. Shown to the buyer, so it is the merchant's wording rather than the app's.", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "A disabled method is never eligible and never reaches a checkout. This is the switch an operator wants: deleting a method the ledger still names — or renaming its `code` — is refused with 409. Defaults to false, so a half-configured method cannot reach a checkout by accident.", type: "boolean", required: false },
  { key: "feeAmount", option: "--fee-amount <fee-amount>", name: "fee_amount", description: "The surcharge this method costs the buyer, read as an amount or as a percentage depending on `fee_type`. Never negative — a discount for paying a certain way is not expressible here. Defaults to 0.", type: "number", required: false },
  { key: "feeCurrency", option: "--fee-currency <fee-currency>", name: "fee_currency", description: "ISO 4217 code this method is configured in: the currency of a fixed fee, and the one `min_order_value` and `max_order_value` are read in (ADR-0106 D5a). Stamped from the market’s `default_currency` when a method is created naming none, and stored upper case — an order in another currency is not offered this method. Defaults to EUR, and lower case is accepted here exactly as the handlers accept it.", type: "string", required: false },
  { key: "feeType", option: "--fee-type <fee-type>", name: "fee_type", description: "How `fee_amount` applies: 'none' (no surcharge), 'fixed' (that many units of `fee_currency`) or 'percent' (that share of the order amount). Defaults to 'none'.", type: "string", required: false, enum: ["none","fixed","percent"] },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Who moves the money. 'self_managed' — invoice, prepayment — means the merchant fulfils and reconciles it outside any PSP, and such a payment authorizes the moment it is created. 'psp' means a configured provider authorizes, captures and refunds it. Defaults to 'self_managed'; 'psp' needs a 'provider' to transact.", type: "string", required: false, enum: ["self_managed","psp"] },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Buyer-facing names keyed by language tag — what a storefront shows instead of the operator-facing `name`. Free jsonb: the database constrains neither the tags nor the values, so a client reads the tag it wants and falls back to `en`.", type: "object", required: false },
  { key: "maxOrderValue", option: "--max-order-value <max-order-value>", name: "max_order_value", description: "Largest order amount this method may be used for — the usual credit-risk cap on invoice and prepayment. null means no upper bound. Read in this method’s `fee_currency` — see `min_order_value` for why a differing order currency filters the method out instead.", type: "number", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form merchant data carried on the configuration. This app never reads it — it is storage for the integrations that do (an ERP key for the method, a ledger account, a display hint).", type: "object", required: false },
  { key: "minOrderValue", option: "--min-order-value <min-order-value>", name: "min_order_value", description: "Smallest order amount this method may be used for — the usual guard against paying a €5 order by invoice. null means no lower bound. Read in this method’s `fee_currency`, not in the order’s (ADR-0106 D5a): a method is configured for the money it charges in, and an order in another currency is not offered the method at all rather than compared against a threshold it is not denominated in.", type: "number", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Operator-facing name, in the language the merchant administers in. What a buyer sees comes from `labels`. Required on create.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order at checkout, ascending — the merchant's preferred payment method first. Defaults to 0.", type: "integer", required: false },
  { key: "provider", option: "--provider <provider>", name: "provider", description: "The PSP code this method transacts through, from GET /payments/providers/catalog. Only meaningful for kind 'psp'; a PSP method that names none falls back to the tenant's `default_provider` setting. Must be a code GET /payments/providers/catalog carries.", type: "string", required: false },
  { key: "providerMethod", option: "--provider-method <provider-method>", name: "provider_method", description: "The provider's own payment-method id ('card', 'paypal', 'sepa_debit') — what the driver is told to charge. Copied onto every payment created with this method as `metadata.provider_method`.", type: "string", required: false },
];
paymentsMethods
  .command(`update`)
  .description(`A PUT that PATCHES: only the keys in the body are written and every omitted column keeps its value, so \`{"enabled": false}\` is the whole request for taking a method out of checkout. A body with no writable key is refused with 400 rather than treated as a no-op. This is the route for all three things an operator changes about a method after it exists — the \`enabled\` switch that puts it in or out of checkout, the fee it charges (\`fee_type\`, \`fee_amount\`, \`fee_currency\`) and the restrictions that decide who is offered it (\`countries\`, \`min_order_value\`, \`max_order_value\`) — alongside its labels, description and \`position\`. \`enabled: false\` is the safe way to retire one — it disappears from POST /payments/methods/eligible immediately and stays on every payment ever made with it. The one write this route refuses is a rename of \`code\` while the ledger still names the old one. The three tables of this app carry no foreign keys at all: a payment names its method by \`method_code\` and its acquirer by \`provider\`, both plain text, because a payment records what happened and has to survive the configuration it was made with. So the database will not stop this — whatever the ledger still names, it goes on naming. A rename would therefore leave every recorded payment pointing at a code no configuration carries, which is the same harm DELETE on this row answers 409 for — so it answers the same 409, with the same \`method_in_use\` code and the same count. Renaming a method nothing has been paid with is still free, and so is every other column at any time.`)
  .option(`--id <id>`, `The payment method configuration. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.`)
  .option(`--code <code>`, `The machine name of the method, unique per tenant and lower case by convention ('invoice', 'prepayment', 'card', 'paypal'). It is the string the checkout asks for, the string every payment stores, and therefore the one value here that cannot be changed freely: renaming it would leave the ledger naming something that no longer exists, so it is refused with 409 for as long as any payment names it. Required on create.`)
  .option(`--countries [countries...]`, `Allowed ISO 3166-1 alpha-2 country codes, compared upper-cased against the buyer country. null or an empty list means unrestricted — the invoice method this app seeds is restricted to DE, which is why an eligibility call without a country sees it excluded.`)
  .option(`--description <description>`, `One line explaining the method where it is offered — payment terms, what happens after the order. Shown to the buyer, so it is the merchant's wording rather than the app's.`)
  .option(
    `--enabled [value]`,
    `A disabled method is never eligible and never reaches a checkout. This is the switch an operator wants: deleting a method the ledger still names — or renaming its \`code\` — is refused with 409. Defaults to false, so a half-configured method cannot reach a checkout by accident.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--fee-amount <fee-amount>`, `The surcharge this method costs the buyer, read as an amount or as a percentage depending on \`fee_type\`. Never negative — a discount for paying a certain way is not expressible here. Defaults to 0.`, parseInteger)
  .option(`--fee-currency <fee-currency>`, `ISO 4217 code this method is configured in: the currency of a fixed fee, and the one \`min_order_value\` and \`max_order_value\` are read in (ADR-0106 D5a). Stamped from the market’s \`default_currency\` when a method is created naming none, and stored upper case — an order in another currency is not offered this method. Defaults to EUR, and lower case is accepted here exactly as the handlers accept it.`)
  .option(`--fee-type <fee-type>`, `How \`fee_amount\` applies: 'none' (no surcharge), 'fixed' (that many units of \`fee_currency\`) or 'percent' (that share of the order amount). Defaults to 'none'.`)
  .option(`--kind <kind>`, `Who moves the money. 'self_managed' — invoice, prepayment — means the merchant fulfils and reconciles it outside any PSP, and such a payment authorizes the moment it is created. 'psp' means a configured provider authorizes, captures and refunds it. Defaults to 'self_managed'; 'psp' needs a 'provider' to transact.`)
  .option(`--labels <labels>`, `Buyer-facing names keyed by language tag — what a storefront shows instead of the operator-facing \`name\`. Free jsonb: the database constrains neither the tags nor the values, so a client reads the tag it wants and falls back to \`en\`.`)
  .option(`--max-order-value <max-order-value>`, `Largest order amount this method may be used for — the usual credit-risk cap on invoice and prepayment. null means no upper bound. Read in this method’s \`fee_currency\` — see \`min_order_value\` for why a differing order currency filters the method out instead.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form merchant data carried on the configuration. This app never reads it — it is storage for the integrations that do (an ERP key for the method, a ledger account, a display hint).`)
  .option(`--min-order-value <min-order-value>`, `Smallest order amount this method may be used for — the usual guard against paying a €5 order by invoice. null means no lower bound. Read in this method’s \`fee_currency\`, not in the order’s (ADR-0106 D5a): a method is configured for the money it charges in, and an order in another currency is not offered the method at all rather than compared against a threshold it is not denominated in.`, parseInteger)
  .option(`--name <name>`, `Operator-facing name, in the language the merchant administers in. What a buyer sees comes from \`labels\`. Required on create.`)
  .option(`--position <position>`, `Sort order at checkout, ascending — the merchant's preferred payment method first. Defaults to 0.`, parseInteger)
  .option(`--provider <provider>`, `The PSP code this method transacts through, from GET /payments/providers/catalog. Only meaningful for kind 'psp'; a PSP method that names none falls back to the tenant's \`default_provider\` setting. Must be a code GET /payments/providers/catalog carries.`)
  .option(`--provider-method <provider-method>`, `The provider's own payment-method id ('card', 'paypal', 'sepa_debit') — what the driver is told to charge. Copied onto every payment created with this method as \`metadata.provider_method\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, countries, description, enabled, feeAmount, feeCurrency, feeType, kind, labels, maxOrderValue, metadata, minOrderValue, name, position, provider, providerMethod } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/methods/{id}`.replace(`{id}`, id);
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
        if (countries !== undefined) {
          _payload[`countries`] = countries;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (feeAmount !== undefined) {
          _payload[`fee_amount`] = feeAmount;
        }
        if (feeCurrency !== undefined) {
          _payload[`fee_currency`] = feeCurrency;
        }
        if (feeType !== undefined) {
          _payload[`fee_type`] = feeType;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (maxOrderValue !== undefined) {
          _payload[`max_order_value`] = maxOrderValue;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (minOrderValue !== undefined) {
          _payload[`min_order_value`] = minOrderValue;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (provider !== undefined) {
          _payload[`provider`] = provider;
        }
        if (providerMethod !== undefined) {
          _payload[`provider_method`] = providerMethod;
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
registerPromptSpecs(paymentsMethods.commands.at(-1)!, updateSpecs, { method: "put" });
