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

export const customers = new Command("customers")
  .description(
    commandDescriptions["customers"] ??
      `Storefront access: the authentication passthrough a shop front-end calls, and the principal resolver the API gateway calls. Register, log in, log out, recover a password, resolve the current session back to its contact — this app owns the customer DATA while the platform identity service owns the sessions, so these routes forward to it and answer with both halves. Session material travels in the body, which makes the expected caller a trusted BFF rather than a browser. These are the only operations here with no Cockpit screen; every group below is one.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const authLoginSpecs: PromptSpec[] = [
  { key: "email", option: "--email <email>", name: "email", description: "The buyer's login address — the same one the contact carries.", type: "string", required: true },
  { key: "password", option: "--password <password>", name: "password", description: "The password from registration or recovery. Wrong credentials are a 401; a correct one on an undecided application is a 403.", type: "string", required: true, secret: true },
];
customers
  .command(`auth-login`)
  .description(`An email and a password go in; a session and the CONTACT behind it come back, so a storefront knows in one call both that the buyer is signed in and who they are. The session is minted server-side rather than handed back from the credential check, because the account route hides the session secret from non-privileged responses and a trusted BFF needs it. \`permissions\` carries the buyer's effective grants, so a BFF does not need a second call to decide what to render.`)
  .option(`--email <email>`, `The buyer's login address — the same one the contact carries.`)
  .option(`--password <password>`, `The password from registration or recovery. Wrong credentials are a 401; a correct one on an undecided application is a 403.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { email, password } = await promptForMissing(
          _options,
          authLoginSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/login`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (password !== undefined) {
          _payload[`password`] = password;
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
registerPromptSpecs(customers.commands.at(-1)!, authLoginSpecs, { method: "post" });
const authLogoutSpecs: PromptSpec[] = [
  { key: "sessionId", option: "--session-id <session-id>", name: "session_id", description: "The session to revoke — `session.$id` from the login.", type: "string", required: true },
  { key: "userId", option: "--user-id <user-id>", name: "user_id", description: "The platform user — `session.userId` from the login.", type: "string", required: true },
];
customers
  .command(`auth-logout`)
  .description(`Ends ONE session — the buyer signs out on this device and stays signed in on the others, because the session id is what is revoked and not the account. The contact row is untouched: signing out is not blocking, and a caller wanting the second thing wants \`status: "blocked"\` on the contact instead. Both ids come from what \`/customers/auth/login\` answered, and a BFF should drop its own cookie whatever this answers — the session is unusable afterwards either way.`)
  .option(`--session-id <session-id>`, `The session to revoke — \`session.\$id\` from the login.`)
  .option(`--user-id <user-id>`, `The platform user — \`session.userId\` from the login.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { sessionId, userId } = await promptForMissing(
          _options,
          authLogoutSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/logout`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (sessionId !== undefined) {
          _payload[`session_id`] = sessionId;
        }
        if (userId !== undefined) {
          _payload[`user_id`] = userId;
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
registerPromptSpecs(customers.commands.at(-1)!, authLogoutSpecs, { method: "post" });
const authMeSpecs: PromptSpec[] = [
  { key: "userId", option: "--user-id <user-id>", name: "user_id", description: "The platform user to resolve — `session.userId` from the login.", type: "string", required: true },
  { key: "sessionId", option: "--session-id <session-id>", name: "session_id", description: "Optional session to verify. Pass it to ask \"is this session still alive?\" (a revoked one is then a 401); omit it to only ask who a user is.", type: "string", required: false },
];
customers
  .command(`auth-me`)
  .description(`The platform user, the customer record mirrored against it and the effective grants, in one call. The expected caller is a trusted storefront BFF holding the session on the buyer's behalf, which is why the ids travel in the body rather than in a browser-facing header. The grants are derived here on every call rather than returned from anywhere they could be cached, so a role changed a second ago is already reflected.`)
  .option(`--user-id <user-id>`, `The platform user to resolve — \`session.userId\` from the login.`)
  .option(`--session-id <session-id>`, `Optional session to verify. Pass it to ask "is this session still alive?" (a revoked one is then a 401); omit it to only ask who a user is.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { userId, sessionId } = await promptForMissing(
          _options,
          authMeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/me`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (sessionId !== undefined) {
          _payload[`session_id`] = sessionId;
        }
        if (userId !== undefined) {
          _payload[`user_id`] = userId;
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
registerPromptSpecs(customers.commands.at(-1)!, authMeSpecs, { method: "post" });
const authRecoverySpecs: PromptSpec[] = [
  { key: "email", option: "--email <email>", name: "email", description: "Who to send the recovery mail to. An address nobody holds is not distinguished here — do not build an account-existence check on the answer.", type: "string", required: true },
  { key: "url", option: "--url <url>", name: "url", description: "Where the mailed link points. The identity service appends `userId` and `secret` as query parameters; those two are what the confirm call takes.", type: "string", required: true },
];
customers
  .command(`auth-recovery`)
  .description(`Step one of two: the identity service mails a link to the address given, and \`PUT /customers/auth/recovery\` is what the buyer's browser comes back to. The secret is NOT in this answer — it exists only inside the mailed link, which is the whole point of the two-step shape. An address nobody holds is deliberately not distinguished from one that exists, so no account-existence check can be built on the answer. Nothing about the contact changes here; the password only moves in step two.`)
  .option(`--email <email>`, `Who to send the recovery mail to. An address nobody holds is not distinguished here — do not build an account-existence check on the answer.`)
  .option(`--url <url>`, `Where the mailed link points. The identity service appends \`userId\` and \`secret\` as query parameters; those two are what the confirm call takes.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { email, url } = await promptForMissing(
          _options,
          authRecoverySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/recovery`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (url !== undefined) {
          _payload[`url`] = url;
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
registerPromptSpecs(customers.commands.at(-1)!, authRecoverySpecs, { method: "post" });
const authRecoveryConfirmSpecs: PromptSpec[] = [
  { key: "password", option: "--password <password>", name: "password", description: "The new password. It replaces the old one immediately; existing sessions are the identity service's business, not this app's.", type: "string", required: true, secret: true },
  { key: "secret", option: "--secret <secret>", name: "secret", description: "The one-time secret from the mailed link. Only that value works — it is spent on first use and expires, and anything else is a 401, so no example here would be anything but a call that fails.", type: "string", required: true, secret: true },
  { key: "userId", option: "--user-id <user-id>", name: "user_id", description: "The `userId` the mailed link carried.", type: "string", required: true },
];
customers
  .command(`auth-recovery-confirm`)
  .description(`Step two: the \`userId\` and \`secret\` the mailed link carried, plus the password the buyer just typed. The secret is spent on first use and expires, so a link cannot be replayed and a second attempt with the same one is a 401 rather than a second password change. The new password is in effect the moment this answers; what happens to sessions opened with the old one is the identity service's policy, not this app's.`)
  .option(`--password <password>`, `The new password. It replaces the old one immediately; existing sessions are the identity service's business, not this app's.`)
  .option(`--secret <secret>`, `The one-time secret from the mailed link. Only that value works — it is spent on first use and expires, and anything else is a 401, so no example here would be anything but a call that fails.`)
  .option(`--user-id <user-id>`, `The \`userId\` the mailed link carried.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { password, secret, userId } = await promptForMissing(
          _options,
          authRecoveryConfirmSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/recovery`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (password !== undefined) {
          _payload[`password`] = password;
        }
        if (secret !== undefined) {
          _payload[`secret`] = secret;
        }
        if (userId !== undefined) {
          _payload[`user_id`] = userId;
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
registerPromptSpecs(customers.commands.at(-1)!, authRecoveryConfirmSpecs, { method: "put" });
const authRegisterSpecs: PromptSpec[] = [
  { key: "email", option: "--email <email>", name: "email", description: "The buyer's address. It becomes the login AND the unique key of the contact, so a second registration with it is a 409 — including while the first one is still waiting for approval.", type: "string", required: true },
  { key: "password", option: "--password <password>", name: "password", description: "The password the buyer chooses. It is hashed by the identity service at this moment and never travels again: an approval later enables the account, it does not issue a new credential.", type: "string", required: true, secret: true },
  { key: "firstName", option: "--first-name <first-name>", name: "first_name", description: "Given name. Optional: an ERP import often has only a mailbox.", type: "string", required: false },
  { key: "lastName", option: "--last-name <last-name>", name: "last_name", description: "Family name. Optional for the same reason.", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "The language this person is written to in — BCP 47, and one of the store's configured locales. Null falls back to the store default. One of the store's own locales, or the call is a 400.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "JOIN an existing company — the invite shape. Neither b2b_registration_enabled nor b2c_registration_enabled applies to it.", type: "string", required: false },
  { key: "organizationName", option: "--organization-name <organization-name>", name: "organization_name", description: "FOUND a new company, with this contact as its admin. This is what makes the registration a B2B one; leaving it out registers a standalone buyer.", type: "string", required: false },
  { key: "vatId", option: "--vat-id <vat-id>", name: "vat_id", description: "VAT identification number (USt-IdNr. in Germany) — the closest thing a B2B buyer has to a legal identity. Validated against the EU VIES service when the tenant's `organization_vat_id_required` setting is on, and stored verbatim otherwise, including for buyers outside the EU. Required when the tenant's `organization_vat_id_required` is on, and checked BEFORE the company is created so a bad one leaves no half-founded organization behind.", type: "string", required: false },
];
customers
  .command(`auth-register`)
  .description(`One call writes the whole buyer: the contact this app is the system of record for, and the platform user behind its login. When the body names a company it also FOUNDS one — an organization, mirrored into platform auth as a team, with this contact as its admin. The tenant setting registration_mode decides what a registration IS. 'open' (the default, unchanged behaviour) creates a finished account: registration_status='approved', status='active', login works. 'approval_required' creates an APPLICATION: registration_status='pending', status='invited', the platform user exists with the applicant's own password but is DISABLED, and a newly founded organization is parked as 'blocked' — check \`approval_required\` in the response and show a 'we will get back to you' screen instead of logging the buyer in. The registration gates below are all evaluated BEFORE anything is written, and a failure after that point rolls the organization and the contact back together.`)
  .option(`--email <email>`, `The buyer's address. It becomes the login AND the unique key of the contact, so a second registration with it is a 409 — including while the first one is still waiting for approval.`)
  .option(`--password <password>`, `The password the buyer chooses. It is hashed by the identity service at this moment and never travels again: an approval later enables the account, it does not issue a new credential.`)
  .option(`--first-name <first-name>`, `Given name. Optional: an ERP import often has only a mailbox.`)
  .option(`--last-name <last-name>`, `Family name. Optional for the same reason.`)
  .option(`--locale <locale>`, `The language this person is written to in — BCP 47, and one of the store's configured locales. Null falls back to the store default. One of the store's own locales, or the call is a 400.`)
  .option(`--organization-id <organization-id>`, `JOIN an existing company — the invite shape. Neither b2b_registration_enabled nor b2c_registration_enabled applies to it.`)
  .option(`--organization-name <organization-name>`, `FOUND a new company, with this contact as its admin. This is what makes the registration a B2B one; leaving it out registers a standalone buyer.`)
  .option(`--vat-id <vat-id>`, `VAT identification number (USt-IdNr. in Germany) — the closest thing a B2B buyer has to a legal identity. Validated against the EU VIES service when the tenant's \`organization_vat_id_required\` setting is on, and stored verbatim otherwise, including for buyers outside the EU. Required when the tenant's \`organization_vat_id_required\` is on, and checked BEFORE the company is created so a bad one leaves no half-founded organization behind.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { email, password, firstName, lastName, locale, organizationId, organizationName, vatId } = await promptForMissing(
          _options,
          authRegisterSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/auth/register`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (firstName !== undefined) {
          _payload[`first_name`] = firstName;
        }
        if (lastName !== undefined) {
          _payload[`last_name`] = lastName;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (organizationName !== undefined) {
          _payload[`organization_name`] = organizationName;
        }
        if (password !== undefined) {
          _payload[`password`] = password;
        }
        if (vatId !== undefined) {
          _payload[`vat_id`] = vatId;
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
registerPromptSpecs(customers.commands.at(-1)!, authRegisterSpecs, { method: "post" });
const principalResolveSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The contact the caller is acting for.", type: "string", required: true },
];
customers
  .command(`principal-resolve`)
  .description(`The capability the API gateway calls to turn a caller's X-Revenexx-Principal assertion into the permission set it forwards to every other app as X-Revenexx-Permissions. This app is the platform's role provider (manifest#provides_roles), and this is the hot path of every attributed storefront request — one contact read plus the tenant's role map. A blocked or pending contact always resolves with active=false; what its \`permissions\` then say is the tenant's blocked_contact_behavior setting — 'keep' (the default, the role's grants), 'catalog_only' or 'deny_all'.`)
  .option(`--contact-id <contact-id>`, `The contact the caller is acting for.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId } = await promptForMissing(
          _options,
          principalResolveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/principal/resolve`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
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
registerPromptSpecs(customers.commands.at(-1)!, principalResolveSpecs, { method: "post" });
