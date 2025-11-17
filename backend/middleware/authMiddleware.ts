import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Add user property to Express Request interface
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                name: string;
                marks: number;
            };
        }
    }
}

export const protect = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token;

        // Check for token in Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
            return;
        }

        console.log("\nReceived token:", token);
        console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key') as {
                id: string;
                iat?: number;
                exp?: number;
            };

            console.log("\nDecoded token:", decoded);

            // Verify token corresponds to a user id and attach user info
            const user = await User.findById(decoded.id).lean();
            if (!user) {
                console.log("User not found with ID:", decoded.id);
                res.status(401).json({ success: false, message: 'User not found' });
                return;
            }

            req.user = {
                id: String(user._id),
                name: user.name,
                marks: user.marks || 0,
            };

            next();
        } catch (jwtError) {
            console.log("JWT Verification Error:", jwtError);
            res.status(401).json({
                success: false,
                message: 'Not authorized, token failed',
                error: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error'
            });
            return;
        }
    } catch (error) {
        console.log("General Auth Error:", error);
        res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};