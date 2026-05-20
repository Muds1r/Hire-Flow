/**
 * Copies repo-root `types/test-intensity.ts` into `src/generated/` before Nest compile.
 * Keeps a single source file while allowing `rootDir: src` (flat `dist/main.js`).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
// Stale incremental state can make `nest start --watch` report 0 errors but skip
// emitting JS after deleteOutDir clears dist/.
for (const f of ['tsconfig.build.tsbuildinfo', 'dist/tsconfig.build.tsbuildinfo']) {
  const p = path.join(root, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

const src = path.join(root, '..', 'types', 'test-intensity.ts');
const outDir = path.join(root, 'src', 'generated');
const dest = path.join(outDir, 'test-intensity.ts');

if (!fs.existsSync(src)) {
  console.error('sync-types: missing', src);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('sync-types: copied types/test-intensity.ts -> src/generated/');
