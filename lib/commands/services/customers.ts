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

const addressTypesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customers
  .command(`address-types-list`)
  .description(`What an address is used for. Billing and shipping are what a checkout needs; a works entrance or a central accounts office is the tenant's own. Seeds on first read, so the page is never empty and \`addresses.type\` always has a value it may carry.`)
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
          addressTypesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/address-types`;
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
registerPromptSpecs(customers.commands.at(-1)!, addressTypesListSpecs, { method: "get" });
const addressTypesCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value; the previous default is demoted.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customers
  .command(`address-types-create`)
  .description(`The code is lowercase and becomes what \`addresses.type\` stores; it cannot be changed afterwards, because every record carrying it would be orphaned. A duplicate code is a 409.`)
  .option(`--code <code>`, ``)
  .option(`--title <title>`, ``)
  .option(`--description <description>`, ``)
  .option(`--descriptions <descriptions>`, ``)
  .option(
    `--is-default [value]`,
    `Promote this value; the previous default is demoted.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--tone <tone>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, title, description, descriptions, isDefault, labels, position, tone } = await promptForMissing(
          _options,
          addressTypesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/address-types`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (descriptions !== undefined) {
          _payload[`descriptions`] = resolveBodyParam(descriptions);
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (tone !== undefined) {
          _payload[`tone`] = tone;
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
registerPromptSpecs(customers.commands.at(-1)!, addressTypesCreateSpecs, { method: "post" });
const addressTypesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/address-types", hasLimit: false } },
];
customers
  .command(`address-types-delete`)
  .description(`409 when at least one record still carries it — a record whose value no longer exists renders as a bare code and filters as nothing. 409 also for the last one, because \`addresses.type\` must have a value it may carry.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          addressTypesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`customers address-types-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/customers/address-types/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, addressTypesDeleteSpecs, { method: "delete", destructive: true });
const addressTypesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/address-types", hasLimit: false } },
];
customers
  .command(`address-types-get`)
  .description(`Read one address type`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          addressTypesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/address-types/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, addressTypesGetSpecs, { method: "get" });
const addressTypesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/address-types", hasLimit: false } },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customers
  .command(`address-types-update`)
  .description(`Rename a address type or move it in the order`)
  .option(`--id <id>`, ``)
  .option(`--description <description>`, ``)
  .option(`--descriptions <descriptions>`, ``)
  .option(
    `--is-default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--title <title>`, ``)
  .option(`--tone <tone>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, descriptions, isDefault, labels, position, title, tone } = await promptForMissing(
          _options,
          addressTypesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/address-types/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (descriptions !== undefined) {
          _payload[`descriptions`] = resolveBodyParam(descriptions);
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (tone !== undefined) {
          _payload[`tone`] = tone;
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
registerPromptSpecs(customers.commands.at(-1)!, addressTypesUpdateSpecs, { method: "put" });
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
  { key: "type", option: "--type <type>", name: "type", description: "One of the tenant's own address types (GET /customers/address-types) — 'billing' and 'shipping' unless they added their own. A create without it gets the one flagged as default.", type: "string", required: false },
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
  .option(`--type <type>`, `One of the tenant's own address types (GET /customers/address-types) — 'billing' and 'shipping' unless they added their own. A create without it gets the one flagged as default.`)
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
  { key: "type", option: "--type <type>", name: "type", description: "One of the tenant's own address types (GET /customers/address-types) — 'billing' and 'shipping' unless they added their own. A create without it gets the one flagged as default.", type: "string", required: false },
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
  .option(`--type <type>`, `One of the tenant's own address types (GET /customers/address-types) — 'billing' and 'shipping' unless they added their own. A create without it gets the one flagged as default.`)
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
  .description(`Answers 403 with code 'registration_pending' when the credentials are right but the registration is still awaiting approval, and 'registration_rejected' when it was declined — 401 stays reserved for wrong credentials, so the storefront can tell the two apart. \`permissions\` carries the buyer's effective grants so a BFF does not need a second call.`)
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
  .description(`The tenant setting registration_mode decides what a registration IS. 'open' (the default, unchanged behaviour) creates a finished account: registration_status='approved', status='active', login works. 'approval_required' creates an APPLICATION: registration_status='pending', status='invited', the platform user exists with the applicant's own password but is DISABLED, and a newly founded organization is parked as 'blocked' — check \`approval_required\` in the response and show a 'we will get back to you' screen instead of logging the buyer in. Either way the response is 201; the B2B/B2C toggles and organization_vat_id_required are evaluated first and answer 403/400.`)
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
const contactEventKindsListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customers
  .command(`contact-event-kinds-list`)
  .description(`What kind of entry lands on a customer timeline. 'system' is the app's own decision trail and a caller may not file one, whatever the set says. Seeds on first read, so the page is never empty and \`contact_events.kind\` always has a value it may carry.`)
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
          contactEventKindsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contact-event-kinds`;
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
registerPromptSpecs(customers.commands.at(-1)!, contactEventKindsListSpecs, { method: "get" });
const contactEventKindsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value; the previous default is demoted.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customers
  .command(`contact-event-kinds-create`)
  .description(`The code is lowercase and becomes what \`contact_events.kind\` stores; it cannot be changed afterwards, because every record carrying it would be orphaned. A duplicate code is a 409.`)
  .option(`--code <code>`, ``)
  .option(`--title <title>`, ``)
  .option(`--description <description>`, ``)
  .option(`--descriptions <descriptions>`, ``)
  .option(
    `--is-default [value]`,
    `Promote this value; the previous default is demoted.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--tone <tone>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, title, description, descriptions, isDefault, labels, position, tone } = await promptForMissing(
          _options,
          contactEventKindsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contact-event-kinds`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (descriptions !== undefined) {
          _payload[`descriptions`] = resolveBodyParam(descriptions);
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (tone !== undefined) {
          _payload[`tone`] = tone;
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
registerPromptSpecs(customers.commands.at(-1)!, contactEventKindsCreateSpecs, { method: "post" });
const contactEventKindsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/contact-event-kinds", hasLimit: false } },
];
customers
  .command(`contact-event-kinds-delete`)
  .description(`409 when at least one record still carries it — a record whose value no longer exists renders as a bare code and filters as nothing. 409 also for the last one, because \`contact_events.kind\` must have a value it may carry.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          contactEventKindsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`customers contact-event-kinds-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/customers/contact-event-kinds/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, contactEventKindsDeleteSpecs, { method: "delete", destructive: true });
const contactEventKindsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/contact-event-kinds", hasLimit: false } },
];
customers
  .command(`contact-event-kinds-get`)
  .description(`Read one activity type`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          contactEventKindsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contact-event-kinds/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, contactEventKindsGetSpecs, { method: "get" });
const contactEventKindsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/contact-event-kinds", hasLimit: false } },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customers
  .command(`contact-event-kinds-update`)
  .description(`Rename a activity type or move it in the order`)
  .option(`--id <id>`, ``)
  .option(`--description <description>`, ``)
  .option(`--descriptions <descriptions>`, ``)
  .option(
    `--is-default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--title <title>`, ``)
  .option(`--tone <tone>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, descriptions, isDefault, labels, position, title, tone } = await promptForMissing(
          _options,
          contactEventKindsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contact-event-kinds/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (descriptions !== undefined) {
          _payload[`descriptions`] = resolveBodyParam(descriptions);
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (tone !== undefined) {
          _payload[`tone`] = tone;
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
registerPromptSpecs(customers.commands.at(-1)!, contactEventKindsUpdateSpecs, { method: "put" });
const contactEventsListSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Filter to one contact.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Filter to one organization — the company timeline, without fanning out over its people.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Filter by entry kind (system | note | call | email | meeting | visit | task). 'system' is the registration decision trail.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Filter by event name (registration.submitted | registration.approved | registration.rejected | activity.<kind>).", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customers
  .command(`contact-events-list`)
  .description(`List contact events (filter by column; paginate limit/offset/order)`)
  .option(`--contact-id <contact-id>`, `Filter to one contact.`)
  .option(`--organization-id <organization-id>`, `Filter to one organization — the company timeline, without fanning out over its people.`)
  .option(`--kind <kind>`, `Filter by entry kind (system | note | call | email | meeting | visit | task). 'system' is the registration decision trail.`)
  .option(`--name <name>`, `Filter by event name (registration.submitted | registration.approved | registration.rejected | activity.<kind>).`)
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
        const { contactId, organizationId, kind, name, limit, offset, order, filter } = await promptForMissing(
          _options,
          contactEventsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contact_events`;
        const _payload: RequestParams = {};
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
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
registerPromptSpecs(customers.commands.at(-1)!, contactEventsListSpecs, { method: "get" });
const contactEventsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/contact_events", hasLimit: true } },
];
customers
  .command(`contact-events-get`)
  .description(`Read one contact event by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          contactEventsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contact_events/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, contactEventsGetSpecs, { method: "get" });
const contactsListSpecs: PromptSpec[] = [
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Filter to one organization.", type: "string", required: false },
  { key: "isPrimary", option: "--is-primary <is-primary>", name: "is_primary", description: "Filter to the organization's primary contact.", type: "boolean", required: false },
  { key: "role", option: "--role <role>", name: "role", description: "Filter by role (viewer | requester | buyer | approver | admin).", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Filter by status (invited | active | blocked).", type: "string", required: false },
  { key: "registrationStatus", option: "--registration-status <registration-status>", name: "registration_status", description: "Filter by registration state (pending | approved | rejected). 'pending' is the approval inbox.", type: "string", required: false },
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
  .option(
    `--is-primary [value]`,
    `Filter to the organization's primary contact.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--role <role>`, `Filter by role (viewer | requester | buyer | approver | admin).`)
  .option(`--status <status>`, `Filter by status (invited | active | blocked).`)
  .option(`--registration-status <registration-status>`, `Filter by registration state (pending | approved | rejected). 'pending' is the approval inbox.`)
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
        const { organizationId, isPrimary, role, status, registrationStatus, email, limit, offset, order, filter } = await promptForMissing(
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
        if (isPrimary !== undefined) {
          _payload[`is_primary`] = isPrimary;
        }
        if (role !== undefined) {
          _payload[`role`] = role;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (registrationStatus !== undefined) {
          _payload[`registration_status`] = registrationStatus;
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
  { key: "jobTitle", option: "--job-title <job-title>", name: "job_title", description: "What this person does at the company — 'Werkstattleiter', 'Einkauf'. Free text on purpose: it is a title, not a grant. The permission ladder is `role`, and overloading that with job titles silently un-grants everyone the day the ledger is enforced.", type: "string", required: false },
  { key: "lastName", option: "--last-name <last-name>", name: "last_name", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "BCP 47, e.g. de-DE", type: "string", required: false },
  { key: "orderApprovalLimit", option: "--order-approval-limit <order-approval-limit>", name: "order_approval_limit", description: "Amount ceiling for this person, in the market's currency. With the 'orders.approve' permission it is the most they may sign off; null means no ceiling. An amount, not a grant — the grant comes from the role.", type: "number", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Owning organization — membership is mirrored to the platform team.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", type: "string", required: false },
  { key: "registrationStatus", option: "--registration-status <registration-status>", name: "registration_status", description: "Only on create, and only to file the contact as an APPLICATION: 'pending' creates the platform user disabled and routes the contact through approve/reject. Default 'approved'. Ignored on update — see the approve/reject routes.", type: "string", required: false, enum: ["pending","approved"] },
  { key: "role", option: "--role <role>", name: "role", description: "The person's role INSIDE its organization — also the team role on the platform mirror. One of the tenant's own roles (GET /customers/roles); a tenant that never edited the ledger has viewer, requester, buyer, approver, admin. A create without it gets the role flagged as default. Permissions are derived from it, never stored.", type: "string", required: false },
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
  .option(`--job-title <job-title>`, `What this person does at the company — 'Werkstattleiter', 'Einkauf'. Free text on purpose: it is a title, not a grant. The permission ladder is \`role\`, and overloading that with job titles silently un-grants everyone the day the ledger is enforced.`)
  .option(`--last-name <last-name>`, ``)
  .option(`--locale <locale>`, `BCP 47, e.g. de-DE`)
  .option(`--order-approval-limit <order-approval-limit>`, `Amount ceiling for this person, in the market's currency. With the 'orders.approve' permission it is the most they may sign off; null means no ceiling. An amount, not a grant — the grant comes from the role.`, parseInteger)
  .option(`--organization-id <organization-id>`, `Owning organization — membership is mirrored to the platform team.`)
  .option(`--phone <phone>`, ``)
  .option(`--registration-status <registration-status>`, `Only on create, and only to file the contact as an APPLICATION: 'pending' creates the platform user disabled and routes the contact through approve/reject. Default 'approved'. Ignored on update — see the approve/reject routes.`)
  .option(`--role <role>`, `The person's role INSIDE its organization — also the team role on the platform mirror. One of the tenant's own roles (GET /customers/roles); a tenant that never edited the ledger has viewer, requester, buyer, approver, admin. A create without it gets the role flagged as default. Permissions are derived from it, never stored.`)
  .option(`--status <status>`, `Default 'invited' on create.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { email, firstName, isPrimary, jobTitle, lastName, locale, orderApprovalLimit, organizationId, phone, registrationStatus, role, status } = await promptForMissing(
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
        if (jobTitle !== undefined) {
          _payload[`job_title`] = jobTitle;
        }
        if (lastName !== undefined) {
          _payload[`last_name`] = lastName;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (orderApprovalLimit !== undefined) {
          _payload[`order_approval_limit`] = orderApprovalLimit;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (registrationStatus !== undefined) {
          _payload[`registration_status`] = registrationStatus;
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
const contactsEventsCreateSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "One line a person can scan in a timeline.", type: "string", required: true },
  { key: "actor", option: "--actor <actor>", name: "actor", description: "Who logged it (operator id or email).", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "What happened. 'system' is deliberately NOT accepted — those rows are the registration decision trail and are written by the approve/reject routes. Default 'note'.", type: "string", required: false, enum: ["note","call","email","meeting","visit","task"] },
  { key: "note", option: "--note <note>", name: "note", description: "The long form, stored in the event payload.", type: "string", required: false },
  { key: "occurredAt", option: "--occurred-at <occurred-at>", name: "occurred_at", description: "When it actually happened. Defaults to now — a call logged on Monday about Friday should say Friday.", type: "string", required: false },
];
customers
  .command(`contacts-events-create`)
  .description(`Writes a contact_events row with kind != 'system' and emits contact_event.created, so an activity travels on the same bus as a registration decision and a timeline is one query rather than a union. organization_id is DERIVED from the contact, never taken from the body — an activity cannot be filed under a company the person does not belong to. Answers 404 for an unknown contact.`)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--subject <subject>`, `One line a person can scan in a timeline.`)
  .option(`--actor <actor>`, `Who logged it (operator id or email).`)
  .option(`--kind <kind>`, `What happened. 'system' is deliberately NOT accepted — those rows are the registration decision trail and are written by the approve/reject routes. Default 'note'.`)
  .option(`--note <note>`, `The long form, stored in the event payload.`)
  .option(`--occurred-at <occurred-at>`, `When it actually happened. Defaults to now — a call logged on Monday about Friday should say Friday.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, subject, actor, kind, note, occurredAt } = await promptForMissing(
          _options,
          contactsEventsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{contact_id}/events`.replace(`{contact_id}`, contactId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (actor !== undefined) {
          _payload[`actor`] = actor;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
        }
        if (occurredAt !== undefined) {
          _payload[`occurred_at`] = occurredAt;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
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
registerPromptSpecs(customers.commands.at(-1)!, contactsEventsCreateSpecs, { method: "post" });
const contactsPermissionsSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
];
customers
  .command(`contacts-permissions`)
  .description(`Computed from contacts.role on every call — the grants are never persisted, so this always reflects the role the contact holds right now. Answers 404 for an unknown contact.`)
  .option(`--contact-id <contact-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId } = await promptForMissing(
          _options,
          contactsPermissionsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{contact_id}/permissions`.replace(`{contact_id}`, contactId);
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
registerPromptSpecs(customers.commands.at(-1)!, contactsPermissionsSpecs, { method: "get" });
const registrationsApproveSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
  { key: "decidedBy", option: "--decided-by <decided-by>", name: "decided_by", description: "Who decided — recorded on the contact and the event. Free text (operator id or email).", type: "string", required: false },
];
customers
  .command(`registrations-approve`)
  .description(`Only reachable for a contact whose registration_status is 'pending' or 'rejected' (approving a rejection reinstates it). Enables the platform user FIRST — the password the applicant chose at submit time works immediately, no new credential is issued — then sets registration_status='approved' and status='active', and un-blocks the organization this registration itself founded. Approving an already-approved registration is a no-op that emits nothing, so a retry is safe; 'approved' cannot be turned back into 'rejected' (block the contact instead) and answers 409. Writes a contact_events row named 'registration.approved'.`)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--decided-by <decided-by>`, `Who decided — recorded on the contact and the event. Free text (operator id or email).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, decidedBy } = await promptForMissing(
          _options,
          registrationsApproveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{contact_id}/registration/approve`.replace(`{contact_id}`, contactId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (decidedBy !== undefined) {
          _payload[`decided_by`] = decidedBy;
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
registerPromptSpecs(customers.commands.at(-1)!, registrationsApproveSpecs, { method: "post" });
const registrationsRejectSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Why the application was declined. Always stored on the contact. It only reaches the APPLICANT when the tenant's registration_reason_disclosed setting is on — the event payload then carries it, and so does the 403 the login answers.", type: "string", required: true },
  { key: "decidedBy", option: "--decided-by <decided-by>", name: "decided_by", description: "Who decided — recorded on the contact and the event.", type: "string", required: false },
];
customers
  .command(`registrations-reject`)
  .description(`Only reachable from 'pending'. Sets registration_status='rejected' and status='blocked', keeps the platform user in place but disabled — the email must not fall free for a silent second identity, and the merchant keeps the record. Delete the contact to remove both. 'reason' is mandatory and is stored on the contact plus carried in the event payload, so the applicant can be told why. Rejecting an already-rejected registration is a no-op; any other state answers 409. Writes a contact_events row named 'registration.rejected'.`)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--reason <reason>`, `Why the application was declined. Always stored on the contact. It only reaches the APPLICANT when the tenant's registration_reason_disclosed setting is on — the event payload then carries it, and so does the 403 the login answers.`)
  .option(`--decided-by <decided-by>`, `Who decided — recorded on the contact and the event.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, reason, decidedBy } = await promptForMissing(
          _options,
          registrationsRejectSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{contact_id}/registration/reject`.replace(`{contact_id}`, contactId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (decidedBy !== undefined) {
          _payload[`decided_by`] = decidedBy;
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
registerPromptSpecs(customers.commands.at(-1)!, registrationsRejectSpecs, { method: "post" });
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
  { key: "jobTitle", option: "--job-title <job-title>", name: "job_title", description: "What this person does at the company — 'Werkstattleiter', 'Einkauf'. Free text on purpose: it is a title, not a grant. The permission ladder is `role`, and overloading that with job titles silently un-grants everyone the day the ledger is enforced.", type: "string", required: false },
  { key: "lastName", option: "--last-name <last-name>", name: "last_name", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "BCP 47, e.g. de-DE", type: "string", required: false },
  { key: "orderApprovalLimit", option: "--order-approval-limit <order-approval-limit>", name: "order_approval_limit", description: "Amount ceiling for this person, in the market's currency. With the 'orders.approve' permission it is the most they may sign off; null means no ceiling. An amount, not a grant — the grant comes from the role.", type: "number", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Owning organization — membership is mirrored to the platform team.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", type: "string", required: false },
  { key: "registrationStatus", option: "--registration-status <registration-status>", name: "registration_status", description: "Only on create, and only to file the contact as an APPLICATION: 'pending' creates the platform user disabled and routes the contact through approve/reject. Default 'approved'. Ignored on update — see the approve/reject routes.", type: "string", required: false, enum: ["pending","approved"] },
  { key: "role", option: "--role <role>", name: "role", description: "The person's role INSIDE its organization — also the team role on the platform mirror. One of the tenant's own roles (GET /customers/roles); a tenant that never edited the ledger has viewer, requester, buyer, approver, admin. A create without it gets the role flagged as default. Permissions are derived from it, never stored.", type: "string", required: false },
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
  .option(`--job-title <job-title>`, `What this person does at the company — 'Werkstattleiter', 'Einkauf'. Free text on purpose: it is a title, not a grant. The permission ladder is \`role\`, and overloading that with job titles silently un-grants everyone the day the ledger is enforced.`)
  .option(`--last-name <last-name>`, ``)
  .option(`--locale <locale>`, `BCP 47, e.g. de-DE`)
  .option(`--order-approval-limit <order-approval-limit>`, `Amount ceiling for this person, in the market's currency. With the 'orders.approve' permission it is the most they may sign off; null means no ceiling. An amount, not a grant — the grant comes from the role.`, parseInteger)
  .option(`--organization-id <organization-id>`, `Owning organization — membership is mirrored to the platform team.`)
  .option(`--phone <phone>`, ``)
  .option(`--registration-status <registration-status>`, `Only on create, and only to file the contact as an APPLICATION: 'pending' creates the platform user disabled and routes the contact through approve/reject. Default 'approved'. Ignored on update — see the approve/reject routes.`)
  .option(`--role <role>`, `The person's role INSIDE its organization — also the team role on the platform mirror. One of the tenant's own roles (GET /customers/roles); a tenant that never edited the ledger has viewer, requester, buyer, approver, admin. A create without it gets the role flagged as default. Permissions are derived from it, never stored.`)
  .option(`--status <status>`, `Default 'invited' on create.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, email, firstName, isPrimary, jobTitle, lastName, locale, orderApprovalLimit, organizationId, phone, registrationStatus, role, status } = await promptForMissing(
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
        if (jobTitle !== undefined) {
          _payload[`job_title`] = jobTitle;
        }
        if (lastName !== undefined) {
          _payload[`last_name`] = lastName;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (orderApprovalLimit !== undefined) {
          _payload[`order_approval_limit`] = orderApprovalLimit;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (registrationStatus !== undefined) {
          _payload[`registration_status`] = registrationStatus;
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
const defaultsSpecs: PromptSpec[] = [
  { key: "data", option: "--data <data>", name: "data", description: "Request body", type: "object", required: true },
];
customers
  .command(`defaults`)
  .description(`What the app.installed event runs. Idempotent by code: a set that already has its rows is left completely alone, so a re-delivered event and a merchant's renames both survive. A tenant installed before these tables existed is seeded lazily instead, by the first read that finds one empty.`)
  .option(`--data <data>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { data } = await promptForMissing(
          _options,
          defaultsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/defaults`;
        const _payload: RequestParams = {};
        if (data !== undefined) {
          Object.assign(_payload, resolveBodyParam(data));
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
registerPromptSpecs(customers.commands.at(-1)!, defaultsSpecs, { method: "post" });
const lifecycleStagesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customers
  .command(`lifecycle-stages-list`)
  .description(`Where a company stands in the sales pipeline — a separate axis from status, and one whose steps are a sales team's own. Seeds on first read, so the page is never empty and \`organizations.lifecycle_stage\` always has a value it may carry.`)
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
          lifecycleStagesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/lifecycle-stages`;
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
registerPromptSpecs(customers.commands.at(-1)!, lifecycleStagesListSpecs, { method: "get" });
const lifecycleStagesCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value; the previous default is demoted.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customers
  .command(`lifecycle-stages-create`)
  .description(`The code is lowercase and becomes what \`organizations.lifecycle_stage\` stores; it cannot be changed afterwards, because every record carrying it would be orphaned. A duplicate code is a 409.`)
  .option(`--code <code>`, ``)
  .option(`--title <title>`, ``)
  .option(`--description <description>`, ``)
  .option(`--descriptions <descriptions>`, ``)
  .option(
    `--is-default [value]`,
    `Promote this value; the previous default is demoted.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--tone <tone>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, title, description, descriptions, isDefault, labels, position, tone } = await promptForMissing(
          _options,
          lifecycleStagesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/lifecycle-stages`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (descriptions !== undefined) {
          _payload[`descriptions`] = resolveBodyParam(descriptions);
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (tone !== undefined) {
          _payload[`tone`] = tone;
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
registerPromptSpecs(customers.commands.at(-1)!, lifecycleStagesCreateSpecs, { method: "post" });
const lifecycleStagesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/lifecycle-stages", hasLimit: false } },
];
customers
  .command(`lifecycle-stages-delete`)
  .description(`409 when at least one record still carries it — a record whose value no longer exists renders as a bare code and filters as nothing. 409 also for the last one, because \`organizations.lifecycle_stage\` must have a value it may carry.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          lifecycleStagesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`customers lifecycle-stages-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/customers/lifecycle-stages/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, lifecycleStagesDeleteSpecs, { method: "delete", destructive: true });
const lifecycleStagesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/lifecycle-stages", hasLimit: false } },
];
customers
  .command(`lifecycle-stages-get`)
  .description(`Read one lifecycle stage`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          lifecycleStagesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/lifecycle-stages/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, lifecycleStagesGetSpecs, { method: "get" });
const lifecycleStagesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/lifecycle-stages", hasLimit: false } },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customers
  .command(`lifecycle-stages-update`)
  .description(`Rename a lifecycle stage or move it in the order`)
  .option(`--id <id>`, ``)
  .option(`--description <description>`, ``)
  .option(`--descriptions <descriptions>`, ``)
  .option(
    `--is-default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--title <title>`, ``)
  .option(`--tone <tone>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, descriptions, isDefault, labels, position, title, tone } = await promptForMissing(
          _options,
          lifecycleStagesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/lifecycle-stages/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (descriptions !== undefined) {
          _payload[`descriptions`] = resolveBodyParam(descriptions);
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (tone !== undefined) {
          _payload[`tone`] = tone;
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
registerPromptSpecs(customers.commands.at(-1)!, lifecycleStagesUpdateSpecs, { method: "put" });
const organizationMetricsListSpecs: PromptSpec[] = [
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Read the metrics of one organization.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customers
  .command(`organization-metrics-list`)
  .description(`List organization metrics (filter by column; paginate limit/offset/order)`)
  .option(`--organization-id <organization-id>`, `Read the metrics of one organization.`)
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
        const { organizationId, limit, offset, order, filter } = await promptForMissing(
          _options,
          organizationMetricsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organization_metrics`;
        const _payload: RequestParams = {};
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
registerPromptSpecs(customers.commands.at(-1)!, organizationMetricsListSpecs, { method: "get" });
customers
  .command(`organization-metrics-freshness`)
  .description(`The projection is materialized, so it is only as true as its last refresh. This is that fact as one answer: the OLDEST computed_at in the table (the floor, not an average), the anchor those numbers were measured from, and how many organizations are not covered at all yet.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/customers/organization_metrics/freshness`;
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
const organizationMetricsRefreshSpecs: PromptSpec[] = [
  { key: "asOf", option: "--as-of <as-of>", name: "as_of", description: "Anchor for the rolling windows — pass back the value the previous call returned.", type: "string", required: false },
  { key: "cursor", option: "--cursor <cursor>", name: "cursor", description: "Continue an unfinished refresh: the value the previous call returned.", type: "string", required: false },
  { key: "organizationIds", option: "--organization-ids [organization-ids...]", name: "organization_ids", description: "Refresh exactly these organizations in one call instead of walking all of them.", type: "array", required: false },
];
customers
  .command(`organization-metrics-refresh`)
  .description(`Revenue lives in the orders app and cannot be joined (ADR-0055: no cross-app FK, grant or view), so it is PULLED: this route walks organizations in id order, asks orders.reports.customer-rollup about a batch of them at a time and materializes the answer into organization_metrics — one row per organization, all-zero for those that never ordered, so that 'never bought' rules match something. Rows are only rewritten when a value actually changed, so a routine refresh costs almost no writes. Bounded by a wall-clock budget below the gateway's upstream timeout: while 'done' is false, POST again with the returned 'cursor' AND 'as_of' (pinning as_of is what stops the rolling windows sliding during a multi-call refresh). 'organization_ids' refreshes exactly those organizations in a single call — the targeted path after a customer ordered. Answers 502 when the orders app is absent or too old, never zero revenue.`)
  .option(`--as-of <as-of>`, `Anchor for the rolling windows — pass back the value the previous call returned.`)
  .option(`--cursor <cursor>`, `Continue an unfinished refresh: the value the previous call returned.`)
  .option(`--organization-ids [organization-ids...]`, `Refresh exactly these organizations in one call instead of walking all of them.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { asOf, cursor, organizationIds } = await promptForMissing(
          _options,
          organizationMetricsRefreshSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organization_metrics/refresh`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (asOf !== undefined) {
          _payload[`as_of`] = asOf;
        }
        if (cursor !== undefined) {
          _payload[`cursor`] = cursor;
        }
        if (organizationIds !== undefined) {
          _payload[`organization_ids`] = organizationIds;
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
registerPromptSpecs(customers.commands.at(-1)!, organizationMetricsRefreshSpecs, { method: "post" });
const organizationMetricsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/organization_metrics", hasLimit: true } },
];
customers
  .command(`organization-metrics-get`)
  .description(`Read one organization metrics row by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          organizationMetricsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organization_metrics/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, organizationMetricsGetSpecs, { method: "get" });
const organizationsListSpecs: PromptSpec[] = [
  { key: "status", option: "--status <status>", name: "status", description: "Filter by status (active | blocked).", type: "string", required: false },
  { key: "lifecycleStage", option: "--lifecycle-stage <lifecycle-stage>", name: "lifecycle_stage", description: "Filter by pipeline stage (lead | prospect | customer | churned).", type: "string", required: false },
  { key: "branche", option: "--branche <branche>", name: "branche", description: "Filter by exact industry / line of business.", type: "string", required: false },
  { key: "customerNumber", option: "--customer-number <customer-number>", name: "customer_number", description: "Look a company up by its ERP number.", type: "string", required: false },
  { key: "deliveryBlock", option: "--delivery-block <delivery-block>", name: "delivery_block", description: "Filter to companies whose shipments are stopped.", type: "boolean", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customers
  .command(`organizations-list`)
  .description(`List organizations (filter by column; paginate limit/offset/order)`)
  .option(`--status <status>`, `Filter by status (active | blocked).`)
  .option(`--lifecycle-stage <lifecycle-stage>`, `Filter by pipeline stage (lead | prospect | customer | churned).`)
  .option(`--branche <branche>`, `Filter by exact industry / line of business.`)
  .option(`--customer-number <customer-number>`, `Look a company up by its ERP number.`)
  .option(
    `--delivery-block [value]`,
    `Filter to companies whose shipments are stopped.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
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
        const { status, lifecycleStage, branche, customerNumber, deliveryBlock, limit, offset, order, filter } = await promptForMissing(
          _options,
          organizationsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations`;
        const _payload: RequestParams = {};
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (lifecycleStage !== undefined) {
          _payload[`lifecycle_stage`] = lifecycleStage;
        }
        if (branche !== undefined) {
          _payload[`branche`] = branche;
        }
        if (customerNumber !== undefined) {
          _payload[`customer_number`] = customerNumber;
        }
        if (deliveryBlock !== undefined) {
          _payload[`delivery_block`] = deliveryBlock;
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
registerPromptSpecs(customers.commands.at(-1)!, organizationsListSpecs, { method: "get" });
const organizationsCreateSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Company name — mirrored to the platform team.", type: "string", required: true },
  { key: "branche", option: "--branche <branche>", name: "branche", description: "Industry / line of business (free text). Addressable from segment rules.", type: "string", required: false },
  { key: "creditLimit", option: "--credit-limit <credit-limit>", name: "credit_limit", description: "Ceiling on open receivables in the market's currency. Null means no limit; a create without it inherits the tenant's default_credit_limit setting.", type: "number", required: false },
  { key: "customerNumber", option: "--customer-number <customer-number>", name: "customer_number", description: "The number this company carries in the merchant's ERP. Unique per tenant when set, and one of the fields duplicate detection can be pointed at.", type: "string", required: false },
  { key: "deliveryBlock", option: "--delivery-block <delivery-block>", name: "delivery_block", description: "True stops shipments to this company without touching whether it may log in or order. Default false.", type: "boolean", required: false },
  { key: "lifecycleStage", option: "--lifecycle-stage <lifecycle-stage>", name: "lifecycle_stage", description: "Where the company stands in the sales pipeline. Deliberately a SEPARATE axis from status — a prospect that may log in and a customer that may not are both ordinary states, and one column cannot say that. One of the tenant's own stages (GET /customers/lifecycle-stages); a create without it gets the one flagged as default.", type: "string", required: false },
  { key: "paymentTerms", option: "--payment-terms <payment-terms>", name: "payment_terms", description: "When this company has to pay. One of the tenant's own terms (GET /customers/payment-terms). Null means nothing was agreed; a create without it inherits the market's default_payment_terms setting.", type: "string", required: false },
  { key: "priceList", option: "--price-list <price-list>", name: "price_list", description: "Code of the price list this company buys on. Plain text — the list belongs to the prices app and ADR-0055 forbids the cross-app foreign key.", type: "string", required: false },
  { key: "settings", option: "--settings <settings>", name: "settings", description: "Free-form organization settings. The commercial terms that used to live in here are typed columns now — put nothing in here a downstream app has to agree with you about.", type: "object", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "ACCESS, not pipeline: 'blocked' disables the login and is where a rejected registration parks a company. Default 'active'. For 'how far along is this company' use lifecycle_stage.", type: "string", required: false, enum: ["active","blocked"] },
  { key: "vatId", option: "--vat-id <vat-id>", name: "vat_id", type: "string", required: false },
];
customers
  .command(`organizations-create`)
  .description(`Create a organization`)
  .option(`--name <name>`, `Company name — mirrored to the platform team.`)
  .option(`--branche <branche>`, `Industry / line of business (free text). Addressable from segment rules.`)
  .option(`--credit-limit <credit-limit>`, `Ceiling on open receivables in the market's currency. Null means no limit; a create without it inherits the tenant's default_credit_limit setting.`, parseInteger)
  .option(`--customer-number <customer-number>`, `The number this company carries in the merchant's ERP. Unique per tenant when set, and one of the fields duplicate detection can be pointed at.`)
  .option(
    `--delivery-block [value]`,
    `True stops shipments to this company without touching whether it may log in or order. Default false.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--lifecycle-stage <lifecycle-stage>`, `Where the company stands in the sales pipeline. Deliberately a SEPARATE axis from status — a prospect that may log in and a customer that may not are both ordinary states, and one column cannot say that. One of the tenant's own stages (GET /customers/lifecycle-stages); a create without it gets the one flagged as default.`)
  .option(`--payment-terms <payment-terms>`, `When this company has to pay. One of the tenant's own terms (GET /customers/payment-terms). Null means nothing was agreed; a create without it inherits the market's default_payment_terms setting.`)
  .option(`--price-list <price-list>`, `Code of the price list this company buys on. Plain text — the list belongs to the prices app and ADR-0055 forbids the cross-app foreign key.`)
  .option(`--settings <settings>`, `Free-form organization settings. The commercial terms that used to live in here are typed columns now — put nothing in here a downstream app has to agree with you about.`)
  .option(`--status <status>`, `ACCESS, not pipeline: 'blocked' disables the login and is where a rejected registration parks a company. Default 'active'. For 'how far along is this company' use lifecycle_stage.`)
  .option(`--vat-id <vat-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, branche, creditLimit, customerNumber, deliveryBlock, lifecycleStage, paymentTerms, priceList, settings, status, vatId } = await promptForMissing(
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
        if (branche !== undefined) {
          _payload[`branche`] = branche;
        }
        if (creditLimit !== undefined) {
          _payload[`credit_limit`] = creditLimit;
        }
        if (customerNumber !== undefined) {
          _payload[`customer_number`] = customerNumber;
        }
        if (deliveryBlock !== undefined) {
          _payload[`delivery_block`] = deliveryBlock;
        }
        if (lifecycleStage !== undefined) {
          _payload[`lifecycle_stage`] = lifecycleStage;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (paymentTerms !== undefined) {
          _payload[`payment_terms`] = paymentTerms;
        }
        if (priceList !== undefined) {
          _payload[`price_list`] = priceList;
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
  { key: "branche", option: "--branche <branche>", name: "branche", description: "Industry / line of business (free text). Addressable from segment rules.", type: "string", required: false },
  { key: "creditLimit", option: "--credit-limit <credit-limit>", name: "credit_limit", description: "Ceiling on open receivables in the market's currency. Null means no limit; a create without it inherits the tenant's default_credit_limit setting.", type: "number", required: false },
  { key: "customerNumber", option: "--customer-number <customer-number>", name: "customer_number", description: "The number this company carries in the merchant's ERP. Unique per tenant when set, and one of the fields duplicate detection can be pointed at.", type: "string", required: false },
  { key: "deliveryBlock", option: "--delivery-block <delivery-block>", name: "delivery_block", description: "True stops shipments to this company without touching whether it may log in or order. Default false.", type: "boolean", required: false },
  { key: "lifecycleStage", option: "--lifecycle-stage <lifecycle-stage>", name: "lifecycle_stage", description: "Where the company stands in the sales pipeline. Deliberately a SEPARATE axis from status — a prospect that may log in and a customer that may not are both ordinary states, and one column cannot say that. One of the tenant's own stages (GET /customers/lifecycle-stages); a create without it gets the one flagged as default.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Company name — mirrored to the platform team.", type: "string", required: false },
  { key: "paymentTerms", option: "--payment-terms <payment-terms>", name: "payment_terms", description: "When this company has to pay. One of the tenant's own terms (GET /customers/payment-terms). Null means nothing was agreed; a create without it inherits the market's default_payment_terms setting.", type: "string", required: false },
  { key: "priceList", option: "--price-list <price-list>", name: "price_list", description: "Code of the price list this company buys on. Plain text — the list belongs to the prices app and ADR-0055 forbids the cross-app foreign key.", type: "string", required: false },
  { key: "settings", option: "--settings <settings>", name: "settings", description: "Free-form organization settings. The commercial terms that used to live in here are typed columns now — put nothing in here a downstream app has to agree with you about.", type: "object", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "ACCESS, not pipeline: 'blocked' disables the login and is where a rejected registration parks a company. Default 'active'. For 'how far along is this company' use lifecycle_stage.", type: "string", required: false, enum: ["active","blocked"] },
  { key: "vatId", option: "--vat-id <vat-id>", name: "vat_id", type: "string", required: false },
];
customers
  .command(`organizations-update`)
  .description(`Update a organization by id`)
  .option(`--id <id>`, ``)
  .option(`--branche <branche>`, `Industry / line of business (free text). Addressable from segment rules.`)
  .option(`--credit-limit <credit-limit>`, `Ceiling on open receivables in the market's currency. Null means no limit; a create without it inherits the tenant's default_credit_limit setting.`, parseInteger)
  .option(`--customer-number <customer-number>`, `The number this company carries in the merchant's ERP. Unique per tenant when set, and one of the fields duplicate detection can be pointed at.`)
  .option(
    `--delivery-block [value]`,
    `True stops shipments to this company without touching whether it may log in or order. Default false.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--lifecycle-stage <lifecycle-stage>`, `Where the company stands in the sales pipeline. Deliberately a SEPARATE axis from status — a prospect that may log in and a customer that may not are both ordinary states, and one column cannot say that. One of the tenant's own stages (GET /customers/lifecycle-stages); a create without it gets the one flagged as default.`)
  .option(`--name <name>`, `Company name — mirrored to the platform team.`)
  .option(`--payment-terms <payment-terms>`, `When this company has to pay. One of the tenant's own terms (GET /customers/payment-terms). Null means nothing was agreed; a create without it inherits the market's default_payment_terms setting.`)
  .option(`--price-list <price-list>`, `Code of the price list this company buys on. Plain text — the list belongs to the prices app and ADR-0055 forbids the cross-app foreign key.`)
  .option(`--settings <settings>`, `Free-form organization settings. The commercial terms that used to live in here are typed columns now — put nothing in here a downstream app has to agree with you about.`)
  .option(`--status <status>`, `ACCESS, not pipeline: 'blocked' disables the login and is where a rejected registration parks a company. Default 'active'. For 'how far along is this company' use lifecycle_stage.`)
  .option(`--vat-id <vat-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, branche, creditLimit, customerNumber, deliveryBlock, lifecycleStage, name, paymentTerms, priceList, settings, status, vatId } = await promptForMissing(
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
        if (branche !== undefined) {
          _payload[`branche`] = branche;
        }
        if (creditLimit !== undefined) {
          _payload[`credit_limit`] = creditLimit;
        }
        if (customerNumber !== undefined) {
          _payload[`customer_number`] = customerNumber;
        }
        if (deliveryBlock !== undefined) {
          _payload[`delivery_block`] = deliveryBlock;
        }
        if (lifecycleStage !== undefined) {
          _payload[`lifecycle_stage`] = lifecycleStage;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (paymentTerms !== undefined) {
          _payload[`payment_terms`] = paymentTerms;
        }
        if (priceList !== undefined) {
          _payload[`price_list`] = priceList;
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
const organizationsEventsCreateSpecs: PromptSpec[] = [
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person dealt with. Must be a contact of this organization.", type: "string", required: true },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "One line a person can scan in a timeline.", type: "string", required: true },
  { key: "actor", option: "--actor <actor>", name: "actor", description: "Who logged it (operator id or email).", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "What happened. 'system' is deliberately NOT accepted — those rows are the registration decision trail and are written by the approve/reject routes. Default 'note'.", type: "string", required: false, enum: ["note","call","email","meeting","visit","task"] },
  { key: "note", option: "--note <note>", name: "note", description: "The long form, stored in the event payload.", type: "string", required: false },
  { key: "occurredAt", option: "--occurred-at <occurred-at>", name: "occurred_at", description: "When it actually happened. Defaults to now — a call logged on Monday about Friday should say Friday.", type: "string", required: false },
];
customers
  .command(`organizations-events-create`)
  .description(`Same row as the contact route, reached from the organization. 'contact_id' is required and must belong to THIS organization — the picker offering the contacts is not filtered, so the membership check here is what stops a call with one company being filed under someone else's person. Answers 404 for an unknown organization and 400 for a contact that is not in it.`)
  .option(`--organization-id <organization-id>`, ``)
  .option(`--contact-id <contact-id>`, `The person dealt with. Must be a contact of this organization.`)
  .option(`--subject <subject>`, `One line a person can scan in a timeline.`)
  .option(`--actor <actor>`, `Who logged it (operator id or email).`)
  .option(`--kind <kind>`, `What happened. 'system' is deliberately NOT accepted — those rows are the registration decision trail and are written by the approve/reject routes. Default 'note'.`)
  .option(`--note <note>`, `The long form, stored in the event payload.`)
  .option(`--occurred-at <occurred-at>`, `When it actually happened. Defaults to now — a call logged on Monday about Friday should say Friday.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { organizationId, contactId, subject, actor, kind, note, occurredAt } = await promptForMissing(
          _options,
          organizationsEventsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations/{organization_id}/events`.replace(`{organization_id}`, organizationId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (actor !== undefined) {
          _payload[`actor`] = actor;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
        }
        if (occurredAt !== undefined) {
          _payload[`occurred_at`] = occurredAt;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
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
registerPromptSpecs(customers.commands.at(-1)!, organizationsEventsCreateSpecs, { method: "post" });
const paymentTermsListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customers
  .command(`payment-terms-list`)
  .description(`When a company has to pay. A wholesaler who agrees net 45 with one customer used to need a release of this app to say so. Seeds on first read, so the page is never empty and \`organizations.payment_terms\` always has a value it may carry.`)
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
          paymentTermsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/payment-terms`;
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
registerPromptSpecs(customers.commands.at(-1)!, paymentTermsListSpecs, { method: "get" });
const paymentTermsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value; the previous default is demoted.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customers
  .command(`payment-terms-create`)
  .description(`The code is lowercase and becomes what \`organizations.payment_terms\` stores; it cannot be changed afterwards, because every record carrying it would be orphaned. A duplicate code is a 409.`)
  .option(`--code <code>`, ``)
  .option(`--title <title>`, ``)
  .option(`--description <description>`, ``)
  .option(`--descriptions <descriptions>`, ``)
  .option(
    `--is-default [value]`,
    `Promote this value; the previous default is demoted.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--tone <tone>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, title, description, descriptions, isDefault, labels, position, tone } = await promptForMissing(
          _options,
          paymentTermsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/payment-terms`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (descriptions !== undefined) {
          _payload[`descriptions`] = resolveBodyParam(descriptions);
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (tone !== undefined) {
          _payload[`tone`] = tone;
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
registerPromptSpecs(customers.commands.at(-1)!, paymentTermsCreateSpecs, { method: "post" });
const paymentTermsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/payment-terms", hasLimit: false } },
];
customers
  .command(`payment-terms-delete`)
  .description(`409 when at least one record still carries it — a record whose value no longer exists renders as a bare code and filters as nothing. 409 also for the last one, because \`organizations.payment_terms\` must have a value it may carry.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          paymentTermsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`customers payment-terms-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/customers/payment-terms/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, paymentTermsDeleteSpecs, { method: "delete", destructive: true });
const paymentTermsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/payment-terms", hasLimit: false } },
];
customers
  .command(`payment-terms-get`)
  .description(`Read one payment term`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          paymentTermsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/payment-terms/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, paymentTermsGetSpecs, { method: "get" });
const paymentTermsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/payment-terms", hasLimit: false } },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customers
  .command(`payment-terms-update`)
  .description(`Rename a payment term or move it in the order`)
  .option(`--id <id>`, ``)
  .option(`--description <description>`, ``)
  .option(`--descriptions <descriptions>`, ``)
  .option(
    `--is-default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--title <title>`, ``)
  .option(`--tone <tone>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, descriptions, isDefault, labels, position, title, tone } = await promptForMissing(
          _options,
          paymentTermsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/payment-terms/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (descriptions !== undefined) {
          _payload[`descriptions`] = resolveBodyParam(descriptions);
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (tone !== undefined) {
          _payload[`tone`] = tone;
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
registerPromptSpecs(customers.commands.at(-1)!, paymentTermsUpdateSpecs, { method: "put" });
const principalResolveSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The contact the caller is acting for.", type: "string", required: true },
];
customers
  .command(`principal-resolve`)
  .description(`The capability the API gateway calls to turn a caller's X-Revenexx-Principal assertion into the permission set it forwards to every other app as X-Revenexx-Permissions. This app is the platform's role provider (manifest#provides_roles), and this is the hot path of every attributed storefront request — one contact read plus the tenant's role map. Answers 404 for an unknown contact, which the gateway caches as a definitive 'no principal'. A blocked or pending contact always resolves with active=false; what its \`permissions\` then say is the tenant's blocked_contact_behavior setting — 'keep' (the default, the role's grants), 'catalog_only' or 'deny_all'.`)
  .option(`--contact-id <contact-id>`, `The contact the caller is acting for.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId } = await promptForMissing(
          _options,
          principalResolveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/principal/resolve`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
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
registerPromptSpecs(customers.commands.at(-1)!, principalResolveSpecs, { method: "post" });
const rolesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customers
  .command(`roles-list`)
  .description(`Roles are held by a CONTACT and apply inside that contact's organization; there is no global customer role. Permissions are derived from the role at read time and never stored per contact, so a role change takes effect immediately and cannot leave a stale grant. The role to permission MAPPING is per tenant and configurable (PUT /customers/roles/{key}/permissions); a tenant that has not configured anything gets the built-ins and 'source' says which of the two answered. Built-in roles, least to most privileged: viewer (Viewer), requester (Requester), buyer (Buyer), approver (Approver), admin (Administrator). The permission KEYS themselves come from the cross-app ledger — every installed app declares what it enforces — so a tenant may grant a key this list does not mention.`)
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
          rolesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/roles`;
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
registerPromptSpecs(customers.commands.at(-1)!, rolesListSpecs, { method: "get" });
const rolesDefaultsSpecs: PromptSpec[] = [
  { key: "data", option: "--data <data>", name: "data", description: "Request body", type: "object", required: true },
];
customers
  .command(`roles-defaults`)
  .description(`Idempotent: a role that already exists is left completely alone, its permissions included, so re-seeding never undoes a merchant's edits. Creates viewer, requester, buyer, approver, admin with the built-in mapping. A tenant that never calls this still behaves correctly — the catalogue and every permission read fall back to the same built-ins. Answers 403 when custom_roles_enabled is off.`)
  .option(`--data <data>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { data } = await promptForMissing(
          _options,
          rolesDefaultsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/roles/defaults`;
        const _payload: RequestParams = {};
        if (data !== undefined) {
          Object.assign(_payload, resolveBodyParam(data));
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
registerPromptSpecs(customers.commands.at(-1)!, rolesDefaultsSpecs, { method: "post" });
const rolesPermissionsReplaceSpecs: PromptSpec[] = [
  { key: "key", option: "--key <key>", name: "key", description: "The role key, e.g. \"buyer\".", type: "string", required: true, resource: { listPath: "/customers/roles", hasLimit: false } },
  { key: "permissions", option: "--permissions [permissions...]", name: "permissions", description: "The complete new set. Duplicates and blanks are ignored; an empty array revokes everything.", type: "array", required: true },
];
customers
  .command(`roles-permissions-replace`)
  .description(`The whole new set in one call — the shape a role editor actually produces, and the one that cannot leave a half-applied grant behind if a second call fails. Seeds the built-in roles first when the tenant has none, so editing works without calling /defaults. Permission keys are free text on purpose: they belong to whichever app declared them, and a grant for an app that is not installed simply has nothing to act on. Answers 404 for an unknown role key, and 403 when the tenant's custom_roles_enabled setting locks the ledger to the built-ins.`)
  .option(`--key <key>`, `The role key, e.g. "buyer".`)
  .option(`--permissions [permissions...]`, `The complete new set. Duplicates and blanks are ignored; an empty array revokes everything.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { key, permissions } = await promptForMissing(
          _options,
          rolesPermissionsReplaceSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/roles/{key}/permissions`.replace(`{key}`, key);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (permissions !== undefined) {
          _payload[`permissions`] = permissions;
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
registerPromptSpecs(customers.commands.at(-1)!, rolesPermissionsReplaceSpecs, { method: "put" });
const segmentMembersListSpecs: PromptSpec[] = [
  { key: "segmentId", option: "--segment-id <segment-id>", name: "segment_id", description: "Filter to one segment.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Filter to one organization — answers the segments an organization belongs to.", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Filter by membership source (manual | rule).", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customers
  .command(`segment-members-list`)
  .description(`List segment members (filter by column; paginate limit/offset/order)`)
  .option(`--segment-id <segment-id>`, `Filter to one segment.`)
  .option(`--organization-id <organization-id>`, `Filter to one organization — answers the segments an organization belongs to.`)
  .option(`--source <source>`, `Filter by membership source (manual | rule).`)
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
        const { segmentId, organizationId, source, limit, offset, order, filter } = await promptForMissing(
          _options,
          segmentMembersListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segment_members`;
        const _payload: RequestParams = {};
        if (segmentId !== undefined) {
          _payload[`segment_id`] = segmentId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
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
registerPromptSpecs(customers.commands.at(-1)!, segmentMembersListSpecs, { method: "get" });
const segmentMembersCreateSpecs: PromptSpec[] = [
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The member organization.", type: "string", required: true },
  { key: "segmentId", option: "--segment-id <segment-id>", name: "segment_id", description: "The segment this membership belongs to.", type: "string", required: true },
  { key: "source", option: "--source <source>", name: "source", description: "Default 'manual'. A recompute only ever inserts or deletes 'rule' rows — hand-picked 'manual' rows survive untouched.", type: "string", required: false, enum: ["manual","rule"] },
];
customers
  .command(`segment-members-create`)
  .description(`Create a segment membership`)
  .option(`--organization-id <organization-id>`, `The member organization.`)
  .option(`--segment-id <segment-id>`, `The segment this membership belongs to.`)
  .option(`--source <source>`, `Default 'manual'. A recompute only ever inserts or deletes 'rule' rows — hand-picked 'manual' rows survive untouched.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { organizationId, segmentId, source } = await promptForMissing(
          _options,
          segmentMembersCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segment_members`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (segmentId !== undefined) {
          _payload[`segment_id`] = segmentId;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
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
registerPromptSpecs(customers.commands.at(-1)!, segmentMembersCreateSpecs, { method: "post" });
const segmentMembersDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/segment_members", hasLimit: true } },
];
customers
  .command(`segment-members-delete`)
  .description(`Delete a segment membership by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          segmentMembersDeleteSpecs,
          _command,
        );
        await confirmDestructive(`customers segment-members-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/customers/segment_members/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, segmentMembersDeleteSpecs, { method: "delete", destructive: true });
const segmentMembersGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/segment_members", hasLimit: true } },
];
customers
  .command(`segment-members-get`)
  .description(`Read one segment membership by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          segmentMembersGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segment_members/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, segmentMembersGetSpecs, { method: "get" });
const segmentMembersUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/segment_members", hasLimit: true } },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The member organization.", type: "string", required: false },
  { key: "segmentId", option: "--segment-id <segment-id>", name: "segment_id", description: "The segment this membership belongs to.", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Default 'manual'. A recompute only ever inserts or deletes 'rule' rows — hand-picked 'manual' rows survive untouched.", type: "string", required: false, enum: ["manual","rule"] },
];
customers
  .command(`segment-members-update`)
  .description(`Update a segment membership by id`)
  .option(`--id <id>`, ``)
  .option(`--organization-id <organization-id>`, `The member organization.`)
  .option(`--segment-id <segment-id>`, `The segment this membership belongs to.`)
  .option(`--source <source>`, `Default 'manual'. A recompute only ever inserts or deletes 'rule' rows — hand-picked 'manual' rows survive untouched.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, organizationId, segmentId, source } = await promptForMissing(
          _options,
          segmentMembersUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segment_members/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (segmentId !== undefined) {
          _payload[`segment_id`] = segmentId;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
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
registerPromptSpecs(customers.commands.at(-1)!, segmentMembersUpdateSpecs, { method: "put" });
const segmentsListSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Filter by exact segment code.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customers
  .command(`segments-list`)
  .description(`List segments (filter by column; paginate limit/offset/order)`)
  .option(`--code <code>`, `Filter by exact segment code.`)
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
        const { code, limit, offset, order, filter } = await promptForMissing(
          _options,
          segmentsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segments`;
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
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
registerPromptSpecs(customers.commands.at(-1)!, segmentsListSpecs, { method: "get" });
const segmentsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Stable identifier, unique per tenant.", type: "string", required: true },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names, e.g. {\"de_DE\": \"Großkunden\"}.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order in the cockpit (default 0).", type: "integer", required: false },
  { key: "ruleMatch", option: "--rule-match <rule-match>", name: "rule_match", description: "How the conditions combine. Default 'all'.", type: "string", required: false, enum: ["all","any"] },
  { key: "rules", option: "--rules <rules>", name: "rules", type: "object", required: false },
];
customers
  .command(`segments-create`)
  .description(`Create a segment`)
  .option(`--code <code>`, `Stable identifier, unique per tenant.`)
  .option(`--labels <labels>`, `Localized display names, e.g. {"de_DE": "Großkunden"}.`)
  .option(`--position <position>`, `Sort order in the cockpit (default 0).`, parseInteger)
  .option(`--rule-match <rule-match>`, `How the conditions combine. Default 'all'.`)
  .option(`--rules <rules>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, labels, position, ruleMatch, rules } = await promptForMissing(
          _options,
          segmentsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segments`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (ruleMatch !== undefined) {
          _payload[`rule_match`] = ruleMatch;
        }
        if (rules !== undefined) {
          _payload[`rules`] = resolveBodyParam(rules);
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
registerPromptSpecs(customers.commands.at(-1)!, segmentsCreateSpecs, { method: "post" });
const segmentsRulesRecomputeAllSpecs: PromptSpec[] = [
  { key: "data", option: "--data <data>", name: "data", description: "Request body", type: "object", required: true },
];
customers
  .command(`segments-rules-recompute-all`)
  .description(`Same sync as the single-segment recompute, applied to every segment with non-null rules. A failing segment is reported in its result entry instead of aborting the run. The run shares one budget: a segment that does not fit reports done:false (or skipped:true) and keeps rules_computed_at null, so the next call resumes it from its own data. Repeat until the top-level done is true.`)
  .option(`--data <data>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { data } = await promptForMissing(
          _options,
          segmentsRulesRecomputeAllSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segments/rules/recompute-all`;
        const _payload: RequestParams = {};
        if (data !== undefined) {
          Object.assign(_payload, resolveBodyParam(data));
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
registerPromptSpecs(customers.commands.at(-1)!, segmentsRulesRecomputeAllSpecs, { method: "post" });
const segmentsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/segments", hasLimit: true } },
];
customers
  .command(`segments-delete`)
  .description(`Delete a segment by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          segmentsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`customers segments-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/customers/segments/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, segmentsDeleteSpecs, { method: "delete", destructive: true });
const segmentsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/segments", hasLimit: true } },
];
customers
  .command(`segments-get`)
  .description(`Read one segment by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          segmentsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segments/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customers.commands.at(-1)!, segmentsGetSpecs, { method: "get" });
const segmentsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/customers/segments", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Stable identifier, unique per tenant.", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names, e.g. {\"de_DE\": \"Großkunden\"}.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order in the cockpit (default 0).", type: "integer", required: false },
  { key: "ruleMatch", option: "--rule-match <rule-match>", name: "rule_match", description: "How the conditions combine. Default 'all'.", type: "string", required: false, enum: ["all","any"] },
  { key: "rules", option: "--rules <rules>", name: "rules", type: "object", required: false },
];
customers
  .command(`segments-update`)
  .description(`Update a segment by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, `Stable identifier, unique per tenant.`)
  .option(`--labels <labels>`, `Localized display names, e.g. {"de_DE": "Großkunden"}.`)
  .option(`--position <position>`, `Sort order in the cockpit (default 0).`, parseInteger)
  .option(`--rule-match <rule-match>`, `How the conditions combine. Default 'all'.`)
  .option(`--rules <rules>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, labels, position, ruleMatch, rules } = await promptForMissing(
          _options,
          segmentsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segments/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (ruleMatch !== undefined) {
          _payload[`rule_match`] = ruleMatch;
        }
        if (rules !== undefined) {
          _payload[`rules`] = resolveBodyParam(rules);
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
registerPromptSpecs(customers.commands.at(-1)!, segmentsUpdateSpecs, { method: "put" });
const segmentsRulesPreviewSpecs: PromptSpec[] = [
  { key: "segmentId", option: "--segment-id <segment-id>", name: "segment_id", type: "string", required: true, resource: { listPath: "/customers/segments", hasLimit: true } },
  { key: "conditions", option: "--conditions [conditions...]", name: "conditions", type: "array", required: true },
  { key: "ruleMatch", option: "--rule-match <rule-match>", name: "rule_match", description: "How the conditions combine. Default 'all'.", type: "string", required: false, enum: ["all","any"] },
  { key: "target", option: "--target <target>", name: "target", description: "Only 'organizations' is supported; any other value is rejected.", type: "string", required: false, enum: ["organizations"] },
];
customers
  .command(`segments-rules-preview`)
  .description(`Evaluates the rule document in the REQUEST BODY (not the stored segments.rules), so the cockpit can preview an unsaved rule. Costs a single count query for the common single-query rule; 'any' rules and rules repeating a column are combined in the app and capped at 5000 ids, in which case 'capped' is true and 'count' is a LOWER bound. Membership is never touched.`)
  .option(`--segment-id <segment-id>`, ``)
  .option(`--conditions [conditions...]`, ``)
  .option(`--rule-match <rule-match>`, `How the conditions combine. Default 'all'.`)
  .option(`--target <target>`, `Only 'organizations' is supported; any other value is rejected.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { segmentId, conditions, ruleMatch, target } = await promptForMissing(
          _options,
          segmentsRulesPreviewSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segments/{segment_id}/rules/preview`.replace(`{segment_id}`, segmentId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (conditions !== undefined) {
          _payload[`conditions`] = conditions;
        }
        if (ruleMatch !== undefined) {
          _payload[`rule_match`] = ruleMatch;
        }
        if (target !== undefined) {
          _payload[`target`] = target;
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
registerPromptSpecs(customers.commands.at(-1)!, segmentsRulesPreviewSpecs, { method: "post" });
const segmentsRulesRecomputeSpecs: PromptSpec[] = [
  { key: "segmentId", option: "--segment-id <segment-id>", name: "segment_id", type: "string", required: true, resource: { listPath: "/customers/segments", hasLimit: true } },
  { key: "cursor", option: "--cursor <cursor>", name: "cursor", description: "Continuation token from a previous response. Omit to resume/start automatically; pass null to force a restart from the beginning.", type: "string", required: false },
];
customers
  .command(`segments-rules-recompute`)
  .description(`Evaluates segments.rules (NOT the request body), then inserts the newly matching organizations as source='rule' rows and deletes the rule rows that no longer match. Manual (source='manual') memberships are never inserted, deleted or shadowed. Bounded by a wall-clock budget below the gateway's upstream timeout: when 'done' is false, POST again with the returned 'cursor' until it is true. added/removed/processed count THIS call only. Omitting 'cursor' resumes an unfinished pass and starts a fresh one after a completed pass; an explicit null always restarts. segments.rules_computed_at is stamped only when the pass completes. Answers 400 when the segment carries no rules.`)
  .option(`--segment-id <segment-id>`, ``)
  .option(`--cursor <cursor>`, `Continuation token from a previous response. Omit to resume/start automatically; pass null to force a restart from the beginning.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { segmentId, cursor } = await promptForMissing(
          _options,
          segmentsRulesRecomputeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segments/{segment_id}/rules/recompute`.replace(`{segment_id}`, segmentId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (cursor !== undefined) {
          _payload[`cursor`] = cursor;
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
registerPromptSpecs(customers.commands.at(-1)!, segmentsRulesRecomputeSpecs, { method: "post" });
const vocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customers
  .command(`vocabularies-list`)
  .description(`Discovery for the vocabulary routes. Names: address-types, contact-event-kinds, contact-statuses, lifecycle-stages, locales, organization-statuses, payment-terms, registration-statuses, roles, rule-matches, segment-sources. Fetch one with GET /customers/vocabularies/{name}; a client holding the qualified pair 'customers.<name>' builds that URL from the pair alone.`)
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
        const _apiPath = `/customers/vocabularies`;
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
registerPromptSpecs(customers.commands.at(-1)!, vocabulariesListSpecs, { method: "get" });
const vocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary name — the part after the dot in the qualified id.", type: "string", required: true, enum: ["address-types","contact-event-kinds","contact-statuses","lifecycle-stages","locales","organization-statuses","payment-terms","registration-statuses","roles","rule-matches","segment-sources"], resource: { listPath: "/customers/vocabularies", hasLimit: false } },
];
customers
  .command(`vocabularies-get`)
  .description(`Two kinds of set, and 'source' says which one answered. 'schema' — the values are read out of the column's CHECK constraint, so the served set IS the enforced set and the two cannot drift; a value added to the constraint appears here even before anyone labels it, titled from its own key. 'table' — the values are the TENANT's own rows (payment terms, address types, lifecycle stages, activity types, roles), so they carry labels/descriptions per locale, is_system and is_default, and a merchant may add to them without a release of this app. 'tenant'/'defaults' are the two answers for a set the merchant configures but may not extend. Either way 'closed' is true: the set is exhaustive at this moment, so a value outside it is stale data rather than a missing label. Values come back in the order a select should offer them — lifecycle order for a status, the merchant's own position for a table. Answers 404 for an unknown name. Names: address-types, contact-event-kinds, contact-statuses, lifecycle-stages, locales, organization-statuses, payment-terms, registration-statuses, roles, rule-matches, segment-sources.`)
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
        const _apiPath = `/customers/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(customers.commands.at(-1)!, vocabulariesGetSpecs, { method: "get" });
