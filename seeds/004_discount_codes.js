exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('discount_codes').del()
    .then(() => {
      // Inserts seed entries
      return knex('discount_codes').insert([
        {
          id: 1,
          discountCode: '1FREE',
          expiresOn: 20251231,
          issuedOn: 20250101,
          issuedTo: 'BTS staff',
          issuedBy: 'DK',
          issuedBecause: 'Feeling generous',
          type: 1,
        },
        {
          id: 2,
          discountCode: 'SAVE20',
          percentage: 20,
          expiresOn: 20251231,
          issuedOn: 20250101,
          issuedTo: 'FOTM staff',
          issuedBy: 'DK',
          issuedBecause: 'Pickup location',
          timesUsed: 3,
          type: 2,
          remainingUses: 2,
        },
      ]);
    })
    .then(() => {
      return knex.raw("SELECT setval('discount_codes_id_seq', (SELECT MAX(id) FROM discount_codes))");
    });
};
