import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    // Seed mock users if they don't exist
    const mockEmails = ['admin@test.com', 'prod@test.com', 'qa@test.com', 'qc@test.com', 'deliv@test.com'];
    if (!user && mockEmails.includes(email)) {
      let roles = [], name;
      if (email === 'admin@test.com') { roles = ['admin']; name = 'Admin'; }
      else if (email === 'prod@test.com') { roles = ['production']; name = 'Prod User'; }
      else if (email === 'qa@test.com') { roles = ['qa']; name = 'QA User'; }
      else if (email === 'qc@test.com') { roles = ['qc']; name = 'QC User'; }
      else if (email === 'deliv@test.com') { roles = ['delivery']; name = 'Delivery User'; }
      user = await User.create({ name, email, password, roles });
    }

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        role: user.role, // Include legacy role field for backward compatibility
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get users by role
// @route   GET /api/auth/users
// @access  Public (should be Admin)
export const getUsers = async (req, res) => {
  try {
    const role = req.query.role;
    let query = {};
    if (role) {
      query.roles = { $in: [role] };
    }
    
    // Seed some mock users if none exist for the requested role (for testing purposes)
    const count = await User.countDocuments(query);
    if (count === 0) {
      if (role === 'production') {
        const mockProd = await User.create({ name: 'Prod User', email: 'prod@test.com', password: 'prod', roles: ['production'] });
        return res.json([mockProd]);
      } else if (role === 'qa') {
        const mockQA = await User.create({ name: 'QA User', email: 'qa@test.com', password: 'qa', roles: ['qa'] });
        return res.json([mockQA]);
      } else if (role === 'qc') {
        const mockQC = await User.create({ name: 'QC User', email: 'qc@test.com', password: 'qc', roles: ['qc'] });
        return res.json([mockQC]);
      } else if (role === 'delivery') {
        const mockDeliv = await User.create({ name: 'Delivery User', email: 'deliv@test.com', password: 'deliv', roles: ['delivery'] });
        return res.json([mockDeliv]);
      }
    }

    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Admin create user
// @route   POST /api/auth/users
// @access  Public (should be protected Admin)
export const createUser = async (req, res) => {
  const { name, email, password, roles } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      roles: roles && roles.length > 0 ? roles : ['production']
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Protected
export const updateProfile = async (req, res) => {
  const { name, email, oldPassword, newPassword } = req.body;

  try {
    // Requires a user in req.user from protect middleware
    if (!req.user) {
       return res.status(401).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.user._id);

    if (user) {
      // If they are trying to update password, verify old password first
      if (oldPassword && newPassword) {
        if (!(await user.matchPassword(oldPassword))) {
          return res.status(400).json({ message: 'Incorrect current password' });
        }
        user.password = newPassword;
      }

      user.name = name || user.name;
      user.email = email || user.email;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        roles: updatedUser.roles,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a user (by admin)
// @route   PUT /api/auth/users/:id
// @access  Public (should be Admin)
export const updateUser = async (req, res) => {
  const { name, email, password, roles } = req.body;

  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      if (roles) {
        user.roles = roles;
      }
      if (password) {
        user.password = password; // mongoose pre-save hook will hash it automatically
      }

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        roles: updatedUser.roles,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a user (by admin)
// @route   DELETE /api/auth/users/:id
// @access  Public (should be Admin)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ message: 'User removed successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
