import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const mode = process.argv[2] || '--check';
if (!['--check', '--apply'].includes(mode) || process.argv.length > 3) {
    throw new Error('Usage: node scripts/sync-lite-shared-files.mjs [--check|--apply]');
}

const fullRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const liteRoot = resolve(fullRoot, '..', 'tavern-notes-lite');
const sharedFiles = Object.freeze([
    'shared/base.css',
    'core/theme-presets.js',
    'core/ui-class-names.js',
    'core/note-card.js',
    'features/theme-controller.js',
    'features/theme-studio.js',
    'features/theme-view.js',
    'features/app-shell-markup.js',
    'features/tag-view.js',
    'features/capture-view.js',
    'features/quick-reply-view.js',
    'features/share-card-view.js',
]);

let failed = false;

for (const relativePath of sharedFiles) {
    const source = resolve(fullRoot, relativePath);
    const target = resolve(liteRoot, relativePath);
    const sourceContent = await readFile(source);
    let targetContent = null;

    try {
        targetContent = await readFile(target);
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }

    const matches = targetContent?.equals(sourceContent) === true;
    if (mode === '--apply' && !matches) {
        await mkdir(dirname(target), { recursive: true });
        await copyFile(source, target);
        const writtenContent = await readFile(target);
        if (!writtenContent.equals(sourceContent)) {
            throw new Error(`Verification failed after syncing ${relativePath}`);
        }
        console.log(`synced ${relativePath}`);
        continue;
    }

    if (!matches) {
        console.error(`out of sync: ${relativePath}`);
        failed = true;
    } else {
        console.log(`ok ${relativePath}`);
    }
}

if (failed) process.exitCode = 1;
