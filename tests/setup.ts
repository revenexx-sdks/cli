/**
 * Test-runner setup: force color OFF before any module loads chalk/ink.
 * Frame assertions compare plain text; with ambient FORCE_COLOR/TTY color
 * detection, style codes land between adjacent texts and substring
 * assertions become environment-dependent.
 */
process.env.FORCE_COLOR = "0";
