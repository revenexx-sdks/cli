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

export const pagesEditor = new Command("pages-editor")
  .description(
    commandDescriptions["pagesEditor"] ??
      `The unpublished side: one page open in the visual editor, held as a server-side mutation log rather than as edited rows. Load the whole editor state in one call, append mutations, walk the undo/redo pointer, disable a single step, then publish — which materializes the log into the canonical blocks and writes a revision — or revert, which throws it away. An edit state has ONE owner at a time and every write asks for it, so taking a page over from a colleague is its own call. Scheduling, share-links for unpublished previews, machine translation and a person's own editor preferences hang off the same session.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const editStatesSpecs: PromptSpec[] = [
  { key: "status", option: "--status <status>", name: "status", description: "Which kind of working copy to list. Omitted means `active` — the drafts somebody is actually holding, which is what this route is opened for.", type: "string", required: false, enum: ["active","scheduled","archived","published"] },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50). Unlike the list routes this one applies no ceiling of its own.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
];
pagesEditor
  .command(`edit-states`)
  .description(`The drafts overview — the "what is unpublished right now" list, across every page: who holds it, since when, and whether it is parked for a date. Always newest-first — this route does not read \`order\`. An edit state whose page has been deleted is dropped from \`items\` but still counted in \`total\`.`)
  .option(`--status <status>`, `Which kind of working copy to list. Omitted means \`active\` — the drafts somebody is actually holding, which is what this route is opened for.`)
  .option(`--limit <limit>`, `Page size (default 50). Unlike the list routes this one applies no ceiling of its own.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { status, limit, offset } = await promptForMissing(
          _options,
          editStatesSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/edit-states`;
        const _payload: RequestParams = {};
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
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
registerPromptSpecs(pagesEditor.commands.at(-1)!, editStatesSpecs, { method: "get" });
const translateSpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The strings to translate. This app reads no element of the list — the provider defines the contract, and the blökkli adapter sends the fields below.", type: "array", required: false },
];
pagesEditor
  .command(`translate`)
  .description(`The translation is the tenant's provider's, not this app's, and a tenant that has configured none gets no translation at all. The endpoint comes from the tenant setting \`translate_endpoint\` (PAGES_TRANSLATE_ENDPOINT remains a fallback). The bearer token does NOT: the gateway masks every setting flagged \`sensitive\`, so a key stored as one could never be read back — it stays the PAGES_TRANSLATE_KEY function secret. This app does not translate anything itself; it forwards \`items\` and hands the answer back.`)
  .option(`--items [items...]`, `The strings to translate. This app reads no element of the list — the provider defines the contract, and the blökkli adapter sends the fields below.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items } = await promptForMissing(
          _options,
          translateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/translate`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (items !== undefined) {
          _payload[`items`] = items;
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
registerPromptSpecs(pagesEditor.commands.at(-1)!, translateSpecs, { method: "post" });
pagesEditor
  .command(`user-settings-get`)
  .description(`Per-user editor preferences — one row per user, scoped to this app. Not tenant configuration: nothing here changes what the API does, only how one person's editor looks.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/user-settings`;
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
const userSettingsPutSpecs: PromptSpec[] = [
  { key: "settings", option: "--settings <settings>", name: "settings", description: "The whole preferences bag — replaced, not merged, so send all of it. Its keys vary by the editor build and this app reads none of them. Null or omitted stores `{}`, which is how a user resets their editor.", type: "object", required: false },
];
pagesEditor
  .command(`user-settings-put`)
  .description(`Replaces the caller's preferences wholesale — this is not a merge, so send the whole bag.`)
  .option(`--settings <settings>`, `The whole preferences bag — replaced, not merged, so send all of it. Its keys vary by the editor build and this app reads none of them. Null or omitted stores \`{}\`, which is how a user resets their editor.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { settings } = await promptForMissing(
          _options,
          userSettingsPutSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/user-settings`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (settings !== undefined) {
          _payload[`settings`] = resolveBodyParam(settings);
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
registerPromptSpecs(pagesEditor.commands.at(-1)!, userSettingsPutSpecs, { method: "put" });
const historySpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
  { key: "index", option: "--index <index>", name: "index", description: "The position in the mutation log to materialize at. `-1` undoes everything; the last position redoes everything. Values outside the log are clamped rather than refused.", type: "integer", required: true },
  { key: "langcode", option: "--langcode <langcode>", name: "langcode", description: "Which language the returned state should be resolved for.", type: "string", required: false },
];
pagesEditor
  .command(`history`)
  .description(`Undo and redo. The pointer is the edit state's \`current_index\`, the position in the mutation log the page is materialized at, and this route is the only thing that moves it — \`GET …/state?index=\` looks at another position without going there. The log itself is never rewritten — only the pointer moves — so redo stays available until the next change is appended.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .option(`--index <index>`, `The position in the mutation log to materialize at. \`-1\` undoes everything; the last position redoes everything. Values outside the log are clamped rather than refused.`, parseInteger)
  .option(`--langcode <langcode>`, `Which language the returned state should be resolved for.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, index, langcode } = await promptForMissing(
          _options,
          historySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/history`.replace(`{page_id}`, pageId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (index !== undefined) {
          _payload[`index`] = index;
        }
        if (langcode !== undefined) {
          _payload[`langcode`] = langcode;
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
registerPromptSpecs(pagesEditor.commands.at(-1)!, historySpecs, { method: "post" });
const lastChangedSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
];
pagesEditor
  .command(`last-changed`)
  .description(`The cheap poll behind "someone else is editing this page": one integer, the moment the open edit state last moved, in epoch seconds rather than as a timestamp so a comparison is a subtraction. Compare it with the \`updatedAt\` you last saw and re-fetch the state only when it moved.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId } = await promptForMissing(
          _options,
          lastChangedSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/last-changed`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pagesEditor.commands.at(-1)!, lastChangedSpecs, { method: "get" });
const mutationStatusSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Whether the entry takes part in the replay.", type: "boolean", required: true },
  { key: "index", option: "--index <index>", name: "index", description: "The position in the mutation log to switch. Unknown positions answer 404.", type: "integer", required: true },
  { key: "langcode", option: "--langcode <langcode>", name: "langcode", description: "Which language the returned state should be resolved for.", type: "string", required: false },
];
pagesEditor
  .command(`mutation-status`)
  .description(`Take one change out of the replay without deleting it — "what would the page look like without this edit". The entry stays in the history and can be switched back on.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .option(`--enabled <enabled>`, `Whether the entry takes part in the replay.`, parseBool)
  .option(`--index <index>`, `The position in the mutation log to switch. Unknown positions answer 404.`, parseInteger)
  .option(`--langcode <langcode>`, `Which language the returned state should be resolved for.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, enabled, index, langcode } = await promptForMissing(
          _options,
          mutationStatusSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/mutation-status`.replace(`{page_id}`, pageId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (index !== undefined) {
          _payload[`index`] = index;
        }
        if (langcode !== undefined) {
          _payload[`langcode`] = langcode;
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
registerPromptSpecs(pagesEditor.commands.at(-1)!, mutationStatusSpecs, { method: "post" });
const mutateSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
  { key: "plugin", option: "--plugin <plugin>", name: "plugin", description: "Which kind of change this is — `add`, `move`, `delete`, `duplicate`, `update_field_value`, `update_options`, … An id this app does not implement is refused with 400 rather than stored, because the log has to replay.", type: "string", required: true },
  { key: "langcode", option: "--langcode <langcode>", name: "langcode", description: "Which language the returned state should be resolved for. Not the language the change is written in — that lives in the payload.", type: "string", required: false },
  { key: "payload", option: "--payload <payload>", name: "payload", description: "The arguments of that change; the keys depend on the plugin (`add` takes `{ bundle, hostEntityType, hostEntityUuid, hostField }`, `move` takes `{ uuid, preceedingUuid }`, and so on). Anything non-deterministic in it — new uuids, a library item's tree, a copied subtree — is resolved once here and stored, so replaying the log is deterministic forever.", type: "object", required: false },
];
pagesEditor
  .command(`mutate`)
  .description(`The one way page CONTENT changes. Each call appends one entry to the append-only log and answers the whole re-materialized state, so a client never re-fetches. A page nobody has opened yet needs no separate call to open it: the first mutation creates the edit state and takes ownership of it, and every later one asks for that ownership, so a second person editing the same page is refused until they take it over. Appending while the pointer sits mid-history discards the redo branch, exactly as an editor expects.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .option(`--plugin <plugin>`, `Which kind of change this is — \`add\`, \`move\`, \`delete\`, \`duplicate\`, \`update_field_value\`, \`update_options\`, … An id this app does not implement is refused with 400 rather than stored, because the log has to replay.`)
  .option(`--langcode <langcode>`, `Which language the returned state should be resolved for. Not the language the change is written in — that lives in the payload.`)
  .option(`--payload <payload>`, `The arguments of that change; the keys depend on the plugin (\`add\` takes \`{ bundle, hostEntityType, hostEntityUuid, hostField }\`, \`move\` takes \`{ uuid, preceedingUuid }\`, and so on). Anything non-deterministic in it — new uuids, a library item's tree, a copied subtree — is resolved once here and stored, so replaying the log is deterministic forever.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, plugin, langcode, payload } = await promptForMissing(
          _options,
          mutateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/mutations`.replace(`{page_id}`, pageId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (langcode !== undefined) {
          _payload[`langcode`] = langcode;
        }
        if (payload !== undefined) {
          _payload[`payload`] = resolveBodyParam(payload);
        }
        if (plugin !== undefined) {
          _payload[`plugin`] = plugin;
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
registerPromptSpecs(pagesEditor.commands.at(-1)!, mutateSpecs, { method: "post" });
const previewGrantSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
  { key: "ttlHours", option: "--ttl-hours <ttl-hours>", name: "ttlHours", description: "Hours until the link expires. Defaults to 72. After that `GET /pages/delivery/preview/{token}` answers 410 rather than 404, so the holder can tell \"expired\" from \"wrong link\".", type: "integer", required: false },
];
pagesEditor
  .command(`preview-grant`)
  .description(`Mints a link that shows this page's current edit state — the UNPUBLISHED one — to somebody without an editor account. The token is the whole credential — anyone holding it sees the page — so it expires, and a new one is cheap.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .option(`--ttl-hours <ttl-hours>`, `Hours until the link expires. Defaults to 72. After that \`GET /pages/delivery/preview/{token}\` answers 410 rather than 404, so the holder can tell "expired" from "wrong link".`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, ttlHours } = await promptForMissing(
          _options,
          previewGrantSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/preview-grant`.replace(`{page_id}`, pageId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (ttlHours !== undefined) {
          _payload[`ttlHours`] = ttlHours;
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
registerPromptSpecs(pagesEditor.commands.at(-1)!, previewGrantSpecs, { method: "post" });
const publishSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
  { key: "force", option: "--force <force>", name: "force", description: "Publish despite violations. Without it a page with unresolved violations answers 422 and nothing is written.", type: "boolean", required: false },
  { key: "label", option: "--label <label>", name: "label", description: "What to call this publication in the page's history — \"Autumn campaign\" rather than a timestamp.", type: "string", required: false },
];
pagesEditor
  .command(`publish`)
  .description(`Four things in one call: the mutation log is replayed into a finished block tree, that tree is snapshotted into a new revision, the page's canonical blocks are replaced by it, and the edit state is archived — so the page comes out of this with nothing unpublished and the working copy behind it closed rather than deleted. The revision is written FIRST and the canonical blocks replaced after, so a failure mid-way leaves the page recoverable. Block uuids survive, which is why comments anchored to a block outlive the publish.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .option(
    `--force [value]`,
    `Publish despite violations. Without it a page with unresolved violations answers 422 and nothing is written.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--label <label>`, `What to call this publication in the page's history — "Autumn campaign" rather than a timestamp.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, force, label } = await promptForMissing(
          _options,
          publishSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/publish`.replace(`{page_id}`, pageId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (force !== undefined) {
          _payload[`force`] = force;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
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
registerPromptSpecs(pagesEditor.commands.at(-1)!, publishSpecs, { method: "post" });
const revertSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
];
pagesEditor
  .command(`revert`)
  .description(`Throws the whole working copy away: the edit state row is deleted and its mutation log with it, so the history goes too — this is not an undo and cannot itself be undone. Unlike publishing, which archives the edit state, nothing of it survives to be reopened. The published page is untouched.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId } = await promptForMissing(
          _options,
          revertSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/revert`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pagesEditor.commands.at(-1)!, revertSpecs, { method: "post" });
const scheduleSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
  { key: "scheduledAt", option: "--scheduled-at <scheduled-at>", name: "scheduledAt", description: "The moment to publish at. Stored on the edit state and echoed back normalized to UTC.", type: "string", required: true },
];
pagesEditor
  .command(`schedule`)
  .description(`Gated on the tenant setting \`enable_scheduled_publishing\`, which is off by default: nothing in the platform publishes a scheduled edit state yet, so a date accepted here would be a promise the app cannot keep. Every editor state carries \`features.scheduledPublishing\` so the control can be hidden rather than the refusal discovered.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .option(`--scheduled-at <scheduled-at>`, `The moment to publish at. Stored on the edit state and echoed back normalized to UTC.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, scheduledAt } = await promptForMissing(
          _options,
          scheduleSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/schedule`.replace(`{page_id}`, pageId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (scheduledAt !== undefined) {
          _payload[`scheduledAt`] = scheduledAt;
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
registerPromptSpecs(pagesEditor.commands.at(-1)!, scheduleSpecs, { method: "post" });
const stateSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
  { key: "langcode", option: "--langcode <langcode>", name: "langcode", description: "Language to resolve every field for. Falls back to the page's source language, per field, so a half-translated page still comes back whole.", type: "string", required: false },
  { key: "index", option: "--index <index>", name: "index", description: "Materialize the state at this point of the undo history instead of at the pointer the edit state carries. `-1` is \"before the first change\". It is how a diff view shows what one step did, and it does NOT move the pointer — `POST …/history` does that.", type: "integer", required: false },
];
pagesEditor
  .command(`state`)
  .description(`The one call the visual editor boots on, and the only place the UNPUBLISHED page can be seen whole: the canonical blocks with every enabled mutation of the log replayed over them, the resulting field lists, the mutation history itself, who owns the edit state and where the undo pointer sits, and the tenant's editor feature flags. \`langcode\` decides which language the props resolve in, falling back to the page's source language. \`index\` replays the log up to a given position instead of the current one, which is how the editor previews an undo without performing it — it changes nothing, so it is safe to call at any position. Reading this creates nothing either: a page nobody has opened answers with a null \`editState\`, an empty history, and the published blocks as they stand.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .option(`--langcode <langcode>`, `Language to resolve every field for. Falls back to the page's source language, per field, so a half-translated page still comes back whole.`)
  .option(`--index <index>`, `Materialize the state at this point of the undo history instead of at the pointer the edit state carries. \`-1\` is "before the first change". It is how a diff view shows what one step did, and it does NOT move the pointer — \`POST …/history\` does that.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, langcode, index } = await promptForMissing(
          _options,
          stateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/state`.replace(`{page_id}`, pageId);
        const _payload: RequestParams = {};
        if (langcode !== undefined) {
          _payload[`langcode`] = langcode;
        }
        if (index !== undefined) {
          _payload[`index`] = index;
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
registerPromptSpecs(pagesEditor.commands.at(-1)!, stateSpecs, { method: "get" });
const takeOwnershipSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
];
pagesEditor
  .command(`take-ownership`)
  .description(`One page has one writer. This is how the second person gets the pen — the previous owner is notified rather than silently locked out.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId } = await promptForMissing(
          _options,
          takeOwnershipSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/take-ownership`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pagesEditor.commands.at(-1)!, takeOwnershipSpecs, { method: "post" });
const templatesCreateSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
  { key: "label", option: "--label <label>", name: "label", description: "What the template is called in the picker.", type: "string", required: true },
  { key: "uuids", option: "--uuids [uuids...]", name: "uuids", description: "The blocks to serialize into the template, each with its whole subtree. They are read from the CURRENT edit state, so unpublished changes are included.", type: "array", required: true },
  { key: "description", option: "--description <description>", name: "description", description: "A sentence about when to reach for it.", type: "string", required: false },
  { key: "fieldName", option: "--field-name <field-name>", name: "fieldName", description: "The field this template should be offered in. Null offers it in every field.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "isDefault", description: "Whether a new page of that type should start from this template.", type: "boolean", required: false },
  { key: "pageBundle", option: "--page-bundle <page-bundle>", name: "pageBundle", description: "The page type this template should be offered on. Omit to take the current page's own type.", type: "string", required: false },
];
pagesEditor
  .command(`templates-create`)
  .description(`Freezes a selection into a reusable starting point. The blocks are read out of the page's CURRENT edit state rather than out of what is published, so a template can be cut from work in progress and the uuids you send are the ones the editor is showing. Unlike making a block reusable, this COPIES: pages later made from the template are independent of it and of each other.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .option(`--label <label>`, `What the template is called in the picker.`)
  .option(`--uuids [uuids...]`, `The blocks to serialize into the template, each with its whole subtree. They are read from the CURRENT edit state, so unpublished changes are included.`)
  .option(`--description <description>`, `A sentence about when to reach for it.`)
  .option(`--field-name <field-name>`, `The field this template should be offered in. Null offers it in every field.`)
  .option(
    `--is-default [value]`,
    `Whether a new page of that type should start from this template.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--page-bundle <page-bundle>`, `The page type this template should be offered on. Omit to take the current page's own type.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, label, uuids, description, fieldName, isDefault, pageBundle } = await promptForMissing(
          _options,
          templatesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/templates`.replace(`{page_id}`, pageId);
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
        if (fieldName !== undefined) {
          _payload[`fieldName`] = fieldName;
        }
        if (isDefault !== undefined) {
          _payload[`isDefault`] = isDefault;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (pageBundle !== undefined) {
          _payload[`pageBundle`] = pageBundle;
        }
        if (uuids !== undefined) {
          _payload[`uuids`] = uuids;
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
registerPromptSpecs(pagesEditor.commands.at(-1)!, templatesCreateSpecs, { method: "post" });
const unscheduleSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
];
pagesEditor
  .command(`unschedule`)
  .description(`Takes a parked edit state back to \`active\` and clears its date, so the scheduled publication simply does not happen. The work is not touched — the mutation log, the undo position and the owner all stay as they were — and the page can then be published by hand or scheduled again for a different date. Like every other write to an edit state it asks for ownership, and a page with no open edit state answers 404 rather than pretending to have cancelled something.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId } = await promptForMissing(
          _options,
          unscheduleSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/unschedule`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pagesEditor.commands.at(-1)!, unscheduleSpecs, { method: "post" });
