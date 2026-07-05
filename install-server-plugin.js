#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN_ID = 'tavern-notes';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function info(message) {
    console.log(`[Tavern Notes] ${message}`);
}

function fail(message) {
    console.error(`[Tavern Notes] ${message}`);
    process.exitCode = 1;
}

function exists(filePath) {
    return fs.existsSync(filePath);
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

function copyDirectory(source, target) {
    fs.mkdirSync(target, { recursive: true });

    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        const sourcePath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(sourcePath, targetPath);
        } else if (entry.isFile()) {
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
}

function installServerPlugin(rootDirectory, extensionDirectory) {
    const source = path.join(extensionDirectory, 'server-plugin', PLUGIN_ID);
    const target = path.join(rootDirectory, 'plugins', PLUGIN_ID);

    if (!exists(source)) {
        throw new Error(`找不到后端插件源目录：${source}`);
    }

    fs.mkdirSync(path.join(rootDirectory, 'plugins'), { recursive: true });

    if (exists(target)) {
        const backup = path.join(rootDirectory, 'plugins', `${PLUGIN_ID}.backup-${timestamp()}`);
        fs.renameSync(target, backup);
        info(`已备份旧后端插件：${backup}`);
    }

    copyDirectory(source, target);
    info(`已安装后端插件：${target}`);
}

function enableServerPlugins(rootDirectory) {
    const configPath = path.join(rootDirectory, 'config.yaml');

    if (!exists(configPath)) {
        throw new Error(`找不到 config.yaml：${configPath}`);
    }

    const backupPath = path.join(rootDirectory, `config.yaml.backup-before-${PLUGIN_ID}-${timestamp()}`);
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

function main() {
    try {
        const extensionDirectory = __dirname;
        const rootFromArgument = process.argv[2] ? path.resolve(process.argv[2]) : null;
        const rootDirectory = rootFromArgument || findSillyTavernRoot(extensionDirectory);

        if (!rootDirectory || !isSillyTavernRoot(rootDirectory)) {
            throw new Error([
                '没有找到 SillyTavern 根目录。',
                '请把本脚本放在已安装的 tavern-notes 扩展目录里运行，',
                '或者这样指定酒馆目录：node install-server-plugin.js "D:\\SillyTavern"',
            ].join(''));
        }

        info(`SillyTavern 目录：${rootDirectory}`);
        installServerPlugin(rootDirectory, extensionDirectory);
        enableServerPlugins(rootDirectory);

        info('安装完成。请重启 SillyTavern，然后刷新浏览器页面。');
    } catch (error) {
        fail(error.message || String(error));
    }
}

main();
