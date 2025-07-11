'use strict';

class EventsController {
  eventsData;

  constructor({eventsData}) {
    this.eventsData = eventsData;
  }

  async getEvents({sort, sum, upcoming}) {
    const events = await this.eventsData.getEvents({
      sort: sort?.split(',') || [],
      sum: sum?.split(',') || [],
      upcoming: upcoming?.toLowerCase() === 'true',
    });

    return {status: 200, events};
  }

  async getEvent({id}) {
    const event = await this.eventsData.getEvent({id});

    if (!event) {
      return {status: 404, message: 'Not found'};
    }

    return {status: 200, ...event};
  }

  async createEvent({
    date,
    startTime,
    venue,
    headliner,
    support1,
    support2,
    support3,
    headlinerBio,
    headlinerImgLink,
    meetsCriteria,
    isDenied,
    external,
    doors_time,
  }) {
    const event = await this.eventsData.createEvent({
      date,
      startTime,
      venue,
      headliner,
      support1,
      support2,
      support3,
      headlinerBio,
      headlinerImgLink,
      meetsCriteria,
      isDenied,
      external,
      doors_time,
    });

    if (!event) {
      return {status: 500, message: 'Unable to create event'};
    }

    return {status: 200, ...event};
  }

  async updateEvent({
    id,
    date,
    startTime,
    venue,
    headliner,
    support1,
    support2,
    support3,
    headlinerBio,
    headlinerImgLink,
    meetsCriteria,
    isDenied,
    external,
    doors_time,
  }) {
    const event = await this.eventsData.updateEvent({
      id,
      date,
      startTime,
      venue,
      headliner,
      support1,
      support2,
      support3,
      headlinerBio,
      headlinerImgLink,
      meetsCriteria,
      isDenied,
      external,
      doors_time,
    });

    if (!event) {
      return {status: 500, message: 'Unable to update event'};
    }

    return {status: 200, ...event};
  }

  async deleteEvent({id}) {
    const event = await this.eventsData.deleteEvent({id});

    if (!event) {
      return {status: 500, message: 'Unable to delete event'};
    }

    return {status: 200, ...event};
  }
}

module.exports = EventsController;
