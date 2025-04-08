exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('pickup_parties').del()
    .then(() => {
      // Inserts seed entries
      return knex('pickup_parties').insert([
        {
          id: 1,
          eventId: 1,
          pickupLocationId: 1,
          lastBusDepartureTime: '17:00',
          firstBusLoadTime: '15:00',
          partyPrice: 30.0,
          capacity: 24,
        },
        {
          id: 2,
          eventId: 1,
          pickupLocationId: 2,
          lastBusDepartureTime: '17:00',
          firstBusLoadTime: '15:00',
          partyPrice: 30.0,
          capacity: 48,
        },
      ]);
    })
    .then(() => {
      return knex.raw("SELECT setval('pickup_parties_id_seq', (SELECT MAX(id) FROM pickup_parties))");
    });
};
