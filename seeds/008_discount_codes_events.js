exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('discount_codes_events').del()
    .then(() => {
      // Inserts seed entries
      return knex('discount_codes_events').insert([
        {
          id: 1,
          eventsId: 1,
          discountCodeId: 1,
        },
      ]);
    })
    .then(() => {
      return knex.raw("SELECT setval('discount_codes_events_id_seq', (SELECT MAX(id) FROM discount_codes_events))");
    });
};
