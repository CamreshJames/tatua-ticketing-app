/**
 * Creates a dynamic, interactive, unstyled data table with external modal controls.
 * @brief Initializes a feature-rich table with support for multi-column sorting,
 *        multi-rule filtering, pagination, and row selection. This component
 *        is style-agnostic and relies on a `dataSource` function for all data operations,
 *        making it compatible with any server-side API (e.g., OData, REST, GraphQL).
 *
 * @param {string} containerId The ID of the HTML element where the table will be rendered.
 * @param {Object} config The configuration object for the table.
 * @param {Array} config.columns An array of column definition objects. Each needs `id` and `caption`.
 * @param {Function} config.dataSource A function for fetching data. Receives `{ page, pageSize, sorters, filters }`
 *                                     and must return a Promise resolving to `{ data: Array, totalCount: number }`.
 * @param {string} config.keyField The unique identifier property in your data.
 * @param {Object} [config.pagination] Pagination settings. E.g., `{ enabled: true, pageSize: 10 }`.
 * @param {boolean} [config.selectable=false] Enables row selection via checkboxes.
 * @param {string} [config.emptyMessage="No data available"] Message for when the table is empty.
 * @param {boolean} [config.logging=false] Enables detailed console logging for debugging.
 * @param {Object} [config.controls] Configuration for linking external control elements.
 * @returns {Object} An API to interact with the table instance (refresh, getState).
 */
export function createDynamicTable(containerId, config) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`[DynamicTable] Error: Container #${containerId} not found.`);
        return {};
    }

    // --- Configuration & State ---
    const settings = {
        dataSource: null,
        columns: [],
        keyField: null,
        emptyMessage: "No data available",
        selectable: false,
        logging: false,
        ...config,
        pagination: { enabled: true, pageSize: 8, ...config.pagination },
    };

    if (typeof settings.dataSource !== 'function') {
        console.error("[DynamicTable] 'dataSource' must be a function that returns a Promise.");
        container.innerHTML = `<p>Configuration Error: 'dataSource' function is missing.</p>`;
        return {};
    }

    const state = {
        data: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
        filters: [], // Array: [{ column, operator, value }]
        sorters: [], // Array: [{ column, order }]
        selectedRows: new Set(),
    };

    const elements = { wrapper: null, table: null, thead: null, tbody: null, pagination: null };
    const logger = {
        log: (...args) => settings.logging && console.log(`[DynamicTable:${containerId}]`, ...args),
    };

    // --- Core Logic ---
    const sanitize = (str) => {
        const temp = document.createElement('div');
        temp.textContent = String(str ?? '');
        return temp.innerHTML;
    };

    const fetchServerData = async () => {
        logger.log('Fetching server data with state:', state);
        elements.wrapper?.classList.add('is-loading');
        try {
            const { data, totalCount } = await settings.dataSource({
                page: state.currentPage,
                pageSize: settings.pagination.pageSize,
                sorters: state.sorters,
                filters: state.filters,
            });
            state.data = Array.isArray(data) ? data : [];
            state.totalCount = totalCount || 0;
            state.totalPages = settings.pagination.enabled ? Math.ceil(state.totalCount / settings.pagination.pageSize) : 1;
            state.currentPage = Math.max(1, Math.min(state.currentPage, state.totalPages || 1));
        } catch (error) {
            console.error('[DynamicTable] dataSource function failed:', error);
            state.data = [];
            state.totalCount = 0;
            if (elements.tbody) {
                const colSpan = settings.columns.length + (settings.selectable ? 1 : 0);
                elements.tbody.innerHTML = `<tr><td colspan="${colSpan}" data-error-message>Error fetching data.</td></tr>`;
            }
        } finally {
            elements.wrapper?.classList.remove('is-loading');
        }
    };

    // --- DOM Rendering ---
    const renderHeader = () => {
        const selectHeader = settings.selectable ? `<th scope="col"><input type="checkbox" data-select-all></th>` : '';
        const headerCells = settings.columns.map(c => `<th scope="col" data-column-id="${c.id}">${sanitize(c.caption || c.id)}</th>`).join('');
        return `<thead><tr data-header-row>${selectHeader}${headerCells}</tr></thead>`;
    };

    const renderBody = () => {
        if (state.data.length === 0) {
            const colSpan = settings.columns.length + (settings.selectable ? 1 : 0);
            return `<tr><td colspan="${colSpan}" data-empty-message>${settings.emptyMessage}</td></tr>`;
        }
        return state.data.map(row => {
            const rowId = row[settings.keyField];
            const isSelected = state.selectedRows.has(rowId);
            const selectCell = settings.selectable ? `<td><input type="checkbox" data-row-id="${sanitize(rowId)}" ${isSelected ? 'checked' : ''}></td>` : '';
            const cells = settings.columns.map(col => {
                const value = col.id.split('.').reduce((o, i) => o?.[i], row);
                const content = col.render ? col.render(row) : sanitize(value ?? '–');
                return `<td>${content}</td>`;
            }).join('');
            return `<tr data-row-key="${sanitize(rowId)}" aria-selected="${isSelected}">${selectCell}${cells}</tr>`;
        }).join('');
    };

    const renderPagination = () => {
        if (!settings.pagination.enabled) return '';
        const startRow = state.totalCount > 0 ? (state.currentPage - 1) * settings.pagination.pageSize + 1 : 0;
        const endRow = Math.min(state.currentPage * settings.pagination.pageSize, state.totalCount);
        const totalPages = Math.max(1, state.totalPages); // Ensure totalPages is at least 1

        return `
            <div data-pagination-info>Showing ${startRow}-${endRow} of ${state.totalCount}</div>
            <div data-pagination-controls>
                <button data-page="prev" ${state.currentPage <= 1 ? 'disabled' : ''}>Previous</button>
                <span>Page ${state.currentPage} of ${totalPages}</span>
                <button data-page="next" ${state.currentPage >= totalPages ? 'disabled' : ''}>Next</button>
            </div>`;
    };

    const update = () => {
        logger.log("Updating table content...");
        if (elements.tbody) elements.tbody.innerHTML = renderBody();
        if (elements.pagination) elements.pagination.innerHTML = renderPagination();
    };

    // --- Modal Control Utility ---
    const setupModal = (options) => {
        const { modalId, triggerId, stateKey, rowContainerId, addBtnId, resetBtnId, submitBtnId, rowBuilderFn, stateReaderFn } = options;
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const openModal = () => modal.classList.add('visible');
        const closeModal = () => modal.classList.remove('visible');

        document.getElementById(triggerId)?.addEventListener('click', () => {
            const container = modal.querySelector(`#${rowContainerId}`);
            container.innerHTML = '';
            const currentState = state[stateKey];
            currentState.forEach(item => container.appendChild(rowBuilderFn(item)));
            if (currentState.length === 0) container.appendChild(rowBuilderFn());
            openModal();
        });

        modal.querySelector('.close-modal')?.addEventListener('click', closeModal);
        modal.querySelector(`#${addBtnId}`)?.addEventListener('click', () => {
            modal.querySelector(`#${rowContainerId}`).appendChild(rowBuilderFn());
        });

        modal.querySelector(`#${resetBtnId}`)?.addEventListener('click', () => {
            state[stateKey] = [];
            state.currentPage = 1;
            closeModal();
            refresh();
        });

        modal.querySelector(`#${submitBtnId}`)?.addEventListener('click', () => {
            state[stateKey] = stateReaderFn(modal);
            state.currentPage = 1;
            closeModal();
            refresh();
        });
    };

    const manageExternalControls = () => {
        const { controls } = settings;
        if (!controls) return;

        document.getElementById(controls.refreshTriggerId)?.addEventListener('click', () => refresh());

        // Setup Filter Modal
        setupModal({
            modalId: controls.filterModalId,
            triggerId: controls.filterTriggerId,
            stateKey: 'filters',
            rowContainerId: 'filterRowsContainer',
            addBtnId: 'addFilterBtn',
            resetBtnId: 'resetFilterBtn',
            submitBtnId: 'submitFilterBtn',
            rowBuilderFn: (filter = {}) => {
                const row = document.createElement('div');
                row.className = 'filter-row';
                const operators = [{ value: 'contains', text: 'Contains' }, { value: 'eq', text: 'Equals' }, { value: 'ne', text: 'Not Equals' }, { value: 'gt', text: 'Greater Than' }, { value: 'lt', text: 'Less Than' }];
                row.innerHTML = `
                    <select class="filter-column">${settings.columns.filter(c => c.filterable !== false).map(c => `<option value="${c.id}" ${filter.column === c.id ? 'selected' : ''}>${c.caption}</option>`).join('')}</select>
                    <select class="filter-operator">${operators.map(o => `<option value="${o.value}" ${filter.operator === o.value ? 'selected' : ''}>${o.text}</option>`).join('')}</select>
                    <input type="text" class="filter-value" placeholder="Value" value="${filter.value || ''}">
                    <button class="btn btn--remove" aria-label="Remove Filter">-</button>`;
                row.querySelector('.btn--remove').onclick = () => row.remove();
                return row;
            },
            stateReaderFn: (modal) => {
                const filters = [];
                modal.querySelectorAll('.filter-row').forEach(row => {
                    const value = row.querySelector('.filter-value').value;
                    if (value.trim()) {
                        filters.push({
                            column: row.querySelector('.filter-column').value,
                            operator: row.querySelector('.filter-operator').value,
                            value: value
                        });
                    }
                });
                return filters;
            }
        });

        // Setup Sort Modal
        setupModal({
            modalId: controls.sortModalId,
            triggerId: controls.sortTriggerId,
            stateKey: 'sorters',
            rowContainerId: 'sorterRowsContainer',
            addBtnId: 'addSorterBtn',
            resetBtnId: 'resetSorterBtn',
            submitBtnId: 'submitSorterBtn',
            rowBuilderFn: (sorter = {}) => {
                const row = document.createElement('div');
                row.className = 'sorter-row';
                row.innerHTML = `
                    <select class="sorter-column">${settings.columns.filter(c => c.sortable !== false).map(c => `<option value="${c.id}" ${sorter.column === c.id ? 'selected' : ''}>${c.caption}</option>`).join('')}</select>
                    <select class="sorter-order"><option value="asc" ${sorter.order === 'asc' ? 'selected' : ''}>Ascending</option><option value="desc" ${sorter.order === 'desc' ? 'selected' : ''}>Descending</option></select>
                    <button class="btn btn--remove" aria-label="Remove Sorter">-</button>`;
                row.querySelector('.btn--remove').onclick = () => row.remove();
                return row;
            },
            stateReaderFn: (modal) => {
                const sorters = [];
                modal.querySelectorAll('.sorter-row').forEach(row => {
                    sorters.push({
                        column: row.querySelector('.sorter-column').value,
                        order: row.querySelector('.sorter-order').value,
                    });
                });
                return sorters;
            }
        });
    };
    const initialRender = () => {
        container.innerHTML = `
            <div data-dynamic-table-wrapper>
                <div data-dynamic-table-scroll-container>
                    <table role="grid">
                        ${renderHeader()}
                        <tbody></tbody>
                    </table>
                </div>
                <div data-dynamic-table-pagination></div>
            </div>`;
        elements.wrapper = container.querySelector('[data-dynamic-table-wrapper]');
        elements.table = container.querySelector('table');
        elements.thead = elements.table.querySelector('thead');
        elements.tbody = elements.table.querySelector('tbody');
        elements.pagination = container.querySelector('[data-dynamic-table-pagination]');

        elements.wrapper.addEventListener('click', (e) => {
            const pageButton = e.target.closest('[data-page]');
            if (pageButton && !pageButton.disabled) {
                let newPage = pageButton.dataset.page;
                if (newPage === 'prev') state.currentPage--;
                else if (newPage === 'next') state.currentPage++;
                refresh();
            }
        });
    };

    /**
     * @brief Refreshes the table data by calling the dataSource with the current state.
     * @description This function preserves the currently applied sorting and filtering criteria.
     *              It is the primary method for reloading table data.
     * @returns {Promise<void>}
     */
    const refresh = async () => {
        await fetchServerData();
        update();
    };

    const getState = () => ({ ...state, selectedRows: new Set(state.selectedRows) });

    logger.log("Initializing table...");
    initialRender();
    manageExternalControls();
    refresh();

    return { refresh, getState };
}