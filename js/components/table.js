/* ========================================
   Invoice App - Table Component
   ======================================== */

/**
 * Table Component - Reusable data table
 */
const Table = {
  /**
   * Render a data table
   * @param {object} options - Table options
   * @param {array} options.columns - Column definitions
   * @param {array} options.data - Table data
   * @param {string} options.emptyMessage - Message when no data
   * @param {Function} options.onSort - Sort callback
   * @param {string} options.sortColumn - Current sort column
   * @param {string} options.sortDirection - Current sort direction ('asc' or 'desc')
   * @returns {string} HTML string
   */
  render({
    columns,
    data,
    emptyMessage = 'No data available',
    onSort = null,
    sortColumn = null,
    sortDirection = 'asc',
  }) {
    if (!data || data.length === 0) {
      return `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>No Data Yet</h3>
                    <p>${escapeHtml(emptyMessage)}</p>
                </div>
            `;
    }

    return `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            ${columns
                              .map((col) => {
                                const sortable = col.sortable ? 'sortable' : '';
                                let sortClass = '';
                                if (col.key === sortColumn) {
                                  sortClass =
                                    sortDirection === 'asc'
                                      ? 'sort-asc'
                                      : 'sort-desc';
                                }
                                return `<th class="${sortable} ${sortClass}" data-key="${
                                  col.key
                                }">${escapeHtml(col.label)}</th>`;
                              })
                              .join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data
                          .map(
                            (row) => `
                            <tr data-id="${row.id || ''}">
                                ${columns
                                  .map((col) => {
                                    const value = col.render
                                      ? col.render(row)
                                      : row[col.key] || '';
                                    const className = col.className || '';
                                    return `<td class="${className}">${value}</td>`;
                                  })
                                  .join('')}
                            </tr>
                        `
                          )
                          .join('')}
                    </tbody>
                </table>
            </div>
        `;
  },

  /**
   * Sort data by column
   * @param {array} data - Data array
   * @param {string} column - Column key
   * @param {string} direction - Sort direction ('asc' or 'desc')
   * @returns {array} Sorted data
   */
  sortData(data, column, direction) {
    return [...data].sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];

      // Handle null/undefined
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle dates
      if (aVal instanceof Date && bVal instanceof Date) {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle strings
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  },

  /**
   * Setup sort handlers for a table
   * @param {HTMLElement} container - Container element
   * @param {Function} onSort - Sort callback (column, direction)
   * @param {string} currentColumn - Current sort column
   * @param {string} currentDirection - Current sort direction
   */
  setupSortHandlers(container, onSort, currentColumn, currentDirection) {
    const headers = container.querySelectorAll('th.sortable');

    headers.forEach((th) => {
      th.addEventListener('click', () => {
        const column = th.dataset.key;
        let direction = 'asc';

        if (column === currentColumn) {
          direction = currentDirection === 'asc' ? 'desc' : 'asc';
        }

        onSort(column, direction);
      });
    });
  },
};
