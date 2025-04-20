/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('urls', (table) => {
    table.increments('id').primary();
    table.text('original_url').notNullable();
    table.text('normalized_url').notNullable();
    table.string('code', 10).notNullable().unique();
    table.timestamps(true, true);

    // Add index on normalized_url for faster lookups
    table.index('normalized_url');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable('urls');
} 