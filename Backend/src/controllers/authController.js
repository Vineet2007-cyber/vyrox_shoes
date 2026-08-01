const UserModel = require('../models/userModel');
const CartModel = require('../models/cartModel');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    // Check if user already exists
    const userExists = await UserModel.findByEmail(email);
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email address');
    }

    // Create user in database (password is hashed inside UserModel via bcrypt)
    const userId = await UserModel.create({
      name,
      email,
      password,
      phone: phone || null,
      role: role || 'user'
    });

    // Automatically create a shopping cart for the registered user
    await CartModel.findOrCreateByUserId(userId);

    const user = await UserModel.findById(userId);

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user.id)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get JWT token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // Check for user by email
    const user = await UserModel.findByEmail(email);

    if (user && (await UserModel.matchPassword(password, user.password))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user.id)
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/profile
 * @access  Private (Protected route via JWT verification middleware)
 */
const getUserProfile = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (user) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      });
    } else {
      res.status(404);
      throw new Error('User profile not found');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private (Protected route via JWT verification middleware)
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updatedUser = await UserModel.updateProfile(req.user.id, { name, phone });

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      updated_at: updatedUser.updated_at
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
};
