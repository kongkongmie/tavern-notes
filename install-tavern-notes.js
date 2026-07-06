#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const EXTENSION_ID = 'tavern-notes';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function info(message) {
    console.log(`[Tavern Notes] ${message}`);
}

function exists(filePath) {
    return fs.existsSync(filePath);
}

function isSamePath(a, b) {
    return path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
}

function timestamp() {
    const now = new Date();
    const pad = value => String(value).padStart(2, '0');
    return [
        now.getFullYear(),
        pad(now.getMonth() + 1),
        pad(now.getDate()),
        pad(now.getHours()),
        pad(now.getMinutes()),
        pad(now.getSeconds()),
    ].join('');
}

function isSillyTavernRoot(directory) {
    return exists(path.join(directory, 'package.json'))
        && exists(path.join(directory, 'public', 'scripts', 'extensions'))
        && exists(path.join(directory, 'plugins'));
}

function findSillyTavernRoot(startDirectory) {
    let directory = path.resolve(startDirectory);

    while (true) {
        if (isSillyTavernRoot(directory)) return directory;

        const parent = path.dirname(directory);
        if (parent === directory) return null;
        directory = parent;
    }
}

function findSillyTavernRootFromPath(candidatePath) {
    if (!candidatePath) return null;

    let directory = path.resolve(candidatePath);

    if (exists(directory)) {
        const stat = fs.statSync(directory);
        if (stat.isFile()) directory = path.dirname(directory);
    } else if (path.extname(directory)) {
        directory = path.dirname(directory);
    }

    return findSillyTavernRoot(directory);
}

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

function extractWindowsPaths(text) {
    const matches = String(text || '').match(/[A-Za-z]:\\(?:[^<>:"|?*\r\n]+\\)*[^<>:"|?*\r\n]*/g) || [];
    return matches.map(value => value.trim().replace(/[)"']+$/g, ''));
}

function extractPosixPaths(text) {
    const matches = String(text || '').match(/\/(?:[^\s"'`<>|])+/g) || [];
    return matches.map(value => value.trim().replace(/[)"']+$/g, ''));
}

function findRunningSillyTavernRootOnWindows() {
    const powershellPath = process.env.SystemRoot
        ? path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
        : path.join(process.env.windir || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');

    if (!exists(powershellPath)) return null;

    const command = [
        '[Console]::OutputEncoding=[System.Text.Encoding]::UTF8;',
        "Get-CimInstance Win32_Process |",
        "Where-Object { $_.CommandLine -match 'SillyTavern|server\\.js|Start\\.bat|start\\.sh|npm.*start' } |",
        'ForEach-Object { $_.CommandLine }',
    ].join(' ');

    const outputText = execFileSync(powershellPath, ['-NoProfile', '-Command', command], {
        encoding: 'utf8',
        windowsHide: true,
    });

    for (const candidate of unique(extractWindowsPaths(outputText))) {
        const root = findSillyTavernRootFromPath(candidate);
        if (root) return root;
    }

    return null;
}

function findRunningSillyTavernRootOnPosix() {
    const outputText = execFileSync('ps', ['-eo', 'args='], {
        encoding: 'utf8',
    });

    const relevantLines = outputText
        .split(/\r?\n/)
        .filter(line => /SillyTavern|server\.js|Start\.bat|start\.sh|npm.*start/.test(line));

    for (const candidate of unique(relevantLines.flatMap(extractPosixPaths))) {
        const root = findSillyTavernRootFromPath(candidate);
        if (root) return root;
    }

    return null;
}

function findRunningSillyTavernRoot() {
    try {
        const root = process.platform === 'win32'
            ? findRunningSillyTavernRootOnWindows()
            : findRunningSillyTavernRootOnPosix();

        if (root) info(`已从正在运行的 SillyTavern 进程识别目录：${root}`);
        return root;
    } catch {
        return null;
    }
}

function normalizeUserPath(value) {
    return String(value || '')
        .trim()
        .replace(/^['"]|['"]$/g, '');
}

async function askForSillyTavernRoot() {
    const rl = readline.createInterface({ input, output });

    try {
        while (true) {
            const answer = await rl.question('请输入 SillyTavern 根目录路径，然后回车：');
            const directory = path.resolve(normalizeUserPath(answer));

            if (isSillyTavernRoot(directory)) return directory;
            console.log('这个目录不像 SillyTavern 根目录，请确认里面有 package.json、public、plugins。');
        }
    } finally {
        rl.close();
    }
}

function shouldSkipCopy(name) {
    return [
        '.git',
        'DEVELOPMENT_NOTES.md',
        'node_modules',
        'data',
        'release',
        'publish',
    ].includes(name);
}

function copyDirectory(source, target) {
    fs.mkdirSync(target, { recursive: true });

    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        if (shouldSkipCopy(entry.name)) continue;

        const sourcePath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(sourcePath, targetPath);
        } else if (entry.isFile()) {
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
}

function backupDirectoryIfExists(target) {
    if (!exists(target)) return null;

    const backup = `${target}.backup-${timestamp()}`;
    fs.renameSync(target, backup);
    return backup;
}

function installFrontend(rootDirectory, sourceDirectory) {
    const extensionsDirectory = path.join(rootDirectory, 'public', 'scripts', 'extensions', 'third-party');
    const target = path.join(extensionsDirectory, EXTENSION_ID);

    fs.mkdirSync(extensionsDirectory, { recursive: true });

    if (isSamePath(sourceDirectory, target)) {
        info(`前端扩展已经在正确位置：${target}`);
        return target;
    }

    const backup = backupDirectoryIfExists(target);
    if (backup) info(`已备份旧前端扩展：${backup}`);

    copyDirectory(sourceDirectory, target);
    info(`已安装前端扩展：${target}`);
    return target;
}

function installServerPlugin(rootDirectory, extensionDirectory) {
    const source = path.join(extensionDirectory, 'server-plugin', EXTENSION_ID);
    const target = path.join(rootDirectory, 'plugins', EXTENSION_ID);

    if (!exists(source)) {
        throw new Error(`找不到后端插件源目录：${source}`);
    }

    fs.mkdirSync(path.join(rootDirectory, 'plugins'), { recursive: true });

    const backup = backupDirectoryIfExists(target);
    if (backup) info(`已备份旧后端插件：${backup}`);

    copyDirectory(source, target);
    info(`已安装后端插件：${target}`);
}

function enableServerPlugins(rootDirectory) {
    const configPath = path.join(rootDirectory, 'config.yaml');

    if (!exists(configPath)) {
        throw new Error(`找不到 config.yaml：${configPath}`);
    }

    const backupPath = path.join(rootDirectory, `config.yaml.backup-before-${EXTENSION_ID}-${timestamp()}`);
    fs.copyFileSync(configPath, backupPath);

    const original = fs.readFileSync(configPath, 'utf8');
    let next = original;

    if (/^enableServerPlugins\s*:/m.test(next)) {
        next = next.replace(/^enableServerPlugins\s*:\s*.*$/m, 'enableServerPlugins: true');
    } else {
        next = `${next.replace(/\s*$/, '')}\n\n# Required by Tavern Notes server plugin\nenableServerPlugins: true\n`;
    }

    if (next !== original) {
        fs.writeFileSync(configPath, next, 'utf8');
        info(`已开启 enableServerPlugins，并备份配置：${backupPath}`);
    } else {
        info(`enableServerPlugins 已经开启，仍已备份配置：${backupPath}`);
    }
}

async function main() {
    const packageDirectory = __dirname;
    const rootFromArgument = process.argv[2] ? path.resolve(normalizeUserPath(process.argv[2])) : null;
    const rootDirectory = rootFromArgument
        || findSillyTavernRoot(packageDirectory)
        || findRunningSillyTavernRoot()
        || await askForSillyTavernRoot();

    if (!isSillyTavernRoot(rootDirectory)) {
        throw new Error(`不是有效的 SillyTavern 根目录：${rootDirectory}`);
    }

    info(`SillyTavern 目录：${rootDirectory}`);
    const installedExtensionDirectory = installFrontend(rootDirectory, packageDirectory);
    installServerPlugin(rootDirectory, installedExtensionDirectory);
    enableServerPlugins(rootDirectory);

    info('安装完成。请重启 SillyTavern，然后刷新浏览器页面。');
}

main().catch(error => {
    console.error(`[Tavern Notes] 安装失败：${error.message || String(error)}`);
    process.exitCode = 1;
});
