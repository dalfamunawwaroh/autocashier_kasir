import { supabase } from '../src/lib/supabase.js';

async function main() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error fetching products:', error);
  } else {
    console.log(`Fetched ${data.length} products.`);
    if (data.length > 0) {
      console.log('Sample product:', data[0]);
    }
  }
}

main();
