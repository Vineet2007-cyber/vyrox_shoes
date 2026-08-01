const { createRazorpayOrder, verifyRazorpaySignature } = require('../services/paymentService');
const PaymentModel = require('../models/paymentModel');
const OrderModel = require('../models/orderModel');

/**
 * @desc    Create Razorpay Order for Payment
 * @route   POST /api/payment/create
 * @access  Private
 */
const createPayment = async (req, res, next) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      res.status(400);
      throw new Error('Please provide an order_id');
    }

    const order = await OrderModel.findById(order_id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to pay for this order');
    }

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder({
      amount: order.total_amount,
      receipt: order.order_number,
      notes: { order_id: order.id, user_id: req.user.id }
    });

    // Record or update payment record in DB
    const existingPayment = await PaymentModel.findByOrderId(order.id);
    if (existingPayment) {
      await PaymentModel.updateByOrderId(order.id, {
        status: 'pending',
        transaction_id: razorpayOrder.id,
        paid_at: null
      });
    } else {
      await PaymentModel.create({
        order_id: order.id,
        user_id: req.user.id,
        payment_method: 'card',
        transaction_id: razorpayOrder.id,
        amount: order.total_amount,
        status: 'pending'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Razorpay payment order created successfully',
      data: {
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_key_id',
        order_id: order.id,
        order_number: order.order_number
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Razorpay Payment Signature
 * @route   POST /api/payment/verify
 * @access  Private
 */
const verifyPayment = async (req, res, next) => {
  try {
    const {
      order_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_method
    } = req.body;

    if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400);
      throw new Error('Please provide order_id, razorpay_order_id, razorpay_payment_id, and razorpay_signature');
    }

    const isValid = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!isValid) {
      await PaymentModel.updateByOrderId(order_id, {
        status: 'failed',
        transaction_id: razorpay_payment_id
      });
      res.status(400);
      throw new Error('Invalid payment signature. Payment verification failed.');
    }

    // Map method if provided
    let method = 'card';
    if (payment_method && ['card', 'upi', 'netbanking', 'cod'].includes(payment_method)) {
      method = payment_method;
    }

    // Update payment record to completed
    await PaymentModel.updateByOrderId(order_id, {
      status: 'completed',
      transaction_id: razorpay_payment_id,
      payment_method: method,
      paid_at: new Date()
    });

    // Update order status to processing
    await OrderModel.updateStatus(order_id, 'processing');

    const paymentRecord = await PaymentModel.findByOrderId(order_id);

    res.json({
      success: true,
      message: 'Payment verified and completed successfully',
      data: paymentRecord
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  verifyPayment
};
