import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "ink-testing-library";
import { App } from "../lib/tui/app.js";
import type { TuiContext } from "../lib/tui/context.js";
import type { TuiRunner } from "../lib/tui/executor.js";
import { specsFor } from "../lib/commands/tui.js";
import { tenants } from "../lib/commands/tenants.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 80));
const ENTER = "\r";
const ARROW_DOWN = "\u001b[B";

const tenantsContext = (): TuiContext => ({
  version: "1.2.3",
  user: "dev@example.com",
  tenant: "acme",
  host: "api.example.com",
  production: false,
  commands: [
    {
      name: "tenants",
      description: "Manage tenants",
      specs: specsFor(tenants),
      subcommands: tenants.commands.map((sub) => ({
        name: sub.name(),
        description: sub.description().split("\n")[0] ?? "",
        specs: specsFor(sub),
      })),
    },
  ],
});

describe("tenants use in the TUI (DX-460)", () => {
  beforeEach(() => {
    process.env.REVENEXX_TENANT = "acme";
  });
  afterEach(() => {
    delete process.env.REVENEXX_TENANT;
  });

  it("stops at a form with the tenants to choose from instead of running", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: null,
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={tenantsContext()} runner={runner} />,
    );
    await tick();
    stdin.write(ENTER); // drill into tenants
    await tick();
    // the actions are `list`, `use`, `current`; walk to `use`
    for (let i = 0; i < 6 && !(lastFrame() ?? "").includes("tenants · use"); i++) {
      stdin.write(ARROW_DOWN);
      await tick();
      stdin.write(ENTER);
      await tick();
    }
    const frame = lastFrame() ?? "";
    expect(frame).toContain("tenants · use");
    // the slug is a required choice field (the list comes from the account's
    // SSO memberships, else the configured slugs), so the TUI stops here
    expect(frame).toContain("slug *");
    expect(frame).toMatch(/○ \S+/);
    expect(runner).not.toHaveBeenCalledWith(["tenants", "use"], expect.anything());
  });
});
