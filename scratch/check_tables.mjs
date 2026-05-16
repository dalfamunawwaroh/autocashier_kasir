// Migration script: Jalankan SQL loyalty system ke Supabase
// via Supabase REST API + anon key

const SUPABASE_URL = 'https://zhghwaypdgpxlznkammt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZ2h3YXlwZGdweGx6bmthbW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODYyMjEsImV4cCI6MjA5MzA2MjIyMX0.YBZzHYeOCAC5YMvSP8Vrh0It2nzCltP8oQPW85QVauw';

// Supabase anon key can't run DDL directly via REST.
// We'll use the JS client to insert test data and verify tables exist.
// For DDL, we need to use the Supabase dashboard or service_role key.

// Let's verify current table state first.
async function checkTables() {
  console.log('Checking Supabase connectivity...\n');

  const tables = ['users', 'member_promos', 'member_points', 'point_transactions'];

  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=0`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'count=exact'
        }
      });

      if (response.ok || response.status === 406) {
        const count = response.headers.get('content-range');
        console.log(`✅ Table '${table}' EXISTS ${count ? `(${count} rows)` : ''}`);
      } else if (response.status === 404 || response.status === 400) {
        const body = await response.text();
        if (body.includes('does not exist') || body.includes('relation')) {
          console.log(`❌ Table '${table}' MISSING — perlu dibuat via SQL Editor`);
        } else {
          console.log(`⚠️  Table '${table}' status ${response.status}: ${body.substring(0, 100)}`);
        }
      } else {
        const body = await response.text();
        console.log(`⚠️  Table '${table}' status ${response.status}: ${body.substring(0, 100)}`);
      }
    } catch (err) {
      console.log(`❌ Error checking '${table}': ${err.message}`);
    }
  }

  // Check whatsapp column on users
  console.log('\nChecking columns in users table...');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,full_name,whatsapp&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    const body = await res.text();
    if (body.includes('whatsapp') || res.ok) {
      console.log('✅ Column whatsapp EXISTS in users');
    } else if (body.includes('does not exist')) {
      console.log('❌ Column whatsapp MISSING — perlu ALTER TABLE');
    } else {
      console.log(`⚠️  users column check: ${body.substring(0, 200)}`);
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
  }
}

checkTables().then(() => {
  console.log(`
====================================================
SQL YANG PERLU DIJALANKAN DI SUPABASE SQL EDITOR:
https://supabase.com/dashboard/project/zhghwaypdgpxlznkammt/sql

Lihat file: loyalty_system.sql
====================================================
`);
});
