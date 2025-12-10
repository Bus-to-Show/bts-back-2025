"use strict";

const knex = require("../knex.js");

const fields = [
  "id",
  "date",
  "startTime",
  "venue",
  "headliner",
  "support1",
  "support2",
  "support3",
  "headlinerImgLink",
  "headlinerBio",
  "meetsCriteria",
  "isDenied",
  "external",
  "doors_time",
];

function getEvents({ sum, startDate, endDate, sort }) {
  const queryBuilder = knex("events").select(fields);

  if (sum.includes("capacity")) {
    queryBuilder.select(
      knex.raw(`
        COALESCE(
          (
            SELECT sum(pickup_parties.capacity)
            FROM pickup_parties
            WHERE pickup_parties."eventId" = events.id
          ),
          0::bigint
        ) AS capacity
      `)
    );
  }

  if (sum.includes("reservations")) {
    queryBuilder.select(
      knex.raw(`
        COALESCE(
          (
            SELECT count(reservations.id)
            FROM reservations
            JOIN pickup_parties ON pickup_parties.id = reservations."pickupPartiesId"
            WHERE events.id = pickup_parties."eventId" AND reservations.status IN (1, 2)
          ) + (
            SELECT SUM(pickup_parties."inCart")
            FROM pickup_parties
            WHERE pickup_parties."eventId" = events.id
          ),
          0::bigint
        ) AS reservations
      `)
    );
  }

  if (startDate) {
    queryBuilder.whereRaw("date::date >= ?", startDate);
  }

  if (endDate) {
    queryBuilder.whereRaw("date::date <= ?", endDate);
  }

  if (sort.includes("date")) {
    queryBuilder.orderByRaw("date::date").orderBy("startTime", "asc");
  }

  return queryBuilder;
}

function getEvent({ id }) {
  return knex("events").select(fields).where("id", id).first();
}

async function createEvent({
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
  const result = await knex("events")
    .insert({
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
    })
    .returning(fields);

  return result[0];
}

async function updateEvent({
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
  const result = await knex("events")
    .where("id", id)
    .update({
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
    })
    .returning(fields);

  return result[0];
}

async function deleteEvent({ id }) {
  const result = await knex("events").where("id", id).del().returning(fields);

  return result[0];
}

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
};
