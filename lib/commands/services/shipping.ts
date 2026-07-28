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

export const shipping = new Command("shipping")
  .description(
    commandDescriptions["shipping"] ??
      `Manage shipping resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const carriersListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
shipping
  .command(`carriers-list`)
  .description(`List the carriers this tenant ships with`)
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
          carriersListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/carriers`;
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
registerPromptSpecs(shipping.commands.at(-1)!, carriersListSpecs, { method: "get" });
const carriersCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Stable carrier code, unique per tenant (e.g. dhl, dpd, gls). A method whose `carrier` text equals this code resolves to this carrier — that is the migration path off the free-text field.", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "Display name.", type: "string", required: true },
  { key: "countries", option: "--countries [countries...]", name: "countries", description: "ISO 3166-1 alpha-2 codes this carrier serves; null or empty = everywhere. ANDed with the method's own restriction.", type: "array", required: false },
  { key: "cutoffTime", option: "--cutoff-time <cutoff-time>", name: "cutoff_time", description: "This carrier's own daily pickup cut-off (HH:MM, UTC). Overrides the tenant's cutoff_time for methods on this carrier — one shop-wide time cannot be both DHL's 16:00 and a forwarder's 12:00.", type: "string", required: false },
  { key: "etaDaysMax", option: "--eta-days-max <eta-days-max>", name: "eta_days_max", description: "Transit time upper bound.", type: "integer", required: false },
  { key: "etaDaysMin", option: "--eta-days-min <eta-days-min>", name: "eta_days_min", description: "Transit time lower bound — used by any method on this carrier that states no ETA of its own.", type: "integer", required: false },
  { key: "handlingDays", option: "--handling-days <handling-days>", name: "handling_days", description: "Days needed to make a consignment ready for THIS carrier. Overrides the tenant's handling_days.", type: "integer", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names keyed by locale (e.g. {de, en}).", type: "object", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata (customer numbers, contract references).", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order (default 0).", type: "integer", required: false },
  { key: "serviceLevel", option: "--service-level <service-level>", name: "service_level", description: "The class of service this row represents (default 'standard'), as a CODE into the tenant's own service levels (GET /shipping/service-levels). One row is one class: a carrier selling both a parcel and an express product is two rows. Deliberately not an enum here — the set is the merchant's, so a fixed list in this contract would make the gateway reject a level they created.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Whether this carrier may be quoted (default 'active'). Anything else excludes every method that ships with it from POST /shipping/rates, with a reason. Tracking links are NOT gated on it — a retired carrier's old shipments stay resolvable.", type: "string", required: false, enum: ["active","paused","retired"] },
  { key: "trackingUrlTemplate", option: "--tracking-url-template <tracking-url-template>", name: "tracking_url_template", description: "Tracking page URL with {tracking_code} where the number goes; {postal_code} and {country} are also substituted, URL-encoded. Null for a carrier with no public tracking page.", type: "string", required: false },
];
shipping
  .command(`carriers-create`)
  .description(`Add a carrier`)
  .option(`--code <code>`, `Stable carrier code, unique per tenant (e.g. dhl, dpd, gls). A method whose \`carrier\` text equals this code resolves to this carrier — that is the migration path off the free-text field.`)
  .option(`--name <name>`, `Display name.`)
  .option(`--countries [countries...]`, `ISO 3166-1 alpha-2 codes this carrier serves; null or empty = everywhere. ANDed with the method's own restriction.`)
  .option(`--cutoff-time <cutoff-time>`, `This carrier's own daily pickup cut-off (HH:MM, UTC). Overrides the tenant's cutoff_time for methods on this carrier — one shop-wide time cannot be both DHL's 16:00 and a forwarder's 12:00.`)
  .option(`--eta-days-max <eta-days-max>`, `Transit time upper bound.`, parseInteger)
  .option(`--eta-days-min <eta-days-min>`, `Transit time lower bound — used by any method on this carrier that states no ETA of its own.`, parseInteger)
  .option(`--handling-days <handling-days>`, `Days needed to make a consignment ready for THIS carrier. Overrides the tenant's handling_days.`, parseInteger)
  .option(`--labels <labels>`, `Localized display names keyed by locale (e.g. {de, en}).`)
  .option(`--metadata <metadata>`, `Free-form metadata (customer numbers, contract references).`)
  .option(`--position <position>`, `Sort order (default 0).`, parseInteger)
  .option(`--service-level <service-level>`, `The class of service this row represents (default 'standard'), as a CODE into the tenant's own service levels (GET /shipping/service-levels). One row is one class: a carrier selling both a parcel and an express product is two rows. Deliberately not an enum here — the set is the merchant's, so a fixed list in this contract would make the gateway reject a level they created.`)
  .option(`--status <status>`, `Whether this carrier may be quoted (default 'active'). Anything else excludes every method that ships with it from POST /shipping/rates, with a reason. Tracking links are NOT gated on it — a retired carrier's old shipments stay resolvable.`)
  .option(`--tracking-url-template <tracking-url-template>`, `Tracking page URL with {tracking_code} where the number goes; {postal_code} and {country} are also substituted, URL-encoded. Null for a carrier with no public tracking page.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, countries, cutoffTime, etaDaysMax, etaDaysMin, handlingDays, labels, metadata, position, serviceLevel, status, trackingUrlTemplate } = await promptForMissing(
          _options,
          carriersCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/carriers`;
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
        if (countries !== undefined) {
          _payload[`countries`] = countries;
        }
        if (cutoffTime !== undefined) {
          _payload[`cutoff_time`] = cutoffTime;
        }
        if (etaDaysMax !== undefined) {
          _payload[`eta_days_max`] = etaDaysMax;
        }
        if (etaDaysMin !== undefined) {
          _payload[`eta_days_min`] = etaDaysMin;
        }
        if (handlingDays !== undefined) {
          _payload[`handling_days`] = handlingDays;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
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
        if (serviceLevel !== undefined) {
          _payload[`service_level`] = serviceLevel;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (trackingUrlTemplate !== undefined) {
          _payload[`tracking_url_template`] = trackingUrlTemplate;
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
registerPromptSpecs(shipping.commands.at(-1)!, carriersCreateSpecs, { method: "post" });
shipping
  .command(`carriers-catalog`)
  .description(`The DACH set — the three German parcel networks, the express carriers, the AT/CH incumbents and the pallet forwarders — each with the tracking template, service level, transit time and pickup cut-off it would be created with. \`seeded\` marks the four a fresh install already has. Adding a carrier is a data change, never a code change, and a merchant may of course create one that is not in here at all.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/carriers/catalog`;
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
shipping
  .command(`carriers-defaults`)
  .description(`Creates the carriers that are missing, by code. An existing row belongs to the merchant: only columns that are genuinely EMPTY are filled in (a tracking template added to the catalog after their install), never a value they set. Nothing is deleted.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/carriers/defaults`;
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
const carriersDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/carriers", hasLimit: true } },
];
shipping
  .command(`carriers-delete`)
  .description(`Delete a carrier; methods that referenced it fall back to their carrier code`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          carriersDeleteSpecs,
          _command,
        );
        await confirmDestructive(`shipping carriers-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/shipping/carriers/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(shipping.commands.at(-1)!, carriersDeleteSpecs, { method: "delete", destructive: true });
const carriersGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/carriers", hasLimit: true } },
];
shipping
  .command(`carriers-get`)
  .description(`Read one carrier`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          carriersGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/carriers/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(shipping.commands.at(-1)!, carriersGetSpecs, { method: "get" });
const carriersUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/carriers", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Stable carrier code, unique per tenant (e.g. dhl, dpd, gls). A method whose `carrier` text equals this code resolves to this carrier — that is the migration path off the free-text field.", type: "string", required: false },
  { key: "countries", option: "--countries [countries...]", name: "countries", description: "ISO 3166-1 alpha-2 codes this carrier serves; null or empty = everywhere. ANDed with the method's own restriction.", type: "array", required: false },
  { key: "cutoffTime", option: "--cutoff-time <cutoff-time>", name: "cutoff_time", description: "This carrier's own daily pickup cut-off (HH:MM, UTC). Overrides the tenant's cutoff_time for methods on this carrier — one shop-wide time cannot be both DHL's 16:00 and a forwarder's 12:00.", type: "string", required: false },
  { key: "etaDaysMax", option: "--eta-days-max <eta-days-max>", name: "eta_days_max", description: "Transit time upper bound.", type: "integer", required: false },
  { key: "etaDaysMin", option: "--eta-days-min <eta-days-min>", name: "eta_days_min", description: "Transit time lower bound — used by any method on this carrier that states no ETA of its own.", type: "integer", required: false },
  { key: "handlingDays", option: "--handling-days <handling-days>", name: "handling_days", description: "Days needed to make a consignment ready for THIS carrier. Overrides the tenant's handling_days.", type: "integer", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names keyed by locale (e.g. {de, en}).", type: "object", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata (customer numbers, contract references).", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order (default 0).", type: "integer", required: false },
  { key: "serviceLevel", option: "--service-level <service-level>", name: "service_level", description: "The class of service this row represents (default 'standard'), as a CODE into the tenant's own service levels (GET /shipping/service-levels). One row is one class: a carrier selling both a parcel and an express product is two rows. Deliberately not an enum here — the set is the merchant's, so a fixed list in this contract would make the gateway reject a level they created.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Whether this carrier may be quoted (default 'active'). Anything else excludes every method that ships with it from POST /shipping/rates, with a reason. Tracking links are NOT gated on it — a retired carrier's old shipments stay resolvable.", type: "string", required: false, enum: ["active","paused","retired"] },
  { key: "trackingUrlTemplate", option: "--tracking-url-template <tracking-url-template>", name: "tracking_url_template", description: "Tracking page URL with {tracking_code} where the number goes; {postal_code} and {country} are also substituted, URL-encoded. Null for a carrier with no public tracking page.", type: "string", required: false },
];
shipping
  .command(`carriers-update`)
  .description(`Update a carrier (pause it, change its tracking template, its cut-off or its transit time)`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, `Stable carrier code, unique per tenant (e.g. dhl, dpd, gls). A method whose \`carrier\` text equals this code resolves to this carrier — that is the migration path off the free-text field.`)
  .option(`--countries [countries...]`, `ISO 3166-1 alpha-2 codes this carrier serves; null or empty = everywhere. ANDed with the method's own restriction.`)
  .option(`--cutoff-time <cutoff-time>`, `This carrier's own daily pickup cut-off (HH:MM, UTC). Overrides the tenant's cutoff_time for methods on this carrier — one shop-wide time cannot be both DHL's 16:00 and a forwarder's 12:00.`)
  .option(`--eta-days-max <eta-days-max>`, `Transit time upper bound.`, parseInteger)
  .option(`--eta-days-min <eta-days-min>`, `Transit time lower bound — used by any method on this carrier that states no ETA of its own.`, parseInteger)
  .option(`--handling-days <handling-days>`, `Days needed to make a consignment ready for THIS carrier. Overrides the tenant's handling_days.`, parseInteger)
  .option(`--labels <labels>`, `Localized display names keyed by locale (e.g. {de, en}).`)
  .option(`--metadata <metadata>`, `Free-form metadata (customer numbers, contract references).`)
  .option(`--name <name>`, `Display name.`)
  .option(`--position <position>`, `Sort order (default 0).`, parseInteger)
  .option(`--service-level <service-level>`, `The class of service this row represents (default 'standard'), as a CODE into the tenant's own service levels (GET /shipping/service-levels). One row is one class: a carrier selling both a parcel and an express product is two rows. Deliberately not an enum here — the set is the merchant's, so a fixed list in this contract would make the gateway reject a level they created.`)
  .option(`--status <status>`, `Whether this carrier may be quoted (default 'active'). Anything else excludes every method that ships with it from POST /shipping/rates, with a reason. Tracking links are NOT gated on it — a retired carrier's old shipments stay resolvable.`)
  .option(`--tracking-url-template <tracking-url-template>`, `Tracking page URL with {tracking_code} where the number goes; {postal_code} and {country} are also substituted, URL-encoded. Null for a carrier with no public tracking page.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, countries, cutoffTime, etaDaysMax, etaDaysMin, handlingDays, labels, metadata, name, position, serviceLevel, status, trackingUrlTemplate } = await promptForMissing(
          _options,
          carriersUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/carriers/{id}`.replace(`{id}`, id);
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
        if (countries !== undefined) {
          _payload[`countries`] = countries;
        }
        if (cutoffTime !== undefined) {
          _payload[`cutoff_time`] = cutoffTime;
        }
        if (etaDaysMax !== undefined) {
          _payload[`eta_days_max`] = etaDaysMax;
        }
        if (etaDaysMin !== undefined) {
          _payload[`eta_days_min`] = etaDaysMin;
        }
        if (handlingDays !== undefined) {
          _payload[`handling_days`] = handlingDays;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
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
        if (serviceLevel !== undefined) {
          _payload[`service_level`] = serviceLevel;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (trackingUrlTemplate !== undefined) {
          _payload[`tracking_url_template`] = trackingUrlTemplate;
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
registerPromptSpecs(shipping.commands.at(-1)!, carriersUpdateSpecs, { method: "put" });
const methodsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
shipping
  .command(`methods-list`)
  .description(`List shipping method configurations`)
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
          methodsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods`;
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
registerPromptSpecs(shipping.commands.at(-1)!, methodsListSpecs, { method: "get" });
const methodsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Stable method code, unique per tenant (e.g. standard, express).", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "Display name.", type: "string", required: true },
  { key: "carrier", option: "--carrier <carrier>", name: "carrier", description: "Carrier CODE, kept from before shipping_carriers existed. Looked up in the carrier table when carrier_id is not set, so an existing value keeps working and gains a tracking template; a code nobody maintains is still reported as a plain name.", type: "string", required: false },
  { key: "carrierId", option: "--carrier-id <carrier-id>", name: "carrier_id", description: "The carrier this method ships with. Wins over `carrier` and supplies the tracking template, pickup cut-off, handling time and transit days.", type: "string", required: false },
  { key: "countries", option: "--countries [countries...]", name: "countries", description: "Allowed ISO 3166-1 alpha-2 codes; null or empty = worldwide.", type: "array", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default EUR).", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Only enabled methods appear in rate responses (default false).", type: "boolean", required: false },
  { key: "etaDaysMax", option: "--eta-days-max <eta-days-max>", name: "eta_days_max", description: "Delivery-time estimate for the checkout (days, upper bound).", type: "integer", required: false },
  { key: "etaDaysMin", option: "--eta-days-min <eta-days-min>", name: "eta_days_min", description: "Delivery-time estimate for the checkout (days, lower bound).", type: "integer", required: false },
  { key: "freeAbove", option: "--free-above <free-above>", name: "free_above", description: "Free shipping at or above this order value — wins over every pricing model.", type: "number", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names keyed by locale (e.g. {de, en}).", type: "object", required: false },
  { key: "matrixAttribute", option: "--matrix-attribute <matrix-attribute>", name: "matrix_attribute", description: "Attribute name for matrix_basis 'attribute'.", type: "string", required: false },
  { key: "matrixBasis", option: "--matrix-basis <matrix-basis>", name: "matrix_basis", description: "The measure a matrix method prices over; 'attribute' reads matrix_attribute from the rate request.", type: "string", required: false, enum: ["weight","quantity","order_value","attribute"] },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order in the checkout (default 0).", type: "integer", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "The fixed price (default 0) — ignored for 'free' and 'matrix'.", type: "number", required: false },
  { key: "pricingType", option: "--pricing-type <pricing-type>", name: "pricing_type", description: "Pricing model (default 'fixed'): one price, no price, or tiered over a measure.", type: "string", required: false, enum: ["fixed","free","matrix"] },
];
shipping
  .command(`methods-create`)
  .description(`Create a shipping method (fixed, free or matrix pricing)`)
  .option(`--code <code>`, `Stable method code, unique per tenant (e.g. standard, express).`)
  .option(`--name <name>`, `Display name.`)
  .option(`--carrier <carrier>`, `Carrier CODE, kept from before shipping_carriers existed. Looked up in the carrier table when carrier_id is not set, so an existing value keeps working and gains a tracking template; a code nobody maintains is still reported as a plain name.`)
  .option(`--carrier-id <carrier-id>`, `The carrier this method ships with. Wins over \`carrier\` and supplies the tracking template, pickup cut-off, handling time and transit days.`)
  .option(`--countries [countries...]`, `Allowed ISO 3166-1 alpha-2 codes; null or empty = worldwide.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR).`)
  .option(`--description <description>`, ``)
  .option(
    `--enabled [value]`,
    `Only enabled methods appear in rate responses (default false).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--eta-days-max <eta-days-max>`, `Delivery-time estimate for the checkout (days, upper bound).`, parseInteger)
  .option(`--eta-days-min <eta-days-min>`, `Delivery-time estimate for the checkout (days, lower bound).`, parseInteger)
  .option(`--free-above <free-above>`, `Free shipping at or above this order value — wins over every pricing model.`, parseInteger)
  .option(`--labels <labels>`, `Localized display names keyed by locale (e.g. {de, en}).`)
  .option(`--matrix-attribute <matrix-attribute>`, `Attribute name for matrix_basis 'attribute'.`)
  .option(`--matrix-basis <matrix-basis>`, `The measure a matrix method prices over; 'attribute' reads matrix_attribute from the rate request.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--position <position>`, `Sort order in the checkout (default 0).`, parseInteger)
  .option(`--price <price>`, `The fixed price (default 0) — ignored for 'free' and 'matrix'.`, parseInteger)
  .option(`--pricing-type <pricing-type>`, `Pricing model (default 'fixed'): one price, no price, or tiered over a measure.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, carrier, carrierId, countries, currency, description, enabled, etaDaysMax, etaDaysMin, freeAbove, labels, matrixAttribute, matrixBasis, metadata, position, price, pricingType } = await promptForMissing(
          _options,
          methodsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (carrier !== undefined) {
          _payload[`carrier`] = carrier;
        }
        if (carrierId !== undefined) {
          _payload[`carrier_id`] = carrierId;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (countries !== undefined) {
          _payload[`countries`] = countries;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (etaDaysMax !== undefined) {
          _payload[`eta_days_max`] = etaDaysMax;
        }
        if (etaDaysMin !== undefined) {
          _payload[`eta_days_min`] = etaDaysMin;
        }
        if (freeAbove !== undefined) {
          _payload[`free_above`] = freeAbove;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (matrixAttribute !== undefined) {
          _payload[`matrix_attribute`] = matrixAttribute;
        }
        if (matrixBasis !== undefined) {
          _payload[`matrix_basis`] = matrixBasis;
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
        if (price !== undefined) {
          _payload[`price`] = price;
        }
        if (pricingType !== undefined) {
          _payload[`pricing_type`] = pricingType;
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
registerPromptSpecs(shipping.commands.at(-1)!, methodsCreateSpecs, { method: "post" });
shipping
  .command(`methods-defaults`)
  .description(`Runs the carrier seed first, then creates any missing method. The seeded methods deliberately name no carrier: which carrier carries the standard method is a contract, not a default, and a method that says 'dhl' resolves to the seeded DHL row anyway.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/defaults`;
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
const methodsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
];
shipping
  .command(`methods-delete`)
  .description(`Delete a shipping method including its matrix tiers`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          methodsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`shipping methods-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(shipping.commands.at(-1)!, methodsDeleteSpecs, { method: "delete", destructive: true });
const methodsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
];
shipping
  .command(`methods-get`)
  .description(`Read one shipping method`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          methodsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(shipping.commands.at(-1)!, methodsGetSpecs, { method: "get" });
const methodsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "carrier", option: "--carrier <carrier>", name: "carrier", description: "Carrier CODE, kept from before shipping_carriers existed. Looked up in the carrier table when carrier_id is not set, so an existing value keeps working and gains a tracking template; a code nobody maintains is still reported as a plain name.", type: "string", required: false },
  { key: "carrierId", option: "--carrier-id <carrier-id>", name: "carrier_id", description: "The carrier this method ships with. Wins over `carrier` and supplies the tracking template, pickup cut-off, handling time and transit days.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Stable method code, unique per tenant (e.g. standard, express).", type: "string", required: false },
  { key: "countries", option: "--countries [countries...]", name: "countries", description: "Allowed ISO 3166-1 alpha-2 codes; null or empty = worldwide.", type: "array", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default EUR).", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Only enabled methods appear in rate responses (default false).", type: "boolean", required: false },
  { key: "etaDaysMax", option: "--eta-days-max <eta-days-max>", name: "eta_days_max", description: "Delivery-time estimate for the checkout (days, upper bound).", type: "integer", required: false },
  { key: "etaDaysMin", option: "--eta-days-min <eta-days-min>", name: "eta_days_min", description: "Delivery-time estimate for the checkout (days, lower bound).", type: "integer", required: false },
  { key: "freeAbove", option: "--free-above <free-above>", name: "free_above", description: "Free shipping at or above this order value — wins over every pricing model.", type: "number", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names keyed by locale (e.g. {de, en}).", type: "object", required: false },
  { key: "matrixAttribute", option: "--matrix-attribute <matrix-attribute>", name: "matrix_attribute", description: "Attribute name for matrix_basis 'attribute'.", type: "string", required: false },
  { key: "matrixBasis", option: "--matrix-basis <matrix-basis>", name: "matrix_basis", description: "The measure a matrix method prices over; 'attribute' reads matrix_attribute from the rate request.", type: "string", required: false, enum: ["weight","quantity","order_value","attribute"] },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order in the checkout (default 0).", type: "integer", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "The fixed price (default 0) — ignored for 'free' and 'matrix'.", type: "number", required: false },
  { key: "pricingType", option: "--pricing-type <pricing-type>", name: "pricing_type", description: "Pricing model (default 'fixed'): one price, no price, or tiered over a measure.", type: "string", required: false, enum: ["fixed","free","matrix"] },
];
shipping
  .command(`methods-update`)
  .description(`Update a shipping method (enable/disable, pricing, restrictions, ETA)`)
  .option(`--id <id>`, ``)
  .option(`--carrier <carrier>`, `Carrier CODE, kept from before shipping_carriers existed. Looked up in the carrier table when carrier_id is not set, so an existing value keeps working and gains a tracking template; a code nobody maintains is still reported as a plain name.`)
  .option(`--carrier-id <carrier-id>`, `The carrier this method ships with. Wins over \`carrier\` and supplies the tracking template, pickup cut-off, handling time and transit days.`)
  .option(`--code <code>`, `Stable method code, unique per tenant (e.g. standard, express).`)
  .option(`--countries [countries...]`, `Allowed ISO 3166-1 alpha-2 codes; null or empty = worldwide.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR).`)
  .option(`--description <description>`, ``)
  .option(
    `--enabled [value]`,
    `Only enabled methods appear in rate responses (default false).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--eta-days-max <eta-days-max>`, `Delivery-time estimate for the checkout (days, upper bound).`, parseInteger)
  .option(`--eta-days-min <eta-days-min>`, `Delivery-time estimate for the checkout (days, lower bound).`, parseInteger)
  .option(`--free-above <free-above>`, `Free shipping at or above this order value — wins over every pricing model.`, parseInteger)
  .option(`--labels <labels>`, `Localized display names keyed by locale (e.g. {de, en}).`)
  .option(`--matrix-attribute <matrix-attribute>`, `Attribute name for matrix_basis 'attribute'.`)
  .option(`--matrix-basis <matrix-basis>`, `The measure a matrix method prices over; 'attribute' reads matrix_attribute from the rate request.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, `Display name.`)
  .option(`--position <position>`, `Sort order in the checkout (default 0).`, parseInteger)
  .option(`--price <price>`, `The fixed price (default 0) — ignored for 'free' and 'matrix'.`, parseInteger)
  .option(`--pricing-type <pricing-type>`, `Pricing model (default 'fixed'): one price, no price, or tiered over a measure.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, carrier, carrierId, code, countries, currency, description, enabled, etaDaysMax, etaDaysMin, freeAbove, labels, matrixAttribute, matrixBasis, metadata, name, position, price, pricingType } = await promptForMissing(
          _options,
          methodsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (carrier !== undefined) {
          _payload[`carrier`] = carrier;
        }
        if (carrierId !== undefined) {
          _payload[`carrier_id`] = carrierId;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (countries !== undefined) {
          _payload[`countries`] = countries;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (etaDaysMax !== undefined) {
          _payload[`eta_days_max`] = etaDaysMax;
        }
        if (etaDaysMin !== undefined) {
          _payload[`eta_days_min`] = etaDaysMin;
        }
        if (freeAbove !== undefined) {
          _payload[`free_above`] = freeAbove;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (matrixAttribute !== undefined) {
          _payload[`matrix_attribute`] = matrixAttribute;
        }
        if (matrixBasis !== undefined) {
          _payload[`matrix_basis`] = matrixBasis;
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
        if (price !== undefined) {
          _payload[`price`] = price;
        }
        if (pricingType !== undefined) {
          _payload[`pricing_type`] = pricingType;
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
registerPromptSpecs(shipping.commands.at(-1)!, methodsUpdateSpecs, { method: "put" });
const tiersListSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
shipping
  .command(`tiers-list`)
  .description(`List the matrix tiers of a method (from_value → price)`)
  .option(`--method-id <method-id>`, ``)
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
        const { methodId, limit, offset, order, filter } = await promptForMissing(
          _options,
          tiersListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers`.replace(`{method_id}`, methodId);
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
registerPromptSpecs(shipping.commands.at(-1)!, tiersListSpecs, { method: "get" });
const tiersCreateSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "fromValue", option: "--from-value <from-value>", name: "from_value", description: "Tier threshold (default 0) — the tier with the highest from_value at or below the measured value wins.", type: "number", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order (default 0; bulk replace derives it from the array index).", type: "integer", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "Price of this tier (default 0).", type: "number", required: false },
];
shipping
  .command(`tiers-create`)
  .description(`Add a matrix tier`)
  .option(`--method-id <method-id>`, ``)
  .option(`--from-value <from-value>`, `Tier threshold (default 0) — the tier with the highest from_value at or below the measured value wins.`, parseInteger)
  .option(`--position <position>`, `Sort order (default 0; bulk replace derives it from the array index).`, parseInteger)
  .option(`--price <price>`, `Price of this tier (default 0).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, fromValue, position, price } = await promptForMissing(
          _options,
          tiersCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers`.replace(`{method_id}`, methodId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (fromValue !== undefined) {
          _payload[`from_value`] = fromValue;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
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
registerPromptSpecs(shipping.commands.at(-1)!, tiersCreateSpecs, { method: "post" });
const tiersReplaceSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "tiers", option: "--tiers [tiers...]", name: "tiers", description: "The complete new tier set (set semantics) — positions are derived from the array order.", type: "array", required: true },
];
shipping
  .command(`tiers-replace`)
  .description(`Replace ALL matrix tiers of a method (table editing)`)
  .option(`--method-id <method-id>`, ``)
  .option(`--tiers [tiers...]`, `The complete new tier set (set semantics) — positions are derived from the array order.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, tiers } = await promptForMissing(
          _options,
          tiersReplaceSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers`.replace(`{method_id}`, methodId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (tiers !== undefined) {
          _payload[`tiers`] = tiers;
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
registerPromptSpecs(shipping.commands.at(-1)!, tiersReplaceSpecs, { method: "put" });
const tiersLadderSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "basePrice", option: "--base-price <base-price>", name: "base_price", description: "Price of the first tier.", type: "number", required: true },
  { key: "step", option: "--step <step>", name: "step", description: "Distance between two tiers. Must be > 0.", type: "number", required: true },
  { key: "toValue", option: "--to-value <to-value>", name: "to_value", description: "Last tier threshold. The final tier keeps applying above it — a matrix has no upper bound.", type: "number", required: true },
  { key: "fromValue", option: "--from-value <from-value>", name: "from_value", description: "First tier threshold (default 0), in the method's matrix measure.", type: "number", required: false },
  { key: "replace", option: "--replace <replace>", name: "replace", description: "Replace the whole table (default true) or append to it.", type: "boolean", required: false },
  { key: "stepPrice", option: "--step-price <step-price>", name: "step_price", description: "Added to each subsequent tier (default 0). A negative value is allowed as long as no tier ends up below 0.", type: "number", required: false },
];
shipping
  .command(`tiers-ladder`)
  .description(`The tier table a merchant describes in words — "0 to 30 kg, every 5 kg, €4.90 plus €2 a step" — without typing every row. Replaces the method's tiers by default (set replace=false to append). Capped at 200 tiers; an unknown method is a 404.`)
  .option(`--method-id <method-id>`, ``)
  .option(`--base-price <base-price>`, `Price of the first tier.`, parseInteger)
  .option(`--step <step>`, `Distance between two tiers. Must be > 0.`, parseInteger)
  .option(`--to-value <to-value>`, `Last tier threshold. The final tier keeps applying above it — a matrix has no upper bound.`, parseInteger)
  .option(`--from-value <from-value>`, `First tier threshold (default 0), in the method's matrix measure.`, parseInteger)
  .option(
    `--replace [value]`,
    `Replace the whole table (default true) or append to it.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--step-price <step-price>`, `Added to each subsequent tier (default 0). A negative value is allowed as long as no tier ends up below 0.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, basePrice, step, toValue, fromValue, replace, stepPrice } = await promptForMissing(
          _options,
          tiersLadderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers/ladder`.replace(`{method_id}`, methodId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (basePrice !== undefined) {
          _payload[`base_price`] = basePrice;
        }
        if (fromValue !== undefined) {
          _payload[`from_value`] = fromValue;
        }
        if (replace !== undefined) {
          _payload[`replace`] = replace;
        }
        if (step !== undefined) {
          _payload[`step`] = step;
        }
        if (stepPrice !== undefined) {
          _payload[`step_price`] = stepPrice;
        }
        if (toValue !== undefined) {
          _payload[`to_value`] = toValue;
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
registerPromptSpecs(shipping.commands.at(-1)!, tiersLadderSpecs, { method: "post" });
const tiersDeleteSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/methods/{method_id}/tiers", hasLimit: true } },
];
shipping
  .command(`tiers-delete`)
  .description(`Delete a matrix tier`)
  .option(`--method-id <method-id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, id } = await promptForMissing(
          _options,
          tiersDeleteSpecs,
          _command,
        );
        await confirmDestructive(`shipping tiers-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers/{id}`.replace(`{method_id}`, methodId).replace(`{id}`, id);
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
registerPromptSpecs(shipping.commands.at(-1)!, tiersDeleteSpecs, { method: "delete", destructive: true });
const tiersGetSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/methods/{method_id}/tiers", hasLimit: true } },
];
shipping
  .command(`tiers-get`)
  .description(`Read one matrix tier`)
  .option(`--method-id <method-id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, id } = await promptForMissing(
          _options,
          tiersGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers/{id}`.replace(`{method_id}`, methodId).replace(`{id}`, id);
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
registerPromptSpecs(shipping.commands.at(-1)!, tiersGetSpecs, { method: "get" });
const tiersUpdateSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/methods/{method_id}/tiers", hasLimit: true } },
  { key: "fromValue", option: "--from-value <from-value>", name: "from_value", description: "Tier threshold (default 0) — the tier with the highest from_value at or below the measured value wins.", type: "number", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order (default 0; bulk replace derives it from the array index).", type: "integer", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "Price of this tier (default 0).", type: "number", required: false },
];
shipping
  .command(`tiers-update`)
  .description(`Update a matrix tier`)
  .option(`--method-id <method-id>`, ``)
  .option(`--id <id>`, ``)
  .option(`--from-value <from-value>`, `Tier threshold (default 0) — the tier with the highest from_value at or below the measured value wins.`, parseInteger)
  .option(`--position <position>`, `Sort order (default 0; bulk replace derives it from the array index).`, parseInteger)
  .option(`--price <price>`, `Price of this tier (default 0).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, id, fromValue, position, price } = await promptForMissing(
          _options,
          tiersUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers/{id}`.replace(`{method_id}`, methodId).replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (fromValue !== undefined) {
          _payload[`from_value`] = fromValue;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
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
registerPromptSpecs(shipping.commands.at(-1)!, tiersUpdateSpecs, { method: "put" });
const ratesSpecs: PromptSpec[] = [
  { key: "at", option: "--at <at>", name: "at", description: "The instant to evaluate the delivery estimate at (ISO 8601). Omitted: now. Lets a storefront compute the cut-off in its own timezone.", type: "string", required: false },
  { key: "attributes", option: "--attributes <attributes>", name: "attributes", description: "Measure values for attribute matrices, keyed by attribute name.", type: "object", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "Destination ISO 3166-1 alpha-2 code — checked against method country restrictions.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Echoed into the rates (default 'EUR').", type: "string", required: false },
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "Buyer market for tax resolution. Omitted: the market matching `country`, else the tenant's sole market — never an arbitrary one.", type: "string", required: false },
  { key: "orderValue", option: "--order-value <order-value>", name: "order_value", description: "Order value (default 0) — drives order_value matrices, and free-above thresholds when no sided value is sent. Read on the basis the tenant's free_above_compares setting declares.", type: "number", required: false },
  { key: "orderValueGross", option: "--order-value-gross <order-value-gross>", name: "order_value_gross", description: "Order value including tax. Compared against free-above thresholds when free_above_compares is 'gross'.", type: "number", required: false },
  { key: "orderValueNet", option: "--order-value-net <order-value-net>", name: "order_value_net", description: "Order value excluding tax. Compared against free-above thresholds when free_above_compares is 'net'.", type: "number", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Total quantity — measure for quantity matrices.", type: "number", required: false },
  { key: "weight", option: "--weight <weight>", name: "weight", description: "Total weight — measure for weight matrices. Read in weight_unit and converted to the unit the tiers are keyed in.", type: "number", required: false },
  { key: "weightUnit", option: "--weight-unit <weight-unit>", name: "weight_unit", description: "The unit `weight` is expressed in, as a CODE into the tenant's own weight units (GET /shipping/weight-units). Omitted, it is the unit this market quotes in. A unit the tenant does not keep is a 400 — a mis-read weight prices the wrong bracket silently, and guessing is worse than refusing.", type: "string", required: false },
];
shipping
  .command(`rates`)
  .description(`Resolve shipping rates for a buyer context (country, order value, weight/quantity/attribute measures) — the checkout question`)
  .option(`--at <at>`, `The instant to evaluate the delivery estimate at (ISO 8601). Omitted: now. Lets a storefront compute the cut-off in its own timezone.`)
  .option(`--attributes <attributes>`, `Measure values for attribute matrices, keyed by attribute name.`)
  .option(`--country <country>`, `Destination ISO 3166-1 alpha-2 code — checked against method country restrictions.`)
  .option(`--currency <currency>`, `Echoed into the rates (default 'EUR').`)
  .option(`--market-id <market-id>`, `Buyer market for tax resolution. Omitted: the market matching \`country\`, else the tenant's sole market — never an arbitrary one.`)
  .option(`--order-value <order-value>`, `Order value (default 0) — drives order_value matrices, and free-above thresholds when no sided value is sent. Read on the basis the tenant's free_above_compares setting declares.`, parseInteger)
  .option(`--order-value-gross <order-value-gross>`, `Order value including tax. Compared against free-above thresholds when free_above_compares is 'gross'.`, parseInteger)
  .option(`--order-value-net <order-value-net>`, `Order value excluding tax. Compared against free-above thresholds when free_above_compares is 'net'.`, parseInteger)
  .option(`--quantity <quantity>`, `Total quantity — measure for quantity matrices.`, parseInteger)
  .option(`--weight <weight>`, `Total weight — measure for weight matrices. Read in weight_unit and converted to the unit the tiers are keyed in.`, parseInteger)
  .option(`--weight-unit <weight-unit>`, `The unit \`weight\` is expressed in, as a CODE into the tenant's own weight units (GET /shipping/weight-units). Omitted, it is the unit this market quotes in. A unit the tenant does not keep is a 400 — a mis-read weight prices the wrong bracket silently, and guessing is worse than refusing.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { at, attributes, country, currency, marketId, orderValue, orderValueGross, orderValueNet, quantity, weight, weightUnit } = await promptForMissing(
          _options,
          ratesSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/rates`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (at !== undefined) {
          _payload[`at`] = at;
        }
        if (attributes !== undefined) {
          _payload[`attributes`] = resolveBodyParam(attributes);
        }
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (marketId !== undefined) {
          _payload[`market_id`] = marketId;
        }
        if (orderValue !== undefined) {
          _payload[`order_value`] = orderValue;
        }
        if (orderValueGross !== undefined) {
          _payload[`order_value_gross`] = orderValueGross;
        }
        if (orderValueNet !== undefined) {
          _payload[`order_value_net`] = orderValueNet;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (weight !== undefined) {
          _payload[`weight`] = weight;
        }
        if (weightUnit !== undefined) {
          _payload[`weight_unit`] = weightUnit;
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
registerPromptSpecs(shipping.commands.at(-1)!, ratesSpecs, { method: "post" });
const serviceLevelsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
shipping
  .command(`service-levels-list`)
  .description(`What class of service a carrier row represents. This used to be a CHECK constraint, which meant a merchant with a night-courier tier or a two-man delivery service needed a release of this app to say so — and nothing in the app ever branched on the value, it only carried it. The set is the tenant's rows now, and the first read seeds it, so this never answers empty.`)
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
          serviceLevelsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/service-levels`;
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
registerPromptSpecs(shipping.commands.at(-1)!, serviceLevelsListSpecs, { method: "get" });
const serviceLevelsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value; the previous default is demoted.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
shipping
  .command(`service-levels-create`)
  .description(`The code is lowercase and becomes what a carrier stores; it cannot be changed afterwards, because every carrier carrying it would be orphaned. A duplicate code is a 409.`)
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
          serviceLevelsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/service-levels`;
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
registerPromptSpecs(shipping.commands.at(-1)!, serviceLevelsCreateSpecs, { method: "post" });
const serviceLevelsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/service-levels", hasLimit: true } },
];
shipping
  .command(`service-levels-delete`)
  .description(`409 when at least one carrier still carries it — a carrier whose service level no longer exists would render as a bare code and filter as nothing. 409 also for the last remaining level, because a carrier must have one. There is no foreign key doing this: adding one to a table that starts empty would fail the migration of every existing tenant.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          serviceLevelsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`shipping service-levels-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/shipping/service-levels/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(shipping.commands.at(-1)!, serviceLevelsDeleteSpecs, { method: "delete", destructive: true });
const serviceLevelsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/service-levels", hasLimit: true } },
];
shipping
  .command(`service-levels-get`)
  .description(`Read one service level`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          serviceLevelsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/service-levels/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(shipping.commands.at(-1)!, serviceLevelsGetSpecs, { method: "get" });
const serviceLevelsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/service-levels", hasLimit: true } },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
shipping
  .command(`service-levels-update`)
  .description(`Rename a service level or move it in the order`)
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
          serviceLevelsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/service-levels/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(shipping.commands.at(-1)!, serviceLevelsUpdateSpecs, { method: "put" });
const trackingSpecs: PromptSpec[] = [
  { key: "carrier", option: "--carrier <carrier>", name: "carrier", description: "Carrier code (what an order shipment already stores) or the carrier row id.", type: "string", required: true },
  { key: "country", option: "--country <country>", name: "country", description: "Destination ISO 3166-1 alpha-2 code — only needed by a template that names {country}. Upper-cased before substitution.", type: "string", required: false },
  { key: "postalCode", option: "--postal-code <postal-code>", name: "postal_code", description: "Destination postcode — only needed by a template that names {postal_code}.", type: "string", required: false },
  { key: "trackingCode", option: "--tracking-code <tracking-code>", name: "tracking_code", description: "The carrier's tracking number. Required by every template that names {tracking_code}, which is all of them in the shipped catalog.", type: "string", required: false },
];
shipping
  .command(`tracking`)
  .description(`The carrier owns the URL format, so nobody else has to. \`order_shipments\` stores a tracking_url per shipment today, which is one carrier's URL shape copied into every row — the day it changes, every historic link is wrong. Ask here instead. An unknown carrier is a 404; a carrier with no template answers 200 with url null and a reason, because that is a legitimate state (a sea/air forwarder has no public per-code page) and a half-substituted URL would look like a link without being one.`)
  .option(`--carrier <carrier>`, `Carrier code (what an order shipment already stores) or the carrier row id.`)
  .option(`--country <country>`, `Destination ISO 3166-1 alpha-2 code — only needed by a template that names {country}. Upper-cased before substitution.`)
  .option(`--postal-code <postal-code>`, `Destination postcode — only needed by a template that names {postal_code}.`)
  .option(`--tracking-code <tracking-code>`, `The carrier's tracking number. Required by every template that names {tracking_code}, which is all of them in the shipped catalog.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { carrier, country, postalCode, trackingCode } = await promptForMissing(
          _options,
          trackingSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/tracking`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (carrier !== undefined) {
          _payload[`carrier`] = carrier;
        }
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (postalCode !== undefined) {
          _payload[`postal_code`] = postalCode;
        }
        if (trackingCode !== undefined) {
          _payload[`tracking_code`] = trackingCode;
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
registerPromptSpecs(shipping.commands.at(-1)!, trackingSpecs, { method: "post" });
const vocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
shipping
  .command(`vocabularies-list`)
  .description(`Discovery for the vocabulary routes. Names: carrier-statuses, matrix-bases, pricing-types, service-levels, weight-units. Fetch one with GET /shipping/vocabularies/{name}; a client holding the qualified pair 'shipping.<name>' builds that URL from the pair alone.`)
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
        const _apiPath = `/shipping/vocabularies`;
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
registerPromptSpecs(shipping.commands.at(-1)!, vocabulariesListSpecs, { method: "get" });
const vocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary name — the part after the dot in the qualified id.", type: "string", required: true, enum: ["carrier-statuses","matrix-bases","pricing-types","service-levels","weight-units"], resource: { listPath: "/shipping/vocabularies", hasLimit: false } },
];
shipping
  .command(`vocabularies-get`)
  .description(`Two sources, one guarantee: what is served is what is enforced, so no UI keeps a second copy. 'source: schema' means the values are read out of a CHECK constraint — a value added to the constraint appears here even before anyone labels it, titled from its own key, in constraint order. 'source: table' means the values are the TENANT's own rows (service-levels, weight-units), read per request and seeded on first use, so a merchant may add one without a release of this app; those values also carry labels/descriptions, is_system and is_default, and weight-units carries the conversion factor. 'closed' says the set is exhaustive either way, so a value outside it is stale data rather than a missing label. Answers 404 for an unknown name. Names: carrier-statuses, matrix-bases, pricing-types, service-levels, weight-units.`)
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
        const _apiPath = `/shipping/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(shipping.commands.at(-1)!, vocabulariesGetSpecs, { method: "get" });
const weightUnitsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
shipping
  .command(`weight-units-list`)
  .description(`Not a taxonomy: a unit is a code PLUS a factor, and the factor prices parcels. \`factor\` is how many kilograms one of this unit weighs, so a matrix keyed in one unit can price a request expressed in another. Exactly one row is the BASE (kg, factor 1) — the anchor every other factor and every stored rate tier is expressed in — and it is fixed at install. Seeded on first read, so this never answers empty.`)
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
          weightUnitsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/weight-units`;
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
registerPromptSpecs(shipping.commands.at(-1)!, weightUnitsListSpecs, { method: "get" });
const weightUnitsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "factor", option: "--factor <factor>", name: "factor", description: "How many BASE units (kilograms) one of this unit weighs — a tonne is 1000, a gram 0.001, a pound 0.45359237. This number prices parcels: every weight matrix converts a request through it. Must be > 0; the base unit is fixed at 1 and rejects a change.", type: "number", required: true },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value; the previous default is demoted.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
shipping
  .command(`weight-units-create`)
  .description(`\`factor\` is required and must be greater than 0: zero does not convert a weight, it divides by it, and a negative factor turns a parcel into a credit. The new unit is never the base — which unit anchors the others is decided at install, and moving it would silently reprice every weight matrix in the shop. A duplicate code is a 409.`)
  .option(`--code <code>`, ``)
  .option(`--factor <factor>`, `How many BASE units (kilograms) one of this unit weighs — a tonne is 1000, a gram 0.001, a pound 0.45359237. This number prices parcels: every weight matrix converts a request through it. Must be > 0; the base unit is fixed at 1 and rejects a change.`, parseInteger)
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
        const { code, factor, title, description, descriptions, isDefault, labels, position, tone } = await promptForMissing(
          _options,
          weightUnitsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/weight-units`;
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
        if (factor !== undefined) {
          _payload[`factor`] = factor;
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
registerPromptSpecs(shipping.commands.at(-1)!, weightUnitsCreateSpecs, { method: "post" });
const weightUnitsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/weight-units", hasLimit: true } },
];
shipping
  .command(`weight-units-delete`)
  .description(`409 for the base unit (every other factor is expressed in it), for the last remaining unit, and for the unit this market's \`weight_unit\` setting currently names. The last check is per market and therefore best effort — another market may still name it, which degrades to that market falling back to the flagged unit rather than failing its quotes.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          weightUnitsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`shipping weight-units-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/shipping/weight-units/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(shipping.commands.at(-1)!, weightUnitsDeleteSpecs, { method: "delete", destructive: true });
const weightUnitsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/weight-units", hasLimit: true } },
];
shipping
  .command(`weight-units-get`)
  .description(`Read one weight unit`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          weightUnitsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/weight-units/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(shipping.commands.at(-1)!, weightUnitsGetSpecs, { method: "get" });
const weightUnitsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/weight-units", hasLimit: true } },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", type: "object", required: false },
  { key: "factor", option: "--factor <factor>", name: "factor", description: "How many BASE units (kilograms) one of this unit weighs — a tonne is 1000, a gram 0.001, a pound 0.45359237. This number prices parcels: every weight matrix converts a request through it. Must be > 0; the base unit is fixed at 1 and rejects a change.", type: "number", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
shipping
  .command(`weight-units-update`)
  .description(`Everything but the code and the base flag. A factor sent for the BASE unit is a 400 rather than a silent no-op: it reads as 1 because every other factor is relative to it, so changing it would rescale the whole table without touching another row.`)
  .option(`--id <id>`, ``)
  .option(`--description <description>`, ``)
  .option(`--descriptions <descriptions>`, ``)
  .option(`--factor <factor>`, `How many BASE units (kilograms) one of this unit weighs — a tonne is 1000, a gram 0.001, a pound 0.45359237. This number prices parcels: every weight matrix converts a request through it. Must be > 0; the base unit is fixed at 1 and rejects a change.`, parseInteger)
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
        const { id, description, descriptions, factor, isDefault, labels, position, title, tone } = await promptForMissing(
          _options,
          weightUnitsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/weight-units/{id}`.replace(`{id}`, id);
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
        if (factor !== undefined) {
          _payload[`factor`] = factor;
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
registerPromptSpecs(shipping.commands.at(-1)!, weightUnitsUpdateSpecs, { method: "put" });
