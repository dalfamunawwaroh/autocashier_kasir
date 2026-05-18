import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhghwaypdgpxlznkammt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZ2h3YXlwZGdweGx6bmthbW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODYyMjEsImV4cCI6MjA5MzA2MjIyMX0.YBZzHYeOCAC5YMvSP8Vrh0It2nzCltP8oQPW85QVauw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listImages() {
  try {
    const { data: products, error: pErr } = await supabase.from('products').select('id, name, image_url');
    if (pErr) throw pErr;

    console.log("PRODUCTS:");
    console.log(JSON.stringify(products, null, 2));

    const { data: images, error: iErr } = await supabase.from('product_images').select('*');
    if (iErr) throw iErr;

    console.log("\nPRODUCT IMAGES:");
    console.log(JSON.stringify(images, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

listImages();
