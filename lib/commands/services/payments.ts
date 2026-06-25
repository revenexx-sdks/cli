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

export const payments = new Command("payments")
  .description(commandDescriptions["payments"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

payments
  .command(`payments-list`)
  .description(``)
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
  .command(`payments-create`)
  .description(``)
  .requiredOption(`--amount <amount>`, `Order amount — 0 is legal (free orders), negative is not.`, parseInteger)
  .requiredOption(`--method-_code <method-_code>`, `Code of a configured payment method.`)
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
      async ({ amount, method_code, cart_id, contact_id, country, currency, idempotency_key, metadata, order_ref, return_url }) => {
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
  .command(`payments-methods-list`)
  .description(``)
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
  .command(`payments-methods-create`)
  .description(``)
  .requiredOption(`--code <code>`, `Stable method code (unique per tenant, e.g. 'invoice', 'card').`)
  .requiredOption(`--name <name>`, `Display name.`)
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
      async ({ code, name, countries, description, enabled, fee_amount, fee_currency, fee_type, kind, labels, max_order_value, metadata, min_order_value, position, provider, provider_method }) => {
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
  .command(`payments-methods-defaults`)
  .description(``)
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
  .command(`payments-methods-eligible`)
  .description(``)
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
  .command(`payments-methods-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`payments-methods-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`payments-methods-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
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
      async ({ id, code, countries, description, enabled, fee_amount, fee_currency, fee_type, kind, labels, max_order_value, metadata, min_order_value, name, position, provider, provider_method }) => {
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
  .command(`payments-providers-list`)
  .description(``)
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
  .command(`payments-providers-create`)
  .description(``)
  .requiredOption(`--provider <provider>`, `Provider code — must exist in the catalog (GET /payments/providers/catalog).`)
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
      async ({ provider, credentials, enabled, name, options, test_mode, webhook_secret }) => {
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
  .command(`payments-providers-catalog`)
  .description(``)
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
  .command(`payments-providers-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`payments-providers-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`payments-providers-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
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
      async ({ id, credentials, enabled, name, options, provider, test_mode, webhook_secret }) => {
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
  .command(`payments-webhooks-ingest`)
  .description(`Consumes the dispatch envelope from webhooks.revenexx.com: normalizes the provider callback (stripe payment intents + a generic shape), resolves the payment by psp_payment_id or order_ref and moves the ledger. Facts only move forward — provider retries and redeliveries are idempotent no-ops; unverified envelopes are refused.`)
  .requiredOption(`--provider <provider>`, ``)
  .requiredOption(`--data <data>`, `Request body`)
  .action(
    actionRunner(
      async ({ provider, data }) => {
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
  .command(`payments-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`payments-cancel`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`payments-capture`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`payments-confirm`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`payments-refund`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
