var axios = require('axios')
const knex = require('./knex.js')
const lastFmApiKey = process.env.LASTFM_KEY
const songKickApiKey = process.env.SONGKICK_KEY
const ticketMasterApiKey = process.env.TICKETMASTER_APIKEY

// 
const sweepInCarts = () => {
  console.log('sweepInCarts fired')
  let twentyMinutesAgo = new Date(Date.now() - 1200000)
  console.log('twentyMinutesAgo', twentyMinutesAgo)
  let now = new Date(Date.now())
  console.log('now', now)

  knex('pickup_parties')
    .select('id', 'inCart', 'updated_at')
    .where('updated_at', '<', twentyMinutesAgo)
    .andWhereNot('inCart', '=', 0)
    .update('inCart', 0)
    .update('updated_at', now)
    .returning('*')
    .then(result => { console.log('sweepInCarts result', result) })
}

//sweepInCarts()

let finalShowsObjArray = []
getTicketMasterData = async () => {

  try {
    let page = 1;
    const response = await axios.get(`https://app.ticketmaster.com/discovery/v2/events?apikey=${ticketMasterApiKey}&venueId=KovZpZAaeIvA&locale=*&page=${page}`)
    const pages = response.data.page.totalPages;

    let showsFromTicketMasterAllPages = response.data._embedded.events;
    page += 1;
    while (page < pages) {
      const response = await axios.get(`https://app.ticketmaster.com/discovery/v2/events?apikey=${ticketMasterApiKey}&venueId=KovZpZAaeIvA&locale=*&page=${page}`)
      const showsFromTicketMasterThisPage = response.data._embedded.events  // grab just the events objects
      showsFromTicketMasterThisPage.forEach(show => { showsFromTicketMasterAllPages.push(show) });
      //console.log('showsFromTicketMasterAllPages ==>>==>> ', showsFromTicketMasterAllPages);
      page += 1;
    }

    const getDayOfWeek = (date) => {
      const dayOfWeek = new Date(date).getDay();
      return isNaN(dayOfWeek) ? null :
        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    }

    const formattedShowsFromTMAll = showsFromTicketMasterAllPages.map(show => {
      if (!show.test) {
        const artist0 = show._embedded.attractions[0] ? show._embedded.attractions[0].name : '';
        const artist1 = show._embedded.attractions[1] ? show._embedded.attractions[1].name : '';
        const artist2 = show._embedded.attractions[2] ? show._embedded.attractions[2].name : '';
        const artist3 = show._embedded.attractions[3] ? show._embedded.attractions[3].name : '';
        const eventNameMatchesHeadlinerName = (show.name === show._embedded.attractions[0].name)
        let headlinerName = show.name
        let headlinerImg = show.images.find(image => image.ratio === '3_2')
        let support1 = eventNameMatchesHeadlinerName ? artist1 : artist0
        let support2 = eventNameMatchesHeadlinerName ? artist2 : artist1
        let support3 = eventNameMatchesHeadlinerName ? artist3 : artist2
        let time = show.dates.start.localTime
        let date = show.dates.start.localDate.split('-').splice(1, 3).concat(show.dates.start.localDate.split(`-`)[0]).join('/')
        let dayOfWeek = getDayOfWeek(show.dates.start.localDate)
        if (!show.dates.start.localTime) {
          time = 0
        }
        let outlets = show.outlets && show.outlets.find(e => {
          if (e.type === 'tmMarketPlace')
            return e.url
        })
        return {
          tmId: show.id,
          tmType: show.type,
          dateStandard: show.dates.start.localDate,
          dateTime: show.dates.start.dateTime,
          date: date,
          startTime: time || "0:00:00",
          dayOfWeek: dayOfWeek,
          venue: show._embedded.venues[0].name.split(' Ampitheatre')[0],
          headliner: headlinerName,
          support1: support1,
          support2: support2,
          support3: support3,
          headlinerImgLink: headlinerImg.url || '',
          headlinerBio: '',
          tmGenre: show.classifications[0].genre ? show.classifications[0].genre.name : '',
          tmSubGenre: show.classifications[0].subGenre ? show.classifications[0].subGenre.name : '',
          tmTicketingLink: outlets ? outlets.url || '' : '',
          meetsCriteria: dayOfWeek === 'Friday' || dayOfWeek === 'Saturday' ? true : false
        }
      }
    })

    //const filteredShowsObj = filterShowsObj(showsFromTicketMasterAllPages)
    const artistsObj = parseShowName(showsFromTicketMasterAllPages)
    const lastFmArrayofObjs = await pingLastFm(artistsObj)
    //console.log('lastFmArrayofObjs ==>>==>> ', lastFmArrayofObjs);

    finalShowsObjArray = await combineObjects(lastFmArrayofObjs, formattedShowsFromTMAll)

  } catch (err) {
    console.error(err)
    return err
  }
  return finalShowsObjArray
}

//return an array of shows with no duplicate dates and venues
const filterShowsObj = (showsObj) => {
  console.log('showsObj last element ==>>==>> ', showsObj[showsObj.length - 1]);
  reduced = showsObj.reduce((newShows, currShow) => {
    //
    //console.log('newShows ==>>==>> ', newShows);
    //console.log('currShow ==>>==>> ', currShow);
    const res = newShows.find(show => show.date === currShow.date && show.venue === currShow.venue) ? newShows : newShows.push(currShow) && newShows
    //console.log('res ==>>==>> ', res);
    return res
  }, [])
  //console.log('reduced ==>>==>> ', reduced);
  return reduced
}

// 
const parseShowName = (filteredShowsObj) => {
  return filteredShowsObj.map(show => { // filter out most punctuation that breaks urls
    showName = show.name
    parsedShowName = showName.replace(/[&]/g, 'and')
      .replace(/[\/\\#,+()$~%.":*?<>{}]/g, '')
      .replace(/' /g, ' ')
    return parsedShowName.split(' ').join('+')
  })
}
// 
const pingLastFm = (artistsObj) => {
  const headlinerInfo = artistsObj.map((artist, i) => {
    const lastFmApi = encodeURI(`http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${artist}&autocorrect=1&api_key=${lastFmApiKey}&format=json`)
    //encodeURI allows for UTF-8 conversion of special letters in band name
    return axios.get(lastFmApi)
      .then(data => {
        return data.data
      })
      .catch(err => {
        console.error('error!', err)
      })
  })
  // map over array of band names, assign a promise to each one
  return Promise.all(headlinerInfo).then((headlinerObj) => {
    const headlinerInfoObj1 = headlinerObj.map(data => {
      const headlinerName = data.artist ? data.artist.name || '' : ''
      const headlinerImg = data.artist ? data.artist.image[2]['#text'] || '' : ''
      const headlinerBio = data.artist ? data.artist.bio.content || '' : ''
      if (data.error) {
        //not much to do here. the error just means that the band name was not found in the last.fm database
      }
      return { headlinerName, headlinerImg, headlinerBio }
    })
    // after promise fulfilled, populate an object with the fields above and return it to the previous function
    return headlinerInfoObj1
  })
    .catch(err => {
      console.error(err)
    })
}

// 
const combineObjects = async (lastFmObj, showsObj) => {
  // combine data from the two objects
  // console.log('lastFmObj[i] ==>>==>> ', lastFmObj);
  const data = showsObj.map((show, i) => {
    // console.log('showsObj[i] (show) ==>>==>> ', show);
    // console.log('lastFmObj[i] ==>>==>> ', lastFmObj[i]);
    const imgLink = show.headlinerImgLink || lastFmObj[i].headlinerImg
    return {
      ...show,
      headlinerImgLink: imgLink,
      headlinerBio: lastFmObj[i].headlinerBio
    }
  })
  return data
}

// 
const insertEventData = (allShowsObj) => {
  // pull event id's from the table, compare all current id's to all id's in allShowsObj, filter out objects where the id already exists in db
  knex('events')
    .select('tmId')
    .returning('tmId')
    .then(result => {
      result = result.map(elem => elem.tmId)
      let newShowsArr = allShowsObj.filter(show => {
        if (!result.includes(show.tmId)) {
          return show
        }
      })
      console.log('newShowsArr', newShowsArr.length);
      var newShowsIdAndStartTime = newShowsArr.map(show => {
        return {
          'id': show.id,
          'startTime': convertTimeToMinutes(show.startTime)
        }
      })
      knex('events')
        .insert(newShowsArr)
        .returning('*').then(result => {
          //console.log('result with event.id', result);
          if (result && result.length) {
            addPickupParties(result)
          }
        })
    })
    .catch(err => {
      console.log(err)
    })
}

// math from "hh:mm:ss" to minutes as a number
const convertTimeToMinutes = (timeToConvert = 0) => {
  let newTime = timeToConvert.split(':')
  newTime = parseInt(newTime[0]) * 60 + parseInt(newTime[1])
  return newTime
}

// calculate last bus departure time in minutes then format back to "hh:mm"
const calcDepartTime = (time, diff) => {
  //console.log('time in calcDepartTime', time)
  let convertedTime = convertTimeToMinutes(time)
  let result = ""
  if (time === '00:00:00') {
    result = `00:00`
  }
  else {
    let newTime = Number(convertedTime) - Number(diff)
    let hours = parseInt(newTime / 60)
    let minutes = (newTime % 60).toString().padStart(2, "0")
    result = `${hours}:${minutes}`
  }
  return result
}

// format each pickup location with its unique last bus departure times and aggregate into an array of objects
const addPickupParties = (newShowsIdAndStartTime) => {
  let newPickupParties = []
  newShowsIdAndStartTime.forEach(show => {
    //console.log('here is the show data find out why show.id is null ==>>==>> ', show);
    //(2, null, 23, NaN:NaN, null, 35, 0, 0, 2023-04-09 08:15:36.575549+00, 2023-04-09 08:15:36.575549+00, standard, standard, f)
    return newPickupParties.push(
      // { pickupLocationId:23,
      //   eventId: show.id,
      //   lastBusDepartureTime: calcDepartTime(show.startTime, 90),
      //   capacity: 22 },
      // { pickupLocationId:2,
      //   eventId: show.id,
      //   lastBusDepartureTime: calcDepartTime(show.startTime, 60) },
      {
        pickupLocationId: 3,
        eventId: show.id,
        lastBusDepartureTime: calcDepartTime(show.startTime, 90),
        capacity: 22
      },
      // { pickupLocationId:4,
      //   eventId: show.id,
      //   lastBusDepartureTime: calcDepartTime(show.startTime, 75) },
      // { pickupLocationId:5,
      //   eventId: show.id,
      //   lastBusDepartureTime: calcDepartTime(show.startTime, 60) },
      // { pickupLocationId:6,
      //   eventId: show.id,
      //   lastBusDepartureTime: calcDepartTime(show.startTime, 135) },
      // { pickupLocationId:7,
      //   eventId: show.id,
      //   lastBusDepartureTime: calcDepartTime(show.startTime, 210),
      //   partyPrice: 50.00},
      // { pickupLocationId:9,
      //   eventId: show.id,
      //   lastBusDepartureTime: calcDepartTime(show.startTime, 90)},
    )
  })
  //console.log('newPickupParties to insert ==>>==>> ', newPickupParties);
  knex('pickup_parties')
    .insert(newPickupParties).returning('*').then(result => { console.log('added pickup_parties', result.length || 0) })
}

// 
const checkForExistingParties = (pickupLocationId) => {
  const response = knex('pickup_parties')
    .where('pickupLocationId', pickupLocationId)
    .select('eventId', "pickupLocationId")
    .then(alreadyThere => {
      let alreadyThereArr = []
      alreadyThere.map(obj => {
        alreadyThereArr.push(obj.eventId)
      })
      return alreadyThereArr
    }).catch(err => {
      console.log('error in checkForExistingParties ::: ', err)
    })
  return response
}

//Function call for adding a pick-up location to all future events that don't already have a pickup party at that location.  (commemnt the line below back in and pass in the appropriate pickupLocationId as parameter). VVVVVV

//checkForExistingParties(9).then(alreadyThereArr => addSouthDock(alreadyThereArr))

// 
const addSouthDock = (alreadyThereArr) => {
  console.log("hi southDock!")
  knex('events')
    .select('id', 'date', 'meetsCriteria', 'isDenied', 'external', 'startTime')
    .then((data) => {
      let dryDockParties = []
      data.map(show => {
        console.log('is alreadyThereArr here?', alreadyThereArr)
        let tooSoon = Date.now() + 172800000 //calculate tim in milliseconds 72  hours later than right now
        if (!alreadyThereArr.includes(show.id) && (new Date(show.date).getTime() > tooSoon) && show.meetsCriteria && !show.isDenied && !show.external) {
          let time = show.startTime
          return dryDockParties.push(
            {
              pickupLocationId: 9,
              eventId: show.id,
              lastBusDepartureTime: calcDepartTime(time, 90),
              capacity: 200,
            }
          )
        }
      })
      knex('pickup_parties')
        .insert(dryDockParties).returning('*').then(result => { console.log('added dryDockParties', result.length || 0) })
    })
}


module.exports = { getTicketMasterData, insertEventData, sweepInCarts }
