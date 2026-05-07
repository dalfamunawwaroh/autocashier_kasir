import fs from 'fs';
import path from 'path';

async function test() {
  const imagePath = process.argv[2];
  if (!fs.existsSync(imagePath)) {
    console.error('File not found:', imagePath);
    process.exit(1);
  }
  const base64Image = fs.readFileSync(imagePath, { encoding: 'base64' });
  const dataUri = `data:image/png;base64,${base64Image}`;

  console.log('Sending request to /api/detect...');
  try {
    const response = await fetch('http://localhost:3001/api/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUri })
    });
    const result = await response.json();
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
