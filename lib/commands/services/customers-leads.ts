import { Command } from "commander";
import { resolveBodyParam } from "../../utils.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  cliConfig,
  parse,
} from "../../parser.js";
import {
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const customersLeads = new Command("customers-leads")
  .description(
    commandDescriptions["customersLeads"] ??
      `The people in the marketing and sales funnel who are not customers yet: a contact stage (subscriber, lead, mql, sql, opportunity, customer — the tenant's own set), where they came from, who owns them and a score. Moving a person along and handing a lead to a sales rep are the two writes; every stage change is announced as contact.lifecycle_changed. The consent flag on a contact is a mirror of the consent app, and the mirror's sweep sits here too.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

customersLeads
  .command(`customers-consent-mirror-run`)
  .description(`\`consent_marketing\` on a contact is a mirror of the consent app (revenexx/marketing-consents): true while the person holds at least one confirmed email subscription there. This reads the email subscriptions the consent app changed in the last three hours and sets each person's flag to what the consent app answers now. The hourly schedule \`mirror-marketing-consents\` runs the same code, and so does each subscription event the platform delivers. A person the consent app does not answer for keeps the flag. Only a change is written.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/customers/consent-mirror/run`;
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
const customersContactsHandoverSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person to hand over.", type: "string", required: true },
  { key: "ownerId", option: "--owner-id <owner-id>", name: "owner_id", description: "The rep code who takes the lead.", type: "string", required: true },
  { key: "actor", option: "--actor <actor>", name: "actor", description: "Who handed it over.", type: "string", required: false },
  { key: "dueAt", option: "--due-at <due-at>", name: "due_at", description: "When the rep should have called.", type: "string", required: false },
  { key: "note", option: "--note <note>", name: "note", description: "What the rep should know.", type: "string", required: false },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "The task's line. Defaults to „Lead übernehmen: <name>“.", type: "string", required: false },
];
customersLeads
  .command(`customers-contacts-handover`)
  .description(`Names the sales rep who owns the person (\`owner_id\`, a rep CODE of the sales-reps app) and files a task for that rep on the person's timeline — the Cockpit's "An Vertrieb übergeben". The stage is left alone: accepting the lead is the rep's own step (sql). A code the sales-reps app does not know is refused; where that app is not installed, the code is taken as given.`)
  .option(`--contact-id <contact-id>`, `The person to hand over.`)
  .option(`--owner-id <owner-id>`, `The rep code who takes the lead.`)
  .option(`--actor <actor>`, `Who handed it over.`)
  .option(`--due-at <due-at>`, `When the rep should have called.`)
  .option(`--note <note>`, `What the rep should know.`)
  .option(`--subject <subject>`, `The task's line. Defaults to „Lead übernehmen: <name>“.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, ownerId, actor, dueAt, note, subject } = await promptForMissing(
          _options,
          customersContactsHandoverSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{contact_id}/handover`.replace(`{contact_id}`, contactId);
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
        if (dueAt !== undefined) {
          _payload[`due_at`] = dueAt;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
        }
        if (ownerId !== undefined) {
          _payload[`owner_id`] = ownerId;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
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
registerPromptSpecs(customersLeads.commands.at(-1)!, customersContactsHandoverSpecs, { method: "post" });
const customersContactsLifecycleSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person to move.", type: "string", required: true },
  { key: "stage", option: "--stage <stage>", name: "stage", description: "The stage to move to — a code of GET /customers/contact-lifecycle-stages.", type: "string", required: true },
  { key: "actor", option: "--actor <actor>", name: "actor", description: "Who moved it (operator id or email). Rides on the event.", type: "string", required: false },
  { key: "leadSource", option: "--lead-source <lead-source>", name: "lead_source", description: "Taken only when the person has no source yet.", type: "string", required: false, enum: ["form","campaign","import","trade_fair","newsletter","referral","manual"] },
  { key: "leadSourceRef", option: "--lead-source-ref <lead-source-ref>", name: "lead_source_ref", description: "Taken with `lead_source`.", type: "string", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Why, in words. Rides on the event; not stored on the contact.", type: "string", required: false },
];
customersLeads
  .command(`customers-contacts-lifecycle`)
  .description(`Sets the PERSON's lifecycle stage (subscriber, lead, mql, sql, opportunity, customer, or a stage of the tenant's own) and announces it once as \`contact.lifecycle_changed\` on the person's channel. A repeat of the stage the person already holds changes nothing, announces nothing and answers \`changed: false\`. A person without a lead source yet takes \`lead_source\` / \`lead_source_ref\` from the body; one that has a source keeps it. The journeys step \`set_lifecycle_stage\`, the Cockpit's Qualifizieren action and a form listener all call this.`)
  .option(`--contact-id <contact-id>`, `The person to move.`)
  .option(`--stage <stage>`, `The stage to move to — a code of GET /customers/contact-lifecycle-stages.`)
  .option(`--actor <actor>`, `Who moved it (operator id or email). Rides on the event.`)
  .option(`--lead-source <lead-source>`, `Taken only when the person has no source yet.`)
  .option(`--lead-source-ref <lead-source-ref>`, `Taken with \`lead_source\`.`)
  .option(`--reason <reason>`, `Why, in words. Rides on the event; not stored on the contact.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, stage, actor, leadSource, leadSourceRef, reason } = await promptForMissing(
          _options,
          customersContactsLifecycleSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{contact_id}/lifecycle`.replace(`{contact_id}`, contactId);
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
        if (leadSource !== undefined) {
          _payload[`lead_source`] = leadSource;
        }
        if (leadSourceRef !== undefined) {
          _payload[`lead_source_ref`] = leadSourceRef;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
        }
        if (stage !== undefined) {
          _payload[`stage`] = stage;
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
registerPromptSpecs(customersLeads.commands.at(-1)!, customersContactsLifecycleSpecs, { method: "post" });
