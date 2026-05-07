const roboflowUrl = 'https://detect.roboflow.com/infer/workflows/jagoai-workspace/detect-count-and-visualize';
const roboflowKey = 'z8OVl7BBMYBZO2r6BSNY';
const base64Data = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAkACQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVWV1hZWmNkZWZnaGlqc3R1dnd4eXqELBITEhcUExYVEx8RFRocISGicHInJjNGRlZaamJztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooA//9k=';

async function testVariant(name, inputs) {
  console.log(`--- Testing Variant: ${name} ---`);
  try {
    const response = await fetch(roboflowUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: roboflowKey,
        inputs: inputs
      })
    });
    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
  console.log('\n');
}

async function run() {
  // Variant 1: Object with type: base64 (What we had)
  await testVariant('Object with type: base64', {
    image: { type: "base64", value: base64Data }
  });

  // Variant 2: Direct base64 string
  await testVariant('Direct base64 string', {
    image: base64Data
  });

  // Variant 3: Object with type: "image", value: base64
  await testVariant('Object with type: image', {
    image: { type: "image", value: base64Data }
  });
  
  // Variant 5: List of images
  await testVariant('List of images', {
    image: [{ type: "base64", value: base64Data }]
  });

  // Variant 6: Correct URL structure
  const correctUrl = 'https://detect.roboflow.com/infer/workflows/jagoai-workspace/detect-count-and-visualize';
  console.log(`--- Testing Correct URL: ${correctUrl} ---`);
  try {
    const response = await fetch(`${correctUrl}?api_key=${roboflowKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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

run();
