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
import { commandDescriptions, cliConfig, parseInteger } from './lib/parser.js';
import { resolveCommandArgv } from './lib/command-picker.js';
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

import { apps } from './lib/commands/services/apps.js';
import { avatars } from './lib/commands/services/avatars.js';
import { carts } from './lib/commands/services/carts.js';
import { channels } from './lib/commands/services/channels.js';
import { customers } from './lib/commands/services/customers.js';
import { greetings } from './lib/commands/services/greetings.js';
import { forms } from './lib/commands/services/forms.js';
import { inventories } from './lib/commands/services/inventories.js';
import { locale } from './lib/commands/services/locale.js';
import { markets } from './lib/commands/services/markets.js';
import { messaging } from './lib/commands/services/messaging.js';
import { orderlists } from './lib/commands/services/orderlists.js';
import { orders } from './lib/commands/services/orders.js';
import { pages } from './lib/commands/services/pages.js';
import { payments } from './lib/commands/services/payments.js';
import { prices } from './lib/commands/services/prices.js';
import { products } from './lib/commands/services/products.js';
import { search } from './lib/commands/services/search.js';
import { settings } from './lib/commands/services/settings.js';
import { shipping } from './lib/commands/services/shipping.js';
import { sites } from './lib/commands/services/sites.js';
import { storage } from './lib/commands/services/storage.js';
import { tokens } from './lib/commands/services/tokens.js';
import { about } from './lib/commands/about.js';
import { create } from "./lib/commands/create.js";
import { deploy } from "./lib/commands/deploy.js";
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
        .description(commandDescriptions['main'])
        .configureHelp({
            helpWidth: process.stdout.columns || 80,
            sortSubcommands: true,
        })
        .helpOption('-h, --help', 'Display help for command')
        .version(version, '-v, --version', 'Output the version number')
        .option('-V, --verbose', 'Show complete error log')
        .option('-j, --json', 'Output in JSON format')
        .hook('preAction', migrate)
        .option('-f,--force', 'Flag to confirm all warnings')
        .option('--report', 'Enable reporting in case of CLI errors')
        .option('--endpoint [endpoint]', 'Revenexx API URL (overrides REVENEXX_API_URL / config). Use to target staging or self-hosted instances.')
        .option('--token [token]', 'Gateway API key (overrides REVENEXX_API_KEY / config) for this command.')
        .option('--tenant [tenant]', 'Tenant slug (overrides REVENEXX_TENANT / config) for this command.')
.option('--timeout <ms>', 'Per-request timeout in milliseconds (default 30000).', parseInteger)
        .option('--no-retry', 'Disable automatic retries for transient failures (network errors, 429/503, 5xx).')
        .option('--debug', 'Log HTTP requests (method, path, status, duration, request-id) to stderr, fully redacted.')
        .on('option:json', () => {
            cliConfig.json = true;
            disableRequestSpinner();
        })
        .on('option:verbose', () => {
            cliConfig.verbose = true;
        })
        .on('option:timeout', function () {
            cliConfig.timeout = this.opts().timeout as number;
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
        .addCommand(apps)
        .addCommand(avatars)
        .addCommand(carts)
        .addCommand(channels)
        .addCommand(customers)
        .addCommand(greetings)
        .addCommand(forms)
        .addCommand(inventories)
        .addCommand(locale)
        .addCommand(markets)
        .addCommand(messaging)
        .addCommand(orderlists)
        .addCommand(orders)
        .addCommand(pages)
        .addCommand(payments)
        .addCommand(prices)
        .addCommand(products)
        .addCommand(search)
        .addCommand(settings)
        .addCommand(shipping)
        .addCommand(sites)
        .addCommand(storage)
        .addCommand(tokens)
        .addCommand(about)
        .addCommand(create)
        .addCommand(deploy)
        .addCommand(client);

    // Guided mode (DX-98): on a TTY, a bare or partial invocation resolves to
    // a real command via a searchable picker before commander parses. In
    // non-TTY / --json / help contexts this returns process.argv untouched.
    void (async () => {
        try {
            program.parse(await resolveCommandArgv(program, process.argv));
        } finally {
            process.stdout.columns = oldWidth;
        }
    })().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`${message}\n`);
        process.exit(1);
    });
}
