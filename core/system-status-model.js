export function normalizeSystemStatus(status = {}) {
    return {
        user: status.user || '',
        version: status.version || '',
        totalNotes: Number(status.totalNotes || status.count || 0),
        approximateBytes: Number(status.approximateBytes || 0),
        lastExportAt: status.lastExportAt || '',
        healthy: status.healthy !== false,
    };
}
