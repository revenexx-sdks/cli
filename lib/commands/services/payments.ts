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

export const payments = new Command("payments")
  .description(
    commandDescriptions["payments"] ??
      `Manage payments resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
payments
  .command(`list`)
  .description(`List payments (filter by cart_id/contact_id/status)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments`;
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
registerPromptSpecs(payments.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "amount", option: "--amount <amount>", name: "amount", description: "Order amount — 0 is legal (free orders), negative is not.", type: "number", required: true },
  { key: "methodCode", option: "--method-code <method-code>", name: "method_code", description: "Code of a configured payment method.", type: "string", required: true },
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "The cart this payment pays for.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Paying customer contact.", type: "string", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "Buyer ISO country code for the eligibility check.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default EUR).", type: "string", required: false },
  { key: "idempotencyKey", option: "--idempotency-key <idempotency-key>", name: "idempotency_key", description: "Same key answers the same payment instead of a duplicate.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "External order reference — also the webhook fallback key.", type: "string", required: false },
  { key: "returnUrl", option: "--return-url <return-url>", name: "return_url", description: "Where the PSP redirect flow returns the buyer to.", type: "string", required: false },
];
payments
  .command(`create`)
  .description(`Create + authorize a payment — self-managed authorizes immediately, PSP methods answer next_action (redirect) when needed`)
  .option(`--amount <amount>`, `Order amount — 0 is legal (free orders), negative is not.`, parseInteger)
  .option(`--method-code <method-code>`, `Code of a configured payment method.`)
  .option(`--cart-id <cart-id>`, `The cart this payment pays for.`)
  .option(`--contact-id <contact-id>`, `Paying customer contact.`)
  .option(`--country <country>`, `Buyer ISO country code for the eligibility check.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR).`)
  .option(`--idempotency-key <idempotency-key>`, `Same key answers the same payment instead of a duplicate.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--order-ref <order-ref>`, `External order reference — also the webhook fallback key.`)
  .option(`--return-url <return-url>`, `Where the PSP redirect flow returns the buyer to.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { amount, methodCode, cartId, contactId, country, currency, idempotencyKey, metadata, orderRef, returnUrl } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments`;
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
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (idempotencyKey !== undefined) {
          _payload[`idempotency_key`] = idempotencyKey;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (methodCode !== undefined) {
          _payload[`method_code`] = methodCode;
        }
        if (orderRef !== undefined) {
          _payload[`order_ref`] = orderRef;
        }
        if (returnUrl !== undefined) {
          _payload[`return_url`] = returnUrl;
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
registerPromptSpecs(payments.commands.at(-1)!, createSpecs, { method: "post" });
payments
  .command(`dunning-scan`)
  .description(`Classifies every unpaid self-managed payment (invoice, prepayment) as on time / reminder due / overdue from payment_reminder_after_days and overdue_after_days, writes the stage and the next due date, and reports PSP payments still waiting on a callback longer than webhook_stale_after_minutes. Pure function of each payment's age, so it is idempotent — it also runs daily as the 'dunning-scan' schedule. It classifies and does not send: a stage change emits payment.updated, and what a reminder looks like is the merchant's workflow.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/payments/dunning/scan`;
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
const errorsRedactSpecs: PromptSpec[] = [
  { key: "apply", option: "--apply <apply>", name: "apply", description: "Write the reclassified values (default false = dry run).", type: "boolean", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "How many payments to scan, oldest first (default 500, max 5000).", type: "integer", required: false },
];
payments
  .command(`errors-redact`)
  .description(`Rows written before the failure taxonomy still store the provider's/runtime's raw text in error_message. API responses never repeat it (the read path projects), but the column is also read directly through Baseline, so it needs rewriting once per tenant. Dry-run by default — reports what it would touch and changes nothing until apply:true. Idempotent: rows already carrying a taxonomy message are skipped.`)
  .option(
    `--apply [value]`,
    `Write the reclassified values (default false = dry run).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--limit <limit>`, `How many payments to scan, oldest first (default 500, max 5000).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { apply, limit } = await promptForMissing(
          _options,
          errorsRedactSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/errors/redact`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (apply !== undefined) {
          _payload[`apply`] = apply;
        }
        if (limit !== undefined) {
          _payload[`limit`] = limit;
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
registerPromptSpecs(payments.commands.at(-1)!, errorsRedactSpecs, { method: "post" });
const logosGetSpecs: PromptSpec[] = [
  { key: "slug", option: "--slug <slug>", name: "slug", type: "string", required: true },
];
payments
  .command(`logos-get`)
  .description(`Answers the SVG document for a catalog provider code (a shipped assets/logos/{code}.svg, otherwise a generated monogram tile), with content-type image/svg+xml and a one-day cache. Unknown slugs are a 404. Called directly on the app domain (https://revenexx-payments.apps.revenexx.io/payments/logos/stripe) the response carries its real content-type; through the gateway the body is passed through but labelled application/json, so use the app domain for <img> sources.`)
  .option(`--slug <slug>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { slug } = await promptForMissing(
          _options,
          logosGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/logos/{slug}`.replace(`{slug}`, slug);
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
registerPromptSpecs(payments.commands.at(-1)!, logosGetSpecs, { method: "get" });
const methodsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
payments
  .command(`methods-list`)
  .description(`List payment method configurations`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, filter } = await promptForMissing(
          _options,
          methodsListSpecs,
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
registerPromptSpecs(payments.commands.at(-1)!, methodsListSpecs, { method: "get" });
const methodsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Stable method code (unique per tenant, e.g. 'invoice', 'card').", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "Display name.", type: "string", required: true },
  { key: "countries", option: "--countries [countries...]", name: "countries", description: "Allowed ISO country codes — empty/omitted = unrestricted.", type: "array", required: false },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Disabled methods are never eligible (default false).", type: "boolean", required: false },
  { key: "feeAmount", option: "--fee-amount <fee-amount>", name: "fee_amount", description: "Fixed amount or percent value, per fee_type (default 0).", type: "number", required: false },
  { key: "feeCurrency", option: "--fee-currency <fee-currency>", name: "fee_currency", description: "ISO 4217 code (default EUR).", type: "string", required: false },
  { key: "feeType", option: "--fee-type <fee-type>", name: "fee_type", description: "How 'fee_amount' applies (default 'none').", type: "string", required: false, enum: ["none","fixed","percent"] },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Self-managed (merchant fulfils, default) or PSP-backed ('provider' required to transact).", type: "string", required: false, enum: ["self_managed","psp"] },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names ({ de, en, … }).", type: "object", required: false },
  { key: "maxOrderValue", option: "--max-order-value <max-order-value>", name: "max_order_value", description: "Maximum order amount — omitted = no upper bound.", type: "number", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "minOrderValue", option: "--min-order-value <min-order-value>", name: "min_order_value", description: "Minimum order amount — omitted = no lower bound.", type: "number", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position in the checkout (default 0).", type: "integer", required: false },
  { key: "provider", option: "--provider <provider>", name: "provider", description: "PSP code from the catalog — only for kind 'psp'.", type: "string", required: false },
  { key: "providerMethod", option: "--provider-method <provider-method>", name: "provider_method", description: "The provider's payment method id (e.g. 'card', 'paypal').", type: "string", required: false },
];
payments
  .command(`methods-create`)
  .description(`Create a payment method configuration`)
  .option(`--code <code>`, `Stable method code (unique per tenant, e.g. 'invoice', 'card').`)
  .option(`--name <name>`, `Display name.`)
  .option(`--countries [countries...]`, `Allowed ISO country codes — empty/omitted = unrestricted.`)
  .option(`--description <description>`, ``)
  .option(
    `--enabled [value]`,
    `Disabled methods are never eligible (default false).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--fee-amount <fee-amount>`, `Fixed amount or percent value, per fee_type (default 0).`, parseInteger)
  .option(`--fee-currency <fee-currency>`, `ISO 4217 code (default EUR).`)
  .option(`--fee-type <fee-type>`, `How 'fee_amount' applies (default 'none').`)
  .option(`--kind <kind>`, `Self-managed (merchant fulfils, default) or PSP-backed ('provider' required to transact).`)
  .option(`--labels <labels>`, `Localized display names ({ de, en, … }).`)
  .option(`--max-order-value <max-order-value>`, `Maximum order amount — omitted = no upper bound.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--min-order-value <min-order-value>`, `Minimum order amount — omitted = no lower bound.`, parseInteger)
  .option(`--position <position>`, `Sort position in the checkout (default 0).`, parseInteger)
  .option(`--provider <provider>`, `PSP code from the catalog — only for kind 'psp'.`)
  .option(`--provider-method <provider-method>`, `The provider's payment method id (e.g. 'card', 'paypal').`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, countries, description, enabled, feeAmount, feeCurrency, feeType, kind, labels, maxOrderValue, metadata, minOrderValue, position, provider, providerMethod } = await promptForMissing(
          _options,
          methodsCreateSpecs,
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
registerPromptSpecs(payments.commands.at(-1)!, methodsCreateSpecs, { method: "post" });
payments
  .command(`methods-defaults`)
  .description(`Providers are seeded disabled, in test mode, without credentials — the operator fills those in. Re-running never duplicates a row and never overwrites an existing one: only missing option keys (e.g. a logo added after the first install) are filled, reported as "updated".`)
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
const methodsEligibleSpecs: PromptSpec[] = [
  { key: "amount", option: "--amount <amount>", name: "amount", description: "Order amount the fees are computed against (default 0).", type: "number", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "Buyer ISO country code — methods with country restrictions need it.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default EUR).", type: "string", required: false },
];
payments
  .command(`methods-eligible`)
  .description(`Resolve the payment methods eligible for a buyer context (country, amount) with computed fees — the checkout question`)
  .option(`--amount <amount>`, `Order amount the fees are computed against (default 0).`, parseInteger)
  .option(`--country <country>`, `Buyer ISO country code — methods with country restrictions need it.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { amount, country, currency } = await promptForMissing(
          _options,
          methodsEligibleSpecs,
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
registerPromptSpecs(payments.commands.at(-1)!, methodsEligibleSpecs, { method: "post" });
const methodsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments/methods", hasLimit: true } },
];
payments
  .command(`methods-delete`)
  .description(`Delete a payment method configuration`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          methodsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`payments methods-delete`);
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
registerPromptSpecs(payments.commands.at(-1)!, methodsDeleteSpecs, { method: "delete", destructive: true });
const methodsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments/methods", hasLimit: true } },
];
payments
  .command(`methods-get`)
  .description(`Read one payment method configuration`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          methodsGetSpecs,
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
registerPromptSpecs(payments.commands.at(-1)!, methodsGetSpecs, { method: "get" });
const methodsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments/methods", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Stable method code (unique per tenant, e.g. 'invoice', 'card').", type: "string", required: false },
  { key: "countries", option: "--countries [countries...]", name: "countries", description: "Allowed ISO country codes — empty/omitted = unrestricted.", type: "array", required: false },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Disabled methods are never eligible (default false).", type: "boolean", required: false },
  { key: "feeAmount", option: "--fee-amount <fee-amount>", name: "fee_amount", description: "Fixed amount or percent value, per fee_type (default 0).", type: "number", required: false },
  { key: "feeCurrency", option: "--fee-currency <fee-currency>", name: "fee_currency", description: "ISO 4217 code (default EUR).", type: "string", required: false },
  { key: "feeType", option: "--fee-type <fee-type>", name: "fee_type", description: "How 'fee_amount' applies (default 'none').", type: "string", required: false, enum: ["none","fixed","percent"] },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Self-managed (merchant fulfils, default) or PSP-backed ('provider' required to transact).", type: "string", required: false, enum: ["self_managed","psp"] },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names ({ de, en, … }).", type: "object", required: false },
  { key: "maxOrderValue", option: "--max-order-value <max-order-value>", name: "max_order_value", description: "Maximum order amount — omitted = no upper bound.", type: "number", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "minOrderValue", option: "--min-order-value <min-order-value>", name: "min_order_value", description: "Minimum order amount — omitted = no lower bound.", type: "number", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position in the checkout (default 0).", type: "integer", required: false },
  { key: "provider", option: "--provider <provider>", name: "provider", description: "PSP code from the catalog — only for kind 'psp'.", type: "string", required: false },
  { key: "providerMethod", option: "--provider-method <provider-method>", name: "provider_method", description: "The provider's payment method id (e.g. 'card', 'paypal').", type: "string", required: false },
];
payments
  .command(`methods-update`)
  .description(`Update a payment method configuration (enable/disable, fees, restrictions)`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, `Stable method code (unique per tenant, e.g. 'invoice', 'card').`)
  .option(`--countries [countries...]`, `Allowed ISO country codes — empty/omitted = unrestricted.`)
  .option(`--description <description>`, ``)
  .option(
    `--enabled [value]`,
    `Disabled methods are never eligible (default false).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--fee-amount <fee-amount>`, `Fixed amount or percent value, per fee_type (default 0).`, parseInteger)
  .option(`--fee-currency <fee-currency>`, `ISO 4217 code (default EUR).`)
  .option(`--fee-type <fee-type>`, `How 'fee_amount' applies (default 'none').`)
  .option(`--kind <kind>`, `Self-managed (merchant fulfils, default) or PSP-backed ('provider' required to transact).`)
  .option(`--labels <labels>`, `Localized display names ({ de, en, … }).`)
  .option(`--max-order-value <max-order-value>`, `Maximum order amount — omitted = no upper bound.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--min-order-value <min-order-value>`, `Minimum order amount — omitted = no lower bound.`, parseInteger)
  .option(`--name <name>`, `Display name.`)
  .option(`--position <position>`, `Sort position in the checkout (default 0).`, parseInteger)
  .option(`--provider <provider>`, `PSP code from the catalog — only for kind 'psp'.`)
  .option(`--provider-method <provider-method>`, `The provider's payment method id (e.g. 'card', 'paypal').`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, countries, description, enabled, feeAmount, feeCurrency, feeType, kind, labels, maxOrderValue, metadata, minOrderValue, name, position, provider, providerMethod } = await promptForMissing(
          _options,
          methodsUpdateSpecs,
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
registerPromptSpecs(payments.commands.at(-1)!, methodsUpdateSpecs, { method: "put" });
const ordersCaptureSpecs: PromptSpec[] = [
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", type: "string", required: true },
];
payments
  .command(`orders-capture`)
  .description(`Resolves payments by their order_ref (the same key the PSP webhooks fall back to), captures every authorized one and reports the rest instead of failing — an order whose payment was already captured is a successful no-op. Note that payments.order_ref is nullable with no foreign key: this route is exactly as good as the reference the checkout writes onto the payment.`)
  .option(`--order-ref <order-ref>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { orderRef } = await promptForMissing(
          _options,
          ordersCaptureSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/orders/{order_ref}/capture`.replace(`{order_ref}`, orderRef);
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
registerPromptSpecs(payments.commands.at(-1)!, ordersCaptureSpecs, { method: "post" });
const providersListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
payments
  .command(`providers-list`)
  .description(`PSP secrets are write-only: 'credentials' and 'webhook_secret' are accepted on create/update, stored for the drivers, and never returned by any route — the responses carry the public columns only (id, provider, name, enabled, test_mode, options, timestamps). To rotate a secret, write the new value; there is no way to read the current one back.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, filter } = await promptForMissing(
          _options,
          providersListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/providers`;
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
registerPromptSpecs(payments.commands.at(-1)!, providersListSpecs, { method: "get" });
const providersCreateSpecs: PromptSpec[] = [
  { key: "provider", option: "--provider <provider>", name: "provider", description: "Provider code — must exist in the catalog (GET /payments/providers/catalog).", type: "string", required: true },
  { key: "credentials", option: "--credentials <credentials>", name: "credentials", description: "PSP credentials — the catalog's credential_fields say which keys the auth scheme expects.", type: "object", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Only enabled providers transact (default false).", type: "boolean", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name — defaults to the catalog label.", type: "string", required: false },
  { key: "options", option: "--options <options>", name: "options", description: "Free-form provider options.", type: "object", required: false },
  { key: "testMode", option: "--test-mode <test-mode>", name: "test_mode", description: "Sandbox/test credentials (default true).", type: "boolean", required: false },
  { key: "webhookSecret", option: "--webhook-secret <webhook-secret>", name: "webhook_secret", description: "Shared secret for PSP callback verification.", type: "string", required: false, secret: true },
];
payments
  .command(`providers-create`)
  .description(`PSP secrets are write-only: 'credentials' and 'webhook_secret' are accepted on create/update, stored for the drivers, and never returned by any route — the responses carry the public columns only (id, provider, name, enabled, test_mode, options, timestamps). To rotate a secret, write the new value; there is no way to read the current one back.`)
  .option(`--provider <provider>`, `Provider code — must exist in the catalog (GET /payments/providers/catalog).`)
  .option(`--credentials <credentials>`, `PSP credentials — the catalog's credential_fields say which keys the auth scheme expects.`)
  .option(
    `--enabled [value]`,
    `Only enabled providers transact (default false).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--name <name>`, `Display name — defaults to the catalog label.`)
  .option(`--options <options>`, `Free-form provider options.`)
  .option(
    `--test-mode [value]`,
    `Sandbox/test credentials (default true).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--webhook-secret <webhook-secret>`, `Shared secret for PSP callback verification.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { provider, credentials, enabled, name, options, testMode, webhookSecret } = await promptForMissing(
          _options,
          providersCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/providers`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (credentials !== undefined) {
          _payload[`credentials`] = resolveBodyParam(credentials);
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (options !== undefined) {
          _payload[`options`] = resolveBodyParam(options);
        }
        if (provider !== undefined) {
          _payload[`provider`] = provider;
        }
        if (testMode !== undefined) {
          _payload[`test_mode`] = testMode;
        }
        if (webhookSecret !== undefined) {
          _payload[`webhook_secret`] = webhookSecret;
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
registerPromptSpecs(payments.commands.at(-1)!, providersCreateSpecs, { method: "post" });
payments
  .command(`providers-catalog`)
  .description(`Which PSPs can be configured — drivers, auth schemes, credential fields (~30 connectors via hyperswitch-prism)`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/payments/providers/catalog`;
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
const providersDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments/providers", hasLimit: true } },
];
payments
  .command(`providers-delete`)
  .description(`Delete a PSP configuration`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          providersDeleteSpecs,
          _command,
        );
        await confirmDestructive(`payments providers-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/payments/providers/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(payments.commands.at(-1)!, providersDeleteSpecs, { method: "delete", destructive: true });
const providersGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments/providers", hasLimit: true } },
];
payments
  .command(`providers-get`)
  .description(`PSP secrets are write-only: 'credentials' and 'webhook_secret' are accepted on create/update, stored for the drivers, and never returned by any route — the responses carry the public columns only (id, provider, name, enabled, test_mode, options, timestamps). To rotate a secret, write the new value; there is no way to read the current one back.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          providersGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/providers/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(payments.commands.at(-1)!, providersGetSpecs, { method: "get" });
const providersUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments/providers", hasLimit: true } },
  { key: "credentials", option: "--credentials <credentials>", name: "credentials", description: "PSP credentials — the catalog's credential_fields say which keys the auth scheme expects.", type: "object", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Only enabled providers transact (default false).", type: "boolean", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name — defaults to the catalog label.", type: "string", required: false },
  { key: "options", option: "--options <options>", name: "options", description: "Free-form provider options.", type: "object", required: false },
  { key: "provider", option: "--provider <provider>", name: "provider", description: "Provider code — must exist in the catalog (GET /payments/providers/catalog).", type: "string", required: false },
  { key: "testMode", option: "--test-mode <test-mode>", name: "test_mode", description: "Sandbox/test credentials (default true).", type: "boolean", required: false },
  { key: "webhookSecret", option: "--webhook-secret <webhook-secret>", name: "webhook_secret", description: "Shared secret for PSP callback verification.", type: "string", required: false, secret: true },
];
payments
  .command(`providers-update`)
  .description(`PSP secrets are write-only: 'credentials' and 'webhook_secret' are accepted on create/update, stored for the drivers, and never returned by any route — the responses carry the public columns only (id, provider, name, enabled, test_mode, options, timestamps). To rotate a secret, write the new value; there is no way to read the current one back.`)
  .option(`--id <id>`, ``)
  .option(`--credentials <credentials>`, `PSP credentials — the catalog's credential_fields say which keys the auth scheme expects.`)
  .option(
    `--enabled [value]`,
    `Only enabled providers transact (default false).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--name <name>`, `Display name — defaults to the catalog label.`)
  .option(`--options <options>`, `Free-form provider options.`)
  .option(`--provider <provider>`, `Provider code — must exist in the catalog (GET /payments/providers/catalog).`)
  .option(
    `--test-mode [value]`,
    `Sandbox/test credentials (default true).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--webhook-secret <webhook-secret>`, `Shared secret for PSP callback verification.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, credentials, enabled, name, options, provider, testMode, webhookSecret } = await promptForMissing(
          _options,
          providersUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/providers/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (credentials !== undefined) {
          _payload[`credentials`] = resolveBodyParam(credentials);
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (options !== undefined) {
          _payload[`options`] = resolveBodyParam(options);
        }
        if (provider !== undefined) {
          _payload[`provider`] = provider;
        }
        if (testMode !== undefined) {
          _payload[`test_mode`] = testMode;
        }
        if (webhookSecret !== undefined) {
          _payload[`webhook_secret`] = webhookSecret;
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
registerPromptSpecs(payments.commands.at(-1)!, providersUpdateSpecs, { method: "put" });
const vocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
payments
  .command(`vocabularies-list`)
  .description(`Statuses, method kinds, fee types and dunning stages. Values come out of the CHECK constraints, so what is served is what the database enforces — a client renders a status this app adds without a release of its own.`)
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
        const _apiPath = `/payments/vocabularies`;
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
registerPromptSpecs(payments.commands.at(-1)!, vocabulariesListSpecs, { method: "get" });
const vocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Vocabulary name.", type: "string", required: true, enum: ["dunning-stages","fee-types","method-kinds","statuses"], resource: { listPath: "/payments/vocabularies", hasLimit: false } },
];
payments
  .command(`vocabularies-get`)
  .description(`One vocabulary, with its values, labels and badge tones`)
  .option(`--name <name>`, `Vocabulary name.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name } = await promptForMissing(
          _options,
          vocabulariesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(payments.commands.at(-1)!, vocabulariesGetSpecs, { method: "get" });
const webhooksIngestSpecs: PromptSpec[] = [
  { key: "provider", option: "--provider <provider>", name: "provider", type: "string", required: true },
  { key: "data", option: "--data <data>", name: "data", description: "Request body", type: "object", required: true },
];
payments
  .command(`webhooks-ingest`)
  .description(`Consumes the dispatch envelope from webhooks.revenexx.com: normalizes the provider callback (stripe payment intents + a generic shape), resolves the payment by psp_payment_id or order_ref and moves the ledger. Facts only move forward — provider retries and redeliveries are idempotent no-ops; unverified envelopes are refused.`)
  .option(`--provider <provider>`, ``)
  .option(`--data <data>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { provider, data } = await promptForMissing(
          _options,
          webhooksIngestSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/webhooks/{provider}`.replace(`{provider}`, provider);
        const _payload: RequestParams = {};
        if (data !== undefined) {
          Object.assign(_payload, resolveBodyParam(data));
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
registerPromptSpecs(payments.commands.at(-1)!, webhooksIngestSpecs, { method: "post" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments", hasLimit: true } },
];
payments
  .command(`get`)
  .description(`Read one payment`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(payments.commands.at(-1)!, getSpecs, { method: "get" });
const cancelSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments", hasLimit: true } },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "The operator's own words, kept in metadata (cancel_reason / refund_reason) and passed to the provider.", type: "string", required: false },
];
payments
  .command(`cancel`)
  .description(`Cancel a payment before capture`)
  .option(`--id <id>`, ``)
  .option(`--reason <reason>`, `The operator's own words, kept in metadata (cancel_reason / refund_reason) and passed to the provider.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, reason } = await promptForMissing(
          _options,
          cancelSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/{id}/cancel`.replace(`{id}`, id);
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
registerPromptSpecs(payments.commands.at(-1)!, cancelSpecs, { method: "post" });
const captureSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments", hasLimit: true } },
];
payments
  .command(`capture`)
  .description(`Refused with 422 once the authorization is older than the tenant's capture_expiry_days — an expired authorization is declined by the provider anyway.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          captureSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/{id}/capture`.replace(`{id}`, id);
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
registerPromptSpecs(payments.commands.at(-1)!, captureSpecs, { method: "post" });
const confirmSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments", hasLimit: true } },
];
payments
  .command(`confirm`)
  .description(`Captures straight after the authorization when the tenant's auto_capture_policy is 'immediate'.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          confirmSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/{id}/confirm`.replace(`{id}`, id);
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
registerPromptSpecs(payments.commands.at(-1)!, confirmSpecs, { method: "post" });
const refundSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments", hasLimit: true } },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "The operator's own words, kept in metadata (cancel_reason / refund_reason) and passed to the provider.", type: "string", required: false },
];
payments
  .command(`refund`)
  .description(`All or nothing: the ledger has one amount and one status, so there is no partial or repeat refund to express — a refunded payment is refunded in full. Refused with 422 past the tenant's refund_window_days.`)
  .option(`--id <id>`, ``)
  .option(`--reason <reason>`, `The operator's own words, kept in metadata (cancel_reason / refund_reason) and passed to the provider.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, reason } = await promptForMissing(
          _options,
          refundSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/{id}/refund`.replace(`{id}`, id);
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
registerPromptSpecs(payments.commands.at(-1)!, refundSpecs, { method: "post" });
