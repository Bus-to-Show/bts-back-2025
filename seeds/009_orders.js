exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('orders').del()
    .then(() => {
      // Inserts seed entries
      return knex('orders').insert([
        {
          id: 1,
          orderedByFirstName: 'Dave',
          orderedByLastName: 'Kennedy',
          orderedByEmail: 'dave@bustoshow.org',
          userId: 1,
          orderedByPhone: '(111) 111-1111',
        },
      ]);
    })
    .then(() => {
      return knex.raw("SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders))");
    });
};
