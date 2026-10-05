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

export const customersOrganizations = new Command("customers-organizations")
  .description(
    commandDescriptions["customersOrganizations"] ??
      `The buying COMPANIES and everything keyed to one: the company rows themselves, their postal addresses, the contact points that say where each kind of document goes, and the revenue/order projection pulled from the orders app. An organization is the unit a contract, a credit limit, a payment term, a balance and a price list belong to — not a person, and not a household. Addresses live here because a B2B address is the company's (a contact may own a private one, and that row is reached the same way). The people inside a company are in Contacts, and the groups a company falls into are in Segments.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const customersAddressesListSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Filter to rows whose `id` is exactly this value. Primary key of the address.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Filter to one owning company.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Filter to one owning contact — a personal address book.", type: "string", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "Filter by address type (GET /customers/address-types) — 'billing' or 'shipping' unless the merchant added their own.", type: "string", required: false },
  { key: "company", option: "--company <company>", name: "company", description: "Filter to rows whose `company` is exactly this value. Company line on the label. Often the owning organization's name, but not always — a delivery to a construction site carries the site.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Filter to rows whose `name` is exactly this value. Recipient line on the label — the person or department the parcel is addressed to.", type: "string", required: false },
  { key: "name2", option: "--name2 <name2>", name: "name2", description: "Filter to rows whose `name2` is exactly this value. The second recipient line: a department beneath a person, an attention line, a c/o. What `street2` is for the street, this is for the recipient — and it is a line of its own rather than more text in `name`, because a label prints two lines and an ERP delivers two fields. Null when there is none.", type: "string", required: false },
  { key: "street", option: "--street <street>", name: "street", description: "Filter to rows whose `street` is exactly this value. Street and house number, on one line, as the local post expects it. OPTIONAL, because a deliverable address does not always have one: a German PO box is addressed by its number, its postcode and its town, and an ERP that holds thousands of them would otherwise have every one of them refused. The postcode and the town stay required — a PO box has both.", type: "string", required: false },
  { key: "street2", option: "--street2 <street2>", name: "street2", description: "Filter to rows whose `street2` is exactly this value. The second address line: building, floor, gate, c/o. Null when there is none.", type: "string", required: false },
  { key: "zip", option: "--zip <zip>", name: "zip", description: "Filter to rows whose `zip` is exactly this value. Postal code, as text — leading zeros are real in most countries.", type: "string", required: false },
  { key: "city", option: "--city <city>", name: "city", description: "Filter to rows whose `city` is exactly this value. City or town.", type: "string", required: false },
  { key: "region", option: "--region <region>", name: "region", description: "Filter to rows whose `region` is exactly this value. State, province or Bundesland. Required by some destinations (US, CA), unused by most European ones.", type: "string", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "Filter by ISO 3166-1 alpha-2 country code.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", description: "Filter to rows whose `phone` is exactly this value. Phone number for the carrier to reach at this address — often a different one from the contact's own.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Filter to the default addresses. With `type` and an owner, this is the one address a checkout should preselect.", type: "boolean", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Filter to rows whose `external_id` is exactly this value. Id of this address in the system it came from — an ERP address number. Nullable and unique per tenant where it is set. It is also the id a line-based order export has to hand back, because the receiving system names a delivery or invoice address by it rather than by its street.", type: "string", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When this row was last confirmed against its source. What a delta run asks for changes since, and what tells an operator that a feed has gone quiet — a row edited in the Cockpit does not touch it, because it says when the SOURCE was last seen, not when the row changed. Null for a row no source owns.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When the address was created.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When any column of this row last changed.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customersOrganizations
  .command(`customers-addresses-list`)
  .description(`A postal address used for billing or for shipping, owned by exactly one of the two parties: an organization (the company address everyone in it may use) or a contact (a private one only that person uses). Both owner columns are nullable and exactly one is set — sending both, or neither, is refused. Every address this tenant holds, filterable by owner (\`organization_id\`, \`contact_id\`), by \`type\` and by any other column. It is how the addresses tab of a company or a person is filled; the page is \`limit\`/\`offset\`/\`order\`.`)
  .option(`--id <id>`, `Filter to rows whose \`id\` is exactly this value. Primary key of the address.`)
  .option(`--organization-id <organization-id>`, `Filter to one owning company.`)
  .option(`--contact-id <contact-id>`, `Filter to one owning contact — a personal address book.`)
  .option(`--type <type>`, `Filter by address type (GET /customers/address-types) — 'billing' or 'shipping' unless the merchant added their own.`)
  .option(`--company <company>`, `Filter to rows whose \`company\` is exactly this value. Company line on the label. Often the owning organization's name, but not always — a delivery to a construction site carries the site.`)
  .option(`--name <name>`, `Filter to rows whose \`name\` is exactly this value. Recipient line on the label — the person or department the parcel is addressed to.`)
  .option(`--name2 <name2>`, `Filter to rows whose \`name2\` is exactly this value. The second recipient line: a department beneath a person, an attention line, a c/o. What \`street2\` is for the street, this is for the recipient — and it is a line of its own rather than more text in \`name\`, because a label prints two lines and an ERP delivers two fields. Null when there is none.`)
  .option(`--street <street>`, `Filter to rows whose \`street\` is exactly this value. Street and house number, on one line, as the local post expects it. OPTIONAL, because a deliverable address does not always have one: a German PO box is addressed by its number, its postcode and its town, and an ERP that holds thousands of them would otherwise have every one of them refused. The postcode and the town stay required — a PO box has both.`)
  .option(`--street2 <street2>`, `Filter to rows whose \`street2\` is exactly this value. The second address line: building, floor, gate, c/o. Null when there is none.`)
  .option(`--zip <zip>`, `Filter to rows whose \`zip\` is exactly this value. Postal code, as text — leading zeros are real in most countries.`)
  .option(`--city <city>`, `Filter to rows whose \`city\` is exactly this value. City or town.`)
  .option(`--region <region>`, `Filter to rows whose \`region\` is exactly this value. State, province or Bundesland. Required by some destinations (US, CA), unused by most European ones.`)
  .option(`--country <country>`, `Filter by ISO 3166-1 alpha-2 country code.`)
  .option(`--phone <phone>`, `Filter to rows whose \`phone\` is exactly this value. Phone number for the carrier to reach at this address — often a different one from the contact's own.`)
  .option(
    `--is-default [value]`,
    `Filter to the default addresses. With \`type\` and an owner, this is the one address a checkout should preselect.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--external-id <external-id>`, `Filter to rows whose \`external_id\` is exactly this value. Id of this address in the system it came from — an ERP address number. Nullable and unique per tenant where it is set. It is also the id a line-based order export has to hand back, because the receiving system names a delivery or invoice address by it rather than by its street.`)
  .option(`--source-synced-at <source-synced-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When this row was last confirmed against its source. What a delta run asks for changes since, and what tells an operator that a feed has gone quiet — a row edited in the Cockpit does not touch it, because it says when the SOURCE was last seen, not when the row changed. Null for a row no source owns.`)
  .option(`--created-at <created-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When the address was created.`)
  .option(`--updated-at <updated-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When any column of this row last changed.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, organizationId, contactId, type, company, name, name2, street, street2, zip, city, region, country, phone, isDefault, externalId, sourceSyncedAt, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          customersAddressesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/addresses`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (company !== undefined) {
          _payload[`company`] = company;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (name2 !== undefined) {
          _payload[`name2`] = name2;
        }
        if (street !== undefined) {
          _payload[`street`] = street;
        }
        if (street2 !== undefined) {
          _payload[`street2`] = street2;
        }
        if (zip !== undefined) {
          _payload[`zip`] = zip;
        }
        if (city !== undefined) {
          _payload[`city`] = city;
        }
        if (region !== undefined) {
          _payload[`region`] = region;
        }
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, customersAddressesListSpecs, { method: "get" });
const customersAddressesCreateSpecs: PromptSpec[] = [
  { key: "city", option: "--city <city>", name: "city", description: "City or town.", type: "string", required: true },
  { key: "country", option: "--country <country>", name: "country", description: "ISO 3166-1 alpha-2 country code, exactly two letters. Uppercase by convention; it is what shipping and tax both key off.", type: "string", required: true },
  { key: "zip", option: "--zip <zip>", name: "zip", description: "Postal code, as text — leading zeros are real in most countries.", type: "string", required: true },
  { key: "company", option: "--company <company>", name: "company", description: "Company line on the label. Often the owning organization's name, but not always — a delivery to a construction site carries the site.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Owning person — a personal address only that contact uses. Exactly one of organization_id / contact_id is set.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "When the address was created. Accepted on create only from a call naming no acting contact — an operator, an import, an ERP carrying a record over with its original date. A buyer sending it, or any update changing it, is a 400 `server_owned_field`.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Id of this address in the system it came from — an ERP address number. Nullable and unique per tenant where it is set. It is also the id a line-based order export has to hand back, because the receiving system names a delivery or invoice address by it rather than by its street. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "The default address of its owner AND type: one default billing and one default shipping address per owner. Setting it moves the flag off the previous holder. Default false.", type: "boolean", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Recipient line on the label — the person or department the parcel is addressed to.", type: "string", required: false },
  { key: "name2", option: "--name2 <name2>", name: "name2", description: "The second recipient line: a department beneath a person, an attention line, a c/o. What `street2` is for the street, this is for the recipient — and it is a line of its own rather than more text in `name`, because a label prints two lines and an ERP delivers two fields. Null when there is none.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Owning company — a company address, shared by everyone in it. Exactly one of organization_id / contact_id is set.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", description: "Phone number for the carrier to reach at this address — often a different one from the contact's own.", type: "string", required: false },
  { key: "region", option: "--region <region>", name: "region", description: "State, province or Bundesland. Required by some destinations (US, CA), unused by most European ones.", type: "string", required: false },
  { key: "street", option: "--street <street>", name: "street", description: "Street and house number, on one line, as the local post expects it. OPTIONAL, because a deliverable address does not always have one: a German PO box is addressed by its number, its postcode and its town, and an ERP that holds thousands of them would otherwise have every one of them refused. The postcode and the town stay required — a PO box has both.", type: "string", required: false },
  { key: "street2", option: "--street2 <street2>", name: "street2", description: "The second address line: building, floor, gate, c/o. Null when there is none.", type: "string", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "What the address is FOR — one of the tenant's own address types (GET /customers/address-types), seeded with billing and shipping. A merchant may add their own (a works entrance, a central accounts office) without a release of this app. A create without it gets the type flagged as default; a type the tenant does not keep is a 400.", type: "string", required: false },
];
customersOrganizations
  .command(`customers-addresses-create`)
  .description(`A postal address used for billing or for shipping, owned by exactly one of the two parties: an organization (the company address everyone in it may use) or a contact (a private one only that person uses). Both owner columns are nullable and exactly one is set — sending both, or neither, is refused. \`type\` names one of this tenant's own address types — billing and shipping are seeded, and a merchant may add a works entrance or a central accounts office without a release of this app. \`is_default\` picks the one a checkout should preselect for that owner and that type. A create cannot omit \`zip\`, \`city\` and \`country\`; everything else is optional or defaulted by the database. Two rows of this tenant may not share \`external_id\` (while external_id IS NOT NULL).`)
  .option(`--city <city>`, `City or town.`)
  .option(`--country <country>`, `ISO 3166-1 alpha-2 country code, exactly two letters. Uppercase by convention; it is what shipping and tax both key off.`)
  .option(`--zip <zip>`, `Postal code, as text — leading zeros are real in most countries.`)
  .option(`--company <company>`, `Company line on the label. Often the owning organization's name, but not always — a delivery to a construction site carries the site.`)
  .option(`--contact-id <contact-id>`, `Owning person — a personal address only that contact uses. Exactly one of organization_id / contact_id is set.`)
  .option(`--created-at <created-at>`, `When the address was created. Accepted on create only from a call naming no acting contact — an operator, an import, an ERP carrying a record over with its original date. A buyer sending it, or any update changing it, is a 400 \`server_owned_field\`.`)
  .option(`--external-id <external-id>`, `Id of this address in the system it came from — an ERP address number. Nullable and unique per tenant where it is set. It is also the id a line-based order export has to hand back, because the receiving system names a delivery or invoice address by it rather than by its street. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.`)
  .option(
    `--is-default [value]`,
    `The default address of its owner AND type: one default billing and one default shipping address per owner. Setting it moves the flag off the previous holder. Default false.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--name <name>`, `Recipient line on the label — the person or department the parcel is addressed to.`)
  .option(`--name2 <name2>`, `The second recipient line: a department beneath a person, an attention line, a c/o. What \`street2\` is for the street, this is for the recipient — and it is a line of its own rather than more text in \`name\`, because a label prints two lines and an ERP delivers two fields. Null when there is none.`)
  .option(`--organization-id <organization-id>`, `Owning company — a company address, shared by everyone in it. Exactly one of organization_id / contact_id is set.`)
  .option(`--phone <phone>`, `Phone number for the carrier to reach at this address — often a different one from the contact's own.`)
  .option(`--region <region>`, `State, province or Bundesland. Required by some destinations (US, CA), unused by most European ones.`)
  .option(`--street <street>`, `Street and house number, on one line, as the local post expects it. OPTIONAL, because a deliverable address does not always have one: a German PO box is addressed by its number, its postcode and its town, and an ERP that holds thousands of them would otherwise have every one of them refused. The postcode and the town stay required — a PO box has both.`)
  .option(`--street2 <street2>`, `The second address line: building, floor, gate, c/o. Null when there is none.`)
  .option(`--type <type>`, `What the address is FOR — one of the tenant's own address types (GET /customers/address-types), seeded with billing and shipping. A merchant may add their own (a works entrance, a central accounts office) without a release of this app. A create without it gets the type flagged as default; a type the tenant does not keep is a 400.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { city, country, zip, company, contactId, createdAt, externalId, isDefault, name, name2, organizationId, phone, region, street, street2, type } = await promptForMissing(
          _options,
          customersAddressesCreateSpecs,
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
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (name2 !== undefined) {
          _payload[`name2`] = name2;
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, customersAddressesCreateSpecs, { method: "post" });
const customersAddressesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The address to delete.", type: "string", required: true, resource: { listPath: "/customers/addresses", hasLimit: true } },
];
customersOrganizations
  .command(`customers-addresses-delete`)
  .description(`A postal address used for billing or for shipping, owned by exactly one of the two parties: an organization (the company address everyone in it may use) or a contact (a private one only that person uses). Both owner columns are nullable and exactly one is set — sending both, or neither, is refused. Removes the address. Orders already placed keep the address they were placed with; nothing in this app reaches back. Deleting one takes every \`contact_points\` row that points at it with it — the foreign keys decide, not this route.`)
  .option(`--id <id>`, `The address to delete.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersAddressesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`customers-organizations customers-addresses-delete`);
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, customersAddressesDeleteSpecs, { method: "delete", destructive: true });
const customersAddressesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The address to read.", type: "string", required: true, resource: { listPath: "/customers/addresses", hasLimit: true } },
];
customersOrganizations
  .command(`customers-addresses-get`)
  .description(`A postal address used for billing or for shipping, owned by exactly one of the two parties: an organization (the company address everyone in it may use) or a contact (a private one only that person uses). Both owner columns are nullable and exactly one is set — sending both, or neither, is refused. One address by id, whichever of the two owners it hangs off.`)
  .option(`--id <id>`, `The address to read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersAddressesGetSpecs,
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, customersAddressesGetSpecs, { method: "get" });
const customersAddressesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The address to update.", type: "string", required: true, resource: { listPath: "/customers/addresses", hasLimit: true } },
  { key: "city", option: "--city <city>", name: "city", description: "City or town.", type: "string", required: false },
  { key: "company", option: "--company <company>", name: "company", description: "Company line on the label. Often the owning organization's name, but not always — a delivery to a construction site carries the site.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Owning person — a personal address only that contact uses. Exactly one of organization_id / contact_id is set.", type: "string", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "ISO 3166-1 alpha-2 country code, exactly two letters. Uppercase by convention; it is what shipping and tax both key off.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Id of this address in the system it came from — an ERP address number. Nullable and unique per tenant where it is set. It is also the id a line-based order export has to hand back, because the receiving system names a delivery or invoice address by it rather than by its street. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "The default address of its owner AND type: one default billing and one default shipping address per owner. Setting it moves the flag off the previous holder. Default false.", type: "boolean", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Recipient line on the label — the person or department the parcel is addressed to.", type: "string", required: false },
  { key: "name2", option: "--name2 <name2>", name: "name2", description: "The second recipient line: a department beneath a person, an attention line, a c/o. What `street2` is for the street, this is for the recipient — and it is a line of its own rather than more text in `name`, because a label prints two lines and an ERP delivers two fields. Null when there is none.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Owning company — a company address, shared by everyone in it. Exactly one of organization_id / contact_id is set.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", description: "Phone number for the carrier to reach at this address — often a different one from the contact's own.", type: "string", required: false },
  { key: "region", option: "--region <region>", name: "region", description: "State, province or Bundesland. Required by some destinations (US, CA), unused by most European ones.", type: "string", required: false },
  { key: "street", option: "--street <street>", name: "street", description: "Street and house number, on one line, as the local post expects it. OPTIONAL, because a deliverable address does not always have one: a German PO box is addressed by its number, its postcode and its town, and an ERP that holds thousands of them would otherwise have every one of them refused. The postcode and the town stay required — a PO box has both.", type: "string", required: false },
  { key: "street2", option: "--street2 <street2>", name: "street2", description: "The second address line: building, floor, gate, c/o. Null when there is none.", type: "string", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "What the address is FOR — one of the tenant's own address types (GET /customers/address-types), seeded with billing and shipping. A merchant may add their own (a works entrance, a central accounts office) without a release of this app. A create without it gets the type flagged as default; a type the tenant does not keep is a 400.", type: "string", required: false },
  { key: "zip", option: "--zip <zip>", name: "zip", description: "Postal code, as text — leading zeros are real in most countries.", type: "string", required: false },
];
customersOrganizations
  .command(`customers-addresses-update`)
  .description(`A postal address used for billing or for shipping, owned by exactly one of the two parties: an organization (the company address everyone in it may use) or a contact (a private one only that person uses). Both owner columns are nullable and exactly one is set — sending both, or neither, is refused. A partial update — send only what changes. An empty body is refused rather than answered as a no-op, so a client that built the wrong patch finds out. Two rows of this tenant may not share \`external_id\` (while external_id IS NOT NULL).`)
  .option(`--id <id>`, `The address to update.`)
  .option(`--city <city>`, `City or town.`)
  .option(`--company <company>`, `Company line on the label. Often the owning organization's name, but not always — a delivery to a construction site carries the site.`)
  .option(`--contact-id <contact-id>`, `Owning person — a personal address only that contact uses. Exactly one of organization_id / contact_id is set.`)
  .option(`--country <country>`, `ISO 3166-1 alpha-2 country code, exactly two letters. Uppercase by convention; it is what shipping and tax both key off.`)
  .option(`--external-id <external-id>`, `Id of this address in the system it came from — an ERP address number. Nullable and unique per tenant where it is set. It is also the id a line-based order export has to hand back, because the receiving system names a delivery or invoice address by it rather than by its street. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.`)
  .option(
    `--is-default [value]`,
    `The default address of its owner AND type: one default billing and one default shipping address per owner. Setting it moves the flag off the previous holder. Default false.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--name <name>`, `Recipient line on the label — the person or department the parcel is addressed to.`)
  .option(`--name2 <name2>`, `The second recipient line: a department beneath a person, an attention line, a c/o. What \`street2\` is for the street, this is for the recipient — and it is a line of its own rather than more text in \`name\`, because a label prints two lines and an ERP delivers two fields. Null when there is none.`)
  .option(`--organization-id <organization-id>`, `Owning company — a company address, shared by everyone in it. Exactly one of organization_id / contact_id is set.`)
  .option(`--phone <phone>`, `Phone number for the carrier to reach at this address — often a different one from the contact's own.`)
  .option(`--region <region>`, `State, province or Bundesland. Required by some destinations (US, CA), unused by most European ones.`)
  .option(`--street <street>`, `Street and house number, on one line, as the local post expects it. OPTIONAL, because a deliverable address does not always have one: a German PO box is addressed by its number, its postcode and its town, and an ERP that holds thousands of them would otherwise have every one of them refused. The postcode and the town stay required — a PO box has both.`)
  .option(`--street2 <street2>`, `The second address line: building, floor, gate, c/o. Null when there is none.`)
  .option(`--type <type>`, `What the address is FOR — one of the tenant's own address types (GET /customers/address-types), seeded with billing and shipping. A merchant may add their own (a works entrance, a central accounts office) without a release of this app. A create without it gets the type flagged as default; a type the tenant does not keep is a 400.`)
  .option(`--zip <zip>`, `Postal code, as text — leading zeros are real in most countries.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, city, company, contactId, country, externalId, isDefault, name, name2, organizationId, phone, region, street, street2, type, zip } = await promptForMissing(
          _options,
          customersAddressesUpdateSpecs,
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
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (name2 !== undefined) {
          _payload[`name2`] = name2;
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, customersAddressesUpdateSpecs, { method: "put" });
const customersContactPointsListSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Filter to rows whose `id` is exactly this value. Primary key of the contact point.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Filter to one company's document recipients.", type: "string", required: false },
  { key: "addressId", option: "--address-id <address-id>", name: "address_id", description: "Filter to the points carried on one postal address — the ERP case of a mail address on a delivery address.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Filter by which document goes there. One of the tenant's own document recipient types (GET /customers/contact-point-kinds).", type: "string", required: false },
  { key: "email", option: "--email <email>", name: "email", description: "Filter to rows whose `email` is exactly this value. The mail address this document is sent to. Nullable, because a point may carry a phone number instead — but a point with neither is refused, since it delivers nothing. Note that `addresses` has never had a column for this: a mail address per document had nowhere to live before these rows.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", description: "Filter to rows whose `phone` is exactly this value. The number this document is sent to or announced on — a fax for an order confirmation, a mobile for a delivery notice. Free text, as somebody typed it; E.164 is what an integration should send.", type: "string", required: false },
  { key: "isPrimary", option: "--is-primary <is-primary>", name: "is_primary", description: "Filter to the points actually in use. With `organization_id` and `kind` this answers at most one row, because exactly one point of a kind carries the flag.", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Filter to rows whose `position` is exactly this value. Where this point sits among the others of its kind, ascending. It orders the ones that are NOT flagged — a fallback list for a caller that wants every invoice recipient rather than the one.", type: "integer", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Filter to rows whose `external_id` is exactly this value. The key this point has in the system that owns it — an ERP's own id for a document sending address. Unique per tenant where set, so a repeated import updates this row instead of adding a second one. Null for a point somebody typed in here.", type: "string", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When this row was last confirmed against its source. What a delta run asks for changes since, and what tells an operator that a feed has gone quiet — a row edited in the Cockpit does not touch it, because it says when the SOURCE was last seen, not when the row changed. Null for a row no source owns.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When the point was created.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When any column of this row last changed.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customersOrganizations
  .command(`customers-contact-points-list`)
  .description(`A contact point is WHERE one kind of document goes for one company: the invoice to accounts payable, the order confirmation to the buyer who placed it, the shipping notice to goods-in, the dunning letter to whoever settles it. An ERP keeps these as four separate addresses per debtor and they had nowhere to land here — \`addresses\` carries a \`phone\` column and has never had an \`email\` one — so these rows create a home rather than moving one. Exactly one point per company and kind is flagged as the one to use. Every contact point this tenant holds, filtered by \`organization_id\` for one company, by \`kind\` for one kind of document, by \`is_primary\` for the ones actually in use. \`?organization_id=…&kind=invoice&is_primary=true\` is the single read behind "where does this company's invoice go" — and it answers at most one row, because this app keeps the flag single. The page is \`limit\`/\`offset\`/\`order\`.`)
  .option(`--id <id>`, `Filter to rows whose \`id\` is exactly this value. Primary key of the contact point.`)
  .option(`--organization-id <organization-id>`, `Filter to one company's document recipients.`)
  .option(`--address-id <address-id>`, `Filter to the points carried on one postal address — the ERP case of a mail address on a delivery address.`)
  .option(`--kind <kind>`, `Filter by which document goes there. One of the tenant's own document recipient types (GET /customers/contact-point-kinds).`)
  .option(`--email <email>`, `Filter to rows whose \`email\` is exactly this value. The mail address this document is sent to. Nullable, because a point may carry a phone number instead — but a point with neither is refused, since it delivers nothing. Note that \`addresses\` has never had a column for this: a mail address per document had nowhere to live before these rows.`)
  .option(`--phone <phone>`, `Filter to rows whose \`phone\` is exactly this value. The number this document is sent to or announced on — a fax for an order confirmation, a mobile for a delivery notice. Free text, as somebody typed it; E.164 is what an integration should send.`)
  .option(
    `--is-primary [value]`,
    `Filter to the points actually in use. With \`organization_id\` and \`kind\` this answers at most one row, because exactly one point of a kind carries the flag.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Filter to rows whose \`position\` is exactly this value. Where this point sits among the others of its kind, ascending. It orders the ones that are NOT flagged — a fallback list for a caller that wants every invoice recipient rather than the one.`, parseInteger)
  .option(`--external-id <external-id>`, `Filter to rows whose \`external_id\` is exactly this value. The key this point has in the system that owns it — an ERP's own id for a document sending address. Unique per tenant where set, so a repeated import updates this row instead of adding a second one. Null for a point somebody typed in here.`)
  .option(`--source-synced-at <source-synced-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When this row was last confirmed against its source. What a delta run asks for changes since, and what tells an operator that a feed has gone quiet — a row edited in the Cockpit does not touch it, because it says when the SOURCE was last seen, not when the row changed. Null for a row no source owns.`)
  .option(`--created-at <created-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When the point was created.`)
  .option(`--updated-at <updated-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When any column of this row last changed.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, organizationId, addressId, kind, email, phone, isPrimary, position, externalId, sourceSyncedAt, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          customersContactPointsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contact_points`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (addressId !== undefined) {
          _payload[`address_id`] = addressId;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (isPrimary !== undefined) {
          _payload[`is_primary`] = isPrimary;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, customersContactPointsListSpecs, { method: "get" });
const customersContactPointsCreateSpecs: PromptSpec[] = [
  { key: "kind", option: "--kind <kind>", name: "kind", description: "WHICH document goes here — one of the tenant's own document recipient types (GET /customers/contact-point-kinds), seeded with invoice, order_confirmation, shipping_notice and dunning. Required and never defaulted: a point filed as the wrong document is worse than no point at all, because nothing downstream can tell that nobody chose. A merchant whose ERP mails a credit note separately adds their own type without a release of this app. Required on create, and nothing is defaulted: a kind the tenant does not keep is a 400 naming the ones on offer.", type: "string", required: true },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The company whose document this is. Required — a contact point with no company is an address for nobody, and deleting the company takes its points with it. Fixed once created — the flag that says which point of a kind to use is scoped by the company, so moving a point would move an invariant with it.", type: "string", required: true },
  { key: "addressId", option: "--address-id <address-id>", name: "address_id", description: "The postal address this point belongs to, for the one case an ERP has it: a mail address carried ON a delivery address, so the notice about a shipment goes to whoever receives it there. Null is the ordinary case and means the point is the company's rather than one address's. It has to be an address of the same company (or of one of its people), and deleting the address takes the point with it.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "When the point was created. Accepted on create only from a call naming no acting contact — an operator, an import, an ERP carrying a record over with its original date. A buyer sending it, or any update changing it, is a 400 `server_owned_field`.", type: "string", required: false },
  { key: "email", option: "--email <email>", name: "email", description: "The mail address this document is sent to. Nullable, because a point may carry a phone number instead — but a point with neither is refused, since it delivers nothing. Note that `addresses` has never had a column for this: a mail address per document had nowhere to live before these rows.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key this point has in the system that owns it — an ERP's own id for a document sending address. Unique per tenant where set, so a repeated import updates this row instead of adding a second one. Null for a point somebody typed in here. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.", type: "string", required: false },
  { key: "isPrimary", option: "--is-primary <is-primary>", name: "is_primary", description: "The point THIS kind of document actually goes to. Exactly one point per company and kind carries it: the first point of a kind is flagged as it is created, flagging another demotes the incumbent, and it is never simply switched off — so the question has one answer while the kind has any point at all, and none only when it has none. The first point of a kind gets it on its own. Sending true on a later one demotes the incumbent in the same call; sending false on the one that holds it is refused — flag the point that should take over instead.", type: "boolean", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", description: "The number this document is sent to or announced on — a fax for an order confirmation, a mobile for a delivery notice. Free text, as somebody typed it; E.164 is what an integration should send.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where this point sits among the others of its kind, ascending. It orders the ones that are NOT flagged — a fallback list for a caller that wants every invoice recipient rather than the one. Default 0.", type: "integer", required: false },
];
customersOrganizations
  .command(`customers-contact-points-create`)
  .description(`A contact point is WHERE one kind of document goes for one company: the invoice to accounts payable, the order confirmation to the buyer who placed it, the shipping notice to goods-in, the dunning letter to whoever settles it. An ERP keeps these as four separate addresses per debtor and they had nowhere to land here — \`addresses\` carries a \`phone\` column and has never had an \`email\` one — so these rows create a home rather than moving one. Exactly one point per company and kind is flagged as the one to use. \`kind\` is required and names one of this tenant's own document recipient types — nothing is defaulted, because a point filed as the wrong document is worse than a point refused. A point needs an \`email\` or a \`phone\`, since one with neither delivers nothing. The FIRST point of a kind becomes the one to use on its own; a later one takes over only when it is sent as \`is_primary\`, which demotes the incumbent in the same call. A create cannot omit \`organization_id\` and \`kind\`; everything else is optional or defaulted by the database. Two rows of this tenant may not share the combination of \`organization_id\` + \`kind\` (while is_primary) or \`external_id\` (while external_id IS NOT NULL).`)
  .option(`--kind <kind>`, `WHICH document goes here — one of the tenant's own document recipient types (GET /customers/contact-point-kinds), seeded with invoice, order_confirmation, shipping_notice and dunning. Required and never defaulted: a point filed as the wrong document is worse than no point at all, because nothing downstream can tell that nobody chose. A merchant whose ERP mails a credit note separately adds their own type without a release of this app. Required on create, and nothing is defaulted: a kind the tenant does not keep is a 400 naming the ones on offer.`)
  .option(`--organization-id <organization-id>`, `The company whose document this is. Required — a contact point with no company is an address for nobody, and deleting the company takes its points with it. Fixed once created — the flag that says which point of a kind to use is scoped by the company, so moving a point would move an invariant with it.`)
  .option(`--address-id <address-id>`, `The postal address this point belongs to, for the one case an ERP has it: a mail address carried ON a delivery address, so the notice about a shipment goes to whoever receives it there. Null is the ordinary case and means the point is the company's rather than one address's. It has to be an address of the same company (or of one of its people), and deleting the address takes the point with it.`)
  .option(`--created-at <created-at>`, `When the point was created. Accepted on create only from a call naming no acting contact — an operator, an import, an ERP carrying a record over with its original date. A buyer sending it, or any update changing it, is a 400 \`server_owned_field\`.`)
  .option(`--email <email>`, `The mail address this document is sent to. Nullable, because a point may carry a phone number instead — but a point with neither is refused, since it delivers nothing. Note that \`addresses\` has never had a column for this: a mail address per document had nowhere to live before these rows.`)
  .option(`--external-id <external-id>`, `The key this point has in the system that owns it — an ERP's own id for a document sending address. Unique per tenant where set, so a repeated import updates this row instead of adding a second one. Null for a point somebody typed in here. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.`)
  .option(
    `--is-primary [value]`,
    `The point THIS kind of document actually goes to. Exactly one point per company and kind carries it: the first point of a kind is flagged as it is created, flagging another demotes the incumbent, and it is never simply switched off — so the question has one answer while the kind has any point at all, and none only when it has none. The first point of a kind gets it on its own. Sending true on a later one demotes the incumbent in the same call; sending false on the one that holds it is refused — flag the point that should take over instead.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--phone <phone>`, `The number this document is sent to or announced on — a fax for an order confirmation, a mobile for a delivery notice. Free text, as somebody typed it; E.164 is what an integration should send.`)
  .option(`--position <position>`, `Where this point sits among the others of its kind, ascending. It orders the ones that are NOT flagged — a fallback list for a caller that wants every invoice recipient rather than the one. Default 0.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { kind, organizationId, addressId, createdAt, email, externalId, isPrimary, phone, position } = await promptForMissing(
          _options,
          customersContactPointsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contact_points`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (addressId !== undefined) {
          _payload[`address_id`] = addressId;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (isPrimary !== undefined) {
          _payload[`is_primary`] = isPrimary;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, customersContactPointsCreateSpecs, { method: "post" });
const customersContactPointsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The contact point to delete.", type: "string", required: true, resource: { listPath: "/customers/contact_points", hasLimit: true } },
];
customersOrganizations
  .command(`customers-contact-points-delete`)
  .description(`A contact point is WHERE one kind of document goes for one company: the invoice to accounts payable, the order confirmation to the buyer who placed it, the shipping notice to goods-in, the dunning letter to whoever settles it. An ERP keeps these as four separate addresses per debtor and they had nowhere to land here — \`addresses\` carries a \`phone\` column and has never had an \`email\` one — so these rows create a home rather than moving one. Exactly one point per company and kind is flagged as the one to use. Removes the point. If it was the flagged one, the next point of that kind takes over — so the kind keeps an answer for as long as it has any point at all, and the company is left with none only once the last one goes. Nothing else in this app points at it, so nothing else goes with it.`)
  .option(`--id <id>`, `The contact point to delete.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersContactPointsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`customers-organizations customers-contact-points-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/customers/contact_points/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, customersContactPointsDeleteSpecs, { method: "delete", destructive: true });
const customersContactPointsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The contact point to read.", type: "string", required: true, resource: { listPath: "/customers/contact_points", hasLimit: true } },
];
customersOrganizations
  .command(`customers-contact-points-get`)
  .description(`A contact point is WHERE one kind of document goes for one company: the invoice to accounts payable, the order confirmation to the buyer who placed it, the shipping notice to goods-in, the dunning letter to whoever settles it. An ERP keeps these as four separate addresses per debtor and they had nowhere to land here — \`addresses\` carries a \`phone\` column and has never had an \`email\` one — so these rows create a home rather than moving one. Exactly one point per company and kind is flagged as the one to use. One contact point by id.`)
  .option(`--id <id>`, `The contact point to read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersContactPointsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contact_points/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, customersContactPointsGetSpecs, { method: "get" });
const customersContactPointsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The contact point to update.", type: "string", required: true, resource: { listPath: "/customers/contact_points", hasLimit: true } },
  { key: "addressId", option: "--address-id <address-id>", name: "address_id", description: "The postal address this point belongs to, for the one case an ERP has it: a mail address carried ON a delivery address, so the notice about a shipment goes to whoever receives it there. Null is the ordinary case and means the point is the company's rather than one address's. It has to be an address of the same company (or of one of its people), and deleting the address takes the point with it.", type: "string", required: false },
  { key: "email", option: "--email <email>", name: "email", description: "The mail address this document is sent to. Nullable, because a point may carry a phone number instead — but a point with neither is refused, since it delivers nothing. Note that `addresses` has never had a column for this: a mail address per document had nowhere to live before these rows.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key this point has in the system that owns it — an ERP's own id for a document sending address. Unique per tenant where set, so a repeated import updates this row instead of adding a second one. Null for a point somebody typed in here. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.", type: "string", required: false },
  { key: "isPrimary", option: "--is-primary <is-primary>", name: "is_primary", description: "The point THIS kind of document actually goes to. Exactly one point per company and kind carries it: the first point of a kind is flagged as it is created, flagging another demotes the incumbent, and it is never simply switched off — so the question has one answer while the kind has any point at all, and none only when it has none. The first point of a kind gets it on its own. Sending true on a later one demotes the incumbent in the same call; sending false on the one that holds it is refused — flag the point that should take over instead.", type: "boolean", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "WHICH document goes here — one of the tenant's own document recipient types (GET /customers/contact-point-kinds), seeded with invoice, order_confirmation, shipping_notice and dunning. Required and never defaulted: a point filed as the wrong document is worse than no point at all, because nothing downstream can tell that nobody chose. A merchant whose ERP mails a credit note separately adds their own type without a release of this app. Required on create, and nothing is defaulted: a kind the tenant does not keep is a 400 naming the ones on offer.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The company whose document this is. Required — a contact point with no company is an address for nobody, and deleting the company takes its points with it. Fixed once created — the flag that says which point of a kind to use is scoped by the company, so moving a point would move an invariant with it.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", description: "The number this document is sent to or announced on — a fax for an order confirmation, a mobile for a delivery notice. Free text, as somebody typed it; E.164 is what an integration should send.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where this point sits among the others of its kind, ascending. It orders the ones that are NOT flagged — a fallback list for a caller that wants every invoice recipient rather than the one. Default 0.", type: "integer", required: false },
];
customersOrganizations
  .command(`customers-contact-points-update`)
  .description(`A contact point is WHERE one kind of document goes for one company: the invoice to accounts payable, the order confirmation to the buyer who placed it, the shipping notice to goods-in, the dunning letter to whoever settles it. An ERP keeps these as four separate addresses per debtor and they had nowhere to land here — \`addresses\` carries a \`phone\` column and has never had an \`email\` one — so these rows create a home rather than moving one. Exactly one point per company and kind is flagged as the one to use. A partial update — send only what changes. The owning company is fixed (the flag is scoped by it, so moving a point between companies would move an invariant with it) and an empty body is refused. A flag MOVES rather than switching off: send \`is_primary\` on the point that should take over, because a kind with points and no flag is a question with no answer. Two rows of this tenant may not share the combination of \`organization_id\` + \`kind\` (while is_primary) or \`external_id\` (while external_id IS NOT NULL).`)
  .option(`--id <id>`, `The contact point to update.`)
  .option(`--address-id <address-id>`, `The postal address this point belongs to, for the one case an ERP has it: a mail address carried ON a delivery address, so the notice about a shipment goes to whoever receives it there. Null is the ordinary case and means the point is the company's rather than one address's. It has to be an address of the same company (or of one of its people), and deleting the address takes the point with it.`)
  .option(`--email <email>`, `The mail address this document is sent to. Nullable, because a point may carry a phone number instead — but a point with neither is refused, since it delivers nothing. Note that \`addresses\` has never had a column for this: a mail address per document had nowhere to live before these rows.`)
  .option(`--external-id <external-id>`, `The key this point has in the system that owns it — an ERP's own id for a document sending address. Unique per tenant where set, so a repeated import updates this row instead of adding a second one. Null for a point somebody typed in here. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.`)
  .option(
    `--is-primary [value]`,
    `The point THIS kind of document actually goes to. Exactly one point per company and kind carries it: the first point of a kind is flagged as it is created, flagging another demotes the incumbent, and it is never simply switched off — so the question has one answer while the kind has any point at all, and none only when it has none. The first point of a kind gets it on its own. Sending true on a later one demotes the incumbent in the same call; sending false on the one that holds it is refused — flag the point that should take over instead.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--kind <kind>`, `WHICH document goes here — one of the tenant's own document recipient types (GET /customers/contact-point-kinds), seeded with invoice, order_confirmation, shipping_notice and dunning. Required and never defaulted: a point filed as the wrong document is worse than no point at all, because nothing downstream can tell that nobody chose. A merchant whose ERP mails a credit note separately adds their own type without a release of this app. Required on create, and nothing is defaulted: a kind the tenant does not keep is a 400 naming the ones on offer.`)
  .option(`--organization-id <organization-id>`, `The company whose document this is. Required — a contact point with no company is an address for nobody, and deleting the company takes its points with it. Fixed once created — the flag that says which point of a kind to use is scoped by the company, so moving a point would move an invariant with it.`)
  .option(`--phone <phone>`, `The number this document is sent to or announced on — a fax for an order confirmation, a mobile for a delivery notice. Free text, as somebody typed it; E.164 is what an integration should send.`)
  .option(`--position <position>`, `Where this point sits among the others of its kind, ascending. It orders the ones that are NOT flagged — a fallback list for a caller that wants every invoice recipient rather than the one. Default 0.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, addressId, email, externalId, isPrimary, kind, organizationId, phone, position } = await promptForMissing(
          _options,
          customersContactPointsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contact_points/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (addressId !== undefined) {
          _payload[`address_id`] = addressId;
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (isPrimary !== undefined) {
          _payload[`is_primary`] = isPrimary;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, customersContactPointsUpdateSpecs, { method: "put" });
const customersOrganizationMetricsListSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Filter to rows whose `id` is exactly this value. Primary key of the projection row.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Read the metrics of one company.", type: "string", required: false },
  { key: "orderCount", option: "--order-count <order-count>", name: "order_count", description: "Filter to rows whose `order_count` is exactly this value. Orders ever counted for this company.", type: "integer", required: false },
  { key: "orderCount30d", option: "--order-count-30d <order-count-30d>", name: "order_count_30d", description: "Filter to rows whose `order_count_30d` is exactly this value. Orders in the 30 days before `orders_as_of`. A rolling window, not a calendar month.", type: "integer", required: false },
  { key: "orderCount90d", option: "--order-count-90d <order-count-90d>", name: "order_count_90d", description: "Filter to rows whose `order_count_90d` is exactly this value. Orders in the 90 days before `orders_as_of`.", type: "integer", required: false },
  { key: "orderCount365d", option: "--order-count-365d <order-count-365d>", name: "order_count_365d", description: "Filter to rows whose `order_count_365d` is exactly this value. Orders in the 365 days before `orders_as_of`.", type: "integer", required: false },
  { key: "revenueTotal", option: "--revenue-total <revenue-total>", name: "revenue_total", description: "Filter to rows whose `revenue_total` is exactly this value. Revenue ever counted, in `currency`. Which orders count is the orders app's decision, not this app's.", type: "number", required: false },
  { key: "revenue30d", option: "--revenue-30d <revenue-30d>", name: "revenue_30d", description: "Filter to rows whose `revenue_30d` is exactly this value. Revenue in the 30 days before `orders_as_of`.", type: "number", required: false },
  { key: "revenue90d", option: "--revenue-90d <revenue-90d>", name: "revenue_90d", description: "Filter to rows whose `revenue_90d` is exactly this value. Revenue in the 90 days before `orders_as_of`.", type: "number", required: false },
  { key: "revenue365d", option: "--revenue-365d <revenue-365d>", name: "revenue_365d", description: "Filter to rows whose `revenue_365d` is exactly this value. Revenue in the 365 days before `orders_as_of`. The usual \"how big is this customer\" number, and the one a key-account rule should read.", type: "number", required: false },
  { key: "avgOrderValue", option: "--avg-order-value <avg-order-value>", name: "avg_order_value", description: "Filter to rows whose `avg_order_value` is exactly this value. revenue_total / order_count, computed here from the sums rather than averaged upstream. Zero when there are no orders.", type: "number", required: false },
  { key: "avgOrderValue365d", option: "--avg-order-value-365d <avg-order-value-365d>", name: "avg_order_value_365d", description: "Filter to rows whose `avg_order_value_365d` is exactly this value. revenue_365d / order_count_365d. Zero when there were none in the window.", type: "number", required: false },
  { key: "firstOrderAt", option: "--first-order-at <first-order-at>", name: "first_order_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When this company first ordered. Null if it never has — that is what makes it usable as \"is this a customer at all?\".", type: "string", required: false },
  { key: "lastOrderAt", option: "--last-order-at <last-order-at>", name: "last_order_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When this company last ordered. Null if it never has, which is why the virtual `days_since_last_order` rule field never matches those companies: use `last_order_at is_empty` for them.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Filter to rows whose `currency` is exactly this value. The single ISO 4217 currency all counted orders were in. NULL when there were none, and also when there were several — read `currency_mixed` to tell those two apart.", type: "string", required: false },
  { key: "currencyMixed", option: "--currency-mixed <currency-mixed>", name: "currency_mixed", description: "Filter to rows whose `currency_mixed` is exactly this value. True when this company ordered in more than one currency. The sums are still stored (dropping money is worse), but they are not comparable against a threshold, and a rule reading revenue should say so.", type: "boolean", required: false },
  { key: "ordersAsOf", option: "--orders-as-of <orders-as-of>", name: "orders_as_of", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. The instant the rolling windows were measured from. Pinned across a chunked refresh, so a multi-call pass cannot let the windows slide underneath it.", type: "string", required: false },
  { key: "computedAt", option: "--computed-at <computed-at>", name: "computed_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When this row was last written. The projection is materialized, so this is how stale the numbers are.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When the projection row first appeared.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When the row last changed. Unchanged numbers are not rewritten, so this can lag `computed_at`.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customersOrganizations
  .command(`customers-organization-metrics-list`)
  .description(`What an organization has BOUGHT, materialized into this app from the orders app: lifetime revenue, revenue over the last 30/90/365 days, order count, average order value, and the first and last order dates. Revenue lives in orders and may not be joined (ADR-0055: no cross-app foreign key, grant or view), so it is pulled on a schedule and stored here — one row per organization, all-zero for a company that never ordered, so that a "never bought anything" rule has something to match. The customer-value list: sort by \`revenue_365d\` for the best customers, filter \`last_order_at\` for the dormant ones. Every row carries \`computed_at\`, and a row is only as current as the last refresh — \`GET /customers/organization_metrics/freshness\` says how stale the set is before a number is shown to anybody.`)
  .option(`--id <id>`, `Filter to rows whose \`id\` is exactly this value. Primary key of the projection row.`)
  .option(`--organization-id <organization-id>`, `Read the metrics of one company.`)
  .option(`--order-count <order-count>`, `Filter to rows whose \`order_count\` is exactly this value. Orders ever counted for this company.`, parseInteger)
  .option(`--order-count-30d <order-count-30d>`, `Filter to rows whose \`order_count_30d\` is exactly this value. Orders in the 30 days before \`orders_as_of\`. A rolling window, not a calendar month.`, parseInteger)
  .option(`--order-count-90d <order-count-90d>`, `Filter to rows whose \`order_count_90d\` is exactly this value. Orders in the 90 days before \`orders_as_of\`.`, parseInteger)
  .option(`--order-count-365d <order-count-365d>`, `Filter to rows whose \`order_count_365d\` is exactly this value. Orders in the 365 days before \`orders_as_of\`.`, parseInteger)
  .option(`--revenue-total <revenue-total>`, `Filter to rows whose \`revenue_total\` is exactly this value. Revenue ever counted, in \`currency\`. Which orders count is the orders app's decision, not this app's.`, parseInteger)
  .option(`--revenue-30d <revenue-30d>`, `Filter to rows whose \`revenue_30d\` is exactly this value. Revenue in the 30 days before \`orders_as_of\`.`, parseInteger)
  .option(`--revenue-90d <revenue-90d>`, `Filter to rows whose \`revenue_90d\` is exactly this value. Revenue in the 90 days before \`orders_as_of\`.`, parseInteger)
  .option(`--revenue-365d <revenue-365d>`, `Filter to rows whose \`revenue_365d\` is exactly this value. Revenue in the 365 days before \`orders_as_of\`. The usual "how big is this customer" number, and the one a key-account rule should read.`, parseInteger)
  .option(`--avg-order-value <avg-order-value>`, `Filter to rows whose \`avg_order_value\` is exactly this value. revenue_total / order_count, computed here from the sums rather than averaged upstream. Zero when there are no orders.`, parseInteger)
  .option(`--avg-order-value-365d <avg-order-value-365d>`, `Filter to rows whose \`avg_order_value_365d\` is exactly this value. revenue_365d / order_count_365d. Zero when there were none in the window.`, parseInteger)
  .option(`--first-order-at <first-order-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When this company first ordered. Null if it never has — that is what makes it usable as "is this a customer at all?".`)
  .option(`--last-order-at <last-order-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When this company last ordered. Null if it never has, which is why the virtual \`days_since_last_order\` rule field never matches those companies: use \`last_order_at is_empty\` for them.`)
  .option(`--currency <currency>`, `Filter to rows whose \`currency\` is exactly this value. The single ISO 4217 currency all counted orders were in. NULL when there were none, and also when there were several — read \`currency_mixed\` to tell those two apart.`)
  .option(
    `--currency-mixed [value]`,
    `Filter to rows whose \`currency_mixed\` is exactly this value. True when this company ordered in more than one currency. The sums are still stored (dropping money is worse), but they are not comparable against a threshold, and a rule reading revenue should say so.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--orders-as-of <orders-as-of>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. The instant the rolling windows were measured from. Pinned across a chunked refresh, so a multi-call pass cannot let the windows slide underneath it.`)
  .option(`--computed-at <computed-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When this row was last written. The projection is materialized, so this is how stale the numbers are.`)
  .option(`--created-at <created-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When the projection row first appeared.`)
  .option(`--updated-at <updated-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When the row last changed. Unchanged numbers are not rewritten, so this can lag \`computed_at\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, organizationId, orderCount, orderCount30d, orderCount90d, orderCount365d, revenueTotal, revenue30d, revenue90d, revenue365d, avgOrderValue, avgOrderValue365d, firstOrderAt, lastOrderAt, currency, currencyMixed, ordersAsOf, computedAt, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          customersOrganizationMetricsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organization_metrics`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (orderCount !== undefined) {
          _payload[`order_count`] = orderCount;
        }
        if (orderCount30d !== undefined) {
          _payload[`order_count_30d`] = orderCount30d;
        }
        if (orderCount90d !== undefined) {
          _payload[`order_count_90d`] = orderCount90d;
        }
        if (orderCount365d !== undefined) {
          _payload[`order_count_365d`] = orderCount365d;
        }
        if (revenueTotal !== undefined) {
          _payload[`revenue_total`] = revenueTotal;
        }
        if (revenue30d !== undefined) {
          _payload[`revenue_30d`] = revenue30d;
        }
        if (revenue90d !== undefined) {
          _payload[`revenue_90d`] = revenue90d;
        }
        if (revenue365d !== undefined) {
          _payload[`revenue_365d`] = revenue365d;
        }
        if (avgOrderValue !== undefined) {
          _payload[`avg_order_value`] = avgOrderValue;
        }
        if (avgOrderValue365d !== undefined) {
          _payload[`avg_order_value_365d`] = avgOrderValue365d;
        }
        if (firstOrderAt !== undefined) {
          _payload[`first_order_at`] = firstOrderAt;
        }
        if (lastOrderAt !== undefined) {
          _payload[`last_order_at`] = lastOrderAt;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (currencyMixed !== undefined) {
          _payload[`currency_mixed`] = currencyMixed;
        }
        if (ordersAsOf !== undefined) {
          _payload[`orders_as_of`] = ordersAsOf;
        }
        if (computedAt !== undefined) {
          _payload[`computed_at`] = computedAt;
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, customersOrganizationMetricsListSpecs, { method: "get" });
customersOrganizations
  .command(`customers-organization-metrics-freshness`)
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
const customersOrganizationMetricsRefreshSpecs: PromptSpec[] = [
  { key: "asOf", option: "--as-of <as-of>", name: "as_of", description: "Anchor for the rolling windows — pass back the value the previous call returned.", type: "string", required: false },
  { key: "cursor", option: "--cursor <cursor>", name: "cursor", description: "Continue an unfinished refresh: the value the previous call returned, verbatim. It is the id of the last organization processed, so only a value this API handed out ever resolves.", type: "string", required: false },
  { key: "organizationIds", option: "--organization-ids [organization-ids...]", name: "organization_ids", description: "Refresh exactly these organizations in one call instead of walking all of them.", type: "array", required: false },
];
customersOrganizations
  .command(`customers-organization-metrics-refresh`)
  .description(`Revenue lives in the orders app and cannot be joined (ADR-0055: no cross-app FK, grant or view), so it is PULLED: this route walks organizations in id order, asks orders.reports.customer-rollup about a batch of them at a time and materializes the answer into organization_metrics — one row per organization, all-zero for those that never ordered, so that 'never bought' rules match something. Rows are only rewritten when a value actually changed, so a routine refresh costs almost no writes. Bounded by a wall-clock budget below the gateway's upstream timeout: while 'done' is false, POST again with the returned 'cursor' AND 'as_of' (pinning as_of is what stops the rolling windows sliding during a multi-call refresh). 'organization_ids' refreshes exactly those organizations in a single call — the targeted path after a customer ordered.`)
  .option(`--as-of <as-of>`, `Anchor for the rolling windows — pass back the value the previous call returned.`)
  .option(`--cursor <cursor>`, `Continue an unfinished refresh: the value the previous call returned, verbatim. It is the id of the last organization processed, so only a value this API handed out ever resolves.`)
  .option(`--organization-ids [organization-ids...]`, `Refresh exactly these organizations in one call instead of walking all of them.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { asOf, cursor, organizationIds } = await promptForMissing(
          _options,
          customersOrganizationMetricsRefreshSpecs,
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, customersOrganizationMetricsRefreshSpecs, { method: "post" });
const customersOrganizationMetricsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The organization metrics row to read.", type: "string", required: true, resource: { listPath: "/customers/organization_metrics", hasLimit: true } },
];
customersOrganizations
  .command(`customers-organization-metrics-get`)
  .description(`What an organization has BOUGHT, materialized into this app from the orders app: lifetime revenue, revenue over the last 30/90/365 days, order count, average order value, and the first and last order dates. Revenue lives in orders and may not be joined (ADR-0055: no cross-app foreign key, grant or view), so it is pulled on a schedule and stored here — one row per organization, all-zero for a company that never ordered, so that a "never bought anything" rule has something to match. One company's numbers by the metrics row id. All zeroes mean the company has never ordered, not that the projection is missing — a missing row means the refresh has not reached that company yet.`)
  .option(`--id <id>`, `The organization metrics row to read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersOrganizationMetricsGetSpecs,
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, customersOrganizationMetricsGetSpecs, { method: "get" });
const listSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Filter to exactly one company. `GET /customers/organizations/{id}` is the direct form; this exists because the list honours it too.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Filter by the EXACT company name — this is an equality, not a search. There is no substring or fuzzy match on this API.", type: "string", required: false },
  { key: "vatId", option: "--vat-id <vat-id>", name: "vat_id", description: "Look a company up by its VAT id — the check an integration runs before founding a duplicate.", type: "string", required: false },
  { key: "branche", option: "--branche <branche>", name: "branche", description: "Filter by exact industry. Free text a merchant typed, matched exactly and case-sensitively — 'Maschinenbau' does not find 'maschinenbau', and there is no substring search to fall back on.", type: "string", required: false },
  { key: "customerNumber", option: "--customer-number <customer-number>", name: "customer_number", description: "Look a company up by its ERP number — the lookup an ERP integration and a service desk both start from. Exact match; the real numbers come from the merchant, so the example here resolves nowhere.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Filter by status — access, not pipeline.", type: "string", required: false, enum: ["active","blocked"] },
  { key: "lifecycleStage", option: "--lifecycle-stage <lifecycle-stage>", name: "lifecycle_stage", description: "Filter by pipeline stage. One of the tenant's own stages (GET /customers/lifecycle-stages); a fresh install starts with lead, prospect, customer, churned.", type: "string", required: false },
  { key: "paymentTerms", option: "--payment-terms <payment-terms>", name: "payment_terms", description: "Filter to rows whose `payment_terms` is exactly this value. When this company has to pay — one of the tenant's own terms (GET /customers/payment-terms, seeded with prepayment, direct_debit, net_7/14/30/60/90). Null means nothing was agreed and the order flow falls back to the market's `default_payment_terms`. This is a commercial term, not a payment method: HOW they pay is the payments app's business.", type: "string", required: false },
  { key: "creditLimitMode", option: "--credit-limit-mode <credit-limit-mode>", name: "credit_limit_mode", description: "Filter to rows whose `credit_limit_mode` is exactly this value. Whether this company buys on credit, and how far: 'unset' (nobody decided — whoever checks credit applies its own fallback), 'limited' (open receivables up to `credit_limit`) or 'unlimited' (no ceiling, by decision). The mode is the decision; the amount exists only for 'limited'.", type: "string", required: false, enum: ["unset","limited","unlimited"] },
  { key: "creditLimit", option: "--credit-limit <credit-limit>", name: "credit_limit", description: "Filter to rows whose `credit_limit` is exactly this value. Ceiling on open receivables in the market's currency, and one of the inputs that decide whether an order is accepted at all. Set exactly when `credit_limit_mode` is 'limited', and then above 0; null otherwise — read the mode, never the null, to know whether there is a ceiling.", type: "number", required: false },
  { key: "balance", option: "--balance <balance>", name: "balance", description: "Filter to rows whose `balance` is exactly this value. What this company owes right now, in the market's currency, as its accounting system last reported it — the figure a credit limit is compared against, and the reason the limit could check nothing on its own. A COPY, never a live read: this app asks no accounting system anything, so the number is exactly as old as `source_synced_at` says and the tenant's `credit_check_max_age_hours` setting says how old is too old. Null means no source has ever reported one, which is NOT a balance of zero — reading it as nothing owed is the mistake this column exists to prevent. A negative figure is a credit balance.", type: "number", required: false },
  { key: "balanceDue", option: "--balance-due <balance-due>", name: "balance_due", description: "Filter to rows whose `balance_due` is exactly this value. How much of `balance` is already OVERDUE, in the same currency and from the same report. The difference between warning a customer and blocking one: a company at its limit with nothing overdue is buying normally, and one below its limit with an unpaid invoice from March is not. Null means no source has reported it; zero means nothing is overdue, and the two are not the same answer.", type: "number", required: false },
  { key: "priceList", option: "--price-list <price-list>", name: "price_list", description: "Filter to rows whose `price_list` is exactly this value. Code of the price list this company buys on — plain text pointing into the prices app. ADR-0055 forbids the cross-app foreign key, so nothing here checks it: a code that names no list simply prices nothing. `standard` is the list the prices app seeds on install.", type: "string", required: false },
  { key: "shippingAdvice", option: "--shipping-advice <shipping-advice>", name: "shipping_advice", description: "Filter by whether a part delivery is accepted. `complete` is the set of companies whose orders may not be split, which is what a warehouse wanting to know its constrained customers asks for.", type: "string", required: false, enum: ["complete","partial"] },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Filter to the companies served out of one warehouse. Exact match on the code the inventories app owns; the real codes come from the merchant, so the example here resolves nowhere.", type: "string", required: false },
  { key: "deliveryBlock", option: "--delivery-block <delivery-block>", name: "delivery_block", description: "Filter to companies whose shipments are stopped.", type: "boolean", required: false },
  { key: "externalTeamId", option: "--external-team-id <external-team-id>", name: "external_team_id", description: "Find the organization behind a platform team id. The reverse of the mirror, and the way an auth-side id becomes a customer record.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Filter to rows whose `external_id` is exactly this value. The key this company has in the system that OWNS it — the ERP's own key for the customer, not the number a human quotes (that is `customer_number`). Often a GUID; it is stored verbatim, whatever shape the source uses. Unique per tenant where set, so an import upserts on it instead of matching on a name. Null for a company the shop itself created.", type: "string", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When this row was last confirmed against its source. What a delta run asks for changes since, and what tells an operator that a feed has gone quiet — a row edited in the Cockpit does not touch it, because it says when the SOURCE was last seen, not when the row changed. Null for a row no source owns.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When this company record was created in this app. Not when the customer relationship began — an ERP import creates decade-old customers today.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When any column of this row last changed.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customersOrganizations
  .command(`list`)
  .description(`An organization is a buying COMPANY — the unit a contract, a credit limit, a price list and a payment term belong to, and the unit an order is placed on behalf of. It is not a household and not a person: the people are \`contacts\`, and a company with no contacts yet is a perfectly normal row. Every organization is mirrored into platform auth as a team, so a name written here is the name storefront authentication shows. The company list a sales or service desk works from, and the read a segment rule is written against. Every column of the table is a filter and the page is \`limit\`/\`offset\`/\`order\` — including the two that are constantly confused: \`status\` is ACCESS (active or blocked) and \`lifecycle_stage\` is the sales PIPELINE, so filtering the wrong one answers with the wrong companies rather than with an error.`)
  .option(`--id <id>`, `Filter to exactly one company. \`GET /customers/organizations/{id}\` is the direct form; this exists because the list honours it too.`)
  .option(`--name <name>`, `Filter by the EXACT company name — this is an equality, not a search. There is no substring or fuzzy match on this API.`)
  .option(`--vat-id <vat-id>`, `Look a company up by its VAT id — the check an integration runs before founding a duplicate.`)
  .option(`--branche <branche>`, `Filter by exact industry. Free text a merchant typed, matched exactly and case-sensitively — 'Maschinenbau' does not find 'maschinenbau', and there is no substring search to fall back on.`)
  .option(`--customer-number <customer-number>`, `Look a company up by its ERP number — the lookup an ERP integration and a service desk both start from. Exact match; the real numbers come from the merchant, so the example here resolves nowhere.`)
  .option(`--status <status>`, `Filter by status — access, not pipeline.`)
  .option(`--lifecycle-stage <lifecycle-stage>`, `Filter by pipeline stage. One of the tenant's own stages (GET /customers/lifecycle-stages); a fresh install starts with lead, prospect, customer, churned.`)
  .option(`--payment-terms <payment-terms>`, `Filter to rows whose \`payment_terms\` is exactly this value. When this company has to pay — one of the tenant's own terms (GET /customers/payment-terms, seeded with prepayment, direct_debit, net_7/14/30/60/90). Null means nothing was agreed and the order flow falls back to the market's \`default_payment_terms\`. This is a commercial term, not a payment method: HOW they pay is the payments app's business.`)
  .option(`--credit-limit-mode <credit-limit-mode>`, `Filter to rows whose \`credit_limit_mode\` is exactly this value. Whether this company buys on credit, and how far: 'unset' (nobody decided — whoever checks credit applies its own fallback), 'limited' (open receivables up to \`credit_limit\`) or 'unlimited' (no ceiling, by decision). The mode is the decision; the amount exists only for 'limited'.`)
  .option(`--credit-limit <credit-limit>`, `Filter to rows whose \`credit_limit\` is exactly this value. Ceiling on open receivables in the market's currency, and one of the inputs that decide whether an order is accepted at all. Set exactly when \`credit_limit_mode\` is 'limited', and then above 0; null otherwise — read the mode, never the null, to know whether there is a ceiling.`, parseInteger)
  .option(`--balance <balance>`, `Filter to rows whose \`balance\` is exactly this value. What this company owes right now, in the market's currency, as its accounting system last reported it — the figure a credit limit is compared against, and the reason the limit could check nothing on its own. A COPY, never a live read: this app asks no accounting system anything, so the number is exactly as old as \`source_synced_at\` says and the tenant's \`credit_check_max_age_hours\` setting says how old is too old. Null means no source has ever reported one, which is NOT a balance of zero — reading it as nothing owed is the mistake this column exists to prevent. A negative figure is a credit balance.`, parseInteger)
  .option(`--balance-due <balance-due>`, `Filter to rows whose \`balance_due\` is exactly this value. How much of \`balance\` is already OVERDUE, in the same currency and from the same report. The difference between warning a customer and blocking one: a company at its limit with nothing overdue is buying normally, and one below its limit with an unpaid invoice from March is not. Null means no source has reported it; zero means nothing is overdue, and the two are not the same answer.`, parseInteger)
  .option(`--price-list <price-list>`, `Filter to rows whose \`price_list\` is exactly this value. Code of the price list this company buys on — plain text pointing into the prices app. ADR-0055 forbids the cross-app foreign key, so nothing here checks it: a code that names no list simply prices nothing. \`standard\` is the list the prices app seeds on install.`)
  .option(`--shipping-advice <shipping-advice>`, `Filter by whether a part delivery is accepted. \`complete\` is the set of companies whose orders may not be split, which is what a warehouse wanting to know its constrained customers asks for.`)
  .option(`--location-code <location-code>`, `Filter to the companies served out of one warehouse. Exact match on the code the inventories app owns; the real codes come from the merchant, so the example here resolves nowhere.`)
  .option(
    `--delivery-block [value]`,
    `Filter to companies whose shipments are stopped.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--external-team-id <external-team-id>`, `Find the organization behind a platform team id. The reverse of the mirror, and the way an auth-side id becomes a customer record.`)
  .option(`--external-id <external-id>`, `Filter to rows whose \`external_id\` is exactly this value. The key this company has in the system that OWNS it — the ERP's own key for the customer, not the number a human quotes (that is \`customer_number\`). Often a GUID; it is stored verbatim, whatever shape the source uses. Unique per tenant where set, so an import upserts on it instead of matching on a name. Null for a company the shop itself created.`)
  .option(`--source-synced-at <source-synced-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When this row was last confirmed against its source. What a delta run asks for changes since, and what tells an operator that a feed has gone quiet — a row edited in the Cockpit does not touch it, because it says when the SOURCE was last seen, not when the row changed. Null for a row no source owns.`)
  .option(`--created-at <created-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When this company record was created in this app. Not when the customer relationship began — an ERP import creates decade-old customers today.`)
  .option(`--updated-at <updated-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When any column of this row last changed.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, name, vatId, branche, customerNumber, status, lifecycleStage, paymentTerms, creditLimitMode, creditLimit, balance, balanceDue, priceList, shippingAdvice, locationCode, deliveryBlock, externalTeamId, externalId, sourceSyncedAt, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (vatId !== undefined) {
          _payload[`vat_id`] = vatId;
        }
        if (branche !== undefined) {
          _payload[`branche`] = branche;
        }
        if (customerNumber !== undefined) {
          _payload[`customer_number`] = customerNumber;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (lifecycleStage !== undefined) {
          _payload[`lifecycle_stage`] = lifecycleStage;
        }
        if (paymentTerms !== undefined) {
          _payload[`payment_terms`] = paymentTerms;
        }
        if (creditLimitMode !== undefined) {
          _payload[`credit_limit_mode`] = creditLimitMode;
        }
        if (creditLimit !== undefined) {
          _payload[`credit_limit`] = creditLimit;
        }
        if (balance !== undefined) {
          _payload[`balance`] = balance;
        }
        if (balanceDue !== undefined) {
          _payload[`balance_due`] = balanceDue;
        }
        if (priceList !== undefined) {
          _payload[`price_list`] = priceList;
        }
        if (shippingAdvice !== undefined) {
          _payload[`shipping_advice`] = shippingAdvice;
        }
        if (locationCode !== undefined) {
          _payload[`location_code`] = locationCode;
        }
        if (deliveryBlock !== undefined) {
          _payload[`delivery_block`] = deliveryBlock;
        }
        if (externalTeamId !== undefined) {
          _payload[`external_team_id`] = externalTeamId;
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Legal or trading name of the COMPANY — never a person. Mirrored to the platform team, so a rename here is a rename in storefront auth too.", type: "string", required: true },
  { key: "balance", option: "--balance <balance>", name: "balance", description: "What this company owes right now, in the market's currency, as its accounting system last reported it — the figure a credit limit is compared against, and the reason the limit could check nothing on its own. A COPY, never a live read: this app asks no accounting system anything, so the number is exactly as old as `source_synced_at` says and the tenant's `credit_check_max_age_hours` setting says how old is too old. Null means no source has ever reported one, which is NOT a balance of zero — reading it as nothing owed is the mistake this column exists to prevent. A negative figure is a credit balance. Written by whatever imports the accounting figures. Send `source_synced_at` with it — a balance whose age nobody knows cannot be used for a credit decision at all.", type: "number", required: false },
  { key: "balanceDue", option: "--balance-due <balance-due>", name: "balance_due", description: "How much of `balance` is already OVERDUE, in the same currency and from the same report. The difference between warning a customer and blocking one: a company at its limit with nothing overdue is buying normally, and one below its limit with an unpaid invoice from March is not. Null means no source has reported it; zero means nothing is overdue, and the two are not the same answer. Written by the same import, and null rather than 0 where the source reported nothing.", type: "number", required: false },
  { key: "branche", option: "--branche <branche>", name: "branche", description: "Industry / line of business, in the merchant's own words. Free text: no NACE code, no WZ number, no list to pick from — whatever somebody typed on the company. Segment rules read it, and both `?branche=` and an `eq` condition match it EXACTLY and case-sensitively, so 'Maschinenbau' and 'maschinenbau' are two different industries. Indexed, so it stays cheap to filter on.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "When this company record was created in this app. Not when the customer relationship began — an ERP import creates decade-old customers today. Accepted on create only from a call naming no acting contact — an operator, an import, an ERP carrying a record over with its original date. A buyer sending it, or any update changing it, is a 400 `server_owned_field`.", type: "string", required: false },
  { key: "creditLimit", option: "--credit-limit <credit-limit>", name: "credit_limit", description: "Ceiling on open receivables in the market's currency, and one of the inputs that decide whether an order is accepted at all. Set exactly when `credit_limit_mode` is 'limited', and then above 0; null otherwise — read the mode, never the null, to know whether there is a ceiling. Required with `credit_limit_mode` 'limited' and refused with any other mode (400 `limited_mode_requires_limit` / `limit_requires_limited_mode`).", type: "number", required: false },
  { key: "creditLimitMode", option: "--credit-limit-mode <credit-limit-mode>", name: "credit_limit_mode", description: "Whether this company buys on credit, and how far: 'unset' (nobody decided — whoever checks credit applies its own fallback), 'limited' (open receivables up to `credit_limit`) or 'unlimited' (no ceiling, by decision). The mode is the decision; the amount exists only for 'limited'. A create naming neither this nor `credit_limit` inherits the market's `default_credit_limit_mode` (and, for 'limited', `default_credit_limit`). Leaving 'limited' without sending `credit_limit` clears the amount.", type: "string", required: false, enum: ["unset","limited","unlimited"] },
  { key: "customerNumber", option: "--customer-number <customer-number>", name: "customer_number", description: "The number this company carries in the merchant's own ERP — the key an ERP integration joins on, and what a service desk asks for on the phone. Free text with NO enforced format (a letter prefix and a running number is the common shape, but plain digits are just as valid), unique per tenant while it is set, and one of the fields duplicate detection can be pointed at. The real values come out of the merchant's ERP; nothing published here can name one that exists. A second company with the same number is a 409.", type: "string", required: false },
  { key: "deliveryBlock", option: "--delivery-block <delivery-block>", name: "delivery_block", description: "True stops SHIPMENTS to this company while leaving login and ordering alone — the \"they may order, we are just not sending anything until this is settled\" state. Separate from `status` on purpose: blocking the login to stop a delivery locks out the people who could settle it. Default false.", type: "boolean", required: false },
  { key: "lifecycleStage", option: "--lifecycle-stage <lifecycle-stage>", name: "lifecycle_stage", description: "Where the company stands in the SALES PIPELINE, and a deliberately separate axis from `status`: a prospect that may log in and a customer that may not are both ordinary states, and one column cannot say that. One of the tenant's own stages (GET /customers/lifecycle-stages) — a fresh install starts with lead, prospect, customer, churned, and the merchant may add their own. Nothing moves it automatically; a stage changes when a person or an integration says so. A create without it gets the stage flagged as default; a value the tenant does not keep is a 400.", type: "string", required: false },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Code of the warehouse this company's availability is computed against — plain text naming `locations.code` in the inventories app. A CODE and not a foreign key: ADR-0055 forbids the cross-app one, and nothing here checks it, so a code that names no location simply computes availability against the default. It belongs on the customer rather than in inventories because inventories models what is IN a warehouse and not which customer buys out of which — a company served from the northern depot is a fact about the company. Null means no warehouse was agreed. Not validated against the inventories app — ADR-0055 forbids the cross-app read, so a code that names no location is stored and computes availability against the default.", type: "string", required: false },
  { key: "paymentTerms", option: "--payment-terms <payment-terms>", name: "payment_terms", description: "When this company has to pay — one of the tenant's own terms (GET /customers/payment-terms, seeded with prepayment, direct_debit, net_7/14/30/60/90). Null means nothing was agreed and the order flow falls back to the market's `default_payment_terms`. This is a commercial term, not a payment method: HOW they pay is the payments app's business. A create without it inherits the market's `default_payment_terms`; a value the tenant does not keep is a 400.", type: "string", required: false },
  { key: "priceList", option: "--price-list <price-list>", name: "price_list", description: "Code of the price list this company buys on — plain text pointing into the prices app. ADR-0055 forbids the cross-app foreign key, so nothing here checks it: a code that names no list simply prices nothing. `standard` is the list the prices app seeds on install.", type: "string", required: false },
  { key: "settings", option: "--settings <settings>", name: "settings", description: "Free-form per-organization settings, keyed by whatever the merchant's own integrations agree on — this app never branches on a key in here. Segment rules can address a TOP-LEVEL key as `setting:<key>`, which is the whole reason the blob survives: a flag an ERP writes here selects a segment without a schema change. Commercial terms are typed columns now (payment_terms, credit_limit); writing them back in here leaves the checkout reading the column and finding nothing. Replaced wholesale on an update — send the whole object, not a patch of it.", type: "object", required: false },
  { key: "shippingAdvice", option: "--shipping-advice <shipping-advice>", name: "shipping_advice", description: "Whether this company accepts a PART delivery: 'partial' ships what is available and lets the rest follow, 'complete' holds the whole order until every line can go at once. It decides whether a basket may offer a part quantity in the first place, so a checkout that ignores it promises a delivery date the warehouse cannot keep. Null means nothing was agreed and the store's own default applies. Only these two values — it is an ERP's own delivery flag, and there is no third way to ship an order. Null leaves it unagreed.", type: "string", required: false, enum: ["complete","partial"] },
  { key: "status", option: "--status <status>", name: "status", description: "ACCESS, not pipeline: 'blocked' stops this company's people from logging in and is where a rejected registration parks the company it founded. 'active' is the default. For how far along a company is, read `lifecycle_stage` — reading this one for that is how a won deal gets locked out. Default 'active'.", type: "string", required: false, enum: ["active","blocked"] },
  { key: "vatId", option: "--vat-id <vat-id>", name: "vat_id", description: "VAT identification number (USt-IdNr. in Germany) — the closest thing a B2B buyer has to a legal identity. Validated against the EU VIES service when the tenant's `organization_vat_id_required` setting is on, and stored verbatim otherwise, including for buyers outside the EU.", type: "string", required: false },
];
customersOrganizations
  .command(`create`)
  .description(`An organization is a buying COMPANY — the unit a contract, a credit limit, a price list and a payment term belong to, and the unit an order is placed on behalf of. It is not a household and not a person: the people are \`contacts\`, and a company with no contacts yet is a perfectly normal row. Every organization is mirrored into platform auth as a team, so a name written here is the name storefront authentication shows. Registers a company as a customer. It is mirrored into platform auth as a team in the same call, so a failure of the identity service fails the create rather than leaving half a company behind. \`payment_terms\` and \`lifecycle_stage\` name values from this tenant's own sets, and a newly founded company inherits the tenant's \`default_payment_terms\` / \`default_credit_limit\` where the merchant set them. \`name\` is the only field a create cannot omit; everything else is optional or defaulted by the database. Two rows of this tenant may not share \`customer_number\` (while customer_number IS NOT NULL), \`external_team_id\` (while external_team_id IS NOT NULL) or \`external_id\` (while external_id IS NOT NULL).`)
  .option(`--name <name>`, `Legal or trading name of the COMPANY — never a person. Mirrored to the platform team, so a rename here is a rename in storefront auth too.`)
  .option(`--balance <balance>`, `What this company owes right now, in the market's currency, as its accounting system last reported it — the figure a credit limit is compared against, and the reason the limit could check nothing on its own. A COPY, never a live read: this app asks no accounting system anything, so the number is exactly as old as \`source_synced_at\` says and the tenant's \`credit_check_max_age_hours\` setting says how old is too old. Null means no source has ever reported one, which is NOT a balance of zero — reading it as nothing owed is the mistake this column exists to prevent. A negative figure is a credit balance. Written by whatever imports the accounting figures. Send \`source_synced_at\` with it — a balance whose age nobody knows cannot be used for a credit decision at all.`, parseInteger)
  .option(`--balance-due <balance-due>`, `How much of \`balance\` is already OVERDUE, in the same currency and from the same report. The difference between warning a customer and blocking one: a company at its limit with nothing overdue is buying normally, and one below its limit with an unpaid invoice from March is not. Null means no source has reported it; zero means nothing is overdue, and the two are not the same answer. Written by the same import, and null rather than 0 where the source reported nothing.`, parseInteger)
  .option(`--branche <branche>`, `Industry / line of business, in the merchant's own words. Free text: no NACE code, no WZ number, no list to pick from — whatever somebody typed on the company. Segment rules read it, and both \`?branche=\` and an \`eq\` condition match it EXACTLY and case-sensitively, so 'Maschinenbau' and 'maschinenbau' are two different industries. Indexed, so it stays cheap to filter on.`)
  .option(`--created-at <created-at>`, `When this company record was created in this app. Not when the customer relationship began — an ERP import creates decade-old customers today. Accepted on create only from a call naming no acting contact — an operator, an import, an ERP carrying a record over with its original date. A buyer sending it, or any update changing it, is a 400 \`server_owned_field\`.`)
  .option(`--credit-limit <credit-limit>`, `Ceiling on open receivables in the market's currency, and one of the inputs that decide whether an order is accepted at all. Set exactly when \`credit_limit_mode\` is 'limited', and then above 0; null otherwise — read the mode, never the null, to know whether there is a ceiling. Required with \`credit_limit_mode\` 'limited' and refused with any other mode (400 \`limited_mode_requires_limit\` / \`limit_requires_limited_mode\`).`, parseInteger)
  .option(`--credit-limit-mode <credit-limit-mode>`, `Whether this company buys on credit, and how far: 'unset' (nobody decided — whoever checks credit applies its own fallback), 'limited' (open receivables up to \`credit_limit\`) or 'unlimited' (no ceiling, by decision). The mode is the decision; the amount exists only for 'limited'. A create naming neither this nor \`credit_limit\` inherits the market's \`default_credit_limit_mode\` (and, for 'limited', \`default_credit_limit\`). Leaving 'limited' without sending \`credit_limit\` clears the amount.`)
  .option(`--customer-number <customer-number>`, `The number this company carries in the merchant's own ERP — the key an ERP integration joins on, and what a service desk asks for on the phone. Free text with NO enforced format (a letter prefix and a running number is the common shape, but plain digits are just as valid), unique per tenant while it is set, and one of the fields duplicate detection can be pointed at. The real values come out of the merchant's ERP; nothing published here can name one that exists. A second company with the same number is a 409.`)
  .option(
    `--delivery-block [value]`,
    `True stops SHIPMENTS to this company while leaving login and ordering alone — the "they may order, we are just not sending anything until this is settled" state. Separate from \`status\` on purpose: blocking the login to stop a delivery locks out the people who could settle it. Default false.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--lifecycle-stage <lifecycle-stage>`, `Where the company stands in the SALES PIPELINE, and a deliberately separate axis from \`status\`: a prospect that may log in and a customer that may not are both ordinary states, and one column cannot say that. One of the tenant's own stages (GET /customers/lifecycle-stages) — a fresh install starts with lead, prospect, customer, churned, and the merchant may add their own. Nothing moves it automatically; a stage changes when a person or an integration says so. A create without it gets the stage flagged as default; a value the tenant does not keep is a 400.`)
  .option(`--location-code <location-code>`, `Code of the warehouse this company's availability is computed against — plain text naming \`locations.code\` in the inventories app. A CODE and not a foreign key: ADR-0055 forbids the cross-app one, and nothing here checks it, so a code that names no location simply computes availability against the default. It belongs on the customer rather than in inventories because inventories models what is IN a warehouse and not which customer buys out of which — a company served from the northern depot is a fact about the company. Null means no warehouse was agreed. Not validated against the inventories app — ADR-0055 forbids the cross-app read, so a code that names no location is stored and computes availability against the default.`)
  .option(`--payment-terms <payment-terms>`, `When this company has to pay — one of the tenant's own terms (GET /customers/payment-terms, seeded with prepayment, direct_debit, net_7/14/30/60/90). Null means nothing was agreed and the order flow falls back to the market's \`default_payment_terms\`. This is a commercial term, not a payment method: HOW they pay is the payments app's business. A create without it inherits the market's \`default_payment_terms\`; a value the tenant does not keep is a 400.`)
  .option(`--price-list <price-list>`, `Code of the price list this company buys on — plain text pointing into the prices app. ADR-0055 forbids the cross-app foreign key, so nothing here checks it: a code that names no list simply prices nothing. \`standard\` is the list the prices app seeds on install.`)
  .option(`--settings <settings>`, `Free-form per-organization settings, keyed by whatever the merchant's own integrations agree on — this app never branches on a key in here. Segment rules can address a TOP-LEVEL key as \`setting:<key>\`, which is the whole reason the blob survives: a flag an ERP writes here selects a segment without a schema change. Commercial terms are typed columns now (payment_terms, credit_limit); writing them back in here leaves the checkout reading the column and finding nothing. Replaced wholesale on an update — send the whole object, not a patch of it.`)
  .option(`--shipping-advice <shipping-advice>`, `Whether this company accepts a PART delivery: 'partial' ships what is available and lets the rest follow, 'complete' holds the whole order until every line can go at once. It decides whether a basket may offer a part quantity in the first place, so a checkout that ignores it promises a delivery date the warehouse cannot keep. Null means nothing was agreed and the store's own default applies. Only these two values — it is an ERP's own delivery flag, and there is no third way to ship an order. Null leaves it unagreed.`)
  .option(`--status <status>`, `ACCESS, not pipeline: 'blocked' stops this company's people from logging in and is where a rejected registration parks the company it founded. 'active' is the default. For how far along a company is, read \`lifecycle_stage\` — reading this one for that is how a won deal gets locked out. Default 'active'.`)
  .option(`--vat-id <vat-id>`, `VAT identification number (USt-IdNr. in Germany) — the closest thing a B2B buyer has to a legal identity. Validated against the EU VIES service when the tenant's \`organization_vat_id_required\` setting is on, and stored verbatim otherwise, including for buyers outside the EU.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, balance, balanceDue, branche, createdAt, creditLimit, creditLimitMode, customerNumber, deliveryBlock, lifecycleStage, locationCode, paymentTerms, priceList, settings, shippingAdvice, status, vatId } = await promptForMissing(
          _options,
          createSpecs,
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
        if (balance !== undefined) {
          _payload[`balance`] = balance;
        }
        if (balanceDue !== undefined) {
          _payload[`balance_due`] = balanceDue;
        }
        if (branche !== undefined) {
          _payload[`branche`] = branche;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
        }
        if (creditLimit !== undefined) {
          _payload[`credit_limit`] = creditLimit;
        }
        if (creditLimitMode !== undefined) {
          _payload[`credit_limit_mode`] = creditLimitMode;
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
        if (locationCode !== undefined) {
          _payload[`location_code`] = locationCode;
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
        if (shippingAdvice !== undefined) {
          _payload[`shipping_advice`] = shippingAdvice;
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The organization to delete.", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
];
customersOrganizations
  .command(`delete`)
  .description(`An organization is a buying COMPANY — the unit a contract, a credit limit, a price list and a payment term belong to, and the unit an order is placed on behalf of. It is not a household and not a person: the people are \`contacts\`, and a company with no contacts yet is a perfectly normal row. Every organization is mirrored into platform auth as a team, so a name written here is the name storefront authentication shows. Removes the company and its mirrored team. Its people are NOT deleted: they become standalone buyers who can still sign in and still order, which is the behaviour a merchant winding down a subsidiary wants. Deleting one takes every \`contact_events\`, \`addresses\`, \`contact_points\`, \`organization_metrics\` and \`segment_members\` row that points at it with it and clears \`contacts.organization_id\` rather than deleting those rows — the foreign keys decide, not this route.`)
  .option(`--id <id>`, `The organization to delete.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`customers-organizations delete`);
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The organization to read.", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
];
customersOrganizations
  .command(`get`)
  .description(`An organization is a buying COMPANY — the unit a contract, a credit limit, a price list and a payment term belong to, and the unit an order is placed on behalf of. It is not a household and not a person: the people are \`contacts\`, and a company with no contacts yet is a perfectly normal row. Every organization is mirrored into platform auth as a team, so a name written here is the name storefront authentication shows. One company by id, with its commercial terms as stored. What it has BOUGHT is not in here — that is the \`organization_metrics\` row for the same id, refreshed on its own schedule.`)
  .option(`--id <id>`, `The organization to read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The organization to update.", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
  { key: "balance", option: "--balance <balance>", name: "balance", description: "What this company owes right now, in the market's currency, as its accounting system last reported it — the figure a credit limit is compared against, and the reason the limit could check nothing on its own. A COPY, never a live read: this app asks no accounting system anything, so the number is exactly as old as `source_synced_at` says and the tenant's `credit_check_max_age_hours` setting says how old is too old. Null means no source has ever reported one, which is NOT a balance of zero — reading it as nothing owed is the mistake this column exists to prevent. A negative figure is a credit balance. Written by whatever imports the accounting figures. Send `source_synced_at` with it — a balance whose age nobody knows cannot be used for a credit decision at all.", type: "number", required: false },
  { key: "balanceDue", option: "--balance-due <balance-due>", name: "balance_due", description: "How much of `balance` is already OVERDUE, in the same currency and from the same report. The difference between warning a customer and blocking one: a company at its limit with nothing overdue is buying normally, and one below its limit with an unpaid invoice from March is not. Null means no source has reported it; zero means nothing is overdue, and the two are not the same answer. Written by the same import, and null rather than 0 where the source reported nothing.", type: "number", required: false },
  { key: "branche", option: "--branche <branche>", name: "branche", description: "Industry / line of business, in the merchant's own words. Free text: no NACE code, no WZ number, no list to pick from — whatever somebody typed on the company. Segment rules read it, and both `?branche=` and an `eq` condition match it EXACTLY and case-sensitively, so 'Maschinenbau' and 'maschinenbau' are two different industries. Indexed, so it stays cheap to filter on.", type: "string", required: false },
  { key: "creditLimit", option: "--credit-limit <credit-limit>", name: "credit_limit", description: "Ceiling on open receivables in the market's currency, and one of the inputs that decide whether an order is accepted at all. Set exactly when `credit_limit_mode` is 'limited', and then above 0; null otherwise — read the mode, never the null, to know whether there is a ceiling. Required with `credit_limit_mode` 'limited' and refused with any other mode (400 `limited_mode_requires_limit` / `limit_requires_limited_mode`).", type: "number", required: false },
  { key: "creditLimitMode", option: "--credit-limit-mode <credit-limit-mode>", name: "credit_limit_mode", description: "Whether this company buys on credit, and how far: 'unset' (nobody decided — whoever checks credit applies its own fallback), 'limited' (open receivables up to `credit_limit`) or 'unlimited' (no ceiling, by decision). The mode is the decision; the amount exists only for 'limited'. A create naming neither this nor `credit_limit` inherits the market's `default_credit_limit_mode` (and, for 'limited', `default_credit_limit`). Leaving 'limited' without sending `credit_limit` clears the amount.", type: "string", required: false, enum: ["unset","limited","unlimited"] },
  { key: "customerNumber", option: "--customer-number <customer-number>", name: "customer_number", description: "The number this company carries in the merchant's own ERP — the key an ERP integration joins on, and what a service desk asks for on the phone. Free text with NO enforced format (a letter prefix and a running number is the common shape, but plain digits are just as valid), unique per tenant while it is set, and one of the fields duplicate detection can be pointed at. The real values come out of the merchant's ERP; nothing published here can name one that exists. A second company with the same number is a 409.", type: "string", required: false },
  { key: "deliveryBlock", option: "--delivery-block <delivery-block>", name: "delivery_block", description: "True stops SHIPMENTS to this company while leaving login and ordering alone — the \"they may order, we are just not sending anything until this is settled\" state. Separate from `status` on purpose: blocking the login to stop a delivery locks out the people who could settle it. Default false.", type: "boolean", required: false },
  { key: "lifecycleStage", option: "--lifecycle-stage <lifecycle-stage>", name: "lifecycle_stage", description: "Where the company stands in the SALES PIPELINE, and a deliberately separate axis from `status`: a prospect that may log in and a customer that may not are both ordinary states, and one column cannot say that. One of the tenant's own stages (GET /customers/lifecycle-stages) — a fresh install starts with lead, prospect, customer, churned, and the merchant may add their own. Nothing moves it automatically; a stage changes when a person or an integration says so. A create without it gets the stage flagged as default; a value the tenant does not keep is a 400.", type: "string", required: false },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Code of the warehouse this company's availability is computed against — plain text naming `locations.code` in the inventories app. A CODE and not a foreign key: ADR-0055 forbids the cross-app one, and nothing here checks it, so a code that names no location simply computes availability against the default. It belongs on the customer rather than in inventories because inventories models what is IN a warehouse and not which customer buys out of which — a company served from the northern depot is a fact about the company. Null means no warehouse was agreed. Not validated against the inventories app — ADR-0055 forbids the cross-app read, so a code that names no location is stored and computes availability against the default.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Legal or trading name of the COMPANY — never a person. Mirrored to the platform team, so a rename here is a rename in storefront auth too.", type: "string", required: false },
  { key: "paymentTerms", option: "--payment-terms <payment-terms>", name: "payment_terms", description: "When this company has to pay — one of the tenant's own terms (GET /customers/payment-terms, seeded with prepayment, direct_debit, net_7/14/30/60/90). Null means nothing was agreed and the order flow falls back to the market's `default_payment_terms`. This is a commercial term, not a payment method: HOW they pay is the payments app's business. A create without it inherits the market's `default_payment_terms`; a value the tenant does not keep is a 400.", type: "string", required: false },
  { key: "priceList", option: "--price-list <price-list>", name: "price_list", description: "Code of the price list this company buys on — plain text pointing into the prices app. ADR-0055 forbids the cross-app foreign key, so nothing here checks it: a code that names no list simply prices nothing. `standard` is the list the prices app seeds on install.", type: "string", required: false },
  { key: "settings", option: "--settings <settings>", name: "settings", description: "Free-form per-organization settings, keyed by whatever the merchant's own integrations agree on — this app never branches on a key in here. Segment rules can address a TOP-LEVEL key as `setting:<key>`, which is the whole reason the blob survives: a flag an ERP writes here selects a segment without a schema change. Commercial terms are typed columns now (payment_terms, credit_limit); writing them back in here leaves the checkout reading the column and finding nothing. Replaced wholesale on an update — send the whole object, not a patch of it.", type: "object", required: false },
  { key: "shippingAdvice", option: "--shipping-advice <shipping-advice>", name: "shipping_advice", description: "Whether this company accepts a PART delivery: 'partial' ships what is available and lets the rest follow, 'complete' holds the whole order until every line can go at once. It decides whether a basket may offer a part quantity in the first place, so a checkout that ignores it promises a delivery date the warehouse cannot keep. Null means nothing was agreed and the store's own default applies. Only these two values — it is an ERP's own delivery flag, and there is no third way to ship an order. Null leaves it unagreed.", type: "string", required: false, enum: ["complete","partial"] },
  { key: "status", option: "--status <status>", name: "status", description: "ACCESS, not pipeline: 'blocked' stops this company's people from logging in and is where a rejected registration parks the company it founded. 'active' is the default. For how far along a company is, read `lifecycle_stage` — reading this one for that is how a won deal gets locked out. Default 'active'.", type: "string", required: false, enum: ["active","blocked"] },
  { key: "vatId", option: "--vat-id <vat-id>", name: "vat_id", description: "VAT identification number (USt-IdNr. in Germany) — the closest thing a B2B buyer has to a legal identity. Validated against the EU VIES service when the tenant's `organization_vat_id_required` setting is on, and stored verbatim otherwise, including for buyers outside the EU.", type: "string", required: false },
];
customersOrganizations
  .command(`update`)
  .description(`An organization is a buying COMPANY — the unit a contract, a credit limit, a price list and a payment term belong to, and the unit an order is placed on behalf of. It is not a household and not a person: the people are \`contacts\`, and a company with no contacts yet is a perfectly normal row. Every organization is mirrored into platform auth as a team, so a name written here is the name storefront authentication shows. A partial update — send only what changes. \`external_team_id\` is mirror-managed and ignored if sent. Blocking a company here is what stops it trading; moving it through the pipeline is \`lifecycle_stage\`, and the two are independent. Two rows of this tenant may not share \`customer_number\` (while customer_number IS NOT NULL), \`external_team_id\` (while external_team_id IS NOT NULL) or \`external_id\` (while external_id IS NOT NULL).`)
  .option(`--id <id>`, `The organization to update.`)
  .option(`--balance <balance>`, `What this company owes right now, in the market's currency, as its accounting system last reported it — the figure a credit limit is compared against, and the reason the limit could check nothing on its own. A COPY, never a live read: this app asks no accounting system anything, so the number is exactly as old as \`source_synced_at\` says and the tenant's \`credit_check_max_age_hours\` setting says how old is too old. Null means no source has ever reported one, which is NOT a balance of zero — reading it as nothing owed is the mistake this column exists to prevent. A negative figure is a credit balance. Written by whatever imports the accounting figures. Send \`source_synced_at\` with it — a balance whose age nobody knows cannot be used for a credit decision at all.`, parseInteger)
  .option(`--balance-due <balance-due>`, `How much of \`balance\` is already OVERDUE, in the same currency and from the same report. The difference between warning a customer and blocking one: a company at its limit with nothing overdue is buying normally, and one below its limit with an unpaid invoice from March is not. Null means no source has reported it; zero means nothing is overdue, and the two are not the same answer. Written by the same import, and null rather than 0 where the source reported nothing.`, parseInteger)
  .option(`--branche <branche>`, `Industry / line of business, in the merchant's own words. Free text: no NACE code, no WZ number, no list to pick from — whatever somebody typed on the company. Segment rules read it, and both \`?branche=\` and an \`eq\` condition match it EXACTLY and case-sensitively, so 'Maschinenbau' and 'maschinenbau' are two different industries. Indexed, so it stays cheap to filter on.`)
  .option(`--credit-limit <credit-limit>`, `Ceiling on open receivables in the market's currency, and one of the inputs that decide whether an order is accepted at all. Set exactly when \`credit_limit_mode\` is 'limited', and then above 0; null otherwise — read the mode, never the null, to know whether there is a ceiling. Required with \`credit_limit_mode\` 'limited' and refused with any other mode (400 \`limited_mode_requires_limit\` / \`limit_requires_limited_mode\`).`, parseInteger)
  .option(`--credit-limit-mode <credit-limit-mode>`, `Whether this company buys on credit, and how far: 'unset' (nobody decided — whoever checks credit applies its own fallback), 'limited' (open receivables up to \`credit_limit\`) or 'unlimited' (no ceiling, by decision). The mode is the decision; the amount exists only for 'limited'. A create naming neither this nor \`credit_limit\` inherits the market's \`default_credit_limit_mode\` (and, for 'limited', \`default_credit_limit\`). Leaving 'limited' without sending \`credit_limit\` clears the amount.`)
  .option(`--customer-number <customer-number>`, `The number this company carries in the merchant's own ERP — the key an ERP integration joins on, and what a service desk asks for on the phone. Free text with NO enforced format (a letter prefix and a running number is the common shape, but plain digits are just as valid), unique per tenant while it is set, and one of the fields duplicate detection can be pointed at. The real values come out of the merchant's ERP; nothing published here can name one that exists. A second company with the same number is a 409.`)
  .option(
    `--delivery-block [value]`,
    `True stops SHIPMENTS to this company while leaving login and ordering alone — the "they may order, we are just not sending anything until this is settled" state. Separate from \`status\` on purpose: blocking the login to stop a delivery locks out the people who could settle it. Default false.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--lifecycle-stage <lifecycle-stage>`, `Where the company stands in the SALES PIPELINE, and a deliberately separate axis from \`status\`: a prospect that may log in and a customer that may not are both ordinary states, and one column cannot say that. One of the tenant's own stages (GET /customers/lifecycle-stages) — a fresh install starts with lead, prospect, customer, churned, and the merchant may add their own. Nothing moves it automatically; a stage changes when a person or an integration says so. A create without it gets the stage flagged as default; a value the tenant does not keep is a 400.`)
  .option(`--location-code <location-code>`, `Code of the warehouse this company's availability is computed against — plain text naming \`locations.code\` in the inventories app. A CODE and not a foreign key: ADR-0055 forbids the cross-app one, and nothing here checks it, so a code that names no location simply computes availability against the default. It belongs on the customer rather than in inventories because inventories models what is IN a warehouse and not which customer buys out of which — a company served from the northern depot is a fact about the company. Null means no warehouse was agreed. Not validated against the inventories app — ADR-0055 forbids the cross-app read, so a code that names no location is stored and computes availability against the default.`)
  .option(`--name <name>`, `Legal or trading name of the COMPANY — never a person. Mirrored to the platform team, so a rename here is a rename in storefront auth too.`)
  .option(`--payment-terms <payment-terms>`, `When this company has to pay — one of the tenant's own terms (GET /customers/payment-terms, seeded with prepayment, direct_debit, net_7/14/30/60/90). Null means nothing was agreed and the order flow falls back to the market's \`default_payment_terms\`. This is a commercial term, not a payment method: HOW they pay is the payments app's business. A create without it inherits the market's \`default_payment_terms\`; a value the tenant does not keep is a 400.`)
  .option(`--price-list <price-list>`, `Code of the price list this company buys on — plain text pointing into the prices app. ADR-0055 forbids the cross-app foreign key, so nothing here checks it: a code that names no list simply prices nothing. \`standard\` is the list the prices app seeds on install.`)
  .option(`--settings <settings>`, `Free-form per-organization settings, keyed by whatever the merchant's own integrations agree on — this app never branches on a key in here. Segment rules can address a TOP-LEVEL key as \`setting:<key>\`, which is the whole reason the blob survives: a flag an ERP writes here selects a segment without a schema change. Commercial terms are typed columns now (payment_terms, credit_limit); writing them back in here leaves the checkout reading the column and finding nothing. Replaced wholesale on an update — send the whole object, not a patch of it.`)
  .option(`--shipping-advice <shipping-advice>`, `Whether this company accepts a PART delivery: 'partial' ships what is available and lets the rest follow, 'complete' holds the whole order until every line can go at once. It decides whether a basket may offer a part quantity in the first place, so a checkout that ignores it promises a delivery date the warehouse cannot keep. Null means nothing was agreed and the store's own default applies. Only these two values — it is an ERP's own delivery flag, and there is no third way to ship an order. Null leaves it unagreed.`)
  .option(`--status <status>`, `ACCESS, not pipeline: 'blocked' stops this company's people from logging in and is where a rejected registration parks the company it founded. 'active' is the default. For how far along a company is, read \`lifecycle_stage\` — reading this one for that is how a won deal gets locked out. Default 'active'.`)
  .option(`--vat-id <vat-id>`, `VAT identification number (USt-IdNr. in Germany) — the closest thing a B2B buyer has to a legal identity. Validated against the EU VIES service when the tenant's \`organization_vat_id_required\` setting is on, and stored verbatim otherwise, including for buyers outside the EU.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, balance, balanceDue, branche, creditLimit, creditLimitMode, customerNumber, deliveryBlock, lifecycleStage, locationCode, name, paymentTerms, priceList, settings, shippingAdvice, status, vatId } = await promptForMissing(
          _options,
          updateSpecs,
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
        if (balance !== undefined) {
          _payload[`balance`] = balance;
        }
        if (balanceDue !== undefined) {
          _payload[`balance_due`] = balanceDue;
        }
        if (branche !== undefined) {
          _payload[`branche`] = branche;
        }
        if (creditLimit !== undefined) {
          _payload[`credit_limit`] = creditLimit;
        }
        if (creditLimitMode !== undefined) {
          _payload[`credit_limit_mode`] = creditLimitMode;
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
        if (locationCode !== undefined) {
          _payload[`location_code`] = locationCode;
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
        if (shippingAdvice !== undefined) {
          _payload[`shipping_advice`] = shippingAdvice;
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, updateSpecs, { method: "put" });
