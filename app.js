import { fetchData, addNewSet } from './dataService.js';
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
    const response = await fetchData();
    console.log('Data fetched:', response);
    tableData = response.data; // Store the array portion
    setTableDataForSorting(response.data);
    renderTable(response, actionsUnlocked); // Pass the full response object
    setupThemeToggle();
    setupExportButton();
    setupPinLock(); // Setup pin lock functionality
    updateCostCalculator(); // Calculate and display initial cost
    
    // Setup add set after DOM is ready
    setTimeout(() => {
      try {
        setupAddSet();
      } catch (error) {
        console.error('Error setting up add set:', error);
      }
    }, 100);
    
    console.log('Initialization complete');
  } catch (error) {
    console.error('Initialization error:', error);
    // Show error message with more details
    alert('Failed to load data. Please check:\n1. Google Sheets URL is correct\n2. Sheet is published to web\n3. Internet connection is working\n\nError: ' + error.message);
  } finally {
    hideLoading();
  }
}

function setupPinLock() {
  const submitPinButton = document.getElementById('submitPin');
  const pinInput = document.getElementById('pinInput');
  const pinContainer = document.getElementById('pinContainer');
  const actionsHeader = document.getElementById('actionsHeader');

  console.log('Pin button found:', submitPinButton);
  console.log('Pin input found:', pinInput);

  if (!submitPinButton) {
    console.error('Submit pin button not found!');
    return;
  }

  submitPinButton.addEventListener('click', async (e) => {
    console.log('Pin button clicked!');
    e.preventDefault();
    const enteredPin = pinInput.value;
    console.log('Entered PIN:', enteredPin);
    if (enteredPin === '6660') {
      console.log('PIN correct!');
      actionsUnlocked = true;
      // Re-render table with actions unlocked and existing data
      const response = { data: tableData };
      renderTable(response, actionsUnlocked);
      pinContainer.classList.add('hidden'); // Hide pin input
      actionsHeader.classList.remove('hidden-column'); // Show actions header
      document.getElementById('addSetContainer').classList.remove('hidden'); // Show add set input
      // Show actions column cells (handled in renderTableRows)
      
      // Show confetti on successful PIN entry using default falling style
      showConfetti(submitPinButton, e);
    } else {
      console.log('PIN incorrect');
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

function setupAddSet() {
  const addSetButton = document.getElementById('addSetButton');
  const newSetNameInput = document.getElementById('newSetName');

  if (!addSetButton || !newSetNameInput) {
    console.error('Add set elements not found');
    return;
  }

  addSetButton.addEventListener('click', async () => {
    const setName = newSetNameInput.value.trim();
    if (!setName) {
      alert('Please enter a set name');
      return;
    }

    try {
      console.log('Adding new set:', setName);
      const result = await addNewSet(setName);
      console.log('Add set result:', result);
      
      if (result.result === 'success') {
        console.log('Set added successfully, will refresh data in 10 seconds...');
        
        // Clear the input
        newSetNameInput.value = '';
        
        // Show success message
        // Removed popup notification per request
        
        // Show confetti using default falling style
        showConfetti(addSetButton);
        
        // Wait 5 seconds then refresh the data
        setTimeout(async () => {
          try {
            console.log('Refreshing data after 5 second delay...');
            const response = await fetchData();
            tableData = response.data;
            setTableDataForSorting(response.data);
            renderTable(response, actionsUnlocked);
            updateCostCalculator();
            console.log('Data refreshed successfully');
          } catch (error) {
            console.error('Error refreshing data:', error);
            alert('Set was added but failed to refresh data. Please refresh the page manually.');
          }
        }, 5000);
      } else {
        console.error('Failed to add set:', result);
        console.error('Full error object:', JSON.stringify(result, null, 2));
        const errorMsg = result.error ? JSON.stringify(result.error) : result.message || JSON.stringify(result);
        alert('Failed to add set: ' + errorMsg);
      }
    } catch (error) {
      console.error('Error adding set:', error);
      alert('Failed to add set. Please try again. Error: ' + error.message);
    }
  });

  // Allow Enter key to submit
  newSetNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addSetButton.click();
    }
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

function showConfetti(originElement, clickEvent = null) {
  let centerX, centerY;
  
  if (clickEvent && clickEvent.clientX !== undefined) {
    // Use actual click coordinates
    centerX = clickEvent.clientX;
    centerY = clickEvent.clientY;
  } else {
    // Fallback to element center
    const rect = originElement.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
  }

  // Normalize to viewport to avoid horizontal offset issues
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
  const originX = Math.min(Math.max(centerX / viewportWidth, 0), 1);
  const originY = Math.min(Math.max(centerY / viewportHeight, 0), 1);

  confetti({
    ...defaults,
    shapes: [pokeball],
    colors: ['#EE1515', '#F0F0F0'],
    origin: {
      x: originX,
      y: originY,
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