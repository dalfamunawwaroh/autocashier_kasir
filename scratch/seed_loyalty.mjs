// Seed data testing untuk loyalty system
// Ambil user yang sudah ada, isi whatsapp + full_name, beri promo & poin

const SUPABASE_URL = 'https://zhghwaypdgpxlznkammt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZ2h3YXlwZGdweGx6bmthbW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODYyMjEsImV4cCI6MjA5MzA2MjIyMX0.YBZzHYeOCAC5YMvSP8Vrh0It2nzCltP8oQPW85QVauw';

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function req(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

async function seed() {
  // 1. Lihat user yang ada
  console.log('=== 1. Mengambil daftar user ===');
  const users = await req('GET', 'users?select=id,username,full_name,whatsapp');
  console.log(JSON.stringify(users.data, null, 2));
  
  if (!users.ok || !users.data?.length) {
    console.log('❌ Tidak ada user ditemukan atau error');
    return;
  }

  // Ambil user pertama untuk seed
  const user = users.data[0];
  const userId = user.id;
  console.log(`\nMenggunakan user: ${user.username} (ID: ${userId})`);

  // 2. Update whatsapp & full_name jika belum ada
  if (!user.whatsapp) {
    console.log('\n=== 2. Update whatsapp & full_name ===');
    const updateRes = await req('PATCH', `users?id=eq.${userId}`, {
      whatsapp: '081234567890',
      full_name: user.full_name || 'Member Test'
    });
    console.log(updateRes.ok ? '✅ Updated' : `❌ Error: ${JSON.stringify(updateRes.data)}`);
  } else {
    console.log(`\n✅ whatsapp sudah ada: ${user.whatsapp}`);
  }

  // 3. Insert promo untuk user ini
  console.log('\n=== 3. Insert member_promos ===');
  const promos = [
    {
      user_id: userId,
      code: 'WELCOME10',
      discount_type: 'percent',
      discount_value: 10,
      min_purchase: 0,
      expires_at: null,
      is_used: false
    },
    {
      user_id: userId,
      code: 'DISKON5K',
      discount_type: 'fixed',
      discount_value: 5000,
      min_purchase: 20000,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_used: false
    }
  ];

  for (const promo of promos) {
    const r = await req('POST', 'member_promos', promo);
    if (r.ok) {
      console.log(`✅ Promo '${promo.code}' dibuat`);
    } else {
      console.log(`⚠️  Promo '${promo.code}': ${JSON.stringify(r.data).substring(0, 100)}`);
    }
  }

  // 4. Insert poin awal
  console.log('\n=== 4. Insert member_points (saldo 500 pts) ===');
  const pointsRes = await req('POST', 'member_points', {
    user_id: userId,
    balance: 500,
    updated_at: new Date().toISOString()
  });
  if (pointsRes.ok) {
    console.log('✅ Saldo poin 500 pts dibuat');
  } else {
    // Mungkin sudah ada, coba update
    const upsert = await req('PATCH', `member_points?user_id=eq.${userId}`, { balance: 500 });
    console.log(upsert.ok ? '✅ Saldo poin diupdate ke 500 pts' : `⚠️ ${JSON.stringify(upsert.data)}`);
  }

  // 5. Tampilkan summary
  console.log('\n=== ✅ SEED SELESAI ===');
  const finalUser = await req('GET', `users?id=eq.${userId}&select=id,username,full_name,whatsapp`);
  const finalPromos = await req('GET', `member_promos?user_id=eq.${userId}&select=code,discount_type,discount_value,is_used`);
  const finalPoints = await req('GET', `member_points?user_id=eq.${userId}&select=balance`);

  console.log('\nUser:', JSON.stringify(finalUser.data?.[0], null, 2));
  console.log('Promos:', JSON.stringify(finalPromos.data, null, 2));
  console.log('Points:', JSON.stringify(finalPoints.data?.[0], null, 2));
  console.log(`\n📱 Nomor WA untuk testing: ${finalUser.data?.[0]?.whatsapp}`);
}

seed();
