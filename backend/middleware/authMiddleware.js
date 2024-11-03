import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { Staff } from '../models/Staff.js';

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

const PERMISSIONS = {
  admin: ['read:all', 'write:all', 'delete:all'],
  doctor: ['read:patients', 'write:patients', 'read:prescriptions', 'write:prescriptions'],
  nurse: ['read:patients', 'write:patients', 'read:prescriptions'],
  receptionist: ['read:patients', 'write:patients'],
  pharmacist: ['read:inventory',"write:inventory","read:prescription"]
};

// Middleware to verify JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies?.jwtaccesstoken;

    if (!token) {
      return res.status(403).json({ message: 'No token provided' });
    }

    const decoded = await jwt.verify(token, 'secretkey');
    
    req.user = await Staff.findById(decoded._id);
    if(!req.user)
    {
        next(new Error("user not found"));
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// Middleware to check user role and permissions
export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = await Staff.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userRoles = new Set();
      user.roles.forEach((role) => {
        PERMISSIONS[role]?.forEach((permission) => {
          userRoles.add(permission);
        });
      });

      const userPermissions = Array.from(userRoles);

      if (userPermissions.includes(requiredPermission) || userPermissions.includes('write:all')) {
        next();
      } else {
        res.status(403).json({ message: 'Access denied' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error checking permissions', error: error.message });
    }
  };
};

// Helper function to generate JWT token
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, SECRET_KEY, { expiresIn: '1d' });
};