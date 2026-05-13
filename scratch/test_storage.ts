import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

async function testList() {
    const { data, error } = await supabase.storage.from('product-images').list('products/fb564590-5b67-423d-b16e-d6b8661b4c59', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
    });
    console.log("Data:", data);
    console.log("Error:", error);
}

testList();
