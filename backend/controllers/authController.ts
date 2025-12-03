import type { Request, Response } from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, studentId, email } = req.body;

        if (!name || !studentId || !email) {
            res.status(400).json({ success: false, message: 'Name, studentId and email are required' });
            return;
        }

        
        const existingByStudent = await User.findOne({ studentId });
        if (existingByStudent) {
            res.status(409).json({ success: false, message: 'Student ID already registered' });
            return;
        }

        
        const existingByEmail = await User.findOne({ email });
        if (existingByEmail) {
            res.status(409).json({ success: false, message: 'Email already registered' });
            return;
        }

        
        const user = await User.create({ name, studentId, email, authProvider: 'local' });

        const token = jwt.sign({ id: user._id, studentId: user.studentId }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                authToken: token,
                number: null
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
}

export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                name: req.user?.name,
                marks: req.user?.marks,
                authToken: req.headers.authorization?.split(' ')[1] 
            }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const linkGoogleAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, googleId, name } = req.body;

        if (!email || !googleId) {
            res.status(400).json({ success: false, message: 'email and googleId are required' });
            return;
        }

        
        const user = await User.findOne({ email });
        if (!user) {
            
            res.status(404).json({ success: false, message: 'No registered user with that email' });
            return;
        }

        
        if (user.googleId && user.googleId !== googleId) {
            res.status(409).json({ success: false, message: 'Google account already linked to another user' });
            return;
        }

        
        user.googleId = googleId;
        user.authProvider = 'google';
        if (name && !user.name) user.name = name;
        await user.save();

        
        const token = jwt.sign(
            { id: user._id, studentId: user.studentId, email: user.email, name: user.name },
            process.env.JWT_SECRET || 'dev-secret',
            { expiresIn: '7d' }
        );

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            maxAge: 7 * 24 * 60 * 60 * 1000 
        };

        
        res.cookie('authToken', token, cookieOptions);

        
        res.status(200).json({ success: true, data: { id: user._id, studentId: user.studentId, name: user.name } });
    } catch (error) {
        console.error('Error linking Google account:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
}
