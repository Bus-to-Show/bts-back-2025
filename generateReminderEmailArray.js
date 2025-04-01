const generateReminderEmailArray = (orderDetail, result = []) => orderDetail.map(e => {
  //create key for eventId
  if (!result.hasOwnProperty(e.event_id)) {
    result[e.event_id] = {
      date: e.date,
      headliner: e.headliner,
      support1: e.support1,
      support2: e.support2,
      support3: e.support3,
      venue: e.venue,
      parties: {}
    }
    result[e.event_id].parties[e.party_id] = {
      load: e.firstBusLoadTime,
      depart: e.lastBusDepartureTime,
      street: e.streetAddress,
      locationName: e.locationName,
      city: e.city,
      orders: {}
    }
    result[e.event_id].parties[e.party_id].orders[e.orderedByEmail] = {
      email: e.orderedByEmail,
      orderFirst: e.orderedByFirstName,
      orderLast: e.orderedByLastName,
      phone: e.orderedByPhone,
      reservations: [
        { willFirst: e.willCallFirstName, willLast: e.willCallLastName }
      ],
      count: Number(e.res_count)
    }
  } else {
    if (!result[e.event_id].parties[e.party_id]) {
      result[e.event_id].parties[e.party_id] = {
        load: e.firstBusLoadTime,
        depart: e.lastBusDepartureTime,
        street: e.streetAddress,
        locationName: e.locationName,
        city: e.city,
        orders: {}
      }
      result[e.event_id].parties[e.party_id].orders[e.orderedByEmail] = {
        email: e.orderedByEmail,
        orderFirst: e.orderedByFirstName,
        orderLast: e.orderedByLastName,
        phone: e.orderedByPhone,
        reservations: [
          { willFirst: e.willCallFirstName, willLast: e.willCallLastName }
        ],
        count: Number(e.res_count)
      }
    } else {
      if (!result[e.event_id].parties[e.party_id].orders[e.orderedByEmail]) {
        result[e.event_id].parties[e.party_id].orders[e.orderedByEmail] = {
          email: e.orderedByEmail,
          orderFirst: e.orderedByFirstName,
          orderLast: e.orderedByLastName,
          phone: e.orderedByPhone,
          reservations: [
            { willFirst: e.willCallFirstName, willLast: e.willCallLastName }
          ],
          count: Number(e.res_count)
        }
      } else {
        result[e.event_id].parties[e.party_id].orders[e.orderedByEmail].reservations.push(
          { willFirst: e.willCallFirstName, willLast: e.willCallLastName }
        )
        result[e.event_id].parties[e.party_id].orders[e.orderedByEmail].count += Number(e.res_count)
      }

    }

  }
  return result
})

// console.log(result)
// console.log('parties ==> ', result['40197381'].parties)
// console.log('parties ==> ', result['40197379'].parties)
//   console.log('orders ==> ', result['40197381'].parties['987987'].orders['ctsurdinis@gmail.com'])

//   console.log('christina ====> ', result['40197381'].parties['1564'].orders['ctsurdinis@gmail.com'])
//   console.log('rachel ====>', result['40197379'].parties['1565'].orders['rachel.rivkin@gmail.com'])

module.exports = { generateReminderEmailArray }