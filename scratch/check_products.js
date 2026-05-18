import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials in env file!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('products').select('*').limit(10);
  if (error) {
    console.error("Error fetching products:", error);
  } else {
    console.log("=== PRODUCTS IN DATABASE ===");
    data.forEach(p => {
      console.log(`ID: ${p.id} | SKU: ${p.sku} | Name: ${p.name} | Price: ${p.price} | AI Label: ${p.ai_label} | Image: ${p.image || p.image_url || 'N/A'}`);
      console.log("Full Record:", JSON.stringify(p, null, 2));
    });
  }
}

check();
