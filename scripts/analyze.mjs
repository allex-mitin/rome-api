// Runs a real production build and additionally emits a bundle report:
//   build/stats.html — interactive treemap
//   build/stats.json — raw data for scripted analysis
//
// Implemented as a script (instead of a shell env var in package.json) so it works
// on every platform. Any other mode (e.g. `vite build --mode analyze`) must NOT be
// used for measuring: a non-production mode changes `process.env.NODE_ENV`, which
// keeps development-only code paths in dependencies and breaks the build.
process.env.ANALYZE = '1';

const { build } = await import('vite');

await build();
