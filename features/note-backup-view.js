// Lists the automatic backups kept in the SillyTavern user folder and restores one on request.
export function createNoteBackupView({
    root,
    translate: t,
    escapeHtml,
    listBackups,
    restoreBackup,
    confirm = message => window.confirm(message),
    notify = () => {},
    onRestored = () => {},
    idPrefix = 'tavern-notes',
}) {
    const overlayId = `${idPrefix}-backup-menu`;
    let busy = false;

    function overlay() {
        const host = typeof root === 'function' ? root() : root;
        if (!host) return null;
        let element = host.querySelector(`#${overlayId}`);
        if (!element) {
            element = host.ownerDocument.createElement('div');
            element.id = overlayId;
            element.className = 'tn-backup-overlay';
            element.setAttribute('data-tn-overlay', 'dialog');
            element.setAttribute('aria-hidden', 'true');
            element.addEventListener('click', event => {
                if (event.target === element || event.target.closest('.tn-backup-close')) close();
                const button = event.target.closest('[data-backup-name]');
                if (button) restore(button.dataset.backupName, button.dataset.backupDay, button.dataset.backupCount);
            });
            host.append(element);
        }
        return element;
    }

    function label(item) {
        if (item.label === 'before-restore') return t('backupLabelBeforeRestore');
        if (item.label === 'migration') return t('backupLabelMigration');
        return '';
    }

    function render(items, error = null) {
        const element = overlay();
        if (!element) return;
        const rows = items.map(item => {
            const extra = label(item);
            return `<li class="tn-backup-item"><div><b>${escapeHtml(item.day || '')}</b>${extra ? `<small>${escapeHtml(extra)}</small>` : ''}<span>${escapeHtml(t('backupsCount', { count: Number(item.count || 0) }))}</span></div><button class="tn-soft-button" type="button" data-backup-name="${escapeHtml(item.name)}" data-backup-day="${escapeHtml(item.day || '')}" data-backup-count="${Number(item.count || 0)}"><i class="fa-solid fa-rotate-left"></i><span>${escapeHtml(t('backupRestore'))}</span></button></li>`;
        }).join('');
        element.innerHTML = `<div class="tn-export-card tn-backup-card" role="dialog" aria-label="${escapeHtml(t('backupsTitle'))}">
            <button class="tn-icon-button tn-backup-close" type="button" title="${escapeHtml(t('close'))}" aria-label="${escapeHtml(t('close'))}"><i class="fa-solid fa-xmark"></i></button>
            <div class="tn-export-title">${escapeHtml(t('backupsTitle'))}</div>
            <p class="tn-export-hint">${escapeHtml(t('backupsIntro'))}</p>
            ${error ? `<p class="tn-backup-error">${escapeHtml(t('backupsLoadFailed', { message: error.message }))}</p>` : ''}
            ${rows ? `<ul class="tn-backup-list">${rows}</ul>` : `<p class="tn-export-hint">${escapeHtml(t('backupsEmpty'))}</p>`}
        </div>`;
    }

    async function open() {
        const element = overlay();
        if (!element) return;
        element.classList.add('open');
        element.setAttribute('aria-hidden', 'false');
        render([]);
        try {
            render(await listBackups());
        } catch (error) {
            render([], error);
        }
    }

    function close() {
        const element = overlay();
        element?.classList.remove('open');
        element?.setAttribute('aria-hidden', 'true');
    }

    async function restore(name, day, count) {
        if (busy || !name) return;
        if (!confirm(t('backupRestoreConfirm', { day, count }))) return;
        busy = true;
        try {
            const result = await restoreBackup(name);
            notify(t('backupRestored', { count: result.restored }), 'success');
            await onRestored(result);
            render(await listBackups());
        } catch (error) {
            notify(error.message, 'error');
        } finally {
            busy = false;
        }
    }

    return { open, close, destroy: () => overlay()?.remove() };
}
