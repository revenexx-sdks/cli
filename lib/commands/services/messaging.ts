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

export const messaging = new Command("messaging")
  .description(
    commandDescriptions["messaging"] ??
      `Outbound messaging: email/push messages, providers, topics, targets.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listMessagesSpecs: PromptSpec[] = [
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: scheduledAt, deliveredAt, deliveredTotal, status, description, providerType", type: "array", required: false },
  { key: "search", option: "--search <search>", name: "search", description: "Search term to filter your list results. Max length: 256 chars.", type: "string", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`list-messages`)
  .description(`Get a list of all messages from the current Revenexx project.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: scheduledAt, deliveredAt, deliveredTotal, status, description, providerType`)
  .option(`--search <search>`, `Search term to filter your list results. Max length: 256 chars.`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { queries, search, total, filter } = await promptForMissing(
          _options,
          listMessagesSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages`;
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (search !== undefined) {
          _payload[`search`] = search;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
registerPromptSpecs(messaging.commands.at(-1)!, listMessagesSpecs, { method: "get" });
const createEmailSpecs: PromptSpec[] = [
  { key: "content", option: "--content <content>", name: "content", description: "Email Content.", type: "string", required: true },
  { key: "messageId", option: "--message-id <message-id>", name: "messageId", description: "Message ID. Choose a custom ID or generate a random ID with `ID.unique()`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.", type: "string", required: true },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "Email Subject.", type: "string", required: true },
  { key: "attachments", option: "--attachments [attachments...]", name: "attachments", description: "Array of compound ID strings of bucket IDs and file IDs to be attached to the email. They should be formatted as <BUCKET_ID>:<FILE_ID>.", type: "array", required: false },
  { key: "bcc", option: "--bcc [bcc...]", name: "bcc", description: "Array of target IDs to be added as BCC.", type: "array", required: false },
  { key: "cc", option: "--cc [cc...]", name: "cc", description: "Array of target IDs to be added as CC.", type: "array", required: false },
  { key: "draft", option: "--draft <draft>", name: "draft", description: "Is message a draft", type: "boolean", required: false },
  { key: "html", option: "--html <html>", name: "html", description: "Is content of type HTML", type: "boolean", required: false },
  { key: "scheduledAt", option: "--scheduled-at <scheduled-at>", name: "scheduledAt", description: "Scheduled delivery time for message in [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format. DateTime value must be in future.", type: "string", required: false },
  { key: "targets", option: "--targets [targets...]", name: "targets", description: "List of Targets IDs.", type: "array", required: false },
  { key: "topics", option: "--topics [topics...]", name: "topics", description: "List of Topic IDs.", type: "array", required: false },
  { key: "users", option: "--users [users...]", name: "users", description: "List of User IDs.", type: "array", required: false },
];
messaging
  .command(`create-email`)
  .description(`Create a new email message.`)
  .option(`--content <content>`, `Email Content.`)
  .option(`--message-id <message-id>`, `Message ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
  .option(`--subject <subject>`, `Email Subject.`)
  .option(`--attachments [attachments...]`, `Array of compound ID strings of bucket IDs and file IDs to be attached to the email. They should be formatted as <BUCKET_ID>:<FILE_ID>.`)
  .option(`--bcc [bcc...]`, `Array of target IDs to be added as BCC.`)
  .option(`--cc [cc...]`, `Array of target IDs to be added as CC.`)
  .option(
    `--draft [value]`,
    `Is message a draft`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--html [value]`,
    `Is content of type HTML`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--scheduled-at <scheduled-at>`, `Scheduled delivery time for message in [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format. DateTime value must be in future.`)
  .option(`--targets [targets...]`, `List of Targets IDs.`)
  .option(`--topics [topics...]`, `List of Topic IDs.`)
  .option(`--users [users...]`, `List of User IDs.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { content, messageId, subject, attachments, bcc, cc, draft, html, scheduledAt, targets, topics, users } = await promptForMissing(
          _options,
          createEmailSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages/email`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (attachments !== undefined) {
          _payload[`attachments`] = attachments;
        }
        if (bcc !== undefined) {
          _payload[`bcc`] = bcc;
        }
        if (cc !== undefined) {
          _payload[`cc`] = cc;
        }
        if (content !== undefined) {
          _payload[`content`] = content;
        }
        if (draft !== undefined) {
          _payload[`draft`] = draft;
        }
        if (html !== undefined) {
          _payload[`html`] = html;
        }
        if (messageId !== undefined) {
          _payload[`messageId`] = messageId;
        }
        if (scheduledAt !== undefined) {
          _payload[`scheduledAt`] = scheduledAt;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
        }
        if (targets !== undefined) {
          _payload[`targets`] = targets;
        }
        if (topics !== undefined) {
          _payload[`topics`] = topics;
        }
        if (users !== undefined) {
          _payload[`users`] = users;
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
registerPromptSpecs(messaging.commands.at(-1)!, createEmailSpecs, { method: "post" });
const updateEmailSpecs: PromptSpec[] = [
  { key: "messageId", option: "--message-id <message-id>", name: "messageId", description: "Message ID.", type: "string", required: true },
  { key: "attachments", option: "--attachments [attachments...]", name: "attachments", description: "Array of compound ID strings of bucket IDs and file IDs to be attached to the email. They should be formatted as <BUCKET_ID>:<FILE_ID>.", type: "array", required: false },
  { key: "bcc", option: "--bcc [bcc...]", name: "bcc", description: "Array of target IDs to be added as BCC.", type: "array", required: false },
  { key: "cc", option: "--cc [cc...]", name: "cc", description: "Array of target IDs to be added as CC.", type: "array", required: false },
  { key: "content", option: "--content <content>", name: "content", description: "Email Content.", type: "string", required: false },
  { key: "draft", option: "--draft <draft>", name: "draft", description: "Is message a draft", type: "boolean", required: false },
  { key: "html", option: "--html <html>", name: "html", description: "Is content of type HTML", type: "boolean", required: false },
  { key: "scheduledAt", option: "--scheduled-at <scheduled-at>", name: "scheduledAt", description: "Scheduled delivery time for message in [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format. DateTime value must be in future.", type: "string", required: false },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "Email Subject.", type: "string", required: false },
  { key: "targets", option: "--targets [targets...]", name: "targets", description: "List of Targets IDs.", type: "array", required: false },
  { key: "topics", option: "--topics [topics...]", name: "topics", description: "List of Topic IDs.", type: "array", required: false },
  { key: "users", option: "--users [users...]", name: "users", description: "List of User IDs.", type: "array", required: false },
];
messaging
  .command(`update-email`)
  .description(`Update an email message by its unique ID. This endpoint only works on messages that are in draft status. Messages that are already processing, sent, or failed cannot be updated.`)
  .option(`--message-id <message-id>`, `Message ID.`)
  .option(`--attachments [attachments...]`, `Array of compound ID strings of bucket IDs and file IDs to be attached to the email. They should be formatted as <BUCKET_ID>:<FILE_ID>.`)
  .option(`--bcc [bcc...]`, `Array of target IDs to be added as BCC.`)
  .option(`--cc [cc...]`, `Array of target IDs to be added as CC.`)
  .option(`--content <content>`, `Email Content.`)
  .option(
    `--draft [value]`,
    `Is message a draft`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--html [value]`,
    `Is content of type HTML`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--scheduled-at <scheduled-at>`, `Scheduled delivery time for message in [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format. DateTime value must be in future.`)
  .option(`--subject <subject>`, `Email Subject.`)
  .option(`--targets [targets...]`, `List of Targets IDs.`)
  .option(`--topics [topics...]`, `List of Topic IDs.`)
  .option(`--users [users...]`, `List of User IDs.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { messageId, attachments, bcc, cc, content, draft, html, scheduledAt, subject, targets, topics, users } = await promptForMissing(
          _options,
          updateEmailSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages/email/{messageId}`.replace(`{messageId}`, messageId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (attachments !== undefined) {
          _payload[`attachments`] = attachments;
        }
        if (bcc !== undefined) {
          _payload[`bcc`] = bcc;
        }
        if (cc !== undefined) {
          _payload[`cc`] = cc;
        }
        if (content !== undefined) {
          _payload[`content`] = content;
        }
        if (draft !== undefined) {
          _payload[`draft`] = draft;
        }
        if (html !== undefined) {
          _payload[`html`] = html;
        }
        if (scheduledAt !== undefined) {
          _payload[`scheduledAt`] = scheduledAt;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
        }
        if (targets !== undefined) {
          _payload[`targets`] = targets;
        }
        if (topics !== undefined) {
          _payload[`topics`] = topics;
        }
        if (users !== undefined) {
          _payload[`users`] = users;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(messaging.commands.at(-1)!, updateEmailSpecs, { method: "patch" });
const createPushSpecs: PromptSpec[] = [
  { key: "messageId", option: "--message-id <message-id>", name: "messageId", description: "Message ID. Choose a custom ID or generate a random ID with `ID.unique()`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.", type: "string", required: true },
  { key: "action", option: "--action <action>", name: "action", description: "Action for push notification.", type: "string", required: false },
  { key: "badge", option: "--badge <badge>", name: "badge", description: "Badge for push notification. Available only for iOS Platform.", type: "integer", required: false },
  { key: "body", option: "--body <body>", name: "body", description: "Body for push notification.", type: "string", required: false },
  { key: "color", option: "--color <color>", name: "color", description: "Color for push notification. Available only for Android Platform.", type: "string", required: false },
  { key: "contentAvailable", option: "--content-available <content-available>", name: "contentAvailable", description: "If set to true, the notification will be delivered in the background. Available only for iOS Platform.", type: "boolean", required: false },
  { key: "critical", option: "--critical <critical>", name: "critical", description: "If set to true, the notification will be marked as critical. This requires the app to have the critical notification entitlement. Available only for iOS Platform.", type: "boolean", required: false },
  { key: "data", option: "--data <data>", name: "data", description: "Additional key-value pair data for push notification.", type: "object", required: false },
  { key: "draft", option: "--draft <draft>", name: "draft", description: "Is message a draft", type: "boolean", required: false },
  { key: "icon", option: "--icon <icon>", name: "icon", description: "Icon for push notification. Available only for Android and Web Platform.", type: "string", required: false },
  { key: "image", option: "--image <image>", name: "image", description: "Image for push notification. Must be a compound bucket ID to file ID of a jpeg, png, or bmp image in Appwrite Storage. It should be formatted as <BUCKET_ID>:<FILE_ID>.", type: "string", required: false },
  { key: "priority", option: "--priority <priority>", name: "priority", description: "Set the notification priority. \"normal\" will consider device state and may not deliver notifications immediately. \"high\" will always attempt to immediately deliver the notification.", type: "string", required: false, enum: ["normal","high"] },
  { key: "scheduledAt", option: "--scheduled-at <scheduled-at>", name: "scheduledAt", description: "Scheduled delivery time for message in [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format. DateTime value must be in future.", type: "string", required: false },
  { key: "sound", option: "--sound <sound>", name: "sound", description: "Sound for push notification. Available only for Android and iOS Platform.", type: "string", required: false },
  { key: "tag", option: "--tag <tag>", name: "tag", description: "Tag for push notification. Available only for Android Platform.", type: "string", required: false },
  { key: "targets", option: "--targets [targets...]", name: "targets", description: "List of Targets IDs.", type: "array", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "Title for push notification.", type: "string", required: false },
  { key: "topics", option: "--topics [topics...]", name: "topics", description: "List of Topic IDs.", type: "array", required: false },
  { key: "users", option: "--users [users...]", name: "users", description: "List of User IDs.", type: "array", required: false },
];
messaging
  .command(`create-push`)
  .description(`Create a new push notification.`)
  .option(`--message-id <message-id>`, `Message ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
  .option(`--action <action>`, `Action for push notification.`)
  .option(`--badge <badge>`, `Badge for push notification. Available only for iOS Platform.`, parseInteger)
  .option(`--body <body>`, `Body for push notification.`)
  .option(`--color <color>`, `Color for push notification. Available only for Android Platform.`)
  .option(
    `--content-available [value]`,
    `If set to true, the notification will be delivered in the background. Available only for iOS Platform.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--critical [value]`,
    `If set to true, the notification will be marked as critical. This requires the app to have the critical notification entitlement. Available only for iOS Platform.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--data <data>`, `Additional key-value pair data for push notification.`)
  .option(
    `--draft [value]`,
    `Is message a draft`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--icon <icon>`, `Icon for push notification. Available only for Android and Web Platform.`)
  .option(`--image <image>`, `Image for push notification. Must be a compound bucket ID to file ID of a jpeg, png, or bmp image in Appwrite Storage. It should be formatted as <BUCKET_ID>:<FILE_ID>.`)
  .option(`--priority <priority>`, `Set the notification priority. "normal" will consider device state and may not deliver notifications immediately. "high" will always attempt to immediately deliver the notification.`)
  .option(`--scheduled-at <scheduled-at>`, `Scheduled delivery time for message in [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format. DateTime value must be in future.`)
  .option(`--sound <sound>`, `Sound for push notification. Available only for Android and iOS Platform.`)
  .option(`--tag <tag>`, `Tag for push notification. Available only for Android Platform.`)
  .option(`--targets [targets...]`, `List of Targets IDs.`)
  .option(`--title <title>`, `Title for push notification.`)
  .option(`--topics [topics...]`, `List of Topic IDs.`)
  .option(`--users [users...]`, `List of User IDs.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { messageId, action, badge, body, color, contentAvailable, critical, data, draft, icon, image, priority, scheduledAt, sound, tag, targets, title, topics, users } = await promptForMissing(
          _options,
          createPushSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages/push`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (action !== undefined) {
          _payload[`action`] = action;
        }
        if (badge !== undefined) {
          _payload[`badge`] = badge;
        }
        if (body !== undefined) {
          _payload[`body`] = body;
        }
        if (color !== undefined) {
          _payload[`color`] = color;
        }
        if (contentAvailable !== undefined) {
          _payload[`contentAvailable`] = contentAvailable;
        }
        if (critical !== undefined) {
          _payload[`critical`] = critical;
        }
        if (data !== undefined) {
          _payload[`data`] = resolveBodyParam(data);
        }
        if (draft !== undefined) {
          _payload[`draft`] = draft;
        }
        if (icon !== undefined) {
          _payload[`icon`] = icon;
        }
        if (image !== undefined) {
          _payload[`image`] = image;
        }
        if (messageId !== undefined) {
          _payload[`messageId`] = messageId;
        }
        if (priority !== undefined) {
          _payload[`priority`] = priority;
        }
        if (scheduledAt !== undefined) {
          _payload[`scheduledAt`] = scheduledAt;
        }
        if (sound !== undefined) {
          _payload[`sound`] = sound;
        }
        if (tag !== undefined) {
          _payload[`tag`] = tag;
        }
        if (targets !== undefined) {
          _payload[`targets`] = targets;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (topics !== undefined) {
          _payload[`topics`] = topics;
        }
        if (users !== undefined) {
          _payload[`users`] = users;
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
registerPromptSpecs(messaging.commands.at(-1)!, createPushSpecs, { method: "post" });
const updatePushSpecs: PromptSpec[] = [
  { key: "messageId", option: "--message-id <message-id>", name: "messageId", description: "Message ID.", type: "string", required: true },
  { key: "action", option: "--action <action>", name: "action", description: "Action for push notification.", type: "string", required: false },
  { key: "badge", option: "--badge <badge>", name: "badge", description: "Badge for push notification. Available only for iOS platforms.", type: "integer", required: false },
  { key: "body", option: "--body <body>", name: "body", description: "Body for push notification.", type: "string", required: false },
  { key: "color", option: "--color <color>", name: "color", description: "Color for push notification. Available only for Android platforms.", type: "string", required: false },
  { key: "contentAvailable", option: "--content-available <content-available>", name: "contentAvailable", description: "If set to true, the notification will be delivered in the background. Available only for iOS Platform.", type: "boolean", required: false },
  { key: "critical", option: "--critical <critical>", name: "critical", description: "If set to true, the notification will be marked as critical. This requires the app to have the critical notification entitlement. Available only for iOS Platform.", type: "boolean", required: false },
  { key: "data", option: "--data <data>", name: "data", description: "Additional Data for push notification.", type: "object", required: false },
  { key: "draft", option: "--draft <draft>", name: "draft", description: "Is message a draft", type: "boolean", required: false },
  { key: "icon", option: "--icon <icon>", name: "icon", description: "Icon for push notification. Available only for Android and Web platforms.", type: "string", required: false },
  { key: "image", option: "--image <image>", name: "image", description: "Image for push notification. Must be a compound bucket ID to file ID of a jpeg, png, or bmp image in Appwrite Storage. It should be formatted as <BUCKET_ID>:<FILE_ID>.", type: "string", required: false },
  { key: "priority", option: "--priority <priority>", name: "priority", description: "Set the notification priority. \"normal\" will consider device battery state and may send notifications later. \"high\" will always attempt to immediately deliver the notification.", type: "string", required: false, enum: ["normal","high"] },
  { key: "scheduledAt", option: "--scheduled-at <scheduled-at>", name: "scheduledAt", description: "Scheduled delivery time for message in [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format. DateTime value must be in future.", type: "string", required: false },
  { key: "sound", option: "--sound <sound>", name: "sound", description: "Sound for push notification. Available only for Android and iOS platforms.", type: "string", required: false },
  { key: "tag", option: "--tag <tag>", name: "tag", description: "Tag for push notification. Available only for Android platforms.", type: "string", required: false },
  { key: "targets", option: "--targets [targets...]", name: "targets", description: "List of Targets IDs.", type: "array", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "Title for push notification.", type: "string", required: false },
  { key: "topics", option: "--topics [topics...]", name: "topics", description: "List of Topic IDs.", type: "array", required: false },
  { key: "users", option: "--users [users...]", name: "users", description: "List of User IDs.", type: "array", required: false },
];
messaging
  .command(`update-push`)
  .description(`Update a push notification by its unique ID. This endpoint only works on messages that are in draft status. Messages that are already processing, sent, or failed cannot be updated.`)
  .option(`--message-id <message-id>`, `Message ID.`)
  .option(`--action <action>`, `Action for push notification.`)
  .option(`--badge <badge>`, `Badge for push notification. Available only for iOS platforms.`, parseInteger)
  .option(`--body <body>`, `Body for push notification.`)
  .option(`--color <color>`, `Color for push notification. Available only for Android platforms.`)
  .option(
    `--content-available [value]`,
    `If set to true, the notification will be delivered in the background. Available only for iOS Platform.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--critical [value]`,
    `If set to true, the notification will be marked as critical. This requires the app to have the critical notification entitlement. Available only for iOS Platform.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--data <data>`, `Additional Data for push notification.`)
  .option(
    `--draft [value]`,
    `Is message a draft`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--icon <icon>`, `Icon for push notification. Available only for Android and Web platforms.`)
  .option(`--image <image>`, `Image for push notification. Must be a compound bucket ID to file ID of a jpeg, png, or bmp image in Appwrite Storage. It should be formatted as <BUCKET_ID>:<FILE_ID>.`)
  .option(`--priority <priority>`, `Set the notification priority. "normal" will consider device battery state and may send notifications later. "high" will always attempt to immediately deliver the notification.`)
  .option(`--scheduled-at <scheduled-at>`, `Scheduled delivery time for message in [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format. DateTime value must be in future.`)
  .option(`--sound <sound>`, `Sound for push notification. Available only for Android and iOS platforms.`)
  .option(`--tag <tag>`, `Tag for push notification. Available only for Android platforms.`)
  .option(`--targets [targets...]`, `List of Targets IDs.`)
  .option(`--title <title>`, `Title for push notification.`)
  .option(`--topics [topics...]`, `List of Topic IDs.`)
  .option(`--users [users...]`, `List of User IDs.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { messageId, action, badge, body, color, contentAvailable, critical, data, draft, icon, image, priority, scheduledAt, sound, tag, targets, title, topics, users } = await promptForMissing(
          _options,
          updatePushSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages/push/{messageId}`.replace(`{messageId}`, messageId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (action !== undefined) {
          _payload[`action`] = action;
        }
        if (badge !== undefined) {
          _payload[`badge`] = badge;
        }
        if (body !== undefined) {
          _payload[`body`] = body;
        }
        if (color !== undefined) {
          _payload[`color`] = color;
        }
        if (contentAvailable !== undefined) {
          _payload[`contentAvailable`] = contentAvailable;
        }
        if (critical !== undefined) {
          _payload[`critical`] = critical;
        }
        if (data !== undefined) {
          _payload[`data`] = resolveBodyParam(data);
        }
        if (draft !== undefined) {
          _payload[`draft`] = draft;
        }
        if (icon !== undefined) {
          _payload[`icon`] = icon;
        }
        if (image !== undefined) {
          _payload[`image`] = image;
        }
        if (priority !== undefined) {
          _payload[`priority`] = priority;
        }
        if (scheduledAt !== undefined) {
          _payload[`scheduledAt`] = scheduledAt;
        }
        if (sound !== undefined) {
          _payload[`sound`] = sound;
        }
        if (tag !== undefined) {
          _payload[`tag`] = tag;
        }
        if (targets !== undefined) {
          _payload[`targets`] = targets;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (topics !== undefined) {
          _payload[`topics`] = topics;
        }
        if (users !== undefined) {
          _payload[`users`] = users;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(messaging.commands.at(-1)!, updatePushSpecs, { method: "patch" });
const deleteSpecs: PromptSpec[] = [
  { key: "messageId", option: "--message-id <message-id>", name: "messageId", description: "Message ID.", type: "string", required: true, resource: { listPath: "/messaging/messages", hasLimit: false, search: true } },
];
messaging
  .command(`delete`)
  .description(`Delete a message. If the message is not a draft or scheduled, but has been sent, this will not recall the message.`)
  .option(`--message-id <message-id>`, `Message ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { messageId } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`messaging delete`);
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages/{messageId}`.replace(`{messageId}`, messageId);
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
registerPromptSpecs(messaging.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getMessageSpecs: PromptSpec[] = [
  { key: "messageId", option: "--message-id <message-id>", name: "messageId", description: "Message ID.", type: "string", required: true, resource: { listPath: "/messaging/messages", hasLimit: false, search: true } },
];
messaging
  .command(`get-message`)
  .description(`Get a message by its unique ID.`)
  .option(`--message-id <message-id>`, `Message ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { messageId } = await promptForMissing(
          _options,
          getMessageSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages/{messageId}`.replace(`{messageId}`, messageId);
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
registerPromptSpecs(messaging.commands.at(-1)!, getMessageSpecs, { method: "get" });
const listMessageLogsSpecs: PromptSpec[] = [
  { key: "messageId", option: "--message-id <message-id>", name: "messageId", description: "Message ID.", type: "string", required: true, resource: { listPath: "/messaging/messages", hasLimit: false, search: true } },
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Only supported methods are limit and offset", type: "array", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`list-message-logs`)
  .description(`Get the message activity logs listed by its unique ID.`)
  .option(`--message-id <message-id>`, `Message ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Only supported methods are limit and offset`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { messageId, queries, total, filter } = await promptForMissing(
          _options,
          listMessageLogsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages/{messageId}/logs`.replace(`{messageId}`, messageId);
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
registerPromptSpecs(messaging.commands.at(-1)!, listMessageLogsSpecs, { method: "get" });
const listTargetsSpecs: PromptSpec[] = [
  { key: "messageId", option: "--message-id <message-id>", name: "messageId", description: "Message ID.", type: "string", required: true, resource: { listPath: "/messaging/messages", hasLimit: false, search: true } },
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: userId, providerId, identifier, providerType", type: "array", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`list-targets`)
  .description(`Get a list of the targets associated with a message.`)
  .option(`--message-id <message-id>`, `Message ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: userId, providerId, identifier, providerType`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { messageId, queries, total, filter } = await promptForMissing(
          _options,
          listTargetsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages/{messageId}/targets`.replace(`{messageId}`, messageId);
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
registerPromptSpecs(messaging.commands.at(-1)!, listTargetsSpecs, { method: "get" });
const listProvidersSpecs: PromptSpec[] = [
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: name, provider, type, enabled", type: "array", required: false },
  { key: "search", option: "--search <search>", name: "search", description: "Search term to filter your list results. Max length: 256 chars.", type: "string", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`list-providers`)
  .description(`Get a list of all providers from the current Revenexx project.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: name, provider, type, enabled`)
  .option(`--search <search>`, `Search term to filter your list results. Max length: 256 chars.`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { queries, search, total, filter } = await promptForMissing(
          _options,
          listProvidersSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers`;
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (search !== undefined) {
          _payload[`search`] = search;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
registerPromptSpecs(messaging.commands.at(-1)!, listProvidersSpecs, { method: "get" });
const createMailgunProviderSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Provider name.", type: "string", required: true },
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID. Choose a custom ID or generate a random ID with `ID.unique()`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.", type: "string", required: true },
  { key: "apiKey", option: "--api-key <api-key>", name: "apiKey", description: "Mailgun API Key.", type: "string", required: false, secret: true },
  { key: "domain", option: "--domain <domain>", name: "domain", description: "Mailgun Domain.", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Set as enabled.", type: "boolean", required: false },
  { key: "fromEmail", option: "--from-email <from-email>", name: "fromEmail", description: "Sender email address.", type: "string", required: false },
  { key: "fromName", option: "--from-name <from-name>", name: "fromName", description: "Sender Name.", type: "string", required: false },
  { key: "isEuRegion", option: "--is-eu-region <is-eu-region>", name: "isEuRegion", description: "Set as EU region.", type: "boolean", required: false },
  { key: "replyToEmail", option: "--reply-to-email <reply-to-email>", name: "replyToEmail", description: "Email set in the reply to field for the mail. Default value is sender email. Reply to email must have reply to name as well.", type: "string", required: false },
  { key: "replyToName", option: "--reply-to-name <reply-to-name>", name: "replyToName", description: "Name set in the reply to field for the mail. Default value is sender name. Reply to name must have reply to email as well.", type: "string", required: false },
];
messaging
  .command(`create-mailgun-provider`)
  .description(`Create a new Mailgun provider.`)
  .option(`--name <name>`, `Provider name.`)
  .option(`--provider-id <provider-id>`, `Provider ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
  .option(`--api-key <api-key>`, `Mailgun API Key.`)
  .option(`--domain <domain>`, `Mailgun Domain.`)
  .option(
    `--enabled [value]`,
    `Set as enabled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--from-email <from-email>`, `Sender email address.`)
  .option(`--from-name <from-name>`, `Sender Name.`)
  .option(
    `--is-eu-region [value]`,
    `Set as EU region.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--reply-to-email <reply-to-email>`, `Email set in the reply to field for the mail. Default value is sender email. Reply to email must have reply to name as well.`)
  .option(`--reply-to-name <reply-to-name>`, `Name set in the reply to field for the mail. Default value is sender name. Reply to name must have reply to email as well.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, providerId, apiKey, domain, enabled, fromEmail, fromName, isEuRegion, replyToEmail, replyToName } = await promptForMissing(
          _options,
          createMailgunProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/mailgun`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (apiKey !== undefined) {
          _payload[`apiKey`] = apiKey;
        }
        if (domain !== undefined) {
          _payload[`domain`] = domain;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (fromEmail !== undefined) {
          _payload[`fromEmail`] = fromEmail;
        }
        if (fromName !== undefined) {
          _payload[`fromName`] = fromName;
        }
        if (isEuRegion !== undefined) {
          _payload[`isEuRegion`] = isEuRegion;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (providerId !== undefined) {
          _payload[`providerId`] = providerId;
        }
        if (replyToEmail !== undefined) {
          _payload[`replyToEmail`] = replyToEmail;
        }
        if (replyToName !== undefined) {
          _payload[`replyToName`] = replyToName;
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
registerPromptSpecs(messaging.commands.at(-1)!, createMailgunProviderSpecs, { method: "post" });
const updateMailgunProviderSpecs: PromptSpec[] = [
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID.", type: "string", required: true },
  { key: "apiKey", option: "--api-key <api-key>", name: "apiKey", description: "Mailgun API Key.", type: "string", required: false, secret: true },
  { key: "domain", option: "--domain <domain>", name: "domain", description: "Mailgun Domain.", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Set as enabled.", type: "boolean", required: false },
  { key: "fromEmail", option: "--from-email <from-email>", name: "fromEmail", description: "Sender email address.", type: "string", required: false },
  { key: "fromName", option: "--from-name <from-name>", name: "fromName", description: "Sender Name.", type: "string", required: false },
  { key: "isEuRegion", option: "--is-eu-region <is-eu-region>", name: "isEuRegion", description: "Set as EU region.", type: "boolean", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Provider name.", type: "string", required: false },
  { key: "replyToEmail", option: "--reply-to-email <reply-to-email>", name: "replyToEmail", description: "Email set in the reply to field for the mail. Default value is sender email.", type: "string", required: false },
  { key: "replyToName", option: "--reply-to-name <reply-to-name>", name: "replyToName", description: "Name set in the reply to field for the mail. Default value is sender name.", type: "string", required: false },
];
messaging
  .command(`update-mailgun-provider`)
  .description(`Update a Mailgun provider by its unique ID.`)
  .option(`--provider-id <provider-id>`, `Provider ID.`)
  .option(`--api-key <api-key>`, `Mailgun API Key.`)
  .option(`--domain <domain>`, `Mailgun Domain.`)
  .option(
    `--enabled [value]`,
    `Set as enabled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--from-email <from-email>`, `Sender email address.`)
  .option(`--from-name <from-name>`, `Sender Name.`)
  .option(
    `--is-eu-region [value]`,
    `Set as EU region.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--name <name>`, `Provider name.`)
  .option(`--reply-to-email <reply-to-email>`, `Email set in the reply to field for the mail. Default value is sender email.`)
  .option(`--reply-to-name <reply-to-name>`, `Name set in the reply to field for the mail. Default value is sender name.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { providerId, apiKey, domain, enabled, fromEmail, fromName, isEuRegion, name, replyToEmail, replyToName } = await promptForMissing(
          _options,
          updateMailgunProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/mailgun/{providerId}`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (apiKey !== undefined) {
          _payload[`apiKey`] = apiKey;
        }
        if (domain !== undefined) {
          _payload[`domain`] = domain;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (fromEmail !== undefined) {
          _payload[`fromEmail`] = fromEmail;
        }
        if (fromName !== undefined) {
          _payload[`fromName`] = fromName;
        }
        if (isEuRegion !== undefined) {
          _payload[`isEuRegion`] = isEuRegion;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (replyToEmail !== undefined) {
          _payload[`replyToEmail`] = replyToEmail;
        }
        if (replyToName !== undefined) {
          _payload[`replyToName`] = replyToName;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(messaging.commands.at(-1)!, updateMailgunProviderSpecs, { method: "patch" });
const createMsg91ProviderSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Provider name.", type: "string", required: true },
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID. Choose a custom ID or generate a random ID with `ID.unique()`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.", type: "string", required: true },
  { key: "authKey", option: "--auth-key <auth-key>", name: "authKey", description: "Msg91 auth key.", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Set as enabled.", type: "boolean", required: false },
  { key: "senderId", option: "--sender-id <sender-id>", name: "senderId", description: "Msg91 sender ID.", type: "string", required: false },
  { key: "templateId", option: "--template-id <template-id>", name: "templateId", description: "Msg91 template ID", type: "string", required: false },
];
messaging
  .command(`create-msg-91-provider`)
  .description(`Create a new MSG91 provider.`)
  .option(`--name <name>`, `Provider name.`)
  .option(`--provider-id <provider-id>`, `Provider ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
  .option(`--auth-key <auth-key>`, `Msg91 auth key.`)
  .option(
    `--enabled [value]`,
    `Set as enabled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--sender-id <sender-id>`, `Msg91 sender ID.`)
  .option(`--template-id <template-id>`, `Msg91 template ID`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, providerId, authKey, enabled, senderId, templateId } = await promptForMissing(
          _options,
          createMsg91ProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/msg91`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (authKey !== undefined) {
          _payload[`authKey`] = authKey;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (providerId !== undefined) {
          _payload[`providerId`] = providerId;
        }
        if (senderId !== undefined) {
          _payload[`senderId`] = senderId;
        }
        if (templateId !== undefined) {
          _payload[`templateId`] = templateId;
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
registerPromptSpecs(messaging.commands.at(-1)!, createMsg91ProviderSpecs, { method: "post" });
const updateMsg91ProviderSpecs: PromptSpec[] = [
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID.", type: "string", required: true },
  { key: "authKey", option: "--auth-key <auth-key>", name: "authKey", description: "Msg91 auth key.", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Set as enabled.", type: "boolean", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Provider name.", type: "string", required: false },
  { key: "senderId", option: "--sender-id <sender-id>", name: "senderId", description: "Msg91 sender ID.", type: "string", required: false },
  { key: "templateId", option: "--template-id <template-id>", name: "templateId", description: "Msg91 template ID.", type: "string", required: false },
];
messaging
  .command(`update-msg-91-provider`)
  .description(`Update a MSG91 provider by its unique ID.`)
  .option(`--provider-id <provider-id>`, `Provider ID.`)
  .option(`--auth-key <auth-key>`, `Msg91 auth key.`)
  .option(
    `--enabled [value]`,
    `Set as enabled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--name <name>`, `Provider name.`)
  .option(`--sender-id <sender-id>`, `Msg91 sender ID.`)
  .option(`--template-id <template-id>`, `Msg91 template ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { providerId, authKey, enabled, name, senderId, templateId } = await promptForMissing(
          _options,
          updateMsg91ProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/msg91/{providerId}`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (authKey !== undefined) {
          _payload[`authKey`] = authKey;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (senderId !== undefined) {
          _payload[`senderId`] = senderId;
        }
        if (templateId !== undefined) {
          _payload[`templateId`] = templateId;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(messaging.commands.at(-1)!, updateMsg91ProviderSpecs, { method: "patch" });
const createResendProviderSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Provider name.", type: "string", required: true },
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID. Choose a custom ID or generate a random ID with `ID.unique()`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.", type: "string", required: true },
  { key: "apiKey", option: "--api-key <api-key>", name: "apiKey", description: "Resend API key.", type: "string", required: false, secret: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Set as enabled.", type: "boolean", required: false },
  { key: "fromEmail", option: "--from-email <from-email>", name: "fromEmail", description: "Sender email address.", type: "string", required: false },
  { key: "fromName", option: "--from-name <from-name>", name: "fromName", description: "Sender Name.", type: "string", required: false },
  { key: "replyToEmail", option: "--reply-to-email <reply-to-email>", name: "replyToEmail", description: "Email set in the reply to field for the mail. Default value is sender email.", type: "string", required: false },
  { key: "replyToName", option: "--reply-to-name <reply-to-name>", name: "replyToName", description: "Name set in the reply to field for the mail. Default value is sender name.", type: "string", required: false },
];
messaging
  .command(`create-resend-provider`)
  .description(`Create a new Resend provider.`)
  .option(`--name <name>`, `Provider name.`)
  .option(`--provider-id <provider-id>`, `Provider ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
  .option(`--api-key <api-key>`, `Resend API key.`)
  .option(
    `--enabled [value]`,
    `Set as enabled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--from-email <from-email>`, `Sender email address.`)
  .option(`--from-name <from-name>`, `Sender Name.`)
  .option(`--reply-to-email <reply-to-email>`, `Email set in the reply to field for the mail. Default value is sender email.`)
  .option(`--reply-to-name <reply-to-name>`, `Name set in the reply to field for the mail. Default value is sender name.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, providerId, apiKey, enabled, fromEmail, fromName, replyToEmail, replyToName } = await promptForMissing(
          _options,
          createResendProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/resend`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (apiKey !== undefined) {
          _payload[`apiKey`] = apiKey;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (fromEmail !== undefined) {
          _payload[`fromEmail`] = fromEmail;
        }
        if (fromName !== undefined) {
          _payload[`fromName`] = fromName;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (providerId !== undefined) {
          _payload[`providerId`] = providerId;
        }
        if (replyToEmail !== undefined) {
          _payload[`replyToEmail`] = replyToEmail;
        }
        if (replyToName !== undefined) {
          _payload[`replyToName`] = replyToName;
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
registerPromptSpecs(messaging.commands.at(-1)!, createResendProviderSpecs, { method: "post" });
const updateResendProviderSpecs: PromptSpec[] = [
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID.", type: "string", required: true },
  { key: "apiKey", option: "--api-key <api-key>", name: "apiKey", description: "Resend API key.", type: "string", required: false, secret: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Set as enabled.", type: "boolean", required: false },
  { key: "fromEmail", option: "--from-email <from-email>", name: "fromEmail", description: "Sender email address.", type: "string", required: false },
  { key: "fromName", option: "--from-name <from-name>", name: "fromName", description: "Sender Name.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Provider name.", type: "string", required: false },
  { key: "replyToEmail", option: "--reply-to-email <reply-to-email>", name: "replyToEmail", description: "Email set in the Reply To field for the mail. Default value is Sender Email.", type: "string", required: false },
  { key: "replyToName", option: "--reply-to-name <reply-to-name>", name: "replyToName", description: "Name set in the Reply To field for the mail. Default value is Sender Name.", type: "string", required: false },
];
messaging
  .command(`update-resend-provider`)
  .description(`Update a Resend provider by its unique ID.`)
  .option(`--provider-id <provider-id>`, `Provider ID.`)
  .option(`--api-key <api-key>`, `Resend API key.`)
  .option(
    `--enabled [value]`,
    `Set as enabled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--from-email <from-email>`, `Sender email address.`)
  .option(`--from-name <from-name>`, `Sender Name.`)
  .option(`--name <name>`, `Provider name.`)
  .option(`--reply-to-email <reply-to-email>`, `Email set in the Reply To field for the mail. Default value is Sender Email.`)
  .option(`--reply-to-name <reply-to-name>`, `Name set in the Reply To field for the mail. Default value is Sender Name.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { providerId, apiKey, enabled, fromEmail, fromName, name, replyToEmail, replyToName } = await promptForMissing(
          _options,
          updateResendProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/resend/{providerId}`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (apiKey !== undefined) {
          _payload[`apiKey`] = apiKey;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (fromEmail !== undefined) {
          _payload[`fromEmail`] = fromEmail;
        }
        if (fromName !== undefined) {
          _payload[`fromName`] = fromName;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (replyToEmail !== undefined) {
          _payload[`replyToEmail`] = replyToEmail;
        }
        if (replyToName !== undefined) {
          _payload[`replyToName`] = replyToName;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(messaging.commands.at(-1)!, updateResendProviderSpecs, { method: "patch" });
const createSendgridProviderSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Provider name.", type: "string", required: true },
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID. Choose a custom ID or generate a random ID with `ID.unique()`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.", type: "string", required: true },
  { key: "apiKey", option: "--api-key <api-key>", name: "apiKey", description: "Sendgrid API key.", type: "string", required: false, secret: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Set as enabled.", type: "boolean", required: false },
  { key: "fromEmail", option: "--from-email <from-email>", name: "fromEmail", description: "Sender email address.", type: "string", required: false },
  { key: "fromName", option: "--from-name <from-name>", name: "fromName", description: "Sender Name.", type: "string", required: false },
  { key: "replyToEmail", option: "--reply-to-email <reply-to-email>", name: "replyToEmail", description: "Email set in the reply to field for the mail. Default value is sender email.", type: "string", required: false },
  { key: "replyToName", option: "--reply-to-name <reply-to-name>", name: "replyToName", description: "Name set in the reply to field for the mail. Default value is sender name.", type: "string", required: false },
];
messaging
  .command(`create-sendgrid-provider`)
  .description(`Create a new Sendgrid provider.`)
  .option(`--name <name>`, `Provider name.`)
  .option(`--provider-id <provider-id>`, `Provider ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
  .option(`--api-key <api-key>`, `Sendgrid API key.`)
  .option(
    `--enabled [value]`,
    `Set as enabled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--from-email <from-email>`, `Sender email address.`)
  .option(`--from-name <from-name>`, `Sender Name.`)
  .option(`--reply-to-email <reply-to-email>`, `Email set in the reply to field for the mail. Default value is sender email.`)
  .option(`--reply-to-name <reply-to-name>`, `Name set in the reply to field for the mail. Default value is sender name.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, providerId, apiKey, enabled, fromEmail, fromName, replyToEmail, replyToName } = await promptForMissing(
          _options,
          createSendgridProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/sendgrid`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (apiKey !== undefined) {
          _payload[`apiKey`] = apiKey;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (fromEmail !== undefined) {
          _payload[`fromEmail`] = fromEmail;
        }
        if (fromName !== undefined) {
          _payload[`fromName`] = fromName;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (providerId !== undefined) {
          _payload[`providerId`] = providerId;
        }
        if (replyToEmail !== undefined) {
          _payload[`replyToEmail`] = replyToEmail;
        }
        if (replyToName !== undefined) {
          _payload[`replyToName`] = replyToName;
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
registerPromptSpecs(messaging.commands.at(-1)!, createSendgridProviderSpecs, { method: "post" });
const updateSendgridProviderSpecs: PromptSpec[] = [
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID.", type: "string", required: true },
  { key: "apiKey", option: "--api-key <api-key>", name: "apiKey", description: "Sendgrid API key.", type: "string", required: false, secret: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Set as enabled.", type: "boolean", required: false },
  { key: "fromEmail", option: "--from-email <from-email>", name: "fromEmail", description: "Sender email address.", type: "string", required: false },
  { key: "fromName", option: "--from-name <from-name>", name: "fromName", description: "Sender Name.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Provider name.", type: "string", required: false },
  { key: "replyToEmail", option: "--reply-to-email <reply-to-email>", name: "replyToEmail", description: "Email set in the Reply To field for the mail. Default value is Sender Email.", type: "string", required: false },
  { key: "replyToName", option: "--reply-to-name <reply-to-name>", name: "replyToName", description: "Name set in the Reply To field for the mail. Default value is Sender Name.", type: "string", required: false },
];
messaging
  .command(`update-sendgrid-provider`)
  .description(`Update a Sendgrid provider by its unique ID.`)
  .option(`--provider-id <provider-id>`, `Provider ID.`)
  .option(`--api-key <api-key>`, `Sendgrid API key.`)
  .option(
    `--enabled [value]`,
    `Set as enabled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--from-email <from-email>`, `Sender email address.`)
  .option(`--from-name <from-name>`, `Sender Name.`)
  .option(`--name <name>`, `Provider name.`)
  .option(`--reply-to-email <reply-to-email>`, `Email set in the Reply To field for the mail. Default value is Sender Email.`)
  .option(`--reply-to-name <reply-to-name>`, `Name set in the Reply To field for the mail. Default value is Sender Name.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { providerId, apiKey, enabled, fromEmail, fromName, name, replyToEmail, replyToName } = await promptForMissing(
          _options,
          updateSendgridProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/sendgrid/{providerId}`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (apiKey !== undefined) {
          _payload[`apiKey`] = apiKey;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (fromEmail !== undefined) {
          _payload[`fromEmail`] = fromEmail;
        }
        if (fromName !== undefined) {
          _payload[`fromName`] = fromName;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (replyToEmail !== undefined) {
          _payload[`replyToEmail`] = replyToEmail;
        }
        if (replyToName !== undefined) {
          _payload[`replyToName`] = replyToName;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(messaging.commands.at(-1)!, updateSendgridProviderSpecs, { method: "patch" });
const createTelesignProviderSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Provider name.", type: "string", required: true },
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID. Choose a custom ID or generate a random ID with `ID.unique()`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.", type: "string", required: true },
  { key: "apiKey", option: "--api-key <api-key>", name: "apiKey", description: "Telesign API key.", type: "string", required: false, secret: true },
  { key: "customerId", option: "--customer-id <customer-id>", name: "customerId", description: "Telesign customer ID.", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Set as enabled.", type: "boolean", required: false },
  { key: "from", option: "--from <from>", name: "from", description: "Sender Phone number. Format this number with a leading '+' and a country code, e.g., +16175551212.", type: "string", required: false },
];
messaging
  .command(`create-telesign-provider`)
  .description(`Create a new Telesign provider.`)
  .option(`--name <name>`, `Provider name.`)
  .option(`--provider-id <provider-id>`, `Provider ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
  .option(`--api-key <api-key>`, `Telesign API key.`)
  .option(`--customer-id <customer-id>`, `Telesign customer ID.`)
  .option(
    `--enabled [value]`,
    `Set as enabled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--from <from>`, `Sender Phone number. Format this number with a leading '+' and a country code, e.g., +16175551212.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, providerId, apiKey, customerId, enabled, from } = await promptForMissing(
          _options,
          createTelesignProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/telesign`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (apiKey !== undefined) {
          _payload[`apiKey`] = apiKey;
        }
        if (customerId !== undefined) {
          _payload[`customerId`] = customerId;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (from !== undefined) {
          _payload[`from`] = from;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (providerId !== undefined) {
          _payload[`providerId`] = providerId;
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
registerPromptSpecs(messaging.commands.at(-1)!, createTelesignProviderSpecs, { method: "post" });
const updateTelesignProviderSpecs: PromptSpec[] = [
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID.", type: "string", required: true },
  { key: "apiKey", option: "--api-key <api-key>", name: "apiKey", description: "Telesign API key.", type: "string", required: false, secret: true },
  { key: "customerId", option: "--customer-id <customer-id>", name: "customerId", description: "Telesign customer ID.", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Set as enabled.", type: "boolean", required: false },
  { key: "from", option: "--from <from>", name: "from", description: "Sender number.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Provider name.", type: "string", required: false },
];
messaging
  .command(`update-telesign-provider`)
  .description(`Update a Telesign provider by its unique ID.`)
  .option(`--provider-id <provider-id>`, `Provider ID.`)
  .option(`--api-key <api-key>`, `Telesign API key.`)
  .option(`--customer-id <customer-id>`, `Telesign customer ID.`)
  .option(
    `--enabled [value]`,
    `Set as enabled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--from <from>`, `Sender number.`)
  .option(`--name <name>`, `Provider name.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { providerId, apiKey, customerId, enabled, from, name } = await promptForMissing(
          _options,
          updateTelesignProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/telesign/{providerId}`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (apiKey !== undefined) {
          _payload[`apiKey`] = apiKey;
        }
        if (customerId !== undefined) {
          _payload[`customerId`] = customerId;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (from !== undefined) {
          _payload[`from`] = from;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(messaging.commands.at(-1)!, updateTelesignProviderSpecs, { method: "patch" });
const createTextmagicProviderSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Provider name.", type: "string", required: true },
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID. Choose a custom ID or generate a random ID with `ID.unique()`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.", type: "string", required: true },
  { key: "apiKey", option: "--api-key <api-key>", name: "apiKey", description: "Textmagic apiKey.", type: "string", required: false, secret: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Set as enabled.", type: "boolean", required: false },
  { key: "from", option: "--from <from>", name: "from", description: "Sender Phone number. Format this number with a leading '+' and a country code, e.g., +16175551212.", type: "string", required: false },
  { key: "username", option: "--username <username>", name: "username", description: "Textmagic username.", type: "string", required: false },
];
messaging
  .command(`create-textmagic-provider`)
  .description(`Create a new Textmagic provider.`)
  .option(`--name <name>`, `Provider name.`)
  .option(`--provider-id <provider-id>`, `Provider ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
  .option(`--api-key <api-key>`, `Textmagic apiKey.`)
  .option(
    `--enabled [value]`,
    `Set as enabled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--from <from>`, `Sender Phone number. Format this number with a leading '+' and a country code, e.g., +16175551212.`)
  .option(`--username <username>`, `Textmagic username.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, providerId, apiKey, enabled, from, username } = await promptForMissing(
          _options,
          createTextmagicProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/textmagic`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (apiKey !== undefined) {
          _payload[`apiKey`] = apiKey;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (from !== undefined) {
          _payload[`from`] = from;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (providerId !== undefined) {
          _payload[`providerId`] = providerId;
        }
        if (username !== undefined) {
          _payload[`username`] = username;
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
registerPromptSpecs(messaging.commands.at(-1)!, createTextmagicProviderSpecs, { method: "post" });
const updateTextmagicProviderSpecs: PromptSpec[] = [
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID.", type: "string", required: true },
  { key: "apiKey", option: "--api-key <api-key>", name: "apiKey", description: "Textmagic apiKey.", type: "string", required: false, secret: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Set as enabled.", type: "boolean", required: false },
  { key: "from", option: "--from <from>", name: "from", description: "Sender number.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Provider name.", type: "string", required: false },
  { key: "username", option: "--username <username>", name: "username", description: "Textmagic username.", type: "string", required: false },
];
messaging
  .command(`update-textmagic-provider`)
  .description(`Update a Textmagic provider by its unique ID.`)
  .option(`--provider-id <provider-id>`, `Provider ID.`)
  .option(`--api-key <api-key>`, `Textmagic apiKey.`)
  .option(
    `--enabled [value]`,
    `Set as enabled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--from <from>`, `Sender number.`)
  .option(`--name <name>`, `Provider name.`)
  .option(`--username <username>`, `Textmagic username.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { providerId, apiKey, enabled, from, name, username } = await promptForMissing(
          _options,
          updateTextmagicProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/textmagic/{providerId}`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (apiKey !== undefined) {
          _payload[`apiKey`] = apiKey;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (from !== undefined) {
          _payload[`from`] = from;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (username !== undefined) {
          _payload[`username`] = username;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(messaging.commands.at(-1)!, updateTextmagicProviderSpecs, { method: "patch" });
const createTwilioProviderSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Provider name.", type: "string", required: true },
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID. Choose a custom ID or generate a random ID with `ID.unique()`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.", type: "string", required: true },
  { key: "accountSid", option: "--account-sid <account-sid>", name: "accountSid", description: "Twilio account secret ID.", type: "string", required: false },
  { key: "authToken", option: "--auth-token <auth-token>", name: "authToken", description: "Twilio authentication token.", type: "string", required: false, secret: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Set as enabled.", type: "boolean", required: false },
  { key: "from", option: "--from <from>", name: "from", description: "Sender Phone number. Format this number with a leading '+' and a country code, e.g., +16175551212.", type: "string", required: false },
];
messaging
  .command(`create-twilio-provider`)
  .description(`Create a new Twilio provider.`)
  .option(`--name <name>`, `Provider name.`)
  .option(`--provider-id <provider-id>`, `Provider ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
  .option(`--account-sid <account-sid>`, `Twilio account secret ID.`)
  .option(`--auth-token <auth-token>`, `Twilio authentication token.`)
  .option(
    `--enabled [value]`,
    `Set as enabled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--from <from>`, `Sender Phone number. Format this number with a leading '+' and a country code, e.g., +16175551212.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, providerId, accountSid, authToken, enabled, from } = await promptForMissing(
          _options,
          createTwilioProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/twilio`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (accountSid !== undefined) {
          _payload[`accountSid`] = accountSid;
        }
        if (authToken !== undefined) {
          _payload[`authToken`] = authToken;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (from !== undefined) {
          _payload[`from`] = from;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (providerId !== undefined) {
          _payload[`providerId`] = providerId;
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
registerPromptSpecs(messaging.commands.at(-1)!, createTwilioProviderSpecs, { method: "post" });
const updateTwilioProviderSpecs: PromptSpec[] = [
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID.", type: "string", required: true },
  { key: "accountSid", option: "--account-sid <account-sid>", name: "accountSid", description: "Twilio account secret ID.", type: "string", required: false },
  { key: "authToken", option: "--auth-token <auth-token>", name: "authToken", description: "Twilio authentication token.", type: "string", required: false, secret: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Set as enabled.", type: "boolean", required: false },
  { key: "from", option: "--from <from>", name: "from", description: "Sender number.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Provider name.", type: "string", required: false },
];
messaging
  .command(`update-twilio-provider`)
  .description(`Update a Twilio provider by its unique ID.`)
  .option(`--provider-id <provider-id>`, `Provider ID.`)
  .option(`--account-sid <account-sid>`, `Twilio account secret ID.`)
  .option(`--auth-token <auth-token>`, `Twilio authentication token.`)
  .option(
    `--enabled [value]`,
    `Set as enabled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--from <from>`, `Sender number.`)
  .option(`--name <name>`, `Provider name.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { providerId, accountSid, authToken, enabled, from, name } = await promptForMissing(
          _options,
          updateTwilioProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/twilio/{providerId}`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (accountSid !== undefined) {
          _payload[`accountSid`] = accountSid;
        }
        if (authToken !== undefined) {
          _payload[`authToken`] = authToken;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (from !== undefined) {
          _payload[`from`] = from;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(messaging.commands.at(-1)!, updateTwilioProviderSpecs, { method: "patch" });
const createVonageProviderSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Provider name.", type: "string", required: true },
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID. Choose a custom ID or generate a random ID with `ID.unique()`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.", type: "string", required: true },
  { key: "apiKey", option: "--api-key <api-key>", name: "apiKey", description: "Vonage API key.", type: "string", required: false, secret: true },
  { key: "apiSecret", option: "--api-secret <api-secret>", name: "apiSecret", description: "Vonage API secret.", type: "string", required: false, secret: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Set as enabled.", type: "boolean", required: false },
  { key: "from", option: "--from <from>", name: "from", description: "Sender Phone number. Format this number with a leading '+' and a country code, e.g., +16175551212.", type: "string", required: false },
];
messaging
  .command(`create-vonage-provider`)
  .description(`Create a new Vonage provider.`)
  .option(`--name <name>`, `Provider name.`)
  .option(`--provider-id <provider-id>`, `Provider ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
  .option(`--api-key <api-key>`, `Vonage API key.`)
  .option(`--api-secret <api-secret>`, `Vonage API secret.`)
  .option(
    `--enabled [value]`,
    `Set as enabled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--from <from>`, `Sender Phone number. Format this number with a leading '+' and a country code, e.g., +16175551212.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, providerId, apiKey, apiSecret, enabled, from } = await promptForMissing(
          _options,
          createVonageProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/vonage`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (apiKey !== undefined) {
          _payload[`apiKey`] = apiKey;
        }
        if (apiSecret !== undefined) {
          _payload[`apiSecret`] = apiSecret;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (from !== undefined) {
          _payload[`from`] = from;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (providerId !== undefined) {
          _payload[`providerId`] = providerId;
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
registerPromptSpecs(messaging.commands.at(-1)!, createVonageProviderSpecs, { method: "post" });
const updateVonageProviderSpecs: PromptSpec[] = [
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID.", type: "string", required: true },
  { key: "apiKey", option: "--api-key <api-key>", name: "apiKey", description: "Vonage API key.", type: "string", required: false, secret: true },
  { key: "apiSecret", option: "--api-secret <api-secret>", name: "apiSecret", description: "Vonage API secret.", type: "string", required: false, secret: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Set as enabled.", type: "boolean", required: false },
  { key: "from", option: "--from <from>", name: "from", description: "Sender number.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Provider name.", type: "string", required: false },
];
messaging
  .command(`update-vonage-provider`)
  .description(`Update a Vonage provider by its unique ID.`)
  .option(`--provider-id <provider-id>`, `Provider ID.`)
  .option(`--api-key <api-key>`, `Vonage API key.`)
  .option(`--api-secret <api-secret>`, `Vonage API secret.`)
  .option(
    `--enabled [value]`,
    `Set as enabled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--from <from>`, `Sender number.`)
  .option(`--name <name>`, `Provider name.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { providerId, apiKey, apiSecret, enabled, from, name } = await promptForMissing(
          _options,
          updateVonageProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/vonage/{providerId}`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (apiKey !== undefined) {
          _payload[`apiKey`] = apiKey;
        }
        if (apiSecret !== undefined) {
          _payload[`apiSecret`] = apiSecret;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (from !== undefined) {
          _payload[`from`] = from;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(messaging.commands.at(-1)!, updateVonageProviderSpecs, { method: "patch" });
const deleteProviderSpecs: PromptSpec[] = [
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID.", type: "string", required: true, resource: { listPath: "/messaging/providers", hasLimit: false, search: true } },
];
messaging
  .command(`delete-provider`)
  .description(`Delete a provider by its unique ID.`)
  .option(`--provider-id <provider-id>`, `Provider ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { providerId } = await promptForMissing(
          _options,
          deleteProviderSpecs,
          _command,
        );
        await confirmDestructive(`messaging delete-provider`);
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/{providerId}`.replace(`{providerId}`, providerId);
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
registerPromptSpecs(messaging.commands.at(-1)!, deleteProviderSpecs, { method: "delete", destructive: true });
const getProviderSpecs: PromptSpec[] = [
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID.", type: "string", required: true, resource: { listPath: "/messaging/providers", hasLimit: false, search: true } },
];
messaging
  .command(`get-provider`)
  .description(`Get a provider by its unique ID.`)
  .option(`--provider-id <provider-id>`, `Provider ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { providerId } = await promptForMissing(
          _options,
          getProviderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/{providerId}`.replace(`{providerId}`, providerId);
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
registerPromptSpecs(messaging.commands.at(-1)!, getProviderSpecs, { method: "get" });
const listProviderLogsSpecs: PromptSpec[] = [
  { key: "providerId", option: "--provider-id <provider-id>", name: "providerId", description: "Provider ID.", type: "string", required: true, resource: { listPath: "/messaging/providers", hasLimit: false, search: true } },
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Only supported methods are limit and offset", type: "array", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`list-provider-logs`)
  .description(`Get the provider activity logs listed by its unique ID.`)
  .option(`--provider-id <provider-id>`, `Provider ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Only supported methods are limit and offset`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { providerId, queries, total, filter } = await promptForMissing(
          _options,
          listProviderLogsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/{providerId}/logs`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
registerPromptSpecs(messaging.commands.at(-1)!, listProviderLogsSpecs, { method: "get" });
const listSubscriberLogsSpecs: PromptSpec[] = [
  { key: "subscriberId", option: "--subscriber-id <subscriber-id>", name: "subscriberId", description: "Subscriber ID.", type: "string", required: true },
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Only supported methods are limit and offset", type: "array", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`list-subscriber-logs`)
  .description(`Get the subscriber activity logs listed by its unique ID.`)
  .option(`--subscriber-id <subscriber-id>`, `Subscriber ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Only supported methods are limit and offset`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { subscriberId, queries, total, filter } = await promptForMissing(
          _options,
          listSubscriberLogsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/subscribers/{subscriberId}/logs`.replace(`{subscriberId}`, subscriberId);
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
registerPromptSpecs(messaging.commands.at(-1)!, listSubscriberLogsSpecs, { method: "get" });
const listTopicsSpecs: PromptSpec[] = [
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: name, description, emailTotal, smsTotal, pushTotal", type: "array", required: false },
  { key: "search", option: "--search <search>", name: "search", description: "Search term to filter your list results. Max length: 256 chars.", type: "string", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`list-topics`)
  .description(`Get a list of all topics from the current Revenexx project.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: name, description, emailTotal, smsTotal, pushTotal`)
  .option(`--search <search>`, `Search term to filter your list results. Max length: 256 chars.`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { queries, search, total, filter } = await promptForMissing(
          _options,
          listTopicsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/topics`;
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (search !== undefined) {
          _payload[`search`] = search;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
registerPromptSpecs(messaging.commands.at(-1)!, listTopicsSpecs, { method: "get" });
const createTopicSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Topic Name.", type: "string", required: true },
  { key: "topicId", option: "--topic-id <topic-id>", name: "topicId", description: "Topic ID. Choose a custom Topic ID or a new Topic ID.", type: "string", required: true },
  { key: "subscribe", option: "--subscribe [subscribe...]", name: "subscribe", description: "An array of role strings with subscribe permission. By default all users are granted with any subscribe permission. [learn more about roles](https://appwrite.io/docs/permissions#permission-roles). Maximum of 100 roles are allowed, each 64 characters long.", type: "array", required: false },
];
messaging
  .command(`create-topic`)
  .description(`Create a new topic.`)
  .option(`--name <name>`, `Topic Name.`)
  .option(`--topic-id <topic-id>`, `Topic ID. Choose a custom Topic ID or a new Topic ID.`)
  .option(`--subscribe [subscribe...]`, `An array of role strings with subscribe permission. By default all users are granted with any subscribe permission. [learn more about roles](https://appwrite.io/docs/permissions#permission-roles). Maximum of 100 roles are allowed, each 64 characters long.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, topicId, subscribe } = await promptForMissing(
          _options,
          createTopicSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/topics`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (subscribe !== undefined) {
          _payload[`subscribe`] = subscribe;
        }
        if (topicId !== undefined) {
          _payload[`topicId`] = topicId;
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
registerPromptSpecs(messaging.commands.at(-1)!, createTopicSpecs, { method: "post" });
const deleteTopicSpecs: PromptSpec[] = [
  { key: "topicId", option: "--topic-id <topic-id>", name: "topicId", description: "Topic ID.", type: "string", required: true, resource: { listPath: "/messaging/topics", hasLimit: false, search: true } },
];
messaging
  .command(`delete-topic`)
  .description(`Delete a topic by its unique ID.`)
  .option(`--topic-id <topic-id>`, `Topic ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { topicId } = await promptForMissing(
          _options,
          deleteTopicSpecs,
          _command,
        );
        await confirmDestructive(`messaging delete-topic`);
        const _client = await sdkForProject();
        const _apiPath = `/messaging/topics/{topicId}`.replace(`{topicId}`, topicId);
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
registerPromptSpecs(messaging.commands.at(-1)!, deleteTopicSpecs, { method: "delete", destructive: true });
const getTopicSpecs: PromptSpec[] = [
  { key: "topicId", option: "--topic-id <topic-id>", name: "topicId", description: "Topic ID.", type: "string", required: true, resource: { listPath: "/messaging/topics", hasLimit: false, search: true } },
];
messaging
  .command(`get-topic`)
  .description(`Get a topic by its unique ID.`)
  .option(`--topic-id <topic-id>`, `Topic ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { topicId } = await promptForMissing(
          _options,
          getTopicSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/topics/{topicId}`.replace(`{topicId}`, topicId);
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
registerPromptSpecs(messaging.commands.at(-1)!, getTopicSpecs, { method: "get" });
const updateTopicSpecs: PromptSpec[] = [
  { key: "topicId", option: "--topic-id <topic-id>", name: "topicId", description: "Topic ID.", type: "string", required: true, resource: { listPath: "/messaging/topics", hasLimit: false, search: true } },
  { key: "name", option: "--name <name>", name: "name", description: "Topic Name.", type: "string", required: false },
  { key: "subscribe", option: "--subscribe [subscribe...]", name: "subscribe", description: "An array of role strings with subscribe permission. By default all users are granted with any subscribe permission. [learn more about roles](https://appwrite.io/docs/permissions#permission-roles). Maximum of 100 roles are allowed, each 64 characters long.", type: "array", required: false },
];
messaging
  .command(`update-topic`)
  .description(`Update a topic by its unique ID.`)
  .option(`--topic-id <topic-id>`, `Topic ID.`)
  .option(`--name <name>`, `Topic Name.`)
  .option(`--subscribe [subscribe...]`, `An array of role strings with subscribe permission. By default all users are granted with any subscribe permission. [learn more about roles](https://appwrite.io/docs/permissions#permission-roles). Maximum of 100 roles are allowed, each 64 characters long.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { topicId, name, subscribe } = await promptForMissing(
          _options,
          updateTopicSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/topics/{topicId}`.replace(`{topicId}`, topicId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (subscribe !== undefined) {
          _payload[`subscribe`] = subscribe;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(messaging.commands.at(-1)!, updateTopicSpecs, { method: "patch" });
const listTopicLogsSpecs: PromptSpec[] = [
  { key: "topicId", option: "--topic-id <topic-id>", name: "topicId", description: "Topic ID.", type: "string", required: true, resource: { listPath: "/messaging/topics", hasLimit: false, search: true } },
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Only supported methods are limit and offset", type: "array", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`list-topic-logs`)
  .description(`Get the topic activity logs listed by its unique ID.`)
  .option(`--topic-id <topic-id>`, `Topic ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Only supported methods are limit and offset`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { topicId, queries, total, filter } = await promptForMissing(
          _options,
          listTopicLogsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/topics/{topicId}/logs`.replace(`{topicId}`, topicId);
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
registerPromptSpecs(messaging.commands.at(-1)!, listTopicLogsSpecs, { method: "get" });
const listSubscribersSpecs: PromptSpec[] = [
  { key: "topicId", option: "--topic-id <topic-id>", name: "topicId", description: "Topic ID. The topic ID subscribed to.", type: "string", required: true, resource: { listPath: "/messaging/topics", hasLimit: false, search: true } },
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: name, provider, type, enabled", type: "array", required: false },
  { key: "search", option: "--search <search>", name: "search", description: "Search term to filter your list results. Max length: 256 chars.", type: "string", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
messaging
  .command(`list-subscribers`)
  .description(`Get a list of all subscribers from the current Revenexx project.`)
  .option(`--topic-id <topic-id>`, `Topic ID. The topic ID subscribed to.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: name, provider, type, enabled`)
  .option(`--search <search>`, `Search term to filter your list results. Max length: 256 chars.`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { topicId, queries, search, total, filter } = await promptForMissing(
          _options,
          listSubscribersSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/topics/{topicId}/subscribers`.replace(`{topicId}`, topicId);
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (search !== undefined) {
          _payload[`search`] = search;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
registerPromptSpecs(messaging.commands.at(-1)!, listSubscribersSpecs, { method: "get" });
const createSubscriberSpecs: PromptSpec[] = [
  { key: "topicId", option: "--topic-id <topic-id>", name: "topicId", description: "Topic ID. The topic ID to subscribe to.", type: "string", required: true, resource: { listPath: "/messaging/topics", hasLimit: false, search: true } },
  { key: "subscriberId", option: "--subscriber-id <subscriber-id>", name: "subscriberId", description: "Subscriber ID. Choose a custom Subscriber ID or a new Subscriber ID.", type: "string", required: true },
  { key: "targetId", option: "--target-id <target-id>", name: "targetId", description: "Target ID. The target ID to link to the specified Topic ID.", type: "string", required: true },
];
messaging
  .command(`create-subscriber`)
  .description(`Create a new subscriber.`)
  .option(`--topic-id <topic-id>`, `Topic ID. The topic ID to subscribe to.`)
  .option(`--subscriber-id <subscriber-id>`, `Subscriber ID. Choose a custom Subscriber ID or a new Subscriber ID.`)
  .option(`--target-id <target-id>`, `Target ID. The target ID to link to the specified Topic ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { topicId, subscriberId, targetId } = await promptForMissing(
          _options,
          createSubscriberSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/topics/{topicId}/subscribers`.replace(`{topicId}`, topicId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (subscriberId !== undefined) {
          _payload[`subscriberId`] = subscriberId;
        }
        if (targetId !== undefined) {
          _payload[`targetId`] = targetId;
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
registerPromptSpecs(messaging.commands.at(-1)!, createSubscriberSpecs, { method: "post" });
const deleteSubscriberSpecs: PromptSpec[] = [
  { key: "topicId", option: "--topic-id <topic-id>", name: "topicId", description: "Topic ID. The topic ID subscribed to.", type: "string", required: true, resource: { listPath: "/messaging/topics", hasLimit: false, search: true } },
  { key: "subscriberId", option: "--subscriber-id <subscriber-id>", name: "subscriberId", description: "Subscriber ID.", type: "string", required: true, resource: { listPath: "/messaging/topics/{topicId}/subscribers", hasLimit: false, search: true } },
];
messaging
  .command(`delete-subscriber`)
  .description(`Delete a subscriber by its unique ID.`)
  .option(`--topic-id <topic-id>`, `Topic ID. The topic ID subscribed to.`)
  .option(`--subscriber-id <subscriber-id>`, `Subscriber ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { topicId, subscriberId } = await promptForMissing(
          _options,
          deleteSubscriberSpecs,
          _command,
        );
        await confirmDestructive(`messaging delete-subscriber`);
        const _client = await sdkForProject();
        const _apiPath = `/messaging/topics/{topicId}/subscribers/{subscriberId}`.replace(`{topicId}`, topicId).replace(`{subscriberId}`, subscriberId);
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
registerPromptSpecs(messaging.commands.at(-1)!, deleteSubscriberSpecs, { method: "delete", destructive: true });
const getSubscriberSpecs: PromptSpec[] = [
  { key: "topicId", option: "--topic-id <topic-id>", name: "topicId", description: "Topic ID. The topic ID subscribed to.", type: "string", required: true, resource: { listPath: "/messaging/topics", hasLimit: false, search: true } },
  { key: "subscriberId", option: "--subscriber-id <subscriber-id>", name: "subscriberId", description: "Subscriber ID.", type: "string", required: true, resource: { listPath: "/messaging/topics/{topicId}/subscribers", hasLimit: false, search: true } },
];
messaging
  .command(`get-subscriber`)
  .description(`Get a subscriber by its unique ID.`)
  .option(`--topic-id <topic-id>`, `Topic ID. The topic ID subscribed to.`)
  .option(`--subscriber-id <subscriber-id>`, `Subscriber ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { topicId, subscriberId } = await promptForMissing(
          _options,
          getSubscriberSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/messaging/topics/{topicId}/subscribers/{subscriberId}`.replace(`{topicId}`, topicId).replace(`{subscriberId}`, subscriberId);
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
registerPromptSpecs(messaging.commands.at(-1)!, getSubscriberSpecs, { method: "get" });
