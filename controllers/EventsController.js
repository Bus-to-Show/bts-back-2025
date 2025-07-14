'use strict';

class EventsController {
  eventsData;

  constructor({eventsData}) {
    this.eventsData = eventsData;
  }

  async getEvents({sum, startDate, endDate, sort}) {
    const events = await this.eventsData.getEvents({
      sum: sum?.split(',') || [],
      startDate: EventsController.parseDate(startDate),
      endDate: EventsController.parseDate(endDate),
      sort: sort?.split(',') || [],
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

  static parseDate(string) {
    const date = new Date(string);
    return date.getTime() > 0 ? date : undefined;
  }
}

module.exports = EventsController;
