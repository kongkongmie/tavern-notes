export function renderFullAppShellMarkup({ state, translate: t, escapeHtml: htmlEscape, languageOptions, getVisibleFilters, getFloorCaptureTagName, extensionVersion, renderThemeViewMarkup, themeCapabilities, renderThemeStudioMarkup, shareCardThemes, shareCardBackgrounds }) {
    return `
        <section id="tavern-notes-panel" aria-label="${htmlEscape(t('appName'))}">
            <header class="tn-header">
                <div class="tn-brand-mark"><i class="fa-solid fa-book-open"></i></div>
                <div class="tn-heading">
                    <div class="tn-title">${htmlEscape(t('appName'))} <span>@KKM</span><button id="tavern-notes-update-indicator" class="tn-update-indicator tn-hidden" type="button" title="${htmlEscape(t('viewUpdate'))}" aria-label="${htmlEscape(t('viewUpdate'))}"><i></i><span data-update-indicator-version></span></button></div>
                    <div class="tn-subtitle">${htmlEscape(t('subtitle'))}<button id="tavern-notes-storage-mode" class="tn-storage-mode-badge" type="button" title="${htmlEscape(t('chooseStorageMode'))}">${htmlEscape(t(state.storageMode === 'lite' ? 'storageModeLite' : 'storageModeFull'))}</button></div>
                </div>
                <div class="tn-window-actions">
                    <button id="tavern-notes-launcher-mode" class="tn-soft-button tn-window-soft-button" title="${htmlEscape(t('switchLauncherMode'))}" aria-label="${htmlEscape(t('switchLauncherMode'))}">
                        <i class="fa-solid fa-circle-dot"></i><span>${htmlEscape(t(state.launcherMode === 'floating' ? 'floatingBall' : 'toolbarButtons'))}</span>
                    </button>
                    <label class="tn-language-select" title="${htmlEscape(t('language'))}">
                        <i class="fa-solid fa-language"></i>
                        <select id="tavern-notes-language" aria-label="${htmlEscape(t('language'))}">
                            ${languageOptions.map(option => `<option value="${option.id}" ${option.id === state.language ? 'selected' : ''}>${option.id === 'auto' ? htmlEscape(t('autoLanguage')) : htmlEscape(option.label)}</option>`).join('')}
                        </select>
                    </label>
                    <button id="tavern-notes-theme" class="tn-icon-button" title="${htmlEscape(t('openThemePanel'))}" aria-label="${htmlEscape(t('openThemePanel'))}"><i class="fa-solid fa-palette"></i></button>
                    <button class="tn-icon-button tn-close" title="${htmlEscape(t('closeNotes'))}" aria-label="${htmlEscape(t('closeNotes'))}">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="tn-header-actions">
                    <button id="tavern-notes-new-note-open" class="tn-soft-button" title="${htmlEscape(t('newNote'))}" aria-label="${htmlEscape(t('newNote'))}"><i class="fa-solid fa-pen-to-square"></i><span>${htmlEscape(t('newNote'))}</span></button>
                    <button id="tavern-notes-selection-capture-setting" class="tn-soft-button ${state.showSelectionCaptureButton ? 'active' : ''}" title="${htmlEscape(t('selectionCaptureButtonTitle'))}"><i class="fa-solid fa-highlighter"></i><span>${htmlEscape(t('captureSelected'))}</span></button>
                    <button id="tavern-notes-floor-capture-open" class="tn-soft-button ${state.showFloorCaptureButton ? 'active' : ''}" title="${htmlEscape(t('floorCaptureEntryTitle'))}"><i class="fa-solid fa-file-lines"></i><span>${htmlEscape(t('captureFloor'))}</span></button>
                    <button id="tavern-notes-more-open" class="tn-soft-button" title="${htmlEscape(t('more'))}" aria-label="${htmlEscape(t('more'))}"><i class="fa-solid fa-ellipsis"></i><span>${htmlEscape(t('more'))}</span></button>
                    <div id="tavern-notes-more-menu" class="tn-header-popover tn-header-secondary"><button id="tavern-notes-auto-user-input" class="tn-soft-button ${state.autoCaptureUserInput ? 'active' : ''}" title="${htmlEscape(t('autoCaptureUserInputTitle'))}"><i class="fa-solid fa-keyboard"></i><span>${htmlEscape(t('autoCaptureUserInput'))}</span></button><button id="tavern-notes-user-input-cleanup-open" class="tn-soft-button" title="${htmlEscape(t('userInputCleanupIntro'))}"><i class="fa-solid fa-filter-circle-xmark"></i><span>${htmlEscape(t('userInputCleanup'))}</span></button><button id="tavern-notes-export" class="tn-soft-button" title="${htmlEscape(t('exportNotes'))}"><i class="fa-solid fa-download"></i><span>${htmlEscape(t('exportNotes'))}</span></button><button id="tavern-notes-storage-mode-open" class="tn-soft-button" title="${htmlEscape(t('chooseStorageMode'))}"><i class="fa-solid fa-database"></i><span>${htmlEscape(t('chooseStorageMode'))}</span></button><button id="tavern-notes-update-open" class="tn-soft-button" title="${htmlEscape(t('updateCenter'))}"><i class="fa-solid fa-clock-rotate-left"></i><span>${htmlEscape(t('updateCenter'))}</span></button><button id="tavern-notes-reset-floating" class="tn-soft-button" title="${htmlEscape(t('resetFloatingPosition'))}"><i class="fa-solid fa-location-crosshairs"></i><span>${htmlEscape(t('resetFloatingPosition'))}</span></button><button id="tavern-notes-apple-mode-main" class="tn-soft-button tn-hidden"><i class="fa-solid fa-moon"></i><span>${htmlEscape(t('appleThemeNight'))}</span></button></div>
                </div>
            </header>
            <div class="tn-search-row">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input id="tavern-notes-search" class="text_pole" type="search" placeholder="${htmlEscape(t('searchPlaceholder'))}" />
            </div>
            <div id="tavern-notes-tag-shelf" class="tn-tag-shelf tn-hidden" aria-label="${htmlEscape(t('tags'))}"></div>
            <div class="tn-shell">
                <nav class="tn-filters">
                    ${getVisibleFilters().map(filter => `
                        <button class="tn-filter ${filter.id === 'all' ? 'active' : ''}" data-filter="${filter.id}">
                            <span class="tn-filter-icon"><i class="fa-solid ${filter.icon}"></i></span>
                            <span class="tn-filter-text">
                                <b>${htmlEscape(t(filter.label))}</b>
                                <small>${htmlEscape(t(filter.hint))}</small>
                            </span>
                            <span class="tn-filter-count"></span>
                        </button>
                    `).join('')}
                </nav>
                <main id="tavern-notes-list" class="tn-list"></main>
            </div>
            <footer class="tn-footer">
                <span class="tavern-notes-status">${htmlEscape(t('connecting'))}</span>
                <div class="tn-pagination">
                    <button id="tavern-notes-prev" class="tn-page-button" title="${htmlEscape(t('prevPage'))}"><i class="fa-solid fa-chevron-left"></i></button>
                    <span id="tavern-notes-page-label">1 / 1</span>
                    <button id="tavern-notes-next" class="tn-page-button" title="${htmlEscape(t('nextPage'))}"><i class="fa-solid fa-chevron-right"></i></button>
                    <input id="tavern-notes-page-input" type="number" min="1" value="1" />
                    <button id="tavern-notes-page-jump" class="tn-page-button">${htmlEscape(t('jumpPage'))}</button>
                </div>
            </footer>
            <div id="tavern-notes-new-note-menu" aria-hidden="true"><form class="tn-edit-card tn-new-note-card"><button class="tn-icon-button tn-new-note-close" type="button"><i class="fa-solid fa-xmark"></i></button><div class="tn-export-title">${htmlEscape(t('newNote'))}</div><p class="tn-floor-capture-intro">${htmlEscape(t('newNoteUserHelp'))}</p><label class="tn-edit-field"><span>${htmlEscape(t('noteContent'))}</span><textarea id="tavern-notes-new-note-content" class="text_pole" maxlength="200000" required></textarea></label><label class="tn-edit-field"><span>${htmlEscape(t('tags'))}</span><input id="tavern-notes-new-note-tags" class="text_pole" value="${htmlEscape(t('inspirationTag'))}"></label><button class="menu_button tn-new-note-save" type="submit"><i class="fa-solid fa-floppy-disk"></i><span>${htmlEscape(t('saveNote'))}</span></button></form></div>
            <div id="tavern-notes-modal" aria-hidden="true">
                <div class="tn-modal-card">
                    <button class="tn-icon-button tn-modal-close" title="${htmlEscape(t('close'))}" aria-label="${htmlEscape(t('close'))}"><i class="fa-solid fa-xmark"></i></button>
                    <div class="tn-modal-kicker"></div>
                    <div class="tn-modal-title"></div>
                    <div class="tn-modal-content"></div>
                    <div class="tn-modal-actions">
                        <button type="button" data-modal-action="fill" title="${htmlEscape(t('fillInput'))}" aria-label="${htmlEscape(t('fillInput'))}"><i class="fa-solid fa-arrow-turn-down"></i><span>${htmlEscape(t('fillInput'))}</span></button>
                        <button type="button" data-modal-action="copy" title="${htmlEscape(t('copy'))}" aria-label="${htmlEscape(t('copy'))}"><i class="fa-solid fa-copy"></i><span>${htmlEscape(t('copy'))}</span></button>
                        <button type="button" data-modal-action="share" title="${htmlEscape(t('share'))}" aria-label="${htmlEscape(t('share'))}"><i class="fa-solid fa-share-nodes"></i><span>${htmlEscape(t('share'))}</span></button>
                        <button type="button" data-modal-action="edit" title="${htmlEscape(t('edit'))}" aria-label="${htmlEscape(t('edit'))}"><i class="fa-solid fa-pen"></i><span>${htmlEscape(t('edit'))}</span></button>
                        <button type="button" data-modal-action="delete" title="${htmlEscape(t('delete'))}" aria-label="${htmlEscape(t('delete'))}"><i class="fa-solid fa-trash"></i><span>${htmlEscape(t('delete'))}</span></button>
                    </div>
                </div>
            </div>
            <div id="tavern-notes-edit-menu" aria-hidden="true">
                <form class="tn-edit-card">
                    <button class="tn-icon-button tn-edit-close" type="button" title="${htmlEscape(t('close'))}" aria-label="${htmlEscape(t('close'))}"><i class="fa-solid fa-xmark"></i></button>
                    <div class="tn-export-title">${htmlEscape(t('editNote'))}</div>
                    <label class="tn-edit-field">
                        <span>${htmlEscape(t('noteContent'))}</span>
                        <textarea id="tavern-notes-edit-content" class="text_pole" maxlength="200000" required></textarea>
                    </label>
                    <div class="tn-edit-field">
                        <span>${htmlEscape(t('tags'))}</span>
                        <div class="tn-tag-editor">
                            <div id="tavern-notes-edit-tag-chips" class="tn-edit-tag-chips"></div>
                            <input id="tavern-notes-edit-tags" type="text" maxlength="820" placeholder="${htmlEscape(t('tagsPlaceholder'))}" autocomplete="off" />
                        </div>
                        <small>${htmlEscape(t('tagsHelp'))}</small>
                    </div>
                    <div class="tn-tag-suggestions-wrap">
                        <small>${htmlEscape(t('tagSuggestions'))}</small>
                        <div id="tavern-notes-tag-suggestions" class="tn-tag-suggestions"></div>
                    </div>
                    <button class="menu_button tn-edit-save" type="submit"><i class="fa-solid fa-floppy-disk"></i><span>${htmlEscape(t('saveChanges'))}</span></button>
                </form>
            </div>
            <div id="tavern-notes-tag-library" aria-hidden="true">
                <section class="tn-tag-library-card">
                    <button class="tn-icon-button tn-tag-library-close" type="button" title="${htmlEscape(t('close'))}" aria-label="${htmlEscape(t('close'))}"><i class="fa-solid fa-xmark"></i></button>
                    <div class="tn-tag-library-heading">
                        <span class="tn-tag-library-mark"><i class="fa-solid fa-tags"></i></span>
                        <div><div class="tn-export-title">${htmlEscape(t('tagLibrary'))}</div><p class="tn-tag-library-intro">${htmlEscape(t('tagLibraryIntro'))}</p></div>
                    </div>
                    <label class="tn-tag-library-search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input id="tavern-notes-tag-search" class="text_pole" type="search" placeholder="${htmlEscape(t('searchTags'))}" />
                    </label>
                    <div class="tn-tag-sort" role="group">
                        <button class="tn-tag-sort-button active" type="button" data-tag-sort="count"><i class="fa-solid fa-arrow-down-wide-short"></i><span>${htmlEscape(t('sortByCount'))}</span></button>
                        <button class="tn-tag-sort-button" type="button" data-tag-sort="name"><i class="fa-solid fa-arrow-down-a-z"></i><span>${htmlEscape(t('sortByName'))}</span></button>
                    </div>
                    <div id="tavern-notes-tag-library-list" class="tn-tag-library-list"></div>
                </section>
            </div>
            <div id="tavern-notes-export-menu" aria-hidden="true">
                <div class="tn-export-card">
                    <div class="tn-export-title">${htmlEscape(t('exportNotes'))}</div>
                    <div class="tn-export-scope">
                        <div class="tn-export-scope-label">${htmlEscape(t('exportScope'))}</div>
                        <div class="tn-export-scope-options" role="group" aria-label="${htmlEscape(t('exportScope'))}">
                            <button class="tn-export-scope-choice active" data-scope="all" type="button">${htmlEscape(t('allNotes'))}</button>
                            <button class="tn-export-scope-choice" data-scope="page" type="button">${htmlEscape(t('currentPage'))}</button>
                        </div>
                        <small class="tn-export-hint">${htmlEscape(t('exportHint'))}</small>
                    </div>
                    <button class="tn-export-choice" data-format="json" title="JSON"><i class="fa-solid fa-file-code"></i><span>${htmlEscape(t('exportJson'))}</span></button>
                    <button class="tn-export-choice" data-format="txt" title="TXT"><i class="fa-solid fa-file-lines"></i><span>${htmlEscape(t('exportTxt'))}</span></button>
                    <button id="tavern-notes-import-json" class="tn-export-choice" type="button"><i class="fa-solid fa-file-import"></i><span>${htmlEscape(t('importJson'))}</span></button>
                    <input id="tavern-notes-import-json-file" type="file" accept=".json,application/json" hidden />
                </div>
            </div>
            <div id="tavern-notes-floor-capture-menu" aria-hidden="true">
                <div class="tn-floor-capture-card">
                    <button class="tn-icon-button tn-floor-capture-close" title="${htmlEscape(t('close'))}" aria-label="${htmlEscape(t('close'))}"><i class="fa-solid fa-xmark"></i></button>
                    <div class="tn-export-title">${htmlEscape(t('floorCaptureSettingsTitle'))}</div>
                    <p class="tn-floor-capture-intro">${htmlEscape(t('floorCaptureSettingsIntro'))}</p>
                    <button id="tavern-notes-floor-capture-setting" class="tn-soft-button tn-floor-capture-toggle ${state.showFloorCaptureButton ? 'active' : ''}" title="${htmlEscape(t('floorCaptureButtonTitle'))}" aria-label="${htmlEscape(t('floorCaptureButtonTitle'))}">
                        <i class="fa-solid fa-file-lines"></i><span>${htmlEscape(t('floorCaptureButton'))}</span>
                    </button>
                    <div class="tn-floor-capture-help">
                        <b>${htmlEscape(t('floorCaptureStepsTitle'))}</b>
                        <small>${htmlEscape(t('floorCaptureSteps'))}</small>
                    </div>
                    <div class="tn-floor-capture-help">
                        <b>${htmlEscape(t('floorCaptureContentTitle'))}</b>
                        <small>${htmlEscape(t('floorCaptureContentHelp'))}</small>
                        <code>${htmlEscape(t('floorCaptureExample'))}</code>
                    </div>
                    <div class="tn-floor-capture-help">
                        <b>${htmlEscape(t('floorCaptureTroubleTitle'))}</b>
                        <small>${htmlEscape(t('floorCaptureTroubleHelp'))}</small>
                    </div>
                    <section class="tn-floor-exclude-section">
                        <div><b>${htmlEscape(t('excludeTagsTitle'))}</b><small>${htmlEscape(t('excludeTagsHelp'))}</small></div>
                        <div class="tn-floor-exclude-add"><input id="tavern-notes-floor-exclude-input" class="text_pole" type="text" placeholder="${htmlEscape(t('excludeTagPlaceholder'))}"><button id="tavern-notes-floor-exclude-add" type="button" title="${htmlEscape(t('addExcludedTag'))}" aria-label="${htmlEscape(t('addExcludedTag'))}"><i class="fa-solid fa-plus"></i><span>${htmlEscape(t('addExcludedTag'))}</span></button></div>
                        <div id="tavern-notes-floor-exclude-tags" class="tn-floor-exclude-tags"></div>
                    </section>
                    <section class="tn-floor-content-tag-section">
                        <div><b>${htmlEscape(t('floorCaptureAdvanced'))}</b><small>${htmlEscape(t('floorCaptureSelectorHelp'))}</small></div>
                        <div id="tavern-notes-floor-capture-selector-summary" class="tn-floor-capture-selector-summary"></div>
                        <div class="tn-floor-selector-add">
                            <input id="tavern-notes-floor-capture-selector" class="text_pole" type="text" value="${htmlEscape(getFloorCaptureTagName())}" placeholder="${htmlEscape(t('floorCaptureSelectorPlaceholder'))}" />
                            <button id="tavern-notes-floor-capture-selector-save" type="button"><i class="fa-solid fa-floppy-disk"></i><span>${htmlEscape(t('save'))}</span></button>
                        </div>
                    </section>
                </div>
            </div>
            <div id="tavern-notes-update-menu" aria-hidden="true">
                <section class="tn-update-card">
                    <button class="tn-icon-button tn-update-close" type="button" title="${htmlEscape(t('close'))}" aria-label="${htmlEscape(t('close'))}"><i class="fa-solid fa-xmark"></i></button>
                    <div class="tn-update-heading"><span><i class="fa-solid fa-clock-rotate-left"></i></span><div><div class="tn-export-title">${htmlEscape(t('updateCenter'))}</div><p>${htmlEscape(t('updateCenterIntro'))}</p></div></div>
                    <div class="tn-update-summary"><div><small>${htmlEscape(t('installedVersion'))}</small><b data-update-installed>v${htmlEscape(extensionVersion)}</b></div><i class="fa-solid fa-arrow-right"></i><div><small>${htmlEscape(t('latestVersion'))}</small><b data-update-latest>—</b></div><strong data-update-status>${htmlEscape(t('checkUpdates'))}</strong></div>
                    <div class="tn-update-actions"><button id="tavern-notes-update-check" type="button"><i class="fa-solid fa-rotate"></i><span>${htmlEscape(t('checkUpdates'))}</span></button><button id="tavern-notes-update-manager" type="button"><i class="fa-solid fa-cubes"></i><span>${htmlEscape(t('openExtensionManager'))}</span></button><button id="tavern-notes-update-repository" type="button"><i class="fa-brands fa-github"></i><span>${htmlEscape(t('openRepository'))}</span></button></div>
                    <small class="tn-update-instructions">${htmlEscape(t('updateInstructions'))}</small>
                    <div class="tn-update-log-heading"><i class="fa-regular fa-clipboard"></i><b>${htmlEscape(t('changelogTitle'))}</b></div>
                    <div id="tavern-notes-update-log" class="tn-update-log"><div class="tn-update-empty">${htmlEscape(t('noChangelog'))}</div></div>
                </section>
            </div>
            <div id="tavern-notes-user-input-cleanup-menu" aria-hidden="true">
                <div class="tn-user-input-cleanup-card">
                    <button class="tn-icon-button tn-user-input-cleanup-close" title="${htmlEscape(t('close'))}" aria-label="${htmlEscape(t('close'))}"><i class="fa-solid fa-xmark"></i></button>
                    <div class="tn-export-title">${htmlEscape(t('userInputCleanupTitle'))}</div>
                    <p class="tn-floor-capture-intro">${htmlEscape(t('userInputCleanupIntro'))}</p>
                    <label class="tn-input-cleanup-toggle"><input id="tavern-notes-collapse-repeated-input" type="checkbox" ${state.collapseRepeatedUserInput ? 'checked' : ''}><span><b>${htmlEscape(t('collapseRepeatedInput'))}</b><small>${htmlEscape(t('collapseRepeatedHelp'))}</small></span></label>
                    <div class="tn-input-rule-search"><i class="fa-solid fa-magnifying-glass"></i><input id="tavern-notes-input-rule-search" type="search" placeholder="${htmlEscape(t('filterInputRules'))}"></div>
                    <div class="tn-input-rule-columns">
                        ${['exact', 'prefix'].map(kind => `<section class="tn-input-rule-section"><div class="tn-input-rule-heading"><b>${htmlEscape(t(kind === 'exact' ? 'ignoreExactLabel' : 'ignorePrefixLabel'))}</b><span data-rule-count="${kind}">0</span></div><div class="tn-input-rule-add"><textarea data-rule-input="${kind}" rows="2" placeholder="${htmlEscape(t(kind === 'exact' ? 'ignoreExactPlaceholder' : 'ignorePrefixPlaceholder'))}"></textarea><button type="button" data-rule-add="${kind}" title="${htmlEscape(t('addInputRules'))}"><i class="fa-solid fa-plus"></i></button></div><div class="tn-input-rule-list" data-rule-list="${kind}"></div></section>`).join('')}
                    </div>
                    <section id="tavern-notes-input-dedupe-preview" class="tn-dedupe-preview tn-hidden"><div class="tn-dedupe-preview-summary"></div><div class="tn-dedupe-preview-list"></div><div class="tn-dedupe-preview-actions"><button id="tavern-notes-input-dedupe-cancel" type="button">${htmlEscape(t('cancelCleanup'))}</button><button id="tavern-notes-input-dedupe-confirm" type="button"><i class="fa-solid fa-broom"></i><span>${htmlEscape(t('confirmCleanup'))}</span></button></div></section>
                    <div class="tn-input-cleanup-actions"><button id="tavern-notes-input-rules-save" class="tn-soft-button"><i class="fa-solid fa-floppy-disk"></i><span>${htmlEscape(t('saveInputRules'))}</span></button><button id="tavern-notes-input-dedupe-scan" class="tn-history-cleanup-button"><i class="fa-solid fa-broom"></i><span>${htmlEscape(t('scanDuplicates'))}</span></button></div>
                </div>
            </div>
            ${renderThemeViewMarkup({
                idPrefix: 'tavern-notes',
                classPrefix: 'tn',
                translate: t,
                escapeHtml: htmlEscape,
                capabilities: themeCapabilities,
                studioMarkup: renderThemeStudioMarkup({ translate: t, escapeHtml: htmlEscape }),
            })}
            <div id="tavern-notes-share-menu" aria-hidden="true">
                <div class="tn-share-card">
                    <button class="tn-icon-button tn-share-close" title="${htmlEscape(t('close'))}" aria-label="${htmlEscape(t('close'))}"><i class="fa-solid fa-xmark"></i></button>
                    <div class="tn-share-preview-wrap">
                        <canvas id="tavern-notes-share-canvas" width="900" height="1400"></canvas>
                    </div>
                    <div class="tn-share-controls">
                        <div class="tn-export-title">${htmlEscape(t('shareCard'))}</div>
                        <label class="tn-share-label">${htmlEscape(t('theme'))}</label>
                        <div class="tn-share-theme-row">
                            ${shareCardThemes.map(theme => `<button class="tn-share-choice" data-share-theme="${theme.id}" type="button">${htmlEscape(t(theme.labelKey))}</button>`).join('')}
                        </div>
                        <label class="tn-share-label">${htmlEscape(t('font'))}</label>
                        <input id="tavern-notes-share-font" class="tn-theme-input" type="text" placeholder='例如 STDongGuanTi, 思源宋体, serif' />
                        <label class="tn-share-label">${htmlEscape(t('savedFonts'))}</label>
                        <select id="tavern-notes-share-saved-fonts" class="tn-theme-input"></select>
                        <label class="tn-share-label">${htmlEscape(t('fontSize'))} <span id="tavern-notes-share-font-size-value">80%</span></label>
                        <input id="tavern-notes-share-font-size" type="range" min="65" max="110" step="5" value="80" />
                        <label class="tn-share-label">${htmlEscape(t('fontImport'))}</label>
                        <textarea id="tavern-notes-share-font-import" class="tn-share-font-import" spellcheck="false" placeholder='https://fontsapi.zeoseven.com/488/main/result.css'></textarea>
                        <div class="tn-share-help">
                            ${htmlEscape(t('fontHelp'))}
                            <a href="https://fonts.zeoseven.com/" target="_blank" rel="noopener noreferrer">${htmlEscape(t('findFonts'))}</a>
                        </div>
                        <button id="tavern-notes-share-import-font" class="tn-export-choice tn-share-wide-action" type="button"><i class="fa-solid fa-font"></i><span>${htmlEscape(t('importFont'))}</span></button>
                        <label class="tn-share-label">${htmlEscape(t('importLocalFont'))}</label>
                        <button id="tavern-notes-share-import-local-font" class="tn-export-choice tn-share-wide-action" type="button"><i class="fa-solid fa-file-import"></i><span>${htmlEscape(t('importLocalFont'))}</span></button>
                        <label class="tn-share-label">${htmlEscape(t('background'))}</label>
                        <div class="tn-share-bg-row">
                            ${shareCardBackgrounds.map(color => `<button class="tn-share-bg" data-share-bg="${color}" type="button" style="--share-bg:${color}"></button>`).join('')}
                        </div>
                        <label class="tn-share-label">${htmlEscape(t('display'))}</label>
                        <div class="tn-share-toggle-row">
                            <label><input id="tavern-notes-share-show-character" type="checkbox" />${htmlEscape(t('characterName'))}</label>
                            <label><input id="tavern-notes-share-show-date" type="checkbox" />${htmlEscape(t('date'))}</label>
                        </div>
                        <div class="tn-share-actions">
                            <button id="tavern-notes-share-redraw" class="tn-export-choice" type="button"><i class="fa-solid fa-wand-magic-sparkles"></i><span>${htmlEscape(t('redrawPreview'))}</span></button>
                            <button id="tavern-notes-share-download" class="tn-export-choice" type="button"><i class="fa-solid fa-download"></i><span>${htmlEscape(t('exportPng'))}</span></button>
                        </div>
                        <input id="tavern-notes-share-local-font-file" type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" hidden />
                    </div>
                    <style id="tavern-notes-share-font-style"></style>
                </div>
            </div>
        </section>
    `;
}
