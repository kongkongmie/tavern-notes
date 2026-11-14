export function createSystemStatusController({ repository, view, formatStatus, onStatus = () => {}, onError = () => {} }) {
    let mounted = false;
    let generation = 0;
    let lastStatus = null;
    async function refresh() {
        const request = ++generation;
        view.setLoading?.(true);
        try {
            const status = await repository.getStatus();
            if (!mounted || request !== generation) return { stale: true };
            lastStatus = status;
            onStatus(status);
            view.renderStatus?.(formatStatus(status));
            return status;
        } catch (error) {
            if (mounted && request === generation) onError(error);
            throw error;
        } finally {
            if (mounted && request === generation) view.setLoading?.(false);
        }
    }
    return {
        mount() { if (!mounted) { mounted = true; view.mount?.(); } },
        refresh,
        getStatus: () => lastStatus,
        destroy() { mounted = false; generation += 1; lastStatus = null; view.destroy?.(); },
    };
}
