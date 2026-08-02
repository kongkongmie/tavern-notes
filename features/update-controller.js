import { shouldShowUpdateNotice } from '../core/update-model.js';

export function createUpdateController({ repository, view, fallbackVersion, notify = () => {}, setStatus = () => {}, confirmUpdate = async () => true, onUpdated = async () => {}, today = () => new Date().toDateString() }) {
    let mounted = false;
    let generation = 0;
    let info = null;
    let checking = false;
    let updating = false;

    function render() {
        if (mounted) view.render({ info, checking, updating, fallbackVersion });
    }

    async function update() {
        if (!mounted || updating || !info?.hasUpdate) return { ok: false, unavailable: true };
        if (!await confirmUpdate(info)) return { ok: false, cancelled: true };
        updating = true;
        render();
        try {
            const result = await repository.update();
            const completedInfo = { ...info };
            info = { ...info, installedVersion: info.latestVersion, hasUpdate: false };
            await onUpdated(result, completedInfo);
            return { ok: true, value: result };
        } catch (error) {
            notify({ error, updateFailed: true });
            return { ok: false, error };
        } finally {
            updating = false;
            render();
        }
    }

    async function check({ notifyAvailable = true, throwOnError = false } = {}) {
        const request = ++generation;
        checking = true;
        render();
        try {
            const result = await repository.check();
            if (!mounted || request !== generation) return { stale: true };
            info = result;
            if (result.hasUpdate && notifyAvailable) {
                const previous = repository.readNotice();
                const date = today();
                if (shouldShowUpdateNotice(previous, result.latestVersion, date)) {
                    repository.writeNotice({ version: result.latestVersion, date });
                    if (!notify(result)) setStatus(result);
                }
            }
            return result;
        } catch (error) {
            if (mounted && request === generation) {
                info = { error: true, installedVersion: await repository.getInstalledVersion(), changelog: [] };
                if (throwOnError) throw error;
            }
            return info;
        } finally {
            if (mounted && request === generation) {
                checking = false;
                render();
            }
        }
    }

    return {
        mount() {
            if (mounted) return;
            mounted = true;
            view.mount({
                onCheck: () => check({ notifyAvailable: false, throwOnError: true }),
                onUpdate: update,
                onOpen: () => { render(); if (!info && !checking) check({ notifyAvailable: false }); },
            });
        },
        check,
        update,
        open() { view.open(); },
        close() { view.close(); },
        getState: () => ({ info, checking }),
        destroy() {
            mounted = false;
            generation += 1;
            checking = false;
            updating = false;
            view.destroy();
        },
    };
}
