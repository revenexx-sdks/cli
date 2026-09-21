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

export const punchout = new Command("punchout")
  .description(
    commandDescriptions["punchout"] ??
      `Commerce Studio Punchout App — the punchout session and nothing else (ADR-0001). Owns punchout accounts (credentials, protocol, channel, behaviour), sessions (state, return address, resolved buyer, the cart they name), field mappings and transfer records. Speaks OCI, cXML and IDS 2.5 as three protocol adapters over one session core. The buyer shops on the ordinary storefront as an ordinary contact; a hand-back records a transfer, creates no order and reserves no stock. Ports IntelliShop V8 module-punch-out and module-ids.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const accountsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
punchout
  .command(`accounts-list`)
  .description(`List punchout accounts — filter by column, paginate with limit/offset/order`)
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
          accountsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/accounts`;
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
registerPromptSpecs(punchout.commands.at(-1)!, accountsListSpecs, { method: "get" });
const accountsCreateSpecs: PromptSpec[] = [
  { key: "channelCode", option: "--channel-code <channel-code>", name: "channel_code", type: "string", required: true },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "protocol", option: "--protocol <protocol>", name: "protocol", type: "string", required: true },
  { key: "authStrategy", option: "--auth-strategy <auth-strategy>", name: "auth_strategy", type: "string", required: false },
  { key: "behaviour", option: "--behaviour <behaviour>", name: "behaviour", type: "object", required: false },
  { key: "credentialDomain", option: "--credential-domain <credential-domain>", name: "credential_domain", type: "string", required: false },
  { key: "credentialIdentity", option: "--credential-identity <credential-identity>", name: "credential_identity", type: "string", required: false },
  { key: "credentialSecret", option: "--credential-secret <credential-secret>", name: "credential_secret", type: "string", required: false, secret: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", type: "boolean", required: false },
  { key: "fallbackContactId", option: "--fallback-contact-id <fallback-contact-id>", name: "fallback_contact_id", type: "string", required: false },
  { key: "idsCustomerName", option: "--ids-customer-name <ids-customer-name>", name: "ids_customer_name", type: "string", required: false },
  { key: "loginToken", option: "--login-token <login-token>", name: "login_token", type: "string", required: false, secret: true },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", type: "string", required: false },
  { key: "protocolVersion", option: "--protocol-version <protocol-version>", name: "protocol_version", type: "string", required: false },
  { key: "secureOci", option: "--secure-oci <secure-oci>", name: "secure_oci", type: "boolean", required: false },
  { key: "sessionTtlMinutes", option: "--session-ttl-minutes <session-ttl-minutes>", name: "session_ttl_minutes", type: "integer", required: false },
  { key: "sharedSecret", option: "--shared-secret <shared-secret>", name: "shared_secret", type: "string", required: false, secret: true },
  { key: "startPageUrl", option: "--start-page-url <start-page-url>", name: "start_page_url", type: "string", required: false },
  { key: "unknownUserPolicy", option: "--unknown-user-policy <unknown-user-policy>", name: "unknown_user_policy", type: "string", required: false },
  { key: "urlThreading", option: "--url-threading <url-threading>", name: "url_threading", type: "boolean", required: false },
];
punchout
  .command(`accounts-create`)
  .description(`Create a punchout account`)
  .option(`--channel-code <channel-code>`, ``)
  .option(`--code <code>`, ``)
  .option(`--name <name>`, ``)
  .option(`--protocol <protocol>`, ``)
  .option(`--auth-strategy <auth-strategy>`, ``)
  .option(`--behaviour <behaviour>`, ``)
  .option(`--credential-domain <credential-domain>`, ``)
  .option(`--credential-identity <credential-identity>`, ``)
  .option(`--credential-secret <credential-secret>`, ``)
  .option(
    `--enabled [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--fallback-contact-id <fallback-contact-id>`, ``)
  .option(`--ids-customer-name <ids-customer-name>`, ``)
  .option(`--login-token <login-token>`, ``)
  .option(`--organization-id <organization-id>`, ``)
  .option(`--protocol-version <protocol-version>`, ``)
  .option(
    `--secure-oci [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--session-ttl-minutes <session-ttl-minutes>`, ``, parseInteger)
  .option(`--shared-secret <shared-secret>`, ``)
  .option(`--start-page-url <start-page-url>`, ``)
  .option(`--unknown-user-policy <unknown-user-policy>`, ``)
  .option(
    `--url-threading [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channelCode, code, name, protocol, authStrategy, behaviour, credentialDomain, credentialIdentity, credentialSecret, enabled, fallbackContactId, idsCustomerName, loginToken, organizationId, protocolVersion, secureOci, sessionTtlMinutes, sharedSecret, startPageUrl, unknownUserPolicy, urlThreading } = await promptForMissing(
          _options,
          accountsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/accounts`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (authStrategy !== undefined) {
          _payload[`auth_strategy`] = authStrategy;
        }
        if (behaviour !== undefined) {
          _payload[`behaviour`] = resolveBodyParam(behaviour);
        }
        if (channelCode !== undefined) {
          _payload[`channel_code`] = channelCode;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (credentialDomain !== undefined) {
          _payload[`credential_domain`] = credentialDomain;
        }
        if (credentialIdentity !== undefined) {
          _payload[`credential_identity`] = credentialIdentity;
        }
        if (credentialSecret !== undefined) {
          _payload[`credential_secret`] = credentialSecret;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (fallbackContactId !== undefined) {
          _payload[`fallback_contact_id`] = fallbackContactId;
        }
        if (idsCustomerName !== undefined) {
          _payload[`ids_customer_name`] = idsCustomerName;
        }
        if (loginToken !== undefined) {
          _payload[`login_token`] = loginToken;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (protocol !== undefined) {
          _payload[`protocol`] = protocol;
        }
        if (protocolVersion !== undefined) {
          _payload[`protocol_version`] = protocolVersion;
        }
        if (secureOci !== undefined) {
          _payload[`secure_oci`] = secureOci;
        }
        if (sessionTtlMinutes !== undefined) {
          _payload[`session_ttl_minutes`] = sessionTtlMinutes;
        }
        if (sharedSecret !== undefined) {
          _payload[`shared_secret`] = sharedSecret;
        }
        if (startPageUrl !== undefined) {
          _payload[`start_page_url`] = startPageUrl;
        }
        if (unknownUserPolicy !== undefined) {
          _payload[`unknown_user_policy`] = unknownUserPolicy;
        }
        if (urlThreading !== undefined) {
          _payload[`url_threading`] = urlThreading;
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
registerPromptSpecs(punchout.commands.at(-1)!, accountsCreateSpecs, { method: "post" });
const accountsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/punchout/accounts", hasLimit: true } },
];
punchout
  .command(`accounts-delete`)
  .description(`Delete a punchout account by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          accountsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`punchout accounts-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/punchout/accounts/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(punchout.commands.at(-1)!, accountsDeleteSpecs, { method: "delete", destructive: true });
const accountsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/punchout/accounts", hasLimit: true } },
];
punchout
  .command(`accounts-get`)
  .description(`Read one punchout account by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          accountsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/accounts/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(punchout.commands.at(-1)!, accountsGetSpecs, { method: "get" });
const accountsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/punchout/accounts", hasLimit: true } },
  { key: "authStrategy", option: "--auth-strategy <auth-strategy>", name: "auth_strategy", type: "string", required: false },
  { key: "behaviour", option: "--behaviour <behaviour>", name: "behaviour", type: "object", required: false },
  { key: "channelCode", option: "--channel-code <channel-code>", name: "channel_code", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: false },
  { key: "credentialDomain", option: "--credential-domain <credential-domain>", name: "credential_domain", type: "string", required: false },
  { key: "credentialIdentity", option: "--credential-identity <credential-identity>", name: "credential_identity", type: "string", required: false },
  { key: "credentialSecret", option: "--credential-secret <credential-secret>", name: "credential_secret", type: "string", required: false, secret: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", type: "boolean", required: false },
  { key: "fallbackContactId", option: "--fallback-contact-id <fallback-contact-id>", name: "fallback_contact_id", type: "string", required: false },
  { key: "idsCustomerName", option: "--ids-customer-name <ids-customer-name>", name: "ids_customer_name", type: "string", required: false },
  { key: "loginToken", option: "--login-token <login-token>", name: "login_token", type: "string", required: false, secret: true },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", type: "string", required: false },
  { key: "protocol", option: "--protocol <protocol>", name: "protocol", type: "string", required: false },
  { key: "protocolVersion", option: "--protocol-version <protocol-version>", name: "protocol_version", type: "string", required: false },
  { key: "secureOci", option: "--secure-oci <secure-oci>", name: "secure_oci", type: "boolean", required: false },
  { key: "sessionTtlMinutes", option: "--session-ttl-minutes <session-ttl-minutes>", name: "session_ttl_minutes", type: "integer", required: false },
  { key: "sharedSecret", option: "--shared-secret <shared-secret>", name: "shared_secret", type: "string", required: false, secret: true },
  { key: "startPageUrl", option: "--start-page-url <start-page-url>", name: "start_page_url", type: "string", required: false },
  { key: "unknownUserPolicy", option: "--unknown-user-policy <unknown-user-policy>", name: "unknown_user_policy", type: "string", required: false },
  { key: "urlThreading", option: "--url-threading <url-threading>", name: "url_threading", type: "boolean", required: false },
];
punchout
  .command(`accounts-update`)
  .description(`Update a punchout account by id — send only the fields that change`)
  .option(`--id <id>`, ``)
  .option(`--auth-strategy <auth-strategy>`, ``)
  .option(`--behaviour <behaviour>`, ``)
  .option(`--channel-code <channel-code>`, ``)
  .option(`--code <code>`, ``)
  .option(`--credential-domain <credential-domain>`, ``)
  .option(`--credential-identity <credential-identity>`, ``)
  .option(`--credential-secret <credential-secret>`, ``)
  .option(
    `--enabled [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--fallback-contact-id <fallback-contact-id>`, ``)
  .option(`--ids-customer-name <ids-customer-name>`, ``)
  .option(`--login-token <login-token>`, ``)
  .option(`--name <name>`, ``)
  .option(`--organization-id <organization-id>`, ``)
  .option(`--protocol <protocol>`, ``)
  .option(`--protocol-version <protocol-version>`, ``)
  .option(
    `--secure-oci [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--session-ttl-minutes <session-ttl-minutes>`, ``, parseInteger)
  .option(`--shared-secret <shared-secret>`, ``)
  .option(`--start-page-url <start-page-url>`, ``)
  .option(`--unknown-user-policy <unknown-user-policy>`, ``)
  .option(
    `--url-threading [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, authStrategy, behaviour, channelCode, code, credentialDomain, credentialIdentity, credentialSecret, enabled, fallbackContactId, idsCustomerName, loginToken, name, organizationId, protocol, protocolVersion, secureOci, sessionTtlMinutes, sharedSecret, startPageUrl, unknownUserPolicy, urlThreading } = await promptForMissing(
          _options,
          accountsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/accounts/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (authStrategy !== undefined) {
          _payload[`auth_strategy`] = authStrategy;
        }
        if (behaviour !== undefined) {
          _payload[`behaviour`] = resolveBodyParam(behaviour);
        }
        if (channelCode !== undefined) {
          _payload[`channel_code`] = channelCode;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (credentialDomain !== undefined) {
          _payload[`credential_domain`] = credentialDomain;
        }
        if (credentialIdentity !== undefined) {
          _payload[`credential_identity`] = credentialIdentity;
        }
        if (credentialSecret !== undefined) {
          _payload[`credential_secret`] = credentialSecret;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (fallbackContactId !== undefined) {
          _payload[`fallback_contact_id`] = fallbackContactId;
        }
        if (idsCustomerName !== undefined) {
          _payload[`ids_customer_name`] = idsCustomerName;
        }
        if (loginToken !== undefined) {
          _payload[`login_token`] = loginToken;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (protocol !== undefined) {
          _payload[`protocol`] = protocol;
        }
        if (protocolVersion !== undefined) {
          _payload[`protocol_version`] = protocolVersion;
        }
        if (secureOci !== undefined) {
          _payload[`secure_oci`] = secureOci;
        }
        if (sessionTtlMinutes !== undefined) {
          _payload[`session_ttl_minutes`] = sessionTtlMinutes;
        }
        if (sharedSecret !== undefined) {
          _payload[`shared_secret`] = sharedSecret;
        }
        if (startPageUrl !== undefined) {
          _payload[`start_page_url`] = startPageUrl;
        }
        if (unknownUserPolicy !== undefined) {
          _payload[`unknown_user_policy`] = unknownUserPolicy;
        }
        if (urlThreading !== undefined) {
          _payload[`url_threading`] = urlThreading;
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
registerPromptSpecs(punchout.commands.at(-1)!, accountsUpdateSpecs, { method: "put" });
const accountsPreviewSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/punchout/accounts", hasLimit: true } },
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "The cart to produce the payload for — already priced, the way a hand-back reads one.", type: "string", required: true },
];
punchout
  .command(`accounts-preview`)
  .description(`What a buyer's system would receive, before a buyer is in the shop: the account's mappings run over a cart that exists, through the same production code a real hand-back runs, and the field set or the document that comes out. Writes nothing — no visit, no transfer, no correlation key kept — and posts nothing. \`mapping\` says which mappings produced nothing and why, because a field the document deliberately leaves out reads exactly like one whose source resolved to nothing and only one of the two is a fault.`)
  .option(`--id <id>`, ``)
  .option(`--cart-id <cart-id>`, `The cart to produce the payload for — already priced, the way a hand-back reads one.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, cartId } = await promptForMissing(
          _options,
          accountsPreviewSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/accounts/{id}/preview`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
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
registerPromptSpecs(punchout.commands.at(-1)!, accountsPreviewSpecs, { method: "post" });
const accountsProbeSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/punchout/accounts", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
punchout
  .command(`accounts-probe`)
  .description(`Punchout entry is served on the tenant's own storefront host and never by this app (adr/ADR-0002), so whether an account is reachable is a fact about somebody else's runtime — a per-DOMAIN fact, which no install-time check can see. The probe calls the account's own public entry address, carrying a single-use token this app's entry route echoes back, and records what it found: reachable, not_found, not_entry, wrong_host, tls, timeout, unreachable, unconfigured. Only the echo counts as reachable — a storefront that answers 200 with its own page for every unknown path is exactly the setup this exists to catch. The outcome, the address it was taken on and what came back are answered and kept on the account. Changing the entry URL retires the finding.`)
  .option(`--id <id>`, ``)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { id, body } = await promptForMissing(
          _options,
          accountsProbeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/accounts/{id}/probe`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (body !== undefined || cliConfig.data !== undefined) {
          Object.assign(_payload, resolveBodyParam(body ?? cliConfig.data));
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
registerPromptSpecs(punchout.commands.at(-1)!, accountsProbeSpecs, { method: "post" });
const accountsTestSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/punchout/accounts", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
punchout
  .command(`accounts-test`)
  .description(`The operator's way to tell "the ERP is configured wrong" from "we are broken", with no procurement system in the loop. Builds the entry call this account would receive — its own credentials, in the transport its standard uses — hands it to the same adapter an ERP reaches, and answers the status, the headers and the body the storefront would have written out, rather than a summary of them. It leaves nothing that acts: an entry call opens a visit, so the visit it opened is marked as the tester's and revoked before the answer goes back, its refusals do not count against the credential throttle, and it sends no action that imports a cart. It creates no cart and records no transfer.`)
  .option(`--id <id>`, ``)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { id, body } = await promptForMissing(
          _options,
          accountsTestSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/accounts/{id}/test`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (body !== undefined || cliConfig.data !== undefined) {
          Object.assign(_payload, resolveBodyParam(body ?? cliConfig.data));
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
registerPromptSpecs(punchout.commands.at(-1)!, accountsTestSpecs, { method: "post" });
const defaultsSpecs: PromptSpec[] = [
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
punchout
  .command(`defaults`)
  .description(`Seed this tenant's shipped defaults, idempotently — safe to call on every install and on every retry`)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { body } = await promptForMissing(
          _options,
          defaultsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/defaults`;
        const _payload: RequestParams = {};
        if (body !== undefined || cliConfig.data !== undefined) {
          Object.assign(_payload, resolveBodyParam(body ?? cliConfig.data));
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
registerPromptSpecs(punchout.commands.at(-1)!, defaultsSpecs, { method: "post" });
const entryRefusalsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
punchout
  .command(`entry-refusals-list`)
  .description(`List entry refusals — filter by column, paginate with limit/offset/order`)
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
          entryRefusalsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/entry-refusals`;
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
registerPromptSpecs(punchout.commands.at(-1)!, entryRefusalsListSpecs, { method: "get" });
const entryCxmlSpecs: PromptSpec[] = [
  { key: "accountCode", option: "--account-code <account-code>", name: "account_code", type: "string", required: true },
  { key: "method", option: "--method <method>", name: "method", description: "The method the external system used ('GET' for a typical OCI entry, 'POST' for cXML/IDS).", type: "string", required: true },
  { key: "bodyB64", option: "--body-b64 <body-b64>", name: "body_b64", description: "The raw request body, base64-encoded. Base64 because a cXML or IDS document must survive byte-for-byte — re-serialising it breaks signatures and encodings.", type: "string", required: false },
  { key: "clientIp", option: "--client-ip <client-ip>", name: "client_ip", description: "The external system's IP, for the session record and rate accounting.", type: "string", required: false },
  { key: "contentType", option: "--content-type <content-type>", name: "content_type", description: "The body content type as sent.", type: "string", required: false },
  { key: "headers", option: "--headers <headers>", name: "headers", description: "Request headers as sent, minus hop-by-hop and storefront session headers.", type: "object", required: false },
  { key: "query", option: "--query <query>", name: "query", description: "Query parameters as sent — OCI carries USERNAME/PASSWORD/HOOK_URL here.", type: "object", required: false },
];
punchout
  .command(`entry-cxml`)
  .description(`cXML PunchOutSetupRequest for the account named in the path. The answer must be the PunchOutSetupResponse itself, in the same HTTP response — which is the whole reason ADR-0002 exists. What authenticates is Sender/Credential, not From: in the usual shape a network hub has already verified the buyer and presents its OWN credential (§5.3.2.2). Direct PunchOut (§5.7) authenticates by MAC or client certificate and is not supported. A requisition is reopened with operation — create, edit and inspect are served, with the ERP sending the lines back in the request and inspect recorded as view-only; source is not. Reached from the tenant's storefront host, never from this app's own URL and never as a public gateway route — see adr/ADR-0002. The storefront pass-through forwards the ERP's request as the envelope above and returns this answer unchanged.`)
  .option(`--account-code <account-code>`, ``)
  .option(`--method <method>`, `The method the external system used ('GET' for a typical OCI entry, 'POST' for cXML/IDS).`)
  .option(`--body-b64 <body-b64>`, `The raw request body, base64-encoded. Base64 because a cXML or IDS document must survive byte-for-byte — re-serialising it breaks signatures and encodings.`)
  .option(`--client-ip <client-ip>`, `The external system's IP, for the session record and rate accounting.`)
  .option(`--content-type <content-type>`, `The body content type as sent.`)
  .option(`--headers <headers>`, `Request headers as sent, minus hop-by-hop and storefront session headers.`)
  .option(`--query <query>`, `Query parameters as sent — OCI carries USERNAME/PASSWORD/HOOK_URL here.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { accountCode, method, bodyB64, clientIp, contentType, headers, query } = await promptForMissing(
          _options,
          entryCxmlSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/entry/cxml/{account_code}`.replace(`{account_code}`, accountCode);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (bodyB64 !== undefined) {
          _payload[`body_b64`] = bodyB64;
        }
        if (clientIp !== undefined) {
          _payload[`client_ip`] = clientIp;
        }
        if (contentType !== undefined) {
          _payload[`content_type`] = contentType;
        }
        if (headers !== undefined) {
          _payload[`headers`] = resolveBodyParam(headers);
        }
        if (method !== undefined) {
          _payload[`method`] = method;
        }
        if (query !== undefined) {
          _payload[`query`] = resolveBodyParam(query);
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
registerPromptSpecs(punchout.commands.at(-1)!, entryCxmlSpecs, { method: "post" });
const entryIdsSpecs: PromptSpec[] = [
  { key: "method", option: "--method <method>", name: "method", description: "The method the external system used ('GET' for a typical OCI entry, 'POST' for cXML/IDS).", type: "string", required: true },
  { key: "bodyB64", option: "--body-b64 <body-b64>", name: "body_b64", description: "The raw request body, base64-encoded. Base64 because a cXML or IDS document must survive byte-for-byte — re-serialising it breaks signatures and encodings.", type: "string", required: false },
  { key: "clientIp", option: "--client-ip <client-ip>", name: "client_ip", description: "The external system's IP, for the session record and rate accounting.", type: "string", required: false },
  { key: "contentType", option: "--content-type <content-type>", name: "content_type", description: "The body content type as sent.", type: "string", required: false },
  { key: "headers", option: "--headers <headers>", name: "headers", description: "Request headers as sent, minus hop-by-hop and storefront session headers.", type: "object", required: false },
  { key: "query", option: "--query <query>", name: "query", description: "Query parameters as sent — OCI carries USERNAME/PASSWORD/HOOK_URL here.", type: "object", required: false },
];
punchout
  .command(`entry-ids`)
  .description(`IDS entry on one shared endpoint: the account is resolved from kndnr/name_kunde/pw_kunde in the body, because that is how IDS clients are configured. POST-only with multipart/form-data — the standard rules GET out because a cart does not fit in a query string (§5.1a) — and parameter names are lower-case single words. WKE (shop), ADL (one article), AS (a search) and WKS (a cart sent in, which always becomes a NEW cart) authenticate; LI and SV are answered BEFORE authentication, because the standard sends only the action code with them and they are what makes setup self-service. HLS, the heating-label list, is refused as not implemented rather than falling through to "come in and shop". Reached from the tenant's storefront host, never from this app's own URL and never as a public gateway route — see adr/ADR-0002. The storefront pass-through forwards the ERP's request as the envelope above and returns this answer unchanged.`)
  .option(`--method <method>`, `The method the external system used ('GET' for a typical OCI entry, 'POST' for cXML/IDS).`)
  .option(`--body-b64 <body-b64>`, `The raw request body, base64-encoded. Base64 because a cXML or IDS document must survive byte-for-byte — re-serialising it breaks signatures and encodings.`)
  .option(`--client-ip <client-ip>`, `The external system's IP, for the session record and rate accounting.`)
  .option(`--content-type <content-type>`, `The body content type as sent.`)
  .option(`--headers <headers>`, `Request headers as sent, minus hop-by-hop and storefront session headers.`)
  .option(`--query <query>`, `Query parameters as sent — OCI carries USERNAME/PASSWORD/HOOK_URL here.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { method, bodyB64, clientIp, contentType, headers, query } = await promptForMissing(
          _options,
          entryIdsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/entry/ids`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (bodyB64 !== undefined) {
          _payload[`body_b64`] = bodyB64;
        }
        if (clientIp !== undefined) {
          _payload[`client_ip`] = clientIp;
        }
        if (contentType !== undefined) {
          _payload[`content_type`] = contentType;
        }
        if (headers !== undefined) {
          _payload[`headers`] = resolveBodyParam(headers);
        }
        if (method !== undefined) {
          _payload[`method`] = method;
        }
        if (query !== undefined) {
          _payload[`query`] = resolveBodyParam(query);
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
registerPromptSpecs(punchout.commands.at(-1)!, entryIdsSpecs, { method: "post" });
const entryOciSpecs: PromptSpec[] = [
  { key: "accountCode", option: "--account-code <account-code>", name: "account_code", type: "string", required: true },
  { key: "method", option: "--method <method>", name: "method", description: "The method the external system used ('GET' for a typical OCI entry, 'POST' for cXML/IDS).", type: "string", required: true },
  { key: "bodyB64", option: "--body-b64 <body-b64>", name: "body_b64", description: "The raw request body, base64-encoded. Base64 because a cXML or IDS document must survive byte-for-byte — re-serialising it breaks signatures and encodings.", type: "string", required: false },
  { key: "clientIp", option: "--client-ip <client-ip>", name: "client_ip", description: "The external system's IP, for the session record and rate accounting.", type: "string", required: false },
  { key: "contentType", option: "--content-type <content-type>", name: "content_type", description: "The body content type as sent.", type: "string", required: false },
  { key: "headers", option: "--headers <headers>", name: "headers", description: "Request headers as sent, minus hop-by-hop and storefront session headers.", type: "object", required: false },
  { key: "query", option: "--query <query>", name: "query", description: "Query parameters as sent — OCI carries USERNAME/PASSWORD/HOOK_URL here.", type: "object", required: false },
];
punchout
  .command(`entry-oci`)
  .description(`OCI entry for the account named in the path — V8's externalIdentifier, so an existing ERP configuration migrates unchanged. Answers a 302 to the account's start page carrying the session handle, and nothing else: no credential and no sign-in secret ride in a redirect. FUNCTION is a closed upper-case set and only its ABSENCE means "let the buyer shop"; the Level 2 functions (DETAIL, VALIDATE, SOURCING, BACKGROUND_SEARCH, DOWNLOADJSON, DETAILADD, QUANTITYCHECK) answer 501 naming the one asked for, and an undefined one a 400 — neither counts against the credential throttle. This address also carries Secure OCI's two backend legs, INITIALIZE and RETRIEVEOCI, where the cart is FETCHED rather than posted. Reached from the tenant's storefront host, never from this app's own URL and never as a public gateway route — see adr/ADR-0002. The storefront pass-through forwards the ERP's request as the envelope above and returns this answer unchanged.`)
  .option(`--account-code <account-code>`, ``)
  .option(`--method <method>`, `The method the external system used ('GET' for a typical OCI entry, 'POST' for cXML/IDS).`)
  .option(`--body-b64 <body-b64>`, `The raw request body, base64-encoded. Base64 because a cXML or IDS document must survive byte-for-byte — re-serialising it breaks signatures and encodings.`)
  .option(`--client-ip <client-ip>`, `The external system's IP, for the session record and rate accounting.`)
  .option(`--content-type <content-type>`, `The body content type as sent.`)
  .option(`--headers <headers>`, `Request headers as sent, minus hop-by-hop and storefront session headers.`)
  .option(`--query <query>`, `Query parameters as sent — OCI carries USERNAME/PASSWORD/HOOK_URL here.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { accountCode, method, bodyB64, clientIp, contentType, headers, query } = await promptForMissing(
          _options,
          entryOciSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/entry/oci/{account_code}`.replace(`{account_code}`, accountCode);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (bodyB64 !== undefined) {
          _payload[`body_b64`] = bodyB64;
        }
        if (clientIp !== undefined) {
          _payload[`client_ip`] = clientIp;
        }
        if (contentType !== undefined) {
          _payload[`content_type`] = contentType;
        }
        if (headers !== undefined) {
          _payload[`headers`] = resolveBodyParam(headers);
        }
        if (method !== undefined) {
          _payload[`method`] = method;
        }
        if (query !== undefined) {
          _payload[`query`] = resolveBodyParam(query);
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
registerPromptSpecs(punchout.commands.at(-1)!, entryOciSpecs, { method: "post" });
const fieldMappingsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
punchout
  .command(`field-mappings-list`)
  .description(`List field mappings — filter by column, paginate with limit/offset/order`)
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
          fieldMappingsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/field-mappings`;
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
registerPromptSpecs(punchout.commands.at(-1)!, fieldMappingsListSpecs, { method: "get" });
const fieldMappingsCreateSpecs: PromptSpec[] = [
  { key: "protocol", option: "--protocol <protocol>", name: "protocol", type: "string", required: true },
  { key: "source", option: "--source <source>", name: "source", type: "string", required: true },
  { key: "target", option: "--target <target>", name: "target", type: "string", required: true },
  { key: "targetKind", option: "--target-kind <target-kind>", name: "target_kind", type: "string", required: true },
  { key: "accountId", option: "--account-id <account-id>", name: "account_id", type: "string", required: false },
  { key: "document", option: "--document <document>", name: "document", type: "string", required: false },
  { key: "emit", option: "--emit <emit>", name: "emit", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", type: "boolean", required: false },
  { key: "mutators", option: "--mutators <mutators>", name: "mutators", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "scope", option: "--scope <scope>", name: "scope", type: "string", required: false },
  { key: "sourceConfig", option: "--source-config <source-config>", name: "source_config", type: "object", required: false },
];
punchout
  .command(`field-mappings-create`)
  .description(`Create a field mapping`)
  .option(`--protocol <protocol>`, ``)
  .option(`--source <source>`, ``)
  .option(`--target <target>`, ``)
  .option(`--target-kind <target-kind>`, ``)
  .option(`--account-id <account-id>`, ``)
  .option(`--document <document>`, ``)
  .option(`--emit <emit>`, ``)
  .option(
    `--enabled [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--mutators <mutators>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--scope <scope>`, ``)
  .option(`--source-config <source-config>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { protocol, source, target, targetKind, accountId, document, emit, enabled, mutators, position, scope, sourceConfig } = await promptForMissing(
          _options,
          fieldMappingsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/field-mappings`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (accountId !== undefined) {
          _payload[`account_id`] = accountId;
        }
        if (document !== undefined) {
          _payload[`document`] = document;
        }
        if (emit !== undefined) {
          _payload[`emit`] = emit;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (mutators !== undefined) {
          _payload[`mutators`] = resolveBodyParam(mutators);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (protocol !== undefined) {
          _payload[`protocol`] = protocol;
        }
        if (scope !== undefined) {
          _payload[`scope`] = scope;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
        }
        if (sourceConfig !== undefined) {
          _payload[`source_config`] = resolveBodyParam(sourceConfig);
        }
        if (target !== undefined) {
          _payload[`target`] = target;
        }
        if (targetKind !== undefined) {
          _payload[`target_kind`] = targetKind;
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
registerPromptSpecs(punchout.commands.at(-1)!, fieldMappingsCreateSpecs, { method: "post" });
const fieldMappingsExportSpecs: PromptSpec[] = [
  { key: "accountId", option: "--account-id <account-id>", name: "account_id", description: "The account whose mappings are written out.", type: "string", required: true },
];
punchout
  .command(`field-mappings-export`)
  .description(`The inverse of the import, and what makes a configuration reviewable and restorable outside the editor — and diffable against the installation it came from. Not a perfect inverse, and it says so: a mapping whose source the old platform has no driver for is left out and named in \`dropped\`.`)
  .option(`--account-id <account-id>`, `The account whose mappings are written out.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { accountId } = await promptForMissing(
          _options,
          fieldMappingsExportSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/field-mappings/export`;
        const _payload: RequestParams = {};
        if (accountId !== undefined) {
          _payload[`account_id`] = accountId;
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
registerPromptSpecs(punchout.commands.at(-1)!, fieldMappingsExportSpecs, { method: "get" });
const fieldMappingsImportSpecs: PromptSpec[] = [
  { key: "accountId", option: "--account-id <account-id>", name: "account_id", description: "The account the configuration belongs to.", type: "string", required: true },
  { key: "configuration", option: "--configuration <configuration>", name: "configuration", description: "The configuration as the old platform stored it.", type: "object", required: true },
  { key: "protocol", option: "--protocol <protocol>", name: "protocol", description: "Optional, and only as a check: it has to be the protocol the account speaks. IDS has no configuration to carry over — the old platform held its document in code.", type: "string", required: false, enum: ["oci","cxml"] },
];
punchout
  .command(`field-mappings-import`)
  .description(`Takes a V8 \`field_mapping\` — the whole column, one protocol's sub-object, or what V8's own export action writes — and records it as mappings for one account. Idempotent on the record's own key (protocol, document, scope, target): re-importing a corrected configuration corrects the rows rather than adding beside them, which is what makes a migration rehearsable. A rule this vocabulary cannot express is NEVER stored and comes back in \`refused\` with the target it filled, the type it named and why; \`skipped\` names a group the old platform itself never read.`)
  .option(`--account-id <account-id>`, `The account the configuration belongs to.`)
  .option(`--configuration <configuration>`, `The configuration as the old platform stored it.`)
  .option(`--protocol <protocol>`, `Optional, and only as a check: it has to be the protocol the account speaks. IDS has no configuration to carry over — the old platform held its document in code.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { accountId, configuration, protocol } = await promptForMissing(
          _options,
          fieldMappingsImportSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/field-mappings/import`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (accountId !== undefined) {
          _payload[`account_id`] = accountId;
        }
        if (configuration !== undefined) {
          _payload[`configuration`] = resolveBodyParam(configuration);
        }
        if (protocol !== undefined) {
          _payload[`protocol`] = protocol;
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
registerPromptSpecs(punchout.commands.at(-1)!, fieldMappingsImportSpecs, { method: "post" });
const fieldMappingsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/punchout/field-mappings", hasLimit: true } },
];
punchout
  .command(`field-mappings-delete`)
  .description(`Delete a field mapping by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          fieldMappingsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`punchout field-mappings-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/punchout/field-mappings/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(punchout.commands.at(-1)!, fieldMappingsDeleteSpecs, { method: "delete", destructive: true });
const fieldMappingsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/punchout/field-mappings", hasLimit: true } },
];
punchout
  .command(`field-mappings-get`)
  .description(`Read one field mapping by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          fieldMappingsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/field-mappings/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(punchout.commands.at(-1)!, fieldMappingsGetSpecs, { method: "get" });
const fieldMappingsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/punchout/field-mappings", hasLimit: true } },
  { key: "accountId", option: "--account-id <account-id>", name: "account_id", type: "string", required: false },
  { key: "document", option: "--document <document>", name: "document", type: "string", required: false },
  { key: "emit", option: "--emit <emit>", name: "emit", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", type: "boolean", required: false },
  { key: "mutators", option: "--mutators <mutators>", name: "mutators", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "protocol", option: "--protocol <protocol>", name: "protocol", type: "string", required: false },
  { key: "scope", option: "--scope <scope>", name: "scope", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", type: "string", required: false },
  { key: "sourceConfig", option: "--source-config <source-config>", name: "source_config", type: "object", required: false },
  { key: "target", option: "--target <target>", name: "target", type: "string", required: false },
  { key: "targetKind", option: "--target-kind <target-kind>", name: "target_kind", type: "string", required: false },
];
punchout
  .command(`field-mappings-update`)
  .description(`Update a field mapping by id — send only the fields that change`)
  .option(`--id <id>`, ``)
  .option(`--account-id <account-id>`, ``)
  .option(`--document <document>`, ``)
  .option(`--emit <emit>`, ``)
  .option(
    `--enabled [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--mutators <mutators>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--protocol <protocol>`, ``)
  .option(`--scope <scope>`, ``)
  .option(`--source <source>`, ``)
  .option(`--source-config <source-config>`, ``)
  .option(`--target <target>`, ``)
  .option(`--target-kind <target-kind>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, accountId, document, emit, enabled, mutators, position, protocol, scope, source, sourceConfig, target, targetKind } = await promptForMissing(
          _options,
          fieldMappingsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/field-mappings/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (accountId !== undefined) {
          _payload[`account_id`] = accountId;
        }
        if (document !== undefined) {
          _payload[`document`] = document;
        }
        if (emit !== undefined) {
          _payload[`emit`] = emit;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (mutators !== undefined) {
          _payload[`mutators`] = resolveBodyParam(mutators);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (protocol !== undefined) {
          _payload[`protocol`] = protocol;
        }
        if (scope !== undefined) {
          _payload[`scope`] = scope;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
        }
        if (sourceConfig !== undefined) {
          _payload[`source_config`] = resolveBodyParam(sourceConfig);
        }
        if (target !== undefined) {
          _payload[`target`] = target;
        }
        if (targetKind !== undefined) {
          _payload[`target_kind`] = targetKind;
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
registerPromptSpecs(punchout.commands.at(-1)!, fieldMappingsUpdateSpecs, { method: "put" });
const sessionsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
punchout
  .command(`sessions-list`)
  .description(`List punchout sessions — filter by column, paginate with limit/offset/order`)
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
          sessionsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/sessions`;
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
registerPromptSpecs(punchout.commands.at(-1)!, sessionsListSpecs, { method: "get" });
const sessionsCreateSpecs: PromptSpec[] = [
  { key: "accountId", option: "--account-id <account-id>", name: "account_id", type: "string", required: true },
  { key: "channelCode", option: "--channel-code <channel-code>", name: "channel_code", type: "string", required: true },
  { key: "expiresAt", option: "--expires-at <expires-at>", name: "expires_at", type: "string", required: true },
  { key: "protocol", option: "--protocol <protocol>", name: "protocol", type: "string", required: true },
  { key: "psid", option: "--psid <psid>", name: "psid", type: "string", required: true },
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", type: "string", required: false },
  { key: "claimedAt", option: "--claimed-at <claimed-at>", name: "claimed_at", type: "string", required: false },
  { key: "closedReason", option: "--closed-reason <closed-reason>", name: "closed_reason", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "correlationKey", option: "--correlation-key <correlation-key>", name: "correlation_key", type: "string", required: false },
  { key: "entryAction", option: "--entry-action <entry-action>", name: "entry_action", type: "string", required: false },
  { key: "entryIntent", option: "--entry-intent <entry-intent>", name: "entry_intent", type: "object", required: false },
  { key: "entryPayload", option: "--entry-payload <entry-payload>", name: "entry_payload", type: "object", required: false },
  { key: "externalUserId", option: "--external-user-id <external-user-id>", name: "external_user_id", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", type: "string", required: false },
  { key: "origin", option: "--origin <origin>", name: "origin", type: "string", required: false },
  { key: "returnMethod", option: "--return-method <return-method>", name: "return_method", type: "string", required: false },
  { key: "returnUrl", option: "--return-url <return-url>", name: "return_url", type: "string", required: false },
  { key: "secureSessionId", option: "--secure-session-id <secure-session-id>", name: "secure_session_id", type: "string", required: false },
  { key: "secureSessionUsedAt", option: "--secure-session-used-at <secure-session-used-at>", name: "secure_session_used_at", type: "string", required: false },
  { key: "secureTransmissionId", option: "--secure-transmission-id <secure-transmission-id>", name: "secure_transmission_id", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", type: "string", required: false },
  { key: "transferredAt", option: "--transferred-at <transferred-at>", name: "transferred_at", type: "string", required: false },
];
punchout
  .command(`sessions-create`)
  .description(`Create a punchout session`)
  .option(`--account-id <account-id>`, ``)
  .option(`--channel-code <channel-code>`, ``)
  .option(`--expires-at <expires-at>`, ``)
  .option(`--protocol <protocol>`, ``)
  .option(`--psid <psid>`, ``)
  .option(`--cart-id <cart-id>`, ``)
  .option(`--claimed-at <claimed-at>`, ``)
  .option(`--closed-reason <closed-reason>`, ``)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--correlation-key <correlation-key>`, ``)
  .option(`--entry-action <entry-action>`, ``)
  .option(`--entry-intent <entry-intent>`, ``)
  .option(`--entry-payload <entry-payload>`, ``)
  .option(`--external-user-id <external-user-id>`, ``)
  .option(`--organization-id <organization-id>`, ``)
  .option(`--origin <origin>`, ``)
  .option(`--return-method <return-method>`, ``)
  .option(`--return-url <return-url>`, ``)
  .option(`--secure-session-id <secure-session-id>`, ``)
  .option(`--secure-session-used-at <secure-session-used-at>`, ``)
  .option(`--secure-transmission-id <secure-transmission-id>`, ``)
  .option(`--status <status>`, ``)
  .option(`--transferred-at <transferred-at>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { accountId, channelCode, expiresAt, protocol, psid, cartId, claimedAt, closedReason, contactId, correlationKey, entryAction, entryIntent, entryPayload, externalUserId, organizationId, origin, returnMethod, returnUrl, secureSessionId, secureSessionUsedAt, secureTransmissionId, status, transferredAt } = await promptForMissing(
          _options,
          sessionsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/sessions`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (accountId !== undefined) {
          _payload[`account_id`] = accountId;
        }
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
        }
        if (channelCode !== undefined) {
          _payload[`channel_code`] = channelCode;
        }
        if (claimedAt !== undefined) {
          _payload[`claimed_at`] = claimedAt;
        }
        if (closedReason !== undefined) {
          _payload[`closed_reason`] = closedReason;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (correlationKey !== undefined) {
          _payload[`correlation_key`] = correlationKey;
        }
        if (entryAction !== undefined) {
          _payload[`entry_action`] = entryAction;
        }
        if (entryIntent !== undefined) {
          _payload[`entry_intent`] = resolveBodyParam(entryIntent);
        }
        if (entryPayload !== undefined) {
          _payload[`entry_payload`] = resolveBodyParam(entryPayload);
        }
        if (expiresAt !== undefined) {
          _payload[`expires_at`] = expiresAt;
        }
        if (externalUserId !== undefined) {
          _payload[`external_user_id`] = externalUserId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (origin !== undefined) {
          _payload[`origin`] = origin;
        }
        if (protocol !== undefined) {
          _payload[`protocol`] = protocol;
        }
        if (psid !== undefined) {
          _payload[`psid`] = psid;
        }
        if (returnMethod !== undefined) {
          _payload[`return_method`] = returnMethod;
        }
        if (returnUrl !== undefined) {
          _payload[`return_url`] = returnUrl;
        }
        if (secureSessionId !== undefined) {
          _payload[`secure_session_id`] = secureSessionId;
        }
        if (secureSessionUsedAt !== undefined) {
          _payload[`secure_session_used_at`] = secureSessionUsedAt;
        }
        if (secureTransmissionId !== undefined) {
          _payload[`secure_transmission_id`] = secureTransmissionId;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (transferredAt !== undefined) {
          _payload[`transferred_at`] = transferredAt;
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
registerPromptSpecs(punchout.commands.at(-1)!, sessionsCreateSpecs, { method: "post" });
const sessionsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/punchout/sessions", hasLimit: true } },
];
punchout
  .command(`sessions-delete`)
  .description(`Delete a punchout session by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          sessionsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`punchout sessions-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/punchout/sessions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(punchout.commands.at(-1)!, sessionsDeleteSpecs, { method: "delete", destructive: true });
const sessionsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/punchout/sessions", hasLimit: true } },
];
punchout
  .command(`sessions-get`)
  .description(`Read one punchout session by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          sessionsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/sessions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(punchout.commands.at(-1)!, sessionsGetSpecs, { method: "get" });
const sessionsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/punchout/sessions", hasLimit: true } },
  { key: "accountId", option: "--account-id <account-id>", name: "account_id", type: "string", required: false },
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", type: "string", required: false },
  { key: "channelCode", option: "--channel-code <channel-code>", name: "channel_code", type: "string", required: false },
  { key: "claimedAt", option: "--claimed-at <claimed-at>", name: "claimed_at", type: "string", required: false },
  { key: "closedReason", option: "--closed-reason <closed-reason>", name: "closed_reason", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "correlationKey", option: "--correlation-key <correlation-key>", name: "correlation_key", type: "string", required: false },
  { key: "entryAction", option: "--entry-action <entry-action>", name: "entry_action", type: "string", required: false },
  { key: "entryIntent", option: "--entry-intent <entry-intent>", name: "entry_intent", type: "object", required: false },
  { key: "entryPayload", option: "--entry-payload <entry-payload>", name: "entry_payload", type: "object", required: false },
  { key: "expiresAt", option: "--expires-at <expires-at>", name: "expires_at", type: "string", required: false },
  { key: "externalUserId", option: "--external-user-id <external-user-id>", name: "external_user_id", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", type: "string", required: false },
  { key: "origin", option: "--origin <origin>", name: "origin", type: "string", required: false },
  { key: "protocol", option: "--protocol <protocol>", name: "protocol", type: "string", required: false },
  { key: "psid", option: "--psid <psid>", name: "psid", type: "string", required: false },
  { key: "returnMethod", option: "--return-method <return-method>", name: "return_method", type: "string", required: false },
  { key: "returnUrl", option: "--return-url <return-url>", name: "return_url", type: "string", required: false },
  { key: "secureSessionId", option: "--secure-session-id <secure-session-id>", name: "secure_session_id", type: "string", required: false },
  { key: "secureSessionUsedAt", option: "--secure-session-used-at <secure-session-used-at>", name: "secure_session_used_at", type: "string", required: false },
  { key: "secureTransmissionId", option: "--secure-transmission-id <secure-transmission-id>", name: "secure_transmission_id", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", type: "string", required: false },
  { key: "transferredAt", option: "--transferred-at <transferred-at>", name: "transferred_at", type: "string", required: false },
];
punchout
  .command(`sessions-update`)
  .description(`Update a punchout session by id — send only the fields that change`)
  .option(`--id <id>`, ``)
  .option(`--account-id <account-id>`, ``)
  .option(`--cart-id <cart-id>`, ``)
  .option(`--channel-code <channel-code>`, ``)
  .option(`--claimed-at <claimed-at>`, ``)
  .option(`--closed-reason <closed-reason>`, ``)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--correlation-key <correlation-key>`, ``)
  .option(`--entry-action <entry-action>`, ``)
  .option(`--entry-intent <entry-intent>`, ``)
  .option(`--entry-payload <entry-payload>`, ``)
  .option(`--expires-at <expires-at>`, ``)
  .option(`--external-user-id <external-user-id>`, ``)
  .option(`--organization-id <organization-id>`, ``)
  .option(`--origin <origin>`, ``)
  .option(`--protocol <protocol>`, ``)
  .option(`--psid <psid>`, ``)
  .option(`--return-method <return-method>`, ``)
  .option(`--return-url <return-url>`, ``)
  .option(`--secure-session-id <secure-session-id>`, ``)
  .option(`--secure-session-used-at <secure-session-used-at>`, ``)
  .option(`--secure-transmission-id <secure-transmission-id>`, ``)
  .option(`--status <status>`, ``)
  .option(`--transferred-at <transferred-at>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, accountId, cartId, channelCode, claimedAt, closedReason, contactId, correlationKey, entryAction, entryIntent, entryPayload, expiresAt, externalUserId, organizationId, origin, protocol, psid, returnMethod, returnUrl, secureSessionId, secureSessionUsedAt, secureTransmissionId, status, transferredAt } = await promptForMissing(
          _options,
          sessionsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/sessions/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (accountId !== undefined) {
          _payload[`account_id`] = accountId;
        }
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
        }
        if (channelCode !== undefined) {
          _payload[`channel_code`] = channelCode;
        }
        if (claimedAt !== undefined) {
          _payload[`claimed_at`] = claimedAt;
        }
        if (closedReason !== undefined) {
          _payload[`closed_reason`] = closedReason;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (correlationKey !== undefined) {
          _payload[`correlation_key`] = correlationKey;
        }
        if (entryAction !== undefined) {
          _payload[`entry_action`] = entryAction;
        }
        if (entryIntent !== undefined) {
          _payload[`entry_intent`] = resolveBodyParam(entryIntent);
        }
        if (entryPayload !== undefined) {
          _payload[`entry_payload`] = resolveBodyParam(entryPayload);
        }
        if (expiresAt !== undefined) {
          _payload[`expires_at`] = expiresAt;
        }
        if (externalUserId !== undefined) {
          _payload[`external_user_id`] = externalUserId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (origin !== undefined) {
          _payload[`origin`] = origin;
        }
        if (protocol !== undefined) {
          _payload[`protocol`] = protocol;
        }
        if (psid !== undefined) {
          _payload[`psid`] = psid;
        }
        if (returnMethod !== undefined) {
          _payload[`return_method`] = returnMethod;
        }
        if (returnUrl !== undefined) {
          _payload[`return_url`] = returnUrl;
        }
        if (secureSessionId !== undefined) {
          _payload[`secure_session_id`] = secureSessionId;
        }
        if (secureSessionUsedAt !== undefined) {
          _payload[`secure_session_used_at`] = secureSessionUsedAt;
        }
        if (secureTransmissionId !== undefined) {
          _payload[`secure_transmission_id`] = secureTransmissionId;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (transferredAt !== undefined) {
          _payload[`transferred_at`] = transferredAt;
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
registerPromptSpecs(punchout.commands.at(-1)!, sessionsUpdateSpecs, { method: "put" });
const sessionsClaimSpecs: PromptSpec[] = [
  { key: "psid", option: "--psid <psid>", name: "psid", type: "string", required: true, resource: { listPath: "/punchout/sessions", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
punchout
  .command(`sessions-claim`)
  .description(`The start of a punchout visit in the shop. Resolves the buyer the external system named to an ordinary contact — the named one, else the account's fallback contact, else whatever the account's policy for an unknown name says — asks the app that owns buyer authentication to sign that contact in, and answers the secret together with the channel, the action and the cart the visit names. The secret is single-use and short-lived: redeem it server-side, and keep it out of a redirect URL, a browser history and a Referer. Answered exactly ONCE — the handle travelled through the external system in the clear. A second claim, an expired or revoked visit, one already handed back and a handle nobody minted all get the same answer, deliberately.`)
  .option(`--psid <psid>`, ``)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { psid, body } = await promptForMissing(
          _options,
          sessionsClaimSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/sessions/{psid}/claim`.replace(`{psid}`, psid);
        const _payload: RequestParams = {};
        if (body !== undefined || cliConfig.data !== undefined) {
          Object.assign(_payload, resolveBodyParam(body ?? cliConfig.data));
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
registerPromptSpecs(punchout.commands.at(-1)!, sessionsClaimSpecs, { method: "post" });
const sessionsReturnSpecs: PromptSpec[] = [
  { key: "psid", option: "--psid <psid>", name: "psid", type: "string", required: true, resource: { listPath: "/punchout/sessions", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
punchout
  .command(`sessions-return`)
  .description(`The end of a punchout visit. Answers where the cart goes, by which method and encoding, and the mapped fields to submit — one shape for all three protocols, whether that means dozens of named fields (OCI) or one field holding a whole document (cXML, IDS). The payload is ANSWERED, never posted from here: a request from this app carries none of the buyer's ERP session, and the protocols that expect a browser form post would reject it even if it did. Records a transfer with its normalised lines and the exact payload, mints a correlation key into that payload so an order arriving weeks later can be matched to it, and closes the visit as transferred. Creates NO order and reserves NO stock — the procurement system has decided nothing. A retried call answers the same payload and records no second transfer; a visit that expired or was revoked is refused, with the same answer a handle that never existed gets.`)
  .option(`--psid <psid>`, ``)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { psid, body } = await promptForMissing(
          _options,
          sessionsReturnSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/sessions/{psid}/return`.replace(`{psid}`, psid);
        const _payload: RequestParams = {};
        if (body !== undefined || cliConfig.data !== undefined) {
          Object.assign(_payload, resolveBodyParam(body ?? cliConfig.data));
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
registerPromptSpecs(punchout.commands.at(-1)!, sessionsReturnSpecs, { method: "post" });
const transferItemsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
punchout
  .command(`transfer-items-list`)
  .description(`List transfer lines — filter by column, paginate with limit/offset/order`)
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
          transferItemsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/transfer-items`;
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
registerPromptSpecs(punchout.commands.at(-1)!, transferItemsListSpecs, { method: "get" });
const transferItemsCreateSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", type: "number", required: true },
  { key: "transferId", option: "--transfer-id <transfer-id>", name: "transfer_id", type: "string", required: true },
  { key: "currency", option: "--currency <currency>", name: "currency", type: "string", required: false },
  { key: "externalRef", option: "--external-ref <external-ref>", name: "external_ref", type: "string", required: false },
  { key: "lineGross", option: "--line-gross <line-gross>", name: "line_gross", type: "number", required: false },
  { key: "lineNet", option: "--line-net <line-net>", name: "line_net", type: "number", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", type: "string", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", type: "string", required: false },
  { key: "taxRate", option: "--tax-rate <tax-rate>", name: "tax_rate", type: "number", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", type: "string", required: false },
  { key: "unitPrice", option: "--unit-price <unit-price>", name: "unit_price", type: "number", required: false },
];
punchout
  .command(`transfer-items-create`)
  .description(`Create a transfer line`)
  .option(`--name <name>`, ``)
  .option(`--quantity <quantity>`, ``, parseInteger)
  .option(`--transfer-id <transfer-id>`, ``)
  .option(`--currency <currency>`, ``)
  .option(`--external-ref <external-ref>`, ``)
  .option(`--line-gross <line-gross>`, ``, parseInteger)
  .option(`--line-net <line-net>`, ``, parseInteger)
  .option(`--metadata <metadata>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--product-id <product-id>`, ``)
  .option(`--sku <sku>`, ``)
  .option(`--tax-rate <tax-rate>`, ``, parseInteger)
  .option(`--unit <unit>`, ``)
  .option(`--unit-price <unit-price>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, quantity, transferId, currency, externalRef, lineGross, lineNet, metadata, position, productId, sku, taxRate, unit, unitPrice } = await promptForMissing(
          _options,
          transferItemsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/transfer-items`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (externalRef !== undefined) {
          _payload[`external_ref`] = externalRef;
        }
        if (lineGross !== undefined) {
          _payload[`line_gross`] = lineGross;
        }
        if (lineNet !== undefined) {
          _payload[`line_net`] = lineNet;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (taxRate !== undefined) {
          _payload[`tax_rate`] = taxRate;
        }
        if (transferId !== undefined) {
          _payload[`transfer_id`] = transferId;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
        }
        if (unitPrice !== undefined) {
          _payload[`unit_price`] = unitPrice;
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
registerPromptSpecs(punchout.commands.at(-1)!, transferItemsCreateSpecs, { method: "post" });
const transferItemsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/punchout/transfer-items", hasLimit: true } },
];
punchout
  .command(`transfer-items-get`)
  .description(`Read one transfer line by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          transferItemsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/transfer-items/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(punchout.commands.at(-1)!, transferItemsGetSpecs, { method: "get" });
const transfersListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
punchout
  .command(`transfers-list`)
  .description(`List transfers — filter by column, paginate with limit/offset/order`)
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
          transfersListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/transfers`;
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
registerPromptSpecs(punchout.commands.at(-1)!, transfersListSpecs, { method: "get" });
const transfersCreateSpecs: PromptSpec[] = [
  { key: "accountId", option: "--account-id <account-id>", name: "account_id", type: "string", required: true },
  { key: "correlationKey", option: "--correlation-key <correlation-key>", name: "correlation_key", type: "string", required: true },
  { key: "protocol", option: "--protocol <protocol>", name: "protocol", type: "string", required: true },
  { key: "sessionId", option: "--session-id <session-id>", name: "session_id", type: "string", required: true },
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", type: "string", required: false },
  { key: "itemCount", option: "--item-count <item-count>", name: "item_count", type: "integer", required: false },
  { key: "matchedAt", option: "--matched-at <matched-at>", name: "matched_at", type: "string", required: false },
  { key: "matchedOrderId", option: "--matched-order-id <matched-order-id>", name: "matched_order_id", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", type: "string", required: false },
  { key: "payload", option: "--payload <payload>", name: "payload", type: "object", required: false },
  { key: "targetUrl", option: "--target-url <target-url>", name: "target_url", type: "string", required: false },
  { key: "totalGross", option: "--total-gross <total-gross>", name: "total_gross", type: "number", required: false },
  { key: "totalNet", option: "--total-net <total-net>", name: "total_net", type: "number", required: false },
  { key: "transferredAt", option: "--transferred-at <transferred-at>", name: "transferred_at", type: "string", required: false },
];
punchout
  .command(`transfers-create`)
  .description(`Create a transfer`)
  .option(`--account-id <account-id>`, ``)
  .option(`--correlation-key <correlation-key>`, ``)
  .option(`--protocol <protocol>`, ``)
  .option(`--session-id <session-id>`, ``)
  .option(`--cart-id <cart-id>`, ``)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--currency <currency>`, ``)
  .option(`--item-count <item-count>`, ``, parseInteger)
  .option(`--matched-at <matched-at>`, ``)
  .option(`--matched-order-id <matched-order-id>`, ``)
  .option(`--organization-id <organization-id>`, ``)
  .option(`--payload <payload>`, ``)
  .option(`--target-url <target-url>`, ``)
  .option(`--total-gross <total-gross>`, ``, parseInteger)
  .option(`--total-net <total-net>`, ``, parseInteger)
  .option(`--transferred-at <transferred-at>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { accountId, correlationKey, protocol, sessionId, cartId, contactId, currency, itemCount, matchedAt, matchedOrderId, organizationId, payload, targetUrl, totalGross, totalNet, transferredAt } = await promptForMissing(
          _options,
          transfersCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/transfers`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (accountId !== undefined) {
          _payload[`account_id`] = accountId;
        }
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (correlationKey !== undefined) {
          _payload[`correlation_key`] = correlationKey;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (itemCount !== undefined) {
          _payload[`item_count`] = itemCount;
        }
        if (matchedAt !== undefined) {
          _payload[`matched_at`] = matchedAt;
        }
        if (matchedOrderId !== undefined) {
          _payload[`matched_order_id`] = matchedOrderId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (payload !== undefined) {
          _payload[`payload`] = resolveBodyParam(payload);
        }
        if (protocol !== undefined) {
          _payload[`protocol`] = protocol;
        }
        if (sessionId !== undefined) {
          _payload[`session_id`] = sessionId;
        }
        if (targetUrl !== undefined) {
          _payload[`target_url`] = targetUrl;
        }
        if (totalGross !== undefined) {
          _payload[`total_gross`] = totalGross;
        }
        if (totalNet !== undefined) {
          _payload[`total_net`] = totalNet;
        }
        if (transferredAt !== undefined) {
          _payload[`transferred_at`] = transferredAt;
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
registerPromptSpecs(punchout.commands.at(-1)!, transfersCreateSpecs, { method: "post" });
const transfersGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/punchout/transfers", hasLimit: true } },
];
punchout
  .command(`transfers-get`)
  .description(`Read one transfer by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          transfersGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/transfers/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(punchout.commands.at(-1)!, transfersGetSpecs, { method: "get" });
const transfersUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/punchout/transfers", hasLimit: true } },
  { key: "accountId", option: "--account-id <account-id>", name: "account_id", type: "string", required: false },
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "correlationKey", option: "--correlation-key <correlation-key>", name: "correlation_key", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", type: "string", required: false },
  { key: "itemCount", option: "--item-count <item-count>", name: "item_count", type: "integer", required: false },
  { key: "matchedAt", option: "--matched-at <matched-at>", name: "matched_at", type: "string", required: false },
  { key: "matchedOrderId", option: "--matched-order-id <matched-order-id>", name: "matched_order_id", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", type: "string", required: false },
  { key: "payload", option: "--payload <payload>", name: "payload", type: "object", required: false },
  { key: "protocol", option: "--protocol <protocol>", name: "protocol", type: "string", required: false },
  { key: "sessionId", option: "--session-id <session-id>", name: "session_id", type: "string", required: false },
  { key: "targetUrl", option: "--target-url <target-url>", name: "target_url", type: "string", required: false },
  { key: "totalGross", option: "--total-gross <total-gross>", name: "total_gross", type: "number", required: false },
  { key: "totalNet", option: "--total-net <total-net>", name: "total_net", type: "number", required: false },
  { key: "transferredAt", option: "--transferred-at <transferred-at>", name: "transferred_at", type: "string", required: false },
];
punchout
  .command(`transfers-update`)
  .description(`Update a transfer by id — send only the fields that change`)
  .option(`--id <id>`, ``)
  .option(`--account-id <account-id>`, ``)
  .option(`--cart-id <cart-id>`, ``)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--correlation-key <correlation-key>`, ``)
  .option(`--currency <currency>`, ``)
  .option(`--item-count <item-count>`, ``, parseInteger)
  .option(`--matched-at <matched-at>`, ``)
  .option(`--matched-order-id <matched-order-id>`, ``)
  .option(`--organization-id <organization-id>`, ``)
  .option(`--payload <payload>`, ``)
  .option(`--protocol <protocol>`, ``)
  .option(`--session-id <session-id>`, ``)
  .option(`--target-url <target-url>`, ``)
  .option(`--total-gross <total-gross>`, ``, parseInteger)
  .option(`--total-net <total-net>`, ``, parseInteger)
  .option(`--transferred-at <transferred-at>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, accountId, cartId, contactId, correlationKey, currency, itemCount, matchedAt, matchedOrderId, organizationId, payload, protocol, sessionId, targetUrl, totalGross, totalNet, transferredAt } = await promptForMissing(
          _options,
          transfersUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/transfers/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (accountId !== undefined) {
          _payload[`account_id`] = accountId;
        }
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (correlationKey !== undefined) {
          _payload[`correlation_key`] = correlationKey;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (itemCount !== undefined) {
          _payload[`item_count`] = itemCount;
        }
        if (matchedAt !== undefined) {
          _payload[`matched_at`] = matchedAt;
        }
        if (matchedOrderId !== undefined) {
          _payload[`matched_order_id`] = matchedOrderId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (payload !== undefined) {
          _payload[`payload`] = resolveBodyParam(payload);
        }
        if (protocol !== undefined) {
          _payload[`protocol`] = protocol;
        }
        if (sessionId !== undefined) {
          _payload[`session_id`] = sessionId;
        }
        if (targetUrl !== undefined) {
          _payload[`target_url`] = targetUrl;
        }
        if (totalGross !== undefined) {
          _payload[`total_gross`] = totalGross;
        }
        if (totalNet !== undefined) {
          _payload[`total_net`] = totalNet;
        }
        if (transferredAt !== undefined) {
          _payload[`transferred_at`] = transferredAt;
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
registerPromptSpecs(punchout.commands.at(-1)!, transfersUpdateSpecs, { method: "put" });
const vocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
punchout
  .command(`vocabularies-list`)
  .description(`Discovery for the vocabulary routes: the enums this app enforces, each with its name, its title and its description — and deliberately WITHOUT its values, so a UI can cache this one small answer and fetch only the value sets it renders. Names: entry-probe-outcome, mapping-mutators, mapping-sources. Fetch one with GET /punchout/vocabularies/{name}.`)
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
        const _apiPath = `/punchout/vocabularies`;
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
registerPromptSpecs(punchout.commands.at(-1)!, vocabulariesListSpecs, { method: "get" });
const vocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary name — the part after the dot in the qualified id.", type: "string", required: true, enum: ["entry-probe-outcome","mapping-mutators","mapping-sources"], resource: { listPath: "/punchout/vocabularies", hasLimit: false } },
];
punchout
  .command(`vocabularies-get`)
  .description(`One vocabulary in full: every permitted value with its title, its description and the badge tone a UI colours it with. The values are read out of the column's CHECK constraint, so the served set IS the set the database accepts and the set the mapping engine understands — a mapping editor offering anything else would produce silently empty fields. \`mapping-sources\` carries the 24 sources of ADR-0003 (three of them namespaced \`cxml.*\`, offered only for a cXML account) and \`mapping-mutators\` the 17 chainable mutators; each value's description names the config keys it reads and which of them are required. Answers 404 for an unknown name.`)
  .option(`--name <name>`, `The vocabulary name — the part after the dot in the qualified id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name } = await promptForMissing(
          _options,
          vocabulariesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/punchout/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(punchout.commands.at(-1)!, vocabulariesGetSpecs, { method: "get" });
