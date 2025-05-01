'use strict';

const reservations = require('../data/reservations.js');

class DiscountCodesController {
  data;

  constructor({ data }) {
    this.data = data;
  }

  async applyDiscountCode({
    discountCode,
    totalPrice,
    ticketQuantity,
    eventId,
  }) {
    if (!discountCode || !totalPrice || !ticketQuantity || !eventId) {
      return {
        status: 400,
        message: 'Invalid request',
      };
    }

    // both tables will be referenced for each discount code type
    const discountCodeObj = await this.data.getDiscountCode(discountCode);
    if (!discountCodeObj) {
      return {
        status: 400,
        message: 'Discount code not found',
      };
    }
    const discountCodeEventObj = await this.data.getDiscountCodeEvent(discountCodeObj.id, eventId);

    if (Date.parse(discountCodeObj.expiresOn) < Date.now()) {
      return {
        status: 200,
        message: 'Discount code expired',
      };
    }

    // Type 1 is for Sponsor pick-up location reusable discount codes (x times per event)
    if (discountCodeObj.type === 1 && discountCodeEventObj && discountCodeEventObj.timesUsedThisEvent >= discountCodeObj.usesPerEvent) {
      return {
        status: 200,
        message: 'Discount code has already been used up for this event',
      };
    }

    // Type 2 is for one-time single-use discount codes
    if (discountCodeObj.type === 2 && discountCodeObj.remainingUses < 1) {
      return {
        status: 200,
        message: 'Discount code has no uses remaining',
      };
    }

    const currentRemainingUses = discountCodeObj.usesPerEvent - (discountCodeEventObj ? discountCodeEventObj.timesUsedThisEvent : 0);
    const timesUsedThisOrder = discountCodeObj.type === 2 ? Math.min(discountCodeObj.remainingUses, ticketQuantity) : Math.min(currentRemainingUses, ticketQuantity);
    // remaining uses stays 0 for reusable type 1 codes
    const newRemainingUses = discountCodeObj.type === 2 ? discountCodeObj.remainingUses - timesUsedThisOrder : 0;
    const timesUsedSum = discountCodeObj.timesUsed + timesUsedThisOrder;

    // Update the discount code row with the new times used total and remaining uses
    await this.data.useDiscountCode(discountCode, newRemainingUses, timesUsedSum);
    
    // NOTE: new context!!! 
    // `usesPerEvent` in the DC_EVENTS table will now indicate initial `remainingUses` for type 1 discount codes and `usesPerEvent` for type 2 discount codes
    const eventsTableUsesPerEvent = discountCodeObj.type === 2 ? discountCodeObj.usesPerEvent : discountCodeObj.remainingUses;
    if (!discountCodeEventObj) {
      await this.data.addDiscountCodeEvent(discountCodeObj.id, eventId, timesUsedThisOrder, eventsTableUsesPerEvent);
    }
    else {
      await this.data.useDiscountCodeEvent(discountCodeObj.id, eventId, timesUsedThisOrder, eventsTableUsesPerEvent);
    }

    const pricePerTicket = totalPrice / ticketQuantity;
    const savingsPerTicket = pricePerTicket * (discountCodeObj.percentage / 100);
    const totalSavings = this.formatCurrency(savingsPerTicket * timesUsedThisOrder);
    const totalPriceAfterDiscount = this.formatCurrency(totalPrice - totalSavings);

    return {
      status: 200,
      discountCodeId: discountCodeObj.id,
      totalSavings,
      totalPriceAfterDiscount,
    };
  }

  async releaseDiscountCode({
    discountCode,
    eventId,
  }) {
    if (!discountCode || !eventId) {
      return {
        status: 400,
        message: 'Invalid request',
      };
    }

    const discountCodeObj = await this.data.getDiscountCode(discountCode);
    const discountCodeEventObj = await this.data.getDiscountCodeEvent(discountCodeObj.id, eventId);

    if (!discountCodeObj && !discountCodeEventObj) {
      return {
        status: 400,
        message: 'Discount code not found',
      };
    }

    // add check to make sure discount code has not already been used in a purchased & confirmed reservation...
      // NOTE: if a discount code has been applied but not yet used in a reservation, it will appear in the discount_codes_events table but not in the reservations table (for a specific event for type 1 codes)

    // for type 2 (single-use) discount codes, if the discount code has been used in more reservations than remainingUses would allow then do NOT release it
      // EXCEPTION: count of reservation MAY be <= remainingUses, in which case, release difference of remainingUses - countReservationsUsed
    if (discountCodeObj.type === 2) {
      const reservationsUsedThisDiscountCode = await reservations.getReservationsByDiscountCodeId(discountCodeObj.id);
      if (reservationsUsedThisDiscountCode.length >= discountCodeEventObj.timesUsedThisEvent) {
        return {
          status: 200,
          message: 'Discount code has already been depleted',
        };
      }
    }

    // for type 1 (reusable) discount codes, if the count of discounted reservations per/for a given event ID > usesPerEvent, then do NOT release it
        // NOTE: eventId can be cross-correlated through pickup_parties table... ugh
      // EXCEPTION: count of reservation MAY be less than `usesPerEvent`, in which case, release difference or usesPerEvent - countReservationsUsed
    // the logic then becomes:
      // if reservationsUsedThisDiscountCodeThisEvent >= usesPerEvent, then do NOT release it
    if (discountCodeObj.type === 1) {
      const reservationsByDiscountAndEvent = await reservations.getReservationsByDiscountByEventThroughPickupParties(discountCodeObj.id, eventId);
      if (reservationsByDiscountAndEvent.rowCount >= discountCodeObj.usesPerEvent) {
        return {
          status: 200,
          message: 'Discount code has already been depleted',
        };
      }
      // if the count of reservations is less than usesPerEvent, then release the difference
      //    which is discountCodeObj.usesPerEvent - reservationsByDiscountAndEvent.length ?? 
      //   or discountCodeEventObj.timesUsedThisEvent - reservationsByDiscountAndEvent.length ??
      const discountsToRelease = discountCodeEventObj.timesUsedThisEvent - reservationsByDiscountAndEvent.rowCount;
      const decrementedTimesUsed = discountCodeObj.timesUsed - discountCodeEventObj.timesUsedThisEvent;
      await this.data.releaseDiscountCode(discountCode, 0, decrementedTimesUsed);
      await this.data.releaseDiscountCodeEvent(discountCodeObj.id, eventId, discountsToRelease);
      return {
        status: 200,
        message: 'Discount code released',
      };
    }

    // renewedRemainingUses is only relevant for type 2 discount codes and should be 0 for type 1
    const renewedRemainingUses = discountCodeObj.type === 2 ? discountCodeObj.remainingUses + discountCodeEventObj.timesUsedThisEvent : 0;
    const decrementedTimesUsed = discountCodeObj.timesUsed - discountCodeEventObj.timesUsedThisEvent;
    await this.data.releaseDiscountCode(discountCode, renewedRemainingUses, decrementedTimesUsed);
    await this.data.releaseDiscountCodeEvent(discountCodeObj.id, eventId);

    return {
      status: 200,
      message: 'Discount code released',
    };
  }

  formatCurrency(amount) {
    // e.g. 0 -> '0.00', 1.005 => '1.01'
    return amount.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  }
}

module.exports = DiscountCodesController;
