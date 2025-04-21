import { knex } from 'knex';
import dotenv from 'dotenv';
import { env } from './env';

dotenv.config();

const db = knex({
  client: 'pg',
  connection: env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: '../migrations'
  }
});

export default db; 