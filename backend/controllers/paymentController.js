const crypto = require("crypto");
const { Cashfree, CFEnvironment } = require("cashfree-pg");
require('dotenv').config();

const Users = require("../models/Users");
const Orders = require("../models/Orders");

const cashfree = new Cashfree(
  CFEnvironment.SANDBOX,
  process.env.CASHFREE_CLIENT_ID,
  process.env.CASHFREE_sECRET_KEY
);

const createOrder = async (req, res) => {
  let localOrder;

  try {
    const user = await Users.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isPremium) {
      return res.status(400).json({
        message: "You are already a premium member",
      });
    }

    const orderId = `premium_${user.id}_${crypto.randomUUID()}`;
    const amount = 199;

    // Create the local order first.
    localOrder = await Orders.create({
      orderId,
      amount,
      status: "PENDING",
      UserId: user.id,
    });

    const request = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: String(user.id),
        customer_name: user.name || "Customer",
        customer_email: user.email,
        customer_phone: "9999999999",
      },
      order_meta: {
         return_url: `${process.env.FRONTEND_URL}/payment-status.html?order_id=${encodeURIComponent(orderId)}`
      },
      order_note: "Expense Tracker Premium Membership",
    };

    const response = await cashfree.PGCreateOrder(request);
    console.log("response: ".response)
    return res.status(201).json({
      orderId,
      paymentSessionId: response.data.payment_session_id,
    });
  } catch (error) {
    console.error(
      "Cashfree order creation failed:",
      error.response?.data || error.message
    );

    if (localOrder) {
      await localOrder.update({ status: "FAILED" }).catch(console.error);
    }

    return res.status(500).json({
      message: "Could not create payment order",
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const orderId = req.query.order_id;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required"
      });
    }

    const order = await Orders.findOne({
      where: {
        orderId,
        UserId: req.user.id,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (order.status === "SUCCESSFUL") {
      return res.json({
        status: "SUCCESSFUL",
        message: "Transaction successful",
      });
    }

    // Fetch order details using Cashfree SDK
    const cashfreeResponse = await cashfree.PGFetchOrder(orderId);
    const cashfreeOrder = cashfreeResponse.data;

    if (cashfreeOrder.order_status === "PAID") {
      const user = await Users.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      await order.update({ status: "SUCCESSFUL" });
      await user.update({ isPremium: true });

      return res.json({
        status: "SUCCESSFUL",
        message: "Transaction successful",
      });
    }

    // Do not mark an order failed while payment may still be processing.
    if (
      ["ACTIVE", "PENDING"].includes(cashfreeOrder.order_status)
    ) {
      return res.json({
        status: "PENDING",
        message: "Payment is still being processed",
      });
    }

    if (cashfreeOrder.order_status === "EXPIRED") {
      await order.update({ status: "FAILED" });

      return res.json({
        status: "FAILED",
        message: "TRANSACTION FAILED",
      });
    }

    return res.json({
      status: "PENDING",
      message: "Payment status is not available yet",
    });

  } catch (error) {
    console.error(
      "Payment verification failed:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Unable to verify payment. Please try again.",
    });
  }
};

module.exports = {
    createOrder,
    verifyPayment
}