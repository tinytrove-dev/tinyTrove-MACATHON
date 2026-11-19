import express from "express";
import { getFeed } from "../controllers/feedController.js";
import { optionalAuth } from "../middleware/requireAuth.js";

const router = express.Router();

// Guests get the popular feed; signed-in users get it personalised
router.get("/", optionalAuth, getFeed);

export default router;
