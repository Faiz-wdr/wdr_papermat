import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:papermart123%40@db.fidtfvfwnqofhwnoxluq.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Connecting to Supabase PostgreSQL database...');
  await client.connect();
  console.log('Connected.');

  const sqlPath = path.join(__dirname, '../supabase/schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Applying schema.sql...');
  await client.query(sql);
  console.log('Schema applied successfully!');

  // Check if admin user exists in auth.users, if not create one
  console.log('Checking auth users...');
  const userCheck = await client.query("SELECT id, email FROM auth.users WHERE email = 'admin@wandoorpaper.com';");
  
  if (userCheck.rows.length === 0) {
    console.log('Creating default admin user (admin@wandoorpaper.com)...');
    const insertUserQuery = `
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@wandoorpaper.com',
        extensions.crypt('papermart123', extensions.gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Shop Admin"}',
        now(),
        now()
      ) RETURNING id, email;
    `;
    const res = await client.query(insertUserQuery);
    console.log('Created user:', res.rows[0]);
  } else {
    console.log('Admin user already exists:', userCheck.rows[0]);
  }

  // Also verify tables and row counts
  const tables = ['business_settings', 'items', 'customers', 'invoices', 'invoice_items'];
  for (const t of tables) {
    const countRes = await client.query(`SELECT COUNT(*) FROM public.${t};`);
    console.log(`Table ${t}: ${countRes.rows[0].count} records`);
  }

  await client.end();
  console.log('Migration complete!');
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
