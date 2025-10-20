const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzhT3ACLoKbVHzGpaslY_l4cBCUqNf5kUh6QRlACgIFsQtBTHiiQya7eAt28DGselPyGxBd7NWY85G/pub?output=csv';

export async function fetchData() {
  try {
    console.log('Fetching data from:', SPREADSHEET_URL);
    const response = await fetch(SPREADSHEET_URL);
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log('CSV data received:', csvText.substring(0, 200) + '...');
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

export async function updateValue(index, value) {
  try {
    // Use URLSearchParams to properly encode the data
    const formData = new URLSearchParams();
    formData.append('index', index.toString());
    formData.append('value', value.toString());

    const response = await fetch('https://script.google.com/macros/s/AKfycbwBZWwQe1Hxno0pswqQ7e_2LFH0-u4BLO_TzQHM1h5smnrMac_DtZ0fmu-rr9p4SAg3IA/exec', {
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
      // Update was successful, return current timestamp with success
      return { 
        result: 'success',
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('Update failed');
    }
  } catch (error) {
    console.error('Error updating value:', error);
    throw error;
  }
}

export async function addNewSet(setName) {
  try {
    console.log('Preparing to add set:', setName);
    const formData = new URLSearchParams();
    formData.append('action', 'addSet');
    formData.append('setName', setName);

    console.log('Form data:', formData.toString());
    console.log('Sending request to Apps Script...');

    const response = await fetch('https://script.google.com/macros/s/AKfycbwBZWwQe1Hxno0pswqQ7e_2LFH0-u4BLO_TzQHM1h5smnrMac_DtZ0fmu-rr9p4SAg3IA/exec', {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const result = await response.json();
    console.log('Apps Script response:', result);
    return result;
  } catch (error) {
    console.error('Error adding new set:', error);
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

  return {
    data: parsedData
  };
}