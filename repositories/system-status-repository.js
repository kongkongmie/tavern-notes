import { normalizeSystemStatus } from '../core/system-status-model.js';

export function createSystemStatusRepository({ getStorageInfo }) {
    return {
        async getStatus() {
            return normalizeSystemStatus(await getStorageInfo());
        },
    };
}
