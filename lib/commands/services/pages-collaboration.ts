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

export const pagesCollaboration = new Command("pages-collaboration")
  .description(
    commandDescriptions["pagesCollaboration"] ??
      `The review layer over a page: comment threads pinned to blocks, with @mentions, task checkboxes and resolve/reopen, plus the notification feed those threads and an ownership handover raise, and the user directory a mention is picked from. Comments belong to the PAGE, not to a revision or an edit state, so they outlive publishing and reverting — which is what makes them usable as a review trail. Every write here answers the page's whole comment list rather than the row it touched, so a client can render from one response.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const pagesEditorNotificationsListSpecs: PromptSpec[] = [
  { key: "after", option: "--after <after>", name: "after", description: "Continue after this cursor — pass back the `cursor` from the previous page. Omit for the first page. It encodes the last item's timestamp and id, so it is stable while new notifications arrive.", type: "string", required: false },
  { key: "markAsRead", option: "--mark-as-read <mark-as-read>", name: "markAsRead", description: "Send the literal `true` to mark the notifications ON THIS PAGE read as a side effect of reading them. Any other value, including `1` and `false`, is accepted and leaves them unread.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
pagesCollaboration
  .command(`pages-editor-notifications-list`)
  .description(`The caller's own notifications, newest first, 20 at a time. Paged by an opaque cursor rather than by offset, so new arrivals never shift a page under the reader. It is also the one read in this app that writes: \`?markAsRead=true\` flags the notifications on the page it just returned as read, which is how a feed that has been looked at empties its badge without a second call — leave it off and reading changes nothing.`)
  .option(`--after <after>`, `Continue after this cursor — pass back the \`cursor\` from the previous page. Omit for the first page. It encodes the last item's timestamp and id, so it is stable while new notifications arrive.`)
  .option(`--mark-as-read <mark-as-read>`, `Send the literal \`true\` to mark the notifications ON THIS PAGE read as a side effect of reading them. Any other value, including \`1\` and \`false\`, is accepted and leaves them unread.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { after, markAsRead, filter } = await promptForMissing(
          _options,
          pagesEditorNotificationsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/notifications`;
        const _payload: RequestParams = {};
        if (after !== undefined) {
          _payload[`after`] = after;
        }
        if (markAsRead !== undefined) {
          _payload[`markAsRead`] = markAsRead;
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
registerPromptSpecs(pagesCollaboration.commands.at(-1)!, pagesEditorNotificationsListSpecs, { method: "get" });
pagesCollaboration
  .command(`pages-editor-notifications-mark-all-read`)
  .description(`Empties the badge in one call. Every unread notification of the CURRENT user is flagged read — the user is the one the request's context token names and there is no body with which to name another. Nothing is deleted: \`GET /pages/editor/notifications\` still returns the same feed, just with \`read\` set. The answer is the new unread count, so a client can set the badge straight from it without a second read.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/notifications/mark-all-read`;
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
pagesCollaboration
  .command(`pages-editor-notifications-unread-count`)
  .description(`The cheap poll behind the badge.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/notifications/unread-count`;
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
pagesCollaboration
  .command(`pages-editor-users`)
  .description(`What the @mention picker is filled from. When the identity service cannot be reached this degrades to the authors who have already commented on this tenant's pages rather than answering an error — a mention list that is short is more useful than one that is missing.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/users`;
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
const pagesEditorCommentsListSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
pagesCollaboration
  .command(`pages-editor-comments-list`)
  .description(`Every comment on the page in one flat list, oldest first, roots and replies together and resolved threads included — there is no filter and no paging, because the editor nests and filters them itself from \`parentUuid\` and pins each root to its blocks with \`blockUuids\`. Comments hang off the PAGE, not off a revision or an edit state, so publishing and reverting leave them standing; that is what makes them usable as a review trail across several rounds of edits.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, filter } = await promptForMissing(
          _options,
          pagesEditorCommentsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pagesCollaboration.commands.at(-1)!, pagesEditorCommentsListSpecs, { method: "get" });
const pagesEditorCommentsCreateSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
  { key: "body", option: "--body <body>", name: "body", description: "The comment, as editor HTML. `<span data-type=\"mention\" data-id=\"USER_ID\">` is what this app reads to decide whom to notify; `<li data-type=\"taskItem\" data-checked=\"false\">` makes a checkbox the toggle-task route can flip.", type: "string", required: true },
  { key: "blockUuids", option: "--block-uuids [block-uuids...]", name: "blockUuids", description: "The blocks this thread is about, so the editor can draw a marker next to them. Leave empty for a comment about the page as a whole.", type: "array", required: false },
  { key: "parentUuid", option: "--parent-uuid <parent-uuid>", name: "parentUuid", description: "The root comment this replies to. Omit for a new thread — only roots can be resolved.", type: "string", required: false },
];
pagesCollaboration
  .command(`pages-editor-comments-create`)
  .description(`The same route writes both kinds, and which one you get is decided by the body: \`blockUuids\` starts a new thread pinned to those blocks, \`parentUuid\` hangs a reply under an existing root. Everyone named with an @mention in the body is notified, and on a reply so is everybody already in the thread — the actor never notifies themselves.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .option(`--body <body>`, `The comment, as editor HTML. \`<span data-type="mention" data-id="USER_ID">\` is what this app reads to decide whom to notify; \`<li data-type="taskItem" data-checked="false">\` makes a checkbox the toggle-task route can flip.`)
  .option(`--block-uuids [block-uuids...]`, `The blocks this thread is about, so the editor can draw a marker next to them. Leave empty for a comment about the page as a whole.`)
  .option(`--parent-uuid <parent-uuid>`, `The root comment this replies to. Omit for a new thread — only roots can be resolved.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, body, blockUuids, parentUuid } = await promptForMissing(
          _options,
          pagesEditorCommentsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments`.replace(`{page_id}`, pageId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (blockUuids !== undefined) {
          _payload[`blockUuids`] = blockUuids;
        }
        if (body !== undefined) {
          _payload[`body`] = body;
        }
        if (parentUuid !== undefined) {
          _payload[`parentUuid`] = parentUuid;
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
registerPromptSpecs(pagesCollaboration.commands.at(-1)!, pagesEditorCommentsCreateSpecs, { method: "post" });
const pagesEditorCommentsDeleteSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
  { key: "uuid", option: "--uuid <uuid>", name: "uuid", description: "The comment id — the `uuid` of a `PageCommentItem`, not a row id of any other shape.", type: "string", required: true, resource: { listPath: "/pages/editor/{page_id}/comments", hasLimit: false } },
];
pagesCollaboration
  .command(`pages-editor-comments-delete`)
  .description(`A hard delete, and deleting a root takes its replies with it.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .option(`--uuid <uuid>`, `The comment id — the \`uuid\` of a \`PageCommentItem\`, not a row id of any other shape.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, uuid } = await promptForMissing(
          _options,
          pagesEditorCommentsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`pages-collaboration pages-editor-comments-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}`.replace(`{page_id}`, pageId).replace(`{uuid}`, uuid);
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
registerPromptSpecs(pagesCollaboration.commands.at(-1)!, pagesEditorCommentsDeleteSpecs, { method: "delete", destructive: true });
const pagesEditorCommentsUpdateSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
  { key: "uuid", option: "--uuid <uuid>", name: "uuid", description: "The comment id — the `uuid` of a `PageCommentItem`, not a row id of any other shape.", type: "string", required: true, resource: { listPath: "/pages/editor/{page_id}/comments", hasLimit: false } },
  { key: "body", option: "--body <body>", name: "body", description: "The comment, as editor HTML. Replaces the old body completely.", type: "string", required: true },
];
pagesCollaboration
  .command(`pages-editor-comments-update`)
  .description(`Rewrites what a comment says, and only its author may — a comment carries an \`author_id\` and anybody else is refused with 403. Only the body moves: what the comment is pinned to, whether the thread is resolved and who wrote it are all fixed when it is created. Rewriting a body does NOT re-run the @mention notifications, so mentioning somebody new by editing will not reach them. Answers the page's whole comment list rather than the one row, so a client can re-render from the response.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .option(`--uuid <uuid>`, `The comment id — the \`uuid\` of a \`PageCommentItem\`, not a row id of any other shape.`)
  .option(`--body <body>`, `The comment, as editor HTML. Replaces the old body completely.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, uuid, body } = await promptForMissing(
          _options,
          pagesEditorCommentsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}`.replace(`{page_id}`, pageId).replace(`{uuid}`, uuid);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (body !== undefined) {
          _payload[`body`] = body;
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
registerPromptSpecs(pagesCollaboration.commands.at(-1)!, pagesEditorCommentsUpdateSpecs, { method: "put" });
const pagesEditorCommentsResolveSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
  { key: "uuid", option: "--uuid <uuid>", name: "uuid", description: "The comment id — the `uuid` of a `PageCommentItem`, not a row id of any other shape.", type: "string", required: true, resource: { listPath: "/pages/editor/{page_id}/comments", hasLimit: false } },
];
pagesCollaboration
  .command(`pages-editor-comments-resolve`)
  .description(`Marks a thread handled, so the editor stops surfacing it on the block it is pinned to. Only a ROOT can be resolved — resolved-ness is a property of the thread and not of a message in it, so pointing this at a reply is refused with 400 rather than quietly resolving its parent. Nothing is deleted, nobody is notified, and the thread stays in the list; \`.../unresolve\` is the way back. Answers the page's whole comment list.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .option(`--uuid <uuid>`, `The comment id — the \`uuid\` of a \`PageCommentItem\`, not a row id of any other shape.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, uuid } = await promptForMissing(
          _options,
          pagesEditorCommentsResolveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}/resolve`.replace(`{page_id}`, pageId).replace(`{uuid}`, uuid);
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
registerPromptSpecs(pagesCollaboration.commands.at(-1)!, pagesEditorCommentsResolveSpecs, { method: "post" });
const pagesEditorCommentsToggleTaskSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
  { key: "uuid", option: "--uuid <uuid>", name: "uuid", description: "The comment id — the `uuid` of a `PageCommentItem`, not a row id of any other shape.", type: "string", required: true, resource: { listPath: "/pages/editor/{page_id}/comments", hasLimit: false } },
  { key: "taskIndex", option: "--task-index <task-index>", name: "taskIndex", description: "The task item to toggle, counted in document order from 0. A comment with fewer tasks than that answers 400, and so does anything that is not a whole number at or above 0.", type: "integer", required: true },
];
pagesCollaboration
  .command(`pages-editor-comments-toggle-task`)
  .description(`A comment body may carry a task list. This flips one checkbox by rewriting the body's markup, and answers the single comment rather than the whole list. A \`taskIndex\` that names no checkbox is refused and nothing is written — the comment's \`updated_at\` is the editor's "edited" marker, so a call that changes nothing must not move it.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .option(`--uuid <uuid>`, `The comment id — the \`uuid\` of a \`PageCommentItem\`, not a row id of any other shape.`)
  .option(`--task-index <task-index>`, `The task item to toggle, counted in document order from 0. A comment with fewer tasks than that answers 400, and so does anything that is not a whole number at or above 0.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, uuid, taskIndex } = await promptForMissing(
          _options,
          pagesEditorCommentsToggleTaskSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}/toggle-task`.replace(`{page_id}`, pageId).replace(`{uuid}`, uuid);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (taskIndex !== undefined) {
          _payload[`taskIndex`] = taskIndex;
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
registerPromptSpecs(pagesCollaboration.commands.at(-1)!, pagesEditorCommentsToggleTaskSpecs, { method: "post" });
const pagesEditorCommentsUnresolveSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "The page being edited.", type: "string", required: true },
  { key: "uuid", option: "--uuid <uuid>", name: "uuid", description: "The comment id — the `uuid` of a `PageCommentItem`, not a row id of any other shape.", type: "string", required: true, resource: { listPath: "/pages/editor/{page_id}/comments", hasLimit: false } },
];
pagesCollaboration
  .command(`pages-editor-comments-unresolve`)
  .description(`Clears the resolved flag and puts the thread back in front of whoever is editing — the mirror of \`.../resolve\` in every respect, including that only a root can be reopened and that a reply answers 400. A thread that was already open is accepted and stays open. Answers the page's whole comment list.`)
  .option(`--page-id <page-id>`, `The page being edited.`)
  .option(`--uuid <uuid>`, `The comment id — the \`uuid\` of a \`PageCommentItem\`, not a row id of any other shape.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, uuid } = await promptForMissing(
          _options,
          pagesEditorCommentsUnresolveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}/unresolve`.replace(`{page_id}`, pageId).replace(`{uuid}`, uuid);
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
registerPromptSpecs(pagesCollaboration.commands.at(-1)!, pagesEditorCommentsUnresolveSpecs, { method: "post" });
