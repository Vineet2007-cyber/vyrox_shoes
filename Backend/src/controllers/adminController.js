const ProductModel = require('../models/productModel');
const ProductSizeModel = require('../models/productSizeModel');
const OrderModel = require('../models/orderModel');

/**
 * Helper to generate URL slug from name
 */
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-');
};

// ==========================================
// 1. PRODUCT MANAGEMENT CONTROLLERS
// ==========================================

/**
 * @desc    Add a new product
 * @route   POST /api/admin/products
 * @access  Private (Admin)
 */
const addProduct = async (req, res, next) => {
  try {
    const {
      category_id,
      name,
      slug,
      brand = 'Vyrox',
      price,
      discount_price = null,
      description,
      image_url,
      is_featured = false,
      sizes
    } = req.body;

    if (!name || price === undefined || !category_id) {
      res.status(400);
      throw new Error('Please provide name, price, and category_id');
    }

    const productSlug = slug ? createSlug(slug) : createSlug(name);

    const productId = await ProductModel.create({
      category_id,
      name,
      slug: productSlug,
      brand,
      price: Number(price),
      discount_price: discount_price ? Number(discount_price) : null,
      description,
      image_url,
      is_featured: Boolean(is_featured)
    });

    // Add initial sizes if provided
    if (sizes && Array.isArray(sizes)) {
      for (const sizeObj of sizes) {
        if (sizeObj.size) {
          await ProductSizeModel.create({
            product_id: productId,
            size: sizeObj.size,
            stock: Number(sizeObj.stock || 0)
          });
        }
      }
    }

    const createdProduct = await ProductModel.findById(productId);

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      data: createdProduct
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing product
 * @route   PUT /api/admin/products/:id
 * @access  Private (Admin)
 */
const updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const existingProduct = await ProductModel.findById(productId);

    if (!existingProduct) {
      res.status(404);
      throw new Error('Product not found');
    }

    const {
      category_id,
      name,
      slug,
      brand,
      price,
      discount_price,
      description,
      image_url,
      is_featured,
      sizes
    } = req.body;

    const productSlug = slug ? createSlug(slug) : (name ? createSlug(name) : existingProduct.slug);

    await ProductModel.update(productId, {
      category_id: category_id || existingProduct.category_id,
      name: name || existingProduct.name,
      slug: productSlug,
      brand: brand || existingProduct.brand,
      price: price !== undefined ? Number(price) : existingProduct.price,
      discount_price: discount_price !== undefined ? (discount_price ? Number(discount_price) : null) : existingProduct.discount_price,
      description: description !== undefined ? description : existingProduct.description,
      image_url: image_url !== undefined ? image_url : existingProduct.image_url,
      is_featured: is_featured !== undefined ? Boolean(is_featured) : existingProduct.is_featured
    });

    // Update sizes if provided
    if (sizes && Array.isArray(sizes)) {
      for (const sizeObj of sizes) {
        if (sizeObj.size) {
          await ProductSizeModel.upsertSize({
            product_id: productId,
            size: sizeObj.size,
            stock: Number(sizeObj.stock || 0)
          });
        }
      }
    }

    const updatedProduct = await ProductModel.findById(productId);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/admin/products/:id
 * @access  Private (Admin)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await ProductModel.findById(productId);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    await ProductModel.delete(productId);

    res.json({
      success: true,
      message: `Product '${product.name}' (ID: ${productId}) deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. INVENTORY & PRODUCT SIZES CONTROLLERS
// ==========================================

/**
 * @desc    Update stock level for a product size
 * @route   PUT /api/admin/inventory/stock
 * @access  Private (Admin)
 */
const updateStock = async (req, res, next) => {
  try {
    const { size_id, product_id, size, stock } = req.body;

    if (stock === undefined || isNaN(stock)) {
      res.status(400);
      throw new Error('Please provide a valid stock number');
    }

    let updatedSizeId;

    if (size_id) {
      const existingSize = await ProductSizeModel.findById(size_id);
      if (!existingSize) {
        res.status(404);
        throw new Error('Product size record not found');
      }
      await ProductSizeModel.updateStock(size_id, Number(stock));
      updatedSizeId = size_id;
    } else if (product_id && size) {
      updatedSizeId = await ProductSizeModel.upsertSize({
        product_id,
        size,
        stock: Number(stock)
      });
    } else {
      res.status(400);
      throw new Error('Please provide either size_id or both product_id and size');
    }

    const sizeRecord = await ProductSizeModel.findById(updatedSizeId);

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: sizeRecord
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get product sizes
 * @route   GET /api/admin/products/:id/sizes
 * @access  Private (Admin)
 */
const getProductSizes = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const sizes = await ProductSizeModel.getByProductId(productId);

    res.json({
      success: true,
      count: sizes.length,
      data: sizes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add or Update product size
 * @route   POST /api/admin/products/:id/sizes
 * @access  Private (Admin)
 */
const addOrUpdateProductSize = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { size, stock = 0 } = req.body;

    if (!size) {
      res.status(400);
      throw new Error('Please provide size name');
    }

    await ProductSizeModel.upsertSize({
      product_id: productId,
      size,
      stock: Number(stock)
    });

    const sizes = await ProductSizeModel.getByProductId(productId);

    res.json({
      success: true,
      message: 'Product size added/updated successfully',
      data: sizes
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. ORDER MANAGEMENT CONTROLLERS
// ==========================================

/**
 * @desc    View all orders across platform
 * @route   GET /api/admin/orders
 * @access  Private (Admin)
 */
const adminViewOrders = async (req, res, next) => {
  try {
    const orders = await OrderModel.getAllOrders();

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
 * @desc    Update order status
 * @route   PUT /api/admin/orders/:id/status
 * @access  Private (Admin)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400);
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    await OrderModel.updateStatus(orderId, status);
    const updatedOrder = await OrderModel.getOrderDetails(orderId);

    res.json({
      success: true,
      message: `Order status updated to '${status}'`,
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getProductSizes,
  addOrUpdateProductSize,
  adminViewOrders,
  updateOrderStatus
};
