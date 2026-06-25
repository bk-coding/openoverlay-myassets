import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src  = join(root, 'brand', 'oo-shared.css');

const targets = [
  join(root, '..', 'openoverlay-site',  'assets', 'css', 'oo-shared.css'),
  join(root, '..', 'openoverlay-docs',  'assets', 'css', 'oo-shared.css'),
  join(root, '..', 'openoverlay-store', 'assets', 'css', 'oo-shared.css'),
];

const css = readFileSync(src, 'utf8');
let synced = 0;

for (const target of targets) {
  const dir = dirname(target);
  if (!existsSync(dir)) {
    console.warn(`[sync-shared] ⚠️  Dossier absent, ignoré : ${dir}`);
    continue;
  }
  writeFileSync(target, css);
  console.log(`[sync-shared] ✓ ${target.replace(join(root, '..'), '')}`);
  synced++;
}

console.log(`[sync-shared] ${synced}/${targets.length} sites synchronisés.`);
