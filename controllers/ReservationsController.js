'use strict';

class ReservationsController {
  pickupPartiesData;
  reservationsData;

  constructor({pickupPartiesData, reservationsData}) {
    this.pickupPartiesData = pickupPartiesData;
    this.reservationsData = reservationsData;
  }

  async updateReservation({
    id,
    orderId,
    pickupPartiesId,
    willCallFirstName,
    willCallLastName,
    status,
    discountCodeId,
  }) {
    if (!id || !orderId || !pickupPartiesId || !willCallFirstName || !willCallLastName || !status) {
      return {
        status: 400,
        message: 'Invalid request',
      };
    }

    const reservation = await this.reservationsData.getReservation(id);

    if (!reservation) {
      return {
        status: 404,
        message: 'Reservation not found',
      };
    }

    const pickupParty = await this.pickupPartiesData.getPickupParty({id: pickupPartiesId});

    if (!pickupParty) {
      return {
        status: 404,
        message: 'Pickup party not found',
      };
    }

    if (pickupParty.reservations >= pickupParty.capacity) {
      return {
        status: 400,
        message: 'Pickup party is full',
      };
    }

    await this.reservationsData.updateReservation({
      id,
      orderId,
      pickupPartiesId,
      willCallFirstName,
      willCallLastName,
      status,
      discountCodeId,
    });

    return {
      status: 200,
      message: 'Reservation updated',
    };
  }
}

module.exports = ReservationsController;
