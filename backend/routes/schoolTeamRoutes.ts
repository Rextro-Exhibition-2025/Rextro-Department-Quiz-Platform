import express from "express";
import {
    createSchoolTeam,
    getSchoolTeams,
    getSchoolTeamById,
    updateSchoolTeam,
    deleteSchoolTeam,
} from "../controllers/schoolTeamController.js";

const router = express.Router();

// Register a new school team
router.post("/", createSchoolTeam);

// Get all school teams
router.get("/", getSchoolTeams);

// Get a single school team by ID
router.get("/:id", getSchoolTeamById);

// Update a school team by ID
router.put("/:id", updateSchoolTeam);

// Delete a school team by ID
router.delete("/:id", deleteSchoolTeam);

export default router;