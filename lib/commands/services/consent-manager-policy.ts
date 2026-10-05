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
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const consentManagerPolicy = new Command("consent-manager-policy")
  .description(
    commandDescriptions["consentManagerPolicy"] ??
      `The banner draft per market and the versions it is frozen into. Publishing renders the draft, the purposes, the vendors and the settings in every language and stores them as an immutable, numbered version with a SHA-256 hash; a draft whose 'reject all' label is empty in any language is refused. Versions are never changed or deleted.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

consentManagerPolicy
  .command(`consent-manager-banner-get`)
  .description(`The draft for the market in \`x-revenexx-market\`. A market without its own answers the shop's draft with \`inherited: true\`. A tenant with no draft at all gets the default one created.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/banner`;
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
const consentManagerBannerUpdateSpecs: PromptSpec[] = [
  { key: "imprintUrl", option: "--imprint-url <imprint-url>", name: "imprint_url", description: "The shop's imprint, linked from the first layer.", type: "string", required: false },
  { key: "layout", option: "--layout <layout>", name: "layout", description: "The layout this draft asks for — box, bar or modal — or null to follow the `banner_layout` setting.", type: "string", required: false, enum: ["box","bar","modal"] },
  { key: "privacyUrl", option: "--privacy-url <privacy-url>", name: "privacy_url", description: "The shop's privacy policy, linked from the first layer.", type: "string", required: false },
  { key: "texts", option: "--texts <texts>", name: "texts", description: "The banner's labels per language: { \"de\": { \"title\": …, \"body\": …, \"accept_all\": …, \"reject_all\": …, \"settings\": …, \"save\": … } }. Required per language before publishing: title, body, accept_all, reject_all, settings, save. Optional: preferences_title, preferences_body, object, load_once, gate_text, privacy_link, cookie_details, always_active, close.", type: "object", required: false },
];
consentManagerPolicy
  .command(`consent-manager-banner-update`)
  .description(`Save the draft for the market in \`x-revenexx-market\` ('' = the shop). A market's first save starts from a copy of the shop's draft. Nothing a visitor sees changes until the next publish.`)
  .option(`--imprint-url <imprint-url>`, `The shop's imprint, linked from the first layer.`)
  .option(`--layout <layout>`, `The layout this draft asks for — box, bar or modal — or null to follow the \`banner_layout\` setting.`)
  .option(`--privacy-url <privacy-url>`, `The shop's privacy policy, linked from the first layer.`)
  .option(`--texts <texts>`, `The banner's labels per language: { "de": { "title": …, "body": …, "accept_all": …, "reject_all": …, "settings": …, "save": … } }. Required per language before publishing: title, body, accept_all, reject_all, settings, save. Optional: preferences_title, preferences_body, object, load_once, gate_text, privacy_link, cookie_details, always_active, close.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { imprintUrl, layout, privacyUrl, texts } = await promptForMissing(
          _options,
          consentManagerBannerUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/banner`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (imprintUrl !== undefined) {
          _payload[`imprint_url`] = imprintUrl;
        }
        if (layout !== undefined) {
          _payload[`layout`] = layout;
        }
        if (privacyUrl !== undefined) {
          _payload[`privacy_url`] = privacyUrl;
        }
        if (texts !== undefined) {
          _payload[`texts`] = resolveBodyParam(texts);
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
registerPromptSpecs(consentManagerPolicy.commands.at(-1)!, consentManagerBannerUpdateSpecs, { method: "put" });
const versionsListSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Filter to rows whose `id` is exactly this value. The row's own id, generated by the database. A caller never sends one; it reads one back and puts it in the path of later calls.", type: "string", required: false },
  { key: "number", option: "--number <number>", name: "number", description: "Filter to rows whose `number` is exactly this value. The version's number. It rises with every publish across what the publishing call can see, and the visitor's cookie remembers the number it was asked under.", type: "integer", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "Filter to rows whose `market` is exactly this value. The market this row belongs to, by code — '' (empty) is the shop as a whole. Taken from the `x-revenexx-market` header of the call that wrote it, never from a body.", type: "string", required: false },
  { key: "material", option: "--material <material>", name: "material", description: "Filter to rows whose `material` is exactly this value. Whether this publish asks every visitor again. Set by the publish, or forced on by the `reconsent_on_publish` setting.", type: "boolean", required: false },
  { key: "materialNumber", option: "--material-number <material-number>", name: "material_number", description: "Filter to rows whose `material_number` is exactly this value. The number of the latest material version up to and including this one. A storefront asks again when the number in the visitor's cookie is lower.", type: "integer", required: false },
  { key: "sha256", option: "--sha256 <sha256>", name: "sha256", description: "Filter to rows whose `sha256` is exactly this value. SHA-256 over the canonical JSON of `content` (object keys sorted, recursively). Recomputing it proves the content has not moved since it was published.", type: "string", required: false },
  { key: "note", option: "--note <note>", name: "note", description: "Filter to rows whose `note` is exactly this value. What changed, in the publisher's words. Optional.", type: "string", required: false },
  { key: "publishedAt", option: "--published-at <published-at>", name: "published_at", description: "Filter to rows whose `published_at` is exactly this value. When the version was published. Server time.", type: "string", required: false },
  { key: "publishedBy", option: "--published-by <published-by>", name: "published_by", description: "Filter to rows whose `published_by` is exactly this value. The subject of the identity that published it, when the call carried one.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Filter to rows whose `created_at` is exactly this value. When the row was created. Server-set.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column', 'column.asc' or 'column.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
consentManagerPolicy
  .command(`versions-list`)
  .description(`Every published version. There is no route that edits or deletes one — both answer 405 — because a version is the evidence of what visitors read.`)
  .option(`--id <id>`, `Filter to rows whose \`id\` is exactly this value. The row's own id, generated by the database. A caller never sends one; it reads one back and puts it in the path of later calls.`)
  .option(`--number <number>`, `Filter to rows whose \`number\` is exactly this value. The version's number. It rises with every publish across what the publishing call can see, and the visitor's cookie remembers the number it was asked under.`, parseInteger)
  .option(`--market <market>`, `Filter to rows whose \`market\` is exactly this value. The market this row belongs to, by code — '' (empty) is the shop as a whole. Taken from the \`x-revenexx-market\` header of the call that wrote it, never from a body.`)
  .option(
    `--material [value]`,
    `Filter to rows whose \`material\` is exactly this value. Whether this publish asks every visitor again. Set by the publish, or forced on by the \`reconsent_on_publish\` setting.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--material-number <material-number>`, `Filter to rows whose \`material_number\` is exactly this value. The number of the latest material version up to and including this one. A storefront asks again when the number in the visitor's cookie is lower.`, parseInteger)
  .option(`--sha256 <sha256>`, `Filter to rows whose \`sha256\` is exactly this value. SHA-256 over the canonical JSON of \`content\` (object keys sorted, recursively). Recomputing it proves the content has not moved since it was published.`)
  .option(`--note <note>`, `Filter to rows whose \`note\` is exactly this value. What changed, in the publisher's words. Optional.`)
  .option(`--published-at <published-at>`, `Filter to rows whose \`published_at\` is exactly this value. When the version was published. Server time.`)
  .option(`--published-by <published-by>`, `Filter to rows whose \`published_by\` is exactly this value. The subject of the identity that published it, when the call carried one.`)
  .option(`--created-at <created-at>`, `Filter to rows whose \`created_at\` is exactly this value. When the row was created. Server-set.`)
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
        const { id, number, market, material, materialNumber, sha256, note, publishedAt, publishedBy, createdAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          versionsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/policy-versions`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (number !== undefined) {
          _payload[`number`] = number;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (material !== undefined) {
          _payload[`material`] = material;
        }
        if (materialNumber !== undefined) {
          _payload[`material_number`] = materialNumber;
        }
        if (sha256 !== undefined) {
          _payload[`sha256`] = sha256;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
        }
        if (publishedAt !== undefined) {
          _payload[`published_at`] = publishedAt;
        }
        if (publishedBy !== undefined) {
          _payload[`published_by`] = publishedBy;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
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
registerPromptSpecs(consentManagerPolicy.commands.at(-1)!, versionsListSpecs, { method: "get" });
const versionsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The version.", type: "string", required: true, resource: { listPath: "/consent-manager/policy-versions", hasLimit: true } },
];
consentManagerPolicy
  .command(`versions-get`)
  .description(`One version with its full frozen content and hash.`)
  .option(`--id <id>`, `The version.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          versionsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/policy-versions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(consentManagerPolicy.commands.at(-1)!, versionsGetSpecs, { method: "get" });
const previewSpecs: PromptSpec[] = [
  { key: "ttlHours", option: "--ttl-hours <ttl-hours>", name: "ttl_hours", description: "How long the token answers.", type: "integer", required: false },
];
consentManagerPolicy
  .command(`preview`)
  .description(`Renders the draft exactly as publishing would, without publishing it, and answers a token that reads it at GET /consent-manager/delivery/preview/{token} until it expires (72 hours by default, at most 168). The same refusals as a publish apply.`)
  .option(`--ttl-hours <ttl-hours>`, `How long the token answers.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { ttlHours } = await promptForMissing(
          _options,
          previewSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/policy/preview`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (ttlHours !== undefined) {
          _payload[`ttl_hours`] = ttlHours;
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
registerPromptSpecs(consentManagerPolicy.commands.at(-1)!, previewSpecs, { method: "post" });
const publishSpecs: PromptSpec[] = [
  { key: "material", option: "--material <material>", name: "material", description: "Whether visitors are asked again. Defaults to true.", type: "boolean", required: false },
  { key: "note", option: "--note <note>", name: "note", description: "What changed.", type: "string", required: false },
];
consentManagerPolicy
  .command(`publish`)
  .description(`Renders the draft, the active purposes and vendors and the settings in every language the draft speaks, and stores them as a new immutable version with a SHA-256 hash over the canonical content. The version is for the market in \`x-revenexx-market\` ('' = the shop). \`material: false\` keeps visitors' earlier decisions valid — unless the \`reconsent_on_publish\` setting is \`always\`, or there is no earlier version.`)
  .option(
    `--material [value]`,
    `Whether visitors are asked again. Defaults to true.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--note <note>`, `What changed.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { material, note } = await promptForMissing(
          _options,
          publishSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/policy/publish`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (material !== undefined) {
          _payload[`material`] = material;
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
registerPromptSpecs(consentManagerPolicy.commands.at(-1)!, publishSpecs, { method: "post" });
