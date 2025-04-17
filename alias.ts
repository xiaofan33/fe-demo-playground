import { fileURLToPath } from 'node:url';
import { resolve } from 'pathe';
import fg from 'fast-glob';

const root = fileURLToPath(new URL('.', import.meta.url));

export const r = (path: string) => resolve(root, path);

export const alias: Record<string, string> = {
  ...syncSubDirAlias('./demos'),
  ...syncSubDirAlias('src'),
};

function syncSubDirAlias(dir: string) {
  return fg
    .sync(`${dir}/*`, { cwd: root, onlyDirectories: true })
    .reduce((acc, p) => ({ ...acc, [p.replace(dir, '@')]: r(p) }), {});
}
