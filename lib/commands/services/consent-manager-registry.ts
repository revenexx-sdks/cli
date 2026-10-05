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

export const consentManagerRegistry = new Command("consent-manager-registry")
  .description(
    commandDescriptions["consentManagerRegistry"] ??
      `What a shop asks consent for: purposes with their legal basis (consent, legitimate interest, necessary), the vendors a merchant uses with their company, hosts and cookies, and the shipped vendor catalogue those vendors are adopted from. An adopted vendor is a tenant-owned copy; a newer catalogue entry is flagged and never applied without the merchant.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const consentManagerCatalogListSpecs: PromptSpec[] = [
  { key: "category", option: "--category <category>", name: "category", description: "Only entries of this category: platform, tag_manager, analytics, advertising, marketing_automation, visitor_identification, chat, ab_testing, personalisation, search, external_media, fonts, reviews, payment or security.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
consentManagerRegistry
  .command(`consent-manager-catalog-list`)
  .description(`The vendor catalogue this version of the app ships — the vendors met in B2B shops, each with company, purposes, hosts and cookies in German and English — and, per entry, whether this tenant adopted it and whether the copy is older. \`?category=\` narrows it to one group (analytics, advertising, chat, external_media, …).`)
  .option(`--category <category>`, `Only entries of this category: platform, tag_manager, analytics, advertising, marketing_automation, visitor_identification, chat, ab_testing, personalisation, search, external_media, fonts, reviews, payment or security.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { category, filter } = await promptForMissing(
          _options,
          consentManagerCatalogListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/catalog`;
        const _payload: RequestParams = {};
        if (category !== undefined) {
          _payload[`category`] = category;
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerCatalogListSpecs, { method: "get" });
const consentManagerCatalogAdoptSpecs: PromptSpec[] = [
  { key: "key", option: "--key <key>", name: "key", description: "The catalogue key.", type: "string", required: true },
  { key: "purposes", option: "--purposes [purposes...]", name: "purposes", description: "Purpose codes to file the vendor under instead of the catalogue's.", type: "array", required: false },
  { key: "refresh", option: "--refresh <refresh>", name: "refresh", description: "Take the current catalogue entry for a vendor already adopted.", type: "boolean", required: false },
];
consentManagerRegistry
  .command(`consent-manager-catalog-adopt`)
  .description(`Creates a vendor from a catalogue entry — its fields, its cookies and its purpose links — and records the catalogue key and version it came from. The copy is the tenant's: nothing re-reads the catalogue. Adopting an entry already adopted is refused unless \`refresh: true\` is sent, which takes the catalogue's current fields and replaces the cookies. A \`legal_basis_hint\` that differs from the purposes' basis becomes the vendor's \`legal_basis_override\`.`)
  .option(`--key <key>`, `The catalogue key.`)
  .option(`--purposes [purposes...]`, `Purpose codes to file the vendor under instead of the catalogue's.`)
  .option(
    `--refresh [value]`,
    `Take the current catalogue entry for a vendor already adopted.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { key, purposes, refresh } = await promptForMissing(
          _options,
          consentManagerCatalogAdoptSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/catalog/adopt`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (key !== undefined) {
          _payload[`key`] = key;
        }
        if (purposes !== undefined) {
          _payload[`purposes`] = purposes;
        }
        if (refresh !== undefined) {
          _payload[`refresh`] = refresh;
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerCatalogAdoptSpecs, { method: "post" });
const consentManagerCookiesListSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Filter to rows whose `id` is exactly this value. The row's own id, generated by the database. A caller never sends one; it reads one back and puts it in the path of later calls.", type: "string", required: false },
  { key: "vendorId", option: "--vendor-id <vendor-id>", name: "vendor_id", description: "Filter to rows whose `vendor_id` is exactly this value. The vendor this row belongs to.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Filter to rows whose `name` is exactly this value. The cookie or storage key as the browser shows it.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Filter to rows whose `kind` is exactly this value. Where on the device it is stored: cookie, local_storage, session_storage, indexeddb or pixel.", type: "string", required: false, enum: ["cookie","local_storage","session_storage","indexeddb","pixel"] },
  { key: "host", option: "--host <host>", name: "host", description: "Filter to rows whose `host` is exactly this value. Who sets it: 'first-party' for the shop's own domain, otherwise the third-party host.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Filter to rows whose `position` is exactly this value. Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.", type: "integer", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Filter to rows whose `created_at` is exactly this value. When the row was created. Server-set.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Filter to rows whose `updated_at` is exactly this value. When the row was last written. Server-set — every route that changes the row stamps it.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column', 'column.asc' or 'column.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
consentManagerRegistry
  .command(`consent-manager-cookies-list`)
  .description(`Cookies and storage entries, usually filtered with \`?vendor_id=\`.`)
  .option(`--id <id>`, `Filter to rows whose \`id\` is exactly this value. The row's own id, generated by the database. A caller never sends one; it reads one back and puts it in the path of later calls.`)
  .option(`--vendor-id <vendor-id>`, `Filter to rows whose \`vendor_id\` is exactly this value. The vendor this row belongs to.`)
  .option(`--name <name>`, `Filter to rows whose \`name\` is exactly this value. The cookie or storage key as the browser shows it.`)
  .option(`--kind <kind>`, `Filter to rows whose \`kind\` is exactly this value. Where on the device it is stored: cookie, local_storage, session_storage, indexeddb or pixel.`)
  .option(`--host <host>`, `Filter to rows whose \`host\` is exactly this value. Who sets it: 'first-party' for the shop's own domain, otherwise the third-party host.`)
  .option(`--position <position>`, `Filter to rows whose \`position\` is exactly this value. Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.`, parseInteger)
  .option(`--created-at <created-at>`, `Filter to rows whose \`created_at\` is exactly this value. When the row was created. Server-set.`)
  .option(`--updated-at <updated-at>`, `Filter to rows whose \`updated_at\` is exactly this value. When the row was last written. Server-set — every route that changes the row stamps it.`)
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
        const { id, vendorId, name, kind, host, position, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          consentManagerCookiesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/cookies`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (vendorId !== undefined) {
          _payload[`vendor_id`] = vendorId;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (host !== undefined) {
          _payload[`host`] = host;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerCookiesListSpecs, { method: "get" });
const consentManagerCookiesCreateSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The cookie or storage key as the browser shows it.", type: "string", required: true },
  { key: "vendorId", option: "--vendor-id <vendor-id>", name: "vendor_id", description: "The vendor that sets this cookie. It has to be a vendor this tenant keeps.", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", description: "What the cookie is for, as the banner shows it.", type: "object", required: false },
  { key: "duration", option: "--duration <duration>", name: "duration", description: "How long it lives, as the banner shows it. A text per language tag, e.g. { \"de\": \"…\", \"en\": \"…\" }.", type: "object", required: false },
  { key: "host", option: "--host <host>", name: "host", description: "Who sets it: 'first-party' for the shop's own domain, otherwise the third-party host.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Where on the device it is stored: cookie, local_storage, session_storage, indexeddb or pixel.", type: "string", required: false, enum: ["cookie","local_storage","session_storage","indexeddb","pixel"] },
  { key: "position", option: "--position <position>", name: "position", description: "Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.", type: "integer", required: false },
];
consentManagerRegistry
  .command(`consent-manager-cookies-create`)
  .description(`Declare one cookie or storage entry of a vendor this tenant keeps.`)
  .option(`--name <name>`, `The cookie or storage key as the browser shows it.`)
  .option(`--vendor-id <vendor-id>`, `The vendor that sets this cookie. It has to be a vendor this tenant keeps.`)
  .option(`--description <description>`, `What the cookie is for, as the banner shows it.`)
  .option(`--duration <duration>`, `How long it lives, as the banner shows it. A text per language tag, e.g. { "de": "…", "en": "…" }.`)
  .option(`--host <host>`, `Who sets it: 'first-party' for the shop's own domain, otherwise the third-party host.`)
  .option(`--kind <kind>`, `Where on the device it is stored: cookie, local_storage, session_storage, indexeddb or pixel.`)
  .option(`--position <position>`, `Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, vendorId, description, duration, host, kind, position } = await promptForMissing(
          _options,
          consentManagerCookiesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/cookies`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (description !== undefined) {
          _payload[`description`] = resolveBodyParam(description);
        }
        if (duration !== undefined) {
          _payload[`duration`] = resolveBodyParam(duration);
        }
        if (host !== undefined) {
          _payload[`host`] = host;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (vendorId !== undefined) {
          _payload[`vendor_id`] = vendorId;
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerCookiesCreateSpecs, { method: "post" });
const consentManagerCookiesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The cookie.", type: "string", required: true, resource: { listPath: "/consent-manager/cookies", hasLimit: true } },
];
consentManagerRegistry
  .command(`consent-manager-cookies-delete`)
  .description(`Removes one cookie.`)
  .option(`--id <id>`, `The cookie.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          consentManagerCookiesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`consent-manager-registry consent-manager-cookies-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/cookies/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerCookiesDeleteSpecs, { method: "delete", destructive: true });
const consentManagerCookiesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The cookie.", type: "string", required: true, resource: { listPath: "/consent-manager/cookies", hasLimit: true } },
];
consentManagerRegistry
  .command(`consent-manager-cookies-get`)
  .description(`One cookie by id.`)
  .option(`--id <id>`, `The cookie.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          consentManagerCookiesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/cookies/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerCookiesGetSpecs, { method: "get" });
const consentManagerCookiesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The cookie.", type: "string", required: true, resource: { listPath: "/consent-manager/cookies", hasLimit: true } },
  { key: "description", option: "--description <description>", name: "description", description: "What the cookie is for, as the banner shows it.", type: "object", required: false },
  { key: "duration", option: "--duration <duration>", name: "duration", description: "How long it lives, as the banner shows it. A text per language tag, e.g. { \"de\": \"…\", \"en\": \"…\" }.", type: "object", required: false },
  { key: "host", option: "--host <host>", name: "host", description: "Who sets it: 'first-party' for the shop's own domain, otherwise the third-party host.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Where on the device it is stored: cookie, local_storage, session_storage, indexeddb or pixel.", type: "string", required: false, enum: ["cookie","local_storage","session_storage","indexeddb","pixel"] },
  { key: "name", option: "--name <name>", name: "name", description: "The cookie or storage key as the browser shows it.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.", type: "integer", required: false },
  { key: "vendorId", option: "--vendor-id <vendor-id>", name: "vendor_id", description: "The vendor that sets this cookie. It has to be a vendor this tenant keeps.", type: "string", required: false },
];
consentManagerRegistry
  .command(`consent-manager-cookies-update`)
  .description(`Partial update of one cookie.`)
  .option(`--id <id>`, `The cookie.`)
  .option(`--description <description>`, `What the cookie is for, as the banner shows it.`)
  .option(`--duration <duration>`, `How long it lives, as the banner shows it. A text per language tag, e.g. { "de": "…", "en": "…" }.`)
  .option(`--host <host>`, `Who sets it: 'first-party' for the shop's own domain, otherwise the third-party host.`)
  .option(`--kind <kind>`, `Where on the device it is stored: cookie, local_storage, session_storage, indexeddb or pixel.`)
  .option(`--name <name>`, `The cookie or storage key as the browser shows it.`)
  .option(`--position <position>`, `Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.`, parseInteger)
  .option(`--vendor-id <vendor-id>`, `The vendor that sets this cookie. It has to be a vendor this tenant keeps.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, duration, host, kind, name, position, vendorId } = await promptForMissing(
          _options,
          consentManagerCookiesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/cookies/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (description !== undefined) {
          _payload[`description`] = resolveBodyParam(description);
        }
        if (duration !== undefined) {
          _payload[`duration`] = resolveBodyParam(duration);
        }
        if (host !== undefined) {
          _payload[`host`] = host;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (vendorId !== undefined) {
          _payload[`vendor_id`] = vendorId;
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerCookiesUpdateSpecs, { method: "put" });
const consentManagerDefaultsRunSpecs: PromptSpec[] = [
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
consentManagerRegistry
  .command(`consent-manager-defaults-run`)
  .description(`Creates the five standard purposes (necessary, statistics, marketing, comfort, external_media), the shop's banner draft with a German and an English text, and exactly one vendor — \`revenexx\`, the shop's own necessary cookies — whatever of that is missing, and nothing else. The catalogue is a library: every other vendor, necessary ones included, appears only once the tenant adopts it. Idempotent by code: a purpose or draft the merchant changed is left exactly as it is. The install announcement runs the same seeding, but it is not reliably delivered, so a live check calls this first.`)
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
          consentManagerDefaultsRunSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/defaults`;
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerDefaultsRunSpecs, { method: "post" });
const consentManagerPurposesListSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Filter to rows whose `id` is exactly this value. The row's own id, generated by the database. A caller never sends one; it reads one back and puts it in the path of later calls.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Filter to rows whose `code` is exactly this value. The purpose's fixed identity — `necessary`, `statistics`, `marketing`, `comfort`, `external_media` or one the tenant adds. Vendors, the catalogue, the Tag Manager, the visitor's cookie and every record name it, so it never changes once created.", type: "string", required: false },
  { key: "legalBasis", option: "--legal-basis <legal-basis>", name: "legal_basis", description: "Filter to rows whose `legal_basis` is exactly this value. Why this purpose may process data at all, and therefore whether its tools load before a decision: `consent` waits for the visitor, `legitimate_interest` runs until the visitor objects, `necessary` always runs. A vendor may override it with its own `legal_basis_override`.", type: "string", required: false, enum: ["consent","legitimate_interest","necessary"] },
  { key: "position", option: "--position <position>", name: "position", description: "Filter to rows whose `position` is exactly this value. Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.", type: "integer", required: false },
  { key: "isActive", option: "--is-active <is-active>", name: "is_active", description: "Filter to rows whose `is_active` is exactly this value. Whether this row takes part in the next published version. Switching it off keeps the row and leaves it out of every version published afterwards; versions already published are untouched.", type: "boolean", required: false },
  { key: "isSystem", option: "--is-system <is-system>", name: "is_system", description: "Filter to rows whose `is_system` is exactly this value. True for the five purposes this app seeds. It records who put the row there and licenses nothing: a seeded purpose may be reworded like any other.", type: "boolean", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Filter to rows whose `created_at` is exactly this value. When the row was created. Server-set.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Filter to rows whose `updated_at` is exactly this value. When the row was last written. Server-set — every route that changes the row stamps it.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column', 'column.asc' or 'column.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
consentManagerRegistry
  .command(`consent-manager-purposes-list`)
  .description(`Every purpose of this tenant (and market), with the legal basis that decides whether its tools load before a decision.`)
  .option(`--id <id>`, `Filter to rows whose \`id\` is exactly this value. The row's own id, generated by the database. A caller never sends one; it reads one back and puts it in the path of later calls.`)
  .option(`--code <code>`, `Filter to rows whose \`code\` is exactly this value. The purpose's fixed identity — \`necessary\`, \`statistics\`, \`marketing\`, \`comfort\`, \`external_media\` or one the tenant adds. Vendors, the catalogue, the Tag Manager, the visitor's cookie and every record name it, so it never changes once created.`)
  .option(`--legal-basis <legal-basis>`, `Filter to rows whose \`legal_basis\` is exactly this value. Why this purpose may process data at all, and therefore whether its tools load before a decision: \`consent\` waits for the visitor, \`legitimate_interest\` runs until the visitor objects, \`necessary\` always runs. A vendor may override it with its own \`legal_basis_override\`.`)
  .option(`--position <position>`, `Filter to rows whose \`position\` is exactly this value. Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.`, parseInteger)
  .option(
    `--is-active [value]`,
    `Filter to rows whose \`is_active\` is exactly this value. Whether this row takes part in the next published version. Switching it off keeps the row and leaves it out of every version published afterwards; versions already published are untouched.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--is-system [value]`,
    `Filter to rows whose \`is_system\` is exactly this value. True for the five purposes this app seeds. It records who put the row there and licenses nothing: a seeded purpose may be reworded like any other.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--created-at <created-at>`, `Filter to rows whose \`created_at\` is exactly this value. When the row was created. Server-set.`)
  .option(`--updated-at <updated-at>`, `Filter to rows whose \`updated_at\` is exactly this value. When the row was last written. Server-set — every route that changes the row stamps it.`)
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
        const { id, code, legalBasis, position, isActive, isSystem, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          consentManagerPurposesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/purposes`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (legalBasis !== undefined) {
          _payload[`legal_basis`] = legalBasis;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (isActive !== undefined) {
          _payload[`is_active`] = isActive;
        }
        if (isSystem !== undefined) {
          _payload[`is_system`] = isSystem;
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerPurposesListSpecs, { method: "get" });
const consentManagerPurposesCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "The purpose's fixed identity — `necessary`, `statistics`, `marketing`, `comfort`, `external_media` or one the tenant adds. Vendors, the catalogue, the Tag Manager, the visitor's cookie and every record name it, so it never changes once created.", type: "string", required: true },
  { key: "legalBasis", option: "--legal-basis <legal-basis>", name: "legal_basis", description: "Why this purpose may process data at all, and therefore whether its tools load before a decision: `consent` waits for the visitor, `legitimate_interest` runs until the visitor objects, `necessary` always runs. A vendor may override it with its own `legal_basis_override`.", type: "string", required: true, enum: ["consent","legitimate_interest","necessary"] },
  { key: "name", option: "--name <name>", name: "name", description: "What a visitor reads for this purpose. A text per language tag, e.g. { \"de\": \"…\", \"en\": \"…\" }.", type: "object", required: true },
  { key: "description", option: "--description <description>", name: "description", description: "The sentence under the purpose in the banner's second layer. A text per language tag, e.g. { \"de\": \"…\", \"en\": \"…\" }.", type: "object", required: false },
  { key: "googleSignals", option: "--google-signals [google-signals...]", name: "google_signals", description: "The Google Consent Mode v2 signals this purpose releases when granted — e.g. statistics releases `analytics_storage`. A list drawn from the google-signals vocabulary.", type: "array", required: false, enum: ["ad_storage","ad_user_data","ad_personalization","analytics_storage","functionality_storage","personalization_storage","security_storage"] },
  { key: "isActive", option: "--is-active <is-active>", name: "is_active", description: "Whether this row takes part in the next published version. Switching it off keeps the row and leaves it out of every version published afterwards; versions already published are untouched.", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.", type: "integer", required: false },
];
consentManagerRegistry
  .command(`consent-manager-purposes-create`)
  .description(`Add a purpose beyond the five seeded ones. \`code\`, \`name\` and \`legal_basis\` are owed; the code is fixed once created.`)
  .option(`--code <code>`, `The purpose's fixed identity — \`necessary\`, \`statistics\`, \`marketing\`, \`comfort\`, \`external_media\` or one the tenant adds. Vendors, the catalogue, the Tag Manager, the visitor's cookie and every record name it, so it never changes once created.`)
  .option(`--legal-basis <legal-basis>`, `Why this purpose may process data at all, and therefore whether its tools load before a decision: \`consent\` waits for the visitor, \`legitimate_interest\` runs until the visitor objects, \`necessary\` always runs. A vendor may override it with its own \`legal_basis_override\`.`)
  .option(`--name <name>`, `What a visitor reads for this purpose. A text per language tag, e.g. { "de": "…", "en": "…" }.`)
  .option(`--description <description>`, `The sentence under the purpose in the banner's second layer. A text per language tag, e.g. { "de": "…", "en": "…" }.`)
  .option(`--google-signals [google-signals...]`, `The Google Consent Mode v2 signals this purpose releases when granted — e.g. statistics releases \`analytics_storage\`. A list drawn from the google-signals vocabulary.`)
  .option(
    `--is-active [value]`,
    `Whether this row takes part in the next published version. Switching it off keeps the row and leaves it out of every version published afterwards; versions already published are untouched.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, legalBasis, name, description, googleSignals, isActive, position } = await promptForMissing(
          _options,
          consentManagerPurposesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/purposes`;
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
          _payload[`description`] = resolveBodyParam(description);
        }
        if (googleSignals !== undefined) {
          _payload[`google_signals`] = googleSignals;
        }
        if (isActive !== undefined) {
          _payload[`is_active`] = isActive;
        }
        if (legalBasis !== undefined) {
          _payload[`legal_basis`] = legalBasis;
        }
        if (name !== undefined) {
          _payload[`name`] = resolveBodyParam(name);
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerPurposesCreateSpecs, { method: "post" });
const consentManagerPurposesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The purpose.", type: "string", required: true, resource: { listPath: "/consent-manager/purposes", hasLimit: true } },
];
consentManagerRegistry
  .command(`consent-manager-purposes-delete`)
  .description(`Removes a purpose. Refused while any vendor serves it — switch it inactive instead, which leaves it out of the next version.`)
  .option(`--id <id>`, `The purpose.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          consentManagerPurposesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`consent-manager-registry consent-manager-purposes-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/purposes/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerPurposesDeleteSpecs, { method: "delete", destructive: true });
const consentManagerPurposesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The purpose.", type: "string", required: true, resource: { listPath: "/consent-manager/purposes", hasLimit: true } },
];
consentManagerRegistry
  .command(`consent-manager-purposes-get`)
  .description(`One purpose by id.`)
  .option(`--id <id>`, `The purpose.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          consentManagerPurposesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/purposes/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerPurposesGetSpecs, { method: "get" });
const consentManagerPurposesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The purpose.", type: "string", required: true, resource: { listPath: "/consent-manager/purposes", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "The purpose's fixed identity — `necessary`, `statistics`, `marketing`, `comfort`, `external_media` or one the tenant adds. Vendors, the catalogue, the Tag Manager, the visitor's cookie and every record name it, so it never changes once created.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "The sentence under the purpose in the banner's second layer. A text per language tag, e.g. { \"de\": \"…\", \"en\": \"…\" }.", type: "object", required: false },
  { key: "googleSignals", option: "--google-signals [google-signals...]", name: "google_signals", description: "The Google Consent Mode v2 signals this purpose releases when granted — e.g. statistics releases `analytics_storage`. A list drawn from the google-signals vocabulary.", type: "array", required: false, enum: ["ad_storage","ad_user_data","ad_personalization","analytics_storage","functionality_storage","personalization_storage","security_storage"] },
  { key: "isActive", option: "--is-active <is-active>", name: "is_active", description: "Whether this row takes part in the next published version. Switching it off keeps the row and leaves it out of every version published afterwards; versions already published are untouched.", type: "boolean", required: false },
  { key: "legalBasis", option: "--legal-basis <legal-basis>", name: "legal_basis", description: "Why this purpose may process data at all, and therefore whether its tools load before a decision: `consent` waits for the visitor, `legitimate_interest` runs until the visitor objects, `necessary` always runs. A vendor may override it with its own `legal_basis_override`.", type: "string", required: false, enum: ["consent","legitimate_interest","necessary"] },
  { key: "name", option: "--name <name>", name: "name", description: "What a visitor reads for this purpose. A text per language tag, e.g. { \"de\": \"…\", \"en\": \"…\" }.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.", type: "integer", required: false },
];
consentManagerRegistry
  .command(`consent-manager-purposes-update`)
  .description(`Partial update. The code may be sent only unchanged — vendors, records and the catalogue name it. Changing the legal basis affects versions published afterwards; every record keeps the basis it was made under.`)
  .option(`--id <id>`, `The purpose.`)
  .option(`--code <code>`, `The purpose's fixed identity — \`necessary\`, \`statistics\`, \`marketing\`, \`comfort\`, \`external_media\` or one the tenant adds. Vendors, the catalogue, the Tag Manager, the visitor's cookie and every record name it, so it never changes once created.`)
  .option(`--description <description>`, `The sentence under the purpose in the banner's second layer. A text per language tag, e.g. { "de": "…", "en": "…" }.`)
  .option(`--google-signals [google-signals...]`, `The Google Consent Mode v2 signals this purpose releases when granted — e.g. statistics releases \`analytics_storage\`. A list drawn from the google-signals vocabulary.`)
  .option(
    `--is-active [value]`,
    `Whether this row takes part in the next published version. Switching it off keeps the row and leaves it out of every version published afterwards; versions already published are untouched.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--legal-basis <legal-basis>`, `Why this purpose may process data at all, and therefore whether its tools load before a decision: \`consent\` waits for the visitor, \`legitimate_interest\` runs until the visitor objects, \`necessary\` always runs. A vendor may override it with its own \`legal_basis_override\`.`)
  .option(`--name <name>`, `What a visitor reads for this purpose. A text per language tag, e.g. { "de": "…", "en": "…" }.`)
  .option(`--position <position>`, `Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, description, googleSignals, isActive, legalBasis, name, position } = await promptForMissing(
          _options,
          consentManagerPurposesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/purposes/{id}`.replace(`{id}`, id);
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
          _payload[`description`] = resolveBodyParam(description);
        }
        if (googleSignals !== undefined) {
          _payload[`google_signals`] = googleSignals;
        }
        if (isActive !== undefined) {
          _payload[`is_active`] = isActive;
        }
        if (legalBasis !== undefined) {
          _payload[`legal_basis`] = legalBasis;
        }
        if (name !== undefined) {
          _payload[`name`] = resolveBodyParam(name);
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerPurposesUpdateSpecs, { method: "put" });
const consentManagerVendorsListSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Filter to rows whose `id` is exactly this value. The row's own id, generated by the database. A caller never sends one; it reads one back and puts it in the path of later calls.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Filter to rows whose `code` is exactly this value. The vendor's fixed identity, as the Tag Manager, the visitor's cookie and every record name it. Lowercase letters, digits and '-'. For an adopted vendor it is the catalogue key.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Filter to rows whose `name` is exactly this value. The tool as a visitor knows it.", type: "string", required: false },
  { key: "category", option: "--category <category>", name: "category", description: "Filter to rows whose `category` is exactly this value. What kind of tool this is — analytics, advertising, chat, video — as the catalogue groups it. Presentation only.", type: "string", required: false },
  { key: "company", option: "--company <company>", name: "company", description: "Filter to rows whose `company` is exactly this value. The legal entity behind the tool, as the banner names it.", type: "string", required: false },
  { key: "address", option: "--address <address>", name: "address", description: "Filter to rows whose `address` is exactly this value. The company's postal address, as the banner names it.", type: "string", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "Filter to rows whose `country` is exactly this value. The company's country, ISO 3166-1 alpha-2.", type: "string", required: false },
  { key: "privacyPolicyUrl", option: "--privacy-policy-url <privacy-policy-url>", name: "privacy_policy_url", description: "Filter to rows whose `privacy_policy_url` is exactly this value. The vendor's own privacy policy, linked from the banner.", type: "string", required: false },
  { key: "dpaUrl", option: "--dpa-url <dpa-url>", name: "dpa_url", description: "Filter to rows whose `dpa_url` is exactly this value. Where the vendor's data processing terms are published, if anywhere.", type: "string", required: false },
  { key: "thirdCountryTransfer", option: "--third-country-transfer <third-country-transfer>", name: "third_country_transfer", description: "Filter to rows whose `third_country_transfer` is exactly this value. Whether data reaches a country outside the EU/EEA. The banner says so, because a visitor is owed it before agreeing.", type: "boolean", required: false },
  { key: "transferBasis", option: "--transfer-basis <transfer-basis>", name: "transfer_basis", description: "Filter to rows whose `transfer_basis` is exactly this value. What a third-country transfer rests on, in the words the banner shows.", type: "string", required: false },
  { key: "registryKey", option: "--registry-key <registry-key>", name: "registry_key", description: "Filter to rows whose `registry_key` is exactly this value. The `@nuxt/scripts` registry entry the storefront loads this tool through, where one exists.", type: "string", required: false },
  { key: "logo", option: "--logo <logo>", name: "logo", description: "Filter to rows whose `logo` is exactly this value. The vendor's logo for the admin UI, as a base64 data URI of an SVG, PNG, JPEG or WebP image, at most 20480 characters. Adoption copies the catalogue's logo. Null shows the vendor's initials. It is never part of the delivered policy.", type: "string", required: false },
  { key: "legalBasisOverride", option: "--legal-basis-override <legal-basis-override>", name: "legal_basis_override", description: "Filter to rows whose `legal_basis_override` is exactly this value. This vendor's own legal basis where it differs from its purpose's — a cookieless statistics tool on `legitimate_interest` while the rest of statistics waits for `consent`. Null means the purpose's basis applies. The effective basis is this ?? the purpose's.", type: "string", required: false, enum: ["consent","legitimate_interest","necessary"] },
  { key: "catalogKey", option: "--catalog-key <catalog-key>", name: "catalog_key", description: "Filter to rows whose `catalog_key` is exactly this value. The catalogue entry this vendor was adopted from; null for a vendor the tenant described themselves. It is provenance — nothing re-reads the catalogue through it.", type: "string", required: false },
  { key: "catalogVersion", option: "--catalog-version <catalog-version>", name: "catalog_version", description: "Filter to rows whose `catalog_version` is exactly this value. The catalogue version the adopted copy was taken from. A read flags the vendor when the shipped catalogue is newer, and nothing changes until the merchant refreshes it.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Filter to rows whose `position` is exactly this value. Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.", type: "integer", required: false },
  { key: "isActive", option: "--is-active <is-active>", name: "is_active", description: "Filter to rows whose `is_active` is exactly this value. Whether this row takes part in the next published version. Switching it off keeps the row and leaves it out of every version published afterwards; versions already published are untouched.", type: "boolean", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Filter to rows whose `created_at` is exactly this value. When the row was created. Server-set.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Filter to rows whose `updated_at` is exactly this value. When the row was last written. Server-set — every route that changes the row stamps it.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column', 'column.asc' or 'column.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
consentManagerRegistry
  .command(`consent-manager-vendors-list`)
  .description(`Every vendor of this tenant (and market). An adopted vendor whose catalogue entry is newer carries \`catalog_update\`; its fields are untouched until the merchant refreshes it.`)
  .option(`--id <id>`, `Filter to rows whose \`id\` is exactly this value. The row's own id, generated by the database. A caller never sends one; it reads one back and puts it in the path of later calls.`)
  .option(`--code <code>`, `Filter to rows whose \`code\` is exactly this value. The vendor's fixed identity, as the Tag Manager, the visitor's cookie and every record name it. Lowercase letters, digits and '-'. For an adopted vendor it is the catalogue key.`)
  .option(`--name <name>`, `Filter to rows whose \`name\` is exactly this value. The tool as a visitor knows it.`)
  .option(`--category <category>`, `Filter to rows whose \`category\` is exactly this value. What kind of tool this is — analytics, advertising, chat, video — as the catalogue groups it. Presentation only.`)
  .option(`--company <company>`, `Filter to rows whose \`company\` is exactly this value. The legal entity behind the tool, as the banner names it.`)
  .option(`--address <address>`, `Filter to rows whose \`address\` is exactly this value. The company's postal address, as the banner names it.`)
  .option(`--country <country>`, `Filter to rows whose \`country\` is exactly this value. The company's country, ISO 3166-1 alpha-2.`)
  .option(`--privacy-policy-url <privacy-policy-url>`, `Filter to rows whose \`privacy_policy_url\` is exactly this value. The vendor's own privacy policy, linked from the banner.`)
  .option(`--dpa-url <dpa-url>`, `Filter to rows whose \`dpa_url\` is exactly this value. Where the vendor's data processing terms are published, if anywhere.`)
  .option(
    `--third-country-transfer [value]`,
    `Filter to rows whose \`third_country_transfer\` is exactly this value. Whether data reaches a country outside the EU/EEA. The banner says so, because a visitor is owed it before agreeing.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--transfer-basis <transfer-basis>`, `Filter to rows whose \`transfer_basis\` is exactly this value. What a third-country transfer rests on, in the words the banner shows.`)
  .option(`--registry-key <registry-key>`, `Filter to rows whose \`registry_key\` is exactly this value. The \`@nuxt/scripts\` registry entry the storefront loads this tool through, where one exists.`)
  .option(`--logo <logo>`, `Filter to rows whose \`logo\` is exactly this value. The vendor's logo for the admin UI, as a base64 data URI of an SVG, PNG, JPEG or WebP image, at most 20480 characters. Adoption copies the catalogue's logo. Null shows the vendor's initials. It is never part of the delivered policy.`)
  .option(`--legal-basis-override <legal-basis-override>`, `Filter to rows whose \`legal_basis_override\` is exactly this value. This vendor's own legal basis where it differs from its purpose's — a cookieless statistics tool on \`legitimate_interest\` while the rest of statistics waits for \`consent\`. Null means the purpose's basis applies. The effective basis is this ?? the purpose's.`)
  .option(`--catalog-key <catalog-key>`, `Filter to rows whose \`catalog_key\` is exactly this value. The catalogue entry this vendor was adopted from; null for a vendor the tenant described themselves. It is provenance — nothing re-reads the catalogue through it.`)
  .option(`--catalog-version <catalog-version>`, `Filter to rows whose \`catalog_version\` is exactly this value. The catalogue version the adopted copy was taken from. A read flags the vendor when the shipped catalogue is newer, and nothing changes until the merchant refreshes it.`)
  .option(`--position <position>`, `Filter to rows whose \`position\` is exactly this value. Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.`, parseInteger)
  .option(
    `--is-active [value]`,
    `Filter to rows whose \`is_active\` is exactly this value. Whether this row takes part in the next published version. Switching it off keeps the row and leaves it out of every version published afterwards; versions already published are untouched.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--created-at <created-at>`, `Filter to rows whose \`created_at\` is exactly this value. When the row was created. Server-set.`)
  .option(`--updated-at <updated-at>`, `Filter to rows whose \`updated_at\` is exactly this value. When the row was last written. Server-set — every route that changes the row stamps it.`)
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
        const { id, code, name, category, company, address, country, privacyPolicyUrl, dpaUrl, thirdCountryTransfer, transferBasis, registryKey, logo, legalBasisOverride, catalogKey, catalogVersion, position, isActive, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          consentManagerVendorsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/vendors`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (category !== undefined) {
          _payload[`category`] = category;
        }
        if (company !== undefined) {
          _payload[`company`] = company;
        }
        if (address !== undefined) {
          _payload[`address`] = address;
        }
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (privacyPolicyUrl !== undefined) {
          _payload[`privacy_policy_url`] = privacyPolicyUrl;
        }
        if (dpaUrl !== undefined) {
          _payload[`dpa_url`] = dpaUrl;
        }
        if (thirdCountryTransfer !== undefined) {
          _payload[`third_country_transfer`] = thirdCountryTransfer;
        }
        if (transferBasis !== undefined) {
          _payload[`transfer_basis`] = transferBasis;
        }
        if (registryKey !== undefined) {
          _payload[`registry_key`] = registryKey;
        }
        if (logo !== undefined) {
          _payload[`logo`] = logo;
        }
        if (legalBasisOverride !== undefined) {
          _payload[`legal_basis_override`] = legalBasisOverride;
        }
        if (catalogKey !== undefined) {
          _payload[`catalog_key`] = catalogKey;
        }
        if (catalogVersion !== undefined) {
          _payload[`catalog_version`] = catalogVersion;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (isActive !== undefined) {
          _payload[`is_active`] = isActive;
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerVendorsListSpecs, { method: "get" });
const consentManagerVendorsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "The vendor's fixed identity, as the Tag Manager, the visitor's cookie and every record name it. Lowercase letters, digits and '-'. For an adopted vendor it is the catalogue key.", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "The tool as a visitor knows it.", type: "string", required: true },
  { key: "address", option: "--address <address>", name: "address", description: "The company's postal address, as the banner names it.", type: "string", required: false },
  { key: "category", option: "--category <category>", name: "category", description: "What kind of tool this is — analytics, advertising, chat, video — as the catalogue groups it. Presentation only.", type: "string", required: false },
  { key: "chains", option: "--chains [chains...]", name: "chains", description: "Other vendors this one loads in turn — Google Tag Manager loading Google Analytics — by vendor code, so the banner can name every link of the chain.", type: "array", required: false },
  { key: "company", option: "--company <company>", name: "company", description: "The legal entity behind the tool, as the banner names it.", type: "string", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "The company's country, ISO 3166-1 alpha-2.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "What the tool does, in the banner's second layer. A text per language tag, e.g. { \"de\": \"…\", \"en\": \"…\" }.", type: "object", required: false },
  { key: "dpaUrl", option: "--dpa-url <dpa-url>", name: "dpa_url", description: "Where the vendor's data processing terms are published, if anywhere.", type: "string", required: false },
  { key: "hosts", option: "--hosts [hosts...]", name: "hosts", description: "The hosts the tool contacts. A storefront blocks requests to them until the vendor is allowed; the Tag Manager checks its tags against them.", type: "array", required: false },
  { key: "isActive", option: "--is-active <is-active>", name: "is_active", description: "Whether this row takes part in the next published version. Switching it off keeps the row and leaves it out of every version published afterwards; versions already published are untouched.", type: "boolean", required: false },
  { key: "legalBasisOverride", option: "--legal-basis-override <legal-basis-override>", name: "legal_basis_override", description: "This vendor's own legal basis where it differs from its purpose's — a cookieless statistics tool on `legitimate_interest` while the rest of statistics waits for `consent`. Null means the purpose's basis applies. The effective basis is this ?? the purpose's.", type: "string", required: false, enum: ["consent","legitimate_interest","necessary"] },
  { key: "logo", option: "--logo <logo>", name: "logo", description: "The vendor's logo for the admin UI, as a base64 data URI of an SVG, PNG, JPEG or WebP image, at most 20480 characters. Adoption copies the catalogue's logo. Null shows the vendor's initials. It is never part of the delivered policy. Anything else is refused with 422 `invalid_logo`; an empty string clears it.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.", type: "integer", required: false },
  { key: "privacyPolicyUrl", option: "--privacy-policy-url <privacy-policy-url>", name: "privacy_policy_url", description: "The vendor's own privacy policy, linked from the banner.", type: "string", required: false },
  { key: "purposes", option: "--purposes [purposes...]", name: "purposes", description: "The codes of the purposes this vendor serves. On an update, the list replaces the current one; a code this tenant does not keep is refused with 422.", type: "array", required: false },
  { key: "registryKey", option: "--registry-key <registry-key>", name: "registry_key", description: "The `@nuxt/scripts` registry entry the storefront loads this tool through, where one exists.", type: "string", required: false },
  { key: "retentionNote", option: "--retention-note <retention-note>", name: "retention_note", description: "How long the vendor keeps the data, as the banner states it. A text per language tag, e.g. { \"de\": \"…\", \"en\": \"…\" }.", type: "object", required: false },
  { key: "thirdCountryTransfer", option: "--third-country-transfer <third-country-transfer>", name: "third_country_transfer", description: "Whether data reaches a country outside the EU/EEA. The banner says so, because a visitor is owed it before agreeing.", type: "boolean", required: false },
  { key: "transferBasis", option: "--transfer-basis <transfer-basis>", name: "transfer_basis", description: "What a third-country transfer rests on, in the words the banner shows.", type: "string", required: false },
];
consentManagerRegistry
  .command(`consent-manager-vendors-create`)
  .description(`Declare a vendor the catalogue does not carry. \`code\` and \`name\` are owed; \`purposes\` names the purpose codes it serves — a vendor with none cannot be published.`)
  .option(`--code <code>`, `The vendor's fixed identity, as the Tag Manager, the visitor's cookie and every record name it. Lowercase letters, digits and '-'. For an adopted vendor it is the catalogue key.`)
  .option(`--name <name>`, `The tool as a visitor knows it.`)
  .option(`--address <address>`, `The company's postal address, as the banner names it.`)
  .option(`--category <category>`, `What kind of tool this is — analytics, advertising, chat, video — as the catalogue groups it. Presentation only.`)
  .option(`--chains [chains...]`, `Other vendors this one loads in turn — Google Tag Manager loading Google Analytics — by vendor code, so the banner can name every link of the chain.`)
  .option(`--company <company>`, `The legal entity behind the tool, as the banner names it.`)
  .option(`--country <country>`, `The company's country, ISO 3166-1 alpha-2.`)
  .option(`--description <description>`, `What the tool does, in the banner's second layer. A text per language tag, e.g. { "de": "…", "en": "…" }.`)
  .option(`--dpa-url <dpa-url>`, `Where the vendor's data processing terms are published, if anywhere.`)
  .option(`--hosts [hosts...]`, `The hosts the tool contacts. A storefront blocks requests to them until the vendor is allowed; the Tag Manager checks its tags against them.`)
  .option(
    `--is-active [value]`,
    `Whether this row takes part in the next published version. Switching it off keeps the row and leaves it out of every version published afterwards; versions already published are untouched.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--legal-basis-override <legal-basis-override>`, `This vendor's own legal basis where it differs from its purpose's — a cookieless statistics tool on \`legitimate_interest\` while the rest of statistics waits for \`consent\`. Null means the purpose's basis applies. The effective basis is this ?? the purpose's.`)
  .option(`--logo <logo>`, `The vendor's logo for the admin UI, as a base64 data URI of an SVG, PNG, JPEG or WebP image, at most 20480 characters. Adoption copies the catalogue's logo. Null shows the vendor's initials. It is never part of the delivered policy. Anything else is refused with 422 \`invalid_logo\`; an empty string clears it.`)
  .option(`--position <position>`, `Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.`, parseInteger)
  .option(`--privacy-policy-url <privacy-policy-url>`, `The vendor's own privacy policy, linked from the banner.`)
  .option(`--purposes [purposes...]`, `The codes of the purposes this vendor serves. On an update, the list replaces the current one; a code this tenant does not keep is refused with 422.`)
  .option(`--registry-key <registry-key>`, `The \`@nuxt/scripts\` registry entry the storefront loads this tool through, where one exists.`)
  .option(`--retention-note <retention-note>`, `How long the vendor keeps the data, as the banner states it. A text per language tag, e.g. { "de": "…", "en": "…" }.`)
  .option(
    `--third-country-transfer [value]`,
    `Whether data reaches a country outside the EU/EEA. The banner says so, because a visitor is owed it before agreeing.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--transfer-basis <transfer-basis>`, `What a third-country transfer rests on, in the words the banner shows.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, address, category, chains, company, country, description, dpaUrl, hosts, isActive, legalBasisOverride, logo, position, privacyPolicyUrl, purposes, registryKey, retentionNote, thirdCountryTransfer, transferBasis } = await promptForMissing(
          _options,
          consentManagerVendorsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/vendors`;
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
        if (category !== undefined) {
          _payload[`category`] = category;
        }
        if (chains !== undefined) {
          _payload[`chains`] = chains;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (company !== undefined) {
          _payload[`company`] = company;
        }
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (description !== undefined) {
          _payload[`description`] = resolveBodyParam(description);
        }
        if (dpaUrl !== undefined) {
          _payload[`dpa_url`] = dpaUrl;
        }
        if (hosts !== undefined) {
          _payload[`hosts`] = hosts;
        }
        if (isActive !== undefined) {
          _payload[`is_active`] = isActive;
        }
        if (legalBasisOverride !== undefined) {
          _payload[`legal_basis_override`] = legalBasisOverride;
        }
        if (logo !== undefined) {
          _payload[`logo`] = logo;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (privacyPolicyUrl !== undefined) {
          _payload[`privacy_policy_url`] = privacyPolicyUrl;
        }
        if (purposes !== undefined) {
          _payload[`purposes`] = purposes;
        }
        if (registryKey !== undefined) {
          _payload[`registry_key`] = registryKey;
        }
        if (retentionNote !== undefined) {
          _payload[`retention_note`] = resolveBodyParam(retentionNote);
        }
        if (thirdCountryTransfer !== undefined) {
          _payload[`third_country_transfer`] = thirdCountryTransfer;
        }
        if (transferBasis !== undefined) {
          _payload[`transfer_basis`] = transferBasis;
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerVendorsCreateSpecs, { method: "post" });
const consentManagerVendorsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The vendor.", type: "string", required: true, resource: { listPath: "/consent-manager/vendors", hasLimit: true } },
];
consentManagerRegistry
  .command(`consent-manager-vendors-delete`)
  .description(`Removes the vendor, its cookies and its purpose links. Published versions keep naming it — they are frozen.`)
  .option(`--id <id>`, `The vendor.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          consentManagerVendorsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`consent-manager-registry consent-manager-vendors-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/vendors/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerVendorsDeleteSpecs, { method: "delete", destructive: true });
const consentManagerVendorsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The vendor.", type: "string", required: true, resource: { listPath: "/consent-manager/vendors", hasLimit: true } },
];
consentManagerRegistry
  .command(`consent-manager-vendors-get`)
  .description(`One vendor, with the codes of the purposes it serves, its cookies and any newer catalogue entry.`)
  .option(`--id <id>`, `The vendor.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          consentManagerVendorsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/vendors/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerVendorsGetSpecs, { method: "get" });
const consentManagerVendorsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The vendor.", type: "string", required: true, resource: { listPath: "/consent-manager/vendors", hasLimit: true } },
  { key: "address", option: "--address <address>", name: "address", description: "The company's postal address, as the banner names it.", type: "string", required: false },
  { key: "category", option: "--category <category>", name: "category", description: "What kind of tool this is — analytics, advertising, chat, video — as the catalogue groups it. Presentation only.", type: "string", required: false },
  { key: "chains", option: "--chains [chains...]", name: "chains", description: "Other vendors this one loads in turn — Google Tag Manager loading Google Analytics — by vendor code, so the banner can name every link of the chain.", type: "array", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "The vendor's fixed identity, as the Tag Manager, the visitor's cookie and every record name it. Lowercase letters, digits and '-'. For an adopted vendor it is the catalogue key.", type: "string", required: false },
  { key: "company", option: "--company <company>", name: "company", description: "The legal entity behind the tool, as the banner names it.", type: "string", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "The company's country, ISO 3166-1 alpha-2.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "What the tool does, in the banner's second layer. A text per language tag, e.g. { \"de\": \"…\", \"en\": \"…\" }.", type: "object", required: false },
  { key: "dpaUrl", option: "--dpa-url <dpa-url>", name: "dpa_url", description: "Where the vendor's data processing terms are published, if anywhere.", type: "string", required: false },
  { key: "hosts", option: "--hosts [hosts...]", name: "hosts", description: "The hosts the tool contacts. A storefront blocks requests to them until the vendor is allowed; the Tag Manager checks its tags against them.", type: "array", required: false },
  { key: "isActive", option: "--is-active <is-active>", name: "is_active", description: "Whether this row takes part in the next published version. Switching it off keeps the row and leaves it out of every version published afterwards; versions already published are untouched.", type: "boolean", required: false },
  { key: "legalBasisOverride", option: "--legal-basis-override <legal-basis-override>", name: "legal_basis_override", description: "This vendor's own legal basis where it differs from its purpose's — a cookieless statistics tool on `legitimate_interest` while the rest of statistics waits for `consent`. Null means the purpose's basis applies. The effective basis is this ?? the purpose's.", type: "string", required: false, enum: ["consent","legitimate_interest","necessary"] },
  { key: "logo", option: "--logo <logo>", name: "logo", description: "The vendor's logo for the admin UI, as a base64 data URI of an SVG, PNG, JPEG or WebP image, at most 20480 characters. Adoption copies the catalogue's logo. Null shows the vendor's initials. It is never part of the delivered policy. Anything else is refused with 422 `invalid_logo`; an empty string clears it.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "The tool as a visitor knows it.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.", type: "integer", required: false },
  { key: "privacyPolicyUrl", option: "--privacy-policy-url <privacy-policy-url>", name: "privacy_policy_url", description: "The vendor's own privacy policy, linked from the banner.", type: "string", required: false },
  { key: "purposes", option: "--purposes [purposes...]", name: "purposes", description: "The codes of the purposes this vendor serves. On an update, the list replaces the current one; a code this tenant does not keep is refused with 422.", type: "array", required: false },
  { key: "registryKey", option: "--registry-key <registry-key>", name: "registry_key", description: "The `@nuxt/scripts` registry entry the storefront loads this tool through, where one exists.", type: "string", required: false },
  { key: "retentionNote", option: "--retention-note <retention-note>", name: "retention_note", description: "How long the vendor keeps the data, as the banner states it. A text per language tag, e.g. { \"de\": \"…\", \"en\": \"…\" }.", type: "object", required: false },
  { key: "thirdCountryTransfer", option: "--third-country-transfer <third-country-transfer>", name: "third_country_transfer", description: "Whether data reaches a country outside the EU/EEA. The banner says so, because a visitor is owed it before agreeing.", type: "boolean", required: false },
  { key: "transferBasis", option: "--transfer-basis <transfer-basis>", name: "transfer_basis", description: "What a third-country transfer rests on, in the words the banner shows.", type: "string", required: false },
];
consentManagerRegistry
  .command(`consent-manager-vendors-update`)
  .description(`Partial update. \`purposes\`, when sent, replaces the vendor's purposes. The code may be sent only unchanged.`)
  .option(`--id <id>`, `The vendor.`)
  .option(`--address <address>`, `The company's postal address, as the banner names it.`)
  .option(`--category <category>`, `What kind of tool this is — analytics, advertising, chat, video — as the catalogue groups it. Presentation only.`)
  .option(`--chains [chains...]`, `Other vendors this one loads in turn — Google Tag Manager loading Google Analytics — by vendor code, so the banner can name every link of the chain.`)
  .option(`--code <code>`, `The vendor's fixed identity, as the Tag Manager, the visitor's cookie and every record name it. Lowercase letters, digits and '-'. For an adopted vendor it is the catalogue key.`)
  .option(`--company <company>`, `The legal entity behind the tool, as the banner names it.`)
  .option(`--country <country>`, `The company's country, ISO 3166-1 alpha-2.`)
  .option(`--description <description>`, `What the tool does, in the banner's second layer. A text per language tag, e.g. { "de": "…", "en": "…" }.`)
  .option(`--dpa-url <dpa-url>`, `Where the vendor's data processing terms are published, if anywhere.`)
  .option(`--hosts [hosts...]`, `The hosts the tool contacts. A storefront blocks requests to them until the vendor is allowed; the Tag Manager checks its tags against them.`)
  .option(
    `--is-active [value]`,
    `Whether this row takes part in the next published version. Switching it off keeps the row and leaves it out of every version published afterwards; versions already published are untouched.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--legal-basis-override <legal-basis-override>`, `This vendor's own legal basis where it differs from its purpose's — a cookieless statistics tool on \`legitimate_interest\` while the rest of statistics waits for \`consent\`. Null means the purpose's basis applies. The effective basis is this ?? the purpose's.`)
  .option(`--logo <logo>`, `The vendor's logo for the admin UI, as a base64 data URI of an SVG, PNG, JPEG or WebP image, at most 20480 characters. Adoption copies the catalogue's logo. Null shows the vendor's initials. It is never part of the delivered policy. Anything else is refused with 422 \`invalid_logo\`; an empty string clears it.`)
  .option(`--name <name>`, `The tool as a visitor knows it.`)
  .option(`--position <position>`, `Where this row sorts in the order a screen and the banner show them, ascending. Presentation only.`, parseInteger)
  .option(`--privacy-policy-url <privacy-policy-url>`, `The vendor's own privacy policy, linked from the banner.`)
  .option(`--purposes [purposes...]`, `The codes of the purposes this vendor serves. On an update, the list replaces the current one; a code this tenant does not keep is refused with 422.`)
  .option(`--registry-key <registry-key>`, `The \`@nuxt/scripts\` registry entry the storefront loads this tool through, where one exists.`)
  .option(`--retention-note <retention-note>`, `How long the vendor keeps the data, as the banner states it. A text per language tag, e.g. { "de": "…", "en": "…" }.`)
  .option(
    `--third-country-transfer [value]`,
    `Whether data reaches a country outside the EU/EEA. The banner says so, because a visitor is owed it before agreeing.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--transfer-basis <transfer-basis>`, `What a third-country transfer rests on, in the words the banner shows.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, address, category, chains, code, company, country, description, dpaUrl, hosts, isActive, legalBasisOverride, logo, name, position, privacyPolicyUrl, purposes, registryKey, retentionNote, thirdCountryTransfer, transferBasis } = await promptForMissing(
          _options,
          consentManagerVendorsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/vendors/{id}`.replace(`{id}`, id);
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
        if (category !== undefined) {
          _payload[`category`] = category;
        }
        if (chains !== undefined) {
          _payload[`chains`] = chains;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (company !== undefined) {
          _payload[`company`] = company;
        }
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (description !== undefined) {
          _payload[`description`] = resolveBodyParam(description);
        }
        if (dpaUrl !== undefined) {
          _payload[`dpa_url`] = dpaUrl;
        }
        if (hosts !== undefined) {
          _payload[`hosts`] = hosts;
        }
        if (isActive !== undefined) {
          _payload[`is_active`] = isActive;
        }
        if (legalBasisOverride !== undefined) {
          _payload[`legal_basis_override`] = legalBasisOverride;
        }
        if (logo !== undefined) {
          _payload[`logo`] = logo;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (privacyPolicyUrl !== undefined) {
          _payload[`privacy_policy_url`] = privacyPolicyUrl;
        }
        if (purposes !== undefined) {
          _payload[`purposes`] = purposes;
        }
        if (registryKey !== undefined) {
          _payload[`registry_key`] = registryKey;
        }
        if (retentionNote !== undefined) {
          _payload[`retention_note`] = resolveBodyParam(retentionNote);
        }
        if (thirdCountryTransfer !== undefined) {
          _payload[`third_country_transfer`] = thirdCountryTransfer;
        }
        if (transferBasis !== undefined) {
          _payload[`transfer_basis`] = transferBasis;
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerVendorsUpdateSpecs, { method: "put" });
const consentManagerVocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
consentManagerRegistry
  .command(`consent-manager-vocabularies-list`)
  .description(`The value sets this app publishes, without their values: legal-bases, cookie-kinds, record-actions, record-surfaces, banner-layouts, google-signals.`)
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
          consentManagerVocabulariesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/vocabularies`;
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerVocabulariesListSpecs, { method: "get" });
const consentManagerVocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "One of legal-bases, cookie-kinds, record-actions, record-surfaces, banner-layouts, google-signals.", type: "string", required: true, enum: ["legal-bases","cookie-kinds","record-actions","record-surfaces","banner-layouts","google-signals"], resource: { listPath: "/consent-manager/vocabularies", hasLimit: false } },
];
consentManagerRegistry
  .command(`consent-manager-vocabularies-get`)
  .description(`One value set with every value and its German and English label. The sets are closed: a value outside one is refused by the routes that take it.`)
  .option(`--name <name>`, `One of legal-bases, cookie-kinds, record-actions, record-surfaces, banner-layouts, google-signals.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name } = await promptForMissing(
          _options,
          consentManagerVocabulariesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(consentManagerRegistry.commands.at(-1)!, consentManagerVocabulariesGetSpecs, { method: "get" });
