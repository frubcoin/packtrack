const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzhT3ACLoKbVHzGpaslY_l4cBCUqNf5kUh6QRlACgIFsQtBTHiiQya7eAt28DGselPyGxBd7NWY85G/pub?output=csv';

export async function fetchData() {
  try {
    console.log('Attempting to fetch data from:', SPREADSHEET_URL);
    const response = await fetch(SPREADSHEET_URL);
    
    // Add detailed status code checking
    if (!response.ok) {
      console.error('Response status:', response.status);
      console.error('Response status text:', response.statusText);
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log('Received data length:', csvText.length);
    
    // Validate that we received actual CSV data
    if (!csvText || csvText.trim() === '') {
      throw new Error('Received empty response from spreadsheet');
    }

    // Add basic CSV validation with logging
    const lines = csvText.split('\n');
    console.log('Number of CSV lines:', lines.length);
    if (lines.length < 2) {
      throw new Error('Invalid CSV data - insufficient rows');
    }

    const parsedData = parseCSV(csvText);
    console.log('Successfully parsed data rows:', parsedData.length);
    return parsedData;
  } catch (error) {
    console.error('Detailed fetch error:', {
      message: error.message,
      stack: error.stack,
      url: SPREADSHEET_URL
    });
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
}

export async function updateValue(index, value) {
  try {
    // Use URLSearchParams to properly encode the data
    const formData = new URLSearchParams();
    formData.append('index', index.toString());
    formData.append('value', value.toString());

    const response = await fetch('https://script.google.com/macros/s/AKfycbzCoVTQrWmFgHBE2LiebXtHJK3NwW-wirbkduFlYqQf1-RrC_9KTWi8LqAi4iZuKNwzXA/exec', {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    // Check the response
    const result = await response.json();

    if (result.result === 'success') {
      return { result: 'success' };
    } else {
      throw new Error('Update failed');
    }
  } catch (error) {
    console.error('Error updating value:', error);
    throw error;
  }
}

function parseCSV(csv) {
  const lines = csv.split('\n');
  const headers = lines[0].split(',');

  const parsedData = lines.map((line, index) => {
    const values = line.split(',');
    return {
      index: index + 1,
      setName: values[0] || '',
      packCount: parseInt(values[1] || 0)
    };
  }).filter(row => row.setName.trim() !== '');

  return parsedData;
}