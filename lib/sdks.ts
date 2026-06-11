import { globalConfig, localConfig } from "./config.js";
import { loadProjectConfig, resolveTenant } from "./project-config.js";
import { cliConfig } from "./parser.js";
import Client from "./client.js";
import os from "os";
import {
  DEFAULT_ENDPOINT,
  EXECUTABLE_NAME,
  SDK_TITLE,
  SDK_VERSION,
} from "./constants.js";

export const sdkForProject = async (): Promise<Client> => {
  const client = new Client();

  const projectFile = loadProjectConfig();

  // Resolution order (per DX-22) — same shape for endpoint, token, project:
  // --flag → REVENEXX_* env → .revenexx.yaml → local/global config → default.
  const endpoint =
    cliConfig.endpoint ||
    process.env.REVENEXX_API_URL ||
    projectFile.apiUrl ||
    localConfig.getEndpoint() ||
    globalConfig.getEndpoint() ||
    DEFAULT_ENDPOINT;

  // resolveTenant() covers ~/.revenexx/tenant (`tenants use`), then
  // REVENEXX_TENANT, then .revenexx.yaml — keeping this in sync with the
  // x-revenexx-tenant header below.
  const project =
    cliConfig.tenant ||
    resolveTenant() ||
    process.env.REVENEXX_PROJECT ||
    projectFile.projectId ||
    localConfig.getProject().projectId ||
    globalConfig.getProject() ||
    "";

  const key =
    cliConfig.token ||
    process.env.REVENEXX_API_KEY ||
    projectFile.token ||
    globalConfig.getKey() ||
    "";
  const selfSigned = globalConfig.getSelfSigned();

  if (!project) {
    throw new Error(
      `Project is not set. Please run \`${EXECUTABLE_NAME} login\` or pass --tenant to scope the request.`,
    );
  }

  client.headers = {
    ...client.headers,
    "x-sdk-name": "Command Line",
    "x-sdk-platform": "console",
    "x-sdk-language": "cli",
    "x-sdk-version": SDK_VERSION,
    "user-agent": `${SDK_TITLE}CLI/${SDK_VERSION} (${os.type()} ${os.version()}; ${os.arch()})`,
    // The API gateway scopes every request to a tenant.
    "x-revenexx-tenant": resolveTenant(project),
  };

  client
    .setEndpoint(endpoint)
    .setProject(project)
    .setSelfSigned(selfSigned)
    .setLocale("en-US");

  if (key) {
    // setKey targets the legacy header; the gateway reads x-revenexx-api-key.
    client.headers["x-revenexx-api-key"] = key;
    return client.setKey(key).setMode("default");
  }

  throw new Error(
    `Session not found. Please run \`${EXECUTABLE_NAME} login\` to create a session.`,
  );
};
