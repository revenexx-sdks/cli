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
import { commandDescriptions, cliConfig } from './lib/parser.js';
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
import { locale } from './lib/commands/services/locale.js';
import { markets } from './lib/commands/services/markets.js';
import { messaging } from './lib/commands/services/messaging.js';
import { products } from './lib/commands/services/products.js';
import { search } from './lib/commands/services/search.js';
import { sites } from './lib/commands/services/sites.js';
import { storage } from './lib/commands/services/storage.js';
import { tokens } from './lib/commands/services/tokens.js';
import { about } from './lib/commands/about.js';
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
                chalk.yellow(`\n⚠️  A newer version is available: ${chalk.bold(latestVersion)}`) + '\n'
            );
            process.stdout.write(
                chalk.cyan(
                    `💡 Run '${chalk.bold('revenexx update')}' to update to the latest version.`
                ) + '\n'
            );
        } else if (comparison === 0) {
            process.stdout.write(chalk.green('\n✅ You are running the latest version!') + '\n');
        } else {
            // Current version is newer than latest (pre-release/dev)
            process.stdout.write(chalk.blue('\n🚀 You are running a pre-release or development version.') + '\n');
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
        .option('-a,--all', 'Flag to push all resources')
        .option('--id [id...]', 'Flag to pass a list of ids for a given action')
        .option('--report', 'Enable reporting in case of CLI errors')
        .option('--endpoint [endpoint]', 'Revenexx API URL (overrides REVENEXX_API_URL / config). Use to target staging or self-hosted instances.')
        .option('--token [token]', 'Gateway API key (overrides REVENEXX_API_KEY / config) for this command.')
        .option('--tenant [tenant]', 'Tenant slug (overrides REVENEXX_TENANT / config) for this command.')
        .on('option:json', () => {
            cliConfig.json = true;
        })
        .on('option:verbose', () => {
            cliConfig.verbose = true;
        })
        .on('option:report', function () {
            cliConfig.report = true;
            cliConfig.reportData = { data: this };
        })
        .on('option:force', () => {
            cliConfig.force = true;
        })
        .on('option:all', () => {
            cliConfig.all = true;
        })
        .on('option:id', function () {
            cliConfig.ids = (this.opts().id as string[]);
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
        .addCommand(locale)
        .addCommand(markets)
        .addCommand(messaging)
        .addCommand(products)
        .addCommand(search)
        .addCommand(sites)
        .addCommand(storage)
        .addCommand(tokens)
        .addCommand(about)
        .addCommand(client)
        .parse(process.argv);

    process.stdout.columns = oldWidth;
}
