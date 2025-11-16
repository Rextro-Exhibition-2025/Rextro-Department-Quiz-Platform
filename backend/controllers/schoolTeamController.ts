import SchoolTeam from "../models/SchoolTeam.js"
import type { Request, Response } from "express";
import mongoose from "mongoose";

export const createSchoolTeam = async (req: Request, res: Response): Promise<void> => {
    try {
        const schoolTeam = await SchoolTeam.create(req.body);
        res.status(201).json({
            success: true,
            data: schoolTeam,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create school team",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getSchoolTeams = async (req: Request, res: Response): Promise<void> => {

  
    
    try {
        const schoolTeams = await SchoolTeam.find();
       
        
        res.status(200).json({
            success: true,
            count: schoolTeams.length,
            data: schoolTeams,
        });
    } catch (error) {
        console.log(error,"error fetching school teams");
        
        res.status(500).json({
            success: false,
            message: "Error fetching school teams",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getSchoolTeamById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid school team ID format",
            });
            return;
        }

        const schoolTeam = await SchoolTeam.findById(id);

        if (!schoolTeam) {
            res.status(404).json({
                success: false,
                message: "School team not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: schoolTeam,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching school team",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const updateSchoolTeam = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid school team ID format",
            });
            return;
        }

        const schoolTeam = await SchoolTeam.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!schoolTeam) {
            res.status(404).json({
                success: false,
                message: "School team not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: schoolTeam,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating school team",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const deleteSchoolTeam = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid school team ID format",
            });
            return;
        }

        const schoolTeam = await SchoolTeam.findByIdAndDelete(id);

        if (!schoolTeam) {
            res.status(404).json({
                success: false,
                message: "School team not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "School team deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting school team",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
