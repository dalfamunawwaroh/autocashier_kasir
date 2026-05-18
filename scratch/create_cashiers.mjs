import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

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

async function createCashiers() {
  try {
    // 1. Fetch all branches
    const { data: branches, error: branchError } = await supabase.from('branches').select('*');
    if (branchError) throw branchError;

    if (!branches || branches.length === 0) {
      console.log("No branches found in table 'branches'. Please make sure some branches exist first.");
      process.exit(0);
    }

    console.log(`Found ${branches.length} branches. Generating 4 cashiers per branch...`);

    // 2. Hash default password 'kasir123'
    const defaultPassword = 'kasir123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const usersToInsert = [];

    for (const branch of branches) {
      const branchCode = (branch.code || 'UNKNOWN').toUpperCase();
      console.log(`Processing branch: ${branch.name} (${branchCode})`);

      for (let i = 1; i <= 4; i++) {
        const username = `kasir_${branchCode.toLowerCase()}_${i}`;
        const email = `${username}@autocashier.local`;
        const fullName = `Kasir ${branch.name} ${i}`;

        usersToInsert.push({
          username,
          email,
          password: hashedPassword,
          full_name: fullName,
          role: 'kasir',
          branch_id: branch.id
        });
      }
    }

    // 3. Insert into users table
    console.log(`Inserting ${usersToInsert.length} cashier users into 'users' table...`);
    const { data: insertedUsers, error: insertError } = await supabase.from('users').insert(usersToInsert).select();

    if (insertError) throw insertError;

    console.log(`Successfully created ${insertedUsers.length} cashier users!`);
    console.log('\n--- Kredensial Login Kasir Baru ---');
    insertedUsers.forEach(u => {
      console.log(`Username: ${u.username} | Password: ${defaultPassword} | Nama: ${u.full_name}`);
    });

  } catch (error) {
    console.error("Error creating cashier users:", error);
  }
  process.exit(0);
}

createCashiers();
