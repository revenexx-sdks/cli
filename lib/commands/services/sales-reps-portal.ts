import { Command } from "commander";
import { hiddenAliasHelp } from "../../legacy-names.js";
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

export const salesRepsPortal = new Command("sales-reps-portal")
  .description(
    commandDescriptions["salesRepsPortal"] ??
      `The rep portal's own addresses, and the two a shop calls about reps. The rep portal's server asserts the signed-in rep to the gateway as \`X-Revenexx-Principal: rep:<code>\`; the gateway resolves it through this app (it is the role provider for sales reps) and forwards the rep as \`X-Revenexx-Caller: rep\` with \`X-Revenexx-Rep\`. Only the \`my/…\` addresses accept such a caller, and each is narrowed to the customers the rep carries: the worklist, the people of one customer, opening the shop as one of them, leaving again, and what a buyer may see of the rep. A customer the rep does not carry is absent from the list and a 404 at its own address. A buyer, asserted by the shop as \`contact:<id>\`, reads the reps who carry their company — the name always, the address and phone number only where the rep chose to show them — and the shop ends a handed-over session here when the buyer signs out.`,
  )
  .configureHelp({
    ...hiddenAliasHelp,
    helpWidth: process.stdout.columns || 80,
  });

const actingEndSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The entry, as the sign-in link carried it in `acting`.", type: "string", required: true },
];
salesRepsPortal
  .command(`acting-end`)
  .description(`Called by the shop's server when a handed-over buyer session ends — the buyer signed out, or the session ran out. The id is the \`acting\` value the shop received on the sign-in link. Only the buyer the entry names may end it; ending one already closed answers it unchanged.`)
  .alias("sales-reps-acting-end")
  .option(`--id <id>`, `The entry, as the sign-in link carried it in \`acting\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          actingEndSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/acting/{id}/end`.replace(`{id}`, id);
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
registerPromptSpecs(salesRepsPortal.commands.at(-1)!, actingEndSpecs, { method: "post" });
salesRepsPortal
  .command(`my-acting-leave`)
  .description(`Leave the buyer's shop: every open entry of the signed-in rep is closed with this moment as its end. An entry already closed is left as it is, so a second call answers an empty list.`)
  .alias("sales-reps-my-acting-leave")
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/my/acting/leave`;
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
const myCustomersListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default and maximum 50). A larger value is clamped.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset (default 0).", type: "integer", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
salesRepsPortal
  .command(`my-customers-list`)
  .description(`Every customer the signed-in rep carries, in the order the coverage was recorded, each with the role the rep has there, whether they are the responsible rep, and who the customer is as the customers app answers it. Exactly the rep's own coverage: a customer the rep does not carry is absent rather than refused, and another rep's worklist cannot be read here at all. Paged 50 at a time at most.`)
  .alias("sales-reps-my-customers-list")
  .option(`--limit <limit>`, `Page size (default and maximum 50). A larger value is clamped.`, parseInteger)
  .option(`--offset <offset>`, `Row offset (default 0).`, parseInteger)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, filter } = await promptForMissing(
          _options,
          myCustomersListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/my/customers`;
        const _payload: RequestParams = {};
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
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
registerPromptSpecs(salesRepsPortal.commands.at(-1)!, myCustomersListSpecs, { method: "get" });
const myCustomersContactsListSpecs: PromptSpec[] = [
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The customer, as the customers app knows the organization. It has to be one the signed-in rep carries.", type: "string", required: true, resource: { listPath: "/sales-reps/my/customers", hasLimit: true } },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset (default 0).", type: "integer", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
salesRepsPortal
  .command(`my-customers-contacts-list`)
  .description(`The contacts of one customer the rep carries, as the customers app answers them — the list a rep picks whom to act as from. A customer the rep does not carry is a 404, whether it exists or not.`)
  .alias("sales-reps-my-customers-contacts-list")
  .option(`--organization-id <organization-id>`, `The customer, as the customers app knows the organization. It has to be one the signed-in rep carries.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset (default 0).`, parseInteger)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { organizationId, limit, offset, filter } = await promptForMissing(
          _options,
          myCustomersContactsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/my/customers/{organization_id}/contacts`.replace(`{organization_id}`, organizationId);
        const _payload: RequestParams = {};
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
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
registerPromptSpecs(salesRepsPortal.commands.at(-1)!, myCustomersContactsListSpecs, { method: "get" });
const myCustomersContactsActSpecs: PromptSpec[] = [
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The customer, as the customers app knows the organization. It has to be one the signed-in rep carries.", type: "string", required: true, resource: { listPath: "/sales-reps/my/customers", hasLimit: true } },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person to act as. It has to belong to the customer in the path.", type: "string", required: true, resource: { listPath: "/sales-reps/my/customers/{organization_id}/contacts", hasLimit: true } },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Why the rep acts for this buyer, recorded in the log.", type: "string", required: false },
];
salesRepsPortal
  .command(`my-customers-contacts-act`)
  .description(`Hand the signed-in rep a buyer session for one person of a customer they carry, and answer the shop address that opens it. In this order: the rep has to be allowed to act (\`may_act_for_buyers\`), carry the customer, and the person has to belong to it; then the log entry is recorded (rep, customer, person, start, reason), and only then is the buyer session minted through the customers app's hand-off — so a session nobody can attribute never exists. A refused mint closes the entry at once. One handover per rep is open at a time: a new one ends the one before. The answer's \`url\` is the tenant's sign-in link page (setting \`act_link_url\`) carrying the sign-in secret, the landing the tenant chose (\`act_landing\`: \`home\` or \`quick_order\`), the entry's id as \`acting\`, and the market, locale and currency matching the buyer's language and country. ⚠ \`url\` is a credential for one hour and one use: hand it to the rep's browser, never log it.`)
  .alias("sales-reps-my-customers-contacts-act")
  .option(`--organization-id <organization-id>`, `The customer, as the customers app knows the organization. It has to be one the signed-in rep carries.`)
  .option(`--contact-id <contact-id>`, `The person to act as. It has to belong to the customer in the path.`)
  .option(`--reason <reason>`, `Why the rep acts for this buyer, recorded in the log.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { organizationId, contactId, reason } = await promptForMissing(
          _options,
          myCustomersContactsActSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/my/customers/{organization_id}/contacts/{contact_id}/act`.replace(`{organization_id}`, organizationId).replace(`{contact_id}`, contactId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
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
registerPromptSpecs(salesRepsPortal.commands.at(-1)!, myCustomersContactsActSpecs, { method: "post" });
const myProfileUpdateSpecs: PromptSpec[] = [
  { key: "showsEmail", option: "--shows-email <shows-email>", name: "shows_email", description: "Whether a buyer of a customer this rep carries is shown the rep's `email` (GET /sales-reps/my/reps). False by default: the address is the rep's own to publish, so a rep or an operator switches it on. The name is always shown.", type: "boolean", required: false },
  { key: "showsPhone", option: "--shows-phone <shows-phone>", name: "shows_phone", description: "Whether a buyer of a customer this rep carries is shown the rep's `phone` (GET /sales-reps/my/reps). False by default, for the same reason as `shows_email`.", type: "boolean", required: false },
];
salesRepsPortal
  .command(`my-profile-update`)
  .description(`The rep's own choice of whether the buyers they carry see their address and their phone number. Only these two flags; anything else in the body is refused.`)
  .alias("sales-reps-my-profile-update")
  .option(
    `--shows-email [value]`,
    `Whether a buyer of a customer this rep carries is shown the rep's \`email\` (GET /sales-reps/my/reps). False by default: the address is the rep's own to publish, so a rep or an operator switches it on. The name is always shown.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--shows-phone [value]`,
    `Whether a buyer of a customer this rep carries is shown the rep's \`phone\` (GET /sales-reps/my/reps). False by default, for the same reason as \`shows_email\`.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { showsEmail, showsPhone } = await promptForMissing(
          _options,
          myProfileUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/my/profile`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (showsEmail !== undefined) {
          _payload[`shows_email`] = showsEmail;
        }
        if (showsPhone !== undefined) {
          _payload[`shows_phone`] = showsPhone;
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
registerPromptSpecs(salesRepsPortal.commands.at(-1)!, myProfileUpdateSpecs, { method: "put" });
const myRepsListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
salesRepsPortal
  .command(`my-reps-list`)
  .description(`Who looks after the buyer's company: every active rep carrying it, the responsible one first, each with their name and only the contact details the rep chose to show. A buyer with no company, or a company nobody carries, gets an empty list.`)
  .alias("sales-reps-my-reps-list")
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
          myRepsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/my/reps`;
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
registerPromptSpecs(salesRepsPortal.commands.at(-1)!, myRepsListSpecs, { method: "get" });
const principalResolveSpecs: PromptSpec[] = [
  { key: "repCode", option: "--rep-code <rep-code>", name: "rep_code", description: "The code the rep portal asserted.", type: "string", required: true },
];
salesRepsPortal
  .command(`principal-resolve`)
  .description(`The capability the API gateway calls to turn \`X-Revenexx-Principal: rep:<code>\` into the caller it forwards (this app is the role provider for subject \`sales_rep\`). Sent \`{rep_code}\`, it answers the rep: \`active\` is true only for a rep the merchant has not deactivated, and the gateway refuses an inactive one before any app runs. \`permissions\` is empty — a rep holds no permission of the ledger yet — and \`see_all_customers\` is false: which customers a rep covers is this app's lookup, never a header. The code is composed (Unicode NFC) before it is compared, as the stored code is.`)
  .alias("sales-reps-principal-resolve")
  .option(`--rep-code <rep-code>`, `The code the rep portal asserted.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { repCode } = await promptForMissing(
          _options,
          principalResolveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/principal/resolve`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (repCode !== undefined) {
          _payload[`rep_code`] = repCode;
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
registerPromptSpecs(salesRepsPortal.commands.at(-1)!, principalResolveSpecs, { method: "post" });
