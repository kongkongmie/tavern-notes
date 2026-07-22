const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repositoryRoot = path.resolve(__dirname, '..');
const hDriveTestRoot = path.resolve(repositoryRoot, '..', '..');
const fixtureRoot = fs.mkdtempSync(path.join(hDriveTestRoot, '.tavern-notes-installer-smoke-'));

try {
    fs.mkdirSync(path.join(fixtureRoot, 'public', 'scripts', 'extensions'), { recursive: true });
    fs.mkdirSync(path.join(fixtureRoot, 'plugins'), { recursive: true });
    fs.writeFileSync(path.join(fixtureRoot, 'package.json'), '{}\n', 'utf8');
    fs.writeFileSync(path.join(fixtureRoot, 'config.yaml'), 'enableServerPlugins: false\n', 'utf8');

    const result = spawnSync(process.execPath, [path.join(repositoryRoot, 'install-tavern-notes.js'), fixtureRoot], {
        cwd: repositoryRoot,
        encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const frontend = path.join(fixtureRoot, 'public', 'scripts', 'extensions', 'third-party', 'tavern-notes');
    const backend = path.join(fixtureRoot, 'plugins', 'tavern-notes');
    [
        'index.js',
        'style.css',
        'manifest.json',
        'floor-capture.js',
        'core/note-card.js',
        'core/theme-runtime.js',
        'core/update-center.js',
        'CHANGELOG.md',
        'CHANGELOG.zh-CN.md',
    ].forEach(relativePath => assert.ok(fs.existsSync(path.join(frontend, relativePath)), `Missing installed frontend file: ${relativePath}`));
    assert.ok(fs.existsSync(path.join(backend, 'index.js')), 'Missing installed Server Plugin.');
    assert.match(fs.readFileSync(path.join(fixtureRoot, 'config.yaml'), 'utf8'), /^enableServerPlugins:\s*true$/m);
    assert.equal(JSON.parse(fs.readFileSync(path.join(frontend, 'manifest.json'), 'utf8')).version, '1.1.0');

    console.log('Full fresh-install smoke test passed.');
} finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
