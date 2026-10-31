import { readFile, readdir, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = process.cwd();
const dist = resolve(root, 'dist');
const output = resolve(root, 'release');
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(await readFile(resolve(dist, 'manifest.json'), 'utf8'));
if (
  !/^\d+\.\d+\.\d+$/.test(pkg.version) ||
  manifest.version !== pkg.version ||
  manifest.manifest_version !== 3
) {
  throw new Error('Package and Manifest V3 versions must match');
}
async function collect(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (
      entry.isDirectory() &&
      (name === 'assets' ||
        name === '_locales' ||
        name === '_locales/en' ||
        name === '_locales/zh_CN')
    )
      files.push(...(await collect(resolve(directory, entry.name), `${name}/`)));
    else if (
      entry.isFile() &&
      (/^(index\.html|background\.js|manifest\.json|LICENSE\.txt)$/.test(name) ||
        /^assets\/[\w.-]+\.(js|css|png|svg|webp|woff2)$/.test(name) ||
        /^_locales\/(en|zh_CN)\/messages\.json$/.test(name))
    )
      files.push(name);
    else throw new Error(`Unexpected build file: ${name}`);
  }
  return files.sort();
}
const files = await collect(dist);
for (const required of [
  'index.html',
  'background.js',
  'manifest.json',
  'LICENSE.txt',
  '_locales/en/messages.json',
  '_locales/zh_CN/messages.json',
])
  if (!files.includes(required)) throw new Error(`Missing build file: ${required}`);
await mkdir(output, { recursive: true });
const filename = `OhMyNewTabTodo-${pkg.version}.zip`;
const archive = resolve(output, filename);
await rm(archive, { force: true });
execFileSync('zip', ['-X', '-q', archive, ...files], { cwd: dist });
execFileSync('unzip', ['-t', archive], { stdio: 'pipe' });
const hash = createHash('sha256')
  .update(await readFile(archive))
  .digest('hex');
await writeFile(resolve(output, 'SHA256SUMS.txt'), `${hash}  ${filename}\n`);
console.log(`Packaged ${files.length} files: ${archive}\nSHA256 ${hash}`);
