/**
 * Reproduces Vercel @tayyari/shared resolution failure and logs hypothesis checks.
 * Run from repo root: node scripts/debug-vercel-shared.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const logPath = path.join(root, 'debug-34bb63.log');
const sessionId = '34bb63';

function log(hypothesisId, location, message, data) {
  const entry = {
    sessionId,
    runId: process.env.DEBUG_RUN_ID || 'pre-fix',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
  // Also POST for ingest if local server is up
  fetch('http://127.0.0.1:7802/ingest/848ab306-8714-43b8-9f32-bc98f9407ba0', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': sessionId,
    },
    body: JSON.stringify(entry),
  }).catch(() => {});
}

const sharedPkg = path.join(root, 'packages/shared');
const sharedDistDts = path.join(sharedPkg, 'dist/index.d.ts');
const sharedDistJs = path.join(sharedPkg, 'dist/index.js');
const webLink = path.join(root, 'apps/web/node_modules/@tayyari/shared');
const webPkgJson = JSON.parse(
  fs.readFileSync(path.join(root, 'apps/web/package.json'), 'utf8'),
);
const vercelJson = JSON.parse(
  fs.readFileSync(path.join(root, 'apps/web/vercel.json'), 'utf8'),
);
const sharedPkgJson = JSON.parse(
  fs.readFileSync(path.join(sharedPkg, 'package.json'), 'utf8'),
);

// H-C: What build command would Vercel run from package.json vs vercel.json?
log('C', 'debug-vercel-shared.mjs:pkg-build', 'web package.json build script', {
  buildScript: webPkgJson.scripts.build,
  vercelBuildCommand: vercelJson.buildCommand ?? null,
  vercelUsesSharedBuildFirst: Boolean(
    vercelJson.buildCommand?.includes('@tayyari/shared'),
  ),
  pkgBuildBuildsSharedFirst:
    webPkgJson.scripts.build.includes('packages/shared') ||
    webPkgJson.scripts.build.includes('@tayyari/shared'),
});

// H-B: workspace link present?
let linkTarget = null;
let linkExists = fs.existsSync(webLink);
if (linkExists) {
  try {
    linkTarget = fs.readlinkSync(webLink);
  } catch {
    linkTarget = fs.realpathSync(webLink);
  }
}
log(
  'B',
  'debug-vercel-shared.mjs:workspace-link',
  'apps/web node_modules @tayyari/shared',
  {
    linkExists,
    linkTarget,
  },
);

// H-D: exports point only at dist?
log('D', 'debug-vercel-shared.mjs:exports', 'shared package exports/types', {
  types: sharedPkgJson.types,
  main: sharedPkgJson.main,
  exports: sharedPkgJson.exports,
  typesPointAtDist: String(sharedPkgJson.types || '').includes('dist'),
});

// Simulate Vercel: remove dist, then tsc -b (like commit 2c1d0d6 / default build)
const distDir = path.join(sharedPkg, 'dist');
const backupDir = path.join(sharedPkg, '.dist-backup-debug');
let moved = false;
if (fs.existsSync(distDir)) {
  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true, force: true });
  }
  fs.renameSync(distDir, backupDir);
  moved = true;
}

const distExistsBeforeTsc = fs.existsSync(sharedDistDts);
log(
  'A',
  'debug-vercel-shared.mjs:pre-tsc',
  'shared dist before tsc (Vercel-like)',
  {
    distDtsExists: distExistsBeforeTsc,
    distJsExists: fs.existsSync(sharedDistJs),
    simulatedMissingDist: moved,
  },
);

const tsc = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['tsc', '-b', '--pretty', 'false'],
  {
    cwd: path.join(root, 'apps/web'),
    encoding: 'utf8',
    shell: true,
  },
);

const tscOut = `${tsc.stdout || ''}${tsc.stderr || ''}`;
const cannotFindShared = tscOut.includes(
  "Cannot find module '@tayyari/shared'",
);
log(
  'A',
  'debug-vercel-shared.mjs:tsc-without-dist',
  'tsc -b with shared dist missing',
  {
    exitCode: tsc.status,
    cannotFindShared,
    errorSample: tscOut
      .split('\n')
      .filter((l) => l.includes('TS2307') || l.includes('error TS'))
      .slice(0, 5),
  },
);

// Restore dist and build shared, then tsc again
if (moved && fs.existsSync(backupDir)) {
  fs.renameSync(backupDir, distDir);
}

const sharedBuild = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['tsc', '-p', path.join(sharedPkg, 'tsconfig.json')],
  { cwd: root, encoding: 'utf8', shell: true },
);

log('E', 'debug-vercel-shared.mjs:shared-build', 'rebuild shared dist', {
  exitCode: sharedBuild.status,
  distDtsExists: fs.existsSync(sharedDistDts),
});

const tsc2 = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['tsc', '-b', '--pretty', 'false'],
  {
    cwd: path.join(root, 'apps/web'),
    encoding: 'utf8',
    shell: true,
  },
);

const tsc2Out = `${tsc2.stdout || ''}${tsc2.stderr || ''}`;
log(
  'E',
  'debug-vercel-shared.mjs:tsc-with-dist',
  'tsc -b after shared dist exists',
  {
    exitCode: tsc2.status,
    cannotFindShared: tsc2Out.includes("Cannot find module '@tayyari/shared'"),
    errorSample: tsc2Out
      .split('\n')
      .filter((l) => l.includes('error TS'))
      .slice(0, 5),
  },
);

console.log('Wrote', logPath);
console.log(
  'without dist: exit',
  tsc.status,
  'cannotFindShared',
  cannotFindShared,
);
console.log('with dist: exit', tsc2.status);
