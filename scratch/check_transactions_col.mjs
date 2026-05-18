import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://zhghwaypdgpxlznkammt.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error("Missing SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  const { data, error } = await supabase.from('transactions').select('*').limit(1);
  if (error) {
    console.error('Error fetching transactions:', error);
  } else if (data && data.length > 0) {
    console.log('Transactions columns:', Object.keys(data[0]));
    if (!Object.keys(data[0]).includes('branch_id')) {
        console.log("branch_id COLUMN IS MISSING!");
    } else {
        console.log("branch_id COLUMN EXISTS!");
    }
  } else {
    console.log('No transactions found to check columns, attempting an empty insert check...');
    const res = await supabase.from('transactions').insert({ invoice_number: 'TEST', branch_id: null });
    console.log('Insert response:', res.error ? res.error.message : 'Success');
  }
  process.exit(0);
}

checkColumns();
