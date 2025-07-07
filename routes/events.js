'use strict';

const express = require('express');
const router = express.Router();

const EventsController = require('../controllers/EventsController.js');
const eventsData = require('../data/events.js');
const controller = new EventsController({eventsData});

// List
router.get('/', async (req, res) => {
  try {
    const {status, events} = await controller.getEvents(req.query);
    return res.status(status).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'An unknown error occurred.'});
  }
});

// Read
router.get('/:id', async (req, res) => {
  try {
    const {status, ...rest} = await controller.getEvent(req.params);
    return res.status(status).json(rest);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'An unknown error occurred.'});
  }
});

// Create
router.post('/', async (req, res) => {
  try {
    const {status, ...rest} = await controller.createEvent(req.body);
    return res.status(status).json(rest);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'An unknown error occurred.'});
  }
});

// Update
router.patch('/:id', async (req, res) => {
  try {
    const {status, ...rest} = await controller.updateEvent({id: req.params.id, ...req.body});
    return res.status(status).json(rest);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'An unknown error occurred.'});
  }
});

// Delete
// router.delete('/:id', async (req, res) => {
//   try {
//     const {status, ...rest} = await controller.deleteEvent(req.params);
//     return res.status(status).json(rest);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({message: 'An unknown error occurred.'});
//   }
// });

module.exports = router;
