require('dotenv').load();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cron = require('node-cron')
var cors = require('cors');
var helmet = require('helmet')

var discountCodesEventsRouter = require('./routes/discount_codes_events')
var discountCodesRouter = require('./routes/discount_codes');
var eventsRouter = require('./routes/events');
var eventsDashRouter = require('./routes/events-dash');
var ordersRouter = require('./routes/orders');
var pickupLocationsRouter = require('./routes/pickup_locations');
var pickupPartiesRouter = require('./routes/pickup_parties');
var purchasesRouter = require('./routes/purchases');
var productsRouter =  require('./routes/products');
var managePartiesRouter = require('./routes/manage-parties');
var manageReservationsRouter = require('./routes/manage-reservations');

var eventDataHandler = require('./eventDataHandler');
var reminderEmails = require('./reminderEmails')
var reservationsRouter = require('./routes/reservations');
var usersRouter = require('./routes/users')
var apiRouter = require('./routes/api').router

var app = express();
app.use(helmet())

if (process.env.NODE_ENV == 'production') {
  var whitelist = process.env.ORIGIN_URL.split(' ');

  var corsOptions = {
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept',
    credentials: true,
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  };

  app.use(cors(corsOptions));
}

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRouter)
app.use('/users', usersRouter);
app.use(`/discount_codes_events`, discountCodesEventsRouter);
app.use(`/discount_codes`, discountCodesRouter);
app.use(`/events`, eventsRouter);
app.use(`/events-dash`, eventsDashRouter);
app.use(`/orders`, ordersRouter);
app.use(`/pickup_locations`, pickupLocationsRouter);
app.use(`/pickup_parties`, pickupPartiesRouter);
app.use(`/manage-parties`, managePartiesRouter)
app.use(`/manage-reservations`, manageReservationsRouter)
app.use(`/reservations`, reservationsRouter);
app.use('/products', productsRouter);
app.use('/purchases', purchasesRouter);

app.use(function(req, res) {
  console.log('next all the way to the end without finding anything req =====>', req.path)
  res.status(404).send('Not Found!');
});

apiDataFunction = async () => {
  const allShowsObj = await eventDataHandler.getTicketMasterData()
  eventDataHandler.insertEventData(allShowsObj)
  console.log('tmData.length ==>>==>> ', allShowsObj.length);
}

// let time = new Date()


cron.schedule('0 4 * * *', () => {
  if (process.env.NODE_ENV == 'production'){
  console.log('Running apiDataFunction cron!');
  apiDataFunction()
  }
}, {
  scheduled: true,
  timezone: "America/Denver"
});
cron.schedule('*/5 * * * *', () => {
  if (process.env.NODE_ENV == 'production'){
    eventDataHandler.sweepInCarts()
  }
})

cron.schedule('15 17 * * *', () => {
  if (process.env.NODE_ENV == 'production'){
    console.log('reminder email cron! ')
    reminderEmails.sendReminder()
  }
})

module.exports = app;

