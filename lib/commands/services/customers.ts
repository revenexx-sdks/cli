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

export const customers = new Command("customers")
  .description(
    commandDescriptions["customers"] ??
      `Manage customers resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

customers
  .command(`addresses-list`)
  .description(`List addresses (filter by column; paginate limit/offset/order)`)
  .option(`--contact-_id <contact-_id>`, `Filter to one owning contact.`)
  .option(`--organization-_id <organization-_id>`, `Filter to one organization.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ contact_id, organization_id, limit, offset, order }) => {
        const _client = await sdkForProject();
        const _apiPath = `/customers/addresses`;
        const _payload: RequestParams = {};
        if (contact_id !== undefined) {
          _payload[`contact_id`] = contact_id;
        }
        if (organization_id !== undefined) {
          _payload[`organization_id`] = organization_id;
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
customers
  .command(`addresses-create`)
  .description(`Create a address`)
  .option(`--city <city>`, ``)
  .option(`--country <country>`, `ISO 3166-1 alpha-2 code.`)
  .option(`--street <street>`, ``)
  .option(`--zip <zip>`, ``)
  .option(`--company <company>`, ``)
  .option(`--contact-_id <contact-_id>`, `Owning contact (personal address).`)
  .option(
    `--is-_default [value]`,
    `The default address of its owner and type.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--name <name>`, `Recipient name.`)
  .option(`--organization-_id <organization-_id>`, `Owning organization (company address).`)
  .option(`--phone <phone>`, ``)
  .option(`--region <region>`, ``)
  .option(`--street-2 <street-2>`, ``)
  .option(`--type <type>`, `Default 'shipping'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { city, country, street, zip, company, contact_id, is_default, name, organization_id, phone, region, street2, type } = await promptForMissing(
          _options,
          [
            { key: "city", option: "--city <city>", name: "city", type: "string", required: true },
            { key: "country", option: "--country <country>", name: "country", description: "ISO 3166-1 alpha-2 code.", type: "string", required: true },
            { key: "street", option: "--street <street>", name: "street", type: "string", required: true },
            { key: "zip", option: "--zip <zip>", name: "zip", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/addresses`;
        const _payload: RequestParams = {};
        if (city !== undefined) {
          _payload[`city`] = city;
        }
        if (company !== undefined) {
          _payload[`company`] = company;
        }
        if (contact_id !== undefined) {
          _payload[`contact_id`] = contact_id;
        }
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (is_default !== undefined) {
          _payload[`is_default`] = is_default;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (organization_id !== undefined) {
          _payload[`organization_id`] = organization_id;
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
customers
  .command(`addresses-delete`)
  .description(`Delete a address by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/addresses", hasLimit: true } },
          ],
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
customers
  .command(`addresses-get`)
  .description(`Read one address by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/addresses", hasLimit: true } },
          ],
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
customers
  .command(`addresses-update`)
  .description(`Update a address by id`)
  .option(`--id <id>`, ``)
  .option(`--city <city>`, ``)
  .option(`--company <company>`, ``)
  .option(`--contact-_id <contact-_id>`, `Owning contact (personal address).`)
  .option(`--country <country>`, `ISO 3166-1 alpha-2 code.`)
  .option(
    `--is-_default [value]`,
    `The default address of its owner and type.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--name <name>`, `Recipient name.`)
  .option(`--organization-_id <organization-_id>`, `Owning organization (company address).`)
  .option(`--phone <phone>`, ``)
  .option(`--region <region>`, ``)
  .option(`--street <street>`, ``)
  .option(`--street-2 <street-2>`, ``)
  .option(`--type <type>`, `Default 'shipping'.`)
  .option(`--zip <zip>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, city, company, contact_id, country, is_default, name, organization_id, phone, region, street, street2, type, zip } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/addresses", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/addresses/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (city !== undefined) {
          _payload[`city`] = city;
        }
        if (company !== undefined) {
          _payload[`company`] = company;
        }
        if (contact_id !== undefined) {
          _payload[`contact_id`] = contact_id;
        }
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (is_default !== undefined) {
          _payload[`is_default`] = is_default;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (organization_id !== undefined) {
          _payload[`organization_id`] = organization_id;
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
          [
            { key: "email", option: "--email <email>", name: "email", type: "string", required: true },
            { key: "password", option: "--password <password>", name: "password", type: "string", required: true, secret: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/login`;
        const _payload: RequestParams = {};
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
customers
  .command(`auth-logout`)
  .description(`Revoke a platform session.`)
  .option(`--session-_id <session-_id>`, ``)
  .option(`--user-_id <user-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { session_id, user_id } = await promptForMissing(
          _options,
          [
            { key: "session_id", option: "--session-_id <session-_id>", name: "session_id", type: "string", required: true },
            { key: "user_id", option: "--user-_id <user-_id>", name: "user_id", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/logout`;
        const _payload: RequestParams = {};
        if (session_id !== undefined) {
          _payload[`session_id`] = session_id;
        }
        if (user_id !== undefined) {
          _payload[`user_id`] = user_id;
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
customers
  .command(`auth-me`)
  .description(`Resolve the platform user and its contact (trusted-BFF call).`)
  .option(`--user-_id <user-_id>`, ``)
  .option(`--session-_id <session-_id>`, `Optional session to verify — answers 401 when the session is expired or revoked.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { user_id, session_id } = await promptForMissing(
          _options,
          [
            { key: "user_id", option: "--user-_id <user-_id>", name: "user_id", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/me`;
        const _payload: RequestParams = {};
        if (session_id !== undefined) {
          _payload[`session_id`] = session_id;
        }
        if (user_id !== undefined) {
          _payload[`user_id`] = user_id;
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
          [
            { key: "email", option: "--email <email>", name: "email", type: "string", required: true },
            { key: "url", option: "--url <url>", name: "url", description: "Redirect URL carrying userId + secret.", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/recovery`;
        const _payload: RequestParams = {};
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
customers
  .command(`auth-recovery-confirm`)
  .description(`Confirm password recovery with the mailed secret and set the new password.`)
  .option(`--password <password>`, ``)
  .option(`--secret <secret>`, ``)
  .option(`--user-_id <user-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { password, secret, user_id } = await promptForMissing(
          _options,
          [
            { key: "password", option: "--password <password>", name: "password", type: "string", required: true, secret: true },
            { key: "secret", option: "--secret <secret>", name: "secret", type: "string", required: true, secret: true },
            { key: "user_id", option: "--user-_id <user-_id>", name: "user_id", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/recovery`;
        const _payload: RequestParams = {};
        if (password !== undefined) {
          _payload[`password`] = password;
        }
        if (secret !== undefined) {
          _payload[`secret`] = secret;
        }
        if (user_id !== undefined) {
          _payload[`user_id`] = user_id;
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
customers
  .command(`auth-register`)
  .description(`Register a buyer: contact (system of record) + platform user; optionally founds an organization (mirrored as a team) with the contact as its admin.`)
  .option(`--email <email>`, ``)
  .option(`--password <password>`, ``)
  .option(`--first-_name <first-_name>`, ``)
  .option(`--last-_name <last-_name>`, ``)
  .option(`--locale <locale>`, `BCP 47, e.g. de-DE`)
  .option(`--organization-_id <organization-_id>`, `Join an existing organization.`)
  .option(`--organization-_name <organization-_name>`, `Found a new organization; the contact becomes its admin.`)
  .option(`--vat-_id <vat-_id>`, `The new organization's VAT id; required when the tenant's organization_vat_id_required setting is on.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { email, password, first_name, last_name, locale, organization_id, organization_name, vat_id } = await promptForMissing(
          _options,
          [
            { key: "email", option: "--email <email>", name: "email", type: "string", required: true },
            { key: "password", option: "--password <password>", name: "password", type: "string", required: true, secret: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/register`;
        const _payload: RequestParams = {};
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (first_name !== undefined) {
          _payload[`first_name`] = first_name;
        }
        if (last_name !== undefined) {
          _payload[`last_name`] = last_name;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (organization_id !== undefined) {
          _payload[`organization_id`] = organization_id;
        }
        if (organization_name !== undefined) {
          _payload[`organization_name`] = organization_name;
        }
        if (password !== undefined) {
          _payload[`password`] = password;
        }
        if (vat_id !== undefined) {
          _payload[`vat_id`] = vat_id;
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
customers
  .command(`contacts-list`)
  .description(`List contacts (filter by column; paginate limit/offset/order)`)
  .option(`--organization-_id <organization-_id>`, `Filter to one organization.`)
  .option(`--role <role>`, `Filter by role (buyer | approver | admin | requester).`)
  .option(`--status <status>`, `Filter by status (invited | active | blocked).`)
  .option(`--email <email>`, `Filter by exact email.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ organization_id, role, status, email, limit, offset, order }) => {
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts`;
        const _payload: RequestParams = {};
        if (organization_id !== undefined) {
          _payload[`organization_id`] = organization_id;
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
customers
  .command(`contacts-create`)
  .description(`Create a contact`)
  .option(`--email <email>`, ``)
  .option(`--first-_name <first-_name>`, ``)
  .option(
    `--is-_primary [value]`,
    `The primary contact of its organization.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--last-_name <last-_name>`, ``)
  .option(`--locale <locale>`, `BCP 47, e.g. de-DE`)
  .option(`--organization-_id <organization-_id>`, `Owning organization — membership is mirrored to the platform team.`)
  .option(`--phone <phone>`, ``)
  .option(`--role <role>`, `Default 'buyer' — also the team role on the platform mirror.`)
  .option(`--status <status>`, `Default 'invited' on create.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { email, first_name, is_primary, last_name, locale, organization_id, phone, role, status } = await promptForMissing(
          _options,
          [
            { key: "email", option: "--email <email>", name: "email", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts`;
        const _payload: RequestParams = {};
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (first_name !== undefined) {
          _payload[`first_name`] = first_name;
        }
        if (is_primary !== undefined) {
          _payload[`is_primary`] = is_primary;
        }
        if (last_name !== undefined) {
          _payload[`last_name`] = last_name;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (organization_id !== undefined) {
          _payload[`organization_id`] = organization_id;
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
customers
  .command(`contacts-delete`)
  .description(`Delete a contact by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
          ],
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
customers
  .command(`contacts-get`)
  .description(`Read one contact by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
          ],
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
customers
  .command(`contacts-update`)
  .description(`Update a contact by id`)
  .option(`--id <id>`, ``)
  .option(`--email <email>`, ``)
  .option(`--first-_name <first-_name>`, ``)
  .option(
    `--is-_primary [value]`,
    `The primary contact of its organization.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--last-_name <last-_name>`, ``)
  .option(`--locale <locale>`, `BCP 47, e.g. de-DE`)
  .option(`--organization-_id <organization-_id>`, `Owning organization — membership is mirrored to the platform team.`)
  .option(`--phone <phone>`, ``)
  .option(`--role <role>`, `Default 'buyer' — also the team role on the platform mirror.`)
  .option(`--status <status>`, `Default 'invited' on create.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, email, first_name, is_primary, last_name, locale, organization_id, phone, role, status } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (first_name !== undefined) {
          _payload[`first_name`] = first_name;
        }
        if (is_primary !== undefined) {
          _payload[`is_primary`] = is_primary;
        }
        if (last_name !== undefined) {
          _payload[`last_name`] = last_name;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (organization_id !== undefined) {
          _payload[`organization_id`] = organization_id;
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
customers
  .command(`organizations-list`)
  .description(`List organizations (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
customers
  .command(`organizations-create`)
  .description(`Create a organization`)
  .option(`--name <name>`, `Company name — mirrored to the platform team.`)
  .option(`--settings <settings>`, `Free-form organization settings.`)
  .option(`--status <status>`, `Default 'active'.`)
  .option(`--vat-_id <vat-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, settings, status, vat_id } = await promptForMissing(
          _options,
          [
            { key: "name", option: "--name <name>", name: "name", description: "Company name — mirrored to the platform team.", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations`;
        const _payload: RequestParams = {};
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (settings !== undefined) {
          _payload[`settings`] = JSON.parse(settings);
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (vat_id !== undefined) {
          _payload[`vat_id`] = vat_id;
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
customers
  .command(`organizations-delete`)
  .description(`Delete a organization by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
          ],
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
customers
  .command(`organizations-get`)
  .description(`Read one organization by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
          ],
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
customers
  .command(`organizations-update`)
  .description(`Update a organization by id`)
  .option(`--id <id>`, ``)
  .option(`--name <name>`, `Company name — mirrored to the platform team.`)
  .option(`--settings <settings>`, `Free-form organization settings.`)
  .option(`--status <status>`, `Default 'active'.`)
  .option(`--vat-_id <vat-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, name, settings, status, vat_id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (settings !== undefined) {
          _payload[`settings`] = JSON.parse(settings);
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (vat_id !== undefined) {
          _payload[`vat_id`] = vat_id;
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
