import { supabase } from './src/lib/supabase.js';
async function check() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}
check();
