import {
    assertNoteRepository,
    NOTE_REPOSITORY_METHODS,
    NoteRepositoryError,
} from '../core/note-repository-contract.js';

export function createModeNoteRepository({ getMode, repositories }) {
    if (typeof getMode !== 'function') throw new TypeError('Mode Note Repository requires getMode().');
    const validated = Object.fromEntries(
        Object.entries(repositories || {}).map(([mode, repository]) => [mode, assertNoteRepository(repository)]),
    );
    const delegated = {};
    for (const method of NOTE_REPOSITORY_METHODS) {
        delegated[method] = (...args) => {
            const repository = validated[getMode()];
            if (!repository) {
                throw new NoteRepositoryError(
                    'STORAGE_UNAVAILABLE',
                    'No Note Repository is configured for the current storage mode.',
                    { operation: method },
                );
            }
            return repository[method](...args);
        };
    }
    return delegated;
}
