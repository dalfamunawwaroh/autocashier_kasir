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

async function checkBranches() {
  const { data, error } = await supabase.from('branches').select('*').limit(1);
  if (error) {
    console.error('Error fetching branches:', error);
  } else if (data && data.length > 0) {
    console.log('Branches columns:', Object.keys(data[0]));
    console.log('Sample branch:', data[0]);
  } else {
    console.log('No branches found, but table exists.');
  }
  process.exit(0);
}

checkBranches();
