import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const adminOnly = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {

        
        let token;


        
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }
        console.log(token);
        

        
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
            return;
        }
        
        const verifySecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your_secret_key';

        try {
            const decoded = jwt.verify(token, verifySecret) as { email?: string; name?: string; exp?: number };
            
            const adminEmailsRaw = process.env.ADMIN_EMAILS || '';
            const adminEmails = adminEmailsRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
            const emailLower = (decoded.email || '').toLowerCase();
            if (adminEmails.length > 0 && !adminEmails.includes(emailLower)) {
                res.status(403).json({ success: false, message: 'Forbidden: not an admin' });
                return;
            }

            (req as any).admin = {
                email: decoded.email,
                name: decoded.name,
            };
            next();
        } catch (err) {
            res.status(401).json({ success: false, message: 'Invalid or expired token' });
            return;
        }

    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
