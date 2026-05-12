// seed_products.js
// Memasukkan semua produk berdasarkan label AI model Roboflow autocashier/1
// Label yang tersedia: cimory_yogurt_bites, duosus_cheese_sus, piattos_snack_kentang, ryori_potato_cone, tel_u_fresh

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zhghwaypdgpxlznkammt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZ2h3YXlwZGdweGx6bmthbW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODYyMjEsImV4cCI6MjA5MzA2MjIyMX0.YBZzHYeOCAC5YMvSP8Vrh0It2nzCltP8oQPW85QVauw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const products = [
  {
    name: 'Cimory Yogurt Bites Strawberry',
    price: 12000,
    stock: 50,
    ai_label: 'cimory_yogurt_bites',
    category: 'Snack',
    sku: 'CMY-001',
    description: 'Snack yogurt kering rasa strawberry dari Cimory, kaya kalsium dan probiotik. Kemasan 18g.',
    unit: 'pcs',
    barcode: '8992775001234',
    image_url: null
  },
  {
    name: 'Duosus Cheese Sus',
    price: 8000,
    stock: 60,
    ai_label: 'duosus_cheese_sus',
    category: 'Snack',
    sku: 'DSS-001',
    description: 'Kue sus kering dengan isian krim keju gurih, produk lokal berkualitas tinggi. Kemasan 65g.',
    unit: 'pcs',
    barcode: '8991004002345',
    image_url: null
  },
  {
    name: 'Piattos Snack Kentang',
    price: 10000,
    stock: 75,
    ai_label: 'piattos_snack_kentang',
    category: 'Snack',
    sku: 'PTS-001',
    description: 'Keripik kentang slice tipis renyah berbalut bumbu gurih khas Piattos. Kemasan 68g.',
    unit: 'pcs',
    barcode: '8994689003456',
    image_url: null
  },
  {
    name: 'Ryori Potato Cone',
    price: 7000,
    stock: 80,
    ai_label: 'ryori_potato_cone',
    category: 'Snack',
    sku: 'RPC-001',
    description: 'Snack kentang bentuk cone renyah dengan bumbu spesial khas Ryori. Kemasan 55g.',
    unit: 'pcs',
    barcode: '8997123004567',
    image_url: null
  },
  {
    name: 'Tel-U Fresh Minuman',
    price: 5000,
    stock: 100,
    ai_label: 'tel_u_fresh',
    category: 'Drink',
    sku: 'TUF-001',
    description: 'Minuman segar khas Telkom University, tersedia dalam berbagai varian rasa. Kemasan 250ml.',
    unit: 'pcs',
    barcode: '8993456005678',
    image_url: null
  }
];

async function seed() {
  console.log('🌱 Memulai seeding produk ke Supabase...\n');

  // Cek produk yang sudah ada
  const { data: existing, error: checkError } = await supabase.from('products').select('ai_label');
  if (checkError) {
    console.error('❌ Gagal cek data existing:', checkError.message);
    process.exit(1);
  }
  const existingLabels = (existing || []).map(p => p.ai_label);
  console.log(`📋 Label sudah ada di DB: [${existingLabels.join(', ') || 'kosong'}]`);

  let inserted = 0;
  let skipped = 0;

  for (const product of products) {
    if (existingLabels.includes(product.ai_label)) {
      console.log(`⏭️  SKIP: "${product.name}" (ai_label: ${product.ai_label}) — sudah ada`);
      skipped++;
      continue;
    }

    const { data, error } = await supabase.from('products').insert([product]).select().single();
    if (error) {
      // Mungkin kolom barcode/description/unit/image_url belum ada, coba tanpa kolom itu
      if (error.code === 'PGRST204' || error.message.includes('column')) {
        console.warn(`⚠️  Kolom ekstra tidak ditemukan, mencoba insert minimal untuk: ${product.name}`);
        const minimal = {
          name: product.name,
          price: product.price,
          stock: product.stock,
          ai_label: product.ai_label,
          category: product.category,
          sku: product.sku
        };
        const { data: d2, error: e2 } = await supabase.from('products').insert([minimal]).select().single();
        if (e2) {
          console.error(`❌ GAGAL insert "${product.name}": ${e2.message}`);
        } else {
          console.log(`✅ INSERT (minimal): "${d2.name}" — ID: ${d2.id}`);
          inserted++;
        }
      } else {
        console.error(`❌ GAGAL insert "${product.name}": ${error.message}`);
      }
    } else {
      console.log(`✅ INSERT: "${data.name}" — ID: ${data.id} — ai_label: ${data.ai_label}`);
      inserted++;
    }
  }

  console.log(`\n🎉 Selesai! ${inserted} produk berhasil ditambahkan, ${skipped} dilewati.`);

  // Tampilkan semua produk sekarang
  const { data: allProducts } = await supabase.from('products').select('id, name, price, stock, ai_label, category, sku').order('name');
  console.log('\n📦 Semua produk di database:');
  console.table(allProducts || []);

  process.exit(0);
}

seed().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
