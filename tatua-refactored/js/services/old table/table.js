/**
 * Creates a dynamic table instance within the specified container.
 * 
 * This function initializes a table based on the provided configuration. It supports both client-side and server-side data processing,
 * including pagination, filtering, and sorting. For server-side, it assumes an OData-compatible API.
 * 
 * Usage:
 * const table = createDynamicTable('containerId', {
 *   dataSource: 'https://example.com/api',
 *   serverSide: true,
 *   columns: [...],
 *   pagination: { enabled: true, pageSize: 10 },
 *   // other configs
 * });
 * 
 * table.updateFilters([...]);
 * table.refresh();
 * 
 * @param {string} containerId - The ID of the HTML element where the table will be rendered.
 * @param {Object} config - Configuration options for the table.
 * @returns {Object} - An object with methods to update and refresh the table.
 */
export function createDynamicTable(containerId, config) {
    const defaultConfig = {
        data: [], // Data array for client-side
        dataSource: null, // URL for server-side data fetch
        serverSide: false, // Enable server-side processing (pagination, filter, sort)
        columns: [], // Array of column objects: { id, caption, dataType: 'string'|'number'|'date'|'image', type: 'text'|'actions', render?, isSortable: true, isFilterable: true, align: 'left', size: 100, hide: false }
        filters: [], // Array of filters: { column, relation: 'equals'|'contains'|'startsWith'|'endsWith', value }
        sorters: [], // Array of sorters: { column, order: 'asc'|'desc' }
        pagination: { enabled: false, pageSize: 10, currentPage: 1 }, // Pagination settings
        emptyMessage: "No data available", // Message when no data
        tableClass: "dynamic-table", // Base class for table
        striped: true, // Alternate row shading
        bordered: true, // Cell borders
        onRowClick: null // Function(id) => string for onclick code
    };

    const settings = { ...defaultConfig, ...config };
    settings.pagination = { ...defaultConfig.pagination, ...config.pagination };

    const state = {
        displayedData: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: settings.pagination.currentPage
    };

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID ${containerId} not found.`);
        return {};
    }

    /**
     * Escapes HTML to prevent XSS.
     * @param {string} unsafe - The string to escape.
     * @returns {string} - Escaped string.
     */
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Processes data client-side: filters and sorts.
     * @param {Array} data - The data to process.
     * @param {Array} filters - Filters to apply.
     * @param {Array} sorters - Sorters to apply.
     * @returns {Array} - Processed data.
     */
    function processData(data, filters, sorters) {
        let processedData = [...data];

        if (filters.length > 0) {
            processedData = processedData.filter(item => {
                return filters.every(filter => {
                    const itemValue = (item[filter.column] || '').toString().toLowerCase();
                    const filterValue = (filter.value || '').toString().toLowerCase();
                    switch (filter.relation) {
                        case 'equals': return itemValue === filterValue;
                        case 'contains': return itemValue.includes(filterValue);
                        case 'startsWith': return itemValue.startsWith(filterValue);
                        case 'endsWith': return itemValue.endsWith(filterValue);
                        default: return true;
                    }
                });
            });
        }

        processedData.sort((a, b) => {
            for (const sorter of sorters) {
                const valA = a[sorter.column];
                const valB = b[sorter.column];
                let comparison = 0;
                if (valA > valB) comparison = 1;
                else if (valA < valB) comparison = -1;
                if (comparison !== 0) return sorter.order === 'asc' ? comparison : -comparison;
            }
            return 0;
        });

        return processedData;
    }

    /**
     * Builds OData query string for server-side requests.
     * @returns {string} - The query string.
     */
    function buildODataQuery() {
        const params = [];

        if (settings.pagination.enabled) {
            const pageSize = settings.pagination.pageSize;
            const skip = (state.currentPage - 1) * pageSize;
            params.push(`$top=${pageSize}`);
            params.push(`$skip=${skip}`);
        }

        params.push('$count=true');

        const filterParts = settings.filters.map(filter => {
            const column = settings.columns.find(c => c.id === filter.column);
            const dataType = column?.dataType || 'string';
            const value = dataType === 'number' ? filter.value : `'${escapeHtml(filter.value)}'`;
            switch (filter.relation) {
                case 'equals': return `${filter.column} eq ${value}`;
                case 'contains':
                    if (dataType !== 'string') return '';
                    return `contains(${filter.column}, ${value})`;
                case 'startsWith':
                    if (dataType !== 'string') return '';
                    return `startswith(${filter.column}, ${value})`;
                case 'endsWith':
                    if (dataType !== 'string') return '';
                    return `endswith(${filter.column}, ${value})`;
                default: return '';
            }
        }).filter(part => part !== '');

        if (filterParts.length > 0) {
            params.push(`$filter=${filterParts.join(' and ')}`);
        }

        const orderParts = settings.sorters.map(sorter => `${sorter.column} ${sorter.order}`);
        if (orderParts.length > 0) {
            params.push(`$orderby=${orderParts.join(',')}`);
        }

        return params.length > 0 ? '?' + params.join('&') : '';
    }

    /**
     * Fetches or processes data based on configuration.
     */
    async function fetchData() {
        if (settings.serverSide) {
            if (!settings.dataSource) {
                console.error('dataSource is required for serverSide mode.');
                return;
            }
            const query = buildODataQuery();
            try {
                const response = await fetch(`${settings.dataSource}${query}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                state.displayedData = data.value || [];
                state.totalCount = data['@odata.count'] || state.displayedData.length;
            } catch (error) {
                console.error('Error fetching data:', error);
                state.displayedData = [];
                state.totalCount = 0;
            }
        } else {
            const fullProcessed = processData(settings.data, settings.filters, settings.sorters);
            state.totalCount = fullProcessed.length;
            if (settings.pagination.enabled) {
                const start = (state.currentPage - 1) * settings.pagination.pageSize;
                state.displayedData = fullProcessed.slice(start, start + settings.pagination.pageSize);
            } else {
                state.displayedData = fullProcessed;
            }
        }
        state.totalPages = settings.pagination.enabled ? Math.ceil(state.totalCount / settings.pagination.pageSize) : 1;
    }

    /**
     * Renders the table HTML.
     */
    function renderTable() {
        const tableClasses = [
            settings.tableClass,
            settings.striped ? 'striped' : '',
            settings.bordered ? 'bordered' : ''
        ].filter(cls => cls).join(' ');

        let tableHtml = `
            <div class="table-container">
                <table class="${tableClasses}">
                    <thead>
                        <tr>
                            ${settings.columns.map(column => {
                                if (column.hide) return '';
                                return `<th style="text-align: ${column.align || 'left'}; width: ${column.size || 'auto'}px;">
                                    ${column.caption || column.id}
                                </th>`;
                            }).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${state.displayedData.map(row => renderRow(row)).join('')}
                    </tbody>
                </table>
                <div class="empty-state" style="display: ${state.totalCount === 0 ? 'block' : 'none'}">
                    ${settings.emptyMessage}
                </div>
        `;

        if (settings.pagination.enabled) {
            tableHtml += renderPagination();
        }

        tableHtml += `</div>`;

        container.innerHTML = tableHtml;
        attachPaginationListeners();
    }

    /**
     * Renders a single row.
     * @param {Object} row - The row data.
     * @returns {string} - HTML for the row.
     */
    function renderRow(row) {
        const rowId = row.id || row[settings.columns.find(col => col.isKey)?.id] || Math.random().toString(36).substr(2, 9);
        const onclickAttr = settings.onRowClick ? `onclick="(${settings.onRowClick})('${rowId}')"` : '';
        return `
            <tr ${onclickAttr}>
                ${settings.columns.map(column => {
                    if (column.hide) return '';
                    let cellContent;
                    const value = row[column.id];
                    if (column.render) {
                        cellContent = column.render(row);
                    } else if (column.type === 'actions') {
                        cellContent = `
                            <div class="action-buttons">
                                ${column.actions.map(action => {
                                    const isActive = action.isActive ? action.isActive(row) : false;
                                    return `
                                        <${action.type === 'link' ? 'a' : 'button'}
                                            class="action-btn ${isActive ? 'is-active' : ''}"
                                            ${action.type === 'link' ? `href="${action.href(row)}"` : ''}
                                            title="${action.title}"
                                            ${action.type === 'button' ? `onclick="(${action.handler})('${rowId}')"` : ''}>
                                            ${action.icon}
                                        </${action.type === 'link' ? 'a' : 'button'}>
                                    `;
                                }).join('')}
                            </div>
                        `;
                    } else {
                        switch (column.type || 'text') {
                            case 'image':
                                cellContent = value ? `<img src="${escapeHtml(value)}" alt="${column.caption}" style="max-width: 100px;" />` : '';
                                break;
                            case 'date':
                                cellContent = value ? new Date(value).toLocaleString() : '';
                                break;
                            default:
                                cellContent = escapeHtml(value ?? '');
                        }
                    }
                    return `<td style="text-align: ${column.align || 'left'}; width: ${column.size || 'auto'}px;">
                        ${cellContent}
                    </td>`;
                }).join('')}
            </tr>
        `;
    }

    /**
     * Renders pagination controls.
     * @returns {string} - HTML for pagination.
     */
    function renderPagination() {
        let pagesHtml = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, state.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(state.totalPages, startPage + maxVisiblePages - 1);
        startPage = Math.max(1, endPage - maxVisiblePages + 1);

        for (let i = startPage; i <= endPage; i++) {
            pagesHtml += `<button data-page="${i}" ${i === state.currentPage ? 'disabled' : ''}>${i}</button>`;
        }

        return `
            <div class="pagination">
                <button data-page="1" ${state.currentPage === 1 ? 'disabled' : ''}>First</button>
                <button data-page="prev" ${state.currentPage === 1 ? 'disabled' : ''}>Prev</button>
                ${pagesHtml}
                <button data-page="next" ${state.currentPage === state.totalPages ? 'disabled' : ''}>Next</button>
                <button data-page="${state.totalPages}" ${state.currentPage === state.totalPages ? 'disabled' : ''}>Last</button>
            </div>
        `;
    }

    /**
     * Attaches event listeners to pagination buttons.
     */
    function attachPaginationListeners() {
        if (!settings.pagination.enabled) return;
        const pagination = container.querySelector('.pagination');
        if (!pagination) return;
        const buttons = pagination.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('click', async () => {
                let page = button.dataset.page;
                if (page === 'prev') page = state.currentPage - 1;
                else if (page === 'next') page = state.currentPage + 1;
                else if (page === 'first') page = 1;
                else if (page === 'last') page = state.totalPages;
                else page = parseInt(page);

                if (isNaN(page) || page < 1 || page > state.totalPages || page === state.currentPage) return;

                state.currentPage = page;
                await fetchData();
                renderTable();
            });
        });
    }

    /**
     * Refreshes the table by fetching data and rendering.
     */
    async function refresh() {
        await fetchData();
        renderTable();
    }

    /**
     * Updates the data and refreshes.
     * @param {Array} newData - New data array (client-side only).
     */
    async function updateData(newData) {
        if (settings.serverSide) {
            console.warn('updateData is not applicable in serverSide mode.');
            return;
        }
        settings.data = newData;
        state.currentPage = 1;
        await refresh();
    }

    /**
     * Updates filters and refreshes.
     * @param {Array} newFilters - New filters.
     */
    async function updateFilters(newFilters) {
        settings.filters = newFilters;
        state.currentPage = 1;
        await refresh();
    }

    /**
     * Updates sorters and refreshes.
     * @param {Array} newSorters - New sorters.
     */
    async function updateSorters(newSorters) {
        settings.sorters = newSorters;
        state.currentPage = 1;
        await refresh();
    }

    // Initial render
    refresh();

    return {
        updateData,
        updateFilters,
        updateSorters,
        refresh
    };
}