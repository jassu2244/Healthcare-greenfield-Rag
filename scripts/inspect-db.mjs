import { pool, ensureTables } from '../src/foundation/db.ts';

async function inspect() {
  await ensureTables();
  const tables = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
  );
  console.log('--- TABLES IN POSTGRESQL ---');
  console.log(tables.rows.map((r) => r.table_name));

  console.log('\n--- SCHEMA FOR TABLE: doctor_messages ---');
  const cols = await pool.query(
    `SELECT column_name, data_type, is_nullable, column_default 
     FROM information_schema.columns 
     WHERE table_name = 'doctor_messages' 
     ORDER BY ordinal_position;`
  );
  console.table(cols.rows);

  console.log('\n--- SAMPLE DOCTOR MESSAGES IN DB ---');
  const msgs = await pool.query('SELECT * FROM doctor_messages ORDER BY created_at DESC LIMIT 5;');
  console.table(msgs.rows);

  await pool.end();
}

inspect().catch(console.error);
