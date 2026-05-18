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

async function run() {
  try {
    // 1. Delete the 16 generated cashier accounts
    console.log("Cleaning up previously generated cashier accounts...");
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .or('username.like.kasir_jkt001_%,username.like.kasir_bdg001_%,username.like.kasir_sby001_%,username.like.kasir_br-001_%');

    if (deleteError) {
      console.error("Warning deleteError:", deleteError);
    } else {
      console.log("Cleaned up old temporary cashier users successfully.");
    }

    // 2. Fetch all branches
    const { data: branches, error: branchError } = await supabase.from('branches').select('*');
    if (branchError) throw branchError;

    // Find correct branch IDs by matching codes or names
    const jktBranch = branches.find(b => b.code?.toLowerCase() === 'jkt001' || b.name?.toLowerCase().includes('jakarta'));
    const bdgBranch = branches.find(b => b.code?.toLowerCase() === 'bdg001' || b.name?.toLowerCase().includes('bandung'));
    const sbyBranch = branches.find(b => b.code?.toLowerCase() === 'sby001' || b.name?.toLowerCase().includes('surabaya'));
    const utamaBranch = branches.find(b => b.code?.toLowerCase() === 'br-001' || b.name?.toLowerCase().includes('utama'));

    const hashedPassword = await bcrypt.hash('kasir123', 10);

    const usersToInsert = [];

    if (jktBranch) {
      usersToInsert.push({
        username: 'kasir_jkt',
        email: 'kasir_jkt@autocashier.local',
        password: hashedPassword,
        full_name: 'Kasir Jakarta Central',
        role: 'kasir',
        branch_id: jktBranch.id
      });
    }

    if (bdgBranch) {
      usersToInsert.push({
        username: 'kasir_bdg',
        email: 'kasir_bdg@autocashier.local',
        password: hashedPassword,
        full_name: 'Kasir Bandung Branch',
        role: 'kasir',
        branch_id: bdgBranch.id
      });
    }

    if (sbyBranch) {
      usersToInsert.push({
        username: 'kasir_sby',
        email: 'kasir_sby@autocashier.local',
        password: hashedPassword,
        full_name: 'Kasir Surabaya Branch',
        role: 'kasir',
        branch_id: sbyBranch.id
      });
    }

    if (utamaBranch) {
      usersToInsert.push({
        username: 'kasir_utama',
        email: 'kasir_utama@autocashier.local',
        password: hashedPassword,
        full_name: 'Kasir Cabang Utama',
        role: 'kasir',
        branch_id: utamaBranch.id
      });
    }

    console.log(`Inserting ${usersToInsert.length} exact cashier accounts...`);
    const { data: inserted, error: insertError } = await supabase.from('users').insert(usersToInsert).select();
    if (insertError) throw insertError;

    console.log("Successfully created exact cashier accounts!");
    inserted.forEach(u => {
      console.log(`Username: ${u.username} | Password: kasir123 | Nama: ${u.full_name}`);
    });

  } catch (error) {
    console.error("Process failed:", error);
  }
  process.exit(0);
}

run();
