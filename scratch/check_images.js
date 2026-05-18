import fetch from 'node-fetch';

async function check() {
  const urls = [
    "https://zhghwaypdgpxlznkammt.supabase.co/storage/v1/object/public/product-images/products/45126cf6-eb9d-4878-acb4-789c0ee2eb9a/front-fresh-02.jpeg",
    "https://zhghwaypdgpxlznkammt.supabase.co/storage/v1/object/public/product-images/products/6dbe0642-c969-4b03-8fc6-34b8fbdab681/front-kapal-api-special-01.jpeg"
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`URL: ${url}`);
      console.log(`Status: ${res.status} ${res.statusText}`);
      console.log(`Headers:`, res.headers.raw());
      console.log("-----------------------------------------");
    } catch (e) {
      console.error(`Failed to fetch ${url}:`, e);
    }
  }
}

check();
