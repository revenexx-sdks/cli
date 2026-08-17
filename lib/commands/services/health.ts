import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
} from "../../parser.js";

export const health = new Command("health")
  .description(
    commandDescriptions["health"] ??
      `Gateway liveness and readiness probes. Public: no credential, no tenant.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

health
  .command(`live`)
  .description(`Answers as long as the process is running. Never touches a dependency, so it stays 200 while the gateway is degraded — use readiness to decide whether to send traffic.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/health/live`;
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
health
  .command(`ready`)
  .description(`Answers 200 once the gateway's registry source is reachable, 503 until then.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/health/ready`;
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
