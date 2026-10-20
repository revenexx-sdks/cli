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

export const marketingConsentsSubscriptions = new Command("marketing-consents-subscriptions")
  .description(
    commandDescriptions["marketingConsentsSubscriptions"] ??
      `The life of a subscription: a sign-up opens it pending and asks the sequencer for an advertising-free confirmation, the click confirms it, a withdrawal from any surface ends it at once and reaches the sequencer's suppression. The eligibility call answers per recipient whether a marketing send is allowed and on which basis; the preference centre lets a recipient choose behind a personal link.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const confirmSpecs: PromptSpec[] = [
  { key: "subscriptionsToken", option: "--subscriptions-token <subscriptions-token>", name: "token", description: "The token from the confirmation message.", type: "string", required: true, secret: true },
  { key: "purchaseRequestId", option: "--purchase-request-id <purchase-request-id>", name: "purchase_request_id", type: "string", required: true },
  { key: "allocations", option: "--allocations [allocations...]", name: "allocations", description: "Optional: the request's allocations (the reserve's shape; an empty array is the same as none, and only cost_center_id is read), used only to classify its cost centres by budget type. A request holding no reservation whose every centre is tracking-only is then settled with nothing written; one naming a monetary centre, or naming none, is refused with 409 as before. Amounts are read from the ledger, never from here.", type: "array", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.", type: "string", required: false },
  { key: "note", option: "--note <note>", name: "note", type: "string", required: false },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", type: "string", required: false },
];
marketingConsentsSubscriptions
  .command(`confirm`)
  .description(`The double opt-in click, called by the storefront's confirmation page. Turns the pending subscription confirmed on the consent_doi basis and writes the proof with the person's IP and browser. A second click answers the same without writing anything. An expired link lapses the sign-up.`)
  .option(`--subscriptions-token <subscriptions-token>`, `The token from the confirmation message.`)
  .option(`--purchase-request-id <purchase-request-id>`, ``)
  .option(`--allocations [allocations...]`, `Optional: the request's allocations (the reserve's shape; an empty array is the same as none, and only cost_center_id is read), used only to classify its cost centres by budget type. A request holding no reservation whose every centre is tracking-only is then settled with nothing written; one naming a monetary centre, or naming none, is refused with 409 as before. Amounts are read from the ledger, never from here.`)
  .option(`--currency <currency>`, `ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.`)
  .option(`--note <note>`, ``)
  .option(`--order-id <order-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { subscriptionsToken, purchaseRequestId, allocations, currency, note, orderId } = await promptForMissing(
          _options,
          confirmSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/marketing-consents/confirm/{token}`.replace(`{token}`, subscriptionsToken);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (allocations !== undefined) {
          _payload[`allocations`] = allocations;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
        }
        if (purchaseRequestId !== undefined) {
          _payload[`purchase_request_id`] = purchaseRequestId;
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
registerPromptSpecs(marketingConsentsSubscriptions.commands.at(-1)!, confirmSpecs, { method: "post" });
const marketingConsentsEligibilityCheckSpecs: PromptSpec[] = [
  { key: "recipients", option: "--recipients [recipients...]", name: "recipients", description: "Up to 500 recipients.", type: "array", required: true },
  { key: "subscriptionType", option: "--subscription-type <subscription-type>", name: "subscription_type", description: "The code of the type the send is under.", type: "string", required: true },
  { key: "channel", option: "--channel <channel>", name: "channel", description: "Defaults to email.", type: "string", required: false, enum: ["email","sms","whatsapp"] },
];
marketingConsentsSubscriptions
  .command(`marketing-consents-eligibility-check`)
  .description(`The one call \`mailings\` and \`journeys\` make before every batch. Per recipient: allowed or not, with the legal basis or the reason. Only a confirmed subscription allows; \`contract\` never does; \`existing_customer\` only on a type that allows it; an erased address answers \`erased\`. At most 500 recipients per call. The sequencer's suppression stays the last refusal at send time.`)
  .option(`--recipients [recipients...]`, `Up to 500 recipients.`)
  .option(`--subscription-type <subscription-type>`, `The code of the type the send is under.`)
  .option(`--channel <channel>`, `Defaults to email.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { recipients, subscriptionType, channel } = await promptForMissing(
          _options,
          marketingConsentsEligibilityCheckSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/marketing-consents/eligibility`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (recipients !== undefined) {
          _payload[`recipients`] = recipients;
        }
        if (subscriptionType !== undefined) {
          _payload[`subscription_type`] = subscriptionType;
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
registerPromptSpecs(marketingConsentsSubscriptions.commands.at(-1)!, marketingConsentsEligibilityCheckSpecs, { method: "post" });
const marketingConsentsPreferencesLinksSpecs: PromptSpec[] = [
  { key: "recipients", option: "--recipients [recipients...]", name: "recipients", description: "Up to 500.", type: "array", required: true },
  { key: "channel", option: "--channel <channel>", name: "channel", description: "Defaults to email.", type: "string", required: false, enum: ["email","sms","whatsapp"] },
];
marketingConsentsSubscriptions
  .command(`marketing-consents-preferences-links`)
  .description(`One stable personal link per address and channel, for the mandatory footer of every marketing message. The same address gets the same token every time. At most 500 per call.`)
  .option(`--recipients [recipients...]`, `Up to 500.`)
  .option(`--channel <channel>`, `Defaults to email.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { recipients, channel } = await promptForMissing(
          _options,
          marketingConsentsPreferencesLinksSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/marketing-consents/preferences/links`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (channel !== undefined) {
          _payload[`channel`] = channel;
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
registerPromptSpecs(marketingConsentsSubscriptions.commands.at(-1)!, marketingConsentsPreferencesLinksSpecs, { method: "post" });
const marketingConsentsPreferencesGetSpecs: PromptSpec[] = [
  { key: "subscriptionsToken", option: "--subscriptions-token <subscriptions-token>", name: "token", description: "The personal token.", type: "string", required: true, secret: true },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "The language for labels and wording (default de).", type: "string", required: false },
];
marketingConsentsSubscriptions
  .command(`marketing-consents-preferences-get`)
  .description(`Behind a personal link: every active type the channel offers, where the address stands on each, and the wording to show. The storefront renders the page.`)
  .option(`--subscriptions-token <subscriptions-token>`, `The personal token.`)
  .option(`--locale <locale>`, `The language for labels and wording (default de).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { subscriptionsToken, locale } = await promptForMissing(
          _options,
          marketingConsentsPreferencesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/marketing-consents/preferences/{token}`.replace(`{token}`, subscriptionsToken);
        const _payload: RequestParams = {};
        if (locale !== undefined) {
          _payload[`locale`] = locale;
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
registerPromptSpecs(marketingConsentsSubscriptions.commands.at(-1)!, marketingConsentsPreferencesGetSpecs, { method: "get" });
const marketingConsentsPreferencesUpdateSpecs: PromptSpec[] = [
  { key: "subscriptionsToken", option: "--subscriptions-token <subscriptions-token>", name: "token", description: "The personal token.", type: "string", required: true, secret: true },
  { key: "choices", option: "--choices [choices...]", name: "choices", description: "The choices.", type: "array", required: false },
  { key: "ip", option: "--ip <ip>", name: "ip", description: "The person's IP address.", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "The language of the page.", type: "string", required: false },
  { key: "unsubscribeAll", option: "--unsubscribe-all <unsubscribe-all>", name: "unsubscribe_all", description: "Withdraw every type of the channel.", type: "boolean", required: false },
  { key: "userAgent", option: "--user-agent <user-agent>", name: "user_agent", description: "The person's browser.", type: "string", required: false },
];
marketingConsentsSubscriptions
  .command(`marketing-consents-preferences-update`)
  .description(`Per type: \`subscribed: false\` withdraws at once (source preference_centre, pushed to the sequencer); \`subscribed: true\` signs up — with a confirmation first when the type requires double opt-in. \`unsubscribe_all: true\` withdraws every type of the channel. Answers the page as it now stands, with what changed.`)
  .option(`--subscriptions-token <subscriptions-token>`, `The personal token.`)
  .option(`--choices [choices...]`, `The choices.`)
  .option(`--ip <ip>`, `The person's IP address.`)
  .option(`--locale <locale>`, `The language of the page.`)
  .option(
    `--unsubscribe-all [value]`,
    `Withdraw every type of the channel.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--user-agent <user-agent>`, `The person's browser.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { subscriptionsToken, choices, ip, locale, unsubscribeAll, userAgent } = await promptForMissing(
          _options,
          marketingConsentsPreferencesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/marketing-consents/preferences/{token}`.replace(`{token}`, subscriptionsToken);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (choices !== undefined) {
          _payload[`choices`] = choices;
        }
        if (ip !== undefined) {
          _payload[`ip`] = ip;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (unsubscribeAll !== undefined) {
          _payload[`unsubscribe_all`] = unsubscribeAll;
        }
        if (userAgent !== undefined) {
          _payload[`user_agent`] = userAgent;
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
registerPromptSpecs(marketingConsentsSubscriptions.commands.at(-1)!, marketingConsentsPreferencesUpdateSpecs, { method: "post" });
const listSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Filter to rows whose `id` is exactly this value. The row's own id, generated by the database. A caller never sends one; it reads one back and puts it in the path of later calls.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Filter to rows whose `contact_id` is exactly this value. The `customers` contact holding the address. Null until one exists — a sign-up creates one at lifecycle stage `subscriber` — and after an erasure.", type: "string", required: false },
  { key: "channel", option: "--channel <channel>", name: "channel", description: "Filter to rows whose `channel` is exactly this value. How the address is reached: email, sms or whatsapp.", type: "string", required: false, enum: ["email","sms","whatsapp"] },
  { key: "address", option: "--address <address>", name: "address", description: "Filter to rows whose `address` is exactly this value. The address: a lower-cased email or an E.164 phone number. Null after an erasure.", type: "string", required: false },
  { key: "addressHash", option: "--address-hash <address-hash>", name: "address_hash", description: "Filter to rows whose `address_hash` is exactly this value. SHA-256 of the normalised address, hex. Every lookup goes through it, and it is the only part of the address an erasure keeps.", type: "string", required: false },
  { key: "subscriptionTypeId", option: "--subscription-type-id <subscription-type-id>", name: "subscription_type_id", description: "Filter to rows whose `subscription_type_id` is exactly this value. The subscription type this row belongs to.", type: "string", required: false },
  { key: "state", option: "--state <state>", name: "state", description: "Filter to rows whose `state` is exactly this value. Where the subscription stands: pending (waiting for the click), confirmed, withdrawn or lapsed (the click never came). Only confirmed can make a send allowed.", type: "string", required: false, enum: ["pending","confirmed","withdrawn","lapsed"] },
  { key: "legalBasis", option: "--legal-basis <legal-basis>", name: "legal_basis", description: "Filter to rows whose `legal_basis` is exactly this value. Why a send is allowed: consent_doi (double opt-in), consent_single (imported single opt-in, weaker proof), existing_customer (§7 (3) UWG) or contract (never a basis for advertising).", type: "string", required: false, enum: ["consent_doi","consent_single","existing_customer","contract"] },
  { key: "consentTextId", option: "--consent-text-id <consent-text-id>", name: "consent_text_id", description: "Filter to rows whose `consent_text_id` is exactly this value. The published consent text — wording and version — the person agreed to. Null for the existing-customer basis and for imports, which saw no wording.", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "Filter to rows whose `locale` is exactly this value. The language of the sign-up, used for the confirmation mail and the preference centre.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "Filter to rows whose `market` is exactly this value. The market code the row was written in, taken from `x-revenexx-market`; '' is the shop as a whole.", type: "string", required: false },
  { key: "campaignRef", option: "--campaign-ref <campaign-ref>", name: "campaign_ref", description: "Filter to rows whose `campaign_ref` is exactly this value. The campaign the sign-up came from, as the caller named it (a campaigns id). Attribution only.", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Filter to rows whose `source` is exactly this value. Where it came from: form, storefront (a shop sign-up box), import, admin, unsubscribe_header (RFC 8058 one-click), preference_centre, order, complaint (a spam report) — and, on events only, system (the lapse job).", type: "string", required: false, enum: ["form","storefront","import","admin","unsubscribe_header","preference_centre","order","complaint"] },
  { key: "sourceRef", option: "--source-ref <source-ref>", name: "source_ref", description: "Filter to rows whose `source_ref` is exactly this value. What exactly it came from: a form id, an order id, a message id, an import id.", type: "string", required: false },
  { key: "requestedAt", option: "--requested-at <requested-at>", name: "requested_at", description: "Filter to rows whose `requested_at` is exactly this value. When the latest sign-up for this address and type arrived.", type: "string", required: false },
  { key: "confirmationSentAt", option: "--confirmation-sent-at <confirmation-sent-at>", name: "confirmation_sent_at", description: "Filter to rows whose `confirmation_sent_at` is exactly this value. When the sequencer accepted the confirmation message. Null while none went out — the sign-up stands, the person can ask again.", type: "string", required: false },
  { key: "confirmedAt", option: "--confirmed-at <confirmed-at>", name: "confirmed_at", description: "Filter to rows whose `confirmed_at` is exactly this value. When the subscription became confirmed: the click, an order (existing customer), an import, or the sign-up itself on a type without double opt-in.", type: "string", required: false },
  { key: "withdrawnAt", option: "--withdrawn-at <withdrawn-at>", name: "withdrawn_at", description: "Filter to rows whose `withdrawn_at` is exactly this value. When it was withdrawn.", type: "string", required: false },
  { key: "lapseAt", option: "--lapse-at <lapse-at>", name: "lapse_at", description: "Filter to rows whose `lapse_at` is exactly this value. When a pending sign-up lapses if nobody clicks.", type: "string", required: false },
  { key: "erasedAt", option: "--erased-at <erased-at>", name: "erased_at", description: "Filter to rows whose `erased_at` is exactly this value. When the address was erased on request. The row keeps type, basis, times and the address hash.", type: "string", required: false },
  { key: "suppressionWrittenAt", option: "--suppression-written-at <suppression-written-at>", name: "suppression_written_at", description: "Filter to rows whose `suppression_written_at` is exactly this value. When the sequencer's suppression received the withdrawal. Null on a withdrawn row means the hourly job will try again.", type: "string", required: false },
  { key: "suppressionRef", option: "--suppression-ref <suppression-ref>", name: "suppression_ref", description: "Filter to rows whose `suppression_ref` is exactly this value. The id of the suppression this app wrote into the sequencer for the withdrawal, so the sweep can tell this app's own rows from unsubscribes it has to act on.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Filter to rows whose `external_id` is exactly this value. The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.", type: "string", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "Filter to rows whose `source_synced_at` is exactly this value. When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Filter to rows whose `created_at` is exactly this value. When the row was created. Server-set.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Filter to rows whose `updated_at` is exactly this value. When the row was last written. Server-set.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column', 'column.asc' or 'column.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
marketingConsentsSubscriptions
  .command(`list`)
  .description(`Every subscription. Filter by \`subscription_type_id\`, \`state\`, \`channel\`, \`contact_id\`, \`address\`.`)
  .option(`--id <id>`, `Filter to rows whose \`id\` is exactly this value. The row's own id, generated by the database. A caller never sends one; it reads one back and puts it in the path of later calls.`)
  .option(`--contact-id <contact-id>`, `Filter to rows whose \`contact_id\` is exactly this value. The \`customers\` contact holding the address. Null until one exists — a sign-up creates one at lifecycle stage \`subscriber\` — and after an erasure.`)
  .option(`--channel <channel>`, `Filter to rows whose \`channel\` is exactly this value. How the address is reached: email, sms or whatsapp.`)
  .option(`--address <address>`, `Filter to rows whose \`address\` is exactly this value. The address: a lower-cased email or an E.164 phone number. Null after an erasure.`)
  .option(`--address-hash <address-hash>`, `Filter to rows whose \`address_hash\` is exactly this value. SHA-256 of the normalised address, hex. Every lookup goes through it, and it is the only part of the address an erasure keeps.`)
  .option(`--subscription-type-id <subscription-type-id>`, `Filter to rows whose \`subscription_type_id\` is exactly this value. The subscription type this row belongs to.`)
  .option(`--state <state>`, `Filter to rows whose \`state\` is exactly this value. Where the subscription stands: pending (waiting for the click), confirmed, withdrawn or lapsed (the click never came). Only confirmed can make a send allowed.`)
  .option(`--legal-basis <legal-basis>`, `Filter to rows whose \`legal_basis\` is exactly this value. Why a send is allowed: consent_doi (double opt-in), consent_single (imported single opt-in, weaker proof), existing_customer (§7 (3) UWG) or contract (never a basis for advertising).`)
  .option(`--consent-text-id <consent-text-id>`, `Filter to rows whose \`consent_text_id\` is exactly this value. The published consent text — wording and version — the person agreed to. Null for the existing-customer basis and for imports, which saw no wording.`)
  .option(`--locale <locale>`, `Filter to rows whose \`locale\` is exactly this value. The language of the sign-up, used for the confirmation mail and the preference centre.`)
  .option(`--market <market>`, `Filter to rows whose \`market\` is exactly this value. The market code the row was written in, taken from \`x-revenexx-market\`; '' is the shop as a whole.`)
  .option(`--campaign-ref <campaign-ref>`, `Filter to rows whose \`campaign_ref\` is exactly this value. The campaign the sign-up came from, as the caller named it (a campaigns id). Attribution only.`)
  .option(`--source <source>`, `Filter to rows whose \`source\` is exactly this value. Where it came from: form, storefront (a shop sign-up box), import, admin, unsubscribe_header (RFC 8058 one-click), preference_centre, order, complaint (a spam report) — and, on events only, system (the lapse job).`)
  .option(`--source-ref <source-ref>`, `Filter to rows whose \`source_ref\` is exactly this value. What exactly it came from: a form id, an order id, a message id, an import id.`)
  .option(`--requested-at <requested-at>`, `Filter to rows whose \`requested_at\` is exactly this value. When the latest sign-up for this address and type arrived.`)
  .option(`--confirmation-sent-at <confirmation-sent-at>`, `Filter to rows whose \`confirmation_sent_at\` is exactly this value. When the sequencer accepted the confirmation message. Null while none went out — the sign-up stands, the person can ask again.`)
  .option(`--confirmed-at <confirmed-at>`, `Filter to rows whose \`confirmed_at\` is exactly this value. When the subscription became confirmed: the click, an order (existing customer), an import, or the sign-up itself on a type without double opt-in.`)
  .option(`--withdrawn-at <withdrawn-at>`, `Filter to rows whose \`withdrawn_at\` is exactly this value. When it was withdrawn.`)
  .option(`--lapse-at <lapse-at>`, `Filter to rows whose \`lapse_at\` is exactly this value. When a pending sign-up lapses if nobody clicks.`)
  .option(`--erased-at <erased-at>`, `Filter to rows whose \`erased_at\` is exactly this value. When the address was erased on request. The row keeps type, basis, times and the address hash.`)
  .option(`--suppression-written-at <suppression-written-at>`, `Filter to rows whose \`suppression_written_at\` is exactly this value. When the sequencer's suppression received the withdrawal. Null on a withdrawn row means the hourly job will try again.`)
  .option(`--suppression-ref <suppression-ref>`, `Filter to rows whose \`suppression_ref\` is exactly this value. The id of the suppression this app wrote into the sequencer for the withdrawal, so the sweep can tell this app's own rows from unsubscribes it has to act on.`)
  .option(`--external-id <external-id>`, `Filter to rows whose \`external_id\` is exactly this value. The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.`)
  .option(`--source-synced-at <source-synced-at>`, `Filter to rows whose \`source_synced_at\` is exactly this value. When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .option(`--created-at <created-at>`, `Filter to rows whose \`created_at\` is exactly this value. When the row was created. Server-set.`)
  .option(`--updated-at <updated-at>`, `Filter to rows whose \`updated_at\` is exactly this value. When the row was last written. Server-set.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped.`, parseInteger)
  .option(`--offset <offset>`, `Row offset (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column', 'column.asc' or 'column.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, contactId, channel, address, addressHash, subscriptionTypeId, state, legalBasis, consentTextId, locale, market, campaignRef, source, sourceRef, requestedAt, confirmationSentAt, confirmedAt, withdrawnAt, lapseAt, erasedAt, suppressionWrittenAt, suppressionRef, externalId, sourceSyncedAt, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/marketing-consents/subscriptions`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (address !== undefined) {
          _payload[`address`] = address;
        }
        if (addressHash !== undefined) {
          _payload[`address_hash`] = addressHash;
        }
        if (subscriptionTypeId !== undefined) {
          _payload[`subscription_type_id`] = subscriptionTypeId;
        }
        if (state !== undefined) {
          _payload[`state`] = state;
        }
        if (legalBasis !== undefined) {
          _payload[`legal_basis`] = legalBasis;
        }
        if (consentTextId !== undefined) {
          _payload[`consent_text_id`] = consentTextId;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (campaignRef !== undefined) {
          _payload[`campaign_ref`] = campaignRef;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
        }
        if (sourceRef !== undefined) {
          _payload[`source_ref`] = sourceRef;
        }
        if (requestedAt !== undefined) {
          _payload[`requested_at`] = requestedAt;
        }
        if (confirmationSentAt !== undefined) {
          _payload[`confirmation_sent_at`] = confirmationSentAt;
        }
        if (confirmedAt !== undefined) {
          _payload[`confirmed_at`] = confirmedAt;
        }
        if (withdrawnAt !== undefined) {
          _payload[`withdrawn_at`] = withdrawnAt;
        }
        if (lapseAt !== undefined) {
          _payload[`lapse_at`] = lapseAt;
        }
        if (erasedAt !== undefined) {
          _payload[`erased_at`] = erasedAt;
        }
        if (suppressionWrittenAt !== undefined) {
          _payload[`suppression_written_at`] = suppressionWrittenAt;
        }
        if (suppressionRef !== undefined) {
          _payload[`suppression_ref`] = suppressionRef;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
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
registerPromptSpecs(marketingConsentsSubscriptions.commands.at(-1)!, listSpecs, { method: "get" });
const requestSpecs: PromptSpec[] = [
  { key: "subscriptionType", option: "--subscription-type <subscription-type>", name: "subscription_type", description: "The code of the subscription type.", type: "string", required: true },
  { key: "address", option: "--address <address>", name: "address", description: "Alias for `email` or `phone`, whichever the channel takes.", type: "string", required: false },
  { key: "campaignRef", option: "--campaign-ref <campaign-ref>", name: "campaign_ref", description: "The campaign the sign-up came from, as the caller named it (a campaigns id). Attribution only.", type: "string", required: false },
  { key: "channel", option: "--channel <channel>", name: "channel", description: "Defaults to email, or sms when only `phone` is sent.", type: "string", required: false, enum: ["email","sms","whatsapp"] },
  { key: "consentTextId", option: "--consent-text-id <consent-text-id>", name: "consent_text_id", description: "The published wording the person saw. Without it the newest published version of the type in `locale` is recorded.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The contact, when the caller knows it (a signed-in buyer). Skips the lookup.", type: "string", required: false },
  { key: "email", option: "--email <email>", name: "email", description: "The email address (email channel).", type: "string", required: false },
  { key: "firstName", option: "--first-name <first-name>", name: "first_name", description: "For a new contact.", type: "string", required: false },
  { key: "ip", option: "--ip <ip>", name: "ip", description: "The person's IP address, as the storefront saw it.", type: "string", required: false },
  { key: "lastName", option: "--last-name <last-name>", name: "last_name", description: "For a new contact.", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "The language of the sign-up (default de).", type: "string", required: false },
  { key: "pageUrl", option: "--page-url <page-url>", name: "page_url", description: "The page the sign-up was made on.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", description: "The phone number in international form (sms, whatsapp).", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Where the sign-up was made (default storefront).", type: "string", required: false, enum: ["form","storefront","admin","preference_centre"] },
  { key: "sourceRef", option: "--source-ref <source-ref>", name: "source_ref", description: "What exactly it came from: a form id, an order id, a message id, an import id.", type: "string", required: false },
  { key: "userAgent", option: "--user-agent <user-agent>", name: "user_agent", description: "The person's browser.", type: "string", required: false },
];
marketingConsentsSubscriptions
  .command(`request`)
  .description(`Used by the forms listener and the storefront. Opens (or reopens) a pending subscription, creates the \`customers\` contact when the address has none (stage \`subscriber\`), writes the \`requested\` proof and asks the sequencer for the advertising-free confirmation. The token is in that message only — never in this answer. A confirmed address is answered as it is; a pending one asked again within ten minutes gets no second mail. A type without double opt-in is confirmed at once on the single-opt-in basis.`)
  .option(`--subscription-type <subscription-type>`, `The code of the subscription type.`)
  .option(`--address <address>`, `Alias for \`email\` or \`phone\`, whichever the channel takes.`)
  .option(`--campaign-ref <campaign-ref>`, `The campaign the sign-up came from, as the caller named it (a campaigns id). Attribution only.`)
  .option(`--channel <channel>`, `Defaults to email, or sms when only \`phone\` is sent.`)
  .option(`--consent-text-id <consent-text-id>`, `The published wording the person saw. Without it the newest published version of the type in \`locale\` is recorded.`)
  .option(`--contact-id <contact-id>`, `The contact, when the caller knows it (a signed-in buyer). Skips the lookup.`)
  .option(`--email <email>`, `The email address (email channel).`)
  .option(`--first-name <first-name>`, `For a new contact.`)
  .option(`--ip <ip>`, `The person's IP address, as the storefront saw it.`)
  .option(`--last-name <last-name>`, `For a new contact.`)
  .option(`--locale <locale>`, `The language of the sign-up (default de).`)
  .option(`--page-url <page-url>`, `The page the sign-up was made on.`)
  .option(`--phone <phone>`, `The phone number in international form (sms, whatsapp).`)
  .option(`--source <source>`, `Where the sign-up was made (default storefront).`)
  .option(`--source-ref <source-ref>`, `What exactly it came from: a form id, an order id, a message id, an import id.`)
  .option(`--user-agent <user-agent>`, `The person's browser.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { subscriptionType, address, campaignRef, channel, consentTextId, contactId, email, firstName, ip, lastName, locale, pageUrl, phone, source, sourceRef, userAgent } = await promptForMissing(
          _options,
          requestSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/marketing-consents/subscriptions/request`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (address !== undefined) {
          _payload[`address`] = address;
        }
        if (campaignRef !== undefined) {
          _payload[`campaign_ref`] = campaignRef;
        }
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (consentTextId !== undefined) {
          _payload[`consent_text_id`] = consentTextId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (firstName !== undefined) {
          _payload[`first_name`] = firstName;
        }
        if (ip !== undefined) {
          _payload[`ip`] = ip;
        }
        if (lastName !== undefined) {
          _payload[`last_name`] = lastName;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (pageUrl !== undefined) {
          _payload[`page_url`] = pageUrl;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
        }
        if (sourceRef !== undefined) {
          _payload[`source_ref`] = sourceRef;
        }
        if (subscriptionType !== undefined) {
          _payload[`subscription_type`] = subscriptionType;
        }
        if (userAgent !== undefined) {
          _payload[`user_agent`] = userAgent;
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
registerPromptSpecs(marketingConsentsSubscriptions.commands.at(-1)!, requestSpecs, { method: "post" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The subscription.", type: "string", required: true, resource: { listPath: "/marketing-consents/subscriptions", hasLimit: true } },
];
marketingConsentsSubscriptions
  .command(`get`)
  .description(`One subscription by id.`)
  .option(`--id <id>`, `The subscription.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/marketing-consents/subscriptions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(marketingConsentsSubscriptions.commands.at(-1)!, getSpecs, { method: "get" });
const withdrawSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The subscription.", type: "string", required: true, resource: { listPath: "/marketing-consents/subscriptions", hasLimit: true } },
  { key: "purchaseRequestId", option: "--purchase-request-id <purchase-request-id>", name: "purchase_request_id", type: "string", required: true },
  { key: "allocations", option: "--allocations [allocations...]", name: "allocations", description: "Optional: the request's allocations (the reserve's shape; an empty array is the same as none, and only cost_center_id is read), used only to classify its cost centres by budget type. A request holding no reservation whose every centre is tracking-only is then settled with nothing written; one naming a monetary centre, or naming none, is refused with 409 as before. Amounts are read from the ledger, never from here.", type: "array", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.", type: "string", required: false },
  { key: "note", option: "--note <note>", name: "note", type: "string", required: false },
];
marketingConsentsSubscriptions
  .command(`withdraw`)
  .description(`Ends the subscription at once, writes the \`withdrawn\` proof (source admin) and pushes the address into the sequencer's suppression for the type. Withdrawing twice changes nothing.`)
  .option(`--id <id>`, `The subscription.`)
  .option(`--purchase-request-id <purchase-request-id>`, ``)
  .option(`--allocations [allocations...]`, `Optional: the request's allocations (the reserve's shape; an empty array is the same as none, and only cost_center_id is read), used only to classify its cost centres by budget type. A request holding no reservation whose every centre is tracking-only is then settled with nothing written; one naming a monetary centre, or naming none, is refused with 409 as before. Amounts are read from the ledger, never from here.`)
  .option(`--currency <currency>`, `ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.`)
  .option(`--note <note>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, purchaseRequestId, allocations, currency, note } = await promptForMissing(
          _options,
          withdrawSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/marketing-consents/subscriptions/{id}/withdraw`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (allocations !== undefined) {
          _payload[`allocations`] = allocations;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
        }
        if (purchaseRequestId !== undefined) {
          _payload[`purchase_request_id`] = purchaseRequestId;
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
registerPromptSpecs(marketingConsentsSubscriptions.commands.at(-1)!, withdrawSpecs, { method: "post" });
