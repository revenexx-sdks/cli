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
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const paymentsLedger = new Command("payments-ledger")
  .description(
    commandDescriptions["paymentsLedger"] ??
      `What actually happened to one buyer's money, and everything that moves it. A payment is the record: an amount, a currency, the fee that was computed for it, the method code it was made under, the PSP it went through, and where it stands — created → requires_action → authorized → captured, with failed, cancelled and refunded as the ends. Four transitions move it and a lattice decides which is legal from where: a transition the lattice forbids answers 400, one the merchant's own window forbids (capture_expiry_days, refund_window_days) answers 422, and a provider that is configured and refuses answers 502. \`next_action\` is the instruction the storefront must follow next and is set exactly at requires_action. The routes with no screen of their own are here because every row they touch is a payment: the PSP webhook resolves one and moves its status, the order-reference capture collects every payment behind one shipment, and the one-off redaction rewrites \`error_message\` on rows written before the failure taxonomy existed. The daily dunning scan belongs here for the same reason and is not screenless at all — it writes the reminder clock onto unpaid invoice and prepayment payments, and the Cockpit fires it from the Payments list. The vocabularies sit here too — three of the four sets they publish are columns of this row.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const paymentsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "The cart a payment pays for. Indexed.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The paying customer contact. Indexed.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Restrict to one lifecycle state. Indexed.", type: "string", required: false, enum: ["created","requires_action","authorized","captured","failed","cancelled","refunded"] },
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "Exact external order reference.", type: "string", required: false },
  { key: "methodCode", option: "--method-code <method-code>", name: "method_code", description: "Exact code of the method the payment was made with.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Restrict to self-managed or PSP-backed payments.", type: "string", required: false, enum: ["self_managed","psp"] },
  { key: "provider", option: "--provider <provider>", name: "provider", description: "Exact PSP code.", type: "string", required: false },
  { key: "dunningStage", option: "--dunning-stage <dunning-stage>", name: "dunning_stage", description: "Restrict to one dunning stage — what the daily scan wrote.", type: "string", required: false, enum: ["none","reminder","overdue"] },
  { key: "idempotencyKey", option: "--idempotency-key <idempotency-key>", name: "idempotency_key", description: "Exact idempotency key. Unique per tenant, so this answers at most one row.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
paymentsLedger
  .command(`payments-list`)
  .description(`The ledger, paged and filtered — the Payments screen, the reconciliation query and the way an order or a cart finds out what has been paid against it. Every column of the entity is an exact-match filter, which is what makes it useful: \`?cart_id=\` and \`?contact_id=\` are indexed, \`?status=authorized&kind=self_managed\` is the awaiting-payment queue the dunning scan classifies, and \`?order_ref=\` is the only way to resolve a payment by its external reference. Rows come back in the database's own order, so a newest-first list needs \`?order=created_at.desc\`. \`error_message\` is answered from the failure taxonomy rather than echoed out of the column, so what a driver or a PSP actually wrote is never serialized here.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.`)
  .option(`--cart-id <cart-id>`, `The cart a payment pays for. Indexed.`)
  .option(`--contact-id <contact-id>`, `The paying customer contact. Indexed.`)
  .option(`--status <status>`, `Restrict to one lifecycle state. Indexed.`)
  .option(`--order-ref <order-ref>`, `Exact external order reference.`)
  .option(`--method-code <method-code>`, `Exact code of the method the payment was made with.`)
  .option(`--kind <kind>`, `Restrict to self-managed or PSP-backed payments.`)
  .option(`--provider <provider>`, `Exact PSP code.`)
  .option(`--dunning-stage <dunning-stage>`, `Restrict to one dunning stage — what the daily scan wrote.`)
  .option(`--idempotency-key <idempotency-key>`, `Exact idempotency key. Unique per tenant, so this answers at most one row.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, cartId, contactId, status, orderRef, methodCode, kind, provider, dunningStage, idempotencyKey, filter } = await promptForMissing(
          _options,
          paymentsListSpecs,
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
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (orderRef !== undefined) {
          _payload[`order_ref`] = orderRef;
        }
        if (methodCode !== undefined) {
          _payload[`method_code`] = methodCode;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (provider !== undefined) {
          _payload[`provider`] = provider;
        }
        if (dunningStage !== undefined) {
          _payload[`dunning_stage`] = dunningStage;
        }
        if (idempotencyKey !== undefined) {
          _payload[`idempotency_key`] = idempotencyKey;
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
registerPromptSpecs(paymentsLedger.commands.at(-1)!, paymentsListSpecs, { method: "get" });
const paymentsCreateSpecs: PromptSpec[] = [
  { key: "amount", option: "--amount <amount>", name: "amount", description: "What the provider is asked to authorize, in `currency`. 0 is legal (a free order) and negative is refused by the handler and by the CHECK behind it. `fee_amount` is recorded beside this and is NOT added to it — a checkout that charges its payment surcharge sends a total that already includes it.", type: "number", required: true },
  { key: "methodCode", option: "--method-code <method-code>", name: "method_code", description: "The `code` of the payment method this payment was made with, copied at creation. Deliberately a code and not a foreign key: the ledger records what happened and has to outlive the configuration it happened under. It must name a method this tenant has configured; eligibility for the buyer context below is re-checked here, whatever the checkout showed.", type: "string", required: true },
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "The cart this payment pays for. Not a foreign key: the payment is a record of what happened and outlives the cart. Indexed, so it is the cheap way to find the payment behind a checkout.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The paying customer contact. Not a foreign key — a payment must survive a contact being merged or erased. Indexed.", type: "string", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "The buyer's ISO 3166-1 alpha-2 country code, for the eligibility check. A method restricted to countries is refused with 422 without it.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code the amount and the fee are in. The database bounds the length at three characters and nothing else, so lower case is stored as written. Defaults to EUR.", type: "string", required: false },
  { key: "idempotencyKey", option: "--idempotency-key <idempotency-key>", name: "idempotency_key", description: "The caller's own key for this creation attempt. Sending it again answers the SAME payment with 200 instead of creating a second one — which is what makes a retried checkout safe. Unique per tenant, so a filter on it answers at most one row. The replay answers 200, not 201.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form data to keep on the payment. Merged with the keys this app writes itself (`provider_method`, `return_url`, later the cancel/refund reasons), which win on a collision.", type: "object", required: false },
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "The external order reference the checkout wrote onto the payment. It is what POST /payments/orders/{order_ref}/capture resolves and the fallback key a PSP webhook is matched on when it carries no transaction id — so an integration that leaves it null gives up both. Free text with no uniqueness: several payments may share one reference.", type: "string", required: false },
  { key: "returnUrl", option: "--return-url <return-url>", name: "return_url", description: "Where the PSP sends the buyer back after a redirect or a 3-D Secure challenge. Kept in `metadata.return_url` and handed to the driver — a PSP method that needs a redirect and has none leaves the buyer stranded at the provider.", type: "string", required: false },
];
paymentsLedger
  .command(`payments-create`)
  .description(`The checkout's write: it opens the ledger row and takes it as far as the named method allows, in one call. A create cannot omit \`method_code\` and \`amount\`; every other column is optional or defaulted by the database. Nothing else about the money is the caller's to choose: \`kind\`, \`provider\` and \`fee_amount\` are read off the method that \`method_code\` names, so a caller can neither pick an acquirer nor discount its own fee. \`amount: 0\` is legal (free orders); negative is 400. Eligibility is enforced HERE and not only in the checkout UI — the same country and order-value rules POST /payments/methods/eligible applies answer 422 if the method does not apply to this buyer. What comes back depends on the method: a self-managed one (invoice, prepayment) is \`authorized\` at once with the dunning clock already started, and a PSP one is \`captured\` or \`authorized\`, or \`requires_action\` with \`next_action\` — the instruction the storefront must carry out, typically a redirect, set at that status and at no other. Send an \`idempotency_key\` and a repeat of the same call answers 200 with the payment that key already named, unchanged and not re-authorized. What is never stored: the \`instrument\`, \`token\` or \`card\` is handed to the driver in-process and no token or PAN is written to the row.`)
  .option(`--amount <amount>`, `What the provider is asked to authorize, in \`currency\`. 0 is legal (a free order) and negative is refused by the handler and by the CHECK behind it. \`fee_amount\` is recorded beside this and is NOT added to it — a checkout that charges its payment surcharge sends a total that already includes it.`, parseInteger)
  .option(`--method-code <method-code>`, `The \`code\` of the payment method this payment was made with, copied at creation. Deliberately a code and not a foreign key: the ledger records what happened and has to outlive the configuration it happened under. It must name a method this tenant has configured; eligibility for the buyer context below is re-checked here, whatever the checkout showed.`)
  .option(`--cart-id <cart-id>`, `The cart this payment pays for. Not a foreign key: the payment is a record of what happened and outlives the cart. Indexed, so it is the cheap way to find the payment behind a checkout.`)
  .option(`--contact-id <contact-id>`, `The paying customer contact. Not a foreign key — a payment must survive a contact being merged or erased. Indexed.`)
  .option(`--country <country>`, `The buyer's ISO 3166-1 alpha-2 country code, for the eligibility check. A method restricted to countries is refused with 422 without it.`)
  .option(`--currency <currency>`, `ISO 4217 code the amount and the fee are in. The database bounds the length at three characters and nothing else, so lower case is stored as written. Defaults to EUR.`)
  .option(`--idempotency-key <idempotency-key>`, `The caller's own key for this creation attempt. Sending it again answers the SAME payment with 200 instead of creating a second one — which is what makes a retried checkout safe. Unique per tenant, so a filter on it answers at most one row. The replay answers 200, not 201.`)
  .option(`--metadata <metadata>`, `Free-form data to keep on the payment. Merged with the keys this app writes itself (\`provider_method\`, \`return_url\`, later the cancel/refund reasons), which win on a collision.`)
  .option(`--order-ref <order-ref>`, `The external order reference the checkout wrote onto the payment. It is what POST /payments/orders/{order_ref}/capture resolves and the fallback key a PSP webhook is matched on when it carries no transaction id — so an integration that leaves it null gives up both. Free text with no uniqueness: several payments may share one reference.`)
  .option(`--return-url <return-url>`, `Where the PSP sends the buyer back after a redirect or a 3-D Secure challenge. Kept in \`metadata.return_url\` and handed to the driver — a PSP method that needs a redirect and has none leaves the buyer stranded at the provider.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { amount, methodCode, cartId, contactId, country, currency, idempotencyKey, metadata, orderRef, returnUrl } = await promptForMissing(
          _options,
          paymentsCreateSpecs,
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
registerPromptSpecs(paymentsLedger.commands.at(-1)!, paymentsCreateSpecs, { method: "post" });
paymentsLedger
  .command(`payments-dunning-scan`)
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
const paymentsErrorsRedactSpecs: PromptSpec[] = [
  { key: "apply", option: "--apply <apply>", name: "apply", description: "Write the reclassified values. Defaults to false, which reports what WOULD change and touches nothing.", type: "boolean", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "How many payments to scan, oldest first. Defaults to 500, capped at 5000 — a tenant with more pre-taxonomy rows needs several runs, and re-running is free.", type: "integer", required: false },
];
paymentsLedger
  .command(`payments-errors-redact`)
  .description(`Rows written before the failure taxonomy still store the provider's/runtime's raw text in error_message. API responses never repeat it (the read path projects), but the column is also read directly through Baseline, so it needs rewriting once per tenant. Dry-run by default — reports what it would touch and changes nothing until apply:true. Idempotent: rows already carrying a taxonomy message are skipped.`)
  .option(
    `--apply [value]`,
    `Write the reclassified values. Defaults to false, which reports what WOULD change and touches nothing.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--limit <limit>`, `How many payments to scan, oldest first. Defaults to 500, capped at 5000 — a tenant with more pre-taxonomy rows needs several runs, and re-running is free.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { apply, limit } = await promptForMissing(
          _options,
          paymentsErrorsRedactSpecs,
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
registerPromptSpecs(paymentsLedger.commands.at(-1)!, paymentsErrorsRedactSpecs, { method: "post" });
const paymentsOrdersCaptureSpecs: PromptSpec[] = [
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "The external order reference the checkout wrote onto the payment, trimmed before it is resolved. Free text — the example is an invented shape, not a reference any tenant holds, and one no payment carries answers 404.", type: "string", required: true },
];
paymentsLedger
  .command(`payments-orders-capture`)
  .description(`This is the hook the tenant's \`auto_capture_policy: 'on_ship'\` was written for: fulfilment knows the order it shipped and not the payment ids behind it, so the shipment calls this one route with the reference it already holds and the money for that order is collected in a single request. Resolves payments by their order_ref (the same key the PSP webhooks fall back to), captures every authorized one and reports the rest instead of failing — an order whose payment was already captured is a successful no-op, and a provider that refuses one payment lands in \`skipped\` rather than failing the call. Note that payments.order_ref is nullable with no foreign key: this route is exactly as good as the reference the checkout writes onto the payment.`)
  .option(`--order-ref <order-ref>`, `The external order reference the checkout wrote onto the payment, trimmed before it is resolved. Free text — the example is an invented shape, not a reference any tenant holds, and one no payment carries answers 404.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { orderRef } = await promptForMissing(
          _options,
          paymentsOrdersCaptureSpecs,
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
registerPromptSpecs(paymentsLedger.commands.at(-1)!, paymentsOrdersCaptureSpecs, { method: "post" });
const paymentsVocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
paymentsLedger
  .command(`payments-vocabularies-list`)
  .description(`The enums this app owns, four of them: statuses, method kinds, fee types and dunning stages. This is the index and carries a name and a title per set and nothing more — the values themselves, with their labels and badge tones, are one call further down at GET /payments/vocabularies/{name}, so a client that only needs to know which sets exist does not pay for all of them. Values come out of the CHECK constraints, so what is served is what the database enforces — a client renders a status this app adds without a release of its own.`)
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
          paymentsVocabulariesListSpecs,
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
registerPromptSpecs(paymentsLedger.commands.at(-1)!, paymentsVocabulariesListSpecs, { method: "get" });
const paymentsVocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Which vocabulary to read. The set is closed: GET /payments/vocabularies lists exactly these.", type: "string", required: true, enum: ["dunning-stages","fee-types","method-kinds","statuses"], resource: { listPath: "/payments/vocabularies", hasLimit: false } },
];
paymentsLedger
  .command(`payments-vocabularies-get`)
  .description(`One set in full: every value it permits, the label to show for each and the badge tone to render it in, which is what a client needs to draw a status chip without hard-coding this app's enums. The value set is parsed out of the CHECK constraint in schema.json, so what is served IS what the database enforces. Labels are curated on top and can only add words and colour — a permitted value nobody labelled still appears, titled from its own key, which is why \`title\` and \`description\` are a locale map on a labelled value and a plain string on an unlabelled one.`)
  .option(`--name <name>`, `Which vocabulary to read. The set is closed: GET /payments/vocabularies lists exactly these.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name } = await promptForMissing(
          _options,
          paymentsVocabulariesGetSpecs,
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
registerPromptSpecs(paymentsLedger.commands.at(-1)!, paymentsVocabulariesGetSpecs, { method: "get" });
const paymentsWebhooksIngestSpecs: PromptSpec[] = [
  { key: "provider", option: "--provider <provider>", name: "provider", description: "The catalog provider code whose callback shape to normalize. Anything the normalizer does not recognise is read as the generic {event, psp_payment_id?, order_ref?, error?} envelope rather than refused.", type: "string", required: true },
  { key: "id", option: "--id <id>", name: "id", description: "The dispatcher's delivery id. Echoed back as `delivery_id` so a delivery and what the ledger did can be correlated.", type: "any", required: false },
  { key: "request", option: "--request <request>", name: "request", description: "The captured HTTP request as the PSP sent it.", type: "object", required: false },
  { key: "verified", option: "--verified <verified>", name: "verified", description: "Whether the ingress verified the callback signature against the provider's `webhook_secret`. An explicit false is refused with 422: an endpoint may run in annotate mode, and the ledger stays sovereign over one that does.", type: "any", required: false },
];
paymentsLedger
  .command(`payments-webhooks-ingest`)
  .description(`The sink a PSP callback ends up in, and an inbound ingress endpoint in the sense of ADR-0066: the provider never posts here directly, it posts to webhooks.revenexx.com, which verifies and captures the delivery and dispatches its envelope to this route through the gateway. That indirection is also what makes this the one override point for PSP callback handling — everything a callback does to the ledger happens here and nowhere else, so a deployment that needs a provider's callbacks normalized differently replaces this operation instead of touching the lifecycle routes. Consumes the dispatch envelope from webhooks.revenexx.com: normalizes the provider callback (stripe payment intents + a generic shape), resolves the payment by psp_payment_id or order_ref and moves the ledger. Facts only move forward — provider retries and redeliveries are idempotent no-ops; unverified envelopes are refused.`)
  .option(`--provider <provider>`, `The catalog provider code whose callback shape to normalize. Anything the normalizer does not recognise is read as the generic {event, psp_payment_id?, order_ref?, error?} envelope rather than refused.`)
  .option(`--id <id>`, `The dispatcher's delivery id. Echoed back as \`delivery_id\` so a delivery and what the ledger did can be correlated.`)
  .option(`--request <request>`, `The captured HTTP request as the PSP sent it.`)
  .option(`--verified <verified>`, `Whether the ingress verified the callback signature against the provider's \`webhook_secret\`. An explicit false is refused with 422: an endpoint may run in annotate mode, and the ledger stays sovereign over one that does.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { provider, id, request, verified } = await promptForMissing(
          _options,
          paymentsWebhooksIngestSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/payments/webhooks/{provider}`.replace(`{provider}`, provider);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (request !== undefined) {
          _payload[`request`] = resolveBodyParam(request);
        }
        if (verified !== undefined) {
          _payload[`verified`] = verified;
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
registerPromptSpecs(paymentsLedger.commands.at(-1)!, paymentsWebhooksIngestSpecs, { method: "post" });
const paymentsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The payment. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.", type: "string", required: true, resource: { listPath: "/payments", hasLimit: true } },
];
paymentsLedger
  .command(`payments-get`)
  .description(`One ledger row in full: the amount and the fee that were computed at creation, the method code and PSP it was made through, where it stands in the lifecycle, the timestamp of each transition it has been through (\`authorized_at\`, \`captured_at\`, \`failed_at\`, \`refunded_at\`), the dunning columns the daily scan maintains and, while the buyer still has something to do, \`next_action\`. This is the call to poll after sending a buyer to a PSP redirect. Two things it does not do: \`error_message\` is answered from the failure taxonomy and never carries the provider's or the runtime's own words, and there is no route that resolves a payment by \`order_ref\` — that column is nullable and not unique, so it is a filter on the list (\`GET /payments?order_ref=…\`) which may legitimately answer several rows.`)
  .option(`--id <id>`, `The payment. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          paymentsGetSpecs,
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
registerPromptSpecs(paymentsLedger.commands.at(-1)!, paymentsGetSpecs, { method: "get" });
const paymentsCancelSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The payment. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.", type: "string", required: true, resource: { listPath: "/payments", hasLimit: true } },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "The operator's own words for why. Kept on the payment (`metadata.cancel_reason` / `metadata.refund_reason`) AND handed to the provider's own cancellation or refund reason field, so it is readable in the PSP's dashboard too. Trimmed and cut at 500 characters.", type: "string", required: false },
];
paymentsLedger
  .command(`payments-cancel`)
  .description(`Drops the claim before any money has been taken — the abandoned basket, the buyer who never came back from the redirect, the invoice an operator writes off. It is the only transition that starts from three statuses rather than one, because everything short of captured can still be released. A captured payment is not cancellable at all: that is a refund, and the lattice answers 400 rather than pretending. Unlike capture and refund this transition has no time window — the merchant's \`capture_expiry_days\` and \`refund_window_days\` do not apply, so a stale authorization can always be released even once it is too old to collect. On a PSP payment the provider is called and the \`reason\` in the body is passed to it, so it reaches the PSP's own cancellation-reason field as well as being stored under \`metadata.cancel_reason\`. Cancelling stops the dunning clock: the stage goes back to \`none\` and the due date is cleared.`)
  .option(`--id <id>`, `The payment. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.`)
  .option(`--reason <reason>`, `The operator's own words for why. Kept on the payment (\`metadata.cancel_reason\` / \`metadata.refund_reason\`) AND handed to the provider's own cancellation or refund reason field, so it is readable in the PSP's dashboard too. Trimmed and cut at 500 characters.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, reason } = await promptForMissing(
          _options,
          paymentsCancelSpecs,
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
registerPromptSpecs(paymentsLedger.commands.at(-1)!, paymentsCancelSpecs, { method: "post" });
const paymentsCaptureSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The payment. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.", type: "string", required: true, resource: { listPath: "/payments", hasLimit: true } },
];
paymentsLedger
  .command(`payments-capture`)
  .description(`Collects money that is currently only reserved. It starts from \`authorized\` and from nothing else — under \`auto_capture_policy: 'immediate'\` a payment is captured in the same request that created it and never passes through here, so this is the route for the 'manual' and 'on_ship' policies, and POST /payments/orders/{order_ref}/capture is the same operation addressed by the order reference a warehouse actually holds. There is no request body and no amount: the ledger carries one amount and one status, so a capture is the whole authorization or nothing. On a self-managed payment it takes no PSP anywhere near it — it records that an invoice or a prepayment was paid, and stops the dunning clock. Refused with 422 once the authorization is older than the tenant's \`capture_expiry_days\` (the message carries both numbers), because an expired authorization is declined by the provider anyway and a 422 here is the cheap version of finding out later.`)
  .option(`--id <id>`, `The payment. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          paymentsCaptureSpecs,
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
registerPromptSpecs(paymentsLedger.commands.at(-1)!, paymentsCaptureSpecs, { method: "post" });
const paymentsConfirmSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The payment. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.", type: "string", required: true, resource: { listPath: "/payments", hasLimit: true } },
];
paymentsLedger
  .command(`payments-confirm`)
  .description(`The other half of a redirect. POST /payments answered \`requires_action\` with a \`next_action\` the storefront carried out — a 3-D Secure step, a wallet approval, a bank login — and this is the call that asks the PSP how it went and writes the answer to the ledger. It starts from \`requires_action\` and from nothing else, so a payment that already came back authorized needs no confirm and the lattice answers 400 rather than repeating one. \`next_action\` is cleared by this call whatever the outcome. Where the tenant's \`auto_capture_policy\` is 'immediate' the money is taken straight after the authorization, in the same request, so a successful confirm can come back \`captured\` rather than \`authorized\`; a failed auto-capture does not fail the confirm, because a good authorization is worth more than a tidy status.`)
  .option(`--id <id>`, `The payment. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          paymentsConfirmSpecs,
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
registerPromptSpecs(paymentsLedger.commands.at(-1)!, paymentsConfirmSpecs, { method: "post" });
const paymentsRefundSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The payment. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.", type: "string", required: true, resource: { listPath: "/payments", hasLimit: true } },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "The operator's own words for why. Kept on the payment (`metadata.cancel_reason` / `metadata.refund_reason`) AND handed to the provider's own cancellation or refund reason field, so it is readable in the PSP's dashboard too. Trimmed and cut at 500 characters.", type: "string", required: false },
];
paymentsLedger
  .command(`payments-refund`)
  .description(`Gives captured money back. It starts from \`captured\` and from nothing else — money that was only authorized is cancelled, not refunded, and the lattice answers 400 rather than guessing which was meant. All or nothing: the ledger carries one amount and one status, so there is no partial refund and no second one to express — a refunded payment is refunded in full, and a repeat is a 400 because \`refunded\` is not a status a refund starts from. The \`reason\` in the body is handed to the driver in the same call, so it reaches the PSP's own refund-reason field rather than being a note only this database ever sees, and it is stored under \`metadata.refund_reason\`. On a self-managed payment nothing is sent anywhere: it records that the merchant paid the buyer back by their own means. Refused with 422 once the capture is older than the tenant's \`refund_window_days\` (the message carries both numbers) — past that the provider stops accepting a refund against the transaction and it has to be made by bank transfer.`)
  .option(`--id <id>`, `The payment. A uuid — the data plane casts this segment and answers 400, not 404, for anything else.`)
  .option(`--reason <reason>`, `The operator's own words for why. Kept on the payment (\`metadata.cancel_reason\` / \`metadata.refund_reason\`) AND handed to the provider's own cancellation or refund reason field, so it is readable in the PSP's dashboard too. Trimmed and cut at 500 characters.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, reason } = await promptForMissing(
          _options,
          paymentsRefundSpecs,
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
registerPromptSpecs(paymentsLedger.commands.at(-1)!, paymentsRefundSpecs, { method: "post" });
