import fs from 'node:fs/promises';
import path from 'node:path';

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function copyDir(src, dest) {
  await ensureDir(path.dirname(dest));
  await fs.rm(dest, { recursive: true, force: true });
  await fs.cp(src, dest, { recursive: true });
}

async function main() {
  const projectRoot = process.cwd();

  const nextStaticSrc = path.join(projectRoot, '.next', 'static');
  const publicSrc = path.join(projectRoot, 'public');

  const standaloneRoot = path.join(projectRoot, '.next', 'standalone');
  const standaloneNextStaticDest = path.join(standaloneRoot, '.next', 'static');
  const standalonePublicDest = path.join(standaloneRoot, 'public');

  if (!(await exists(standaloneRoot))) {
    throw new Error(
      "Missing .next/standalone. Did you run 'next build' with output: 'standalone'?"
    );
  }

  if (await exists(nextStaticSrc)) {
    await copyDir(nextStaticSrc, standaloneNextStaticDest);
    // eslint-disable-next-line no-console
    console.log('Copied:', path.relative(projectRoot, nextStaticSrc), '->', path.relative(projectRoot, standaloneNextStaticDest));
  }

  if (await exists(publicSrc)) {
    await copyDir(publicSrc, standalonePublicDest);
    // eslint-disable-next-line no-console
    console.log('Copied:', path.relative(projectRoot, publicSrc), '->', path.relative(projectRoot, standalonePublicDest));
  }
}

await main();
