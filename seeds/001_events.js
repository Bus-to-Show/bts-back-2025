exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('events').del()
    .then(() => {
      // Inserts seed entries
      return knex('events').insert([
        {
          id: 1,
          date: '08/26/2025',
          startTime: '19:00',
          venue: 'Red Rocks',
          headliner: 'David Bowie',
          support1: 'King Crimson',
          support2: 'Rush',
          support3: 'Yes',
          headlinerBio: 'The most epic concert of all time. Prepare to be amazed!',
          headlinerImgLink: 'https://lastfm.freetls.fastly.net/i/u/770x0/1d54e3bd190edb0efa48ffc3d3c2331b.jpg',
          doors_time: '18:00',
        },
      ]);
    })
    .then(() => {
      return knex.raw("SELECT setval('events_id_seq', (SELECT MAX(id) FROM events))");
    });
};
