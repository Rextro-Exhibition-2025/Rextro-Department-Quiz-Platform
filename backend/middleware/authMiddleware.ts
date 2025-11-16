import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import SchoolTeam from '../models/SchoolTeam.js';

// Add user property to Express Request interface
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                teamName: string;
                schoolName: string;
                memberName: string;
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
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'your_secret_key'
            ) as {
                id: string;
                teamName: string;
                schoolName: string;
                memberName: string;
                iat?: number;
                exp?: number;
            };

            console.log("\nDecoded token:", decoded);

            // Find the team by ID
            const team = await SchoolTeam.findById(decoded.id);

            if (!team) {
                console.log("Team not found with ID:", decoded.id);
                res.status(401).json({
                    success: false,
                    message: 'Team not found'
                });
                return;
            }

            console.log("Team found:", team.teamName);

            // Find the member in the team
            const member = team.members.find(m => m.name === decoded.memberName);

            if (!member) {
                console.log("Member not found:", decoded.memberName);
                res.status(401).json({
                    success: false,
                    message: 'Member not found in team'
                });
                return;
            }

            // Check if member is logged in and has matching token
            if (!member.isLoggedIn || member.authToken !== token) {
                console.log("Member not logged in or token mismatch");
                console.log("Member isLoggedIn:", member.isLoggedIn);
                console.log("Stored token matches:", member.authToken === token);
                res.status(401).json({
                    success: false,
                    message: 'Not authorized - member not logged in or token mismatch'
                });
                return;
            }

            console.log("Member authenticated successfully:", member.name);

            // Add user info to request object
            req.user = {
                id: decoded.id,
                teamName: team.teamName,
                schoolName: team.schoolName,
                memberName: decoded.memberName,
                marks: member.marks || 0
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