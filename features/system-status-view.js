export function createSystemStatusView({ statusSelector }) {
    let mounted = false;
    return {
        mount() { mounted = true; },
        renderStatus(message) {
            if (!mounted) return;
            document.querySelectorAll(statusSelector).forEach(element => { element.textContent = message; });
        },
        destroy() { mounted = false; },
    };
}
