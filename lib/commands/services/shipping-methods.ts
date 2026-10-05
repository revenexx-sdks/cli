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

export const shippingMethods = new Command("shipping-methods")
  .description(
    commandDescriptions["shippingMethods"] ??
      `WHAT is offered, what it costs, and the answer a checkout gets. A shipping method is the line a buyer picks: a pricing model ('fixed', 'free' or 'matrix'), the countries it may be offered into, a free-above threshold, and the carrier it ships with. A matrix method prices off its own rate tiers — a lookup table of \`from_value\` → price, nested under the method, deleted with it — which is why they are one group and not two: a method with pricing_type 'matrix' and no tiers quotes nothing at all. POST /shipping/rates is the read side of everything in here: it takes the buyer context and answers with the methods that apply and their computed prices, plus an \`excluded\` list naming the ones that did not and why. The delivery promise on that answer is inherited from the carrier and is described under that group.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A value outside the range is clamped rather than refused, and `page.limit` echoes what was applied.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). The next page is `page.offset + page.returned`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc' — a bare 'column' sorts ascending. The column must be one this entity has; anything else is a 400 from the data plane.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Exact-match filter on `code`. Unique per tenant, so this resolves a code a checkout already holds without paging the whole list.", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Exact-match filter on `enabled`. Only enabled methods are ever quoted, so this is the storefront-facing subset.", type: "boolean", required: false },
  { key: "pricingType", option: "--pricing-type <pricing-type>", name: "pricing_type", description: "Exact-match filter on `pricing_type`. Pricing model — `matrix` is the set whose tiers a rate-matrix editor has to load.", type: "string", required: false, enum: ["fixed","free","matrix"] },
  { key: "carrierId", option: "--carrier-id <carrier-id>", name: "carrier_id", description: "Exact-match filter on `carrier_id`. The methods that ship with one carrier — what a merchant needs before pausing it. Matches `carrier_id` only, never the legacy `carrier` text.", type: "string", required: false },
  { key: "carrier", option: "--carrier <carrier>", name: "carrier", description: "Exact-match filter on `carrier`. The other half of that question: the methods still resolving their carrier through the legacy free-text CODE rather than a reference. Together with `?carrier_id=` this is how a merchant finds what a carrier is still holding before retiring it.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Exact-match filter on `external_id`. The method one foreign system owns, by the key that system knows it by — how an import finds the row it wrote last run instead of creating a second one. Unique per tenant, so this answers at most one method; a method nobody imported matches nothing.", type: "string", required: false },
  { key: "taxClass", option: "--tax-class <tax-class>", name: "tax_class", description: "Exact-match filter on `tax_class`. The methods naming one tax class — the same question GET /shipping/tax-classes/{code}/usage counts, when the caller wants the rows rather than the count. Only a method's OWN class; a method falling back to the tenant setting does not match.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
shippingMethods
  .command(`list`)
  .description(`Filterable by exact column value — \`?code=\`, \`?enabled=\`, \`?pricing_type=\`, \`?carrier_id=\`, \`?carrier=\` and \`?tax_class=\` are applied as equalities and echoed back in \`filter\`. \`?carrier_id=\` and \`?carrier=\` are the two halves of one question: the first finds the methods holding a reference, the second the ones still resolving through the legacy code text. A query key that names no column of this entity is SILENTLY IGNORED — \`?status=\` on this route is the trap, since carriers have a status and methods do not: the page comes back unfiltered, 200, with an empty \`filter\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A value outside the range is clamped rather than refused, and \`page.limit\` echoes what was applied.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). The next page is \`page.offset + page.returned\`.`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc' — a bare 'column' sorts ascending. The column must be one this entity has; anything else is a 400 from the data plane.`)
  .option(`--code <code>`, `Exact-match filter on \`code\`. Unique per tenant, so this resolves a code a checkout already holds without paging the whole list.`)
  .option(
    `--enabled [value]`,
    `Exact-match filter on \`enabled\`. Only enabled methods are ever quoted, so this is the storefront-facing subset.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--pricing-type <pricing-type>`, `Exact-match filter on \`pricing_type\`. Pricing model — \`matrix\` is the set whose tiers a rate-matrix editor has to load.`)
  .option(`--carrier-id <carrier-id>`, `Exact-match filter on \`carrier_id\`. The methods that ship with one carrier — what a merchant needs before pausing it. Matches \`carrier_id\` only, never the legacy \`carrier\` text.`)
  .option(`--carrier <carrier>`, `Exact-match filter on \`carrier\`. The other half of that question: the methods still resolving their carrier through the legacy free-text CODE rather than a reference. Together with \`?carrier_id=\` this is how a merchant finds what a carrier is still holding before retiring it.`)
  .option(`--external-id <external-id>`, `Exact-match filter on \`external_id\`. The method one foreign system owns, by the key that system knows it by — how an import finds the row it wrote last run instead of creating a second one. Unique per tenant, so this answers at most one method; a method nobody imported matches nothing.`)
  .option(`--tax-class <tax-class>`, `Exact-match filter on \`tax_class\`. The methods naming one tax class — the same question GET /shipping/tax-classes/{code}/usage counts, when the caller wants the rows rather than the count. Only a method's OWN class; a method falling back to the tenant setting does not match.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, code, enabled, pricingType, carrierId, carrier, externalId, taxClass, filter } = await promptForMissing(
          _options,
          listSpecs,
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
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (pricingType !== undefined) {
          _payload[`pricing_type`] = pricingType;
        }
        if (carrierId !== undefined) {
          _payload[`carrier_id`] = carrierId;
        }
        if (carrier !== undefined) {
          _payload[`carrier`] = carrier;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (taxClass !== undefined) {
          _payload[`tax_class`] = taxClass;
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
registerPromptSpecs(shippingMethods.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Stable method code, unique per tenant (e.g. standard, express). What a checkout and an order line store, so it is the value every integration joins on.", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "Display name shown in the checkout.", type: "string", required: true },
  { key: "carrier", option: "--carrier <carrier>", name: "carrier", description: "Carrier CODE, kept from before shipping_carriers existed. Looked up in the carrier table when carrier_id is not set, so an existing value keeps working and gains a tracking template; a code nobody maintains is still reported as a plain name.", type: "string", required: false },
  { key: "carrierId", option: "--carrier-id <carrier-id>", name: "carrier_id", description: "The carrier this method ships with. Wins over `carrier` and supplies the tracking template, pickup cut-off, handling time and transit days.", type: "string", required: false },
  { key: "countries", option: "--countries [countries...]", name: "countries", description: "The countries this method may be offered into. ISO 3166-1 alpha-2 codes; null or an empty array means no restriction. Compared without regard to case, so a lower-case entry still matches; anything but a two-letter code is refused with 400 `invalid_countries`. Declared as an array rather than the bare object a jsonb column derives to — this one is always a list. ANDed with the carrier's own reach.", type: "array", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default EUR) the price, the free-above threshold and the tiers are in. Exactly three characters — the column says so. Every rate carries it, and a rate request naming another currency is not offered this method: this app converts nothing.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "The sentence under the name in the checkout — the delivery promise in words. Null when the name says enough.", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Only enabled methods are ever quoted (default false); a disabled one is reported in `excluded` rather than hidden.", type: "boolean", required: false },
  { key: "etaDaysMax", option: "--eta-days-max <eta-days-max>", name: "eta_days_max", description: "Transit time upper bound in calendar days. Falls back to the carrier's when null.", type: "integer", required: false },
  { key: "etaDaysMin", option: "--eta-days-min <eta-days-min>", name: "eta_days_min", description: "Transit time lower bound in calendar days, for the checkout. Falls back to the carrier's when null.", type: "integer", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key this method has in the system that OWNS it — the shipment method as an ERP numbers it, which is rarely the `code` a checkout stores. Unique per tenant where it is set, so a repeated import upserts on it instead of matching on a name; a method a merchant maintains here carries none.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this method, keyed by system name — a second ERP, a marketplace's own carrier code, the shop this catalogue was migrated from. `external_id` names the leading system; this is the rest. Answered on read and carrying no query parameter: a jsonb column is compared as a WHOLE document, so a filter over part of one is refused. Look the row up by `external_id` and read this off the answer.", type: "object", required: false },
  { key: "freeAbove", option: "--free-above <free-above>", name: "free_above", description: "Free shipping at or above this order value — wins over every pricing model, including a matrix. Compared net or gross as the market's free_above_compares setting declares. Null falls back to the tenant's shop-wide free_shipping_threshold; a negative amount is refused with 400 `invalid_free_above`.", type: "number", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names. A flat map keyed by locale — the Cockpit falls back to `en`. Null means the row has no translations and every client shows the untranslated column instead.", type: "object", required: false },
  { key: "matrixAttribute", option: "--matrix-attribute <matrix-attribute>", name: "matrix_attribute", description: "Attribute name for matrix_basis 'attribute' — the key the rate request's `attributes` map is read at, and required with that basis (400 `matrix_attribute_required`). Free text: the set of attributes is the catalogue's, not this app's.", type: "string", required: false },
  { key: "matrixBasis", option: "--matrix-basis <matrix-basis>", name: "matrix_basis", description: "The measure a matrix method prices its tiers over: total basket weight (in the market's weight unit), total item count, order value (the net or gross figure the market's free_above_compares names, else the bare order_value), or 'attribute' — any number the rate request carries under matrix_attribute. Null falls back to the tenant's matrix_basis_default. Ignored unless pricing_type is 'matrix'.", type: "string", required: false, enum: ["weight","quantity","order_value","attribute"] },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form jsonb the platform never reads or validates — whatever the merchant or their integration needs to keep beside the row (a customer number with the carrier, an ERP key, a label-printer id). The shape varies BY INTEGRATION, not by anything this app knows, so no key is declared and none is reserved; the example is one plausible instance rather than a schema. A flat map of scalars is the convention, and nothing enforces it.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order in the checkout (default 0) — a rate answer is returned in this order.", type: "integer", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "The fixed price (default 0), in `currency` — ignored for 'free' and 'matrix'.", type: "number", required: false },
  { key: "pricingType", option: "--pricing-type <pricing-type>", name: "pricing_type", description: "Pricing model (default 'fixed'): 'fixed' is one price for every basket, 'free' is no price at all, 'matrix' is a tiered price read off this method's rate tiers. Only 'matrix' looks at matrix_basis, quote_above and the tier table.", type: "string", required: false, enum: ["fixed","free","matrix"] },
  { key: "quoteAbove", option: "--quote-above <quote-above>", name: "quote_above", description: "Above this MATRIX MEASURE the method carries no automatic price: it is still offered, flagged `quote_required` with a reason, and the storefront shows 'shipping on request'. For bulky or overweight freight priced by hand. Null = every measure is priced automatically. A 'matrix' method only: set on any other, or left in place while the method moves off 'matrix', it is refused with 400 `quote_above_not_matrix`.", type: "number", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "What the source said about this row, kept as it said it: `{\"system\": …, \"etag\": …, \"raw\": {…}}`. The `etag` is what a write-back has to send back in `If-Match`, and there is nowhere else to keep it between two runs. `raw` holds the source fields this app does not model, so an edit here does not silently throw them away.", type: "object", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When this row was last confirmed against its source. A delta run asks the source for what changed since it, and an operator reads it to see that a feed has gone quiet. An edit made HERE does not touch it — it records when the source was last seen, not when the row changed — so a stale value beside a fresh `updated_at` means somebody is maintaining by hand what a feed has stopped delivering.", type: "string", required: false },
  { key: "taxClass", option: "--tax-class <tax-class>", name: "tax_class", description: "This method's own tax class, as a CODE into the buyer market's tax classes (markets.tax_classes) — never a rate. First step of the tax chain: unset falls back to the tenant's shipping_tax_class setting, then the market default. Not a foreign key and it could not be (ADR-0055); GET /shipping/tax-classes/{code}/usage is the integrity question markets asks in its place.", type: "string", required: false },
];
shippingMethods
  .command(`create`)
  .description(`A shipping method is the line a buyer picks in the checkout: a pricing model ('fixed', 'free' or 'matrix'), the countries it may be offered into, a free-above threshold, and the carrier it ships with. The method owns the PRICE; the delivery promise — tracking template, cut-off, handling and transit days — is inherited from the carrier wherever the method states none of its own. A create cannot omit \`code\` and \`name\`; every other column is optional or defaulted by the database. Two rows of this tenant may not share \`code\` or \`external_id\` — that is the 409. The new method is quoted by nobody until two further things are true: \`enabled\` defaults to FALSE, and a 'matrix' method has no tiers yet — until POST or PUT …/tiers gives it some it appears in \`excluded\` with 'matrix has no rate tiers configured' rather than in the rates. \`carrier_id\` and the legacy \`carrier\` code are both accepted and neither is verified against the carrier table here: an unmatched code is a plain carrier name on the rate, not an error.`)
  .option(`--code <code>`, `Stable method code, unique per tenant (e.g. standard, express). What a checkout and an order line store, so it is the value every integration joins on.`)
  .option(`--name <name>`, `Display name shown in the checkout.`)
  .option(`--carrier <carrier>`, `Carrier CODE, kept from before shipping_carriers existed. Looked up in the carrier table when carrier_id is not set, so an existing value keeps working and gains a tracking template; a code nobody maintains is still reported as a plain name.`)
  .option(`--carrier-id <carrier-id>`, `The carrier this method ships with. Wins over \`carrier\` and supplies the tracking template, pickup cut-off, handling time and transit days.`)
  .option(`--countries [countries...]`, `The countries this method may be offered into. ISO 3166-1 alpha-2 codes; null or an empty array means no restriction. Compared without regard to case, so a lower-case entry still matches; anything but a two-letter code is refused with 400 \`invalid_countries\`. Declared as an array rather than the bare object a jsonb column derives to — this one is always a list. ANDed with the carrier's own reach.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR) the price, the free-above threshold and the tiers are in. Exactly three characters — the column says so. Every rate carries it, and a rate request naming another currency is not offered this method: this app converts nothing.`)
  .option(`--description <description>`, `The sentence under the name in the checkout — the delivery promise in words. Null when the name says enough.`)
  .option(
    `--enabled [value]`,
    `Only enabled methods are ever quoted (default false); a disabled one is reported in \`excluded\` rather than hidden.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--eta-days-max <eta-days-max>`, `Transit time upper bound in calendar days. Falls back to the carrier's when null.`, parseInteger)
  .option(`--eta-days-min <eta-days-min>`, `Transit time lower bound in calendar days, for the checkout. Falls back to the carrier's when null.`, parseInteger)
  .option(`--external-id <external-id>`, `The key this method has in the system that OWNS it — the shipment method as an ERP numbers it, which is rarely the \`code\` a checkout stores. Unique per tenant where it is set, so a repeated import upserts on it instead of matching on a name; a method a merchant maintains here carries none.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this method, keyed by system name — a second ERP, a marketplace's own carrier code, the shop this catalogue was migrated from. \`external_id\` names the leading system; this is the rest. Answered on read and carrying no query parameter: a jsonb column is compared as a WHOLE document, so a filter over part of one is refused. Look the row up by \`external_id\` and read this off the answer.`)
  .option(`--free-above <free-above>`, `Free shipping at or above this order value — wins over every pricing model, including a matrix. Compared net or gross as the market's free_above_compares setting declares. Null falls back to the tenant's shop-wide free_shipping_threshold; a negative amount is refused with 400 \`invalid_free_above\`.`, parseInteger)
  .option(`--labels <labels>`, `Localized display names. A flat map keyed by locale — the Cockpit falls back to \`en\`. Null means the row has no translations and every client shows the untranslated column instead.`)
  .option(`--matrix-attribute <matrix-attribute>`, `Attribute name for matrix_basis 'attribute' — the key the rate request's \`attributes\` map is read at, and required with that basis (400 \`matrix_attribute_required\`). Free text: the set of attributes is the catalogue's, not this app's.`)
  .option(`--matrix-basis <matrix-basis>`, `The measure a matrix method prices its tiers over: total basket weight (in the market's weight unit), total item count, order value (the net or gross figure the market's free_above_compares names, else the bare order_value), or 'attribute' — any number the rate request carries under matrix_attribute. Null falls back to the tenant's matrix_basis_default. Ignored unless pricing_type is 'matrix'.`)
  .option(`--metadata <metadata>`, `Free-form jsonb the platform never reads or validates — whatever the merchant or their integration needs to keep beside the row (a customer number with the carrier, an ERP key, a label-printer id). The shape varies BY INTEGRATION, not by anything this app knows, so no key is declared and none is reserved; the example is one plausible instance rather than a schema. A flat map of scalars is the convention, and nothing enforces it.`)
  .option(`--position <position>`, `Sort order in the checkout (default 0) — a rate answer is returned in this order.`, parseInteger)
  .option(`--price <price>`, `The fixed price (default 0), in \`currency\` — ignored for 'free' and 'matrix'.`, parseInteger)
  .option(`--pricing-type <pricing-type>`, `Pricing model (default 'fixed'): 'fixed' is one price for every basket, 'free' is no price at all, 'matrix' is a tiered price read off this method's rate tiers. Only 'matrix' looks at matrix_basis, quote_above and the tier table.`)
  .option(`--quote-above <quote-above>`, `Above this MATRIX MEASURE the method carries no automatic price: it is still offered, flagged \`quote_required\` with a reason, and the storefront shows 'shipping on request'. For bulky or overweight freight priced by hand. Null = every measure is priced automatically. A 'matrix' method only: set on any other, or left in place while the method moves off 'matrix', it is refused with 400 \`quote_above_not_matrix\`.`, parseInteger)
  .option(`--source-data <source-data>`, `What the source said about this row, kept as it said it: \`{"system": …, "etag": …, "raw": {…}}\`. The \`etag\` is what a write-back has to send back in \`If-Match\`, and there is nowhere else to keep it between two runs. \`raw\` holds the source fields this app does not model, so an edit here does not silently throw them away.`)
  .option(`--source-synced-at <source-synced-at>`, `When this row was last confirmed against its source. A delta run asks the source for what changed since it, and an operator reads it to see that a feed has gone quiet. An edit made HERE does not touch it — it records when the source was last seen, not when the row changed — so a stale value beside a fresh \`updated_at\` means somebody is maintaining by hand what a feed has stopped delivering.`)
  .option(`--tax-class <tax-class>`, `This method's own tax class, as a CODE into the buyer market's tax classes (markets.tax_classes) — never a rate. First step of the tax chain: unset falls back to the tenant's shipping_tax_class setting, then the market default. Not a foreign key and it could not be (ADR-0055); GET /shipping/tax-classes/{code}/usage is the integrity question markets asks in its place.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, carrier, carrierId, countries, currency, description, enabled, etaDaysMax, etaDaysMin, externalId, externalRefs, freeAbove, labels, matrixAttribute, matrixBasis, metadata, position, price, pricingType, quoteAbove, sourceData, sourceSyncedAt, taxClass } = await promptForMissing(
          _options,
          createSpecs,
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
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = resolveBodyParam(externalRefs);
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
        if (quoteAbove !== undefined) {
          _payload[`quote_above`] = quoteAbove;
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = resolveBodyParam(sourceData);
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
        }
        if (taxClass !== undefined) {
          _payload[`tax_class`] = taxClass;
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
registerPromptSpecs(shippingMethods.commands.at(-1)!, createSpecs, { method: "post" });
shippingMethods
  .command(`defaults`)
  .description(`Runs the carrier seed first, then creates any missing method: the three lines a shop is expected to offer — standard, express and pickup. The app runs this itself on \`app.installed\`, so a fresh install already has them; calling it by hand afterwards is how a tenant that deleted one gets it back, and calling it twice costs nothing, because it reconciles rather than seeds. The seeded methods deliberately name no carrier: which carrier carries the standard method is a contract, not a default, and a method that says 'dhl' resolves to the seeded DHL row anyway.`)
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
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
];
shippingMethods
  .command(`delete`)
  .description(`Deleting one takes every \`shipping_rate_tiers\` row that points at it with it — the foreign keys decide that, not this route. So the whole rate matrix goes with the method, which is also why this never answers a conflict and why there is no way to recover the table afterwards — for a method a checkout may still be holding in a session, \`enabled: false\` is the safer edit.`)
  .option(`--id <id>`, `The row id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`shipping-methods delete`);
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
registerPromptSpecs(shippingMethods.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
];
shippingMethods
  .command(`get`)
  .description(`A shipping method is the line a buyer picks in the checkout: a pricing model ('fixed', 'free' or 'matrix'), the countries it may be offered into, a free-above threshold, and the carrier it ships with. The method owns the PRICE; the delivery promise — tracking template, cut-off, handling and transit days — is inherited from the carrier wherever the method states none of its own. This is the CONFIGURATION of one, by row id — not what a buyer would be charged. A matrix method's prices are not in here at all: they are its rate tiers, GET /shipping/methods/{method_id}/tiers, and the price for a given basket is POST /shipping/rates, which is the only place free-above thresholds, country restrictions, the carrier's reach and tax are applied. A checkout that reads \`price\` off this row prices a matrix method at 0.`)
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
registerPromptSpecs(shippingMethods.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "carrier", option: "--carrier <carrier>", name: "carrier", description: "Carrier CODE, kept from before shipping_carriers existed. Looked up in the carrier table when carrier_id is not set, so an existing value keeps working and gains a tracking template; a code nobody maintains is still reported as a plain name.", type: "string", required: false },
  { key: "carrierId", option: "--carrier-id <carrier-id>", name: "carrier_id", description: "The carrier this method ships with. Wins over `carrier` and supplies the tracking template, pickup cut-off, handling time and transit days.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Stable method code, unique per tenant (e.g. standard, express). What a checkout and an order line store, so it is the value every integration joins on.", type: "string", required: false },
  { key: "countries", option: "--countries [countries...]", name: "countries", description: "The countries this method may be offered into. ISO 3166-1 alpha-2 codes; null or an empty array means no restriction. Compared without regard to case, so a lower-case entry still matches; anything but a two-letter code is refused with 400 `invalid_countries`. Declared as an array rather than the bare object a jsonb column derives to — this one is always a list. ANDed with the carrier's own reach.", type: "array", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default EUR) the price, the free-above threshold and the tiers are in. Exactly three characters — the column says so. Every rate carries it, and a rate request naming another currency is not offered this method: this app converts nothing.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "The sentence under the name in the checkout — the delivery promise in words. Null when the name says enough.", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Only enabled methods are ever quoted (default false); a disabled one is reported in `excluded` rather than hidden.", type: "boolean", required: false },
  { key: "etaDaysMax", option: "--eta-days-max <eta-days-max>", name: "eta_days_max", description: "Transit time upper bound in calendar days. Falls back to the carrier's when null.", type: "integer", required: false },
  { key: "etaDaysMin", option: "--eta-days-min <eta-days-min>", name: "eta_days_min", description: "Transit time lower bound in calendar days, for the checkout. Falls back to the carrier's when null.", type: "integer", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key this method has in the system that OWNS it — the shipment method as an ERP numbers it, which is rarely the `code` a checkout stores. Unique per tenant where it is set, so a repeated import upserts on it instead of matching on a name; a method a merchant maintains here carries none.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this method, keyed by system name — a second ERP, a marketplace's own carrier code, the shop this catalogue was migrated from. `external_id` names the leading system; this is the rest. Answered on read and carrying no query parameter: a jsonb column is compared as a WHOLE document, so a filter over part of one is refused. Look the row up by `external_id` and read this off the answer.", type: "object", required: false },
  { key: "freeAbove", option: "--free-above <free-above>", name: "free_above", description: "Free shipping at or above this order value — wins over every pricing model, including a matrix. Compared net or gross as the market's free_above_compares setting declares. Null falls back to the tenant's shop-wide free_shipping_threshold; a negative amount is refused with 400 `invalid_free_above`.", type: "number", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names. A flat map keyed by locale — the Cockpit falls back to `en`. Null means the row has no translations and every client shows the untranslated column instead.", type: "object", required: false },
  { key: "matrixAttribute", option: "--matrix-attribute <matrix-attribute>", name: "matrix_attribute", description: "Attribute name for matrix_basis 'attribute' — the key the rate request's `attributes` map is read at, and required with that basis (400 `matrix_attribute_required`). Free text: the set of attributes is the catalogue's, not this app's.", type: "string", required: false },
  { key: "matrixBasis", option: "--matrix-basis <matrix-basis>", name: "matrix_basis", description: "The measure a matrix method prices its tiers over: total basket weight (in the market's weight unit), total item count, order value (the net or gross figure the market's free_above_compares names, else the bare order_value), or 'attribute' — any number the rate request carries under matrix_attribute. Null falls back to the tenant's matrix_basis_default. Ignored unless pricing_type is 'matrix'.", type: "string", required: false, enum: ["weight","quantity","order_value","attribute"] },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form jsonb the platform never reads or validates — whatever the merchant or their integration needs to keep beside the row (a customer number with the carrier, an ERP key, a label-printer id). The shape varies BY INTEGRATION, not by anything this app knows, so no key is declared and none is reserved; the example is one plausible instance rather than a schema. A flat map of scalars is the convention, and nothing enforces it.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name shown in the checkout.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order in the checkout (default 0) — a rate answer is returned in this order.", type: "integer", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "The fixed price (default 0), in `currency` — ignored for 'free' and 'matrix'.", type: "number", required: false },
  { key: "pricingType", option: "--pricing-type <pricing-type>", name: "pricing_type", description: "Pricing model (default 'fixed'): 'fixed' is one price for every basket, 'free' is no price at all, 'matrix' is a tiered price read off this method's rate tiers. Only 'matrix' looks at matrix_basis, quote_above and the tier table.", type: "string", required: false, enum: ["fixed","free","matrix"] },
  { key: "quoteAbove", option: "--quote-above <quote-above>", name: "quote_above", description: "Above this MATRIX MEASURE the method carries no automatic price: it is still offered, flagged `quote_required` with a reason, and the storefront shows 'shipping on request'. For bulky or overweight freight priced by hand. Null = every measure is priced automatically. A 'matrix' method only: set on any other, or left in place while the method moves off 'matrix', it is refused with 400 `quote_above_not_matrix`.", type: "number", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "What the source said about this row, kept as it said it: `{\"system\": …, \"etag\": …, \"raw\": {…}}`. The `etag` is what a write-back has to send back in `If-Match`, and there is nowhere else to keep it between two runs. `raw` holds the source fields this app does not model, so an edit here does not silently throw them away.", type: "object", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When this row was last confirmed against its source. A delta run asks the source for what changed since it, and an operator reads it to see that a feed has gone quiet. An edit made HERE does not touch it — it records when the source was last seen, not when the row changed — so a stale value beside a fresh `updated_at` means somebody is maintaining by hand what a feed has stopped delivering.", type: "string", required: false },
  { key: "taxClass", option: "--tax-class <tax-class>", name: "tax_class", description: "This method's own tax class, as a CODE into the buyer market's tax classes (markets.tax_classes) — never a rate. First step of the tax chain: unset falls back to the tenant's shipping_tax_class setting, then the market default. Not a foreign key and it could not be (ADR-0055); GET /shipping/tax-classes/{code}/usage is the integrity question markets asks in its place.", type: "string", required: false },
];
shippingMethods
  .command(`update`)
  .description(`A shipping method is the line a buyer picks in the checkout: a pricing model ('fixed', 'free' or 'matrix'), the countries it may be offered into, a free-above threshold, and the carrier it ships with. The method owns the PRICE; the delivery promise — tracking template, cut-off, handling and transit days — is inherited from the carrier wherever the method states none of its own. A partial update — send only what changes, whether that is taking the method in or out of the checkout, its pricing, the countries it is restricted to or the delivery estimate it states of its own; a payload carrying no column at all is refused rather than answering a row it did not touch. Flipping \`enabled\` is what puts the method in front of a buyer or takes it away, and a disabled method is reported in the rate answer's \`excluded\` rather than hidden. Changing \`pricing_type\` away from 'matrix' does NOT delete the tier table — it stops being read, and changing back reinstates the old prices, so a method switched to 'fixed' and back quotes what it quoted before. Two rows of this tenant may not share \`code\` or \`external_id\` — that is the 409.`)
  .option(`--id <id>`, `The row id.`)
  .option(`--carrier <carrier>`, `Carrier CODE, kept from before shipping_carriers existed. Looked up in the carrier table when carrier_id is not set, so an existing value keeps working and gains a tracking template; a code nobody maintains is still reported as a plain name.`)
  .option(`--carrier-id <carrier-id>`, `The carrier this method ships with. Wins over \`carrier\` and supplies the tracking template, pickup cut-off, handling time and transit days.`)
  .option(`--code <code>`, `Stable method code, unique per tenant (e.g. standard, express). What a checkout and an order line store, so it is the value every integration joins on.`)
  .option(`--countries [countries...]`, `The countries this method may be offered into. ISO 3166-1 alpha-2 codes; null or an empty array means no restriction. Compared without regard to case, so a lower-case entry still matches; anything but a two-letter code is refused with 400 \`invalid_countries\`. Declared as an array rather than the bare object a jsonb column derives to — this one is always a list. ANDed with the carrier's own reach.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR) the price, the free-above threshold and the tiers are in. Exactly three characters — the column says so. Every rate carries it, and a rate request naming another currency is not offered this method: this app converts nothing.`)
  .option(`--description <description>`, `The sentence under the name in the checkout — the delivery promise in words. Null when the name says enough.`)
  .option(
    `--enabled [value]`,
    `Only enabled methods are ever quoted (default false); a disabled one is reported in \`excluded\` rather than hidden.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--eta-days-max <eta-days-max>`, `Transit time upper bound in calendar days. Falls back to the carrier's when null.`, parseInteger)
  .option(`--eta-days-min <eta-days-min>`, `Transit time lower bound in calendar days, for the checkout. Falls back to the carrier's when null.`, parseInteger)
  .option(`--external-id <external-id>`, `The key this method has in the system that OWNS it — the shipment method as an ERP numbers it, which is rarely the \`code\` a checkout stores. Unique per tenant where it is set, so a repeated import upserts on it instead of matching on a name; a method a merchant maintains here carries none.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this method, keyed by system name — a second ERP, a marketplace's own carrier code, the shop this catalogue was migrated from. \`external_id\` names the leading system; this is the rest. Answered on read and carrying no query parameter: a jsonb column is compared as a WHOLE document, so a filter over part of one is refused. Look the row up by \`external_id\` and read this off the answer.`)
  .option(`--free-above <free-above>`, `Free shipping at or above this order value — wins over every pricing model, including a matrix. Compared net or gross as the market's free_above_compares setting declares. Null falls back to the tenant's shop-wide free_shipping_threshold; a negative amount is refused with 400 \`invalid_free_above\`.`, parseInteger)
  .option(`--labels <labels>`, `Localized display names. A flat map keyed by locale — the Cockpit falls back to \`en\`. Null means the row has no translations and every client shows the untranslated column instead.`)
  .option(`--matrix-attribute <matrix-attribute>`, `Attribute name for matrix_basis 'attribute' — the key the rate request's \`attributes\` map is read at, and required with that basis (400 \`matrix_attribute_required\`). Free text: the set of attributes is the catalogue's, not this app's.`)
  .option(`--matrix-basis <matrix-basis>`, `The measure a matrix method prices its tiers over: total basket weight (in the market's weight unit), total item count, order value (the net or gross figure the market's free_above_compares names, else the bare order_value), or 'attribute' — any number the rate request carries under matrix_attribute. Null falls back to the tenant's matrix_basis_default. Ignored unless pricing_type is 'matrix'.`)
  .option(`--metadata <metadata>`, `Free-form jsonb the platform never reads or validates — whatever the merchant or their integration needs to keep beside the row (a customer number with the carrier, an ERP key, a label-printer id). The shape varies BY INTEGRATION, not by anything this app knows, so no key is declared and none is reserved; the example is one plausible instance rather than a schema. A flat map of scalars is the convention, and nothing enforces it.`)
  .option(`--name <name>`, `Display name shown in the checkout.`)
  .option(`--position <position>`, `Sort order in the checkout (default 0) — a rate answer is returned in this order.`, parseInteger)
  .option(`--price <price>`, `The fixed price (default 0), in \`currency\` — ignored for 'free' and 'matrix'.`, parseInteger)
  .option(`--pricing-type <pricing-type>`, `Pricing model (default 'fixed'): 'fixed' is one price for every basket, 'free' is no price at all, 'matrix' is a tiered price read off this method's rate tiers. Only 'matrix' looks at matrix_basis, quote_above and the tier table.`)
  .option(`--quote-above <quote-above>`, `Above this MATRIX MEASURE the method carries no automatic price: it is still offered, flagged \`quote_required\` with a reason, and the storefront shows 'shipping on request'. For bulky or overweight freight priced by hand. Null = every measure is priced automatically. A 'matrix' method only: set on any other, or left in place while the method moves off 'matrix', it is refused with 400 \`quote_above_not_matrix\`.`, parseInteger)
  .option(`--source-data <source-data>`, `What the source said about this row, kept as it said it: \`{"system": …, "etag": …, "raw": {…}}\`. The \`etag\` is what a write-back has to send back in \`If-Match\`, and there is nowhere else to keep it between two runs. \`raw\` holds the source fields this app does not model, so an edit here does not silently throw them away.`)
  .option(`--source-synced-at <source-synced-at>`, `When this row was last confirmed against its source. A delta run asks the source for what changed since it, and an operator reads it to see that a feed has gone quiet. An edit made HERE does not touch it — it records when the source was last seen, not when the row changed — so a stale value beside a fresh \`updated_at\` means somebody is maintaining by hand what a feed has stopped delivering.`)
  .option(`--tax-class <tax-class>`, `This method's own tax class, as a CODE into the buyer market's tax classes (markets.tax_classes) — never a rate. First step of the tax chain: unset falls back to the tenant's shipping_tax_class setting, then the market default. Not a foreign key and it could not be (ADR-0055); GET /shipping/tax-classes/{code}/usage is the integrity question markets asks in its place.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, carrier, carrierId, code, countries, currency, description, enabled, etaDaysMax, etaDaysMin, externalId, externalRefs, freeAbove, labels, matrixAttribute, matrixBasis, metadata, name, position, price, pricingType, quoteAbove, sourceData, sourceSyncedAt, taxClass } = await promptForMissing(
          _options,
          updateSpecs,
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
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = resolveBodyParam(externalRefs);
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
        if (quoteAbove !== undefined) {
          _payload[`quote_above`] = quoteAbove;
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = resolveBodyParam(sourceData);
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
        }
        if (taxClass !== undefined) {
          _payload[`tax_class`] = taxClass;
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
registerPromptSpecs(shippingMethods.commands.at(-1)!, updateSpecs, { method: "put" });
const shippingTiersListSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", description: "The shipping method these tiers belong to. A method this tenant does not have is a 404, never an empty page.", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A value outside the range is clamped rather than refused, and `page.limit` echoes what was applied.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). The next page is `page.offset + page.returned`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc' — a bare 'column' sorts ascending. The column must be one this entity has; anything else is a 400 from the data plane.", type: "string", required: false },
  { key: "fromValue", option: "--from-value <from-value>", name: "from_value", description: "Exact-match filter on `from_value`. The tier at exactly this threshold. (tenant_id, method_id, from_value) is unique, so this addresses one row of the matrix by what it MEANS rather than by an id a bulk replace has already thrown away.", type: "number", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
shippingMethods
  .command(`shipping-tiers-list`)
  .description(`The rate matrix of one method — every \`from_value\` threshold with the price charged at or above it — lowest threshold first. Filterable by \`?from_value=\` — the unique index is (tenant_id, method_id, from_value), so that addresses one row of the matrix by the threshold it prices rather than by an id a bulk replace has already discarded. The applied filters are echoed in \`filter\`, which always carries the \`method_id\` taken from the path.`)
  .option(`--method-id <method-id>`, `The shipping method these tiers belong to. A method this tenant does not have is a 404, never an empty page.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A value outside the range is clamped rather than refused, and \`page.limit\` echoes what was applied.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). The next page is \`page.offset + page.returned\`.`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc' — a bare 'column' sorts ascending. The column must be one this entity has; anything else is a 400 from the data plane.`)
  .option(`--from-value <from-value>`, `Exact-match filter on \`from_value\`. The tier at exactly this threshold. (tenant_id, method_id, from_value) is unique, so this addresses one row of the matrix by what it MEANS rather than by an id a bulk replace has already thrown away.`, parseInteger)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, limit, offset, order, fromValue, filter } = await promptForMissing(
          _options,
          shippingTiersListSpecs,
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
        if (fromValue !== undefined) {
          _payload[`from_value`] = fromValue;
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
registerPromptSpecs(shippingMethods.commands.at(-1)!, shippingTiersListSpecs, { method: "get" });
const shippingTiersCreateSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", description: "The shipping method these tiers belong to. A method this tenant does not have is a 404, never an empty page.", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "fromValue", option: "--from-value <from-value>", name: "from_value", description: "Lower bound of this tier, in the method's matrix measure — kilograms (or whatever the market's `weight_unit` names, converted through its factor) for a weight matrix, items for quantity, money in the method's currency for order_value, and the raw attribute value for 'attribute'. INCLUSIVE: the tier applies from this value upward, and the tier that wins is the one with the highest from_value at or below the measured value, so a measure of exactly 10 is priced by the tier at 10 rather than the one below it. The last tier has no upper bound. Unique per method — a second tier at the same threshold is a 409, because which of the two won would be whatever the database returned first. Defaults to 0.", type: "number", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Display order in the matrix editor (default 0; a bulk replace derives it from the array index). Pricing reads from_value, never this.", type: "integer", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "What this tier costs, in the method's currency. Charged in full for the whole consignment — a matrix is a lookup table, not a rate per unit. Defaults to 0.", type: "number", required: false },
];
shippingMethods
  .command(`shipping-tiers-create`)
  .description(`A rate tier is one row of a matrix method's price table: a \`from_value\` threshold and the price charged at or above it. The bound is INCLUSIVE and the winning tier is the one with the highest \`from_value\` at or below the measured value, so a measure of exactly 10 is priced by the tier at 10. What the number measures is the method's \`matrix_basis\` — kilograms in the market's own weight unit, items, money in the method's currency, or a named attribute — and the last tier has no upper bound. This adds ONE row to the table of the method in the path, leaving the rest alone — the edit for a merchant who has added a heavier bracket. To lay a whole table down at once use PUT …/tiers (set semantics) or POST …/tiers/ladder (evenly stepped), and note that both of those DISCARD the ids of the rows they replace. Two rows of this tenant may not share the combination of \`method_id\` + \`from_value\` — that is the 409. \`method_id\` is taken from the path on every write, so a body naming a different method is ignored rather than obeyed.`)
  .option(`--method-id <method-id>`, `The shipping method these tiers belong to. A method this tenant does not have is a 404, never an empty page.`)
  .option(`--from-value <from-value>`, `Lower bound of this tier, in the method's matrix measure — kilograms (or whatever the market's \`weight_unit\` names, converted through its factor) for a weight matrix, items for quantity, money in the method's currency for order_value, and the raw attribute value for 'attribute'. INCLUSIVE: the tier applies from this value upward, and the tier that wins is the one with the highest from_value at or below the measured value, so a measure of exactly 10 is priced by the tier at 10 rather than the one below it. The last tier has no upper bound. Unique per method — a second tier at the same threshold is a 409, because which of the two won would be whatever the database returned first. Defaults to 0.`, parseInteger)
  .option(`--position <position>`, `Display order in the matrix editor (default 0; a bulk replace derives it from the array index). Pricing reads from_value, never this.`, parseInteger)
  .option(`--price <price>`, `What this tier costs, in the method's currency. Charged in full for the whole consignment — a matrix is a lookup table, not a rate per unit. Defaults to 0.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, fromValue, position, price } = await promptForMissing(
          _options,
          shippingTiersCreateSpecs,
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
registerPromptSpecs(shippingMethods.commands.at(-1)!, shippingTiersCreateSpecs, { method: "post" });
const shippingTiersReplaceSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", description: "The shipping method these tiers belong to. A method this tenant does not have is a 404, never an empty page.", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "tiers", option: "--tiers [tiers...]", name: "tiers", description: "The complete new tier set (set semantics) — positions are derived from the array order. An empty array clears the matrix, and a matrix method with no tiers quotes nothing.", type: "array", required: true },
];
shippingMethods
  .command(`shipping-tiers-replace`)
  .description(`The write behind a table editor: a merchant edits the whole matrix on screen and saves it in one call, rather than diffing it into a row added here and a row deleted there. Set semantics, and it replaces EVERY tier the method had: the tiers this method has afterwards are exactly the ones handed in, positions derived from the array order. An empty \`tiers\` array clears the table — and a matrix method with no tiers quotes nothing, with a reason.`)
  .option(`--method-id <method-id>`, `The shipping method these tiers belong to. A method this tenant does not have is a 404, never an empty page.`)
  .option(`--tiers [tiers...]`, `The complete new tier set (set semantics) — positions are derived from the array order. An empty array clears the matrix, and a matrix method with no tiers quotes nothing.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, tiers } = await promptForMissing(
          _options,
          shippingTiersReplaceSpecs,
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
registerPromptSpecs(shippingMethods.commands.at(-1)!, shippingTiersReplaceSpecs, { method: "put" });
const shippingTiersLadderSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", description: "The shipping method these tiers belong to. A method this tenant does not have is a 404, never an empty page.", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "basePrice", option: "--base-price <base-price>", name: "base_price", description: "Price of the first tier.", type: "number", required: true },
  { key: "step", option: "--step <step>", name: "step", description: "Distance between two tiers. Must be > 0.", type: "number", required: true },
  { key: "toValue", option: "--to-value <to-value>", name: "to_value", description: "Last tier threshold. The final tier keeps applying above it — a matrix has no upper bound. Must be >= from_value.", type: "number", required: true },
  { key: "fromValue", option: "--from-value <from-value>", name: "from_value", description: "First tier threshold (default 0), in the method's matrix measure.", type: "number", required: false },
  { key: "replace", option: "--replace <replace>", name: "replace", description: "Replace the whole table (default true) or append to it.", type: "boolean", required: false },
  { key: "stepPrice", option: "--step-price <step-price>", name: "step_price", description: "Added to each subsequent tier (default 0). A negative value is allowed as long as no tier ends up below 0.", type: "number", required: false },
];
shippingMethods
  .command(`shipping-tiers-ladder`)
  .description(`The tier table a merchant describes in words — "0 to 30 kg, every 5 kg, €4.90 plus €2 a step" — without typing every row. Replaces the method's tiers by default (set replace=false to append).`)
  .option(`--method-id <method-id>`, `The shipping method these tiers belong to. A method this tenant does not have is a 404, never an empty page.`)
  .option(`--base-price <base-price>`, `Price of the first tier.`, parseInteger)
  .option(`--step <step>`, `Distance between two tiers. Must be > 0.`, parseInteger)
  .option(`--to-value <to-value>`, `Last tier threshold. The final tier keeps applying above it — a matrix has no upper bound. Must be >= from_value.`, parseInteger)
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
          shippingTiersLadderSpecs,
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
registerPromptSpecs(shippingMethods.commands.at(-1)!, shippingTiersLadderSpecs, { method: "post" });
const shippingTiersDeleteSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", description: "The shipping method these tiers belong to. A method this tenant does not have is a 404, never an empty page.", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/methods/{method_id}/tiers", hasLimit: true } },
];
shippingMethods
  .command(`shipping-tiers-delete`)
  .description(`A rate tier is one row of a matrix method's price table: a \`from_value\` threshold and the price charged at or above it. The bound is INCLUSIVE and the winning tier is the one with the highest \`from_value\` at or below the measured value, so a measure of exactly 10 is priced by the tier at 10. What the number measures is the method's \`matrix_basis\` — kilograms in the market's own weight unit, items, money in the method's currency, or a named attribute — and the last tier has no upper bound. Removing a tier in the MIDDLE of a table is harmless — the measures it used to cover fall to the highest remaining threshold below them. Removing the LOWEST one is not: a measure under the new lowest threshold matches no tier at all, and the method is then left out of POST /shipping/rates with 'no tier covers measure …' instead of being quoted at 0, so an entire band of baskets silently stops being offered this method. Deleting the last tier takes the method out of the checkout altogether. Rebuilding the table wholesale is PUT …/tiers or POST …/tiers/ladder; deleting the method deletes its tiers on its own.`)
  .option(`--method-id <method-id>`, `The shipping method these tiers belong to. A method this tenant does not have is a 404, never an empty page.`)
  .option(`--id <id>`, `The row id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, id } = await promptForMissing(
          _options,
          shippingTiersDeleteSpecs,
          _command,
        );
        await confirmDestructive(`shipping-methods shipping-tiers-delete`);
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
registerPromptSpecs(shippingMethods.commands.at(-1)!, shippingTiersDeleteSpecs, { method: "delete", destructive: true });
const shippingTiersGetSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", description: "The shipping method these tiers belong to. A method this tenant does not have is a 404, never an empty page.", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/methods/{method_id}/tiers", hasLimit: true } },
];
shippingMethods
  .command(`shipping-tiers-get`)
  .description(`A rate tier is one row of a matrix method's price table: a \`from_value\` threshold and the price charged at or above it. The bound is INCLUSIVE and the winning tier is the one with the highest \`from_value\` at or below the measured value, so a measure of exactly 10 is priced by the tier at 10. What the number measures is the method's \`matrix_basis\` — kilograms in the market's own weight unit, items, money in the method's currency, or a named attribute — and the last tier has no upper bound. This reads one row of that table by id, under the method that owns it; a tier id belonging to another method is a 404 rather than somebody else's price. A tier id is not durable: PUT …/tiers and POST …/tiers/ladder replace the table by deleting and recreating it, so an id read before either of them names nothing afterwards. Where a caller wants a stable handle, address the row by what it MEANS — GET …/tiers?from_value=… — since (method_id, from_value) is unique.`)
  .option(`--method-id <method-id>`, `The shipping method these tiers belong to. A method this tenant does not have is a 404, never an empty page.`)
  .option(`--id <id>`, `The row id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, id } = await promptForMissing(
          _options,
          shippingTiersGetSpecs,
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
registerPromptSpecs(shippingMethods.commands.at(-1)!, shippingTiersGetSpecs, { method: "get" });
const shippingTiersUpdateSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", description: "The shipping method these tiers belong to. A method this tenant does not have is a 404, never an empty page.", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The row id.", type: "string", required: true, resource: { listPath: "/shipping/methods/{method_id}/tiers", hasLimit: true } },
  { key: "fromValue", option: "--from-value <from-value>", name: "from_value", description: "Lower bound of this tier, in the method's matrix measure — kilograms (or whatever the market's `weight_unit` names, converted through its factor) for a weight matrix, items for quantity, money in the method's currency for order_value, and the raw attribute value for 'attribute'. INCLUSIVE: the tier applies from this value upward, and the tier that wins is the one with the highest from_value at or below the measured value, so a measure of exactly 10 is priced by the tier at 10 rather than the one below it. The last tier has no upper bound. Unique per method — a second tier at the same threshold is a 409, because which of the two won would be whatever the database returned first. Defaults to 0.", type: "number", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Display order in the matrix editor (default 0; a bulk replace derives it from the array index). Pricing reads from_value, never this.", type: "integer", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "What this tier costs, in the method's currency. Charged in full for the whole consignment — a matrix is a lookup table, not a rate per unit. Defaults to 0.", type: "number", required: false },
];
shippingMethods
  .command(`shipping-tiers-update`)
  .description(`A tier id is not stable across a bulk edit: \`PUT …/tiers\` and \`POST …/tiers/ladder\` replace the table by deleting and recreating it, so an id read before either of them is gone afterwards.`)
  .option(`--method-id <method-id>`, `The shipping method these tiers belong to. A method this tenant does not have is a 404, never an empty page.`)
  .option(`--id <id>`, `The row id.`)
  .option(`--from-value <from-value>`, `Lower bound of this tier, in the method's matrix measure — kilograms (or whatever the market's \`weight_unit\` names, converted through its factor) for a weight matrix, items for quantity, money in the method's currency for order_value, and the raw attribute value for 'attribute'. INCLUSIVE: the tier applies from this value upward, and the tier that wins is the one with the highest from_value at or below the measured value, so a measure of exactly 10 is priced by the tier at 10 rather than the one below it. The last tier has no upper bound. Unique per method — a second tier at the same threshold is a 409, because which of the two won would be whatever the database returned first. Defaults to 0.`, parseInteger)
  .option(`--position <position>`, `Display order in the matrix editor (default 0; a bulk replace derives it from the array index). Pricing reads from_value, never this.`, parseInteger)
  .option(`--price <price>`, `What this tier costs, in the method's currency. Charged in full for the whole consignment — a matrix is a lookup table, not a rate per unit. Defaults to 0.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, id, fromValue, position, price } = await promptForMissing(
          _options,
          shippingTiersUpdateSpecs,
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
registerPromptSpecs(shippingMethods.commands.at(-1)!, shippingTiersUpdateSpecs, { method: "put" });
const shippingRatesSpecs: PromptSpec[] = [
  { key: "at", option: "--at <at>", name: "at", description: "The instant to evaluate the delivery estimate at (ISO 8601). Omitted: now. Lets a storefront compute the cut-off in its own timezone.", type: "string", required: false },
  { key: "attributes", option: "--attributes <attributes>", name: "attributes", description: "Measure values for attribute matrices, keyed by attribute NAME — the key a matrix method names in its matrix_attribute, and the value the number its tiers are matched against. Summed over the basket by the caller, not by this app. Only the key a method asks for is read; anything else in the map is carried along and ignored, and a value that is not a finite number excludes that method with a reason rather than failing the quote.", type: "object", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "Destination ISO 3166-1 alpha-2 code — compared upper-cased against method and carrier country restrictions. Omitted or null: every method that restricts by country is excluded, with a reason.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code the checkout prices in, compared without regard to case. A method priced in another currency is excluded with a reason — this app converts nothing. Omitted or null: every method is offered, and each rate carries its method's own currency.", type: "string", required: false },
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "Buyer market for tax resolution. Omitted: the market matching `country`, else the tenant's sole market — never an arbitrary one. An id naming no market of this tenant quotes no tax, with the reason `unknown_market`.", type: "string", required: false },
  { key: "orderValue", option: "--order-value <order-value>", name: "order_value", description: "Order value (default 0) — the fallback figure for order_value matrices and free-above thresholds when the sided value the market's free_above_compares names is not sent. Taken to be on that basis. Below 0 is refused with 400 `negative_measure`.", type: "number", required: false },
  { key: "orderValueGross", option: "--order-value-gross <order-value-gross>", name: "order_value_gross", description: "Order value including tax. Compared against free-above thresholds, and measured by order_value matrices, when free_above_compares is 'gross'.", type: "number", required: false },
  { key: "orderValueNet", option: "--order-value-net <order-value-net>", name: "order_value_net", description: "Order value excluding tax. Compared against free-above thresholds, and measured by order_value matrices, when free_above_compares is 'net'.", type: "number", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Total quantity — measure for quantity matrices. Below 0 is refused with 400 `negative_measure`.", type: "number", required: false },
  { key: "weight", option: "--weight <weight>", name: "weight", description: "Total weight — measure for weight matrices. Read in weight_unit and converted to the unit the tiers are keyed in. Below 0 is refused with 400 `negative_measure`.", type: "number", required: false },
  { key: "weightUnit", option: "--weight-unit <weight-unit>", name: "weight_unit", description: "The unit `weight` is expressed in, as a CODE into the tenant's own weight units (GET /shipping/weight-units). Omitted, it is the unit this market quotes in. A unit the tenant does not keep is a 400 — a mis-read weight prices the wrong bracket silently, and guessing is worse than refusing.", type: "string", required: false },
];
shippingMethods
  .command(`shipping-rates`)
  .description(`The question a checkout asks, and the only route that answers a PRICE. Hand in the buyer context — the destination country, the order value, and whatever the matrix methods measure: a weight, a quantity or a named product attribute — and this comes back with the methods that may be offered and what each of them costs, free-above thresholds, country restrictions, the carrier's delivery promise and tax already applied. A method that does not apply is never an error: it moves to \`excluded\` with a reason. So is a tax rate that cannot be resolved — \`tax.resolved: false\` means the rates are UNKNOWN, not untaxed.`)
  .option(`--at <at>`, `The instant to evaluate the delivery estimate at (ISO 8601). Omitted: now. Lets a storefront compute the cut-off in its own timezone.`)
  .option(`--attributes <attributes>`, `Measure values for attribute matrices, keyed by attribute NAME — the key a matrix method names in its matrix_attribute, and the value the number its tiers are matched against. Summed over the basket by the caller, not by this app. Only the key a method asks for is read; anything else in the map is carried along and ignored, and a value that is not a finite number excludes that method with a reason rather than failing the quote.`)
  .option(`--country <country>`, `Destination ISO 3166-1 alpha-2 code — compared upper-cased against method and carrier country restrictions. Omitted or null: every method that restricts by country is excluded, with a reason.`)
  .option(`--currency <currency>`, `ISO 4217 code the checkout prices in, compared without regard to case. A method priced in another currency is excluded with a reason — this app converts nothing. Omitted or null: every method is offered, and each rate carries its method's own currency.`)
  .option(`--market-id <market-id>`, `Buyer market for tax resolution. Omitted: the market matching \`country\`, else the tenant's sole market — never an arbitrary one. An id naming no market of this tenant quotes no tax, with the reason \`unknown_market\`.`)
  .option(`--order-value <order-value>`, `Order value (default 0) — the fallback figure for order_value matrices and free-above thresholds when the sided value the market's free_above_compares names is not sent. Taken to be on that basis. Below 0 is refused with 400 \`negative_measure\`.`, parseInteger)
  .option(`--order-value-gross <order-value-gross>`, `Order value including tax. Compared against free-above thresholds, and measured by order_value matrices, when free_above_compares is 'gross'.`, parseInteger)
  .option(`--order-value-net <order-value-net>`, `Order value excluding tax. Compared against free-above thresholds, and measured by order_value matrices, when free_above_compares is 'net'.`, parseInteger)
  .option(`--quantity <quantity>`, `Total quantity — measure for quantity matrices. Below 0 is refused with 400 \`negative_measure\`.`, parseInteger)
  .option(`--weight <weight>`, `Total weight — measure for weight matrices. Read in weight_unit and converted to the unit the tiers are keyed in. Below 0 is refused with 400 \`negative_measure\`.`, parseInteger)
  .option(`--weight-unit <weight-unit>`, `The unit \`weight\` is expressed in, as a CODE into the tenant's own weight units (GET /shipping/weight-units). Omitted, it is the unit this market quotes in. A unit the tenant does not keep is a 400 — a mis-read weight prices the wrong bracket silently, and guessing is worse than refusing.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { at, attributes, country, currency, marketId, orderValue, orderValueGross, orderValueNet, quantity, weight, weightUnit } = await promptForMissing(
          _options,
          shippingRatesSpecs,
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
registerPromptSpecs(shippingMethods.commands.at(-1)!, shippingRatesSpecs, { method: "post" });
const shippingTaxClassesUsageSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "The tax-class CODE, as markets spells it — not a row id. Matched against every shipping method's `tax_class` and against this market's `shipping_tax_class` setting.", type: "string", required: true },
];
shippingMethods
  .command(`shipping-tax-classes-usage`)
  .description(`markets.tax_classes is the source of record for the rate and this app points at it by CODE from two places: a method's own tax_class and the tenant's shipping_tax_class fallback. Neither is a foreign key and neither could be — a cross-app FK is what ADR-0055 forbids — so integrity is a question one app asks the other, and this is the answering half. It is asked before a destructive edit: markets calls it when an operator tries to delete a tax class, and a count above zero is what stops the delete rather than leaving these methods pointing at a code nobody serves. Matched as a CODE, not a row: a tax class is unique per market, so 'reduced' may exist in several and a method naming it does not say which one it meant. Reports at most 500 methods and names the first 20. Every code answers, used or not — a code nobody points at is \`in_use: false\`, never a 404.`)
  .option(`--code <code>`, `The tax-class CODE, as markets spells it — not a row id. Matched against every shipping method's \`tax_class\` and against this market's \`shipping_tax_class\` setting.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code } = await promptForMissing(
          _options,
          shippingTaxClassesUsageSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/tax-classes/{code}/usage`.replace(`{code}`, code);
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
registerPromptSpecs(shippingMethods.commands.at(-1)!, shippingTaxClassesUsageSpecs, { method: "get" });
