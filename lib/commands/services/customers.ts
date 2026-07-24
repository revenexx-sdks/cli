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

export const customers = new Command("customers")
  .description(
    commandDescriptions["customers"] ??
      `Manage customers resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const addressesListSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Filter to one owning contact.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Filter to one organization.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customers
  .command(`addresses-list`)
  .description(`List addresses (filter by column; paginate limit/offset/order)`)
  .option(`--contact-id <contact-id>`, `Filter to one owning contact.`)
  .option(`--organization-id <organization-id>`, `Filter to one organization.`)
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
        const { contactId, organizationId, limit, offset, order, filter } = await promptForMissing(
          _options,
          addressesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/addresses`;
        const _payload: RequestParams = {};
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
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
registerPromptSpecs(customers.commands.at(-1)!, addressesListSpecs, { method: "get" });
const addressesCreateSpecs: PromptSpec[] = [
  { key: "city", option: "--city <city>", name: "city", type: "string", required: true },
  { key: "country", option: "--country <country>", name: "country", description: "ISO 3166-1 alpha-2 code.", type: "string", required: true },
  { key: "street", option: "--street <street>", name: "street", type: "string", required: true },
  { key: "zip", option: "--zip <zip>", name: "zip", type: "string", required: true },
  { key: "company", option: "--company <company>", name: "company", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Owning contact (personal address).", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "The default address of its owner and type.", type: "boolean", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Recipient name.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Owning organization (company address).", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", type: "string", required: false },
  { key: "region", option: "--region <region>", name: "region", type: "string", required: false },
  { key: "street2", option: "--street2 <street2>", name: "street2", type: "string", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "Default 'shipping'.", type: "string", required: false, enum: ["billing","shipping"] },
];
customers
  .command(`addresses-create`)
  .description(`Create a address`)
  .option(`--city <city>`, ``)
  .option(`--country <country>`, `ISO 3166-1 alpha-2 code.`)
  .option(`--street <street>`, ``)
  .option(`--zip <zip>`, ``)
  .option(`--company <company>`, ``)
  .option(`--contact-id <contact-id>`, `Owning contact (personal address).`)
  .option(
    `--is-default [value]`,
    `The default address of its owner and type.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--name <name>`, `Recipient name.`)
  .option(`--organization-id <organization-id>`, `Owning organization (company address).`)
  .option(`--phone <phone>`, ``)
  .option(`--region <region>`, ``)
  .option(`--street2 <street2>`, ``)
  .option(`--type <type>`, `Default 'shipping'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { city, country, street, zip, company, contactId, isDefault, name, organizationId, phone, region, street2, type } = await promptForMissing(
          _options,
          addressesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/addresses`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (city !== undefined) {
          _payload[`city`] = city;
        }
        if (company !== undefined) {
          _payload[`company`] = company;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (region !== undefined) {
          _payload[`region`] = region;
        }
        if (street !== undefined) {
          _payload[`street`] = street;
        }
        if (street2 !== undefined) {
          _payload[`street2`] = street2;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (zip !== undefined) {
          _payload[`zip`] = zip;
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
registerPromptSpecs(customers.commands.at(-1)!, addressesCreateSpecs, { method: "post" });
const addressesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/addresses", hasLimit: true } },
];
customers
  .command(`addresses-delete`)
  .description(`Delete a address by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          addressesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`customers addresses-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/customers/addresses/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, addressesDeleteSpecs, { method: "delete", destructive: true });
const addressesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/addresses", hasLimit: true } },
];
customers
  .command(`addresses-get`)
  .description(`Read one address by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          addressesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/addresses/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, addressesGetSpecs, { method: "get" });
const addressesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/addresses", hasLimit: true } },
  { key: "city", option: "--city <city>", name: "city", type: "string", required: false },
  { key: "company", option: "--company <company>", name: "company", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Owning contact (personal address).", type: "string", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "ISO 3166-1 alpha-2 code.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "The default address of its owner and type.", type: "boolean", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Recipient name.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Owning organization (company address).", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", type: "string", required: false },
  { key: "region", option: "--region <region>", name: "region", type: "string", required: false },
  { key: "street", option: "--street <street>", name: "street", type: "string", required: false },
  { key: "street2", option: "--street2 <street2>", name: "street2", type: "string", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "Default 'shipping'.", type: "string", required: false, enum: ["billing","shipping"] },
  { key: "zip", option: "--zip <zip>", name: "zip", type: "string", required: false },
];
customers
  .command(`addresses-update`)
  .description(`Update a address by id`)
  .option(`--id <id>`, ``)
  .option(`--city <city>`, ``)
  .option(`--company <company>`, ``)
  .option(`--contact-id <contact-id>`, `Owning contact (personal address).`)
  .option(`--country <country>`, `ISO 3166-1 alpha-2 code.`)
  .option(
    `--is-default [value]`,
    `The default address of its owner and type.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--name <name>`, `Recipient name.`)
  .option(`--organization-id <organization-id>`, `Owning organization (company address).`)
  .option(`--phone <phone>`, ``)
  .option(`--region <region>`, ``)
  .option(`--street <street>`, ``)
  .option(`--street2 <street2>`, ``)
  .option(`--type <type>`, `Default 'shipping'.`)
  .option(`--zip <zip>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, city, company, contactId, country, isDefault, name, organizationId, phone, region, street, street2, type, zip } = await promptForMissing(
          _options,
          addressesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/addresses/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (city !== undefined) {
          _payload[`city`] = city;
        }
        if (company !== undefined) {
          _payload[`company`] = company;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (region !== undefined) {
          _payload[`region`] = region;
        }
        if (street !== undefined) {
          _payload[`street`] = street;
        }
        if (street2 !== undefined) {
          _payload[`street2`] = street2;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (zip !== undefined) {
          _payload[`zip`] = zip;
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
registerPromptSpecs(customers.commands.at(-1)!, addressesUpdateSpecs, { method: "put" });
const authLoginSpecs: PromptSpec[] = [
  { key: "email", option: "--email <email>", name: "email", type: "string", required: true },
  { key: "password", option: "--password <password>", name: "password", type: "string", required: true, secret: true },
];
customers
  .command(`auth-login`)
  .description(`Create a platform session from email + password; answers the session and the matching contact.`)
  .option(`--email <email>`, ``)
  .option(`--password <password>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { email, password } = await promptForMissing(
          _options,
          authLoginSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/login`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (password !== undefined) {
          _payload[`password`] = password;
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
registerPromptSpecs(customers.commands.at(-1)!, authLoginSpecs, { method: "post" });
const authLogoutSpecs: PromptSpec[] = [
  { key: "sessionId", option: "--session-id <session-id>", name: "session_id", type: "string", required: true },
  { key: "userId", option: "--user-id <user-id>", name: "user_id", type: "string", required: true },
];
customers
  .command(`auth-logout`)
  .description(`Revoke a platform session.`)
  .option(`--session-id <session-id>`, ``)
  .option(`--user-id <user-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { sessionId, userId } = await promptForMissing(
          _options,
          authLogoutSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/logout`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (sessionId !== undefined) {
          _payload[`session_id`] = sessionId;
        }
        if (userId !== undefined) {
          _payload[`user_id`] = userId;
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
registerPromptSpecs(customers.commands.at(-1)!, authLogoutSpecs, { method: "post" });
const authMeSpecs: PromptSpec[] = [
  { key: "userId", option: "--user-id <user-id>", name: "user_id", type: "string", required: true },
  { key: "sessionId", option: "--session-id <session-id>", name: "session_id", description: "Optional session to verify — answers 401 when the session is expired or revoked.", type: "string", required: false },
];
customers
  .command(`auth-me`)
  .description(`Resolve the platform user and its contact (trusted-BFF call).`)
  .option(`--user-id <user-id>`, ``)
  .option(`--session-id <session-id>`, `Optional session to verify — answers 401 when the session is expired or revoked.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { userId, sessionId } = await promptForMissing(
          _options,
          authMeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/me`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (sessionId !== undefined) {
          _payload[`session_id`] = sessionId;
        }
        if (userId !== undefined) {
          _payload[`user_id`] = userId;
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
registerPromptSpecs(customers.commands.at(-1)!, authMeSpecs, { method: "post" });
const authRecoverySpecs: PromptSpec[] = [
  { key: "email", option: "--email <email>", name: "email", type: "string", required: true },
  { key: "url", option: "--url <url>", name: "url", description: "Redirect URL carrying userId + secret.", type: "string", required: true },
];
customers
  .command(`auth-recovery`)
  .description(`Start password recovery: the platform mails a recovery link to the buyer.`)
  .option(`--email <email>`, ``)
  .option(`--url <url>`, `Redirect URL carrying userId + secret.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { email, url } = await promptForMissing(
          _options,
          authRecoverySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/recovery`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (url !== undefined) {
          _payload[`url`] = url;
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
registerPromptSpecs(customers.commands.at(-1)!, authRecoverySpecs, { method: "post" });
const authRecoveryConfirmSpecs: PromptSpec[] = [
  { key: "password", option: "--password <password>", name: "password", type: "string", required: true, secret: true },
  { key: "secret", option: "--secret <secret>", name: "secret", type: "string", required: true, secret: true },
  { key: "userId", option: "--user-id <user-id>", name: "user_id", type: "string", required: true },
];
customers
  .command(`auth-recovery-confirm`)
  .description(`Confirm password recovery with the mailed secret and set the new password.`)
  .option(`--password <password>`, ``)
  .option(`--secret <secret>`, ``)
  .option(`--user-id <user-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { password, secret, userId } = await promptForMissing(
          _options,
          authRecoveryConfirmSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/recovery`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (password !== undefined) {
          _payload[`password`] = password;
        }
        if (secret !== undefined) {
          _payload[`secret`] = secret;
        }
        if (userId !== undefined) {
          _payload[`user_id`] = userId;
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
registerPromptSpecs(customers.commands.at(-1)!, authRecoveryConfirmSpecs, { method: "put" });
const authRegisterSpecs: PromptSpec[] = [
  { key: "email", option: "--email <email>", name: "email", type: "string", required: true },
  { key: "password", option: "--password <password>", name: "password", type: "string", required: true, secret: true },
  { key: "firstName", option: "--first-name <first-name>", name: "first_name", type: "string", required: false },
  { key: "lastName", option: "--last-name <last-name>", name: "last_name", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "BCP 47, e.g. de-DE", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Join an existing organization.", type: "string", required: false },
  { key: "organizationName", option: "--organization-name <organization-name>", name: "organization_name", description: "Found a new organization; the contact becomes its admin.", type: "string", required: false },
  { key: "vatId", option: "--vat-id <vat-id>", name: "vat_id", description: "The new organization's VAT id; required when the tenant's organization_vat_id_required setting is on.", type: "string", required: false },
];
customers
  .command(`auth-register`)
  .description(`Register a buyer: contact (system of record) + platform user; optionally founds an organization (mirrored as a team) with the contact as its admin.`)
  .option(`--email <email>`, ``)
  .option(`--password <password>`, ``)
  .option(`--first-name <first-name>`, ``)
  .option(`--last-name <last-name>`, ``)
  .option(`--locale <locale>`, `BCP 47, e.g. de-DE`)
  .option(`--organization-id <organization-id>`, `Join an existing organization.`)
  .option(`--organization-name <organization-name>`, `Found a new organization; the contact becomes its admin.`)
  .option(`--vat-id <vat-id>`, `The new organization's VAT id; required when the tenant's organization_vat_id_required setting is on.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { email, password, firstName, lastName, locale, organizationId, organizationName, vatId } = await promptForMissing(
          _options,
          authRegisterSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/register`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (firstName !== undefined) {
          _payload[`first_name`] = firstName;
        }
        if (lastName !== undefined) {
          _payload[`last_name`] = lastName;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (organizationName !== undefined) {
          _payload[`organization_name`] = organizationName;
        }
        if (password !== undefined) {
          _payload[`password`] = password;
        }
        if (vatId !== undefined) {
          _payload[`vat_id`] = vatId;
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
registerPromptSpecs(customers.commands.at(-1)!, authRegisterSpecs, { method: "post" });
const contactsListSpecs: PromptSpec[] = [
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Filter to one organization.", type: "string", required: false },
  { key: "role", option: "--role <role>", name: "role", description: "Filter by role (buyer | approver | admin | requester).", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Filter by status (invited | active | blocked).", type: "string", required: false },
  { key: "email", option: "--email <email>", name: "email", description: "Filter by exact email.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customers
  .command(`contacts-list`)
  .description(`List contacts (filter by column; paginate limit/offset/order)`)
  .option(`--organization-id <organization-id>`, `Filter to one organization.`)
  .option(`--role <role>`, `Filter by role (buyer | approver | admin | requester).`)
  .option(`--status <status>`, `Filter by status (invited | active | blocked).`)
  .option(`--email <email>`, `Filter by exact email.`)
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
        const { organizationId, role, status, email, limit, offset, order, filter } = await promptForMissing(
          _options,
          contactsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts`;
        const _payload: RequestParams = {};
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (role !== undefined) {
          _payload[`role`] = role;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (email !== undefined) {
          _payload[`email`] = email;
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
registerPromptSpecs(customers.commands.at(-1)!, contactsListSpecs, { method: "get" });
const contactsCreateSpecs: PromptSpec[] = [
  { key: "email", option: "--email <email>", name: "email", type: "string", required: true },
  { key: "firstName", option: "--first-name <first-name>", name: "first_name", type: "string", required: false },
  { key: "isPrimary", option: "--is-primary <is-primary>", name: "is_primary", description: "The primary contact of its organization.", type: "boolean", required: false },
  { key: "lastName", option: "--last-name <last-name>", name: "last_name", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "BCP 47, e.g. de-DE", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Owning organization — membership is mirrored to the platform team.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", type: "string", required: false },
  { key: "role", option: "--role <role>", name: "role", description: "Default 'buyer' — also the team role on the platform mirror.", type: "string", required: false, enum: ["buyer","approver","admin","requester"] },
  { key: "status", option: "--status <status>", name: "status", description: "Default 'invited' on create.", type: "string", required: false, enum: ["invited","active","blocked"] },
];
customers
  .command(`contacts-create`)
  .description(`Create a contact`)
  .option(`--email <email>`, ``)
  .option(`--first-name <first-name>`, ``)
  .option(
    `--is-primary [value]`,
    `The primary contact of its organization.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--last-name <last-name>`, ``)
  .option(`--locale <locale>`, `BCP 47, e.g. de-DE`)
  .option(`--organization-id <organization-id>`, `Owning organization — membership is mirrored to the platform team.`)
  .option(`--phone <phone>`, ``)
  .option(`--role <role>`, `Default 'buyer' — also the team role on the platform mirror.`)
  .option(`--status <status>`, `Default 'invited' on create.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { email, firstName, isPrimary, lastName, locale, organizationId, phone, role, status } = await promptForMissing(
          _options,
          contactsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (firstName !== undefined) {
          _payload[`first_name`] = firstName;
        }
        if (isPrimary !== undefined) {
          _payload[`is_primary`] = isPrimary;
        }
        if (lastName !== undefined) {
          _payload[`last_name`] = lastName;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (role !== undefined) {
          _payload[`role`] = role;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
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
registerPromptSpecs(customers.commands.at(-1)!, contactsCreateSpecs, { method: "post" });
const contactsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
];
customers
  .command(`contacts-delete`)
  .description(`Delete a contact by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          contactsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`customers contacts-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, contactsDeleteSpecs, { method: "delete", destructive: true });
const contactsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
];
customers
  .command(`contacts-get`)
  .description(`Read one contact by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          contactsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, contactsGetSpecs, { method: "get" });
const contactsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
  { key: "email", option: "--email <email>", name: "email", type: "string", required: false },
  { key: "firstName", option: "--first-name <first-name>", name: "first_name", type: "string", required: false },
  { key: "isPrimary", option: "--is-primary <is-primary>", name: "is_primary", description: "The primary contact of its organization.", type: "boolean", required: false },
  { key: "lastName", option: "--last-name <last-name>", name: "last_name", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "BCP 47, e.g. de-DE", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Owning organization — membership is mirrored to the platform team.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", type: "string", required: false },
  { key: "role", option: "--role <role>", name: "role", description: "Default 'buyer' — also the team role on the platform mirror.", type: "string", required: false, enum: ["buyer","approver","admin","requester"] },
  { key: "status", option: "--status <status>", name: "status", description: "Default 'invited' on create.", type: "string", required: false, enum: ["invited","active","blocked"] },
];
customers
  .command(`contacts-update`)
  .description(`Update a contact by id`)
  .option(`--id <id>`, ``)
  .option(`--email <email>`, ``)
  .option(`--first-name <first-name>`, ``)
  .option(
    `--is-primary [value]`,
    `The primary contact of its organization.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--last-name <last-name>`, ``)
  .option(`--locale <locale>`, `BCP 47, e.g. de-DE`)
  .option(`--organization-id <organization-id>`, `Owning organization — membership is mirrored to the platform team.`)
  .option(`--phone <phone>`, ``)
  .option(`--role <role>`, `Default 'buyer' — also the team role on the platform mirror.`)
  .option(`--status <status>`, `Default 'invited' on create.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, email, firstName, isPrimary, lastName, locale, organizationId, phone, role, status } = await promptForMissing(
          _options,
          contactsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (firstName !== undefined) {
          _payload[`first_name`] = firstName;
        }
        if (isPrimary !== undefined) {
          _payload[`is_primary`] = isPrimary;
        }
        if (lastName !== undefined) {
          _payload[`last_name`] = lastName;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (role !== undefined) {
          _payload[`role`] = role;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
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
registerPromptSpecs(customers.commands.at(-1)!, contactsUpdateSpecs, { method: "put" });
const organizationsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customers
  .command(`organizations-list`)
  .description(`List organizations (filter by column; paginate limit/offset/order)`)
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
          organizationsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations`;
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
registerPromptSpecs(customers.commands.at(-1)!, organizationsListSpecs, { method: "get" });
const organizationsCreateSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Company name — mirrored to the platform team.", type: "string", required: true },
  { key: "settings", option: "--settings <settings>", name: "settings", description: "Free-form organization settings.", type: "object", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Default 'active'.", type: "string", required: false, enum: ["active","blocked"] },
  { key: "vatId", option: "--vat-id <vat-id>", name: "vat_id", type: "string", required: false },
];
customers
  .command(`organizations-create`)
  .description(`Create a organization`)
  .option(`--name <name>`, `Company name — mirrored to the platform team.`)
  .option(`--settings <settings>`, `Free-form organization settings.`)
  .option(`--status <status>`, `Default 'active'.`)
  .option(`--vat-id <vat-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, settings, status, vatId } = await promptForMissing(
          _options,
          organizationsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (settings !== undefined) {
          _payload[`settings`] = resolveBodyParam(settings);
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (vatId !== undefined) {
          _payload[`vat_id`] = vatId;
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
registerPromptSpecs(customers.commands.at(-1)!, organizationsCreateSpecs, { method: "post" });
const organizationsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
];
customers
  .command(`organizations-delete`)
  .description(`Delete a organization by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          organizationsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`customers organizations-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, organizationsDeleteSpecs, { method: "delete", destructive: true });
const organizationsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
];
customers
  .command(`organizations-get`)
  .description(`Read one organization by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          organizationsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, organizationsGetSpecs, { method: "get" });
const organizationsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
  { key: "name", option: "--name <name>", name: "name", description: "Company name — mirrored to the platform team.", type: "string", required: false },
  { key: "settings", option: "--settings <settings>", name: "settings", description: "Free-form organization settings.", type: "object", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Default 'active'.", type: "string", required: false, enum: ["active","blocked"] },
  { key: "vatId", option: "--vat-id <vat-id>", name: "vat_id", type: "string", required: false },
];
customers
  .command(`organizations-update`)
  .description(`Update a organization by id`)
  .option(`--id <id>`, ``)
  .option(`--name <name>`, `Company name — mirrored to the platform team.`)
  .option(`--settings <settings>`, `Free-form organization settings.`)
  .option(`--status <status>`, `Default 'active'.`)
  .option(`--vat-id <vat-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, name, settings, status, vatId } = await promptForMissing(
          _options,
          organizationsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (settings !== undefined) {
          _payload[`settings`] = resolveBodyParam(settings);
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (vatId !== undefined) {
          _payload[`vat_id`] = vatId;
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
registerPromptSpecs(customers.commands.at(-1)!, organizationsUpdateSpecs, { method: "put" });
