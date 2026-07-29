import { renderAppShellMarkup } from '../features/app-shell-markup.js';

export function renderFullAppShellMarkup(options) {
    return renderAppShellMarkup({
        ...options,
        idPrefix: 'tavern-notes',
        classPrefix: 'tn',
        brandIconMarkup: '<i class="fa-solid fa-book-open"></i>',
        capabilities: {
            storageMode: true,
            compatibilityInfo: false,
        },
        cleanupScanLabelKey: 'scanDuplicates',
    });
}
