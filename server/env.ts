import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables before anything else
const result = config({ path: join(process.cwd(), '.env') });

if (result.error) {
  console.error('Failed to load .env file:', result.error);
  process.exit(1);
}

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'OPENAI_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Log successful environment loading
console.log('✓ Environment variables loaded');