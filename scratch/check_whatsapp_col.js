import { supabase } from '../frontend/src/lib/supabase.js';

async function checkSchema() {
  console.log("Checking 'users' table columns...");
  const { data, error } = await supabase.from('users').select('*').limit(1);
  
  if (error) {
    console.error("Error fetching from users table:", error.message);
    if (error.message.includes('column "whatsapp" does not exist')) {
        console.log("CONFIRMED: Column 'whatsapp' is missing.");
    }
  } else {
    console.log("Successfully fetched a row from 'users'.");
    if (data.length > 0) {
        console.log("Columns present:", Object.keys(data[0]));
        if (!Object.keys(data[0]).includes('whatsapp')) {
            console.log("Column 'whatsapp' is MISSING.");
        } else {
            console.log("Column 'whatsapp' ALREADY EXISTS.");
        }
    } else {
        console.log("Table is empty, cannot determine columns this way.");
    }
  }
}

checkSchema();
