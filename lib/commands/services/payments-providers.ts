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

export const paymentsProviders = new Command("payments-providers")
  .description(
    commandDescriptions["paymentsProviders"] ??
      `WHO moves the money, and what this app needs in order to talk to it. A provider row is one PSP account of this tenant: a catalog code, the credentials its auth scheme expects, whether it is live or in sandbox, and the switches the driver reads. GET /payments/providers/catalog is the closed set of codes a create accepts — roughly thirty connectors, shipped with the app and identical for every tenant, each saying which auth scheme and which credential FIELD NAMES it wants; the logo route serves the SVG that catalog entry's \`logo_url\` points at, which is why it is the one route in this app that needs no tenant identity. Nothing configured here is ever read back: \`credentials\` and \`webhook_secret\` are write-only, so rotating a secret means writing the new value. What a payment method COSTS or when it is offered is never here — that belongs to the method.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const paymentsLogosGetSpecs: PromptSpec[] = [
  { key: "slug", option: "--slug <slug>", name: "slug", description: "A catalog provider code, as GET /payments/providers/catalog lists it. Case-insensitive, and a trailing '.svg' is ignored. Not tenant data: the logos ship with the app and are identical for everyone.", type: "string", required: true },
];
paymentsProviders
  .command(`payments-logos-get`)
  .description(`Answers the SVG document for a catalog provider code (a shipped assets/logos/{code}.svg, otherwise a generated monogram tile), with content-type image/svg+xml and a one-day cache. It is the one route in this app that needs no tenant identity: the logos are bundled with the app rather than owned by anyone, so nothing here is tenant data and no key or tenant header is required to fetch one — which is what lets a storefront or a Cockpit screen point an <img> straight at it. Called directly on the app domain (https://revenexx-payments.apps.revenexx.io/payments/logos/stripe) the response carries its real content-type; through the gateway the body is passed through but labelled application/json, so use the app domain for <img> sources.`)
  .option(`--slug <slug>`, `A catalog provider code, as GET /payments/providers/catalog lists it. Case-insensitive, and a trailing '.svg' is ignored. Not tenant data: the logos ship with the app and are identical for everyone.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { slug } = await promptForMissing(
          _options,
          paymentsLogosGetSpecs,
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
registerPromptSpecs(paymentsProviders.commands.at(-1)!, paymentsLogosGetSpecs, { method: "get" });
const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "provider", option: "--provider <provider>", name: "provider", description: "Exact provider code.", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Restrict to enabled or disabled providers.", type: "boolean", required: false },
  { key: "testMode", option: "--test-mode <test-mode>", name: "test_mode", description: "Restrict to sandbox or live configurations.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
paymentsProviders
  .command(`list`)
  .description(`PSP secrets are write-only: 'credentials' and 'webhook_secret' are accepted on create/update, stored for the drivers, and never returned by any route — the responses carry the public columns only (id, provider, name, enabled, test_mode, options, timestamps). To rotate a secret, write the new value; there is no way to read the current one back. Only the public columns, \`limit\`, \`offset\` and \`order\` are query parameters; anything else — a secret column included — answers 400 \`unknown_filter\`, whatever its value.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.`)
  .option(`--provider <provider>`, `Exact provider code.`)
  .option(
    `--enabled [value]`,
    `Restrict to enabled or disabled providers.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--test-mode [value]`,
    `Restrict to sandbox or live configurations.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, provider, enabled, testMode, filter } = await promptForMissing(
          _options,
          listSpecs,
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
        if (provider !== undefined) {
          _payload[`provider`] = provider;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (testMode !== undefined) {
          _payload[`test_mode`] = testMode;
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
registerPromptSpecs(paymentsProviders.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "provider", option: "--provider <provider>", name: "provider", description: "The catalog code of the PSP this row configures — one row per provider per tenant. GET /payments/providers/catalog lists every code that may appear here. It is what every payment and every method naming this PSP resolves it by, so changing it is refused with 409 for as long as one of them does. Required on create, and refused with 400 when the catalog does not carry it.", type: "string", required: true },
  { key: "credentials", option: "--credentials <credentials>", name: "credentials", description: "The PSP's own API credentials, under the key names its auth scheme expects — `GET /payments/providers/catalog` publishes them per provider as `credential_fields` (Stripe: `api_key`; PayPal: `client_id` + `client_secret`; Novalnet: `api_key` + `payment_access_key` + `tariff_id`). They come from the provider's own dashboard, are handed to the driver in-process, and are never read back by any route. Write-only: to rotate one, write the new value. Whatever a document shows here is a placeholder.", type: "object", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Only an enabled provider takes NEW payments: a method pointing at a disabled one falls through to the tenant's `fallback_provider`, and to a 422 if there is none. Nothing else reads it — capture, cancel and refund on the payments this PSP already holds go on working — which is what makes disabling the safe retirement and deleting the refused one. Defaults to false — finish the credentials before switching it on.", type: "boolean", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Operator-facing name of the configuration. Defaults to the catalog label, and is worth changing when a tenant runs two accounts with one PSP. null, omitted or empty falls back to the catalog label.", type: "string", required: false },
  { key: "options", option: "--options <options>", name: "options", description: "Per-provider switches this app understands, plus anything the merchant keeps beside them. Three keys are the app's own: `logo_url` (the bundled logo, filled in when the provider is seeded), `capture_method` and `three_ds` (what the prism driver does today). Free jsonb — an unknown key is stored and ignored.", type: "object", required: false },
  { key: "testMode", option: "--test-mode <test-mode>", name: "test_mode", description: "Whether the driver talks to the PSP's sandbox. New configurations start in test mode: a provider nobody verified must not touch live money. Unstated takes the tenant's own `test_mode_default` setting.", type: "boolean", required: false },
  { key: "webhookSecret", option: "--webhook-secret <webhook-secret>", name: "webhook_secret", description: "The signing secret the PSP issues when its webhook endpoint is created, in the provider's own dashboard. webhooks.revenexx.com verifies each callback against it before the dispatcher hands the envelope to this app. Write-only, like `credentials`: it is stored, used, and never read back by any route, so there is nothing to compare a value against — to rotate it, write the new one. Whatever a document shows here is a generated placeholder, not a usable secret — writing it verbatim leaves every callback failing verification.", type: "string", required: false, secret: true },
];
paymentsProviders
  .command(`create`)
  .description(`Activates one PSP account of this tenant. The \`provider\` code is not free text: it has to be one the catalog carries, and anything else is refused with 400 and a message listing the codes that are — so GET /payments/providers/catalog is the call that comes first, both for the code itself and for the credential field names this provider expects. PSP secrets are write-only: 'credentials' and 'webhook_secret' are accepted on create/update, stored for the drivers, and never returned by any route — the responses carry the public columns only (id, provider, name, enabled, test_mode, options, timestamps). To rotate a secret, write the new value; there is no way to read the current one back.`)
  .option(`--provider <provider>`, `The catalog code of the PSP this row configures — one row per provider per tenant. GET /payments/providers/catalog lists every code that may appear here. It is what every payment and every method naming this PSP resolves it by, so changing it is refused with 409 for as long as one of them does. Required on create, and refused with 400 when the catalog does not carry it.`)
  .option(`--credentials <credentials>`, `The PSP's own API credentials, under the key names its auth scheme expects — \`GET /payments/providers/catalog\` publishes them per provider as \`credential_fields\` (Stripe: \`api_key\`; PayPal: \`client_id\` + \`client_secret\`; Novalnet: \`api_key\` + \`payment_access_key\` + \`tariff_id\`). They come from the provider's own dashboard, are handed to the driver in-process, and are never read back by any route. Write-only: to rotate one, write the new value. Whatever a document shows here is a placeholder.`)
  .option(
    `--enabled [value]`,
    `Only an enabled provider takes NEW payments: a method pointing at a disabled one falls through to the tenant's \`fallback_provider\`, and to a 422 if there is none. Nothing else reads it — capture, cancel and refund on the payments this PSP already holds go on working — which is what makes disabling the safe retirement and deleting the refused one. Defaults to false — finish the credentials before switching it on.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--name <name>`, `Operator-facing name of the configuration. Defaults to the catalog label, and is worth changing when a tenant runs two accounts with one PSP. null, omitted or empty falls back to the catalog label.`)
  .option(`--options <options>`, `Per-provider switches this app understands, plus anything the merchant keeps beside them. Three keys are the app's own: \`logo_url\` (the bundled logo, filled in when the provider is seeded), \`capture_method\` and \`three_ds\` (what the prism driver does today). Free jsonb — an unknown key is stored and ignored.`)
  .option(
    `--test-mode [value]`,
    `Whether the driver talks to the PSP's sandbox. New configurations start in test mode: a provider nobody verified must not touch live money. Unstated takes the tenant's own \`test_mode_default\` setting.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--webhook-secret <webhook-secret>`, `The signing secret the PSP issues when its webhook endpoint is created, in the provider's own dashboard. webhooks.revenexx.com verifies each callback against it before the dispatcher hands the envelope to this app. Write-only, like \`credentials\`: it is stored, used, and never read back by any route, so there is nothing to compare a value against — to rotate it, write the new one. Whatever a document shows here is a generated placeholder, not a usable secret — writing it verbatim leaves every callback failing verification.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { provider, credentials, enabled, name, options, testMode, webhookSecret } = await promptForMissing(
          _options,
          createSpecs,
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
registerPromptSpecs(paymentsProviders.commands.at(-1)!, createSpecs, { method: "post" });
paymentsProviders
  .command(`catalog`)
  .description(`The closed set of \`provider\` codes POST /payments/providers accepts — anything else is refused with 400 and a message listing these. It runs to roughly thirty connectors, and each entry says which \`driver\` moves the money for it: nearly all of them go through the one connector layer this app embeds, hyperswitch-prism, with the built-in mock PSP alongside for demos and E2E. Read it to build the picker on an "add provider" form and to know what a credentials form has to ask for: \`auth_type\` is the scheme the connector authenticates with and \`credential_fields\` are the KEY NAMES to put inside \`credentials\` (never values, which come from the PSP's own dashboard). It says nothing about this tenant: no credential, no enabled flag, no test mode — that is GET /payments/providers. Watch \`available\`: a code with \`false\` has no driver in this deployment yet, so it can be created and stored and every transaction through it fails with \`provider_unavailable\`. The list is app-shipped and identical for everyone, so it is safe to cache hard and it changes only with a release of this app.`)
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
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The PSP configuration. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.", type: "string", required: true, resource: { listPath: "/payments/providers", hasLimit: true } },
];
paymentsProviders
  .command(`delete`)
  .description(`Removes the PSP account row and its stored secrets, once nothing depends on it any more. The three tables of this app carry no foreign keys at all: a payment names its method by \`method_code\` and its acquirer by \`provider\`, both plain text, because a payment records what happened and has to survive the configuration it was made with. So the database will not stop this — whatever the ledger still names, it goes on naming. So the database will not stop this and the count is taken HERE, exactly as DELETE /payments/methods/{id} takes it, and answered as one 409 carrying both numbers. Counted first: every payment still in a status a transition starts from — created, requires_action, authorized or captured — because capture, cancel and refund all resolve the provider BY CODE and would answer 422 \`provider_not_configured\` with the row gone, leaving an authorization that can neither be collected nor released and a captured payment that can no longer be refunded here at all. Counted second: every payment method naming this provider, because POST /payments/methods/eligible does not check providers, so a checkout would go on offering a method whose next POST /payments fails at authorization unless the tenant's \`fallback_provider\` names one that is still configured. What is deliberately NOT counted is a settled payment — failed, cancelled or refunded: no transition starts there, so nothing will ask this provider about it again, and a \`provider\` code is closed catalog data that goes on meaning Stripe or PayPal with no configuration behind it. The refusal names \`enabled: false\` because that is usually what was meant: a disabled provider stops taking NEW payments exactly as a deleted one does, and every transition on the payments it already holds keeps working, since only the create path asks whether it is enabled.`)
  .option(`--id <id>`, `The PSP configuration. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`payments-providers delete`);
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
registerPromptSpecs(paymentsProviders.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The PSP configuration. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.", type: "string", required: true, resource: { listPath: "/payments/providers", hasLimit: true } },
];
paymentsProviders
  .command(`get`)
  .description(`PSP secrets are write-only: 'credentials' and 'webhook_secret' are accepted on create/update, stored for the drivers, and never returned by any route — the responses carry the public columns only (id, provider, name, enabled, test_mode, options, timestamps). To rotate a secret, write the new value; there is no way to read the current one back.`)
  .option(`--id <id>`, `The PSP configuration. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
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
registerPromptSpecs(paymentsProviders.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The PSP configuration. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.", type: "string", required: true, resource: { listPath: "/payments/providers", hasLimit: true } },
  { key: "credentials", option: "--credentials <credentials>", name: "credentials", description: "The PSP's own API credentials, under the key names its auth scheme expects — `GET /payments/providers/catalog` publishes them per provider as `credential_fields` (Stripe: `api_key`; PayPal: `client_id` + `client_secret`; Novalnet: `api_key` + `payment_access_key` + `tariff_id`). They come from the provider's own dashboard, are handed to the driver in-process, and are never read back by any route. Write-only: to rotate one, write the new value. Whatever a document shows here is a placeholder.", type: "object", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Only an enabled provider takes NEW payments: a method pointing at a disabled one falls through to the tenant's `fallback_provider`, and to a 422 if there is none. Nothing else reads it — capture, cancel and refund on the payments this PSP already holds go on working — which is what makes disabling the safe retirement and deleting the refused one. Defaults to false — finish the credentials before switching it on.", type: "boolean", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Operator-facing name of the configuration. Defaults to the catalog label, and is worth changing when a tenant runs two accounts with one PSP. Written straight to the database, which refuses an empty one.", type: "string", required: false },
  { key: "options", option: "--options <options>", name: "options", description: "Per-provider switches this app understands, plus anything the merchant keeps beside them. Three keys are the app's own: `logo_url` (the bundled logo, filled in when the provider is seeded), `capture_method` and `three_ds` (what the prism driver does today). Free jsonb — an unknown key is stored and ignored.", type: "object", required: false },
  { key: "provider", option: "--provider <provider>", name: "provider", description: "The catalog code of the PSP this row configures — one row per provider per tenant. GET /payments/providers/catalog lists every code that may appear here. It is what every payment and every method naming this PSP resolves it by, so changing it is refused with 409 for as long as one of them does. Required on create, and refused with 400 when the catalog does not carry it.", type: "string", required: false },
  { key: "testMode", option: "--test-mode <test-mode>", name: "test_mode", description: "Whether the driver talks to the PSP's sandbox. New configurations start in test mode: a provider nobody verified must not touch live money. Unstated takes the tenant's own `test_mode_default` setting.", type: "boolean", required: false },
  { key: "webhookSecret", option: "--webhook-secret <webhook-secret>", name: "webhook_secret", description: "The signing secret the PSP issues when its webhook endpoint is created, in the provider's own dashboard. webhooks.revenexx.com verifies each callback against it before the dispatcher hands the envelope to this app. Write-only, like `credentials`: it is stored, used, and never read back by any route, so there is nothing to compare a value against — to rotate it, write the new one. Whatever a document shows here is a generated placeholder, not a usable secret — writing it verbatim leaves every callback failing verification.", type: "string", required: false, secret: true },
];
paymentsProviders
  .command(`update`)
  .description(`A partial write: omitted fields keep their value. Three things are changed here in practice — the \`credentials\` (and \`webhook_secret\`) when a key is rotated, \`test_mode\` when an account moves from the PSP's sandbox to live, and \`enabled\` when it is switched on or taken out of service. PSP secrets are write-only: 'credentials' and 'webhook_secret' are accepted on create/update, stored for the drivers, and never returned by any route — the responses carry the public columns only (id, provider, name, enabled, test_mode, options, timestamps). To rotate a secret, write the new value; there is no way to read the current one back. One field is not like the others: \`provider\` is the CODE every payment and every method resolves this PSP by, so writing a different one is the delete through another door and is refused with the same 409 while anything still names the current code. Switching acquirer is a second configuration plus \`enabled: false\` on this one, never a rename.`)
  .option(`--id <id>`, `The PSP configuration. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.`)
  .option(`--credentials <credentials>`, `The PSP's own API credentials, under the key names its auth scheme expects — \`GET /payments/providers/catalog\` publishes them per provider as \`credential_fields\` (Stripe: \`api_key\`; PayPal: \`client_id\` + \`client_secret\`; Novalnet: \`api_key\` + \`payment_access_key\` + \`tariff_id\`). They come from the provider's own dashboard, are handed to the driver in-process, and are never read back by any route. Write-only: to rotate one, write the new value. Whatever a document shows here is a placeholder.`)
  .option(
    `--enabled [value]`,
    `Only an enabled provider takes NEW payments: a method pointing at a disabled one falls through to the tenant's \`fallback_provider\`, and to a 422 if there is none. Nothing else reads it — capture, cancel and refund on the payments this PSP already holds go on working — which is what makes disabling the safe retirement and deleting the refused one. Defaults to false — finish the credentials before switching it on.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--name <name>`, `Operator-facing name of the configuration. Defaults to the catalog label, and is worth changing when a tenant runs two accounts with one PSP. Written straight to the database, which refuses an empty one.`)
  .option(`--options <options>`, `Per-provider switches this app understands, plus anything the merchant keeps beside them. Three keys are the app's own: \`logo_url\` (the bundled logo, filled in when the provider is seeded), \`capture_method\` and \`three_ds\` (what the prism driver does today). Free jsonb — an unknown key is stored and ignored.`)
  .option(`--provider <provider>`, `The catalog code of the PSP this row configures — one row per provider per tenant. GET /payments/providers/catalog lists every code that may appear here. It is what every payment and every method naming this PSP resolves it by, so changing it is refused with 409 for as long as one of them does. Required on create, and refused with 400 when the catalog does not carry it.`)
  .option(
    `--test-mode [value]`,
    `Whether the driver talks to the PSP's sandbox. New configurations start in test mode: a provider nobody verified must not touch live money. Unstated takes the tenant's own \`test_mode_default\` setting.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--webhook-secret <webhook-secret>`, `The signing secret the PSP issues when its webhook endpoint is created, in the provider's own dashboard. webhooks.revenexx.com verifies each callback against it before the dispatcher hands the envelope to this app. Write-only, like \`credentials\`: it is stored, used, and never read back by any route, so there is nothing to compare a value against — to rotate it, write the new one. Whatever a document shows here is a generated placeholder, not a usable secret — writing it verbatim leaves every callback failing verification.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, credentials, enabled, name, options, provider, testMode, webhookSecret } = await promptForMissing(
          _options,
          updateSpecs,
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
registerPromptSpecs(paymentsProviders.commands.at(-1)!, updateSpecs, { method: "put" });
