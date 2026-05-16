import { supabase } from '../frontend/src/lib/supabase.ts';

async function testTxItems() {
  const { data, error } = await supabase.from('transaction_items').insert([{
    transaction_id: '123e4567-e89b-12d3-a456-426614174000',
    product_id: '123e4567-e89b-12d3-a456-426614174000',
    quantity: 1,
    price: 100
  }]);

  if (error) {
    console.error("Tx items error:", error);
  } else {
    console.log("Success");
  }
}

testTxItems();
