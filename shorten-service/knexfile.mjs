import dotenv from 'dotenv';

dotenv.config();

const config = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './src/migrations',
    loadExtensions: ['.mjs', '.js', '.ts']
  }
};

export default config; 