exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('pickup_locations').del()
    .then(() => {
      // Inserts seed entries
      return knex('pickup_locations').insert([
        {
          id: 1,
          streetAddress: '1313 College Ave, Boulder, CO 80302',
          city: 'Boulder',
          locationName: 'Boulder - University Hill Cheba Hut',
          latitude: '40.007480',
          longitude: '-105.275870',
          type: 'standard',
          basePrice: '25.00',
        },
        {
          id: 2,
          streetAddress: '1744 E Evans Ave, Denver, CO',
          city: 'Denver',
          locationName: `Denver - DU Illegal Pete's`,
          latitude: '39.678310',
          longitude: '-104.966740',
          type: 'standard',
          basePrice: '25.00',
        },
        {
          id: 3,
          streetAddress: '638 East Colfax Avenue, Denver, CO 80203',
          city: 'Denver',
          locationName: 'Denver - Colfax/Cap Hill Cheba Hut',
          latitude: '39.739770',
          longitude: '-104.979000',
          type: 'standard',
          basePrice: '25.00',
        },
        {
          id: 4,
          streetAddress: '1531 Champa St, Denver, CO 80202',
          city: 'Denver',
          locationName: 'Denver - Champa/Downtown Cheba Hut',
          latitude: '39.746120',
          longitude: '-104.994770',
          type: 'standard',
          basePrice: '25.00',
        },
        {
          id: 5,
          streetAddress: '3001 Walnut St, Denver, CO 80205',
          city: 'Denver',
          locationName: 'Denver - RiNo Epic Brewing',
          latitude: '39.763340',
          longitude: '-104.981410',
          type: 'standard',
          basePrice: '25.00',
        },
        {
          id: 6,
          streetAddress: '635 Main St., Longmont, CO 80501, CO 80202',
          city: 'Longmont',
          locationName: 'Longmont - Main St. Cheba Hut',
          latitude: '40.170320',
          longitude: '-105.102900',
          type: 'standard',
          basePrice: '25.00',
        },
        {
          id: 7,
          streetAddress: '320 Walnut, Fort Collins, CO',
          city: 'Fort Collins',
          locationName: `Fort Collins - Old Town Illegal Pete's`,
          latitude: '40.588001',
          longitude: '-105.074547',
          type: 'standard',
          basePrice: '30.00',
        },
      ]);
    })
    .then(() => {
      return knex.raw("SELECT setval('pickup_locations_id_seq', (SELECT MAX(id) FROM pickup_locations))");
    });
};
