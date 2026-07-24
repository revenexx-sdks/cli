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
  .description(`Seed the standard methods (invoice, prepayment, card, PayPal) + mock provider — idempotent, also runs on app.installed`)
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
const providersListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
payments
  .command(`providers-list`)
  .description(`List PSP configurations`)
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
  .description(`Create a PSP configuration — provider must exist in the catalog`)
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
  .description(`Read one PSP configuration`)
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
  .description(`Update a PSP configuration (credentials, test mode, enable/disable)`)
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
];
payments
  .command(`cancel`)
  .description(`Cancel a payment before capture`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          cancelSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/{id}/cancel`.replace(`{id}`, id);
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
registerPromptSpecs(payments.commands.at(-1)!, cancelSpecs, { method: "post" });
const captureSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments", hasLimit: true } },
];
payments
  .command(`capture`)
  .description(`Capture an authorized payment`)
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
  .description(`Finish a requires_action payment after the buyer returned from the PSP`)
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
];
payments
  .command(`refund`)
  .description(`Refund a captured payment`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          refundSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/{id}/refund`.replace(`{id}`, id);
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
registerPromptSpecs(payments.commands.at(-1)!, refundSpecs, { method: "post" });
