import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './auth-schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
  strict: true,
  verbose: true,
  // Ensure drizzle-kit reads .env.local for DATABASE_URL in Next.js apps
  // You can also export DATABASE_URL to the environment before running commands
  // e.g., `export $(grep -v '^#' .env.local | xargs)`
});


