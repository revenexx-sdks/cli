import { Command } from "commander";
import { resolveBodyParam } from "../../utils.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  cliConfig,
  parse,
  parseInteger,
} from "../../parser.js";
import {
  confirmDestructive,
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const shippingCarriers = new Command("shipping-carriers")
  .description(
    commandDescriptions["shippingCarriers"] ??
      `WHO carries the parcel. A carrier row is one company shipping one class of service: it owns the tracking-URL template, the service level, the transit days, the pickup cut-off and the handling days, and every shipping method that ships with it INHERITS all of those unless it states its own. A carrier selling both a parcel and an express product is therefore two rows — one row cannot hold two delivery promises. Pausing or retiring one takes every method that ships with it out of the quote in a single edit, which is the reason the table exists. The tracking resolver lives here too, because the template it substitutes into is a column of this row: ask the carrier for the link rather than copying one carrier's URL shape into every shipment. What a carrier COSTS is never here — the price is the method's.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A value outside the range is clamped rather than refused, and `page.limit` echoes what was applied.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). The next page is `page.offset + page.returned`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc' — a bare 'column' sorts ascending. The column must be one this entity has; anything else is a 400 from the data plane.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Exact-match filter on `code`. Unique per tenant, so this resolves a code an order shipment already stores without paging the whole list.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Exact-match filter on `status`. Quoting state — the cheap way to list only the carriers that may currently be quoted.", type: "string", required: false, enum: ["active","paused","retired"] },
  { key: "serviceLevel", option: "--service-level <service-level>", name: "service_level", description: "Exact-match filter on `service_level`. A code into the tenant's own service levels (GET /shipping/service-levels).", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Exact-match filter on `external_id`. The carrier one foreign system owns, by the key that system knows it by — how an import finds the row it wrote last run instead of creating a second one. Unique per tenant, so this answers at most one carrier; a carrier nobody imported matches nothing.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
shippingCarriers
  .command(`list`)
  .description(`Filterable by exact column value — \`?code=\`, \`?status=\` and \`?service_level=\` are applied as equalities and echoed back in \`filter\`. A query key that names no column of this entity is SILENTLY IGNORED: the page comes back unfiltered, 200, with an empty \`filter\`, so compare the echo against what you sent rather than trusting the status.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A value outside the range is clamped rather than refused, and \`page.limit\` echoes what was applied.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). The next page is \`page.offset + page.returned\`.`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc' — a bare 'column' sorts ascending. The column must be one this entity has; anything else is a 400 from the data plane.`)
  .option(`--code <code>`, `Exact-match filter on \`code\`. Unique per tenant, so this resolves a code an order shipment already stores without paging the whole list.`)
  .option(`--status <status>`, `Exact-match filter on \`status\`. Quoting state — the cheap way to list only the carriers that may currently be quoted.`)
  .option(`--service-level <service-level>`, `Exact-match filter on \`service_level\`. A code into the tenant's own service levels (GET /shipping/service-levels).`)
  .option(`--external-id <external-id>`, `Exact-match filter on \`external_id\`. The carrier one foreign system owns, by the key that system knows it by — how an import finds the row it wrote last run instead of creating a second one. Unique per tenant, so this answers at most one carrier; a carrier nobody imported matches nothing.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, code, status, serviceLevel, externalId, filter } = await promptForMissing(
          _options,
          listSpecs,
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
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (serviceLevel !== undefined) {
          _payload[`service_level`] = serviceLevel;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
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
registerPromptSpecs(shippingCarriers.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Stable carrier code, unique per tenant (e.g. dhl, dpd, gls), in lower case. A method whose `carrier` text equals this code resolves to this carrier — that is the migration path off the free-text field — and a tracking request finds it by code without regard to case. A code with a capital letter is refused with 400 `invalid_carrier_code`; a carrier stored with one before 1.0 keeps it and keeps resolving.", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "Display name, as an operator typed it.", type: "string", required: true },
  { key: "countries", option: "--countries [countries...]", name: "countries", description: "The countries this carrier serves. ISO 3166-1 alpha-2 codes; null or an empty array means no restriction. Compared without regard to case, so a lower-case entry still matches; anything but a two-letter code is refused with 400 `invalid_countries`. Declared as an array rather than the bare object a jsonb column derives to — this one is always a list. ANDed with the method's own restriction: a method may not be offered into a country its carrier does not reach.", type: "array", required: false },
  { key: "cutoffTime", option: "--cutoff-time <cutoff-time>", name: "cutoff_time", description: "This carrier's own daily pickup cut-off, HH:MM in 24-hour form, UTC. Overrides the tenant's cutoff_time for methods on this carrier — one shop-wide time cannot be both DHL's 16:00 and a forwarder's 12:00. Null or the empty string means this carrier declares none; any other shape is a 400, because a cut-off the estimator cannot read is a delivery promise silently computed without one.", type: "string", required: false },
  { key: "etaDaysMax", option: "--eta-days-max <eta-days-max>", name: "eta_days_max", description: "Transit time upper bound, in calendar days from the ship date.", type: "integer", required: false },
  { key: "etaDaysMin", option: "--eta-days-min <eta-days-min>", name: "eta_days_min", description: "Transit time lower bound, in calendar days from the ship date — inherited by any method on this carrier that states no ETA of its own.", type: "integer", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key this carrier has in the system that OWNS it — the shipping agent as an ERP numbers it, which is rarely the `code` a merchant types here. Unique per tenant where it is set, so a repeated import upserts on it instead of matching on a name; a carrier created in the Cockpit carries none and never will.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this carrier, keyed by system name — a second ERP, a TMS, the label printer's own agent list. `external_id` names the leading system; this is the rest, and the next one costs no column. Answered on read and carrying no query parameter: a jsonb column is compared as a WHOLE document, so a filter over part of one is refused. Look the row up by `external_id` and read this off the answer.", type: "object", required: false },
  { key: "handlingDays", option: "--handling-days <handling-days>", name: "handling_days", description: "Days needed to make a consignment ready for THIS carrier, added to the ship date before the transit days — a whole number, 0 or more. Overrides the tenant's handling_days.", type: "integer", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names. A flat map keyed by locale — the Cockpit falls back to `en`. Null means the row has no translations and every client shows the untranslated column instead.", type: "object", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form jsonb the platform never reads or validates — whatever the merchant or their integration needs to keep beside the row (a customer number with the carrier, an ERP key, a label-printer id). The shape varies BY INTEGRATION, not by anything this app knows, so no key is declared and none is reserved; the example is one plausible instance rather than a schema. A flat map of scalars is the convention, and nothing enforces it.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order among the carriers; ties fall back to whatever the database returns.", type: "integer", required: false },
  { key: "serviceLevel", option: "--service-level <service-level>", name: "service_level", description: "The class of service this row represents (default 'standard'), as a CODE into the tenant's own service levels (GET /shipping/service-levels). One row is one class: a carrier selling both a parcel and an express product is two rows. Deliberately not an enum here — the set is the merchant's, so a fixed list in this contract would make the gateway reject a level they created. A code the tenant does not keep is a 400 naming the codes they do.", type: "string", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "What the source said about this row, kept as it said it: `{\"system\": …, \"etag\": …, \"raw\": {…}}`. The `etag` is what a write-back has to send back in `If-Match`, and there is nowhere else to keep it between two runs. `raw` holds the source fields this app does not model, so an edit here does not silently throw them away.", type: "object", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When this row was last confirmed against its source. A delta run asks the source for what changed since it, and an operator reads it to see that a feed has gone quiet. An edit made HERE does not touch it — it records when the source was last seen, not when the row changed — so a stale value beside a fresh `updated_at` means somebody is maintaining by hand what a feed has stopped delivering.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Whether this carrier may be quoted (default 'active'). Anything else excludes every method that ships with it from POST /shipping/rates, with a reason. Tracking links are NOT gated on it — a retired carrier's old shipments stay resolvable.", type: "string", required: false, enum: ["active","paused","retired"] },
  { key: "trackingUrlTemplate", option: "--tracking-url-template <tracking-url-template>", name: "tracking_url_template", description: "Tracking page URL with {tracking_code} where the number goes; {postal_code} and {country} are also substituted, URL-encoded. Null for a carrier with no public tracking page.", type: "string", required: false },
];
shippingCarriers
  .command(`create`)
  .description(`A carrier row is one company shipping one class of service: it owns the tracking-URL template, the service level, the transit days, the pickup cut-off and the handling days, and every method that ships with it inherits all of those unless it states its own. A carrier selling both a parcel and an express product is two rows. Reach for it for a carrier this app does not describe — a regional courier, a forwarder, an own fleet; for the DACH networks read GET /shipping/carriers/catalog and let POST /shipping/carriers/defaults write them. A create cannot omit \`code\` and \`name\`; every other column is optional or defaulted by the database. Two rows of this tenant may not share \`code\` or \`external_id\` — that is the 409. \`service_level\` has to name one of the tenant's own levels and \`cutoff_time\` has to be HH:MM in 24-hour UTC — both are refused rather than stored, because a cut-off the estimator cannot read would be dropped in silence and the shop would keep promising a ship date nobody computed. Creating a carrier quotes nothing on its own: a method has to reference it (\`carrier_id\`, or a \`carrier\` text equal to this code) before any of it is inherited.`)
  .option(`--code <code>`, `Stable carrier code, unique per tenant (e.g. dhl, dpd, gls), in lower case. A method whose \`carrier\` text equals this code resolves to this carrier — that is the migration path off the free-text field — and a tracking request finds it by code without regard to case. A code with a capital letter is refused with 400 \`invalid_carrier_code\`; a carrier stored with one before 1.0 keeps it and keeps resolving.`)
  .option(`--name <name>`, `Display name, as an operator typed it.`)
  .option(`--countries [countries...]`, `The countries this carrier serves. ISO 3166-1 alpha-2 codes; null or an empty array means no restriction. Compared without regard to case, so a lower-case entry still matches; anything but a two-letter code is refused with 400 \`invalid_countries\`. Declared as an array rather than the bare object a jsonb column derives to — this one is always a list. ANDed with the method's own restriction: a method may not be offered into a country its carrier does not reach.`)
  .option(`--cutoff-time <cutoff-time>`, `This carrier's own daily pickup cut-off, HH:MM in 24-hour form, UTC. Overrides the tenant's cutoff_time for methods on this carrier — one shop-wide time cannot be both DHL's 16:00 and a forwarder's 12:00. Null or the empty string means this carrier declares none; any other shape is a 400, because a cut-off the estimator cannot read is a delivery promise silently computed without one.`)
  .option(`--eta-days-max <eta-days-max>`, `Transit time upper bound, in calendar days from the ship date.`, parseInteger)
  .option(`--eta-days-min <eta-days-min>`, `Transit time lower bound, in calendar days from the ship date — inherited by any method on this carrier that states no ETA of its own.`, parseInteger)
  .option(`--external-id <external-id>`, `The key this carrier has in the system that OWNS it — the shipping agent as an ERP numbers it, which is rarely the \`code\` a merchant types here. Unique per tenant where it is set, so a repeated import upserts on it instead of matching on a name; a carrier created in the Cockpit carries none and never will.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this carrier, keyed by system name — a second ERP, a TMS, the label printer's own agent list. \`external_id\` names the leading system; this is the rest, and the next one costs no column. Answered on read and carrying no query parameter: a jsonb column is compared as a WHOLE document, so a filter over part of one is refused. Look the row up by \`external_id\` and read this off the answer.`)
  .option(`--handling-days <handling-days>`, `Days needed to make a consignment ready for THIS carrier, added to the ship date before the transit days — a whole number, 0 or more. Overrides the tenant's handling_days.`, parseInteger)
  .option(`--labels <labels>`, `Localized display names. A flat map keyed by locale — the Cockpit falls back to \`en\`. Null means the row has no translations and every client shows the untranslated column instead.`)
  .option(`--metadata <metadata>`, `Free-form jsonb the platform never reads or validates — whatever the merchant or their integration needs to keep beside the row (a customer number with the carrier, an ERP key, a label-printer id). The shape varies BY INTEGRATION, not by anything this app knows, so no key is declared and none is reserved; the example is one plausible instance rather than a schema. A flat map of scalars is the convention, and nothing enforces it.`)
  .option(`--position <position>`, `Sort order among the carriers; ties fall back to whatever the database returns.`, parseInteger)
  .option(`--service-level <service-level>`, `The class of service this row represents (default 'standard'), as a CODE into the tenant's own service levels (GET /shipping/service-levels). One row is one class: a carrier selling both a parcel and an express product is two rows. Deliberately not an enum here — the set is the merchant's, so a fixed list in this contract would make the gateway reject a level they created. A code the tenant does not keep is a 400 naming the codes they do.`)
  .option(`--source-data <source-data>`, `What the source said about this row, kept as it said it: \`{"system": …, "etag": …, "raw": {…}}\`. The \`etag\` is what a write-back has to send back in \`If-Match\`, and there is nowhere else to keep it between two runs. \`raw\` holds the source fields this app does not model, so an edit here does not silently throw them away.`)
  .option(`--source-synced-at <source-synced-at>`, `When this row was last confirmed against its source. A delta run asks the source for what changed since it, and an operator reads it to see that a feed has gone quiet. An edit made HERE does not touch it — it records when the source was last seen, not when the row changed — so a stale value beside a fresh \`updated_at\` means somebody is maintaining by hand what a feed has stopped delivering.`)
  .option(`--status <status>`, `Whether this carrier may be quoted (default 'active'). Anything else excludes every method that ships with it from POST /shipping/rates, with a reason. Tracking links are NOT gated on it — a retired carrier's old shipments stay resolvable.`)
  .option(`--tracking-url-template <tracking-url-template>`, `Tracking page URL with {tracking_code} where the number goes; {postal_code} and {country} are also substituted, URL-encoded. Null for a carrier with no public tracking page.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, countries, cutoffTime, etaDaysMax, etaDaysMin, externalId, externalRefs, handlingDays, labels, metadata, position, serviceLevel, sourceData, sourceSyncedAt, status, trackingUrlTemplate } = await promptForMissing(
          _options,
          createSpecs,
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
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = resolveBodyParam(externalRefs);
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
        if (sourceData !== undefined) {
          _payload[`source_data`] = resolveBodyParam(sourceData);
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
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
registerPromptSpecs(shippingCarriers.commands.at(-1)!, createSpecs, { method: "post" });
shippingCarriers
  .command(`catalog`)
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
shippingCarriers
  .command(`defaults`)
  .description(`The four networks a DACH shop is expected to have — DHL, DPD, GLS and UPS — created by code, and only the ones that are missing. The app runs this itself on \`app.installed\`, so a fresh install already has them; calling it by hand afterwards is how a tenant that predates a catalog entry catches up, and calling it twice costs nothing, because it reconciles rather than seeds. An existing row belongs to the merchant: only columns that are genuinely EMPTY are filled in (a tracking template added to the catalog after their install), never a value they set. Nothing is deleted.`)
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
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/carriers", hasLimit: true } },
];
shippingCarriers
  .command(`delete`)
  .description(`Deleting one clears \`shipping_methods.carrier_id\` rather than deleting those rows — the foreign keys decide that, not this route. So a method that referenced this carrier keeps working and resolves through its \`carrier\` code instead, which is also why this never answers a conflict — and it is the reason to prefer \`status: 'retired'\` where the carrier is merely finished. What the method silently LOSES is everything it was inheriting: the tracking template, the pickup cut-off, the handling days and the transit days. Unless its \`carrier\` text still matches another carrier, its ship date is recomputed on the market's own cut-off and handling settings, and a method that stated no \`eta_days_min\`/\`max\` of its own stops carrying a \`delivery\` estimate altogether. Nothing errors; the promise in the checkout just changes.`)
  .option(`--id <id>`, `The row id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`shipping-carriers delete`);
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
registerPromptSpecs(shippingCarriers.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/carriers", hasLimit: true } },
];
shippingCarriers
  .command(`get`)
  .description(`A carrier row is one company shipping one class of service: it owns the tracking-URL template, the service level, the transit days, the pickup cut-off and the handling days, and every method that ships with it inherits all of those unless it states its own. A carrier selling both a parcel and an express product is two rows. Read it when you need to know what a method's delivery promise really is: \`cutoff_time\`, \`handling_days\` and \`eta_days_min\`/\`max\` are inherited from here, so a shop that seems to promise the wrong ship date is usually explained by this row rather than by the method. It does NOT say which methods ship with it — that is GET /shipping/methods?carrier_id=… for the ones holding a reference and ?carrier=… for the ones still resolving through the legacy code text.`)
  .option(`--id <id>`, `The row id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
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
registerPromptSpecs(shippingCarriers.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/carriers", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Stable carrier code, unique per tenant (e.g. dhl, dpd, gls), in lower case. A method whose `carrier` text equals this code resolves to this carrier — that is the migration path off the free-text field — and a tracking request finds it by code without regard to case. A code with a capital letter is refused with 400 `invalid_carrier_code`; a carrier stored with one before 1.0 keeps it and keeps resolving.", type: "string", required: false },
  { key: "countries", option: "--countries [countries...]", name: "countries", description: "The countries this carrier serves. ISO 3166-1 alpha-2 codes; null or an empty array means no restriction. Compared without regard to case, so a lower-case entry still matches; anything but a two-letter code is refused with 400 `invalid_countries`. Declared as an array rather than the bare object a jsonb column derives to — this one is always a list. ANDed with the method's own restriction: a method may not be offered into a country its carrier does not reach.", type: "array", required: false },
  { key: "cutoffTime", option: "--cutoff-time <cutoff-time>", name: "cutoff_time", description: "This carrier's own daily pickup cut-off, HH:MM in 24-hour form, UTC. Overrides the tenant's cutoff_time for methods on this carrier — one shop-wide time cannot be both DHL's 16:00 and a forwarder's 12:00. Null or the empty string means this carrier declares none; any other shape is a 400, because a cut-off the estimator cannot read is a delivery promise silently computed without one.", type: "string", required: false },
  { key: "etaDaysMax", option: "--eta-days-max <eta-days-max>", name: "eta_days_max", description: "Transit time upper bound, in calendar days from the ship date.", type: "integer", required: false },
  { key: "etaDaysMin", option: "--eta-days-min <eta-days-min>", name: "eta_days_min", description: "Transit time lower bound, in calendar days from the ship date — inherited by any method on this carrier that states no ETA of its own.", type: "integer", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key this carrier has in the system that OWNS it — the shipping agent as an ERP numbers it, which is rarely the `code` a merchant types here. Unique per tenant where it is set, so a repeated import upserts on it instead of matching on a name; a carrier created in the Cockpit carries none and never will.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this carrier, keyed by system name — a second ERP, a TMS, the label printer's own agent list. `external_id` names the leading system; this is the rest, and the next one costs no column. Answered on read and carrying no query parameter: a jsonb column is compared as a WHOLE document, so a filter over part of one is refused. Look the row up by `external_id` and read this off the answer.", type: "object", required: false },
  { key: "handlingDays", option: "--handling-days <handling-days>", name: "handling_days", description: "Days needed to make a consignment ready for THIS carrier, added to the ship date before the transit days — a whole number, 0 or more. Overrides the tenant's handling_days.", type: "integer", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names. A flat map keyed by locale — the Cockpit falls back to `en`. Null means the row has no translations and every client shows the untranslated column instead.", type: "object", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form jsonb the platform never reads or validates — whatever the merchant or their integration needs to keep beside the row (a customer number with the carrier, an ERP key, a label-printer id). The shape varies BY INTEGRATION, not by anything this app knows, so no key is declared and none is reserved; the example is one plausible instance rather than a schema. A flat map of scalars is the convention, and nothing enforces it.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name, as an operator typed it.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order among the carriers; ties fall back to whatever the database returns.", type: "integer", required: false },
  { key: "serviceLevel", option: "--service-level <service-level>", name: "service_level", description: "The class of service this row represents (default 'standard'), as a CODE into the tenant's own service levels (GET /shipping/service-levels). One row is one class: a carrier selling both a parcel and an express product is two rows. Deliberately not an enum here — the set is the merchant's, so a fixed list in this contract would make the gateway reject a level they created. A code the tenant does not keep is a 400 naming the codes they do.", type: "string", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "What the source said about this row, kept as it said it: `{\"system\": …, \"etag\": …, \"raw\": {…}}`. The `etag` is what a write-back has to send back in `If-Match`, and there is nowhere else to keep it between two runs. `raw` holds the source fields this app does not model, so an edit here does not silently throw them away.", type: "object", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When this row was last confirmed against its source. A delta run asks the source for what changed since it, and an operator reads it to see that a feed has gone quiet. An edit made HERE does not touch it — it records when the source was last seen, not when the row changed — so a stale value beside a fresh `updated_at` means somebody is maintaining by hand what a feed has stopped delivering.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Whether this carrier may be quoted (default 'active'). Anything else excludes every method that ships with it from POST /shipping/rates, with a reason. Tracking links are NOT gated on it — a retired carrier's old shipments stay resolvable.", type: "string", required: false, enum: ["active","paused","retired"] },
  { key: "trackingUrlTemplate", option: "--tracking-url-template <tracking-url-template>", name: "tracking_url_template", description: "Tracking page URL with {tracking_code} where the number goes; {postal_code} and {country} are also substituted, URL-encoded. Null for a carrier with no public tracking page.", type: "string", required: false },
];
shippingCarriers
  .command(`update`)
  .description(`A carrier row is one company shipping one class of service: it owns the tracking-URL template, the service level, the transit days, the pickup cut-off and the handling days, and every method that ships with it inherits all of those unless it states its own. A carrier selling both a parcel and an express product is two rows. A partial update — send only what changes, which is where a carrier is paused, given a different tracking template, or moved to another pickup cut-off or transit time. This is the one switch that acts on several methods at once, in both directions. Moving \`status\` off 'active' takes every method that ships with this carrier out of POST /shipping/rates with a reason, which beats disabling each of them and forgetting one; tracking links are deliberately not gated on it, so a retired carrier's old shipments stay resolvable. Editing \`cutoff_time\`, \`handling_days\` or \`eta_days_min\`/\`max\` MOVES THE PROMISED SHIP DATE of every method that states none of its own: the estimator adds the handling days, then one further day when the cut-off has already passed at the instant being evaluated — compared at or after, in UTC, and as calendar days that do not skip a weekend. Two rows of this tenant may not share \`code\` or \`external_id\` — that is the 409.`)
  .option(`--id <id>`, `The row id.`)
  .option(`--code <code>`, `Stable carrier code, unique per tenant (e.g. dhl, dpd, gls), in lower case. A method whose \`carrier\` text equals this code resolves to this carrier — that is the migration path off the free-text field — and a tracking request finds it by code without regard to case. A code with a capital letter is refused with 400 \`invalid_carrier_code\`; a carrier stored with one before 1.0 keeps it and keeps resolving.`)
  .option(`--countries [countries...]`, `The countries this carrier serves. ISO 3166-1 alpha-2 codes; null or an empty array means no restriction. Compared without regard to case, so a lower-case entry still matches; anything but a two-letter code is refused with 400 \`invalid_countries\`. Declared as an array rather than the bare object a jsonb column derives to — this one is always a list. ANDed with the method's own restriction: a method may not be offered into a country its carrier does not reach.`)
  .option(`--cutoff-time <cutoff-time>`, `This carrier's own daily pickup cut-off, HH:MM in 24-hour form, UTC. Overrides the tenant's cutoff_time for methods on this carrier — one shop-wide time cannot be both DHL's 16:00 and a forwarder's 12:00. Null or the empty string means this carrier declares none; any other shape is a 400, because a cut-off the estimator cannot read is a delivery promise silently computed without one.`)
  .option(`--eta-days-max <eta-days-max>`, `Transit time upper bound, in calendar days from the ship date.`, parseInteger)
  .option(`--eta-days-min <eta-days-min>`, `Transit time lower bound, in calendar days from the ship date — inherited by any method on this carrier that states no ETA of its own.`, parseInteger)
  .option(`--external-id <external-id>`, `The key this carrier has in the system that OWNS it — the shipping agent as an ERP numbers it, which is rarely the \`code\` a merchant types here. Unique per tenant where it is set, so a repeated import upserts on it instead of matching on a name; a carrier created in the Cockpit carries none and never will.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this carrier, keyed by system name — a second ERP, a TMS, the label printer's own agent list. \`external_id\` names the leading system; this is the rest, and the next one costs no column. Answered on read and carrying no query parameter: a jsonb column is compared as a WHOLE document, so a filter over part of one is refused. Look the row up by \`external_id\` and read this off the answer.`)
  .option(`--handling-days <handling-days>`, `Days needed to make a consignment ready for THIS carrier, added to the ship date before the transit days — a whole number, 0 or more. Overrides the tenant's handling_days.`, parseInteger)
  .option(`--labels <labels>`, `Localized display names. A flat map keyed by locale — the Cockpit falls back to \`en\`. Null means the row has no translations and every client shows the untranslated column instead.`)
  .option(`--metadata <metadata>`, `Free-form jsonb the platform never reads or validates — whatever the merchant or their integration needs to keep beside the row (a customer number with the carrier, an ERP key, a label-printer id). The shape varies BY INTEGRATION, not by anything this app knows, so no key is declared and none is reserved; the example is one plausible instance rather than a schema. A flat map of scalars is the convention, and nothing enforces it.`)
  .option(`--name <name>`, `Display name, as an operator typed it.`)
  .option(`--position <position>`, `Sort order among the carriers; ties fall back to whatever the database returns.`, parseInteger)
  .option(`--service-level <service-level>`, `The class of service this row represents (default 'standard'), as a CODE into the tenant's own service levels (GET /shipping/service-levels). One row is one class: a carrier selling both a parcel and an express product is two rows. Deliberately not an enum here — the set is the merchant's, so a fixed list in this contract would make the gateway reject a level they created. A code the tenant does not keep is a 400 naming the codes they do.`)
  .option(`--source-data <source-data>`, `What the source said about this row, kept as it said it: \`{"system": …, "etag": …, "raw": {…}}\`. The \`etag\` is what a write-back has to send back in \`If-Match\`, and there is nowhere else to keep it between two runs. \`raw\` holds the source fields this app does not model, so an edit here does not silently throw them away.`)
  .option(`--source-synced-at <source-synced-at>`, `When this row was last confirmed against its source. A delta run asks the source for what changed since it, and an operator reads it to see that a feed has gone quiet. An edit made HERE does not touch it — it records when the source was last seen, not when the row changed — so a stale value beside a fresh \`updated_at\` means somebody is maintaining by hand what a feed has stopped delivering.`)
  .option(`--status <status>`, `Whether this carrier may be quoted (default 'active'). Anything else excludes every method that ships with it from POST /shipping/rates, with a reason. Tracking links are NOT gated on it — a retired carrier's old shipments stay resolvable.`)
  .option(`--tracking-url-template <tracking-url-template>`, `Tracking page URL with {tracking_code} where the number goes; {postal_code} and {country} are also substituted, URL-encoded. Null for a carrier with no public tracking page.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, countries, cutoffTime, etaDaysMax, etaDaysMin, externalId, externalRefs, handlingDays, labels, metadata, name, position, serviceLevel, sourceData, sourceSyncedAt, status, trackingUrlTemplate } = await promptForMissing(
          _options,
          updateSpecs,
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
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = resolveBodyParam(externalRefs);
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
        if (sourceData !== undefined) {
          _payload[`source_data`] = resolveBodyParam(sourceData);
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
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
registerPromptSpecs(shippingCarriers.commands.at(-1)!, updateSpecs, { method: "put" });
const shippingTrackingSpecs: PromptSpec[] = [
  { key: "carrier", option: "--carrier <carrier>", name: "carrier", description: "Carrier code (what an order shipment already stores) or the carrier row id — a value matching the uuid form is read as the id, anything else as a code, case-insensitively. Must name a carrier THIS tenant keeps; one that does not is a 404.", type: "string", required: true },
  { key: "country", option: "--country <country>", name: "country", description: "Destination ISO 3166-1 alpha-2 code — only needed by a template that names {country}. Upper-cased before substitution.", type: "string", required: false },
  { key: "postalCode", option: "--postal-code <postal-code>", name: "postal_code", description: "Destination postcode — only needed by a template that names {postal_code}.", type: "string", required: false },
  { key: "trackingCode", option: "--tracking-code <tracking-code>", name: "tracking_code", description: "The carrier's tracking number. Required by every template that names {tracking_code}, which is all of them in the shipped catalog. URL-encoded before substitution, so a code with a space or a slash cannot reshape the link.", type: "string", required: false },
];
shippingCarriers
  .command(`shipping-tracking`)
  .description(`Hand in a carrier code and the tracking number printed on the label, and this answers the URL a buyer follows. The carrier owns the URL format, so nobody else has to. \`order_shipments\` stores a tracking_url per shipment today, which is one carrier's URL shape copied into every row — the day it changes, every historic link is wrong. Ask here instead. Tracking is NOT gated on carrier status: a retired carrier's old shipments stay resolvable.`)
  .option(`--carrier <carrier>`, `Carrier code (what an order shipment already stores) or the carrier row id — a value matching the uuid form is read as the id, anything else as a code, case-insensitively. Must name a carrier THIS tenant keeps; one that does not is a 404.`)
  .option(`--country <country>`, `Destination ISO 3166-1 alpha-2 code — only needed by a template that names {country}. Upper-cased before substitution.`)
  .option(`--postal-code <postal-code>`, `Destination postcode — only needed by a template that names {postal_code}.`)
  .option(`--tracking-code <tracking-code>`, `The carrier's tracking number. Required by every template that names {tracking_code}, which is all of them in the shipped catalog. URL-encoded before substitution, so a code with a space or a slash cannot reshape the link.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { carrier, country, postalCode, trackingCode } = await promptForMissing(
          _options,
          shippingTrackingSpecs,
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
registerPromptSpecs(shippingCarriers.commands.at(-1)!, shippingTrackingSpecs, { method: "post" });
