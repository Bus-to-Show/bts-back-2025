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

    const discountCodeObj = await this.data.getDiscountCode(discountCode);

    if (!discountCodeObj) {
      return {
        status: 400,
        message: 'Discount code not found',
      };
    }

    if (Date.parse(discountCodeObj.expiresOn) < Date.now()) {
      return {
        status: 200,
        message: 'Discount code expired',
      };
    }

    // Type 1 is for Sponsor pick-up location reusable discount codes
    if (discountCodeObj.type === 1) {
      const discountCodeEventObj = await this.data.getDiscountCodeEvent(discountCodeObj.id, eventId);

      if (discountCodeEventObj && discountCodeEventObj.timesUsedThisEvent >= discountCodeObj.usesPerEvent) {
        return {
          status: 200,
          message: 'Discount code has already been used up for this event',
        };
      }

      const currentRemainingUses = discountCodeObj.usesPerEvent - (discountCodeEventObj ? discountCodeEventObj.timesUsedThisEvent : 0);
      const timesUsedThisOrder = Math.min(currentRemainingUses, ticketQuantity);

      if (!discountCodeEventObj) {
        await this.data.createDiscountCodeEvent(discountCodeObj.id, eventId, timesUsedThisOrder);
      }
      else {
        await this.data.useDiscountCodeEvent(discountCodeObj.id, eventId, timesUsedThisOrder);
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

    // Type 2 is for one-time use discount codes
    if (discountCodeObj.remainingUses < 1) {
      return {
        status: 200,
        message: 'Discount code has no uses remaining',
      };
    }

    const timesUsedThisOrder = Math.min(discountCodeObj.remainingUses, ticketQuantity);
    const remainingUses = discountCodeObj.remainingUses - timesUsedThisOrder;
    const timesUsed = discountCodeObj.timesUsed + timesUsedThisOrder;

    await this.data.useDiscountCode(discountCode, remainingUses, timesUsed);

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

    await this.data.releaseDiscountCode(discountCode, eventId);
    return {
      status: 200,
      message: 'Discount code released',
    };
    // do I need to add releasing the discount code event too?
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
