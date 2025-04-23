exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('discount_codes').del()
    .then(() => {
      // Inserts seed entries
      return knex('discount_codes').insert([
        {
          id: 1,
          discountCode: '1FREE',
          expiresOn: '2025-12-31',
          issuedOn: '2023-04-21',
          issuedTo: 'BTS staff',
          issuedBy: 'DK',
          issuedBecause: 'Feeling generous',
          type: 2,
          remainingUses: 1,
        },
        {
          id: 2,
          discountCode: 'FireFreeRides',
          expiresOn: '2025-12-31',
          issuedOn: '2023-04-21',
          issuedTo: 'FOTM staff',
          issuedBy: 'DK',
          issuedBecause: 'Pickup location',
          timesUsed: 3,
          type: 1,
          usesPerEvent: 2,
        },
      ]);
    })
    .then(() => {
      return knex.raw("SELECT setval('discount_codes_id_seq', (SELECT MAX(id) FROM discount_codes))");
    });
};
