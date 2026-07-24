// Build-time stand-in for `react-devtools-core`, aliased in by build:cli.
// Ink only reaches this module behind `process.env['DEV'] === 'true'`; the
// real devtools bridge never ships in the CLI bundle. Without the alias the
// bundler hoists ink's guarded dynamic import into an eager top-level import
// and the bundle fails to load.
export default {
  connectToDevTools() {},
};
