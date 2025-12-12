#!/usr/bin/env node

/*
 Build script:
  - Creates/cleans /public
  - Computes content hashes for CSS/JS/image files
  - Copies files over to /public with hashed names (for cache-busting)
  - Rewrites references in HTML, CSS and JS to use hashed filenames
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let esbuild;
let chokidar;
try {
  esbuild = require('esbuild');
} catch (e) {
  console.warn(
    'esbuild is not installed. JS/CSS minification will be skipped. Run `npm i -D esbuild` to enable it.'
  );
}
try {
  chokidar = require('chokidar');
} catch (e) {
  // Not fatal: the watch mode will error if chokidar isn't installed.
}

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');

const HASH_LENGTH = 8;
const HASHABLE_EXTS = ['.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.gif'];

// Utility functions
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rimraf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function hashFileContent(buffer) {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  return hash.slice(0, HASH_LENGTH);
}

function isIgnored(filePath) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  // Exclude node_modules, .git, scripts/build.js itself
  return (
    rel.startsWith('node_modules') ||
    rel.startsWith('.git') ||
    rel.startsWith('.github') ||
    rel.startsWith('public') ||
    rel.startsWith('scripts')
  );
}

function shouldHash(filePath) {
  return HASHABLE_EXTS.includes(path.extname(filePath).toLowerCase());
}

async function minifyContent(content, ext, sourcefile) {
  // Returns { code, map } - map may be undefined if not available
  if (!esbuild) return { code: content, map: null };
  try {
    if (ext === '.js') {
      const res = await esbuild.transform(content, {
        loader: 'js',
        minify: true,
        legalComments: 'none',
        sourcemap: true,
        sourcefile: sourcefile,
      });
      return { code: res.code, map: res.map };
    }
    if (ext === '.css') {
      const res = await esbuild.transform(content, {
        loader: 'css',
        minify: true,
        sourcemap: true,
        sourcefile: sourcefile,
      });
      return { code: res.code, map: res.map };
    }
  } catch (e) {
    console.warn('esbuild minify failed for', ext, e.message);
  }
  return { code: content, map: null };
}

function readAllFiles(dir) {
  const results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  list.forEach((ent) => {
    const filePath = path.join(dir, ent.name);
    if (isIgnored(filePath)) return;
    if (ent.isDirectory()) {
      results.push(...readAllFiles(filePath));
    } else if (ent.isFile()) {
      results.push(filePath);
    }
  });
  return results;
}

async function copyAndRewriteFiles(files) {
  // Build mapping of original -> hashed path
  const map = {};
  const minifiedContents = {}; // store minified content for js/css

  // 1) First compute hashes for binary assets (images/gifs/svg)
  const assetExts = ['.png', '.jpg', '.jpeg', '.svg', '.gif'];
  files.forEach((fullPath) => {
    const relPath = path.relative(root, fullPath).replace(/\\/g, '/');
    const ext = path.extname(relPath).toLowerCase();
    if (assetExts.includes(ext)) {
      const buffer = fs.readFileSync(fullPath);
      const hash = hashFileContent(buffer);
      const dir = path.dirname(relPath);
      const base = path.basename(relPath, ext);
      const newName = `${base}.${hash}${ext}`;
      const newRel = dir === '.' ? newName : `${dir}/${newName}`;
      map[relPath] = newRel;
    }
  });

  // 2) Process CSS and JS in two steps: replace known references (assets), then minify, compute final hash
  const codeExts = ['.js', '.css'];
  for (const fullPath of files) {
    const relPath = path.relative(root, fullPath).replace(/\\/g, '/');
    const ext = path.extname(relPath).toLowerCase();
    if (!codeExts.includes(ext)) continue;

    let content = fs.readFileSync(fullPath, 'utf8');
    // Replace image references (and any other already-hashed files) so the minified output contains hashed paths
    const keys = Object.keys(map).sort((a, b) => b.length - a.length);
    keys.forEach((key) => {
      const val = map[key];
      const escKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escKey, 'g');
      content = content.replace(regex, val);
    });
    // Minify if possible (and capture source map if available)
    const { code: minified, map: mapText } = await minifyContent(
      content,
      ext,
      relPath
    );
    // compute hash from the minified content
    const hash = hashFileContent(Buffer.from(minified, 'utf8'));
    const dir = path.dirname(relPath);
    const base = path.basename(relPath, ext);
    const newName = `${base}.${hash}${ext}`;
    const newRel = dir === '.' ? newName : `${dir}/${newName}`;
    map[relPath] = newRel;
    minifiedContents[relPath] = { code: minified, map: mapText };
  }

  // 3) Copy / Write files using final map
  for (const fullPath of files) {
    const relPath = path.relative(root, fullPath).replace(/\\/g, '/');
    const ext = path.extname(relPath).toLowerCase();
    let destRelPath = relPath;
    if (map[relPath]) {
      destRelPath = map[relPath];
    }
    const destFullPath = path.join(publicDir, destRelPath);
    ensureDir(path.dirname(destFullPath));

    // write files, rewriting references to final hashed names
    if (ext === '.html' || ext === '.css' || ext === '.js') {
      let content = fs.readFileSync(fullPath, 'utf8');
      // Replace all occurrences of keys in map
      const keys = Object.keys(map).sort((a, b) => b.length - a.length);
      keys.forEach((key) => {
        const val = map[key];
        const escKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escKey, 'g');
        content = content.replace(regex, val);
      });
      // If this is a JS/CSS file we minified before; prefer the minified content stored
      if ((ext === '.js' || ext === '.css') && minifiedContents[relPath]) {
        // If esbuild produced a sourcemap, write it out and add a sourceMappingURL comment
        const entry = minifiedContents[relPath];
        let outCode = entry.code;
        if (entry && entry.map) {
          try {
            const mapObj = JSON.parse(entry.map);
            // Set the file property in the map to the final hashed filename
            mapObj.file = path.basename(destRelPath);
            const mapJson = JSON.stringify(mapObj);
            const mapFileName = `${path.basename(destRelPath)}.map`;
            const mapDestFull = `${destFullPath}.map`;
            // Write source map file
            fs.writeFileSync(mapDestFull, mapJson, 'utf8');
            // Append sourceMappingURL comment
            if (ext === '.js') {
              outCode += `\n//# sourceMappingURL=${mapFileName}`;
            } else if (ext === '.css') {
              outCode += `\n/*# sourceMappingURL=${mapFileName} */`;
            }
          } catch (e) {
            console.warn('Failed to parse/write sourcemap for', relPath, e);
          }
        }
        fs.writeFileSync(destFullPath, outCode, 'utf8');
      } else {
        fs.writeFileSync(destFullPath, content, 'utf8');
      }
    } else {
      // binary copy
      fs.copyFileSync(fullPath, destFullPath);
    }
  }

  return map;
}

async function buildOnce() {
  console.log('\nBuild started...');
  // Clean public
  rimraf(publicDir);
  ensureDir(publicDir);

  // Read all files
  const files = readAllFiles(root).filter((f) => {
    // Filter out the scripts/build.js itself to avoid copying it
    const rel = path.relative(root, f).replace(/\\/g, '/');
    if (rel === 'scripts/build.js') return false;
    return true;
  });

  // Copy and rewrite
  const map = await copyAndRewriteFiles(files);
  console.log(
    'Files copied to /public with cache-busting for:',
    Object.keys(map)
  );
  console.log('\nBuild finished.');
  if (!process.argv.includes('--watch') && !process.argv.includes('-w')) {
    console.log(
      'You can serve the `public/` directory (e.g., `npx http-server public -p 8080`).'
    );
  }
}

async function run() {
  const watch = process.argv.includes('--watch') || process.argv.includes('-w');
  if (!watch) {
    await buildOnce();
    return;
  }

  if (!chokidar) {
    console.error(
      'Watch mode requires `chokidar` to be installed. Run `npm i -D chokidar` and try again.'
    );
    process.exit(1);
  }

  // Initial build
  await buildOnce();

  // Watch list (exclude public, node_modules)
  const watchPaths = [
    path.join(root, 'js'),
    path.join(root, 'css'),
    path.join(root, 'index.html'),
    path.join(root, 'assets'),
  ];
  const watcher = chokidar.watch(watchPaths, {
    ignored: /(^|[\\/])\../,
    ignoreInitial: true,
  });
  let timeout = null;
  const debounceMs = 200;
  const rebuild = async (event, p) => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      console.log(`Detected change (${event}): ${p}. Rebuilding...`);
      try {
        await buildOnce();
      } catch (e) {
        console.error('Rebuild failed:', e);
      }
    }, debounceMs);
  };

  watcher.on('all', rebuild);
  console.log(
    'Watching files for changes -- rebuilds will happen automatically.'
  );
}

run().catch((err) => {
  console.error('Build script failed:', err);
  process.exit(1);
});
