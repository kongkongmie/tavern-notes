export function createNoteBatchController({
    root,
    getVisibleNotes,
    renderList,
    exportController,
    mutationController,
    confirmDelete,
    onEvent = () => {},
    classPrefix = 'tn',
}) {
    let mounted = false;
    let active = false;
    const selected = new Map();
    let abortController = null;
    const c = name => `${classPrefix}-${name}`;

    function host() {
        return typeof root === 'function' ? root() : root;
    }

    function rememberVisible() {
        for (const note of getVisibleNotes()) {
            if (selected.has(String(note.id))) selected.set(String(note.id), note);
        }
    }

    function sync() {
        const panel = host();
        if (!panel) return;
        panel.classList.toggle(c('batch-mode'), active);
        panel.querySelector(`#tavern-notes-batch-bar`)?.classList.toggle(c('hidden'), !active);
        const count = panel.querySelector(`.${c('batch-count')}`);
        if (count) count.textContent = String(selected.size);
        panel.querySelectorAll(`.${c('batch-checkbox')}`).forEach(input => {
            input.checked = selected.has(String(input.value));
            input.closest(`.${c('note')}`)?.classList.toggle(c('batch-selected'), input.checked);
        });
    }

    function refresh() {
        rememberVisible();
        renderList();
        sync();
    }

    function setNote(note, checked) {
        if (!note?.id) return;
        const id = String(note.id);
        if (checked) selected.set(id, note);
        else selected.delete(id);
        sync();
    }

    async function exportSelected(format) {
        if (!selected.size) return onEvent('empty');
        const result = format === 'txt'
            ? await exportController.exportSelectedTxt([...selected.values()])
            : await exportController.exportSelectedJson([...selected.values()]);
        onEvent(result.ok ? 'exported' : 'error', result.error);
    }

    async function deleteSelected() {
        if (!selected.size) return onEvent('empty');
        if (!await confirmDelete(selected.size)) return;
        const result = await mutationController.deleteNotes([...selected.keys()]);
        if (!result.ok) return onEvent('error', result.error);
        const count = selected.size;
        selected.clear();
        active = false;
        refresh();
        onEvent('deleted', count);
    }

    return {
        mount() {
            if (mounted) return;
            const panel = host();
            if (!panel) return;
            abortController = new AbortController();
            panel.addEventListener('click', event => {
                const button = event.target.closest('button');
                if (button?.id === 'tavern-notes-batch-open') {
                    active = true;
                    refresh();
                } else if (button?.matches(`.${c('batch-cancel')}`)) {
                    active = false;
                    selected.clear();
                    refresh();
                } else if (button?.matches(`.${c('batch-all')}`)) {
                    getVisibleNotes().forEach(note => selected.set(String(note.id), note));
                    sync();
                } else if (button?.matches(`.${c('batch-invert')}`)) {
                    getVisibleNotes().forEach(note => setNote(note, !selected.has(String(note.id))));
                    sync();
                } else if (button?.matches(`.${c('batch-export-json')}`)) exportSelected('json');
                else if (button?.matches(`.${c('batch-export-txt')}`)) exportSelected('txt');
                else if (button?.matches(`.${c('batch-delete')}`)) deleteSelected();
                else if (active) {
                    const article = event.target.closest(`.${c('note')}`);
                    if (article && !event.target.closest('button, a, input, label')) {
                        const note = getVisibleNotes().find(item => String(item.id) === String(article.dataset.noteId));
                        setNote(note, !selected.has(String(article.dataset.noteId)));
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }
            }, { signal: abortController.signal });
            panel.addEventListener('change', event => {
                if (!event.target.matches(`.${c('batch-checkbox')}`)) return;
                const note = getVisibleNotes().find(item => String(item.id) === String(event.target.value));
                setNote(note, event.target.checked);
            }, { signal: abortController.signal });
            mounted = true;
            sync();
        },
        getState: () => ({ active, selectedIds: new Set(selected.keys()), count: selected.size }),
        sync,
        destroy() {
            abortController?.abort();
            abortController = null;
            mounted = false;
            active = false;
            selected.clear();
        },
    };
}
