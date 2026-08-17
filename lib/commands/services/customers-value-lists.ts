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

export const customersValueLists = new Command("customers-value-lists")
  .description(
    commandDescriptions["customersValueLists"] ??
      `The value sets a merchant owns, and the fixed ones they do not. Payment terms, address types, lifecycle stages and activity types were CHECK constraints until a wholesaler wanted net 45 and a pipeline step of their own — they are the tenant's ROWS now, so adding one is a call rather than a release of this app. Alongside them the vocabularies: the enums this app really does fix (status, registration status, membership source), published with the titles, descriptions and badge tones a client needs to render a value it has never seen. Plus the one call that seeds a fresh tenant with all four sets.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const customersAddressTypesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customersValueLists
  .command(`customers-address-types-list`)
  .description(`What an address is used for. Billing and shipping are what a checkout needs; a works entrance or a central accounts office is the tenant's own. A fresh install is seeded with billing, shipping, and the set seeds on first read too, so the page is never empty and \`addresses.type\` always has a value it may carry. The whole set comes back in one page in the tenant's own order — this route takes no limit/offset/order and no column filters, so \`page\` describes the full set and \`filter\` is always empty.`)
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
          customersAddressTypesListSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersAddressTypesListSpecs, { method: "get" });
const customersAddressTypesCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "What `addresses.type` will store. Lowercase, starting with a letter; immutable afterwards.", type: "string", required: true },
  { key: "title", option: "--title <title>", name: "title", description: "The fallback name shown when no locale matches.", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", description: "One line of help for whoever picks this value.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "Localized descriptions, keyed by language tag ({ \"en\": …, \"de\": … }). Null when nobody translated this value — a client then falls back to `description`.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value; the previous default is demoted in the same call.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized titles, keyed by language tag ({ \"en\": …, \"de\": … }). Null when nobody translated this value — a client then falls back to `title`.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where it sits in the set, ascending. Default 0.", type: "integer", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Semantic badge colour.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customersValueLists
  .command(`customers-address-types-create`)
  .description(`Extends this tenant's address types set with a value of their own — the whole reason these four stopped being CHECK constraints. What an address is used for. Billing and shipping are what a checkout needs; a works entrance or a central accounts office is the tenant's own. The code is lowercase and becomes what \`addresses.type\` stores; it cannot be changed afterwards, because every record carrying it would be orphaned.`)
  .option(`--code <code>`, `What \`addresses.type\` will store. Lowercase, starting with a letter; immutable afterwards.`)
  .option(`--title <title>`, `The fallback name shown when no locale matches.`)
  .option(`--description <description>`, `One line of help for whoever picks this value.`)
  .option(`--descriptions <descriptions>`, `Localized descriptions, keyed by language tag ({ "en": …, "de": … }). Null when nobody translated this value — a client then falls back to \`description\`.`)
  .option(
    `--is-default [value]`,
    `Promote this value; the previous default is demoted in the same call.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized titles, keyed by language tag ({ "en": …, "de": … }). Null when nobody translated this value — a client then falls back to \`title\`.`)
  .option(`--position <position>`, `Where it sits in the set, ascending. Default 0.`, parseInteger)
  .option(`--tone <tone>`, `Semantic badge colour.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, title, description, descriptions, isDefault, labels, position, tone } = await promptForMissing(
          _options,
          customersAddressTypesCreateSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersAddressTypesCreateSpecs, { method: "post" });
const customersAddressTypesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The address type to remove.", type: "string", required: true, resource: { listPath: "/customers/address-types", hasLimit: false } },
];
customersValueLists
  .command(`customers-address-types-delete`)
  .description(`Takes a value out of the address types set. There is no foreign key behind \`addresses.type\` — one added to a table that starts empty fails the migration of every existing tenant — so this route IS the integrity: it refuses while any record still carries the code, and it refuses to empty the set. Retiring a value that is in use is therefore a two-step job: move the records onto another value first, then remove it.`)
  .option(`--id <id>`, `The address type to remove.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersAddressTypesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`customers-value-lists customers-address-types-delete`);
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersAddressTypesDeleteSpecs, { method: "delete", destructive: true });
const customersAddressTypesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The address type to read. Note that records store the CODE, not this id.", type: "string", required: true, resource: { listPath: "/customers/address-types", hasLimit: false } },
];
customersValueLists
  .command(`customers-address-types-get`)
  .description(`One value of the address types set, by its id — its code, its fallback title, the per-language \`labels\` an operator reads and the badge \`tone\` a client renders it with. What an address is used for. Billing and shipping are what a checkout needs; a works entrance or a central accounts office is the tenant's own. Reading one value is the rare path: \`GET /customers/address-types\` answers the whole set in a single page, which is what a select needs.`)
  .option(`--id <id>`, `The address type to read. Note that records store the CODE, not this id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersAddressTypesGetSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersAddressTypesGetSpecs, { method: "get" });
const customersAddressTypesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The address type to edit.", type: "string", required: true, resource: { listPath: "/customers/address-types", hasLimit: false } },
  { key: "description", option: "--description <description>", name: "description", description: "One line of help for whoever picks this value.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "Localized descriptions, keyed by language tag ({ \"en\": …, \"de\": … }). Null when nobody translated this value — a client then falls back to `description`.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value; the previous default is demoted.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized titles, keyed by language tag ({ \"en\": …, \"de\": … }). Null when nobody translated this value — a client then falls back to `title`.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where it sits in the set, ascending.", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "The fallback name shown when no locale matches.", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Semantic badge colour.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customersValueLists
  .command(`customers-address-types-update`)
  .description(`Everything about a value except the value itself: its titles, its help text, its badge tone, its \`position\` in the select, and which one of the set is the default. The \`code\` is immutable, so no record carrying it is ever orphaned by an edit here — a merchant who retitles \`shipping\` to wording of their own changes what people READ and nothing about what \`addresses.type\` stores. Seeded values (\`is_system\`) are renameable like any other, and re-seeding leaves the rename alone.`)
  .option(`--id <id>`, `The address type to edit.`)
  .option(`--description <description>`, `One line of help for whoever picks this value.`)
  .option(`--descriptions <descriptions>`, `Localized descriptions, keyed by language tag ({ "en": …, "de": … }). Null when nobody translated this value — a client then falls back to \`description\`.`)
  .option(
    `--is-default [value]`,
    `Promote this value; the previous default is demoted.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized titles, keyed by language tag ({ "en": …, "de": … }). Null when nobody translated this value — a client then falls back to \`title\`.`)
  .option(`--position <position>`, `Where it sits in the set, ascending.`, parseInteger)
  .option(`--title <title>`, `The fallback name shown when no locale matches.`)
  .option(`--tone <tone>`, `Semantic badge colour.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, descriptions, isDefault, labels, position, title, tone } = await promptForMissing(
          _options,
          customersAddressTypesUpdateSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersAddressTypesUpdateSpecs, { method: "put" });
const customersContactEventKindsListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customersValueLists
  .command(`customers-contact-event-kinds-list`)
  .description(`What kind of entry lands on a customer timeline. 'system' is the app's own decision trail and a caller may not file one, whatever the set says. A fresh install is seeded with system, note, call, email, meeting, visit, task, and the set seeds on first read too, so the page is never empty and \`contact_events.kind\` always has a value it may carry. The whole set comes back in one page in the tenant's own order — this route takes no limit/offset/order and no column filters, so \`page\` describes the full set and \`filter\` is always empty.`)
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
          customersContactEventKindsListSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersContactEventKindsListSpecs, { method: "get" });
const customersContactEventKindsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "What `contact_events.kind` will store. Lowercase, starting with a letter; immutable afterwards.", type: "string", required: true },
  { key: "title", option: "--title <title>", name: "title", description: "The fallback name shown when no locale matches.", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", description: "One line of help for whoever picks this value.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "Localized descriptions, keyed by language tag ({ \"en\": …, \"de\": … }). Null when nobody translated this value — a client then falls back to `description`.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value; the previous default is demoted in the same call.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized titles, keyed by language tag ({ \"en\": …, \"de\": … }). Null when nobody translated this value — a client then falls back to `title`.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where it sits in the set, ascending. Default 0.", type: "integer", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Semantic badge colour.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customersValueLists
  .command(`customers-contact-event-kinds-create`)
  .description(`Extends this tenant's activity types set with a value of their own — the whole reason these four stopped being CHECK constraints. What kind of entry lands on a customer timeline. 'system' is the app's own decision trail and a caller may not file one, whatever the set says. The code is lowercase and becomes what \`contact_events.kind\` stores; it cannot be changed afterwards, because every record carrying it would be orphaned.`)
  .option(`--code <code>`, `What \`contact_events.kind\` will store. Lowercase, starting with a letter; immutable afterwards.`)
  .option(`--title <title>`, `The fallback name shown when no locale matches.`)
  .option(`--description <description>`, `One line of help for whoever picks this value.`)
  .option(`--descriptions <descriptions>`, `Localized descriptions, keyed by language tag ({ "en": …, "de": … }). Null when nobody translated this value — a client then falls back to \`description\`.`)
  .option(
    `--is-default [value]`,
    `Promote this value; the previous default is demoted in the same call.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized titles, keyed by language tag ({ "en": …, "de": … }). Null when nobody translated this value — a client then falls back to \`title\`.`)
  .option(`--position <position>`, `Where it sits in the set, ascending. Default 0.`, parseInteger)
  .option(`--tone <tone>`, `Semantic badge colour.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, title, description, descriptions, isDefault, labels, position, tone } = await promptForMissing(
          _options,
          customersContactEventKindsCreateSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersContactEventKindsCreateSpecs, { method: "post" });
const customersContactEventKindsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The activity type to remove.", type: "string", required: true, resource: { listPath: "/customers/contact-event-kinds", hasLimit: false } },
];
customersValueLists
  .command(`customers-contact-event-kinds-delete`)
  .description(`Takes a value out of the activity types set. There is no foreign key behind \`contact_events.kind\` — one added to a table that starts empty fails the migration of every existing tenant — so this route IS the integrity: it refuses while any record still carries the code, and it refuses to empty the set. Retiring a value that is in use is therefore a two-step job: move the records onto another value first, then remove it.`)
  .option(`--id <id>`, `The activity type to remove.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersContactEventKindsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`customers-value-lists customers-contact-event-kinds-delete`);
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersContactEventKindsDeleteSpecs, { method: "delete", destructive: true });
const customersContactEventKindsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The activity type to read. Note that records store the CODE, not this id.", type: "string", required: true, resource: { listPath: "/customers/contact-event-kinds", hasLimit: false } },
];
customersValueLists
  .command(`customers-contact-event-kinds-get`)
  .description(`One value of the activity types set, by its id — its code, its fallback title, the per-language \`labels\` an operator reads and the badge \`tone\` a client renders it with. What kind of entry lands on a customer timeline. 'system' is the app's own decision trail and a caller may not file one, whatever the set says. Reading one value is the rare path: \`GET /customers/contact-event-kinds\` answers the whole set in a single page, which is what a select needs.`)
  .option(`--id <id>`, `The activity type to read. Note that records store the CODE, not this id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersContactEventKindsGetSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersContactEventKindsGetSpecs, { method: "get" });
const customersContactEventKindsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The activity type to edit.", type: "string", required: true, resource: { listPath: "/customers/contact-event-kinds", hasLimit: false } },
  { key: "description", option: "--description <description>", name: "description", description: "One line of help for whoever picks this value.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "Localized descriptions, keyed by language tag ({ \"en\": …, \"de\": … }). Null when nobody translated this value — a client then falls back to `description`.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value; the previous default is demoted.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized titles, keyed by language tag ({ \"en\": …, \"de\": … }). Null when nobody translated this value — a client then falls back to `title`.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where it sits in the set, ascending.", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "The fallback name shown when no locale matches.", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Semantic badge colour.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customersValueLists
  .command(`customers-contact-event-kinds-update`)
  .description(`Everything about a value except the value itself: its titles, its help text, its badge tone, its \`position\` in the select, and which one of the set is the default. The \`code\` is immutable, so no record carrying it is ever orphaned by an edit here — a merchant who retitles \`call\` to wording of their own changes what people READ and nothing about what \`contact_events.kind\` stores. Seeded values (\`is_system\`) are renameable like any other, and re-seeding leaves the rename alone.`)
  .option(`--id <id>`, `The activity type to edit.`)
  .option(`--description <description>`, `One line of help for whoever picks this value.`)
  .option(`--descriptions <descriptions>`, `Localized descriptions, keyed by language tag ({ "en": …, "de": … }). Null when nobody translated this value — a client then falls back to \`description\`.`)
  .option(
    `--is-default [value]`,
    `Promote this value; the previous default is demoted.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized titles, keyed by language tag ({ "en": …, "de": … }). Null when nobody translated this value — a client then falls back to \`title\`.`)
  .option(`--position <position>`, `Where it sits in the set, ascending.`, parseInteger)
  .option(`--title <title>`, `The fallback name shown when no locale matches.`)
  .option(`--tone <tone>`, `Semantic badge colour.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, descriptions, isDefault, labels, position, title, tone } = await promptForMissing(
          _options,
          customersContactEventKindsUpdateSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersContactEventKindsUpdateSpecs, { method: "put" });
const customersDefaultsSpecs: PromptSpec[] = [
  { key: "data", option: "--data <data>", name: "data", description: "Request body", type: "object", required: true },
];
customersValueLists
  .command(`customers-defaults`)
  .description(`What the app.installed event runs. It fills all four of the value sets a tenant needs before anything else works — the payment terms, the address types, the lifecycle stages and the activity types — in one call. Idempotent by code: a set that already has its rows is left completely alone, so a re-delivered event and a merchant's renames both survive. A tenant installed before these tables existed is seeded lazily instead, by the first read that finds one empty.`)
  .option(`--data <data>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { data } = await promptForMissing(
          _options,
          customersDefaultsSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersDefaultsSpecs, { method: "post" });
const customersLifecycleStagesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customersValueLists
  .command(`customers-lifecycle-stages-list`)
  .description(`Where a company stands in the sales pipeline — a separate axis from status, and one whose steps are a sales team's own. A fresh install is seeded with lead, prospect, customer, churned, and the set seeds on first read too, so the page is never empty and \`organizations.lifecycle_stage\` always has a value it may carry. The whole set comes back in one page in the tenant's own order — this route takes no limit/offset/order and no column filters, so \`page\` describes the full set and \`filter\` is always empty.`)
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
          customersLifecycleStagesListSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersLifecycleStagesListSpecs, { method: "get" });
const customersLifecycleStagesCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "What `organizations.lifecycle_stage` will store. Lowercase, starting with a letter; immutable afterwards.", type: "string", required: true },
  { key: "title", option: "--title <title>", name: "title", description: "The fallback name shown when no locale matches.", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", description: "One line of help for whoever picks this value.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "Localized descriptions, keyed by language tag ({ \"en\": …, \"de\": … }). Null when nobody translated this value — a client then falls back to `description`.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value; the previous default is demoted in the same call.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized titles, keyed by language tag ({ \"en\": …, \"de\": … }). Null when nobody translated this value — a client then falls back to `title`.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where it sits in the set, ascending. Default 0.", type: "integer", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Semantic badge colour.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customersValueLists
  .command(`customers-lifecycle-stages-create`)
  .description(`Extends this tenant's lifecycle stages set with a value of their own — the whole reason these four stopped being CHECK constraints. Where a company stands in the sales pipeline — a separate axis from status, and one whose steps are a sales team's own. The code is lowercase and becomes what \`organizations.lifecycle_stage\` stores; it cannot be changed afterwards, because every record carrying it would be orphaned.`)
  .option(`--code <code>`, `What \`organizations.lifecycle_stage\` will store. Lowercase, starting with a letter; immutable afterwards.`)
  .option(`--title <title>`, `The fallback name shown when no locale matches.`)
  .option(`--description <description>`, `One line of help for whoever picks this value.`)
  .option(`--descriptions <descriptions>`, `Localized descriptions, keyed by language tag ({ "en": …, "de": … }). Null when nobody translated this value — a client then falls back to \`description\`.`)
  .option(
    `--is-default [value]`,
    `Promote this value; the previous default is demoted in the same call.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized titles, keyed by language tag ({ "en": …, "de": … }). Null when nobody translated this value — a client then falls back to \`title\`.`)
  .option(`--position <position>`, `Where it sits in the set, ascending. Default 0.`, parseInteger)
  .option(`--tone <tone>`, `Semantic badge colour.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, title, description, descriptions, isDefault, labels, position, tone } = await promptForMissing(
          _options,
          customersLifecycleStagesCreateSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersLifecycleStagesCreateSpecs, { method: "post" });
const customersLifecycleStagesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The lifecycle stage to remove.", type: "string", required: true, resource: { listPath: "/customers/lifecycle-stages", hasLimit: false } },
];
customersValueLists
  .command(`customers-lifecycle-stages-delete`)
  .description(`Takes a value out of the lifecycle stages set. There is no foreign key behind \`organizations.lifecycle_stage\` — one added to a table that starts empty fails the migration of every existing tenant — so this route IS the integrity: it refuses while any record still carries the code, and it refuses to empty the set. Retiring a value that is in use is therefore a two-step job: move the records onto another value first, then remove it.`)
  .option(`--id <id>`, `The lifecycle stage to remove.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersLifecycleStagesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`customers-value-lists customers-lifecycle-stages-delete`);
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersLifecycleStagesDeleteSpecs, { method: "delete", destructive: true });
const customersLifecycleStagesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The lifecycle stage to read. Note that records store the CODE, not this id.", type: "string", required: true, resource: { listPath: "/customers/lifecycle-stages", hasLimit: false } },
];
customersValueLists
  .command(`customers-lifecycle-stages-get`)
  .description(`One value of the lifecycle stages set, by its id — its code, its fallback title, the per-language \`labels\` an operator reads and the badge \`tone\` a client renders it with. Where a company stands in the sales pipeline — a separate axis from status, and one whose steps are a sales team's own. Reading one value is the rare path: \`GET /customers/lifecycle-stages\` answers the whole set in a single page, which is what a select needs.`)
  .option(`--id <id>`, `The lifecycle stage to read. Note that records store the CODE, not this id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersLifecycleStagesGetSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersLifecycleStagesGetSpecs, { method: "get" });
const customersLifecycleStagesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The lifecycle stage to edit.", type: "string", required: true, resource: { listPath: "/customers/lifecycle-stages", hasLimit: false } },
  { key: "description", option: "--description <description>", name: "description", description: "One line of help for whoever picks this value.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "Localized descriptions, keyed by language tag ({ \"en\": …, \"de\": … }). Null when nobody translated this value — a client then falls back to `description`.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value; the previous default is demoted.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized titles, keyed by language tag ({ \"en\": …, \"de\": … }). Null when nobody translated this value — a client then falls back to `title`.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where it sits in the set, ascending.", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "The fallback name shown when no locale matches.", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Semantic badge colour.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customersValueLists
  .command(`customers-lifecycle-stages-update`)
  .description(`Everything about a value except the value itself: its titles, its help text, its badge tone, its \`position\` in the select, and which one of the set is the default. The \`code\` is immutable, so no record carrying it is ever orphaned by an edit here — a merchant who retitles \`customer\` to wording of their own changes what people READ and nothing about what \`organizations.lifecycle_stage\` stores. Seeded values (\`is_system\`) are renameable like any other, and re-seeding leaves the rename alone.`)
  .option(`--id <id>`, `The lifecycle stage to edit.`)
  .option(`--description <description>`, `One line of help for whoever picks this value.`)
  .option(`--descriptions <descriptions>`, `Localized descriptions, keyed by language tag ({ "en": …, "de": … }). Null when nobody translated this value — a client then falls back to \`description\`.`)
  .option(
    `--is-default [value]`,
    `Promote this value; the previous default is demoted.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized titles, keyed by language tag ({ "en": …, "de": … }). Null when nobody translated this value — a client then falls back to \`title\`.`)
  .option(`--position <position>`, `Where it sits in the set, ascending.`, parseInteger)
  .option(`--title <title>`, `The fallback name shown when no locale matches.`)
  .option(`--tone <tone>`, `Semantic badge colour.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, descriptions, isDefault, labels, position, title, tone } = await promptForMissing(
          _options,
          customersLifecycleStagesUpdateSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersLifecycleStagesUpdateSpecs, { method: "put" });
const customersPaymentTermsListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customersValueLists
  .command(`customers-payment-terms-list`)
  .description(`When a company has to pay. A wholesaler who agrees net 45 with one customer used to need a release of this app to say so. A fresh install is seeded with prepayment, direct_debit, net_7, net_14, net_30, net_60, net_90, and the set seeds on first read too, so the page is never empty and \`organizations.payment_terms\` always has a value it may carry. The whole set comes back in one page in the tenant's own order — this route takes no limit/offset/order and no column filters, so \`page\` describes the full set and \`filter\` is always empty.`)
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
          customersPaymentTermsListSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersPaymentTermsListSpecs, { method: "get" });
const customersPaymentTermsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "What `organizations.payment_terms` will store. Lowercase, starting with a letter; immutable afterwards.", type: "string", required: true },
  { key: "title", option: "--title <title>", name: "title", description: "The fallback name shown when no locale matches.", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", description: "One line of help for whoever picks this value.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "Localized descriptions, keyed by language tag ({ \"en\": …, \"de\": … }). Null when nobody translated this value — a client then falls back to `description`.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value; the previous default is demoted in the same call.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized titles, keyed by language tag ({ \"en\": …, \"de\": … }). Null when nobody translated this value — a client then falls back to `title`.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where it sits in the set, ascending. Default 0.", type: "integer", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Semantic badge colour.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customersValueLists
  .command(`customers-payment-terms-create`)
  .description(`Extends this tenant's payment terms set with a value of their own — the whole reason these four stopped being CHECK constraints. When a company has to pay. A wholesaler who agrees net 45 with one customer used to need a release of this app to say so. The code is lowercase and becomes what \`organizations.payment_terms\` stores; it cannot be changed afterwards, because every record carrying it would be orphaned.`)
  .option(`--code <code>`, `What \`organizations.payment_terms\` will store. Lowercase, starting with a letter; immutable afterwards.`)
  .option(`--title <title>`, `The fallback name shown when no locale matches.`)
  .option(`--description <description>`, `One line of help for whoever picks this value.`)
  .option(`--descriptions <descriptions>`, `Localized descriptions, keyed by language tag ({ "en": …, "de": … }). Null when nobody translated this value — a client then falls back to \`description\`.`)
  .option(
    `--is-default [value]`,
    `Promote this value; the previous default is demoted in the same call.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized titles, keyed by language tag ({ "en": …, "de": … }). Null when nobody translated this value — a client then falls back to \`title\`.`)
  .option(`--position <position>`, `Where it sits in the set, ascending. Default 0.`, parseInteger)
  .option(`--tone <tone>`, `Semantic badge colour.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, title, description, descriptions, isDefault, labels, position, tone } = await promptForMissing(
          _options,
          customersPaymentTermsCreateSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersPaymentTermsCreateSpecs, { method: "post" });
const customersPaymentTermsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The payment term to remove.", type: "string", required: true, resource: { listPath: "/customers/payment-terms", hasLimit: false } },
];
customersValueLists
  .command(`customers-payment-terms-delete`)
  .description(`Takes a value out of the payment terms set. There is no foreign key behind \`organizations.payment_terms\` — one added to a table that starts empty fails the migration of every existing tenant — so this route IS the integrity: it refuses while any record still carries the code, and it refuses to empty the set. Retiring a value that is in use is therefore a two-step job: move the records onto another value first, then remove it.`)
  .option(`--id <id>`, `The payment term to remove.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersPaymentTermsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`customers-value-lists customers-payment-terms-delete`);
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersPaymentTermsDeleteSpecs, { method: "delete", destructive: true });
const customersPaymentTermsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The payment term to read. Note that records store the CODE, not this id.", type: "string", required: true, resource: { listPath: "/customers/payment-terms", hasLimit: false } },
];
customersValueLists
  .command(`customers-payment-terms-get`)
  .description(`One value of the payment terms set, by its id — its code, its fallback title, the per-language \`labels\` an operator reads and the badge \`tone\` a client renders it with. When a company has to pay. A wholesaler who agrees net 45 with one customer used to need a release of this app to say so. Reading one value is the rare path: \`GET /customers/payment-terms\` answers the whole set in a single page, which is what a select needs.`)
  .option(`--id <id>`, `The payment term to read. Note that records store the CODE, not this id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersPaymentTermsGetSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersPaymentTermsGetSpecs, { method: "get" });
const customersPaymentTermsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The payment term to edit.", type: "string", required: true, resource: { listPath: "/customers/payment-terms", hasLimit: false } },
  { key: "description", option: "--description <description>", name: "description", description: "One line of help for whoever picks this value.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "Localized descriptions, keyed by language tag ({ \"en\": …, \"de\": … }). Null when nobody translated this value — a client then falls back to `description`.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this value; the previous default is demoted.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized titles, keyed by language tag ({ \"en\": …, \"de\": … }). Null when nobody translated this value — a client then falls back to `title`.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where it sits in the set, ascending.", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "The fallback name shown when no locale matches.", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Semantic badge colour.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
customersValueLists
  .command(`customers-payment-terms-update`)
  .description(`Everything about a value except the value itself: its titles, its help text, its badge tone, its \`position\` in the select, and which one of the set is the default. The \`code\` is immutable, so no record carrying it is ever orphaned by an edit here — a merchant who retitles \`net_30\` to wording of their own changes what people READ and nothing about what \`organizations.payment_terms\` stores. Seeded values (\`is_system\`) are renameable like any other, and re-seeding leaves the rename alone.`)
  .option(`--id <id>`, `The payment term to edit.`)
  .option(`--description <description>`, `One line of help for whoever picks this value.`)
  .option(`--descriptions <descriptions>`, `Localized descriptions, keyed by language tag ({ "en": …, "de": … }). Null when nobody translated this value — a client then falls back to \`description\`.`)
  .option(
    `--is-default [value]`,
    `Promote this value; the previous default is demoted.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized titles, keyed by language tag ({ "en": …, "de": … }). Null when nobody translated this value — a client then falls back to \`title\`.`)
  .option(`--position <position>`, `Where it sits in the set, ascending.`, parseInteger)
  .option(`--title <title>`, `The fallback name shown when no locale matches.`)
  .option(`--tone <tone>`, `Semantic badge colour.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, descriptions, isDefault, labels, position, title, tone } = await promptForMissing(
          _options,
          customersPaymentTermsUpdateSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersPaymentTermsUpdateSpecs, { method: "put" });
const customersVocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customersValueLists
  .command(`customers-vocabularies-list`)
  .description(`Discovery for the vocabulary routes: every enum this app publishes, each as a name, a title and a description. The VALUES are deliberately left out — this is the call that says which vocabularies exist, and the detail route is the one that answers what is in them. Names: address-types, contact-event-kinds, contact-statuses, lifecycle-stages, locales, organization-statuses, payment-terms, registration-statuses, roles, rule-matches, segment-sources. Fetch one with GET /customers/vocabularies/{name}; a client holding the qualified pair 'customers.<name>' builds that URL from the pair alone.`)
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
          customersVocabulariesListSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersVocabulariesListSpecs, { method: "get" });
const customersVocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary name — the part after the dot in the qualified id.", type: "string", required: true, enum: ["address-types","contact-event-kinds","contact-statuses","lifecycle-stages","locales","organization-statuses","payment-terms","registration-statuses","roles","rule-matches","segment-sources"], resource: { listPath: "/customers/vocabularies", hasLimit: false } },
];
customersValueLists
  .command(`customers-vocabularies-get`)
  .description(`One vocabulary in full: every permitted value, each with its title, its description and the badge tone a client renders it with — enough to build a select without a second call. Two kinds of set, and 'source' says which one answered. 'schema' — the values are read out of the column's CHECK constraint, so the served set IS the enforced set and the two cannot drift; a value added to the constraint appears here even before anyone labels it, titled from its own key. 'table' — the values are the TENANT's own rows (payment terms, address types, lifecycle stages, activity types, roles), so they carry labels/descriptions per locale, is_system and is_default, and a merchant may add to them without a release of this app. 'tenant'/'defaults' are the two answers for a set the merchant configures but may not extend. Either way 'closed' is true: the set is exhaustive at this moment, so a value outside it is stale data rather than a missing label. Values come back in the order a select should offer them — lifecycle order for a status, the merchant's own position for a table. Names: address-types, contact-event-kinds, contact-statuses, lifecycle-stages, locales, organization-statuses, payment-terms, registration-statuses, roles, rule-matches, segment-sources.`)
  .option(`--name <name>`, `The vocabulary name — the part after the dot in the qualified id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name } = await promptForMissing(
          _options,
          customersVocabulariesGetSpecs,
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
registerPromptSpecs(customersValueLists.commands.at(-1)!, customersVocabulariesGetSpecs, { method: "get" });
