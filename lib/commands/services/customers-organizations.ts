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

const customersAddressFormatListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customersOrganizations
  .command(`customers-address-format-list`)
  .description(`The address type every revenexx app stores a postal address as, and the countries that carry rules for it. \`schema\` is the JSON Schema (2020-12) itself, with a versioned \`\$id\` (https://schemas.revenexx.com/apps/customers/address/1.1.0.json) an app pins its copy by; only \`country_code\` is required by the type, and what else an address needs depends on its country. \`countries\` lists every ISO 3166-1 code with rules, by code and name — read one with GET /customers/address-format/{country}. The same for every tenant: this is a contract, not data.`)
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
          customersAddressFormatListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/address-format`;
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, customersAddressFormatListSpecs, { method: "get" });
const customersAddressFormatGetSpecs: PromptSpec[] = [
  { key: "country", option: "--country <country>", name: "country", description: "ISO 3166-1 alpha-2 code, upper case.", type: "string", required: true, enum: ["AC","AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ","BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BV","BW","BY","BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CX","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE","EG","EH","ER","ES","ET","FI","FJ","FK","FM","FO","FR","GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY","HK","HM","HN","HR","HT","HU","ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT","JE","JM","JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA","NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PW","PY","QA","RE","RO","RS","RU","RW","SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ","TA","TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ","UA","UG","UM","US","UY","UZ","VA","VC","VE","VG","VI","VN","VU","WF","WS","XK","YE","YT","ZA","ZM","ZW"], resource: { listPath: "/customers/address-format", hasLimit: false } },
];
customersOrganizations
  .command(`customers-address-format-get`)
  .description(`What an address in one country looks like and needs: the fields in the order they are printed, the ones it requires, the postal-code pattern with an example, the word a form shows for each field that varies by country (de/en), the regions as ISO 3166-2 codes, and the contact fields (phone, email) every country takes but never prints. Derived from Google's libaddressinput data. A region the data names only in words carries \`code: null\`; an address there gives the region by name in \`administrative_area_name\`.`)
  .option(`--country <country>`, `ISO 3166-1 alpha-2 code, upper case.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { country } = await promptForMissing(
          _options,
          customersAddressFormatGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/address-format/{country}`.replace(`{country}`, country);
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, customersAddressFormatGetSpecs, { method: "get" });
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
  { key: "zip", option: "--zip <zip>", name: "zip", description: "Filter to rows whose `zip` is exactly this value. Postal code, as text — leading zeros are real in most countries. Stored as the country prints it (trimmed, one inner space, upper case). Null where the country has none (Hong Kong, the UAE); whether one is needed is the country's rule (GET /customers/address-format/{country}). The address type calls it `postal_code`.", type: "string", required: false },
  { key: "city", option: "--city <city>", name: "city", description: "Filter to rows whose `city` is exactly this value. City or town. Null only where the country's rules do not ask for one. The address type calls it `locality`.", type: "string", required: false },
  { key: "region", option: "--region <region>", name: "region", description: "Filter to rows whose `region` is exactly this value. State, province or Bundesland, as written. Required by some destinations (US, CA, BR, IT, ES, JP, CN, IN), unused by most European ones. The address type calls it `administrative_area_name`; its ISO 3166-2 code is `administrative_area_code`.", type: "string", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "Filter by ISO 3166-1 alpha-2 country code.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", description: "Filter to rows whose `phone` is exactly this value. Phone number for the carrier to reach at this address — often a different one from the contact's own.", type: "string", required: false },
  { key: "email", option: "--email <email>", name: "email", description: "Filter to rows whose `email` is exactly this value. A mail address for the delivery to this address — tracking, a carrier's notice. Optional, checked as an email, stored trimmed with its domain in lower case; never printed on the label. Where a DOCUMENT is sent is a contact point, not this.", type: "string", required: false },
  { key: "addressLine3", option: "--address-line3 <address-line3>", name: "address_line3", description: "Filter to rows whose `address_line3` is exactly this value. The third address line, where a country prints one. Null when there is none.", type: "string", required: false },
  { key: "dependentLocality", option: "--dependent-locality <dependent-locality>", name: "dependent_locality", description: "Filter to rows whose `dependent_locality` is exactly this value. The district within the town that a country prints: a bairro in Brazil, a colonia in Mexico, a dong in Korea.", type: "string", required: false },
  { key: "administrativeAreaCode", option: "--administrative-area-code <administrative-area-code>", name: "administrative_area_code", description: "Filter to rows whose `administrative_area_code` is exactly this value. The region as an ISO 3166-2 code (`US-CA`, `BR-SP`) — what shipping and tax read. Checked against the country's list where it has one. An address stored before the code existed answers the code its `region` names, when the country lists it.", type: "string", required: false },
  { key: "sortingCode", option: "--sorting-code <sorting-code>", name: "sorting_code", description: "Filter to rows whose `sorting_code` is exactly this value. A sorting code the post adds after the town — France's CEDEX.", type: "string", required: false },
  { key: "streetName", option: "--street-name <street-name>", name: "street_name", description: "Filter to rows whose `street_name` is exactly this value. The street on its own, beside `street`, for a system that keeps the house number apart. Not printed: the label prints `street`.", type: "string", required: false },
  { key: "houseNumber", option: "--house-number <house-number>", name: "house_number", description: "Filter to rows whose `house_number` is exactly this value. The house number on its own, beside `street_name`.", type: "string", required: false },
  { key: "houseNumberAddition", option: "--house-number-addition <house-number-addition>", name: "house_number_addition", description: "Filter to rows whose `house_number_addition` is exactly this value. What follows the house number: a letter, a stairway, an apartment.", type: "string", required: false },
  { key: "deliveryPointType", option: "--delivery-point-type <delivery-point-type>", name: "delivery_point_type", description: "Filter to rows whose `delivery_point_type` is exactly this value. What kind of place receives the delivery: a street address, a Packstation, a post office, a PO box, a military post. Null when nobody said.", type: "string", required: false, enum: ["street","packstation","post_office","po_box","military"] },
  { key: "deliveryPointId", option: "--delivery-point-id <delivery-point-id>", name: "delivery_point_id", description: "Filter to rows whose `delivery_point_id` is exactly this value. The number of that delivery point: the Packstation, the PO box.", type: "string", required: false },
  { key: "languageCode", option: "--language-code <language-code>", name: "language_code", description: "Filter to rows whose `language_code` is exactly this value. The language the address is written in (BCP 47), where a country prints more than one.", type: "string", required: false },
  { key: "script", option: "--script <script>", name: "script", description: "Filter to rows whose `script` is exactly this value. The script the address is written in (ISO 15924), where it is not Latin.", type: "string", required: false },
  { key: "validationStatus", option: "--validation-status <validation-status>", name: "validation_status", description: "Filter to rows whose `validation_status` is exactly this value. Whether a verifier has checked the address against the post's own data: 'unchecked' until one has, then 'valid', 'corrected' or 'suspect'. An edit of the address that carries no new verification sets it back to 'unchecked'. A buyer cannot set it.", type: "string", required: false, enum: ["unchecked","valid","corrected","suspect"] },
  { key: "validatedAt", option: "--validated-at <validated-at>", name: "validated_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When the address was last verified. Null until it is. An edit of the address that carries no new one clears it.", type: "string", required: false },
  { key: "validationSource", option: "--validation-source <validation-source>", name: "validation_source", description: "Filter to rows whose `validation_source` is exactly this value. Who verified it — the provider a verifier used.", type: "string", required: false },
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
  .option(`--zip <zip>`, `Filter to rows whose \`zip\` is exactly this value. Postal code, as text — leading zeros are real in most countries. Stored as the country prints it (trimmed, one inner space, upper case). Null where the country has none (Hong Kong, the UAE); whether one is needed is the country's rule (GET /customers/address-format/{country}). The address type calls it \`postal_code\`.`)
  .option(`--city <city>`, `Filter to rows whose \`city\` is exactly this value. City or town. Null only where the country's rules do not ask for one. The address type calls it \`locality\`.`)
  .option(`--region <region>`, `Filter to rows whose \`region\` is exactly this value. State, province or Bundesland, as written. Required by some destinations (US, CA, BR, IT, ES, JP, CN, IN), unused by most European ones. The address type calls it \`administrative_area_name\`; its ISO 3166-2 code is \`administrative_area_code\`.`)
  .option(`--country <country>`, `Filter by ISO 3166-1 alpha-2 country code.`)
  .option(`--phone <phone>`, `Filter to rows whose \`phone\` is exactly this value. Phone number for the carrier to reach at this address — often a different one from the contact's own.`)
  .option(`--email <email>`, `Filter to rows whose \`email\` is exactly this value. A mail address for the delivery to this address — tracking, a carrier's notice. Optional, checked as an email, stored trimmed with its domain in lower case; never printed on the label. Where a DOCUMENT is sent is a contact point, not this.`)
  .option(`--address-line3 <address-line3>`, `Filter to rows whose \`address_line3\` is exactly this value. The third address line, where a country prints one. Null when there is none.`)
  .option(`--dependent-locality <dependent-locality>`, `Filter to rows whose \`dependent_locality\` is exactly this value. The district within the town that a country prints: a bairro in Brazil, a colonia in Mexico, a dong in Korea.`)
  .option(`--administrative-area-code <administrative-area-code>`, `Filter to rows whose \`administrative_area_code\` is exactly this value. The region as an ISO 3166-2 code (\`US-CA\`, \`BR-SP\`) — what shipping and tax read. Checked against the country's list where it has one. An address stored before the code existed answers the code its \`region\` names, when the country lists it.`)
  .option(`--sorting-code <sorting-code>`, `Filter to rows whose \`sorting_code\` is exactly this value. A sorting code the post adds after the town — France's CEDEX.`)
  .option(`--street-name <street-name>`, `Filter to rows whose \`street_name\` is exactly this value. The street on its own, beside \`street\`, for a system that keeps the house number apart. Not printed: the label prints \`street\`.`)
  .option(`--house-number <house-number>`, `Filter to rows whose \`house_number\` is exactly this value. The house number on its own, beside \`street_name\`.`)
  .option(`--house-number-addition <house-number-addition>`, `Filter to rows whose \`house_number_addition\` is exactly this value. What follows the house number: a letter, a stairway, an apartment.`)
  .option(`--delivery-point-type <delivery-point-type>`, `Filter to rows whose \`delivery_point_type\` is exactly this value. What kind of place receives the delivery: a street address, a Packstation, a post office, a PO box, a military post. Null when nobody said.`)
  .option(`--delivery-point-id <delivery-point-id>`, `Filter to rows whose \`delivery_point_id\` is exactly this value. The number of that delivery point: the Packstation, the PO box.`)
  .option(`--language-code <language-code>`, `Filter to rows whose \`language_code\` is exactly this value. The language the address is written in (BCP 47), where a country prints more than one.`)
  .option(`--script <script>`, `Filter to rows whose \`script\` is exactly this value. The script the address is written in (ISO 15924), where it is not Latin.`)
  .option(`--validation-status <validation-status>`, `Filter to rows whose \`validation_status\` is exactly this value. Whether a verifier has checked the address against the post's own data: 'unchecked' until one has, then 'valid', 'corrected' or 'suspect'. An edit of the address that carries no new verification sets it back to 'unchecked'. A buyer cannot set it.`)
  .option(`--validated-at <validated-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When the address was last verified. Null until it is. An edit of the address that carries no new one clears it.`)
  .option(`--validation-source <validation-source>`, `Filter to rows whose \`validation_source\` is exactly this value. Who verified it — the provider a verifier used.`)
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
        const { id, organizationId, contactId, type, company, name, name2, street, street2, zip, city, region, country, phone, email, addressLine3, dependentLocality, administrativeAreaCode, sortingCode, streetName, houseNumber, houseNumberAddition, deliveryPointType, deliveryPointId, languageCode, script, validationStatus, validatedAt, validationSource, isDefault, externalId, sourceSyncedAt, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
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
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (addressLine3 !== undefined) {
          _payload[`address_line3`] = addressLine3;
        }
        if (dependentLocality !== undefined) {
          _payload[`dependent_locality`] = dependentLocality;
        }
        if (administrativeAreaCode !== undefined) {
          _payload[`administrative_area_code`] = administrativeAreaCode;
        }
        if (sortingCode !== undefined) {
          _payload[`sorting_code`] = sortingCode;
        }
        if (streetName !== undefined) {
          _payload[`street_name`] = streetName;
        }
        if (houseNumber !== undefined) {
          _payload[`house_number`] = houseNumber;
        }
        if (houseNumberAddition !== undefined) {
          _payload[`house_number_addition`] = houseNumberAddition;
        }
        if (deliveryPointType !== undefined) {
          _payload[`delivery_point_type`] = deliveryPointType;
        }
        if (deliveryPointId !== undefined) {
          _payload[`delivery_point_id`] = deliveryPointId;
        }
        if (languageCode !== undefined) {
          _payload[`language_code`] = languageCode;
        }
        if (script !== undefined) {
          _payload[`script`] = script;
        }
        if (validationStatus !== undefined) {
          _payload[`validation_status`] = validationStatus;
        }
        if (validatedAt !== undefined) {
          _payload[`validated_at`] = validatedAt;
        }
        if (validationSource !== undefined) {
          _payload[`validation_source`] = validationSource;
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
  { key: "addressLine1", option: "--address-line1 <address-line1>", name: "address_line1", description: "The address type's name for `street`. A body that carries any of the type's names is read in them alone: `street` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "addressLine2", option: "--address-line2 <address-line2>", name: "address_line2", description: "The address type's name for `street2`. A body that carries any of the type's names is read in them alone: `street2` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "addressLine3", option: "--address-line3 <address-line3>", name: "address_line3", description: "The third address line, where a country prints one. Null when there is none.", type: "string", required: false },
  { key: "administrativeAreaCode", option: "--administrative-area-code <administrative-area-code>", name: "administrative_area_code", description: "The region as an ISO 3166-2 code (`US-CA`, `BR-SP`) — what shipping and tax read. Checked against the country's list where it has one. An address stored before the code existed answers the code its `region` names, when the country lists it.", type: "string", required: false },
  { key: "administrativeAreaName", option: "--administrative-area-name <administrative-area-name>", name: "administrative_area_name", description: "The address type's name for `region`. A body that carries any of the type's names is read in them alone: `region` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "careOf", option: "--care-of <care-of>", name: "care_of", description: "The address type's name for `name2`. A body that carries any of the type's names is read in them alone: `name2` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "city", option: "--city <city>", name: "city", description: "City or town. Null only where the country's rules do not ask for one. The address type calls it `locality`.", type: "string", required: false },
  { key: "company", option: "--company <company>", name: "company", description: "Company line on the label. Often the owning organization's name, but not always — a delivery to a construction site carries the site.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Owning person — a personal address only that contact uses. Exactly one of organization_id / contact_id is set.", type: "string", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "ISO 3166-1 alpha-2 country code, exactly two letters. Uppercase by convention; it is what shipping and tax both key off. The address type calls it `country_code`.", type: "string", required: false },
  { key: "countryCode", option: "--country-code <country-code>", name: "country_code", description: "The address type's name for `country`. A body that carries any of the type's names is read in them alone: `country` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "When the address was created. Accepted on create only from a call naming no acting contact — an operator, an import, an ERP carrying a record over with its original date. A buyer sending it, or any update changing it, is a 400 `server_owned_field`.", type: "string", required: false },
  { key: "deliveryPointId", option: "--delivery-point-id <delivery-point-id>", name: "delivery_point_id", description: "The number of that delivery point: the Packstation, the PO box.", type: "string", required: false },
  { key: "deliveryPointType", option: "--delivery-point-type <delivery-point-type>", name: "delivery_point_type", description: "What kind of place receives the delivery: a street address, a Packstation, a post office, a PO box, a military post. Null when nobody said.", type: "string", required: false, enum: ["street","packstation","post_office","po_box","military"] },
  { key: "dependentLocality", option: "--dependent-locality <dependent-locality>", name: "dependent_locality", description: "The district within the town that a country prints: a bairro in Brazil, a colonia in Mexico, a dong in Korea.", type: "string", required: false },
  { key: "email", option: "--email <email>", name: "email", description: "A mail address for the delivery to this address — tracking, a carrier's notice. Optional, checked as an email, stored trimmed with its domain in lower case; never printed on the label. Where a DOCUMENT is sent is a contact point, not this.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Id of this address in the system it came from — an ERP address number. Nullable and unique per tenant where it is set. It is also the id a line-based order export has to hand back, because the receiving system names a delivery or invoice address by it rather than by its street. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.", type: "string", required: false },
  { key: "houseNumber", option: "--house-number <house-number>", name: "house_number", description: "The house number on its own, beside `street_name`.", type: "string", required: false },
  { key: "houseNumberAddition", option: "--house-number-addition <house-number-addition>", name: "house_number_addition", description: "What follows the house number: a letter, a stairway, an apartment.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "The default address of its owner AND type: one default billing and one default shipping address per owner. Setting it moves the flag off the previous holder. Default false.", type: "boolean", required: false },
  { key: "languageCode", option: "--language-code <language-code>", name: "language_code", description: "The language the address is written in (BCP 47), where a country prints more than one.", type: "string", required: false },
  { key: "latin", option: "--latin <latin>", name: "latin", description: "The same address in Latin script, for an address written in another one: the same keys as the address type, none of them required. Null for an address in Latin script.", type: "object", required: false },
  { key: "locality", option: "--locality <locality>", name: "locality", description: "The address type's name for `city`. A body that carries any of the type's names is read in them alone: `city` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Recipient line on the label — the person or department the parcel is addressed to.", type: "string", required: false },
  { key: "name2", option: "--name2 <name2>", name: "name2", description: "The second recipient line: a department beneath a person, an attention line, a c/o. What `street2` is for the street, this is for the recipient — and it is a line of its own rather than more text in `name`, because a label prints two lines and an ERP delivers two fields. Null when there is none.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Owning company — a company address, shared by everyone in it. Exactly one of organization_id / contact_id is set.", type: "string", required: false },
  { key: "organizationName", option: "--organization-name <organization-name>", name: "organization_name", description: "The address type's name for `company`. A body that carries any of the type's names is read in them alone: `company` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", description: "Phone number for the carrier to reach at this address — often a different one from the contact's own.", type: "string", required: false },
  { key: "postalCode", option: "--postal-code <postal-code>", name: "postal_code", description: "The address type's name for `zip`. A body that carries any of the type's names is read in them alone: `zip` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "recipientName", option: "--recipient-name <recipient-name>", name: "recipient_name", description: "The address type's name for `name`. A body that carries any of the type's names is read in them alone: `name` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "region", option: "--region <region>", name: "region", description: "State, province or Bundesland, as written. Required by some destinations (US, CA, BR, IT, ES, JP, CN, IN), unused by most European ones. The address type calls it `administrative_area_name`; its ISO 3166-2 code is `administrative_area_code`.", type: "string", required: false },
  { key: "script", option: "--script <script>", name: "script", description: "The script the address is written in (ISO 15924), where it is not Latin.", type: "string", required: false },
  { key: "sortingCode", option: "--sorting-code <sorting-code>", name: "sorting_code", description: "A sorting code the post adds after the town — France's CEDEX.", type: "string", required: false },
  { key: "street", option: "--street <street>", name: "street", description: "Street and house number, on one line, as the local post expects it. OPTIONAL, because a deliverable address does not always have one: a German PO box is addressed by its number, its postcode and its town, and an ERP that holds thousands of them would otherwise have every one of them refused. The postcode and the town stay required — a PO box has both.", type: "string", required: false },
  { key: "street2", option: "--street2 <street2>", name: "street2", description: "The second address line: building, floor, gate, c/o. Null when there is none.", type: "string", required: false },
  { key: "streetName", option: "--street-name <street-name>", name: "street_name", description: "The street on its own, beside `street`, for a system that keeps the house number apart. Not printed: the label prints `street`.", type: "string", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "What the address is FOR — one of the tenant's own address types (GET /customers/address-types), seeded with billing and shipping. A merchant may add their own (a works entrance, a central accounts office) without a release of this app. A create without it gets the type flagged as default; a type the tenant does not keep is a 400.", type: "string", required: false },
  { key: "validatedAt", option: "--validated-at <validated-at>", name: "validated_at", description: "When the address was last verified. Null until it is. An edit of the address that carries no new one clears it.", type: "string", required: false },
  { key: "validationSource", option: "--validation-source <validation-source>", name: "validation_source", description: "Who verified it — the provider a verifier used.", type: "string", required: false },
  { key: "validationStatus", option: "--validation-status <validation-status>", name: "validation_status", description: "Whether a verifier has checked the address against the post's own data: 'unchecked' until one has, then 'valid', 'corrected' or 'suspect'. An edit of the address that carries no new verification sets it back to 'unchecked'. A buyer cannot set it.", type: "string", required: false, enum: ["unchecked","valid","corrected","suspect"] },
  { key: "zip", option: "--zip <zip>", name: "zip", description: "Postal code, as text — leading zeros are real in most countries. Stored as the country prints it (trimmed, one inner space, upper case). Null where the country has none (Hong Kong, the UAE); whether one is needed is the country's rule (GET /customers/address-format/{country}). The address type calls it `postal_code`.", type: "string", required: false },
];
customersOrganizations
  .command(`customers-addresses-create`)
  .description(`A postal address used for billing or for shipping, owned by exactly one of the two parties: an organization (the company address everyone in it may use) or a contact (a private one only that person uses). Both owner columns are nullable and exactly one is set — sending both, or neither, is refused. \`type\` names one of this tenant's own address types — billing and shipping are seeded, and a merchant may add a works entrance or a central accounts office without a release of this app. \`is_default\` picks the one a checkout should preselect for that owner and that type. \`country\` is the only field a create cannot omit; everything else is optional or defaulted by the database. Two rows of this tenant may not share \`external_id\` (while external_id IS NOT NULL).`)
  .option(`--address-line1 <address-line1>`, `The address type's name for \`street\`. A body that carries any of the type's names is read in them alone: \`street\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--address-line2 <address-line2>`, `The address type's name for \`street2\`. A body that carries any of the type's names is read in them alone: \`street2\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--address-line3 <address-line3>`, `The third address line, where a country prints one. Null when there is none.`)
  .option(`--administrative-area-code <administrative-area-code>`, `The region as an ISO 3166-2 code (\`US-CA\`, \`BR-SP\`) — what shipping and tax read. Checked against the country's list where it has one. An address stored before the code existed answers the code its \`region\` names, when the country lists it.`)
  .option(`--administrative-area-name <administrative-area-name>`, `The address type's name for \`region\`. A body that carries any of the type's names is read in them alone: \`region\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--care-of <care-of>`, `The address type's name for \`name2\`. A body that carries any of the type's names is read in them alone: \`name2\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--city <city>`, `City or town. Null only where the country's rules do not ask for one. The address type calls it \`locality\`.`)
  .option(`--company <company>`, `Company line on the label. Often the owning organization's name, but not always — a delivery to a construction site carries the site.`)
  .option(`--contact-id <contact-id>`, `Owning person — a personal address only that contact uses. Exactly one of organization_id / contact_id is set.`)
  .option(`--country <country>`, `ISO 3166-1 alpha-2 country code, exactly two letters. Uppercase by convention; it is what shipping and tax both key off. The address type calls it \`country_code\`.`)
  .option(`--country-code <country-code>`, `The address type's name for \`country\`. A body that carries any of the type's names is read in them alone: \`country\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--created-at <created-at>`, `When the address was created. Accepted on create only from a call naming no acting contact — an operator, an import, an ERP carrying a record over with its original date. A buyer sending it, or any update changing it, is a 400 \`server_owned_field\`.`)
  .option(`--delivery-point-id <delivery-point-id>`, `The number of that delivery point: the Packstation, the PO box.`)
  .option(`--delivery-point-type <delivery-point-type>`, `What kind of place receives the delivery: a street address, a Packstation, a post office, a PO box, a military post. Null when nobody said.`)
  .option(`--dependent-locality <dependent-locality>`, `The district within the town that a country prints: a bairro in Brazil, a colonia in Mexico, a dong in Korea.`)
  .option(`--email <email>`, `A mail address for the delivery to this address — tracking, a carrier's notice. Optional, checked as an email, stored trimmed with its domain in lower case; never printed on the label. Where a DOCUMENT is sent is a contact point, not this.`)
  .option(`--external-id <external-id>`, `Id of this address in the system it came from — an ERP address number. Nullable and unique per tenant where it is set. It is also the id a line-based order export has to hand back, because the receiving system names a delivery or invoice address by it rather than by its street. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.`)
  .option(`--house-number <house-number>`, `The house number on its own, beside \`street_name\`.`)
  .option(`--house-number-addition <house-number-addition>`, `What follows the house number: a letter, a stairway, an apartment.`)
  .option(
    `--is-default [value]`,
    `The default address of its owner AND type: one default billing and one default shipping address per owner. Setting it moves the flag off the previous holder. Default false.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--language-code <language-code>`, `The language the address is written in (BCP 47), where a country prints more than one.`)
  .option(`--latin <latin>`, `The same address in Latin script, for an address written in another one: the same keys as the address type, none of them required. Null for an address in Latin script.`)
  .option(`--locality <locality>`, `The address type's name for \`city\`. A body that carries any of the type's names is read in them alone: \`city\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--name <name>`, `Recipient line on the label — the person or department the parcel is addressed to.`)
  .option(`--name2 <name2>`, `The second recipient line: a department beneath a person, an attention line, a c/o. What \`street2\` is for the street, this is for the recipient — and it is a line of its own rather than more text in \`name\`, because a label prints two lines and an ERP delivers two fields. Null when there is none.`)
  .option(`--organization-id <organization-id>`, `Owning company — a company address, shared by everyone in it. Exactly one of organization_id / contact_id is set.`)
  .option(`--organization-name <organization-name>`, `The address type's name for \`company\`. A body that carries any of the type's names is read in them alone: \`company\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--phone <phone>`, `Phone number for the carrier to reach at this address — often a different one from the contact's own.`)
  .option(`--postal-code <postal-code>`, `The address type's name for \`zip\`. A body that carries any of the type's names is read in them alone: \`zip\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--recipient-name <recipient-name>`, `The address type's name for \`name\`. A body that carries any of the type's names is read in them alone: \`name\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--region <region>`, `State, province or Bundesland, as written. Required by some destinations (US, CA, BR, IT, ES, JP, CN, IN), unused by most European ones. The address type calls it \`administrative_area_name\`; its ISO 3166-2 code is \`administrative_area_code\`.`)
  .option(`--script <script>`, `The script the address is written in (ISO 15924), where it is not Latin.`)
  .option(`--sorting-code <sorting-code>`, `A sorting code the post adds after the town — France's CEDEX.`)
  .option(`--street <street>`, `Street and house number, on one line, as the local post expects it. OPTIONAL, because a deliverable address does not always have one: a German PO box is addressed by its number, its postcode and its town, and an ERP that holds thousands of them would otherwise have every one of them refused. The postcode and the town stay required — a PO box has both.`)
  .option(`--street2 <street2>`, `The second address line: building, floor, gate, c/o. Null when there is none.`)
  .option(`--street-name <street-name>`, `The street on its own, beside \`street\`, for a system that keeps the house number apart. Not printed: the label prints \`street\`.`)
  .option(`--type <type>`, `What the address is FOR — one of the tenant's own address types (GET /customers/address-types), seeded with billing and shipping. A merchant may add their own (a works entrance, a central accounts office) without a release of this app. A create without it gets the type flagged as default; a type the tenant does not keep is a 400.`)
  .option(`--validated-at <validated-at>`, `When the address was last verified. Null until it is. An edit of the address that carries no new one clears it.`)
  .option(`--validation-source <validation-source>`, `Who verified it — the provider a verifier used.`)
  .option(`--validation-status <validation-status>`, `Whether a verifier has checked the address against the post's own data: 'unchecked' until one has, then 'valid', 'corrected' or 'suspect'. An edit of the address that carries no new verification sets it back to 'unchecked'. A buyer cannot set it.`)
  .option(`--zip <zip>`, `Postal code, as text — leading zeros are real in most countries. Stored as the country prints it (trimmed, one inner space, upper case). Null where the country has none (Hong Kong, the UAE); whether one is needed is the country's rule (GET /customers/address-format/{country}). The address type calls it \`postal_code\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { addressLine1, addressLine2, addressLine3, administrativeAreaCode, administrativeAreaName, careOf, city, company, contactId, country, countryCode, createdAt, deliveryPointId, deliveryPointType, dependentLocality, email, externalId, houseNumber, houseNumberAddition, isDefault, languageCode, latin, locality, name, name2, organizationId, organizationName, phone, postalCode, recipientName, region, script, sortingCode, street, street2, streetName, type, validatedAt, validationSource, validationStatus, zip } = await promptForMissing(
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
        if (addressLine1 !== undefined) {
          _payload[`address_line1`] = addressLine1;
        }
        if (addressLine2 !== undefined) {
          _payload[`address_line2`] = addressLine2;
        }
        if (addressLine3 !== undefined) {
          _payload[`address_line3`] = addressLine3;
        }
        if (administrativeAreaCode !== undefined) {
          _payload[`administrative_area_code`] = administrativeAreaCode;
        }
        if (administrativeAreaName !== undefined) {
          _payload[`administrative_area_name`] = administrativeAreaName;
        }
        if (careOf !== undefined) {
          _payload[`care_of`] = careOf;
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
        if (countryCode !== undefined) {
          _payload[`country_code`] = countryCode;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
        }
        if (deliveryPointId !== undefined) {
          _payload[`delivery_point_id`] = deliveryPointId;
        }
        if (deliveryPointType !== undefined) {
          _payload[`delivery_point_type`] = deliveryPointType;
        }
        if (dependentLocality !== undefined) {
          _payload[`dependent_locality`] = dependentLocality;
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (houseNumber !== undefined) {
          _payload[`house_number`] = houseNumber;
        }
        if (houseNumberAddition !== undefined) {
          _payload[`house_number_addition`] = houseNumberAddition;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (languageCode !== undefined) {
          _payload[`language_code`] = languageCode;
        }
        if (latin !== undefined) {
          _payload[`latin`] = resolveBodyParam(latin);
        }
        if (locality !== undefined) {
          _payload[`locality`] = locality;
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
        if (organizationName !== undefined) {
          _payload[`organization_name`] = organizationName;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (postalCode !== undefined) {
          _payload[`postal_code`] = postalCode;
        }
        if (recipientName !== undefined) {
          _payload[`recipient_name`] = recipientName;
        }
        if (region !== undefined) {
          _payload[`region`] = region;
        }
        if (script !== undefined) {
          _payload[`script`] = script;
        }
        if (sortingCode !== undefined) {
          _payload[`sorting_code`] = sortingCode;
        }
        if (street !== undefined) {
          _payload[`street`] = street;
        }
        if (street2 !== undefined) {
          _payload[`street2`] = street2;
        }
        if (streetName !== undefined) {
          _payload[`street_name`] = streetName;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (validatedAt !== undefined) {
          _payload[`validated_at`] = validatedAt;
        }
        if (validationSource !== undefined) {
          _payload[`validation_source`] = validationSource;
        }
        if (validationStatus !== undefined) {
          _payload[`validation_status`] = validationStatus;
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
  { key: "addressLine1", option: "--address-line1 <address-line1>", name: "address_line1", description: "The address type's name for `street`. A body that carries any of the type's names is read in them alone: `street` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "addressLine2", option: "--address-line2 <address-line2>", name: "address_line2", description: "The address type's name for `street2`. A body that carries any of the type's names is read in them alone: `street2` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "addressLine3", option: "--address-line3 <address-line3>", name: "address_line3", description: "The third address line, where a country prints one. Null when there is none.", type: "string", required: false },
  { key: "administrativeAreaCode", option: "--administrative-area-code <administrative-area-code>", name: "administrative_area_code", description: "The region as an ISO 3166-2 code (`US-CA`, `BR-SP`) — what shipping and tax read. Checked against the country's list where it has one. An address stored before the code existed answers the code its `region` names, when the country lists it.", type: "string", required: false },
  { key: "administrativeAreaName", option: "--administrative-area-name <administrative-area-name>", name: "administrative_area_name", description: "The address type's name for `region`. A body that carries any of the type's names is read in them alone: `region` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "careOf", option: "--care-of <care-of>", name: "care_of", description: "The address type's name for `name2`. A body that carries any of the type's names is read in them alone: `name2` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "city", option: "--city <city>", name: "city", description: "City or town. Null only where the country's rules do not ask for one. The address type calls it `locality`.", type: "string", required: false },
  { key: "company", option: "--company <company>", name: "company", description: "Company line on the label. Often the owning organization's name, but not always — a delivery to a construction site carries the site.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Owning person — a personal address only that contact uses. Exactly one of organization_id / contact_id is set.", type: "string", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "ISO 3166-1 alpha-2 country code, exactly two letters. Uppercase by convention; it is what shipping and tax both key off. The address type calls it `country_code`.", type: "string", required: false },
  { key: "countryCode", option: "--country-code <country-code>", name: "country_code", description: "The address type's name for `country`. A body that carries any of the type's names is read in them alone: `country` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "deliveryPointId", option: "--delivery-point-id <delivery-point-id>", name: "delivery_point_id", description: "The number of that delivery point: the Packstation, the PO box.", type: "string", required: false },
  { key: "deliveryPointType", option: "--delivery-point-type <delivery-point-type>", name: "delivery_point_type", description: "What kind of place receives the delivery: a street address, a Packstation, a post office, a PO box, a military post. Null when nobody said.", type: "string", required: false, enum: ["street","packstation","post_office","po_box","military"] },
  { key: "dependentLocality", option: "--dependent-locality <dependent-locality>", name: "dependent_locality", description: "The district within the town that a country prints: a bairro in Brazil, a colonia in Mexico, a dong in Korea.", type: "string", required: false },
  { key: "email", option: "--email <email>", name: "email", description: "A mail address for the delivery to this address — tracking, a carrier's notice. Optional, checked as an email, stored trimmed with its domain in lower case; never printed on the label. Where a DOCUMENT is sent is a contact point, not this.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Id of this address in the system it came from — an ERP address number. Nullable and unique per tenant where it is set. It is also the id a line-based order export has to hand back, because the receiving system names a delivery or invoice address by it rather than by its street. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.", type: "string", required: false },
  { key: "houseNumber", option: "--house-number <house-number>", name: "house_number", description: "The house number on its own, beside `street_name`.", type: "string", required: false },
  { key: "houseNumberAddition", option: "--house-number-addition <house-number-addition>", name: "house_number_addition", description: "What follows the house number: a letter, a stairway, an apartment.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "The default address of its owner AND type: one default billing and one default shipping address per owner. Setting it moves the flag off the previous holder. Default false.", type: "boolean", required: false },
  { key: "languageCode", option: "--language-code <language-code>", name: "language_code", description: "The language the address is written in (BCP 47), where a country prints more than one.", type: "string", required: false },
  { key: "latin", option: "--latin <latin>", name: "latin", description: "The same address in Latin script, for an address written in another one: the same keys as the address type, none of them required. Null for an address in Latin script.", type: "object", required: false },
  { key: "locality", option: "--locality <locality>", name: "locality", description: "The address type's name for `city`. A body that carries any of the type's names is read in them alone: `city` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Recipient line on the label — the person or department the parcel is addressed to.", type: "string", required: false },
  { key: "name2", option: "--name2 <name2>", name: "name2", description: "The second recipient line: a department beneath a person, an attention line, a c/o. What `street2` is for the street, this is for the recipient — and it is a line of its own rather than more text in `name`, because a label prints two lines and an ERP delivers two fields. Null when there is none.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Owning company — a company address, shared by everyone in it. Exactly one of organization_id / contact_id is set.", type: "string", required: false },
  { key: "organizationName", option: "--organization-name <organization-name>", name: "organization_name", description: "The address type's name for `company`. A body that carries any of the type's names is read in them alone: `company` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", description: "Phone number for the carrier to reach at this address — often a different one from the contact's own.", type: "string", required: false },
  { key: "postalCode", option: "--postal-code <postal-code>", name: "postal_code", description: "The address type's name for `zip`. A body that carries any of the type's names is read in them alone: `zip` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "recipientName", option: "--recipient-name <recipient-name>", name: "recipient_name", description: "The address type's name for `name`. A body that carries any of the type's names is read in them alone: `name` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.", type: "string", required: false },
  { key: "region", option: "--region <region>", name: "region", description: "State, province or Bundesland, as written. Required by some destinations (US, CA, BR, IT, ES, JP, CN, IN), unused by most European ones. The address type calls it `administrative_area_name`; its ISO 3166-2 code is `administrative_area_code`.", type: "string", required: false },
  { key: "script", option: "--script <script>", name: "script", description: "The script the address is written in (ISO 15924), where it is not Latin.", type: "string", required: false },
  { key: "sortingCode", option: "--sorting-code <sorting-code>", name: "sorting_code", description: "A sorting code the post adds after the town — France's CEDEX.", type: "string", required: false },
  { key: "street", option: "--street <street>", name: "street", description: "Street and house number, on one line, as the local post expects it. OPTIONAL, because a deliverable address does not always have one: a German PO box is addressed by its number, its postcode and its town, and an ERP that holds thousands of them would otherwise have every one of them refused. The postcode and the town stay required — a PO box has both.", type: "string", required: false },
  { key: "street2", option: "--street2 <street2>", name: "street2", description: "The second address line: building, floor, gate, c/o. Null when there is none.", type: "string", required: false },
  { key: "streetName", option: "--street-name <street-name>", name: "street_name", description: "The street on its own, beside `street`, for a system that keeps the house number apart. Not printed: the label prints `street`.", type: "string", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "What the address is FOR — one of the tenant's own address types (GET /customers/address-types), seeded with billing and shipping. A merchant may add their own (a works entrance, a central accounts office) without a release of this app. A create without it gets the type flagged as default; a type the tenant does not keep is a 400.", type: "string", required: false },
  { key: "validatedAt", option: "--validated-at <validated-at>", name: "validated_at", description: "When the address was last verified. Null until it is. An edit of the address that carries no new one clears it.", type: "string", required: false },
  { key: "validationSource", option: "--validation-source <validation-source>", name: "validation_source", description: "Who verified it — the provider a verifier used.", type: "string", required: false },
  { key: "validationStatus", option: "--validation-status <validation-status>", name: "validation_status", description: "Whether a verifier has checked the address against the post's own data: 'unchecked' until one has, then 'valid', 'corrected' or 'suspect'. An edit of the address that carries no new verification sets it back to 'unchecked'. A buyer cannot set it.", type: "string", required: false, enum: ["unchecked","valid","corrected","suspect"] },
  { key: "zip", option: "--zip <zip>", name: "zip", description: "Postal code, as text — leading zeros are real in most countries. Stored as the country prints it (trimmed, one inner space, upper case). Null where the country has none (Hong Kong, the UAE); whether one is needed is the country's rule (GET /customers/address-format/{country}). The address type calls it `postal_code`.", type: "string", required: false },
];
customersOrganizations
  .command(`customers-addresses-update`)
  .description(`A postal address used for billing or for shipping, owned by exactly one of the two parties: an organization (the company address everyone in it may use) or a contact (a private one only that person uses). Both owner columns are nullable and exactly one is set — sending both, or neither, is refused. A partial update — send only what changes. An empty body is refused rather than answered as a no-op, so a client that built the wrong patch finds out. Two rows of this tenant may not share \`external_id\` (while external_id IS NOT NULL).`)
  .option(`--id <id>`, `The address to update.`)
  .option(`--address-line1 <address-line1>`, `The address type's name for \`street\`. A body that carries any of the type's names is read in them alone: \`street\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--address-line2 <address-line2>`, `The address type's name for \`street2\`. A body that carries any of the type's names is read in them alone: \`street2\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--address-line3 <address-line3>`, `The third address line, where a country prints one. Null when there is none.`)
  .option(`--administrative-area-code <administrative-area-code>`, `The region as an ISO 3166-2 code (\`US-CA\`, \`BR-SP\`) — what shipping and tax read. Checked against the country's list where it has one. An address stored before the code existed answers the code its \`region\` names, when the country lists it.`)
  .option(`--administrative-area-name <administrative-area-name>`, `The address type's name for \`region\`. A body that carries any of the type's names is read in them alone: \`region\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--care-of <care-of>`, `The address type's name for \`name2\`. A body that carries any of the type's names is read in them alone: \`name2\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--city <city>`, `City or town. Null only where the country's rules do not ask for one. The address type calls it \`locality\`.`)
  .option(`--company <company>`, `Company line on the label. Often the owning organization's name, but not always — a delivery to a construction site carries the site.`)
  .option(`--contact-id <contact-id>`, `Owning person — a personal address only that contact uses. Exactly one of organization_id / contact_id is set.`)
  .option(`--country <country>`, `ISO 3166-1 alpha-2 country code, exactly two letters. Uppercase by convention; it is what shipping and tax both key off. The address type calls it \`country_code\`.`)
  .option(`--country-code <country-code>`, `The address type's name for \`country\`. A body that carries any of the type's names is read in them alone: \`country\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--delivery-point-id <delivery-point-id>`, `The number of that delivery point: the Packstation, the PO box.`)
  .option(`--delivery-point-type <delivery-point-type>`, `What kind of place receives the delivery: a street address, a Packstation, a post office, a PO box, a military post. Null when nobody said.`)
  .option(`--dependent-locality <dependent-locality>`, `The district within the town that a country prints: a bairro in Brazil, a colonia in Mexico, a dong in Korea.`)
  .option(`--email <email>`, `A mail address for the delivery to this address — tracking, a carrier's notice. Optional, checked as an email, stored trimmed with its domain in lower case; never printed on the label. Where a DOCUMENT is sent is a contact point, not this.`)
  .option(`--external-id <external-id>`, `Id of this address in the system it came from — an ERP address number. Nullable and unique per tenant where it is set. It is also the id a line-based order export has to hand back, because the receiving system names a delivery or invoice address by it rather than by its street. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.`)
  .option(`--house-number <house-number>`, `The house number on its own, beside \`street_name\`.`)
  .option(`--house-number-addition <house-number-addition>`, `What follows the house number: a letter, a stairway, an apartment.`)
  .option(
    `--is-default [value]`,
    `The default address of its owner AND type: one default billing and one default shipping address per owner. Setting it moves the flag off the previous holder. Default false.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--language-code <language-code>`, `The language the address is written in (BCP 47), where a country prints more than one.`)
  .option(`--latin <latin>`, `The same address in Latin script, for an address written in another one: the same keys as the address type, none of them required. Null for an address in Latin script.`)
  .option(`--locality <locality>`, `The address type's name for \`city\`. A body that carries any of the type's names is read in them alone: \`city\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--name <name>`, `Recipient line on the label — the person or department the parcel is addressed to.`)
  .option(`--name2 <name2>`, `The second recipient line: a department beneath a person, an attention line, a c/o. What \`street2\` is for the street, this is for the recipient — and it is a line of its own rather than more text in \`name\`, because a label prints two lines and an ERP delivers two fields. Null when there is none.`)
  .option(`--organization-id <organization-id>`, `Owning company — a company address, shared by everyone in it. Exactly one of organization_id / contact_id is set.`)
  .option(`--organization-name <organization-name>`, `The address type's name for \`company\`. A body that carries any of the type's names is read in them alone: \`company\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--phone <phone>`, `Phone number for the carrier to reach at this address — often a different one from the contact's own.`)
  .option(`--postal-code <postal-code>`, `The address type's name for \`zip\`. A body that carries any of the type's names is read in them alone: \`zip\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--recipient-name <recipient-name>`, `The address type's name for \`name\`. A body that carries any of the type's names is read in them alone: \`name\` beside it is ignored, as are the storefront's camelCase spellings, so a record read and sent back saves unchanged.`)
  .option(`--region <region>`, `State, province or Bundesland, as written. Required by some destinations (US, CA, BR, IT, ES, JP, CN, IN), unused by most European ones. The address type calls it \`administrative_area_name\`; its ISO 3166-2 code is \`administrative_area_code\`.`)
  .option(`--script <script>`, `The script the address is written in (ISO 15924), where it is not Latin.`)
  .option(`--sorting-code <sorting-code>`, `A sorting code the post adds after the town — France's CEDEX.`)
  .option(`--street <street>`, `Street and house number, on one line, as the local post expects it. OPTIONAL, because a deliverable address does not always have one: a German PO box is addressed by its number, its postcode and its town, and an ERP that holds thousands of them would otherwise have every one of them refused. The postcode and the town stay required — a PO box has both.`)
  .option(`--street2 <street2>`, `The second address line: building, floor, gate, c/o. Null when there is none.`)
  .option(`--street-name <street-name>`, `The street on its own, beside \`street\`, for a system that keeps the house number apart. Not printed: the label prints \`street\`.`)
  .option(`--type <type>`, `What the address is FOR — one of the tenant's own address types (GET /customers/address-types), seeded with billing and shipping. A merchant may add their own (a works entrance, a central accounts office) without a release of this app. A create without it gets the type flagged as default; a type the tenant does not keep is a 400.`)
  .option(`--validated-at <validated-at>`, `When the address was last verified. Null until it is. An edit of the address that carries no new one clears it.`)
  .option(`--validation-source <validation-source>`, `Who verified it — the provider a verifier used.`)
  .option(`--validation-status <validation-status>`, `Whether a verifier has checked the address against the post's own data: 'unchecked' until one has, then 'valid', 'corrected' or 'suspect'. An edit of the address that carries no new verification sets it back to 'unchecked'. A buyer cannot set it.`)
  .option(`--zip <zip>`, `Postal code, as text — leading zeros are real in most countries. Stored as the country prints it (trimmed, one inner space, upper case). Null where the country has none (Hong Kong, the UAE); whether one is needed is the country's rule (GET /customers/address-format/{country}). The address type calls it \`postal_code\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, addressLine1, addressLine2, addressLine3, administrativeAreaCode, administrativeAreaName, careOf, city, company, contactId, country, countryCode, deliveryPointId, deliveryPointType, dependentLocality, email, externalId, houseNumber, houseNumberAddition, isDefault, languageCode, latin, locality, name, name2, organizationId, organizationName, phone, postalCode, recipientName, region, script, sortingCode, street, street2, streetName, type, validatedAt, validationSource, validationStatus, zip } = await promptForMissing(
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
        if (addressLine1 !== undefined) {
          _payload[`address_line1`] = addressLine1;
        }
        if (addressLine2 !== undefined) {
          _payload[`address_line2`] = addressLine2;
        }
        if (addressLine3 !== undefined) {
          _payload[`address_line3`] = addressLine3;
        }
        if (administrativeAreaCode !== undefined) {
          _payload[`administrative_area_code`] = administrativeAreaCode;
        }
        if (administrativeAreaName !== undefined) {
          _payload[`administrative_area_name`] = administrativeAreaName;
        }
        if (careOf !== undefined) {
          _payload[`care_of`] = careOf;
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
        if (countryCode !== undefined) {
          _payload[`country_code`] = countryCode;
        }
        if (deliveryPointId !== undefined) {
          _payload[`delivery_point_id`] = deliveryPointId;
        }
        if (deliveryPointType !== undefined) {
          _payload[`delivery_point_type`] = deliveryPointType;
        }
        if (dependentLocality !== undefined) {
          _payload[`dependent_locality`] = dependentLocality;
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (houseNumber !== undefined) {
          _payload[`house_number`] = houseNumber;
        }
        if (houseNumberAddition !== undefined) {
          _payload[`house_number_addition`] = houseNumberAddition;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (languageCode !== undefined) {
          _payload[`language_code`] = languageCode;
        }
        if (latin !== undefined) {
          _payload[`latin`] = resolveBodyParam(latin);
        }
        if (locality !== undefined) {
          _payload[`locality`] = locality;
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
        if (organizationName !== undefined) {
          _payload[`organization_name`] = organizationName;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (postalCode !== undefined) {
          _payload[`postal_code`] = postalCode;
        }
        if (recipientName !== undefined) {
          _payload[`recipient_name`] = recipientName;
        }
        if (region !== undefined) {
          _payload[`region`] = region;
        }
        if (script !== undefined) {
          _payload[`script`] = script;
        }
        if (sortingCode !== undefined) {
          _payload[`sorting_code`] = sortingCode;
        }
        if (street !== undefined) {
          _payload[`street`] = street;
        }
        if (street2 !== undefined) {
          _payload[`street2`] = street2;
        }
        if (streetName !== undefined) {
          _payload[`street_name`] = streetName;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (validatedAt !== undefined) {
          _payload[`validated_at`] = validatedAt;
        }
        if (validationSource !== undefined) {
          _payload[`validation_source`] = validationSource;
        }
        if (validationStatus !== undefined) {
          _payload[`validation_status`] = validationStatus;
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
  { key: "email", option: "--email <email>", name: "email", description: "Filter to rows whose `email` is exactly this value. The mail address this document is sent to. Nullable, because a point may carry a phone number instead — but a point with neither is refused, since it delivers nothing. Note that the `email` of an address is the delivery's, not a document's: a mail address per document had nowhere to live before these rows.", type: "string", required: false },
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
  .description(`A contact point is WHERE one kind of document goes for one company: the invoice to accounts payable, the order confirmation to the buyer who placed it, the shipping notice to goods-in, the dunning letter to whoever settles it. An ERP keeps these as four separate addresses per debtor and they had nowhere to land here — the \`email\` of an address is the delivery's, not a document's — so these rows create a home rather than moving one. Exactly one point per company and kind is flagged as the one to use. Every contact point this tenant holds, filtered by \`organization_id\` for one company, by \`kind\` for one kind of document, by \`is_primary\` for the ones actually in use. \`?organization_id=…&kind=invoice&is_primary=true\` is the single read behind "where does this company's invoice go" — and it answers at most one row, because this app keeps the flag single. The page is \`limit\`/\`offset\`/\`order\`.`)
  .option(`--id <id>`, `Filter to rows whose \`id\` is exactly this value. Primary key of the contact point.`)
  .option(`--organization-id <organization-id>`, `Filter to one company's document recipients.`)
  .option(`--address-id <address-id>`, `Filter to the points carried on one postal address — the ERP case of a mail address on a delivery address.`)
  .option(`--kind <kind>`, `Filter by which document goes there. One of the tenant's own document recipient types (GET /customers/contact-point-kinds).`)
  .option(`--email <email>`, `Filter to rows whose \`email\` is exactly this value. The mail address this document is sent to. Nullable, because a point may carry a phone number instead — but a point with neither is refused, since it delivers nothing. Note that the \`email\` of an address is the delivery's, not a document's: a mail address per document had nowhere to live before these rows.`)
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
  { key: "email", option: "--email <email>", name: "email", description: "The mail address this document is sent to. Nullable, because a point may carry a phone number instead — but a point with neither is refused, since it delivers nothing. Note that the `email` of an address is the delivery's, not a document's: a mail address per document had nowhere to live before these rows.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key this point has in the system that owns it — an ERP's own id for a document sending address. Unique per tenant where set, so a repeated import updates this row instead of adding a second one. Null for a point somebody typed in here. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.", type: "string", required: false },
  { key: "isPrimary", option: "--is-primary <is-primary>", name: "is_primary", description: "The point THIS kind of document actually goes to. Exactly one point per company and kind carries it: the first point of a kind is flagged as it is created, flagging another demotes the incumbent, and it is never simply switched off — so the question has one answer while the kind has any point at all, and none only when it has none. The first point of a kind gets it on its own. Sending true on a later one demotes the incumbent in the same call; sending false on the one that holds it is refused — flag the point that should take over instead.", type: "boolean", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", description: "The number this document is sent to or announced on — a fax for an order confirmation, a mobile for a delivery notice. Free text, as somebody typed it; E.164 is what an integration should send.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where this point sits among the others of its kind, ascending. It orders the ones that are NOT flagged — a fallback list for a caller that wants every invoice recipient rather than the one. Default 0.", type: "integer", required: false },
];
customersOrganizations
  .command(`customers-contact-points-create`)
  .description(`A contact point is WHERE one kind of document goes for one company: the invoice to accounts payable, the order confirmation to the buyer who placed it, the shipping notice to goods-in, the dunning letter to whoever settles it. An ERP keeps these as four separate addresses per debtor and they had nowhere to land here — the \`email\` of an address is the delivery's, not a document's — so these rows create a home rather than moving one. Exactly one point per company and kind is flagged as the one to use. \`kind\` is required and names one of this tenant's own document recipient types — nothing is defaulted, because a point filed as the wrong document is worse than a point refused. A point needs an \`email\` or a \`phone\`, since one with neither delivers nothing. The FIRST point of a kind becomes the one to use on its own; a later one takes over only when it is sent as \`is_primary\`, which demotes the incumbent in the same call. A create cannot omit \`organization_id\` and \`kind\`; everything else is optional or defaulted by the database. Two rows of this tenant may not share the combination of \`organization_id\` + \`kind\` (while is_primary) or \`external_id\` (while external_id IS NOT NULL).`)
  .option(`--kind <kind>`, `WHICH document goes here — one of the tenant's own document recipient types (GET /customers/contact-point-kinds), seeded with invoice, order_confirmation, shipping_notice and dunning. Required and never defaulted: a point filed as the wrong document is worse than no point at all, because nothing downstream can tell that nobody chose. A merchant whose ERP mails a credit note separately adds their own type without a release of this app. Required on create, and nothing is defaulted: a kind the tenant does not keep is a 400 naming the ones on offer.`)
  .option(`--organization-id <organization-id>`, `The company whose document this is. Required — a contact point with no company is an address for nobody, and deleting the company takes its points with it. Fixed once created — the flag that says which point of a kind to use is scoped by the company, so moving a point would move an invariant with it.`)
  .option(`--address-id <address-id>`, `The postal address this point belongs to, for the one case an ERP has it: a mail address carried ON a delivery address, so the notice about a shipment goes to whoever receives it there. Null is the ordinary case and means the point is the company's rather than one address's. It has to be an address of the same company (or of one of its people), and deleting the address takes the point with it.`)
  .option(`--created-at <created-at>`, `When the point was created. Accepted on create only from a call naming no acting contact — an operator, an import, an ERP carrying a record over with its original date. A buyer sending it, or any update changing it, is a 400 \`server_owned_field\`.`)
  .option(`--email <email>`, `The mail address this document is sent to. Nullable, because a point may carry a phone number instead — but a point with neither is refused, since it delivers nothing. Note that the \`email\` of an address is the delivery's, not a document's: a mail address per document had nowhere to live before these rows.`)
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
  .description(`A contact point is WHERE one kind of document goes for one company: the invoice to accounts payable, the order confirmation to the buyer who placed it, the shipping notice to goods-in, the dunning letter to whoever settles it. An ERP keeps these as four separate addresses per debtor and they had nowhere to land here — the \`email\` of an address is the delivery's, not a document's — so these rows create a home rather than moving one. Exactly one point per company and kind is flagged as the one to use. Removes the point. If it was the flagged one, the next point of that kind takes over — so the kind keeps an answer for as long as it has any point at all, and the company is left with none only once the last one goes. Nothing else in this app points at it, so nothing else goes with it.`)
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
  .description(`A contact point is WHERE one kind of document goes for one company: the invoice to accounts payable, the order confirmation to the buyer who placed it, the shipping notice to goods-in, the dunning letter to whoever settles it. An ERP keeps these as four separate addresses per debtor and they had nowhere to land here — the \`email\` of an address is the delivery's, not a document's — so these rows create a home rather than moving one. Exactly one point per company and kind is flagged as the one to use. One contact point by id.`)
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
  { key: "email", option: "--email <email>", name: "email", description: "The mail address this document is sent to. Nullable, because a point may carry a phone number instead — but a point with neither is refused, since it delivers nothing. Note that the `email` of an address is the delivery's, not a document's: a mail address per document had nowhere to live before these rows.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key this point has in the system that owns it — an ERP's own id for a document sending address. Unique per tenant where set, so a repeated import updates this row instead of adding a second one. Null for a point somebody typed in here. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.", type: "string", required: false },
  { key: "isPrimary", option: "--is-primary <is-primary>", name: "is_primary", description: "The point THIS kind of document actually goes to. Exactly one point per company and kind carries it: the first point of a kind is flagged as it is created, flagging another demotes the incumbent, and it is never simply switched off — so the question has one answer while the kind has any point at all, and none only when it has none. The first point of a kind gets it on its own. Sending true on a later one demotes the incumbent in the same call; sending false on the one that holds it is refused — flag the point that should take over instead.", type: "boolean", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "WHICH document goes here — one of the tenant's own document recipient types (GET /customers/contact-point-kinds), seeded with invoice, order_confirmation, shipping_notice and dunning. Required and never defaulted: a point filed as the wrong document is worse than no point at all, because nothing downstream can tell that nobody chose. A merchant whose ERP mails a credit note separately adds their own type without a release of this app. Required on create, and nothing is defaulted: a kind the tenant does not keep is a 400 naming the ones on offer.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The company whose document this is. Required — a contact point with no company is an address for nobody, and deleting the company takes its points with it. Fixed once created — the flag that says which point of a kind to use is scoped by the company, so moving a point would move an invariant with it.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", description: "The number this document is sent to or announced on — a fax for an order confirmation, a mobile for a delivery notice. Free text, as somebody typed it; E.164 is what an integration should send.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where this point sits among the others of its kind, ascending. It orders the ones that are NOT flagged — a fallback list for a caller that wants every invoice recipient rather than the one. Default 0.", type: "integer", required: false },
];
customersOrganizations
  .command(`customers-contact-points-update`)
  .description(`A contact point is WHERE one kind of document goes for one company: the invoice to accounts payable, the order confirmation to the buyer who placed it, the shipping notice to goods-in, the dunning letter to whoever settles it. An ERP keeps these as four separate addresses per debtor and they had nowhere to land here — the \`email\` of an address is the delivery's, not a document's — so these rows create a home rather than moving one. Exactly one point per company and kind is flagged as the one to use. A partial update — send only what changes. The owning company is fixed (the flag is scoped by it, so moving a point between companies would move an invariant with it) and an empty body is refused. A flag MOVES rather than switching off: send \`is_primary\` on the point that should take over, because a kind with points and no flag is a question with no answer. Two rows of this tenant may not share the combination of \`organization_id\` + \`kind\` (while is_primary) or \`external_id\` (while external_id IS NOT NULL).`)
  .option(`--id <id>`, `The contact point to update.`)
  .option(`--address-id <address-id>`, `The postal address this point belongs to, for the one case an ERP has it: a mail address carried ON a delivery address, so the notice about a shipment goes to whoever receives it there. Null is the ordinary case and means the point is the company's rather than one address's. It has to be an address of the same company (or of one of its people), and deleting the address takes the point with it.`)
  .option(`--email <email>`, `The mail address this document is sent to. Nullable, because a point may carry a phone number instead — but a point with neither is refused, since it delivers nothing. Note that the \`email\` of an address is the delivery's, not a document's: a mail address per document had nowhere to live before these rows.`)
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
customersOrganizations
  .command(`customers-derived-refresh`)
  .description(`Every derived column again, from the rows as they stand: each company's city, revenue of 365 days, last order, main contact and account manager (from the sales-reps app, when it answers), each person's shop access, and how many people hold each role. Every write of this app keeps them already; this is for rows written around it — an import straight into a table — and for the first run after the release that added them. Only what is wrong is written, so it is free to repeat. The hourly metrics tick runs it too.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/customers/derived/refresh`;
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
  { key: "blockReason", option: "--block-reason <block-reason>", name: "block_reason", description: "Filter to rows whose `block_reason` is exactly this value. Why the order block was set, in the words the merchant chose it in and the tenant's default language — set by POST …/block, cleared when the block is lifted. Null while the company may order.", type: "string", required: false },
  { key: "blockNote", option: "--block-note <block-note>", name: "block_note", description: "Filter to rows whose `block_note` is exactly this value. What the merchant noted with the block: what happened, and when it may be lifted. Null when nothing was noted.", type: "string", required: false },
  { key: "blockedAt", option: "--blocked-at <blocked-at>", name: "blocked_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When the order block was set. Null while the company may order.", type: "string", required: false },
  { key: "blockedBy", option: "--blocked-by <blocked-by>", name: "blocked_by", description: "Filter to rows whose `blocked_by` is exactly this value. Who set the order block, as the caller named them. Null while the company may order, or when nobody was named.", type: "string", required: false },
  { key: "lifecycleStage", option: "--lifecycle-stage <lifecycle-stage>", name: "lifecycle_stage", description: "Filter by pipeline stage. One of the tenant's own stages (GET /customers/lifecycle-stages); a fresh install starts with lead, prospect, customer, churned.", type: "string", required: false },
  { key: "paymentTerms", option: "--payment-terms <payment-terms>", name: "payment_terms", description: "Filter to rows whose `payment_terms` is exactly this value. When this company has to pay — one of the tenant's own terms (GET /customers/payment-terms, seeded with prepayment, direct_debit, net_7/14/30/60/90). Null means nothing was agreed and the order flow falls back to the market's `default_payment_terms`. This is a commercial term, not a payment method: HOW they pay is the payments app's business.", type: "string", required: false },
  { key: "creditLimitMode", option: "--credit-limit-mode <credit-limit-mode>", name: "credit_limit_mode", description: "Filter to rows whose `credit_limit_mode` is exactly this value. Whether this company buys on credit, and how far: 'unset' (nobody decided — whoever checks credit applies its own fallback), 'limited' (open receivables up to `credit_limit`) or 'unlimited' (no ceiling, by decision). The mode is the decision; the amount exists only for 'limited'.", type: "string", required: false, enum: ["unset","limited","unlimited"] },
  { key: "creditLimit", option: "--credit-limit <credit-limit>", name: "credit_limit", description: "Filter to rows whose `credit_limit` is exactly this value. Ceiling on open receivables in the market's currency, and one of the inputs that decide whether an order is accepted at all. Set exactly when `credit_limit_mode` is 'limited', and then above 0; null otherwise — read the mode, never the null, to know whether there is a ceiling.", type: "number", required: false },
  { key: "balance", option: "--balance <balance>", name: "balance", description: "Filter to rows whose `balance` is exactly this value. What this company owes right now, in the market's currency, as its accounting system last reported it — the figure a credit limit is compared against, and the reason the limit could check nothing on its own. A COPY, never a live read: this app asks no accounting system anything, so the number is exactly as old as `source_synced_at` says and the tenant's `credit_check_max_age_hours` setting says how old is too old. Null means no source has ever reported one, which is NOT a balance of zero — reading it as nothing owed is the mistake this column exists to prevent. A negative figure is a credit balance.", type: "number", required: false },
  { key: "balanceDue", option: "--balance-due <balance-due>", name: "balance_due", description: "Filter to rows whose `balance_due` is exactly this value. How much of `balance` is already OVERDUE, in the same currency and from the same report. The difference between warning a customer and blocking one: a company at its limit with nothing overdue is buying normally, and one below its limit with an unpaid invoice from March is not. Null means no source has reported it; zero means nothing is overdue, and the two are not the same answer.", type: "number", required: false },
  { key: "creditAvailable", option: "--credit-available <credit-available>", name: "credit_available", description: "Filter to rows whose `credit_available` is exactly this value. What the company may still buy on credit: `credit_limit` minus `balance`. Generated by the database, never written. Null where no limit is set.", type: "number", required: false },
  { key: "creditUtilisation", option: "--credit-utilisation <credit-utilisation>", name: "credit_utilisation", description: "Filter to rows whose `credit_utilisation` is exactly this value. How much of the credit limit the open balance uses, in whole percent. Generated by the database, never written. Null where no limit is set.", type: "integer", required: false },
  { key: "priceList", option: "--price-list <price-list>", name: "price_list", description: "Filter to rows whose `price_list` is exactly this value. Code of the price list this company buys on — plain text pointing into the prices app. ADR-0055 forbids the cross-app foreign key, so nothing here checks it: a code that names no list simply prices nothing. `standard` is the list the prices app seeds on install.", type: "string", required: false },
  { key: "shippingAdvice", option: "--shipping-advice <shipping-advice>", name: "shipping_advice", description: "Filter by whether a part delivery is accepted. `complete` is the set of companies whose orders may not be split, which is what a warehouse wanting to know its constrained customers asks for.", type: "string", required: false, enum: ["complete","partial"] },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Filter to the companies served out of one warehouse. Exact match on the code the inventories app owns; the real codes come from the merchant, so the example here resolves nowhere.", type: "string", required: false },
  { key: "deliveryBlock", option: "--delivery-block <delivery-block>", name: "delivery_block", description: "Filter to companies whose shipments are stopped.", type: "boolean", required: false },
  { key: "deliveryBlockReason", option: "--delivery-block-reason <delivery-block-reason>", name: "delivery_block_reason", description: "Filter to rows whose `delivery_block_reason` is exactly this value. Why the delivery block was set, in the tenant's default language. Null while shipments go out.", type: "string", required: false },
  { key: "deliveryBlockedAt", option: "--delivery-blocked-at <delivery-blocked-at>", name: "delivery_blocked_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When the delivery block was set. Null while shipments go out.", type: "string", required: false },
  { key: "deliveryBlockedBy", option: "--delivery-blocked-by <delivery-blocked-by>", name: "delivery_blocked_by", description: "Filter to rows whose `delivery_blocked_by` is exactly this value. Who set the delivery block. Null while shipments go out, or when nobody was named.", type: "string", required: false },
  { key: "primaryContactId", option: "--primary-contact-id <primary-contact-id>", name: "primary_contact_id", description: "Filter to rows whose `primary_contact_id` is exactly this value. The main contact: the one person of the company marked `is_primary`. Derived and never written — POST …/set-primary-contact moves it. Null while the company has none.", type: "string", required: false },
  { key: "parentOrganizationId", option: "--parent-organization-id <parent-organization-id>", name: "parent_organization_id", description: "Filter to rows whose `parent_organization_id` is exactly this value. The head office of a group, when this company is one of its subsidiaries. A reference inside this app; deleting the head office sets it null.", type: "string", required: false },
  { key: "city", option: "--city <city>", name: "city", description: "Filter to rows whose `city` is exactly this value. The city the company is listed under: its default billing address's, else any default address's, else its first address's. Derived and never written. Null without an address.", type: "string", required: false },
  { key: "accountManagerName", option: "--account-manager-name <account-manager-name>", name: "account_manager_name", description: "Filter to rows whose `account_manager_name` is exactly this value. The name of the company's responsible sales rep, as the sales-reps app has it. A copy, refreshed when POST …/set-account-manager names one and by POST /customers/derived/refresh; null while nobody is responsible or the copy was never made.", type: "string", required: false },
  { key: "revenue365d", option: "--revenue-365d <revenue-365d>", name: "revenue_365d", description: "Filter to rows whose `revenue_365d` is exactly this value. Revenue of the last 365 days, copied from the metrics projection so the company list can show it. Never written; as fresh as the projection.", type: "number", required: false },
  { key: "lastOrderAt", option: "--last-order-at <last-order-at>", name: "last_order_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When the company last ordered, copied from the metrics projection. Never written; null when it never ordered.", type: "string", required: false },
  { key: "externalTeamId", option: "--external-team-id <external-team-id>", name: "external_team_id", description: "Find the organization behind a platform team id. The reverse of the mirror, and the way an auth-side id becomes a customer record.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Filter to rows whose `external_id` is exactly this value. The key this company has in the system that OWNS it — the ERP's own key for the customer, not the number a human quotes (that is `customer_number`). Often a GUID; it is stored verbatim, whatever shape the source uses. Unique per tenant where set, so an import upserts on it instead of matching on a name. Null for a company the shop itself created.", type: "string", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When this row was last confirmed against its source. What a delta run asks for changes since, and what tells an operator that a feed has gone quiet — a row edited in the Cockpit does not touch it, because it says when the SOURCE was last seen, not when the row changed. Null for a row no source owns.", type: "string", required: false },
  { key: "deletedAt", option: "--deleted-at <deleted-at>", name: "deleted_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When this company was moved to the trash, or null while it is live. A company in the trash is left out of every list unless `trashed` asks for it, cannot sign in or be signed in for, and is deleted for good by a second DELETE or by the daily purge.", type: "string", required: false },
  { key: "deletedBy", option: "--deleted-by <deleted-by>", name: "deleted_by", description: "Filter to rows whose `deleted_by` is exactly this value. Who moved it to the trash, as the platform named them — an email, or `system`. Null while it is live.", type: "string", required: false },
  { key: "deletedById", option: "--deleted-by-id <deleted-by-id>", name: "deleted_by_id", description: "Filter to rows whose `deleted_by_id` is exactly this value. The platform subject of whoever moved it to the trash. Kept beside the name so the person can be pseudonymised later without losing who acted. Null while it is live, and for the system.", type: "string", required: false },
  { key: "trashBatch", option: "--trash-batch <trash-batch>", name: "trash_batch", description: "Filter to rows whose `trash_batch` is exactly this value. The trash action this record went with. An organization and the contacts it took along share one; a restore brings back exactly the records that carry it.", type: "string", required: false },
  { key: "purgeAt", option: "--purge-at <purge-at>", name: "purge_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When the daily purge deletes it for good unless it is restored first: `deleted_at` plus the tenant's trash retention (90 days unless the tenant says otherwise). Null while it is live.", type: "string", required: false },
  { key: "purgeBlockedReason", option: "--purge-blocked-reason <purge-blocked-reason>", name: "purge_blocked_reason", description: "Filter to rows whose `purge_blocked_reason` is exactly this value. Why the purge could not delete it for good — an open order, a quote, a price list another app still holds. Null when nothing stopped it. Cleared by a restore.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When this company record was created in this app. Not when the customer relationship began — an ERP import creates decade-old customers today.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When any column of this row last changed.", type: "string", required: false },
  { key: "trashed", option: "--trashed <trashed>", name: "trashed", description: "Whether the trash is part of the answer. `exclude` (the default) leaves records in the trash out, `only` answers the trash itself, `include` both. A call acting for a buyer is always `exclude`.", type: "string", required: false, enum: ["exclude","only","include"] },
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
  .option(`--block-reason <block-reason>`, `Filter to rows whose \`block_reason\` is exactly this value. Why the order block was set, in the words the merchant chose it in and the tenant's default language — set by POST …/block, cleared when the block is lifted. Null while the company may order.`)
  .option(`--block-note <block-note>`, `Filter to rows whose \`block_note\` is exactly this value. What the merchant noted with the block: what happened, and when it may be lifted. Null when nothing was noted.`)
  .option(`--blocked-at <blocked-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When the order block was set. Null while the company may order.`)
  .option(`--blocked-by <blocked-by>`, `Filter to rows whose \`blocked_by\` is exactly this value. Who set the order block, as the caller named them. Null while the company may order, or when nobody was named.`)
  .option(`--lifecycle-stage <lifecycle-stage>`, `Filter by pipeline stage. One of the tenant's own stages (GET /customers/lifecycle-stages); a fresh install starts with lead, prospect, customer, churned.`)
  .option(`--payment-terms <payment-terms>`, `Filter to rows whose \`payment_terms\` is exactly this value. When this company has to pay — one of the tenant's own terms (GET /customers/payment-terms, seeded with prepayment, direct_debit, net_7/14/30/60/90). Null means nothing was agreed and the order flow falls back to the market's \`default_payment_terms\`. This is a commercial term, not a payment method: HOW they pay is the payments app's business.`)
  .option(`--credit-limit-mode <credit-limit-mode>`, `Filter to rows whose \`credit_limit_mode\` is exactly this value. Whether this company buys on credit, and how far: 'unset' (nobody decided — whoever checks credit applies its own fallback), 'limited' (open receivables up to \`credit_limit\`) or 'unlimited' (no ceiling, by decision). The mode is the decision; the amount exists only for 'limited'.`)
  .option(`--credit-limit <credit-limit>`, `Filter to rows whose \`credit_limit\` is exactly this value. Ceiling on open receivables in the market's currency, and one of the inputs that decide whether an order is accepted at all. Set exactly when \`credit_limit_mode\` is 'limited', and then above 0; null otherwise — read the mode, never the null, to know whether there is a ceiling.`, parseInteger)
  .option(`--balance <balance>`, `Filter to rows whose \`balance\` is exactly this value. What this company owes right now, in the market's currency, as its accounting system last reported it — the figure a credit limit is compared against, and the reason the limit could check nothing on its own. A COPY, never a live read: this app asks no accounting system anything, so the number is exactly as old as \`source_synced_at\` says and the tenant's \`credit_check_max_age_hours\` setting says how old is too old. Null means no source has ever reported one, which is NOT a balance of zero — reading it as nothing owed is the mistake this column exists to prevent. A negative figure is a credit balance.`, parseInteger)
  .option(`--balance-due <balance-due>`, `Filter to rows whose \`balance_due\` is exactly this value. How much of \`balance\` is already OVERDUE, in the same currency and from the same report. The difference between warning a customer and blocking one: a company at its limit with nothing overdue is buying normally, and one below its limit with an unpaid invoice from March is not. Null means no source has reported it; zero means nothing is overdue, and the two are not the same answer.`, parseInteger)
  .option(`--credit-available <credit-available>`, `Filter to rows whose \`credit_available\` is exactly this value. What the company may still buy on credit: \`credit_limit\` minus \`balance\`. Generated by the database, never written. Null where no limit is set.`, parseInteger)
  .option(`--credit-utilisation <credit-utilisation>`, `Filter to rows whose \`credit_utilisation\` is exactly this value. How much of the credit limit the open balance uses, in whole percent. Generated by the database, never written. Null where no limit is set.`, parseInteger)
  .option(`--price-list <price-list>`, `Filter to rows whose \`price_list\` is exactly this value. Code of the price list this company buys on — plain text pointing into the prices app. ADR-0055 forbids the cross-app foreign key, so nothing here checks it: a code that names no list simply prices nothing. \`standard\` is the list the prices app seeds on install.`)
  .option(`--shipping-advice <shipping-advice>`, `Filter by whether a part delivery is accepted. \`complete\` is the set of companies whose orders may not be split, which is what a warehouse wanting to know its constrained customers asks for.`)
  .option(`--location-code <location-code>`, `Filter to the companies served out of one warehouse. Exact match on the code the inventories app owns; the real codes come from the merchant, so the example here resolves nowhere.`)
  .option(
    `--delivery-block [value]`,
    `Filter to companies whose shipments are stopped.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--delivery-block-reason <delivery-block-reason>`, `Filter to rows whose \`delivery_block_reason\` is exactly this value. Why the delivery block was set, in the tenant's default language. Null while shipments go out.`)
  .option(`--delivery-blocked-at <delivery-blocked-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When the delivery block was set. Null while shipments go out.`)
  .option(`--delivery-blocked-by <delivery-blocked-by>`, `Filter to rows whose \`delivery_blocked_by\` is exactly this value. Who set the delivery block. Null while shipments go out, or when nobody was named.`)
  .option(`--primary-contact-id <primary-contact-id>`, `Filter to rows whose \`primary_contact_id\` is exactly this value. The main contact: the one person of the company marked \`is_primary\`. Derived and never written — POST …/set-primary-contact moves it. Null while the company has none.`)
  .option(`--parent-organization-id <parent-organization-id>`, `Filter to rows whose \`parent_organization_id\` is exactly this value. The head office of a group, when this company is one of its subsidiaries. A reference inside this app; deleting the head office sets it null.`)
  .option(`--city <city>`, `Filter to rows whose \`city\` is exactly this value. The city the company is listed under: its default billing address's, else any default address's, else its first address's. Derived and never written. Null without an address.`)
  .option(`--account-manager-name <account-manager-name>`, `Filter to rows whose \`account_manager_name\` is exactly this value. The name of the company's responsible sales rep, as the sales-reps app has it. A copy, refreshed when POST …/set-account-manager names one and by POST /customers/derived/refresh; null while nobody is responsible or the copy was never made.`)
  .option(`--revenue-365d <revenue-365d>`, `Filter to rows whose \`revenue_365d\` is exactly this value. Revenue of the last 365 days, copied from the metrics projection so the company list can show it. Never written; as fresh as the projection.`, parseInteger)
  .option(`--last-order-at <last-order-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When the company last ordered, copied from the metrics projection. Never written; null when it never ordered.`)
  .option(`--external-team-id <external-team-id>`, `Find the organization behind a platform team id. The reverse of the mirror, and the way an auth-side id becomes a customer record.`)
  .option(`--external-id <external-id>`, `Filter to rows whose \`external_id\` is exactly this value. The key this company has in the system that OWNS it — the ERP's own key for the customer, not the number a human quotes (that is \`customer_number\`). Often a GUID; it is stored verbatim, whatever shape the source uses. Unique per tenant where set, so an import upserts on it instead of matching on a name. Null for a company the shop itself created.`)
  .option(`--source-synced-at <source-synced-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When this row was last confirmed against its source. What a delta run asks for changes since, and what tells an operator that a feed has gone quiet — a row edited in the Cockpit does not touch it, because it says when the SOURCE was last seen, not when the row changed. Null for a row no source owns.`)
  .option(`--deleted-at <deleted-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When this company was moved to the trash, or null while it is live. A company in the trash is left out of every list unless \`trashed\` asks for it, cannot sign in or be signed in for, and is deleted for good by a second DELETE or by the daily purge.`)
  .option(`--deleted-by <deleted-by>`, `Filter to rows whose \`deleted_by\` is exactly this value. Who moved it to the trash, as the platform named them — an email, or \`system\`. Null while it is live.`)
  .option(`--deleted-by-id <deleted-by-id>`, `Filter to rows whose \`deleted_by_id\` is exactly this value. The platform subject of whoever moved it to the trash. Kept beside the name so the person can be pseudonymised later without losing who acted. Null while it is live, and for the system.`)
  .option(`--trash-batch <trash-batch>`, `Filter to rows whose \`trash_batch\` is exactly this value. The trash action this record went with. An organization and the contacts it took along share one; a restore brings back exactly the records that carry it.`)
  .option(`--purge-at <purge-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When the daily purge deletes it for good unless it is restored first: \`deleted_at\` plus the tenant's trash retention (90 days unless the tenant says otherwise). Null while it is live.`)
  .option(`--purge-blocked-reason <purge-blocked-reason>`, `Filter to rows whose \`purge_blocked_reason\` is exactly this value. Why the purge could not delete it for good — an open order, a quote, a price list another app still holds. Null when nothing stopped it. Cleared by a restore.`)
  .option(`--created-at <created-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When this company record was created in this app. Not when the customer relationship began — an ERP import creates decade-old customers today.`)
  .option(`--updated-at <updated-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When any column of this row last changed.`)
  .option(`--trashed <trashed>`, `Whether the trash is part of the answer. \`exclude\` (the default) leaves records in the trash out, \`only\` answers the trash itself, \`include\` both. A call acting for a buyer is always \`exclude\`.`)
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
        const { id, name, vatId, branche, customerNumber, status, blockReason, blockNote, blockedAt, blockedBy, lifecycleStage, paymentTerms, creditLimitMode, creditLimit, balance, balanceDue, creditAvailable, creditUtilisation, priceList, shippingAdvice, locationCode, deliveryBlock, deliveryBlockReason, deliveryBlockedAt, deliveryBlockedBy, primaryContactId, parentOrganizationId, city, accountManagerName, revenue365d, lastOrderAt, externalTeamId, externalId, sourceSyncedAt, deletedAt, deletedBy, deletedById, trashBatch, purgeAt, purgeBlockedReason, createdAt, updatedAt, trashed, limit, offset, order, filter } = await promptForMissing(
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
        if (blockReason !== undefined) {
          _payload[`block_reason`] = blockReason;
        }
        if (blockNote !== undefined) {
          _payload[`block_note`] = blockNote;
        }
        if (blockedAt !== undefined) {
          _payload[`blocked_at`] = blockedAt;
        }
        if (blockedBy !== undefined) {
          _payload[`blocked_by`] = blockedBy;
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
        if (creditAvailable !== undefined) {
          _payload[`credit_available`] = creditAvailable;
        }
        if (creditUtilisation !== undefined) {
          _payload[`credit_utilisation`] = creditUtilisation;
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
        if (deliveryBlockReason !== undefined) {
          _payload[`delivery_block_reason`] = deliveryBlockReason;
        }
        if (deliveryBlockedAt !== undefined) {
          _payload[`delivery_blocked_at`] = deliveryBlockedAt;
        }
        if (deliveryBlockedBy !== undefined) {
          _payload[`delivery_blocked_by`] = deliveryBlockedBy;
        }
        if (primaryContactId !== undefined) {
          _payload[`primary_contact_id`] = primaryContactId;
        }
        if (parentOrganizationId !== undefined) {
          _payload[`parent_organization_id`] = parentOrganizationId;
        }
        if (city !== undefined) {
          _payload[`city`] = city;
        }
        if (accountManagerName !== undefined) {
          _payload[`account_manager_name`] = accountManagerName;
        }
        if (revenue365d !== undefined) {
          _payload[`revenue_365d`] = revenue365d;
        }
        if (lastOrderAt !== undefined) {
          _payload[`last_order_at`] = lastOrderAt;
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
        if (deletedAt !== undefined) {
          _payload[`deleted_at`] = deletedAt;
        }
        if (deletedBy !== undefined) {
          _payload[`deleted_by`] = deletedBy;
        }
        if (deletedById !== undefined) {
          _payload[`deleted_by_id`] = deletedById;
        }
        if (trashBatch !== undefined) {
          _payload[`trash_batch`] = trashBatch;
        }
        if (purgeAt !== undefined) {
          _payload[`purge_at`] = purgeAt;
        }
        if (purgeBlockedReason !== undefined) {
          _payload[`purge_blocked_reason`] = purgeBlockedReason;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
        }
        if (updatedAt !== undefined) {
          _payload[`updated_at`] = updatedAt;
        }
        if (trashed !== undefined) {
          _payload[`trashed`] = trashed;
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
const onboardSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The company name.", type: "string", required: true },
  { key: "accountManager", option: "--account-manager <account-manager>", name: "account_manager", description: "The responsible sales rep's code.", type: "string", required: false },
  { key: "billingCity", option: "--billing-city <billing-city>", name: "billing_city", description: "Billing address: city.", type: "string", required: false },
  { key: "billingCountry", option: "--billing-country <billing-country>", name: "billing_country", description: "Billing address: ISO 3166-1 alpha-2, DE when absent.", type: "string", required: false },
  { key: "billingStreet", option: "--billing-street <billing-street>", name: "billing_street", description: "Billing address: street and number.", type: "string", required: false },
  { key: "billingZip", option: "--billing-zip <billing-zip>", name: "billing_zip", description: "Billing address: postal code.", type: "string", required: false },
  { key: "branche", option: "--branche <branche>", name: "branche", description: "The industry.", type: "string", required: false },
  { key: "contactEmail", option: "--contact-email <contact-email>", name: "contact_email", description: "Main contact: email, required when a main contact is given.", type: "string", required: false },
  { key: "contactFirstName", option: "--contact-first-name <contact-first-name>", name: "contact_first_name", description: "Main contact: first name.", type: "string", required: false },
  { key: "contactJobTitle", option: "--contact-job-title <contact-job-title>", name: "contact_job_title", description: "Main contact: job title.", type: "string", required: false },
  { key: "contactLastName", option: "--contact-last-name <contact-last-name>", name: "contact_last_name", description: "Main contact: last name.", type: "string", required: false },
  { key: "contactPhone", option: "--contact-phone <contact-phone>", name: "contact_phone", description: "Main contact: phone.", type: "string", required: false },
  { key: "contactRole", option: "--contact-role <contact-role>", name: "contact_role", description: "Main contact: role key; the tenant's default when absent.", type: "string", required: false },
  { key: "customerNumber", option: "--customer-number <customer-number>", name: "customer_number", description: "The number the customer quotes.", type: "string", required: false },
  { key: "lifecycleStage", option: "--lifecycle-stage <lifecycle-stage>", name: "lifecycle_stage", description: "A lifecycle stage code; the tenant's default when absent.", type: "string", required: false },
  { key: "paymentTerms", option: "--payment-terms <payment-terms>", name: "payment_terms", description: "A payment terms code; the tenant's default when absent.", type: "string", required: false },
  { key: "sendInvite", option: "--send-invite <send-invite>", name: "send_invite", description: "Whether the main contact is invited to the shop now. True when absent.", type: "boolean", required: false },
  { key: "vatId", option: "--vat-id <vat-id>", name: "vat_id", description: "The VAT ID.", type: "string", required: false },
];
customersOrganizations
  .command(`onboard`)
  .description(`Found a business customer the way a merchant thinks of it: the company, its billing address, its main contact — invited to the shop unless told otherwise — and its responsible sales rep, in one call. The company and the person go through the same checks their plain creates run; a failure after the company exists takes everything this call founded back out. The sales rep is best effort: an unknown code or an unreachable sales-reps app founds the customer without one.`)
  .option(`--name <name>`, `The company name.`)
  .option(`--account-manager <account-manager>`, `The responsible sales rep's code.`)
  .option(`--billing-city <billing-city>`, `Billing address: city.`)
  .option(`--billing-country <billing-country>`, `Billing address: ISO 3166-1 alpha-2, DE when absent.`)
  .option(`--billing-street <billing-street>`, `Billing address: street and number.`)
  .option(`--billing-zip <billing-zip>`, `Billing address: postal code.`)
  .option(`--branche <branche>`, `The industry.`)
  .option(`--contact-email <contact-email>`, `Main contact: email, required when a main contact is given.`)
  .option(`--contact-first-name <contact-first-name>`, `Main contact: first name.`)
  .option(`--contact-job-title <contact-job-title>`, `Main contact: job title.`)
  .option(`--contact-last-name <contact-last-name>`, `Main contact: last name.`)
  .option(`--contact-phone <contact-phone>`, `Main contact: phone.`)
  .option(`--contact-role <contact-role>`, `Main contact: role key; the tenant's default when absent.`)
  .option(`--customer-number <customer-number>`, `The number the customer quotes.`)
  .option(`--lifecycle-stage <lifecycle-stage>`, `A lifecycle stage code; the tenant's default when absent.`)
  .option(`--payment-terms <payment-terms>`, `A payment terms code; the tenant's default when absent.`)
  .option(
    `--send-invite [value]`,
    `Whether the main contact is invited to the shop now. True when absent.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--vat-id <vat-id>`, `The VAT ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, accountManager, billingCity, billingCountry, billingStreet, billingZip, branche, contactEmail, contactFirstName, contactJobTitle, contactLastName, contactPhone, contactRole, customerNumber, lifecycleStage, paymentTerms, sendInvite, vatId } = await promptForMissing(
          _options,
          onboardSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations/onboard`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (accountManager !== undefined) {
          _payload[`account_manager`] = accountManager;
        }
        if (billingCity !== undefined) {
          _payload[`billing_city`] = billingCity;
        }
        if (billingCountry !== undefined) {
          _payload[`billing_country`] = billingCountry;
        }
        if (billingStreet !== undefined) {
          _payload[`billing_street`] = billingStreet;
        }
        if (billingZip !== undefined) {
          _payload[`billing_zip`] = billingZip;
        }
        if (branche !== undefined) {
          _payload[`branche`] = branche;
        }
        if (contactEmail !== undefined) {
          _payload[`contact_email`] = contactEmail;
        }
        if (contactFirstName !== undefined) {
          _payload[`contact_first_name`] = contactFirstName;
        }
        if (contactJobTitle !== undefined) {
          _payload[`contact_job_title`] = contactJobTitle;
        }
        if (contactLastName !== undefined) {
          _payload[`contact_last_name`] = contactLastName;
        }
        if (contactPhone !== undefined) {
          _payload[`contact_phone`] = contactPhone;
        }
        if (contactRole !== undefined) {
          _payload[`contact_role`] = contactRole;
        }
        if (customerNumber !== undefined) {
          _payload[`customer_number`] = customerNumber;
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
        if (sendInvite !== undefined) {
          _payload[`send_invite`] = sendInvite;
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, onboardSpecs, { method: "post" });
customersOrganizations
  .command(`trash-empty`)
  .description(`Deletes every organization in the trash for good, oldest first and at most fifty per call, each checked on its own exactly like a second DELETE. A organization something still blocks stays in the trash and is listed with the reason; the rest go. POST again while \`more\` is true. An administrator's right, never a buyer's.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations/trash/empty`;
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
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The organization to delete.", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
];
customersOrganizations
  .command(`delete`)
  .description(`An organization is a buying COMPANY — the unit a contract, a credit limit, a price list and a payment term belong to, and the unit an order is placed on behalf of. It is not a household and not a person: the people are \`contacts\`, and a company with no contacts yet is a perfectly normal row. Every organization is mirrored into platform auth as a team, so a name written here is the name storefront authentication shows. The first DELETE moves the organization to the trash: it keeps everything that points at it, leaves every list, and can no longer sign in or be signed in for. An organization takes its live contacts along as one group: their logins are switched off and their sessions ended, nothing is deleted. A second DELETE on a organization already in the trash deletes it for good, with its platform team and the logins of the contacts that went with it — refused while another app still holds an open order, quote, purchase request or approval, an enabled punchout account, a punchout account naming the person as its fallback contact, a customer price list, an active cost centre or a personal voucher. An app that does not answer blocks too. The daily purge runs the same delete once the tenant's trash retention has run out.`)
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
const blockSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The organization.", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Why the company is blocked. Stored as its words in the tenant's default language.", type: "string", required: true, enum: ["payment_overdue","credit_exceeded","insolvency","dispute","compliance","customer_request","other"] },
  { key: "actor", option: "--actor <actor>", name: "actor", description: "Who set the block, as the record should name them.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Which block. 'order' (the default) stops ordering, 'delivery' stops shipping.", type: "string", required: false, enum: ["order","delivery"] },
  { key: "note", option: "--note <note>", name: "note", description: "What happened, in the merchant's own words. Stored on the timeline entry.", type: "string", required: false },
];
customersOrganizations
  .command(`block`)
  .description(`A block is a decision with a reason, not a field somebody edits. \`kind: order\` sets \`status\` to 'blocked' with the reason, the note, when and who — every contact behind the company stops buying and \`organization.blocked\` is published, exactly as when the status is edited. \`kind: delivery\` sets \`delivery_block\`: orders are still taken and nothing ships. Both land on the company's timeline as a system entry. Lifting a block is its own call, with a note.`)
  .option(`--id <id>`, `The organization.`)
  .option(`--reason <reason>`, `Why the company is blocked. Stored as its words in the tenant's default language.`)
  .option(`--actor <actor>`, `Who set the block, as the record should name them.`)
  .option(`--kind <kind>`, `Which block. 'order' (the default) stops ordering, 'delivery' stops shipping.`)
  .option(`--note <note>`, `What happened, in the merchant's own words. Stored on the timeline entry.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, reason, actor, kind, note } = await promptForMissing(
          _options,
          blockSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations/{id}/block`.replace(`{id}`, id);
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, blockSpecs, { method: "post" });
const careSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The organization.", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
];
customersOrganizations
  .command(`care`)
  .description(`The account manager, from the sales-reps app, and the main contact, from here — what the card on the company's page shows. The sales-reps half is null when that app cannot be asked, so the card still names the main contact.`)
  .option(`--id <id>`, `The organization.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          careSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations/{id}/care`.replace(`{id}`, id);
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, careSpecs, { method: "get" });
const changeCreditSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The organization.", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Why the credit changes. Stored as its words in the tenant's default language.", type: "string", required: true, enum: ["rating_changed","volume_changed","payment_behaviour","customer_request","other"] },
  { key: "creditLimit", option: "--credit-limit <credit-limit>", name: "credit_limit", description: "The new limit, for the limited mode.", type: "number", required: false },
  { key: "creditLimitMode", option: "--credit-limit-mode <credit-limit-mode>", name: "credit_limit_mode", description: "The new credit mode.", type: "string", required: false, enum: ["unset","limited","unlimited"] },
  { key: "note", option: "--note <note>", name: "note", description: "What happened, in the merchant's own words. Stored on the timeline entry.", type: "string", required: false },
];
customersOrganizations
  .command(`change-credit`)
  .description(`The credit a company buys on is changed with a reason, so its timeline says what it was, what it is and why. The same rules as an edit apply: a limited mode needs an amount, any other mode clears it.`)
  .option(`--id <id>`, `The organization.`)
  .option(`--reason <reason>`, `Why the credit changes. Stored as its words in the tenant's default language.`)
  .option(`--credit-limit <credit-limit>`, `The new limit, for the limited mode.`, parseInteger)
  .option(`--credit-limit-mode <credit-limit-mode>`, `The new credit mode.`)
  .option(`--note <note>`, `What happened, in the merchant's own words. Stored on the timeline entry.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, reason, creditLimit, creditLimitMode, note } = await promptForMissing(
          _options,
          changeCreditSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations/{id}/change-credit`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (creditLimit !== undefined) {
          _payload[`credit_limit`] = creditLimit;
        }
        if (creditLimitMode !== undefined) {
          _payload[`credit_limit_mode`] = creditLimitMode;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, changeCreditSpecs, { method: "post" });
const restoreSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The organization to restore.", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
];
customersOrganizations
  .command(`restore`)
  .description(`Brings an organization back from the trash together with the contacts that went with it — the ones that carry its \`trash_batch\`. A contact trashed on its own before stays in the trash. Their logins are switched back on unless the record itself says no (blocked, or an undecided registration). Needs the same right as the delete.`)
  .option(`--id <id>`, `The organization to restore.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          restoreSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations/{id}/restore`.replace(`{id}`, id);
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, restoreSpecs, { method: "post" });
const setAccountManagerSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The organization.", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
  { key: "repCode", option: "--rep-code <rep-code>", name: "rep_code", description: "The rep's code in the sales-reps app.", type: "string", required: true },
];
customersOrganizations
  .command(`set-account-manager`)
  .description(`Who is responsible for a customer lives in the sales-reps app, so this call asks it: the coverage of the rep and the company is recorded when there is none, and the rep is made the responsible one there. The rep's name is copied to \`account_manager_name\` for the company list, and the change lands on the company's timeline.`)
  .option(`--id <id>`, `The organization.`)
  .option(`--rep-code <rep-code>`, `The rep's code in the sales-reps app.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, repCode } = await promptForMissing(
          _options,
          setAccountManagerSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations/{id}/set-account-manager`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (repCode !== undefined) {
          _payload[`rep_code`] = repCode;
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, setAccountManagerSpecs, { method: "post" });
const setPrimaryContactSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The organization.", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person of this company who becomes the main contact.", type: "string", required: true },
];
customersOrganizations
  .command(`set-primary-contact`)
  .description(`Mark one person of the company as its main contact — the recipient of documents and invitations — and release whoever held it, in one call. \`primary_contact_id\` follows. Naming the main contact again changes nothing.`)
  .option(`--id <id>`, `The organization.`)
  .option(`--contact-id <contact-id>`, `The person of this company who becomes the main contact.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, contactId } = await promptForMissing(
          _options,
          setPrimaryContactSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations/{id}/set-primary-contact`.replace(`{id}`, id);
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, setPrimaryContactSpecs, { method: "post" });
const unblockDeliverySpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The organization.", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
  { key: "note", option: "--note <note>", name: "note", description: "Why the block is lifted.", type: "string", required: true },
];
customersOrganizations
  .command(`unblock-delivery`)
  .description(`Lift the delivery block of a company, with a note saying why. The reason, the note, when and who are cleared from the record and the lifting lands on the company's timeline.`)
  .option(`--id <id>`, `The organization.`)
  .option(`--note <note>`, `Why the block is lifted.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, note } = await promptForMissing(
          _options,
          unblockDeliverySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations/{id}/unblock-delivery`.replace(`{id}`, id);
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, unblockDeliverySpecs, { method: "post" });
const unblockOrderSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The organization.", type: "string", required: true, resource: { listPath: "/customers/organizations", hasLimit: true } },
  { key: "note", option: "--note <note>", name: "note", description: "Why the block is lifted.", type: "string", required: true },
];
customersOrganizations
  .command(`unblock-order`)
  .description(`Lift the order block of a company, with a note saying why. The reason, the note, when and who are cleared from the record and the lifting lands on the company's timeline.`)
  .option(`--id <id>`, `The organization.`)
  .option(`--note <note>`, `Why the block is lifted.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, note } = await promptForMissing(
          _options,
          unblockOrderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations/{id}/unblock-order`.replace(`{id}`, id);
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
registerPromptSpecs(customersOrganizations.commands.at(-1)!, unblockOrderSpecs, { method: "post" });
