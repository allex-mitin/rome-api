// Prints a breakdown of the production bundle.
//
// Input is `build/stats.json`, produced by `npm run analyze` (rollup-plugin-visualizer
// in the `raw-data` template). For each output chunk it lists the npm packages that
// contribute the most bytes, so bundle growth can be attributed to a real dependency
// instead of guesswork.
//
// Data model of `raw-data`:
//   tree            hierarchy; top-level children are output chunks, leaves carry `uid`
//   nodeParts[uid]  { renderedLength, gzipLength, metaUid } — `uid` in the tree is a part id
//   nodeMetas[uid]  { id, moduleParts, ... } — reached via nodeParts[...].metaUid
//
// Usage:
//   npm run analyze
//   node scripts/bundle-report.mjs [topNPerChunk]
import { readFileSync } from 'node:fs';

const TOP_N = Number(process.argv[2] || 12);
const stats = JSON.parse(readFileSync('build/stats.json', 'utf8'));
const { nodeMetas = {}, nodeParts = {}, tree } = stats;

const packageOf = (id) => (id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/) || [null, '(app code)'])[1];

const byChunk = {};
for (const chunkNode of tree.children || []) {
    const packages = (byChunk[chunkNode.name] ||= {});

    (function walk(node) {
        if (node.uid) {
            const part = nodeParts[node.uid];
            const meta = part && nodeMetas[part.metaUid];
            if (part) {
                const pkg = packageOf(meta?.id || '');
                packages[pkg] = (packages[pkg] || 0) + (part.renderedLength || 0);
            }
        }
        (node.children || []).forEach(walk);
    })(chunkNode);
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1).padStart(9)} kB`;

const chunks = Object.entries(byChunk)
    .map(([chunk, packages]) => [chunk, packages, Object.values(packages).reduce((a, b) => a + b, 0)])
    .sort((a, b) => b[2] - a[2]);

for (const [chunk, packages, total] of chunks) {
    console.log(`\n=== ${chunk} — ${kb(total)} ===`);
    Object.entries(packages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_N)
        .forEach(([name, size]) => console.log(`${kb(size)}   ${name}`));
}
