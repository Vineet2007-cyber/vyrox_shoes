const OrderModel = require('../models/orderModel');
const OrderItemModel = require('../models/orderItemModel');
const CartModel = require('../models/cartModel');
const CartItemModel = require('../models/cartItemModel');

/**
 * Helper to generate a unique order number (e.g. VX-1712345678901-8492)
 */
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `VX-${timestamp}-${random}`;
};

/**
 * @desc    Place a new order (from cart or body items)
 * @route   POST /api/orders
 * @access  Private
 */
const placeOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { shipping_address, shipping_fee = 0, tax = 0, items: bodyItems } = req.body;

    if (!shipping_address) {
      res.status(400);
      throw new Error('Please provide a shipping address');
    }

    let orderItemsToProcess = [];
    let cartToClear = null;

    if (bodyItems && Array.isArray(bodyItems) && bodyItems.length > 0) {
      // Use items provided in request body
      orderItemsToProcess = bodyItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name || item.name || 'Product',
        size: item.size || 'Standard',
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        total_price: Number(item.price || 0) * Number(item.quantity || 1)
      }));
    } else {
      // Use user's current shopping cart
      const cartData = await CartModel.getCartWithItems(userId);
      if (!cartData.items || cartData.items.length === 0) {
        res.status(400);
        throw new Error('Your cart is empty. Cannot place an empty order.');
      }
      cartToClear = cartData.cart_id;
      orderItemsToProcess = cartData.items.map(item => {
        const itemPrice = item.discount_price !== null && item.discount_price !== undefined
          ? Number(item.discount_price)
          : Number(item.price);
        return {
          product_id: item.product_id,
          product_name: item.product_name,
          size: item.size,
          price: itemPrice,
          quantity: item.quantity,
          total_price: itemPrice * item.quantity
        };
      });
    }

    // Calculate financials
    const subtotal = orderItemsToProcess.reduce((sum, item) => sum + item.total_price, 0);
    const shipFee = Number(shipping_fee);
    const taxFee = Number(tax);
    const total_amount = subtotal + shipFee + taxFee;

    // Generate unique order number
    const order_number = generateOrderNumber();

    // Create order record
    const orderId = await OrderModel.create({
      user_id: userId,
      order_number,
      subtotal,
      shipping_fee: shipFee,
      tax: taxFee,
      total_amount,
      shipping_address,
      status: 'pending'
    });

    // Create order items
    const orderItemsData = orderItemsToProcess.map(item => ({
      order_id: orderId,
      ...item
    }));
    await OrderItemModel.createMany(orderItemsData);

    // Clear cart if ordered from cart
    if (cartToClear) {
      await CartItemModel.clearCart(cartToClear);
    }

    // Fetch full order details
    const orderDetails = await OrderModel.getOrderDetails(orderId);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: orderDetails
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    View all orders for logged-in user
 * @route   GET /api/orders
 * @access  Private
 */
const viewOrders = async (req, res, next) => {
  try {
    const orders = await OrderModel.getByUserId(req.user.id);
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    View single order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const viewSingleOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await OrderModel.getOrderDetails(id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Ensure user owns this order or is an admin
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to view this order');
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  placeOrder,
  viewOrders,
  viewSingleOrder
};
