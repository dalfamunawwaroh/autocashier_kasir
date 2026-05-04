import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhghwaypdgpxlznkammt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZ2h3YXlwZGdweGx6bmthbW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODYyMjEsImV4cCI6MjA5MzA2MjIyMX0.YBZzHYeOCAC5YMvSP8Vrh0It2nzCltP8oQPW85QVauw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsersTable() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error('Error querying users:', error.message);
  } else {
    console.log('Users table exists:', data);
  }

  const { data: admins, error: adminErr } = await supabase.from('admins').select('*').limit(1);
  if (adminErr) {
    console.error('Error querying admins:', adminErr.message);
  } else {
    console.log('Admins table exists:', admins);
  }
}

checkUsersTable();
