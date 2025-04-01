const nodemailer = require('nodemailer');
const EMAIL_PASS = process.env.EMAIL_PASS
const generateReminderEmailArray = require('./generateReminderEmailArray').generateReminderEmailArray


let countVal = 0
const whitelist = process.env.ORIGIN_URL.split(' ')
// Parse the environment variable into an object
const parse = require("pg-connection-string").parse;
const pgconfig = parse(process.env.DATABASE_URL);

const Pool = require('pg').Pool
const pool = new Pool(pgconfig)

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'updates@bustoshow.org',
      pass: EMAIL_PASS
    }
  });

  const sendReminder = async ()=>{
     const riderList = await reminderQuery()
    //result.email = email


  }

  const actuallySend = async (emailAddress, emailBody) => {
    await transporter.sendMail({
        from: 'updates@bustoshow.org',
        to: emailAddress,
        bcc: 'reservations@bustoshow.org',
        subject: `Your Bus to Show Event Details` ,
        text: emailBody
      }, function(error, info){
        if (error) {
            console.error(error)
        } else {
          console.log(' here is what info is ', info)
          res.status(200).json(info.accepted)
      }
     })
  }

  const reminderQuery = () => {
      console.log('-reminderquery fired ')
    pool.connect((err, client, release) => {
        if (err) {
          return console.error('Error acquiring client', err.stack)
        }

        client.query(`
        WITH event_order_details AS (
	        SELECT o."orderedByEmail"
	            , o."orderedByFirstName"
	        	, o."orderedByLastName"
	        	, o."orderedByPhone"
	        	, o."id" AS order_id
	        	, r.id AS res_id
	        	, r."willCallFirstName"
	        	, r."willCallLastName"
	        	, pp.id AS party_id
	        	, pp."firstBusLoadTime" 
	        	, pp."lastBusDepartureTime"
	        	, pl."streetAddress" 
	        	, pl."locationName"
	        	, pl."city"
	        	, events."id" AS event_id
	        	, events."date"
	        	, events.headliner
	        	, events.support1
	        	, events.support2
	        	, events.support3
	        	, events.venue
	        FROM orders o
	        JOIN reservations r ON o.id = r."orderId"
	        JOIN pickup_parties pp ON r."pickupPartiesId" = pp.id
	        JOIN pickup_locations pl ON pp."pickupLocationId" = pl.id
	        JOIN events ON pp."eventId" = events.id
	        WHERE TO_DATE(events."date"::TEXT, 'MM/DD/YYYY') >= TO_DATE((current_date) ::TEXT, 'YYYY/MM/DD')
	        AND TO_DATE(events."date"::TEXT, 'MM/DD/YYYY') <= TO_DATE((current_date + 1) ::TEXT, 'YYYY/MM/DD')
	        AND r.status != 3
        ) SELECT  "orderedByEmail"
	            , INITCAP("orderedByFirstName") AS "orderedByFirstName" 
	        	, INITCAP("orderedByLastName") AS "orderedByLastName" 
	        	, "orderedByPhone"
	        	, order_id
	        	, INITCAP("willCallFirstName") AS "willCallFirstName" 
	        	, INITCAP("willCallLastName")  AS "willCallLastName"
	        	, party_id
	        	, "firstBusLoadTime" 
	        	, "lastBusDepartureTime"
	        	, "streetAddress" 
	        	, "locationName"
	        	, "city"
	        	, event_id
	        	, "date"
	        	, event_id
	        	, headliner
	        	, support1
	        	, support2
	        	, support3
	        	, venue
                , count(res_id) AS res_count
        FROM event_order_details 
		GROUP BY "orderedByEmail"
			    , order_id
	            , "orderedByFirstName"
	        	, "orderedByLastName"
	        	, "orderedByPhone"
	        	, "willCallFirstName"
	        	, "willCallLastName"
	        	, party_id
	        	, "firstBusLoadTime" 
	        	, "lastBusDepartureTime"
	        	, "streetAddress" 
	        	, "locationName"
	        	, "city"
	        	, "date"
	        	, event_id
	        	, headliner
	        	, support1
	        	, support2
	        	, support3
	        	, venue
		
        `, (err, result) => {
          release()
          if (err) {
            console.log('awwww nuts, ', err)
            return console.error('Error executing query', err.stack)
          }
          let riderList = result.rows
          if(riderList && countVal === 0) {
            countVal += 1
            console.log(' hey great we got results back from the query ')

            const formattedEmailList = generateReminderEmailArray(riderList)
            if(countVal === 1){
              countVal += 1
              console.log('countVal ', countVal)
            formattedEmailList.forEach(show => {
              if (countVal < 2 + formattedEmailList.length){

              
              countVal = formattedEmailList.length + countVal
              console.log(' show array here !! ', show, countVal)
              show.forEach(s => {
                //console.log( 'and then show element here: ', s)
               const date = s.date
               const headliner = s.headliner
               const support1 = s.support1
               const support2 = s.support2
               const support3 = s.support3
               const venue = s.venue
               const parties = s.parties
               for ( const partyId in parties ){
                  const load = parties[partyId].load ;
                  const depart = parties[partyId].depart;
                  const street = parties[partyId].street;
                  const locationName = parties[partyId].locationName;
                  const city = parties[partyId].city
                  const partyOrders = parties[partyId].orders
     
                  const convert24hStringToAmPmTime = (time24) => {
                    let amPmTime = ''
                    let hours = Number(time24.substring(0, time24.indexOf(':')))
                    let minutes = time24.substring(time24.indexOf(':') + 1, time24.length)

                    const amOrPm = hours < 12 ? 'AM' : 'PM'
                    hours = (hours % 12) || 12
                    hours = hours.toString()
                    amPmTime = `${hours}:${minutes} ${amOrPm}`
                    console.log('amPmTime ====> ', amPmTime)
                  }
                  
                  for (partyOrder in partyOrders) {
                    const emailBody = `${partyOrders[partyOrder].orderFirst}! Thank you for riding with Bus to Show!
                    This is a quick note to remind you about the upcoming bus trip  
                     to ${venue} on ${date} for ${headliner}${
                       + support1 ? ', ' + support1 : ''
                      + support2 ? ', ' + support2 : '' 
                      + support3 ? ', & ' + support3 : ''}.  
                    You currently have ${partyOrders[partyOrder].count == 1 ? partyOrders[partyOrder].count + ' spot' : partyOrders[partyOrder].count + ' spots'} reserved, which can be claimed at
                    check-in by yourself (${partyOrders[partyOrder].orderFirst} ${partyOrders[partyOrder].orderLast}) or anyone else you listed when you placed your order${
                      (partyOrders[partyOrder].reservations[0].willFirst != partyOrders[partyOrder].orderFirst || partyOrders[partyOrder].reservations[0].willLast != partyOrders[partyOrder].orderLast)   
                      ? ' (' + partyOrders[partyOrder].reservations[0].willFirst + ' ' + partyOrders[partyOrder].reservations[0].willLast
                      :''
                    }.  Also, here are the pickup details.... check-in location is ${locationName},
                    ${street} with ${load != depart ? 'check in and first bus loading at ' + convert24hStringToAmPmTime(load) +', and ': ''}last call for departure at ${convert24hStringToAmPmTime(depart)}.
                    Please show up at least 10-15 min before last call and bring a legal id for name and age verification (we're 18+ unless you have your parent/guardian email reservations@bustoshow.org with a photo id and permission note).  
                    Okay, I think that's everything.  Thanks again, we'll see you soon!  Love always, BTS.
                    `
                    
                    actuallySend(partyOrders[partyOrder].email, emailBody)
                    console.log('emailBody created ====>  ', date)
                  }
               }
              })
            }
            })
          }
          }
        })
      })
  }
  module.exports = {sendReminder}

