import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { SuperAdmin } from '../models/SuperAdmin.js';

export const verifySuperAdmin = async (req, res, next) => {
    try {
        const cookies = cookie.parse(req.headers.cookie || '');
        const token = cookies?.superAdminToken;
    
        if (!token) {
          return res.status(403).json({ message: 'No token provided' });
        }
    
        const decoded = await jwt.verify(token, 'secretkey');
        
        req.user = await SuperAdmin.findById(decoded._id);
        if(!req.user)
        {
            next(new Error("user not found"));
        }
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};