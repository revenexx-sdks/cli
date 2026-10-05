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
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const quotesTrail = new Command("quotes-trail")
  .description(
    commandDescriptions["quotesTrail"] ??
      `Notes, attachments and the record of every move, which is what makes a negotiated price explainable months later.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const attachSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The quote.", type: "string", required: true },
  { key: "fileRef", option: "--file-ref <file-ref>", name: "file_ref", description: "Where the file lives.", type: "string", required: true },
  { key: "filename", option: "--filename <filename>", name: "filename", description: "What to call it.", type: "string", required: true },
  { key: "byteSize", option: "--byte-size <byte-size>", name: "byte_size", description: "How large it is, in bytes.", type: "integer", required: false },
  { key: "contentType", option: "--content-type <content-type>", name: "content_type", description: "The media type.", type: "string", required: false },
  { key: "direction", option: "--direction <direction>", name: "direction", description: "Who put it there.", type: "string", required: false, enum: ["buyer","seller"] },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form data carried with the file — what a document management system needs to find it again.", type: "object", required: false },
  { key: "visibility", option: "--visibility <visibility>", name: "visibility", description: "Who sees it.", type: "string", required: false, enum: ["internal","customer"] },
];
quotesTrail
  .command(`attach`)
  .description(`Records a drawing, a datasheet or a signed document against the quote. This app stores the reference and serves no bytes — the file itself lives in whatever storage the tenant uses.`)
  .option(`--id <id>`, `The quote.`)
  .option(`--file-ref <file-ref>`, `Where the file lives.`)
  .option(`--filename <filename>`, `What to call it.`)
  .option(`--byte-size <byte-size>`, `How large it is, in bytes.`, parseInteger)
  .option(`--content-type <content-type>`, `The media type.`)
  .option(`--direction <direction>`, `Who put it there.`)
  .option(`--metadata <metadata>`, `Free-form data carried with the file — what a document management system needs to find it again.`)
  .option(`--visibility <visibility>`, `Who sees it.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, fileRef, filename, byteSize, contentType, direction, metadata, visibility } = await promptForMissing(
          _options,
          attachSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes/{id}/attachments`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (byteSize !== undefined) {
          _payload[`byte_size`] = byteSize;
        }
        if (contentType !== undefined) {
          _payload[`content_type`] = contentType;
        }
        if (direction !== undefined) {
          _payload[`direction`] = direction;
        }
        if (fileRef !== undefined) {
          _payload[`file_ref`] = fileRef;
        }
        if (filename !== undefined) {
          _payload[`filename`] = filename;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (visibility !== undefined) {
          _payload[`visibility`] = visibility;
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
registerPromptSpecs(quotesTrail.commands.at(-1)!, attachSpecs, { method: "post" });
const noteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The quote.", type: "string", required: true },
  { key: "body", option: "--body <body>", name: "body", description: "What to write.", type: "string", required: true },
  { key: "actor", option: "--actor <actor>", name: "actor", description: "Which side wrote it.", type: "string", required: false },
  { key: "visibility", option: "--visibility <visibility>", name: "visibility", description: "Who sees it. Internal when left out.", type: "string", required: false, enum: ["internal","customer"] },
];
quotesTrail
  .command(`note`)
  .description(`Adds an entry to the trail. \`internal\` is the merchant's own note and the customer never sees it; \`customer\` is what appears on the quote the buyer reads.`)
  .option(`--id <id>`, `The quote.`)
  .option(`--body <body>`, `What to write.`)
  .option(`--actor <actor>`, `Which side wrote it.`)
  .option(`--visibility <visibility>`, `Who sees it. Internal when left out.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, body, actor, visibility } = await promptForMissing(
          _options,
          noteSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes/{id}/events`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (actor !== undefined) {
          _payload[`actor`] = actor;
        }
        if (body !== undefined) {
          _payload[`body`] = body;
        }
        if (visibility !== undefined) {
          _payload[`visibility`] = visibility;
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
registerPromptSpecs(quotesTrail.commands.at(-1)!, noteSpecs, { method: "post" });
