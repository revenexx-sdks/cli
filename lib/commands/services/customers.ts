import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseBool,
} from "../../parser.js";

export const customers = new Command("customers")
  .description(commandDescriptions["customers"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

customers
  .command(`customers-addresses-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/customers/addresses`;
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
  .command(`customers-addresses-create`)
  .description(``)
  .requiredOption(`--city <city>`, ``)
  .requiredOption(`--country <country>`, `ISO 3166-1 alpha-2 code.`)
  .requiredOption(`--street <street>`, ``)
  .requiredOption(`--zip <zip>`, ``)
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
      async ({ city, country, street, zip, company, contact_id, is_default, name, organization_id, phone, region, street2, type }) => {
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
  .command(`customers-addresses-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`customers-addresses-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`customers-addresses-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
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
      async ({ id, city, company, contact_id, country, is_default, name, organization_id, phone, region, street, street2, type, zip }) => {
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
  .command(`customers-auth-login`)
  .description(``)
  .requiredOption(`--email <email>`, ``)
  .requiredOption(`--password <password>`, ``)
  .action(
    actionRunner(
      async ({ email, password }) => {
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
  .command(`customers-auth-logout`)
  .description(``)
  .requiredOption(`--session-_id <session-_id>`, ``)
  .requiredOption(`--user-_id <user-_id>`, ``)
  .action(
    actionRunner(
      async ({ session_id, user_id }) => {
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
  .command(`customers-auth-me`)
  .description(``)
  .requiredOption(`--user-_id <user-_id>`, ``)
  .action(
    actionRunner(
      async ({ user_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/me`;
        const _payload: RequestParams = {};
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
  .command(`customers-auth-recovery`)
  .description(``)
  .requiredOption(`--email <email>`, ``)
  .requiredOption(`--url <url>`, `Redirect URL carrying userId + secret.`)
  .action(
    actionRunner(
      async ({ email, url }) => {
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
  .command(`customers-auth-recovery-confirm`)
  .description(``)
  .requiredOption(`--password <password>`, ``)
  .requiredOption(`--secret <secret>`, ``)
  .requiredOption(`--user-_id <user-_id>`, ``)
  .action(
    actionRunner(
      async ({ password, secret, user_id }) => {
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
  .command(`customers-auth-register`)
  .description(``)
  .requiredOption(`--email <email>`, ``)
  .requiredOption(`--password <password>`, ``)
  .option(`--first-_name <first-_name>`, ``)
  .option(`--last-_name <last-_name>`, ``)
  .option(`--locale <locale>`, `BCP 47, e.g. de-DE`)
  .option(`--organization-_id <organization-_id>`, `Join an existing organization.`)
  .option(`--organization-_name <organization-_name>`, `Found a new organization; the contact becomes its admin.`)
  .action(
    actionRunner(
      async ({ email, password, first_name, last_name, locale, organization_id, organization_name }) => {
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
  .command(`customers-contacts-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts`;
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
  .command(`customers-contacts-create`)
  .description(``)
  .requiredOption(`--email <email>`, ``)
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
      async ({ email, first_name, is_primary, last_name, locale, organization_id, phone, role, status }) => {
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
  .command(`customers-contacts-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`customers-contacts-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`customers-contacts-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
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
      async ({ id, email, first_name, is_primary, last_name, locale, organization_id, phone, role, status }) => {
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
  .command(`customers-organizations-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations`;
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
  .command(`customers-organizations-create`)
  .description(``)
  .requiredOption(`--name <name>`, `Company name — mirrored to the platform team.`)
  .option(`--settings <settings>`, `Free-form organization settings.`)
  .option(`--status <status>`, `Default 'active'.`)
  .option(`--vat-_id <vat-_id>`, ``)
  .action(
    actionRunner(
      async ({ name, settings, status, vat_id }) => {
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
  .command(`customers-organizations-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`customers-organizations-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`customers-organizations-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--name <name>`, `Company name — mirrored to the platform team.`)
  .option(`--settings <settings>`, `Free-form organization settings.`)
  .option(`--status <status>`, `Default 'active'.`)
  .option(`--vat-_id <vat-_id>`, ``)
  .action(
    actionRunner(
      async ({ id, name, settings, status, vat_id }) => {
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
