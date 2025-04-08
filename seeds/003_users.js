exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(() => {
      // Inserts seed entries
      return knex('users').insert([
        {
          id: 1,
          firstName: 'Guest',
          lastName: 'Guest',
          email: 'updates@bustoshow.org',
        },
        {
          id: 2,
          firstName: 'Admin',
          lastName: 'Admin',
          email: 'admin@bustoshow.org',
          isAdmin: true,
          hshPwd: '$2b$10$w7U5JWDjYBr9cKXDWqp8hORVD/JpnYyRQG5gPk/2.RqRutRvDa8Ni', // Test123$
          is_verified: true,
        },
      ]);
    })
    .then(() => {
      return knex.raw("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))");
    });
};
