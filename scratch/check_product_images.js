import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log("=== Checking product_images table ===\n");

// 1. Ambil semua baris dari product_images (tanpa filter)
const { data: allImgs, error: e1 } = await supabase
  .from('product_images')
  .select('*')
  .limit(20);

if (e1) {
  console.log("ERROR fetching product_images:", e1.message);
} else {
  console.log(`Total baris di product_images: ${allImgs.length}`);
  if (allImgs.length > 0) {
    console.log("Kolom:", Object.keys(allImgs[0]));
    for (const img of allImgs) {
      console.log(" ", JSON.stringify(img));
    }
  } else {
    console.log("Tabel kosong atau diblokir RLS.");
  }
}

// 2. Ambil produk & cek per product_id
console.log("\n=== Per product ===");
const { data: products } = await supabase
  .from('products')
  .select('id, name')
  .limit(5);

for (const p of (products || [])) {
  const { data: imgs, error: e2 } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', p.id);
  
  console.log(`\n[${p.name}] (${p.id})`);
  if (e2) console.log("  ERROR:", e2.message);
  else if (!imgs || imgs.length === 0) console.log("  → 0 gambar di product_images");
  else {
    console.log(`  → ${imgs.length} gambar:`);
    for (const img of imgs) console.log("   ", JSON.stringify(img));
  }
}

process.exit(0);
