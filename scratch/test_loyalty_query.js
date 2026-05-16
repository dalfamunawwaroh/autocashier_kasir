import { supabase } from '../frontend/src/lib/supabase.js';

async function testQuery() {
  const user_id = '6cae98bd-7ed7-4704-84e9-4c3b619c49de';
  const now = new Date().toISOString();
  
  console.log("Querying promos for:", user_id);
  const { data, error } = await supabase
    .from('member_promos')
    .select('*')
    .eq('user_id', user_id)
    .eq('is_used', false)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (error) {
    console.error("Query Error:", error);
  } else {
    console.log("Query Success:", data);
  }

  console.log("\nQuerying points for:", user_id);
  const { data: points, error: pError } = await supabase
    .from('member_points')
    .select('balance')
    .eq('user_id', user_id)
    .maybeSingle();

  if (pError) {
    console.error("Points Error:", pError);
  } else {
    console.log("Points Success:", points);
  }
}

testQuery();
