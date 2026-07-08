/**
 * `revenexx create theme` — stamp a complete, deployable Blokkli theme.
 *
 * The skeleton follows the theme contract of the canonical `sample-theme`
 * reference (ADR-0061/0062): theme.json + billing.json + a minimal Nuxt SSR
 * storefront with the multi-tenant-safe context pattern, plus the pieces the
 * reference is missing but the contract needs (icon.svg — theme.json points
 * at it) and the hard-won build defaults (heap headroom for the platform
 * build container, lightningcss binaries for the linux build image).
 */
import fs from "node:fs";
import path from "node:path";

export interface ThemeScaffoldOptions {
  name: string;
  title: string;
  description: string;
  vendor: string;
  billingType: "free" | "included";
  dir: string;
  schemasBase: string;
}

export interface ScaffoldedFile {
  path: string;
  bytes: number;
}

export interface ThemeScaffoldResult {
  root: string;
  files: ScaffoldedFile[];
  warnings: string[];
  nextSteps: string[];
}

const NAME_RE = /^[a-z][a-z0-9-]*$/;

export function validateThemeName(name: string): string | null {
  if (!NAME_RE.test(name)) return `theme name '${name}' must match ${NAME_RE} (lowercase, digits, dashes)`;
  return null;
}

function themeJson(opts: ThemeScaffoldOptions): Record<string, unknown> {
  return {
    $schema: `${opts.schemasBase}/theme.schema.json`,
    kind: "theme",
    engine: "blokkli",
    name: opts.name,
    vendor: opts.vendor,
    version: "0.1.0",
    title: opts.title,
    description: opts.description,
    icon: "icon.svg",
    type: "public",
    site: {
      framework: "nuxt",
      adapter: "ssr",
      installCommand: "npm install",
      buildCommand: "npm run build",
      outputDirectory: ".output",
      domains: ["{{tenant_domain}}"],
    },
    requires: [
      {
        capability: "products.list",
        compatible: "^1.0",
        reason: "renders the product grid on the storefront home page",
      },
    ],
    permissions: [
      { capability: "products.list", compatible: "^1.0" },
      { entity: "pages", access: ["read"] },
      { storage: "theme-media", access: ["read"] },
    ],
    blokkli: {
      blocks: [
        {
          id: "hero",
          title: "Hero",
          description: "Full-width hero banner with headline, subline, and a call-to-action.",
        },
        {
          id: "product-grid",
          title: "Product Grid",
          description: "Renders products from the products.list capability. Options: columns, category filter, sort.",
          requiresCapability: "products.list",
        },
        {
          id: "rich-text",
          title: "Rich Text",
          description: "A WYSIWYG text block for editorial content.",
        },
      ],
      presets: [
        {
          id: "home",
          title: "Home page",
          blocks: ["hero", "product-grid", "rich-text"],
        },
      ],
    },
  };
}

function billingJson(opts: ThemeScaffoldOptions): Record<string, unknown> {
  return {
    $schema: `${opts.schemasBase}/billing.schema.json`,
    type: opts.billingType,
    support: { email: "support@revenexx.com", url: "https://revenexx.com/support" },
    categories: ["theme", "storefront"],
    available_countries: ["*"],
  };
}

function packageJson(opts: ThemeScaffoldOptions): Record<string, unknown> {
  return {
    name: opts.name,
    version: "0.1.0",
    description: opts.description,
    private: true,
    type: "module",
    engines: { node: ">=22" },
    scripts: {
      // The platform build container has ~2 min and a tight default heap —
      // Nuxt builds of real themes OOM without the headroom.
      build: "NODE_OPTIONS=--max-old-space-size=3072 nuxt build",
      dev: "nuxt dev",
      generate: "nuxt generate",
      preview: "node .output/server/index.mjs",
      postinstall: "nuxt prepare",
    },
    dependencies: {
      nuxt: "^4.2.2",
      vue: "^3.5.13",
    },
    // The linux build image needs the native lightningcss binaries when the
    // theme adopts Tailwind — harmless otherwise, an npm install skips what
    // the platform does not need.
    optionalDependencies: {
      "lightningcss-linux-arm64-musl": "^1.30.2",
      "lightningcss-linux-x64-gnu": "^1.30.2",
      "lightningcss-linux-x64-musl": "^1.30.2",
    },
  };
}

const NUXT_CONFIG = `// Minimal Nuxt SSR config for a Blokkli theme (ADR-0061).
// Deployed as a platform Site with adapter "ssr": the build worker runs
// \`npm run build\` and serves the Nitro node-server output from \`.output\`.
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: true,
  nitro: {
    preset: 'node-server',
  },
  devtools: { enabled: false },
})
`;

function appVue(opts: ThemeScaffoldOptions): string {
  return `<script setup lang="ts">
// Multi-tenant-safe SSR context (ADR-0057/0061):
//   - the tenant is resolved from the request Host on the public Sites
//     entrypoint — this frontend is served by DOMAIN, never the gateway;
//   - x-revenexx-context carries the brokered per-tenant JWT the Blokkli
//     adapter presents to the API gateway for data + capability calls.
//
// useRequestHeaders() is SERVER-ONLY — on the client (hydration) it returns
// {}. Reading it straight into render state causes a hydration mismatch, so
// capture the values ONCE on the server via useState; Nuxt serialises that
// into the payload and the client hydrates the same values.
const headers = useRequestHeaders(['host', 'x-revenexx-tenant', 'x-revenexx-context'])
const ctx = useState('revenexx-context', () => ({
  host: headers.host || 'unknown',
  tenant: headers['x-revenexx-tenant'] || '(resolved by host)',
  hasContext: Boolean(headers['x-revenexx-context']),
}))
</script>

<template>
  <main class="page">
    <section class="card">
      <p class="eyebrow">revenexx · Blokkli theme</p>
      <h1>${opts.title}</h1>
      <p class="lead">This theme is live and server-rendered. Make it yours.</p>

      <dl class="ctx">
        <dt>Host</dt>
        <dd>{{ ctx.host }}</dd>
        <dt>Tenant</dt>
        <dd>{{ ctx.tenant }}</dd>
        <dt>Brokered context</dt>
        <dd>{{ ctx.hasContext ? 'present' : 'none (preview domain)' }}</dd>
      </dl>

      <p class="foot">
        Rendered by Nuxt SSR · routed by domain on the public Sites entrypoint ·
        adapter traffic goes through the API gateway.
      </p>
    </section>
  </main>
</template>

<style>
:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  background: radial-gradient(120% 120% at 0% 0%, #1d1147 0%, #0b0b16 55%, #05050a 100%);
  color: #f4f4fb;
}
.card {
  width: min(640px, 100%);
  padding: 2.5rem;
  border-radius: 20px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.45);
}
.eyebrow { margin: 0 0 .5rem; font-size: .8rem; letter-spacing: .12em; text-transform: uppercase; color: #b9a9ff; }
h1 { margin: 0 0 .25rem; font-size: 2.5rem; }
.lead { margin: 0 0 1.75rem; color: #c9c9da; }
.ctx { display: grid; grid-template-columns: max-content 1fr; gap: .5rem 1.25rem; margin: 0 0 1.75rem; }
.ctx dt { color: #9a9ab2; }
.ctx dd { margin: 0; font-variant-numeric: tabular-nums; word-break: break-all; }
.foot { margin: 0; font-size: .8rem; line-height: 1.5; color: #7e7e98; }
</style>
`;
}

function iconSvg(opts: ThemeScaffoldOptions): string {
  const letter = opts.title.charAt(0).toUpperCase() || "T";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6d5bd0"/>
      <stop offset="1" stop-color="#1d1147"/>
    </linearGradient>
  </defs>
  <rect width="96" height="96" rx="20" fill="url(#g)"/>
  <text x="48" y="62" font-family="ui-sans-serif, system-ui" font-size="44" font-weight="700" fill="#f4f4fb" text-anchor="middle">${letter}</text>
</svg>
`;
}

const GITIGNORE = `node_modules/
.nuxt/
.output/
.data/
dist/
*.log
.DS_Store
.env
*.tar.gz
`;

function readmeMd(opts: ThemeScaffoldOptions): string {
  return `# ${opts.title}

${opts.description}

A Blokkli theme (ADR-0061/0062): a Nuxt SSR storefront plus a registry
manifest pair, scaffolded with \`revenexx create theme\`.

## Layout

| File | Purpose |
|---|---|
| \`theme.json\` | Theme manifest: kind/engine marker, site build config, \`requires\` install gate, permissions, Blokkli blocks & presets |
| \`billing.json\` | Marketplace pricing (\`${opts.billingType}\`) |
| \`nuxt.config.ts\` | Minimal SSR config (node-server preset — the platform serves \`.output/server/index.mjs\`) |
| \`app/app.vue\` | The storefront, with the multi-tenant-safe SSR context pattern |
| \`icon.svg\` | Marketplace icon (referenced from theme.json) |

## Development loop

\`\`\`bash
npm install
npm run dev                   # local storefront on http://localhost:3000
npm run build && npm run preview
\`\`\`

Three SSR rules that keep the theme multi-tenant-safe:

1. Resolve the tenant per request from the injected headers — never at module scope.
2. Tenant-partition every in-process cache.
3. Cross-request state only via \`useState\` (captured once on the server).

## Ship it

\`\`\`bash
revenexx deploy theme         # find-or-create the Site, upload, build, publish + install
\`\`\`

Theme registration is automatic — a \`ready\` site deployment IS a registered,
completed and recorded theme version. Afterwards activate the theme per domain
in Cockpit → Experience → Themes. For continuous deploys, wire the repo to the
Site via the git connector instead — the \`revenexx-theme-builder\` agent skill
documents the full pipeline.
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

export function scaffoldTheme(opts: ThemeScaffoldOptions): ThemeScaffoldResult {
  const nameError = validateThemeName(opts.name);
  if (nameError) throw new Error(nameError);

  const root = path.resolve(opts.dir, opts.name);
  if (fs.existsSync(root) && fs.readdirSync(root).length > 0) {
    throw new Error(`target directory ${root} already exists and is not empty`);
  }

  const files: ScaffoldedFile[] = [];
  writeFile(root, "theme.json", json(themeJson(opts)), files);
  writeFile(root, "billing.json", json(billingJson(opts)), files);
  writeFile(root, "package.json", json(packageJson(opts)), files);
  writeFile(root, "nuxt.config.ts", NUXT_CONFIG, files);
  writeFile(root, "app/app.vue", appVue(opts), files);
  writeFile(root, "icon.svg", iconSvg(opts), files);
  writeFile(root, ".gitignore", GITIGNORE, files);
  writeFile(root, "README.md", readmeMd(opts), files);

  return {
    root,
    files,
    warnings: [],
    nextSteps: [
      `cd ${path.relative(process.cwd(), root) || "."}`,
      "npm install && npm run dev     # local storefront",
      "revenexx deploy theme          # find-or-create Site, upload, build, publish + install",
      "bind your domain in Cockpit → Experience → Themes",
      "install the revenexx-theme-builder agent skill for the git-connector pipeline (revenexx skills add)",
    ],
  };
}
