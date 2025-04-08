exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('discount_codes').del()
    .then(() => {
      // Inserts seed entries
      return knex('discount_codes').insert([
        {
          id: 1,
          discountCode: 'SAVE20',
          percentage: 20,
          expiresOn: 20251231,
          issuedOn: 20250101,
          issuedTo: 'BTS staff',
          issuedBy: 'DK',
          issuedBecause: 'Feeling generous',
          timesUsed: 3,
          type: 1,
          remainingUses: 2,
          usesPerEvent: 3,
        },
      ]);
    })
    .then(() => {
      return knex.raw("SELECT setval('discount_codes_id_seq', (SELECT MAX(id) FROM discount_codes))");
    });
};
