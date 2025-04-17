'use strict';

class DiscountCodesController {
  data;

  constructor({data}) {
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

    if (discountCodeObj.type === 1) {
      const discountCodeEventObj = await this.data.getDiscountCodeEvent(discountCodeObj.id, eventId);

      if (!discountCodeEventObj) {
        return {
          status: 400,
          message: 'Discount code not found for this event',
        };
      }

      if (discountCodeEventObj.timesUsedThisEvent > 0) {
        return {
          status: 200,
          message: 'Discount code has already been used for this event',
        };
      }

      await this.data.useDiscountCodeEvent(discountCodeObj.id, eventId, 1);

      const pricePerTicket = totalPrice / ticketQuantity;
      const totalSavings = this.formatCurrency(pricePerTicket);
      const totalPriceAfterDiscount = this.formatCurrency(totalPrice - totalSavings);

      return {
        status: 200,
        discountCodeId: discountCodeObj.id,
        totalSavings,
        totalPriceAfterDiscount,
      };
    }

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
