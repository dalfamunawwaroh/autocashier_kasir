import fs from 'fs';
import path from 'path';

async function testRoboflow() {
  const roboflowUrl = 'https://serverless.roboflow.com/jagoai-workspace/workflows/detect-count-and-visualize';
  const roboflowKey = 'z8OVl7BBMYBZO2r6BSNY';
  
  // Minimal 1x1 black pixel base64
  const base64Data = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  console.log('Testing Roboflow API...');
  try {
    const response = await fetch(roboflowUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: roboflowKey,
        inputs: {
          image: { type: "base64", value: base64Data }
        }
      })
    });
    
    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testRoboflow();
