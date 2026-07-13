import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  parse,
  drawCSV,
  drawYAML,
  drawMarkdown,
  drawJSONL,
  cliConfig,
  parseOutputFormat,
  parseFields,
} from "../lib/parser.js";
import { exitCodeForError, RevenexxException } from "../lib/client.js";
import { resolveBodyParam } from "../lib/utils.js";

/** Capture everything a renderer writes to stdout for one call. */
const capture = (fn: () => void): string => {
  const original = console.log;
  let out = "";
  console.log = (...args: unknown[]) => {
    out += args.join(" ") + "\n";
  };
  try {
    fn();
  } finally {
    console.log = original;
  }
  return out.replace(/\n$/, "");
};

// Renderers key off cliConfig; reset it around every test so cases don't leak.
beforeEach(() => {
  cliConfig.output = "table";
  cliConfig.fields = undefined;
  cliConfig.json = false;
  cliConfig.quiet = false;
});
afterEach(() => {
  cliConfig.output = "table";
  cliConfig.fields = undefined;
});

describe("exitCodeForError (DX-104: meaningful exit codes)", () => {
  it("maps auth/not-found/rate-limit statuses", () => {
    expect(exitCodeForError(new RevenexxException("x", 401))).toBe(4);
    expect(exitCodeForError(new RevenexxException("x", 403))).toBe(4);
    expect(exitCodeForError(new RevenexxException("x", 404))).toBe(5);
    expect(exitCodeForError(new RevenexxException("x", 429))).toBe(8);
  });

  it("falls back to 1 for 5xx, network, and non-HTTP errors", () => {
    expect(exitCodeForError(new RevenexxException("x", 500))).toBe(1);
    expect(exitCodeForError(new RevenexxException("x"))).toBe(1);
    expect(exitCodeForError(new Error("boom"))).toBe(1);
    expect(exitCodeForError("nope")).toBe(1);
  });
});

describe("drawCSV", () => {
  it("renders an array of objects with RFC 4180 quoting", () => {
    expect(
      capture(() =>
        drawCSV([
          { id: 1, name: "a" },
          { id: 2, name: "b, c" },
        ]),
      ),
    ).toBe('id,name\n1,a\n2,"b, c"');
  });

  it("tabulates the collection of a list envelope", () => {
    expect(
      capture(() => drawCSV({ total: 2, docs: [{ id: 1 }, { id: 2 }] })),
    ).toBe("id\n1\n2");
  });

  it("renders a lone object as a single row and JSON-encodes nested cells", () => {
    expect(capture(() => drawCSV({ id: 1, tags: ["x", "y"] }))).toBe(
      'id,tags\n1,"[""x"",""y""]"',
    );
  });

  it("unions keys across ragged rows", () => {
    expect(capture(() => drawCSV([{ a: 1 }, { b: 2 }]))).toBe("a,b\n1,\n,2");
  });
});

describe("drawYAML", () => {
  it("renders nested objects and arrays", () => {
    expect(
      capture(() =>
        drawYAML({ id: 7, name: "hi", tags: ["a", "b"], meta: { k: true } }),
      ),
    ).toBe("id: 7\nname: hi\ntags:\n  - a\n  - b\nmeta:\n  k: true");
  });

  it("renders an array of objects as list items", () => {
    expect(
      capture(() =>
        drawYAML([
          { id: 1, n: "x" },
          { id: 2, n: "y" },
        ]),
      ),
    ).toBe("- id: 1\n  n: x\n- id: 2\n  n: y");
  });

  it("quotes scalars that would otherwise parse as non-strings", () => {
    expect(
      capture(() => drawYAML({ a: "true", b: "12", c: "hi: there", d: "" })),
    ).toBe('a: "true"\nb: "12"\nc: "hi: there"\nd: ""');
  });

  it("renders empty collections inline", () => {
    expect(capture(() => drawYAML({ items: [], meta: {} }))).toBe(
      "items: []\nmeta: {}",
    );
  });
});

describe("drawJSONL", () => {
  it("emits one compact JSON object per line for an array", () => {
    expect(
      capture(() =>
        drawJSONL([
          { id: 1, name: "a" },
          { id: 2, name: "b" },
        ]),
      ),
    ).toBe('{"id":1,"name":"a"}\n{"id":2,"name":"b"}');
  });

  it("streams the collection of a list envelope", () => {
    expect(
      capture(() => drawJSONL({ total: 2, docs: [{ id: "a" }, { id: "b" }] })),
    ).toBe('{"id":"a"}\n{"id":"b"}');
  });

  it("preserves scalar array items verbatim (no value-wrapping)", () => {
    expect(capture(() => drawJSONL(["a", "b", 3]))).toBe('"a"\n"b"\n3');
  });

  it("emits a lone object as a single line", () => {
    expect(capture(() => drawJSONL({ id: "x", ok: true }))).toBe(
      '{"id":"x","ok":true}',
    );
  });
});

describe("drawMarkdown", () => {
  it("renders a lone record as a Field/Value table", () => {
    expect(capture(() => drawMarkdown({ id: "p1", name: "Widget" }))).toBe(
      "| Field | Value |\n| --- | --- |\n| id | p1 |\n| name | Widget |",
    );
  });

  it("renders an array of objects as a columnar table", () => {
    expect(
      capture(() =>
        drawMarkdown([
          { id: 1, name: "a" },
          { id: 2, name: "b" },
        ]),
      ),
    ).toBe(
      "| id | name |\n| --- | --- |\n| 1 | a |\n| 2 | b |",
    );
  });

  it("tabulates a list envelope and escapes pipe characters", () => {
    expect(
      capture(() => drawMarkdown({ total: 1, docs: [{ id: "a|b", n: 1 }] })),
    ).toBe("| id | n |\n| --- | --- |\n| a\\|b | 1 |");
  });
});

describe("parse dispatch + --fields projection", () => {
  it("routes to CSV and projects the requested columns", () => {
    cliConfig.output = "csv";
    cliConfig.fields = parseFields("id, name");
    expect(
      capture(() =>
        parse([
          { id: 1, name: "a", secret: 9 },
          { id: 2, name: "b", secret: 8 },
        ]),
      ),
    ).toBe("id,name\n1,a\n2,b");
  });

  it("projects the collection inside a list envelope", () => {
    cliConfig.output = "json";
    cliConfig.fields = parseFields("id");
    cliConfig.json = true;
    expect(
      capture(() => parse({ total: 1, docs: [{ id: "p1", name: "x" }] })),
    ).toBe(JSON.stringify({ total: 1, docs: [{ id: "p1" }] }, null, 2));
  });

  it("keeps --json byte-stable (uncolored)", () => {
    cliConfig.output = "json";
    cliConfig.json = true;
    expect(capture(() => parse({ a: 1 }))).toBe('{\n  "a": 1\n}');
  });
});

describe("parseOutputFormat / parseFields", () => {
  it("accepts the known formats case-insensitively", () => {
    expect(parseOutputFormat("json")).toBe("json");
    expect(parseOutputFormat("YAML")).toBe("yaml");
    expect(parseOutputFormat("Csv")).toBe("csv");
    expect(parseOutputFormat("markdown")).toBe("markdown");
  });

  it("accepts `md` as an alias for markdown", () => {
    expect(parseOutputFormat("md")).toBe("markdown");
    expect(parseOutputFormat("MD")).toBe("markdown");
  });

  it("accepts `jsonl` and `ndjson`", () => {
    expect(parseOutputFormat("jsonl")).toBe("jsonl");
    expect(parseOutputFormat("ndjson")).toBe("jsonl");
  });

  it("rejects unknown formats", () => {
    expect(() => parseOutputFormat("xml")).toThrow();
  });

  it("splits and trims a field list, dropping empties", () => {
    expect(parseFields(" id , name ,, price ")).toEqual([
      "id",
      "name",
      "price",
    ]);
  });
});

describe("resolveBodyParam (DX-104: body from inline/@file/stdin)", () => {
  it("parses an inline JSON body", () => {
    expect(resolveBodyParam('{"a":1,"b":"x"}')).toEqual({ a: 1, b: "x" });
  });

  it("reads a JSON body from @file", () => {
    const file = path.join(os.tmpdir(), `dx104-body-${Date.now()}.json`);
    fs.writeFileSync(file, '{"from":"file"}');
    try {
      expect(resolveBodyParam(`@${file}`)).toEqual({ from: "file" });
    } finally {
      fs.unlinkSync(file);
    }
  });

  it("raises a clear error for a missing file", () => {
    expect(() => resolveBodyParam("@/no/such/dx104.json")).toThrow(
      /Could not read --data file/,
    );
  });

  it("raises a clear error for invalid JSON", () => {
    expect(() => resolveBodyParam("{not json")).toThrow(
      /Invalid JSON body from inline --data/,
    );
  });
});
