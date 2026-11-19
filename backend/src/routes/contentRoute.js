import express from "express";
import {
  search,
  getPost,
  getTreasures,
  getTreasurePosts,
  getTreasureCommunity,
  getCommunityContent,
  getStores,
  createStore,
} from "../controllers/contentController.js";
import { getComments } from "../controllers/engagementController.js";
import { requireAuth, optionalAuth } from "../middleware/requireAuth.js";

const router = express.Router();

// Browsing works for guests too
router.get("/search", optionalAuth, search);
router.get("/posts/:postId", optionalAuth, getPost);
router.get("/posts/:postId/comments", optionalAuth, getComments);
router.get("/treasures", optionalAuth, getTreasures);
router.get("/treasures/:treasureId/posts", optionalAuth, getTreasurePosts);
router.get("/treasures/:treasureId/community", optionalAuth, getTreasureCommunity);
router.get("/communities/:communityId/content", optionalAuth, getCommunityContent);
router.get("/stores", optionalAuth, getStores);

// Signed-in users only
router.post("/stores", requireAuth, createStore);

export default router;
