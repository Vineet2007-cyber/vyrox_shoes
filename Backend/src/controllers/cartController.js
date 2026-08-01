const CartModel = require('../models/cartModel');
const CartItemModel = require('../models/cartItemModel');
const ProductModel = require('../models/productModel');

/**
 * @desc    View user cart
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = async (req, res, next) => {
  try {
    const cart = await CartModel.getCartWithItems(req.user.id);
    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart
 * @access  Private
 */
const addToCart = async (req, res, next) => {
  try {
    const { product_id, size, quantity = 1, size_id } = req.body;

    if (!product_id || !size) {
      res.status(400);
      throw new Error('Please provide product_id and size');
    }

    const product = await ProductModel.findById(product_id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const cart = await CartModel.findOrCreateByUserId(req.user.id);
    await CartItemModel.addItem({
      cart_id: cart.id,
      product_id,
      size_id: size_id || null,
      size,
      quantity: Number(quantity) > 0 ? Number(quantity) : 1
    });

    const updatedCart = await CartModel.getCartWithItems(req.user.id);

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: updatedCart
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/item/:id
 * @access  Private
 */
const updateCartItem = async (req, res, next) => {
  try {
    const itemId = req.params.id;
    const { quantity } = req.body;

    if (quantity === undefined || isNaN(quantity)) {
      res.status(400);
      throw new Error('Please provide a valid quantity');
    }

    const newQty = Number(quantity);
    const cart = await CartModel.findByUserId(req.user.id);
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    const cartItem = await CartItemModel.findById(itemId);
    if (!cartItem || cartItem.cart_id !== cart.id) {
      res.status(404);
      throw new Error('Cart item not found in your cart');
    }

    if (newQty <= 0) {
      await CartItemModel.removeItem(itemId);
    } else {
      await CartItemModel.updateQuantity(itemId, newQty);
    }

    const updatedCart = await CartModel.getCartWithItems(req.user.id);

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: updatedCart
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/item/:id
 * @access  Private
 */
const removeFromCart = async (req, res, next) => {
  try {
    const itemId = req.params.id;
    const cart = await CartModel.findByUserId(req.user.id);

    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    const cartItem = await CartItemModel.findById(itemId);
    if (!cartItem || cartItem.cart_id !== cart.id) {
      res.status(404);
      throw new Error('Cart item not found in your cart');
    }

    await CartItemModel.removeItem(itemId);
    const updatedCart = await CartModel.getCartWithItems(req.user.id);

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: updatedCart
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear all items from cart
 * @route   DELETE /api/cart/clear
 * @access  Private
 */
const clearCart = async (req, res, next) => {
  try {
    const cart = await CartModel.findByUserId(req.user.id);
    if (cart) {
      await CartItemModel.clearCart(cart.id);
    }
    const updatedCart = await CartModel.getCartWithItems(req.user.id);

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: updatedCart
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
