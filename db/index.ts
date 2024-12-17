import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "./schema";
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  },
  max: 20, 
  idleTimeoutMillis: 30000, 
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.connect()
  .then(client => {
    console.log('Successfully connected to database');
    client.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
    throw err;
  });

export const db = drizzle(pool, { schema });
