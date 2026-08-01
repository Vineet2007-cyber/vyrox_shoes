const Razorpay = require('razorpay');
const crypto = require('crypto');

/**
 * Initialize Razorpay Instance
 */
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_key_id';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_key_secret';
  
  return new Razorpay({
    key_id,
    key_secret
  });
};

/**
 * Create a new Razorpay payment order
 * @param {Object} options - { amount (in INR), currency, receipt, notes }
 * @returns {Promise<Object>} Razorpay order object
 */
const createRazorpayOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  try {
    const razorpay = getRazorpayInstance();
    
    // Amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes
    };

    const razorpayOrder = await razorpay.orders.create(options);
    return razorpayOrder;
  } catch (error) {
    throw new Error(`Razorpay Order Creation Failed: ${error.message}`);
  }
};

/**
 * Verify Razorpay payment signature
 * @param {Object} verificationData - { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @returns {boolean} True if signature is valid, false otherwise
 */
const verifyRazorpaySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  try {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return false;
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_key_secret';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === razorpay_signature;
  } catch (error) {
    return false;
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
  getRazorpayInstance
};
