'use strict';

class OrdersController {
  ordersData;
  reservationsData;

  constructor({ordersData, reservationsData}) {
    this.ordersData = ordersData;
    this.reservationsData = reservationsData;
  }

  async updateOrder({id, willCallFirstName, willCallLastName}) {
    if (!id || !willCallFirstName || !willCallLastName) {
      return {
        status: 400,
        message: 'Invalid request',
      };
    }

    const order = await this.ordersData.getOrder({id});

    if (!order) {
      return {
        status: 404,
        message: 'Order not found',
      };
    }

    await this.reservationsData.updateReservations({
      orderId: id,
      willCallFirstName,
      willCallLastName,
    });

    return {
      status: 200,
      message: 'Order updated',
    };
  }
}

module.exports = OrdersController;
