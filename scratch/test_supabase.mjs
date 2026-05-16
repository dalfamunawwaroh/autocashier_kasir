import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log("Testing insert into transactions...");
  const { data, error } = await supabase.from('transactions').insert([{
    invoice_number: `TEST-${Date.now()}`,
    total_price: 10000,
    payment_method: 'QRIS',
    cash_received: 10000,
    cash_return: 0,
    cashier_name: 'AutoCashier',
    receipt_url: null,
    payment_status: 'pending_verification'
  }]).select().single();

  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Success:", data);
  }
}

testInsert();
