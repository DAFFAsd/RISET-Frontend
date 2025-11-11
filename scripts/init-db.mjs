// Script to initialize database
// Run: node scripts/init-db.mjs

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database initialization...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL
    await client.query(sql);
    
    console.log('✅ Database schema created successfully!');
    console.log('✅ Sample data inserted!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase()
  .then(() => {
    console.log('✨ Database initialization complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
