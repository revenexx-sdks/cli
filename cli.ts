#! /usr/bin/env node

import 'dotenv/config';

/** Required to set max width of the help commands */
const oldWidth = process.stdout.columns;
process.stdout.columns = 100;
/** ---------------------------------------------- */

import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';

import packageJson from './package.json' with { type: 'json' };
import { commandDescriptions, cliConfig, parseInteger, parseOutputFormat, parseFields, renderContextBanner } from './lib/parser.js';
import { resolveCommandArgv } from './lib/command-picker.js';
import { resolveAliases } from './lib/alias.js';
import { globalConfig } from './lib/config.js';
import { enableRequestSpinner, disableRequestSpinner } from './lib/spinner.js';
import { getLatestVersion, compareVersions } from './lib/utils.js';
import inquirerSearchList from 'inquirer-search-list';

import { client } from './lib/commands/generic.js';
import { login, logout, whoami, migrate, register } from './lib/commands/generic.js';
import { types } from './lib/commands/types.js';
import { update } from './lib/commands/update.js';
import { generate } from './lib/commands/generate.js';
import { tenants } from './lib/commands/tenants.js';
import { alias } from './lib/alias.js';
import { status } from './lib/commands/status.js';
import { repl } from './lib/commands/repl.js';
import { tui } from './lib/commands/tui.js';
import { watch } from './lib/commands/watch.js';

import { health } from './lib/commands/services/health.js';
import { apps } from './lib/commands/services/apps.js';
import { avatars } from './lib/commands/services/avatars.js';
import { carts } from './lib/commands/services/carts.js';
import { cartsIo } from './lib/commands/services/carts-io.js';
import { cartsItems } from './lib/commands/services/carts-items.js';
import { channels } from './lib/commands/services/channels.js';
import { consentManagerPolicy } from './lib/commands/services/consent-manager-policy.js';
import { consentManagerRegistry } from './lib/commands/services/consent-manager-registry.js';
import { consentManagerDelivery } from './lib/commands/services/consent-manager-delivery.js';
import { consentManagerRecords } from './lib/commands/services/consent-manager-records.js';
import { costCenters } from './lib/commands/services/cost-centers.js';
import { customersValueLists } from './lib/commands/services/customers-value-lists.js';
import { customersOrganizations } from './lib/commands/services/customers-organizations.js';
import { customers } from './lib/commands/services/customers.js';
import { customersContacts } from './lib/commands/services/customers-contacts.js';
import { customersRoles } from './lib/commands/services/customers-roles.js';
import { customersSegments } from './lib/commands/services/customers-segments.js';
import { documentsRegister } from './lib/commands/services/documents-register.js';
import { documentsKinds } from './lib/commands/services/documents-kinds.js';
import { events } from './lib/commands/services/events.js';
import { forms } from './lib/commands/services/forms.js';
import { inventoriesStock } from './lib/commands/services/inventories-stock.js';
import { inventoriesReservations } from './lib/commands/services/inventories-reservations.js';
import { inventoriesLocations } from './lib/commands/services/inventories-locations.js';
import { io } from './lib/commands/services/io.js';
import { locale } from './lib/commands/services/locale.js';
import { markets } from './lib/commands/services/markets.js';
import { messaging } from './lib/commands/services/messaging.js';
import { orderlists } from './lib/commands/services/orderlists.js';
import { orders } from './lib/commands/services/orders.js';
import { pagesDelivery } from './lib/commands/services/pages-delivery.js';
import { pagesEditor } from './lib/commands/services/pages-editor.js';
import { pagesCollaboration } from './lib/commands/services/pages-collaboration.js';
import { pages } from './lib/commands/services/pages.js';
import { paymentsLedger } from './lib/commands/services/payments-ledger.js';
import { paymentsProviders } from './lib/commands/services/payments-providers.js';
import { paymentsMethods } from './lib/commands/services/payments-methods.js';
import { prices } from './lib/commands/services/prices.js';
import { procurement } from './lib/commands/services/procurement.js';
import { products } from './lib/commands/services/products.js';
import { productsDataModel } from './lib/commands/services/products-data-model.js';
import { productsAssets } from './lib/commands/services/products-assets.js';
import { productsCategories } from './lib/commands/services/products-categories.js';
import { productsReferences } from './lib/commands/services/products-references.js';
import { promotionsEvaluation } from './lib/commands/services/promotions-evaluation.js';
import { promotionsVouchers } from './lib/commands/services/promotions-vouchers.js';
import { promotionsPromotions } from './lib/commands/services/promotions-promotions.js';
import { promotionsRedemptions } from './lib/commands/services/promotions-redemptions.js';
import { punchout } from './lib/commands/services/punchout.js';
import { quotesPricing } from './lib/commands/services/quotes-pricing.js';
import { quotesRanges } from './lib/commands/services/quotes-ranges.js';
import { quotesQuotes } from './lib/commands/services/quotes-quotes.js';
import { quotesAcceptance } from './lib/commands/services/quotes-acceptance.js';
import { quotesTrail } from './lib/commands/services/quotes-trail.js';
import { salesRepsCoverage } from './lib/commands/services/sales-reps-coverage.js';
import { salesRepsActingFor } from './lib/commands/services/sales-reps-acting-for.js';
import { salesRepsRoster } from './lib/commands/services/sales-reps-roster.js';
import { search } from './lib/commands/services/search.js';
import { settings } from './lib/commands/services/settings.js';
import { shippingCarriers } from './lib/commands/services/shipping-carriers.js';
import { shippingMethods } from './lib/commands/services/shipping-methods.js';
import { shippingValueLists } from './lib/commands/services/shipping-value-lists.js';
import { sites } from './lib/commands/services/sites.js';
import { storage } from './lib/commands/services/storage.js';
import { tagManagerContainer } from './lib/commands/services/tag-manager-container.js';
import { tagManagerDelivery } from './lib/commands/services/tag-manager-delivery.js';
import { tagManagerTags } from './lib/commands/services/tag-manager-tags.js';
import { about } from './lib/commands/about.js';
import { create } from "./lib/commands/create.js";
import { deploy } from "./lib/commands/deploy.js";
import { skills } from './lib/commands/skills.js';
// Side-effect import: attaches DX-22 alias shapes onto the generated apps Command.
import './lib/commands/apps-aliases.js';
const { version } = packageJson;
inquirer.registerPrompt('search-list', inquirerSearchList);

/**
 * Check for updates and show version information
 */
async function checkVersion(): Promise<void> {
    process.stdout.write(chalk.bold(`revenexx version ${version}`) + '\n');

    try {
        const latestVersion = await getLatestVersion();
        const comparison = compareVersions(version, latestVersion);

        if (comparison > 0) {
            // Current version is older than latest
            process.stdout.write(
                `\n${chalk.yellow('!')} A newer version is available: ${chalk.bold(latestVersion)}` + '\n'
            );
            process.stdout.write(
                chalk.dim(
                    `  Tip: Run 'revenexx update' to update to the latest version.`
                ) + '\n'
            );
        } else if (comparison === 0) {
            process.stdout.write(`\n${chalk.green('✓')} You are running the latest version.` + '\n');
        } else {
            // Current version is newer than latest (pre-release/dev)
            process.stdout.write(`\n${chalk.cyan('ℹ')} You are running a pre-release or development version.` + '\n');
        }
    } catch (_error) {
        // Silently fail version check, just show current version
        process.stdout.write(chalk.gray('\n(Unable to check for updates)') + '\n');
    }
}

// Intercept version flag before Commander.js processes it
if (process.argv.includes('-v') || process.argv.includes('--version')) {
    void (async () => {
        await checkVersion();
        process.exit(0);
    })();
} else {
    // Persistent reminder while TLS verification is globally disabled. Written
    // to stderr on every run so it can't be forgotten, and so it never
    // corrupts machine-readable stdout (`--json`). Turn it back on with
    // `revenexx client --self-signed false`.
    if (globalConfig.getSelfSigned()) {
        process.stderr.write(
            chalk.yellow('! TLS certificate verification is DISABLED (self-signed mode is active). ') +
            chalk.dim(`Requests are vulnerable to interception — re-enable it with 'revenexx client --self-signed false'.`) +
            '\n'
        );
    }

    // Show progress feedback for API waits (stderr, TTY-only; see spinner.ts).
    enableRequestSpinner();

    program
        // Pin the program name: commander otherwise derives it from argv[1],
        // which in the compiled single-file binary is the *build-time* path, so
        // a Homebrew install (or a binary downloaded from a release) printed
        // "Usage: revenexx-darwin-arm64 …" instead of the real command.
        .name('revenexx')
        .description(commandDescriptions['main'])
        .configureHelp({
            helpWidth: process.stdout.columns || 80,
            sortSubcommands: true,
        })
        .helpOption('-h, --help', 'Display help for command')
        .version(version, '-v, --version', 'Output the version number')
        .option('-V, --verbose', 'Show complete error log')
        .option('-o, --output <format>', 'Output format: table (default), json, jsonl, csv, yaml, or markdown (md).', parseOutputFormat)
        .option('-j, --json', 'Output in JSON format (alias for --output json).')
        .option('--jsonl', 'Output as NDJSON / JSON Lines, one record per line (alias for --output jsonl).')
        .option('--csv', 'Output in CSV format (alias for --output csv).')
        .option('--yaml', 'Output in YAML format (alias for --output yaml).')
        .option('--markdown', 'Output as a Markdown table (alias for --output markdown).')
        .option('--md', 'Output as a Markdown table (alias for --output markdown).')
        .option('--fields <fields>', 'Comma-separated list of fields/columns to keep in the output.', parseFields)
        .option('-q, --quiet', 'Suppress the tenant/endpoint context banner and human output; on failure emit a machine-readable error to stderr with a meaningful exit code.')
        .option('--data <data>', 'Request body for create/update commands: inline JSON, @file.json, or - to read stdin.')
        .hook('preAction', migrate)
        .hook('preAction', renderContextBanner)
        .option('-f,--force', 'Flag to confirm all warnings')
        .option('--report', 'Enable reporting in case of CLI errors')
        .option('--endpoint [endpoint]', 'Revenexx API URL (overrides REVENEXX_API_URL / config). Use to target staging or self-hosted instances.')
        .option('--token [token]', 'Gateway API key (overrides REVENEXX_API_KEY / config) for this command.')
        .option('--tenant [tenant]', 'Tenant slug (overrides REVENEXX_TENANT / config) for this command.')
        // Named --request-timeout, not --timeout: commander lets program options
        // appear after the subcommand, so a program-level --timeout swallowed
        // every subcommand's own --timeout (deploy's build wait in seconds, the
        // API's function/request timeout fields) and applied the value as the
        // HTTP timeout in milliseconds (DX-229, DX-234).
        .option('--request-timeout <ms>', 'Per-request HTTP timeout in milliseconds (default 30000).', parseInteger)
        .option('--no-retry', 'Disable automatic retries for transient failures (network errors, 429/503, 5xx).')
        .option('--debug', 'Log HTTP requests (method, path, status, duration, request-id) to stderr, fully redacted.')
        .on('option:output', function () {
            cliConfig.output = this.opts().output;
            // Only the human "table" renderer is TTY chrome; machine formats
            // must never interleave a spinner into piped stdout.
            cliConfig.json = cliConfig.output === 'json';
            if (cliConfig.output !== 'table') {
                disableRequestSpinner();
            }
        })
        .on('option:json', () => {
            cliConfig.output = 'json';
            cliConfig.json = true;
            disableRequestSpinner();
        })
        .on('option:jsonl', () => {
            cliConfig.output = 'jsonl';
            disableRequestSpinner();
        })
        .on('option:csv', () => {
            cliConfig.output = 'csv';
            disableRequestSpinner();
        })
        .on('option:yaml', () => {
            cliConfig.output = 'yaml';
            disableRequestSpinner();
        })
        .on('option:markdown', () => {
            cliConfig.output = 'markdown';
            disableRequestSpinner();
        })
        .on('option:md', () => {
            cliConfig.output = 'markdown';
            disableRequestSpinner();
        })
        .on('option:fields', function () {
            cliConfig.fields = this.opts().fields as string[];
        })
        .on('option:quiet', () => {
            cliConfig.quiet = true;
            disableRequestSpinner();
        })
        .on('option:data', function () {
            cliConfig.data = this.opts().data as string;
        })
        .on('option:verbose', () => {
            cliConfig.verbose = true;
        })
        .on('option:request-timeout', function () {
            cliConfig.timeout = this.opts().requestTimeout as number;
        })
        .on('option:no-retry', () => {
            cliConfig.retry = false;
        })
        .on('option:debug', () => {
            cliConfig.debug = true;
        })
        .on('option:report', function () {
            cliConfig.report = true;
            cliConfig.reportData = { data: this };
        })
        .on('option:force', () => {
            cliConfig.force = true;
        })
        .on('option:endpoint', function () {
            cliConfig.endpoint = this.opts().endpoint as string;
        })
        .on('option:token', function () {
            cliConfig.token = this.opts().token as string;
        })
        .on('option:tenant', function () {
            cliConfig.tenant = this.opts().tenant as string;
        })
        .showSuggestionAfterError()
        .addCommand(whoami)
        .addCommand(register)
        .addCommand(login)
        .addCommand(types)
        .addCommand(update)
        .addCommand(generate)
        .addCommand(logout)
        .addCommand(tenants)
        .addCommand(alias)
        .addCommand(status)
        .addCommand(repl)
        .addCommand(tui)
        .addCommand(watch)
        .addCommand(health)
        .addCommand(apps)
        .addCommand(avatars)
        .addCommand(carts)
        .addCommand(cartsIo)
        .addCommand(cartsItems)
        .addCommand(channels)
        .addCommand(consentManagerPolicy)
        .addCommand(consentManagerRegistry)
        .addCommand(consentManagerDelivery)
        .addCommand(consentManagerRecords)
        .addCommand(costCenters)
        .addCommand(customersValueLists)
        .addCommand(customersOrganizations)
        .addCommand(customers)
        .addCommand(customersContacts)
        .addCommand(customersRoles)
        .addCommand(customersSegments)
        .addCommand(documentsRegister)
        .addCommand(documentsKinds)
        .addCommand(events)
        .addCommand(forms)
        .addCommand(inventoriesStock)
        .addCommand(inventoriesReservations)
        .addCommand(inventoriesLocations)
        .addCommand(io)
        .addCommand(locale)
        .addCommand(markets)
        .addCommand(messaging)
        .addCommand(orderlists)
        .addCommand(orders)
        .addCommand(pagesDelivery)
        .addCommand(pagesEditor)
        .addCommand(pagesCollaboration)
        .addCommand(pages)
        .addCommand(paymentsLedger)
        .addCommand(paymentsProviders)
        .addCommand(paymentsMethods)
        .addCommand(prices)
        .addCommand(procurement)
        .addCommand(products)
        .addCommand(productsDataModel)
        .addCommand(productsAssets)
        .addCommand(productsCategories)
        .addCommand(productsReferences)
        .addCommand(promotionsEvaluation)
        .addCommand(promotionsVouchers)
        .addCommand(promotionsPromotions)
        .addCommand(promotionsRedemptions)
        .addCommand(punchout)
        .addCommand(quotesPricing)
        .addCommand(quotesRanges)
        .addCommand(quotesQuotes)
        .addCommand(quotesAcceptance)
        .addCommand(quotesTrail)
        .addCommand(salesRepsCoverage)
        .addCommand(salesRepsActingFor)
        .addCommand(salesRepsRoster)
        .addCommand(search)
        .addCommand(settings)
        .addCommand(shippingCarriers)
        .addCommand(shippingMethods)
        .addCommand(shippingValueLists)
        .addCommand(sites)
        .addCommand(storage)
        .addCommand(tagManagerContainer)
        .addCommand(tagManagerDelivery)
        .addCommand(tagManagerTags)
        .addCommand(about)
        .addCommand(create)
        .addCommand(deploy)
        .addCommand(skills)
        .addCommand(client);

    // Route the root parser's own exits (bad global flags, unknown commands,
    // top-level --help) through our catch so usage errors surface exit code 2
    // while help stays 0. Scoped to the root: subcommands keep Commander's
    // default exit so the promptForMissing / interactive paths are untouched.
    program.exitOverride();

    // Default landing mode (DX-140) + guided mode (DX-98): on a TTY, a bare
    // `revenexx` launches the full-screen TUI (opt out with REVENEXX_NO_TUI /
    // defaultMode), and a partial invocation resolves to a real command via a
    // searchable picker — both before commander parses. In non-TTY / --json /
    // help contexts this returns process.argv untouched.
    void (async () => {
        try {
            program.parse(await resolveCommandArgv(program, resolveAliases(program, process.argv)));
        } finally {
            process.stdout.columns = oldWidth;
        }
    })().catch((error: unknown) => {
        // Commander throws a CommanderError (code `commander.*`) for parse
        // failures and --help under exitOverride. Help/version already printed
        // and carry exitCode 0; any other Commander error is a usage problem → 2.
        const commanderError = error as { code?: string; exitCode?: number };
        if (
            typeof commanderError?.code === 'string' &&
            commanderError.code.startsWith('commander.')
        ) {
            process.exit(commanderError.exitCode === 0 ? 0 : 2);
        }
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`${message}\n`);
        process.exit(1);
    });
}
