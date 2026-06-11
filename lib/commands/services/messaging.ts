import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseBool,
  parseInteger,
} from "../../parser.js";

export const messaging = new Command("messaging")
  .description(commandDescriptions["messaging"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

messaging
  .command(`messaging-list-messages`)
  .description(`Get a list of all messages from the current Revenexx project.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: scheduledAt, deliveredAt, deliveredTotal, status, description, providerType`)
  .option(`--search <search>`, `Search term to filter your list results. Max length: 256 chars.`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ queries, search, total }) => {
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
messaging
  .command(`messaging-create-email`)
  .description(`Create a new email message.`)
  .requiredOption(`--content <content>`, `Email Content.`)
  .requiredOption(`--message-id <message-id>`, `Message ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
  .requiredOption(`--subject <subject>`, `Email Subject.`)
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
      async ({ content, messageId, subject, attachments, bcc, cc, draft, html, scheduledAt, targets, topics, users }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages/email`;
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-update-email`)
  .description(`Update an email message by its unique ID. This endpoint only works on messages that are in draft status. Messages that are already processing, sent, or failed cannot be updated.
`)
  .requiredOption(`--message-id <message-id>`, `Message ID.`)
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
      async ({ messageId, attachments, bcc, cc, content, draft, html, scheduledAt, subject, targets, topics, users }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages/email/{messageId}`.replace(`{messageId}`, messageId);
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-create-push`)
  .description(`Create a new push notification.`)
  .requiredOption(`--message-id <message-id>`, `Message ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
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
      async ({ messageId, action, badge, body, color, contentAvailable, critical, data, draft, icon, image, priority, scheduledAt, sound, tag, targets, title, topics, users }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages/push`;
        const _payload: RequestParams = {};
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
          _payload[`data`] = JSON.parse(data);
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
messaging
  .command(`messaging-update-push`)
  .description(`Update a push notification by its unique ID. This endpoint only works on messages that are in draft status. Messages that are already processing, sent, or failed cannot be updated.
`)
  .requiredOption(`--message-id <message-id>`, `Message ID.`)
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
      async ({ messageId, action, badge, body, color, contentAvailable, critical, data, draft, icon, image, priority, scheduledAt, sound, tag, targets, title, topics, users }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages/push/{messageId}`.replace(`{messageId}`, messageId);
        const _payload: RequestParams = {};
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
          _payload[`data`] = JSON.parse(data);
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
messaging
  .command(`messaging-delete`)
  .description(`Delete a message. If the message is not a draft or scheduled, but has been sent, this will not recall the message.`)
  .requiredOption(`--message-id <message-id>`, `Message ID.`)
  .action(
    actionRunner(
      async ({ messageId }) => {
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
messaging
  .command(`messaging-get-message`)
  .description(`Get a message by its unique ID.
`)
  .requiredOption(`--message-id <message-id>`, `Message ID.`)
  .action(
    actionRunner(
      async ({ messageId }) => {
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
messaging
  .command(`messaging-list-message-logs`)
  .description(`Get the message activity logs listed by its unique ID.`)
  .requiredOption(`--message-id <message-id>`, `Message ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Only supported methods are limit and offset`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ messageId, queries, total }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages/{messageId}/logs`.replace(`{messageId}`, messageId);
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
messaging
  .command(`messaging-list-targets`)
  .description(`Get a list of the targets associated with a message.`)
  .requiredOption(`--message-id <message-id>`, `Message ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: userId, providerId, identifier, providerType`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ messageId, queries, total }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/messages/{messageId}/targets`.replace(`{messageId}`, messageId);
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
messaging
  .command(`messaging-list-providers`)
  .description(`Get a list of all providers from the current Revenexx project.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: name, provider, type, enabled`)
  .option(`--search <search>`, `Search term to filter your list results. Max length: 256 chars.`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ queries, search, total }) => {
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
messaging
  .command(`messaging-create-mailgun-provider`)
  .description(`Create a new Mailgun provider.`)
  .requiredOption(`--name <name>`, `Provider name.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
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
      async ({ name, providerId, apiKey, domain, enabled, fromEmail, fromName, isEuRegion, replyToEmail, replyToName }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/mailgun`;
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-update-mailgun-provider`)
  .description(`Update a Mailgun provider by its unique ID.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID.`)
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
      async ({ providerId, apiKey, domain, enabled, fromEmail, fromName, isEuRegion, name, replyToEmail, replyToName }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/mailgun/{providerId}`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-create-msg-91-provider`)
  .description(`Create a new MSG91 provider.`)
  .requiredOption(`--name <name>`, `Provider name.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
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
      async ({ name, providerId, authKey, enabled, senderId, templateId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/msg91`;
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-update-msg-91-provider`)
  .description(`Update a MSG91 provider by its unique ID.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID.`)
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
      async ({ providerId, authKey, enabled, name, senderId, templateId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/msg91/{providerId}`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-create-resend-provider`)
  .description(`Create a new Resend provider.`)
  .requiredOption(`--name <name>`, `Provider name.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
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
      async ({ name, providerId, apiKey, enabled, fromEmail, fromName, replyToEmail, replyToName }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/resend`;
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-update-resend-provider`)
  .description(`Update a Resend provider by its unique ID.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID.`)
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
      async ({ providerId, apiKey, enabled, fromEmail, fromName, name, replyToEmail, replyToName }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/resend/{providerId}`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-create-sendgrid-provider`)
  .description(`Create a new Sendgrid provider.`)
  .requiredOption(`--name <name>`, `Provider name.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
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
      async ({ name, providerId, apiKey, enabled, fromEmail, fromName, replyToEmail, replyToName }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/sendgrid`;
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-update-sendgrid-provider`)
  .description(`Update a Sendgrid provider by its unique ID.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID.`)
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
      async ({ providerId, apiKey, enabled, fromEmail, fromName, name, replyToEmail, replyToName }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/sendgrid/{providerId}`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-create-telesign-provider`)
  .description(`Create a new Telesign provider.`)
  .requiredOption(`--name <name>`, `Provider name.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
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
      async ({ name, providerId, apiKey, customerId, enabled, from }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/telesign`;
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-update-telesign-provider`)
  .description(`Update a Telesign provider by its unique ID.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID.`)
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
      async ({ providerId, apiKey, customerId, enabled, from, name }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/telesign/{providerId}`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-create-textmagic-provider`)
  .description(`Create a new Textmagic provider.`)
  .requiredOption(`--name <name>`, `Provider name.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
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
      async ({ name, providerId, apiKey, enabled, from, username }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/textmagic`;
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-update-textmagic-provider`)
  .description(`Update a Textmagic provider by its unique ID.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID.`)
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
      async ({ providerId, apiKey, enabled, from, name, username }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/textmagic/{providerId}`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-create-twilio-provider`)
  .description(`Create a new Twilio provider.`)
  .requiredOption(`--name <name>`, `Provider name.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
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
      async ({ name, providerId, accountSid, authToken, enabled, from }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/twilio`;
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-update-twilio-provider`)
  .description(`Update a Twilio provider by its unique ID.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID.`)
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
      async ({ providerId, accountSid, authToken, enabled, from, name }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/twilio/{providerId}`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-create-vonage-provider`)
  .description(`Create a new Vonage provider.`)
  .requiredOption(`--name <name>`, `Provider name.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
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
      async ({ name, providerId, apiKey, apiSecret, enabled, from }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/vonage`;
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-update-vonage-provider`)
  .description(`Update a Vonage provider by its unique ID.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID.`)
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
      async ({ providerId, apiKey, apiSecret, enabled, from, name }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/vonage/{providerId}`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-delete-provider`)
  .description(`Delete a provider by its unique ID.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID.`)
  .action(
    actionRunner(
      async ({ providerId }) => {
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
messaging
  .command(`messaging-get-provider`)
  .description(`Get a provider by its unique ID.
`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID.`)
  .action(
    actionRunner(
      async ({ providerId }) => {
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
messaging
  .command(`messaging-list-provider-logs`)
  .description(`Get the provider activity logs listed by its unique ID.`)
  .requiredOption(`--provider-id <provider-id>`, `Provider ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Only supported methods are limit and offset`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ providerId, queries, total }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/providers/{providerId}/logs`.replace(`{providerId}`, providerId);
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
messaging
  .command(`messaging-list-subscriber-logs`)
  .description(`Get the subscriber activity logs listed by its unique ID.`)
  .requiredOption(`--subscriber-id <subscriber-id>`, `Subscriber ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Only supported methods are limit and offset`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ subscriberId, queries, total }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/subscribers/{subscriberId}/logs`.replace(`{subscriberId}`, subscriberId);
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
messaging
  .command(`messaging-list-topics`)
  .description(`Get a list of all topics from the current Revenexx project.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: name, description, emailTotal, smsTotal, pushTotal`)
  .option(`--search <search>`, `Search term to filter your list results. Max length: 256 chars.`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ queries, search, total }) => {
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
messaging
  .command(`messaging-create-topic`)
  .description(`Create a new topic.`)
  .requiredOption(`--name <name>`, `Topic Name.`)
  .requiredOption(`--topic-id <topic-id>`, `Topic ID. Choose a custom Topic ID or a new Topic ID.`)
  .option(`--subscribe [subscribe...]`, `An array of role strings with subscribe permission. By default all users are granted with any subscribe permission. [learn more about roles](https://appwrite.io/docs/permissions#permission-roles). Maximum of 100 roles are allowed, each 64 characters long.`)
  .action(
    actionRunner(
      async ({ name, topicId, subscribe }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/topics`;
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-delete-topic`)
  .description(`Delete a topic by its unique ID.`)
  .requiredOption(`--topic-id <topic-id>`, `Topic ID.`)
  .action(
    actionRunner(
      async ({ topicId }) => {
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
messaging
  .command(`messaging-get-topic`)
  .description(`Get a topic by its unique ID.
`)
  .requiredOption(`--topic-id <topic-id>`, `Topic ID.`)
  .action(
    actionRunner(
      async ({ topicId }) => {
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
messaging
  .command(`messaging-update-topic`)
  .description(`Update a topic by its unique ID.
`)
  .requiredOption(`--topic-id <topic-id>`, `Topic ID.`)
  .option(`--name <name>`, `Topic Name.`)
  .option(`--subscribe [subscribe...]`, `An array of role strings with subscribe permission. By default all users are granted with any subscribe permission. [learn more about roles](https://appwrite.io/docs/permissions#permission-roles). Maximum of 100 roles are allowed, each 64 characters long.`)
  .action(
    actionRunner(
      async ({ topicId, name, subscribe }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/topics/{topicId}`.replace(`{topicId}`, topicId);
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-list-topic-logs`)
  .description(`Get the topic activity logs listed by its unique ID.`)
  .requiredOption(`--topic-id <topic-id>`, `Topic ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Only supported methods are limit and offset`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ topicId, queries, total }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/topics/{topicId}/logs`.replace(`{topicId}`, topicId);
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
messaging
  .command(`messaging-list-subscribers`)
  .description(`Get a list of all subscribers from the current Revenexx project.`)
  .requiredOption(`--topic-id <topic-id>`, `Topic ID. The topic ID subscribed to.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: name, provider, type, enabled`)
  .option(`--search <search>`, `Search term to filter your list results. Max length: 256 chars.`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ topicId, queries, search, total }) => {
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
messaging
  .command(`messaging-create-subscriber`)
  .description(`Create a new subscriber.`)
  .requiredOption(`--topic-id <topic-id>`, `Topic ID. The topic ID to subscribe to.`)
  .requiredOption(`--subscriber-id <subscriber-id>`, `Subscriber ID. Choose a custom Subscriber ID or a new Subscriber ID.`)
  .requiredOption(`--target-id <target-id>`, `Target ID. The target ID to link to the specified Topic ID.`)
  .action(
    actionRunner(
      async ({ topicId, subscriberId, targetId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/messaging/topics/{topicId}/subscribers`.replace(`{topicId}`, topicId);
        const _payload: RequestParams = {};
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
messaging
  .command(`messaging-delete-subscriber`)
  .description(`Delete a subscriber by its unique ID.`)
  .requiredOption(`--topic-id <topic-id>`, `Topic ID. The topic ID subscribed to.`)
  .requiredOption(`--subscriber-id <subscriber-id>`, `Subscriber ID.`)
  .action(
    actionRunner(
      async ({ topicId, subscriberId }) => {
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
messaging
  .command(`messaging-get-subscriber`)
  .description(`Get a subscriber by its unique ID.
`)
  .requiredOption(`--topic-id <topic-id>`, `Topic ID. The topic ID subscribed to.`)
  .requiredOption(`--subscriber-id <subscriber-id>`, `Subscriber ID.`)
  .action(
    actionRunner(
      async ({ topicId, subscriberId }) => {
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
