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

export const messaging = new Command("messaging")
  .description(
    commandDescriptions["messaging"] ??
      `Outbound multi-channel messaging (email/SMS/push): templates, event bindings, sends (the sequencer service).`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const auditIndexSpecs: PromptSpec[] = [
  { key: "resourceType", option: "--resource-type <resource-type>", name: "resource_type", type: "string", required: false, enum: ["template","layout","suppression"] },
  { key: "resourceId", option: "--resource-id <resource-id>", name: "resource_id", type: "string", required: false },
  { key: "subject", option: "--subject <subject>", name: "subject", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", type: "integer", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`audit-index`)
  .description(`Filterable by \`resource_type\`, \`resource_id\` and \`subject\` — the last one
being the human-readable name a row was recorded under (a template's key,
a layout's name), which is what an operator has to hand six weeks later
when the id means nothing to them.

There is no write route and no delete route: an append-only log with an
editor is a log that says whatever the last editor wanted.`)
  .option(`--resource-type <resource-type>`, ``)
  .option(`--resource-id <resource-id>`, ``)
  .option(`--subject <subject>`, ``)
  .option(`--limit <limit>`, ``, parseInteger)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { resourceType, resourceId, subject, limit, filter } = await promptForMissing(
          _options,
          auditIndexSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/audit`;
        const _payload: RequestParams = {};
        if (resourceType !== undefined) {
          _payload[`resource_type`] = resourceType;
        }
        if (resourceId !== undefined) {
          _payload[`resource_id`] = resourceId;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
        }
        if (limit !== undefined) {
          _payload[`limit`] = limit;
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
registerPromptSpecs(messaging.commands.at(-1)!, auditIndexSpecs, { method: "get" });
const bindingIndexSpecs: PromptSpec[] = [
  { key: "eventTopic", option: "--event-topic <event-topic>", name: "event_topic", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`binding-index`)
  .description(`\`?event_topic=\` narrows to one topic, which is the question worth asking
of this list: "what does this event actually do".`)
  .option(`--event-topic <event-topic>`, ``)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { eventTopic, filter } = await promptForMissing(
          _options,
          bindingIndexSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/bindings`;
        const _payload: RequestParams = {};
        if (eventTopic !== undefined) {
          _payload[`event_topic`] = eventTopic;
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
registerPromptSpecs(messaging.commands.at(-1)!, bindingIndexSpecs, { method: "get" });
const bindingStoreSpecs: PromptSpec[] = [
  { key: "channel", option: "--channel <channel>", name: "channel", type: "string", required: true },
  { key: "eventTopic", option: "--event-topic <event-topic>", name: "event_topic", type: "string", required: true },
  { key: "recipient", option: "--recipient <recipient>", name: "recipient", type: "string", required: true },
  { key: "templateKey", option: "--template-key <template-key>", name: "template_key", type: "string", required: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", type: "boolean", required: false },
  { key: "fallbackOrder", option: "--fallback-order <fallback-order>", name: "fallback_order", type: "integer", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "Nullable: a binding's locale is what the OPERATOR said this\nroute speaks, and it outranks the tenant's own default\n(LocaleResolver). \"No opinion\" has to be expressible, or a route\nnobody made a language decision about silently makes one.", type: "string", required: false },
];
messaging
  .command(`binding-store`)
  .description(`\`recipient\` is a template, not an address: \`{{ customer.email }}\` is
rendered against the event payload when the event arrives, which is the
only way one binding can serve every customer. An event that renders it
empty is skipped and logged rather than sent to nobody.

\`locale\` is what the OPERATOR said this route speaks, and it outranks the
tenant's default. Leave it null when nobody has made that decision, so
that the recipient's own language is still allowed to decide.`)
  .option(`--channel <channel>`, ``)
  .option(`--event-topic <event-topic>`, ``)
  .option(`--recipient <recipient>`, ``)
  .option(`--template-key <template-key>`, ``)
  .option(
    `--enabled [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--fallback-order <fallback-order>`, ``, parseInteger)
  .option(`--locale <locale>`, `Nullable: a binding's locale is what the OPERATOR said this
route speaks, and it outranks the tenant's own default
(LocaleResolver). "No opinion" has to be expressible, or a route
nobody made a language decision about silently makes one.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channel, eventTopic, recipient, templateKey, enabled, fallbackOrder, locale } = await promptForMissing(
          _options,
          bindingStoreSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/bindings`;
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
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (eventTopic !== undefined) {
          _payload[`event_topic`] = eventTopic;
        }
        if (fallbackOrder !== undefined) {
          _payload[`fallback_order`] = fallbackOrder;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (recipient !== undefined) {
          _payload[`recipient`] = recipient;
        }
        if (templateKey !== undefined) {
          _payload[`template_key`] = templateKey;
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
registerPromptSpecs(messaging.commands.at(-1)!, bindingStoreSpecs, { method: "post" });
const bindingDestroySpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/messaging/bindings", hasLimit: false } },
];
messaging
  .command(`binding-destroy`)
  .description(`The event it answered goes back to doing nothing. Prefer \`enabled: false\`
when the intent is to pause rather than to forget.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          bindingDestroySpecs,
          _command,
        );
        await confirmDestructive(`messaging binding-destroy`);
        const _client = await sdkForProject();
        const _apiPath = `/messaging/bindings/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(messaging.commands.at(-1)!, bindingDestroySpecs, { method: "delete", destructive: true });
const bindingShowSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/messaging/bindings", hasLimit: false } },
];
messaging
  .command(`binding-show`)
  .description(`404 for a binding belonging to another tenant, not 403 — an id that
answered differently would say whether it exists.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          bindingShowSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/bindings/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(messaging.commands.at(-1)!, bindingShowSpecs, { method: "get" });
const bindingUpdatePatchSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/messaging/bindings", hasLimit: false } },
  { key: "channel", option: "--channel <channel>", name: "channel", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", type: "boolean", required: false },
  { key: "eventTopic", option: "--event-topic <event-topic>", name: "event_topic", type: "string", required: false },
  { key: "fallbackOrder", option: "--fallback-order <fallback-order>", name: "fallback_order", type: "integer", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "Nullable: a binding's locale is what the OPERATOR said this\nroute speaks, and it outranks the tenant's own default\n(LocaleResolver). \"No opinion\" has to be expressible, or a route\nnobody made a language decision about silently makes one.", type: "string", required: false },
  { key: "recipient", option: "--recipient <recipient>", name: "recipient", type: "string", required: false },
  { key: "templateKey", option: "--template-key <template-key>", name: "template_key", type: "string", required: false },
];
messaging
  .command(`binding-update-patch`)
  .description(`Every field is optional; only what is sent is written. \`enabled: false\`
is how a binding is taken out of service without losing what it said —
the alternative is deleting it and typing the payload path back in
correctly from memory later.

This path answers on \`PUT\` and \`PATCH\`, both routed to the same action.`)
  .option(`--id <id>`, ``)
  .option(`--channel <channel>`, ``)
  .option(
    `--enabled [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--event-topic <event-topic>`, ``)
  .option(`--fallback-order <fallback-order>`, ``, parseInteger)
  .option(`--locale <locale>`, `Nullable: a binding's locale is what the OPERATOR said this
route speaks, and it outranks the tenant's own default
(LocaleResolver). "No opinion" has to be expressible, or a route
nobody made a language decision about silently makes one.`)
  .option(`--recipient <recipient>`, ``)
  .option(`--template-key <template-key>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, channel, enabled, eventTopic, fallbackOrder, locale, recipient, templateKey } = await promptForMissing(
          _options,
          bindingUpdatePatchSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/bindings/{id}`.replace(`{id}`, id);
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
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (eventTopic !== undefined) {
          _payload[`event_topic`] = eventTopic;
        }
        if (fallbackOrder !== undefined) {
          _payload[`fallback_order`] = fallbackOrder;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (recipient !== undefined) {
          _payload[`recipient`] = recipient;
        }
        if (templateKey !== undefined) {
          _payload[`template_key`] = templateKey;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(messaging.commands.at(-1)!, bindingUpdatePatchSpecs, { method: "patch" });
const bindingUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/messaging/bindings", hasLimit: false } },
  { key: "channel", option: "--channel <channel>", name: "channel", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", type: "boolean", required: false },
  { key: "eventTopic", option: "--event-topic <event-topic>", name: "event_topic", type: "string", required: false },
  { key: "fallbackOrder", option: "--fallback-order <fallback-order>", name: "fallback_order", type: "integer", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "Nullable: a binding's locale is what the OPERATOR said this\nroute speaks, and it outranks the tenant's own default\n(LocaleResolver). \"No opinion\" has to be expressible, or a route\nnobody made a language decision about silently makes one.", type: "string", required: false },
  { key: "recipient", option: "--recipient <recipient>", name: "recipient", type: "string", required: false },
  { key: "templateKey", option: "--template-key <template-key>", name: "template_key", type: "string", required: false },
];
messaging
  .command(`binding-update`)
  .description(`Every field is optional; only what is sent is written. \`enabled: false\`
is how a binding is taken out of service without losing what it said —
the alternative is deleting it and typing the payload path back in
correctly from memory later.

This path answers on \`PUT\` and \`PATCH\`, both routed to the same action.`)
  .option(`--id <id>`, ``)
  .option(`--channel <channel>`, ``)
  .option(
    `--enabled [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--event-topic <event-topic>`, ``)
  .option(`--fallback-order <fallback-order>`, ``, parseInteger)
  .option(`--locale <locale>`, `Nullable: a binding's locale is what the OPERATOR said this
route speaks, and it outranks the tenant's own default
(LocaleResolver). "No opinion" has to be expressible, or a route
nobody made a language decision about silently makes one.`)
  .option(`--recipient <recipient>`, ``)
  .option(`--template-key <template-key>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, channel, enabled, eventTopic, fallbackOrder, locale, recipient, templateKey } = await promptForMissing(
          _options,
          bindingUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/bindings/{id}`.replace(`{id}`, id);
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
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (eventTopic !== undefined) {
          _payload[`event_topic`] = eventTopic;
        }
        if (fallbackOrder !== undefined) {
          _payload[`fallback_order`] = fallbackOrder;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (recipient !== undefined) {
          _payload[`recipient`] = recipient;
        }
        if (templateKey !== undefined) {
          _payload[`template_key`] = templateKey;
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
registerPromptSpecs(messaging.commands.at(-1)!, bindingUpdateSpecs, { method: "put" });
const channelCredentialIndexSpecs: PromptSpec[] = [
  { key: "market", option: "--market <market>", name: "market", description: "Which market's credentials this call is about. Absent means the GLOBAL bag — what every\nsend used before markets reached this path, and what a market with no override of its own\nstill uses.\n\nLowercase, opening with a letter, 63 characters at most (Baseline's market slug rule,\nmirrored exactly). A code that does not match is refused with 422 rather than read as\n\"no market\": on the write paths, silently falling back to global would have an operator\npoint every market's traffic at one market's provider while looking at a screen that said\nthey had not.", type: "string", required: false },
  { key: "markets", option: "--markets <markets>", name: "markets", description: "Set to `all` to get every market's credentials in one answer: each channel gains an\n`overrides` object keyed by market code, holding that market's own resolved view of the\nchannel — its provider, which of that provider's fields are set, its callback URL, and\nwhether callbacks are arriving. Only markets with credentials of their OWN appear; a market\nthat inherits has nothing to add.\n\nThe channel's top-level entry is the GLOBAL one whenever this is set, and `?market=` is\nignored: `all` is not a market to resolve against, and honouring both would leave the\nbase entry meaning something different depending on a header.\n\nThe override entries carry no `providers` catalogue, `enabled` flag or `markets` list.\nThose are properties of the channel, identical in every market, and repeating\ntwenty-six providers' field specifications per market would be most of the response.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`channel-credential-index`)
  .description(`Answers per channel with: which fields the chosen provider wants and
which of them are SET (never their values — secrets go in and do not come
back), which markets hold an override, which providers this build offers,
whether the deployment has the channel switched on at all, the URL to
paste into the provider's own console so bounces and opens come back, and
whether callbacks are actually arriving.

Admin tier on the read as well as the write: the identifiers alone —
which Twilio account, which sender number — are more than a read-only
operator has reason to see, and the webhook URL served here contains the
tenant's callback token.`)
  .option(`--market <market>`, `Which market's credentials this call is about. Absent means the GLOBAL bag — what every
send used before markets reached this path, and what a market with no override of its own
still uses.

Lowercase, opening with a letter, 63 characters at most (Baseline's market slug rule,
mirrored exactly). A code that does not match is refused with 422 rather than read as
"no market": on the write paths, silently falling back to global would have an operator
point every market's traffic at one market's provider while looking at a screen that said
they had not.`)
  .option(`--markets <markets>`, `Set to \`all\` to get every market's credentials in one answer: each channel gains an
\`overrides\` object keyed by market code, holding that market's own resolved view of the
channel — its provider, which of that provider's fields are set, its callback URL, and
whether callbacks are arriving. Only markets with credentials of their OWN appear; a market
that inherits has nothing to add.

The channel's top-level entry is the GLOBAL one whenever this is set, and \`?market=\` is
ignored: \`all\` is not a market to resolve against, and honouring both would leave the
base entry meaning something different depending on a header.

The override entries carry no \`providers\` catalogue, \`enabled\` flag or \`markets\` list.
Those are properties of the channel, identical in every market, and repeating
twenty-six providers' field specifications per market would be most of the response.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { market, markets, filter } = await promptForMissing(
          _options,
          channelCredentialIndexSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/channel-credentials`;
        const _payload: RequestParams = {};
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (markets !== undefined) {
          _payload[`markets`] = markets;
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
registerPromptSpecs(messaging.commands.at(-1)!, channelCredentialIndexSpecs, { method: "get" });
const channelCredentialDestroySpecs: PromptSpec[] = [
  { key: "channel", option: "--channel <channel>", name: "channel", type: "string", required: true, resource: { listPath: "/messaging/channel-credentials", hasLimit: false } },
  { key: "market", option: "--market <market>", name: "market", description: "Which market's credentials this call is about. Absent means the GLOBAL bag — what every\nsend used before markets reached this path, and what a market with no override of its own\nstill uses.\n\nLowercase, opening with a letter, 63 characters at most (Baseline's market slug rule,\nmirrored exactly). A code that does not match is refused with 422 rather than read as\n\"no market\": on the write paths, silently falling back to global would have an operator\npoint every market's traffic at one market's provider while looking at a screen that said\nthey had not.", type: "string", required: false },
];
messaging
  .command(`channel-credential-destroy`)
  .description(`With \`?market=\`, only that market's override goes and the global
credentials stand — the market then sends over the global provider again,
which is what it did before anybody configured it. Without a market the
channel goes entirely, overrides and all: a caller asking for a channel
to hold no credentials means all of them.

204 whether or not anything was there. The caller wants this channel to
hold no credentials, and it does.`)
  .option(`--channel <channel>`, ``)
  .option(`--market <market>`, `Which market's credentials this call is about. Absent means the GLOBAL bag — what every
send used before markets reached this path, and what a market with no override of its own
still uses.

Lowercase, opening with a letter, 63 characters at most (Baseline's market slug rule,
mirrored exactly). A code that does not match is refused with 422 rather than read as
"no market": on the write paths, silently falling back to global would have an operator
point every market's traffic at one market's provider while looking at a screen that said
they had not.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channel, market } = await promptForMissing(
          _options,
          channelCredentialDestroySpecs,
          _command,
        );
        await confirmDestructive(`messaging channel-credential-destroy`);
        const _client = await sdkForProject();
        const _apiPath = `/messaging/channel-credentials/{channel}`.replace(`{channel}`, channel);
        const _payload: RequestParams = {};
        if (market !== undefined) {
          _payload[`market`] = market;
        }
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
registerPromptSpecs(messaging.commands.at(-1)!, channelCredentialDestroySpecs, { method: "delete", destructive: true });
const channelCredentialUpdatePatchSpecs: PromptSpec[] = [
  { key: "channel", option: "--channel <channel>", name: "channel", type: "string", required: true, resource: { listPath: "/messaging/channel-credentials", hasLimit: false } },
  { key: "market", option: "--market <market>", name: "market", description: "Which market's credentials this call is about. Absent means the GLOBAL bag — what every\nsend used before markets reached this path, and what a market with no override of its own\nstill uses.\n\nLowercase, opening with a letter, 63 characters at most (Baseline's market slug rule,\nmirrored exactly). A code that does not match is refused with 422 rather than read as\n\"no market\": on the write paths, silently falling back to global would have an operator\npoint every market's traffic at one market's provider while looking at a screen that said\nthey had not.", type: "string", required: false },
  { key: "driver", option: "--driver <driver>", name: "driver", type: "string", required: false },
];
messaging
  .command(`channel-credential-update-patch`)
  .description(`A PATCH in spirit whichever verb is used: only the fields present in the
body are written, and the answer says which of them actually CHANGED, so
a form that resent everything it had on screen does not report a change
that did not happen.

Three refusals, all 422 and all deliberate rather than ignored. A field
the channel's provider does not have (\`unknown_credential_field\`) — a
typo sitting in the bag looking like configuration fails later with a
message about a MISSING field the operator can see they filled in. A
field the platform issues (\`managed_credential\`) — ignoring it would have
the caller believe they set something. A channel with nothing to
configure (\`channel_not_configurable\`), which is push: its VAPID keypair
is generated at provisioning, and pasting a new one would orphan every
browser registration the tenant has collected.

Switching provider is \`driver\`, and the fields in the same request are
validated against the provider being switched TO — validating Postmark's
key against Mailgun's field list is how a switch loses everything the
operator just typed.

This path answers on \`PUT\` and \`PATCH\`, both routed to the same action.`)
  .option(`--channel <channel>`, ``)
  .option(`--market <market>`, `Which market's credentials this call is about. Absent means the GLOBAL bag — what every
send used before markets reached this path, and what a market with no override of its own
still uses.

Lowercase, opening with a letter, 63 characters at most (Baseline's market slug rule,
mirrored exactly). A code that does not match is refused with 422 rather than read as
"no market": on the write paths, silently falling back to global would have an operator
point every market's traffic at one market's provider while looking at a screen that said
they had not.`)
  .option(`--driver <driver>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channel, market, driver } = await promptForMissing(
          _options,
          channelCredentialUpdatePatchSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/channel-credentials/{channel}`.replace(`{channel}`, channel);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (driver !== undefined) {
          _payload[`driver`] = driver;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(messaging.commands.at(-1)!, channelCredentialUpdatePatchSpecs, { method: "patch" });
const channelCredentialUpdateSpecs: PromptSpec[] = [
  { key: "channel", option: "--channel <channel>", name: "channel", type: "string", required: true, resource: { listPath: "/messaging/channel-credentials", hasLimit: false } },
  { key: "market", option: "--market <market>", name: "market", description: "Which market's credentials this call is about. Absent means the GLOBAL bag — what every\nsend used before markets reached this path, and what a market with no override of its own\nstill uses.\n\nLowercase, opening with a letter, 63 characters at most (Baseline's market slug rule,\nmirrored exactly). A code that does not match is refused with 422 rather than read as\n\"no market\": on the write paths, silently falling back to global would have an operator\npoint every market's traffic at one market's provider while looking at a screen that said\nthey had not.", type: "string", required: false },
  { key: "driver", option: "--driver <driver>", name: "driver", type: "string", required: false },
];
messaging
  .command(`channel-credential-update`)
  .description(`A PATCH in spirit whichever verb is used: only the fields present in the
body are written, and the answer says which of them actually CHANGED, so
a form that resent everything it had on screen does not report a change
that did not happen.

Three refusals, all 422 and all deliberate rather than ignored. A field
the channel's provider does not have (\`unknown_credential_field\`) — a
typo sitting in the bag looking like configuration fails later with a
message about a MISSING field the operator can see they filled in. A
field the platform issues (\`managed_credential\`) — ignoring it would have
the caller believe they set something. A channel with nothing to
configure (\`channel_not_configurable\`), which is push: its VAPID keypair
is generated at provisioning, and pasting a new one would orphan every
browser registration the tenant has collected.

Switching provider is \`driver\`, and the fields in the same request are
validated against the provider being switched TO — validating Postmark's
key against Mailgun's field list is how a switch loses everything the
operator just typed.

This path answers on \`PUT\` and \`PATCH\`, both routed to the same action.`)
  .option(`--channel <channel>`, ``)
  .option(`--market <market>`, `Which market's credentials this call is about. Absent means the GLOBAL bag — what every
send used before markets reached this path, and what a market with no override of its own
still uses.

Lowercase, opening with a letter, 63 characters at most (Baseline's market slug rule,
mirrored exactly). A code that does not match is refused with 422 rather than read as
"no market": on the write paths, silently falling back to global would have an operator
point every market's traffic at one market's provider while looking at a screen that said
they had not.`)
  .option(`--driver <driver>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channel, market, driver } = await promptForMissing(
          _options,
          channelCredentialUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/channel-credentials/{channel}`.replace(`{channel}`, channel);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (driver !== undefined) {
          _payload[`driver`] = driver;
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
registerPromptSpecs(messaging.commands.at(-1)!, channelCredentialUpdateSpecs, { method: "put" });
const channelCredentialVerifySpecs: PromptSpec[] = [
  { key: "channel", option: "--channel <channel>", name: "channel", type: "string", required: true, resource: { listPath: "/messaging/channel-credentials", hasLimit: false } },
  { key: "market", option: "--market <market>", name: "market", description: "Which market's credentials this call is about. Absent means the GLOBAL bag — what every\nsend used before markets reached this path, and what a market with no override of its own\nstill uses.\n\nLowercase, opening with a letter, 63 characters at most (Baseline's market slug rule,\nmirrored exactly). A code that does not match is refused with 422 rather than read as\n\"no market\": on the write paths, silently falling back to global would have an operator\npoint every market's traffic at one market's provider while looking at a screen that said\nthey had not.", type: "string", required: false },
];
messaging
  .command(`channel-credential-verify`)
  .description(`The one thing that turns this screen from a form into a tool. Credentials
that only fail at send time cost a customer their first order
confirmation, and by then nobody connects the failure to the afternoon
somebody pasted a key with a trailing space.

**Always 200.** The answer is \`{ok, message}\` in the body, including when
the credentials are wrong: the REQUEST was fine, the credentials are not,
and a 4xx here would have the cockpit's own error handling swallow the
one sentence worth reading. A channel that asks for no credentials at all
(push, in-app) answers \`ok: true\` — "nothing to verify" is a finished
check, not a failed one, and reporting it as an error painted a channel
that has worked since provisioning in the same red as a wrong token.`)
  .option(`--channel <channel>`, ``)
  .option(`--market <market>`, `Which market's credentials this call is about. Absent means the GLOBAL bag — what every
send used before markets reached this path, and what a market with no override of its own
still uses.

Lowercase, opening with a letter, 63 characters at most (Baseline's market slug rule,
mirrored exactly). A code that does not match is refused with 422 rather than read as
"no market": on the write paths, silently falling back to global would have an operator
point every market's traffic at one market's provider while looking at a screen that said
they had not.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channel, market } = await promptForMissing(
          _options,
          channelCredentialVerifySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/channel-credentials/{channel}/verify`.replace(`{channel}`, channel);
        const _payload: RequestParams = {};
        if (market !== undefined) {
          _payload[`market`] = market;
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
registerPromptSpecs(messaging.commands.at(-1)!, channelCredentialVerifySpecs, { method: "post" });
const channelIndexSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`channel-index`)
  .description(`Each entry says whether the channel is switched on and which provider
carries it by default. A channel that is off will refuse a send, so a UI
that offers a channel picker should build it from this rather than from a
list of its own — a channel added to the service then appears without a
release of the client.`)
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
          channelIndexSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/channels`;
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
registerPromptSpecs(messaging.commands.at(-1)!, channelIndexSpecs, { method: "get" });
messaging
  .command(`config-show`)
  .description(`A tenant that was never provisioned has no row and still gets an answer:
an empty shape rather than a 404, so the Cockpit's panels open on
editable blanks instead of an error.

\`meta.push_public_key\` is the VAPID public key, and only the public one.
A storefront cannot call \`PushManager.subscribe()\` without it, so it has
to leave the service; the private half and every provider secret stay
hidden on the model, where they are protected on every route rather than
on this one.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/config`;
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
const configUpdatePatchSpecs: PromptSpec[] = [
  { key: "defaultLocale", option: "--default-locale <default-locale>", name: "default_locale", description: "The house language — step 4 of the send path's resolution order,\nreached only when neither the caller, the event payload nor the\nbinding said anything. A column of its own and not a key in\n`defaults` below, because everything in that bag is merged into\nthe render model: a `locale` key there would start filling\n`{{ locale }}` inside template bodies, which is a routing\ndecision leaking into content.", type: "string", required: false },
  { key: "defaults", option: "--defaults [defaults...]", name: "defaults", description: "The saved modules live in here. The shape is the Cockpit's\ncontract and is not pinned down further: adding a block type\nwould otherwise be a service deploy. The one key that IS pinned\ndown is `brand`, because it moved out — and it is refused with a\nclosure rather than a `defaults.brand` rule, since a nested rule\nmakes the validator drop the parent and quietly discard every\nother key in the bag along with it.", type: "array", required: false },
  { key: "product", option: "--product <product>", name: "product", type: "string", required: false },
  { key: "quietHours", option: "--quiet-hours [quiet-hours...]", name: "quiet_hours", type: "array", required: false },
  { key: "supportEmail", option: "--support-email <support-email>", name: "support_email", type: "string", required: false },
];
messaging
  .command(`config-update-patch`)
  .description(`Reaches every message this tenant sends, including templates saved months
ago — content placeholders resolve at send time, not at save time — which
is why writing is admin tier while reading is not.

Two refusals worth knowing about. \`defaults.brand\` is 422, not ignored:
the letterhead moved to /v1/layouts when a tenant gained more than one of
them, and a letterhead edit that appears to save and changes nothing is
the worst of the three possible behaviours. A half-written \`quiet_hours\`
is 422 as well — a tenant that typed a start and forgot the end has an
opinion about when not to message people, and silently sending through
the night is the one answer that is definitely wrong.

Provider credentials cannot be written here. That path is
/v1/channel-credentials, so the one route that handles secrets stays the
one that was built for it.

This path answers on \`PUT\` and \`PATCH\`, both routed to the same action.`)
  .option(`--default-locale <default-locale>`, `The house language — step 4 of the send path's resolution order,
reached only when neither the caller, the event payload nor the
binding said anything. A column of its own and not a key in
\`defaults\` below, because everything in that bag is merged into
the render model: a \`locale\` key there would start filling
\`{{ locale }}\` inside template bodies, which is a routing
decision leaking into content.`)
  .option(`--defaults [defaults...]`, `The saved modules live in here. The shape is the Cockpit's
contract and is not pinned down further: adding a block type
would otherwise be a service deploy. The one key that IS pinned
down is \`brand\`, because it moved out — and it is refused with a
closure rather than a \`defaults.brand\` rule, since a nested rule
makes the validator drop the parent and quietly discard every
other key in the bag along with it.`)
  .option(`--product <product>`, ``)
  .option(`--quiet-hours [quiet-hours...]`, ``)
  .option(`--support-email <support-email>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { defaultLocale, defaults, product, quietHours, supportEmail } = await promptForMissing(
          _options,
          configUpdatePatchSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/config`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (defaultLocale !== undefined) {
          _payload[`default_locale`] = defaultLocale;
        }
        if (defaults !== undefined) {
          _payload[`defaults`] = defaults;
        }
        if (product !== undefined) {
          _payload[`product`] = product;
        }
        if (quietHours !== undefined) {
          _payload[`quiet_hours`] = quietHours;
        }
        if (supportEmail !== undefined) {
          _payload[`support_email`] = supportEmail;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(messaging.commands.at(-1)!, configUpdatePatchSpecs, { method: "patch" });
const configUpdateSpecs: PromptSpec[] = [
  { key: "defaultLocale", option: "--default-locale <default-locale>", name: "default_locale", description: "The house language — step 4 of the send path's resolution order,\nreached only when neither the caller, the event payload nor the\nbinding said anything. A column of its own and not a key in\n`defaults` below, because everything in that bag is merged into\nthe render model: a `locale` key there would start filling\n`{{ locale }}` inside template bodies, which is a routing\ndecision leaking into content.", type: "string", required: false },
  { key: "defaults", option: "--defaults [defaults...]", name: "defaults", description: "The saved modules live in here. The shape is the Cockpit's\ncontract and is not pinned down further: adding a block type\nwould otherwise be a service deploy. The one key that IS pinned\ndown is `brand`, because it moved out — and it is refused with a\nclosure rather than a `defaults.brand` rule, since a nested rule\nmakes the validator drop the parent and quietly discard every\nother key in the bag along with it.", type: "array", required: false },
  { key: "product", option: "--product <product>", name: "product", type: "string", required: false },
  { key: "quietHours", option: "--quiet-hours [quiet-hours...]", name: "quiet_hours", type: "array", required: false },
  { key: "supportEmail", option: "--support-email <support-email>", name: "support_email", type: "string", required: false },
];
messaging
  .command(`config-update`)
  .description(`Reaches every message this tenant sends, including templates saved months
ago — content placeholders resolve at send time, not at save time — which
is why writing is admin tier while reading is not.

Two refusals worth knowing about. \`defaults.brand\` is 422, not ignored:
the letterhead moved to /v1/layouts when a tenant gained more than one of
them, and a letterhead edit that appears to save and changes nothing is
the worst of the three possible behaviours. A half-written \`quiet_hours\`
is 422 as well — a tenant that typed a start and forgot the end has an
opinion about when not to message people, and silently sending through
the night is the one answer that is definitely wrong.

Provider credentials cannot be written here. That path is
/v1/channel-credentials, so the one route that handles secrets stays the
one that was built for it.

This path answers on \`PUT\` and \`PATCH\`, both routed to the same action.`)
  .option(`--default-locale <default-locale>`, `The house language — step 4 of the send path's resolution order,
reached only when neither the caller, the event payload nor the
binding said anything. A column of its own and not a key in
\`defaults\` below, because everything in that bag is merged into
the render model: a \`locale\` key there would start filling
\`{{ locale }}\` inside template bodies, which is a routing
decision leaking into content.`)
  .option(`--defaults [defaults...]`, `The saved modules live in here. The shape is the Cockpit's
contract and is not pinned down further: adding a block type
would otherwise be a service deploy. The one key that IS pinned
down is \`brand\`, because it moved out — and it is refused with a
closure rather than a \`defaults.brand\` rule, since a nested rule
makes the validator drop the parent and quietly discard every
other key in the bag along with it.`)
  .option(`--product <product>`, ``)
  .option(`--quiet-hours [quiet-hours...]`, ``)
  .option(`--support-email <support-email>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { defaultLocale, defaults, product, quietHours, supportEmail } = await promptForMissing(
          _options,
          configUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/config`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (defaultLocale !== undefined) {
          _payload[`default_locale`] = defaultLocale;
        }
        if (defaults !== undefined) {
          _payload[`defaults`] = defaults;
        }
        if (product !== undefined) {
          _payload[`product`] = product;
        }
        if (quietHours !== undefined) {
          _payload[`quiet_hours`] = quietHours;
        }
        if (supportEmail !== undefined) {
          _payload[`support_email`] = supportEmail;
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
registerPromptSpecs(messaging.commands.at(-1)!, configUpdateSpecs, { method: "put" });
const layoutIndexSpecs: PromptSpec[] = [
  { key: "markets", option: "--markets <markets>", name: "markets", description: "Set to `all` for the unscoped read: every row whatever its markets, ignoring the `X-Revenexx-Market` header. The deliberate admin case, spelled in the query string so it is asked for rather than fallen into. No other value has any effect.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`layout-index`)
  .description(`The order is the list's purpose: it is a picker, and the entry most
templates are actually on belongs at the top of it.

Market-scoped as a browsing filter — see the parameters. \`GET /layouts/{id}\`
deliberately is not: somebody holding an id may read it.`)
  .option(`--markets <markets>`, `Set to \`all\` for the unscoped read: every row whatever its markets, ignoring the \`X-Revenexx-Market\` header. The deliberate admin case, spelled in the query string so it is asked for rather than fallen into. No other value has any effect.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { markets, filter } = await promptForMissing(
          _options,
          layoutIndexSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/layouts`;
        const _payload: RequestParams = {};
        if (markets !== undefined) {
          _payload[`markets`] = markets;
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
registerPromptSpecs(messaging.commands.at(-1)!, layoutIndexSpecs, { method: "get" });
messaging
  .command(`layout-store`)
  .description(`A tenant's FIRST layout becomes the default whatever the request says: a
tenant with no default cannot compile a template that does not name one.

The default may hold neither a validity window nor \`enabled: false\`, and
asking for both in one request is refused with 422
\`layout_default_always_in_force\`. There is no fallback behind the default
— every template that names no layout is framed by it — so a window set
today would take a tenant's whole letterhead away on a morning months
from now, with nobody left who remembers typing the date.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/layouts`;
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
const layoutDestroySpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/messaging/layouts", hasLimit: false } },
];
messaging
  .command(`layout-destroy`)
  .description(`Answers 200 with a body rather than the 204 the other resources use: the
count of reassigned templates is the part an operator needs, and a
deletion that silently moved eleven templates onto another letterhead is
one they would only discover from the next mail that went out.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          layoutDestroySpecs,
          _command,
        );
        await confirmDestructive(`messaging layout-destroy`);
        const _client = await sdkForProject();
        const _apiPath = `/messaging/layouts/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(messaging.commands.at(-1)!, layoutDestroySpecs, { method: "delete", destructive: true });
const layoutShowSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/messaging/layouts", hasLimit: false } },
];
messaging
  .command(`layout-show`)
  .description(`Not market-filtered, deliberately: market scoping is a browsing concern,
and somebody holding an id may read the row. A template pinned to a
layout keeps mailing on it whatever market the reader is looking at.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          layoutShowSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/layouts/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(messaging.commands.at(-1)!, layoutShowSpecs, { method: "get" });
const layoutUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/messaging/layouts", hasLimit: false } },
];
messaging
  .command(`layout-update`)
  .description(`The change reaches every template on this layout, including ones saved
months ago and never opened since — which is exactly the change nobody
remembers making when the mails start looking wrong. It is audited for
that reason, and only when something actually changed: an audit line on
every save teaches its readers to ignore the log.

Two 422s. Clearing \`is_default\` on the current default is
\`layout_default_required\` — promoting another layout is the operation
that exists for this, and it clears this one as a side effect, which is
the only way the count stays at exactly one. Giving the default a
validity window or switching it off is \`layout_default_always_in_force\`,
and the check is made of the OUTCOME, so promoting a layout and dating it
in the same request is caught.

The structural half of a layout — colours, width, font — is baked into
each template's compiled body, so templates already on it keep the old
one until they are recompiled.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          layoutUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/layouts/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(messaging.commands.at(-1)!, layoutUpdateSpecs, { method: "patch" });
const libraryIndexSpecs: PromptSpec[] = [
  { key: "channel", option: "--channel <channel>", name: "channel", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`library-index`)
  .description(`What the Cockpit's "start from a template" gallery is built from. These
are not the tenant's rows and cannot be edited here: provisioning clones
them into \`/v1/templates\`, and it is the clone that a tenant owns.`)
  .option(`--channel <channel>`, ``)
  .option(`--locale <locale>`, ``)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channel, locale, filter } = await promptForMissing(
          _options,
          libraryIndexSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/library`;
        const _payload: RequestParams = {};
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
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
registerPromptSpecs(messaging.commands.at(-1)!, libraryIndexSpecs, { method: "get" });
const messageIndexSpecs: PromptSpec[] = [
  { key: "channel", option: "--channel <channel>", name: "channel", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`message-index`)
  .description(`\`?channel=\` and \`?status=\` narrow it; \`?limit=\` is clamped to 200 and
defaults to 50. \`?channel=inapp\` is the tenant's in-app inbox — the
Message row IS the inbox item, so there is no second store for it.

Rows are subject to the deployment's retention window and to erasure
requests, so this is not an archive.`)
  .option(`--channel <channel>`, ``)
  .option(`--status <status>`, ``)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channel, status, filter } = await promptForMissing(
          _options,
          messageIndexSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages`;
        const _payload: RequestParams = {};
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
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
registerPromptSpecs(messaging.commands.at(-1)!, messageIndexSpecs, { method: "get" });
const messageShowSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/messaging/messages", hasLimit: false } },
];
messaging
  .command(`message-show`)
  .description(`Carries the render model it was sent with, so "why did this mail say
     * that" is answerable after the fact. That is also why the row is personal
data and why it can be erased — see POST /v1/privacy/erasures.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          messageShowSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(messaging.commands.at(-1)!, messageShowSpecs, { method: "get" });
const sendPreviewSpecs: PromptSpec[] = [
  { key: "channel", option: "--channel <channel>", name: "channel", type: "string", required: true },
  { key: "template", option: "--template <template>", name: "template", type: "string", required: true },
  { key: "data", option: "--data <data>", name: "data", description: "The render model: a free map of variable name to value, resolved against the template's\nplaceholders. Values may be strings, numbers, booleans, or nested objects and arrays —\n`{{ order.number }}` reads a nested one.\n\nNot the only source. A tenant's `defaults`, its layout, and the template's own\n`variable_defaults` are merged underneath, so a placeholder an event did not carry can\nstill resolve. Anything named here wins over all of them.", type: "object", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", type: "string", required: false },
];
messaging
  .command(`send-preview`)
  .description(`Answers with the resolved subject, HTML and text exactly as a real send
would produce them, so an editor can show a faithful preview without a
message row, a provider call or a suppression check.

Takes no \`market\`, deliberately: rendering picks no provider, so there is
nothing here for a market to change. Nor \`send_at\`, \`draft\` or
\`attachments\` — all of them are properties of a dispatch, not of a render.`)
  .option(`--channel <channel>`, ``)
  .option(`--template <template>`, ``)
  .option(`--data <data>`, `The render model: a free map of variable name to value, resolved against the template's
placeholders. Values may be strings, numbers, booleans, or nested objects and arrays —
\`{{ order.number }}\` reads a nested one.

Not the only source. A tenant's \`defaults\`, its layout, and the template's own
\`variable_defaults\` are merged underneath, so a placeholder an event did not carry can
still resolve. Anything named here wins over all of them.`)
  .option(`--locale <locale>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channel, template, data, locale } = await promptForMissing(
          _options,
          sendPreviewSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/preview`;
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
        if (data !== undefined) {
          _payload[`data`] = resolveBodyParam(data);
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (template !== undefined) {
          _payload[`template`] = template;
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
registerPromptSpecs(messaging.commands.at(-1)!, sendPreviewSpecs, { method: "post" });
const erasureStoreSpecs: PromptSpec[] = [
  { key: "address", option: "--address <address>", name: "address", type: "string", required: true },
  { key: "channel", option: "--channel <channel>", name: "channel", description: "Per (channel, address), not per address: an address is\nchannel-shaped, and the suppression and token rows it has to line\nup with are keyed that way.", type: "string", required: true },
];
messaging
  .command(`erasure-store`)
  .description(`Per (channel, address), because an address is channel-shaped and the rows
it has to line up with are keyed that way. Matching is done on the
normalised form on both sides, so a request for \`ada@acme.test\` finds a
log written for \`Ada@Acme.test\` — an erasure that misses on
capitalisation is an erasure that did not happen and reports success.

Message rows and unsubscribe tokens are DELETED. Suppressions are KEPT
with the clear-text address nulled: matching runs on a keyed hash, so the
row can still block and can no longer identify. Deleting it instead is
the obvious reading of "erase everything about them", and it is the
reading that mails a dead address again next week — or mails somebody who
complained, which is how a sending domain gets blocked.

Answers with the counts, \`suppressions_kept\` among them, so the design is
stated in the response rather than only in this paragraph.`)
  .option(`--address <address>`, ``)
  .option(`--channel <channel>`, `Per (channel, address), not per address: an address is
channel-shaped, and the suppression and token rows it has to line
up with are keyed that way.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { address, channel } = await promptForMissing(
          _options,
          erasureStoreSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/privacy/erasures`;
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
        if (channel !== undefined) {
          _payload[`channel`] = channel;
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
registerPromptSpecs(messaging.commands.at(-1)!, erasureStoreSpecs, { method: "post" });
const pushSubscriptionDestroySpecs: PromptSpec[] = [
  { key: "endpoint", option: "--endpoint <endpoint>", name: "endpoint", type: "string", required: true },
];
messaging
  .command(`push-subscription-destroy`)
  .description(`By endpoint and not by id, because the browser knows its endpoint and has
never seen our id — this is called from a service worker reacting to
\`pushsubscriptionchange\`, or from a "turn off notifications" button.`)
  .option(`--endpoint <endpoint>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { endpoint } = await promptForMissing(
          _options,
          pushSubscriptionDestroySpecs,
          _command,
        );
        await confirmDestructive(`messaging push-subscription-destroy`);
        const _client = await sdkForProject();
        const _apiPath = `/messaging/push/subscriptions`;
        const _payload: RequestParams = {};
        if (endpoint !== undefined) {
          _payload[`endpoint`] = endpoint;
        }
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
registerPromptSpecs(messaging.commands.at(-1)!, pushSubscriptionDestroySpecs, { method: "delete", destructive: true });
const pushSubscriptionIndexSpecs: PromptSpec[] = [
  { key: "subscriberId", option: "--subscriber-id <subscriber-id>", name: "subscriber_id", type: "string", required: true },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`push-subscription-index`)
  .description(`\`subscriber_id\` is required: this is not a list of everybody, and there
is no route that is. The caller is a storefront acting for one visitor
and has no business enumerating the rest.

The client key material is never returned — see the \`\$hidden\` list on the
model. A registration that can be read back is a registration somebody
else can push with.`)
  .option(`--subscriber-id <subscriber-id>`, ``)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { subscriberId, filter } = await promptForMissing(
          _options,
          pushSubscriptionIndexSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/push/subscriptions`;
        const _payload: RequestParams = {};
        if (subscriberId !== undefined) {
          _payload[`subscriber_id`] = subscriberId;
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
registerPromptSpecs(messaging.commands.at(-1)!, pushSubscriptionIndexSpecs, { method: "get" });
const pushSubscriptionStoreSpecs: PromptSpec[] = [
  { key: "endpoint", option: "--endpoint <endpoint>", name: "endpoint", type: "string", required: true },
  { key: "keys", option: "--keys <keys>", name: "keys", type: "object", required: true },
  { key: "subscriberId", option: "--subscriber-id <subscriber-id>", name: "subscriber_id", type: "string", required: true },
  { key: "userAgent", option: "--user-agent <user-agent>", name: "user_agent", type: "string", required: false },
];
messaging
  .command(`push-subscription-store`)
  .description(`Send what \`PushManager.subscribe()\` handed back — the endpoint and the
two keys — plus the id you know that person by. The VAPID public key the
browser needs to produce it comes from \`GET /v1/config\`
(\`meta.push_public_key\`).

**Idempotent by endpoint**, and the two statuses say which happened: 201
for a browser seen for the first time, 200 for one already registered. A
browser calls \`subscribe()\` on every page load and hands back the same
endpoint each time; treating that as a new device would give one laptop a
thousand rows and push to it a thousand times.`)
  .option(`--endpoint <endpoint>`, ``)
  .option(`--keys <keys>`, ``)
  .option(`--subscriber-id <subscriber-id>`, ``)
  .option(`--user-agent <user-agent>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { endpoint, keys, subscriberId, userAgent } = await promptForMissing(
          _options,
          pushSubscriptionStoreSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/push/subscriptions`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (endpoint !== undefined) {
          _payload[`endpoint`] = endpoint;
        }
        if (keys !== undefined) {
          _payload[`keys`] = resolveBodyParam(keys);
        }
        if (subscriberId !== undefined) {
          _payload[`subscriber_id`] = subscriberId;
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
registerPromptSpecs(messaging.commands.at(-1)!, pushSubscriptionStoreSpecs, { method: "post" });
const sendSendSpecs: PromptSpec[] = [
  { key: "channel", option: "--channel <channel>", name: "channel", type: "string", required: true },
  { key: "template", option: "--template <template>", name: "template", type: "string", required: true },
  { key: "to", option: "--to <to>", name: "to", type: "string", required: true },
  { key: "attachments", option: "--attachments [attachments...]", name: "attachments", description: "Files travelling with the message. Base64 content, never a URL:\nfetching an address that arrives in a request body would make\nthis service a request-forwarder inside the platform network —\nsee App\\Support\\Attachment.", type: "array", required: false },
  { key: "data", option: "--data <data>", name: "data", description: "The render model: a free map of variable name to value, resolved against the template's\nplaceholders. Values may be strings, numbers, booleans, or nested objects and arrays —\n`{{ order.number }}` reads a nested one.\n\nNot the only source. A tenant's `defaults`, its layout, and the template's own\n`variable_defaults` are merged underneath, so a placeholder an event did not carry can\nstill resolve. Anything named here wins over all of them.", type: "object", required: false },
  { key: "draft", option: "--draft <draft>", name: "draft", description: "A TEST SEND. Renders the draft instead of the published snapshot,\nwhich is the only way an author can check a correction in a real\nmail client before it goes live to everybody. Deliberately a flag on this route and not a route of its own:\neverything else about it — suppression, quiet hours, the\nlanguage chain, idempotency — has to behave exactly as a real\nsend, and a second endpoint is a second set of those rules that\ndrifts. The one difference is which fassung is rendered.", type: "boolean", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "The language the CALLER states — step 1 of the resolution order,\nahead of anything in the payload. Absent is normal and is not\n\"English\": it means the recipient's own language decides.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "Which market this send belongs to. Absent means the GLOBAL\nmarket, which is what every send was before markets reached this\npath — so a caller that never heard of them keeps working and\ngets the credentials it always had. The caller states it; nothing here derives it. A country code on\na phone number is a fact and a domain on an address is a guess,\nand a guess that decides which carrier carries a message would\nlook exactly like a decision somebody made.\n\nNot on `preview`: rendering picks no provider, so there is\nnothing there for a market to change.", type: "string", required: false },
  { key: "sendAt", option: "--send-at <send-at>", name: "send_at", description: "Send later. A time in the past is accepted and means now — a\nclient retrying a request it built ten minutes ago is asking for\nthe same send, and refusing it turns a late retry into a lost\nmessage.", type: "string", required: false },
];
messaging
  .command(`send-send`)
  .description(`Renders a tenant template and dispatches it — now, at \`send_at\`, or at
the end of the tenant's quiet hours.

The first line is deliberately a title, not a sentence about the
mechanism: Scramble takes it as the operation's \`summary\`, and a summary
is what an API explorer prints in its route list. The paragraph that used
to be here ran to 119 characters across two lines, which the gateway's
fragment tests reject for exactly that reason.

Retry-safe when the caller sends an \`Idempotency-Key\` header. The two
answers are deliberately different:

  201 — a message was created by THIS call
  200 — this key was already used; here is the message it produced

A caller has to be able to tell those apart. "Your mail went out" and
"your mail had already gone out" are the same outcome and different
facts, and a client reconciling its own records needs the second one.
Same key with a different body is a 422 — see IdempotencyConflict.

A recipient on the tenant's suppression list is not sent to, and that is
reported as a refusal rather than as a silent success.`)
  .option(`--channel <channel>`, ``)
  .option(`--template <template>`, ``)
  .option(`--to <to>`, ``)
  .option(`--attachments [attachments...]`, `Files travelling with the message. Base64 content, never a URL:
fetching an address that arrives in a request body would make
this service a request-forwarder inside the platform network —
see App\\Support\\Attachment.`)
  .option(`--data <data>`, `The render model: a free map of variable name to value, resolved against the template's
placeholders. Values may be strings, numbers, booleans, or nested objects and arrays —
\`{{ order.number }}\` reads a nested one.

Not the only source. A tenant's \`defaults\`, its layout, and the template's own
\`variable_defaults\` are merged underneath, so a placeholder an event did not carry can
still resolve. Anything named here wins over all of them.`)
  .option(
    `--draft [value]`,
    `A TEST SEND. Renders the draft instead of the published snapshot,
which is the only way an author can check a correction in a real
mail client before it goes live to everybody. Deliberately a flag on this route and not a route of its own:
everything else about it — suppression, quiet hours, the
language chain, idempotency — has to behave exactly as a real
send, and a second endpoint is a second set of those rules that
drifts. The one difference is which fassung is rendered.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--locale <locale>`, `The language the CALLER states — step 1 of the resolution order,
ahead of anything in the payload. Absent is normal and is not
"English": it means the recipient's own language decides.`)
  .option(`--market <market>`, `Which market this send belongs to. Absent means the GLOBAL
market, which is what every send was before markets reached this
path — so a caller that never heard of them keeps working and
gets the credentials it always had. The caller states it; nothing here derives it. A country code on
a phone number is a fact and a domain on an address is a guess,
and a guess that decides which carrier carries a message would
look exactly like a decision somebody made.

Not on \`preview\`: rendering picks no provider, so there is
nothing there for a market to change.`)
  .option(`--send-at <send-at>`, `Send later. A time in the past is accepted and means now — a
client retrying a request it built ten minutes ago is asking for
the same send, and refusing it turns a late retry into a lost
message.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channel, template, to, attachments, data, draft, locale, market, sendAt } = await promptForMissing(
          _options,
          sendSendSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/send`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (attachments !== undefined) {
          _payload[`attachments`] = attachments;
        }
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (data !== undefined) {
          _payload[`data`] = resolveBodyParam(data);
        }
        if (draft !== undefined) {
          _payload[`draft`] = draft;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (sendAt !== undefined) {
          _payload[`send_at`] = sendAt;
        }
        if (template !== undefined) {
          _payload[`template`] = template;
        }
        if (to !== undefined) {
          _payload[`to`] = to;
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
registerPromptSpecs(messaging.commands.at(-1)!, sendSendSpecs, { method: "post" });
const statsIndexSpecs: PromptSpec[] = [
  { key: "days", option: "--days <days>", name: "days", description: "Clamped and possibly shortened by retention inside the service,\nwhich reports what it actually used.", type: "integer", required: false },
  { key: "from", option: "--from <from>", name: "from", description: "An explicit span, for a window that does not end today. Both\nends or neither: `from` alone would be an open range, and the\nservice would have to guess which end was meant.\n`nullable` rather than `sometimes`, so `required_with` still\nruns when the OTHER end is missing. With `sometimes` an absent\nfield is skipped entirely, and `?from=` alone sailed through to\nbecome a window nobody asked for.", type: "string", required: false },
  { key: "to", option: "--to <to>", name: "to", description: "The other end of the same span, inclusive: the whole of this day\nis inside the window whatever time its rows carry. A span running\npast today ends today — there is no data ahead of now, and a\nwindow with a future edge draws the series short against an axis\nclaiming a month nobody has lived through.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`stats-index`)
  .description(`Either \`days\` (a window ending now, default 30) or an explicit \`from\`/\`to\`
span. Both ends of the span or neither: \`from\` alone would be an open
range and the service would have to guess which end was meant.

Three numbers are deliberately not the naive ones, and the \`window\` block
says so rather than leaving a chart to imply otherwise. The window is
CLAMPED to the tenant's retention, and \`clamped_by_retention\` says when
that happened — 90 days on a 30-day retention is 30 days of data wearing
a 90-day label, and the trend line it draws invents a collapse that never
happened. Opens are counted only over channels that can report them; SMS
and push have no such thing, so dividing opens by all messages would
quietly halve every open rate the moment a tenant adds a second channel.
The delivery rate is sent ÷ (sent + failed): suppressed is the service
doing what it was told, and counting it as a failure would punish a
tenant for having a working unsubscribe list.

\`previous\` is the same window again immediately before this one, which is
what turns a figure into a direction. **It is null** whenever the
preceding window is not entirely inside retention: the query would answer
zero rather than fail, and zero against 1,337 renders as a triumphant
+100 % beside every tile on the screen. Show no trend rather than a
flattering one.

Nothing here names a recipient. That is the delivery log, which is a
different endpoint with a different question.`)
  .option(`--days <days>`, `Clamped and possibly shortened by retention inside the service,
which reports what it actually used.`, parseInteger)
  .option(`--from <from>`, `An explicit span, for a window that does not end today. Both
ends or neither: \`from\` alone would be an open range, and the
service would have to guess which end was meant.
\`nullable\` rather than \`sometimes\`, so \`required_with\` still
runs when the OTHER end is missing. With \`sometimes\` an absent
field is skipped entirely, and \`?from=\` alone sailed through to
become a window nobody asked for.`)
  .option(`--to <to>`, `The other end of the same span, inclusive: the whole of this day
is inside the window whatever time its rows carry. A span running
past today ends today — there is no data ahead of now, and a
window with a future edge draws the series short against an axis
claiming a month nobody has lived through.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { days, from, to, filter } = await promptForMissing(
          _options,
          statsIndexSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/stats`;
        const _payload: RequestParams = {};
        if (days !== undefined) {
          _payload[`days`] = days;
        }
        if (from !== undefined) {
          _payload[`from`] = from;
        }
        if (to !== undefined) {
          _payload[`to`] = to;
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
registerPromptSpecs(messaging.commands.at(-1)!, statsIndexSpecs, { method: "get" });
const suppressionIndexSpecs: PromptSpec[] = [
  { key: "channel", option: "--channel <channel>", name: "channel", type: "string", required: false },
  { key: "scope", option: "--scope <scope>", name: "scope", type: "string", required: false, enum: ["all","marketing"] },
  { key: "reason", option: "--reason <reason>", name: "reason", type: "string", required: false, enum: ["hard_bounce","complaint","unsubscribe","manual"] },
  { key: "address", option: "--address <address>", name: "address", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", type: "integer", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`suppression-index`)
  .description(`Filterable by \`channel\`, \`scope\`, \`reason\` and \`address\`. The address
filter is looked up by FINGERPRINT rather than against the address
column, which is what makes "why did this person stop getting our mail"
answerable for somebody who has since been erased: the row has no
address left to match on, and the question is still the same question.`)
  .option(`--channel <channel>`, ``)
  .option(`--scope <scope>`, ``)
  .option(`--reason <reason>`, ``)
  .option(`--address <address>`, ``)
  .option(`--limit <limit>`, ``, parseInteger)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channel, scope, reason, address, limit, filter } = await promptForMissing(
          _options,
          suppressionIndexSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/suppressions`;
        const _payload: RequestParams = {};
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (scope !== undefined) {
          _payload[`scope`] = scope;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
        }
        if (address !== undefined) {
          _payload[`address`] = address;
        }
        if (limit !== undefined) {
          _payload[`limit`] = limit;
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
registerPromptSpecs(messaging.commands.at(-1)!, suppressionIndexSpecs, { method: "get" });
const suppressionStoreSpecs: PromptSpec[] = [
  { key: "address", option: "--address <address>", name: "address", type: "string", required: true },
  { key: "channel", option: "--channel <channel>", name: "channel", type: "string", required: true },
  { key: "reason", option: "--reason <reason>", name: "reason", type: "string", required: true, enum: ["hard_bounce","complaint","unsubscribe","manual"] },
  { key: "expiresAt", option: "--expires-at <expires-at>", name: "expires_at", type: "string", required: false },
  { key: "note", option: "--note <note>", name: "note", type: "string", required: false },
  { key: "scope", option: "--scope <scope>", name: "scope", type: "string", required: false, enum: ["all","marketing"] },
];
messaging
  .command(`suppression-store`)
  .description(`201 for a row this call created, 200 for an address that was already on
the list — so a client can tell whether it changed anything.

The \`scope\` follows from the \`reason\` for every reason but \`manual\`, and
asking for a different one is 422 \`suppression_scope_fixed\` rather than
being quietly corrected: a caller who asked for \`marketing\` on a hard
bounce has the model wrong, and a silent upgrade to \`all\` would leave
them believing transactional mail still flows to an address that does not
exist.`)
  .option(`--address <address>`, ``)
  .option(`--channel <channel>`, ``)
  .option(`--reason <reason>`, ``)
  .option(`--expires-at <expires-at>`, ``)
  .option(`--note <note>`, ``)
  .option(`--scope <scope>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { address, channel, reason, expiresAt, note, scope } = await promptForMissing(
          _options,
          suppressionStoreSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/suppressions`;
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
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (expiresAt !== undefined) {
          _payload[`expires_at`] = expiresAt;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
        }
        if (scope !== undefined) {
          _payload[`scope`] = scope;
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
registerPromptSpecs(messaging.commands.at(-1)!, suppressionStoreSpecs, { method: "post" });
const suppressionDestroySpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/messaging/suppressions", hasLimit: true } },
];
messaging
  .command(`suppression-destroy`)
  .description(`Audited, unlike most deletes in this service. Removing a row here is the
one operation that makes the service mail an address something decided
not to mail — if a complaint turns into a spam report later, "who took
     * this off the list, and when" is the whole investigation.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          suppressionDestroySpecs,
          _command,
        );
        await confirmDestructive(`messaging suppression-destroy`);
        const _client = await sdkForProject();
        const _apiPath = `/messaging/suppressions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(messaging.commands.at(-1)!, suppressionDestroySpecs, { method: "delete", destructive: true });
const suppressionShowSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/messaging/suppressions", hasLimit: true } },
];
messaging
  .command(`suppression-show`)
  .description(`\`address\` may be null: that is a person who has been erased
(POST /v1/privacy/erasures). The row survives as a hash, which is the
point — the clear text is gone and the address is still blocked.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          suppressionShowSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/suppressions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(messaging.commands.at(-1)!, suppressionShowSpecs, { method: "get" });
const templateIndexSpecs: PromptSpec[] = [
  { key: "channel", option: "--channel <channel>", name: "channel", type: "string", required: false },
  { key: "markets", option: "--markets <markets>", name: "markets", description: "Set to `all` for the unscoped read: every row whatever its markets, ignoring the `X-Revenexx-Market` header. The deliberate admin case, spelled in the query string so it is asked for rather than fallen into. No other value has any effect.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`template-index`)
  .description(`\`?channel=\` narrows to one channel. Market-scoped as a BROWSING filter:
with \`X-Revenexx-Market\` the list is the global rows plus that market's,
without it the global rows only, and \`?markets=all\` is the unscoped read.
Never a boundary — the tenant is fixed by the credential and by row-level
security, and no value of either parameter reaches another tenant's rows.`)
  .option(`--channel <channel>`, ``)
  .option(`--markets <markets>`, `Set to \`all\` for the unscoped read: every row whatever its markets, ignoring the \`X-Revenexx-Market\` header. The deliberate admin case, spelled in the query string so it is asked for rather than fallen into. No other value has any effect.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channel, markets, filter } = await promptForMissing(
          _options,
          templateIndexSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/templates`;
        const _payload: RequestParams = {};
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (markets !== undefined) {
          _payload[`markets`] = markets;
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
registerPromptSpecs(messaging.commands.at(-1)!, templateIndexSpecs, { method: "get" });
const templateStoreSpecs: PromptSpec[] = [
  { key: "channel", option: "--channel <channel>", name: "channel", type: "string", required: true },
  { key: "key", option: "--key <key>", name: "key", type: "string", required: true },
  { key: "bodyHtml", option: "--body-html <body-html>", name: "body_html", type: "string", required: false },
  { key: "bodyText", option: "--body-text <body-text>", name: "body_text", type: "string", required: false },
  { key: "contentSid", option: "--content-sid <content-sid>", name: "content_sid", description: "The Meta-approved template this one is sent as. Outside the\n24-hour service window it is the only thing WhatsApp carries.", type: "string", required: false },
  { key: "design", option: "--design [design...]", name: "design", description: "The design document (v2). Validated as \"an array\" and no further:\nthe compiler is the authority on the block schema and answers with\nthe offending block, which is a better error than anything a\nvalidation rule list could restate here.", type: "array", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", type: "boolean", required: false },
  { key: "layoutId", option: "--layout-id <layout-id>", name: "layout_id", description: "Which letterhead this template is mailed on. Null (or absent) is\nnot \"no layout\" — it means the tenant's default, resolved on\nevery compile and every send, so the template keeps following\nthat default when it changes.", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", type: "string", required: false },
  { key: "markets", option: "--markets [markets...]", name: "markets", description: "Which markets this template is browsed in. `[]` — the default —\nis global, so this is never nullable: null would be a second\nempty next to the one that already carries the meaning.", type: "array", required: false },
  { key: "messageClass", option: "--message-class <message-class>", name: "message_class", description: "What messages from this template ARE. Defaulted in the column\nrather than here, so a client that has never heard of the field\nkeeps sending transactional mail — which is what every template\nwritten before this field existed was.", type: "string", required: false, enum: ["transactional","marketing"] },
  { key: "subject", option: "--subject <subject>", name: "subject", type: "string", required: false },
  { key: "testMode", option: "--test-mode <test-mode>", name: "test_mode", description: "When this template is in force — see App\\Models\\Template. `after_or_equal` and not `after`: a window of a single instant is\na legitimate thing to write while somebody is lining two\ntemplates up back to back, and rejecting it would only make them\nadd a second nobody can see. A window that runs BACKWARDS is\nrefused, because it is a template that can never send and looks\nfrom the list exactly like one that can.", type: "boolean", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "What the template is CALLED, as opposed to `key`, which is what\nit is addressed by. Without it a list has to derive a name from\nthe key, and `order-confirmation` becomes \"Order Confirmation\" —\npassable English by accident and wrong in every other language.", type: "string", required: false },
  { key: "validFrom", option: "--valid-from <valid-from>", name: "valid_from", type: "string", required: false },
  { key: "validUntil", option: "--valid-until <valid-until>", name: "valid_until", type: "string", required: false },
  { key: "variableDefaults", option: "--variable-defaults [variable-defaults...]", name: "variable_defaults", description: "Fallbacks for the placeholders an event did not fill — a map of\nvariable name → string. Nullable, unlike `markets`: an empty map\nand no map are the same thing (nothing to fall back to), so there\nis no second state for a null to confuse anybody with.", type: "array", required: false },
  { key: "variables", option: "--variables [variables...]", name: "variables", type: "array", required: false },
  { key: "whatsappCategory", option: "--whatsapp-category <whatsapp-category>", name: "whatsapp_category", description: "What a WhatsApp template is to Meta, which is what every message\nfrom it COSTS: marketing runs about five times utility, and in\nGermany that is roughly $0.12 against $0.025 a message. Refused\nrather than coerced when it is not one of Meta's four — a\nmisspelled category that quietly became the default would be\nwrong on an invoice nobody reads until the quarter closes.\nNullable: it is not a fact about an e-mail template, and what an\nunset one means is decided on read (Template::whatsappCategory).", type: "string", required: false, enum: ["marketing","utility","authentication","service"] },
];
messaging
  .command(`template-store`)
  .description(`Send a \`design\` document and the service compiles it against the
template's layout — or send \`body_html\` and \`body_text\` yourself and skip
compilation entirely.

A design that the compiler refuses is 422 and NOTHING is written, with
\`error.details\` naming the offending block. That order is deliberate: a
save whose compile failed must leave the row alone, because storing the
design while keeping a stale body would hand the next send a mail that no
longer matches the document it claims to be built from, and nothing would
ever surface it. A sidecar that is down is 503 \`mjml_unavailable\`, which
is worth retrying; a rejected design is not.

The row this creates is a DRAFT and sends nothing until it is published.`)
  .option(`--channel <channel>`, ``)
  .option(`--key <key>`, ``)
  .option(`--body-html <body-html>`, ``)
  .option(`--body-text <body-text>`, ``)
  .option(`--content-sid <content-sid>`, `The Meta-approved template this one is sent as. Outside the
24-hour service window it is the only thing WhatsApp carries.`)
  .option(`--design [design...]`, `The design document (v2). Validated as "an array" and no further:
the compiler is the authority on the block schema and answers with
the offending block, which is a better error than anything a
validation rule list could restate here.`)
  .option(
    `--enabled [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--layout-id <layout-id>`, `Which letterhead this template is mailed on. Null (or absent) is
not "no layout" — it means the tenant's default, resolved on
every compile and every send, so the template keeps following
that default when it changes.`)
  .option(`--locale <locale>`, ``)
  .option(`--markets [markets...]`, `Which markets this template is browsed in. \`[]\` — the default —
is global, so this is never nullable: null would be a second
empty next to the one that already carries the meaning.`)
  .option(`--message-class <message-class>`, `What messages from this template ARE. Defaulted in the column
rather than here, so a client that has never heard of the field
keeps sending transactional mail — which is what every template
written before this field existed was.`)
  .option(`--subject <subject>`, ``)
  .option(
    `--test-mode [value]`,
    `When this template is in force — see App\\Models\\Template. \`after_or_equal\` and not \`after\`: a window of a single instant is
a legitimate thing to write while somebody is lining two
templates up back to back, and rejecting it would only make them
add a second nobody can see. A window that runs BACKWARDS is
refused, because it is a template that can never send and looks
from the list exactly like one that can.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--title <title>`, `What the template is CALLED, as opposed to \`key\`, which is what
it is addressed by. Without it a list has to derive a name from
the key, and \`order-confirmation\` becomes "Order Confirmation" —
passable English by accident and wrong in every other language.`)
  .option(`--valid-from <valid-from>`, ``)
  .option(`--valid-until <valid-until>`, ``)
  .option(`--variable-defaults [variable-defaults...]`, `Fallbacks for the placeholders an event did not fill — a map of
variable name → string. Nullable, unlike \`markets\`: an empty map
and no map are the same thing (nothing to fall back to), so there
is no second state for a null to confuse anybody with.`)
  .option(`--variables [variables...]`, ``)
  .option(`--whatsapp-category <whatsapp-category>`, `What a WhatsApp template is to Meta, which is what every message
from it COSTS: marketing runs about five times utility, and in
Germany that is roughly \$0.12 against \$0.025 a message. Refused
rather than coerced when it is not one of Meta's four — a
misspelled category that quietly became the default would be
wrong on an invoice nobody reads until the quarter closes.
Nullable: it is not a fact about an e-mail template, and what an
unset one means is decided on read (Template::whatsappCategory).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channel, key, bodyHtml, bodyText, contentSid, design, enabled, layoutId, locale, markets, messageClass, subject, testMode, title, validFrom, validUntil, variableDefaults, variables, whatsappCategory } = await promptForMissing(
          _options,
          templateStoreSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/templates`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (bodyHtml !== undefined) {
          _payload[`body_html`] = bodyHtml;
        }
        if (bodyText !== undefined) {
          _payload[`body_text`] = bodyText;
        }
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (contentSid !== undefined) {
          _payload[`content_sid`] = contentSid;
        }
        if (design !== undefined) {
          _payload[`design`] = design;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (key !== undefined) {
          _payload[`key`] = key;
        }
        if (layoutId !== undefined) {
          _payload[`layout_id`] = layoutId;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (markets !== undefined) {
          _payload[`markets`] = markets;
        }
        if (messageClass !== undefined) {
          _payload[`message_class`] = messageClass;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
        }
        if (testMode !== undefined) {
          _payload[`test_mode`] = testMode;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (validFrom !== undefined) {
          _payload[`valid_from`] = validFrom;
        }
        if (validUntil !== undefined) {
          _payload[`valid_until`] = validUntil;
        }
        if (variableDefaults !== undefined) {
          _payload[`variable_defaults`] = variableDefaults;
        }
        if (variables !== undefined) {
          _payload[`variables`] = variables;
        }
        if (whatsappCategory !== undefined) {
          _payload[`whatsapp_category`] = whatsappCategory;
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
registerPromptSpecs(messaging.commands.at(-1)!, templateStoreSpecs, { method: "post" });
const templateDestroySpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/messaging/templates", hasLimit: false } },
];
messaging
  .command(`template-destroy`)
  .description(`Any binding still naming this template's key will find nothing when its
event next arrives. Audited under the KEY as well as the id: after the
delete the id resolves to nothing, and "deleted tmpl_01J…" is not
something an operator can act on six weeks later.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          templateDestroySpecs,
          _command,
        );
        await confirmDestructive(`messaging template-destroy`);
        const _client = await sdkForProject();
        const _apiPath = `/messaging/templates/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(messaging.commands.at(-1)!, templateDestroySpecs, { method: "delete", destructive: true });
const templateShowSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/messaging/templates", hasLimit: false } },
];
messaging
  .command(`template-show`)
  .description(`What customers are receiving is the published snapshot; see
\`GET /v1/templates/{id}/versions\`, whose \`meta.has_unpublished_changes\`
says whether the two differ.

Not market-filtered, deliberately: market scoping is a browsing concern
and somebody holding an id may read the row.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          templateShowSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/templates/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(messaging.commands.at(-1)!, templateShowSpecs, { method: "get" });
const templateUpdatePatchSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/messaging/templates", hasLimit: false } },
  { key: "bodyHtml", option: "--body-html <body-html>", name: "body_html", type: "string", required: false },
  { key: "bodyText", option: "--body-text <body-text>", name: "body_text", type: "string", required: false },
  { key: "contentSid", option: "--content-sid <content-sid>", name: "content_sid", type: "string", required: false },
  { key: "design", option: "--design [design...]", name: "design", type: "array", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", type: "boolean", required: false },
  { key: "layoutId", option: "--layout-id <layout-id>", name: "layout_id", type: "string", required: false },
  { key: "markets", option: "--markets [markets...]", name: "markets", type: "array", required: false },
  { key: "messageClass", option: "--message-class <message-class>", name: "message_class", type: "string", required: false, enum: ["transactional","marketing"] },
  { key: "subject", option: "--subject <subject>", name: "subject", type: "string", required: false },
  { key: "testMode", option: "--test-mode <test-mode>", name: "test_mode", description: "When this template is in force — see App\\Models\\Template. `after_or_equal` and not `after`: a window of a single instant is\na legitimate thing to write while somebody is lining two\ntemplates up back to back, and rejecting it would only make them\nadd a second nobody can see. A window that runs BACKWARDS is\nrefused, because it is a template that can never send and looks\nfrom the list exactly like one that can.", type: "boolean", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "Reclassifying is allowed and changes nothing that already went\nout: `messages.message_class` was copied onto each row at\ndispatch, so the log keeps saying what each message was.", type: "string", required: false },
  { key: "validFrom", option: "--valid-from <valid-from>", name: "valid_from", type: "string", required: false },
  { key: "validUntil", option: "--valid-until <valid-until>", name: "valid_until", type: "string", required: false },
  { key: "variableDefaults", option: "--variable-defaults [variable-defaults...]", name: "variable_defaults", type: "array", required: false },
  { key: "variables", option: "--variables [variables...]", name: "variables", type: "array", required: false },
  { key: "whatsappCategory", option: "--whatsapp-category <whatsapp-category>", name: "whatsapp_category", description: "Recategorising is allowed and takes effect on the next send: Meta\nmove templates between categories on their own schedule, and a\nrow that could not follow them would go on quoting a price that\nstopped being true.", type: "string", required: false, enum: ["marketing","utility","authentication","service"] },
];
messaging
  .command(`template-update-patch`)
  .description(`Only the fields sent are written, and the change is audited only when
something actually changed — a PATCH that resent the same values records
nothing, because an audit line on every save teaches its readers to
ignore the log.

Moving a template to another layout recompiles it against the NEW one,
even when nothing else changed: colours, width and font come from the
layout and are already inlined, so a template that merely changed hands
would otherwise keep showing the old letterhead until somebody happened
to press save on it again.

Changes nothing customers receive until the template is published.

This path answers on \`PUT\` and \`PATCH\`, both routed to the same action.`)
  .option(`--id <id>`, ``)
  .option(`--body-html <body-html>`, ``)
  .option(`--body-text <body-text>`, ``)
  .option(`--content-sid <content-sid>`, ``)
  .option(`--design [design...]`, ``)
  .option(
    `--enabled [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--layout-id <layout-id>`, ``)
  .option(`--markets [markets...]`, ``)
  .option(`--message-class <message-class>`, ``)
  .option(`--subject <subject>`, ``)
  .option(
    `--test-mode [value]`,
    `When this template is in force — see App\\Models\\Template. \`after_or_equal\` and not \`after\`: a window of a single instant is
a legitimate thing to write while somebody is lining two
templates up back to back, and rejecting it would only make them
add a second nobody can see. A window that runs BACKWARDS is
refused, because it is a template that can never send and looks
from the list exactly like one that can.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--title <title>`, `Reclassifying is allowed and changes nothing that already went
out: \`messages.message_class\` was copied onto each row at
dispatch, so the log keeps saying what each message was.`)
  .option(`--valid-from <valid-from>`, ``)
  .option(`--valid-until <valid-until>`, ``)
  .option(`--variable-defaults [variable-defaults...]`, ``)
  .option(`--variables [variables...]`, ``)
  .option(`--whatsapp-category <whatsapp-category>`, `Recategorising is allowed and takes effect on the next send: Meta
move templates between categories on their own schedule, and a
row that could not follow them would go on quoting a price that
stopped being true.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, bodyHtml, bodyText, contentSid, design, enabled, layoutId, markets, messageClass, subject, testMode, title, validFrom, validUntil, variableDefaults, variables, whatsappCategory } = await promptForMissing(
          _options,
          templateUpdatePatchSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/templates/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (bodyHtml !== undefined) {
          _payload[`body_html`] = bodyHtml;
        }
        if (bodyText !== undefined) {
          _payload[`body_text`] = bodyText;
        }
        if (contentSid !== undefined) {
          _payload[`content_sid`] = contentSid;
        }
        if (design !== undefined) {
          _payload[`design`] = design;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (layoutId !== undefined) {
          _payload[`layout_id`] = layoutId;
        }
        if (markets !== undefined) {
          _payload[`markets`] = markets;
        }
        if (messageClass !== undefined) {
          _payload[`message_class`] = messageClass;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
        }
        if (testMode !== undefined) {
          _payload[`test_mode`] = testMode;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (validFrom !== undefined) {
          _payload[`valid_from`] = validFrom;
        }
        if (validUntil !== undefined) {
          _payload[`valid_until`] = validUntil;
        }
        if (variableDefaults !== undefined) {
          _payload[`variable_defaults`] = variableDefaults;
        }
        if (variables !== undefined) {
          _payload[`variables`] = variables;
        }
        if (whatsappCategory !== undefined) {
          _payload[`whatsapp_category`] = whatsappCategory;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(messaging.commands.at(-1)!, templateUpdatePatchSpecs, { method: "patch" });
const templateUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/messaging/templates", hasLimit: false } },
  { key: "bodyHtml", option: "--body-html <body-html>", name: "body_html", type: "string", required: false },
  { key: "bodyText", option: "--body-text <body-text>", name: "body_text", type: "string", required: false },
  { key: "contentSid", option: "--content-sid <content-sid>", name: "content_sid", type: "string", required: false },
  { key: "design", option: "--design [design...]", name: "design", type: "array", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", type: "boolean", required: false },
  { key: "layoutId", option: "--layout-id <layout-id>", name: "layout_id", type: "string", required: false },
  { key: "markets", option: "--markets [markets...]", name: "markets", type: "array", required: false },
  { key: "messageClass", option: "--message-class <message-class>", name: "message_class", type: "string", required: false, enum: ["transactional","marketing"] },
  { key: "subject", option: "--subject <subject>", name: "subject", type: "string", required: false },
  { key: "testMode", option: "--test-mode <test-mode>", name: "test_mode", description: "When this template is in force — see App\\Models\\Template. `after_or_equal` and not `after`: a window of a single instant is\na legitimate thing to write while somebody is lining two\ntemplates up back to back, and rejecting it would only make them\nadd a second nobody can see. A window that runs BACKWARDS is\nrefused, because it is a template that can never send and looks\nfrom the list exactly like one that can.", type: "boolean", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "Reclassifying is allowed and changes nothing that already went\nout: `messages.message_class` was copied onto each row at\ndispatch, so the log keeps saying what each message was.", type: "string", required: false },
  { key: "validFrom", option: "--valid-from <valid-from>", name: "valid_from", type: "string", required: false },
  { key: "validUntil", option: "--valid-until <valid-until>", name: "valid_until", type: "string", required: false },
  { key: "variableDefaults", option: "--variable-defaults [variable-defaults...]", name: "variable_defaults", type: "array", required: false },
  { key: "variables", option: "--variables [variables...]", name: "variables", type: "array", required: false },
  { key: "whatsappCategory", option: "--whatsapp-category <whatsapp-category>", name: "whatsapp_category", description: "Recategorising is allowed and takes effect on the next send: Meta\nmove templates between categories on their own schedule, and a\nrow that could not follow them would go on quoting a price that\nstopped being true.", type: "string", required: false, enum: ["marketing","utility","authentication","service"] },
];
messaging
  .command(`template-update`)
  .description(`Only the fields sent are written, and the change is audited only when
something actually changed — a PATCH that resent the same values records
nothing, because an audit line on every save teaches its readers to
ignore the log.

Moving a template to another layout recompiles it against the NEW one,
even when nothing else changed: colours, width and font come from the
layout and are already inlined, so a template that merely changed hands
would otherwise keep showing the old letterhead until somebody happened
to press save on it again.

Changes nothing customers receive until the template is published.

This path answers on \`PUT\` and \`PATCH\`, both routed to the same action.`)
  .option(`--id <id>`, ``)
  .option(`--body-html <body-html>`, ``)
  .option(`--body-text <body-text>`, ``)
  .option(`--content-sid <content-sid>`, ``)
  .option(`--design [design...]`, ``)
  .option(
    `--enabled [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--layout-id <layout-id>`, ``)
  .option(`--markets [markets...]`, ``)
  .option(`--message-class <message-class>`, ``)
  .option(`--subject <subject>`, ``)
  .option(
    `--test-mode [value]`,
    `When this template is in force — see App\\Models\\Template. \`after_or_equal\` and not \`after\`: a window of a single instant is
a legitimate thing to write while somebody is lining two
templates up back to back, and rejecting it would only make them
add a second nobody can see. A window that runs BACKWARDS is
refused, because it is a template that can never send and looks
from the list exactly like one that can.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--title <title>`, `Reclassifying is allowed and changes nothing that already went
out: \`messages.message_class\` was copied onto each row at
dispatch, so the log keeps saying what each message was.`)
  .option(`--valid-from <valid-from>`, ``)
  .option(`--valid-until <valid-until>`, ``)
  .option(`--variable-defaults [variable-defaults...]`, ``)
  .option(`--variables [variables...]`, ``)
  .option(`--whatsapp-category <whatsapp-category>`, `Recategorising is allowed and takes effect on the next send: Meta
move templates between categories on their own schedule, and a
row that could not follow them would go on quoting a price that
stopped being true.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, bodyHtml, bodyText, contentSid, design, enabled, layoutId, markets, messageClass, subject, testMode, title, validFrom, validUntil, variableDefaults, variables, whatsappCategory } = await promptForMissing(
          _options,
          templateUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/templates/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (bodyHtml !== undefined) {
          _payload[`body_html`] = bodyHtml;
        }
        if (bodyText !== undefined) {
          _payload[`body_text`] = bodyText;
        }
        if (contentSid !== undefined) {
          _payload[`content_sid`] = contentSid;
        }
        if (design !== undefined) {
          _payload[`design`] = design;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (layoutId !== undefined) {
          _payload[`layout_id`] = layoutId;
        }
        if (markets !== undefined) {
          _payload[`markets`] = markets;
        }
        if (messageClass !== undefined) {
          _payload[`message_class`] = messageClass;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
        }
        if (testMode !== undefined) {
          _payload[`test_mode`] = testMode;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (validFrom !== undefined) {
          _payload[`valid_from`] = validFrom;
        }
        if (validUntil !== undefined) {
          _payload[`valid_until`] = validUntil;
        }
        if (variableDefaults !== undefined) {
          _payload[`variable_defaults`] = variableDefaults;
        }
        if (variables !== undefined) {
          _payload[`variables`] = variables;
        }
        if (whatsappCategory !== undefined) {
          _payload[`whatsapp_category`] = whatsappCategory;
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
registerPromptSpecs(messaging.commands.at(-1)!, templateUpdateSpecs, { method: "put" });
const templateVersionStoreSpecs: PromptSpec[] = [
  { key: "templateId", option: "--template-id <template-id>", name: "templateId", type: "string", required: true, resource: { listPath: "/messaging/templates", hasLimit: false } },
  { key: "note", option: "--note <note>", name: "note", type: "string", required: false },
];
messaging
  .command(`template-version-store`)
  .description(`Answers 200 with the version already live when there was nothing to
publish, and 201 when a new one was written — so a client can tell
whether its press did anything without diffing the payload.`)
  .option(`--template-id <template-id>`, ``)
  .option(`--note <note>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { templateId, note } = await promptForMissing(
          _options,
          templateVersionStoreSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/templates/{templateId}/publish`.replace(`{templateId}`, templateId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (note !== undefined) {
          _payload[`note`] = note;
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
registerPromptSpecs(messaging.commands.at(-1)!, templateVersionStoreSpecs, { method: "post" });
const templateVersionIndexSpecs: PromptSpec[] = [
  { key: "templateId", option: "--template-id <template-id>", name: "templateId", type: "string", required: true, resource: { listPath: "/messaging/templates", hasLimit: false } },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`template-version-index`)
  .description(`Summaries only: version, subject, message class, layout, who published it
and when, and their note. The BODIES are deliberately absent — a compiled
\`body_html\` runs to tens of kilobytes, and a template with forty versions
would make this a several-megabyte download that nobody scrolls to the
end of. \`GET /v1/templates/{id}/versions/{version}\` serves the full
snapshot for the one somebody actually opened.

\`meta.published_version_id\` says which of them is live — a property of
the template, said once, rather than a flag repeated on every row that
two rows could then claim. \`meta.has_unpublished_changes\` says whether
the draft has moved on since.`)
  .option(`--template-id <template-id>`, ``)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { templateId, filter } = await promptForMissing(
          _options,
          templateVersionIndexSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/templates/{templateId}/versions`.replace(`{templateId}`, templateId);
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
registerPromptSpecs(messaging.commands.at(-1)!, templateVersionIndexSpecs, { method: "get" });
const templateVersionShowSpecs: PromptSpec[] = [
  { key: "templateId", option: "--template-id <template-id>", name: "templateId", type: "string", required: true, resource: { listPath: "/messaging/templates", hasLimit: false } },
  { key: "version", option: "--version <version>", name: "version", type: "string", required: true, resource: { listPath: "/messaging/templates/{templateId}/versions", hasLimit: false } },
];
messaging
  .command(`template-version-show`)
  .description(`Addressed by its VERSION NUMBER — the small integer on the history row,
not the snapshot's id — because that is the number an author has in front
of them.

This is what sends actually rendered while that version was live, so it
is the thing to read when the question is "what did the mail we sent in
     * March say".`)
  .option(`--template-id <template-id>`, ``)
  .option(`--version <version>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { templateId, version } = await promptForMissing(
          _options,
          templateVersionShowSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/templates/{templateId}/versions/{version}`.replace(`{templateId}`, templateId).replace(`{version}`, version);
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
registerPromptSpecs(messaging.commands.at(-1)!, templateVersionShowSpecs, { method: "get" });
const templateVersionRestoreSpecs: PromptSpec[] = [
  { key: "templateId", option: "--template-id <template-id>", name: "templateId", type: "string", required: true, resource: { listPath: "/messaging/templates", hasLimit: false } },
  { key: "version", option: "--version <version>", name: "version", type: "string", required: true, resource: { listPath: "/messaging/templates/{templateId}/versions", hasLimit: false } },
  { key: "publish", option: "--publish <publish>", name: "publish", type: "boolean", required: false },
];
messaging
  .command(`template-version-restore`)
  .description(`\`publish: true\` makes it live in the same transaction — see
TemplatePublisher::restore for why that flag exists rather than asking
the caller for a second round trip.`)
  .option(`--template-id <template-id>`, ``)
  .option(`--version <version>`, ``)
  .option(
    `--publish [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { templateId, version, publish } = await promptForMissing(
          _options,
          templateVersionRestoreSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/templates/{templateId}/versions/{version}/restore`.replace(`{templateId}`, templateId).replace(`{version}`, version);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (publish !== undefined) {
          _payload[`publish`] = publish;
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
registerPromptSpecs(messaging.commands.at(-1)!, templateVersionRestoreSpecs, { method: "post" });
