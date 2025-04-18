exports.up = (knex) => {
  return knex.schema.table('discount_codes_events', (t) => {
    t.integer('timesUsedThisEvent').defaultTo(0)
  });
};

exports.down = (knex) => {
  return knex.schema.table('discount_codes_events', (t) => {
    t.dropColumn('timesUsedThisEvent');
  });
};
