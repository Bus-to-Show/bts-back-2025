exports.up = (knex) => {
  return knex.schema.table('users', (t) => {
    t.boolean('is_verified').notNullable().defaultTo('false');
  });
};

exports.down = (knex) => {
  return knex.schema.table('users', (t) => {
    t.dropColumn('is_verified');
  });
};
