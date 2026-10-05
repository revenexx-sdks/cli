/**
 * Ported core of @revenexx/app-sdk-cli (revenexx/app-sdks packages/cli),
 * folded into the revenexx CLI as planned by that package. The language-
 * agnostic entity model, capability generation and the js/php client
 * emitters — everything `apps generate` / `apps capabilities` and the
 * `create app` scaffolder need, with the small @revenexx/app-sdk imports
 * (Op, ColumnDef, opsFromAccess) inlined so the CLI stays dependency-free.
 */
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Inlined from @revenexx/app-sdk (types.ts / client.ts)
// ---------------------------------------------------------------------------

export type Op = "list" | "get" | "create" | "update" | "delete";

export interface ColumnDef {
  type: string;
  pk?: boolean;
  notNull?: boolean;
  default?: string | null;
  check?: string;
}

/** manifest `permissions` access → entity client methods. */
const ACCESS_TO_OPS: Record<string, Op[]> = {
  read: ["list", "get"],
  create: ["create"],
  update: ["update"],
  delete: ["delete"],
};

/** Map a manifest access list (e.g. ['read','create']) to a Set of ops. */
export function opsFromAccess(access: string[] = []): Set<Op> {
  const ops = new Set<Op>();
  for (const a of access) (ACCESS_TO_OPS[a] ?? []).forEach((o) => ops.add(o));
  return ops;
}

// ---------------------------------------------------------------------------
// schema.ts — the language-agnostic model the emitters consume
// ---------------------------------------------------------------------------

export interface BuiltEntity {
  table: string;
  pk: string;
  columns: Record<string, ColumnDef>;
  ops: Op[];
}

export interface Manifest {
  name?: string;
  vendor?: string;
  permissions?: Array<Record<string, unknown>>;
  events?: { emits?: Array<string | Record<string, unknown>> };
}

/**
 * One event the App fires itself — a `manifest.events.emits[]` entry declared
 * `trigger: "app"`. The other kind (`entity` + `on`) is a Baseline trigger and
 * never reaches the client: the App does not fire it, a row change does.
 */
export interface BuiltEvent {
  /** Vendor-scoped topic the platform publishes. */
  topic: string;
  sample?: Record<string, unknown>;
  schema?: Record<string, unknown>;
}

export interface Schema {
  entities?: Record<string, { columns?: Record<string, ColumnDef> }>;
}

/** Lowercase snake_case, mirroring Baseline's NamespaceResolver::normalizeSlug. */
export function slug(raw: string): string {
  return String(raw).toLowerCase().trim().replace(/[-\s]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

/** Fully-namespaced Postgres table an App's entity maps to. */
export function tableName(vendor: string, app: string, entity: string): string {
  return `${slug(vendor)}__${slug(app)}__${slug(entity)}`;
}

/** Resolve the discriminated `permissions` register down to entity → access[]. */
function accessByEntity(permissions: Array<Record<string, unknown>> = []): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const p of permissions) {
    if (p && typeof p.entity === "string") out[p.entity] = Array.isArray(p.access) ? (p.access as string[]) : [];
  }
  return out;
}

/** Build entity descriptors from schema + manifest permissions + vendor/app. */
export function buildEntities(args: {
  schema: Schema;
  permissions?: Array<Record<string, unknown>>;
  vendor: string;
  app: string;
}): Record<string, BuiltEntity> {
  const access = accessByEntity(args.permissions ?? []);
  const out: Record<string, BuiltEntity> = {};

  for (const [name, def] of Object.entries(args.schema.entities ?? {})) {
    const columns = def.columns ?? {};
    let pk = "id";
    for (const [col, c] of Object.entries(columns)) {
      if (c?.pk) {
        pk = col;
        break;
      }
    }
    out[name] = {
      table: tableName(args.vendor, args.app, name),
      pk,
      columns,
      ops: [...opsFromAccess(access[name] ?? [])],
    };
  }
  return out;
}

/** The routine Baseline generates for an App's own events. */
export function emitFnName(vendor: string, app: string): string {
  return `${slug(vendor)}__${slug(app)}__emit`;
}

/**
 * Build the descriptors for the events the App fires itself.
 *
 * Only `trigger: "app"` entries are kept. A wired emit (`entity` + `on`) is
 * fired by a Baseline trigger on a row change — putting it on the client would
 * offer the App a call that publishes a second, duplicate event.
 *
 * The topic is assembled the way Baseline's EventTopic::build does it, over the
 * same snake-normalised vendor/app `tableName()` uses. Two spellings of one
 * topic is a subscriber that never fires and no error anywhere.
 */
export function buildEvents(args: {
  manifest: Manifest;
  vendor: string;
  app: string;
}): Record<string, BuiltEvent> {
  const out: Record<string, BuiltEvent> = {};

  for (const entry of args.manifest.events?.emits ?? []) {
    if (typeof entry !== "object" || entry === null) continue;
    if (entry.trigger !== "app") continue;

    const name = entry.name;
    if (typeof name !== "string" || name === "") continue;

    const event: BuiltEvent = { topic: `${slug(args.vendor)}.${slug(args.app)}.${name}` };
    if (entry.sample && typeof entry.sample === "object") event.sample = entry.sample as Record<string, unknown>;
    if (entry.data_schema && typeof entry.data_schema === "object") {
      event.schema = entry.data_schema as Record<string, unknown>;
    }
    out[name] = event;
  }

  return out;
}

/** Postgres column type → TypeScript type. */
export function tsType(type = ""): string {
  const t = String(type).toLowerCase();
  if (/^(uuid|text|varchar|char|citext|bpchar)/.test(t)) return "string";
  if (/^(timestamptz|timestamp|date|time|interval)/.test(t)) return "string";
  if (/^(int|integer|int2|int4|int8|bigint|smallint|serial|bigserial)/.test(t)) return "number";
  if (/^(numeric|decimal|real|double|float)/.test(t)) return "number";
  if (/^(bool|boolean)/.test(t)) return "boolean";
  if (/^(jsonb|json)/.test(t)) return "Record<string, unknown>";
  if (/\[\]$/.test(t) || /^array/.test(t)) return "unknown[]";
  return "unknown";
}

/** Postgres column type → PHP type hint (nullable handled by the caller). */
export function phpType(type = ""): string {
  const t = String(type).toLowerCase();
  if (/^(int|integer|int2|int4|int8|bigint|smallint|serial|bigserial)/.test(t)) return "int";
  if (/^(numeric|decimal|real|double|float)/.test(t)) return "float";
  if (/^(bool|boolean)/.test(t)) return "bool";
  if (/^(jsonb|json)/.test(t) || /\[\]$/.test(t) || /^array/.test(t)) return "array";
  return "string";
}

export function pascal(s: string): string {
  return String(s).replace(/(^|[_-])([a-z])/g, (_m, _p, c: string) => c.toUpperCase());
}

export function idTsType(entity: BuiltEntity): "string" | "number" {
  return tsType(entity.columns[entity.pk]?.type) === "number" ? "number" : "string";
}

// ---------------------------------------------------------------------------
// capabilities.ts — manifest capability stubs from schema.json
// ---------------------------------------------------------------------------

export interface Capability {
  type: "define";
  capability: string;
  version: string;
  summary: string;
  route: { method: string; path: string };
  parameters?: Array<Record<string, unknown>>;
  request?: Record<string, unknown>;
  response: Record<string, unknown>;
  cache?: Record<string, unknown>;
}

/** Postgres column type → JSON Schema fragment. */
export function jsonSchemaType(type = ""): Record<string, unknown> {
  const t = String(type).toLowerCase();
  if (t.startsWith("uuid")) return { type: "string", format: "uuid" };
  if (/^(timestamptz|timestamp|date|time)/.test(t)) return { type: "string", format: "date-time" };
  if (/^bool/.test(t)) return { type: "boolean" };
  if (/^(int|bigint|smallint|serial)/.test(t)) return { type: "integer" };
  if (/^(numeric|decimal|real|double|float)/.test(t)) return { type: "number" };
  if (/^(jsonb|json)/.test(t)) return { type: "object" };
  if (/\[\]$/.test(t) || /^array/.test(t)) return { type: "array" };
  return { type: "string" };
}

/**
 * Widen a JSON Schema fragment to also accept null. A nullable Postgres column
 * (no `notNull`) returns null for unset rows, so its schema type must include
 * 'null' or every such row fails response-contract validation at the gateway.
 */
function nullable(frag: Record<string, unknown>): Record<string, unknown> {
  const t = frag.type;
  if (typeof t === "string") return { ...frag, type: [t, "null"] };
  if (Array.isArray(t) && !t.includes("null")) return { ...frag, type: [...t, "null"] };
  return frag;
}

/** A titled JSON Schema object for an entity (its row shape). */
export function entitySchema(entity: string, columns: Record<string, ColumnDef>): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  for (const [col, def] of Object.entries(columns)) {
    const frag = jsonSchemaType(def.type);
    // PK columns are always present; everything else is nullable unless notNull.
    properties[col] = def.pk || def.notNull ? frag : nullable(frag);
  }
  return { title: pascal(entity), type: "object", properties };
}

const OP_ORDER: Op[] = ["list", "get", "create", "update", "delete"];

/** The pagination envelope every list response carries (platform convention). */
export const PAGE_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    limit: { type: "integer" },
    offset: { type: "integer" },
    total: { type: "integer" },
    returned: { type: "integer" },
    hasMore: { type: "boolean" },
  },
};

/**
 * mountCrud honors exact-column filters, single-column `order` and
 * limit/offset pagination. Declaring these surfaces them as TYPED SDK
 * arguments and lets the gateway validate them; without them callers are
 * stuck on page 1.
 */
export const PAGINATION_PARAMS: Array<Record<string, unknown>> = [
  { name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 200 }, description: "Page size (default 50, max 200)." },
  { name: "offset", in: "query", required: false, schema: { type: "integer", minimum: 0 }, description: "Row offset for pagination (default 0)." },
  { name: "order", in: "query", required: false, schema: { type: "string" }, description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'." },
];

export interface CapabilityGenOptions {
  schema: Schema;
  /** Manifest permissions register — entity grants drive which entities/ops are exposed. */
  permissions?: Array<Record<string, unknown>>;
  /** Restrict to these entity names (default: all permitted). */
  only?: string[];
  /** Capability contract version (default 1.0.0). */
  version?: string;
  /**
   * App slug. When set, capabilities and routes follow the platform app
   * contract: capability `{app}.{entity}.{op}`, route `/{app}/{entity}`,
   * and list ops carry the pagination parameters.
   */
  appPrefix?: string;
}

/**
 * Build CRUD capability stubs for every entity the manifest grants access to,
 * with the ops derived from that entity's access and a titled object schema
 * from schema.json.
 */
export function buildCapabilities(opts: CapabilityGenOptions): Capability[] {
  const version = opts.version ?? "1.0.0";
  const access: Record<string, string[]> = {};
  for (const p of opts.permissions ?? []) {
    if (p && typeof p.entity === "string") access[p.entity] = Array.isArray(p.access) ? (p.access as string[]) : [];
  }

  const capName = (entity: string, op: string): string =>
    opts.appPrefix ? `${opts.appPrefix}.${entity}.${op}` : `${entity}.${op}`;
  const base = (entity: string): string =>
    opts.appPrefix ? `/${opts.appPrefix}/${entity}` : `/${entity}`;

  const out: Capability[] = [];
  for (const [entity, def] of Object.entries(opts.schema.entities ?? {})) {
    if (!(entity in access)) continue; // only entities the manifest grants
    if (opts.only && !opts.only.includes(entity)) continue;

    const ops = new Set<Op>(opsFromAccess(access[entity] ?? []));
    if (ops.size === 0) continue;

    const obj = entitySchema(entity, def.columns ?? {});
    const list = { type: "object", properties: { items: { type: "array", items: obj }, page: PAGE_SCHEMA } };
    const del = { type: "object", properties: { deleted: { type: "boolean" }, id: { type: "string" } } };
    const input = { type: "object" };

    const make = (op: Op): Capability | null => {
      switch (op) {
        case "list":
          return {
            type: "define", capability: capName(entity, "list"), version,
            summary: `List ${entity} (filter by column; paginate limit/offset/order)`,
            route: { method: "GET", path: base(entity) },
            ...(opts.appPrefix ? { parameters: PAGINATION_PARAMS } : {}),
            response: list,
          };
        case "get":
          return {
            type: "define", capability: capName(entity, "get"), version,
            summary: `Read one ${entity} by id`,
            route: { method: "GET", path: `${base(entity)}/{id}` }, response: obj,
          };
        case "create":
          return {
            type: "define", capability: capName(entity, "create"), version,
            summary: `Create a ${entity}`,
            route: { method: "POST", path: base(entity) }, request: input, response: obj,
          };
        case "update":
          return {
            type: "define", capability: capName(entity, "update"), version,
            summary: `Update a ${entity} by id`,
            route: { method: "PUT", path: `${base(entity)}/{id}` }, request: input, response: obj,
          };
        case "delete":
          return {
            type: "define", capability: capName(entity, "delete"), version,
            summary: `Delete a ${entity} by id`,
            route: { method: "DELETE", path: `${base(entity)}/{id}` }, response: del,
          };
        default:
          return null;
      }
    };

    for (const op of OP_ORDER) {
      if (ops.has(op)) {
        const cap = make(op);
        if (cap) out.push(cap);
      }
    }
  }
  return out;
}

/**
 * Merge generated capabilities into an existing list: generated entries replace
 * any with the same `capability` key (idempotent re-generation), hand-written
 * capabilities with other keys are preserved.
 */
export function mergeCapabilities(
  existing: Array<Record<string, unknown>> = [],
  generated: Capability[] = [],
): Array<Record<string, unknown>> {
  const genKeys = new Set(generated.map((c) => c.capability));
  const kept = existing.filter((c) => typeof c.capability !== "string" || !genKeys.has(c.capability as string));
  return [...kept, ...generated] as unknown as Array<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// emit/* — the js and php client emitters + registry
// ---------------------------------------------------------------------------

export interface EmitInput {
  vendor: string;
  app: string;
  entities: Record<string, BuiltEntity>;
  /** The App's own events, empty when its manifest declares none. */
  events: Record<string, BuiltEvent>;
  options: {
    runtimeModule?: string;
    phpNamespace?: string;
  };
}

export interface EmittedFile {
  /** Path relative to the output directory. */
  path: string;
  content: string;
}

/**
 * A code emitter for one target language. Register a new one to add a language
 * target — the shared entity model above is language-agnostic.
 */
export interface Emitter {
  readonly target: string;
  emit(input: EmitInput): EmittedFile[];
}

const emitters = new Map<string, Emitter>();

export function registerEmitter(emitter: Emitter): void {
  emitters.set(emitter.target, emitter);
}

export function emitterTargets(): string[] {
  return [...emitters.keys()];
}

export function getEmitter(target: string): Emitter {
  const e = emitters.get(target);
  if (!e) {
    throw new Error(`unknown target '${target}' (${emitterTargets().join(" | ") || "none"})`);
  }
  return e;
}

function emitJs(
  entities: Record<string, BuiltEntity>,
  events: Record<string, BuiltEvent>,
  emitFn: string,
  runtimeModule: string,
): string {
  const descriptor: Record<string, Pick<BuiltEntity, "table" | "pk" | "ops" | "columns">> = {};
  for (const [name, e] of Object.entries(entities)) {
    descriptor[name] = { table: e.table, pk: e.pk, ops: e.ops, columns: e.columns };
  }

  // An App that fires nothing generates exactly what it generated before: no
  // EVENTS, no `events` key, no `db.events`. The feature stays invisible to
  // every App that does not use it.
  const hasEvents = Object.keys(events).length > 0;
  const eventsBlock = hasEvents
    ? `
/** Events this app fires itself (manifest events.emits[] with trigger: "app"). */
const EVENTS = ${JSON.stringify(events, null, 2)};

/** The routine Baseline generated for them. */
const EMIT_FN = ${JSON.stringify(emitFn)};
`
    : "";
  // CommonJS: revenexx App functions run on open-runtimes Node with a CJS
  // entrypoint (`module.exports = async (context) => …`), so the generated
  // client must be require()-able. @revenexx/app-sdk is a dual package, so the
  // require() resolves to its CJS build.
  return `// AUTO-GENERATED — do not edit by hand.
// Regenerate with: revenexx apps generate
'use strict';

const { createClient } = require(${JSON.stringify(runtimeModule)});

/** Entity descriptors derived from schema.json + manifest.permissions. */
const ENTITIES = ${JSON.stringify(descriptor, null, 2)};
${eventsBlock}
/**
 * Create the App's data client.
 *   local dev : createDb({ adapter: 'mock', seed: {...} })
 *   dev tenant: createDb({ adapter: 'remote', endpoint, token, tenant })
 *   production: createDb({ adapter: 'runtime', context })   // in the function
 */
function createDb(config = {}) {
  return createClient({ entities: ENTITIES,${hasEvents ? " events: { fn: EMIT_FN, declared: EVENTS }," : ""} ...config });
}

module.exports = { createDb, ENTITIES${hasEvents ? ", EVENTS, EMIT_FN" : ""} };
`;
}

function emitDts(entities: Record<string, BuiltEntity>, events: Record<string, BuiltEvent>): string {
  const blocks: string[] = [];
  const dbFields: string[] = [];

  for (const [name, e] of Object.entries(entities)) {
    const Type = pascal(name);
    const cols = Object.entries(e.columns);

    const rowFields = cols.map(([col, c]) => `  ${col}${c?.notNull ? "" : "?"}: ${tsType(c?.type)};`).join("\n");

    // create input: required = notNull AND no default AND not pk.
    const createFields = cols
      .map(([col, c]) => {
        const required = c?.notNull && c.default == null && !c.pk;
        return `  ${col}${required ? "" : "?"}: ${tsType(c?.type)};`;
      })
      .join("\n");

    const id = idTsType(e);
    const methods: string[] = [];
    if (e.ops.includes("list")) {
      methods.push(`  list(query?: Query<${Type}>): Promise<${Type}[]>;`);
      methods.push(`  page(query?: Query<${Type}>): Promise<Page<${Type}>>;`);
    }
    if (e.ops.includes("get")) methods.push(`  get(id: ${id}): Promise<${Type} | null>;`);
    if (e.ops.includes("create")) methods.push(`  create(data: ${Type}Create): Promise<${Type}>;`);
    if (e.ops.includes("update")) {
      methods.push(`  update(id: ${id}, patch: Partial<${Type}Create>): Promise<${Type}>;`);
      // Compare-and-set, gated by the same op. `Query['where']` rather than the
      // SDK's `Where` alias so the client also type-checks against an older SDK.
      methods.push(
        `  updateIf(id: ${id}, where: NonNullable<Query<${Type}>['where']>, patch: Partial<${Type}Create>): Promise<${Type} | null>;`,
      );
    }
    if (e.ops.includes("delete")) methods.push(`  delete(id: ${id}): Promise<void>;`);

    blocks.push(
      `export interface ${Type} {\n${rowFields}\n}\n\n` +
        `export interface ${Type}Create {\n${createFields}\n}\n\n` +
        `export interface ${Type}Client {\n${methods.join("\n")}\n}`,
    );
    dbFields.push(`  ${name}: ${Type}Client;`);
  }

  // Typing the event NAMES is the point: an undeclared one is then a compile
  // error, not a runtime one three lines into a scheduled job.
  const eventNames = Object.keys(events);
  const hasEvents = eventNames.length > 0;
  const eventsImport = hasEvents ? ", EmitOptions, EmitResult, EmittedEvent, EventDescriptor" : "";
  const eventUnion = eventNames.map((n) => JSON.stringify(n)).join(" | ");
  const eventsField = hasEvents ? "\n  events: AppEvents;" : "";
  const eventsBlock = hasEvents
    ? `
export type AppEventName = ${eventUnion};

export interface AppEvents {
  emit(name: AppEventName, data?: Record<string, unknown>, options?: EmitOptions): Promise<EmitResult>;
  /** What was emitted, for tests. Only the 'mock' adapter records. */
  emitted(): EmittedEvent[];
  readonly declared: Record<AppEventName, EventDescriptor>;
}

export declare const EVENTS: Record<AppEventName, EventDescriptor>;
export declare const EMIT_FN: string;
`
    : "";

  return `// AUTO-GENERATED — do not edit by hand.
import type { Query, Page${eventsImport} } from '@revenexx/app-sdk';

${blocks.join("\n\n")}
${eventsBlock}
export interface Db {
${dbFields.join("\n")}${eventsField}
}

export interface CreateDbConfig {
  adapter: 'mock' | 'remote' | 'runtime';
  seed?: Record<string, unknown[]>;
  endpoint?: string;
  token?: string;
  tenant?: string;
  context?: unknown;
}

export declare function createDb(config: CreateDbConfig): Db;
export declare const ENTITIES: Record<string, { table: string; pk: string; ops: string[]; columns: Record<string, unknown> }>;
`;
}

export const jsEmitter: Emitter = {
  target: "js",
  emit(input: EmitInput): EmittedFile[] {
    const runtimeModule = input.options.runtimeModule ?? "@revenexx/app-sdk";
    const emitFn = emitFnName(input.vendor, input.app);
    return [
      { path: "db.generated.js", content: emitJs(input.entities, input.events, emitFn, runtimeModule) },
      { path: "db.generated.d.ts", content: emitDts(input.entities, input.events) },
    ];
  },
};

/** A single-quoted PHP string literal. */
function phpString(value: string): string {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

/**
 * A JSON value as a PHP literal.
 *
 * Used for the declared `sample` and `data_schema`, which come out of the
 * manifest verbatim and can be arbitrarily nested. Emitted as PHP arrays rather
 * than a json_decode() at runtime, so a malformed value is a parse error in the
 * generated file instead of a null discovered on the first call.
 */
function phpValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return phpString(value);
  if (typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(phpValue).join(", ")}]`;
  const entries = Object.entries(value as Record<string, unknown>);
  return `[${entries.map(([k, v]) => `${phpString(k)} => ${phpValue(v)}`).join(", ")}]`;
}

/** PHP literal for a column's default, or a zero-value when none applies. */
function phpDefault(col: ColumnDef): { nullable: boolean; expr: string } {
  const isNullable = !col.notNull || !!col.pk;
  if (isNullable) return { nullable: true, expr: "null" };

  const d = col.default;
  if (d != null) {
    const m = /^'(.*)'$/.exec(String(d).trim());
    if (m) return { nullable: false, expr: `'${m[1]!.replace(/'/g, "\\'")}'` };
  }
  // notNull with a server-side / no literal default → zero value.
  const t = phpType(col.type);
  const zero = t === "int" ? "0" : t === "float" ? "0.0" : t === "bool" ? "false" : t === "array" ? "[]" : "''";
  return { nullable: false, expr: zero };
}

function dtoClass(name: string, entity: BuiltEntity): string {
  const Type = pascal(name);
  const props: string[] = [];
  const fromRow: string[] = [];
  for (const [col, c] of Object.entries(entity.columns)) {
    const { nullable: isNullable, expr } = phpDefault(c);
    const t = (isNullable ? "?" : "") + phpType(c.type);
    props.push(`        public readonly ${t} $${col} = ${expr},`);
    fromRow.push(`            ${col}: $row['${col}'] ?? ${expr},`);
  }
  return `/**
 * Row of the \`${entity.table}\` table.
 */
final class ${Type}
{
    public function __construct(
${props.join("\n")}
    ) {
    }

    /** @param array<string, mixed> $row */
    public static function fromRow(array $row): self
    {
        return new self(
${fromRow.join("\n")}
        );
    }
}`;
}

function repositoryClass(name: string, entity: BuiltEntity): string {
  const Type = pascal(name);
  const idT = phpType(entity.columns[entity.pk]?.type ?? "text") === "int" ? "int" : "string";
  const methods: string[] = [];

  if (entity.ops.includes("list")) {
    methods.push(`    /**
     * @param array<string, mixed> $query
     * @return ${Type}[]
     */
    public function list(array $query = []): array
    {
        return array_map([${Type}::class, 'fromRow'], $this->client->list($this->entity, $query));
    }`);
  }
  if (entity.ops.includes("get")) {
    methods.push(`    public function get(${idT} $id): ?${Type}
    {
        $row = $this->client->get($this->entity, $id);

        return $row === null ? null : ${Type}::fromRow($row);
    }`);
  }
  if (entity.ops.includes("create")) {
    methods.push(`    /** @param array<string, mixed> $data */
    public function create(array $data): ${Type}
    {
        return ${Type}::fromRow($this->client->create($this->entity, $data));
    }`);
  }
  if (entity.ops.includes("update")) {
    methods.push(`    /** @param array<string, mixed> $patch */
    public function update(${idT} $id, array $patch): ${Type}
    {
        return ${Type}::fromRow($this->client->update($this->entity, $id, $patch));
    }`);
    methods.push(`    /**
     * Update only if the row still matches $where; null when no row matched.
     *
     * @param array<string, mixed> $where
     * @param array<string, mixed> $patch
     */
    public function updateIf(${idT} $id, array $where, array $patch): ?${Type}
    {
        $row = $this->client->updateIf($this->entity, $id, $where, $patch);

        return $row === null ? null : ${Type}::fromRow($row);
    }`);
  }
  if (entity.ops.includes("delete")) {
    methods.push(`    public function delete(${idT} $id): void
    {
        $this->client->remove($this->entity, $id);
    }`);
  }

  return `/**
 * Typed gateway for the \`${name}\` entity. Only the methods permitted by
 * manifest.permissions are emitted.
 */
final class ${Type}Repository
{
    public function __construct(
        private readonly Client $client,
        private readonly Entity $entity,
    ) {
    }

${methods.join("\n\n")}
}`;
}

function entityFactory(name: string, entity: BuiltEntity): string {
  const cols = JSON.stringify(entity.columns);
  const ops = entity.ops.map((o) => `'${o}'`).join(", ");
  return `            '${name}' => new Entity(
                name: '${name}',
                table: '${entity.table}',
                pk: '${entity.pk}',
                columns: json_decode('${cols.replace(/'/g, "\\'")}', true),
                ops: [${ops}],
            ),`;
}

export const phpEmitter: Emitter = {
  target: "php",
  emit(input: EmitInput): EmittedFile[] {
    const ns = input.options.phpNamespace ?? `Revenexx\\${pascal(slug(input.app))}`;
    const names = Object.keys(input.entities);

    const dtos = names.map((n) => dtoClass(n, input.entities[n]!)).join("\n\n");
    const repos = names.map((n) => repositoryClass(n, input.entities[n]!)).join("\n\n");
    const dbProps = names.map((n) => `    public readonly ${pascal(n)}Repository $${n};`).join("\n");
    const dbWire = names.map((n) => `        $this->${n} = new ${pascal(n)}Repository($client, $client->entity('${n}'));`).join("\n");
    const factories = names.map((n) => entityFactory(n, input.entities[n]!)).join("\n");

    // Same rule as the JS emitter: an App that fires nothing generates exactly
    // what it generated before.
    const eventNames = Object.keys(input.events);
    const hasEvents = eventNames.length > 0;
    const emitFn = emitFnName(input.vendor, input.app);
    const eventUse = hasEvents ? "use Revenexx\\AppSdk\\EventDescriptor;\nuse Revenexx\\AppSdk\\Events;\n" : "";
    const eventFactories = eventNames
      .map((n) => {
        const e = input.events[n]!;
        const args = [`topic: ${phpString(e.topic)}`];
        if (e.sample) args.push(`sample: ${phpValue(e.sample)}`);
        if (e.schema) args.push(`schema: ${phpValue(e.schema)}`);
        return `            ${phpString(n)} => new EventDescriptor(${args.join(", ")}),`;
      })
      .join("\n");
    const eventsBlock = hasEvents
      ? `
    /**
     * Fire one of this App's own declared events.
     *
     *   $db->events()->emit('stock.low', ['sku' => $sku], ['topicId' => $sku]);
     */
    public function events(): Events
    {
        return $this->client->events();
    }

    /** The routine Baseline generated for this App's own events. */
    public const EMIT_FN = ${phpString(emitFn)};

    /**
     * Events this App fires itself (manifest events.emits[] with trigger: "app").
     *
     * Named apart from events() on purpose: this is the declaration, that is
     * the client you fire through.
     *
     * @return array<string, EventDescriptor>
     */
    public static function declaredEvents(): array
    {
        return [
${eventFactories}
        ];
    }
`
      : "";
    const clientArgs = hasEvents
      ? "AdapterRegistry::create($adapter, $config), self::entities(), self::EMIT_FN, self::declaredEvents()"
      : "AdapterRegistry::create($adapter, $config), self::entities()";

    const content = `<?php

// AUTO-GENERATED — do not edit by hand.
// Regenerate with: revenexx apps generate --target php

declare(strict_types=1);

namespace ${ns};

use Revenexx\\AppSdk\\AdapterRegistry;
use Revenexx\\AppSdk\\Client;
use Revenexx\\AppSdk\\Entity;
${eventUse}
${dtos}

${repos}

/**
 * The App's data client.
 *   local dev : Db::create('mock', ['seed' => [...]])
 *   dev tenant: Db::create('remote', ['endpoint' => ..., 'token' => ..., 'tenant' => ...])
 */
final class Db
{
${dbProps}${hasEvents ? "\n\n    private readonly Client $client;" : ""}

    private function __construct(Client $client)
    {
${dbWire}${hasEvents ? "\n        $this->client = $client;" : ""}
    }

    /** @param array<string, mixed> $config */
    public static function create(string $adapter, array $config = []): self
    {
        return new self(new Client(${clientArgs}));
    }

    /** @return array<string, Entity> */
    public static function entities(): array
    {
        return [
${factories}
        ];
    }
${eventsBlock}}
`;
    return [{ path: "Db.php", content }];
  },
};

registerEmitter(jsEmitter);
registerEmitter(phpEmitter);

// ---------------------------------------------------------------------------
// generate.ts — read schema.json + manifest.json, emit a client
// ---------------------------------------------------------------------------

export interface GenerateOptions {
  schemaPath: string;
  manifestPath: string;
  outDir: string;
  target?: string;
  runtimeModule?: string;
  phpNamespace?: string;
  vendor?: string;
  app?: string;
}

export interface GenerateResult {
  target: string;
  outDir: string;
  files: string[];
  entities: string[];
  /** The App's own events, so `generate` can report what it wired. */
  events: string[];
}

/** Read schema.json + manifest.json and emit a client for the chosen target. */
export function generateClient(opts: GenerateOptions): GenerateResult {
  const schema = JSON.parse(fs.readFileSync(opts.schemaPath, "utf8")) as Schema;
  const manifest = JSON.parse(fs.readFileSync(opts.manifestPath, "utf8")) as Manifest;

  const vendor = opts.vendor ?? manifest.vendor;
  const app = opts.app ?? manifest.name;
  if (!vendor || !app) {
    throw new Error("generate: vendor/app missing (pass --vendor/--app or set them in the manifest)");
  }

  const entities = buildEntities({ schema, permissions: manifest.permissions ?? [], vendor, app });
  if (Object.keys(entities).length === 0) {
    throw new Error("generate: schema.json declares no entities");
  }

  const events = buildEvents({ manifest, vendor, app });

  const target = opts.target ?? "js";
  const emitter = getEmitter(target);
  const emitted = emitter.emit({
    vendor,
    app,
    entities,
    events,
    options: { runtimeModule: opts.runtimeModule, phpNamespace: opts.phpNamespace },
  });

  fs.mkdirSync(opts.outDir, { recursive: true });
  const files: string[] = [];
  for (const f of emitted) {
    const p = path.join(opts.outDir, f.path);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, f.content);
    files.push(p);
  }

  return { target, outDir: opts.outDir, files, entities: Object.keys(entities), events: Object.keys(events) };
}
