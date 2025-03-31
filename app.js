import { fetchData } from './dataService.js';
import { renderTable, setTableDataForSorting } from './tableRenderer.js';
import { setupThemeToggle } from './themeToggle.js';

let actionsUnlocked = false; // Track if actions are unlocked
let tableData = null; // Store fetched table data

async function showLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.classList.remove('hidden');
  // Force reflow to restart animation if it was previously hidden
  void loadingOverlay.offsetWidth;
  loadingOverlay.style.opacity = '1'; // Fade in
}

function hideLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.style.opacity = '0'; // Fade out
  loadingOverlay.addEventListener('transitionend', () => {
    loadingOverlay.classList.add('hidden'); // Hide after fade out
  }, { once: true }); // Remove event listener after first execution
}

async function init() {
  try {
    console.log('Starting initialization...');
    showLoading();
    
    console.log('Fetching data...');
    tableData = await fetchData();
    
    console.log('Received table data:', {
      isArray: Array.isArray(tableData),
      length: tableData?.length,
      sample: tableData?.[0]
    });
    
    if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
      throw new Error('Invalid or empty data received');
    }
    
    setTableDataForSorting(tableData);
    renderTable(tableData, actionsUnlocked);
    setupThemeToggle();
    setupExportButton();
    setupPinLock();
    updateCostCalculator();
    console.log('Initialization completed successfully');
  } catch (error) {
    console.error('Detailed initialization error:', {
      message: error.message,
      stack: error.stack,
      tableData: tableData
    });
    
    // More descriptive error message for users
    const errorMessage = `Failed to load data: ${error.message}\n\n` +
      'Please try the following:\n' +
      '1. Check your internet connection\n' +
      '2. Clear your browser cache\n' +
      '3. Refresh the page\n\n' +
      'If the problem persists, please contact the administrator with this error code: ' +
      new Date().toISOString();
    
    alert(errorMessage);
  } finally {
    hideLoading();
  }
}

function setupPinLock() {
  const submitPinButton = document.getElementById('submitPin');
  const pinInput = document.getElementById('pinInput');
  const pinContainer = document.getElementById('pinContainer');
  const actionsHeader = document.getElementById('actionsHeader');

  submitPinButton.addEventListener('click', async () => {
    const enteredPin = pinInput.value;
    if (enteredPin === '6660') {
      actionsUnlocked = true;
      renderTable(tableData, actionsUnlocked); // Re-render table with actions unlocked and existing data
      pinContainer.classList.add('hidden'); // Hide pin input
      actionsHeader.classList.remove('hidden-column'); // Show actions header
      // Show actions column cells (handled in renderTableRows)
    } else {
      alert('Incorrect PIN. Please try again.'); // Basic error feedback
    }
  });
}

function setupExportButton() {
  const exportButton = document.getElementById('exportImage');
  exportButton.addEventListener('click', () => {
    exportTableAsImage();
  });
}

async function exportTableAsImage() {
  const table = document.getElementById('dataTable');

  try {
    const canvas = await html2canvas(table, {
      scale: 2, // Increase scale for better resolution
      useCORS: true // Enable CORS if images are present
    });
    const imgData = canvas.toDataURL('image/png');

    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = imgData;
    link.download = 'pokemon_pack_tracker.png'; // Filename for the downloaded image
    document.body.appendChild(link); // Append to body to make it work in Firefox
    link.click();
    document.body.removeChild(link); // Clean up by removing the link
  } catch (error) {
    console.error('Error exporting table as image:', error);
    alert('Failed to export table as image.');
  }
}

const pokeball = confetti.shapeFromPath({
  path: 'M770,1224.85H732c-1.49-1-3.21-.74-4.85-.82-43.27-1.91-85.66-9.09-126.64-23.08-151.15-51.57-254.79-152.44-311.12-301.58-14.9-39.48-23.16-80.65-26.63-122.76-.55-6.76-.06-13.62-1.76-20.28v-43a58.81,58.81,0,0,0,.89-5.86,461,461,0,0,1,17.86-106.37q47-160.89,181.91-260.55C529.06,290.81,604.73,261,687.76,250a479.9,479.9,0,0,1,103.69-2.35c37.6,3.17,74.47,9.93,110.19,22q208.55,70.45,299,271.14c21.87,48.51,34.17,99.72,38.6,152.8.58,6.92.1,13.95,1.8,20.77v42c-.3,2.1-.78,4.2-.88,6.31A464.49,464.49,0,0,1,1222.35,869q-43.32,149.69-164.66,247.69Q941,1210.57,791.31,1223.07C784.21,1223.67,777,1223.05,770,1224.85ZM438.72,766.6h-96c-7.34,0-7.35,0-6.51,7.5a455.59,455.59,0,0,0,7.62,48.7q32.9,148.47,153,241.88c65.33,50.8,139.8,79.07,222.48,85.42,48.25,3.71,96,.07,142.34-13.67,136.22-40.33,229.87-127.25,281-259.63,12.92-33.47,19.88-68.48,23.33-104.17.33-3.46.83-6.17-4.62-6.16q-98,.3-196,0c-3.42,0-4.7,1.17-5.18,4.31-.71,4.59-1.53,9.17-2.63,13.68-27.08,111-135,180.24-247.43,158.68-85.94-16.48-153.58-85.58-168.15-171.85-.58-3.44-1.83-4.87-5.73-4.85C503.71,766.68,471.21,766.6,438.72,766.6Zm165.37-31.32C604.13,815.92,670.26,882,751,882s146.87-66,146.94-146.66S831.91,588.73,751,588.69,604.05,654.66,604.09,735.28Z',
});

const defaults = {
  scalar: 4,
  spread: 250,
  particleCount: 75,
  origin: { y: -0.1 },
  startVelocity: -35
};

function showConfetti(originElement) {
  const rect = originElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  confetti({
    ...defaults,
    shapes: [pokeball],
    colors: ['#EE1515', '#F0F0F0'],
    origin: {
      x: centerX / window.innerWidth,
      y: centerY / window.innerHeight,
    },
  });
}

function updateCostCalculator() {
  if (tableData && tableData.length > 0) {
    const totalPacks = tableData[tableData.length - 1].packCount;
    const estimatedCost = totalPacks * 4.5;
    const costDisplay = document.getElementById('estimatedCost');
    costDisplay.textContent = `$${estimatedCost.toFixed(2)}`; // Format as currency
  }
}

// Call updateCostCalculator after table updates
window.updateCostCalculator = updateCostCalculator;

init();

export { showLoading, hideLoading, showConfetti };