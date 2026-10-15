// Preserve the approved deployment manifest, asset names and application bytes.
// Only a CSS-only production build can pass these comparisons.
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

assert(process.argv[2], 'Usage: node docs/revision-validation/export-css.mjs <rebuilt-dist>');
const original = resolve('dist');
const built = resolve(process.argv[2]);
assert.notEqual(original, built, 'Build in a disposable checkout first');
async function files(root, prefix = '') {
  const result = [];
  for (const entry of await readdir(resolve(root, prefix), { withFileTypes: true })) {
    assert(!entry.isSymbolicLink(), 'No symlinks in an export');
    const path = prefix + entry.name;
    if (entry.isDirectory()) result.push(...await files(root, path + '/'));
    else result.push(path);
  }
  return result.sort();
}
const a = await files(original), b = await files(built);
const names = [/^assets\/index-.*\.css$/, /^assets\/index-.*\.js$/, /^assets\/ccip-.*\.js$/, /^assets\/dist-.*\.js$/];
const pairs = names.map(pattern => {
  const from = a.filter(p => pattern.test(p)), to = b.filter(p => pattern.test(p));
  assert.equal(from.length, 1); assert.equal(to.length, 1);
  return [from[0], to[0]];
});
const mapping = new Map(pairs);
assert.deepEqual(a.map(p => mapping.get(p) ?? p).sort(), b, 'Unexpected export file changes');
for (const path of a) {
  if (path === pairs[0][0]) continue;
  const previous = await readFile(resolve(original, path));
  const next = await readFile(resolve(built, mapping.get(path) ?? path));
  if (path === 'imd-deployment.json') {
    const { assets: oldInventory, ...oldDeployment } = JSON.parse(previous);
    const { assets: newInventory, ...newDeployment } = JSON.parse(next);
    assert.deepEqual(oldDeployment, newDeployment, 'Deployment configuration changed');
  } else if (path.endsWith('.js') || path === 'index.html') {
    let normalized = next.toString();
    for (const [oldPath, newPath] of pairs)
      normalized = normalized.replaceAll(newPath.slice(7), oldPath.slice(7));
    assert.equal(normalized, previous.toString(), `Unexpected application change: ${path}`);
  } else assert(previous.equals(next), `Unexpected asset change: ${path}`);
}
const css = await readFile(resolve(built, pairs[0][1]));
await writeFile(resolve(original, pairs[0][0]), css);
console.log(JSON.stringify({
  updated: pairs[0][0],
  productionStylesheet: pairs[0][1],
  sha256: createHash('sha256').update(css).digest('hex'),
  otherExportFilesUnchanged: a.length - 1,
  limitation: 'The immutable approved manifest retains its original CSS digest; check:export on the delivered tree reports that inventory mismatch.',
}, null, 2));
