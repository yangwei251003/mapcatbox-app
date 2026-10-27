/* Personal isolated Supabase projects only. No credentials, automatic startup or network at import. */
async function main() {
  if (!process.argv.includes('--apply-to-new-empty-database')) {
    console.log('Manual operation only. Review docs/CLOUD_MODE.md, set a private DATABASE_URL, then explicitly pass --apply-to-new-empty-database. No connection made.');
    return;
  }
  if (!process.env.DATABASE_URL) throw new Error('Private DATABASE_URL is required.');
  const url = new URL(process.env.DATABASE_URL);
  if (!['postgres:','postgresql:'].includes(url.protocol)) throw new Error('A PostgreSQL URL is required.');
  for (const key of ['sslmode','sslcert','sslkey','sslrootcert']) url.searchParams.delete(key);
  const {default:pg}=await import('pg');
  const {Pool}=pg;
  const fs=await import('node:fs');
  const path=await import('node:path');
  const pool = new Pool({connectionString:url.toString(),ssl:{rejectUnauthorized:true},connectionTimeoutMillis:15000});
  const connection = await pool.connect();
  try {
    const {rows}=await connection.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
    if(rows.length) throw new Error('Refusing a non-empty public schema. Migrate existing projects manually.');
    await connection.query('BEGIN');
    // Whole SQL files preserve function bodies. Never also run the duplicate all-in-one file.
    for (const file of ['001_schema.sql','002_functions.sql','003_seed_stray_cats.sql','004_privacy_guard.sql']) {
      await connection.query(fs.readFileSync(path.join(__dirname,'..','supabase','migrations',file),'utf8'));
      console.log(`Applied ${file}`);
    }
    await connection.query('COMMIT');
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {connection.release();await pool.end();}
}
main().catch(()=>{console.error('Migration refused or failed. No private connection/error values are logged; review your isolated database manually.');process.exitCode=1;});
