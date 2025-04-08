exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('reservations').del()
    .then(() => {
      // Inserts seed entries
      return knex('reservations').insert([
        {
          id: 1,
          orderId: 1,
          pickupPartiesId: 1,
          willCallFirstName: 'Dave',
          willCallLastName: 'Kennedy',
          status: 1,
        },
        {
          id: 2,
          orderId: 1,
          pickupPartiesId: 1,
          willCallFirstName: 'Dave',
          willCallLastName: 'Kennedy',
          status: 1,
        },
      ]);
    })
    .then(() => {
      return knex.raw("SELECT setval('reservations_id_seq', (SELECT MAX(id) FROM reservations))");
    });
};
