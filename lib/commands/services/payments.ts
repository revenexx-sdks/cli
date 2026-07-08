import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseBool,
  parseInteger,
} from "../../parser.js";
import {
  confirmDestructive,
  promptForMissing,
} from "../../interactive.js";

export const payments = new Command("payments")
  .description(
    commandDescriptions["payments"] ??
      `Manage payments resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

payments
  .command(`list`)
  .description(`List payments (filter by cart_id/contact_id/status)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
payments
  .command(`create`)
  .description(`Create + authorize a payment — self-managed authorizes immediately, PSP methods answer next_action (redirect) when needed`)
  .option(`--amount <amount>`, `Order amount — 0 is legal (free orders), negative is not.`, parseInteger)
  .option(`--method-_code <method-_code>`, `Code of a configured payment method.`)
  .option(`--cart-_id <cart-_id>`, `The cart this payment pays for.`)
  .option(`--contact-_id <contact-_id>`, `Paying customer contact.`)
  .option(`--country <country>`, `Buyer ISO country code for the eligibility check.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR).`)
  .option(`--idempotency-_key <idempotency-_key>`, `Same key answers the same payment instead of a duplicate.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--order-_ref <order-_ref>`, `External order reference — also the webhook fallback key.`)
  .option(`--return-_url <return-_url>`, `Where the PSP redirect flow returns the buyer to.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { amount, method_code, cart_id, contact_id, country, currency, idempotency_key, metadata, order_ref, return_url } = await promptForMissing(
          _options,
          [
            { key: "amount", option: "--amount <amount>", name: "amount", description: "Order amount — 0 is legal (free orders), negative is not.", type: "number", required: true },
            { key: "method_code", option: "--method-_code <method-_code>", name: "method_code", description: "Code of a configured payment method.", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments`;
        const _payload: RequestParams = {};
        if (amount !== undefined) {
          _payload[`amount`] = amount;
        }
        if (cart_id !== undefined) {
          _payload[`cart_id`] = cart_id;
        }
        if (contact_id !== undefined) {
          _payload[`contact_id`] = contact_id;
        }
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (idempotency_key !== undefined) {
          _payload[`idempotency_key`] = idempotency_key;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (method_code !== undefined) {
          _payload[`method_code`] = method_code;
        }
        if (order_ref !== undefined) {
          _payload[`order_ref`] = order_ref;
        }
        if (return_url !== undefined) {
          _payload[`return_url`] = return_url;
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
payments
  .command(`methods-list`)
  .description(`List payment method configurations`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
  .option(`--fee-_amount <fee-_amount>`, `Fixed amount or percent value, per fee_type (default 0).`, parseInteger)
  .option(`--fee-_currency <fee-_currency>`, `ISO 4217 code (default EUR).`)
  .option(`--fee-_type <fee-_type>`, `How 'fee_amount' applies (default 'none').`)
  .option(`--kind <kind>`, `Self-managed (merchant fulfils, default) or PSP-backed ('provider' required to transact).`)
  .option(`--labels <labels>`, `Localized display names ({ de, en, … }).`)
  .option(`--max-_order-_value <max-_order-_value>`, `Maximum order amount — omitted = no upper bound.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--min-_order-_value <min-_order-_value>`, `Minimum order amount — omitted = no lower bound.`, parseInteger)
  .option(`--position <position>`, `Sort position in the checkout (default 0).`, parseInteger)
  .option(`--provider <provider>`, `PSP code from the catalog — only for kind 'psp'.`)
  .option(`--provider-_method <provider-_method>`, `The provider's payment method id (e.g. 'card', 'paypal').`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, countries, description, enabled, fee_amount, fee_currency, fee_type, kind, labels, max_order_value, metadata, min_order_value, position, provider, provider_method } = await promptForMissing(
          _options,
          [
            { key: "code", option: "--code <code>", name: "code", description: "Stable method code (unique per tenant, e.g. 'invoice', 'card').", type: "string", required: true },
            { key: "name", option: "--name <name>", name: "name", description: "Display name.", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/methods`;
        const _payload: RequestParams = {};
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
        if (fee_amount !== undefined) {
          _payload[`fee_amount`] = fee_amount;
        }
        if (fee_currency !== undefined) {
          _payload[`fee_currency`] = fee_currency;
        }
        if (fee_type !== undefined) {
          _payload[`fee_type`] = fee_type;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (max_order_value !== undefined) {
          _payload[`max_order_value`] = max_order_value;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (min_order_value !== undefined) {
          _payload[`min_order_value`] = min_order_value;
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
        if (provider_method !== undefined) {
          _payload[`provider_method`] = provider_method;
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
payments
  .command(`methods-eligible`)
  .description(`Resolve the payment methods eligible for a buyer context (country, amount) with computed fees — the checkout question`)
  .option(`--amount <amount>`, `Order amount the fees are computed against (default 0).`, parseInteger)
  .option(`--country <country>`, `Buyer ISO country code — methods with country restrictions need it.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR).`)
  .action(
    actionRunner(
      async ({ amount, country, currency }) => {
        const _client = await sdkForProject();
        const _apiPath = `/payments/methods/eligible`;
        const _payload: RequestParams = {};
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
payments
  .command(`methods-delete`)
  .description(`Delete a payment method configuration`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments/methods", hasLimit: true } },
          ],
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
payments
  .command(`methods-get`)
  .description(`Read one payment method configuration`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments/methods", hasLimit: true } },
          ],
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
  .option(`--fee-_amount <fee-_amount>`, `Fixed amount or percent value, per fee_type (default 0).`, parseInteger)
  .option(`--fee-_currency <fee-_currency>`, `ISO 4217 code (default EUR).`)
  .option(`--fee-_type <fee-_type>`, `How 'fee_amount' applies (default 'none').`)
  .option(`--kind <kind>`, `Self-managed (merchant fulfils, default) or PSP-backed ('provider' required to transact).`)
  .option(`--labels <labels>`, `Localized display names ({ de, en, … }).`)
  .option(`--max-_order-_value <max-_order-_value>`, `Maximum order amount — omitted = no upper bound.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--min-_order-_value <min-_order-_value>`, `Minimum order amount — omitted = no lower bound.`, parseInteger)
  .option(`--name <name>`, `Display name.`)
  .option(`--position <position>`, `Sort position in the checkout (default 0).`, parseInteger)
  .option(`--provider <provider>`, `PSP code from the catalog — only for kind 'psp'.`)
  .option(`--provider-_method <provider-_method>`, `The provider's payment method id (e.g. 'card', 'paypal').`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, countries, description, enabled, fee_amount, fee_currency, fee_type, kind, labels, max_order_value, metadata, min_order_value, name, position, provider, provider_method } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments/methods", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/methods/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
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
        if (fee_amount !== undefined) {
          _payload[`fee_amount`] = fee_amount;
        }
        if (fee_currency !== undefined) {
          _payload[`fee_currency`] = fee_currency;
        }
        if (fee_type !== undefined) {
          _payload[`fee_type`] = fee_type;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (max_order_value !== undefined) {
          _payload[`max_order_value`] = max_order_value;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (min_order_value !== undefined) {
          _payload[`min_order_value`] = min_order_value;
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
        if (provider_method !== undefined) {
          _payload[`provider_method`] = provider_method;
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
payments
  .command(`providers-list`)
  .description(`List PSP configurations`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
    `--test-_mode [value]`,
    `Sandbox/test credentials (default true).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--webhook-_secret <webhook-_secret>`, `Shared secret for PSP callback verification.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { provider, credentials, enabled, name, options, test_mode, webhook_secret } = await promptForMissing(
          _options,
          [
            { key: "provider", option: "--provider <provider>", name: "provider", description: "Provider code — must exist in the catalog (GET /payments/providers/catalog).", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/providers`;
        const _payload: RequestParams = {};
        if (credentials !== undefined) {
          _payload[`credentials`] = JSON.parse(credentials);
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (options !== undefined) {
          _payload[`options`] = JSON.parse(options);
        }
        if (provider !== undefined) {
          _payload[`provider`] = provider;
        }
        if (test_mode !== undefined) {
          _payload[`test_mode`] = test_mode;
        }
        if (webhook_secret !== undefined) {
          _payload[`webhook_secret`] = webhook_secret;
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
payments
  .command(`providers-delete`)
  .description(`Delete a PSP configuration`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments/providers", hasLimit: true } },
          ],
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
payments
  .command(`providers-get`)
  .description(`Read one PSP configuration`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments/providers", hasLimit: true } },
          ],
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
    `--test-_mode [value]`,
    `Sandbox/test credentials (default true).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--webhook-_secret <webhook-_secret>`, `Shared secret for PSP callback verification.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, credentials, enabled, name, options, provider, test_mode, webhook_secret } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments/providers", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/providers/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (credentials !== undefined) {
          _payload[`credentials`] = JSON.parse(credentials);
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (options !== undefined) {
          _payload[`options`] = JSON.parse(options);
        }
        if (provider !== undefined) {
          _payload[`provider`] = provider;
        }
        if (test_mode !== undefined) {
          _payload[`test_mode`] = test_mode;
        }
        if (webhook_secret !== undefined) {
          _payload[`webhook_secret`] = webhook_secret;
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
          [
            { key: "provider", option: "--provider <provider>", name: "provider", type: "string", required: true },
            { key: "data", option: "--data <data>", name: "data", description: "Request body", type: "object", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/webhooks/{provider}`.replace(`{provider}`, provider);
        const _payload: RequestParams = {};
        if (data !== undefined) {
          Object.assign(_payload, JSON.parse(data));
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
payments
  .command(`get`)
  .description(`Read one payment`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments", hasLimit: true } },
          ],
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
payments
  .command(`cancel`)
  .description(`Cancel a payment before capture`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments", hasLimit: true } },
          ],
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
payments
  .command(`capture`)
  .description(`Capture an authorized payment`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments", hasLimit: true } },
          ],
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
payments
  .command(`confirm`)
  .description(`Finish a requires_action payment after the buyer returned from the PSP`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments", hasLimit: true } },
          ],
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
payments
  .command(`refund`)
  .description(`Refund a captured payment`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/payments", hasLimit: true } },
          ],
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
