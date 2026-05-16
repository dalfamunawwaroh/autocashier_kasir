// Test query via fetch to see exact PostgREST errors
const SUPABASE_URL = 'https://zhghwaypdgpxlznkammt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZ2h3YXlwZGdweGx6bmthbW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODYyMjEsImV4cCI6MjA5MzA2MjIyMX0.YBZzHYeOCAC5YMvSP8Vrh0It2nzCltP8oQPW85QVauw';

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
};

async function test() {
  const user_id = '6cae98bd-7ed7-4704-84e9-4c3b619c49de';
  const now = new Date().toISOString();

  console.log('Testing promos query...');
  const res1 = await fetch(`${SUPABASE_URL}/rest/v1/member_promos?user_id=eq.${user_id}&is_used=eq.false&or=(expires_at.is.null,expires_at.gt.${now})`, { headers });
  const data1 = await res1.json();
  console.log('Promos status:', res1.status);
  console.log('Promos data:', JSON.stringify(data1, null, 2));

  console.log('\nTesting points query...');
  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/member_points?user_id=eq.${user_id}&select=balance`, { headers });
  const data2 = await res2.json();
  console.log('Points status:', res2.status);
  console.log('Points data:', JSON.stringify(data2, null, 2));
}

test();
