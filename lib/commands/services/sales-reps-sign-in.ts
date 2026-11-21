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
} from "../../parser.js";
import {
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const salesRepsSignIn = new Command("sales-reps-sign-in")
  .description(
    commandDescriptions["salesRepsSignIn"] ??
      `How a rep signs in, and how they get a login at all. A rep is a PLATFORM USER of this tenant, signing in with their real e-mail address — and when that address already belongs to a shop buyer of the same tenant, the invitation LINKS that login instead of creating a second one, so one person has one password. Which of the two they act as is decided by the surface: every route here asks for an ACTIVE rep linked to the login and answers a login with none exactly as it answers a wrong password. The caller is the rep portal's server, holding the tenant API key: it keeps the session, asks \`me\` on every request, and is the only party that ever sees the session secret, which leaves this app in one field (\`session.secret\`) on the answers that open a session. The requests that mail a link or a code answer \`{ "accepted": true }\` whoever the address belongs to — no user id, no expiry — and the ids travel only inside the mailed link. The second factor is an e-mail code, switched on per tenant (off by default), and its challenge needs the session secret the password sign-in answered. Creating or importing a rep mails nobody: the invitation is an explicit call, and a mail that did not go out is a 502.`,
  )
  .configureHelp({
    ...hiddenAliasHelp,
    helpWidth: process.stdout.columns || 80,
  });

const authInvitationAcceptSpecs: PromptSpec[] = [
  { key: "secret", option: "--secret <secret>", name: "secret", description: "`secret` from the invitation link's query. Single use.", type: "string", required: true, secret: true },
  { key: "userId", option: "--user-id <user-id>", name: "user_id", description: "`userId` from the invitation link's query.", type: "string", required: true },
  { key: "password", option: "--password <password>", name: "password", description: "The new password, 8 to 256 characters. For a login the rep shares with a shop buyer of this tenant it is the one password of both. Required while password sign-in is offered, refused while it is not.", type: "string", required: false, secret: true },
];
salesRepsSignIn
  .command(`auth-invitation-accept`)
  .description(`The rep portal's server calls this with the tenant API key; a rep is a platform user of this tenant, and every sign-in asks for an ACTIVE rep linked to the login. The invitation's link proves the mailbox; the password chosen here is the login's from now on. Signs nobody in — the rep signs in afterwards. In a tenant that switched password sign-in off, no password is taken and the rep signs in with a link or a code.`)
  .alias("sales-reps-auth-invitation-accept")
  .option(`--secret <secret>`, `\`secret\` from the invitation link's query. Single use.`)
  .option(`--user-id <user-id>`, `\`userId\` from the invitation link's query.`)
  .option(`--password <password>`, `The new password, 8 to 256 characters. For a login the rep shares with a shop buyer of this tenant it is the one password of both. Required while password sign-in is offered, refused while it is not.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { secret, userId, password } = await promptForMissing(
          _options,
          authInvitationAcceptSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/auth/invitation`;
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
registerPromptSpecs(salesRepsSignIn.commands.at(-1)!, authInvitationAcceptSpecs, { method: "put" });
const authLoginSpecs: PromptSpec[] = [
  { key: "email", option: "--email <email>", name: "email", description: "The address the rep signs in with. Compared as the identity service holds it: trimmed and in lower case.", type: "string", required: true },
  { key: "password", option: "--password <password>", name: "password", description: "The rep's password.", type: "string", required: true, secret: true },
];
salesRepsSignIn
  .command(`auth-login`)
  .description(`The rep portal's server calls this with the tenant API key; a rep is a platform user of this tenant, and every sign-in asks for an ACTIVE rep linked to the login. The identity service checks the password; a wrong one, an address nobody holds, a blocked login and a login with no active rep — a shop buyer's, a deactivated rep's — all get the same 401. With the tenant's second factor on, the code is mailed here and the answer is \`mfa_required: true\` with a session \`me\` refuses until the code is confirmed.`)
  .alias("sales-reps-auth-login")
  .option(`--email <email>`, `The address the rep signs in with. Compared as the identity service holds it: trimmed and in lower case.`)
  .option(`--password <password>`, `The rep's password.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { email, password } = await promptForMissing(
          _options,
          authLoginSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/auth/login`;
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
registerPromptSpecs(salesRepsSignIn.commands.at(-1)!, authLoginSpecs, { method: "post" });
const authLogoutSpecs: PromptSpec[] = [
  { key: "sessionId", option: "--session-id <session-id>", name: "session_id", description: "The session id, as the sign-in answered it.", type: "string", required: true },
  { key: "userId", option: "--user-id <user-id>", name: "user_id", description: "The platform user of the session, as the sign-in answered it.", type: "string", required: true },
];
salesRepsSignIn
  .command(`auth-logout`)
  .description(`The rep portal's server calls this with the tenant API key; a rep is a platform user of this tenant, and every sign-in asks for an ACTIVE rep linked to the login. Deletes the session. A session already gone counts as logged out.`)
  .alias("sales-reps-auth-logout")
  .option(`--session-id <session-id>`, `The session id, as the sign-in answered it.`)
  .option(`--user-id <user-id>`, `The platform user of the session, as the sign-in answered it.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { sessionId, userId } = await promptForMissing(
          _options,
          authLogoutSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/auth/logout`;
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
registerPromptSpecs(salesRepsSignIn.commands.at(-1)!, authLogoutSpecs, { method: "post" });
const authMagicLinkRequestSpecs: PromptSpec[] = [
  { key: "email", option: "--email <email>", name: "email", description: "The address to send the link to. Compared as the identity service holds it: trimmed and in lower case.", type: "string", required: true },
  { key: "url", option: "--url <url>", name: "url", description: "Where the mailed link points: a page of the rep portal, which receives `userId`, `secret` and `expire` on its query. It has to sit on one of the tenant's allowed link origins (this app's settings); left out, the first of them is used.", type: "string", required: false },
];
salesRepsSignIn
  .command(`auth-magic-link-request`)
  .description(`The rep portal's server calls this with the tenant API key; a rep is a platform user of this tenant, and every sign-in asks for an ACTIVE rep linked to the login. Mails a link valid for an hour, usable once, to an address that belongs to an active rep's login; every other address gets the same answer and no mail. It never creates a login. A login holds one live link or code: a new one voids the one before it; it no longer touches an open invitation or new-password link.`)
  .alias("sales-reps-auth-magic-link-request")
  .option(`--email <email>`, `The address to send the link to. Compared as the identity service holds it: trimmed and in lower case.`)
  .option(`--url <url>`, `Where the mailed link points: a page of the rep portal, which receives \`userId\`, \`secret\` and \`expire\` on its query. It has to sit on one of the tenant's allowed link origins (this app's settings); left out, the first of them is used.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { email, url } = await promptForMissing(
          _options,
          authMagicLinkRequestSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/auth/magic-link`;
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
registerPromptSpecs(salesRepsSignIn.commands.at(-1)!, authMagicLinkRequestSpecs, { method: "post" });
const authMagicLinkConfirmSpecs: PromptSpec[] = [
  { key: "secret", option: "--secret <secret>", name: "secret", description: "`secret` from the sign-in link's query. Single use.", type: "string", required: true, secret: true },
  { key: "userId", option: "--user-id <user-id>", name: "user_id", description: "`userId` from the sign-in link's query.", type: "string", required: true },
];
salesRepsSignIn
  .command(`auth-magic-link-confirm`)
  .description(`The rep portal's server calls this with the tenant API key; a rep is a platform user of this tenant, and every sign-in asks for an ACTIVE rep linked to the login. Redeems the link once. The link proves the mailbox, so it satisfies the second factor too.`)
  .alias("sales-reps-auth-magic-link-confirm")
  .option(`--secret <secret>`, `\`secret\` from the sign-in link's query. Single use.`)
  .option(`--user-id <user-id>`, `\`userId\` from the sign-in link's query.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { secret, userId } = await promptForMissing(
          _options,
          authMagicLinkConfirmSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/auth/magic-link`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
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
registerPromptSpecs(salesRepsSignIn.commands.at(-1)!, authMagicLinkConfirmSpecs, { method: "put" });
const authMeSpecs: PromptSpec[] = [
  { key: "sessionId", option: "--session-id <session-id>", name: "session_id", description: "The session id, as the sign-in answered it.", type: "string", required: true },
  { key: "userId", option: "--user-id <user-id>", name: "user_id", description: "The platform user of the session, as the sign-in answered it.", type: "string", required: true },
];
salesRepsSignIn
  .command(`auth-me`)
  .description(`The rep portal's server calls this with the tenant API key; a rep is a platform user of this tenant, and every sign-in asks for an ACTIVE rep linked to the login. Asked by the portal's server on every request, so deactivating a rep, blocking their login and the tenant's maximum session age take effect on the next one. Answers the rep's own record and nothing about any other rep. It is not a resolver the gateway calls, and nothing outside this app is narrowed by it.`)
  .alias("sales-reps-auth-me")
  .option(`--session-id <session-id>`, `The session id, as the sign-in answered it.`)
  .option(`--user-id <user-id>`, `The platform user of the session, as the sign-in answered it.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { sessionId, userId } = await promptForMissing(
          _options,
          authMeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/auth/me`;
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
registerPromptSpecs(salesRepsSignIn.commands.at(-1)!, authMeSpecs, { method: "post" });
const authMfaChallengeRequestSpecs: PromptSpec[] = [
  { key: "sessionSecret", option: "--session-secret <session-secret>", name: "session_secret", description: "`session.secret` from the password sign-in's answer. It is the proof the challenge asks for: the user is read from this session, never taken from the body.", type: "string", required: true, secret: true },
];
salesRepsSignIn
  .command(`auth-mfa-challenge-request`)
  .description(`The rep portal's server calls this with the tenant API key; a rep is a platform user of this tenant, and every sign-in asks for an ACTIVE rep linked to the login. The password sign-in already mails the first code; this sends another for the same half-finished sign-in. Needs that sign-in's session secret.`)
  .alias("sales-reps-auth-mfa-challenge-request")
  .option(`--session-secret <session-secret>`, `\`session.secret\` from the password sign-in's answer. It is the proof the challenge asks for: the user is read from this session, never taken from the body.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { sessionSecret } = await promptForMissing(
          _options,
          authMfaChallengeRequestSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/auth/mfa/challenge`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (sessionSecret !== undefined) {
          _payload[`session_secret`] = sessionSecret;
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
registerPromptSpecs(salesRepsSignIn.commands.at(-1)!, authMfaChallengeRequestSpecs, { method: "post" });
const authMfaChallengeConfirmSpecs: PromptSpec[] = [
  { key: "challengeId", option: "--challenge-id <challenge-id>", name: "challenge_id", description: "The challenge from the sign-in, or from the request for a new code.", type: "string", required: true },
  { key: "code", option: "--code <code>", name: "code", description: "The code from the mail. Spaces in it do not matter.", type: "string", required: true },
  { key: "sessionSecret", option: "--session-secret <session-secret>", name: "session_secret", description: "`session.secret` from the password sign-in's answer. It is the proof the challenge asks for: the user is read from this session, never taken from the body.", type: "string", required: true, secret: true },
];
salesRepsSignIn
  .command(`auth-mfa-challenge-confirm`)
  .description(`The rep portal's server calls this with the tenant API key; a rep is a platform user of this tenant, and every sign-in asks for an ACTIVE rep linked to the login. Completes the sign-in the password started: from here \`me\` accepts the session. Does not answer the secret again — the portal's server already holds it.`)
  .alias("sales-reps-auth-mfa-challenge-confirm")
  .option(`--challenge-id <challenge-id>`, `The challenge from the sign-in, or from the request for a new code.`)
  .option(`--code <code>`, `The code from the mail. Spaces in it do not matter.`)
  .option(`--session-secret <session-secret>`, `\`session.secret\` from the password sign-in's answer. It is the proof the challenge asks for: the user is read from this session, never taken from the body.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { challengeId, code, sessionSecret } = await promptForMissing(
          _options,
          authMfaChallengeConfirmSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/auth/mfa/challenge`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (challengeId !== undefined) {
          _payload[`challenge_id`] = challengeId;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (sessionSecret !== undefined) {
          _payload[`session_secret`] = sessionSecret;
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
registerPromptSpecs(salesRepsSignIn.commands.at(-1)!, authMfaChallengeConfirmSpecs, { method: "put" });
const authOtpRequestSpecs: PromptSpec[] = [
  { key: "email", option: "--email <email>", name: "email", description: "The address to send the code to. Compared as the identity service holds it: trimmed and in lower case.", type: "string", required: true },
];
salesRepsSignIn
  .command(`auth-otp-request`)
  .description(`The rep portal's server calls this with the tenant API key; a rep is a platform user of this tenant, and every sign-in asks for an ACTIVE rep linked to the login. Mails a code valid for fifteen minutes — six digits, or six characters from 0-9 and a-f where the tenant's \`otp_code_format\` setting says \`alphanumeric\` or while the identity service has not confirmed the limits that make six digits safe — to an address that belongs to an active rep's login — for a mailbox on another device, or an app shell a link will not open in. Every other address gets the same answer and no mail.`)
  .alias("sales-reps-auth-otp-request")
  .option(`--email <email>`, `The address to send the code to. Compared as the identity service holds it: trimmed and in lower case.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { email } = await promptForMissing(
          _options,
          authOtpRequestSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/auth/otp`;
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
registerPromptSpecs(salesRepsSignIn.commands.at(-1)!, authOtpRequestSpecs, { method: "post" });
const authOtpConfirmSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "The code from the mail. Spaces and the case of its letters do not matter, and a code mailed before the tenant changed its code format still works until it expires.", type: "string", required: true },
  { key: "email", option: "--email <email>", name: "email", description: "The address the code was sent to. Compared as the identity service holds it: trimmed and in lower case.", type: "string", required: true },
];
salesRepsSignIn
  .command(`auth-otp-confirm`)
  .description(`The rep portal's server calls this with the tenant API key; a rep is a platform user of this tenant, and every sign-in asks for an ACTIVE rep linked to the login. Redeemed with the address the code went to, because the request never answered an id. Usable once; satisfies the second factor. A code takes five wrong tries; after them it is void, even when right, until a new one is asked for. Ten wrong tries of a login's codes within an hour have every code of the login refused until the hour has passed; a sign-in link still works. A login holds one live link or code: asking for a new one voids the one before it. A void code is refused in the same words as a wrong one.`)
  .alias("sales-reps-auth-otp-confirm")
  .option(`--code <code>`, `The code from the mail. Spaces and the case of its letters do not matter, and a code mailed before the tenant changed its code format still works until it expires.`)
  .option(`--email <email>`, `The address the code was sent to. Compared as the identity service holds it: trimmed and in lower case.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, email } = await promptForMissing(
          _options,
          authOtpConfirmSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/auth/otp`;
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
        if (email !== undefined) {
          _payload[`email`] = email;
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
registerPromptSpecs(salesRepsSignIn.commands.at(-1)!, authOtpConfirmSpecs, { method: "put" });
const authRecoveryRequestSpecs: PromptSpec[] = [
  { key: "email", option: "--email <email>", name: "email", description: "The address to send the link to. Compared as the identity service holds it: trimmed and in lower case.", type: "string", required: true },
  { key: "url", option: "--url <url>", name: "url", description: "Where the mailed link points: a page of the rep portal, which receives `userId`, `secret` and `expire` on its query. It has to sit on one of the tenant's allowed link origins (this app's settings); left out, the first of them is used.", type: "string", required: false },
];
salesRepsSignIn
  .command(`auth-recovery-request`)
  .description(`The rep portal's server calls this with the tenant API key; a rep is a platform user of this tenant, and every sign-in asks for an ACTIVE rep linked to the login. Mails a link valid for an hour to an address that belongs to an active rep's login; every other address gets the same answer and no mail.`)
  .alias("sales-reps-auth-recovery-request")
  .option(`--email <email>`, `The address to send the link to. Compared as the identity service holds it: trimmed and in lower case.`)
  .option(`--url <url>`, `Where the mailed link points: a page of the rep portal, which receives \`userId\`, \`secret\` and \`expire\` on its query. It has to sit on one of the tenant's allowed link origins (this app's settings); left out, the first of them is used.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { email, url } = await promptForMissing(
          _options,
          authRecoveryRequestSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/auth/recovery`;
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
registerPromptSpecs(salesRepsSignIn.commands.at(-1)!, authRecoveryRequestSpecs, { method: "post" });
const authRecoveryConfirmSpecs: PromptSpec[] = [
  { key: "password", option: "--password <password>", name: "password", description: "The new password, 8 to 256 characters. For a login the rep shares with a shop buyer of this tenant it is the one password of both.", type: "string", required: true, secret: true },
  { key: "secret", option: "--secret <secret>", name: "secret", description: "`secret` from the recovery link's query. Single use.", type: "string", required: true, secret: true },
  { key: "userId", option: "--user-id <user-id>", name: "user_id", description: "`userId` from the recovery link's query.", type: "string", required: true },
];
salesRepsSignIn
  .command(`auth-recovery-confirm`)
  .description(`The rep portal's server calls this with the tenant API key; a rep is a platform user of this tenant, and every sign-in asks for an ACTIVE rep linked to the login. Redeems the link once and sets the password. Signs nobody in: the rep signs in with the new password afterwards.`)
  .alias("sales-reps-auth-recovery-confirm")
  .option(`--password <password>`, `The new password, 8 to 256 characters. For a login the rep shares with a shop buyer of this tenant it is the one password of both.`)
  .option(`--secret <secret>`, `\`secret\` from the recovery link's query. Single use.`)
  .option(`--user-id <user-id>`, `\`userId\` from the recovery link's query.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { password, secret, userId } = await promptForMissing(
          _options,
          authRecoveryConfirmSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/auth/recovery`;
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
registerPromptSpecs(salesRepsSignIn.commands.at(-1)!, authRecoveryConfirmSpecs, { method: "put" });
const repsIdentitySpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The rep to give a login.", type: "string", required: true },
];
salesRepsSignIn
  .command(`reps-identity`)
  .description(`The repair for reps an import wrote without a login: the same linking as the invitation, and no mail at all. Idempotent — a rep who has their login is answered 200 with \`kept\` and nothing is touched. Telling the rep is the invitation's job.`)
  .alias("sales-reps-reps-identity")
  .option(`--id <id>`, `The rep to give a login.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          repsIdentitySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/reps/{id}/identity`.replace(`{id}`, id);
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
registerPromptSpecs(salesRepsSignIn.commands.at(-1)!, repsIdentitySpecs, { method: "post" });
const repsInviteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The rep to invite.", type: "string", required: true },
  { key: "inviter", option: "--inviter <inviter>", name: "inviter", description: "Who the mail says invited them. Defaults to `team`.", type: "string", required: false },
  { key: "team", option: "--team <team>", name: "team", description: "What the mail says they were invited into. Defaults to the host of `url`.", type: "string", required: false },
  { key: "url", option: "--url <url>", name: "url", description: "Where the mailed link points: a page of the rep portal, which receives `userId`, `secret` and `expire` on its query. It has to sit on one of the tenant's allowed link origins (this app's settings); left out, the first of them is used.", type: "string", required: false },
];
salesRepsSignIn
  .command(`reps-invite`)
  .description(`The one call that tells a rep anything: creating or importing a rep mails nobody. It links the platform user that already holds the rep's address, or creates one, then mails a link valid for seven days to the page that sets the password (PUT /sales-reps/auth/invitation). Repeatable; each call mails a new link. A mail that did not go out is a 502 — the login stays linked, and the call can simply be repeated.`)
  .alias("sales-reps-reps-invite")
  .option(`--id <id>`, `The rep to invite.`)
  .option(`--inviter <inviter>`, `Who the mail says invited them. Defaults to \`team\`.`)
  .option(`--team <team>`, `What the mail says they were invited into. Defaults to the host of \`url\`.`)
  .option(`--url <url>`, `Where the mailed link points: a page of the rep portal, which receives \`userId\`, \`secret\` and \`expire\` on its query. It has to sit on one of the tenant's allowed link origins (this app's settings); left out, the first of them is used.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, inviter, team, url } = await promptForMissing(
          _options,
          repsInviteSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/sales-reps/reps/{id}/invite`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (inviter !== undefined) {
          _payload[`inviter`] = inviter;
        }
        if (team !== undefined) {
          _payload[`team`] = team;
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
registerPromptSpecs(salesRepsSignIn.commands.at(-1)!, repsInviteSpecs, { method: "post" });
