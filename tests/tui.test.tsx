import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render } from "ink-testing-library";
import { Command } from "commander";
import { App } from "../lib/tui/app.js";
import type { TuiContext } from "../lib/tui/context.js";
import {
  flattenTree,
  filterEntries,
  listResource,
  owningList,
  crudCandidates,
} from "../lib/tui/command-tree.js";
import {
  Form,
  buildArgv,
  buildCommandLine,
  orderSpecs,
  validateField,
  type FormValues,
} from "../lib/tui/form.js";
import { createRunner, type ExecutionResult, type TuiRunner } from "../lib/tui/executor.js";
import { fitColumns } from "../lib/tui/results.js";
import { applyTheme } from "../lib/tui/theme.js";
import {
  registerPromptSpecs,
  getPromptSpecs,
  getCommandMeta,
  type PromptSpec,
} from "../lib/interactive.js";
import { actionRunner } from "../lib/parser.js";
import { specsFor } from "../lib/commands/tui.js";

vi.mock("../lib/tui/clipboard.js", () => ({
  copyToClipboard: vi.fn(async () => true),
}));
import { copyToClipboard } from "../lib/tui/clipboard.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));

const ARROW_DOWN = "[B";
const ESC = "";
const ENTER = "\r";
const CTRL_R = "\x12"; // run the form from any field
const ARROW_RIGHT = `${ESC}[C`;
const ARROW_LEFT = `${ESC}[D`;

const makeContext = (overrides: Partial<TuiContext> = {}): TuiContext => ({
  version: "1.2.3",
  user: "dev@example.com",
  tenant: "acme-staging",
  host: "api.staging.example.com",
  production: false,
  commands: [
    { name: "login", description: "Sign in", subcommands: [] },
    {
      name: "products",
      description: "Manage products",
      subcommands: [
        {
          name: "list-products",
          description: "List all products",
          specs: [
            {
              key: "limit",
              option: "--limit <limit>",
              name: "limit",
              description: "Page size",
              type: "integer",
              required: false,
            },
          ],
        },
        {
          name: "get-product",
          description: "Get one product",
          specs: [
            {
              key: "productId",
              option: "--product-id <product-id>",
              name: "product_id",
              description: "Identifier of the product",
              type: "string",
              required: true,
            },
          ],
        },
        {
          name: "delete-product",
          description: "Delete one product",
          destructive: true,
          specs: [
            {
              key: "productId",
              option: "--product-id <product-id>",
              name: "product_id",
              type: "string",
              required: true,
            },
          ],
        },
        {
          name: "purge",
          description: "Remove all products",
          destructive: true,
          specs: [],
        },
        {
          name: "fetch",
          description: "Fetch one product",
          method: "get",
          specs: [
            {
              key: "productId",
              option: "--product-id <product-id>",
              name: "product_id",
              type: "string",
              required: true,
              resource: { listPath: "/products", hasLimit: true },
            },
          ],
        },
      ],
    },
    { name: "tenants", description: "Scope a tenant", subcommands: [] },
  ],
  ...overrides,
});

describe("command tree helpers", () => {
  it("maps list commands to their resource across naming shapes", () => {
    expect(listResource("list")).toBe("");
    expect(listResource("asset-families-list")).toBe("asset-families");
    expect(listResource("list-deployments")).toBe("deployments");
    expect(listResource("asset-index")).toBe("asset");
    expect(listResource("batch")).toBeUndefined();
    expect(listResource("restore")).toBeUndefined();
  });

  it("folds CRUD commands into their owning list, plural- and rails-aware", () => {
    const lists = new Set([
      "list",
      "categories-list",
      "list-deployments",
      "asset-index",
      "list-usage",
    ]);
    expect(owningList("create", lists)).toBe("list");
    expect(owningList("categories-get", lists)).toBe("categories-list");
    expect(owningList("get-deployment", lists)).toBe("list-deployments");
    expect(owningList("get-usage", lists)).toBe("list-usage");
    expect(owningList("asset-show", lists)).toBe("asset-index");
    expect(owningList("asset-destroy", lists)).toBe("asset-index");
    expect(owningList("asset-store", lists)).toBe("asset-index");
    // not CRUD / no matching list → visible
    expect(owningList("asset-restore", lists)).toBeNull();
    expect(owningList("get-marketplace-status", lists)).toBeNull();
    expect(owningList("create-vcs-deployment", lists)).toBeNull();
  });

  it("resolves CRUD candidates from a list command", () => {
    expect(crudCandidates("list", "create")).toEqual(["create", "store"]);
    expect(crudCandidates("categories-list", "update")).toEqual([
      "categories-update",
    ]);
    expect(crudCandidates("list-deployments", "delete")).toEqual([
      "delete-deployment",
      "delete-deployments",
    ]);
    expect(crudCandidates("asset-index", "delete")).toEqual([
      "asset-delete",
      "asset-destroy",
    ]);
  });

  it("flattens groups into runnable paths", () => {
    const entries = flattenTree(makeContext().commands);
    expect(entries.map((entry) => entry.path)).toEqual([
      "login",
      "products",
      "products list-products",
      "products get-product",
      "products delete-product",
      "products purge",
      "products fetch",
      "tenants",
    ]);
  });

  it("filters by substring and ranks prefix matches first", () => {
    const entries = flattenTree(makeContext().commands);
    const filtered = filterEntries(entries, "pro");
    // prefix matches lead, tightest (least unmatched) first — the group
    // entry itself is the tightest match for a bare service query
    expect(filtered[0]?.path).toBe("products");
    expect(filtered).toHaveLength(6);
    expect(filtered.map((entry) => entry.path)).not.toContain("login");
    // substring (non-prefix) matches still included
    expect(filterEntries(entries, "get").map((entry) => entry.path)).toEqual([
      "products get-product",
    ]);
    expect(filterEntries(entries, "")).toHaveLength(entries.length);
  });

  it("matches multi-token queries in order", () => {
    const entries = flattenTree(makeContext().commands);
    expect(filterEntries(entries, "pro get").map((entry) => entry.path)).toEqual([
      "products get-product",
    ]);
    // tokens must match left to right
    expect(filterEntries(entries, "product tenants")).toHaveLength(0);
  });

  it("matches through built-in service and verb aliases", () => {
    const entries = flattenTree(makeContext().commands);
    // p → products (service alias), ls → list (verb alias)
    expect(filterEntries(entries, "p ls").map((entry) => entry.path)).toEqual([
      "products list-products",
    ]);
    // "g" expands to "get" but also substring-matches pur"g"e, which is
    // the tighter (shorter) match
    expect(filterEntries(entries, "p g").map((entry) => entry.path)).toEqual([
      "products purge",
      "products get-product",
    ]);
    expect(filterEntries(entries, "p del").map((entry) => entry.path)).toEqual([
      "products delete-product",
    ]);
  });
});

const specFixtures: PromptSpec[] = [
  {
    key: "note",
    option: "--note <note>",
    name: "note",
    type: "string",
    required: false,
  },
  {
    key: "name",
    option: "--name <name>",
    name: "name",
    description: "Product name",
    type: "string",
    required: true,
  },
  {
    key: "status",
    option: "--status <status>",
    name: "status",
    type: "string",
    required: false,
    enum: ["draft", "active"],
  },
  {
    key: "apiKey",
    option: "--api-key <api-key>",
    name: "api_key",
    type: "string",
    required: false,
    secret: true,
  },
];

describe("prompt spec registry", () => {
  it("returns registered specs and defaults to empty", () => {
    const command = {};
    expect(getPromptSpecs(command)).toEqual([]);
    expect(getCommandMeta(command)).toEqual({});
    registerPromptSpecs(command, specFixtures, {
      method: "delete",
      destructive: true,
    });
    expect(getPromptSpecs(command)).toHaveLength(4);
    expect(getCommandMeta(command).destructive).toBe(true);
    expect(getCommandMeta(command).method).toBe("delete");
  });
});

describe("specsFor (positional + plugin option synthesis)", () => {
  it("captures positional args and commander options for a plugin command", () => {
    const cmd = new Command("add")
      .argument("<repo>", "the repo")
      .argument("[name]", "optional name")
      .option("--agent <agent>", "target agent")
      .requiredOption("--token <token>", "auth token")
      .option("-y, --yes", "skip prompts")
      .option("--tags [tags...]", "tags");
    const specs = specsFor(cmd);
    // positionals first, in declared order
    expect(specs.slice(0, 2).map((s) => [s.name, s.required, s.positional])).toEqual([
      ["repo", true, true],
      ["name", false, true],
    ]);
    const byName = Object.fromEntries(specs.map((s) => [s.name, s]));
    expect(byName["agent"].type).toBe("string");
    expect(byName["token"].required).toBe(true); // requiredOption → required
    expect(byName["token"].secret).toBe(true); // name matches secret pattern
    expect(byName["yes"].type).toBe("boolean");
    expect(byName["tags"].type).toBe("array");
    // no --help field
    expect(specs.some((s) => s.name === "help")).toBe(false);
  });
});

describe("executor", () => {
  const makeProgram = (): Command => {
    const program = new Command();
    program.exitOverride();
    program
      .command("ok")
      .action(() => {
        process.stdout.write(`${JSON.stringify({ items: [{ id: "a1" }] })}\n`);
      });
    program
      .command("boom")
      .action(
        actionRunner(async () => {
          throw new Error("kaput");
        }),
      );
    return program;
  };

  it("captures parsed JSON output without touching the real streams", async () => {
    const run = createRunner(makeProgram());
    const result = await run(["ok"]);
    expect(result.ok).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.data).toEqual({ items: [{ id: "a1" }] });
  });

  it("maps failures to the structured JSON error payload", async () => {
    const run = createRunner(makeProgram());
    const result = await run(["boom"]);
    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.error?.message).toBe("kaput");
  });
});

describe("form helpers", () => {
  it("orders required fields first, keeping relative order", () => {
    expect(orderSpecs(specFixtures).map((spec) => spec.key)).toEqual([
      "name",
      "note",
      "status",
      "apiKey",
    ]);
  });

  it("validates required, integer and JSON fields", () => {
    const required = specFixtures[1];
    expect(validateField(required, "")).toBe("required");
    expect(validateField(required, "Bike")).toBeNull();
    expect(validateField(specFixtures[0], "")).toBeNull();
    const integer: PromptSpec = {
      key: "limit",
      option: "--limit <limit>",
      name: "limit",
      type: "integer",
      required: false,
    };
    expect(validateField(integer, "abc")).toBe("not a number");
    expect(validateField(integer, "25")).toBeNull();
    expect(validateField(integer, "12.5")).toBe("not a number");
    const number: PromptSpec = {
      key: "price",
      option: "--price <price>",
      name: "price",
      type: "number",
      required: false,
    };
    expect(validateField(number, "12.5")).toBeNull();
    expect(validateField(number, "-0.5")).toBeNull();
    expect(validateField(number, "abc")).toBe("not a number");
    const json: PromptSpec = {
      key: "data",
      option: "--data <data>",
      name: "data",
      type: "object",
      required: false,
    };
    expect(validateField(json, "{nope")).toBe("not valid JSON");
    expect(validateField(json, '{"a":1}')).toBeNull();
  });

  it("emits positional arguments before options, in declared order", () => {
    const specs: PromptSpec[] = [
      {
        key: "_arg0",
        option: "<repo>",
        name: "repo",
        type: "string",
        required: true,
        positional: true,
      },
      {
        key: "_arg1",
        option: "<name>",
        name: "name",
        type: "string",
        required: true,
        positional: true,
      },
      {
        key: "agent",
        option: "--agent <agent>",
        name: "agent",
        type: "string",
        required: false,
      },
    ];
    // orderSpecs keeps positionals first, in declared order
    expect(orderSpecs(specs).map((s) => s.key)).toEqual([
      "_arg0",
      "_arg1",
      "agent",
    ]);
    const argv = buildArgv(["skills", "add"], specs, {
      _arg0: "revenexx/skills",
      _arg1: "my-skill",
      agent: "claude",
    });
    expect(argv).toEqual([
      "skills",
      "add",
      "revenexx/skills",
      "my-skill",
      "--agent",
      "claude",
    ]);
  });

  it("builds the one-shot command line with quoting, booleans and arrays", () => {
    const specs: PromptSpec[] = [
      ...specFixtures,
      {
        key: "force",
        option: "--force",
        name: "force",
        type: "boolean",
        required: false,
      },
      {
        key: "tags",
        option: "--tags [tags...]",
        name: "tags",
        type: "array",
        required: false,
      },
    ];
    const line = buildCommandLine(["products", "create"], specs, {
      name: "Blue Bike",
      status: "active",
      force: "true",
      tags: "a, b",
    });
    expect(line).toBe(
      "revenexx products create --name 'Blue Bike' --status active --force --tags a b",
    );
  });
});

const FormHarness = ({
  specs,
  onSubmit = () => {},
  loadResourceRecords,
}: {
  specs: PromptSpec[];
  onSubmit?: (values: FormValues) => void;
  loadResourceRecords?: (
    spec: PromptSpec,
    query?: string,
  ) => Promise<{ row: Record<string, unknown>; value: string }[]>;
}) => {
  const [values, setValues] = useState<FormValues>({});
  return (
    <Form
      path={["products", "create"]}
      specs={specs}
      values={values}
      onChange={setValues}
      onSubmit={() => onSubmit(values)}
      onClose={() => {}}
      width={60}
      loadResourceRecords={loadResourceRecords}
    />
  );
};

describe("fitColumns", () => {
  const rows = [
    {
      id: "941e5541-d92d-41f9-836a-3b95b8e8f437",
      sku: "1000040427",
      kind: "simple",
      enabled: true,
      created_at: "2026-01-01T00:00:00Z",
    },
  ];

  it("keeps leading columns while they fit and reports the hidden rest", () => {
    const wide = fitColumns(rows, 120);
    expect(wide.columns).toEqual(["sku", "id", "kind", "enabled", "created_at"]);
    expect(wide.hidden).toEqual([]);
    // widths are content-natural: sku (pinned) is as wide as its value
    expect(wide.widths[0]).toBe(10);

    // the wide uuid leaves room for only the pinned sku beside it
    const tight = fitColumns(rows, 55);
    expect(tight.columns).toEqual(["sku", "id"]);
    expect(tight.hidden).toEqual(["kind", "enabled", "created_at"]);
  });

  it("always keeps at least one column, clamped to the budget", () => {
    const tiny = fitColumns(rows, 10);
    expect(tiny.columns).toEqual(["sku"]);
    expect(tiny.widths[0]).toBeLessThanOrEqual(8);
  });

  it("scrolls the column window while pinning the identifier", () => {
    const scrolled = fitColumns(rows, 55, 1);
    // id scrolled off to the left; sku stays pinned
    expect(scrolled.columns[0]).toBe("sku");
    expect(scrolled.columns).not.toContain("id");
    expect(scrolled.hiddenLeft).toEqual(["id"]);
    // offset clamps to the scrollable range
    expect(fitColumns(rows, 55, 99).hiddenLeft).toHaveLength(3);
  });
});

describe("tui form", () => {
  it("renders fields with markers, cycles enums and masks secrets", async () => {
    const { lastFrame, stdin } = render(<FormHarness specs={specFixtures} />);
    await tick();
    const frame = lastFrame() ?? "";
    expect(frame).toContain("products · create");
    expect(frame).toContain("name");
    expect(frame).toContain("*");
    // enum renders as an unselected radio row until a value is chosen
    expect(frame).toContain("○ draft");
    expect(frame).not.toContain("◉");

    // type into the focused required field
    stdin.write("Bike");
    await tick();
    expect(lastFrame()).toContain("Bike");

    // move to enum field and cycle it
    stdin.write(ARROW_DOWN);
    stdin.write(ARROW_DOWN);
    await tick();
    stdin.write(" ");
    await tick();
    expect(lastFrame()).toContain("◉ draft");

    // secret field masks typed characters
    stdin.write(ARROW_DOWN);
    await tick();
    stdin.write("hunter2");
    await tick();
    expect(lastFrame()).not.toContain("hunter2");
    expect(lastFrame()).toContain("*******");

    // the live one-shot preview reflects entered values
    // the preview line truncates to the pane width, so match its head
    expect(lastFrame()).toContain("revenexx products create --name");
  });

  it("searches a resource-ID field via its list endpoint and picks a value", async () => {
    const resourceSpec: PromptSpec = {
      key: "productId",
      option: "--product-id <product-id>",
      name: "product_id",
      type: "string",
      required: true,
      resource: { listPath: "/products", hasLimit: true },
    };
    const loader = vi.fn(async () => [
      { row: { id: "p-1", name: "Blue Bike" }, value: "p-1" },
      { row: { id: "p-2", name: "Red Kite" }, value: "p-2" },
    ]);
    const onSubmit = vi.fn();
    const { lastFrame, stdin } = render(
      <FormHarness
        specs={[resourceSpec]}
        onSubmit={onSubmit}
        loadResourceRecords={loader}
      />,
    );
    await tick();
    expect(lastFrame()).toContain("enter: search");

    stdin.write("\r"); // empty resource field → opens the picker
    await tick();
    expect(loader).toHaveBeenCalledWith(resourceSpec, "");
    expect(lastFrame()).toContain("Search product_id");
    expect(lastFrame()).toContain("Blue Bike");

    stdin.write("kite"); // filter down to the second candidate
    await tick();
    expect(lastFrame()).not.toContain("Blue Bike");

    stdin.write("\r"); // pick it
    await tick();
    expect(lastFrame()).not.toContain("Search product_id");
    expect(lastFrame()).toContain("p-2");

    stdin.write(CTRL_R); // run the form
    await tick();
    expect(onSubmit).toHaveBeenCalledWith({ productId: "p-2" });
  });

  it("falls back to manual input when the resource listing is empty", async () => {
    const resourceSpec: PromptSpec = {
      key: "productId",
      option: "--product-id <product-id>",
      name: "product_id",
      type: "string",
      required: true,
      resource: { listPath: "/products", hasLimit: false },
    };
    const { lastFrame, stdin } = render(
      <FormHarness specs={[resourceSpec]} loadResourceRecords={async () => []} />,
    );
    await tick();

    stdin.write("\r");
    await tick();
    expect(lastFrame()).toContain("no candidates — esc to type the value manually");

    stdin.write(ESC);
    await tick();
    stdin.write("manual-id");
    await tick();
    expect(lastFrame()).toContain("manual-id");
  });

  it("uses the typed query verbatim when nothing matches", async () => {
    const resourceSpec: PromptSpec = {
      key: "productId",
      option: "--product-id <product-id>",
      name: "product_id",
      type: "string",
      required: true,
      resource: { listPath: "/products", hasLimit: true },
    };
    const { lastFrame, stdin } = render(
      <FormHarness
        specs={[resourceSpec]}
        loadResourceRecords={async () => [
          { row: { id: "p-1", name: "Blue Bike" }, value: "p-1" },
        ]}
      />,
    );
    await tick();

    stdin.write("\r"); // open the picker
    await tick();
    stdin.write("known-but-unlisted-id");
    await tick();
    expect(lastFrame()).toContain("no match — enter uses what you typed");

    stdin.write("\r");
    await tick();
    expect(lastFrame()).not.toContain("Search product_id");
    expect(lastFrame()).toContain("known-but-unlisted-id");
  });

  it("re-queries the gateway while typing when the endpoint supports search", async () => {
    const resourceSpec: PromptSpec = {
      key: "appId",
      option: "--app-id <app-id>",
      name: "app_id",
      type: "string",
      required: true,
      resource: { listPath: "/apps", hasLimit: true, search: true },
    };
    const loader = vi.fn(async (_spec: PromptSpec, query = "") =>
      query === ""
        ? [{ row: { id: "a-1", name: "First App" }, value: "a-1" }]
        : [{ row: { id: "a-42", name: "Billing" }, value: "a-42" }],
    );
    const { lastFrame, stdin } = render(
      <FormHarness specs={[resourceSpec]} loadResourceRecords={loader} />,
    );
    await tick();

    stdin.write("\r"); // open the picker → initial unfiltered load
    await tick();
    expect(loader).toHaveBeenCalledWith(resourceSpec, "");
    expect(lastFrame()).toContain("First App");

    stdin.write("bill");
    // wait out the debounce plus the fake fetch
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(loader).toHaveBeenCalledWith(resourceSpec, "bill");
    expect(lastFrame()).toContain("Billing");
    expect(lastFrame()).not.toContain("First App");

    stdin.write("\r"); // pick the server-side match
    await tick();
    expect(lastFrame()).toContain("a-42");
  });

  it("opens a searchable picker for a large enum and picks a value", async () => {
    const bigEnum: PromptSpec = {
      key: "runtime",
      option: "--runtime <runtime>",
      name: "runtime",
      type: "string",
      required: true,
      enum: [
        "node-18",
        "node-20",
        "python-3.11",
        "go-1.24",
        "bun-1.2",
        "dart-3.5",
        "swift-6.2",
      ],
    };
    const onSubmit = vi.fn();
    const { lastFrame, stdin } = render(
      <FormHarness specs={[bigEnum]} onSubmit={onSubmit} />,
    );
    await tick();
    // A large enum points at the picker rather than the ←/→ cycle.
    expect(lastFrame()).toContain("enter: choose");

    stdin.write("\r"); // open the picker
    await tick();
    expect(lastFrame()).toContain("Choose runtime");

    stdin.write("python"); // filter server-list style
    await tick();
    expect(lastFrame()).toContain("python-3.11");
    expect(lastFrame()).not.toContain("swift-6.2");

    stdin.write("\r"); // pick the highlighted value
    await tick();
    expect(lastFrame()).not.toContain("Choose runtime");

    stdin.write("\x12"); // ^r runs the form
    await tick();
    expect(onSubmit).toHaveBeenCalledWith({ runtime: "python-3.11" });
  });

  it("shows a field's schema default as a placeholder", async () => {
    const withDefault: PromptSpec = {
      key: "limit",
      option: "--limit <limit>",
      name: "limit",
      type: "integer",
      required: false,
      default: "50",
    };
    const { lastFrame } = render(<FormHarness specs={[withDefault]} />);
    await tick();
    expect(lastFrame()).toContain("default: 50");
  });

  it("blocks submit on validation errors, then submits values", async () => {
    const onSubmit = vi.fn();
    const { lastFrame, stdin } = render(
      <FormHarness specs={[specFixtures[1]]} onSubmit={onSubmit} />,
    );
    await tick();

    stdin.write(CTRL_R); // submit empty required field
    await tick();
    expect(lastFrame()).toContain("required");
    expect(onSubmit).not.toHaveBeenCalled();

    stdin.write("Bike");
    await tick();
    stdin.write(CTRL_R);
    await tick();
    expect(onSubmit).toHaveBeenCalledWith({ name: "Bike" });
  });

  it("submits via the focusable Submit button, never Enter on a field", async () => {
    const onSubmit = vi.fn();
    const { lastFrame, stdin } = render(
      <FormHarness specs={[specFixtures[1]]} onSubmit={onSubmit} />,
    );
    await tick();
    expect(lastFrame()).toContain("Submit");
    expect(lastFrame()).toContain("Cancel");

    stdin.write("Bike");
    await tick();
    // Enter on the field advances toward Submit — it must not run the form.
    stdin.write(ENTER);
    await tick();
    expect(onSubmit).not.toHaveBeenCalled();

    // Focus now rests on the Submit button; Enter there runs it.
    stdin.write(ENTER);
    await tick();
    expect(onSubmit).toHaveBeenCalledWith({ name: "Bike" });
  });

  it("edits an object field in the JSON editor and saves it back", async () => {
    const objectSpec: PromptSpec = {
      key: "data",
      option: "--data <data>",
      name: "data",
      type: "object",
      required: true,
    };
    const onSubmit = vi.fn();
    const { lastFrame, stdin } = render(
      <FormHarness specs={[objectSpec]} onSubmit={onSubmit} />,
    );
    await tick();
    // The field points at the editor rather than a raw JSON line.
    expect(lastFrame()).toContain("{ } enter: edit");

    stdin.write("\r"); // open the editor
    await tick();
    expect(lastFrame()).toContain("Edit data");
    expect(lastFrame()).toContain("no fields yet");

    stdin.write("\r"); // add the first field, cursor on its key
    await tick();
    stdin.write("name");
    await tick();
    stdin.write("\t"); // switch to the value cell
    await tick();
    stdin.write('"Bike"'); // values are entered as JSON
    await tick();
    // Live validity shows the compact object it will produce.
    expect(lastFrame()).toContain('{"name":"Bike"}');

    stdin.write("\x13"); // ^s saves back into the field
    await tick();
    expect(lastFrame()).not.toContain("Edit data");
    expect(lastFrame()).toContain("{ 1 field }");

    // Enter on an object field re-opens the editor, so running is ^r.
    stdin.write("\x12"); // ^r submits the form
    await tick();
    expect(onSubmit).toHaveBeenCalledWith({ data: '{"name":"Bike"}' });
  });

  it("deletes an object field with ^d and blocks save while invalid", async () => {
    const objectSpec: PromptSpec = {
      key: "data",
      option: "--data <data>",
      name: "data",
      type: "object",
      required: true,
    };
    const { lastFrame, stdin } = render(
      <FormHarness specs={[objectSpec]} />,
    );
    await tick();
    stdin.write("\r"); // open editor
    await tick();
    stdin.write("\r"); // add a field
    await tick();
    // An empty key is invalid, so the footer reports it and ^s is a no-op.
    expect(lastFrame()).toContain("empty key");
    stdin.write("\x13");
    await tick();
    expect(lastFrame()).toContain("Edit data"); // still open

    stdin.write("\x04"); // ^d removes the field
    await tick();
    expect(lastFrame()).toContain("no fields yet");
  });

  it("drills into a nested object and folds it back on save", async () => {
    const objectSpec: PromptSpec = {
      key: "data",
      option: "--data <data>",
      name: "data",
      type: "object",
      required: true,
    };
    const onSubmit = vi.fn();
    const { lastFrame, stdin } = render(
      <FormHarness specs={[objectSpec]} onSubmit={onSubmit} />,
    );
    await tick();
    stdin.write("\r"); // open editor
    await tick();
    stdin.write("\r"); // add field
    await tick();
    stdin.write("meta");
    await tick();
    stdin.write("\t"); // value cell
    await tick();
    stdin.write("{}"); // an empty nested object
    await tick();
    expect(lastFrame()).toContain("{ 0 fields }");

    stdin.write(ARROW_RIGHT); // → drills into the nested object
    await tick();
    expect(lastFrame()).toContain("Edit data › meta");

    stdin.write("\r"); // add a field in the nested scope
    await tick();
    stdin.write("a");
    await tick();
    stdin.write("\t");
    await tick();
    stdin.write("1");
    await tick();
    expect(lastFrame()).toContain('{"a":1}');

    stdin.write(ESC); // esc folds the child back into its parent
    await tick();
    expect(lastFrame()).toContain("Edit data");
    expect(lastFrame()).not.toContain("Edit data › meta");
    expect(lastFrame()).toContain("{ 1 field }");

    stdin.write("\x13"); // ^s saves the whole tree
    await tick();
    expect(lastFrame()).not.toContain("Edit data");
    stdin.write("\x12"); // ^r runs
    await tick();
    expect(onSubmit).toHaveBeenCalledWith({ data: '{"meta":{"a":1}}' });
  });
});

describe("tui app shell", () => {
  it("renders header context, commands pane and status bar", () => {
    const { lastFrame } = render(<App context={makeContext()} />);
    const frame = lastFrame() ?? "";

    expect(frame).toContain("revenexx");
    expect(frame).toContain("v1.2.3");
    expect(frame).toContain("dev@example.com");
    expect(frame).toContain("acme-staging");
    expect(frame).toContain("api.staging.example.com");
    expect(frame).not.toContain("PRODUCTION");

    expect(frame).toContain("commands");
    expect(frame).toContain("products");

    expect(frame).toContain("quit");
  });

  it("shows the welcome splash until the first keystroke", async () => {
    const { lastFrame, stdin } = render(
      <App context={makeContext()} welcome />,
    );
    await tick();
    // The header and navbar are already mounted (seamless transition), with the
    // welcome shown in the right pane.
    expect(lastFrame()).toContain("any key to begin");
    expect(lastFrame()).toContain("the interactive console");
    expect(lastFrame()).toContain("products"); // navbar present throughout

    stdin.write(" ");
    await tick();
    // Any key dismisses the splash; the header/navbar stay put.
    expect(lastFrame()).not.toContain("any key to begin");
    expect(lastFrame()).toContain("products");
  });

  it("reopens the welcome splash with ^w", async () => {
    const { lastFrame, stdin } = render(<App context={makeContext()} />);
    await tick();
    // No welcome prop → the browser is up, no splash.
    expect(lastFrame()).not.toContain("the interactive console");

    // ^w brings the splash back — the way home after startup dismissed it.
    stdin.write("\x17");
    await tick();
    expect(lastFrame()).toContain("the interactive console");
    expect(lastFrame()).toContain("products"); // navbar stays mounted

    // Any key dismisses it again, exactly as at startup.
    stdin.write(" ");
    await tick();
    expect(lastFrame()).not.toContain("the interactive console");
  });

  it("^w clears an active filter as it returns home", async () => {
    const { lastFrame, stdin } = render(<App context={makeContext()} />);
    await tick();

    stdin.write("get"); // type-to-search → filter active
    await tick();
    expect(lastFrame()).toContain("get");

    stdin.write("\x17"); // ^w → splash, filter cleared underneath
    await tick();
    expect(lastFrame()).toContain("the interactive console");

    // Dismiss: back to a clean browser, not the stale filtered list.
    stdin.write(" ");
    await tick();
    expect(lastFrame()).not.toContain("the interactive console");
    expect(lastFrame()).toContain("products");
  });

  it("shows the PRODUCTION chip only in sensitive contexts", () => {
    const { lastFrame } = render(
      <App context={makeContext({ production: true, tenant: "acme-prod" })} />,
    );
    expect(lastFrame()).toContain("PRODUCTION");
    expect(lastFrame()).toContain("acme-prod");
  });

  it("falls back to a signed-out label without an identity", () => {
    const { lastFrame } = render(<App context={makeContext({ user: null })} />);
    expect(lastFrame()).toContain("not signed in");
  });

  it("drills into a command group and back", async () => {
    const { lastFrame, stdin } = render(<App context={makeContext()} />);
    // ink attaches its stdin listener in an effect after the first render.
    await tick();

    // products is the first item now (folders section, before commands)
    await tick();
    expect(lastFrame()).toContain("enter to browse its commands");

    stdin.write(ENTER);
    await tick();
    expect(lastFrame()).toContain("commands · products");
    expect(lastFrame()).toContain("list-products");
    expect(lastFrame()).toContain("one-shot:");

    stdin.write(ESC);
    await tick();
    expect(lastFrame()).not.toContain("commands · products");
    expect(lastFrame()).toContain("Manage products");
  });

  it("shows themes and alias under a config section, alias drills in", async () => {
    // As lib/commands/tui.ts builds them: `themes` (a picker action) and the
    // relocated `alias` command are top-level entries tagged into the "config"
    // section — shown directly under its header, not behind a folder. `alias`
    // keeps its real invocation via runPath. Named "config" so it can't clash
    // with the real "settings" API service.
    const configContext = makeContext({
      commands: [
        { name: "login", description: "Sign in", subcommands: [] },
        {
          name: "themes",
          description: "Switch the TUI colour theme",
          tuiAction: "theme-picker",
          group: "config",
          subcommands: [],
        },
        {
          name: "alias",
          description: "Manage command aliases",
          group: "config",
          subcommands: [
            {
              name: "set",
              description: "Set an alias",
              runPath: ["alias", "set"],
              specs: [
                {
                  key: "name",
                  option: "<name>",
                  name: "name",
                  type: "string",
                  required: true,
                  positional: true,
                },
              ],
            },
            {
              name: "list",
              description: "List aliases",
              runPath: ["alias", "list"],
              specs: [],
            },
            {
              name: "remove",
              description: "Remove an alias",
              runPath: ["alias", "remove"],
              specs: [],
            },
          ],
        },
      ],
    });
    const { lastFrame, stdin } = render(<App context={configContext} />);
    await tick();

    // themes and alias are visible at the root, directly under the config
    // header — no drilling into a folder first.
    expect(lastFrame()).toContain("config");
    expect(lastFrame()).toContain("themes");
    expect(lastFrame()).toContain("alias");
    expect(lastFrame()).toContain("login");

    // themes is the picker action: enter opens the picker, doesn't "run".
    stdin.write(ARROW_DOWN); // login → themes
    await tick();
    expect(lastFrame()).toContain("enter to open the theme picker");
    stdin.write(ENTER);
    await tick();
    expect(lastFrame()).toContain("esc revert"); // the theme picker is up
    stdin.write(ESC);
    await tick();
    expect(lastFrame()).not.toContain("esc revert");
    expect(lastFrame()).toContain("themes"); // back at the root

    // alias drills into its actions (the browser's one second level).
    stdin.write(ARROW_DOWN); // themes → alias
    await tick();
    expect(lastFrame()).toContain("enter to browse its commands");
    stdin.write(ENTER);
    await tick();
    expect(lastFrame()).toContain("commands · alias");
    expect(lastFrame()).toContain("set");
    expect(lastFrame()).toContain("remove");
    // The one-shot uses alias's real path.
    expect(lastFrame()).toContain("alias set");

    // q backs out to the root.
    stdin.write("q");
    await tick();
    expect(lastFrame()).not.toContain("commands · alias");
    expect(lastFrame()).toContain("themes");
  });

  it("keeps the real 'settings' API service separate from the config section", async () => {
    // Regression guard: the config section is selected by the `group` tag, not
    // by name, so a same-named API service is untouched. A real `settings`
    // service stays a browsable folder; themes/alias sit in the config section.
    const bothContext = makeContext({
      commands: [
        {
          name: "settings",
          description: "Organization settings",
          subcommands: [
            { name: "get-settings", description: "Read settings", specs: [] },
          ],
        },
        { name: "login", description: "Sign in", subcommands: [] },
        {
          name: "themes",
          description: "Switch the TUI colour theme",
          tuiAction: "theme-picker",
          group: "config",
          subcommands: [],
        },
      ],
    });
    const { lastFrame, stdin } = render(<App context={bothContext} />);
    await tick();

    // Both present at the root; the settings service sits under folders, themes
    // under the config header.
    expect(lastFrame()).toContain("folders");
    expect(lastFrame()).toContain("settings");
    expect(lastFrame()).toContain("config");
    expect(lastFrame()).toContain("themes");

    // Drilling the first row (the real service) opens its command, not the
    // theme picker.
    stdin.write(ENTER);
    await tick();
    expect(lastFrame()).toContain("commands · settings");
    expect(lastFrame()).toContain("get-settings");
    expect(lastFrame()).not.toContain("esc revert");
  });

  it("surfaces themes and alias in the palette search", async () => {
    const ctx = makeContext({
      commands: [
        {
          name: "products",
          description: "Manage products",
          subcommands: [
            { name: "list-products", description: "List", specs: [] },
          ],
        },
        {
          name: "themes",
          description: "Switch the TUI colour theme",
          tuiAction: "theme-picker",
          group: "config",
          subcommands: [],
        },
        {
          name: "alias",
          description: "Manage command aliases",
          group: "config",
          subcommands: [
            { name: "set", description: "Set", runPath: ["alias", "set"], specs: [] },
            { name: "list", description: "List", runPath: ["alias", "list"], specs: [] },
            { name: "remove", description: "Remove", runPath: ["alias", "remove"], specs: [] },
          ],
        },
      ],
    });
    const { lastFrame, stdin } = render(<App context={ctx} />);
    await tick();

    // themes shows up in the palette, and picking it opens the picker (it isn't
    // run as a command).
    stdin.write("/");
    await tick();
    stdin.write("theme");
    await tick();
    expect(lastFrame()).toContain("themes");
    stdin.write(ENTER);
    await tick();
    expect(lastFrame()).toContain("esc revert");
    stdin.write(ESC);
    await tick();

    // alias and its actions are searchable too.
    stdin.write("/");
    await tick();
    stdin.write("alias");
    await tick();
    expect(lastFrame()).toContain("alias set");
  });

  it("filters in place on / and opens the pick on enter", async () => {
    const { lastFrame, stdin } = render(<App context={makeContext()} />);
    await tick();

    stdin.write("/");
    await tick();
    expect(lastFrame()).toContain("›");

    stdin.write("get");
    await tick();
    // Both panes stay on screen: the filtered list and the detail pane.
    expect(lastFrame()).toContain("› get");
    expect(lastFrame()).toContain("products get-product");
    expect(lastFrame()).toContain("Get one product");

    stdin.write(ENTER);
    await tick();
    // The pick opens right away: get-product has a parameter → its form.
    expect(lastFrame()).toContain("products · get-product");
    expect(lastFrame()).toContain("product_id");

    // esc falls back to the browser, already inside the products group.
    stdin.write(ESC);
    await tick();
    expect(lastFrame()).toContain("commands · products");
  });

  it("searches immediately when typing in the browser", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={makeContext()} runner={runner} />,
    );
    await tick();

    stdin.write("t"); // no / needed: typing filters the list in place
    await tick();
    expect(lastFrame()).toContain("› t");

    stdin.write("enants");
    await tick();
    expect(lastFrame()).toContain("› tenants");

    stdin.write(ENTER); // tenants is paramless → runs immediately
    await tick();
    expect(runner).toHaveBeenCalledWith(["tenants"], { force: false });
  });

  it("opens the generated form for a runnable command and back", async () => {
    const { lastFrame, stdin } = render(<App context={makeContext()} />);
    await tick();

    // products is the first item now (folders section, before commands)
    await tick();
    stdin.write(ENTER); // drill into products
    await tick();
    stdin.write(ARROW_DOWN); // list-products → get-product
    await tick();
    stdin.write(ENTER); // open the form
    await tick();
    expect(lastFrame()).toContain("products get-product");
    expect(lastFrame()).toContain("product_id");
    expect(lastFrame()).toContain("next → submit");

    stdin.write(ESC); // back to the browser
    await tick();
    expect(lastFrame()).toContain("commands · products");
  });

  it("toggles the hidden debug HUD by typing debug", async () => {
    const { lastFrame, stdin } = render(<App context={makeContext()} />);
    await tick();
    // The debug pane / HUD is hidden until the magic word is typed.
    expect(lastFrame()).not.toContain("recent runs");

    // One key per character, as a real keyboard delivers them (the toggle
    // fires when the accumulating filter reaches the whole word).
    const type = async (word: string): Promise<void> => {
      for (const ch of word) {
        stdin.write(ch);
        await tick();
      }
    };

    await type("debug"); // toggles debug on and clears the filter
    // The right pane becomes the debug readout and the filter is gone (no
    // lingering "› debug" search).
    expect(lastFrame()).toContain("recent runs");
    expect(lastFrame()).toContain("renders/s");
    expect(lastFrame()).not.toContain("› debug");

    await type("debug"); // typing it again hides everything
    expect(lastFrame()).not.toContain("recent runs");
  });

  it("copies the selected command's one-shot invocation with y", async () => {
    const { lastFrame, stdin } = render(<App context={makeContext()} />);
    await tick();
    stdin.write(ENTER); // drill into products
    await tick();
    // Cursor rests on the first command (list-products).
    stdin.write("y"); // copy its one-shot invocation
    await tick();
    expect(copyToClipboard).toHaveBeenCalledWith(
      "revenexx products list-products",
    );
    expect(lastFrame()).toContain("copied command");
  });

  it("restores the last-used values when a command is reopened", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { id: "w-7" },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={crudContext()} runner={runner} />,
    );
    await tick();
    stdin.write(ENTER); // drill into widgets
    await tick();
    stdin.write(ARROW_DOWN); // list → get (get has a required id)
    await tick();
    stdin.write(ENTER); // open the get form
    await tick();
    stdin.write("w-7");
    await tick();
    stdin.write(CTRL_R); // run it — records the values
    await tick();
    expect(runner).toHaveBeenCalledWith(["widgets", "get", "--id", "w-7"], {
      force: false,
    });

    stdin.write("q"); // close the results back to the browser
    await tick();
    stdin.write(ENTER); // reopen get
    await tick();
    // The id typed last time is restored instead of a blank form.
    expect(lastFrame()).toContain("w-7");
  });

  it("runs optional-only commands immediately, e refines parameters", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [{ id: "p-1" }] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={makeContext()} runner={runner} />,
    );
    await tick();

    // products is the first item now (folders section, before commands)
    await tick();
    // the sidebar lists the parameters before running
    expect(lastFrame()).toContain("enter to browse its commands");
    stdin.write(ENTER); // drill in; list-products selected
    await tick();
    expect(lastFrame()).toContain("parameters");
    expect(lastFrame()).toContain("limit");
    expect(lastFrame()).toContain("enter to run it");

    stdin.write(ENTER); // optional-only → runs right away, no form stop
    await tick();
    expect(runner).toHaveBeenCalledWith(["products", "list-products"], {
      force: false,
    });

    stdin.write("e"); // refine parameters from the results
    await tick();
    expect(lastFrame()).toContain("products · list-products");
    stdin.write("5"); // limit = 5
    await tick();
    stdin.write(CTRL_R); // re-run through the form
    await tick();
    expect(runner).toHaveBeenLastCalledWith(
      ["products", "list-products", "--limit", "5"],
      { force: false },
    );

    stdin.write(ESC); // esc closes the command screen → browser
    await tick();
    expect(lastFrame()).toContain("commands · products");
  });

  it("esc from a direct run returns to the browser, not the form", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={makeContext()} runner={runner} />,
    );
    await tick();
    stdin.write(ENTER); // drill into products (first item)
    await tick();
    stdin.write(ENTER); // direct run of list-products
    await tick();
    expect(runner).toHaveBeenCalled();

    stdin.write(ESC); // straight back to the browser
    await tick();
    expect(lastFrame()).toContain("commands · products");
    // back on the browser, not the command screen (no param sidebar)
    expect(lastFrame()).not.toContain("e edit parameters");
  });

  it("navigates into a service picked from the search", async () => {
    const { lastFrame, stdin } = render(<App context={makeContext()} />);
    await tick();

    stdin.write("produ"); // type-to-search: tightest match is the group
    await tick();
    expect(lastFrame()).toContain("enter to browse its commands");

    stdin.write(ENTER);
    await tick();
    expect(lastFrame()).toContain("commands · products");
    expect(lastFrame()).toContain("list-products");
  });

  it("scrolls table columns horizontally with arrow keys", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: {
        items: [
          {
            id: "941e5541-d92d-41f9-836a-3b95b8e8f437",
            sku: "1000040427-EXTRA-LONG",
            kind: "simple",
            family: "bolts",
            created: "2026-01-01",
          },
        ],
      },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={makeContext()} runner={runner} />,
    );
    await tick();

    // products is the first item now (folders section, before commands)
    await tick();
    stdin.write(ENTER); // drill in
    await tick();
    stdin.write(ENTER); // run list-products (sidebar → narrow table)
    await tick();

    // narrow budget: sku (pinned) + id fit, the rest is hidden to the right
    expect(lastFrame()).toContain("SKU");
    expect(lastFrame()).not.toContain("KIND");
    expect(lastFrame()).toContain("more: kind");

    stdin.write(ARROW_RIGHT); // scroll right
    await tick();
    expect(lastFrame()).toContain("KIND");
    expect(lastFrame()).not.toContain("941e5541"); // id scrolled off; sku stays pinned
    expect(lastFrame()).toContain("‹ 1"); // id hidden on the left

    stdin.write(ARROW_LEFT); // back
    await tick();
    expect(lastFrame()).toContain("941e5541");
    expect(lastFrame()).not.toContain("KIND");
  });

  it("shows the run's pagination facts in the sidebar", async () => {
    let calls = 0;
    const runner: TuiRunner = vi.fn(async () => {
      // the second (paging) call stays in flight long enough to observe
      // the loading state
      calls += 1;
      if (calls > 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      return {
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: {
        items: [{ id: "p-1" }, { id: "p-2" }],
        page: { limit: 2, offset: 4, total: 23034, returned: 2, hasMore: true },
      },
      error: null,
      stdout: "",
      stderr: "",
      };
    });
    // paging needs an offset parameter on the command
    const context = makeContext();
    context.commands[1].subcommands[0].specs?.push({
      key: "offset",
      option: "--offset <offset>",
      name: "offset",
      type: "integer",
      required: false,
    });
    const { lastFrame, stdin } = render(
      <App context={context} runner={runner} />,
    );
    await tick();

    // products is the first item now (folders section, before commands)
    await tick();
    stdin.write(ENTER); // drill in
    await tick();
    stdin.write(ENTER); // run list-products
    await tick();

    const frame = lastFrame() ?? "";
    expect(frame).toContain("2 returned of");
    expect(frame).toContain("23,034");
    expect(frame).toContain("offset 4 · limit 2 · n next");

    // paging keeps the facts mounted while the next page loads — the
    // sidebar must not reflow (jump) between pages
    stdin.write("n");
    await new Promise((resolve) => setTimeout(resolve, 60));
    const loading = lastFrame() ?? "";
    expect(loading).toContain("waiting for the gateway");
    expect(loading).toContain("23,034");
  });

  it("keeps the list layout (results + right sidebar) with the generic filter spec", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: {
        items: [{ id: "w-1", name: "Alpha" }],
        page: { limit: 50, offset: 0, total: 1, returned: 1, hasMore: false },
      },
      error: null,
      stdout: "",
      stderr: "",
    }));
    // The exact spec set the generator emits for a list command: the generic
    // --filter plus paging. All sidebar keys — must NOT flip the form into
    // the main window (which drops the right sidebar).
    const context = makeContext({
      commands: [
        {
          name: "widgets",
          description: "Manage widgets",
          subcommands: [
            {
              name: "list",
              label: "widgets",
              description: "List widgets",
              method: "get",
              specs: [
                {
                  key: "filter",
                  option: "--filter <column=value>",
                  name: "filter",
                  type: "string",
                  required: false,
                },
                {
                  key: "limit",
                  option: "--limit <limit>",
                  name: "limit",
                  type: "integer",
                  required: false,
                },
                {
                  key: "offset",
                  option: "--offset <offset>",
                  name: "offset",
                  type: "integer",
                  required: false,
                },
                {
                  key: "order",
                  option: "--order <order>",
                  name: "order",
                  type: "string",
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    });
    const { lastFrame, stdin } = render(
      <App context={context} runner={runner} />,
    );
    await tick();
    stdin.write(ENTER); // drill into widgets
    await tick();
    stdin.write(ENTER); // optional-only list → runs immediately, no form stop
    await tick();
    expect(runner).toHaveBeenCalledWith(["widgets", "list"], { force: false });
    const frame = lastFrame() ?? "";
    // results in the main pane…
    expect(frame).toContain("Alpha");
    // …with the paging/filter sidebar docked on the right
    expect(frame).toContain("1 returned of");
    expect(frame).toContain("offset");
  });

  it("cycles the output format with o", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [{ id: "p-1", name: "Bike" }] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={makeContext()} runner={runner} />,
    );
    await tick();

    // products is the first item now (folders section, before commands)
    await tick();
    stdin.write(ENTER); // drill in; list-products selected
    await tick();
    stdin.write(ENTER); // run
    await tick();
    expect(lastFrame()).toContain("o: table");

    stdin.write("o"); // → json (pretty, like -o json)
    await tick();
    expect(lastFrame()).toContain("o: json");
    expect(lastFrame()).toContain('"items": [');

    stdin.write("o"); // → jsonl (one compact record per line)
    await tick();
    expect(lastFrame()).toContain("o: jsonl");
    // Compact (no space after the colon), unlike the pretty json above — a
    // short substring so the assertion is robust to the results pane width.
    expect(lastFrame()).toContain('"id":"p-1"');

    stdin.write("o"); // → csv
    await tick();
    expect(lastFrame()).toContain("o: csv");
    expect(lastFrame()).toContain("id,name");
    expect(lastFrame()).toContain("p-1,Bike");

    stdin.write("o"); // → back to the table
    await tick();
    expect(lastFrame()).toContain("o: table");
    expect(lastFrame()).toContain("NAME"); // the table's column header is back
  });

  it("filters the loaded rows with / and clears on esc", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [{ id: "p-1", name: "Bike" }, { id: "p-2", name: "Kite" }] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={makeContext()} runner={runner} />,
    );
    await tick();
    stdin.write(ENTER); // drill into products (first item)
    await tick();
    stdin.write(ENTER); // run list
    await tick();
    expect(lastFrame()).toContain("Bike");
    expect(lastFrame()).toContain("Kite");
    // every list shows the filter bar as a standing affordance
    expect(lastFrame()).toContain("⌕ / to filter rows");

    stdin.write("/"); // open the row filter
    await tick();
    stdin.write("kite"); // narrows to the matching row
    await tick();
    expect(lastFrame()).toContain("⌕ kite");
    expect(lastFrame()).toContain("Kite");
    expect(lastFrame()).not.toContain("Bike");

    stdin.write(ESC); // clears the filter → all rows return, hint bar back
    await tick();
    expect(lastFrame()).not.toContain("⌕ kite");
    expect(lastFrame()).toContain("⌕ / to filter rows");
    expect(lastFrame()).toContain("Bike");
    expect(lastFrame()).toContain("Kite");
  });

  it("switches only the drilled-in item's output, not the whole list", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [{ id: "p-1", name: "Bike" }, { id: "p-2", name: "Kite" }] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={makeContext()} runner={runner} />,
    );
    await tick();
    // products is the first item now (folders section, before commands)
    await tick();
    stdin.write(ENTER); // drill in; list-products
    await tick();
    stdin.write(ENTER); // run
    await tick();

    stdin.write(ARROW_DOWN); // move cursor to the second row (p-2)
    await tick();
    stdin.write(ENTER); // drill into that row's detail
    await tick();
    stdin.write("o"); // switch output → json of just that item
    await tick();
    const frame = lastFrame() ?? "";
    expect(frame).toContain("item · o: json");
    expect(frame).toContain('"id": "p-2"');
    expect(frame).not.toContain("p-1"); // the other row is not shown
    expect(frame).not.toContain('"items"'); // not the whole collection

    stdin.write(ESC); // leave the item → the list's json (whole collection)
    await tick();
    expect(lastFrame()).toContain("p-1");
    expect(lastFrame()).toContain('"items"');
  });

  it("copies the output in the current format with c", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [{ id: "p-1", name: "Bike" }] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={makeContext()} runner={runner} />,
    );
    await tick();

    // products is the first item now (folders section, before commands)
    await tick();
    stdin.write(ENTER); // drill in
    await tick();
    stdin.write(ENTER); // run list-products
    await tick();

    stdin.write("y"); // table view: y copies the selected row
    await tick();
    expect(copyToClipboard).toHaveBeenCalledWith(
      JSON.stringify({ id: "p-1", name: "Bike" }, null, 2),
    );
    expect(lastFrame()).toContain("✓ copied item as json");

    stdin.write("Y"); // Y copies the whole collection
    await tick();
    expect(copyToClipboard).toHaveBeenLastCalledWith(
      JSON.stringify({ items: [{ id: "p-1", name: "Bike" }] }, null, 2),
    );
    expect(lastFrame()).toContain("✓ copied as json");

    stdin.write("o"); // → json
    await tick();
    stdin.write("o"); // → jsonl
    await tick();
    stdin.write("y"); // non-table view: y copies exactly what is shown
    await tick();
    expect(copyToClipboard).toHaveBeenLastCalledWith(
      '{"id":"p-1","name":"Bike"}',
    );
    expect(lastFrame()).toContain("✓ copied as jsonl");
  });

  it("runs a command with positional arguments", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { installed: true },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const context = makeContext({
      commands: [
        {
          name: "skills",
          description: "Manage skills",
          subcommands: [
            {
              name: "add",
              description: "Install a skill",
              specs: [
                {
                  key: "_arg0",
                  option: "<repo>",
                  name: "repo",
                  type: "string",
                  required: true,
                  positional: true,
                },
                {
                  key: "_arg1",
                  option: "<name>",
                  name: "name",
                  type: "string",
                  required: true,
                  positional: true,
                },
              ],
            },
          ],
        },
      ],
    });
    const { lastFrame, stdin } = render(
      <App context={context} runner={runner} />,
    );
    await tick();

    stdin.write(ENTER); // drill into skills
    await tick();
    stdin.write(ENTER); // open the add form
    await tick();
    expect(lastFrame()).toContain("skills · add");
    expect(lastFrame()).toContain("repo");

    stdin.write("revenexx/skills"); // first positional
    await tick();
    stdin.write(ENTER); // advance to name
    await tick();
    stdin.write("my-skill"); // second positional
    await tick();
    stdin.write(CTRL_R); // submit → run
    await tick();

    expect(runner).toHaveBeenCalledWith(
      ["skills", "add", "revenexx/skills", "my-skill"],
      { force: false },
    );
  });

  it("search → pick → run: required resource params flow without a form stop", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { id: "p-2", name: "Red Kite" },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const loader = vi.fn(async () => [
      { row: { id: "p-1", name: "Blue Bike" }, value: "p-1" },
      { row: { id: "p-2", name: "Red Kite" }, value: "p-2" },
    ]);
    const { lastFrame, stdin } = render(
      <App
        context={makeContext()}
        runner={runner}
        loadResourceRecords={loader}
      />,
    );
    await tick();

    stdin.write("fetch"); // type-to-search the GET command
    await tick();
    stdin.write(ENTER); // open it → the id search opens right away
    await tick();
    expect(lastFrame()).toContain("Search product_id");
    expect(runner).not.toHaveBeenCalled();

    stdin.write("kite"); // narrow the candidates
    await tick();
    stdin.write(ENTER); // pick → the command runs immediately
    await tick();
    expect(runner).toHaveBeenCalledWith(
      ["products", "fetch", "--product-id", "p-2"],
      { force: false },
    );
    expect(lastFrame()).toContain("Red Kite");
  });

  it("backs out of a group and out of results with q", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={makeContext()} runner={runner} />,
    );
    await tick();

    // products is the first item now (folders section, before commands)
    await tick();
    stdin.write(ENTER); // drill into the group
    await tick();
    expect(lastFrame()).toContain("commands · products");

    stdin.write("q"); // q backs out like esc
    await tick();
    expect(lastFrame()).not.toContain("commands · products");
    expect(lastFrame()).toContain("Manage products");

    stdin.write(ARROW_DOWN); // → login
    await tick();
    stdin.write(ARROW_DOWN); // → tenants
    await tick();
    stdin.write(ENTER); // paramless → runs directly
    await tick();
    expect(runner).toHaveBeenCalled();

    stdin.write("q"); // q leaves the results view too
    await tick();
    expect(lastFrame()).toContain("Scope a tenant");
  });

  it("confirms before quitting via q, esc, and the typed word", async () => {
    const { lastFrame, stdin } = render(<App context={makeContext()} />);
    await tick();
    expect(lastFrame()).not.toContain("Really quit");

    // q at the top level opens the confirmation instead of leaving.
    stdin.write("q");
    await tick();
    expect(lastFrame()).toContain("Really quit");

    // Any non-yes key stays in the session (cautious default) — and lands back
    // on the welcome splash, the one way to bring it back after startup.
    stdin.write("n");
    await tick();
    expect(lastFrame()).not.toContain("Really quit");
    expect(lastFrame()).toContain("the interactive console");

    // A key dismisses the splash again, exactly as at startup.
    stdin.write(" ");
    await tick();
    expect(lastFrame()).not.toContain("the interactive console");

    // esc at the top level also asks first.
    stdin.write(ESC);
    await tick();
    expect(lastFrame()).toContain("Really quit");
    stdin.write(ESC); // esc inside the confirm just stays
    await tick();
    expect(lastFrame()).not.toContain("Really quit");
    // …and back on the welcome splash again.
    expect(lastFrame()).toContain("the interactive console");
    stdin.write(" "); // dismiss it before the typed-"exit" check below
    await tick();

    // Typing "exit" (one key per char) routes through the same gate.
    for (const ch of "exit") {
      stdin.write(ch);
      await tick();
    }
    expect(lastFrame()).toContain("Really quit");
    // …and it didn't linger as a filter search.
    expect(lastFrame()).not.toContain("› exit");
  });

  it("scopes the search to the open service", async () => {
    const { lastFrame, stdin } = render(<App context={makeContext()} />);
    await tick();

    // products is the first item now (folders section, before commands)
    await tick();
    stdin.write(ENTER); // drill into products
    await tick();

    stdin.write("get"); // type-to-search, scoped
    await tick();
    const frame = lastFrame() ?? "";
    expect(frame).toContain("products › get");
    // scoped entries show short names and exclude other services
    expect(frame).toContain("get-product");
    expect(frame).not.toContain("tenants");
    // the one-shot line still carries the full invocation
    expect(frame).toContain("one-shot: revenexx products get-product");

    stdin.write(ENTER); // open the scoped match → its form
    await tick();
    expect(lastFrame()).toContain("products · get-product");
    expect(lastFrame()).toContain("product_id");
  });

  it("survives repeated type-and-delete cycles without duplicating", async () => {
    const { lastFrame, stdin } = render(<App context={makeContext()} />);
    await tick();

    for (let round = 0; round < 3; round += 1) {
      stdin.write("list");
      await tick();
      expect(lastFrame()).toContain("› list");

      // Deleting the last character exits filter mode — the intermediate
      // empty query must never dump the full flattened tree.
      for (let key = 0; key < 4; key += 1) {
        stdin.write("\u007F");
        await tick();
      }
      const frame = lastFrame() ?? "";
      // The filter's block cursor (▌) is only in the filter title, so its
      // absence means filter mode was exited (› is now a row marker).
      expect(frame).not.toContain("▌");
      expect(frame).toContain("commands");
      // No flattened dump: the root browse never lists a service's own
      // subcommands (the bug would splash "list-products" etc. into the list).
      expect(frame).not.toContain("list-products");
    }

    // Navigation still works after the cycles (products is the first item).
    stdin.write(ENTER);
    await tick();
    expect(lastFrame()).toContain("commands · products");
  });

  it("global search shows full paths, not resource labels (no doubles)", async () => {
    const context = makeContext({
      commands: [
        {
          name: "gadgets",
          description: "Manage gadgets",
          subcommands: [
            {
              name: "list",
              label: "gadgets",
              description: "List gadgets",
              method: "get",
              specs: [],
            },
            {
              name: "parts-list",
              label: "parts",
              description: "List parts",
              method: "get",
              specs: [],
            },
          ],
        },
      ],
    });
    const { lastFrame, stdin } = render(<App context={context} />);
    await tick();

    stdin.write("gadgets");
    await tick();
    const frame = lastFrame() ?? "";
    // the group row merged with its own-records list: exactly one "gadgets"
    // row, no separate "gadgets list" row (the one-shot line may say it)
    expect(frame).not.toContain("  gadgets list");
    // other collections show the resource-labelled path
    expect(frame).toContain("gadgets parts");
    expect(frame).not.toContain("gadgets parts-list");
    const bare = (frame.match(/ {2}gadgets *(?=│)/g) ?? []).length;
    expect(bare).toBeLessThanOrEqual(1);
  });

  it("clears the filter on esc without navigating", async () => {
    const { lastFrame, stdin } = render(<App context={makeContext()} />);
    await tick();

    stdin.write("/");
    await tick();
    stdin.write("pro");
    await tick();
    stdin.write(ESC);
    await tick();
    expect(lastFrame()).not.toContain("› pro");
    expect(lastFrame()).toContain("commands");
    expect(lastFrame()).toContain("quit");
  });

  it("runs a command from the form and renders the result table", async () => {
    const okResult: ExecutionResult = {
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [{ id: "p-1", name: "Bike" }, { id: "p-2", name: "Kite" }] },
      error: null,
      stdout: "",
      stderr: "",
    };
    const runner: TuiRunner = vi.fn(async () => okResult);
    const { lastFrame, stdin } = render(
      <App context={makeContext()} runner={runner} />,
    );
    await tick();

    // products is the first item now (folders section, before commands)
    await tick();
    stdin.write(ENTER); // drill in
    await tick();
    stdin.write(ARROW_DOWN); // → get-product
    await tick();
    stdin.write(ENTER); // open form
    await tick();
    stdin.write("p-1");
    await tick();
    stdin.write(CTRL_R); // submit → run
    await tick();

    expect(runner).toHaveBeenCalledWith(
      ["products", "get-product", "--product-id", "p-1"],
      { force: false },
    );
    const frame = lastFrame() ?? "";
    expect(frame).toContain("p-1");
    expect(frame).toContain("Kite");

    // row detail drill-down
    stdin.write(ENTER);
    await tick();
    expect(lastFrame()).toContain("Bike");

    // esc back to table, esc closes the command screen → browser
    stdin.write(ESC);
    await tick();
    stdin.write(ESC);
    await tick();
    expect(lastFrame()).toContain("commands · products");
  });

  it("shows the error view with the structured payload", async () => {
    const failed: ExecutionResult = {
      ok: false,
      exitCode: 4,
      durationMs: 5,
      data: undefined,
      error: { message: "Invalid credentials", code: 401, type: "unauthorized" },
      stdout: "",
      stderr: "",
    };
    const runner: TuiRunner = vi.fn(async () => failed);
    const { lastFrame, stdin } = render(
      <App context={makeContext()} runner={runner} />,
    );
    await tick();
    stdin.write(ENTER); // drill into products (first item)
    await tick();
    stdin.write(ARROW_DOWN); // → get-product
    await tick();
    stdin.write(ENTER);
    await tick();
    stdin.write("p-1");
    await tick();
    stdin.write(CTRL_R);
    await tick();

    const frame = lastFrame() ?? "";
    expect(frame).toContain("ERROR");
    expect(frame).toContain("Invalid credentials");
    expect(frame).toContain("code 401");
  });

  it("runs paramless commands directly, esc returning to the browser", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [{ tenant: "acme", active: true }] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={makeContext()} runner={runner} />,
    );
    await tick();

    // products is the first item now (folders section, before commands)
    stdin.write(ARROW_DOWN); // → login
    await tick();
    stdin.write(ARROW_DOWN); // → tenants
    await tick();
    expect(lastFrame()).toContain("enter to run it");

    stdin.write(ENTER); // no params → runs immediately, no form stop
    await tick();
    expect(runner).toHaveBeenCalledWith(["tenants"], { force: false });
    expect(lastFrame()).not.toContain("takes no parameters");
    expect(lastFrame()).toContain("acme");

    stdin.write(ESC); // straight back to the browser, no empty form
    await tick();
    expect(lastFrame()).not.toContain("takes no parameters");
    expect(lastFrame()).toContain("Scope a tenant");
  });

  it("still gates paramless destructive commands behind the modal", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: {},
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={makeContext()} runner={runner} />,
    );
    await tick();

    // products is the first item now (folders section, before commands)
    await tick();
    stdin.write(ENTER); // drill in
    await tick();
    stdin.write(ARROW_DOWN);
    stdin.write(ARROW_DOWN);
    await tick();
    stdin.write(ARROW_DOWN); // → purge
    await tick();
    stdin.write(ENTER); // paramless destructive → modal, not run
    await tick();
    expect(lastFrame()).toContain("DESTRUCTIVE");
    expect(runner).not.toHaveBeenCalled();

    stdin.write(ESC); // cancel → back to the browser (no empty form)
    await tick();
    expect(lastFrame()).not.toContain("DESTRUCTIVE");
    expect(lastFrame()).not.toContain("takes no parameters");
    expect(lastFrame()).toContain("commands · products");

    stdin.write(ENTER); // reopen and confirm
    await tick();
    stdin.write("y");
    await tick();
    expect(runner).toHaveBeenCalledWith(["products", "purge"], { force: true });
  });

  it("gates destructive commands behind the confirm modal", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { deleted: true },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={makeContext()} runner={runner} />,
    );
    await tick();
    // products is the first item now (folders section, before commands)
    await tick();
    stdin.write(ENTER);
    await tick();
    stdin.write(ARROW_DOWN);
    stdin.write(ARROW_DOWN); // → delete-product
    await tick();
    stdin.write(ENTER); // form
    await tick();
    stdin.write("p-1");
    await tick();
    stdin.write(CTRL_R); // submit → modal, not run
    await tick();
    expect(lastFrame()).toContain("DESTRUCTIVE");
    expect(runner).not.toHaveBeenCalled();

    stdin.write("n"); // cancel returns to the form
    await tick();
    expect(lastFrame()).not.toContain("DESTRUCTIVE");
    expect(runner).not.toHaveBeenCalled();

    stdin.write(CTRL_R); // submit again
    await tick();
    stdin.write("y"); // confirm → runs with force
    await tick();
    expect(runner).toHaveBeenCalledWith(
      ["products", "delete-product", "--product-id", "p-1"],
      { force: true },
    );
  });

  // A service whose command names follow the real list/get/update/delete
  // convention, so the result view's `u`/`d` sibling lookup resolves.
  const crudContext = (): TuiContext =>
    makeContext({
      commands: [
        {
          name: "widgets",
          description: "Manage widgets",
          subcommands: [
            {
              name: "list",
              description: "List widgets",
              method: "get",
              specs: [
                {
                  key: "limit",
                  option: "--limit <limit>",
                  name: "limit",
                  type: "integer",
                  required: false,
                },
              ],
            },
            {
              name: "get",
              description: "Get a widget",
              method: "get",
              specs: [
                {
                  key: "id",
                  option: "--id <id>",
                  name: "id",
                  type: "string",
                  required: true,
                },
              ],
            },
            {
              name: "update",
              description: "Update a widget",
              method: "put",
              specs: [
                {
                  key: "id",
                  option: "--id <id>",
                  name: "id",
                  type: "string",
                  required: true,
                  resource: { listPath: "/widgets", hasLimit: true },
                },
                {
                  key: "name",
                  option: "--name <name>",
                  name: "name",
                  type: "string",
                  required: false,
                },
              ],
            },
            {
              name: "delete",
              description: "Delete a widget",
              method: "delete",
              destructive: true,
              specs: [
                {
                  key: "id",
                  option: "--id <id>",
                  name: "id",
                  type: "string",
                  required: true,
                },
              ],
            },
            {
              name: "create",
              description: "Create a widget",
              method: "post",
              hidden: true,
              specs: [
                {
                  key: "name",
                  option: "--name <name>",
                  name: "name",
                  type: "string",
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    });

  it("opens the sibling create form via c from a list result", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={crudContext()} runner={runner} />,
    );
    await tick();
    stdin.write(ENTER); // drill into widgets
    await tick();
    // create is hidden from the browser like the other CRUD leaves…
    expect(lastFrame()).not.toContain("Create a widget");

    stdin.write(ENTER); // run list
    await tick();

    // …and c works even on this empty list: no row required
    stdin.write("c");
    await tick();
    expect(lastFrame()).toContain("widgets · create");
    expect(lastFrame()).toContain("name");

    stdin.write("Gizmo");
    await tick();
    stdin.write(ENTER); // advance to the Submit button
    await tick();
    stdin.write(ENTER); // run → POST
    await tick();
    expect(runner).toHaveBeenCalledWith(
      ["widgets", "create", "--name", "Gizmo"],
      { force: false },
    );
    // …and on success the view jumps back to the origin list, re-run fresh.
    expect(runner).toHaveBeenLastCalledWith(["widgets", "list"], {
      force: false,
    });
  });

  it("loops list → delete → list for verb-first list names too", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [{ id: "d-1", name: "Prod deploy" }] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const context = makeContext({
      commands: [
        {
          name: "sites",
          description: "Manage sites",
          subcommands: [
            {
              name: "list-deployments",
              label: "deployments",
              description: "List deployments",
              method: "get",
              specs: [],
            },
            {
              name: "delete-deployment",
              description: "Delete a deployment",
              method: "delete",
              destructive: true,
              hidden: true,
              specs: [
                {
                  key: "id",
                  option: "--id <id>",
                  name: "id",
                  type: "string",
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    });
    const { lastFrame, stdin } = render(
      <App context={context} runner={runner} />,
    );
    await tick();
    stdin.write(ENTER); // drill into sites
    await tick();
    stdin.write(ENTER); // run list-deployments
    await tick();
    expect(lastFrame()).toContain("d-1");

    stdin.write("d"); // resolves delete-deployment via the plural pairing
    await tick();
    expect(lastFrame()).toContain("DESTRUCTIVE");

    stdin.write("y");
    await tick();
    expect(runner).toHaveBeenCalledWith(
      ["sites", "delete-deployment", "--id", "d-1"],
      { force: true },
    );
    // …and the loop closes: back on the re-run list
    expect(runner).toHaveBeenLastCalledWith(["sites", "list-deployments"], {
      force: false,
    });
  });

  it("cancelling an update or delete returns to the origin list", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [{ id: "w-1", name: "Alpha" }] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={crudContext()} runner={runner} />,
    );
    await tick();
    stdin.write(ENTER); // drill into widgets
    await tick();
    stdin.write(ENTER); // run list
    await tick();
    expect(runner).toHaveBeenCalledTimes(1);

    stdin.write("u"); // jump into update…
    await tick();
    expect(lastFrame()).toContain("widgets · update");
    stdin.write(ESC); // …and bail out
    await tick();
    // back on the list, re-run
    expect(runner).toHaveBeenCalledTimes(2);
    expect(runner).toHaveBeenLastCalledWith(["widgets", "list"], {
      force: false,
    });
    expect(lastFrame()).toContain("Alpha");

    stdin.write("d"); // jump into delete → confirm modal
    await tick();
    expect(lastFrame()).toContain("DESTRUCTIVE");
    stdin.write("n"); // cancel
    await tick();
    // back on the list again, nothing deleted
    expect(runner).toHaveBeenCalledTimes(3);
    expect(runner).toHaveBeenLastCalledWith(["widgets", "list"], {
      force: false,
    });
  });

  it("updates the selected list row via u, prefilled from the record", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [{ id: "w-1", name: "Alpha" }, { id: "w-2", name: "Beta" }] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={crudContext()} runner={runner} />,
    );
    await tick();
    stdin.write(ENTER); // drill into widgets
    await tick();
    stdin.write(ENTER); // run list
    await tick();
    expect(lastFrame()).toContain("w-1");

    stdin.write("u"); // update the row under the cursor
    await tick();
    // The update form opens, pre-filled with the record — no picker.
    expect(lastFrame()).toContain("widgets · update");
    expect(lastFrame()).toContain("w-1");
    expect(lastFrame()).not.toContain("Search id");

    stdin.write(CTRL_R); // run the update
    await tick();
    expect(runner).toHaveBeenCalledWith(
      ["widgets", "update", "--id", "w-1", "--name", "Alpha"],
      { force: false },
    );
    // success returns to the origin list and re-runs it
    expect(runner).toHaveBeenLastCalledWith(["widgets", "list"], {
      force: false,
    });
  });

  it("prefills u/d from the row when the id key differs from the record field", async () => {
    // The apps case: the path param is `--app-id` (option key `appId`) but the
    // list row keys its id as `$id`. A plain record[key] lookup misses, so the
    // resource picker used to pop open; it must resolve like the picker does.
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [{ $id: "a-1", name: "Alpha" }] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const idResource = {
      key: "appId",
      option: "--app-id <app-id>",
      name: "app_id",
      type: "string",
      required: true,
      resource: { listPath: "/apps", hasLimit: false, search: true },
    } as const;
    const context = makeContext({
      commands: [
        {
          name: "apps",
          description: "Manage apps",
          subcommands: [
            { name: "list", description: "List apps", method: "get", specs: [] },
            {
              name: "update",
              description: "Update an app",
              method: "put",
              specs: [
                { ...idResource },
                {
                  key: "name",
                  option: "--name <name>",
                  name: "name",
                  type: "string",
                  required: false,
                },
              ],
            },
            {
              name: "delete",
              description: "Delete an app",
              method: "delete",
              destructive: true,
              specs: [{ ...idResource }],
            },
          ],
        },
      ],
    });
    const { lastFrame, stdin } = render(
      <App context={context} runner={runner} />,
    );
    await tick();
    stdin.write(ENTER); // drill into apps
    await tick();
    stdin.write(ENTER); // run list
    await tick();
    expect(lastFrame()).toContain("a-1");

    stdin.write("u"); // update the row under the cursor
    await tick();
    // Pre-filled from the row (resolved via $id) — the picker must NOT open.
    expect(lastFrame()).toContain("apps · update");
    expect(lastFrame()).not.toContain("Search app_id");
    stdin.write(CTRL_R); // run the update
    await tick();
    expect(runner).toHaveBeenCalledWith(
      ["apps", "update", "--app-id", "a-1", "--name", "Alpha"],
      { force: false },
    );

    stdin.write("d"); // delete the row under the cursor
    await tick();
    // Straight to the confirm, id resolved — no search.
    expect(lastFrame()).toContain("DESTRUCTIVE");
    expect(lastFrame()).toContain("apps delete --app-id a-1");
    expect(lastFrame()).not.toContain("Search app_id");
  });

  it("seeds a --data body update from the record, minus the id param", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [{ id: "r-1", label: "Hi", value: 42 }] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const context = makeContext({
      commands: [
        {
          name: "records",
          description: "Manage records",
          subcommands: [
            { name: "list", description: "List", method: "get", specs: [] },
            {
              name: "update",
              description: "Update",
              method: "put",
              specs: [
                {
                  key: "id",
                  option: "--id <id>",
                  name: "id",
                  type: "string",
                  required: true,
                },
                {
                  key: "data",
                  option: "--data <data>",
                  name: "data",
                  type: "object",
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    });
    const { lastFrame, stdin } = render(
      <App context={context} runner={runner} />,
    );
    await tick();
    stdin.write(ENTER); // drill into records
    await tick();
    stdin.write(ENTER); // run list
    await tick();
    expect(lastFrame()).toContain("r-1");

    stdin.write("u"); // update the row
    await tick();
    expect(lastFrame()).toContain("records · update");
    // body seeded from the record minus id → the two remaining fields.
    expect(lastFrame()).toContain("{ 2 fields }");

    stdin.write(CTRL_R); // run the update
    await tick();
    expect(runner).toHaveBeenCalledWith(
      ["records", "update", "--id", "r-1", "--data", '{"label":"Hi","value":42}'],
      { force: false },
    );
    // success returns to the origin list and re-runs it
    expect(runner).toHaveBeenLastCalledWith(["records", "list"], {
      force: false,
    });
  });

  it("hides get/update/delete from the browser but keeps list u/d working", async () => {
    const idSpec: PromptSpec = {
      key: "id",
      option: "--id <id>",
      name: "id",
      type: "string",
      required: true,
    };
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [{ id: "w-1", name: "Alpha" }] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const context = makeContext({
      commands: [
        {
          name: "widgets",
          description: "Manage widgets",
          subcommands: [
            { name: "list", description: "List", method: "get", specs: [] },
            { name: "get", description: "Get", method: "get", hidden: true, specs: [idSpec] },
            { name: "update", description: "Update", method: "put", hidden: true, specs: [idSpec] },
            {
              name: "delete",
              description: "Delete",
              method: "delete",
              destructive: true,
              hidden: true,
              specs: [idSpec],
            },
          ],
        },
      ],
    });
    const { lastFrame, stdin } = render(
      <App context={context} runner={runner} />,
    );
    await tick();
    stdin.write(ENTER); // drill into widgets
    await tick();
    // The browser lists only `list`; get/update/delete are hidden.
    expect(lastFrame()).toContain("list");
    expect(lastFrame()).not.toContain("update");
    expect(lastFrame()).not.toContain("delete");

    stdin.write(ENTER); // run list
    await tick();
    expect(lastFrame()).toContain("w-1");
    // …yet u/d resolve the hidden commands from the list result.
    expect(lastFrame()).toContain("update");
    expect(lastFrame()).toContain("delete");

    stdin.write("d"); // delete the row → resolves the hidden `delete`
    await tick();
    expect(lastFrame()).toContain("DESTRUCTIVE");
    expect(lastFrame()).toContain("widgets delete --id w-1");
  });

  it("excludes browse-hidden CRUD leaves from search — the list is the entry point", async () => {
    const idSpec: PromptSpec = {
      key: "id",
      option: "--id <id>",
      name: "id",
      type: "string",
      required: true,
    };
    const context = makeContext({
      commands: [
        {
          name: "widgets",
          description: "Manage widgets",
          subcommands: [
            { name: "list", description: "List", method: "get", specs: [] },
            {
              name: "get",
              description: "Get a widget",
              method: "get",
              hidden: true,
              specs: [idSpec],
            },
          ],
        },
      ],
    });
    // the hidden leaf is out of the global search space; its list is in
    const entries = flattenTree(context.commands);
    expect(entries.map((entry) => entry.path)).not.toContain("widgets get");
    // the own-records list is merged into the group row itself
    expect(entries.map((entry) => entry.path)).toContain("widgets");
    expect(entries.map((entry) => entry.path)).not.toContain("widgets list");

    // searching the service still routes to it via the list
    const { lastFrame, stdin } = render(<App context={context} />);
    await tick();
    stdin.write("widgets");
    await tick();
    expect(lastFrame()).not.toContain("No commands match");

    // scoped search inside the service only sees browsable commands
    stdin.write(ESC); // clear the filter
    await tick();
    stdin.write(ENTER); // drill into widgets
    await tick();
    stdin.write("get");
    await tick();
    expect(lastFrame()).toContain("No commands match");
  });

  it("deletes the selected list row via d and the confirm modal", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { items: [{ id: "w-1", name: "Alpha" }, { id: "w-2", name: "Beta" }] },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={crudContext()} runner={runner} />,
    );
    await tick();
    stdin.write(ENTER); // drill into widgets
    await tick();
    stdin.write(ENTER); // run list (no required params)
    await tick();
    expect(lastFrame()).toContain("w-1");
    expect(lastFrame()).toContain("Alpha");
    // the results view advertises both jumps
    expect(lastFrame()).toContain("update");
    expect(lastFrame()).toContain("delete");

    stdin.write("d"); // delete the row under the cursor
    await tick();
    expect(lastFrame()).toContain("DESTRUCTIVE");
    expect(lastFrame()).toContain("widgets delete --id w-1");
    expect(runner).toHaveBeenCalledTimes(1); // list only, not the delete yet

    stdin.write("y"); // confirm → runs with force
    await tick();
    expect(runner).toHaveBeenCalledWith(
      ["widgets", "delete", "--id", "w-1"],
      { force: true },
    );
    // success returns to the origin list and re-runs it
    expect(runner).toHaveBeenLastCalledWith(["widgets", "list"], {
      force: false,
    });
  });

  it("updates and deletes from a get result", async () => {
    const runner: TuiRunner = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      durationMs: 5,
      data: { id: "w-9", name: "Gamma" },
      error: null,
      stdout: "",
      stderr: "",
    }));
    const { lastFrame, stdin } = render(
      <App context={crudContext()} runner={runner} />,
    );
    await tick();
    stdin.write(ENTER); // drill into widgets
    await tick();
    stdin.write(ARROW_DOWN); // → get
    await tick();
    stdin.write(ENTER); // open the get form
    await tick();
    stdin.write("w-9");
    await tick();
    stdin.write(CTRL_R); // run get
    await tick();
    expect(runner).toHaveBeenCalledWith(
      ["widgets", "get", "--id", "w-9"],
      { force: false },
    );
    expect(lastFrame()).toContain("update");
    expect(lastFrame()).toContain("delete");

    stdin.write("d"); // delete the single record on screen
    await tick();
    expect(lastFrame()).toContain("DESTRUCTIVE");
    expect(lastFrame()).toContain("widgets delete --id w-9");
  });

  it("collapses overflowing commands into a scroll indicator", () => {
    const many = Array.from({ length: 80 }, (_, index) => ({
      name: `command-${index}`,
      description: "entry",
      subcommands: [],
    }));
    const { lastFrame } = render(
      <App context={makeContext({ commands: many })} />,
    );
    expect(lastFrame()).toMatch(/↓ \d+ more/);
  });

  it("opens the theme picker with ^t and reverts on esc", async () => {
    const { lastFrame, stdin } = render(
      <App context={makeContext()} onThemePersist={() => {}} />,
    );
    await tick();
    stdin.write("\x14"); // ^t
    await tick();
    expect(lastFrame()).toContain("↑↓ preview");
    expect(lastFrame()).toContain("revenexx");
    expect(lastFrame()).toContain("dracula");

    stdin.write(ARROW_DOWN);
    await tick();
    stdin.write(ESC); // revert + close
    await tick();
    expect(lastFrame()).not.toContain("↑↓ preview");
    expect(lastFrame()).toContain("commands");
  });

  it("keeps the highlighted theme with ⏎ and persists it", async () => {
    const persist = vi.fn();
    const { stdin } = render(
      <App context={makeContext()} onThemePersist={persist} />,
    );
    await tick();
    stdin.write("\x14"); // ^t
    await tick();
    stdin.write(ARROW_DOWN); // revenexx → dark (second in the registry)
    await tick();
    stdin.write(ENTER); // keep
    await tick();
    expect(persist).toHaveBeenCalledWith("dark");
    // Reset the shared active palette for later tests.
    applyTheme("revenexx");
  });
});
