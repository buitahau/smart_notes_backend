/** @type { import('drizzle-kit').Config } */
export default {
  schema: './src/database/schema/*.js',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};