exports.up = (knex) => {
  return knex.schema.table('events', (t) => {
    t.string('doors_time', '8').notNullable().defaultTo('00:00');
  });
};

exports.down = (knex) => {
  return knex.schema.table('events', (t) => {
    t.dropColumn('doors_time');
  });
};
