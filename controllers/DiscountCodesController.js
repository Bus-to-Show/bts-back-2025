'use strict';

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
    if (!discountCodeEventObj) {
      await this.data.addDiscountCodeEvent(discountCodeObj.id, eventId, timesUsedThisOrder, discountCodeObj.usesPerEvent);
    }
    else {
      await this.data.useDiscountCodeEvent(discountCodeObj.id, eventId, timesUsedThisOrder, discountCodeObj.usesPerEvent);
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
