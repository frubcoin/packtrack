import { updateValue } from './dataService.js';
import { showLoading, hideLoading, showConfetti } from './app.js';

let currentSortColumn = null; // Track currently sorted column
let currentSortDirection = 'desc'; // Track sort direction
let tableHeaders; // Declare tableHeaders here to be accessible in the module scope

export function renderTable(data, actionsUnlocked) {
  const tableBody = document.getElementById('tableBody');
  tableHeaders = document.querySelectorAll('#dataTable thead th'); // Initialize tableHeaders here
  const actionsHeader = document.getElementById('actionsHeader');

  if (!data) {
    return; // Data might be null during re-render after unlocking actions
  }

  // Separate the total row
  const sortedData = [...data.slice(0, -1)];
  const totalRow = data[data.length - 1];

  // Default sorting by pack count (descending)
  if (currentSortColumn === null) {
    sortedData.sort((a, b) => b.packCount - a.packCount);
    currentSortColumn = 1; // Default sort by Pack Count column (index 1)
    currentSortDirection = 'desc';
  } else {
    sortData(sortedData, currentSortColumn, currentSortDirection); // Apply previous sort
  }

  // Set visibility of Actions header based on actionsUnlocked
  if (actionsUnlocked) {
    actionsHeader.classList.remove('hidden-column');
  } else {
    actionsHeader.classList.add('hidden-column');
  }

  // Initial render
  renderTableRows(sortedData, totalRow, currentSortColumn, currentSortDirection, actionsUnlocked); // Pass actionsUnlocked
}

// Attach sorting functionality to headers - done only once during module initialization
tableHeaders = document.querySelectorAll('#dataTable thead th'); // Initialize tableHeaders here as well for initial setup
tableHeaders.forEach((header, index) => {
  if (index < 2) {  // Only enable sorting for Set Name and Packs Opened
    header.classList.add('cursor-pointer', 'hover:bg-gray-200', 'dark:hover:bg-gray-600');

    header.addEventListener('click', () => {
      // Determine sort direction, toggle if clicking the same column
      if (currentSortColumn === index) {
        currentSortDirection = currentSortDirection === 'desc' ? 'asc' : 'desc';
      } else {
        currentSortColumn = index;
        currentSortDirection = 'desc'; // Default to desc for new column
      }

      const tableBody = document.getElementById('tableBody');
      const actionsUnlocked = !tableBody.querySelector('td:nth-child(3)').classList.contains('hidden-column'); // Determine actionsUnlocked dynamically

      const sortedData = [...getTableData().slice(0, -1)]; // Get current table data
      sortData(sortedData, currentSortColumn, currentSortDirection);

      // Re-render table with sorted data
      renderTableRows(sortedData, getTableData()[getTableData().length - 1], currentSortColumn, currentSortDirection, actionsUnlocked); // Pass actionsUnlocked
    });
  }
});


function sortData(sortedData, columnIndex, sortDirection) {
  if (columnIndex === 0) {  // Set Name column
    sortedData.sort((a, b) => {
      return sortDirection === 'asc'
        ? a.setName.localeCompare(b.setName)
        : b.setName.localeCompare(a.setName);
    });
  } else {  // Pack Count column
    sortedData.sort((a, b) => {
      return sortDirection === 'asc'
        ? a.packCount - b.packCount
        : b.packCount - a.packCount;
    });
  }
}

function renderTableRows(sortedData, totalRow, sortedColumnIndex, sortDirection, actionsUnlocked) {
  const tableBody = document.getElementById('tableBody');
  const tableHeaders = document.querySelectorAll('#dataTable thead th');
  tableBody.innerHTML = '';

  // Clear existing sort indicators
  tableHeaders.forEach(header => {
    const indicatorSpan = header.querySelector('.sort-indicator');
    if (indicatorSpan) {
      indicatorSpan.remove();
    }
  });

  // Add sort indicator to the currently sorted header
  if (sortedColumnIndex !== null) {
    const sortedHeader = tableHeaders[sortedColumnIndex];
    const indicatorSpan = document.createElement('span');
    indicatorSpan.classList.add('sort-indicator');
    indicatorSpan.textContent = sortDirection === 'asc' ? '▲' : '▼';
    sortedHeader.appendChild(indicatorSpan);
  }

  // Render data rows
  sortedData.forEach(row => {
    const tr = document.createElement('tr');
    tr.classList.add(
      'bg-white', 'border-b', 'dark:bg-gray-800', 'dark:border-gray-600',
      'hover:bg-gray-50', 'dark:hover:bg-gray-600',
      'h-[60px]'  // Fixed height to prevent shifting
    );

    let actionsCellContent = '';
    if (actionsUnlocked) {
      actionsCellContent = `
        <td class="px-6 py-4 w-1/3 flex items-center justify-center space-x-2 h-full relative">
          <input
            type="number"
            placeholder="0"
            class="bg-gray-100 dark:bg-gray-600 w-16 px-2 py-1 rounded text-center"
            data-index="${row.index}"
          >
          <span class="inline-flex items-center relative">
            <button
              class="add-btn bg-blue-700 dark:bg-blue-800 text-white px-2 py-1 rounded w-20 text-center relative flex justify-center items-center space-x-1"
              data-index="${row.index}"
            >
              <span>Add</span>
            </button>
            <div class="checkmark-container relative w-[20px] h-[20px] inline-block">
              <svg class="checkmark hidden absolute top-0 left-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; color: white;">
                <path d="M22 4L9.5 17L2 10.5" />
              </svg>
            </div>
          </span>
        </td>
      `;
    } else {
      actionsCellContent = `<td class="px-6 py-4 w-1/3 hidden-column"></td>`; // Hidden if not unlocked
    }


    tr.innerHTML = `
      <td class="px-6 py-4 w-1/3">${row.setName}</td>
      <td class="px-6 py-4 w-1/3 text-center">${row.packCount}</td>
      ${actionsCellContent}
    `;

    if (actionsUnlocked) { // Only attach event listeners if actions are unlocked
      const input = tr.querySelector('input');
      const addBtn = tr.querySelector('.add-btn');
      const packCountCell = tr.querySelector('td:nth-child(2)');
      const checkmark = tr.querySelector('.checkmark');
      const checkmarkContainer = tr.querySelector('.checkmark-container');

      addBtn.addEventListener('click', async () => {
        const incrementValue = parseInt(input.value) || 0;
        if (incrementValue !== 0) {
          try {
            showLoading();
            const newPackCount = row.packCount + incrementValue;

            // Prevent pack count from going negative
            if (newPackCount < 0) {
              console.warn('Pack count cannot be negative');
              return;
            }

            const result = await updateValue(row.index, newPackCount);

            if (result.result === 'success') {
              // Update the displayed pack count for the current row
              packCountCell.textContent = newPackCount;

              // Update row's pack count in the data
              row.packCount = newPackCount;

              // Update the total row
              const totalPackCell = document.querySelector('#tableBody tr:last-child td:nth-child(2)');
              const currentTotal = parseInt(totalPackCell.textContent);
              const newTotal = currentTotal + incrementValue;
              totalPackCell.textContent = newTotal;

              // Update total row in the original data
              totalRow.packCount = newTotal;

              // Reset input
              input.value = '0';

              // Show checkmark briefly
              checkmark.classList.remove('hidden');
              setTimeout(() => {
                checkmark.classList.add('hidden');
              }, 2000);

              // Show confetti on success
              showConfetti(addBtn);

              // Update cost calculator on successful update
              window.updateCostCalculator();
            }
          } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to update pack count. Please try again.');
          } finally {
            hideLoading();
          }
        }
      });
    }


    tableBody.appendChild(tr);

    // Hide the 3rd column in each row if actions are locked
    if (!actionsUnlocked) {
      const actionsCell = tr.querySelector('td:nth-child(3)');
      if (actionsCell) {
        actionsCell.classList.add('hidden-column');
      }
    }
  });

  // Render total row (pinned to bottom)
  const totalTr = document.createElement('tr');
  totalTr.classList.add(
    'bg-gray-200', 'dark:bg-gray-700', 'font-bold', 'sticky', 'bottom-0', 'h-[60px]'
  );
  let totalActionsCell = actionsUnlocked ? `<td class="px-6 py-4 w-1/3"></td>` : `<td class="px-6 py-4 w-1/3 hidden-column"></td>`;

  totalTr.innerHTML = `
    <td class="px-6 py-4 w-1/3">Total</td>
    <td class="px-6 py-4 w-1/3 text-center">${totalRow.packCount}</td>
    ${totalActionsCell}
  `;
  tableBody.appendChild(totalTr);

   // Hide the 3rd column in total row if actions are locked
   if (!actionsUnlocked) {
    const actionsCell = totalTr.querySelector('td:nth-child(3)');
    if (actionsCell) {
      actionsCell.classList.add('hidden-column');
    }
  }
}

// Helper function to access tableData from app.js
let currentTableData = null;
export function setTableDataForSorting(data) {
  currentTableData = data;
}

function getTableData() {
  return currentTableData;
}