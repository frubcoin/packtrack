const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzhT3ACLoKbVHzGpaslY_l4cBCUqNf5kUh6QRlACgIFsQtBTHiiQya7eAt28DGselPyGxBd7NWY85G/pub?output=csv';

export async function fetchData() {
  try {
    const response = await fetch(SPREADSHEET_URL);
    const csvText = await response.text();
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