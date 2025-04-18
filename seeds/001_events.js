exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('events').del()
    .then(() => {
      // Inserts seed entries
      return knex('events').insert([
        {
          id: 1,
          date: '08/08/2025',
          startTime: '19:00',
          venue: 'Red Rocks',
          headliner: 'David Bowie',
          support1: 'Adrian Belew Power Trio',
          headlinerBio: 'The most epic concert of all time. Prepare to be amazed!',
          headlinerImgLink: 'https://fastly-s3.allmusic.com/artist/mn0000531986/600/YF2KrpiP1CA1nwrNjeRUKj6KsMttLlyBmmVTZ6_CLs0=.jpg',
          doors_time: '18:00',
        },
        {
          id: 2,
          date: '08/09/2025',
          startTime: '19:00',
          venue: 'Red Rocks',
          headliner: 'King Crimson',
          support1: 'Stick Men',
          doors_time: '18:00',
        },
        {
          id: 3,
          date: '08/15/2025',
          startTime: '19:00',
          venue: 'Red Rocks',
          headliner: 'Rush',
          doors_time: '18:00',
        },
        {
          id: 4,
          date: '08/16/2025',
          startTime: '19:00',
          venue: 'Red Rocks',
          headliner: 'Yes',
          doors_time: '18:00',
        },
        {
          id: 5,
          date: '08/22/2025',
          startTime: '19:00',
          venue: 'Red Rocks',
          headliner: 'The Mothers of Invention',
          doors_time: '18:00',
        },
        {
          id: 6,
          date: '08/23/2025',
          startTime: '19:00',
          venue: 'Red Rocks',
          headliner: 'Genesis',
          doors_time: '18:00',
        },
      ]);
    })
    .then(() => {
      return knex.raw("SELECT setval('events_id_seq', (SELECT MAX(id) FROM events))");
    });
};
