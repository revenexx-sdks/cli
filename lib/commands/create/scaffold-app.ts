/**
 * `revenexx create app` — stamp a complete, deployable platform app.
 *
 * The skeleton follows the app contract of the canonical `inventories`
 * reference app: manifest.json (capabilities stripped out) +
 * manifest.capabilities.json + schema.json + billing.json + cockpit.json +
 * CJS function entrypoint + node:test suite with the in-memory PostgREST
 * harness. The typed data client (src/db.generated.js) and the capability
 * register are generated in-process at scaffold time, so the result is
 * immediately `npm test`-green.
 */
import fs from "node:fs";
import path from "node:path";
import {
  buildCapabilities,
  buildEntities,
  entitySchema,
  jsEmitter,
  slug,
  type Capability,
  type ColumnDef,
  type Schema,
} from "./appsdk-core.js";

export interface AppScaffoldOptions {
  name: string;
  title: string;
  description: string;
  vendor: string;
  entities: string[];
  dir: string;
  appSdkVersion: string;
  schemasBase: string;
}

export interface ScaffoldedFile {
  path: string;
  bytes: number;
}

export interface ScaffoldResult {
  root: string;
  files: ScaffoldedFile[];
  warnings: string[];
  nextSteps: string[];
}

/**
 * Names that are reserved words in at least one language the platform stack
 * touches (SQL, JS, PHP, TS). A column literally named `public` broke a
 * production app — refuse them at scaffold time instead.
 */
const RESERVED_NAMES = new Set([
  "public", "private", "protected", "abstract", "final", "static",
  "order", "user", "group", "select", "table", "check", "primary",
  "references", "default", "limit", "offset", "grant", "function",
  "class", "return", "new", "switch", "case", "var", "let", "const",
  "enum", "interface", "package", "import", "export", "null", "true", "false",
]);

const NAME_RE = /^[a-z][a-z0-9-]*$/;
const ENTITY_RE = /^[a-z][a-z0-9_]*$/;
const EVENT_RE = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;
const SUMMARY_MAX = 255;

export function validateAppName(name: string): string | null {
  if (!NAME_RE.test(name)) return `app name '${name}' must match ${NAME_RE} (lowercase, digits, dashes)`;
  if (RESERVED_NAMES.has(name)) return `app name '${name}' is a reserved word in one of the stack's languages`;
  return null;
}

export function validateEntityName(entity: string): string | null {
  if (!ENTITY_RE.test(entity)) return `entity '${entity}' must match ${ENTITY_RE} (lowercase snake_case)`;
  if (RESERVED_NAMES.has(entity)) return `entity '${entity}' is a reserved word in one of the stack's languages`;
  return null;
}

/** Naive singular for event names: entities are plural by convention. */
function singular(entity: string): string {
  if (entity.endsWith("ies")) return entity.slice(0, -3) + "y";
  if (entity.endsWith("ses")) return entity.slice(0, -2);
  if (entity.endsWith("s")) return entity.slice(0, -1);
  return entity;
}

/** The starter column set for a scaffolded entity. */
function starterColumns(): Record<string, ColumnDef> {
  return {
    id: { type: "uuid", pk: true, default: "gen_random_uuid()" },
    name: { type: "text", notNull: true, check: "length(name) > 0" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamptz", notNull: true, default: "now()" },
    updated_at: { type: "timestamptz", notNull: true, default: "now()" },
  };
}

function buildSchemaJson(entities: string[], schemasBase: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const entity of entities) {
    out[entity] = {
      scopeable: ["market"],
      columns: starterColumns(),
      indexes: [{ columns: ["tenant_id", "name"] }],
    };
  }
  return { $schema: `${schemasBase}/schema.schema.json`, entities: out };
}

function buildManifestJson(opts: AppScaffoldOptions): Record<string, unknown> {
  return {
    $schema: "https://revenexx.com/schemas/manifest.schema.json",
    name: opts.name,
    vendor: opts.vendor,
    version: "0.1.0",
    title: opts.title,
    type: "public",
    description: opts.description,
    permissions: opts.entities.map((entity) => ({
      entity,
      access: ["read", "create", "update", "delete"],
    })),
    events: {
      emits: opts.entities.map((entity) => ({
        name: `${singular(entity)}.created`,
        entity,
        on: ["insert"],
      })),
      listens: ["app.installed", "app.uninstalled"],
    },
  };
}

function buildBillingJson(opts: AppScaffoldOptions): Record<string, unknown> {
  return {
    $schema: "https://revenexx.com/schemas/billing.schema.json",
    type: "included",
    support: { email: "support@revenexx.com", url: "https://revenexx.com/support" },
    categories: ["commerce"],
    available_countries: ["*"],
    listing: {
      longDescription: `# ${opts.title}\n\n${opts.description}`,
      highlights: opts.entities.map((e) => `Manage ${e}`),
      features: opts.entities.map((e) => ({
        title: capitalize(e),
        description: `Create, list, update and delete ${e}.`,
        icon: "box",
      })),
      scopes: [
        { scope: `${opts.name}.read`, reason: `Read ${opts.name} data in the storefront.` },
        { scope: `${opts.name}.write`, reason: `Manage ${opts.name} data from the Cockpit.` },
      ],
      publisher: { name: opts.vendor, kind: opts.vendor === "revenexx" ? "revenexx" : "partner", verified: opts.vendor === "revenexx", website: "https://revenexx.com" },
      languages: ["de", "en"],
      compatibility: { min_platform_version: "1.0.0" },
    },
  };
}

function buildCockpitJson(opts: AppScaffoldOptions): Record<string, unknown> {
  return {
    $schema: "https://revenexx.com/schemas/cockpit.schema.json",
    navigation: [
      {
        label: opts.title,
        icon: "box",
        route: `/${opts.name}/${opts.entities[0]}`,
        position: 50,
        group: "order-management",
      },
    ],
    views: opts.entities.map((entity) => ({
      route: `/${opts.name}/${entity}`,
      type: "list",
      title: capitalize(entity),
      entity,
      columns: [
        { name: "name", label: "Name", type: "text", width: "280px", sortable: true },
        { name: "created_at", label: "Created", type: "datetime", width: "180px", sortable: true },
      ],
    })),
  };
}

function buildPackageJson(opts: AppScaffoldOptions): Record<string, unknown> {
  return {
    name: opts.name,
    version: "0.1.0",
    description: opts.description,
    main: "src/main.js",
    scripts: {
      start: "node src/main.js",
      test: "node --test",
      capabilities: "node scripts/capabilities.js",
    },
    engines: { node: ">=22" },
    dependencies: { "@revenexx/app-sdk": opts.appSdkVersion },
    license: "MIT",
    private: true,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

// ---------------------------------------------------------------------------
// Embedded source templates. IMPORTANT: the embedded JS below deliberately
// avoids backticks and ${} so it nests safely inside these template literals.
// ---------------------------------------------------------------------------

function mainJs(opts: AppScaffoldOptions): string {
  const mounts = opts.entities
    .map(
      (entity) => `    mountCrud(app, db.${entity}, {
        path: '/${opts.name}/${entity}',
        columns: ENTITIES.${entity}.columns,
    });`,
    )
    .join("\n\n");

  const routesDoc = opts.entities
    .map((entity) => ` *   GET/POST/PUT/DELETE /${opts.name}/${entity}[/{id}]`)
    .join("\n");

  return `/**
 * ${opts.title} App function entrypoint.
 *
 * ${opts.description}
 *
${routesDoc}
 *   GET                 /                  health + routes
 *
 * Scaffolded by 'revenexx create app'. Grow it the inventories way: add
 * action routes next to the CRUD mounts, keep every route under the
 * /${opts.name}/ namespace, and re-run 'npm run capabilities' after every
 * schema.json or route change.
 */
'use strict';

const { createApp, mountCrud, badRequest } = require('@revenexx/app-sdk/router');
const { createDb, ENTITIES } = require('./db.generated');

/**
 * Idempotent per-tenant seeding — runs on the app.installed lifecycle event.
 * Add default rows here (see the inventories app's DEFAULT_LOCATIONS for a
 * worked example); keep it safe to run twice.
 */
async function ensureDefaults(db) {
    return { created: [], existing: [] };
}

function buildApp(db) {
    const app = createApp({
        name: '${opts.name}',
        healthExtra: () => ({ entities: Object.keys(ENTITIES) }),
    });

${mounts}

    return app;
}

module.exports = async (context) => {
    const { req, res } = context;
    const headers = req.headers || {};
    const jwt = headers['x-revenexx-context'] ?? headers['X-Revenexx-Context'] ?? '';
    const path = (String(req.path || '/').replace(/\\/+$/, '')) || '/';

    const trigger = headers['x-revenexx-trigger'] ?? '';
    const event = headers['x-revenexx-event'] ?? '';
    if (trigger === 'event' && jwt) {
        const db = createDb({ adapter: 'runtime', context });
        if (/(^|\\.)installed$/.test(event)) {
            const result = await ensureDefaults(db);
            return res.json({ event, ...result });
        }
        return res.json({ event, ignored: true });
    }

    if (path !== '/' && !jwt) {
        return res.json({ error: 'missing tenant identity — this route needs the x-revenexx-context header' }, 503);
    }

    const db = createDb({ adapter: 'runtime', context });
    return buildApp(db).handler()(context);
};

module.exports.buildApp = buildApp;
module.exports.ensureDefaults = ensureDefaults;
`;
}

function capabilitiesScript(opts: AppScaffoldOptions): string {
  return `#!/usr/bin/env node
/**
 * Regenerates manifest.capabilities.json (and strips the capability register
 * out of manifest.json) from schema.json. Run after changing schema.json or
 * the routes:
 *
 *   npm run capabilities        (or: revenexx apps capabilities --write)
 *
 * Hand-written capabilities with keys this generator does not emit are
 * preserved — including their cache blocks. If you add a gateway cache to a
 * GENERATED capability, declare it in this script, not in the JSON: a
 * manifest-only cache block is silently clobbered by the next regen.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const schema = JSON.parse(fs.readFileSync(path.join(root, 'schema.json'), 'utf8'));
const manifestPath = path.join(root, 'manifest.json');
const capabilitiesPath = path.join(root, 'manifest.capabilities.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const APP = manifest.name;
const VERSION = '1.0.0';

function columnSchema(col) {
    const nullable = !col.pk && !col.notNull;
    const wrap = (t, extra = {}) => ({ type: nullable ? [t, 'null'] : t, ...extra });
    const base = col.type.replace(/\\(.*\\)$/, '');
    switch (base) {
        case 'uuid': return wrap('string', { format: 'uuid' });
        case 'text': return wrap('string');
        case 'boolean': return wrap('boolean');
        case 'integer': case 'bigint': case 'smallint': return wrap('integer');
        case 'numeric': case 'real': case 'double precision': return wrap('number');
        case 'timestamptz': case 'timestamp': return wrap('string', { format: 'date-time' });
        case 'date': return wrap('string', { format: 'date' });
        case 'jsonb': case 'json': return { type: nullable ? ['object', 'null'] : 'object' };
        default: return wrap('string');
    }
}

function entityItem(entity) {
    const title = entity.replace(/(^|_)([a-z])/g, (m, p, c) => c.toUpperCase());
    return {
        title,
        type: 'object',
        properties: Object.fromEntries(
            Object.entries(schema.entities[entity].columns).map(([name, col]) => [name, columnSchema(col)]),
        ),
    };
}

const PAGE = {
    type: 'object',
    properties: {
        limit: { type: 'integer' }, offset: { type: 'integer' }, total: { type: 'integer' },
        returned: { type: 'integer' }, hasMore: { type: 'boolean' },
    },
};
const pageOf = (item) => ({ type: 'object', properties: { items: { type: 'array', items: item }, page: PAGE } });

const qParam = (name, paramSchema, description) => ({ name, in: 'query', required: false, schema: paramSchema, description });
const PAGINATION_PARAMS = [
    qParam('limit', { type: 'integer', minimum: 1, maximum: 200 }, 'Page size (default 50, max 200).'),
    qParam('offset', { type: 'integer', minimum: 0 }, 'Row offset for pagination (default 0).'),
    qParam('order', { type: 'string' }, "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'."),
];

const DELETED = { type: 'object', properties: { deleted: { type: 'boolean' }, id: { type: 'string' } } };
const INPUT = { type: 'object' };

function crud(entity) {
    const item = entityItem(entity);
    const base = '/' + APP + '/' + entity;
    const cap = (op) => APP + '.' + entity + '.' + op;
    return [
        { type: 'define', capability: cap('list'), version: VERSION, summary: 'List ' + entity + ' (filter by column; paginate limit/offset/order)', route: { method: 'GET', path: base }, parameters: PAGINATION_PARAMS, response: pageOf(item) },
        { type: 'define', capability: cap('get'), version: VERSION, summary: 'Read one ' + entity + ' by id', route: { method: 'GET', path: base + '/{id}' }, response: item },
        { type: 'define', capability: cap('create'), version: VERSION, summary: 'Create a ' + entity, route: { method: 'POST', path: base }, request: INPUT, response: item },
        { type: 'define', capability: cap('update'), version: VERSION, summary: 'Update a ' + entity + ' by id', route: { method: 'PUT', path: base + '/{id}' }, request: INPUT, response: item },
        { type: 'define', capability: cap('delete'), version: VERSION, summary: 'Delete a ' + entity + ' by id', route: { method: 'DELETE', path: base + '/{id}' }, response: DELETED },
    ];
}

const permitted = (manifest.permissions ?? [])
    .filter((p) => typeof p.entity === 'string')
    .map((p) => p.entity)
    .filter((entity) => schema.entities[entity]);

const generated = permitted.flatMap(crud);

for (const cap of generated) {
    if (cap.summary.length > 255) {
        console.error('capability summary exceeds 255 chars: ' + cap.capability);
        process.exit(1);
    }
}

// Merge: generated entries replace same-key entries, hand-written ones stay.
let existing = [];
try { existing = JSON.parse(fs.readFileSync(capabilitiesPath, 'utf8')); } catch { /* first run */ }
const genKeys = new Set(generated.map((c) => c.capability));
const kept = existing.filter((c) => typeof c.capability !== 'string' || !genKeys.has(c.capability));
const merged = [...kept, ...generated];

fs.writeFileSync(capabilitiesPath, JSON.stringify(merged, null, 2) + '\\n');

// manifest.json carries everything EXCEPT the capability register — the
// platform splices manifest.capabilities.json back in before validation.
delete manifest.capabilities;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\\n');

console.log('wrote ' + merged.length + ' capabilities for [' + permitted.join(', ') + ']');
`;
}

function testJs(opts: AppScaffoldOptions): string {
  const first = opts.entities[0];
  return `'use strict';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const handler = require('../src/main');

// Minimal in-memory PostgREST keyed by table, wired in via global fetch —
// the same harness every platform app uses (copied from the inventories
// reference app; keep it verbatim).
let tables = {};

function fakePostgrest(url, opts) {
    const u = new URL(url);
    const table = u.pathname.split('/').filter(Boolean).pop();
    tables[table] ??= [];
    const store = tables[table];
    const method = opts.method || 'GET';
    const body = opts.body ? JSON.parse(opts.body) : null;
    const idEq = (u.searchParams.get('id') || '').replace(/^eq\\./, '');
    const ok = (rows, total) => ({
        ok: true,
        status: 200,
        headers: { get: (h) => (h.toLowerCase() === 'content-range' && total != null ? '0-' + Math.max(rows.length - 1, 0) + '/' + total : null) },
        text: async () => JSON.stringify(rows),
    });

    if (method === 'GET') {
        let rows = store.slice();
        for (const [k, v] of u.searchParams) {
            if (['select', 'order', 'limit', 'offset'].includes(k)) continue;
            if (v.startsWith('eq.')) rows = rows.filter((r) => String(r[k]) === v.slice(3));
        }
        const total = rows.length;
        const order = u.searchParams.get('order');
        if (order) {
            const [c, dir = 'asc'] = order.split('.');
            rows.sort((a, b) => (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0));
            if (dir === 'desc') rows.reverse();
        }
        const offset = parseInt(u.searchParams.get('offset') || '0', 10);
        const limit = u.searchParams.get('limit') ? parseInt(u.searchParams.get('limit'), 10) : undefined;
        rows = rows.slice(offset, limit !== undefined ? offset + limit : undefined);
        return ok(rows, total);
    }
    if (method === 'POST') {
        const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), tenant_id: 'acme', ...body };
        store.push(row);
        return ok([row]);
    }
    if (method === 'PATCH') {
        const i = store.findIndex((r) => r.id === idEq);
        store[i] = { ...store[i], ...body };
        return ok([store[i]]);
    }
    if (method === 'DELETE') {
        tables[table] = store.filter((r) => r.id !== idEq);
        return { ok: true, status: 204, headers: { get: () => null }, text: async () => '' };
    }
    return { ok: false, status: 500, headers: { get: () => null }, text: async () => 'unhandled' };
}

function jwt(claims) {
    const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    return b({ alg: 'RS256' }) + '.' + b(claims) + '.sig';
}

function call(method, path, { query = {}, body = null, headers = {} } = {}) {
    let captured;
    const ctx = {
        req: {
            method,
            path,
            query,
            body,
            headers: {
                'x-revenexx-context': jwt({ sub: 'svc', tenant_id: 'acme' }),
                'x-revenexx-tenant': 'acme',
                ...headers,
            },
        },
        res: { json: (b, code = 200) => { captured = { body: b, code }; return captured; } },
        log: () => {},
        error: () => {},
    };
    return handler(ctx).then(() => captured);
}

beforeEach(() => {
    tables = {};
    globalThis.fetch = fakePostgrest;
    process.env.REVENEXX_DATA_ENDPOINT = 'https://apps.api.revenexx.test/';
});
afterEach(() => { delete process.env.REVENEXX_DATA_ENDPOINT; });

// ---------------------------------------------------------------------------

test('health lists the app entities', async () => {
    const r = await call('GET', '/', { headers: { 'x-revenexx-context': '' } });
    assert.deepEqual(r.body.entities, ${JSON.stringify(opts.entities)});
});

test('routes without tenant identity answer 503', async () => {
    const r = await call('GET', '/${opts.name}/${first}', { headers: { 'x-revenexx-context': '' } });
    assert.equal(r.code, 503);
});

test('app.installed lifecycle event runs ensureDefaults', async () => {
    const r = await call('POST', '/', { headers: { 'x-revenexx-trigger': 'event', 'x-revenexx-event': 'apps.[fn].installed' } });
    assert.deepEqual(r.body.created, []);
});

test('${first}: full CRUD roundtrip', async () => {
    const created = await call('POST', '/${opts.name}/${first}', { body: { name: 'First' } });
    assert.ok(created.code < 300, 'create should succeed, got ' + created.code);
    const id = created.body.id ?? created.body.item?.id;
    assert.ok(id, 'create should return the new row id');

    const listed = await call('GET', '/${opts.name}/${first}');
    const items = listed.body.items ?? listed.body;
    assert.equal(items.length, 1);
    assert.equal(items[0].name, 'First');

    const updated = await call('PUT', '/${opts.name}/${first}/' + id, { body: { name: 'Renamed' } });
    assert.ok(updated.code < 300, 'update should succeed, got ' + updated.code);

    const removed = await call('DELETE', '/${opts.name}/${first}/' + id);
    assert.ok(removed.code < 300, 'delete should succeed, got ' + removed.code);

    const after = await call('GET', '/${opts.name}/${first}');
    const remaining = after.body.items ?? after.body;
    assert.equal(remaining.length, 0);
});
`;
}

function readmeMd(opts: AppScaffoldOptions): string {
  const entityList = opts.entities.map((e) => `- \`${e}\` — CRUD under \`/${opts.name}/${e}\``).join("\n");
  return `# ${opts.title}

${opts.description}

Scaffolded with \`revenexx create app\`. Entities:

${entityList}

## Layout

| File | Purpose |
|---|---|
| \`manifest.json\` | App identity, permissions, events (capabilities live next door) |
| \`manifest.capabilities.json\` | Generated capability register — never edit by hand |
| \`schema.json\` | Entity definitions → tables \`${slug(opts.vendor)}__${slug(opts.name)}__{entity}\` |
| \`src/main.js\` | Function entrypoint (CJS, open-runtimes) |
| \`src/db.generated.js\` | Typed data client — regenerate, do not edit |
| \`scripts/capabilities.js\` | Regenerates the capability register from schema.json |
| \`cockpit.json\` | Admin UI: navigation + list views |
| \`billing.json\` | Marketplace listing + pricing |

## Development loop

\`\`\`bash
npm install
npm test                      # node:test against the in-memory PostgREST harness

# after ANY schema.json or route change:
npm run capabilities          # regenerate manifest.capabilities.json
revenexx apps generate        # regenerate src/db.generated.js
npm test
\`\`\`

## Ship it

\`\`\`bash
revenexx deploy app           # register if new, upload, build, publish + install
\`\`\`

For continuous deploys, push the repo to GitHub and wire it to the platform
function via the VCS connector — the \`revenexx-app-builder\` skill (agent
skill) documents the full pipeline and the live E2E definition of done
against the gateway.

Hard rules (enforced by the scaffold, keep them true):

- Every route stays under the \`/${opts.name}/\` namespace, params lowercase.
- Capability summaries ≤ 255 chars; event names exactly two dot-segments.
- Plain CommonJS — no TypeScript, no build step, no secrets in the repo.
`;
}

// ---------------------------------------------------------------------------
// The scaffolder
// ---------------------------------------------------------------------------

function writeFile(root: string, rel: string, content: string, files: ScaffoldedFile[], mode?: number): void {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, mode !== undefined ? { mode } : undefined);
  files.push({ path: rel, bytes: Buffer.byteLength(content) });
}

const json = (value: unknown): string => JSON.stringify(value, null, 2) + "\n";

export function scaffoldApp(opts: AppScaffoldOptions): ScaffoldResult {
  const nameError = validateAppName(opts.name);
  if (nameError) throw new Error(nameError);
  if (opts.entities.length === 0) throw new Error("at least one entity is required");
  for (const entity of opts.entities) {
    const entityError = validateEntityName(entity);
    if (entityError) throw new Error(entityError);
  }

  const warnings: string[] = [];
  if (opts.description.length > SUMMARY_MAX) {
    warnings.push(`description is ${opts.description.length} chars — Marketplace listings read better short`);
  }
  for (const entity of opts.entities) {
    const eventName = `${singular(entity)}.created`;
    if (!EVENT_RE.test(eventName)) {
      throw new Error(`derived event name '${eventName}' is invalid — rename the entity`);
    }
  }

  const root = path.resolve(opts.dir, opts.name);
  if (fs.existsSync(root) && fs.readdirSync(root).length > 0) {
    throw new Error(`target directory ${root} already exists and is not empty`);
  }

  const files: ScaffoldedFile[] = [];
  const schemaJson = buildSchemaJson(opts.entities, opts.schemasBase) as unknown as Schema & Record<string, unknown>;
  const manifest = buildManifestJson(opts);

  // The static contract files.
  writeFile(root, "schema.json", json(schemaJson), files);
  writeFile(root, "manifest.json", json(manifest), files);
  writeFile(root, "billing.json", json(buildBillingJson(opts)), files);
  writeFile(root, "cockpit.json", json(buildCockpitJson(opts)), files);
  writeFile(root, "package.json", json(buildPackageJson(opts)), files);
  writeFile(root, ".gitignore", "node_modules/\n", files);
  writeFile(root, "README.md", readmeMd(opts), files);
  writeFile(root, "src/main.js", mainJs(opts), files);
  writeFile(root, "scripts/capabilities.js", capabilitiesScript(opts), files, 0o755);
  writeFile(root, `test/${opts.name}.test.js`, testJs(opts), files);

  // The generated capability register — same output the app's own
  // scripts/capabilities.js produces, so a re-run is a no-op.
  const permissions = manifest.permissions as Array<Record<string, unknown>>;
  const capabilities: Capability[] = buildCapabilities({
    schema: schemaJson,
    permissions,
    version: "1.0.0",
    appPrefix: opts.name,
  });
  writeFile(root, "manifest.capabilities.json", json(capabilities), files);

  // The typed data client, emitted in-process (what `revenexx apps generate`
  // would produce).
  const entities = buildEntities({ schema: schemaJson, permissions, vendor: opts.vendor, app: opts.name });
  for (const emitted of jsEmitter.emit({ vendor: opts.vendor, app: opts.name, entities, options: {} })) {
    writeFile(root, path.join("src", emitted.path), emitted.content, files);
  }

  // Keep the titled schemas in sync guard: entitySchema must resolve for
  // every permitted entity (catches schema/permissions drift at scaffold time).
  for (const entity of opts.entities) {
    entitySchema(entity, (schemaJson.entities as Record<string, { columns?: Record<string, ColumnDef> }>)[entity]?.columns ?? {});
  }

  return {
    root,
    files,
    warnings,
    nextSteps: [
      `cd ${path.relative(process.cwd(), root) || "."}`,
      "npm install && npm test",
      "edit schema.json, then: npm run capabilities && revenexx apps generate",
      "revenexx deploy app            # register if new, upload, build, publish + install",
      `gh repo create revenexx-apps/${opts.name} --private --source . --remote origin --push   # optional: VCS-wired deploys`,
      "install the revenexx-app-builder agent skill for the full pipeline (revenexx skills add)",
    ],
  };
}
