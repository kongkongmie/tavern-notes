export function createFullHttpAdapter({ apiBase, getHeaders, translate }) {
    async function request(path, options = {}) {
        let response;
        try {
            response = await fetch(`${apiBase}${path}`, {
                ...options,
                headers: {
                    ...getHeaders(),
                    'Content-Type': 'application/json',
                    ...(options.headers || {}),
                },
            });
        } catch (error) {
            const friendly = new Error(`${translate('backendNetworkHelp')}\n\n${error.message}`);
            friendly.code = 'backend_unreachable';
            throw friendly;
        }
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) {
            if (response.status === 404 && path === '/status') {
                const friendly = new Error(translate('backendMissingHelp'));
                friendly.code = 'backend_missing';
                throw friendly;
            }
            if (response.status === 404 && path === '/import') {
                const friendly = new Error(translate('backendOutdatedHelp'));
                friendly.code = 'backend_outdated';
                throw friendly;
            }
            const raw = data.error || `${response.status} ${response.statusText || ''}`.trim();
            const message = raw.includes('自动备份失败')
                ? `${translate('backupFailedHelp')}\n\n${raw}`
                : translate('backendRequestHelp', { message: raw });
            const friendly = new Error(message);
            friendly.code = 'backend_request_failed';
            friendly.status = response.status;
            throw friendly;
        }
        return data;
    }

    async function requestFile(path, options = {}) {
        let response;
        try {
            response = await fetch(`${apiBase}${path}`, {
                ...options,
                headers: {
                    ...getHeaders(),
                    ...(options.headers || {}),
                },
            });
        } catch (error) {
            const friendly = new Error(`${translate('backendNetworkHelp')}\n\n${error.message}`);
            friendly.code = 'backend_unreachable';
            throw friendly;
        }
        if (!response.ok) {
            const message = await response.text().catch(() => `${response.status} ${response.statusText || ''}`.trim());
            const friendly = new Error(message || translate('exportFailed', { status: response.status }));
            friendly.status = response.status;
            throw friendly;
        }
        return response.text();
    }

    return { request, requestFile };
}
